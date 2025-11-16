/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
/**
 * Represents the "loader" part of the user's options, containing version info for Minecraft and Fabric.
 */
interface FabricLoaderConfig {
    version: string;
    build: string;
}
/**
 * Overall options passed to FabricMC.
 * Adjust or extend according to your project needs.
 */
interface FabricOptions {
    path: string;
    loader: FabricLoaderConfig;
    downloadFileMultiple?: number;
    [key: string]: any;
}
/**
 * This object typically references the metadata and JSON URLs for the Fabric API,
 * for example:
 * {
 *   metaData: 'https://meta.fabricmc.net/v2/versions',
 *   json: 'https://meta.fabricmc.net/v2/versions/loader/${version}/${build}/profile/json'
 * }
 */
interface LoaderObject {
    metaData: string;
    json: string;
}
/**
 * Represents one library entry in the Fabric loader JSON.
 */
interface FabricLibrary {
    name: string;
    url: string;
    rules?: Array<any>;
}
/**
 * Represents the final JSON object fetched for the Fabric loader,
 * containing an array of libraries.
 */
interface FabricJSON {
    libraries: FabricLibrary[];
    [key: string]: any;
}
/**
 * A class that handles downloading the Fabric loader JSON metadata
 * and the libraries needed to launch Fabric.
 */
export default class FabricMC extends EventEmitter {
    private readonly options;
    constructor(options?: FabricOptions);
    /**
     * Fetches metadata from the Fabric API to identify the correct build for the given version.
     * If the build is "latest" or "recommended", it picks the first entry from the loader array.
     * Otherwise, it tries to match the specific build requested by the user.
     *
     * @param Loader A LoaderObject with metaData and json URLs for Fabric.
     * @returns      A FabricJSON object on success, or an error object.
     */
    downloadJson(Loader: LoaderObject): Promise<FabricJSON | {
        error: string;
    }>;
    /**
     * Iterates over the libraries in the Fabric JSON, checks if they exist locally,
     * and if not, downloads them. Skips libraries that have "rules" (usually platform-specific).
     *
     * @param json The Fabric loader JSON object with a "libraries" array.
     * @returns    The same libraries array after downloads, or an error object if something fails.
     */
    downloadLibraries(json: FabricJSON): Promise<FabricLibrary[]>;
}
export {};
