class StringLoader {
    constructor() {
        this.strings = null;
        this.currentLanguage = null;
        this.stringCache = new Map();

        this.isLoading = false;
        this.loadPromise = null;
    }

    async getUserLanguage() {
        try {
            const { getValue } = require('./storage');
            const lang = await getValue('lang');
            return lang || 'es';
        } catch (error) {
            console.warn('Could not get user language, defaulting to Spanish:', error);
            return 'es';
        }
    }

    /**
     * Obtiene la lista de idiomas disponibles desde la API
     * @returns {Promise<Array<string>>} Lista de códigos de idioma disponibles
     */
    async getAvailableLanguages() {
        try {
            const baseURL = 'https://api.battlylauncher.com';
            const apiUrl = `${baseURL}/api/v2/launcher/strings`;

            const response = await fetch(apiUrl);

            if (response.ok) {
                const data = await response.json();
                if (data.status === 200 && Array.isArray(data.languages)) {
                    return data.languages;
                }
            }

            // Fallback a idiomas conocidos
            return ['en', 'es'];
        } catch (error) {
            console.error('Error fetching available languages:', error);
            return ['en', 'es'];
        }
    }

    async loadStrings(language = null) {
        if (!language) {
            language = await this.getUserLanguage();
        }

        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        if (this.strings && this.currentLanguage === language) {
            return this.strings;
        }

        this.isLoading = true;
        this.loadPromise = this._doLoadStrings(language);

        try {
            const result = await this.loadPromise;
            this.isLoading = false;
            return result;
        } catch (error) {
            this.isLoading = false;
            throw error;
        }
    }

    async _doLoadStrings(language) {
        try {
            // Intentar cargar desde la API primero
            const baseURL = 'https://api.battlylauncher.com';
            const apiUrl = `${baseURL}/api/v2/launcher/strings/${language}`;

            const response = await fetch(apiUrl);

            if (response.ok) {
                const data = await response.json();

                if (data.status === 200 && data.strings) {
                    this.strings = data.strings;
                    this.currentLanguage = data.language;
                    this.stringCache.clear();

                    console.log(`✅ Strings loaded from API for language: ${data.language}${data.fallback ? ' (fallback)' : ''}`);
                    return this.strings;
                }
            }

            // Si la API falla, intentar cargar localmente como fallback
            console.warn('⚠️ API not available, loading strings from local files...');
            const localResponse = await fetch(`./assets/langs/strings.${language}.json`);
            this.strings = await localResponse.json();
            this.currentLanguage = language;
            this.stringCache.clear();

            console.log(`✅ Strings loaded locally for language: ${language}`);
            return this.strings;
        } catch (error) {
            console.error(`❌ Error loading strings for language ${language}:`, error);

            if (language !== 'en') {
                return await this._doLoadStrings('en');
            }
            throw error;
        }
    }

    getString(path) {
        if (!this.strings) {
            console.warn('⚠️ StringLoader: Strings not loaded yet, returning path as fallback');
            return path;
        }

        if (this.stringCache.has(path)) {
            return this.stringCache.get(path);
        }

        const keys = path.split('.');
        let value = this.strings;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`⚠️ StringLoader: String not found - ${path}`);
                this.stringCache.set(path, path);
                return path;
            }
        }

        this.stringCache.set(path, value);
        return value;
    }

    applyStrings() {
        if (!this.strings) {
            console.warn('⚠️ StringLoader: Cannot apply strings - not loaded yet');
            return;
        }

        const elements = document.querySelectorAll('[data-string-id]');
        elements.forEach(element => {
            const stringId = element.getAttribute('data-string-id');
            if (!stringId) return;

            const stringValue = this.getString(stringId);

            // Handle INPUT elements with placeholders
            if (element.tagName === 'INPUT') {
                if (element.hasAttribute('data-string-id-placeholder')) {
                    element.placeholder = stringValue;
                } else if (element.type === 'submit') {
                    element.value = stringValue;
                } else if (element.hasAttribute('placeholder')) {
                    element.placeholder = stringValue;
                } else {
                    element.value = stringValue;
                }
            }
            // Handle LABEL elements
            else if (element.tagName === 'LABEL') {
                element.textContent = stringValue;
            }
            // Handle OPTION elements (select options)
            else if (element.tagName === 'OPTION') {
                element.textContent = stringValue;
            }
            // Handle other elements
            else {
                element.textContent = stringValue;
            }
        });
    }

    getStrings(paths) {
        const result = {};
        paths.forEach(path => {
            result[path] = this.getString(path);
        });
        return result;
    }

    preloadStrings(paths) {
        paths.forEach(path => {
            this.getString(path);
        });
    }

    clearCache() {
        this.stringCache.clear();
    }

    getCacheStats() {
        return {
            size: this.stringCache.size,
            entries: Array.from(this.stringCache.keys())
        };
    }

    // Método para debug y testing
    testNewsKeys() {
        if (!this.strings) {
            console.warn('⚠️ StringLoader: Cannot test - strings not loaded');
            return false;
        }

        const testKeys = [
            'news.header.title',
            'news.slide0.title',
            'news.slide1.title',
            'news.slide8.title',
            'news.finish.title',
            'news.welcome.title',
            'news.legacy.user.name'
        ];

        let allFound = true;
        console.log('🔍 Testing news keys...');

        testKeys.forEach(key => {
            const value = this.getString(key);
            if (value === key) {
                console.error(`❌ Key not found: ${key}`);
                allFound = false;
            } else {
                console.log(`✅ ${key}: "${value}"`);
            }
        });

        if (allFound) {
            console.log('🎉 All news keys found successfully!');
        }

        return allFound;
    }

    /**
     * Recarga los strings desde la API
     * @param {string} language - Idioma a cargar (opcional)
     * @returns {Promise<Object>} Los strings cargados
     */
    async reloadStrings(language = null) {
        this.strings = null;
        this.stringCache.clear();
        return await this.loadStrings(language);
    }

    /**
     * Cambia el idioma y recarga todos los strings
     * @param {string} language - Nuevo idioma
     * @returns {Promise<Object>} Los strings del nuevo idioma
     */
    async changeLanguage(language) {
        const { setValue } = require('./storage');
        await setValue('lang', language);
        await this.reloadStrings(language);
        this.applyStrings();
        console.log(`🌐 Language changed to: ${language}`);
        return this.strings;
    }

    /**
     * Obtiene el idioma actual
     * @returns {string} Código del idioma actual
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Verifica si los strings están cargados
     * @returns {boolean} true si están cargados
     */
    isLoaded() {
        return this.strings !== null;
    }
}

window.stringLoader = new StringLoader();

window.ensureStringLoader = async function () {
    if (!window.stringLoader.strings) {
        await window.stringLoader.loadStrings();
    }
    return window.stringLoader;
};

window.getString = function (path) {
    if (!window.stringLoader.strings) {
        console.warn('StringLoader not initialized, call ensureStringLoader() first');
        return path;
    }
    return window.stringLoader.getString(path);
};

/**
 * Cambia el idioma de la aplicación
 * @param {string} language - Código del idioma a cargar
 * @returns {Promise<Object>} Los strings del nuevo idioma
 */
window.changeLanguage = async function (language) {
    return await window.stringLoader.changeLanguage(language);
};

/**
 * Obtiene los idiomas disponibles
 * @returns {Promise<Array<string>>} Lista de códigos de idioma
 */
window.getAvailableLanguages = async function () {
    return await window.stringLoader.getAvailableLanguages();
};

/**
 * Obtiene el idioma actual
 * @returns {string} Código del idioma actual
 */
window.getCurrentLanguage = function () {
    return window.stringLoader.getCurrentLanguage();
};

/**
 * Recarga los strings desde la API
 * @param {string} language - Idioma a cargar (opcional)
 * @returns {Promise<Object>} Los strings cargados
 */
window.reloadStrings = async function (language = null) {
    return await window.stringLoader.reloadStrings(language);
};

// Función específica para inicializar el panel de news
window.initNewsPanel = async function () {
    try {
        await window.ensureStringLoader();
        window.stringLoader.applyStrings();
        console.log('✅ News panel strings applied successfully');
    } catch (error) {
        console.error('❌ Error initializing news panel:', error);
    }
};

// Auto-aplicar strings cuando el DOM esté cargado si ya están disponibles
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.stringLoader && window.stringLoader.strings) {
            window.stringLoader.applyStrings();
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StringLoader };
}