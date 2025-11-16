/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
/**
 * Represents options for memory usage, screen size, extra args, etc.
 * Adapt or expand as needed for your use case.
 */
export interface LaunchOptions {
    path: string;
    instance?: string;
    authenticator: any;
    memory: {
        min?: string;
        max?: string;
    };
    screen?: {
        width?: number;
        height?: number;
    };
    GAME_ARGS: Array<string>;
    JVM_ARGS: Array<string>;
    mcp?: string;
}
/**
 * Represents the data structure of a Minecraft version JSON file (simplified).
 * Adapt this interface if your JSON includes more properties.
 */
export interface VersionJSON {
    id: string;
    type: string;
    assetIndex: {
        id: string;
    };
    assets?: string;
    mainClass?: string;
    minecraftArguments?: string;
    arguments?: {
        game?: Array<string>;
        jvm?: Array<string>;
    };
    libraries?: Array<any>;
    nativesList?: Array<string>;
}
export interface Library {
    name: string;
    loader?: string;
    natives?: Record<string, string>;
    rules?: {
        os?: {
            name?: string;
        };
    }[];
}
/**
 * Represents a loader JSON structure (e.g. Forge or Fabric).
 * Again, adapt as your loader's actual structure requires.
 */
export interface LoaderJSON {
    id?: string;
    mainClass?: string;
    libraries?: Array<any>;
    minecraftArguments?: string;
    isOldForge?: boolean;
    jarPath?: string;
}
/**
 * Data structure returned by the class, detailing arguments
 * for launching Minecraft (game args, JVM args, classpath, etc.).
 */
export interface LaunchArguments {
    game: Array<string>;
    jvm: Array<string>;
    classpath: Array<string>;
    mainClass?: string;
}
/**
 * Builds and organizes JVM and game arguments required to launch Minecraft,
 * including optional loader (e.g., Forge) arguments.
 */
export default class MinecraftArguments {
    private options;
    private authenticator;
    constructor(options: LaunchOptions);
    /**
     * Gathers all arguments (game, JVM, classpath) and returns them for launching.
     * @param versionJson The Minecraft version JSON.
     * @param loaderJson  An optional loader JSON (Forge, Fabric, etc.).
     */
    GetArguments(versionJson: VersionJSON, loaderJson?: LoaderJSON): Promise<LaunchArguments>;
    /**
     * Builds the Minecraft game arguments, injecting authentication tokens,
     * user info, and any loader arguments if present.
     * @param versionJson The Minecraft version JSON.
     * @param loaderJson  The loader JSON (e.g., Forge) if applicable.
     */
    GetGameArguments(versionJson: VersionJSON, loaderJson?: LoaderJSON): Promise<Array<string>>;
    /**
     * Builds the JVM arguments needed by Minecraft. This includes memory settings,
     * OS-specific options, and any additional arguments supplied by the user.
     * @param versionJson The Minecraft version JSON.
     */
    GetJVMArguments(versionJson: VersionJSON): Promise<Array<string>>;
    /**
     * Constructs the classpath (including libraries) that Minecraft requires
     * to launch, and identifies the main class. Optionally merges loader libraries.
     * @param versionJson The Minecraft version JSON.
     * @param loaderJson  The loader JSON (e.g., Forge, Fabric) if applicable.
     */
    GetClassPath(versionJson: VersionJSON, loaderJson?: LoaderJSON): Promise<{
        classpath: Array<string>;
        mainClass: string | undefined;
    }>;
}
