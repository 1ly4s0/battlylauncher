/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
/**
 * Basic structure for options passed to the Json class.
 * Modify or expand based on your actual usage.
 */
export interface JsonOptions {
    version: string;
    [key: string]: any;
}
/**
 * Represents a single version entry from Mojang's version manifest.
 */
export interface VersionEntry {
    id: string;
    type: string;
    url: string;
    time: string;
    releaseTime: string;
}
/**
 * Structure of the Mojang version manifest (simplified).
 */
export interface MojangVersionManifest {
    latest: {
        release: string;
        snapshot: string;
    };
    versions: VersionEntry[];
}
/**
 * Structure returned by the getInfoVersion method on success.
 */
export interface GetInfoVersionResult {
    InfoVersion: VersionEntry;
    json: any;
    version: string;
}
/**
 * Structure returned by getInfoVersion if an error occurs (version not found).
 */
export interface GetInfoVersionError {
    error: true;
    message: string;
}
/**
 * This class retrieves Minecraft version information from Mojang's
 * version manifest, and optionally processes the JSON for ARM-based Linux.
 */
export default class Json {
    private readonly options;
    constructor(options: JsonOptions);
    /**
     * Fetches the Mojang version manifest, resolves the intended version (release, snapshot, etc.),
     * and returns the associated JSON object for that version.
     * If the system is Linux ARM, it will run additional processing on the JSON.
     *
     * @returns An object containing { InfoVersion, json, version }, or an error object.
     */
    GetInfoVersion(): Promise<GetInfoVersionResult | GetInfoVersionError>;
}
