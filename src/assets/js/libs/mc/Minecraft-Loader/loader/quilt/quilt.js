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
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
class Quilt {
    constructor(options = {}) {
        this.options = options;
        this.on = events_1.EventEmitter.prototype.on;
        this.emit = events_1.EventEmitter.prototype.emit;
    }
    async downloadJson(Loader) {
        let build;
        let metaData = await (0, node_fetch_1.default)(Loader.metaData).then(res => res.json());
        let version = metaData.game.find(version => version.version === this.options.loader.version);
        let AvailableBuilds = metaData.loader.map(build => build.version);
        if (!version)
            return { error: `QuiltMC doesn't support Minecraft ${this.options.loader.version}` };
        if (this.options.loader.build === 'latest') {
            build = metaData.loader[0];
        }
        else if (this.options.loader.build === 'recommended') {
            build = metaData.loader.find(build => !build.version.includes('beta'));
        }
        else {
            build = metaData.loader.find(loader => loader.version === this.options.loader.build);
        }
        if (!build)
            return { error: `QuiltMC Loader ${this.options.loader.build} not found, Available builds: ${AvailableBuilds.join(', ')}` };
        let url = Loader.json.replace('${build}', build.version).replace('${version}', this.options.loader.version);
        let json = await (0, node_fetch_1.default)(url).then(res => res.json()).catch(err => err);
        return json;
    }
    async downloadLibraries(json) {
        let { libraries } = json;
        let downloader = new Downloader_js_1.default();
        let files = [];
        let check = 0;
        let size = 0;
        for (let lib of libraries) {
            if (lib.rules) {
                this.emit('check', check++, libraries.length, 'libraries');
                continue;
            }
            let file = {};
            let libInfo = (0, Index_js_1.getPathLibraries)(lib.name);
            let pathLib = path_1.default.resolve(this.options.path, 'libraries', libInfo.path);
            let pathLibFile = path_1.default.resolve(pathLib, libInfo.name);
            if (!fs_1.default.existsSync(pathLibFile)) {
                let url = `${lib.url}${libInfo.path}/${libInfo.name}`;
                let sizeFile = 0;
                let res = await downloader.checkURL(url);
                if (res.status === 200) {
                    sizeFile = res.size;
                    size += res.size;
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
}
exports.default = Quilt;
