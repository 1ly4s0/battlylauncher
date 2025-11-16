'use strict';

import { logger, database, changePanel } from '../utils.js';
import { Alert } from "../utils/alert.js";
import { AskModal } from '../utils/askModal.js';

let amigos = [];
let currentFilter = 'all';
let currentSort = 'status';
let currentView = 'grid';
let searchQuery = '';
let favoritesFriends = new Set();

const { Lang } = require("./assets/js/utils/lang.js");
const { StringLoader } = require("./assets/js/utils/stringLoader.js");
let lang;
new Lang().GetLang().then(lang_ => {
    lang = lang_;
}).catch(error => {
    console.error("Error:", error);
});

const baseAPIUrl = 'https://api.battlylauncher.com';
const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);

class Friends {
    static id = "friends";

    constructor() {
        this.friendsCache = new Map();
        this.contextMenuTarget = null;
        this.loadFavoritesFromStorage();
    }

    async init(config, news) {
        this.config = config;
        this.database = await new database().init();

        await window.ensureStringLoader();
        await window.stringLoader.applyStrings();

        this.initializeEventListeners();
        this.AddFriend();
        this.Solicitudes();
        this.LoadFriends();
        this.Chat();
        this.ObtenerAmigos();

        // Observar cuando el panel se activa
        this.setupPanelObserver();
    }

    setupPanelObserver() {
        const { getValue } = require('./assets/js/utils/storage');
        const panel = document.querySelector('.panel.friends');

        if (!panel) return;

        let wasActive = panel.classList.contains('active');

        const observer = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isActive = panel.classList.contains('active');

                    // Solo ejecutar si cambió de inactivo a activo
                    if (isActive && !wasActive) {
                        const tutorialCompleted = await getValue("friendsTutorialCompleted");
                        if (!tutorialCompleted) {
                            observer.disconnect();
                            setTimeout(() => {
                                this.startTutorial();
                            }, 800);
                        }
                    }

                    wasActive = isActive;
                }
            }
        });

        observer.observe(panel, { attributes: true });
    }

    async startTutorial() {
        const { getValue, setValue } = require('./assets/js/utils/storage');
        const Shepherd = require("./assets/js/utils/shepherd.cjs");
        const modal = new AskModal();

        const tour = new Shepherd.default.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                classes: "shadow-md bg-purple-dark",
                scrollTo: { behavior: "smooth", block: "center" },
            },
        });

        const getString = (key) => window.stringLoader?.getString(key) || key;

        tour.addStep({
            id: "friends-welcome",
            title: getString('tour.friends.welcome'),
            text: getString('tour.friends.welcomeText'),
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: getString('tour.friends.searchTitle'),
            text: getString('tour.friends.searchText'),
            attachTo: {
                element: "#friends-search-input",
                on: "bottom",
            },
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: getString('tour.friends.filtersTitle'),
            text: getString('tour.friends.filtersText'),
            attachTo: {
                element: ".filter-buttons",
                on: "bottom",
            },
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: getString('tour.friends.addFriendTitle'),
            text: getString('tour.friends.addFriendText'),
            attachTo: {
                element: "#add-friend-btn",
                on: "left",
            },
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: getString('tour.friends.viewModesTitle'),
            text: getString('tour.friends.viewModesText'),
            attachTo: {
                element: ".view-buttons",
                on: "bottom",
            },
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            id: "friends-finish",
            title: getString('tour.friends.finishTitle'),
            text: getString('tour.friends.finishText'),
            buttons: [
                {
                    text: getString('tour.finish'),
                    action: tour.complete,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        try {
            await modal.ask({
                title: "¿Quieres un tour por el sistema de amigos?",
                text: "Te guiaré a través de las características principales.",
                showCancelButton: true,
                confirmButtonText: "Sí, quiero el tour",
                cancelButtonText: "No, gracias",
                preConfirm: () => true
            });

            await tour.start();
            await setValue("friendsTutorialCompleted", true);

        } catch (err) {
            await setValue("friendsTutorialCompleted", true);
            if (err !== "cancelled") {
                console.error("Error al iniciar el tour de amigos:", err);
            }
        }
    }

    initializeEventListeners() {

        const searchInput = document.getElementById('friends-search-input');
        const searchClear = document.getElementById('friends-search-clear');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                searchClear.style.display = searchQuery ? 'block' : 'none';
                this.filterAndRenderFriends();
            });
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                searchClear.style.display = 'none';
                this.filterAndRenderFriends();
            });
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                this.filterAndRenderFriends();
            });
        });

        const sortSelect = document.getElementById('friends-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                this.filterAndRenderFriends();
            });
        }

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentView = btn.dataset.view;

                const friendsGrid = document.getElementById('lista-de-amigos');
                if (currentView === 'list') {
                    friendsGrid.classList.add('view-list');
                } else {
                    friendsGrid.classList.remove('view-list');
                }
            });
        });

        const addFriendsEmpty = document.getElementById('add-friends-empty');
        if (addFriendsEmpty) {
            addFriendsEmpty.addEventListener('click', () => {
                document.getElementById('add-friends').click();
            });
        }

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        const backBtn = document.getElementById('friends-volver-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                changePanel('home');
            });
        }

        const friendsBtn = document.getElementById('friends-btn');
        if (friendsBtn) {
            friendsBtn.addEventListener('click', () => {
                changePanel('friends');
            });
        }
    }

    loadFavoritesFromStorage() {
        try {
            const stored = localStorage.getItem('battly_favorite_friends');
            if (stored) {
                favoritesFriends = new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    saveFavoritesToStorage() {
        try {
            localStorage.setItem('battly_favorite_friends', JSON.stringify([...favoritesFriends]));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    toggleFavorite(username) {
        if (favoritesFriends.has(username)) {
            favoritesFriends.delete(username);
        } else {
            favoritesFriends.add(username);
        }
        this.saveFavoritesToStorage();
        this.filterAndRenderFriends();
    }

    isFavorite(username) {
        return favoritesFriends.has(username);
    }

    filterAndRenderFriends() {
        let filtered = [...amigos];

        if (searchQuery) {
            filtered = filtered.filter(f =>
                f.username.toLowerCase().includes(searchQuery)
            );
        }

        if (currentFilter !== 'all') {
            if (currentFilter === 'online') {
                filtered = filtered.filter(f => f.estado !== 'offline');
            } else if (currentFilter === 'offline') {
                filtered = filtered.filter(f => f.estado === 'offline');
            } else if (currentFilter === 'playing') {
                filtered = filtered.filter(f => f.estado !== 'offline' && f.details && f.details !== 'En el menú principal');
            } else if (currentFilter === 'favorites') {
                filtered = filtered.filter(f => this.isFavorite(f.username));
            }
        }

        filtered.sort((a, b) => {
            if (currentSort === 'status') {
                const statusOrder = { online: 0, ausente: 1, offline: 2 };
                const statusA = statusOrder[a.estado] ?? 2;
                const statusB = statusOrder[b.estado] ?? 2;
                if (statusA !== statusB) return statusA - statusB;
            } else if (currentSort === 'name') {
                return a.username.localeCompare(b.username, 'es', { sensitivity: 'base' });
            }
            return 0;
        });

        this.updateFilterCounts();

        this.renderFriendsList(filtered);
    }

    updateFilterCounts() {
        const counts = {
            all: amigos.length,
            online: amigos.filter(f => f.estado !== 'offline').length,
            playing: amigos.filter(f => f.estado !== 'offline' && f.details && f.details !== 'En el menú principal').length,
            offline: amigos.filter(f => f.estado === 'offline').length,
            favorites: amigos.filter(f => this.isFavorite(f.username)).length
        };

        Object.keys(counts).forEach(key => {
            const elem = document.getElementById(`count-${key}`);
            if (elem) elem.textContent = counts[key];
        });
    }

    renderFriendsList(friendsList) {
        const container = document.getElementById('lista-de-amigos');
        const loading = document.getElementById('friends-loading');
        const empty = document.getElementById('friends-empty');
        const noResults = document.getElementById('friends-no-results');

        if (!container) return;

        if (loading) loading.style.display = 'none';
        if (empty) empty.style.display = 'none';
        if (noResults) noResults.style.display = 'none';

        if (amigos.length === 0) {
            container.style.display = 'none';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (friendsList.length === 0) {
            container.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        container.innerHTML = '';

        friendsList.forEach((friend, index) => {
            const card = this.createFriendCard(friend, index);
            container.appendChild(card);
        });
    }

    createFriendCard(friend, index) {
        const { username, estado, details, profile } = friend;
        const isOffline = estado === 'offline';
        const isFav = this.isFavorite(username);
        const statusClass = isOffline ? 'offline' : (estado === 'online' ? 'online' : 'away');

        const card = document.createElement('div');
        card.className = 'friend-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.dataset.username = username;

        if (profile) {
            if (profile.borderColor && profile.borderStyle && profile.borderWidth) {
                card.style.border = `${profile.borderWidth}px ${profile.borderStyle} ${profile.borderColor}`;
            }
            if (profile.backgroundColor) {
                card.style.backgroundColor = profile.backgroundColor;
            }
            if (profile.backgroundImage) {
                card.style.backgroundImage = `url(https://api.battlylauncher.com${profile.backgroundImage})`;
                card.style.backgroundSize = 'cover';
                card.style.backgroundPosition = 'center';
            }
        }

        const gameIcon = this.getGameIcon(details);

        card.innerHTML = `
            ${isFav ? '<div class="friend-favorite-badge"><i class="fa-solid fa-star"></i></div>' : ''}
            <div class="friend-card-header">
                <div class="friend-avatar-container">
                    <div class="friend-avatar mc-face-viewer-8x" style="background-image: url('https://minotar.net/skin/MHF_Steve.png')"></div>
                    <div class="friend-status-indicator ${statusClass}"></div>
                </div>
                <div class="friend-info">
                    <h3 class="friend-name">
                        <span class="friend-name-text" ${profile?.nameColor ? `style="color: ${profile.nameColor}"` : ''}>${username}</span>
                    </h3>
                    <p class="friend-status-text">
                        ${gameIcon ? `<img src="${gameIcon}" class="friend-game-icon" />` : ''}
                        ${isOffline ? 'Offline' : (details || 'En el menú principal')}
                    </p>
                </div>
            </div>
            <div class="friend-card-actions">
                <button class="friend-action-btn" data-action="profile" title="Ver perfil">
                    <i class="fa-solid fa-user"></i>
                    <span>Perfil</span>
                </button>
                <button class="friend-action-btn" data-action="chat" title="Chat">
                    <i class="fa-solid fa-message"></i>
                    <span>Chat</span>
                </button>
                ${!isOffline && details && details !== 'En el menú principal' ? `
                <button class="friend-action-btn" data-action="join" title="Unirse">
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>Unirse</span>
                </button>
                ` : ''}
            </div>
        `;

        this.loadFriendSkin(username, card.querySelector('.friend-avatar'));

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.friend-action-btn')) {
                this.openFriendProfile(friend);
            }
        });

        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, friend);
        });

        card.querySelectorAll('.friend-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.handleFriendAction(action, friend);
            });
        });

        return card;
    }

    loadFriendSkin(username, avatarElement) {
        if (!avatarElement) return;

        const skinUrl = `https://api.battlylauncher.com/api/skin/${encodeURIComponent(username)}.png`;
        const img = new Image();

        img.onload = () => {
            avatarElement.style.backgroundImage = `url('${skinUrl}')`;
        };

        img.onerror = () => {

        };

        img.src = skinUrl;
    }

    getGameIcon(details) {
        if (!details) return null;

        const icons = {
            'Forge': './assets/images/icons/forge.png',
            'Fabric': './assets/images/icons/fabric.png',
            'Quilt': './assets/images/icons/quilt.png',
            'OptiFine': './assets/images/icons/optifine.png',
            'Vanilla': './assets/images/icons/minecraft.png',
            'LabyMod': 'https://battlylauncher.com/assets/img/labymod.png',
            'CMPack': './assets/images/icons/cmpack.png',
            'Ares': './assets/images/icons/ares.png',
            'BatMod': './assets/images/icons/batmod.png',
            'Battly': './assets/images/icons/icon.png'
        };

        for (const [key, icon] of Object.entries(icons)) {
            if (details.includes(key)) return icon;
        }

        return './assets/images/icons/minecraft.png';
    }

    async Solicitudes() {
        ipcRenderer.on("cargarSolicitudAmistad", async (event, args) => {
            changePanel("friends");
        });
    }

    handleFriendAction(action, friend) {
        switch (action) {
            case 'profile':
                this.openFriendProfile(friend);
                break;
            case 'chat':
                changePanel('chat');
                break;
            case 'join':
                this.joinFriendGame(friend);
                break;
        }
    }

    async openFriendProfile(friend) {
        try {
            const response = await fetch(`https://battlylauncher.com/api/users/about/get/${friend.username}`);
            const data = await response.json();
            this.showProfileModal(data);
        } catch (error) {
            console.error('Error loading profile:', error);
            new Alert().ShowAlert({
                icon: 'error',
                title: await window.getString("friends.errorLoadingProfile") || 'Error al cargar el perfil'
            });
        }
    }

    showProfileModal(data) {
        const uuid = data.data.uuid || "Desconocido";
        const username = data.data.username || "Desconocido";
        const bio = data.data.bio || "Este usuario no ha establecido una biografía.";
        const userBadge = data.data.verification || "no";
        const creationDate = new Date(data.data.creationDate);
        const creationTimeString = creationDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

        const existingModal = document.getElementById('profile-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.className = 'modal is-active';
        modal.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-card" style="background:#0f1623;max-width:750px;width:95%;overflow: visible !important;">
                <header class="modal-card-head" style="background:#0f1623;">
                    <p class="modal-card-title" style="color:#fff;font-weight:700;">Perfil</p>
                    <button class="delete" aria-label="close"></button>
                </header>
                <section class="modal-card-body" style="background:#0f1623; padding: 0px;">
                    <div class="main-user-profile">
                        <div class="main-user-profile-left">
                            <canvas id="skin_container" data-engine="three.js r156" width="276" height="331"
                                style="touch-action: none; width: 250px; height: 300px;"></canvas>
                        </div>
                        <div class="main-user-profile-right">
                            <h1>${username}</h1>
                            <h2>${bio}</h2>
                        </div>
                    </div>
                    <div class="main-user-secondary-profile">
                        <div class="main-user-secondary-profile-comments-panel-invisible">
                            <div>
                                <h1 class="user-secondary-info-title">UUID del usuario</h1>
                                <h2 class="user-secondary-info-desc">${uuid}</h2>
                                <br>
                                <h1 class="user-secondary-info-title">Fecha de creación de la cuenta</h1>
                                <h2 class="user-secondary-info-desc">${creationDate.toLocaleDateString("es-ES")} a las ${creationTimeString}</h2>
                            </div>
                        </div>
                    </div>
                </section>
            </div>`;

        document.body.appendChild(modal);

        const skinContainer = document.getElementById("skin_container");
        const mainUserProfile = document.querySelector(".main-user-profile");

        if (typeof skinview3d !== 'undefined') {
            const skinViewer = new skinview3d.SkinViewer({
                canvas: skinContainer,
                width: 250,
                height: 500,
                skin: `https://api.battlylauncher.com/api/skin/${encodeURIComponent(username)}.png`,
                animation: new skinview3d.WalkingAnimation()
            });

            skinViewer.playerObject.rotateY(0.3);
            skinViewer.zoom = 0.8;

            skinContainer.addEventListener("mouseover", () => {
                skinViewer.animation = new skinview3d.WaveAnimation;
            });

            skinContainer.addEventListener("mouseout", () => {
                skinViewer.animation = new skinview3d.WalkingAnimation;
            });

            let opened = false;
            skinContainer.addEventListener("click", () => {
                mainUserProfile.style.height = opened ? "300px" : "400px";
                opened = !opened;
            });
        }

        const userTitle = document.querySelector(".main-user-profile-right h1");
        if (userTitle && userBadge !== "no") {
            const badges = {
                verified: {
                    img: 'https://battlylauncher.com/assets/img/verified.webp',
                    icon: 'fa-circle-check',
                    title: 'Cuenta verificada',
                    desc: 'Esta cuenta está verificada por el team de Battly'
                },
                certified: {
                    img: 'https://battlylauncher.com/assets/img/certified.webp',
                    icon: 'fa-certificate',
                    title: 'Cuenta certificada',
                    desc: 'Esta cuenta está certificada por el team de Battly'
                },
                youtuber: {
                    img: 'https://battlylauncher.com/assets/img/youtuber.webp',
                    icon: 'fa-youtube',
                    iconClass: 'fa-brands',
                    title: 'Youtuber',
                    desc: 'Esta cuenta pertenece a un creador de contenido'
                }
            };

            if (badges[userBadge]) {
                const badge = badges[userBadge];
                userTitle.innerHTML += `
                    <div class="badge" style="background-image: url('${badge.img}');">
                        <span class="button-span">
                            <h1><i class="${badge.iconClass || 'fa-regular'} ${badge.icon}"></i>${badge.title}</h1>
                            <h2>${badge.desc}</h2>
                        </span>
                    </div>`;
            }
        }

        const close = () => modal.remove();
        modal.querySelector('.modal-background').addEventListener('click', close);
        modal.querySelector('.delete').addEventListener('click', close);
        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('is-active') && e.key === 'Escape') close();
        }, { once: true });
    }

    joinFriendGame(friend) {

        new Alert().ShowAlert({
            icon: 'info',
            title: `Intentando unirse al juego de ${friend.username}...`
        });
    }

    showContextMenu(event, friend) {
        const menu = document.getElementById('friend-context-menu');
        if (!menu) return;

        this.contextMenuTarget = friend;

        menu.style.display = 'block';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;

        const favoriteItem = menu.querySelector('[data-action="favorite"]');
        if (favoriteItem) {
            const isFav = this.isFavorite(friend.username);
            favoriteItem.innerHTML = `
                <i class="fa-solid fa-star"></i>
                <span>${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}</span>
            `;
        }

        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }

        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                this.handleContextMenuAction(item.dataset.action);
            };
        });
    }

    hideContextMenu() {
        const menu = document.getElementById('friend-context-menu');
        if (menu) menu.style.display = 'none';
        this.contextMenuTarget = null;
    }

    async handleContextMenuAction(action) {
        const friend = this.contextMenuTarget;
        if (!friend) return;

        this.hideContextMenu();

        switch (action) {
            case 'profile':
                this.openFriendProfile(friend);
                break;
            case 'chat':
                changePanel('chat');
                break;
            case 'join':
                this.joinFriendGame(friend);
                break;
            case 'favorite':
                this.toggleFavorite(friend.username);
                break;
            case 'note':
                this.addNoteToFriend(friend);
                break;
            case 'remove':
                this.removeFriend(friend);
                break;
            case 'block':
                this.blockFriend(friend);
                break;
        }
    }

    async addNoteToFriend(friend) {

        new Alert().ShowAlert({
            icon: 'info',
            title: 'Función en desarrollo',
            text: 'El sistema de notas estará disponible próximamente'
        });
    }

    async removeFriend(friend) {
        const account = await this.database?.getSelectedAccount();
        if (!account?.token) return;

        const confirm = await new Alert().ShowAlert({
            icon: 'warning',
            title: '¿Eliminar amigo?',
            text: `¿Estás seguro de que quieres eliminar a ${friend.username} de tu lista de amigos?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        try {
            const response = await fetch(`${baseAPIUrl}/api/v2/users/eliminarAmigo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${account.token}`
                },
                body: JSON.stringify({ amigo: friend.username })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.message);

            new Alert().ShowAlert({
                icon: 'success',
                title: 'Amigo eliminado',
                text: `Has eliminado a ${friend.username} de tu lista de amigos`
            });

            this.ObtenerAmigos();
        } catch (error) {
            new Alert().ShowAlert({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar al amigo'
            });
        }
    }

    async blockFriend(friend) {

        new Alert().ShowAlert({
            icon: 'info',
            title: 'Función en desarrollo',
            text: 'El sistema de bloqueo estará disponible próximamente'
        });
    }

    async LoadFriends() {
        const friendsList = document.querySelector(".home-online-friends");
        friendsList.innerHTML = "";

        const account = await this.database?.getSelectedAccount();
        if (account.type !== "battly") {
            this._renderFriendsError(friendsList, lang["feature_not_available_for_microsoft_accounts"]);
            return;
        }

        if (!account?.token) {
            this._renderFriendsError(friendsList, lang["error_loading_friends"]);
            return;
        }

        let data;
        try {
            const res = await fetch(`${baseAPIUrl}/api/v2/users/obtenerAmigos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${account.token}`
                }
            });
            data = await res.json();
        } catch {
            this._renderFriendsError(friendsList, lang["error_loading_friends"]);
            return;
        }

        if (data.error) {
            this._renderFriendsError(friendsList, lang["error_loading_friends"]);
            return;
        }

        const onlineFriends = (data.amigos || []).filter(f => f.estado !== "offline");
        if (onlineFriends.length === 0) {
            this._renderFriendsError(friendsList, lang["no_friends_online"]);
            return;
        }

        const fragment = document.createDocumentFragment();
        for (const friend of onlineFriends) {
            const friendDiv = document.createElement("div");
            friendDiv.className = "online-friend";
            friendDiv.innerHTML = `
            <div class="mc-face-viewer-6x online-friend-avatar"
                 style="background-image:url('https://api.battlylauncher.com/api/skin/${friend.username}')"></div>
            <div class="online-friend-data">
              <p class="online-friend-name">${friend.username}</p>
              <p class="online-friend-status">${friend.details}</p>
            </div>`;
            fragment.appendChild(friendDiv);

            friendDiv.addEventListener("click", async () => {
                async function ensureProfileModal(friend) {
                    console.log(friend.data)
                    if (!friend) return null;
                    const uuid = friend.data.uuid || await window.getString("friends.unknown");
                    const username = friend.data.username || await window.getString("friends.unknown");
                    const bio = friend.data.bio || "Este usuario no ha establecido una biografía.";
                    const userBadge = friend.data.verification || "no";
                    const creationDate = new Date(friend.data.creationDate);
                    const creationTimeString = creationDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                    let modal = document.getElementById('profile-modal');
                    if (modal) return modal;

                    modal = document.createElement('div');
                    modal.id = 'profile-modal';
                    modal.className = 'modal is-active';
                    modal.dataset.uuid = uuid;
                    modal.dataset.username = username;
                    modal.dataset.bio = bio || "Este usuario no ha establecido una biografía.";
                    modal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card" style="background:#0f1623;max-width:720px;width:95%;">
        <header class="modal-card-head" style="background:#0f1623;">
          <p class="modal-card-title" style="color:#fff;font-weight:700;">Perfil</p>
          <button class="delete" aria-label="close"></button>
        </header>
        <section class="modal-card-body" style="background:#0f1623; padding: 0px;">
          <div class="main-user-profile">
            <div class="main-user-profile-left">
              <canvas id="skin_container" data-engine="three.js r156" width="276" height="331"
                style="touch-action: none; width: 250px; height: 300px;"></canvas>
            </div>
            <div class="main-user-profile-right">
              <h1>${modal.dataset.username}</h1>
              <h2>${modal.dataset.bio}</h2>
            </div>
          </div>
          <div class="main-user-secondary-profile">
            <div class="main-user-secondary-profile-comments-panel-invisible">
              <div>
                <h1 class="user-secondary-info-title">UUID del usuario</h1>
                <h2 class="user-secondary-info-desc">${modal.dataset.uuid}</h2>
                <br>
                <h1 class="user-secondary-info-title">Fecha de creación de la cuenta</h1>
                <h2 class="user-secondary-info-desc">${creationDate.toLocaleDateString("es-ES")} a las ${creationTimeString}</h2>
              </div>
            </div>
          </div>
        </section>
      </div>`;
                    document.body.appendChild(modal);

                    let skin_container = document.getElementById("skin_container");
                    let mainUserProfile = document.querySelector(".main-user-profile");
                    let skinViewer = new skinview3d.SkinViewer({
                        canvas: skin_container,
                        width: 250,
                        height: 500,
                        skin: `https://api.battlylauncher.com/api/skin/${encodeURIComponent(modal.dataset.username)}.png`,
                        animation: new skinview3d.WalkingAnimation()
                    });

                    skinViewer.playerObject.rotateY(0.3);
                    skinViewer.zoom = 0.8;

                    skin_container.addEventListener("mouseover", () => {
                        skinViewer.animation = new skinview3d.WaveAnimation;
                        skinViewer.playerObject.rotateY(0.3);
                    });
                    skin_container.addEventListener("mouseout", () => {
                        skinViewer.animation = new skinview3d.WalkingAnimation;
                        skinViewer.playerObject.rotateY(0.3);
                    });

                    let opened = false;
                    skin_container.addEventListener("click", () => {
                        mainUserProfile.style.height = opened ? "300px" : "400px";
                        opened = !opened;
                    });

                    const userTitle = document.querySelector(".main-user-profile-right h1");
                    if (userBadge) {
                        if (userBadge === "verified") {
                            userTitle.innerHTML += `<div class="badge" style="background-image: url('https://battlylauncher.com/assets/img/verified.webp');">
          <span class="button-span">
            <h1><i class="fa-regular fa-circle-check"></i>Cuenta verificada</h1>
            <h2>Esta cuenta está verificada por el team de Battly</h2>
          </span>
        </div>`;
                        } else if (userBadge === "certified") {
                            userTitle.innerHTML += `<div class="badge" style="background-image: url('https://battlylauncher.com/assets/img/certified.webp');">
            <span class="button-span">
                <h1><i class="fa-solid fa-certificate"></i>Cuenta certificada</h1>
                <h2>Esta cuenta está certificada por el team de Battly</h2>
            </span>
        </div>`;
                        } else if (userBadge === "youtuber") {
                            userTitle.innerHTML += `<div class="badge" style="background-image: url('https://battlylauncher.com/assets/img/youtuber.webp');">
            <span class="button-span">
                <h1><i class="fa-brands fa-youtube"></i>Youtuber</h1>
                <h2>Esta cuenta pertenece a un creador de contenido</h2>
            </span>
        </div>`;
                        }
                    }

                    const close = () => modal.remove();
                    modal.querySelector('.modal-background').addEventListener('click', close);
                    modal.querySelector('.delete').addEventListener('click', close);
                    document.addEventListener('keydown', (e) => {
                        if (!modal.classList.contains('is-active')) return;
                        if (e.key === 'Escape') close();
                    });

                    return modal;
                }

                fetch(`https://battlylauncher.com/api/users/about/get/${friend.username}`)
                    .then(response => response.json())
                    .then(async (data) => {
                        await ensureProfileModal(data);
                    });
            });
        }
        friendsList.appendChild(fragment);
    }

    _renderFriendsError(listElem, message) {
        const err = document.createElement("div");
        err.className = "online-friend";
        err.innerHTML = `
          <div class="online-friend-data">
            <p class="online-friend-status">${message}</p>
          </div>`;
        listElem.appendChild(err);
    }

    async Chat() {
        const chatBtn = document.getElementById("chat-btn");
        if (chatBtn) {
            chatBtn.addEventListener("click", () => {
                changePanel("chat");
            });
        }

        const backChatBtn = document.getElementById("back-chat-btn");
        if (backChatBtn) {
            backChatBtn.addEventListener("click", () => {
                changePanel("friends");
            });
        }
    }

    async AddFriend() {
        const btnAddFriends = document.getElementById("add-friends");
        const account = await this.database?.getSelectedAccount();
        if (!account?.token) return;

        btnAddFriends.addEventListener("click", async () => {
            // Load all needed translations in parallel
            const [
                addFriendTitle,
                addFriendDesc,
                usernamePlaceholder,
                emptySearchText,
                cancelText,
                searchText
            ] = await Promise.all([
                window.stringLoader.getString("friends.addFriend"),
                window.stringLoader.getString("friends.addFriendDesc"),
                window.stringLoader.getString("friends.usernamePlaceholder"),
                window.stringLoader.getString("friends.emptySearchText"),
                window.stringLoader.getString("common.cancel"),
                window.stringLoader.getString("common.search")
            ]);

            const modal = document.createElement("div");
            modal.className = "modal is-active";
            modal.innerHTML = `
                        <div class="modal-background"></div>
                        <div class="modal-card modal-animated" style="max-width: 600px;">
                            <header class="modal-card-head" style="background: linear-gradient(135deg, #141e30 0%, #1a2332 100%); border-bottom: 2px solid rgba(62, 142, 208, 0.3); position: relative;">
                                <div style="flex: 1; padding-right: 3rem;">
                                        <p class="modal-card-title" style="color:#fff; font-size: 1.5rem; margin-bottom: 0.5rem;">
                                                <i class="fa-solid fa-user-plus" style="margin-right: 0.5rem;"></i>
                                                ${addFriendTitle || 'Add Friend'}
                                        </p>
                                        <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem; margin: 0;">${addFriendDesc || 'Search users and send friend requests'}</p>
                                </div>
                                <button class="delete" aria-label="close"></button>
                            </header>
                            <section class="modal-card-body" style="background: #0f1623; padding: 2rem;">
                                <div class="control">
                                    <span class="icon is-left">
                                        <i class="fa-solid fa-search"></i>
                                    </span>
                                    <input class="input" type="text" placeholder="${usernamePlaceholder || 'User name'}" 
                                                 style="font-size: 1rem; border-radius: 10px; border: 2px solid rgba(62, 142, 208, 0.3); background: #141e30; color: white;">
                                </div>
                                <div class="users-result" style="margin-top: 1.5rem; max-height: 400px; overflow-y: auto;"></div>
                                <div class="empty-search-state" style="text-align: center; padding: 3rem 1rem; display: block;">
                                        <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
                                        <p style="color: rgba(255,255,255,0.6); font-size: 1rem;">${emptySearchText || 'Type a user name to search'}</p>
                                </div>
                            </section>
                            <footer class="modal-card-foot" style="background: #0f1623; border-top: 1px solid rgba(255,255,255,0.1); justify-content: flex-end; gap: 0.75rem;">
                                <button class="button" style="background: #141e30; color: white; border: 1px solid rgba(255,255,255,0.1);" data-action="cancel">${cancelText || 'Cancel'}</button>
                                <button class="button is-info search-btn" style="background: linear-gradient(135deg, #3e8ed0, #5fa3e0); border: none;">
                                        <i class="fa-solid fa-search" style="margin-right: 0.5rem;"></i>
                                        ${searchText || 'Search'}
                                </button>
                            </footer>
                        </div>`;
            document.body.appendChild(modal);

            const closeBtn = modal.querySelector(".delete");
            const cancelBtn = modal.querySelector('[data-action="cancel"]');
            const input = modal.querySelector("input");
            const usersBox = modal.querySelector(".users-result");
            const searchBtn = modal.querySelector(".search-btn");
            const emptyState = modal.querySelector(".empty-search-state");

            const closeModal = () => modal.remove();
            closeBtn.addEventListener("click", closeModal);
            cancelBtn.addEventListener("click", closeModal);
            modal.querySelector(".modal-background").addEventListener("click", closeModal);

            let searchTimeout;
            input.addEventListener("input", () => {
                clearTimeout(searchTimeout);
                const query = input.value.trim();

                if (!query) {
                    usersBox.innerHTML = "";
                    emptyState.style.display = "block";
                    return;
                }

                searchTimeout = setTimeout(() => performSearch(query), 500);
            });

            searchBtn.addEventListener("click", () => {
                const query = input.value.trim();
                if (query) performSearch(query);
            });

            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    const query = input.value.trim();
                    if (query) performSearch(query);
                }
            });

            const performSearch = async (query) => {
                searchBtn.classList.add("is-loading");
                input.disabled = true;
                usersBox.innerHTML = '<div style="text-align: center; padding: 2rem;"><span class="icon" style="font-size: 2rem; color: #3e8ed0;"><i class="fa-solid fa-spinner fa-spin"></i></span></div>';
                emptyState.style.display = "none";

                try {
                    const res = await fetch(`${baseAPIUrl}/api/v2/users/buscarUsuarios`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${account.token}` },
                        body: JSON.stringify({ username: query })
                    });
                    const data = await res.json();

                    if (data.error) throw new Error(data.error);

                    usersBox.innerHTML = "";

                    if (data.usuarios.length === 0) {
                        const notFoundText = await window.stringLoader.getString("friends.noUsersFound");
                        usersBox.innerHTML = `
                            <div style="text-align: center; padding: 2rem;">
                                <i class="fa-solid fa-user-slash" style="font-size: 2.5rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
                                <p style="color: rgba(255,255,255,0.6);">${notFoundText || 'No users found'}</p>
                            </div>`;
                        return;
                    }

                    for (const user of data.usuarios) {
                        const box = createUserBox(user);
                        usersBox.appendChild(box);
                    }
                } catch (error) {
                    console.error(error);
                    const errorText = await window.stringLoader.getString("friends.errorSearchingUsers");
                    usersBox.innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <i class="fa-solid fa-exclamation-triangle" style="font-size: 2.5rem; color: #f14668; margin-bottom: 1rem;"></i>
                            <p style="color: rgba(255,255,255,0.6);">${errorText || 'Error searching users'}</p>
                        </div>`;
                } finally {
                    searchBtn.classList.remove("is-loading");
                    input.disabled = false;
                }
            };

            const createUserBox = (username) => {
                const box = document.createElement("div");
                box.className = "box";
                box.style.cssText = "padding: 1rem; margin-bottom: 0.75rem; background: linear-gradient(135deg, #141e30, #1a2332); border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; transition: all 0.3s ease;";
                (async () => {
                    const addText = await window.stringLoader.getString("friends.add");
                    box.innerHTML = `
                                            <article class="media" style="align-items: center;">
                                                <div class="media-left">
                                                    <figure class="image is-48x48">
                                                        <div class="mc-face-viewer-6x" style="background-image:url('https://api.battlylauncher.com/api/skin/${username}.png'); width: 48px; height: 48px; border-radius: 8px;"></div>
                                                    </figure>
                                                </div>
                                                <div class="media-content">
                                                    <div class="content">
                                                        <p style="font-size: 1.1rem; font-weight: 600; color: white; margin: 0;">${username}</p>
                                                    </div>
                                                </div>
                                                <div class="media-right">
                                                    <button class="button is-info add-friend-btn" style="background: linear-gradient(135deg, #3e8ed0, #5fa3e0); border: none; border-radius: 8px; padding: 0.5rem 1rem;">
                                                        <span class="icon"><i class="fa-solid fa-user-plus"></i></span>
                                                        <span>${addText || 'Add'}</span>
                                                    </button>
                                                </div>
                                            </article>`;

                    box.addEventListener("mouseenter", () => {
                        box.style.borderColor = "rgba(62, 142, 208, 0.5)";
                        box.style.transform = "translateY(-2px)";
                    });

                    box.addEventListener("mouseleave", () => {
                        box.style.borderColor = "rgba(255,255,255,0.1)";
                        box.style.transform = "translateY(0)";
                    });

                    box.querySelector(".add-friend-btn").addEventListener("click", async () => await tryAddFriend(username, box));
                })();
                return box;
            };

            const tryAddFriend = async (username, boxElement) => {
                const friendNames = (window.amigos || []).map(a => a.username);
                const btn = boxElement.querySelector(".add-friend-btn");

                if (username === account.name) {
                    const msg = await window.stringLoader.getString("friends.youCannotAddYourself");
                    new Alert().ShowAlert({ icon: "error", title: msg || "You cannot add yourself" });
                    return;
                }

                if (friendNames.includes(username)) {
                    const msg = await window.stringLoader.getString("friends.youAlreadyHaveThisFriend");
                    new Alert().ShowAlert({ icon: "error", title: msg || "You already have this user as a friend" });
                    return;
                }

                btn.classList.add("is-loading");
                btn.disabled = true;

                try {
                    const response = await fetch(`${baseAPIUrl}/api/v2/users/enviarSolicitud`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${account.token}` },
                        body: JSON.stringify({ amigo: username })
                    });

                    const result = await response.json();

                    if (result.status === 200) {
                        const sentTitle = await window.stringLoader.getString("friends.requestSentTitle", { username }) || `Request sent to ${username}`;
                        const sentText = await window.stringLoader.getString("friends.requestSentText") || "The user will receive your friend request";
                        new Alert().ShowAlert({
                            icon: "success",
                            title: sentTitle,
                            text: sentText
                        });

                        btn.innerHTML = `<span class="icon"><i class="fa-solid fa-check"></i></span><span>${await window.stringLoader.getString("friends.sent") || 'Sent'}</span>`;
                        btn.style.background = "#48c774";
                        btn.disabled = true;
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    const errorTitle = await window.stringLoader.getString("friends.errorSendingRequest") || "Error sending request";
                    const unknownError = await window.stringLoader.getString("friends.unknownError") || "Unknown error";
                    new Alert().ShowAlert({
                        icon: "error",
                        title: errorTitle,
                        text: error.message || unknownError
                    });
                    btn.classList.remove("is-loading");
                    btn.disabled = false;
                }
            };
        });
    }

    async Solicitudes() {
        const btnSolicitudes = document.getElementById("solicitudes");
        const account = await this.database?.getSelectedAccount();
        if (!account?.token) return;

        btnSolicitudes.addEventListener("click", async () => {
            const modal = document.createElement("div");
            modal.className = "modal is-active";
            modal.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-card modal-animated" style="max-width: 700px;">
              <header class="modal-card-head" style="background: linear-gradient(135deg, #141e30 0%, #1a2332 100%); border-bottom: 2px solid rgba(62, 142, 208, 0.3);">
                <div>
                    <p class="modal-card-title" style="color:#fff; font-size: 1.5rem; margin-bottom: 0.5rem;">
                        <i class="fa-solid fa-bell" style="margin-right: 0.5rem;"></i>
                        ${lang.friend_requests || 'Solicitudes de amistad'}
                    </p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem; margin: 0;">Gestiona tus solicitudes pendientes</p>
                </div>
                <button class="delete" aria-label="close"></button>
              </header>
              <section class="modal-card-body requests-body" style="background: #0f1623; padding: 0; max-height: 500px; overflow-y: auto;">
                <div style="text-align: center; padding: 3rem;">
                    <span class="icon" style="font-size: 3rem; color: #3e8ed0;">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                    </span>
                    <p style="color: rgba(255,255,255,0.6); margin-top: 1rem;">Cargando solicitudes...</p>
                </div>
              </section>
            </div>`;
            document.body.appendChild(modal);

            const closeBtn = modal.querySelector(".delete");
            const bodyBox = modal.querySelector(".requests-body");

            closeBtn.onclick = () => modal.remove();
            modal.querySelector(".modal-background").addEventListener("click", () => modal.remove());

            try {
                const req = await fetch(`${baseAPIUrl}/api/v2/users/obtenerSolicitudes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${account.token}` }
                });

                const data = await req.json();

                if (data.error) throw new Error(data.error);

                const recibidas = data.recibidas || [];
                const enviadas = data.enviadas || [];

                const requestsBadge = document.getElementById('requests-badge');
                if (requestsBadge) {
                    if (recibidas.length > 0) {
                        requestsBadge.textContent = recibidas.length;
                        requestsBadge.style.display = 'block';
                    } else {
                        requestsBadge.style.display = 'none';
                    }
                }

                if (recibidas.length === 0 && enviadas.length === 0) {
                    bodyBox.innerHTML = `
                        <div style="text-align: center; padding: 4rem 2rem;">
                            <i class="fa-solid fa-inbox" style="font-size: 4rem; color: rgba(255,255,255,0.3); margin-bottom: 1.5rem;"></i>
                            <h3 style="color: white; font-size: 1.3rem; margin-bottom: 0.5rem;">No tienes solicitudes</h3>
                            <p style="color: rgba(255,255,255,0.6);">Cuando recibas o envíes solicitudes de amistad, aparecerán aquí</p>
                        </div>`;
                    return;
                }

                bodyBox.innerHTML = '';

                if (recibidas.length > 0) {
                    const receivedSection = document.createElement('div');
                    receivedSection.style.cssText = 'padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);';
                    receivedSection.innerHTML = `
                        <h3 style="color: white; font-size: 1.1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-arrow-down"></i>
                            Recibidas (${recibidas.length})
                        </h3>
                    `;

                    for (const user of recibidas) {
                        const box = await createRequestBox(user, 'received', account);
                        receivedSection.appendChild(box);
                    }

                    bodyBox.appendChild(receivedSection);
                }

                if (enviadas.length > 0) {
                    const sentSection = document.createElement('div');
                    sentSection.style.cssText = 'padding: 1.5rem;';
                    sentSection.innerHTML = `
                        <h3 style="color: white; font-size: 1.1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-arrow-up"></i>
                            Enviadas (${enviadas.length})
                        </h3>
                    `;

                    for (const user of enviadas) {
                        const box = await createRequestBox(user, 'sent', account);
                        sentSection.appendChild(box);
                    }

                    bodyBox.appendChild(sentSection);
                }

            } catch (error) {
                console.error('Error loading requests:', error);
                bodyBox.innerHTML = `
                    <div style="text-align: center; padding: 3rem 2rem;">
                        <i class="fa-solid fa-exclamation-triangle" style="font-size: 3rem; color: #f14668; margin-bottom: 1rem;"></i>
                        <p style="color: rgba(255,255,255,0.7);">Error al cargar las solicitudes</p>
                    </div>`;
            }

            async function createRequestBox(username, type, account) {
                const box = document.createElement('div');
                box.className = 'request-box';
                box.style.cssText = `
                    background: linear-gradient(135deg, #141e30, #1a2332);
                    border: 2px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                    transition: all 0.3s ease;
                `;

                const skinUrl = `https://api.battlylauncher.com/api/skin/${username}.png`;

                if (type === 'received') {
                    box.innerHTML = `
                        <article class="media" style="align-items: center;">
                            <div class="media-left">
                                <figure class="image is-48x48">
                                    <div class="mc-face-viewer-6x" style="background-image:url('${skinUrl}'); width: 48px; height: 48px; border-radius: 8px;"></div>
                                </figure>
                            </div>
                            <div class="media-content">
                                <div class="content">
                                    <p style="font-size: 1.1rem; font-weight: 600; color: white; margin: 0;">${username}</p>
                                    <p style="font-size: 0.85rem; color: rgba(255,255,255,0.6); margin: 0.25rem 0 0 0;">Quiere ser tu amigo</p>
                                </div>
                            </div>
                            <div class="media-right" style="display: flex; gap: 0.5rem;">
                                <button class="button is-success accept-btn" style="border-radius: 8px; padding: 0.5rem 1rem;">
                                    <span class="icon"><i class="fa-solid fa-check"></i></span>
                                    <span>Aceptar</span>
                                </button>
                                <button class="button is-danger reject-btn" style="border-radius: 8px; padding: 0.5rem 1rem;">
                                    <span class="icon"><i class="fa-solid fa-times"></i></span>
                                    <span>Rechazar</span>
                                </button>
                            </div>
                        </article>
                    `;

                    box.querySelector('.accept-btn').addEventListener('click', async function () {
                        this.classList.add('is-loading');
                        try {
                            const response = await fetch(`${baseAPIUrl}/api/v2/users/aceptarSolicitud`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${account.token}` },
                                body: JSON.stringify({ solicitud: username })
                            });
                            const result = await response.json();

                            if (!result.error) {
                                new Alert().ShowAlert({ icon: 'success', title: `${await window.stringLoader.getString("friends.nowFriendsWith", { username })}` });
                                box.remove();
                                modal.remove();
                            } else {
                                throw new Error(result.message);
                            }
                        } catch (error) {
                            new Alert().ShowAlert({ icon: 'error', title: await window.stringLoader.getString("friends.errorAcceptingRequest") });
                            this.classList.remove('is-loading');
                        }
                    });

                    box.querySelector('.reject-btn').addEventListener('click', async function () {
                        this.classList.add('is-loading');
                        try {
                            const response = await fetch(`${baseAPIUrl}/api/v2/users/rechazarSolicitud`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${account.token}` },
                                body: JSON.stringify({ amigo: username })
                            });
                            const result = await response.json();

                            if (!result.error) {
                                new Alert().ShowAlert({ icon: 'success', title: await window.stringLoader.getString("friends.requestRejected") });
                                box.remove();
                            } else {
                                throw new Error(result.message);
                            }
                        } catch (error) {
                            new Alert().ShowAlert({ icon: 'error', title: await window.stringLoader.getString("friends.errorRejectingRequest") });
                            this.classList.remove('is-loading');
                        }
                    });

                } else {

                    box.innerHTML = `
                        <article class="media" style="align-items: center;">
                            <div class="media-left">
                                <figure class="image is-48x48">
                                    <div class="mc-face-viewer-6x" style="background-image:url('${skinUrl}'); width: 48px; height: 48px; border-radius: 8px;"></div>
                                </figure>
                            </div>
                            <div class="media-content">
                                <div class="content">
                                    <p style="font-size: 1.1rem; font-weight: 600; color: white; margin: 0;">${username}</p>
                                    <p style="font-size: 0.85rem; color: rgba(255,255,255,0.6); margin: 0.25rem 0 0 0;">
                                        <i class="fa-solid fa-clock" style="margin-right: 0.25rem;"></i>
                                        Pendiente de respuesta
                                    </p>
                                </div>
                            </div>
                            <div class="media-right">
                                <button class="button is-danger cancel-btn" style="border-radius: 8px; padding: 0.5rem 1rem;">
                                    <span class="icon"><i class="fa-solid fa-ban"></i></span>
                                    <span>Cancelar</span>
                                </button>
                            </div>
                        </article>
                    `;

                    box.querySelector('.cancel-btn').addEventListener('click', async function () {
                        this.classList.add('is-loading');
                        try {
                            const response = await fetch(`${baseAPIUrl}/api/v2/users/cancelarSolicitud`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${account.token}` },
                                body: JSON.stringify({ amigo: username })
                            });
                            const result = await response.json();

                            if (!result.error) {
                                new Alert().ShowAlert({ icon: 'success', title: await window.stringLoader.getString("friends.requestCancelled") });
                                box.remove();
                            } else {
                                throw new Error(result.message);
                            }
                        } catch (error) {
                            new Alert().ShowAlert({ icon: 'error', title: await window.stringLoader.getString("friends.errorCancellingRequest") });
                            this.classList.remove('is-loading');
                        }
                    });
                }

                box.addEventListener('mouseenter', () => {
                    box.style.borderColor = 'rgba(62, 142, 208, 0.5)';
                    box.style.transform = 'translateY(-2px)';
                });

                box.addEventListener('mouseleave', () => {
                    box.style.borderColor = 'rgba(255,255,255,0.1)';
                    box.style.transform = 'translateY(0)';
                });

                return box;
            }
        });
    }

    async ObtenerAmigos() {
        const account = await this.database?.getSelectedAccount();
        if (!account?.token) return;

        const loading = document.getElementById('friends-loading');
        const container = document.getElementById('lista-de-amigos');
        if (loading) loading.style.display = 'grid';
        if (container) container.style.display = 'none';

        try {
            const response = await fetch(`${baseAPIUrl}/api/v2/users/obtenerAmigos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${account.token}`
                }
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            amigos = data.amigos || [];
            window.amigos = amigos;

            this.filterAndRenderFriends();

        } catch (error) {
            console.error('Error loading friends:', error);
            if (loading) loading.style.display = 'none';

            new Alert().ShowAlert({
                icon: 'error',
                title: await window.getString("friends.errorLoadingFriends") || 'Error al cargar amigos'
            });
        }
    }

}
export default Friends;