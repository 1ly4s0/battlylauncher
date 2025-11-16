"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Utility for handling corrupted ZIP files and automatic redownload functionality
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZipErrorHandler = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const Downloader_js_1 = __importDefault(require("./Downloader.js"));
/**
 * Enhanced ZIP error handler that can detect corrupted ZIP files
 * and automatically redownload them when needed.
 */
class ZipErrorHandler {
    /**
     * Validates if a ZIP/JAR file is properly formatted and readable.
     *
     * @param filePath Path to the ZIP/JAR file to validate
     * @returns Validation result with error details if invalid
     */
    static validateZipFile(filePath) {
        if (!fs_1.default.existsSync(filePath)) {
            return {
                isValid: false,
                error: 'File does not exist',
                needsRedownload: true
            };
        }
        try {
            // Try to read the file stats first
            const stats = fs_1.default.statSync(filePath);
            if (stats.size === 0) {
                return {
                    isValid: false,
                    error: 'File is empty (0 bytes)',
                    needsRedownload: true
                };
            }
            // Try to create AdmZip instance - this will throw if the file is corrupted
            const zip = new adm_zip_1.default(filePath);
            // Try to get entries - this might catch additional corruption issues
            const entries = zip.getEntries();
            // Basic validation: ensure the ZIP has entries and can be read
            if (!entries || entries.length === 0) {
                // Some valid ZIPs might be empty, so this is just a warning
                console.warn(`Warning: ZIP file appears to be empty: ${filePath}`);
            }
            return { isValid: true };
        }
        catch (error) {
            const errorMessage = error.message || error.toString();
            // Check if this is a known ZIP corruption error
            const isZipError = this.ZIP_ERRORS.some(zipError => errorMessage.toLowerCase().includes(zipError.toLowerCase()));
            return {
                isValid: false,
                error: errorMessage,
                needsRedownload: isZipError
            };
        }
    }
    /**
     * Constructs Maven URLs from coordinates and mirrors
     */
    static constructMavenUrls(mavenCoordinates, mirrors) {
        const [groupId, artifactId, version] = mavenCoordinates.split(':');
        if (!groupId || !artifactId || !version) {
            return [];
        }
        const groupPath = groupId.replace(/\./g, '/');
        const jarPath = `${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar`;
        return mirrors.map(mirror => {
            const baseUrl = mirror.endsWith('/') ? mirror.slice(0, -1) : mirror;
            return `${baseUrl}/${jarPath}`;
        });
    }
    /**
     * Specialized recovery method for NeoForge installer JARs.
     * Tries multiple mirrors and methods to download a working installer.
     *
     * @param installerPath Local path to the corrupted installer
     * @param version NeoForge version (e.g., "21.10.21-beta")
     * @param originalUrl Original download URL that failed
     * @returns Promise that resolves when a valid installer is downloaded
     */
    static async recoverNeoForgeInstaller(installerPath, version, originalUrl) {
        const fileName = path_1.default.basename(installerPath);
        const directory = path_1.default.dirname(installerPath);
        console.log(`🔧 Attempting to recover NeoForge installer: ${fileName}`);
        // Construct alternative URLs for the NeoForge installer
        const alternativeUrls = [];
        // Try different mirror patterns for NeoForge
        const neoForgeMirrors = [
            'https://maven.neoforged.net/net/neoforged/neoforge',
            'https://maven.neoforged.net/releases/net/neoforged/neoforge',
            'https://files.minecraftforge.net/net/neoforged/neoforge'
        ];
        for (const mirror of neoForgeMirrors) {
            alternativeUrls.push(`${mirror}/${version}/neoforge-${version}-installer.jar`);
        }
        // If original URL is provided, try it first but also try variations
        if (originalUrl) {
            alternativeUrls.unshift(originalUrl);
            // Try variations of the original URL
            if (originalUrl.includes('maven.neoforged.net')) {
                const baseUrl = originalUrl.replace('/net/neoforged/neoforge/', '/releases/net/neoforged/neoforge/');
                alternativeUrls.push(baseUrl);
            }
        }
        // Remove duplicates
        const uniqueUrls = [...new Set(alternativeUrls)];
        console.log(`Trying ${uniqueUrls.length} alternative download sources...`);
        const downloader = new Downloader_js_1.default();
        let lastError = null;
        for (let urlIndex = 0; urlIndex < uniqueUrls.length; urlIndex++) {
            const testUrl = uniqueUrls[urlIndex];
            console.log(`📥 Trying source ${urlIndex + 1}/${uniqueUrls.length}: ${testUrl}`);
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    // Remove corrupted file before attempting download
                    if (fs_1.default.existsSync(installerPath)) {
                        fs_1.default.unlinkSync(installerPath);
                    }
                    console.log(`Downloading from alternative source (attempt ${attempt + 1}/3)...`);
                    await downloader.downloadFile(testUrl, directory, fileName);
                    // Validate the downloaded file
                    const validation = this.validateZipFile(installerPath);
                    if (validation.isValid) {
                        console.log(`✅ Successfully recovered NeoForge installer from alternative source`);
                        return;
                    }
                    else {
                        throw new Error(`Downloaded file failed validation: ${validation.error}`);
                    }
                }
                catch (error) {
                    lastError = error;
                    console.warn(`Alternative download attempt ${attempt + 1} failed: ${error.message}`);
                    // Remove invalid file if it exists
                    if (fs_1.default.existsSync(installerPath)) {
                        fs_1.default.unlinkSync(installerPath);
                    }
                    if (attempt < 2) {
                        const delay = 1000 * (attempt + 1);
                        console.log(`Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        }
        // If we get here, all attempts failed
        const errorMessage = lastError ? lastError.message : 'Unknown error';
        throw new Error(`Failed to recover NeoForge installer ${fileName} after trying ${uniqueUrls.length} sources. Last error: ${errorMessage}`);
    }
    /**
     * Attempts to redownload a corrupted file with retry logic.
     * Now supports Maven coordinate resolution for library files.
     *
     * @param options Redownload configuration
     * @returns Promise that resolves when download is complete or rejects after max retries
     */
    static async redownloadFile(options) {
        const { url, filePath, maxRetries = 3, timeout = 30000, mavenCoordinates, mavenMirrors = this.DEFAULT_MAVEN_MIRRORS } = options;
        const downloader = new Downloader_js_1.default();
        const fileName = path_1.default.basename(filePath);
        const directory = path_1.default.dirname(filePath);
        let lastError = null;
        let attempt = 0;
        // If Maven coordinates are provided, try Maven mirrors first
        if (mavenCoordinates) {
            const mavenUrls = this.constructMavenUrls(mavenCoordinates, mavenMirrors);
            for (const mavenUrl of mavenUrls) {
                for (let retry = 0; retry < maxRetries; retry++) {
                    try {
                        console.log(`Downloading from Maven mirror (attempt ${retry + 1}/${maxRetries}): ${mavenUrl}`);
                        await downloader.downloadFile(mavenUrl, directory, fileName);
                        // Validate the downloaded file
                        const validation = this.validateZipFile(filePath);
                        if (validation.isValid) {
                            console.log(`Successfully redownloaded and validated: ${fileName}`);
                            return;
                        }
                        else {
                            throw new Error(`Downloaded file failed validation: ${validation.error}`);
                        }
                    }
                    catch (error) {
                        lastError = error;
                        console.warn(`Maven download attempt ${retry + 1} failed: ${error.message}`);
                        // Remove invalid file if it exists
                        if (fs_1.default.existsSync(filePath)) {
                            fs_1.default.unlinkSync(filePath);
                        }
                        if (retry < maxRetries - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
                        }
                    }
                }
            }
        }
        // If Maven mirrors failed or no coordinates provided, try the original URL
        if (url) {
            for (attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    console.log(`Downloading from original URL (attempt ${attempt + 1}/${maxRetries}): ${url}`);
                    await downloader.downloadFile(url, directory, fileName);
                    // Validate the downloaded file
                    const validation = this.validateZipFile(filePath);
                    if (validation.isValid) {
                        console.log(`Successfully redownloaded and validated: ${fileName}`);
                        return;
                    }
                    else {
                        throw new Error(`Downloaded file failed validation: ${validation.error}`);
                    }
                }
                catch (error) {
                    lastError = error;
                    console.error(`Redownload attempt ${attempt + 1} failed: ${error.message}`);
                    // Remove invalid file if it exists
                    if (fs_1.default.existsSync(filePath)) {
                        fs_1.default.unlinkSync(filePath);
                    }
                    // Wait before retry (exponential backoff)
                    if (attempt < maxRetries - 1) {
                        const delay = 1000 * Math.pow(2, attempt);
                        console.log(`Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        }
        // If we get here, all attempts failed
        const errorMessage = lastError ? lastError.message : 'Unknown error';
        throw new Error(`Failed to redownload ${fileName} after ${maxRetries} attempts. Last error: ${errorMessage}`);
    }
    /**
     * Extracts Maven coordinates from a file system path
     * Example: /path/to/libraries/com/google/gson/2.10.1/gson-2.10.1.jar -> com.google.gson:gson:2.10.1
     */
    static extractMavenCoordinatesFromPath(filePath) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        const parts = normalizedPath.split('/');
        // Find 'libraries' directory index
        const librariesIndex = parts.lastIndexOf('libraries');
        if (librariesIndex === -1) {
            return null;
        }
        // Extract path parts after 'libraries'
        const pathParts = parts.slice(librariesIndex + 1);
        // Need at least 4 parts: [group...], artifact, version, filename
        if (pathParts.length < 4) {
            return null;
        }
        // Extract version and artifact from filename
        const fileName = pathParts[pathParts.length - 1];
        const version = pathParts[pathParts.length - 2];
        const artifact = pathParts[pathParts.length - 3];
        // Group is everything except the last 3 parts, joined with dots
        const groupParts = pathParts.slice(0, -3);
        const group = groupParts.join('.');
        // Validate that filename matches pattern
        if (!fileName.startsWith(`${artifact}-${version}.`)) {
            return null;
        }
        return `${group}:${artifact}:${version}`;
    }
    /**
     * Enhanced version of getFileFromArchive that handles corrupted ZIP files
     * and attempts automatic redownload if a URL is provided.
     * Now supports automatic Maven coordinate detection for library files.
     *
     * @param jarPath Path to the ZIP/JAR file
     * @param file Specific file to extract (null for all files)
     * @param prefix Path prefix filter
     * @param redownloadUrl Optional URL for automatic redownload on corruption
     * @param enableMavenLookup Whether to attempt Maven mirror lookup for library files
     * @returns File content or array of files
     */
    static async getFileFromArchiveWithRecovery(jarPath, file = null, prefix = null, redownloadUrl, enableMavenLookup = true) {
        // First, validate the ZIP file
        const validation = this.validateZipFile(jarPath);
        if (!validation.isValid) {
            console.error(`ZIP validation failed for ${jarPath}: ${validation.error}`);
            // If we have a redownload URL and the error indicates we should redownload
            if (validation.needsRedownload) {
                console.log(`Attempting to redownload corrupted file: ${path_1.default.basename(jarPath)}`);
                try {
                    const redownloadOptions = {
                        url: redownloadUrl || '',
                        filePath: jarPath
                    };
                    // Try to extract Maven coordinates for library files if Maven lookup is enabled
                    if (enableMavenLookup) {
                        const mavenCoordinates = this.extractMavenCoordinatesFromPath(jarPath);
                        if (mavenCoordinates) {
                            console.log(`Detected Maven library: ${mavenCoordinates}`);
                            redownloadOptions.mavenCoordinates = mavenCoordinates;
                            redownloadOptions.mavenMirrors = this.DEFAULT_MAVEN_MIRRORS;
                            // If no explicit redownload URL was provided, we'll rely on Maven mirrors
                            if (!redownloadUrl) {
                                redownloadOptions.url = 'fallback-maven-url'; // This will be ignored in favor of Maven URLs
                            }
                        }
                    }
                    // Perform the redownload
                    if (redownloadUrl || redownloadOptions.mavenCoordinates) {
                        await this.redownloadFile(redownloadOptions);
                        // Re-validate after redownload
                        const newValidation = this.validateZipFile(jarPath);
                        if (!newValidation.isValid) {
                            throw new Error(`File still corrupted after redownload: ${newValidation.error}`);
                        }
                    }
                    else {
                        console.log(`No redownload URL or Maven coordinates available for ${jarPath}`);
                        throw new Error(validation.error || 'ZIP file is corrupted and cannot be recovered');
                    }
                }
                catch (redownloadError) {
                    console.error(`Failed to redownload corrupted file: ${redownloadError.message}`);
                    throw new Error(`ZIP corruption detected and recovery failed: ${redownloadError.message}`);
                }
            }
            else {
                throw new Error(validation.error || 'ZIP file validation failed');
            }
        }
        // If we get here, the file is valid (or has been successfully repaired)
        // Proceed with actual extraction
        try {
            const zip = new adm_zip_1.default(jarPath);
            const entries = zip.getEntries();
            if (file) {
                // Extract specific file
                const entry = entries.find(e => e.entryName === file);
                if (!entry) {
                    throw new Error(`File '${file}' not found in archive`);
                }
                return entry.getData();
            }
            else {
                // Extract all files (optionally filtered by prefix)
                const result = {};
                for (const entry of entries) {
                    if (prefix && !entry.entryName.startsWith(prefix)) {
                        continue;
                    }
                    if (!entry.isDirectory) {
                        result[entry.entryName] = entry.getData();
                    }
                }
                return result;
            }
        }
        catch (error) {
            console.error(`File extraction failed even after ZIP validation: ${error.message}`);
            throw error;
        }
    }
    /**
     * Extracts files from a ZIP/JAR archive with automatic error recovery
     * This is the primary entry point that combines validation and extraction
     */
    static async getFileFromArchive(jarPath, file = null, prefix = null, redownloadUrl) {
        try {
            const zip = new adm_zip_1.default(jarPath);
            const entries = zip.getEntries();
            if (file) {
                // Extract specific file
                const entry = entries.find(e => e.entryName === file);
                if (!entry) {
                    throw new Error(`File '${file}' not found in archive`);
                }
                return entry.getData();
            }
            else {
                // Extract all files (optionally filtered by prefix)
                const result = {};
                for (const entry of entries) {
                    if (prefix && !entry.entryName.startsWith(prefix)) {
                        continue;
                    }
                    if (!entry.isDirectory) {
                        result[entry.entryName] = entry.getData();
                    }
                }
                return result;
            }
        }
        catch (error) {
            console.warn(`Direct ZIP extraction failed, attempting recovery: ${error.message}`);
            return this.getFileFromArchiveWithRecovery(jarPath, file, prefix, redownloadUrl, true);
        }
    }
}
exports.ZipErrorHandler = ZipErrorHandler;
ZipErrorHandler.ZIP_ERRORS = [
    'Invalid or unsupported zip format',
    'No END header found',
    'ADM-ZIP: Invalid or unsupported zip format',
    'Invalid CEN header',
    'Invalid signature',
    'unexpected end of data'
];
// NeoForge-specific mirrors for installer downloads
ZipErrorHandler.NEOFORGE_MIRRORS = [
    'https://maven.neoforged.net', // Primary NeoForge Maven
    'https://maven.neoforged.net/releases', // Release-specific path
    'https://files.minecraftforge.net/net/neoforged/neoforge' // Alternative NeoForge hosting
];
// Common Maven mirrors for dependencies
ZipErrorHandler.DEFAULT_MAVEN_MIRRORS = [
    'https://repo1.maven.org/maven2',
    'https://repo.maven.apache.org/maven2',
    'https://central.maven.org/maven2',
    'https://maven.neoforged.net',
    'https://libraries.minecraft.net'
];
exports.default = ZipErrorHandler;
//# sourceMappingURL=ZipErrorHandler.js.map