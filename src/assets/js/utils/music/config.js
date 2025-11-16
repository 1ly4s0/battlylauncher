'use strict';

class MusicConfig {
    constructor() {
        this._baseURL = null;
        this._apiPath = '/api';
    }

    getBaseURL() {
        if (this._baseURL) {
            return this._baseURL;
        }

        if (typeof process !== 'undefined' && process.env && process.env.BATTLY_MUSIC_API_URL) {
            this._baseURL = process.env.BATTLY_MUSIC_API_URL.replace(/\/+$/, '');
            return this._baseURL;
        }

        if (typeof localStorage !== 'undefined') {
            const storedURL = localStorage.getItem('battly_music_api_url');
            if (storedURL) {
                this._baseURL = storedURL.replace(/\/+$/, '');
                return this._baseURL;
            }
        }

        this._baseURL = 'https://musicapi.battlylauncher.com';
        return this._baseURL;
    }

    getAPIURL() {
        return this.getBaseURL() + this._apiPath;
    }

    setBaseURL(url) {
        if (!url || typeof url !== 'string') {
            throw new Error('URL inválida');
        }

        url = url.replace(/\/+$/, '').replace(/\/api$/, '');

        try {
            new URL(url);
        } catch (e) {
            throw new Error('URL inválida: ' + url);
        }

        this._baseURL = url;

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('battly_music_api_url', url);
        }

        console.log('✅ Battly Music API URL actualizada:', url);
    }

    resetToDefault() {
        this._baseURL = 'https://musicapi.battlylauncher.com';

        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('battly_music_api_url');
        }

        console.log('✅ Battly Music API URL reseteada a default');
    }

    getConfig() {
        return {
            baseURL: this.getBaseURL(),
            apiURL: this.getAPIURL(),
            apiPath: this._apiPath
        };
    }

    async checkAPIAvailability() {
        try {
            const response = await fetch(this.getAPIURL() + '/health', {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (e) {
            console.warn('⚠️ API no disponible:', this.getAPIURL());
            return false;
        }
    }

    buildURL(endpoint) {

        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        return this.getAPIURL() + endpoint;
    }
}

let configInstance = null;

function getMusicConfig() {
    if (!configInstance) {
        configInstance = new MusicConfig();
    }
    return configInstance;
}

function setMusicAPIBaseURL(url) {
    const config = getMusicConfig();
    config.setBaseURL(url);
}

function getMusicAPIBaseURL() {
    const config = getMusicConfig();
    return config.getBaseURL();
}

function getMusicAPIURL() {
    const config = getMusicConfig();
    return config.getBaseURL();
}

function getFullAPIURL() {
    const config = getMusicConfig();
    return config.getAPIURL();
}

module.exports = {
    MusicConfig,
    getMusicConfig,
    setMusicAPIBaseURL,
    getMusicAPIBaseURL,
    getMusicAPIURL,
    getFullAPIURL
};

