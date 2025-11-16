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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
/**
 * This class modifies the version JSON for ARM-based Linux systems,
 * specifically handling LWJGL library replacements for versions 2.9.x or custom LWJGL versions.
 */
class MinecraftLoader {
    constructor(options) {
        this.options = options;
    }
    /**
     * Processes a Minecraft version JSON, removing default JInput and LWJGL entries
     * if needed, then injecting ARM-compatible LWJGL libraries from local JSON files.
     *
     * @param version A MinecraftVersion object containing a list of libraries
     * @returns The same version object, but with updated libraries for ARM-based Linux
     */
    async ProcessJson(version) {
        // Maps Node's arm architecture to the expected LWJGL naming
        const archMapping = {
            arm64: 'aarch64',
            arm: 'aarch'
        };
        const currentArch = os_1.default.arch();
        const mappedArch = archMapping[currentArch];
        // If running on a non-ARM environment, or if the mapping doesn't exist, no changes are needed
        if (!mappedArch) {
            return version;
        }
        // Path to the directory containing LWJGL JSON files for ARM
        const pathLWJGL = path_1.default.join(__dirname, '../../assets/LWJGL', mappedArch);
        // Identify the version strings for JInput and LWJGL from the existing libraries
        const versionJinput = version.libraries.find(lib => lib.name.startsWith('net.java.jinput:jinput-platform:') ||
            lib.name.startsWith('net.java.jinput:jinput:'))?.name.split(':').pop();
        const versionLWJGL = version.libraries.find(lib => lib.name.startsWith('org.lwjgl:lwjgl:') ||
            lib.name.startsWith('org.lwjgl.lwjgl:lwjgl:'))?.name.split(':').pop();
        // Remove all JInput-related libraries if a JInput version is found
        if (versionJinput) {
            version.libraries = version.libraries.filter(lib => !lib.name.includes('jinput'));
        }
        // Remove all LWJGL-related libraries if an LWJGL version is found
        if (versionLWJGL) {
            version.libraries = version.libraries.filter(lib => !lib.name.includes('lwjgl'));
            // Inject ARM-compatible LWJGL libraries
            let lwjglJsonFile = versionLWJGL.includes('2.9')
                ? '2.9.4.json'
                : `${versionLWJGL}.json`;
            const lwjglPath = path_1.default.join(pathLWJGL, lwjglJsonFile);
            // Read the appropriate LWJGL JSON (e.g., "2.9.4.json" or "<versionLWJGL>.json")
            const lwjglNativesContent = fs_1.default.readFileSync(lwjglPath, 'utf-8');
            const lwjglNatives = JSON.parse(lwjglNativesContent);
            // Append the ARM-compatible libraries
            version.libraries.push(...lwjglNatives.libraries);
        }
        return version;
    }
}
exports.default = MinecraftLoader;
//# sourceMappingURL=Minecraft-Lwjgl-Native.js.map