/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { ZipErrorHandler } from './ZipErrorHandler.js';
import DependencyResolver from './DependencyResolver.js';
interface LibraryRule {
    action: 'allow' | 'disallow';
    os?: {
        name?: string;
    };
    features?: any;
}
/**
 * Represents a Library object, possibly containing rules or additional fields.
 * Adjust according to your actual library structure.
 */
interface MinecraftLibrary {
    name: string;
    rules?: LibraryRule[];
    downloads?: {
        artifact?: {
            url?: string;
            size?: number;
        };
    };
    natives?: Record<string, string>;
    [key: string]: any;
}
/**
 * Represents a minimal version JSON structure to check if it's considered "old" (pre-1.6 or legacy).
 */
interface MinecraftVersionJSON {
    assets?: string;
    [key: string]: any;
}
/**
 * Parses a Gradle/Maven identifier string (like "net.minecraftforge:forge:1.19-41.0.63")
 * into a local file path (group/artifact/version) and final filename (artifact-version.jar).
 * Optionally allows specifying a native string suffix or forcing an extension.
 *
 * @param main         A Gradle-style coordinate (group:artifact:version[:classifier])
 * @param nativeString A suffix for native libraries (e.g., "-natives-linux")
 * @param forceExt     A forced file extension (default is ".jar")
 * @returns An object with `path` and `name`, where `path` is the directory path and `name` is the filename
 */
declare function getPathLibraries(main: string, nativeString?: string, forceExt?: string): {
    path: string;
    name: string;
};
/**
 * Computes a hash (default SHA-1) of the given file by streaming its contents.
 *
 * @param filePath   Full path to the file on disk
 * @param algorithm  Hashing algorithm (default: "sha1")
 * @returns          A Promise resolving to the hex string of the file's hash
 */
declare function getFileHash(filePath: string, algorithm?: string): Promise<string>;
/**
 * Determines if a given Minecraft version JSON is considered "old"
 * by checking its assets field (e.g., "legacy" or "pre-1.6").
 *
 * @param json The Minecraft version JSON
 * @returns true if it's an older version, false otherwise
 */
declare function isold(json: MinecraftVersionJSON): boolean;
/**
 * Returns metadata necessary to download specific loaders (Forge, Fabric, etc.)
 * based on a loader type string (e.g., "forge", "fabric").
 * If the loader type is unrecognized, returns undefined.
 *
 * @param type A string representing the loader type
 */
declare function loader(type: string): {
    metaData: string;
    meta: string;
    promotions: string;
    install: string;
    universal: string;
    client: string;
    legacyMetaData?: undefined;
    legacyInstall?: undefined;
    json?: undefined;
} | {
    legacyMetaData: string;
    metaData: string;
    legacyInstall: string;
    install: string;
    meta?: undefined;
    promotions?: undefined;
    universal?: undefined;
    client?: undefined;
    json?: undefined;
} | {
    metaData: string;
    json: string;
    meta?: undefined;
    promotions?: undefined;
    install?: undefined;
    universal?: undefined;
    client?: undefined;
    legacyMetaData?: undefined;
    legacyInstall?: undefined;
};
/**
 * A list of potential Maven mirrors for downloading libraries.
 */
declare const mirrors: string[];
/**
 * Reads a .jar or .zip file, returning specific entries or listing file entries in the archive.
 * Uses adm-zip under the hood.
 *
 * @deprecated Use getFileFromArchiveWithRecovery for better error handling
 * @param jar    Full path to the jar/zip file
 * @param file   The file entry to extract data from (e.g., "install_profile.json"). If null, returns all entries or partial lists.
 * @param prefix A path prefix filter (e.g., "maven/org/lwjgl/") if you want a list of matching files instead of direct extraction
 * @returns      A buffer or an array of { name, data }, or a list of filenames if prefix is given
 */
declare function getFileFromArchive(jar: string, file?: string | null, prefix?: string | null): Promise<any>;
/**
 * Enhanced version of getFileFromArchive with automatic error recovery.
 * Detects corrupted ZIP files and can automatically redownload them.
 * Now supports automatic Maven coordinate detection for library files.
 *
 * @param jar               Full path to the jar/zip file
 * @param file              The file entry to extract data from. If null, returns all entries or partial lists.
 * @param prefix            A path prefix filter if you want a list of matching files instead of direct extraction
 * @param redownloadUrl     Optional URL for automatic redownload on corruption
 * @param enableMavenLookup Whether to attempt Maven mirror lookup for library files (default: true)
 * @returns                 A buffer or an array of { name, data }, or a list of filenames if prefix is given
 */
declare function getFileFromArchiveWithRecovery(jar: string, file?: string | null, prefix?: string | null, redownloadUrl?: string, enableMavenLookup?: boolean): Promise<any>;
/**
 * Creates a new ZIP buffer by combining multiple file entries (name, data),
 * optionally ignoring entries containing a certain string (e.g. "META-INF").
 *
 * @param files   An array of { name, data } objects to include in the new zip
 * @param ignored A substring to skip any matching files
 * @returns       A buffer containing the newly created ZIP
 */
declare function createZIP(files: {
    name: string;
    data: Buffer;
}[], ignored?: string | null): Promise<Buffer>;
/**
 * Determines if a library should be skipped based on its 'rules' property.
 * For example, it might skip libraries if action='disallow' for the current OS,
 * or if there are specific conditions not met.
 *
 * @param lib A library object (with optional 'rules' array)
 * @returns true if the library should be skipped, false otherwise
 */
declare function skipLibrary(lib: MinecraftLibrary): boolean;
export { getPathLibraries, getFileHash, isold, loader, mirrors, getFileFromArchive, getFileFromArchiveWithRecovery, createZIP, skipLibrary, DependencyResolver, ZipErrorHandler };
