/**
 * Represents the general structure of the options passed to MinecraftAssets.
 * You can expand or modify these fields as necessary for your specific use case.
 */
export interface MinecraftAssetsOptions {
    path: string;
    instance?: string;
}
/**
 * Represents a simplified version of the Minecraft version JSON structure.
 */
export interface VersionJSON {
    assetIndex?: {
        id: string;
        url: string;
    };
    assets?: string;
}
/**
 * Represents a single asset object in the final array returned by getAssets().
 */
export interface AssetItem {
    type: 'CFILE' | 'Assets';
    path: string;
    content?: string;
    sha1?: string;
    size?: number;
    url?: string;
}
/**
 * Class responsible for handling Minecraft asset index fetching
 * and optionally copying legacy assets to the correct directory.
 */
export default class MinecraftAssets {
    private assetIndex;
    private readonly options;
    constructor(options: MinecraftAssetsOptions);
    /**
     * Fetches the asset index from the provided JSON object, then constructs
     * and returns an array of asset download objects. These can be processed
     * by a downloader to ensure all assets are present locally.
     *
     * @param versionJson A JSON object containing an "assetIndex" field.
     * @returns An array of AssetItem objects with download info.
     */
    getAssets(versionJson: VersionJSON): Promise<AssetItem[]>;
    /**
     * Copies legacy assets (when using older versions of Minecraft) from
     * the main "objects" folder to a "resources" folder, preserving the
     * directory structure.
     *
     * @param versionJson A JSON object that has an "assets" property for the index name.
     */
    copyAssets(versionJson: VersionJSON): void;
}
