'use strict';

const { getMusicCache } = require('./cache');

class PreloaderSystem {
    constructor() {
        this.audioPreloadQueue = [];
        this.imageObserver = null;
        this.preloadedAudio = new Map();

        this.MAX_PRELOAD = 3;

        this.currentQueuePosition = -1;
    }

    initializeLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;

                        if (src && !img.src) {
                            img.src = src;
                            img.classList.add('lazy-loaded');
                            this.imageObserver.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px',

                threshold: 0.01
            });

            console.log('✅ Lazy loading de imágenes activado');
        } else {
            console.warn('⚠️ IntersectionObserver no disponible, cargando todas las imágenes');
        }
    }

    makeLazy(imgElement, src) {
        if (!this.imageObserver) {
            imgElement.src = src;
            return;
        }

        imgElement.dataset.src = src;
        imgElement.classList.add('lazy-image');

        imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect width="300" height="300" fill="%23181818"/%3E%3C/svg%3E';

        this.imageObserver.observe(imgElement);
    }

    applyLazyLoadingToContainer(container) {
        if (!this.imageObserver) return;

        const images = container.querySelectorAll('img[data-src]');
        images.forEach(img => {
            if (!img.classList.contains('lazy-image')) {
                this.imageObserver.observe(img);
                img.classList.add('lazy-image');
            }
        });

        console.log(`🖼️ ${images.length} imágenes configuradas para lazy loading`);
    }

    async preloadMetadata(videoIds) {
        if (!videoIds || videoIds.length === 0) return;

        const cache = getMusicCache();
        console.log(`🔄 Pre-cargando metadatos de ${videoIds.length} canciones...`);

        try {
            await cache.prefetch(videoIds);
            console.log('✅ Metadatos pre-cargados');
        } catch (error) {
            console.error('Error pre-cargando metadatos:', error);
        }
    }

    async preloadNextSongs(queue, currentIndex) {
        if (!queue || queue.length === 0) return;

        if (this.currentQueuePosition !== currentIndex) {
            this.clearOldPreloads();
            this.currentQueuePosition = currentIndex;
        }

        const toPreload = [];
        for (let i = 1; i <= this.MAX_PRELOAD && currentIndex + i < queue.length; i++) {
            const nextSong = queue[currentIndex + i];
            if (nextSong && nextSong.id && !this.preloadedAudio.has(nextSong.id)) {
                toPreload.push(nextSong);
            }
        }

        if (toPreload.length === 0) return;

        console.log(`🎵 Pre-cargando ${toPreload.length} canciones siguientes...`);

        const promises = toPreload.map(song => this._preloadSingleAudio(song));
        await Promise.allSettled(promises);
    }

    async _preloadSingleAudio(song) {
        try {
            if (this.preloadedAudio.has(song.id)) return;

            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = 0.01;

            if (song.src) {
                audio.src = song.src;
            } else if (song.url) {
                audio.src = song.url;
            } else {

                console.warn(`No se puede pre-cargar ${song.id}: falta URL`);
                return;
            }

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve();
                }, 5000);

                audio.addEventListener('loadeddata', () => {
                    clearTimeout(timeout);
                    this.preloadedAudio.set(song.id, audio);
                    console.log(`✅ Pre-cargado: ${song.title || song.id}`);
                    resolve();
                });

                audio.addEventListener('error', () => {
                    clearTimeout(timeout);
                    console.warn(`⚠️ Error pre-cargando: ${song.title || song.id}`);
                    resolve();
                });

                audio.load();
            });
        } catch (error) {
            console.error('Error en _preloadSingleAudio:', error);
        }
    }

    getPreloadedAudio(songId) {
        return this.preloadedAudio.get(songId) || null;
    }

    clearOldPreloads() {

        if (this.preloadedAudio.size > this.MAX_PRELOAD + 2) {
            const entries = Array.from(this.preloadedAudio.entries());
            const toRemove = entries.slice(0, entries.length - this.MAX_PRELOAD);

            toRemove.forEach(([id, audio]) => {
                audio.pause();
                audio.src = '';
                this.preloadedAudio.delete(id);
            });

            console.log(`🧹 Limpiadas ${toRemove.length} pre-cargas antiguas`);
        }
    }

    clearAll() {
        this.preloadedAudio.forEach((audio, id) => {
            audio.pause();
            audio.src = '';
        });
        this.preloadedAudio.clear();
        this.currentQueuePosition = -1;
        console.log('🗑️ Todas las pre-cargas limpiadas');
    }

    async preloadImages(imageUrls) {
        if (!imageUrls || imageUrls.length === 0) return;

        console.log(`🖼️ Pre-cargando ${imageUrls.length} imágenes...`);

        const promises = imageUrls.map(url => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;

                setTimeout(() => resolve(false), 3000);
            });
        });

        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`✅ ${successful}/${imageUrls.length} imágenes pre-cargadas`);
    }

    preloadThumbnail(videoId) {
        const cache = getMusicCache();
        const thumbnailUrl = cache.getThumbnailUrl(videoId, 'hqdefault');

        const img = new Image();
        img.src = thumbnailUrl;

        return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            setTimeout(() => resolve(false), 2000);
        });
    }

    async optimizePlaylistLoading(songs, visibleCount = 20) {
        if (!songs || songs.length === 0) return songs;

        console.log(`⚡ Optimizando carga de playlist de ${songs.length} canciones`);

        const visible = songs.slice(0, visibleCount);
        const visibleIds = visible.map(s => s.id).filter(Boolean);
        await this.preloadMetadata(visibleIds);

        const thumbnailUrls = visibleIds.map(id => {
            const cache = getMusicCache();
            return cache.getThumbnailUrl(id);
        });
        this.preloadImages(thumbnailUrls);

        if (songs.length > visibleCount) {
            const remaining = songs.slice(visibleCount);
            const remainingIds = remaining.map(s => s.id).filter(Boolean);

            setTimeout(() => {
                this.preloadMetadata(remainingIds);
            }, 1000);
        }

        return songs;
    }

    getStats() {
        return {
            preloadedAudioCount: this.preloadedAudio.size,
            currentQueuePosition: this.currentQueuePosition,
            lazyLoadingEnabled: !!this.imageObserver,
            maxPreload: this.MAX_PRELOAD
        };
    }
}

let preloaderInstance = null;

function getPreloader() {
    if (!preloaderInstance) {
        preloaderInstance = new PreloaderSystem();
        preloaderInstance.initializeLazyLoading();
    }
    return preloaderInstance;
}

module.exports = {
    PreloaderSystem,
    getPreloader
};

