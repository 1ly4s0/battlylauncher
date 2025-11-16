// system-info-worker.js - Worker para obtener información del sistema sin bloquear la UI
const { parentPort, workerData } = require('worker_threads');
const os = require('os');
const fs = require('fs');
const path = require('path');

async function getSystemInfo() {
    try {
        const info = {
            // Información básica del proceso
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,

            // Información del sistema operativo
            osType: os.type(),
            osRelease: os.release(),
            osVersion: os.version?.() || 'unknown',
            hostname: os.hostname(),

            // Información de hardware
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            cpuCount: os.cpus().length,
            cpuModel: os.cpus()[0]?.model || 'unknown',
            cpuSpeed: os.cpus()[0]?.speed || 0,

            // Información de red
            networkInterfaces: Object.keys(os.networkInterfaces()),

            // Información del usuario
            userInfo: os.userInfo(),
            homeDir: os.homedir(),
            tmpDir: os.tmpdir(),

            // Tiempo de actividad
            uptime: os.uptime(),
            processUptime: process.uptime(),

            // Configuración de zona horaria
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // Variables de entorno relevantes (sin secretos)
            env: {
                NODE_ENV: process.env.NODE_ENV,
                LANG: process.env.LANG,
                LC_ALL: process.env.LC_ALL,
                PROCESSOR_ARCHITECTURE: process.env.PROCESSOR_ARCHITECTURE,
                PROCESSOR_IDENTIFIER: process.env.PROCESSOR_IDENTIFIER,
                NUMBER_OF_PROCESSORS: process.env.NUMBER_OF_PROCESSORS
            },

            // Información adicional específica de Windows
            ...(process.platform === 'win32' && {
                windowsVersion: os.release(),
                systemRoot: process.env.SystemRoot,
                programFiles: process.env.ProgramFiles
            }),

            timestamp: new Date().toISOString()
        };

        // Obtener información adicional del directorio de la aplicación
        try {
            const appPath = process.cwd();
            const packagePath = path.join(appPath, 'package.json');

            if (fs.existsSync(packagePath)) {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                info.appInfo = {
                    name: packageJson.name,
                    version: packageJson.version,
                    description: packageJson.description,
                    main: packageJson.main
                };
            }
        } catch (error) {
            console.warn('[SystemInfoWorker] Error leyendo package.json:', error.message);
        }

        // Obtener información de espacio en disco
        try {
            const stats = fs.statSync(process.cwd());
            info.diskInfo = {
                accessTime: stats.atime,
                modifyTime: stats.mtime,
                changeTime: stats.ctime,
                birthTime: stats.birthtime
            };
        } catch (error) {
            console.warn('[SystemInfoWorker] Error obteniendo info de disco:', error.message);
        }

        return info;
    } catch (error) {
        console.error('[SystemInfoWorker] Error obteniendo información del sistema:', error);

        // Información mínima de fallback
        return {
            platform: process.platform || 'unknown',
            arch: process.arch || 'unknown',
            nodeVersion: process.version || 'unknown',
            osType: 'unknown',
            totalMemory: 0,
            freeMemory: 0,
            cpuCount: 1,
            timezone: 'UTC',
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
}

// Función principal del worker
async function main() {
    try {
        console.log('[SystemInfoWorker] Iniciando recolección de información del sistema...');
        const systemInfo = await getSystemInfo();

        // Enviar resultado al hilo principal
        parentPort.postMessage({
            success: true,
            data: systemInfo
        });

        console.log('[SystemInfoWorker] Información del sistema recolectada exitosamente');
    } catch (error) {
        console.error('[SystemInfoWorker] Error fatal:', error);

        // Enviar error al hilo principal
        parentPort.postMessage({
            success: false,
            error: error.message,
            data: {
                platform: process.platform || 'unknown',
                arch: process.arch || 'unknown',
                timestamp: new Date().toISOString(),
                error: 'Worker failed'
            }
        });
    }
}

// Ejecutar worker
main().catch(error => {
    console.error('[SystemInfoWorker] Error ejecutando worker:', error);
    parentPort.postMessage({
        success: false,
        error: error.message,
        data: null
    });
});