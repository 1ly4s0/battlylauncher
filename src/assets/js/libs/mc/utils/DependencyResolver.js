"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Enhanced dependency resolver for NeoForge/Forge that handles missing dependencies
 * and classpath issues by automatically downloading required libraries.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyResolver = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ZipErrorHandler_js_1 = require("./ZipErrorHandler.js");
const Downloader_js_1 = __importDefault(require("./Downloader.js"));
/**
 * Comprehensive dependency resolver that handles missing and corrupted JAR files
 * for NeoForge/Forge installations, with automatic dependency resolution.
 */
class DependencyResolver {
    constructor(librariesPath) {
        this.downloadAttempts = new Map();
        this.maxDownloadAttempts = 3;
        this.librariesPath = librariesPath;
        this.downloader = new Downloader_js_1.default();
    }
    /**
     * Analyzes a Java error message to extract missing dependency information
     */
    static analyzeMissingDependency(errorMessage) {
        // Pattern: NoClassDefFoundError: com/google/gson/GsonBuilder
        const classNotFoundMatch = errorMessage.match(/NoClassDefFoundError:\s+([^\\s]+)/);
        if (classNotFoundMatch) {
            const className = classNotFoundMatch[1].replace(/\//g, '.');
            // Map common class names to Maven coordinates
            const dependencyMap = {
                'com.google.gson.GsonBuilder': {
                    groupId: 'com.google.code.gson',
                    artifactId: 'gson',
                    version: '2.10.1',
                    fileName: 'gson-2.10.1.jar'
                },
                'net.neoforged.cliutils.progress.ProgressManager': {
                    groupId: 'net.neoforged',
                    artifactId: 'cliutils',
                    version: '3.0.13',
                    fileName: 'cliutils-3.0.13.jar'
                },
                'org.apache.commons.lang3.StringUtils': {
                    groupId: 'org.apache.commons',
                    artifactId: 'commons-lang3',
                    version: '3.14.0',
                    fileName: 'commons-lang3-3.14.0.jar'
                }
            };
            // Check for exact matches
            if (dependencyMap[className]) {
                return dependencyMap[className];
            }
            // Try partial matches for known packages
            for (const [knownClass, dependency] of Object.entries(dependencyMap)) {
                if (className.startsWith(knownClass.split('.').slice(0, -1).join('.'))) {
                    return dependency;
                }
            }
        }
        return null;
    }
    /**
     * Constructs Maven URL from dependency coordinates
     */
    constructMavenUrl(dependency, baseUrl) {
        const groupPath = dependency.groupId.replace(/\./g, '/');
        const fileName = dependency.classifier
            ? `${dependency.artifactId}-${dependency.version}-${dependency.classifier}.jar`
            : `${dependency.artifactId}-${dependency.version}.jar`;
        return `${baseUrl}/${groupPath}/${dependency.artifactId}/${dependency.version}/${fileName}`;
    }
    /**
     * Gets the local path where a dependency should be stored
     */
    getDependencyPath(dependency) {
        const groupPath = dependency.groupId.replace(/\./g, path_1.default.sep);
        return path_1.default.join(this.librariesPath, groupPath, dependency.artifactId, dependency.version, dependency.fileName);
    }
    /**
     * Downloads a single dependency from Maven repositories
     * Includes fallback to alternative versions for critical dependencies
     */
    async downloadDependency(dependency) {
        const dependencyKey = `${dependency.groupId}:${dependency.artifactId}:${dependency.version}`;
        const attemptCount = this.downloadAttempts.get(dependencyKey) || 0;
        if (attemptCount >= this.maxDownloadAttempts) {
            console.log(`❌ Max download attempts (${this.maxDownloadAttempts}) reached for ${dependency.fileName}`);
            return false;
        }
        // Increment attempt counter
        this.downloadAttempts.set(dependencyKey, attemptCount + 1);
        // First try the exact dependency
        if (await this.downloadDependencyExact(dependency)) {
            // Reset counter on success
            this.downloadAttempts.delete(dependencyKey);
            return true;
        }
        // If exact version fails, try alternative versions for critical dependencies
        if (dependency.artifactId === 'cliutils' && dependency.groupId === 'net.neoforged') {
            console.log(`🔄 Exact version ${dependency.version} failed, trying alternative versions...`);
            const alternativeVersions = ['3.0.12', '3.0.11', '3.0.10', '3.0.9', '3.0.8'];
            for (const version of alternativeVersions) {
                const altDependency = {
                    ...dependency,
                    version,
                    fileName: `cliutils-${version}.jar`
                };
                console.log(`🔄 Trying alternative version: ${version}`);
                if (await this.downloadDependencyExact(altDependency)) {
                    // Create a symlink or copy with the original expected name
                    const altPath = this.getDependencyPath(altDependency);
                    const originalPath = this.getDependencyPath(dependency);
                    try {
                        // Ensure original directory exists
                        const originalDir = path_1.default.dirname(originalPath);
                        if (!fs_1.default.existsSync(originalDir)) {
                            fs_1.default.mkdirSync(originalDir, { recursive: true });
                        }
                        // Copy the working version to the expected location
                        fs_1.default.copyFileSync(altPath, originalPath);
                        console.log(`✅ Using ${altDependency.fileName} as ${dependency.fileName}`);
                        return true;
                    }
                    catch (error) {
                        console.warn(`Failed to copy alternative version: ${error.message}`);
                    }
                }
            }
        }
        console.error(`❌ Failed to download ${dependency.fileName} and all alternatives`);
        return false;
    }
    /**
     * Downloads a specific dependency version without fallbacks
     */
    async downloadDependencyExact(dependency) {
        const localPath = this.getDependencyPath(dependency);
        const directory = path_1.default.dirname(localPath);
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(directory)) {
            fs_1.default.mkdirSync(directory, { recursive: true });
        }
        // Try each Maven mirror
        for (const mirror of DependencyResolver.MAVEN_MIRRORS) {
            try {
                const url = this.constructMavenUrl(dependency, mirror);
                console.log(`Attempting to download ${dependency.fileName} from ${mirror}`);
                // Check if URL is accessible
                const isAccessible = await this.downloader.checkURL(url);
                if (!isAccessible) {
                    console.log(`URL not accessible: ${url}`);
                    continue;
                }
                // Download the dependency
                await this.downloader.downloadFile(url, directory, dependency.fileName);
                // Validate the downloaded file
                const validation = ZipErrorHandler_js_1.ZipErrorHandler.validateZipFile(localPath);
                if (validation.isValid) {
                    console.log(`✅ Successfully downloaded ${dependency.fileName}`);
                    return true;
                }
                else {
                    console.log(`❌ Downloaded file is invalid: ${validation.error}`);
                    // Remove invalid file
                    if (fs_1.default.existsSync(localPath)) {
                        fs_1.default.unlinkSync(localPath);
                    }
                }
            }
            catch (error) {
                console.log(`Failed to download from ${mirror}: ${error.message}`);
            }
        }
        return false;
    }
    /**
     * Scans for missing or corrupted dependencies in the libraries directory
     */
    async scanForMissingDependencies(requiredDependencies) {
        const dependencies = requiredDependencies || DependencyResolver.COMMON_DEPENDENCIES;
        const missing = [];
        for (const dependency of dependencies) {
            const localPath = this.getDependencyPath(dependency);
            if (!fs_1.default.existsSync(localPath)) {
                missing.push({
                    dependency,
                    reason: 'missing_file'
                });
            }
            else {
                // Check if file is corrupted
                const validation = ZipErrorHandler_js_1.ZipErrorHandler.validateZipFile(localPath);
                if (!validation.isValid) {
                    missing.push({
                        dependency,
                        reason: 'corrupted_file',
                        errorMessage: validation.error
                    });
                }
            }
        }
        return missing;
    }
    /**
     * Resolves missing dependencies by downloading them
     */
    async resolveMissingDependencies(errorMessage) {
        const missingDeps = [];
        // If we have an error message, try to extract specific dependency
        if (errorMessage) {
            const specificDep = DependencyResolver.analyzeMissingDependency(errorMessage);
            if (specificDep) {
                const localPath = this.getDependencyPath(specificDep);
                if (!fs_1.default.existsSync(localPath)) {
                    missingDeps.push({
                        dependency: specificDep,
                        reason: 'classpath_error',
                        errorMessage
                    });
                }
            }
        }
        // Add common missing dependencies
        const commonMissing = await this.scanForMissingDependencies();
        missingDeps.push(...commonMissing);
        if (missingDeps.length === 0) {
            console.log('✅ No missing dependencies found');
            return true;
        }
        console.log(`🔧 Found ${missingDeps.length} missing/corrupted dependencies`);
        let resolvedCount = 0;
        for (const missing of missingDeps) {
            console.log(`📦 Resolving ${missing.dependency.fileName} (${missing.reason})`);
            const success = await this.downloadDependency(missing.dependency);
            if (success) {
                resolvedCount++;
            }
        }
        const success = resolvedCount === missingDeps.length;
        console.log(`📊 Resolved ${resolvedCount}/${missingDeps.length} dependencies`);
        return success;
    }
    /**
     * Enhanced dependency resolution with retry logic for specific error patterns
     */
    async resolveFromErrorLog(errorLog) {
        console.log('🔍 Analyzing error log for missing dependencies...');
        // Extract all NoClassDefFoundError instances
        const classNotFoundErrors = errorLog.match(/NoClassDefFoundError:\s+([^\s\r\n]+)/g) || [];
        const missingClasses = classNotFoundErrors.map(error => error.replace('NoClassDefFoundError:', '').trim().replace(/\//g, '.'));
        console.log(`Found ${missingClasses.length} missing classes:`, missingClasses);
        // Try to resolve each missing class
        let resolvedAny = false;
        for (const className of missingClasses) {
            const dependency = DependencyResolver.analyzeMissingDependency(`NoClassDefFoundError: ${className.replace(/\./g, '/')}`);
            if (dependency) {
                console.log(`🎯 Attempting to resolve ${className} -> ${dependency.fileName}`);
                const success = await this.downloadDependency(dependency);
                if (success) {
                    resolvedAny = true;
                }
            }
        }
        // Don't call resolveMissingDependencies again to avoid infinite loops
        // The specific dependencies should have been handled above
        return resolvedAny;
    }
}
exports.DependencyResolver = DependencyResolver;
// Common dependencies that are often missing or cause NoClassDefFoundError
DependencyResolver.COMMON_DEPENDENCIES = [
    // Gson - Required by many NeoForge tools
    {
        groupId: 'com.google.code.gson',
        artifactId: 'gson',
        version: '2.10.1',
        fileName: 'gson-2.10.1.jar'
    },
    // CLI Utils - Required by NeoForged tools (multiple versions to try)
    {
        groupId: 'net.neoforged',
        artifactId: 'cliutils',
        version: '3.0.13',
        fileName: 'cliutils-3.0.13.jar'
    },
    {
        groupId: 'net.neoforged',
        artifactId: 'cliutils',
        version: '3.0.12',
        fileName: 'cliutils-3.0.12.jar'
    },
    {
        groupId: 'net.neoforged',
        artifactId: 'cliutils',
        version: '3.0.11',
        fileName: 'cliutils-3.0.11.jar'
    },
    {
        groupId: 'net.neoforged',
        artifactId: 'cliutils',
        version: '3.0.10',
        fileName: 'cliutils-3.0.10.jar'
    },
    // Apache Commons Lang3 - Often missing
    {
        groupId: 'org.apache.commons',
        artifactId: 'commons-lang3',
        version: '3.14.0',
        fileName: 'commons-lang3-3.14.0.jar'
    },
    // SLF4J API - Logging dependency
    {
        groupId: 'org.slf4j',
        artifactId: 'slf4j-api',
        version: '2.0.9',
        fileName: 'slf4j-api-2.0.9.jar'
    },
    // Guava - Google core libraries
    {
        groupId: 'com.google.guava',
        artifactId: 'guava',
        version: '32.1.2-jre',
        fileName: 'guava-32.1.2-jre.jar'
    }
];
DependencyResolver.MAVEN_MIRRORS = [
    'https://repo1.maven.org/maven2',
    'https://maven.neoforged.net/releases',
    'https://maven.neoforged.net/snapshots',
    'https://maven.minecraftforge.net',
    'https://maven.creeperhost.net',
    'https://libraries.minecraft.net',
    // Additional NeoForge-specific mirrors
    'https://files.minecraftforge.net/maven',
    'https://modmaven.dev',
    'https://maven.fabricmc.net'
];
exports.default = DependencyResolver;
//# sourceMappingURL=DependencyResolver.js.map