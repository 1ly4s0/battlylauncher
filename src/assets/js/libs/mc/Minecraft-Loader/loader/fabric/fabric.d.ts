/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
/**
 * Represents the options needed by the FabricMC class.
 * You can expand this if your code requires more specific fields.
 */
interface FabricOptions {
    path: string;
    downloadFileMultiple?: number;
    loader: {
        version: string;
        build: string;
    };
}
/**
 * Represents the Loader object that holds metadata URLs and JSON paths.
 * For instance, it might look like:
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
 * Structure of a library entry in the Fabric JSON manifest.
 * Extend this interface if you have additional fields like "rules", etc.
 */
interface FabricLibrary {
    name: string;
    url: string;
    rules?: Array<any>;
}
/**
 * The JSON object returned by Fabric metadata endpoints.
 */
interface FabricJSON {
    libraries: FabricLibrary[];
    [key: string]: any;
}
/**
 * This class handles downloading Fabric loader JSON metadata,
 * resolving the correct build, and downloading the required libraries.
 */
export default class FabricMC extends EventEmitter {
    private readonly options;
    constructor(options: FabricOptions);
    /**
     * Fetches the Fabric loader metadata to find the correct build for the given
     * Minecraft version. If the specified build is "latest" or "recommended",
     * it uses the first (most recent) entry. Otherwise, it looks up a specific build.
     *
     * @param Loader A LoaderObject describing metadata and json URL templates.
     * @returns A JSON object representing the Fabric loader profile, or an error object.
     */
    downloadJson(Loader: LoaderObject): Promise<FabricJSON | {
        error: string;
    }>;
    /**
     * Downloads any missing libraries defined in the Fabric JSON manifest,
     * skipping those that already exist locally (or that have rules preventing download).
     *
     * @param fabricJson The Fabric JSON object with a `libraries` array.
     * @returns The same `libraries` array after downloading as needed.
     */
    downloadLibraries(fabricJson: FabricJSON): Promise<FabricLibrary[]>;
}
export {};
