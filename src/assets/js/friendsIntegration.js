import { changePanel } from './utils.js';

(function () {
    'use strict';

    function waitForProfileSystem() {
        return new Promise((resolve) => {
            if (window.BattlyProfileSystem) {
                resolve(window.BattlyProfileSystem);
            } else {
                const interval = setInterval(() => {
                    if (window.BattlyProfileSystem) {
                        clearInterval(interval);
                        resolve(window.BattlyProfileSystem);
                    }
                }, 100);
            }
        });
    }

    async function loadFriendsWithProfiles() {
        const profileSystem = await waitForProfileSystem();
        const friendsContainer = document.getElementById('lista-de-amigos');
        const loadingContainer = document.getElementById('friends-loading');
        const emptyContainer = document.getElementById('friends-empty');

        if (!friendsContainer) return;

        if (loadingContainer) loadingContainer.style.display = 'grid';
        if (emptyContainer) emptyContainer.style.display = 'none';
        friendsContainer.style.display = 'none';

        try {
            const token = localStorage.getItem('battly_token');
            const username = localStorage.getItem('battly_username');

            if (!token || !username) {
                console.error('No hay sesión activa');
                return;
            }

            const response = await fetch('https://api.battly.net/api/v2/users/obtenerAmigos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (loadingContainer) loadingContainer.style.display = 'none';

            if (data.status === 200 && data.amigos && data.amigos.length > 0) {
                friendsContainer.style.display = 'grid';
                friendsContainer.innerHTML = '';

                for (const friend of data.amigos) {
                    const profile = friend.profile || profileSystem.getDefaultProfile();
                    const cardHTML = profileSystem.createFriendCard(friend, profile);
                    friendsContainer.insertAdjacentHTML('beforeend', cardHTML);
                }

                profileSystem.attachCardEventListeners(friendsContainer);

                updateFriendCounters(data.amigos);
            } else {

                if (emptyContainer) emptyContainer.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error al cargar amigos:', error);
            if (loadingContainer) loadingContainer.style.display = 'none';
            if (emptyContainer) {
                emptyContainer.style.display = 'flex';
                emptyContainer.querySelector('.empty-title').textContent = 'Error al cargar amigos';
                emptyContainer.querySelector('.empty-description').textContent = 'Por favor, intenta de nuevo más tarde';
            }
        }
    }

    function updateFriendCounters(friends) {
        const allCount = friends.length;
        const onlineCount = friends.filter(f => f.estado === 'online').length;
        const playingCount = friends.filter(f => f.estado === 'playing').length;
        const offlineCount = friends.filter(f => f.estado === 'offline').length;

        const countAll = document.getElementById('count-all');
        const countOnline = document.getElementById('count-online');
        const countPlaying = document.getElementById('count-playing');
        const countOffline = document.getElementById('count-offline');

        if (countAll) countAll.textContent = allCount;
        if (countOnline) countOnline.textContent = onlineCount;
        if (countPlaying) countPlaying.textContent = playingCount;
        if (countOffline) countOffline.textContent = offlineCount;
    }

    function setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const friendsContainer = document.getElementById('lista-de-amigos');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {

                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                const cards = friendsContainer.querySelectorAll('.friend-card');

                cards.forEach(card => {
                    const status = card.dataset.status;

                    if (filter === 'all') {
                        card.style.display = 'flex';
                    } else if (filter === status) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    function setupSearch() {
        const searchInput = document.getElementById('friends-search-input');
        const searchClear = document.getElementById('friends-search-clear');
        const friendsContainer = document.getElementById('lista-de-amigos');
        const noResults = document.getElementById('friends-no-results');

        if (!searchInput || !friendsContainer) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const cards = friendsContainer.querySelectorAll('.friend-card');
            let visibleCount = 0;

            if (query) {
                if (searchClear) searchClear.style.display = 'block';
            } else {
                if (searchClear) searchClear.style.display = 'none';
            }

            cards.forEach(card => {
                const username = card.dataset.username.toLowerCase();

                if (username.includes(query)) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (noResults) {
                if (visibleCount === 0 && query) {
                    noResults.style.display = 'flex';
                    friendsContainer.style.display = 'none';
                } else {
                    noResults.style.display = 'none';
                    friendsContainer.style.display = 'grid';
                }
            }
        });

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.focus();
            });
        }
    }

    function setupCustomizationButton() {
        const header = document.querySelector('.friends-header-actions');

        if (header && !document.getElementById('customize-profile-btn')) {
            const customizeBtn = document.createElement('button');
            customizeBtn.id = 'customize-profile-btn';
            customizeBtn.className = 'btn-action btn-secondary';
            customizeBtn.setAttribute('data-tooltip', 'Personalizar perfil');
            customizeBtn.innerHTML = `
                <i class="fa-solid fa-palette"></i>
                <span>Mi Perfil</span>
            `;

            customizeBtn.addEventListener('click', () => {

                changePanel('settings');
            });

            const backBtn = header.querySelector('#friends-volver-btn');
            if (backBtn) {
                header.insertBefore(customizeBtn, backBtn);
            } else {
                header.appendChild(customizeBtn);
            }
        }
    }

    let autoUpdateInterval = null;

    function startAutoUpdate() {
        if (autoUpdateInterval) {
            clearInterval(autoUpdateInterval);
        }

        autoUpdateInterval = setInterval(() => {
            loadFriendsWithProfiles();
        }, 30000);

    }

    function stopAutoUpdate() {
        if (autoUpdateInterval) {
            clearInterval(autoUpdateInterval);
            autoUpdateInterval = null;
        }
    }

    function initFriendsPanel() {
        loadFriendsWithProfiles();
        setupFilters();
        setupSearch();
        setupCustomizationButton();
        startAutoUpdate();
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('friends-container')) {
                        initFriendsPanel();
                    }
                });
            }
        });
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.querySelector('.friends-container')) {
        initFriendsPanel();
    }

    window.addEventListener('beforeunload', stopAutoUpdate);

    window.reloadFriendsPanel = loadFriendsWithProfiles;

})();

