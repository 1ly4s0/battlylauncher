"use strict";
/**
 * @author TECNO BROS
 
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Index_js_1 = require("../../../utils/Index.js");
const Downloader_js_1 = __importDefault(require("../../../utils/Downloader.js"));
const patcher_js_1 = __importDefault(require("../../patcher.js"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
class NeoForgeMC {
    constructor(options = {}) {
        this.options = options;
        this.on = events_1.EventEmitter.prototype.on;
        this.emit = events_1.EventEmitter.prototype.emit;
    }
    async downloadInstaller(Loader) {
        let build;
        let neoForgeURL;
        let oldAPI = true;
        let legacyMetaData = await (0, node_fetch_1.default)(Loader.legacyMetaData).then(res => res.json());
        let metaData = await (0, node_fetch_1.default)(Loader.metaData).then(res => res.json());
        let versions = legacyMetaData.versions.filter(version => version.includes(`${this.options.loader.version}-`));
        if (!versions.length) {
            let minecraftVersion = `${this.options.loader.version.split('.')[1]}.${this.options.loader.version.split('.')[2]}`;
            versions = metaData.versions.filter(version => version.startsWith(minecraftVersion));
            oldAPI = false;
        }
        if (!versions.length)
            return { error: `NeoForge doesn't support Minecraft ${this.options.loader.version}` };
        if (this.options.loader.build === 'latest' || this.options.loader.build === 'recommended') {
            build = versions[versions.length - 1];
        }
        else
            build = versions.find(loader => loader === this.options.loader.build);
        if (!build)
            return { error: `NeoForge Loader ${this.options.loader.build} not found, Available builds: ${versions.join(', ')}` };
        if (oldAPI)
            neoForgeURL = Loader.legacyInstall.replaceAll(/\${version}/g, build);
        else
            neoForgeURL = Loader.install.replaceAll(/\${version}/g, build);
        let pathFolder = path_1.default.resolve(this.options.path, 'neoForge');
        let filePath = path_1.default.resolve(pathFolder, `neoForge-${build}-installer.jar`);
        if (!fs_1.default.existsSync(filePath)) {
            if (!fs_1.default.existsSync(pathFolder))
                fs_1.default.mkdirSync(pathFolder, { recursive: true });
            let downloadForge = new Downloader_js_1.default();
            downloadForge.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, `neoForge-${build}-installer.jar`);
            });
            await downloadForge.downloadFile(neoForgeURL, pathFolder, `neoForge-${build}-installer.jar`);
        }
        return { filePath, oldAPI };
    }
    async extractProfile(pathInstaller) {
        let neoForgeJSON = {};
        let file = await (0, Index_js_1.getFileFromJar)(pathInstaller, 'install_profile.json');
        let neoForgeJsonOrigin = JSON.parse(file);
        if (!neoForgeJsonOrigin)
            return { error: { message: 'Invalid neoForge installer' } };
        if (neoForgeJsonOrigin.install) {
            neoForgeJSON.install = neoForgeJsonOrigin.install;
            neoForgeJSON.version = neoForgeJsonOrigin.versionInfo;
        }
        else {
            neoForgeJSON.install = neoForgeJsonOrigin;
            let file = await (0, Index_js_1.getFileFromJar)(pathInstaller, path_1.default.basename(neoForgeJSON.install.json));
            neoForgeJSON.version = JSON.parse(file);
        }
        return neoForgeJSON;
    }
    async extractUniversalJar(profile, pathInstaller, oldAPI) {
        let skipneoForgeFilter = true;
        if (profile.filePath) {
            let fileInfo = (0, Index_js_1.getPathLibraries)(profile.path);
            this.emit('extract', `Extracting ${fileInfo.name}...`);
            let pathFileDest = path_1.default.resolve(this.options.path, 'libraries', fileInfo.path);
            if (!fs_1.default.existsSync(pathFileDest))
                fs_1.default.mkdirSync(pathFileDest, { recursive: true });
            let file = await (0, Index_js_1.getFileFromJar)(pathInstaller, profile.filePath);
            fs_1.default.writeFileSync(`${pathFileDest}/${fileInfo.name}`, file, { mode: 0o777 });
        }
        else if (profile.path) {
            let fileInfo = (0, Index_js_1.getPathLibraries)(profile.path);
            let listFile = await (0, Index_js_1.getFileFromJar)(pathInstaller, null, `maven/${fileInfo.path}`);
            await Promise.all(listFile.map(async (files) => {
                let fileName = files.split('/');
                this.emit('extract', `Extracting ${fileName[fileName.length - 1]}...`);
                let file = await (0, Index_js_1.getFileFromJar)(pathInstaller, files);
                let pathFileDest = path_1.default.resolve(this.options.path, 'libraries', fileInfo.path);
                if (!fs_1.default.existsSync(pathFileDest))
                    fs_1.default.mkdirSync(pathFileDest, { recursive: true });
                fs_1.default.writeFileSync(`${pathFileDest}/${fileName[fileName.length - 1]}`, file, { mode: 0o777 });
            }));
        }
        else {
            skipneoForgeFilter = false;
        }
        if (profile.processors?.length) {
            let universalPath = profile.libraries.find(v => {
                return (v.name || '').startsWith(oldAPI ? 'net.neoforged:forge' : 'net.neoforged:neoforge');
            });
            let client = await (0, Index_js_1.getFileFromJar)(pathInstaller, 'data/client.lzma');
            let fileInfo = (0, Index_js_1.getPathLibraries)(profile.path || universalPath.name, '-clientdata', '.lzma');
            let pathFile = path_1.default.resolve(this.options.path, 'libraries', fileInfo.path);
            if (!fs_1.default.existsSync(pathFile))
                fs_1.default.mkdirSync(pathFile, { recursive: true });
            fs_1.default.writeFileSync(`${pathFile}/${fileInfo.name}`, client, { mode: 0o777 });
            this.emit('extract', `Extracting ${fileInfo.name}...`);
        }
        return skipneoForgeFilter;
    }
    async downloadLibraries(profile, skipneoForgeFilter) {
        let { libraries } = profile.version;
        let downloader = new Downloader_js_1.default();
        let check = 0;
        let files = [];
        let size = 0;
        if (profile.install.libraries)
            libraries = libraries.concat(profile.install.libraries);
        libraries = libraries.filter((library, index, self) => index === self.findIndex(t => t.name === library.name));
        let skipneoForge = [
            'net.minecraftforge:neoforged:',
            'net.minecraftforge:minecraftforge:'
        ];
        for (let lib of libraries) {
            if (skipneoForgeFilter && skipneoForge.find(libs => lib.name.includes(libs))) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }
            if (lib.rules) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }
            let file = {};
            let libInfo = (0, Index_js_1.getPathLibraries)(lib.name);
            let pathLib = path_1.default.resolve(this.options.path, 'libraries', libInfo.path);
            let pathLibFile = path_1.default.resolve(pathLib, libInfo.name);
            if (!fs_1.default.existsSync(pathLibFile)) {
                let url;
                let sizeFile = 0;
                let baseURL = `${libInfo.path}/${libInfo.name}`;
                let response = await downloader.checkMirror(baseURL, Index_js_1.mirrors);
                if (response?.status === 200) {
                    size += response.size;
                    sizeFile = response.size;
                    url = response.url;
                }
                else if (lib.downloads?.artifact) {
                    url = lib.downloads.artifact.url;
                    size += lib.downloads.artifact.size;
                    sizeFile = lib.downloads.artifact.size;
                }
                else {
                    url = null;
                }
                if (url == null || !url) {
                    return { error: `Impossible to download ${libInfo.name}` };
                }
                file = {
                    url: url,
                    folder: pathLib,
                    path: `${pathLib}/${libInfo.name}`,
                    name: libInfo.name,
                    size: sizeFile
                };
                files.push(file);
            }
            this.emit('check', check++, libraries.length, 'libraries');
        }
        if (files.length > 0) {
            downloader.on("progress", (DL, totDL) => {
                this.emit("progress", DL, totDL, 'libraries');
            });
            await downloader.downloadFileMultiple(files, size, this.options.downloadFileMultiple);
        }
        return libraries;
    }
    async patchneoForge(profile, oldAPI) {
        if (profile?.processors?.length) {
            let patcher = new patcher_js_1.default(this.options);
            let config = {};
            patcher.on('patch', data => {
                this.emit('patch', data);
            });
            patcher.on('error', data => {
                this.emit('error', data);
            });
            if (!patcher.check(profile)) {
                config = {
                    java: this.options.loader.config.javaPath,
                    minecraft: this.options.loader.config.minecraftJar,
                    minecraftJson: this.options.loader.config.minecraftJson
                };
                await patcher.patcher(profile, config, oldAPI);
            }
        }
        return true;
    }
}
exports.default = NeoForgeMC;
