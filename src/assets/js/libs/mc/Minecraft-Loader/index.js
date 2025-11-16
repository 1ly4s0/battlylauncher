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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Index_js_1 = require("../utils/Index.js");
// Loader sub-classes (Forge, NeoForge, etc.)
// Adjust the import paths based on your project's actual file structure.
const forge_js_1 = __importDefault(require("./loader/forge/forge.js"));
const neoForge_js_1 = __importDefault(require("./loader/neoForge/neoForge.js"));
const fabric_js_1 = __importDefault(require("./loader/fabric/fabric.js"));
const legacyFabric_js_1 = __importDefault(require("./loader/legacyfabric/legacyFabric.js"));
const quilt_js_1 = __importDefault(require("./loader/quilt/quilt.js"));
/**
 * The main Loader class that orchestrates installation of different
 * Minecraft mod loaders (Forge, Fabric, LegacyFabric, Quilt, etc.).
 * It extends EventEmitter to provide "check", "progress", "extract", "patch", and "error" events.
 */
class Loader extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }
    /**
     * Main entry point for installing the selected loader.
     * Checks the loader type from `this.options.loader.type` and delegates to the appropriate method.
     * Emits:
     *  - "error" if the loader is not found or if an installation step fails
     *  - "json" upon successful completion, returning the version JSON or loader info
     */
    async install() {
        // Retrieve a loader definition from your `loaderFunction`
        // (Presumably a function that returns metadata URLs, etc. based on the type.)
        const LoaderData = (0, Index_js_1.loader)(this.options.loader.type);
        if (!LoaderData) {
            this.emit('error', { error: `Loader ${this.options.loader.type} not found` });
            return;
        }
        const loaderType = this.options.loader.type;
        let result;
        switch (loaderType) {
            case 'forge': {
                result = await this.forge(LoaderData);
                break;
            }
            case 'neoforge': {
                result = await this.neoForge(LoaderData);
                break;
            }
            case 'fabric': {
                result = await this.fabric(LoaderData);
                break;
            }
            case 'legacyfabric': {
                result = await this.legacyFabric(LoaderData);
                break;
            }
            case 'quilt': {
                result = await this.quilt(LoaderData);
                break;
            }
            default: {
                this.emit('error', { error: `Loader ${loaderType} not found` });
                return;
            }
        }
        // If there's an error property, emit it. Otherwise, emit the final JSON.
        if (result && result.error) {
            this.emit('error', result);
        }
        else if (result) {
            this.emit('json', result);
        }
    }
    /**
     * Handles Forge installation by:
     *  1. Downloading the installer
     *  2. Depending on installer type, extracting an install profile or creating a merged Jar
     *  3. Downloading required libraries
     *  4. Patching Forge if necessary
     *  5. Returns the final version JSON object or an error
     */
    async forge(LoaderData) {
        const forge = new forge_js_1.default(this.options);
        // Forward Forge events
        forge.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        forge.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        forge.on('extract', (element) => {
            this.emit('extract', element);
        });
        forge.on('patch', (patch) => {
            this.emit('patch', patch);
        });
        // 1. Download installer
        const installer = await forge.downloadInstaller(LoaderData);
        if (installer.error)
            return installer; // e.g., { error: "..." }
        // 2. If the installer extension is ".jar", we do the standard "install_profile.json" approach
        if ("ext" in installer && installer.ext === 'jar') {
            const profile = await forge.extractProfile(installer.filePath);
            if (profile.error)
                return profile;
            // Write the version JSON to disk
            const destination = path_1.default.resolve(this.options.path, 'versions', profile.version.id);
            if (!fs_1.default.existsSync(destination))
                fs_1.default.mkdirSync(destination, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(destination, `${profile.version.id}.json`), JSON.stringify(profile.version, null, 4));
            // 3. Extract universal jar if needed
            const universal = await forge.extractUniversalJar(profile.install, installer.filePath);
            if (universal.error)
                return universal;
            // 4. Download libraries
            const libraries = await forge.downloadLibraries(profile, universal);
            if (libraries.error)
                return libraries;
            // 5. Patch Forge if necessary
            const patch = await forge.patchForge(profile.install);
            if (patch.error)
                return patch;
            return profile.version;
        }
        else {
            // For older Forge, create a merged jar
            const profile = await forge.createProfile(installer.id, installer.filePath);
            if (profile.error)
                return profile;
            const destination = path_1.default.resolve(this.options.path, 'versions', profile.id);
            if (!fs_1.default.existsSync(destination))
                fs_1.default.mkdirSync(destination, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(destination, `${profile.id}.json`), JSON.stringify(profile, null, 4));
            return profile;
        }
    }
    /**
     * Manages installation flow for NeoForge:
     *  1. Download the installer
     *  2. Extract the install profile
     *  3. Extract the universal jar
     *  4. Download libraries
     *  5. Patch if needed
     */
    async neoForge(LoaderData) {
        const neoForge = new neoForge_js_1.default(this.options);
        // Forward events
        neoForge.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        neoForge.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        neoForge.on('extract', (element) => {
            this.emit('extract', element);
        });
        neoForge.on('patch', (patch) => {
            this.emit('patch', patch);
        });
        const installer = await neoForge.downloadInstaller(LoaderData);
        if (installer.error)
            return installer;
        // Extract the main profile
        const profile = await neoForge.extractProfile(installer.filePath);
        if (profile.error)
            return profile;
        // Write version JSON
        if ("version" in profile && "id" in profile.version) {
            const destination = path_1.default.resolve(this.options.path, 'versions', profile.version.id);
            if (!fs_1.default.existsSync(destination))
                fs_1.default.mkdirSync(destination, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(destination, `${profile.version.id}.json`), JSON.stringify(profile.version, null, 4));
        }
        // Extract universal jar
        const universal = await neoForge.extractUniversalJar(profile.install, installer.filePath, installer.oldAPI);
        if (universal.error)
            return universal;
        // Download libraries
        const libraries = await neoForge.downloadLibraries(profile, universal);
        if (libraries.error)
            return libraries;
        // Patch if needed
        const patch = await neoForge.patchneoForge(profile.install, installer.oldAPI);
        if (patch.error)
            return patch;
        if ("version" in profile)
            return profile.version;
    }
    /**
     * Installs Fabric:
     *  1. Download the loader JSON
     *  2. Save it as a version .json
     *  3. Download required libraries
     */
    async fabric(LoaderData) {
        const fabric = new fabric_js_1.default(this.options);
        // Forward events
        fabric.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        fabric.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        const json = await fabric.downloadJson(LoaderData);
        if (json.error)
            return json;
        if ("id" in json) {
            const destination = path_1.default.resolve(this.options.path, 'versions', json.id);
            if (!fs_1.default.existsSync(destination))
                fs_1.default.mkdirSync(destination, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));
        }
        if ("libraries" in json) {
            await fabric.downloadLibraries(json);
        }
        return json;
    }
    /**
     * Installs Legacy Fabric:
     *  1. Download JSON
     *  2. Save version .json
     *  3. Download libraries
     */
    async legacyFabric(LoaderData) {
        const legacyFabric = new legacyFabric_js_1.default(this.options);
        // Forward events
        legacyFabric.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        legacyFabric.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        const json = await legacyFabric.downloadJson(LoaderData);
        if (json.error)
            return json;
        if ("id" in json) {
            const destination = path_1.default.resolve(this.options.path, 'versions', json.id);
            if (!fs_1.default.existsSync(destination))
                fs_1.default.mkdirSync(destination, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));
        }
        if ("libraries" in json) {
            await legacyFabric.downloadLibraries(json);
        }
        return json;
    }
    /**
     * Installs Quilt:
     *  1. Download the loader JSON
     *  2. Write to a version file
     *  3. Download required libraries
     */
    async quilt(LoaderData) {
        const quilt = new quilt_js_1.default(this.options);
        // Forward events
        quilt.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        quilt.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        const json = await quilt.downloadJson(LoaderData);
        if (json.error)
            return json;
        if ("id" in json) {
            const destination = path_1.default.resolve(this.options.path, 'versions', json.id);
            if (!fs_1.default.existsSync(destination))
                fs_1.default.mkdirSync(destination, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));
        }
        if ("libraries" in json) {
            await quilt.downloadLibraries(json);
        }
        return json;
    }
}
exports.default = Loader;
//# sourceMappingURL=index.js.map