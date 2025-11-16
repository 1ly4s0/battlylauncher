"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
const stream_1 = require("stream");
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
/**
 * A class responsible for downloading single or multiple files,
 * emitting events for progress, speed, estimated time, and errors.
 */
class Downloader extends events_1.EventEmitter {
    /**
     * Safely converts a web ReadableStream to a Node.js Readable stream
     * with enhanced reliability and corruption prevention
     */
    async streamToNodeReadable(webStream) {
        if (!webStream) {
            throw new Error('No readable stream provided');
        }
        // Check if it's already a Node.js Readable stream
        if (webStream && typeof webStream.pipe === 'function') {
            return webStream;
        }
        // Enhanced stream conversion with better error handling
        try {
            // Try the modern approach first (Node.js 16.5+)
            if (typeof stream_1.Readable.fromWeb === 'function' &&
                webStream &&
                typeof webStream.getReader === 'function') {
                // Additional validation to ensure the stream is in good state
                const testReader = webStream.getReader();
                testReader.releaseLock(); // Release immediately to avoid locking
                return stream_1.Readable.fromWeb(webStream);
            }
        }
        catch (error) {
            console.warn('Readable.fromWeb failed:', error.message, '- using enhanced fallback method');
        }
        // Enhanced fallback: Manual stream conversion with better reliability
        if (!webStream || typeof webStream.getReader !== 'function') {
            throw new Error('Invalid web stream - no getReader method available');
        }
        const reader = webStream.getReader();
        let isDestroyed = false;
        return new stream_1.Readable({
            async read() {
                if (isDestroyed)
                    return;
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null); // End the stream
                    }
                    else {
                        // Enhanced chunk processing with validation
                        let chunk;
                        if (value instanceof Uint8Array) {
                            chunk = Buffer.from(value);
                        }
                        else if (value instanceof ArrayBuffer) {
                            chunk = Buffer.from(value);
                        }
                        else if (Buffer.isBuffer(value)) {
                            chunk = value;
                        }
                        else {
                            // Handle other data types by converting to Buffer
                            chunk = Buffer.from(String(value), 'binary');
                        }
                        // Validate chunk before pushing
                        if (chunk.length > 0) {
                            this.push(chunk);
                        }
                    }
                }
                catch (error) {
                    if (!isDestroyed) {
                        // Make sure to release the reader on error
                        try {
                            await reader.cancel();
                        }
                        catch (cancelError) {
                            // Ignore cancel errors
                        }
                        this.destroy(error);
                    }
                }
            },
            async destroy(err, callback) {
                isDestroyed = true;
                // Clean up the reader when the stream is destroyed
                try {
                    await reader.cancel();
                }
                catch (cancelError) {
                    // Ignore cancel errors during cleanup
                }
                callback(err);
            }
        });
    }
    /**
     * Downloads a single file from the given URL to the specified local path.
     * Enhanced with integrity checking and better error handling for JAR files.
     * Now uses native HTTP when Web Streams fail consistently.
     * Emits "progress" events with the number of bytes downloaded and total size.
     *
     * @param url - The remote URL to download from
     * @param dirPath - Local folder path where the file is saved
     * @param fileName - Name of the file (e.g., "mod.jar")
     */
    async downloadFile(url, dirPath, fileName) {
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
        const filePath = path_1.default.join(dirPath, fileName);
        const tempPath = filePath + '.tmp';
        // Use temporary file to avoid corruption if download is interrupted
        const writer = fs_1.default.createWriteStream(tempPath);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const contentLength = response.headers.get('content-length');
            const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
            let downloaded = 0;
            return new Promise(async (resolve, reject) => {
                try {
                    // Try using Web Streams first, with immediate fallback to alternative method
                    let stream = null;
                    let useNativeHttp = false;
                    try {
                        stream = await this.streamToNodeReadable(response.body);
                    }
                    catch (streamError) {
                        console.warn(`Stream conversion failed: ${streamError.message}, using native HTTP method`);
                        useNativeHttp = true;
                    }
                    if (useNativeHttp || !stream) {
                        // Fallback: Use native HTTP/HTTPS for more reliable downloads
                        writer.destroy();
                        this.cleanupTempFile(tempPath);
                        await this.downloadWithNativeHttp(url, tempPath, (bytesDownloaded, total) => {
                            this.emit('progress', bytesDownloaded, total);
                        });
                        // Validate file size
                        const stats = fs_1.default.statSync(tempPath);
                        if (totalSize > 0 && stats.size !== totalSize) {
                            throw new Error(`Download incomplete: expected ${totalSize} bytes, got ${stats.size} bytes`);
                        }
                        // Basic integrity check for JAR files
                        if (fileName.endsWith('.jar')) {
                            if (!this.validateJarFile(tempPath)) {
                                throw new Error(`Downloaded JAR file appears to be corrupted: ${fileName}`);
                            }
                        }
                        // Move temp file to final location
                        if (fs_1.default.existsSync(filePath)) {
                            fs_1.default.unlinkSync(filePath);
                        }
                        fs_1.default.renameSync(tempPath, filePath);
                        resolve();
                        return;
                    }
                    // Continue with Web Streams if successful
                    stream.on('data', (chunk) => {
                        downloaded += chunk.length;
                        // Emit progress with the current number of bytes vs. total size
                        this.emit('progress', downloaded, totalSize);
                        writer.write(chunk);
                    });
                    stream.on('end', () => {
                        writer.end();
                        // Validate file size matches expected
                        if (totalSize > 0 && downloaded !== totalSize) {
                            const error = new Error(`Download incomplete: expected ${totalSize} bytes, got ${downloaded} bytes`);
                            this.emit('error', error);
                            reject(error);
                            return;
                        }
                        // Move temp file to final location
                        try {
                            if (fs_1.default.existsSync(filePath)) {
                                fs_1.default.unlinkSync(filePath);
                            }
                            fs_1.default.renameSync(tempPath, filePath);
                            // Basic integrity check for JAR files
                            if (fileName.endsWith('.jar')) {
                                if (!this.validateJarFile(filePath)) {
                                    const error = new Error(`Downloaded JAR file appears to be corrupted: ${fileName}`);
                                    this.emit('error', error);
                                    reject(error);
                                    return;
                                }
                            }
                            resolve();
                        }
                        catch (moveError) {
                            this.emit('error', moveError);
                            reject(moveError);
                        }
                    });
                    stream.on('error', (err) => {
                        writer.destroy();
                        this.cleanupTempFile(tempPath);
                        this.emit('error', err);
                        reject(err);
                    });
                    // Set a timeout for the download
                    const timeout = setTimeout(() => {
                        stream.destroy();
                        writer.destroy();
                        this.cleanupTempFile(tempPath);
                        const timeoutError = new Error(`Download timeout after 60 seconds: ${fileName}`);
                        this.emit('error', timeoutError);
                        reject(timeoutError);
                    }, 60000);
                    stream.on('end', () => clearTimeout(timeout));
                    stream.on('error', () => clearTimeout(timeout));
                }
                catch (err) {
                    writer.destroy();
                    this.cleanupTempFile(tempPath);
                    this.emit('error', err);
                    reject(err);
                }
            });
        }
        catch (err) {
            writer.destroy();
            this.cleanupTempFile(tempPath);
            throw err;
        }
    }
    /**
     * Downloads using native HTTP/HTTPS modules as a fallback when Web Streams fail.
     * This is more reliable for large files and environments where Web Streams are problematic.
     */
    async downloadWithNativeHttp(url, filePath, onProgress) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https_1.default : http_1.default;
            const request = client.get(url, (response) => {
                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                const totalSize = parseInt(response.headers['content-length'] || '0', 10);
                let downloaded = 0;
                const writer = fs_1.default.createWriteStream(filePath);
                response.on('data', (chunk) => {
                    downloaded += chunk.length;
                    onProgress(downloaded, totalSize);
                    writer.write(chunk);
                });
                response.on('end', () => {
                    writer.end();
                    resolve();
                });
                response.on('error', (err) => {
                    writer.destroy();
                    reject(err);
                });
                writer.on('error', (err) => {
                    response.destroy();
                    reject(err);
                });
            });
            request.on('error', (err) => {
                reject(err);
            });
            request.setTimeout(60000, () => {
                request.destroy();
                reject(new Error('Download timeout'));
            });
        });
    }
    /**
     * Basic validation for JAR files to detect obvious corruption
     */
    validateJarFile(filePath) {
        try {
            const stats = fs_1.default.statSync(filePath);
            // Check if file is empty
            if (stats.size === 0) {
                console.warn(`JAR file is empty: ${filePath}`);
                return false;
            }
            // Check if file has minimum size (JAR files should be at least a few KB)
            if (stats.size < 1024) {
                console.warn(`JAR file is suspiciously small (${stats.size} bytes): ${filePath}`);
                return false;
            }
            // Check for basic ZIP signature (JAR files are ZIP files)
            const buffer = Buffer.alloc(4);
            const fd = fs_1.default.openSync(filePath, 'r');
            fs_1.default.readSync(fd, buffer, 0, 4, 0);
            fs_1.default.closeSync(fd);
            // ZIP files start with 'PK' (0x504B)
            if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
                console.warn(`JAR file does not have valid ZIP signature: ${filePath}`);
                return false;
            }
            return true;
        }
        catch (error) {
            console.warn(`Failed to validate JAR file ${filePath}:`, error.message);
            return false;
        }
    }
    /**
     * Clean up temporary files
     */
    cleanupTempFile(tempPath) {
        try {
            if (fs_1.default.existsSync(tempPath)) {
                fs_1.default.unlinkSync(tempPath);
            }
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }
    /**
     * Downloads multiple files concurrently (up to the specified limit).
     * Emits "progress" events with cumulative bytes downloaded vs. total size,
     * as well as "speed" and "estimated" events for speed and ETA calculations.
     *
     * @param files - An array of DownloadOptions describing each file
     * @param size - The total size (in bytes) of all files to be downloaded
     * @param limit - The maximum number of simultaneous downloads
     * @param timeout - A timeout in milliseconds for each fetch request
     */
    async downloadFileMultiple(files, size, limit = 1, timeout = 10000) {
        if (limit > files.length)
            limit = files.length;
        let completed = 0; // Number of downloads completed
        let downloaded = 0; // Cumulative bytes downloaded
        let queued = 0; // Index of the next file to download
        let start = Date.now();
        let before = 0;
        const speeds = [];
        const estimated = setInterval(() => {
            const duration = (Date.now() - start) / 1000;
            const chunkDownloaded = downloaded - before;
            if (speeds.length >= 5)
                speeds.shift();
            speeds.push(chunkDownloaded / duration);
            const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
            this.emit('speed', avgSpeed);
            const timeRemaining = (size - downloaded) / avgSpeed;
            this.emit('estimated', timeRemaining);
            start = Date.now();
            before = downloaded;
        }, 500);
        const downloadNext = async () => {
            if (queued >= files.length)
                return;
            const file = files[queued++];
            if (!fs_1.default.existsSync(file.folder)) {
                fs_1.default.mkdirSync(file.folder, { recursive: true, mode: 0o777 });
            }
            const writer = fs_1.default.createWriteStream(file.path, { flags: 'w', mode: 0o777 });
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(file.url, { signal: controller.signal });
                clearTimeout(timeoutId);
                const stream = await this.streamToNodeReadable(response.body);
                stream.on('data', (chunk) => {
                    downloaded += chunk.length;
                    this.emit('progress', downloaded, size, file.type);
                    writer.write(chunk);
                });
                stream.on('end', () => {
                    writer.end();
                    completed++;
                    downloadNext();
                });
                stream.on('error', (err) => {
                    writer.destroy();
                    this.emit('error', err);
                    completed++;
                    downloadNext();
                });
            }
            catch (e) {
                clearTimeout(timeoutId);
                writer.destroy();
                this.emit('error', e);
                completed++;
                downloadNext();
            }
        };
        // Start "limit" concurrent downloads
        for (let i = 0; i < limit; i++) {
            downloadNext();
        }
        // Wait until all downloads complete
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (completed === files.length) {
                    clearInterval(estimated);
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
    /**
     * Performs a HEAD request on the given URL to check if it is valid (status=200)
     * and retrieves the "content-length" if available.
     *
     * @param url The URL to check
     * @param timeout Time in ms before the request times out
     * @returns An object containing { size, status } or rejects with false
     */
    async checkURL(url, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const res = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.status === 200) {
                const contentLength = res.headers.get('content-length');
                const size = contentLength ? parseInt(contentLength, 10) : 0;
                return { size, status: 200 };
            }
            return false;
        }
        catch (e) {
            clearTimeout(timeoutId);
            return false;
        }
    }
    /**
     * Tries each mirror in turn, constructing an URL (mirror + baseURL). If a valid
     * response is found (status=200), it returns the final URL and size. Otherwise, returns false.
     *
     * @param baseURL The relative path (e.g. "group/id/artifact.jar")
     * @param mirrors An array of possible mirror base URLs
     * @returns An object { url, size, status } if found, or false if all mirrors fail
     */
    async checkMirror(baseURL, mirrors) {
        for (const mirror of mirrors) {
            const testURL = `${mirror}/${baseURL}`;
            const res = await this.checkURL(testURL);
            if (res !== false && res.status === 200) {
                return {
                    url: testURL,
                    size: res.size,
                    status: 200
                };
            }
        }
        return false;
    }
}
exports.default = Downloader;
//# sourceMappingURL=Downloader.js.map