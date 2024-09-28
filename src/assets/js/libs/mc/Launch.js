"use strict";
/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importDefault(require("crypto"));
const child_process_1 = require("child_process");
const Minecraft_Json_js_1 = __importDefault(require("./Minecraft/Minecraft-Json.js"));
const Minecraft_Libraries_js_1 = __importDefault(require("./Minecraft/Minecraft-Libraries.js"));
const Minecraft_Assets_js_1 = __importDefault(require("./Minecraft/Minecraft-Assets.js"));
const Minecraft_Loader_js_1 = __importDefault(require("./Minecraft/Minecraft-Loader.js"));
const Minecraft_Java_js_1 = __importDefault(require("./Minecraft/Minecraft-Java.js"));
const Minecraft_Bundle_js_1 = __importDefault(require("./Minecraft/Minecraft-Bundle.js"));
const Minecraft_Arguments_js_1 = __importDefault(require("./Minecraft/Minecraft-Arguments.js"));
const Index_js_1 = require("./utils/Index.js");
const Downloader_js_1 = __importDefault(require("./utils/Downloader.js"));
class Launch extends events_1.EventEmitter {
    async Launch(opt, OnlyLaunch = false) {
        const defaultOptions = {
            url: null,
            authenticator: null,
            timeout: 10000,
            path: '.Minecraft',
            version: 'latest_release',
            instance: null,
            detached: false,
            intelEnabledMac: false,
            downloadFileMultiple: 5,
            loader: {
                path: './loader',
                type: null,
                build: 'latest',
                enable: false,
            },
            mcp: null,
            verify: false,
            ignored: [],
            JVM_ARGS: [],
            GAME_ARGS: [],
            java: {
                path: null,
                version: null,
                type: 'jre',
            },
            screen: {
                width: null,
                height: null,
                fullscreen: false,
            },
            memory: {
                min: '1G',
                max: '2G'
            },
            ...opt,
        };
        this.options = defaultOptions;
        this.options.path = path_1.default.resolve(this.options.path).replace(/\\/g, '/');
        if (this.options.mcp) {
            if (this.options.instance)
                this.options.mcp = `${this.options.path}/instances/${this.options.instance}/${this.options.mcp}`;
            else
                this.options.mcp = path_1.default.resolve(`${this.options.path}/${this.options.mcp}`).replace(/\\/g, '/');
        }
        if (this.options.loader.type) {
            this.options.loader.type = this.options.loader.type.toLowerCase();
            this.options.loader.build = this.options.loader.build.toLowerCase();
        }
        if (!this.options.authenticator)
            return this.emit("error", { error: "Authenticator not found" });
        if (this.options.downloadFileMultiple < 1)
            this.options.downloadFileMultiple = 1;
        if (this.options.downloadFileMultiple > 30)
            this.options.downloadFileMultiple = 30;
        if (typeof this.options.loader.path !== 'string')
            this.options.loader.path = `./loader/${this.options.loader.type}`;
        this.start(OnlyLaunch);
    }
    async start(OnlyLaunch) {
        let data = await this.DownloadGame(OnlyLaunch);
        if (data.error)
            return this.emit('error', data);
        let { minecraftJson, minecraftLoader, minecraftVersion, minecraftJava } = data;
        let minecraftArguments = await new Minecraft_Arguments_js_1.default(this.options).GetArguments(minecraftJson, minecraftLoader);
        if (minecraftArguments.error)
            return this.emit('error', minecraftArguments);
        let loaderArguments = await new Minecraft_Loader_js_1.default(this.options).GetArguments(minecraftLoader, minecraftVersion);
        if (loaderArguments.error)
            return this.emit('error', loaderArguments);
        let Arguments = [
            ...minecraftArguments.jvm,
            ...minecraftArguments.classpath,
            ...loaderArguments.jvm,
            minecraftArguments.mainClass,
            ...minecraftArguments.game,
            ...loaderArguments.game
        ];
        let java = this.options.java.path ? this.options.java.path : minecraftJava.path;
        let logs = this.options.instance ? `${this.options.path}/instances/${this.options.instance}` : this.options.path;
        if (!fs_1.default.existsSync(logs))
            fs_1.default.mkdirSync(logs, { recursive: true });
        let argumentsLogs = Arguments.join(' ');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.access_token, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.client_token, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.uuid, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.xuid, '????????');
        argumentsLogs = argumentsLogs.replaceAll(`${this.options.path}/`, '');
        this.emit('data', `Launching with arguments ${argumentsLogs}`);
        let minecraftDebug = (0, child_process_1.spawn)(java, Arguments, { cwd: logs, detached: this.options.detached });
        minecraftDebug.stdout.on('data', (data) => this.emit('data', data.toString('utf-8')));
        minecraftDebug.stderr.on('data', (data) => this.emit('data', data.toString('utf-8')));
        minecraftDebug.on('close', (code) => this.emit('close', 'Minecraft closed'));
    }
    async OnlyDownload(opt) {
        let data = await this.DownloadGame(false);
        if (data.error)
            return this.emit('error', data);
        let { minecraftJson, minecraftLoader, minecraftVersion, minecraftJava } = data;
        let minecraftArguments = await new Minecraft_Arguments_js_1.default(this.options).GetArguments(minecraftJson, minecraftLoader);
        if (minecraftArguments.error)
            return this.emit('error', minecraftArguments);
        let loaderArguments = await new Minecraft_Loader_js_1.default(this.options).GetArguments(minecraftLoader, minecraftVersion);
        if (loaderArguments.error)
            return this.emit('error', loaderArguments);
        let Arguments = [
            ...minecraftArguments.jvm,
            ...minecraftArguments.classpath,
            ...loaderArguments.jvm,
            minecraftArguments.mainClass,
            ...minecraftArguments.game,
            ...loaderArguments.game
        ];
        let java = this.options.java.path ? this.options.java.path : minecraftJava.path;
        let logs = this.options.instance ? `${this.options.path}/instances/${this.options.instance}` : this.options.path;
        if (!fs_1.default.existsSync(logs))
            fs_1.default.mkdirSync(logs, { recursive: true });
        let argumentsLogs = Arguments.join(' ');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.access_token, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.client_token, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.uuid, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.xuid, '????????');
        argumentsLogs = argumentsLogs.replaceAll(`${this.options.path}/`, '');
        this.emit('data', `Download ended successfully and user can go to the next step.`);
    }
    async OnlyLaunch() {
        let data = await this.DownloadGame(true);
        if (data.error)
            return this.emit('error', data);
        let { minecraftJson, minecraftLoader, minecraftVersion, minecraftJava } = data;
        let minecraftArguments = await new Minecraft_Arguments_js_1.default(this.options).GetArguments(minecraftJson, minecraftLoader);
        if (minecraftArguments.error)
            return this.emit('error', minecraftArguments);
        let loaderArguments = await new Minecraft_Loader_js_1.default(this.options).GetArguments(minecraftLoader, minecraftVersion);
        if (loaderArguments.error)
            return this.emit('error', loaderArguments);
        let Arguments = [
            ...minecraftArguments.jvm,
            ...minecraftArguments.classpath,
            ...loaderArguments.jvm,
            minecraftArguments.mainClass,
            ...minecraftArguments.game,
            ...loaderArguments.game
        ];
        let java = this.options.java.path ? this.options.java.path : minecraftJava.path;
        let logs = this.options.instance ? `${this.options.path}/instances/${this.options.instance}` : this.options.path;
        if (!fs_1.default.existsSync(logs))
            fs_1.default.mkdirSync(logs, { recursive: true });
        let argumentsLogs = Arguments.join(' ');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.access_token, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.client_token, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.uuid, '????????');
        argumentsLogs = argumentsLogs.replaceAll(this.options.authenticator.xuid, '????????');
        argumentsLogs = argumentsLogs.replaceAll(`${this.options.path}/`, '');
        this.emit('data', `Launching with arguments ${argumentsLogs}`);
        let minecraftDebug = (0, child_process_1.spawn)(java, Arguments, { cwd: logs, detached: this.options.detached });
        minecraftDebug.stdout.on('data', (data) => this.emit('data', data.toString('utf-8')));
        minecraftDebug.stderr.on('data', (data) => this.emit('data', data.toString('utf-8')));
        minecraftDebug.on('close', (code) => this.emit('close', 'Minecraft closed'));
    }
    async DownloadGame(OnlyLaunch) {
        this.emit('downloadJSON', { type: 'info', file: 'version_manifest_v2.json' });
        let InfoVersion = await new Minecraft_Json_js_1.default(this.options).GetInfoVersion(OnlyLaunch);
        this.emit('downloadJSON', { type: 'success', file: 'version_manifest_v2.json' });
        let loaderJson = null;
        if (InfoVersion.error)
            return InfoVersion;
        let { json, version } = InfoVersion;
        let libraries = new Minecraft_Libraries_js_1.default(this.options);
        let bundle = new Minecraft_Bundle_js_1.default(this.options);
        let java = new Minecraft_Java_js_1.default(this.options);
        java.on('progress', (progress, size, element) => {
            this.emit('progress', progress, size, element);
        });
        java.on('extract', (progress) => {
            this.emit('extract', progress);
        });
        let gameLibraries = await libraries.Getlibraries(json);
        this.emit('downloadJSON', { type: 'success', file: 'extra-assets.json' });
        let gameAssetsOther = await libraries.GetAssetsOthers(this.options.url, OnlyLaunch);
        this.emit('downloadJSON', { type: 'info', file: 'extra-assets.json' });
        this.emit('downloadJSON', { type: 'info', file: 'assets.json' });
        let gameAssets = await new Minecraft_Assets_js_1.default(this.options).GetAssets(json, OnlyLaunch);
        this.emit('downloadJSON', { type: 'success', file: 'assets.json' });
        this.emit('downloadJSON', { type: 'info', file: 'java-versions.json' });
        let gameJava = this.options.java.path ? { files: [] } : await java.getJavaFiles(json, OnlyLaunch);
        this.emit('downloadJSON', { type: 'success', file: 'java-versions.json' });
        if (gameJava.error)
            return gameJava;
        let filesList = await bundle.checkBundle([...gameLibraries, ...gameAssetsOther, ...gameAssets, ...gameJava.files]);
        if (filesList.length > 0) {
            let downloader = new Downloader_js_1.default();
            let totsize = await bundle.getTotalSize(filesList);
            downloader.on("progress", (DL, totDL, element) => {
                this.emit("progress", DL, totDL, element);
            });
            downloader.on("speed", (speed) => {
                this.emit("speed", speed);
            });
            downloader.on("estimated", (time) => {
                this.emit("estimated", time);
            });
            downloader.on("error", (e) => {
                this.emit("error", e);
            });
            if (!OnlyLaunch)
                await downloader.downloadFileMultiple(filesList, totsize, this.options.downloadFileMultiple, this.options.timeout);
        }
        if (this.options.loader.enable === true) {
            let loaderInstall = new Minecraft_Loader_js_1.default(this.options);
            loaderInstall.on('extract', (extract) => {
                this.emit('extract', extract);
            });
            loaderInstall.on('progress', (progress, size, element) => {
                this.emit('progress', progress, size, element);
            });
            loaderInstall.on('check', (progress, size, element) => {
                this.emit('check', progress, size, element);
            });
            loaderInstall.on('patch', (patch) => {
                this.emit('patch', patch);
            });
            let jsonLoader = await loaderInstall.GetLoader(version, this.options.java.path ? this.options.java.path : gameJava.path)
                .then((data) => data)
                .catch((err) => err);
            if (jsonLoader.error)
                return jsonLoader;
            loaderJson = jsonLoader;
        }
        if (this.options.verify)
            await bundle.checkFiles([...gameLibraries, ...gameAssetsOther, ...gameAssets, ...gameJava.files]);
        let natives = await libraries.natives(gameLibraries);
        if (natives.length === 0)
            json.nativesList = false;
        else
            json.nativesList = true;
        if ((0, Index_js_1.isold)(json))
            new Minecraft_Assets_js_1.default(this.options).copyAssets(json);
        function calculateFileHash(filePath) {
            return new Promise((resolve, reject) => {
                const hash = crypto_1.default.createHash('sha1');
                const stream = fs_1.default.createReadStream(filePath);
                stream.on('data', data => hash.update(data));
                stream.on('end', () => resolve(hash.digest('hex')));
                stream.on('error', reject);
            });
        }
        for (let asset of gameAssetsOther) {
            try {
                if (fs_1.default.existsSync(asset.path)) {
                    const fileHash = await calculateFileHash(asset.path);
                    if (fileHash === asset.hash) {
                        console.log(`File ${asset.path} already exists and matches hash, skipping download.`);
                        continue;
                    }
                    else {
                        console.log(`File ${asset.path} exists but hash doesn't match, downloading again.`);
                    }
                }
                const res = await (0, node_fetch_1.default)(asset.url);
                if (!res.ok) {
                    throw new Error(`Failed to fetch ${asset.url}: ${res.statusText}`);
                }
                const dest = fs_1.default.createWriteStream(asset.path);
                await new Promise((resolve, reject) => {
                    res.body.pipe(dest);
                    res.body.on('error', reject);
                    dest.on('finish', resolve);
                    dest.on('error', reject);
                });
                console.log(`Downloaded ${asset.path} successfully.`);
            }
            catch (error) {
                console.error(`Error downloading ${asset.path}: ${error.message}`);
            }
        }
        return {
            minecraftJson: json,
            minecraftLoader: loaderJson,
            minecraftVersion: version,
            minecraftJava: gameJava
        };
    }
}
exports.default = Launch;
