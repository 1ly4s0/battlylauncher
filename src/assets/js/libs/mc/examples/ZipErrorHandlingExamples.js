"use strict";
/**
 * Example usage of the ZIP error handling and automatic redownload functionality
 *
 * This demonstrates how to detect and handle the ADM-ZIP error:
 * "Error: ADM-ZIP: Invalid or unsupported zip format. No END header found"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateZipExample = validateZipExample;
exports.redownloadCorruptedFile = redownloadCorruptedFile;
exports.safeZipExtraction = safeZipExtraction;
exports.processForgeJar = processForgeJar;
exports.validateMultipleZips = validateMultipleZips;
const ZipErrorHandler_js_1 = require("../utils/ZipErrorHandler.js");
const Index_js_1 = require("../utils/Index.js");
/**
 * Example 1: Basic ZIP validation
 */
async function validateZipExample(filePath) {
    console.log(`Validating ZIP file: ${filePath}`);
    const validation = ZipErrorHandler_js_1.ZipErrorHandler.validateZipFile(filePath);
    if (validation.isValid) {
        console.log('✅ ZIP file is valid');
    }
    else {
        console.error('❌ ZIP file is corrupted:', validation.error);
        if (validation.needsRedownload) {
            console.log('💡 This file should be redownloaded');
        }
    }
}
/**
 * Example 2: Automatic redownload of corrupted file
 */
async function redownloadCorruptedFile(filePath, downloadUrl) {
    console.log(`Checking and potentially redownloading: ${filePath}`);
    try {
        await ZipErrorHandler_js_1.ZipErrorHandler.redownloadFile({
            url: downloadUrl,
            filePath: filePath,
            maxRetries: 3,
            timeout: 30000
        });
        console.log('✅ File redownloaded successfully');
    }
    catch (error) {
        console.error('❌ Failed to redownload file:', error);
    }
}
/**
 * Example 3: Enhanced ZIP extraction with automatic recovery
 */
async function safeZipExtraction(jarPath, targetFile, redownloadUrl) {
    console.log(`Extracting ${targetFile} from ${jarPath}`);
    try {
        const content = await (0, Index_js_1.getFileFromArchiveWithRecovery)(jarPath, targetFile, null, redownloadUrl);
        if (content) {
            console.log('✅ File extracted successfully');
            return content;
        }
        else {
            console.log('⚠️ File not found in archive');
            return null;
        }
    }
    catch (error) {
        console.error('❌ Extraction failed:', error.message);
        // Provide helpful error messages for common issues
        if (error.message.includes('Invalid or unsupported zip format')) {
            console.log('💡 Suggestion: The ZIP/JAR file appears to be corrupted. Try providing a redownload URL.');
        }
        else if (error.message.includes('No END header found')) {
            console.log('💡 Suggestion: The ZIP file may be incomplete. Check if the download was interrupted.');
        }
        return null;
    }
}
/**
 * Example 4: Forge/NeoForge JAR processing with error handling
 */
async function processForgeJar(jarPath, forgeVersion, downloadUrl) {
    console.log(`Processing Forge JAR: ${jarPath}`);
    try {
        // Try to extract the install profile
        const installProfile = await (0, Index_js_1.getFileFromArchiveWithRecovery)(jarPath, 'install_profile.json', null, downloadUrl);
        if (!installProfile) {
            throw new Error('install_profile.json not found in Forge JAR');
        }
        const profileData = JSON.parse(installProfile.toString());
        console.log('✅ Forge install profile loaded successfully');
        // Try to extract version JSON
        const versionJson = await (0, Index_js_1.getFileFromArchiveWithRecovery)(jarPath, `version.json`, null, downloadUrl);
        return {
            installProfile: profileData,
            versionJson: versionJson ? JSON.parse(versionJson.toString()) : null,
            version: forgeVersion
        };
    }
    catch (error) {
        console.error('❌ Failed to process Forge JAR:', error.message);
        // Specific handling for ZIP corruption errors
        if (error.message.includes('ADM-ZIP') ||
            error.message.includes('Invalid or unsupported zip format')) {
            console.log('🔄 Detected ZIP corruption, attempting recovery...');
            if (downloadUrl) {
                try {
                    await ZipErrorHandler_js_1.ZipErrorHandler.redownloadFile({
                        url: downloadUrl,
                        filePath: jarPath,
                        maxRetries: 2
                    });
                    // Retry processing after redownload
                    console.log('🔄 Retrying Forge JAR processing after redownload...');
                    return processForgeJar(jarPath, forgeVersion); // Recursive call without URL to prevent infinite loops
                }
                catch (redownloadError) {
                    console.error('❌ Failed to recover corrupted Forge JAR:', redownloadError);
                }
            }
            else {
                console.log('💡 No download URL provided for automatic recovery');
            }
        }
        throw error;
    }
}
/**
 * Example 5: Batch validation of multiple ZIP files
 */
async function validateMultipleZips(filePaths) {
    console.log(`Validating ${filePaths.length} ZIP files...`);
    const results = filePaths.map(filePath => ({
        path: filePath,
        validation: ZipErrorHandler_js_1.ZipErrorHandler.validateZipFile(filePath)
    }));
    const valid = results.filter(r => r.validation.isValid);
    const invalid = results.filter(r => !r.validation.isValid);
    const needRedownload = invalid.filter(r => r.validation.needsRedownload);
    console.log(`✅ Valid files: ${valid.length}`);
    console.log(`❌ Invalid files: ${invalid.length}`);
    console.log(`🔄 Need redownload: ${needRedownload.length}`);
    if (needRedownload.length > 0) {
        console.log('\nFiles that should be redownloaded:');
        needRedownload.forEach(r => {
            console.log(`  - ${r.path}: ${r.validation.error}`);
        });
    }
}
//# sourceMappingURL=ZipErrorHandlingExamples.js.map