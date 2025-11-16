/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
/**
 * Describes the loader options, including a path and other configurations.
 * You can expand this interface if your real code requires more fields.
 */
interface LoaderOptions {
    path: string;
    loader: {
        path?: string;
        type?: string;
        build?: string;
    };
    downloadFileMultiple?: number;
}
/**
 * Represents the MinecraftLoader class options, merging LoaderOptions
 * with any additional fields your code might require.
 */
interface MinecraftLoaderOptions extends LoaderOptions {
    [key: string]: any;
}
/**
 * A simple interface describing the JSON structure returned by loader installation.
 * Adjust to reflect the actual fields from your loader JSON.
 */
interface LoaderJSON {
    libraries: Array<{
        loader?: string;
        name?: string;
    }>;
    arguments?: {
        game?: string[];
        jvm?: string[];
    };
    mainClass?: string;
    [key: string]: any;
}
/**
 * This class manages the installation and argument-building for a Minecraft
 * mod loader (e.g. Forge, Fabric). It wraps a `loaderDownloader` and emits
 * the same events for progress, extraction, patching, etc.
 */
export default class MinecraftLoader extends EventEmitter {
    private options;
    private loaderPath;
    constructor(options: MinecraftLoaderOptions);
    /**
     * Installs the loader for a given Minecraft version using a LoaderDownloader,
     * returning the loader's JSON on completion. This function emits several events
     * for progress reporting and patch notifications.
     *
     * @param version  The Minecraft version (e.g. "1.19.2")
     * @param javaPath Path to the Java executable used by the loader for patching
     * @returns        A Promise that resolves to the loader's JSON configuration
     */
    GetLoader(version: string, javaPath: string): Promise<LoaderJSON>;
    /**
     * Builds the game and JVM arguments based on the loader's JSON data.
     * This may involve placeholder replacements for the main class, library directories, etc.
     *
     * @param json    The loader JSON previously returned by GetLoader (or null)
     * @param version The targeted Minecraft version (used for placeholder substitution)
     * @returns       An object with `game`, `jvm`, and an optional `mainClass` property
     */
    GetArguments(json: LoaderJSON | null, version: string): Promise<{
        game: string[];
        jvm: string[];
        mainClass?: string;
    }>;
}
export {};
