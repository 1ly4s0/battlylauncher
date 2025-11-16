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
exports.ZipErrorHandler = exports.DependencyResolver = exports.mirrors = void 0;
exports.getPathLibraries = getPathLibraries;
exports.getFileHash = getFileHash;
exports.isold = isold;
exports.loader = loader;
exports.getFileFromArchive = getFileFromArchive;
exports.getFileFromArchiveWithRecovery = getFileFromArchiveWithRecovery;
exports.createZIP = createZIP;
exports.skipLibrary = skipLibrary;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const ZipErrorHandler_js_1 = require("./ZipErrorHandler.js");
Object.defineProperty(exports, "ZipErrorHandler", { enumerable: true, get: function () { return ZipErrorHandler_js_1.ZipErrorHandler; } });
const DependencyResolver_js_1 = __importDefault(require("./DependencyResolver.js"));
exports.DependencyResolver = DependencyResolver_js_1.default;
/**
 * Parses a Gradle/Maven identifier string (like "net.minecraftforge:forge:1.19-41.0.63")
 * into a local file path (group/artifact/version) and final filename (artifact-version.jar).
 * Optionally allows specifying a native string suffix or forcing an extension.
 *
 * @param main         A Gradle-style coordinate (group:artifact:version[:classifier])
 * @param nativeString A suffix for native libraries (e.g., "-natives-linux")
 * @param forceExt     A forced file extension (default is ".jar")
 * @returns An object with `path` and `name`, where `path` is the directory path and `name` is the filename
 */
function getPathLibraries(main, nativeString, forceExt) {
    // Example "net.minecraftforge:forge:1.19-41.0.63"
    const libSplit = main.split(':');
    // If there's a fourth element, it's typically a classifier appended to version
    const fileName = libSplit[3] ? `${libSplit[2]}-${libSplit[3]}` : libSplit[2];
    // Replace '@' in versions if present (e.g., "1.0@beta" => "1.0.beta")
    let finalFileName = fileName.includes('@')
        ? fileName.replace('@', '.')
        : `${fileName}${nativeString || ''}${forceExt || '.jar'}`;
    // Construct the path: "net.minecraftforge" => "net/minecraftforge"
    // artifact => "forge"
    // version => "1.19-41.0.63"
    const pathLib = `${libSplit[0].replace(/\./g, '/')}/${libSplit[1]}/${libSplit[2].split('@')[0]}`;
    return {
        path: pathLib,
        name: `${libSplit[1]}-${finalFileName}`
    };
}
/**
 * Computes a hash (default SHA-1) of the given file by streaming its contents.
 *
 * @param filePath   Full path to the file on disk
 * @param algorithm  Hashing algorithm (default: "sha1")
 * @returns          A Promise resolving to the hex string of the file's hash
 */
async function getFileHash(filePath, algorithm = 'sha1') {
    const shasum = crypto_1.default.createHash(algorithm);
    const fileStream = fs_1.default.createReadStream(filePath);
    return new Promise((resolve) => {
        fileStream.on('data', (data) => {
            shasum.update(data);
        });
        fileStream.on('end', () => {
            resolve(shasum.digest('hex'));
        });
    });
}
/**
 * Determines if a given Minecraft version JSON is considered "old"
 * by checking its assets field (e.g., "legacy" or "pre-1.6").
 *
 * @param json The Minecraft version JSON
 * @returns true if it's an older version, false otherwise
 */
function isold(json) {
    return json.assets === 'legacy' || json.assets === 'pre-1.6';
}
/**
 * Returns metadata necessary to download specific loaders (Forge, Fabric, etc.)
 * based on a loader type string (e.g., "forge", "fabric").
 * If the loader type is unrecognized, returns undefined.
 *
 * @param type A string representing the loader type
 */
function loader(type) {
    if (type === 'forge') {
        return {
            metaData: 'https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json',
            meta: 'https://files.minecraftforge.net/net/minecraftforge/forge/${build}/meta.json',
            promotions: 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json',
            install: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-installer',
            universal: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-universal',
            client: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-client'
        };
    }
    else if (type === 'neoforge') {
        return {
            legacyMetaData: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/forge',
            metaData: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge',
            legacyInstall: 'https://maven.neoforged.net/net/neoforged/forge/${version}/forge-${version}-installer.jar',
            install: 'https://maven.neoforged.net/net/neoforged/neoforge/${version}/neoforge-${version}-installer.jar'
        };
    }
    else if (type === 'fabric') {
        return {
            metaData: 'https://meta.fabricmc.net/v2/versions',
            json: 'https://meta.fabricmc.net/v2/versions/loader/${version}/${build}/profile/json'
        };
    }
    else if (type === 'legacyfabric') {
        return {
            metaData: 'https://meta.legacyfabric.net/v2/versions',
            json: 'https://meta.legacyfabric.net/v2/versions/loader/${version}/${build}/profile/json'
        };
    }
    else if (type === 'quilt') {
        return {
            metaData: 'https://meta.quiltmc.org/v3/versions',
            json: 'https://meta.quiltmc.org/v3/versions/loader/${version}/${build}/profile/json'
        };
    }
    // If none match, return undefined
}
/**
 * A list of potential Maven mirrors for downloading libraries.
 */
const mirrors = [
    'https://maven.minecraftforge.net',
    'https://maven.neoforged.net/releases',
    'https://maven.creeperhost.net',
    'https://libraries.minecraft.net',
    'https://repo1.maven.org/maven2'
];
exports.mirrors = mirrors;
/**
 * Reads a .jar or .zip file, returning specific entries or listing file entries in the archive.
 * Uses adm-zip under the hood.
 *
 * @deprecated Use getFileFromArchiveWithRecovery for better error handling
 * @param jar    Full path to the jar/zip file
 * @param file   The file entry to extract data from (e.g., "install_profile.json"). If null, returns all entries or partial lists.
 * @param prefix A path prefix filter (e.g., "maven/org/lwjgl/") if you want a list of matching files instead of direct extraction
 * @returns      A buffer or an array of { name, data }, or a list of filenames if prefix is given
 */
async function getFileFromArchive(jar, file = null, prefix = null) {
    try {
        const result = [];
        const zip = new adm_zip_1.default(jar);
        const entries = zip.getEntries();
        return new Promise((resolve) => {
            for (const entry of entries) {
                if (!entry.isDirectory && !prefix) {
                    // If no prefix is given, either return a specific file if 'file' is set,
                    // or accumulate all entries if 'file' is null
                    if (entry.entryName === file) {
                        return resolve(entry.getData());
                    }
                    else if (!file) {
                        result.push({ name: entry.entryName, data: entry.getData() });
                    }
                }
                // If a prefix is given, collect all entry names under that prefix
                if (!entry.isDirectory && prefix && entry.entryName.includes(prefix)) {
                    result.push(entry.entryName);
                }
            }
            if (file && !prefix) {
                // If a specific file was requested but not found, return undefined or empty
                return resolve(undefined);
            }
            // Otherwise, resolve the array of results
            resolve(result);
        });
    }
    catch (error) {
        // Check if this is the specific ADM-ZIP error we want to handle
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes('Invalid or unsupported zip format') ||
            errorMessage.includes('No END header found')) {
            console.error(`ADM-ZIP Error detected in file: ${jar}`);
            console.error(`Error: ${errorMessage}`);
            console.log(`Hint: Consider using getFileFromArchiveWithRecovery() with a redownload URL to automatically fix this issue.`);
        }
        throw error;
    }
}
/**
 * Enhanced version of getFileFromArchive with automatic error recovery.
 * Detects corrupted ZIP files and can automatically redownload them.
 * Now supports automatic Maven coordinate detection for library files.
 *
 * @param jar               Full path to the jar/zip file
 * @param file              The file entry to extract data from. If null, returns all entries or partial lists.
 * @param prefix            A path prefix filter if you want a list of matching files instead of direct extraction
 * @param redownloadUrl     Optional URL for automatic redownload on corruption
 * @param enableMavenLookup Whether to attempt Maven mirror lookup for library files (default: true)
 * @returns                 A buffer or an array of { name, data }, or a list of filenames if prefix is given
 */
async function getFileFromArchiveWithRecovery(jar, file = null, prefix = null, redownloadUrl, enableMavenLookup = true) {
    return ZipErrorHandler_js_1.ZipErrorHandler.getFileFromArchiveWithRecovery(jar, file, prefix, redownloadUrl, enableMavenLookup);
}
/**
 * Creates a new ZIP buffer by combining multiple file entries (name, data),
 * optionally ignoring entries containing a certain string (e.g. "META-INF").
 *
 * @param files   An array of { name, data } objects to include in the new zip
 * @param ignored A substring to skip any matching files
 * @returns       A buffer containing the newly created ZIP
 */
async function createZIP(files, ignored = null) {
    const zip = new adm_zip_1.default();
    return new Promise((resolve) => {
        for (const entry of files) {
            if (ignored && entry.name.includes(ignored)) {
                continue;
            }
            zip.addFile(entry.name, entry.data);
        }
        resolve(zip.toBuffer());
    });
}
/**
 * Determines if a library should be skipped based on its 'rules' property.
 * For example, it might skip libraries if action='disallow' for the current OS,
 * or if there are specific conditions not met.
 *
 * @param lib A library object (with optional 'rules' array)
 * @returns true if the library should be skipped, false otherwise
 */
function skipLibrary(lib) {
    // Map Node.js platform strings to Mojang's naming
    const LibMap = {
        win32: 'windows',
        darwin: 'osx',
        linux: 'linux'
    };
    // If no rules, it's not skipped
    if (!lib.rules) {
        return false;
    }
    let shouldSkip = true;
    for (const rule of lib.rules) {
        // If features exist, your logic can handle them here
        if (rule.features) {
            // Implementation is up to your usage
            continue;
        }
        // "allow" means it can be used if OS matches (or no OS specified)
        // "disallow" means skip if OS matches (or no OS specified)
        if (rule.action === 'allow' &&
            ((rule.os && rule.os.name === LibMap[process.platform]) || !rule.os)) {
            shouldSkip = false;
        }
        else if (rule.action === 'disallow' &&
            ((rule.os && rule.os.name === LibMap[process.platform]) || !rule.os)) {
            shouldSkip = true;
        }
    }
    return shouldSkip;
}
//# sourceMappingURL=Index.js.map