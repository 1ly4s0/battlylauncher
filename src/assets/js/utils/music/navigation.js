'use strict';

function initializeNavigationEvents(musicInstance) {
    const backBtn = document.getElementById('arrow-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            goBack(musicInstance);
        });
    }

    const forwardBtn = document.getElementById('arrow-forward');
    if (forwardBtn) {
        forwardBtn.addEventListener('click', () => {
            goForward(musicInstance);
        });
    }

    const queueToggle = document.querySelector('[data-panel="b-music-queue-panel"]');
    const queuePanel = document.querySelector('.b-music-queue-panel');
    const queueCloseBtn = document.getElementById('b-music-queue-panel-close');

    if (queueToggle && queuePanel) {
        queueToggle.addEventListener('click', (e) => {
            e.preventDefault();
            queuePanel.classList.add('active');
        });
    }

    if (queueCloseBtn && queuePanel) {
        queueCloseBtn.addEventListener('click', () => {
            queuePanel.classList.remove('active');
        });
    }

    const savePlaylistBtn = document.getElementById('b-music-save-playlist-btn');
    if (savePlaylistBtn && musicInstance) {
        savePlaylistBtn.addEventListener('click', () => {
            musicInstance.saveCurrentQueueAsPlaylist();
        });
    }

    const backHomeBtn = document.getElementById('b-music-back-btn');
    if (backHomeBtn && musicInstance) {
        backHomeBtn.addEventListener('click', () => {
            musicInstance.goToPanel('b-music-panel-inicio');
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('.like-song')) {
            const button = e.target.closest('.like-song');
            button.classList.toggle('is-active');
            const icon = button.querySelector('i');
            if (button.classList.contains('is-active')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                button.style.backgroundColor = '#ff3860';
            } else {
                icon.classList.add('fa-regular');
                icon.classList.remove('fa-solid');
                button.style.backgroundColor = '#3273dc';
            }
        }
    });

    document.querySelectorAll('.b-music-menu-section a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPanelId = link.getAttribute('data-panel');
            if (!targetPanelId) return;

            document.querySelectorAll('.b-music-panel').forEach(panel => {
                panel.classList.remove('active');
            });

            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

function goToPanel(musicInstance, panelClass) {
    document.querySelectorAll('.b-music-panel').forEach((p) => p.classList.remove('active'));

    const selector = panelClass.startsWith('.') || panelClass.startsWith('#')
        ? panelClass
        : '.' + panelClass;
    const targetPanel = document.querySelector(selector);
    if (targetPanel) targetPanel.classList.add('active');

    if (window.stringLoader && window.stringLoader.strings) {
        window.stringLoader.applyStrings();
    }

    if (musicInstance.historyIndex < musicInstance.panelHistory.length - 1) {
        musicInstance.panelHistory = musicInstance.panelHistory.slice(0, musicInstance.historyIndex + 1);
    }
    musicInstance.panelHistory.push(panelClass);
    musicInstance.historyIndex = musicInstance.panelHistory.length - 1;

    updateNavigationButtons(musicInstance);
}

function goBack(musicInstance) {
    if (musicInstance.historyIndex > 0) {
        musicInstance.historyIndex--;
        const panelId = musicInstance.panelHistory[musicInstance.historyIndex];

        const panels = document.querySelectorAll('.b-music-panel');
        panels.forEach(p => p.classList.remove('active'));

        const selector = panelId.startsWith('.') || panelId.startsWith('#')
            ? panelId
            : '.' + panelId;
        const targetPanel = document.querySelector(selector);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        updateNavigationButtons(musicInstance);
    }
}

function goForward(musicInstance) {
    if (musicInstance.historyIndex < musicInstance.panelHistory.length - 1) {
        musicInstance.historyIndex++;
        const panelId = musicInstance.panelHistory[musicInstance.historyIndex];

        const panels = document.querySelectorAll('.b-music-panel');
        panels.forEach(p => p.classList.remove('active'));

        const selector = panelId.startsWith('.') || panelId.startsWith('#')
            ? panelId
            : '.' + panelId;
        const targetPanel = document.querySelector(selector);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        updateNavigationButtons(musicInstance);
    }
}

function updateNavigationButtons(musicInstance) {
    const backBtn = document.getElementById('arrow-back');
    const forwardBtn = document.getElementById('arrow-forward');

    if (backBtn) {
        backBtn.disabled = musicInstance.historyIndex <= 0;
        backBtn.style.opacity = backBtn.disabled ? 0.4 : 1;
    }

    if (forwardBtn) {
        forwardBtn.disabled = musicInstance.historyIndex >= musicInstance.panelHistory.length - 1;
        forwardBtn.style.opacity = forwardBtn.disabled ? 0.4 : 1;
    }
}

module.exports = {
    initializeNavigationEvents,
    goToPanel,
    goBack,
    goForward,
    updateNavigationButtons
};

