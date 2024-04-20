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
const events_1 = require("events");

class Json {
    constructor(options) {
        this.options = options;
    }
    async GetInfoVersion() {
        let version = this.options.version;
        let data;
        try {
            console.log('Downloading version_manifest_v2.json');
            data = await (0, node_fetch_1.default)(`https://launchermeta.mojang.com/mc/game/version_manifest_v2.json?_t=${new Date().toISOString()}`);
            data = await data.json();
            fs_1.default.writeFileSync(`${this.options.path}/battly/launcher/mc-assets/version_manifest_v2.json`, JSON.stringify(data, null, 4));
        } catch (e) {
            data = JSON.parse(fs_1.default.readFileSync(`${this.options.path}/battly/launcher/mc-assets/version_manifest_v2.json`));
        }

        if (version == 'latest_release' || version == 'r' || version == 'lr') {
            version = data.latest.release;
        }
        else if (version == 'latest_snapshot' || version == 's' || version == 'ls') {
            version = data.latest.snapshot;
        }
        data = data.versions.find(v => v.id === version);
        if (!data)
            return {
                error: true,
                message: `Minecraft ${version} is not found.`
            };
        
        let json;
        try {
            json = await (0, node_fetch_1.default)(data.url).then(res => res.json());
            fs_1.default.mkdirSync(`${this.options.path}/versions/${version}`, { recursive: true });
            fs_1.default.writeFileSync(`${this.options.path}/versions/${version}/${version}.json`, JSON.stringify(json, null, 4));
        } catch (e) {
            json = JSON.parse(fs_1.default.readFileSync(`${this.options.path}/versions/${version}/${version}.json`));
        }
        return {
            InfoVersion: data,
            json: json,
            version: version
        };
    }
}
exports.default = Json;
