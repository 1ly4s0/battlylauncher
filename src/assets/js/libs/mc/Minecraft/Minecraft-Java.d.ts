/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import EventEmitter from 'events';
/**
 * Represents the Java-specific options a user might pass to the downloader.
 */
export interface JavaDownloaderOptions {
    path: string;
    java: {
        version?: string;
        type: string;
    };
    intelEnabledMac?: boolean;
}
/**
 * A generic JSON structure for the Minecraft version, which may include
 * a javaVersion property. Adjust as needed to fit your actual data.
 */
export interface MinecraftVersionJSON {
    javaVersion?: {
        component?: string;
        majorVersion?: number;
    };
}
/**
 * Structure returned by getJavaFiles() and getJavaOther().
 */
export interface JavaDownloadResult {
    files: JavaFileItem[];
    path: string;
    error?: boolean;
    message?: string;
}
/**
 * Represents a single Java file entry that might need downloading.
 */
export interface JavaFileItem {
    path: string;
    executable?: boolean;
    sha1?: string;
    size?: number;
    url?: string;
    type?: string;
}
/**
 * Manages the download and extraction of the correct Java runtime for Minecraft.
 * It supports both Mojang's curated list of Java runtimes and the Adoptium fallback.
 */
export default class JavaDownloader extends EventEmitter {
    private options;
    constructor(options: JavaDownloaderOptions);
    /**
     * Retrieves Java files from Mojang's runtime metadata if possible,
     * otherwise falls back to getJavaOther().
     *
     * @param jsonversion A JSON object describing the Minecraft version (with optional javaVersion).
     * @returns An object containing a list of JavaFileItems and the final path to "java".
     */
    getJavaFiles(jsonversion: MinecraftVersionJSON): Promise<JavaDownloadResult>;
    /**
     * Fallback method to download Java from Adoptium if Mojang's metadata is unavailable
     * or doesn't have the appropriate runtime for the user's platform/arch.
     *
     * @param jsonversion A Minecraft version JSON (with optional javaVersion).
     * @param versionDownload A forced Java version (string) if provided by the user.
     */
    getJavaOther(jsonversion: MinecraftVersionJSON, versionDownload?: string): Promise<JavaDownloadResult>;
    /**
     * Maps the Node `os.platform()` and `os.arch()` to Adoptium's expected format.
     * Apple Silicon can optionally download x64 if `intelEnabledMac` is true.
     */
    private getPlatformArch;
    /**
     * Verifies if the Java archive already exists and matches the expected checksum.
     * If it doesn't exist or fails the hash check, it downloads from the given URL.
     *
     * @param params.filePath   The local file path
     * @param params.pathFolder The folder to place the file in
     * @param params.fileName   The name of the file
     * @param params.url        The remote download URL
     * @param params.checksum   Expected SHA-256 hash
     */
    private verifyAndDownloadFile;
    /**
     * Extracts the given archive (ZIP or 7Z), using the `node-7z` library and the system's 7z binary.
     * Emits an "extract" event with the extraction progress (percent).
     *
     * @param filePath  Path to the archive file
     * @param destPath  Destination folder to extract into
     */
    private extract;
}
