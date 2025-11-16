class LauncherLogger {
    constructor(options = {}) {
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };

        this.config = {
            level: options.level || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG'),
            enableConsole: options.enableConsole !== false,
            enableStorage: options.enableStorage !== false,
            maxStorageEntries: options.maxStorageEntries || 1000,
            colors: {
                ERROR: '#FF4757',

                WARN: '#FFA502',

                INFO: '#3742FA',

                DEBUG: '#7B68EE',

                TRACE: '#A4B0BE',

            },
            modules: new Map()
        };

        this.logs = [];
        this.init();
    }

    init() {

        if (this.config.enableStorage && typeof localStorage !== 'undefined') {
            try {
                const savedLogs = localStorage.getItem('battly-launcher-logs');
                if (savedLogs) {
                    this.logs = JSON.parse(savedLogs).slice(-this.config.maxStorageEntries);
                }
            } catch (error) {
                console.warn('Failed to load previous logs from storage:', error);
            }
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.error('Uncaught Exception', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.error('Unhandled Promise Rejection', {
                    reason: event.reason?.message || event.reason,
                    stack: event.reason?.stack
                });
            });
        }
    }

    shouldLog(level) {
        const configLevel = this.levels[this.config.level.toUpperCase()];
        const messageLevel = this.levels[level];
        return messageLevel <= configLevel;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            message,
            module: meta.module,
            ...meta
        };
    }

    writeToConsole(level, message, meta = {}) {
        // if (!this.config.enableConsole) return;

        // const color = this.config.colors[level] || '#000000';
        // const timestamp = new Date().toISOString();

        // let prefix = `%c[${timestamp}] ${level}`;
        // if (meta.module) prefix += ` [${meta.module}]`;

        // const style = `color: ${color}; font-weight: bold; font-family: 'Poppins', sans-serif;`;

        // if (typeof message === 'object') {
        //     console.log(prefix, style, message, meta);
        // } else {
        //     console.log(prefix, style, message, meta);
        // }
    }

    writeToStorage(logEntry) {
        if (!this.config.enableStorage || typeof localStorage === 'undefined') return;

        try {
            this.logs.push(logEntry);

            if (this.logs.length > this.config.maxStorageEntries) {
                this.logs = this.logs.slice(-this.config.maxStorageEntries);
            }

            localStorage.setItem('battly-launcher-logs', JSON.stringify(this.logs));
        } catch (error) {
            console.warn('Failed to save log to storage:', error);
        }
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;

        const logEntry = this.formatMessage(level, message, meta);

        this.writeToConsole(level, message, meta);
        this.writeToStorage(logEntry);
    }

    error(message, meta = {}) {
        this.log('ERROR', message, meta);
    }

    warn(message, meta = {}) {
        this.log('WARN', message, meta);
    }

    info(message, meta = {}) {
        this.log('INFO', message, meta);
    }

    debug(message, meta = {}) {
        this.log('DEBUG', message, meta);
    }

    trace(message, meta = {}) {
        this.log('TRACE', message, meta);
    }

    panel(panelName, action, meta = {}) {
        this.info(`Panel ${action}`, {
            panel: panelName,
            action,
            ...meta
        });
    }

    performance(operation, duration, meta = {}) {
        this.debug(`Performance: ${operation}`, {
            operation,
            duration: `${duration}ms`,
            ...meta
        });
    }

    api(method, url, status, duration, meta = {}) {
        const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO';
        this.log(level, `API ${method} ${url}`, {
            method,
            url,
            status,
            duration: duration ? `${duration}ms` : undefined,
            ...meta
        });
    }

    user(action, username, meta = {}) {
        this.info(`User ${action}`, {
            action,
            username,
            ...meta
        });
    }

    minecraft(action, version, meta = {}) {
        this.info(`Minecraft ${action}`, {
            action,
            version,
            ...meta
        });
    }

    createModuleLogger(moduleName) {
        if (this.config.modules.has(moduleName)) {
            return this.config.modules.get(moduleName);
        }

        const moduleLogger = {
            error: (message, meta = {}) => this.error(message, { module: moduleName, ...meta }),
            warn: (message, meta = {}) => this.warn(message, { module: moduleName, ...meta }),
            info: (message, meta = {}) => this.info(message, { module: moduleName, ...meta }),
            debug: (message, meta = {}) => this.debug(message, { module: moduleName, ...meta }),
            trace: (message, meta = {}) => this.trace(message, { module: moduleName, ...meta }),
            panel: (panelName, action, meta = {}) => this.panel(panelName, action, { module: moduleName, ...meta }),
            performance: (operation, duration, meta = {}) => this.performance(operation, duration, { module: moduleName, ...meta }),
            api: (method, url, status, duration, meta = {}) => this.api(method, url, status, duration, { module: moduleName, ...meta }),
            user: (action, username, meta = {}) => this.user(action, username, { module: moduleName, ...meta }),
            minecraft: (action, version, meta = {}) => this.minecraft(action, version, { module: moduleName, ...meta })
        };

        this.config.modules.set(moduleName, moduleLogger);
        return moduleLogger;
    }

    getLogs(level = null, module = null, limit = 100) {
        let filteredLogs = this.logs;

        if (level) {
            const levelValue = this.levels[level.toUpperCase()];
            filteredLogs = filteredLogs.filter(log => this.levels[log.level] <= levelValue);
        }

        if (module) {
            filteredLogs = filteredLogs.filter(log => log.module === module);
        }

        return filteredLogs.slice(-limit);
    }

    clearLogs() {
        this.logs = [];
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('battly-launcher-logs');
        }
    }

    exportLogs() {
        const data = {
            timestamp: new Date().toISOString(),
            config: this.config,
            logs: this.logs
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `battly-launcher-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

let globalLauncherLogger = null;

function initLauncherLogger(options = {}) {
    globalLauncherLogger = new LauncherLogger(options);
    return globalLauncherLogger;
}

function getLauncherLogger() {
    if (!globalLauncherLogger) {
        globalLauncherLogger = new LauncherLogger();
    }
    return globalLauncherLogger;
}

function createPerformanceTimer(name, logger = null) {
    const log = logger || getLauncherLogger();
    const startTime = performance.now();

    return {
        end: (meta = {}) => {
            const duration = performance.now() - startTime;
            log.performance(name, Math.round(duration), meta);
            return duration;
        }
    };
}

if (typeof window !== 'undefined') {
    window.BattlyLogger = {
        LauncherLogger,
        initLauncherLogger,
        getLauncherLogger,
        createPerformanceTimer
    };
}

export {
    LauncherLogger,
    initLauncherLogger,
    getLauncherLogger,
    createPerformanceTimer
};