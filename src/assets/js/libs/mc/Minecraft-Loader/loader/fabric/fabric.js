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
const events_1 = require("events");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Index_js_1 = require("../../../utils/Index.js");
const Downloader_js_1 = __importDefault(require("../../../utils/Downloader.js"));
/**
 * This class handles downloading Fabric loader JSON metadata,
 * resolving the correct build, and downloading the required libraries.
 */
class FabricMC extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }
    /**
     * Fetches the Fabric loader metadata to find the correct build for the given
     * Minecraft version. If the specified build is "latest" or "recommended",
     * it uses the first (most recent) entry. Otherwise, it looks up a specific build.
     *
     * @param Loader A LoaderObject describing metadata and json URL templates.
     * @returns A JSON object representing the Fabric loader profile, or an error object.
     */
    async downloadJson(Loader) {
        let buildInfo;
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
        // Check if the Minecraft version is supported
        const version = metaData.game.find(v => v.version === this.options.loader.version);
        if (!version) {
            return { error: `FabricMC doesn't support Minecraft ${this.options.loader.version}` };
        }
        // Determine the loader build
        const availableBuilds = metaData.loader.map(b => b.version);
        if (this.options.loader.build === 'latest' || this.options.loader.build === 'recommended') {
            buildInfo = metaData.loader[0]; // The first entry is presumably the latest
        }
        else {
            buildInfo = metaData.loader.find(l => l.version === this.options.loader.build);
        }
        if (!buildInfo) {
            return {
                error: `Fabric Loader ${this.options.loader.build} not found, Available builds: ${availableBuilds.join(', ')}`
            };
        }
        // Build the URL for the Fabric JSON using placeholders
        const url = Loader.json
            .replace('${build}', buildInfo.version)
            .replace('${version}', this.options.loader.version);
        // Fetch the Fabric loader JSON
        try {
            const result = await fetch(url);
            const fabricJson = await result.json();
            return fabricJson;
        }
        catch (err) {
            return { error: err.message || 'An error occurred while fetching Fabric JSON' };
        }
    }
    /**
     * Downloads any missing libraries defined in the Fabric JSON manifest,
     * skipping those that already exist locally (or that have rules preventing download).
     *
     * @param fabricJson The Fabric JSON object with a `libraries` array.
     * @returns The same `libraries` array after downloading as needed.
     */
    async downloadLibraries(fabricJson) {
        const { libraries } = fabricJson;
        const downloader = new Downloader_js_1.default();
        const downloadQueue = [];
        let checkedLibraries = 0;
        let totalSize = 0;
        // Identify which libraries need downloading
        for (const lib of libraries) {
            // Skip if there are any rules that prevent downloading
            if (lib.rules) {
                this.emit('check', checkedLibraries++, libraries.length, 'libraries');
                continue;
            }
            // Parse out the library path
            const libInfo = (0, Index_js_1.getPathLibraries)(lib.name);
            const libFolderPath = path_1.default.resolve(this.options.path, 'libraries', libInfo.path);
            const libFilePath = path_1.default.resolve(libFolderPath, libInfo.name);
            // If the file doesn't exist locally, we prepare a download item
            if (!fs_1.default.existsSync(libFilePath)) {
                const libUrl = `${lib.url}${libInfo.path}/${libInfo.name}`;
                let sizeFile = 0;
                // Check if the file is accessible and retrieve its size
                const res = await downloader.checkURL(libUrl);
                if (res && typeof res === 'object' && 'status' in res && res.status === 200) {
                    sizeFile = res.size;
                    totalSize += res.size;
                }
                downloadQueue.push({
                    url: libUrl,
                    folder: libFolderPath,
                    path: libFilePath,
                    name: libInfo.name,
                    size: sizeFile
                });
            }
            // Emit a "check" event for progress tracking
            this.emit('check', checkedLibraries++, libraries.length, 'libraries');
        }
        // If there are files to download, do so now
        if (downloadQueue.length > 0) {
            downloader.on('progress', (downloaded, total) => {
                this.emit('progress', downloaded, total, 'libraries');
            });
            await downloader.downloadFileMultiple(downloadQueue, totalSize, this.options.downloadFileMultiple);
        }
        return libraries;
    }
}
exports.default = FabricMC;
//# sourceMappingURL=fabric.js.map