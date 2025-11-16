"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const events_1 = __importDefault(require("events"));
const node_7z_1 = __importDefault(require("node-7z"));
const _7zip_bin_1 = __importDefault(require("7zip-bin"));
const Index_js_1 = require("../utils/Index.js");
const Downloader_js_1 = __importDefault(require("../utils/Downloader.js"));
/**
 * Manages the download and extraction of the correct Java runtime for Minecraft.
 * It supports both Mojang's curated list of Java runtimes and the Adoptium fallback.
 */
class JavaDownloader extends events_1.default {
    constructor(options) {
        super();
        this.options = options;
    }
    /**
     * Retrieves Java files from Mojang's runtime metadata if possible,
     * otherwise falls back to getJavaOther().
     *
     * @param jsonversion A JSON object describing the Minecraft version (with optional javaVersion).
     * @returns An object containing a list of JavaFileItems and the final path to "java".
     */
    async getJavaFiles(jsonversion) {
        // If a specific version is forced, delegate to getJavaOther() immediately
        if (this.options.java.version) {
            return this.getJavaOther(jsonversion, this.options.java.version);
        }
        // OS-to-architecture mapping for Mojang's curated Java.
        const archMapping = {
            win32: { x64: 'windows-x64', ia32: 'windows-x86', arm64: 'windows-arm64' },
            darwin: { x64: 'mac-os', arm64: this.options.intelEnabledMac ? 'mac-os' : 'mac-os-arm64' },
            linux: { x64: 'linux', ia32: 'linux-i386' }
        };
        const osPlatform = os_1.default.platform(); // "win32", "darwin", "linux", ...
        const arch = os_1.default.arch(); // "x64", "arm64", "ia32", ...
        const javaVersionName = jsonversion.javaVersion?.component || 'jre-legacy';
        const osArchMapping = archMapping[osPlatform];
        const files = [];
        // If we don't have a valid mapping for the current OS, fallback to Adoptium
        if (!osArchMapping) {
            return this.getJavaOther(jsonversion);
        }
        // Determine the OS-specific identifier
        const archOs = osArchMapping[arch];
        if (!archOs) {
            // If we can't match the arch in the sub-object, fallback
            return this.getJavaOther(jsonversion);
        }
        // Determine cache path for Java runtime metadata
        const cachePath = path_1.default.join(this.options.path, 'mc-assets', 'java-runtime-all.json');
        let javaVersionsJson;
        // Try to fetch from Mojang first
        try {
            const response = await fetch('https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json');
            javaVersionsJson = await response.json();
            // Cache the fetched data
            fs_1.default.mkdirSync(path_1.default.dirname(cachePath), { recursive: true });
            fs_1.default.writeFileSync(cachePath, JSON.stringify(javaVersionsJson, null, 2));
        }
        catch (err) {
            // If online fetch fails, try to use cached data
            if (fs_1.default.existsSync(cachePath)) {
                try {
                    javaVersionsJson = JSON.parse(fs_1.default.readFileSync(cachePath, 'utf-8'));
                }
                catch (cacheErr) {
                    // If cache is corrupted, fallback to Adoptium
                    return this.getJavaOther(jsonversion);
                }
            }
            else {
                // If no cache available, fallback to Adoptium
                return this.getJavaOther(jsonversion);
            }
        }
        const versionName = javaVersionsJson[archOs]?.[javaVersionName]?.[0]?.version?.name;
        if (!versionName) {
            return this.getJavaOther(jsonversion);
        }
        // Fetch the runtime manifest which lists individual files
        const manifestUrl = javaVersionsJson[archOs][javaVersionName][0]?.manifest?.url;
        let manifest;
        try {
            manifest = await fetch(manifestUrl).then(res => res.json());
            // Cache the fetched data
            const manifestPath = path_1.default.join(this.options.path, 'mc-assets', 'java-runtime-all-manifest-' + versionName + '.json');
            fs_1.default.mkdirSync(path_1.default.dirname(manifestPath), { recursive: true });
            fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        }
        catch (err) {
            // If online fetch fails, try to use cached data
            const manifestPath = path_1.default.join(this.options.path, 'mc-assets', 'java-runtime-all-manifest-' + versionName + '.json');
            if (fs_1.default.existsSync(manifestPath)) {
                try {
                    manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
                }
                catch (cacheErr) {
                    // If cache is corrupted, fallback to Adoptium
                    return this.getJavaOther(jsonversion);
                }
            }
            else {
                // If no cache available, fallback to Adoptium
                return this.getJavaOther(jsonversion);
            }
        }
        const manifestEntries = Object.entries(manifest.files);
        // Identify the Java executable in the manifest
        const javaExeKey = process.platform === 'win32' ? 'bin/javaw.exe' : 'bin/java';
        const javaEntry = manifestEntries.find(([relPath]) => relPath.endsWith(javaExeKey));
        if (!javaEntry) {
            // If we can't find the executable, fallback
            return this.getJavaOther(jsonversion);
        }
        const toDelete = javaEntry[0].replace(javaExeKey, '');
        for (const [relPath, info] of manifestEntries) {
            if (info.type === 'directory')
                continue;
            if (!info.downloads)
                continue;
            files.push({
                path: `runtime/jre-${versionName}-${archOs}/${relPath.replace(toDelete, '')}`,
                executable: info.executable,
                sha1: info.downloads.raw.sha1,
                size: info.downloads.raw.size,
                url: info.downloads.raw.url,
                type: 'Java'
            });
        }
        return {
            files,
            path: path_1.default.resolve(this.options.path, `runtime/jre-${versionName}-${archOs}`, 'bin', process.platform === 'win32' ? 'javaw.exe' : 'java')
        };
    }
    /**
     * Fallback method to download Java from Adoptium if Mojang's metadata is unavailable
     * or doesn't have the appropriate runtime for the user's platform/arch.
     *
     * @param jsonversion A Minecraft version JSON (with optional javaVersion).
     * @param versionDownload A forced Java version (string) if provided by the user.
     */
    async getJavaOther(jsonversion, versionDownload) {
        // Determine which major version of Java we need
        const majorVersion = versionDownload || jsonversion.javaVersion?.majorVersion || 8;
        const { platform, arch } = this.getPlatformArch();
        // Build the Adoptium API URL
        const queryParams = new URLSearchParams({
            image_type: this.options.java.type, // e.g. "jdk" or "jre"
            architecture: arch,
            os: platform
        });
        const javaVersionURL = `https://api.adoptium.net/v3/assets/latest/${majorVersion}/hotspot?${queryParams.toString()}`;
        const javaVersions = await fetch(javaVersionURL).then(res => res.json());
        // If no valid version is found, return an error
        const java = javaVersions[0];
        if (!java) {
            return { files: [], path: '', error: true, message: 'No Java found' };
        }
        const { checksum, link: url, name: fileName } = java.binary.package;
        const pathFolder = path_1.default.resolve(this.options.path, `runtime/jre-${majorVersion}`);
        const filePath = path_1.default.join(pathFolder, fileName);
        // Determine the final path to the java executable after extraction
        let javaExePath = path_1.default.join(pathFolder, 'bin', 'java');
        if (platform === 'mac') {
            javaExePath = path_1.default.join(pathFolder, 'Contents', 'Home', 'bin', 'java');
        }
        // Download and extract if needed
        if (!fs_1.default.existsSync(javaExePath)) {
            await this.verifyAndDownloadFile({
                filePath,
                pathFolder,
                fileName,
                url,
                checksum
            });
            // Extract the downloaded archive
            await this.extract(filePath, pathFolder);
            fs_1.default.unlinkSync(filePath);
            // For .tar.gz files, we may need a second extraction step
            if (filePath.endsWith('.tar.gz')) {
                const tarFilePath = filePath.replace('.gz', '');
                await this.extract(tarFilePath, pathFolder);
                if (fs_1.default.existsSync(tarFilePath)) {
                    fs_1.default.unlinkSync(tarFilePath);
                }
            }
            // If there's only one folder extracted, move its contents up
            const extractedItems = fs_1.default.readdirSync(pathFolder);
            if (extractedItems.length === 1) {
                const singleFolder = path_1.default.join(pathFolder, extractedItems[0]);
                const stat = fs_1.default.statSync(singleFolder);
                if (stat.isDirectory()) {
                    const subItems = fs_1.default.readdirSync(singleFolder);
                    for (const item of subItems) {
                        const srcPath = path_1.default.join(singleFolder, item);
                        const destPath = path_1.default.join(pathFolder, item);
                        fs_1.default.renameSync(srcPath, destPath);
                    }
                    fs_1.default.rmdirSync(singleFolder);
                }
            }
            // Ensure the Java executable is marked as executable on non-Windows systems
            if (platform !== 'windows') {
                fs_1.default.chmodSync(javaExePath, 0o755);
            }
        }
        return { files: [], path: javaExePath };
    }
    /**
     * Maps the Node `os.platform()` and `os.arch()` to Adoptium's expected format.
     * Apple Silicon can optionally download x64 if `intelEnabledMac` is true.
     */
    getPlatformArch() {
        const platformMap = {
            win32: 'windows',
            darwin: 'mac',
            linux: 'linux'
        };
        const archMap = {
            x64: 'x64',
            ia32: 'x32',
            arm64: 'aarch64',
            arm: 'arm'
        };
        const mappedPlatform = platformMap[os_1.default.platform()] || os_1.default.platform();
        let mappedArch = archMap[os_1.default.arch()] || os_1.default.arch();
        // Force x64 if Apple Silicon but user wants to use Intel-based Java
        if (os_1.default.platform() === 'darwin' && os_1.default.arch() === 'arm64' && this.options.intelEnabledMac) {
            mappedArch = 'x64';
        }
        return { platform: mappedPlatform, arch: mappedArch };
    }
    /**
     * Verifies if the Java archive already exists and matches the expected checksum.
     * If it doesn't exist or fails the hash check, it downloads from the given URL.
     *
     * @param params.filePath   The local file path
     * @param params.pathFolder The folder to place the file in
     * @param params.fileName   The name of the file
     * @param params.url        The remote download URL
     * @param params.checksum   Expected SHA-256 hash
     */
    async verifyAndDownloadFile({ filePath, pathFolder, fileName, url, checksum }) {
        // If the file already exists, check its integrity
        if (fs_1.default.existsSync(filePath)) {
            const existingChecksum = await (0, Index_js_1.getFileHash)(filePath, 'sha256');
            if (existingChecksum !== checksum) {
                fs_1.default.unlinkSync(filePath);
                fs_1.default.rmSync(pathFolder, { recursive: true, force: true });
            }
        }
        // If not found or failed checksum, download anew
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.mkdirSync(pathFolder, { recursive: true });
            const download = new Downloader_js_1.default();
            // Relay progress events
            download.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, fileName);
            });
            // Start download
            await download.downloadFile(url, pathFolder, fileName);
        }
        // Final verification of the downloaded file
        const downloadedChecksum = await (0, Index_js_1.getFileHash)(filePath, 'sha256');
        if (downloadedChecksum !== checksum) {
            throw new Error('Java checksum failed');
        }
    }
    /**
     * Extracts the given archive (ZIP or 7Z), using the `node-7z` library and the system's 7z binary.
     * Emits an "extract" event with the extraction progress (percent).
     *
     * @param filePath  Path to the archive file
     * @param destPath  Destination folder to extract into
     */
    async extract(filePath, destPath) {
        // Ensure the 7z binary is executable on Unix-like OSes
        if (os_1.default.platform() !== 'win32') {
            fs_1.default.chmodSync(_7zip_bin_1.default.path7za, 0o755);
        }
        return new Promise((resolve, reject) => {
            const extractor = node_7z_1.default.extractFull(filePath, destPath, {
                $bin: _7zip_bin_1.default.path7za,
                recursive: true,
                $progress: true
            });
            extractor.on('end', () => resolve());
            extractor.on('error', (err) => reject(err));
            extractor.on('progress', (progress) => {
                if (progress.percent > 0) {
                    this.emit('extract', progress.percent);
                }
            });
        });
    }
}
exports.default = JavaDownloader;
//# sourceMappingURL=Minecraft-Java.js.map