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
/**
 * A class that handles downloading the Fabric loader JSON metadata
 * and the libraries needed to launch Fabric.
 */
class FabricMC extends events_1.EventEmitter {
    constructor(options = { path: '', loader: { version: '', build: '' } }) {
        super();
        this.options = options;
    }
    /**
     * Fetches metadata from the Fabric API to identify the correct build for the given version.
     * If the build is "latest" or "recommended", it picks the first entry from the loader array.
     * Otherwise, it tries to match the specific build requested by the user.
     *
     * @param Loader A LoaderObject with metaData and json URLs for Fabric.
     * @returns      A FabricJSON object on success, or an error object.
     */
    async downloadJson(Loader) {
        let selectedBuild;
        // Fetch overall metadata
        const metaPath = path_1.default.join(this.options.path, 'mc-assets', 'legacyfabric-meta.json');
        let metaData;
        // Try to fetch metadata from online source first, then fallback to local cache
        try {
            const response = await fetch(Loader.metaData);
            metaData = await response.json();
            fs_1.default.mkdirSync(path_1.default.dirname(metaPath), { recursive: true });
            fs_1.default.writeFileSync(metaPath, JSON.stringify(metaData, null, 4));
        }
        catch (error) {
            // Fetch failed; attempt loading from local cache
            if (!fs_1.default.existsSync(metaPath)) {
                return { error: "No cached metadata available and unable to fetch from network" };
            }
            metaData = JSON.parse(fs_1.default.readFileSync(metaPath, 'utf-8'));
        }
        // Check if the requested Minecraft version is supported
        const versionExists = metaData.game.find((ver) => ver.version === this.options.loader.version);
        if (!versionExists) {
            return { error: `FabricMC doesn't support Minecraft ${this.options.loader.version}` };
        }
        // Extract all possible loader builds
        const availableBuilds = metaData.loader.map((b) => b.version);
        // If user wants the "latest" or "recommended" build, use the first in the array
        if (this.options.loader.build === 'latest' || this.options.loader.build === 'recommended') {
            selectedBuild = metaData.loader[0];
        }
        else {
            // Otherwise, search for a matching build
            selectedBuild = metaData.loader.find((loaderBuild) => loaderBuild.version === this.options.loader.build);
        }
        if (!selectedBuild) {
            return {
                error: `Fabric Loader ${this.options.loader.build} not found, Available builds: ${availableBuilds.join(', ')}`
            };
        }
        // Construct the final URL for fetching the Fabric JSON
        const url = Loader.json
            .replace('${build}', selectedBuild.version)
            .replace('${version}', this.options.loader.version);
        // Fetch and parse the JSON
        try {
            const response = await fetch(url);
            const fabricJson = await response.json();
            return fabricJson;
        }
        catch (err) {
            return { error: err.message || 'Failed to fetch or parse Fabric loader JSON' };
        }
    }
    /**
     * Iterates over the libraries in the Fabric JSON, checks if they exist locally,
     * and if not, downloads them. Skips libraries that have "rules" (usually platform-specific).
     *
     * @param json The Fabric loader JSON object with a "libraries" array.
     * @returns    The same libraries array after downloads, or an error object if something fails.
     */
    async downloadLibraries(json) {
        const { libraries } = json;
        const downloader = new Downloader_js_1.default();
        let pendingDownloads = [];
        let checkedCount = 0;
        let totalSize = 0;
        // Evaluate each library for possible download
        for (const lib of libraries) {
            // Skip if library has rules that might disqualify it for this platform
            if (lib.rules) {
                this.emit('check', checkedCount++, libraries.length, 'libraries');
                continue;
            }
            // Build the local file path
            const libInfo = (0, Index_js_1.getPathLibraries)(lib.name);
            const libFolder = path_1.default.resolve(this.options.path, 'libraries', libInfo.path);
            const libFilePath = path_1.default.resolve(libFolder, libInfo.name);
            // If it doesn't exist, prepare to download
            if (!fs_1.default.existsSync(libFilePath)) {
                const libUrl = `${lib.url}${libInfo.path}/${libInfo.name}`;
                let fileSize = 0;
                // Check if the file is available and get its size
                const checkRes = await downloader.checkURL(libUrl);
                if (checkRes && typeof checkRes === 'object' && 'status' in checkRes && checkRes.status === 200) {
                    fileSize = checkRes.size;
                    totalSize += fileSize;
                }
                pendingDownloads.push({
                    url: libUrl,
                    folder: libFolder,
                    path: libFilePath,
                    name: libInfo.name,
                    size: fileSize
                });
            }
            this.emit('check', checkedCount++, libraries.length, 'libraries');
        }
        // Download all missing libraries in bulk
        if (pendingDownloads.length > 0) {
            downloader.on('progress', (downloaded, total) => {
                this.emit('progress', downloaded, total, 'libraries');
            });
            await downloader.downloadFileMultiple(pendingDownloads, totalSize, this.options.downloadFileMultiple);
        }
        return libraries;
    }
}
exports.default = FabricMC;
//# sourceMappingURL=legacyFabric.js.map