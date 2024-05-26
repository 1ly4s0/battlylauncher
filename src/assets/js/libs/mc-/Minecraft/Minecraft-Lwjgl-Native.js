"use strict";
/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
class MinecraftLoader {
    constructor(options) {
        this.options = options;
    }
    async ProcessJson(version) {
        let archMapping = { arm64: "aarch64", arm: 'aarch' }[os_1.default.arch()];
        let pathLWJGL = path_1.default.join(__dirname, `../../assets/LWJGL/${archMapping}`);
        let versionJinput = version.libraries.find((lib) => {
            if (lib.name.startsWith("net.java.jinput:jinput-platform:")) {
                return true;
            }
            else if (lib.name.startsWith("net.java.jinput:jinput:")) {
                return true;
            }
        })?.name.split(":").pop();
        let versionLWJGL = version.libraries.find((lib) => {
            if (lib.name.startsWith("org.lwjgl:lwjgl:")) {
                return true;
            }
            else if (lib.name.startsWith("org.lwjgl.lwjgl:lwjgl:")) {
                return true;
            }
        })?.name.split(":").pop();
        if (versionJinput) {
            version.libraries = version.libraries.filter((lib) => {
                if (lib.name.includes("jinput"))
                    return false;
                return true;
            });
        }
        if (versionLWJGL) {
            version.libraries = version.libraries.filter((lib) => {
                if (lib.name.includes("lwjgl"))
                    return false;
                return true;
            });
            if (versionLWJGL.includes('2.9')) {
                let versionLWJGLNatives = JSON.parse(fs_1.default.readFileSync(path_1.default.join(pathLWJGL, '2.9.4.json'), 'utf-8'));
                version.libraries.push(...versionLWJGLNatives.libraries);
            }
            else {
                let versionLWJGLNatives = JSON.parse(fs_1.default.readFileSync(path_1.default.join(pathLWJGL, `${versionLWJGL}.json`), 'utf-8'));
                version.libraries.push(...versionLWJGLNatives.libraries);
            }
        }
        return version;
    }
}
exports.default = MinecraftLoader;
