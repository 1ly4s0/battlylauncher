class BattlyProfileSystem {
    constructor() {
        this.profileCache = new Map();
        this.apiUrl = 'https://api.battlylauncher.com';
    }

    async loadProfile(userId) {

        if (this.profileCache.has(userId)) {
            return this.profileCache.get(userId);
        }

        try {
            const token = localStorage.getItem('battly_token');
            const response = await fetch(`${this.apiUrl}/api/v2/users/profile/${userId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            const data = await response.json();

            if (data.status === 200 && data.profile) {
                this.profileCache.set(userId, data.profile);
                return data.profile;
            }

            return this.getDefaultProfile();
        } catch (error) {
            console.error('Error al cargar perfil:');
            console.error(error);
            return this.getDefaultProfile();
        }
    }

    getDefaultProfile() {
        return {
            borderColor: '#7289da',
            borderStyle: 'solid',
            borderWidth: 3,
            nameColor: '#ffffff',
            backgroundColor: '#2c2f33',
            backgroundImage: null,
            isPremium: false
        };
    }

    applyProfileStyles(element, profile) {
        if (!element || !profile) return;

        const avatarElement = element.querySelector('.friend-avatar, .preview-avatar, [data-profile-avatar]');
        const nameElement = element.querySelector('.friend-name, .preview-username, [data-profile-name]');
        const backgroundElement = element.querySelector('.friend-card-background, .preview-background, [data-profile-background]');

        if (avatarElement) {
            avatarElement.style.border = `${profile.borderWidth}px ${profile.borderStyle} ${profile.borderColor}`;
            avatarElement.style.boxShadow = `0 0 15px ${profile.borderColor}40`;
        }

        if (nameElement) {
            nameElement.style.color = profile.nameColor;
            nameElement.style.textShadow = `0 0 10px ${profile.nameColor}60`;
        }

        if (backgroundElement) {
            if (profile.backgroundImage && profile.isPremium) {
                backgroundElement.style.backgroundImage = `url(${this.apiUrl}${profile.backgroundImage})`;
                backgroundElement.style.backgroundSize = 'cover';
                backgroundElement.style.backgroundPosition = 'center';
            } else {
                backgroundElement.style.backgroundColor = profile.backgroundColor;
                backgroundElement.style.backgroundImage = 'none';
            }
        }

        if (!backgroundElement && element.classList.contains('friend-card')) {
            element.style.background = profile.backgroundColor;
        }
    }

    createFriendCard(friend, profile) {
        const status = friend.estado || 'offline';
        const statusColor = status === 'online' ? '#43b581' :
            status === 'playing' ? '#faa61a' : '#747f8d';

        const avatarLetter = (friend.username || 'U').charAt(0).toUpperCase();

        let activityText = '';
        if (status === 'playing' && friend.details) {
            activityText = `<div class="friend-activity">🎮 ${friend.details}</div>`;
        }

        const backgroundStyle = profile.backgroundImage && profile.isPremium ?
            `background-image: url(${this.apiUrl}${profile.backgroundImage}); background-size: cover; background-position: center;` :
            `background-color: ${profile.backgroundColor};`;

        return `
            <div class="friend-card" data-username="${friend.username}" data-status="${status}">
                <div class="friend-card-background" data-profile-background style="${backgroundStyle}">
                    <div class="friend-card-overlay"></div>
                </div>
                <div class="friend-card-content">
                    <div class="friend-avatar-wrapper">
                        <div class="friend-avatar" data-profile-avatar 
                             style="border: ${profile.borderWidth}px ${profile.borderStyle} ${profile.borderColor}; 
                                    box-shadow: 0 0 15px ${profile.borderColor}40;">
                            <span>${avatarLetter}</span>
                        </div>
                        <div class="friend-status-dot" style="background-color: ${statusColor};"></div>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name" data-profile-name 
                             style="color: ${profile.nameColor}; 
                                    text-shadow: 0 0 10px ${profile.nameColor}60;">
                            ${friend.username}
                            ${profile.isPremium ? '<i class="fa-solid fa-crown premium-crown" style="color: #ffd700; margin-left: 5px;"></i>' : ''}
                        </div>
                        <div class="friend-status">${this.getStatusText(status)}</div>
                        ${activityText}
                    </div>
                    <div class="friend-actions">
                        <button class="friend-action-btn" data-action="profile" title="Ver perfil">
                            <i class="fa-solid fa-user"></i>
                        </button>
                        <button class="friend-action-btn" data-action="chat" title="Enviar mensaje">
                            <i class="fa-solid fa-message"></i>
                        </button>
                        <button class="friend-action-btn" data-action="more" title="Más opciones">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'online': '🟢 En línea',
            'playing': '🎮 Jugando',
            'offline': '⚫ Desconectado'
        };
        return statusMap[status] || '⚫ Desconectado';
    }

    async loadAndRenderFriends(friends, container) {
        if (!container) return;

        container.innerHTML = '';

        for (const friend of friends) {
            const profile = await this.loadProfile(friend.username);
            const cardHTML = this.createFriendCard(friend, profile);
            container.insertAdjacentHTML('beforeend', cardHTML);
        }

        this.attachCardEventListeners(container);
    }

    attachCardEventListeners(container) {
        const cards = container.querySelectorAll('.friend-card');

        cards.forEach(card => {

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.friend-action-btn')) {
                    const username = card.dataset.username;
                    this.showProfileModal(username);
                }
            });

            const actionButtons = card.querySelectorAll('.friend-action-btn');
            actionButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const username = card.dataset.username;
                    this.handleFriendAction(action, username);
                });
            });
        });
    }

    handleFriendAction(action, username) {
        switch (action) {
            case 'profile':
                this.showProfileModal(username);
                break;
            case 'chat':
                console.log('Abrir chat con', username);

                break;
            case 'more':
                console.log('Mostrar más opciones para', username);

                break;
        }
    }

    async showProfileModal(username) {
        const profile = await this.loadProfile(username);

        const modal = document.createElement('div');
        modal.className = 'profile-modal-overlay';
        modal.innerHTML = `
            <div class="profile-modal">
                <button class="profile-modal-close"><i class="fa-solid fa-times"></i></button>
                <div class="profile-modal-background" data-profile-background></div>
                <div class="profile-modal-content">
                    <div class="profile-modal-avatar-wrapper">
                        <div class="profile-modal-avatar" data-profile-avatar>
                            ${username.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <h2 class="profile-modal-username" data-profile-name>${username}</h2>
                    <div class="profile-modal-actions">
                        <button class="profile-modal-btn"><i class="fa-solid fa-message"></i> Enviar mensaje</button>
                        <button class="profile-modal-btn"><i class="fa-solid fa-user-minus"></i> Eliminar amigo</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        this.applyProfileStyles(modal, profile);

        modal.querySelector('.profile-modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    clearCache() {
        this.profileCache.clear();
    }
}

window.BattlyProfileSystem = new BattlyProfileSystem();

