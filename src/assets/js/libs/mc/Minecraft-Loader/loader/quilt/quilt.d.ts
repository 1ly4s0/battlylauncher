/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
/**
 * Represents the Quilt loader configuration within the user's options.
 */
interface QuiltLoaderConfig {
    version: string;
    build: string;
}
/**
 * The main options object passed to the Quilt class.
 * You can extend this as needed by your application.
 */
interface QuiltOptions {
    path: string;
    loader: QuiltLoaderConfig;
    downloadFileMultiple?: number;
    [key: string]: any;
}
/**
 * Describes the data needed for fetching Quilt metadata and loader JSON.
 * For example:
 * {
 *   metaData: "https://meta.quiltmc.org/v3/versions",
 *   json: "https://meta.quiltmc.org/v3/versions/loader/${version}/${build}/profile/json"
 * }
 */
interface LoaderObject {
    metaData: string;
    json: string;
}
/**
 * A structure for one library entry in the Quilt loader JSON.
 */
interface QuiltLibrary {
    name: string;
    url: string;
    rules?: Array<unknown>;
}
/**
 * The JSON object typically returned by the Quilt API,
 * containing an array of libraries and possibly other fields.
 */
interface QuiltJSON {
    libraries: QuiltLibrary[];
    [key: string]: any;
}
/**
 * This class handles fetching the Quilt loader metadata,
 * identifying the appropriate build for a given Minecraft version,
 * and downloading required libraries.
 */
export default class Quilt extends EventEmitter {
    private readonly options;
    private versionMinecraft;
    constructor(options?: QuiltOptions);
    /**
     * Fetches the Quilt loader metadata to identify the correct build for the specified
     * Minecraft version. If "latest" or "recommended" is requested, picks the most
     * recent or stable build accordingly.
     *
     * @param Loader An object describing where to fetch Quilt metadata and JSON.
     * @returns      A QuiltJSON object on success, or an error object if something fails.
     */
    downloadJson(Loader: LoaderObject): Promise<QuiltJSON | {
        error: string;
    }>;
    /**
     * Parses the Quilt JSON to determine which libraries need downloading, skipping
     * any that already exist or that are disqualified by "rules". Downloads them
     * in bulk using the Downloader utility.
     *
     * @param quiltJson A QuiltJSON object containing a list of libraries.
     * @returns         The final list of libraries, or an error if something fails.
     */
    downloadLibraries(quiltJson: QuiltJSON): Promise<QuiltLibrary[]>;
}
export {};
