/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
/**
 * Represents a single file or object that may need to be downloaded or checked.
 */
export interface BundleItem {
    type?: 'CFILE' | 'Assets' | string;
    path: string;
    folder?: string;
    content?: string;
    sha1?: string;
    size?: number;
    url?: string;
}
/**
 * Options for the MinecraftBundle class, indicating paths and ignored files.
 */
export interface MinecraftBundleOptions {
    path: string;
    instance?: string;
    ignored: string[];
}
/**
 * This class manages checking, downloading, and cleaning up Minecraft files.
 * It compares local files with a provided bundle, identifies missing or
 * outdated files, and can remove extraneous files.
 */
export default class MinecraftBundle {
    private options;
    constructor(options: MinecraftBundleOptions);
    /**
     * Checks each item in the provided bundle to see if it needs to be
     * downloaded or updated (e.g., if hashes don't match).
     *
     * @param bundle Array of file items describing what needs to be on disk.
     * @returns Array of BundleItem objects that require downloading.
     */
    checkBundle(bundle: BundleItem[]): Promise<BundleItem[]>;
    /**
     * Calculates the total download size of all files in the bundle.
     *
     * @param bundle Array of items in the bundle (with a 'size' field).
     * @returns Sum of all file sizes in bytes.
     */
    getTotalSize(bundle: BundleItem[]): Promise<number>;
    /**
     * Removes files or directories that should not be present, i.e., those
     * not listed in the bundle and not in the "ignored" list.
     * If the file is a directory, it's removed recursively.
     *
     * @param bundle Array of BundleItems representing valid files.
     */
    checkFiles(bundle: BundleItem[]): Promise<void>;
    /**
     * Recursively gathers all files in a given directory path.
     * If a directory is empty, it is also added to the returned array.
     *
     * @param dirPath The starting directory path to walk.
     * @param collectedFiles Used internally to store file paths.
     * @returns The array of all file paths (and empty directories) under dirPath.
     */
    private getFiles;
}
