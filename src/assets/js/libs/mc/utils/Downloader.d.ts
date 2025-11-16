/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
/**
 * Describes a single file to be downloaded by the Downloader class.
 */
export interface DownloadOptions {
    /** The URL to download from */
    url: string;
    /** Local path (including filename) where the file will be saved */
    path: string;
    /** The total length of the file (in bytes), if known */
    length?: number;
    /** Local folder in which the file's path resides */
    folder: string;
    /** Optional type descriptor, used when emitting 'progress' events */
    type?: string;
}
/**
 * A class responsible for downloading single or multiple files,
 * emitting events for progress, speed, estimated time, and errors.
 */
export default class Downloader extends EventEmitter {
    /**
     * Safely converts a web ReadableStream to a Node.js Readable stream
     * with enhanced reliability and corruption prevention
     */
    private streamToNodeReadable;
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
    downloadFile(url: string, dirPath: string, fileName: string): Promise<void>;
    /**
     * Downloads using native HTTP/HTTPS modules as a fallback when Web Streams fail.
     * This is more reliable for large files and environments where Web Streams are problematic.
     */
    private downloadWithNativeHttp;
    /**
     * Basic validation for JAR files to detect obvious corruption
     */
    private validateJarFile;
    /**
     * Clean up temporary files
     */
    private cleanupTempFile;
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
    downloadFileMultiple(files: DownloadOptions[], size: number, limit?: number, timeout?: number): Promise<void>;
    /**
     * Performs a HEAD request on the given URL to check if it is valid (status=200)
     * and retrieves the "content-length" if available.
     *
     * @param url The URL to check
     * @param timeout Time in ms before the request times out
     * @returns An object containing { size, status } or rejects with false
     */
    checkURL(url: string, timeout?: number): Promise<{
        size: number;
        status: number;
    } | false>;
    /**
     * Tries each mirror in turn, constructing an URL (mirror + baseURL). If a valid
     * response is found (status=200), it returns the final URL and size. Otherwise, returns false.
     *
     * @param baseURL The relative path (e.g. "group/id/artifact.jar")
     * @param mirrors An array of possible mirror base URLs
     * @returns An object { url, size, status } if found, or false if all mirrors fail
     */
    checkMirror(baseURL: string, mirrors: string[]): Promise<{
        url: string;
        size: number;
        status: number;
    } | false>;
}
