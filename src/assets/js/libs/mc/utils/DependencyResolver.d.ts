/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Enhanced dependency resolver for NeoForge/Forge that handles missing dependencies
 * and classpath issues by automatically downloading required libraries.
 */
export interface DependencyInfo {
    groupId: string;
    artifactId: string;
    version: string;
    classifier?: string;
    fileName: string;
    url?: string;
}
export interface MissingDependency {
    dependency: DependencyInfo;
    reason: 'missing_file' | 'corrupted_file' | 'classpath_error';
    errorMessage?: string;
}
/**
 * Comprehensive dependency resolver that handles missing and corrupted JAR files
 * for NeoForge/Forge installations, with automatic dependency resolution.
 */
export declare class DependencyResolver {
    private readonly librariesPath;
    private readonly downloader;
    private readonly downloadAttempts;
    private readonly maxDownloadAttempts;
    private static readonly COMMON_DEPENDENCIES;
    private static readonly MAVEN_MIRRORS;
    constructor(librariesPath: string);
    /**
     * Analyzes a Java error message to extract missing dependency information
     */
    static analyzeMissingDependency(errorMessage: string): DependencyInfo | null;
    /**
     * Constructs Maven URL from dependency coordinates
     */
    private constructMavenUrl;
    /**
     * Gets the local path where a dependency should be stored
     */
    private getDependencyPath;
    /**
     * Downloads a single dependency from Maven repositories
     * Includes fallback to alternative versions for critical dependencies
     */
    downloadDependency(dependency: DependencyInfo): Promise<boolean>;
    /**
     * Downloads a specific dependency version without fallbacks
     */
    private downloadDependencyExact;
    /**
     * Scans for missing or corrupted dependencies in the libraries directory
     */
    scanForMissingDependencies(requiredDependencies?: DependencyInfo[]): Promise<MissingDependency[]>;
    /**
     * Resolves missing dependencies by downloading them
     */
    resolveMissingDependencies(errorMessage?: string): Promise<boolean>;
    /**
     * Enhanced dependency resolution with retry logic for specific error patterns
     */
    resolveFromErrorLog(errorLog: string): Promise<boolean>;
}
export default DependencyResolver;
