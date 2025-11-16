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
const events_1 = require("events");
const path_1 = __importDefault(require("path"));
// Note: Adjust the import path according to your actual TypeScript setup.
const index_js_1 = __importDefault(require("../Minecraft-Loader/index.js"));
/**
 * This class manages the installation and argument-building for a Minecraft
 * mod loader (e.g. Forge, Fabric). It wraps a `loaderDownloader` and emits
 * the same events for progress, extraction, patching, etc.
 */
class MinecraftLoader extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.loaderPath = path_1.default.join(this.options.path, this.options.loader.path);
    }
    /**
     * Installs the loader for a given Minecraft version using a LoaderDownloader,
     * returning the loader's JSON on completion. This function emits several events
     * for progress reporting and patch notifications.
     *
     * @param version  The Minecraft version (e.g. "1.19.2")
     * @param javaPath Path to the Java executable used by the loader for patching
     * @returns        A Promise that resolves to the loader's JSON configuration
     */
    async GetLoader(version, javaPath) {
        const loader = new index_js_1.default({
            path: this.loaderPath,
            downloadFileMultiple: this.options.downloadFileMultiple,
            loader: {
                type: this.options.loader.type,
                version: version,
                build: this.options.loader.build,
                config: {
                    javaPath,
                    minecraftJar: `${this.options.path}/versions/${version}/${version}.jar`,
                    minecraftJson: `${this.options.path}/versions/${version}/${version}.json`
                }
            }
        });
        return new Promise((resolve, reject) => {
            loader.install();
            loader.on('json', (json) => {
                // Inject the loader path into each library if needed
                const modifiedJson = json;
                modifiedJson.libraries = modifiedJson.libraries.map(lib => {
                    lib.loader = this.loaderPath;
                    return lib;
                });
                resolve(modifiedJson);
            });
            loader.on('extract', (extract) => {
                // Forward the "extract" event
                this.emit('extract', extract);
            });
            loader.on('progress', (progress, size, element) => {
                // Forward the "progress" event
                this.emit('progress', progress, size, element);
            });
            loader.on('check', (progress, size, element) => {
                // Forward the "check" event
                this.emit('check', progress, size, element);
            });
            loader.on('patch', (patch) => {
                // Forward the "patch" event
                this.emit('patch', patch);
            });
            loader.on('error', (err) => {
                reject(err);
            });
        });
    }
    /**
     * Builds the game and JVM arguments based on the loader's JSON data.
     * This may involve placeholder replacements for the main class, library directories, etc.
     *
     * @param json    The loader JSON previously returned by GetLoader (or null)
     * @param version The targeted Minecraft version (used for placeholder substitution)
     * @returns       An object with `game`, `jvm`, and an optional `mainClass` property
     */
    async GetArguments(json, version) {
        // If no loader JSON is provided, return empty arrays
        if (json === null) {
            return { game: [], jvm: [] };
        }
        const moddedArgs = json.arguments;
        // If no arguments field is present, return empty arrays
        if (!moddedArgs)
            return { game: [], jvm: [] };
        const args = {};
        if (moddedArgs.game) {
            args.game = moddedArgs.game;
        }
        if (moddedArgs.jvm) {
            // Replace placeholders in the JVM arguments
            args.jvm = moddedArgs.jvm.map((jvmArg) => jvmArg
                .replace(/\${version_name}/g, version)
                .replace(/\${library_directory}/g, `${this.loaderPath}/libraries`)
                .replace(/\${classpath_separator}/g, process.platform === 'win32' ? ';' : ':'));
        }
        args.mainClass = json.mainClass;
        return {
            game: args.game || [],
            jvm: args.jvm || [],
            mainClass: args.mainClass
        };
    }
}
exports.default = MinecraftLoader;
//# sourceMappingURL=Minecraft-Loader.js.map