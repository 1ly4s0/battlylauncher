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
const os_1 = __importDefault(require("os"));
const Minecraft_Lwjgl_Native_js_1 = __importDefault(require("./Minecraft-Lwjgl-Native.js"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * This class retrieves Minecraft version information from Mojang's
 * version manifest, and optionally processes the JSON for ARM-based Linux.
 */
class Json {
    constructor(options) {
        this.options = options;
    }
    /**
     * Fetches the Mojang version manifest, resolves the intended version (release, snapshot, etc.),
     * and returns the associated JSON object for that version.
     * If the system is Linux ARM, it will run additional processing on the JSON.
     *
     * @returns An object containing { InfoVersion, json, version }, or an error object.
     */
    async GetInfoVersion() {
        let { version, path: basePath } = this.options;
        const manifestPath = path_1.default.join(basePath, 'mc-assets', 'version_manifest_v2.json');
        let manifest;
        try {
            // Try to read from cache first
            if (fs_1.default.existsSync(manifestPath)) {
                manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            }
            else {
                // If no cache, fetch from remote
                const response = await fetch(`https://launchermeta.mojang.com/mc/game/version_manifest_v2.json?_t=${new Date().toISOString()}`);
                manifest = await response.json();
                fs_1.default.mkdirSync(path_1.default.dirname(manifestPath), { recursive: true });
                fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
            }
        }
        catch (e) {
            if (fs_1.default.existsSync(manifestPath)) {
                manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            }
            else {
                throw new Error(`Failed to fetch version manifest and no cache available: ${e.message}`);
            }
        }
        if (version === 'latest_release' || version === 'r' || version === 'lr') {
            version = manifest.latest.release;
        }
        else if (version === 'latest_snapshot' || version === 's' || version === 'ls') {
            version = manifest.latest.snapshot;
        }
        const matchedVersion = manifest.versions.find((v) => v.id === version);
        if (!matchedVersion) {
            return {
                error: true,
                message: `Minecraft ${version} is not found.`
            };
        }
        // Fetch the detailed version JSON from Mojang
        const versionJsonPath = path_1.default.join(basePath, 'versions', version, `${version}.json`);
        let versionJson;
        try {
            // Try to read from cache first
            if (fs_1.default.existsSync(versionJsonPath)) {
                versionJson = JSON.parse(fs_1.default.readFileSync(versionJsonPath, 'utf-8'));
            }
            else {
                // If no cache, fetch from remote
                const jsonResponse = await fetch(matchedVersion.url);
                versionJson = await jsonResponse.json();
                fs_1.default.mkdirSync(path_1.default.dirname(versionJsonPath), { recursive: true });
                fs_1.default.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 4));
            }
        }
        catch (e) {
            if (fs_1.default.existsSync(versionJsonPath)) {
                versionJson = JSON.parse(fs_1.default.readFileSync(versionJsonPath, 'utf-8'));
            }
            else {
                throw new Error(`Failed to fetch version JSON and no cache available: ${e.message}`);
            }
        }
        // If on Linux ARM, run additional processing
        if (os_1.default.platform() === 'linux' && os_1.default.arch().startsWith('arm')) {
            versionJson = await new Minecraft_Lwjgl_Native_js_1.default(this.options).ProcessJson(versionJson);
        }
        return {
            InfoVersion: matchedVersion,
            json: versionJson,
            version
        };
    }
}
exports.default = Json;
//# sourceMappingURL=Minecraft-Json.js.map