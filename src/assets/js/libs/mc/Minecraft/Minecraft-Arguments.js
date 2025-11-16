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
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const Index_js_1 = require("../utils/Index.js");
/**
 * Maps the Node.js process.platform values to Mojang's library folders.
 */
const MOJANG_LIBRARY_MAP = {
    win32: 'windows',
    darwin: 'osx',
    linux: 'linux'
};
/**
 * Builds and organizes JVM and game arguments required to launch Minecraft,
 * including optional loader (e.g., Forge) arguments.
 */
class MinecraftArguments {
    constructor(options) {
        this.options = options;
        this.authenticator = options.authenticator;
    }
    /**
     * Gathers all arguments (game, JVM, classpath) and returns them for launching.
     * @param versionJson The Minecraft version JSON.
     * @param loaderJson  An optional loader JSON (Forge, Fabric, etc.).
     */
    async GetArguments(versionJson, loaderJson) {
        const gameArguments = await this.GetGameArguments(versionJson, loaderJson);
        const jvmArguments = await this.GetJVMArguments(versionJson);
        const classpathData = await this.GetClassPath(versionJson, loaderJson);
        return {
            game: gameArguments,
            jvm: jvmArguments,
            classpath: classpathData.classpath,
            mainClass: classpathData.mainClass
        };
    }
    /**
     * Builds the Minecraft game arguments, injecting authentication tokens,
     * user info, and any loader arguments if present.
     * @param versionJson The Minecraft version JSON.
     * @param loaderJson  The loader JSON (e.g., Forge) if applicable.
     */
    async GetGameArguments(versionJson, loaderJson) {
        // For older MC versions, arguments may be in `minecraftArguments` instead of `arguments.game`
        let gameArgs = versionJson.minecraftArguments
            ? versionJson.minecraftArguments.split(' ')
            : versionJson.arguments?.game ?? [];
        // Merge loader's Minecraft arguments if provided
        if (loaderJson) {
            const loaderGameArgs = loaderJson.minecraftArguments ? loaderJson.minecraftArguments.split(' ') : [];
            gameArgs = gameArgs.concat(loaderGameArgs);
            // Remove duplicate arguments
            gameArgs = gameArgs.filter((item, index, self) => index === self.findIndex(arg => arg === item));
        }
        // Determine user type (e.g. 'msa' or 'Xbox') depending on version and authenticator
        let userType = 'msa';
        if (versionJson.id.startsWith('1.16')) {
            userType = 'Xbox';
        }
        else {
            userType = this.authenticator.meta.type === 'Xbox' ? 'msa' : this.authenticator.meta.type;
        }
        // Map of placeholders to actual values
        const placeholderMap = {
            '${auth_access_token}': this.authenticator.access_token,
            '${auth_session}': this.authenticator.access_token,
            '${auth_player_name}': this.authenticator.name,
            '${auth_uuid}': this.authenticator.uuid,
            '${auth_xuid}': this.authenticator?.xboxAccount?.xuid || this.authenticator.access_token,
            '${user_properties}': this.authenticator.user_properties,
            '${user_type}': userType,
            '${version_name}': loaderJson ? loaderJson.id || versionJson.id : versionJson.id,
            '${assets_index_name}': versionJson.assetIndex.id,
            '${game_directory}': this.options.instance
                ? `${this.options.path}/instances/${this.options.instance}`
                : this.options.path,
            '${assets_root}': (0, Index_js_1.isold)(versionJson)
                ? `${this.options.path}/resources`
                : `${this.options.path}/assets`,
            '${game_assets}': (0, Index_js_1.isold)(versionJson)
                ? `${this.options.path}/resources`
                : `${this.options.path}/assets`,
            '${version_type}': versionJson.type,
            '${clientid}': this.authenticator.clientId
                || this.authenticator.client_token
                || this.authenticator.access_token
        };
        // Replace placeholders in the game arguments
        for (let i = 0; i < gameArgs.length; i++) {
            if (typeof gameArgs[i] === 'object') {
                // If it's an unexpected object, remove it
                gameArgs.splice(i, 1);
                i--;
                continue;
            }
            if (placeholderMap[gameArgs[i]]) {
                gameArgs[i] = placeholderMap[gameArgs[i]];
            }
        }
        // If screen options are provided, add them
        if (this.options.screen) {
            const { width, height } = this.options.screen;
            if (width && height) {
                gameArgs.push('--width', String(width), '--height', String(height));
            }
        }
        // Add any extra game arguments from user config
        gameArgs.push(...this.options.GAME_ARGS);
        // Filter out any remaining unexpected objects
        return gameArgs.filter(item => typeof item === 'string');
    }
    /**
     * Builds the JVM arguments needed by Minecraft. This includes memory settings,
     * OS-specific options, and any additional arguments supplied by the user.
     * @param versionJson The Minecraft version JSON.
     */
    async GetJVMArguments(versionJson) {
        // Some OS-specific defaults
        const osSpecificOpts = {
            win32: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
            darwin: '-XstartOnFirstThread',
            linux: '-Xss1M'
        };
        // Core JVM arguments
        const jvmArgs = [
            `-Xms${this.options.memory.min}`,
            `-Xmx${this.options.memory.max}`,
            '-XX:+UnlockExperimentalVMOptions',
            '-XX:G1NewSizePercent=20',
            '-XX:G1ReservePercent=20',
            '-XX:MaxGCPauseMillis=50',
            '-XX:G1HeapRegionSize=32M',
            '-Dfml.ignoreInvalidMinecraftCertificates=true',
            `-Djna.tmpdir=${this.options.path}/versions/${versionJson.id}/natives`,
            `-Dorg.lwjgl.system.SharedLibraryExtractPath=${this.options.path}/versions/${versionJson.id}/natives`,
            `-Dio.netty.native.workdir=${this.options.path}/versions/${versionJson.id}/natives`
        ];
        // For newer MC versions that use "arguments.game" instead of "minecraftArguments",
        // we add OS-specific arguments (e.g., Mac uses -XstartOnFirstThread).
        if (!versionJson.minecraftArguments) {
            const opt = osSpecificOpts[process.platform];
            if (opt) {
                jvmArgs.push(opt);
            }
        }
        // If natives are specified, add the native library path
        if (versionJson.nativesList) {
            jvmArgs.push(`-Djava.library.path=${this.options.path}/versions/${versionJson.id}/natives`);
        }
        // Special handling for macOS (setting dock icon)
        if (os_1.default.platform() === 'darwin') {
            const assetsPath = `${this.options.path}/assets/indexes/${versionJson.assets}.json`;
            const assetsContent = fs_1.default.readFileSync(assetsPath, 'utf-8');
            const assetsJson = JSON.parse(assetsContent);
            // Retrieve the hash of the minecraft.icns file
            const iconHash = assetsJson.objects['icons/minecraft.icns']?.hash;
            if (iconHash) {
                jvmArgs.push('-Xdock:name=Minecraft');
                jvmArgs.push(`-Xdock:icon=${this.options.path}/assets/objects/${iconHash.substring(0, 2)}/${iconHash}`);
            }
        }
        // Append any user-supplied JVM arguments
        jvmArgs.push(...this.options.JVM_ARGS);
        return jvmArgs;
    }
    /**
     * Constructs the classpath (including libraries) that Minecraft requires
     * to launch, and identifies the main class. Optionally merges loader libraries.
     * @param versionJson The Minecraft version JSON.
     * @param loaderJson  The loader JSON (e.g., Forge, Fabric) if applicable.
     */
    async GetClassPath(versionJson, loaderJson) {
        let combinedLibraries = versionJson.libraries ?? [];
        // If a loader JSON is provided, merge its libraries with the base MC version
        if (loaderJson?.libraries) {
            combinedLibraries = loaderJson.libraries.concat(combinedLibraries);
        }
        const map = new Map();
        for (const dep of combinedLibraries) {
            const parts = dep.name.split(":");
            const key = parts.slice(0, 2).join(":");
            const classifier = parts[3] ? parts[3] : "";
            const versionKey = `${key}:${classifier}`;
            const current = map.get(versionKey);
            const version = parts[2];
            if (!current || version > current.name.split(":")[2]) {
                map.set(versionKey, dep);
            }
        }
        const latest = Object.fromEntries(Array.from(map.entries()).map(([key, value]) => [key, value]));
        // Prepare to accumulate all library paths
        const librariesList = [];
        for (const lib of Object.values(latest)) {
            // Skip certain logging libraries if flagged (e.g., in Forge's "loader" property)
            if (lib.loader && lib.name.startsWith('org.apache.logging.log4j:log4j-slf4j2-impl'))
                continue;
            // Check if the library has native bindings
            if (lib.natives) {
                const nativeName = lib.natives[MOJANG_LIBRARY_MAP[process.platform]] || lib.natives[process.platform];
                if (!nativeName)
                    continue;
            }
            else if (lib.rules && lib.rules[0].os) {
                // Some libraries only apply to specific OS platforms
                if (lib.rules[0].os.name !== MOJANG_LIBRARY_MAP[process.platform])
                    continue;
            }
            // Build the path for this library
            const libPath = (0, Index_js_1.getPathLibraries)(lib.name);
            if (lib.loader) {
                // If the loader uses a specific library path
                librariesList.push(`${lib.loader}/libraries/${libPath.path}/${libPath.name}`);
            }
            else {
                librariesList.push(`${this.options.path}/libraries/${libPath.path}/${libPath.name}`);
            }
        }
        // Add the main Minecraft JAR (or special jar if using old Forge or MCP)
        if (loaderJson?.isOldForge && loaderJson.jarPath) {
            librariesList.push(loaderJson.jarPath);
        }
        else if (this.options.mcp) {
            librariesList.push(this.options.mcp);
        }
        else {
            librariesList.push(`${this.options.path}/versions/${versionJson.id}/${versionJson.id}.jar`);
        }
        // Filter out duplicates in the final library paths
        const uniquePaths = [];
        for (const libPath of librariesList) {
            // We only check if we've already used the exact file name
            const fileName = libPath.split('/').pop();
            if (fileName && !uniquePaths.includes(fileName)) {
                uniquePaths.push(libPath);
            }
        }
        // The final classpath argument is OS-dependent (':' on Unix, ';' on Windows)
        const cpSeparator = process.platform === 'win32' ? ';' : ':';
        const cpArgument = uniquePaths.length > 0 ? uniquePaths.join(cpSeparator) : '';
        return {
            classpath: ['-cp', cpArgument],
            mainClass: loaderJson ? loaderJson.mainClass : versionJson.mainClass
        };
    }
}
exports.default = MinecraftArguments;
//# sourceMappingURL=Minecraft-Arguments.js.map