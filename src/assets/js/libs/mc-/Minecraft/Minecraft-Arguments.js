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
const os_1 = __importDefault(require("os"));
const Index_js_1 = require("../utils/Index.js");
let MojangLib = { win32: "windows", darwin: "osx", linux: "linux" };
class MinecraftArguments {
    constructor(options) {
        this.options = options;
        this.authenticator = options.authenticator;
    }
    async GetArguments(json, loaderJson) {
        let game = await this.GetGameArguments(json, loaderJson);
        let jvm = await this.GetJVMArguments(json);
        let classpath = await this.GetClassPath(json, loaderJson);
        return {
            game: game,
            jvm: jvm,
            classpath: classpath.classpath,
            mainClass: classpath.mainClass
        };
    }
    async GetGameArguments(json, loaderJson) {
        let game = json.minecraftArguments ? json.minecraftArguments.split(' ') : json.arguments.game;
        let userType;
        if (loaderJson) {
            let gameLoader = loaderJson.minecraftArguments ? loaderJson.minecraftArguments.split(' ') : [];
            game = game.concat(gameLoader);
            game = game.filter((item, index, self) => index === self.findIndex((res) => res == item));
        }
        if (json.id.startsWith('1.16'))
            userType = 'Xbox';
        else
            userType = this.authenticator.meta.type === 'Xbox' ? 'msa' : this.authenticator.meta.type;
        let table = {
            '${auth_access_token}': this.authenticator.access_token,
            '${auth_session}': this.authenticator.access_token,
            '${auth_player_name}': this.authenticator.name,
            '${auth_uuid}': this.authenticator.uuid,
            '${auth_xuid}': this.authenticator.xboxAccount ? this.authenticator.xboxAccount.xuid || this.authenticator.access_token : null,
            '${user_properties}': this.authenticator.user_properties,
            '${user_type}': userType,
            '${version_name}': loaderJson ? loaderJson.id : json.id,
            '${assets_index_name}': json.assetIndex.id,
            '${game_directory}': this.options.instance ? `${this.options.path}/instances/${this.options.instance}` : this.options.path,
            '${assets_root}': (0, Index_js_1.isold)(json) ? `${this.options.path}/resources` : `${this.options.path}/assets`,
            '${game_assets}': (0, Index_js_1.isold)(json) ? `${this.options.path}/resources` : `${this.options.path}/assets`,
            '${version_type}': json.type,
            '${clientid}': this.authenticator.clientId || (this.authenticator.client_token || this.authenticator.access_token)
        };
        for (let i in game) {
            if (typeof game[i] == 'object')
                game.splice(i, 2);
            if (Object.keys(table).includes(game[i]))
                game[i] = table[game[i]];
        }
        if (this.options.screen) {
            if (this.options.screen.width !== null && this.options.screen.height !== null) {
                game.push('--width');
                game.push(this.options.screen.width);
                game.push('--height');
                game.push(this.options.screen.height);
            }
        }
        game.push(...this.options.GAME_ARGS);
        return game.filter((item) => typeof item !== 'object');
    }
    async GetJVMArguments(json) {
        let opts = {
            win32: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
            darwin: '-XstartOnFirstThread',
            linux: '-Xss1M'
        };
        let jvm = [
            `-Xms${this.options.memory.min}`,
            `-Xmx${this.options.memory.max}`,
            '-XX:+UnlockExperimentalVMOptions',
            '-XX:G1NewSizePercent=20',
            '-XX:G1ReservePercent=20',
            '-XX:MaxGCPauseMillis=50',
            '-XX:G1HeapRegionSize=32M',
            '-Dfml.ignoreInvalidMinecraftCertificates=true',
            `-Djna.tmpdir=${this.options.path}/versions/${json.id}/natives`,
            `-Dorg.lwjgl.system.SharedLibraryExtractPath=${this.options.path}/versions/${json.id}/natives`,
            `-Dio.netty.native.workdir=${this.options.path}/versions/${json.id}/natives`
        ];
        if (!json.minecraftArguments) {
            jvm.push(opts[process.platform]);
        }
        if (json.nativesList) {
            jvm.push(`-Djava.library.path=${this.options.path}/versions/${json.id}/natives`);
        }
        if (os_1.default.platform() == "darwin") {
            let pathAssets = `${this.options.path}/assets/indexes/${json.assets}.json`;
            let assets = JSON.parse(fs_1.default.readFileSync(pathAssets, 'utf-8'));
            let icon = assets.objects['icons/minecraft.icns'].hash;
            jvm.push(`-Xdock:name=Minecraft`);
            jvm.push(`-Xdock:icon=${this.options.path}/assets/objects/${icon.substring(0, 2)}/${icon}`);
        }
        jvm.push(...this.options.JVM_ARGS);
        return jvm;
    }
    async GetClassPath(json, loaderJson) {
        let classPath = [];
        let libraries = json.libraries;
        if (loaderJson?.libraries)
            libraries = loaderJson.libraries.concat(libraries);
        libraries = libraries.filter((library, index, self) => index === self.findIndex((res) => res.name === library.name));
        for (let lib of libraries) {
            if (lib.natives) {
                let native = lib.natives[MojangLib[process.platform]];
                if (!native)
                    native = lib.natives[process.platform];
                if (!native)
                    continue;
            }
            else {
                if (lib.rules && lib.rules[0].os) {
                    if (lib.rules[0].os.name !== MojangLib[process.platform])
                        continue;
                }
            }
            let path = (0, Index_js_1.getPathLibraries)(lib.name);
            if (lib.loader) {
                classPath.push(`${lib.loader}/libraries/${path.path}/${path.name}`);
            }
            else {
                classPath.push(`${this.options.path}/libraries/${path.path}/${path.name}`);
            }
        }
        if (loaderJson?.isOldForge) {
            classPath.push(loaderJson?.jarPath);
        }
        else if (this.options.mcp) {
            classPath.push(this.options.mcp);
        }
        else {
            classPath.push(`${this.options.path}/versions/${json.id}/${json.id}.jar`);
        }
        classPath = classPath.filter((url, index, self) => {
            let lastSegment = url.substring(url.lastIndexOf('/') + 1);
            return self.findIndex((u) => u.substring(u.lastIndexOf('/') + 1) === lastSegment) === index;
        });
        return {
            classpath: [
                `-cp`,
                classPath.join(process.platform === 'win32' ? ';' : ':'),
            ],
            mainClass: loaderJson ? loaderJson.mainClass : json.mainClass
        };
    }
}
exports.default = MinecraftArguments;
