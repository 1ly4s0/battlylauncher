/**
 * Example usage of the ZIP error handling and automatic redownload functionality
 *
 * This demonstrates how to detect and handle the ADM-ZIP error:
 * "Error: ADM-ZIP: Invalid or unsupported zip format. No END header found"
 */
/**
 * Example 1: Basic ZIP validation
 */
export declare function validateZipExample(filePath: string): Promise<void>;
/**
 * Example 2: Automatic redownload of corrupted file
 */
export declare function redownloadCorruptedFile(filePath: string, downloadUrl: string): Promise<void>;
/**
 * Example 3: Enhanced ZIP extraction with automatic recovery
 */
export declare function safeZipExtraction(jarPath: string, targetFile: string, redownloadUrl?: string): Promise<Buffer | null>;
/**
 * Example 4: Forge/NeoForge JAR processing with error handling
 */
export declare function processForgeJar(jarPath: string, forgeVersion: string, downloadUrl?: string): Promise<any>;
/**
 * Example 5: Batch validation of multiple ZIP files
 */
export declare function validateMultipleZips(filePaths: string[]): Promise<void>;
