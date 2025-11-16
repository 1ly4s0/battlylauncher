/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
import { Profile } from '../../patcher.js';
/**
 * Options passed to NeoForgeMC, including paths, loader configs, etc.
 * Adjust according to your application's specifics.
 */
interface NeoForgeOptions {
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
 * A structure to describe the loader object with metadata, legacy vs. new API, etc.
 * For example:
 * {
 *   legacyMetaData: 'https://.../legacyMetadata.json',
 *   metaData: 'https://.../metadata.json',
 *   legacyInstall: 'https://.../NeoForge-${version}.jar',
 *   install: 'https://.../NeoForge-${version}.jar'
 * }
 */
interface LoaderObject {
    legacyMetaData: string;
    metaData: string;
    legacyInstall: string;
    install: string;
}
/**
 * Represents the result of downloading the NeoForge installer, or an error.
 */
interface DownloadInstallerResult {
    filePath?: string;
    oldAPI?: boolean;
    error?: string;
}
/**
 * Represents the structure of a NeoForge install_profile.json
 * after extraction from the installer jar.
 */
interface NeoForgeProfile extends Profile {
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
 * This class handles downloading and installing NeoForge (formerly Forge) for Minecraft,
 * including picking the correct build, extracting libraries, and running patchers if needed.
 */
export default class NeoForgeMC extends EventEmitter {
    private readonly options;
    private installerUrl?;
    constructor(options: NeoForgeOptions);
    /**
     * Enhanced wrapper around getFileFromArchiveWithRecovery specifically for NeoForge installer JARs.
     * Automatically provides multiple recovery methods if the installer JAR is corrupted.
     */
    private safeExtractFromInstaller;
    /**
     * Downloads the NeoForge installer jar for the specified version and build,
     * either using a legacy API or the newer metaData approach. If "latest" or "recommended"
     * is specified, it picks the newest build from the filtered list.
     *
     * @param Loader An object containing URLs and patterns for legacy and new metadata/installers.
     * @returns      An object with filePath and oldAPI fields, or an error.
     */
    downloadInstaller(Loader: LoaderObject): Promise<DownloadInstallerResult>;
    /**
     * Extracts the main JSON profile (install_profile.json) from the NeoForge installer.
     * If the JSON references an additional file, it also extracts and parses that, returning
     * a unified object with `install` and `version` keys.
     *
     * @param pathInstaller Full path to the downloaded NeoForge installer jar.
     * @returns A NeoForgeProfile object, or an error if invalid.
     */
    extractProfile(pathInstaller: string): Promise<NeoForgeProfile | {
        error: any;
    }>;
    /**
     * Extracts the universal jar or associated files for NeoForge into the local "libraries" directory.
     * Also handles client.lzma if processors are present. Returns a boolean indicating whether we skip
     * certain neoforge libraries in subsequent steps.
     *
     * @param profile    The extracted NeoForge profile with file path references
     * @param pathInstaller Path to the NeoForge installer
     * @param oldAPI     Whether we are dealing with the old or new NeoForge API (affects library naming)
     * @returns          A boolean indicating if we should filter out certain libraries afterwards
     */
    extractUniversalJar(profile: NeoForgeProfile, pathInstaller: string, oldAPI: boolean): Promise<boolean>;
    /**
     * Downloads all libraries referenced in the NeoForge profile. If skipNeoForgeFilter is true,
     * certain core libraries are excluded. Checks for duplicates and local existence before downloading.
     *
     * @param profile           The NeoForge profile containing version/install libraries
     * @param skipNeoForgeFilter Whether we skip specific "net.minecraftforge:neoforged" libs
     * @returns An array of library objects after download, or an error object if something fails
     */
    downloadLibraries(profile: NeoForgeProfile, skipNeoForgeFilter: boolean): Promise<any[] | {
        error: string;
    }>;
    /**
     * Runs the NeoForge patch process, if any processors exist. Checks if patching is needed,
     * then uses the `NeoForgePatcher` class. If the patch is already applied, it skips.
     *
     * @param profile The NeoForge profile, which may include processors.
     * @param oldAPI  Whether we are dealing with the old or new API (passed to the patcher).
     * @returns       True on success or if no patch was needed.
     */
    patchneoForge(profile: NeoForgeProfile, oldAPI: boolean): Promise<boolean>;
}
export {};
