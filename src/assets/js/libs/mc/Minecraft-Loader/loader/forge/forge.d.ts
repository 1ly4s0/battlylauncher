/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
import { Profile } from '../../patcher.js';
/**
 * Options passed to ForgeMC. Adjust as needed.
 */
interface ForgeOptions {
    path: string;
    loader: {
        version: string;
        build: string;
        config: {
            javaPath: string;
            minecraftJar: string;
            minecraftJson: string;
        };
        type: string;
    };
    downloadFileMultiple?: number;
    [key: string]: any;
}
/**
 * Represents information about the Forge installer file after download:
 * - If successful, contains filePath, metaData, ext, and an id (e.g. "forge-<build>")
 * - If an error occurs, returns an object with `error` describing the issue.
 */
type DownloadInstallerResult = {
    filePath: string;
    metaData: string;
    ext: string;
    id: string;
} | {
    error: string;
};
/**
 * Describes the structure of an install_profile.json (Forge Installer) after extraction.
 */
interface ForgeProfile extends Profile {
    install?: {
        libraries?: any[];
        [key: string]: any;
    };
    version?: {
        libraries?: any[];
        [key: string]: any;
    };
    filePath?: string;
    path?: string;
    [key: string]: any;
}
/**
 * The main class for handling Forge installations, including:
 *  - Downloading the appropriate Forge installer
 *  - Extracting relevant files from the installer
 *  - Patching Forge when necessary
 *  - Creating a merged jar for older Forge versions
 */
export default class ForgeMC extends EventEmitter {
    private readonly options;
    constructor(options: ForgeOptions);
    /**
     * Downloads the Forge installer (or client/universal) for the specified version/build.
     * Verifies the downloaded file's MD5 hash. Returns file details or an error.
     *
     * @param Loader An object containing URLs for metadata and Forge files.
     */
    downloadInstaller(Loader: any): Promise<DownloadInstallerResult>;
    /**
     * Extracts the main Forge profile from the installer's archive (install_profile.json),
     * plus an additional JSON if specified in that profile. Returns an object containing
     * both "install" and "version" data for further processing.
     *
     * @param pathInstaller Path to the downloaded Forge installer file.
     */
    extractProfile(pathInstaller: string): Promise<{
        error?: any;
        install?: any;
        version?: any;
    }>;
    /**
     * Extracts the "universal" Forge jar (or other relevant data) from the installer,
     * placing it in your local "libraries" folder. Also extracts client data if required.
     *
     * @param profile The Forge profile object containing file paths to extract.
     * @param pathInstaller The path to the Forge installer file.
     * @returns A boolean (skipForgeFilter) that indicates whether to filter out certain Forge libs
     */
    extractUniversalJar(profile: ForgeProfile, pathInstaller: string): Promise<boolean>;
    /**
     * Downloads all the libraries needed by the Forge profile, skipping duplicates
     * and any library that is already present. Also applies optional skip logic
     * for certain Forge libraries if skipForgeFilter is true.
     *
     * @param profile The parsed Forge profile.
     * @param skipForgeFilter Whether to filter out "net.minecraftforge:forge" or "minecraftforge"
     * @returns An array of the final libraries (including newly downloaded ones).
     */
    downloadLibraries(profile: ForgeProfile, skipForgeFilter: boolean): Promise<any[] | {
        error: string;
    }>;
    /**
     * Applies any necessary patches to Forge using the `forgePatcher` class.
     * If the patcher determines it's already patched, it skips.
     *
     * @param profile The Forge profile containing processor information
     * @returns True if successful or if no patching was required
     */
    patchForge(profile: ForgeProfile): Promise<boolean>;
    /**
     * For older Forge versions, merges the vanilla Minecraft jar and Forge installer files
     * into a single jar. Writes a modified version.json reflecting the new Forge version.
     *
     * @param id The new version ID (e.g., "forge-1.12.2-14.23.5.2855")
     * @param pathInstaller Path to the Forge installer
     * @returns A modified version.json with an isOldForge property and a jarPath
     */
    createProfile(id: string, pathInstaller: string): Promise<any>;
}
export {};
