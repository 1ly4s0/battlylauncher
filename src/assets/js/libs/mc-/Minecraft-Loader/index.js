"use strict";
/**
 * @author TECNO BROS
 
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Index_js_1 = require("../utils/Index.js");
const forge_js_1 = __importDefault(require("./loader/forge/forge.js"));
const neoForge_js_1 = __importDefault(require("./loader/neoForge/neoForge.js"));
const fabric_js_1 = __importDefault(require("./loader/fabric/fabric.js"));
const legacyFabric_js_1 = __importDefault(require("./loader/legacyfabric/legacyFabric.js"));
const quilt_js_1 = __importDefault(require("./loader/quilt/quilt.js"));
const events_1 = require("events");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Loader {
    constructor(options) {
        this.options = options;
        this.on = events_1.EventEmitter.prototype.on;
        this.emit = events_1.EventEmitter.prototype.emit;
    }
    async install() {
        let Loader = (0, Index_js_1.loader)(this.options.loader.type);
        if (!Loader)
            return this.emit('error', { error: `Loader ${this.options.loader.type} not found` });
        if (this.options.loader.type === 'forge') {
            let forge = await this.forge(Loader);
            if (forge.error)
                return this.emit('error', forge);
            this.emit('json', forge);
        }
        else if (this.options.loader.type === 'neoforge') {
            let neoForge = await this.neoForge(Loader);
            if (neoForge.error)
                return this.emit('error', neoForge);
            this.emit('json', neoForge);
        }
        else if (this.options.loader.type === 'fabric') {
            let fabric = await this.fabric(Loader);
            if (fabric.error)
                return this.emit('error', fabric);
            this.emit('json', fabric);
        }
        else if (this.options.loader.type === 'legacyfabric') {
            let legacyFabric = await this.legacyFabric(Loader);
            if (legacyFabric.error)
                return this.emit('error', legacyFabric);
            this.emit('json', legacyFabric);
        }
        else if (this.options.loader.type === 'quilt') {
            let quilt = await this.quilt(Loader);
            if (quilt.error)
                return this.emit('error', quilt);
            this.emit('json', quilt);
        }
        else {
            return this.emit('error', { error: `Loader ${this.options.loader.type} not found` });
        }
    }
    async forge(Loader) {
        let forge = new forge_js_1.default(this.options);
        // set event
        forge.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        forge.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        forge.on('extract', (element) => {
            this.emit('extract', element);
        });
        forge.on('patch', patch => {
            this.emit('patch', patch);
        });
        // download installer
        let installer = await forge.downloadInstaller(Loader);
        if (installer.error)
            return installer;
        if (installer.ext == 'jar') {
            // extract install profile
            let profile = await forge.extractProfile(installer.filePath);
            if (profile.error)
                return profile;
            let destination = path_1.default.resolve(this.options.path, 'versions', profile.version.id);
            if (!fs_1.default.existsSync(destination))
                fs_1.default.mkdirSync(destination, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(destination, `${profile.version.id}.json`), JSON.stringify(profile.version, null, 4));
            // extract universal jar
            let universal = await forge.extractUniversalJar(profile.install, installer.filePath);
            if (universal.error)
                return universal;
            // download libraries
            let libraries = await forge.downloadLibraries(profile, universal);
            if (libraries.error)
                return libraries;
            // patch forge if nessary
            let patch = await forge.patchForge(profile.install);
            if (patch.error)
                return patch;
            return profile.version;
        }
        else {
            let profile = await forge.createProfile(installer.id, installer.filePath);
            if (profile.error)
                return profile;
            let destination = path_1.default.resolve(this.options.path, 'versions', profile.id);
            if (!fs_1.default.existsSync(destination))
                fs_1.default.mkdirSync(destination, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(destination, `${profile.id}.json`), JSON.stringify(profile, null, 4));
            return profile;
        }
    }
    async neoForge(Loader) {
        let neoForge = new neoForge_js_1.default(this.options);
        // set event
        neoForge.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        neoForge.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        neoForge.on('extract', (element) => {
            this.emit('extract', element);
        });
        neoForge.on('patch', patch => {
            this.emit('patch', patch);
        });
        // download installer
        let installer = await neoForge.downloadInstaller(Loader);
        if (installer.error)
            return installer;
        // extract install profile
        let profile = await neoForge.extractProfile(installer.filePath);
        if (profile.error)
            return profile;
        let destination = path_1.default.resolve(this.options.path, 'versions', profile.version.id);
        if (!fs_1.default.existsSync(destination))
            fs_1.default.mkdirSync(destination, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.resolve(destination, `${profile.version.id}.json`), JSON.stringify(profile.version, null, 4));
        //extract universal jar
        let universal = await neoForge.extractUniversalJar(profile.install, installer.filePath, installer.oldAPI);
        if (universal.error)
            return universal;
        // download libraries
        let libraries = await neoForge.downloadLibraries(profile, universal);
        if (libraries.error)
            return libraries;
        // patch forge if nessary
        let patch = await neoForge.patchneoForge(profile.install, installer.oldAPI);
        if (patch.error)
            return patch;
        return profile.version;
    }
    async fabric(Loader) {
        let fabric = new fabric_js_1.default(this.options);
        // set event
        fabric.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        fabric.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        // download Json
        let json = await fabric.downloadJson(Loader);
        if (json.error)
            return json;
        let destination = path_1.default.resolve(this.options.path, 'versions', json.id);
        if (!fs_1.default.existsSync(destination))
            fs_1.default.mkdirSync(destination, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));
        // download libraries
        await fabric.downloadLibraries(json);
        return json;
    }
    async legacyFabric(Loader) {
        let legacyFabric = new legacyFabric_js_1.default(this.options);
        // set event
        legacyFabric.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        legacyFabric.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        // download Json
        let json = await legacyFabric.downloadJson(Loader);
        if (json.error)
            return json;
        let destination = path_1.default.resolve(this.options.path, 'versions', json.id);
        if (!fs_1.default.existsSync(destination))
            fs_1.default.mkdirSync(destination, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));
        // download libraries
        await legacyFabric.downloadLibraries(json);
        return json;
    }
    async quilt(Loader) {
        let quilt = new quilt_js_1.default(this.options);
        // set event
        quilt.on('check', (progress, size, element) => {
            this.emit('check', progress, size, element);
        });
        quilt.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        // download Json
        let json = await quilt.downloadJson(Loader);
        if (json.error)
            return json;
        let destination = path_1.default.resolve(this.options.path, 'versions', json.id);
        if (!fs_1.default.existsSync(destination))
            fs_1.default.mkdirSync(destination, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.resolve(destination, `${json.id}.json`), JSON.stringify(json, null, 4));
        // // download libraries
        await quilt.downloadLibraries(json);
        return json;
    }
}
exports.default = Loader;
