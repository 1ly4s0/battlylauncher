/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Utility for handling corrupted ZIP files and automatic redownload functionality
 */
export interface ZipValidationResult {
    isValid: boolean;
    error?: string;
    needsRedownload?: boolean;
}
export interface RedownloadOptions {
    /** The URL to redownload from */
    url: string;
    /** Local path where the file should be saved */
    filePath: string;
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Timeout for each download attempt (ms) */
    timeout?: number;
    /** Optional Maven coordinates for constructing mirror URLs */
    mavenCoordinates?: string;
    /** List of Maven mirrors to try */
    mavenMirrors?: string[];
}
/**
 * Enhanced ZIP error handler that can detect corrupted ZIP files
 * and automatically redownload them when needed.
 */
export declare class ZipErrorHandler {
    private static readonly ZIP_ERRORS;
    private static readonly NEOFORGE_MIRRORS;
    private static readonly DEFAULT_MAVEN_MIRRORS;
    /**
     * Validates if a ZIP/JAR file is properly formatted and readable.
     *
     * @param filePath Path to the ZIP/JAR file to validate
     * @returns Validation result with error details if invalid
     */
    static validateZipFile(filePath: string): ZipValidationResult;
    /**
     * Constructs Maven URLs from coordinates and mirrors
     */
    private static constructMavenUrls;
    /**
     * Specialized recovery method for NeoForge installer JARs.
     * Tries multiple mirrors and methods to download a working installer.
     *
     * @param installerPath Local path to the corrupted installer
     * @param version NeoForge version (e.g., "21.10.21-beta")
     * @param originalUrl Original download URL that failed
     * @returns Promise that resolves when a valid installer is downloaded
     */
    static recoverNeoForgeInstaller(installerPath: string, version: string, originalUrl?: string): Promise<void>;
    /**
     * Attempts to redownload a corrupted file with retry logic.
     * Now supports Maven coordinate resolution for library files.
     *
     * @param options Redownload configuration
     * @returns Promise that resolves when download is complete or rejects after max retries
     */
    static redownloadFile(options: RedownloadOptions): Promise<void>;
    /**
     * Extracts Maven coordinates from a file system path
     * Example: /path/to/libraries/com/google/gson/2.10.1/gson-2.10.1.jar -> com.google.gson:gson:2.10.1
     */
    static extractMavenCoordinatesFromPath(filePath: string): string | null;
    /**
     * Enhanced version of getFileFromArchive that handles corrupted ZIP files
     * and attempts automatic redownload if a URL is provided.
     * Now supports automatic Maven coordinate detection for library files.
     *
     * @param jarPath Path to the ZIP/JAR file
     * @param file Specific file to extract (null for all files)
     * @param prefix Path prefix filter
     * @param redownloadUrl Optional URL for automatic redownload on corruption
     * @param enableMavenLookup Whether to attempt Maven mirror lookup for library files
     * @returns File content or array of files
     */
    static getFileFromArchiveWithRecovery(jarPath: string, file?: string | null, prefix?: string | null, redownloadUrl?: string, enableMavenLookup?: boolean): Promise<any>;
    /**
     * Extracts files from a ZIP/JAR archive with automatic error recovery
     * This is the primary entry point that combines validation and extraction
     */
    static getFileFromArchive(jarPath: string, file?: string | null, prefix?: string | null, redownloadUrl?: string): Promise<any>;
}
export default ZipErrorHandler;
