"use strict";
/**
 * @author TECNO BROS
 
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_1 = __importDefault(require("fs"));
class MinecraftAssets {
    constructor(options) {
        this.options = options;
    }
    async GetAssets(json) {
        this.assetIndex = json.assetIndex;
        let assets = [];
        let data;
        try {
            data = await (0, node_fetch_1.default)(this.assetIndex.url).then(res => res.json());
            fs_1.default.mkdirSync(`${this.options.path}/assets/indexes`, { recursive: true });
            fs_1.default.mkdirSync(`${this.options.path}/assets/objects`, { recursive: true });
            fs_1.default.writeFileSync(`${this.options.path}/assets/indexes/${this.assetIndex.id}.json`, JSON.stringify(data));
        } catch (e) {
            data = JSON.parse(fs_1.default.readFileSync(`${this.options.path}/assets/indexes/${this.assetIndex.id}.json`,));
        }
        assets.push({
            type: "CFILE",
            path: `assets/indexes/${this.assetIndex.id}.json`,
            content: JSON.stringify(data)
        });
        data = Object.values(data.objects);
        for (let asset of data) {
            assets.push({
                sha1: asset.hash,
                size: asset.size,
                type: "Assets",
                path: `assets/objects/${asset.hash.substring(0, 2)}/${asset.hash}`,
                url: `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`
            });
        }
        return assets;
    }
    copyAssets(json) {
        let legacyDirectory = `${this.options.path}/resources`;
        if (this.options.instance)
            legacyDirectory = `${this.options.path}/instances/${this.options.instance}/resources`;
        let pathAssets = `${this.options.path}/assets/indexes/${json.assets}.json`;
        if (!fs_1.default.existsSync(pathAssets))
            return;
        let assets = JSON.parse(fs_1.default.readFileSync(pathAssets, 'utf-8'));
        assets = Object.entries(assets.objects);
        for (let [file, hash] of assets) {
            let Hash = hash.hash;
            let Subhash = Hash.substring(0, 2);
            let SubAsset = `${this.options.path}/assets/objects/${Subhash}`;
            let legacyAsset = file.split('/');
            legacyAsset.pop();
            if (!fs_1.default.existsSync(`${legacyDirectory}/${legacyAsset.join('/')}`)) {
                fs_1.default.mkdirSync(`${legacyDirectory}/${legacyAsset.join('/')}`, { recursive: true });
            }
            if (!fs_1.default.existsSync(`${legacyDirectory}/${file}`)) {
                fs_1.default.copyFileSync(`${SubAsset}/${Hash}`, `${legacyDirectory}/${file}`);
            }
        }
    }
}
exports.default = MinecraftAssets;
