/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
/**
 * Represents a single library entry in the version JSON.
 * Adjust or extend this interface based on your actual JSON structure.
 */
interface MinecraftLibrary {
    name?: string;
    rules?: Array<{
        os?: {
            name: string;
        };
        action?: string;
    }>;
    natives?: Record<string, string>;
    downloads: {
        artifact?: {
            sha1: string;
            size: number;
            path: string;
            url: string;
        };
        classifiers?: Record<string, {
            sha1: string;
            size: number;
            path: string;
            url: string;
        }>;
    };
}
/**
 * Represents a Minecraft version JSON structure.
 * Extend this interface to reflect any additional fields you use.
 */
interface MinecraftVersionJSON {
    id: string;
    libraries: MinecraftLibrary[];
    downloads: {
        client: {
            sha1: string;
            size: number;
            url: string;
        };
    };
    [key: string]: any;
}
/**
 * Represents the user-provided options for the Libraries class.
 * Adjust as needed for your codebase.
 */
interface LibrariesOptions {
    path: string;
    instance?: string;
    [key: string]: any;
}
/**
 * Represents a file or library entry that needs to be downloaded and stored.
 */
interface LibraryDownload {
    sha1?: string;
    size?: number;
    path: string;
    type: string;
    url?: string;
    content?: string;
}
/**
 * This class is responsible for:
 *  - Gathering library download info from the version JSON
 *  - Handling custom asset entries if provided
 *  - Extracting native libraries for the current OS into the appropriate folder
 */
export default class Libraries {
    private json;
    private readonly options;
    constructor(options: LibrariesOptions);
    /**
     * Processes the provided Minecraft version JSON to build a list of libraries
     * that need to be downloaded (including the main client jar and the version JSON itself).
     *
     * @param json A MinecraftVersionJSON object (containing libraries, downloads, etc.)
     * @returns An array of LibraryDownload items describing each file.
     */
    Getlibraries(json: MinecraftVersionJSON): Promise<LibraryDownload[]>;
    /**
     * Fetches custom assets or libraries from a remote URL if provided.
     * This method expects the response to be an array of objects with
     * "path", "hash", "size", and "url".
     *
     * @param url The remote URL that returns a JSON array of CustomAssetItem
     * @returns   An array of LibraryDownload entries describing each item
     */
    GetAssetsOthers(url: string | null): Promise<LibraryDownload[]>;
    /**
     * Extracts native libraries from the downloaded jars (those marked type="Native")
     * and places them into the "natives" folder under "versions/<id>/natives".
     *
     * @param bundle An array of library entries (some of which may be natives)
     * @returns The paths of the native files that were extracted
     */
    natives(bundle: LibraryDownload[]): Promise<string[]>;
}
export {};
