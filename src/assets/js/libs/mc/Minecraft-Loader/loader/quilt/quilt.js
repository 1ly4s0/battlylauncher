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
 * This class handles fetching the Quilt loader metadata,
 * identifying the appropriate build for a given Minecraft version,
 * and downloading required libraries.
 */
class Quilt extends events_1.EventEmitter {
    constructor(options = { path: '', loader: { version: '', build: '' } }) {
        super();
        this.options = options;
    }
    /**
     * Fetches the Quilt loader metadata to identify the correct build for the specified
     * Minecraft version. If "latest" or "recommended" is requested, picks the most
     * recent or stable build accordingly.
     *
     * @param Loader An object describing where to fetch Quilt metadata and JSON.
     * @returns      A QuiltJSON object on success, or an error object if something fails.
     */
    async downloadJson(Loader) {
        let selectedBuild;
        const metaPath = path_1.default.join(this.options.path, 'mc-assets', 'quilt-meta.json');
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
        const mcVersionExists = metaData.game.find((ver) => ver.version === this.options.loader.version);
        if (!mcVersionExists) {
            return { error: `QuiltMC doesn't support Minecraft ${this.options.loader.version}` };
        }
        // Gather all available builds for this version
        const availableBuilds = metaData.loader.map((b) => b.version);
        // Determine which build to use
        if (this.options.loader.build === 'latest') {
            selectedBuild = metaData.loader[0];
        }
        else if (this.options.loader.build === 'recommended') {
            // Attempt to find a build that isn't labeled "beta"
            selectedBuild = metaData.loader.find((b) => !b.version.includes('beta'));
        }
        else {
            // Otherwise, match a specific build
            selectedBuild = metaData.loader.find((loaderItem) => loaderItem.version === this.options.loader.build);
        }
        if (!selectedBuild) {
            return {
                error: `QuiltMC Loader ${this.options.loader.build} not found, Available builds: ${availableBuilds.join(', ')}`
            };
        }
        // Build the URL for the Quilt loader profile JSON
        const url = Loader.json
            .replace('${build}', selectedBuild.version)
            .replace('${version}', this.options.loader.version);
        // Fetch the JSON profile
        try {
            const response = await fetch(url);
            const quiltJson = await response.json();
            return quiltJson;
        }
        catch (err) {
            return { error: err.message || 'Failed to fetch or parse Quilt loader JSON' };
        }
    }
    /**
     * Parses the Quilt JSON to determine which libraries need downloading, skipping
     * any that already exist or that are disqualified by "rules". Downloads them
     * in bulk using the Downloader utility.
     *
     * @param quiltJson A QuiltJSON object containing a list of libraries.
     * @returns         The final list of libraries, or an error if something fails.
     */
    async downloadLibraries(quiltJson) {
        const { libraries } = quiltJson;
        const downloader = new Downloader_js_1.default();
        let filesToDownload = [];
        let checkedLibraries = 0;
        let totalSize = 0;
        for (const lib of libraries) {
            // If rules exist, skip it (likely platform-specific logic)
            if (lib.rules) {
                this.emit('check', checkedLibraries++, libraries.length, 'libraries');
                continue;
            }
            // Construct the local path where this library should reside
            const libInfo = (0, Index_js_1.getPathLibraries)(lib.name);
            const libFolder = path_1.default.resolve(this.options.path, 'libraries', libInfo.path);
            const libFilePath = path_1.default.resolve(libFolder, libInfo.name);
            // If the library doesn't exist locally, prepare to download
            if (!fs_1.default.existsSync(libFilePath)) {
                const libUrl = `${lib.url}${libInfo.path}/${libInfo.name}`;
                let fileSize = 0;
                const checkResult = await downloader.checkURL(libUrl);
                if (checkResult && checkResult.status === 200) {
                    fileSize = checkResult.size;
                    totalSize += fileSize;
                }
                filesToDownload.push({
                    url: libUrl,
                    folder: libFolder,
                    path: libFilePath,
                    name: libInfo.name,
                    size: fileSize
                });
            }
            // Emit a "check" event for each library
            this.emit('check', checkedLibraries++, libraries.length, 'libraries');
        }
        // If there are libraries to download, proceed with the bulk download
        if (filesToDownload.length > 0) {
            downloader.on('progress', (downloaded, total) => {
                this.emit('progress', downloaded, total, 'libraries');
            });
            await downloader.downloadFileMultiple(filesToDownload, totalSize, this.options.downloadFileMultiple);
        }
        return libraries;
    }
}
exports.default = Quilt;
//# sourceMappingURL=quilt.js.map