'use strict';

class MusicCache {
    constructor() {
        this.memoryCache = new Map();
        this.CACHE_VERSION = '1.0';
        this.CACHE_PREFIX = 'battly_music_';
        this.DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000;

        this.THUMBNAIL_TTL = 30 * 24 * 60 * 60 * 1000;

        this.MAX_MEMORY_ITEMS = 500;
    }

    async getSongMetadata(videoId) {

        if (this.memoryCache.has(videoId)) {
            const cached = this.memoryCache.get(videoId);
            if (cached.expiresAt > Date.now()) {
                return cached.data;
            }
            this.memoryCache.delete(videoId);
        }

        const localData = this._getFromLocalStorage(videoId);
        if (localData) {
            this.memoryCache.set(videoId, {
                data: localData,
                expiresAt: Date.now() + this.DEFAULT_TTL
            });
            return localData;
        }

        const freshData = await this._fetchFromYouTube(videoId);

        this._saveToCache(videoId, freshData);

        return freshData;
    }

    async getBulkMetadata(videoIds) {
        const results = new Map();
        const promises = videoIds.map(async (id) => {
            try {
                const metadata = await this.getSongMetadata(id);
                results.set(id, metadata);
            } catch (error) {
                console.error(`Error obteniendo metadata para ${id}:`, error);
                results.set(id, this._getDefaultMetadata(id));
            }
        });

        await Promise.all(promises);
        return results;
    }

    getThumbnailUrl(videoId, quality = 'hqdefault') {
        return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
    }

    async getThumbnailUrlWithFallback(videoId) {
        const qualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'];

        for (const quality of qualities) {
            const url = this.getThumbnailUrl(videoId, quality);
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    return url;
                }
            } catch (e) {
                continue;
            }
        }

        return this.getThumbnailUrl(videoId, 'hqdefault');
    }

    async _fetchFromYouTube(videoId) {
        try {

            const response = await fetch(`https://noembed.com/embed?nowrap=1&url=https://youtu.be/${videoId}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return {
                id: videoId,
                title: data.title || 'Unknown',
                artist: data.author_name || 'Unknown',
                thumbnail: this.getThumbnailUrl(videoId),
                duration: data.duration || null,
                fetchedAt: Date.now()
            };
        } catch (error) {
            console.warn(`Error fetching from noembed for ${videoId}, usando fallback`, error);
            return this._getDefaultMetadata(videoId);
        }
    }

    _getDefaultMetadata(videoId) {
        return {
            id: videoId,
            title: 'Loading...',
            artist: 'Unknown',
            thumbnail: this.getThumbnailUrl(videoId),
            duration: null,
            fetchedAt: Date.now()
        };
    }

    _saveToCache(videoId, data) {

        this.memoryCache.set(videoId, {
            data,
            expiresAt: Date.now() + this.DEFAULT_TTL
        });

        if (this.memoryCache.size > this.MAX_MEMORY_ITEMS) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }

        try {
            const cacheKey = this.CACHE_PREFIX + videoId;
            const cacheData = {
                version: this.CACHE_VERSION,
                data,
                expiresAt: Date.now() + this.DEFAULT_TTL
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Error guardando en localStorage:', error);
            this._cleanOldCache();

        }
    }

    _getFromLocalStorage(videoId) {
        try {
            const cacheKey = this.CACHE_PREFIX + videoId;
            const cached = localStorage.getItem(cacheKey);

            if (!cached) return null;

            const parsed = JSON.parse(cached);

            if (parsed.version !== this.CACHE_VERSION || parsed.expiresAt < Date.now()) {
                localStorage.removeItem(cacheKey);
                return null;
            }

            return parsed.data;
        } catch (error) {
            console.warn('Error leyendo de localStorage:', error);
            return null;
        }
    }

    _cleanOldCache() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.CACHE_PREFIX)) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.expiresAt < Date.now() || data.version !== this.CACHE_VERSION) {
                            keysToRemove.push(key);
                        }
                    } catch {
                        keysToRemove.push(key);
                    }
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`🧹 Cache limpiado: ${keysToRemove.length} items eliminados`);
        } catch (error) {
            console.error('Error limpiando cache:', error);
        }
    }

    async prefetch(videoIds) {
        const uncached = videoIds.filter(id =>
            !this.memoryCache.has(id) && !this._getFromLocalStorage(id)
        );

        if (uncached.length === 0) return;

        console.log(`🔄 Pre-cargando ${uncached.length} canciones...`);

        const batchSize = 10;
        for (let i = 0; i < uncached.length; i += batchSize) {
            const batch = uncached.slice(i, i + batchSize);
            await this.getBulkMetadata(batch);

            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    invalidate(videoId) {
        this.memoryCache.delete(videoId);
        const cacheKey = this.CACHE_PREFIX + videoId;
        localStorage.removeItem(cacheKey);
    }

    clearAll() {
        this.memoryCache.clear();
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🗑️ Todo el cache ha sido limpiado');
    }

    getStats() {
        let localStorageCount = 0;
        let localStorageSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorageCount++;
                localStorageSize += (localStorage.getItem(key) || '').length;
            }
        }

        return {
            memoryItems: this.memoryCache.size,
            localStorageItems: localStorageCount,
            localStorageSizeKB: (localStorageSize / 1024).toFixed(2),
            maxMemoryItems: this.MAX_MEMORY_ITEMS
        };
    }
}

let cacheInstance = null;

function getMusicCache() {
    if (!cacheInstance) {
        cacheInstance = new MusicCache();
    }
    return cacheInstance;
}

module.exports = {
    MusicCache,
    getMusicCache
};

