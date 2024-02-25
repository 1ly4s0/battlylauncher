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
const Index_js_2 = require("../../../utils/Index.js");
let Lib = { win32: "windows", darwin: "osx", linux: "linux" };
class ForgeMC {
    constructor(options = {}) {
        this.options = options;
        this.on = events_1.EventEmitter.prototype.on;
        this.emit = events_1.EventEmitter.prototype.emit;
    }
    async downloadInstaller(Loader) {
        let metaData;
        try {
            metaData = (await (0, node_fetch_1.default)(Loader.metaData).then(res => res.json()))[this.options.loader.version];
            //comprobar si existe la carpeta de la versión en this.options.path, '..', '..', 'battly', 'launcher', 'forge', 'version'
            //si no existe, crearla
            if(!fs_1.default.existsSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version))) {
                fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version), { recursive: true });
            }
            
            fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version, 'metaData.json'), JSON.stringify(metaData));

        } catch (error) {
            metaData = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version, 'metaData.json')));
        }
        let AvailableBuilds = metaData;
        let forgeURL;
        let ext;
        let hashFileOrigin;
        if (!metaData)
            return { error: `Forge ${this.options.loader.version} not supported` };
        let build;
        if (this.options.loader.build === 'latest') {
            let promotions;
            try {
                promotions = await (0, node_fetch_1.default)(Loader.promotions).then(res => res.json());
                if(!fs_1.default.existsSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version))) {
                    fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version), { recursive: true });
                }
                fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version, 'promotions.json'), JSON.stringify(promotions));
            } catch (error) {
                promotions = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version, 'promotions.json')));
            }
            promotions = promotions.promos[`${this.options.loader.version}-latest`];
            build = metaData.find(build => build.includes(promotions));
        }
        else if (this.options.loader.build === 'recommended') {
            let promotion;
            try {
                promotion = await (0, node_fetch_1.default)(Loader.promotions).then(res => res.json());
                if(!fs_1.default.existsSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version))) {
                    fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version), { recursive: true });
                }
                fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version, 'promotions.json'), JSON.stringify(promotion));
            } catch (error) {
                promotion = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version, 'promotions.json')));
            }
            let promotions = promotion.promos[`${this.options.loader.version}-recommended`];
            if (!promotions)
                promotions = promotion.promos[`${this.options.loader.version}-latest`];
            build = metaData.find(build => build.includes(promotions));
        }
        else {
            build = this.options.loader.build;
        }
        metaData = metaData.filter(b => b === build)[0];
        if (!metaData)
            return { error: `Build ${build} not found, Available builds: ${AvailableBuilds.join(', ')}` };
        let meta;
        try {
            meta = await (0, node_fetch_1.default)(Loader.meta.replace(/\${build}/g, metaData)).then(res => res.json());
            if(!fs_1.default.existsSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version))) {
                fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version), { recursive: true });
            }
            fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version, 'meta.json'), JSON.stringify(meta));
        } catch (error) {
            meta = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, '..', '..', 'battly', 'launcher', 'forge', this.options.loader.version, 'meta.json')));
        }
        let installerType = Object.keys(meta.classifiers).find((key) => key == 'installer');
        let clientType = Object.keys(meta.classifiers).find((key) => key == 'client');
        let universalType = Object.keys(meta.classifiers).find((key) => key == 'universal');
        if (installerType) {
            forgeURL = forgeURL = Loader.install.replace(/\${version}/g, metaData);
            ext = Object.keys(meta.classifiers.installer)[0];
            hashFileOrigin = meta.classifiers.installer[`${ext}`];
        }
        else if (clientType) {
            forgeURL = Loader.client.replace(/\${version}/g, metaData);
            ext = Object.keys(meta.classifiers.client)[0];
            hashFileOrigin = meta.classifiers.client[`${ext}`];
        }
        else if (universalType) {
            forgeURL = Loader.universal.replace(/\${version}/g, metaData);
            ext = Object.keys(meta.classifiers.universal)[0];
            hashFileOrigin = meta.classifiers.universal[`${ext}`];
        }
        else {
            return { error: 'Invalid forge installer' };
        }
        let pathFolder = path_1.default.resolve(this.options.path, 'forge');
        let filePath = path_1.default.resolve(pathFolder, (`${forgeURL}.${ext}`).split('/').pop());
        if (!fs_1.default.existsSync(filePath)) {
            if (!fs_1.default.existsSync(pathFolder))
                fs_1.default.mkdirSync(pathFolder, { recursive: true });
            let downloadForge = new Downloader_js_1.default();
            downloadForge.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, (`${forgeURL}.${ext}`).split('/').pop());
            });
            await downloadForge.downloadFile(`${forgeURL}.${ext}`, pathFolder, (`${forgeURL}.${ext}`).split('/').pop());
        }
        let hashFileDownload = await (0, Index_js_1.getFileHash)(filePath, 'md5');
        if (hashFileDownload !== hashFileOrigin) {
            fs_1.default.rmSync(filePath);
            return { error: 'Invalid hash' };
        }
        return { filePath, metaData, ext, id: `forge-${build}` };
    }
    async extractProfile(pathInstaller) {
        let forgeJSON = {};
        let file = await (0, Index_js_1.getFileFromJar)(pathInstaller, 'install_profile.json');
        let forgeJsonOrigin = JSON.parse(file);
        if (!forgeJsonOrigin)
            return { error: { message: 'Invalid forge installer' } };
        if (forgeJsonOrigin.install) {
            forgeJSON.install = forgeJsonOrigin.install;
            forgeJSON.version = forgeJsonOrigin.versionInfo;
        }
        else {
            forgeJSON.install = forgeJsonOrigin;
            let file = await (0, Index_js_1.getFileFromJar)(pathInstaller, path_1.default.basename(forgeJSON.install.json));
            forgeJSON.version = JSON.parse(file);
        }
        return forgeJSON;
    }
    async extractUniversalJar(profile, pathInstaller) {
        let skipForgeFilter = true;
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
            skipForgeFilter = false;
        }
        if (profile.processors?.length) {
            let universalPath = profile.libraries.find(v => {
                return (v.name || '').startsWith('net.minecraftforge:forge');
            });
            let client = await (0, Index_js_1.getFileFromJar)(pathInstaller, 'data/client.lzma');
            let fileInfo = (0, Index_js_1.getPathLibraries)(profile.path || universalPath.name, '-clientdata', '.lzma');
            let pathFile = path_1.default.resolve(this.options.path, 'libraries', fileInfo.path);
            if (!fs_1.default.existsSync(pathFile))
                fs_1.default.mkdirSync(pathFile, { recursive: true });
            fs_1.default.writeFileSync(`${pathFile}/${fileInfo.name}`, client, { mode: 0o777 });
            this.emit('extract', `Extracting ${fileInfo.name}...`);
        }
        return skipForgeFilter;
    }
    async downloadLibraries(profile, skipForgeFilter) {
        let { libraries } = profile.version;
        let downloader = new Downloader_js_1.default();
        let check = 0;
        let files = [];
        let size = 0;
        if (profile.install.libraries)
            libraries = libraries.concat(profile.install.libraries);
        libraries = libraries.filter((library, index, self) => index === self.findIndex(t => t.name === library.name));
        let skipForge = [
            'net.minecraftforge:forge:',
            'net.minecraftforge:minecraftforge:'
        ];
        for (let lib of libraries) {
            let natives = null;
            if (skipForgeFilter && skipForge.find(libs => lib.name.includes(libs))) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }
            if ((0, Index_js_2.skipLibrary)(lib)) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }
            if (lib.natives) {
                natives = lib.natives[Lib[process.platform]];
            }
            let file = {};
            let libInfo = (0, Index_js_1.getPathLibraries)(lib.name, natives ? `-${natives}` : '');
            let pathLib = path_1.default.resolve(this.options.path, 'libraries', libInfo.path);
            let pathLibFile = path_1.default.resolve(pathLib, libInfo.name);
            if (!fs_1.default.existsSync(pathLibFile)) {
                let url;
                let sizeFile = 0;
                let baseURL = natives ? `${libInfo.path}/` : `${libInfo.path}/${libInfo.name}`;
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
    async patchForge(profile) {
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
                await patcher.patcher(profile, config);
            }
        }
        return true;
    }
    async createProfile(id, pathInstaller) {
        let forgeFiles = await (0, Index_js_1.getFileFromJar)(pathInstaller);
        let minecraftJar = await (0, Index_js_1.getFileFromJar)(this.options.loader.config.minecraftJar);
        let data = await (0, Index_js_1.createZIP)([...minecraftJar, ...forgeFiles], 'META-INF');
        let destination = path_1.default.resolve(this.options.path, 'versions', id);
        let profile = JSON.parse(fs_1.default.readFileSync(this.options.loader.config.minecraftJson, 'utf-8'));
        profile.libraries = [];
        profile.id = id;
        profile.isOldForge = true;
        profile.jarPath = path_1.default.resolve(destination, `${id}.jar`);
        if (!fs_1.default.existsSync(destination))
            fs_1.default.mkdirSync(destination, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.resolve(destination, `${id}.jar`), data, { mode: 0o777 });
        return profile;
    }
}
exports.default = ForgeMC;
