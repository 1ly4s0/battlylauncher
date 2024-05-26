"use strict";
/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const node_fetch_1 = __importDefault(require("node-fetch"));
let MojangLib = { win32: "windows", darwin: "osx", linux: "linux" };
let Arch = { x32: "32", x64: "64", arm: "32", arm64: "64" };
class Libraries {
    constructor(options) {
        this.options = options;
    }
    async Getlibraries(json) {
        this.json = json;
        let libraries = [];
        for (let lib of this.json.libraries) {
            let artifact;
            let type = "Libraries";
            if (lib.natives) {
                let classifiers = lib.downloads.classifiers;
                let native = lib.natives[MojangLib[process.platform]];
                if (!native)
                    native = lib.natives[process.platform];
                type = "Native";
                if (native)
                    artifact = classifiers[native.replace("${arch}", Arch[os_1.default.arch()])];
                else
                    continue;
            }
            else {
                if (lib.rules && lib.rules[0].os) {
                    if (lib.rules[0].os.name !== MojangLib[process.platform])
                        continue;
                }
                artifact = lib.downloads.artifact;
            }
            if (!artifact)
                continue;
            libraries.push({
                sha1: artifact.sha1,
                size: artifact.size,
                path: `libraries/${artifact.path}`,
                type: type,
                url: artifact.url
            });
        }
        libraries.push({
            sha1: this.json.downloads.client.sha1,
            size: this.json.downloads.client.size,
            path: `versions/${this.json.id}/${this.json.id}.jar`,
            type: "Libraries",
            url: this.json.downloads.client.url
        });
        libraries.push({
            path: `versions/${this.json.id}/${this.json.id}.json`,
            type: "CFILE",
            content: JSON.stringify(this.json)
        });
        return libraries;
    }
    async GetAssetsOthers(url) {
        if (!url)
            return [];
        let data;
        try {
            data = await (0, node_fetch_1.default)(url).then(res => res.json());
            fs_1.default.writeFileSync(`${this.options.path}/battly/launcher/mc-assets/extra-assets.json`, JSON.stringify(data, null, 4));
        }
        catch (e) {
            data = [];
        }
        let assets = [];
        for (let asset of data) {
            if (!asset.path)
                continue;
            let path = asset.path;
            assets.push({
                sha1: asset.hash,
                size: asset.size,
                type: path.split("/")[0],
                path: this.options.instance ? `instances/${this.options.instance}/${path}` : path,
                url: asset.url
            });
        }
        return assets;
    }
    async natives(bundle) {
        let natives = bundle.filter(mod => mod.type === "Native").map(mod => `${mod.path}`);
        if (natives.length === 0)
            return natives;
        let nativeFolder = (`${this.options.path}/versions/${this.json.id}/natives`).replace(/\\/g, "/");
        if (!fs_1.default.existsSync(nativeFolder))
            fs_1.default.mkdirSync(nativeFolder, { recursive: true, mode: 0o777 });
        for (let native of natives) {
            let zip = new adm_zip_1.default(native);
            let entries = zip.getEntries();
            for (let entry of entries) {
                if (entry.entryName.startsWith("META-INF"))
                    continue;
                if (entry.isDirectory) {
                    fs_1.default.mkdirSync(`${nativeFolder}/${entry.entryName}`, { recursive: true, mode: 0o777 });
                    continue;
                }
                fs_1.default.writeFile(`${nativeFolder}/${entry.entryName}`, zip.readFile(entry), { encoding: "utf8", mode: 0o777 }, () => { });
            }
        }
        return natives;
    }
}
exports.default = Libraries;
