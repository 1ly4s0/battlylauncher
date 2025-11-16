/**
 * Helper de Analytics para Renderer Process
 * Usa IPC para comunicarse con el proceso principal
 */

const { ipcRenderer } = require('electron');

class AnalyticsHelper {
    /**
     * Trackear un evento
     */
    static async track(eventType, properties = {}) {
        try {
            const result = await ipcRenderer.invoke('analytics-track', eventType, properties);
            return result;
        } catch (error) {
            console.error('[AnalyticsHelper] Track error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar log
     */
    static async log(level, message, context = {}) {
        try {
            const result = await ipcRenderer.invoke('analytics-log', level, message, context);
            return result;
        } catch (error) {
            console.error('[AnalyticsHelper] Log error:', error);
            return { success: false, error: error.message };
        }
    }

    // Eventos predefinidos (mismos que BattlyAnalytics.Events)
    static Events = {
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

    static LogLevel = {
        ERROR: 'error',
        WARN: 'warn',
        INFO: 'info',
        DEBUG: 'debug'
    };

    // Métodos de conveniencia

    static trackPanelChange(panelName) {
        return this.track(this.Events.PANEL_CHANGED, { panel: panelName });
    }

    static trackMinecraftStart(version, loader = null) {
        return this.track(this.Events.MINECRAFT_STARTED, {
            version,
            loader,
            timestamp: Date.now()
        });
    }

    static trackMinecraftClose(version, playTime) {
        return this.track(this.Events.MINECRAFT_CLOSED, {
            version,
            playTime,
            timestamp: Date.now()
        });
    }

    static trackVersionInstall(version, loader = null) {
        return this.track(this.Events.VERSION_INSTALLED, {
            version,
            loader
        });
    }

    static trackModDownload(modName, modVersion, source) {
        return this.track(this.Events.MOD_DOWNLOADED, {
            modName,
            modVersion,
            source
        });
    }

    static trackThemeApplied(themeName, themeId) {
        return this.track(this.Events.THEME_APPLIED, {
            themeName,
            themeId
        });
    }

    static trackMusicSearch(query, resultsCount) {
        return this.track(this.Events.MUSIC_SEARCHED, {
            query,
            resultsCount
        });
    }

    static trackMusicPlay(songTitle, songArtist) {
        return this.track(this.Events.MUSIC_PLAYED, {
            songTitle,
            songArtist
        });
    }

    static trackMusicPause(songTitle, currentTime) {
        return this.track(this.Events.MUSIC_PAUSED, {
            songTitle,
            currentTime
        });
    }

    static trackMusicSkip(fromSong, toSong, reason) {
        return this.track(this.Events.MUSIC_SKIPPED, {
            fromSong: fromSong?.title,
            toSong: toSong?.title,
            reason
        });
    }

    static trackError(error, context = {}) {
        const errorData = {
            message: error.message || String(error),
            stack: error.stack,
            ...context
        };

        return this.track(this.Events.ERROR_OCCURRED, errorData);
    }

    static trackSettingsChange(setting, oldValue, newValue) {
        return this.track(this.Events.SETTINGS_CHANGED, {
            setting,
            oldValue,
            newValue
        });
    }
}

module.exports = AnalyticsHelper;
