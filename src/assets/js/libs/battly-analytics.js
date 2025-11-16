/**
 * Battly Analytics Client
 * Cliente JavaScript para integrar analytics en el Launcher de Battly
 */

class BattlyAnalytics {
    constructor(apiUrl, userId, userToken = null, userInfo = {}) {
        this.apiUrl = apiUrl;
        this.userId = userId;
        this.userToken = userToken;
        this.userInfo = userInfo; // Info adicional: username, uuid, theme, etc.
        this.sessionId = null;
        this.heartbeatInterval = null;
        this.eventQueue = [];
        this.processingQueue = false;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * Inicializar analytics e iniciar sesión
     */
    async init() {
        try {
            console.log('[Analytics] Initializing...');

            const metadata = this._collectMetadata();

            const response = await this._fetch('/session/start', {
                method: 'POST',
                body: JSON.stringify({
                    userId: this.userId,
                    metadata
                })
            });

            const data = await response.json();

            if (data.success) {
                this.sessionId = data.sessionId;
                this.startHeartbeat();
                console.log('[Analytics] ✅ Initialized successfully. Session:', this.sessionId);

                // Procesar cola de eventos pendientes
                this._processQueue();

                return true;
            } else {
                throw new Error(data.error || 'Failed to initialize');
            }
        } catch (error) {
            console.error('[Analytics] ❌ Init failed:', error);
            return false;
        }
    }

    /**
     * Registrar un evento
     */
    track(eventType, properties = {}) {
        const event = {
            userId: this.userId,
            eventType,
            properties,
            timestamp: Date.now()
        };

        // Agregar a la cola
        this.eventQueue.push(event);

        // Procesar inmediatamente si estamos inicializados
        if (this.sessionId) {
            this._processQueue();
        }
    }

    /**
     * Enviar log al servidor
     */
    async log(level, message, context = {}) {
        try {
            await this._fetch('/log', {
                method: 'POST',
                body: JSON.stringify({
                    userId: this.userId,
                    level,
                    message,
                    context
                })
            });
        } catch (error) {
            console.error('[Analytics] Failed to send log:', error);
        }
    }

    /**
     * Iniciar heartbeat para mantener sesión activa
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(async () => {
            try {
                await this._fetch('/heartbeat', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: this.userId,
                        sessionId: this.sessionId
                    })
                });
                console.log('[Analytics] 💓 Heartbeat sent');
            } catch (error) {
                console.error('[Analytics] Heartbeat failed:', error);
            }
        }, 30000); // cada 30 segundos
    }

    /**
     * Detener heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Cerrar sesión de analytics
     */
    async close() {
        console.log('[Analytics] Closing session...');

        this.stopHeartbeat();

        if (this.sessionId) {
            try {
                await this._fetch('/session/end', {
                    method: 'POST',
                    body: JSON.stringify({
                        sessionId: this.sessionId,
                        userId: this.userId
                    })
                });
                console.log('[Analytics] ✅ Session closed successfully');
            } catch (error) {
                console.error('[Analytics] Failed to close session:', error);
            }
        }

        this.sessionId = null;
    }

    /**
     * Actualizar información del usuario
     */
    updateUserInfo(userInfo) {
        this.userInfo = { ...this.userInfo, ...userInfo };
        console.log('[Analytics] User info updated:', this.userInfo);
    }

    /**
     * Recolectar metadata del sistema
     * @private
     */
    _collectMetadata() {
        const metadata = {
            launcherVersion: this._getLauncherVersion(),
            os: this._getOS(),
            osVersion: this._getOSVersion(),
            // Información del usuario
            username: this.userInfo.username || null,
            uuid: this.userInfo.uuid || null,
            accountType: this.userInfo.accountType || null,
            premium: this.userInfo.premium || false,
            // Configuración del launcher
            theme: this.userInfo.theme || null,
            language: this.userInfo.language || null,
            minecraftVersion: this.userInfo.minecraftVersion || null,
            lastVersionPlayed: this.userInfo.lastVersionPlayed || null,
            recentVersions: this.userInfo.recentVersions || null
        };

        return metadata;
    }

    /**
     * Obtener versión del launcher
     * @private
     */
    _getLauncherVersion() {
        try {
            const { app } = require('electron');
            return app.getVersion();
        } catch (e) {
            return '1.0.0';
        }
    }

    /**
     * Detectar sistema operativo
     * @private
     */
    _getOS() {
        const platform = process.platform;
        if (platform === 'win32') return 'Windows';
        if (platform === 'darwin') return 'macOS';
        if (platform === 'linux') return 'Linux';
        return platform;
    }

    /**
     * Obtener versión del sistema operativo
     * @private
     */
    _getOSVersion() {
        try {
            const os = require('os');
            return os.release();
        } catch (e) {
            return 'unknown';
        }
    }

    /**
     * Procesar cola de eventos
     * @private
     */
    async _processQueue() {
        if (this.processingQueue || this.eventQueue.length === 0) {
            return;
        }

        this.processingQueue = true;

        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();

            try {
                await this._fetch('/event', {
                    method: 'POST',
                    body: JSON.stringify(event)
                });
            } catch (error) {
                console.error('[Analytics] Failed to send event:', error);
                // Reintentar después
                if (!event.retries) event.retries = 0;
                if (event.retries < this.maxRetries) {
                    event.retries++;
                    this.eventQueue.push(event);
                }
            }

            // Pequeño delay para no saturar
            await this._sleep(100);
        }

        this.processingQueue = false;
    }

    /**
     * Hacer petición HTTP
     * @private
     */
    async _fetch(endpoint, options = {}) {
        const fetch = require('node-fetch');
        const url = this.apiUrl + endpoint;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (this.userToken) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.userToken}`;
        }

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        const response = await fetch(url, mergedOptions);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
    }

    /**
     * Sleep helper
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Eventos predefinidos
BattlyAnalytics.Events = {
    // Launcher
    LAUNCHER_STARTED: 'launcher:started',
    LAUNCHER_CLOSED: 'launcher:closed',
    PANEL_CHANGED: 'launcher:panel_changed',
    SETTINGS_CHANGED: 'launcher:settings_changed',
    LANGUAGE_CHANGED: 'launcher:language_changed',

    // Minecraft
    MINECRAFT_STARTED: 'minecraft:started',
    MINECRAFT_CRASHED: 'minecraft:crashed',
    MINECRAFT_CLOSED: 'minecraft:closed',

    // Versiones
    VERSION_SELECTED: 'version:selected',
    VERSION_INSTALLED: 'version:installed',
    VERSION_DELETED: 'version:deleted',

    // Mods
    MOD_DOWNLOADED: 'mod:downloaded',
    MOD_INSTALLED: 'mod:installed',
    MOD_REMOVED: 'mod:removed',
    MOD_ENABLED: 'mod:enabled',
    MOD_DISABLED: 'mod:disabled',

    // Temas
    THEME_APPLIED: 'theme:applied',
    THEME_CREATED: 'theme:created',
    THEME_SHARED: 'theme:shared',

    // Música
    MUSIC_PLAYED: 'music:played',
    MUSIC_PAUSED: 'music:paused',
    MUSIC_SKIPPED: 'music:skipped',
    MUSIC_SEARCHED: 'music:searched',

    // Social
    FRIEND_ADDED: 'friend:added',
    FRIEND_REMOVED: 'friend:removed',
    MESSAGE_SENT: 'message:sent',

    // Instalaciones
    INSTALLATION_STARTED: 'installation:started',
    INSTALLATION_COMPLETED: 'installation:completed',
    INSTALLATION_FAILED: 'installation:failed',

    // Errores
    ERROR_OCCURRED: 'error:occurred'
};

// Log levels
BattlyAnalytics.LogLevel = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

module.exports = BattlyAnalytics;
