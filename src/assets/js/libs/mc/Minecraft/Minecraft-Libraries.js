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
const fs_1 = __importDefault(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const path_1 = __importDefault(require("path"));
/**
 * Maps Node.js platforms to Mojang's naming scheme for OS in library natives.
 */
const MojangLib = {
    win32: 'windows',
    darwin: 'osx',
    linux: 'linux'
};
/**
 * Maps Node.js architecture strings to Mojang's arch replacements (e.g., "${arch}" => 64).
 */
const Arch = {
    x32: '32',
    x64: '64',
    arm: '32',
    arm64: '64'
};
/**
 * This class is responsible for:
 *  - Gathering library download info from the version JSON
 *  - Handling custom asset entries if provided
 *  - Extracting native libraries for the current OS into the appropriate folder
 */
class Libraries {
    constructor(options) {
        this.options = options;
    }
    /**
     * Processes the provided Minecraft version JSON to build a list of libraries
     * that need to be downloaded (including the main client jar and the version JSON itself).
     *
     * @param json A MinecraftVersionJSON object (containing libraries, downloads, etc.)
     * @returns An array of LibraryDownload items describing each file.
     */
    async Getlibraries(json) {
        this.json = json;
        const libraries = [];
        for (const lib of this.json.libraries) {
            let artifact;
            let type = 'Libraries';
            if (lib.natives) {
                // If this library has OS natives, pick the correct classifier
                const classifiers = lib.downloads.classifiers;
                let native = lib.natives[MojangLib[os_1.default.platform()]] || lib.natives[os_1.default.platform()];
                type = 'Native';
                if (native) {
                    // Replace "${arch}" if present, e.g. "natives-windows-${arch}"
                    const archReplaced = native.replace('${arch}', Arch[os_1.default.arch()] || '');
                    artifact = classifiers ? classifiers[archReplaced] : undefined;
                }
                else {
                    // No valid native for the current platform
                    continue;
                }
            }
            else {
                // If there are rules restricting OS, skip if not matching
                if (lib.rules && lib.rules[0]?.os?.name) {
                    if (lib.rules[0].os.name !== MojangLib[os_1.default.platform()]) {
                        continue;
                    }
                }
                artifact = lib.downloads.artifact;
            }
            if (!artifact)
                continue;
            libraries.push({
                sha1: artifact.sha1,
                size: artifact.size,
                path: `libraries/${artifact.path}`,
                type: type,
                url: artifact.url
            });
        }
        // Add the main Minecraft client JAR to the list
        libraries.push({
            sha1: this.json.downloads.client.sha1,
            size: this.json.downloads.client.size,
            path: `versions/${this.json.id}/${this.json.id}.jar`,
            type: 'Libraries',
            url: this.json.downloads.client.url
        });
        // Add the JSON file for this version as a "CFILE"
        libraries.push({
            path: `versions/${this.json.id}/${this.json.id}.json`,
            type: 'CFILE',
            content: JSON.stringify(this.json)
        });
        return libraries;
    }
    /**
     * Fetches custom assets or libraries from a remote URL if provided.
     * This method expects the response to be an array of objects with
     * "path", "hash", "size", and "url".
     *
     * @param url The remote URL that returns a JSON array of CustomAssetItem
     * @returns   An array of LibraryDownload entries describing each item
     */
    async GetAssetsOthers(url) {
        if (!url)
            return [];
        const assetCachePath = path_1.default.join(this.options.path, 'mc-assets', 'extra-assets.json');
        let data;
        try {
            const response = await fetch(url);
            data = await response.json();
            fs_1.default.mkdirSync(path_1.default.dirname(assetCachePath), { recursive: true });
            fs_1.default.writeFileSync(assetCachePath, JSON.stringify(data, null, 4));
        }
        catch (e) {
            data = JSON.parse(fs_1.default.readFileSync(assetCachePath, 'utf-8'));
        }
        const assets = [];
        for (const asset of data) {
            if (!asset.path)
                continue;
            const fileType = asset.path.split('/')[0];
            assets.push({
                sha1: asset.hash,
                size: asset.size,
                type: fileType,
                path: this.options.instance
                    ? `instances/${this.options.instance}/${asset.path}`
                    : asset.path,
                url: asset.url
            });
        }
        return assets;
    }
    /**
     * Extracts native libraries from the downloaded jars (those marked type="Native")
     * and places them into the "natives" folder under "versions/<id>/natives".
     *
     * @param bundle An array of library entries (some of which may be natives)
     * @returns The paths of the native files that were extracted
     */
    async natives(bundle) {
        // Gather only the native library files
        const natives = bundle
            .filter((item) => item.type === 'Native')
            .map((item) => `${item.path}`);
        if (natives.length === 0) {
            return [];
        }
        // Create the natives folder if it doesn't already exist
        const nativesFolder = `${this.options.path}/versions/${this.json.id}/natives`.replace(/\\/g, '/');
        if (!fs_1.default.existsSync(nativesFolder)) {
            fs_1.default.mkdirSync(nativesFolder, { recursive: true, mode: 0o777 });
        }
        // For each native jar, extract its contents (excluding META-INF)
        for (const native of natives) {
            // Load it as a zip
            const zip = new adm_zip_1.default(native);
            const entries = zip.getEntries();
            for (const entry of entries) {
                if (entry.entryName.startsWith('META-INF')) {
                    continue;
                }
                // Create subdirectories if needed
                if (entry.isDirectory) {
                    fs_1.default.mkdirSync(`${nativesFolder}/${entry.entryName}`, { recursive: true, mode: 0o777 });
                    continue;
                }
                // Write the file to the natives folder
                fs_1.default.writeFileSync(`${nativesFolder}/${entry.entryName}`, zip.readFile(entry), { mode: 0o777 });
            }
        }
        return natives;
    }
}
exports.default = Libraries;
//# sourceMappingURL=Minecraft-Libraries.js.map