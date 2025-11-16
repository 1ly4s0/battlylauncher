/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
/**
 * Represents the user's selected loader type (Forge, Fabric, etc.).
 * Extend or refine as your application requires.
 */
export type LoaderType = 'forge' | 'neoforge' | 'fabric' | 'legacyfabric' | 'quilt';
/**
 * Configuration for the loader (build, version, etc.).
 * For instance: { type: "forge", version: "1.19.2", build: "latest" }
 */
export interface LoaderConfig {
    type: LoaderType;
    version: string;
    build: string;
    config: {
        javaPath: string;
        minecraftJar: string;
        minecraftJson: string;
    };
}
/**
 * The overall options passed to our Loader class,
 * containing path information and loader configuration.
 */
export interface LoaderOptions {
    path: string;
    loader: LoaderConfig;
    [key: string]: any;
}
/**
 * A generic type to represent the JSON objects returned by
 * Forge, NeoForge, Fabric, etc., after an installation.
 */
export interface LoaderResult {
    id?: string;
    error?: string;
    [key: string]: any;
}
/**
 * The main Loader class that orchestrates installation of different
 * Minecraft mod loaders (Forge, Fabric, LegacyFabric, Quilt, etc.).
 * It extends EventEmitter to provide "check", "progress", "extract", "patch", and "error" events.
 */
export default class Loader extends EventEmitter {
    private readonly options;
    constructor(options: LoaderOptions);
    /**
     * Main entry point for installing the selected loader.
     * Checks the loader type from `this.options.loader.type` and delegates to the appropriate method.
     * Emits:
     *  - "error" if the loader is not found or if an installation step fails
     *  - "json" upon successful completion, returning the version JSON or loader info
     */
    install(): Promise<void>;
    /**
     * Handles Forge installation by:
     *  1. Downloading the installer
     *  2. Depending on installer type, extracting an install profile or creating a merged Jar
     *  3. Downloading required libraries
     *  4. Patching Forge if necessary
     *  5. Returns the final version JSON object or an error
     */
    private forge;
    /**
     * Manages installation flow for NeoForge:
     *  1. Download the installer
     *  2. Extract the install profile
     *  3. Extract the universal jar
     *  4. Download libraries
     *  5. Patch if needed
     */
    private neoForge;
    /**
     * Installs Fabric:
     *  1. Download the loader JSON
     *  2. Save it as a version .json
     *  3. Download required libraries
     */
    private fabric;
    /**
     * Installs Legacy Fabric:
     *  1. Download JSON
     *  2. Save version .json
     *  3. Download libraries
     */
    private legacyFabric;
    /**
     * Installs Quilt:
     *  1. Download the loader JSON
     *  2. Write to a version file
     *  3. Download required libraries
     */
    private quilt;
}
