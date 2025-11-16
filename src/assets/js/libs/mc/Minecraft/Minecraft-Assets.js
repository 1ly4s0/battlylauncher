"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Class responsible for handling Minecraft asset index fetching
 * and optionally copying legacy assets to the correct directory.
 */
class MinecraftAssets {
    constructor(options) {
        this.options = options;
    }
    /**
     * Fetches the asset index from the provided JSON object, then constructs
     * and returns an array of asset download objects. These can be processed
     * by a downloader to ensure all assets are present locally.
     *
     * @param versionJson A JSON object containing an "assetIndex" field.
     * @returns An array of AssetItem objects with download info.
     */
    async getAssets(versionJson) {
        this.assetIndex = versionJson.assetIndex;
        if (!this.assetIndex) {
            // If there's no assetIndex, there's nothing to download.
            return [];
        }
        // Determine the local cache path for the asset index
        const cacheDir = path_1.default.join(this.options.path, 'assets', 'indexes');
        const cachePath = path_1.default.join(cacheDir, `${this.assetIndex.id}.json`);
        // Try to read from cache first
        let data;
        try {
            if (fs_1.default.existsSync(cachePath)) {
                data = JSON.parse(fs_1.default.readFileSync(cachePath, 'utf-8'));
            }
            else {
                // If no cache, fetch from remote
                const response = await fetch(this.assetIndex.url);
                data = await response.json();
                // Cache the fetched data
                fs_1.default.mkdirSync(cacheDir, { recursive: true });
                fs_1.default.writeFileSync(cachePath, JSON.stringify(data, null, 2));
            }
        }
        catch (err) {
            if (fs_1.default.existsSync(cachePath)) {
                try {
                    data = JSON.parse(fs_1.default.readFileSync(cachePath, 'utf-8'));
                }
                catch (cacheErr) {
                    throw new Error(`Failed to read cached asset index: ${cacheErr.message}`);
                }
            }
            else {
                throw new Error(`Failed to fetch asset index and no cache available: ${err.message}`);
            }
        }
        // First item is the index file itself, which we'll store locally
        const assetsArray = [
            {
                type: 'CFILE',
                path: `assets/indexes/${this.assetIndex.id}.json`,
                content: JSON.stringify(data)
            }
        ];
        // Convert the "objects" property into a list of individual assets
        const objects = Object.values(data.objects || {});
        for (const obj of objects) {
            assetsArray.push({
                type: 'Assets',
                sha1: obj.hash,
                size: obj.size,
                path: `assets/objects/${obj.hash.substring(0, 2)}/${obj.hash}`,
                url: `https://resources.download.minecraft.net/${obj.hash.substring(0, 2)}/${obj.hash}`
            });
        }
        return assetsArray;
    }
    /**
     * Copies legacy assets (when using older versions of Minecraft) from
     * the main "objects" folder to a "resources" folder, preserving the
     * directory structure.
     *
     * @param versionJson A JSON object that has an "assets" property for the index name.
     */
    copyAssets(versionJson) {
        // Determine the legacy directory where resources should go
        let legacyDirectory = `${this.options.path}/resources`;
        if (this.options.instance) {
            legacyDirectory = `${this.options.path}/instances/${this.options.instance}/resources`;
        }
        // The path to the local asset index JSON
        const pathAssets = `${this.options.path}/assets/indexes/${versionJson.assets}.json`;
        if (!fs_1.default.existsSync(pathAssets)) {
            return; // Nothing to copy if the file doesn't exist
        }
        // Parse the asset index JSON
        let assetsData;
        try {
            assetsData = JSON.parse(fs_1.default.readFileSync(pathAssets, 'utf-8'));
        }
        catch (err) {
            throw new Error(`Failed to read assets index file: ${err.message}`);
        }
        // Each entry is [filePath, { hash, size }]
        const assetsEntries = Object.entries(assetsData.objects || {});
        for (const [filePath, hashData] of assetsEntries) {
            const hashObj = hashData;
            const fullHash = hashObj.hash;
            const subHash = fullHash.substring(0, 2);
            // Directory where the hashed file is stored
            const subAssetDir = `${this.options.path}/assets/objects/${subHash}`;
            // If needed, create the corresponding directories in the legacy folder
            const pathSegments = filePath.split('/');
            pathSegments.pop(); // Remove the last segment (the filename itself)
            if (!fs_1.default.existsSync(`${legacyDirectory}/${pathSegments.join('/')}`)) {
                fs_1.default.mkdirSync(`${legacyDirectory}/${pathSegments.join('/')}`, { recursive: true });
            }
            // Copy the file if it doesn't already exist in the legacy location
            const sourceFile = `${subAssetDir}/${fullHash}`;
            const targetFile = `${legacyDirectory}/${filePath}`;
            if (!fs_1.default.existsSync(targetFile)) {
                fs_1.default.copyFileSync(sourceFile, targetFile);
            }
        }
    }
}
exports.default = MinecraftAssets;
//# sourceMappingURL=Minecraft-Assets.js.map