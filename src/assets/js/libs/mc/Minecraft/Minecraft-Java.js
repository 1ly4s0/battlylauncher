"use strict";
/**
 * @author TECNO BROS
 
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class java {
    constructor(options) {
        this.options = options;
    }
    async GetJsonJava(jsonversion) {
        let version;
        let files = [];
        let archOS;
        let javaVersionsJson;
        try {
            javaVersionsJson = await (0, node_fetch_1.default)("https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json").then(res => res.json());
            await fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, "runtime"), { recursive: true });
            await fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, "runtime/java-versions.json"), JSON.stringify(javaVersionsJson));
        } catch (e) {
            javaVersionsJson = JSON.parse(await fs_1.default.readFileSync(path_1.default.resolve(this.options.path, "runtime/java-versions.json")));
        }
        if (!jsonversion.javaVersion)
            jsonversion = "jre-legacy";
        else
            jsonversion = jsonversion.javaVersion.component;
        if (os_1.default.platform() == "win32") {
            let arch = { x64: "windows-x64", ia32: "windows-x86", arm64: "windows-arm64" };
            version = `jre-${javaVersionsJson[`${arch[os_1.default.arch()]}`][jsonversion][0]?.version?.name}`;
            if (version.includes('undefined'))
                return { error: true, message: "Java not found" };
            try {
                javaVersionsJson = Object.entries((await (0, node_fetch_1.default)(javaVersionsJson[`${arch[os_1.default.arch()]}`][jsonversion][0]?.manifest?.url).then(res => res.json())).files);
                fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}`), { recursive: true });
                fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}/java-versions.json`), JSON.stringify(javaVersionsJson));
            } catch (e) {
                javaVersionsJson = JSON.parse(await fs_1.default.readFileSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}/java-versions.json`)));
            }
            
            archOS = arch[os_1.default.arch()];
        }
        else if (os_1.default.platform() == "darwin") {
            let arch = { x64: "mac-os", arm64: this.options.intelEnabledMac ? "mac-os" : "mac-os-arm64" };
            version = `jre-${javaVersionsJson[`${arch[os_1.default.arch()]}`][jsonversion][0]?.version?.name}`;
            if (version.includes('undefined'))
                return { error: true, message: "Java not found" };
            try {
                javaVersionsJson = Object.entries((await (0, node_fetch_1.default)(javaVersionsJson[`${arch[os_1.default.arch()]}`][jsonversion][0]?.manifest?.url).then(res => res.json())).files);
                fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}`), { recursive: true });
                fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}/java-versions.json`), JSON.stringify(javaVersionsJson));
            } catch (e) {
                javaVersionsJson = JSON.parse(await fs_1.default.readFileSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}/java-versions.json`)));
            }

            archOS = arch[os_1.default.arch()];
        }
        else if (os_1.default.platform() == "linux") {
            let arch = { x64: "linux", ia32: "linux-i386" };
            version = `jre-${javaVersionsJson[`${arch[os_1.default.arch()]}`][jsonversion][0]?.version?.name}`;
            if (version.includes('undefined'))
                return { error: true, message: "Java not found" };
            try {
                javaVersionsJson = Object.entries((await (0, node_fetch_1.default)(javaVersionsJson[`${arch[os_1.default.arch()]}`][jsonversion][0]?.manifest?.url).then(res => res.json())).files);
                fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}`), { recursive: true });
                fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}/java-versions.json`), JSON.stringify(javaVersionsJson));
            } catch (e) {
                javaVersionsJson = JSON.parse(await fs_1.default.readFileSync(path_1.default.resolve(this.options.path, `runtime/${version}-${arch[os_1.default.arch()]}/java-versions.json`)));
            }

            archOS = arch[os_1.default.arch()];
        }
        else
            return console.log("OS not supported");
        if (!javaVersionsJson)
            return { error: true, message: "Java not found" };
        let java = javaVersionsJson.find(file => file[0].endsWith(process.platform == "win32" ? "bin/javaw.exe" : "bin/java"))[0];
        let toDelete = java.replace(process.platform == "win32" ? "bin/javaw.exe" : "bin/java", "");
        for (let [path, info] of javaVersionsJson) {
            if (info.type == "directory")
                continue;
            if (!info.downloads)
                continue;
            let file = {};
            file.path = `runtime/${version}-${archOS}/${path.replace(toDelete, "")}`;
            file.executable = info.executable;
            file.sha1 = info.downloads.raw.sha1;
            file.size = info.downloads.raw.size;
            file.url = info.downloads.raw.url;
            file.type = "Java";
            files.push(file);
        }
        return {
            files: files,
            path: path_1.default.resolve(this.options.path, `runtime/${version}-${archOS}/bin/java`),
        };
    }
}
exports.default = java;
