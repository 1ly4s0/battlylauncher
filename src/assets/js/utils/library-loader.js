const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const AdmZip = require("adm-zip");

const dataDirectory =
    process.env.APPDATA ||
    (process.platform == "darwin"
        ? `${process.env.HOME}/Library/Application Support`
        : process.env.HOME);

class LibraryLoader {
    constructor() {
        this.libraryPath = path.join(dataDirectory, ".battly", "battly", "launcher", "mc");
        this.versionFilePath = path.join(this.libraryPath, "version.json");
    }

    /**
     * Descarga la librería minecraft-java-core desde la CDN de Battly
     * @param {Object} config - Configuración de BattlyConfig.libraries.package_mimbpyzw_s52o
     * @returns {Promise<string>} Ruta al módulo cargado
     */
    async loadMinecraftLibrary(config) {
        try {
            console.log("📦 Iniciando carga de minecraft-java-core...");

            // Verificar si ya está descargada y es la versión correcta
            if (await this.isLibraryUpToDate(config.version)) {
                console.log(`✅ minecraft-java-core v${config.version} ya está actualizada`);
                return this.libraryPath;
            }

        console.log(`🔄 Descargando minecraft-java-core v${config.version}...`);

        // Crear directorio si no existe
        if (!fs.existsSync(this.libraryPath)) {
            fs.mkdirSync(this.libraryPath, { recursive: true });
        }

        // Descargar el ZIP en un directorio temporal diferente
        const tempDir = path.join(dataDirectory, ".battly", "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
            const zipPath = path.join(tempDir, "minecraft-java-core.zip");
            
            // Reintentar descarga hasta 3 veces en caso de error
            let downloadSuccess = false;
            let lastError = null;
            
            for (let attempt = 1; attempt <= 3 && !downloadSuccess; attempt++) {
                try {
                    if (attempt > 1) {
                        console.log(`🔄 Reintentando descarga (intento ${attempt}/3)...`);
                        // Limpiar archivo parcial si existe
                        if (fs.existsSync(zipPath)) {
                            fs.unlinkSync(zipPath);
                        }
                    }
                    
                    await this.downloadFile(config.url, zipPath);
                    downloadSuccess = true;
                } catch (error) {
                    lastError = error;
                    console.error(`❌ Error en intento ${attempt}:`, error.message);
                    if (attempt < 3) {
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2s antes de reintentar
                    }
                }
            }
            
            if (!downloadSuccess) {
                throw new Error(`No se pudo descargar después de 3 intentos: ${lastError.message}`);
            }

            // Verificar checksum si está disponible
            if (config.sha256) {
                console.log("🔐 Verificando integridad del archivo...");
                const isValid = await this.verifyChecksum(zipPath, config.sha256);
                if (!isValid) {
                    // Limpiar archivo corrupto
                    fs.unlinkSync(zipPath);
                    throw new Error("El checksum del archivo descargado no coincide. El archivo puede estar corrupto.");
                }
                console.log("✅ Checksum verificado correctamente");
            } else {
                console.warn("⚠️ No hay checksum configurado para verificar la integridad del archivo");
            }        // Limpiar directorio anterior
        console.log("🧹 Limpiando versión anterior...");
        await this.cleanLibraryDirectory();

        // Extraer el ZIP
        console.log("📂 Extrayendo archivos...");
        await this.extractZip(zipPath, this.libraryPath);

        // Eliminar el ZIP temporal
        try {
            fs.unlinkSync(zipPath);
        } catch (error) {
            console.warn("⚠️ No se pudo eliminar el archivo temporal:", error.message);
        }            // Guardar información de versión
            await this.saveVersionInfo(config);

            console.log(`✅ minecraft-java-core v${config.version} instalada correctamente`);
            return this.libraryPath;

        } catch (error) {
            console.error("❌ Error al cargar minecraft-java-core:", error);
            throw error;
        }
    }

    /**
     * Verifica si la librería está actualizada
     * @param {string} requiredVersion - Versión requerida
     * @returns {Promise<boolean>}
     */
    async isLibraryUpToDate(requiredVersion) {
        try {
            if (!fs.existsSync(this.versionFilePath)) {
                return false;
            }

            const versionInfo = JSON.parse(fs.readFileSync(this.versionFilePath, "utf-8"));
            
            // Verificar versión
            if (versionInfo.version !== requiredVersion) {
                return false;
            }
            
            // Validar integridad de la librería
            if (!this.validateLibraryIntegrity()) {
                console.warn("⚠️ La librería está corrupta o incompleta, se descargará nuevamente");
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error al verificar versión:", error);
            return false;
        }
    }

    /**
     * Descarga un archivo desde una URL
     * @param {string} url - URL del archivo
     * @param {string} destination - Ruta de destino
     * @returns {Promise<void>}
     */
    downloadFile(url, destination) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destination);
            let fileWriteError = null;

            file.on('error', (error) => {
                fileWriteError = error;
                file.close();
                fs.unlinkSync(destination).catch(() => {});
                reject(error);
            });
            
            https.get(url, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Seguir redirecciones
                    file.close();
                    fs.unlinkSync(destination).catch(() => {});
                    return this.downloadFile(response.headers.location, destination)
                        .then(resolve)
                        .catch(reject);
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(destination).catch(() => {});
                    reject(new Error(`Error al descargar: HTTP ${response.statusCode}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'], 10);
                let downloadedSize = 0;

                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
                    process.stdout.write(`\r📥 Descargando: ${progress}%`);
                });

                response.on('error', (error) => {
                    file.close();
                    fs.unlinkSync(destination).catch(() => {});
                    reject(error);
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close((err) => {
                        if (err || fileWriteError) {
                            fs.unlinkSync(destination).catch(() => {});
                            reject(err || fileWriteError);
                        } else {
                            console.log("\n✅ Descarga completada");
                            
                            // Verificar que el archivo se escribió correctamente
                            if (!fs.existsSync(destination)) {
                                reject(new Error("El archivo no se guardó correctamente"));
                            } else {
                                const stats = fs.statSync(destination);
                                console.log(`📦 Tamaño del archivo descargado: ${stats.size} bytes`);
                                resolve();
                            }
                        }
                    });
                });

            }).on('error', (error) => {
                file.close();
                fs.unlinkSync(destination).catch(() => {});
                reject(error);
            });
        });
    }

    /**
     * Verifica el checksum SHA256 de un archivo
     * @param {string} filePath - Ruta del archivo
     * @param {string} expectedHash - Hash esperado
     * @returns {Promise<boolean>}
     */
    verifyChecksum(filePath, expectedHash) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => {
                const fileHash = hash.digest('hex');
                resolve(fileHash === expectedHash);
            });
            stream.on('error', reject);
        });
    }

    /**
     * Extrae un archivo ZIP
     * @param {string} zipPath - Ruta del ZIP
     * @param {string} destination - Ruta de destino
     * @returns {Promise<void>}
     */
    extractZip(zipPath, destination) {
        return new Promise((resolve, reject) => {
            try {
                // Verificar que el archivo existe y es válido
                if (!fs.existsSync(zipPath)) {
                    return reject(new Error(`El archivo ZIP no existe: ${zipPath}`));
                }

                // Verificar que el archivo no está vacío
                const stats = fs.statSync(zipPath);
                if (stats.size === 0) {
                    return reject(new Error(`El archivo ZIP está vacío: ${zipPath}`));
                }

                console.log(`📂 Extrayendo ZIP de ${stats.size} bytes desde: ${zipPath}`);
                
                const zip = new AdmZip(zipPath);
                const entries = zip.getEntries();
                
                console.log(`📦 El ZIP contiene ${entries.length} archivos`);
                
                // Verificar si hay una carpeta raíz común
                let rootFolder = null;
                if (entries.length > 0) {
                    const firstEntry = entries[0].entryName;
                    const parts = firstEntry.split('/');
                    if (parts.length > 1) {
                        // Verificar si todos los archivos están en la misma carpeta raíz
                        const possibleRoot = parts[0];
                        const allInRoot = entries.every(e => e.entryName.startsWith(possibleRoot + '/'));
                        if (allInRoot) {
                            rootFolder = possibleRoot;
                            console.log(`📁 Detectada carpeta raíz en ZIP: ${rootFolder}`);
                        }
                    }
                }
                
                // Extraer
                if (rootFolder) {
                    // Si hay carpeta raíz, extraer saltándola
                    console.log(`📂 Extrayendo sin la carpeta raíz "${rootFolder}"...`);
                    entries.forEach(entry => {
                        if (entry.entryName.startsWith(rootFolder + '/')) {
                            const relativePath = entry.entryName.substring(rootFolder.length + 1);
                            if (relativePath && !entry.isDirectory) {
                                const targetPath = path.join(destination, relativePath);
                                const targetDir = path.dirname(targetPath);
                                
                                if (!fs.existsSync(targetDir)) {
                                    fs.mkdirSync(targetDir, { recursive: true });
                                }
                                
                                fs.writeFileSync(targetPath, entry.getData());
                            }
                        }
                    });
                } else {
                    // No hay carpeta raíz, extraer normalmente
                    zip.extractAllTo(destination, true);
                }
                
                console.log(`✅ Extracción completada en: ${destination}`);
                
                // Verificar que package.json existe
                const packageJsonPath = path.join(destination, "package.json");
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
                    const mainFile = packageJson.main || "Index.js";
                    const indexPath = path.join(destination, mainFile);
                    
                    if (fs.existsSync(indexPath)) {
                        console.log(`✅ Archivo principal encontrado: ${mainFile}`);
                    } else {
                        console.error(`❌ Archivo principal NO encontrado: ${mainFile}`);
                        console.log(`📁 Contenido del directorio de destino:`);
                        const files = fs.readdirSync(destination);
                        files.forEach(f => console.log(`  - ${f}`));
                    }
                } else {
                    console.error(`❌ package.json NO encontrado en: ${packageJsonPath}`);
                    console.log(`📁 Contenido del directorio de destino:`);
                    const files = fs.readdirSync(destination);
                    files.forEach(f => console.log(`  - ${f}`));
                }
                
                resolve();
            } catch (error) {
                console.error(`❌ Error durante la extracción:`, error);
                reject(error);
            }
        });
    }

    /**
     * Limpia el directorio de la librería (excepto version.json)
     * @returns {Promise<void>}
     */
    async cleanLibraryDirectory() {
        if (!fs.existsSync(this.libraryPath)) {
            return;
        }

        const files = fs.readdirSync(this.libraryPath);
        for (const file of files) {
            if (file !== "version.json") {
                const filePath = path.join(this.libraryPath, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
                }
            }
        }
    }

    /**
     * Guarda información de la versión instalada
     * @param {Object} config - Configuración de la librería
     * @returns {Promise<void>}
     */
    async saveVersionInfo(config) {
        const versionInfo = {
            version: config.version,
            installedAt: new Date().toISOString(),
            url: config.url,
            sha256: config.sha256
        };

        fs.writeFileSync(
            this.versionFilePath,
            JSON.stringify(versionInfo, null, 2),
            "utf-8"
        );
    }

    /**
     * Valida la integridad de la librería instalada
     * @returns {boolean} true si la librería está completa y válida
     */
    validateLibraryIntegrity() {
        try {
            // Verificar estructura básica
            const requiredFiles = ['package.json'];
            const requiredDirs = ['build'];
            
            for (const file of requiredFiles) {
                const filePath = path.join(this.libraryPath, file);
                if (!fs.existsSync(filePath)) {
                    console.error(`❌ Archivo requerido faltante: ${file}`);
                    return false;
                }
            }
            
            for (const dir of requiredDirs) {
                const dirPath = path.join(this.libraryPath, dir);
                if (!fs.existsSync(dirPath)) {
                    console.error(`❌ Directorio requerido faltante: ${dir}`);
                    return false;
                }
            }
            
            // Verificar package.json válido
            try {
                const packageJson = JSON.parse(fs.readFileSync(path.join(this.libraryPath, "package.json"), "utf-8"));
                if (!packageJson.main) {
                    console.error("❌ package.json no tiene campo 'main'");
                    return false;
                }
                
                // Verificar que el archivo main existe
                const mainPath = path.join(this.libraryPath, packageJson.main);
                if (!fs.existsSync(mainPath)) {
                    console.error(`❌ Archivo principal no existe: ${packageJson.main}`);
                    return false;
                }
            } catch (error) {
                console.error("❌ Error al leer package.json:", error.message);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("❌ Error al validar integridad:", error);
            return false;
        }
    }

    /**
     * Carga el módulo minecraft-java-core
     * @returns {Object} Módulo cargado
     */
    requireMinecraftLibrary() {
        // Leer el package.json para obtener el punto de entrada
        const packageJsonPath = path.join(this.libraryPath, "package.json");
        
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error("minecraft-java-core no está instalada. No se encontró package.json. Intenta reiniciar Battly.");
        }

        let packageJson;
        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        } catch (error) {
            throw new Error(`Error al leer package.json: ${error.message}. La librería puede estar corrupta.`);
        }

        const mainFile = packageJson.main || "Index.js";
        const indexPath = path.join(this.libraryPath, mainFile);
        
        console.log(`📦 Punto de entrada de la librería: ${mainFile}`);
        
        if (!fs.existsSync(indexPath)) {
            throw new Error(`minecraft-java-core: No se encontró el archivo principal en ${indexPath}. La instalación puede estar incompleta.`);
        }
        
        // Verificar integridad básica de la librería
        const requiredDirs = ['build'];
        const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(this.libraryPath, dir)));
        if (missingDirs.length > 0) {
            console.warn(`⚠️ Advertencia: Directorios faltantes en la librería: ${missingDirs.join(', ')}`);
        }

        // Agregar las rutas de node_modules de Battly a las rutas de búsqueda
        const possibleNodeModulesPaths = [
            path.join(process.cwd(), "node_modules"),
            path.join(__dirname, "..", "..", "..", "..", "node_modules"), // Relativo a library-loader.js
            path.join(__dirname, "..", "..", "..", "..", "..", "node_modules"),
        ];

        // Agregar rutas que existen
        possibleNodeModulesPaths.forEach(nmPath => {
            if (fs.existsSync(nmPath) && !module.paths.includes(nmPath)) {
                module.paths.unshift(nmPath);
                console.log(`📚 Agregada ruta de node_modules: ${nmPath}`);
            }
        });

        // Limpiar cache de require por si hay una versión anterior
        if (require.cache[require.resolve(indexPath)]) {
            delete require.cache[require.resolve(indexPath)];
        }
        
        console.log("📚 Cargando minecraft-java-core con acceso a node_modules de Battly");
        
        return require(indexPath);
    }
}

// Singleton para reutilizar en toda la aplicación
let libraryLoaderInstance = null;

function getLibraryLoader() {
    if (!libraryLoaderInstance) {
        libraryLoaderInstance = new LibraryLoader();
    }
    return libraryLoaderInstance;
}

/**
 * Función de ayuda para cargar la librería minecraft-java-core
 * @param {Object} battlyConfig - Configuración de Battly (debe tener libraries.package_mimbpyzw_s52o)
 * @param {Object} options - Opciones adicionales { offlineMode: boolean }
 * @returns {Promise<Object>} Módulo cargado con Launch, Microsoft, Mojang, etc.
 */
async function loadMinecraftJavaCore(battlyConfig, options = {}) {
    const loader = getLibraryLoader();
    const libraryConfig = battlyConfig.libraries.package_mimbpyzw_s52o;
    
    try {
        await loader.loadMinecraftLibrary(libraryConfig);
        return loader.requireMinecraftLibrary();
    } catch (error) {
        // Si falla la descarga y hay una versión local, intentar usarla (modo offline)
        if (options.offlineMode || error.message.includes("descarga")) {
            console.warn("⚠️ No se pudo actualizar la librería, intentando usar versión local...");
            try {
                return loader.requireMinecraftLibrary();
            } catch (localError) {
                throw new Error(`No se pudo cargar minecraft-java-core: ${error.message}. Modo offline falló: ${localError.message}`);
            }
        }
        throw error;
    }
}

module.exports = { LibraryLoader, getLibraryLoader, loadMinecraftJavaCore };
