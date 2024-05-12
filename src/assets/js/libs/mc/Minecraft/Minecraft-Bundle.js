"use strict";
/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Index_js_1 = require("../utils/Index.js");
class MinecraftBundle {
    constructor(options) {
        this.options = options;
    }
    async checkBundle(bundle) {
        let todownload = [];
        for (let file of bundle) {
            if (!file.path)
                continue;
            file.path = path_1.default.resolve(this.options.path, file.path).replace(/\\/g, "/");
            file.folder = file.path.split("/").slice(0, -1).join("/");
            if (file.type == "CFILE") {
                if (!fs_1.default.existsSync(file.folder))
                    fs_1.default.mkdirSync(file.folder, { recursive: true, mode: 0o777 });
                fs_1.default.writeFileSync(file.path, file.content, { encoding: "utf8", mode: 0o755 });
                continue;
            }
            if (fs_1.default.existsSync(file.path)) {
                let replaceName = `${this.options.path}/`;
                if (this.options.instance)
                    replaceName = `${this.options.path}/instances/${this.options.instance}/`;
                if (this.options.ignored.find(ignored => ignored == file.path.replaceAll(replaceName, "")))
                    continue;
                if (file.sha1) {
                    if (await (0, Index_js_1.getFileHash)(file.path) != file.sha1)
                        todownload.push(file);
                }
            }
            else
                todownload.push(file);
        }
        return todownload;
    }
    async getTotalSize(bundle) {
        let todownload = 0;
        for (let file of bundle) {
            todownload += file.size;
        }
        return todownload;
    }
    async checkFiles(bundle) {
        let instancePath = '';
        if (this.options.instance) {
            if (!fs_1.default.existsSync(`${this.options.path}/instances`))
                fs_1.default.mkdirSync(`${this.options.path}/instances`, { recursive: true });
            instancePath = `/instances/${this.options.instance}`;
        }
        let files = this.options.instance ? this.getFiles(`${this.options.path}/instances/${this.options.instance}`) : this.getFiles(this.options.path);
        let ignoredfiles = [...this.getFiles(`${this.options.path}/loader`), ...this.getFiles(`${this.options.path}/runtime`)];
        for (let file of this.options.ignored) {
            file = (`${this.options.path}${instancePath}/${file}`);
            if (fs_1.default.existsSync(file)) {
                if (fs_1.default.statSync(file).isDirectory()) {
                    ignoredfiles.push(...this.getFiles(file));
                }
                else if (fs_1.default.statSync(file).isFile()) {
                    ignoredfiles.push(file);
                }
            }
        }
        ignoredfiles.forEach(file => this.options.ignored.push((file)));
        bundle.forEach(file => ignoredfiles.push((file.path)));
        files = files.filter(file => ignoredfiles.indexOf(file) < 0);
        for (let file of files) {
            try {
                if (fs_1.default.statSync(file).isDirectory()) {
                    fs_1.default.rmSync(file, { recursive: true });
                }
                else {
                    fs_1.default.unlinkSync(file);
                    let folder = file.split("/").slice(0, -1).join("/");
                    while (true) {
                        if (folder == this.options.path)
                            break;
                        let content = fs_1.default.readdirSync(folder);
                        if (content.length == 0)
                            fs_1.default.rmSync(folder);
                        folder = folder.split("/").slice(0, -1).join("/");
                    }
                }
            }
            catch (e) {
                continue;
            }
        }
    }
    getFiles(path, file = []) {
        if (fs_1.default.existsSync(path)) {
            let files = fs_1.default.readdirSync(path);
            if (files.length == 0)
                file.push(path);
            for (let i in files) {
                let name = `${path}/${files[i]}`;
                if (fs_1.default.statSync(name).isDirectory())
                    this.getFiles(name, file);
                else
                    file.push(name);
            }
        }
        return file;
    }
}
exports.default = MinecraftBundle;
