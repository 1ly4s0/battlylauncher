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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
const Index_js_1 = require("../../../utils/Index.js");
const Downloader_js_1 = __importDefault(require("../../../utils/Downloader.js"));
const ZipErrorHandler_js_1 = require("../../../utils/ZipErrorHandler.js");
const patcher_js_1 = __importDefault(require("../../patcher.js"));
/**
 * This class handles downloading and installing NeoForge (formerly Forge) for Minecraft,
 * including picking the correct build, extracting libraries, and running patchers if needed.
 */
class NeoForgeMC extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }
    /**
     * Enhanced wrapper around getFileFromArchiveWithRecovery specifically for NeoForge installer JARs.
     * Automatically provides multiple recovery methods if the installer JAR is corrupted.
     */
    async safeExtractFromInstaller(installerPath, file = null, prefix = null) {
        try {
            return await (0, Index_js_1.getFileFromArchiveWithRecovery)(installerPath, file, prefix, this.installerUrl // Use stored installer URL for redownload
            );
        }
        catch (error) {
            // Enhanced error handling for NeoForge-specific issues
            if (error.message.includes('Invalid or unsupported zip format') ||
                error.message.includes('No END header found') ||
                error.message.includes('Invalid CEN header')) {
                console.log(`🔧 NeoForge installer JAR is corrupted: ${path_1.default.basename(installerPath)}`);
                console.log(`Attempting enhanced recovery using multiple sources...`);
                try {
                    // Extract version from the installer path
                    const fileName = path_1.default.basename(installerPath);
                    const versionMatch = fileName.match(/neoforge-(.+?)-installer\.jar/i);
                    const version = versionMatch ? versionMatch[1] : this.options.loader.build;
                    // Use the enhanced recovery method
                    await ZipErrorHandler_js_1.ZipErrorHandler.recoverNeoForgeInstaller(installerPath, version, this.installerUrl);
                    console.log(`✅ NeoForge installer recovered successfully`);
                    // Retry the extraction with the recovered file
                    return await (0, Index_js_1.getFileFromArchiveWithRecovery)(installerPath, file, prefix, this.installerUrl);
                }
                catch (recoveryError) {
                    console.error(`❌ Failed to recover NeoForge installer: ${recoveryError.message}`);
                    this.emit('error', `NeoForge installer JAR is corrupted and cannot be recovered: ${installerPath}`);
                    throw recoveryError;
                }
            }
            // Re-throw other errors
            throw error;
        }
    }
    /**
     * Downloads the NeoForge installer jar for the specified version and build,
     * either using a legacy API or the newer metaData approach. If "latest" or "recommended"
     * is specified, it picks the newest build from the filtered list.
     *
     * @param Loader An object containing URLs and patterns for legacy and new metadata/installers.
     * @returns      An object with filePath and oldAPI fields, or an error.
     */
    async downloadInstaller(Loader) {
        let build;
        let neoForgeURL;
        let oldAPI = true;
        // Try to fetch metadata from online source first, then fallback to local cache
        const metaPath = path_1.default.join(this.options.path, 'mc-assets', 'neoforge-meta.json');
        let legacyMetaData;
        let metaData;
        try {
            const legacyResponse = await fetch(Loader.legacyMetaData);
            legacyMetaData = await legacyResponse.json();
            const metaResponse = await fetch(Loader.metaData);
            metaData = await metaResponse.json();
            fs_1.default.mkdirSync(path_1.default.dirname(metaPath), { recursive: true });
            fs_1.default.writeFileSync(metaPath, JSON.stringify({ legacy: legacyMetaData, meta: metaData }, null, 4));
        }
        catch (error) {
            // Fetch failed; attempt loading from local cache
            const cachedData = JSON.parse(fs_1.default.readFileSync(metaPath, 'utf-8'));
            legacyMetaData = cachedData.legacy;
            metaData = cachedData.meta;
        }
        // Filter versions for the specified Minecraft version
        let versions = legacyMetaData.versions.filter((v) => v.includes(`${this.options.loader.version}-`));
        // If none found, fallback to the new API approach
        if (!versions.length) {
            const splitted = this.options.loader.version.split('.');
            const shortVersion = `${splitted[1]}.${splitted[2] || 0}`;
            versions = metaData.versions.filter((v) => v.startsWith(shortVersion));
            oldAPI = false;
        }
        // If still no versions found, return an error
        if (!versions.length) {
            return { error: `NeoForge doesn't support Minecraft ${this.options.loader.version}` };
        }
        // Determine which build to use
        if (this.options.loader.build === 'latest' || this.options.loader.build === 'recommended') {
            build = versions[versions.length - 1]; // The most recent build
        }
        else {
            build = versions.find(v => v === this.options.loader.build);
        }
        if (!build) {
            return {
                error: `NeoForge Loader ${this.options.loader.build} not found, Available builds: ${versions.join(', ')}`
            };
        }
        // Build the installer URL, depending on whether we use the legacy or new API
        if (oldAPI) {
            neoForgeURL = Loader.legacyInstall.replaceAll(/\${version}/g, build);
        }
        else {
            neoForgeURL = Loader.install.replaceAll(/\${version}/g, build);
        }
        // Create a local folder for "neoForge" if it doesn't exist
        const neoForgeFolder = path_1.default.resolve(this.options.path, 'neoForge');
        const installerFilePath = path_1.default.resolve(neoForgeFolder, `neoForge-${build}-installer.jar`);
        if (!fs_1.default.existsSync(installerFilePath)) {
            if (!fs_1.default.existsSync(neoForgeFolder)) {
                fs_1.default.mkdirSync(neoForgeFolder, { recursive: true });
            }
            const downloader = new Downloader_js_1.default();
            downloader.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, `neoForge-${build}-installer.jar`);
            });
            await downloader.downloadFile(neoForgeURL, neoForgeFolder, `neoForge-${build}-installer.jar`);
        }
        // Store the installer URL for potential redownload
        this.installerUrl = neoForgeURL;
        return { filePath: installerFilePath, oldAPI };
    }
    /**
     * Extracts the main JSON profile (install_profile.json) from the NeoForge installer.
     * If the JSON references an additional file, it also extracts and parses that, returning
     * a unified object with `install` and `version` keys.
     *
     * @param pathInstaller Full path to the downloaded NeoForge installer jar.
     * @returns A NeoForgeProfile object, or an error if invalid.
     */
    async extractProfile(pathInstaller) {
        const fileContent = await this.safeExtractFromInstaller(pathInstaller, 'install_profile.json');
        if (!fileContent) {
            return { error: { message: 'Invalid neoForge installer' } };
        }
        const neoForgeJsonOrigin = JSON.parse(fileContent.toString());
        if (!neoForgeJsonOrigin) {
            return { error: { message: 'Invalid neoForge installer' } };
        }
        const result = { data: {} };
        if (neoForgeJsonOrigin.install) {
            result.install = neoForgeJsonOrigin.install;
            result.version = neoForgeJsonOrigin.versionInfo;
        }
        else {
            result.install = neoForgeJsonOrigin;
            const extraFile = await this.safeExtractFromInstaller(pathInstaller, path_1.default.basename(result.install.json));
            if (extraFile) {
                result.version = JSON.parse(extraFile.toString());
            }
            else {
                return { error: { message: 'Unable to read additional JSON from neoForge installer' } };
            }
        }
        return result;
    }
    /**
     * Extracts the universal jar or associated files for NeoForge into the local "libraries" directory.
     * Also handles client.lzma if processors are present. Returns a boolean indicating whether we skip
     * certain neoforge libraries in subsequent steps.
     *
     * @param profile    The extracted NeoForge profile with file path references
     * @param pathInstaller Path to the NeoForge installer
     * @param oldAPI     Whether we are dealing with the old or new NeoForge API (affects library naming)
     * @returns          A boolean indicating if we should filter out certain libraries afterwards
     */
    async extractUniversalJar(profile, pathInstaller, oldAPI) {
        let skipNeoForgeFilter = true;
        if (profile.filePath) {
            const fileInfo = (0, Index_js_1.getPathLibraries)(profile.path);
            this.emit('extract', `Extracting ${fileInfo.name}...`);
            const destFolder = path_1.default.resolve(this.options.path, 'libraries', fileInfo.path);
            if (!fs_1.default.existsSync(destFolder)) {
                fs_1.default.mkdirSync(destFolder, { recursive: true });
            }
            const archiveContent = await this.safeExtractFromInstaller(pathInstaller, profile.filePath);
            if (archiveContent) {
                fs_1.default.writeFileSync(path_1.default.join(destFolder, fileInfo.name), archiveContent, { mode: 0o777 });
            }
        }
        else if (profile.path) {
            const fileInfo = (0, Index_js_1.getPathLibraries)(profile.path);
            const filesInArchive = await this.safeExtractFromInstaller(pathInstaller, null, `maven/${fileInfo.path}`);
            if (filesInArchive && Array.isArray(filesInArchive)) {
                for (const file of filesInArchive) {
                    const fileName = path_1.default.basename(file);
                    this.emit('extract', `Extracting ${fileName}...`);
                    const content = await this.safeExtractFromInstaller(pathInstaller, file);
                    if (!content)
                        continue;
                    const destFolder = path_1.default.resolve(this.options.path, 'libraries', fileInfo.path);
                    if (!fs_1.default.existsSync(destFolder)) {
                        fs_1.default.mkdirSync(destFolder, { recursive: true });
                    }
                    fs_1.default.writeFileSync(path_1.default.join(destFolder, fileName), content, { mode: 0o777 });
                }
            }
        }
        else {
            // If no direct reference, do not skip the library filtering
            skipNeoForgeFilter = false;
        }
        // If processors exist, we likely need to store client.lzma
        if (profile.processors?.length) {
            const universalPath = profile.libraries?.find(lib => (lib.name || '').startsWith(oldAPI ? 'net.neoforged:forge' : 'net.neoforged:neoforge'));
            const clientData = await this.safeExtractFromInstaller(pathInstaller, 'data/client.lzma');
            if (clientData) {
                const fileInfo = (0, Index_js_1.getPathLibraries)(profile.path || universalPath.name, '-clientdata', '.lzma');
                const destFolder = path_1.default.resolve(this.options.path, 'libraries', fileInfo.path);
                if (!fs_1.default.existsSync(destFolder)) {
                    fs_1.default.mkdirSync(destFolder, { recursive: true });
                }
                fs_1.default.writeFileSync(path_1.default.join(destFolder, fileInfo.name), clientData, { mode: 0o777 });
                this.emit('extract', `Extracting ${fileInfo.name}...`);
            }
        }
        return skipNeoForgeFilter;
    }
    /**
     * Downloads all libraries referenced in the NeoForge profile. If skipNeoForgeFilter is true,
     * certain core libraries are excluded. Checks for duplicates and local existence before downloading.
     *
     * @param profile           The NeoForge profile containing version/install libraries
     * @param skipNeoForgeFilter Whether we skip specific "net.minecraftforge:neoforged" libs
     * @returns An array of library objects after download, or an error object if something fails
     */
    async downloadLibraries(profile, skipNeoForgeFilter) {
        let libraries = profile.version?.libraries || [];
        const dl = new Downloader_js_1.default();
        let checkCount = 0;
        const pendingFiles = [];
        let totalSize = 0;
        // Combine install.libraries with version.libraries
        if (profile.install?.libraries) {
            libraries = libraries.concat(profile.install.libraries);
        }
        // Remove duplicates by 'name'
        libraries = libraries.filter((lib, index, self) => index === self.findIndex(item => item.name === lib.name));
        // If skipping certain neoforge libs
        const skipNeoForge = ['net.minecraftforge:neoforged:', 'net.minecraftforge:minecraftforge:'];
        // Evaluate each library
        for (const lib of libraries) {
            if (skipNeoForgeFilter && skipNeoForge.some(str => lib.name.includes(str))) {
                // If there's no valid artifact URL, skip it
                if (!lib.downloads?.artifact?.url) {
                    this.emit('check', checkCount++, libraries.length, 'libraries');
                    continue;
                }
            }
            // If the library has rules, skip automatically
            if (lib.rules) {
                this.emit('check', checkCount++, libraries.length, 'libraries');
                continue;
            }
            // Construct the local path to the library
            const libInfo = (0, Index_js_1.getPathLibraries)(lib.name);
            const libFolder = path_1.default.resolve(this.options.path, 'libraries', libInfo.path);
            const libFilePath = path_1.default.resolve(libFolder, libInfo.name);
            // If it doesn't exist locally, schedule for download
            if (!fs_1.default.existsSync(libFilePath)) {
                let finalURL = null;
                let fileSize = 0;
                // Attempt to resolve via mirror first
                const baseURL = `${libInfo.path}/${libInfo.name}`;
                const mirrorCheck = await dl.checkMirror(baseURL, Index_js_1.mirrors);
                if (mirrorCheck && typeof mirrorCheck === 'object' && 'status' in mirrorCheck && mirrorCheck.status === 200) {
                    finalURL = mirrorCheck.url;
                    fileSize = mirrorCheck.size;
                    totalSize += fileSize;
                }
                else if (lib.downloads?.artifact) {
                    finalURL = lib.downloads.artifact.url;
                    fileSize = lib.downloads.artifact.size;
                    totalSize += fileSize;
                }
                if (!finalURL) {
                    return { error: `Impossible to download ${libInfo.name}` };
                }
                pendingFiles.push({
                    url: finalURL,
                    folder: libFolder,
                    path: libFilePath,
                    name: libInfo.name,
                    size: fileSize
                });
            }
            this.emit('check', checkCount++, libraries.length, 'libraries');
        }
        // Download all pending files
        if (pendingFiles.length > 0) {
            dl.on('progress', (downloaded, totDL) => {
                this.emit('progress', downloaded, totDL, 'libraries');
            });
            await dl.downloadFileMultiple(pendingFiles, totalSize, this.options.downloadFileMultiple);
        }
        return libraries;
    }
    /**
     * Runs the NeoForge patch process, if any processors exist. Checks if patching is needed,
     * then uses the `NeoForgePatcher` class. If the patch is already applied, it skips.
     *
     * @param profile The NeoForge profile, which may include processors.
     * @param oldAPI  Whether we are dealing with the old or new API (passed to the patcher).
     * @returns       True on success or if no patch was needed.
     */
    async patchneoForge(profile, oldAPI) {
        if (profile?.processors?.length) {
            const patcher = new patcher_js_1.default(this.options);
            // Relay events with enhanced error handling
            patcher.on('patch', (data) => {
                this.emit('patch', data);
            });
            patcher.on('error', (error) => {
                // Ensure we're working with an Error object
                const errorObj = error instanceof Error ? error : new Error(error.toString());
                console.error('Patcher error:', errorObj.message);
                // Only emit the error if there are listeners to prevent unhandled errors
                if (this.listenerCount('error') > 0) {
                    this.emit('error', errorObj);
                }
                else {
                    console.error('No error listeners attached. Error details:', errorObj.message);
                    // Optionally, you could throw here instead of just logging
                    // throw errorObj;
                }
            });
            // If not already patched, run the patcher
            if (!patcher.check(profile)) {
                const config = {
                    java: this.options.loader.config.javaPath,
                    minecraft: this.options.loader.config.minecraftJar,
                    minecraftJson: this.options.loader.config.minecraftJson
                };
                try {
                    await patcher.patcher(profile, config, oldAPI);
                    console.log('NeoForge patching completed successfully');
                }
                catch (patchError) {
                    console.error('NeoForge patching failed:', patchError.message);
                    // Handle the error gracefully
                    if (this.listenerCount('error') > 0) {
                        this.emit('error', patchError);
                    }
                    else {
                        console.error('Critical: No error listeners available to handle patcher failure');
                    }
                    // Return false to indicate patching failed
                    return false;
                }
            }
            else {
                console.log('NeoForge already patched, skipping patcher');
            }
        }
        return true;
    }
}
exports.default = NeoForgeMC;
//# sourceMappingURL=neoForge.js.map