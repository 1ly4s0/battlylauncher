/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
type loader = {
    /**
     * Path to loader directory. Relative to absolute path to Minecraft's root directory (config option `path`).
     *
     * If `undefined`, defaults to `.minecraft/loader/<loader_type>`.
     *
     * Example: `'fabricfiles'`.
     */
    path?: string;
    /**
     * Loader type.
     *
     * Acceptable values: `'forge'`, `'neoforge'`, `'fabric'`, `'legacyfabric'`, `'quilt'`.
     */
    type?: string;
    /**
     * Loader build (version).
     *
     * Acceptable values: `'latest'`, `'recommended'`, actual version.
     *
     * Example: `'0.16.3'`
     */
    build?: string;
    /**
     * Should the launcher use a loader?
     */
    enable?: boolean;
};
/**
 * Screen options.
 */
type screen = {
    width?: number;
    height?: number;
    /**
     * Should Minecraft be started in fullscreen mode?
     */
    fullscreen?: boolean;
};
/**
 * Memory limits
 */
type memory = {
    /**
     * Sets the `-Xms` JVM argument. This is the initial memory usage.
     */
    min?: string;
    /**
     * Sets the `-Xmx` JVM argument. This is the limit of memory usage.
     */
    max?: string;
};
/**
 * Java download options
 */
type javaOPTS = {
    /**
     * Absolute path to Java binaries directory.
     *
     * If set, expects Java to be already downloaded. If `undefined`, downloads Java and sets it automatically.
     *
     * Example: `'C:\Program Files\Eclipse Adoptium\jdk-21.0.2.13-hotspot\bin'`
     */
    path?: string;
    /**
     * Java version number.
     *
     * If set, fetched from https://api.adoptium.net.
     * If `undefined`, fetched from [Mojang](https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json).
     *
     * Example: `21`
     */
    version?: string;
    /**
     * Java image type. Acceptable values: `'jdk'`, `'jre'`, `'testimage'`, `'debugimage'`, `'staticlibs'`, `'sources'`, `'sbom'`.
     *
     * Using `jre` is recommended since it only has what's needed.
     */
    type: string;
};
/**
 * Launch options.
 */
export type LaunchOPTS = {
    /**
     * URL to the launcher backend. Refer to [Selvania Launcher Wiki](https://github.com/luuxis/Selvania-Launcher/blob/master/docs/wiki_EN-US.md) for setup instructions.
     */
    url?: string | null;
    /**
     * Something to Authenticate the player.
     *
     * Refer to `Mojang`, `Microsoft` or `AZauth` classes.
     *
     * Example: `await Mojang.login('Luuxis')`
     */
    authenticator: any;
    /**
     * Connection timeout in milliseconds.
     */
    timeout?: number;
    /**
     * Absolute path to Minecraft's root directory.
     *
     * Example: `'%appdata%/.minecraft'`
     */
    path: string;
    /**
     * Minecraft version.
     *
     * Example: `'1.20.4'`
     */
    version: string;
    /**
     * Path to instance directory. Relative to absolute path to Minecraft's root directory (config option `path`).
     * This separates game files (e.g. versions, libraries, assets) from game data (e.g. worlds, resourcepacks, options).
     *
     * Example: `'PokeMoonX'`
     */
    instance?: string;
    /**
     * Should Minecraft process be independent of launcher?
     */
    detached?: boolean;
    /**
     * How many concurrent downloads can be in progress at once.
     */
    downloadFileMultiple?: number;
    intelEnabledMac?: boolean;
    /**
     * Loader config
     */
    loader: loader;
    /**
     * MCPathcer directory. (idk actually luuxis please verify this)
     *
     * If `instance` if set, relative to it.
     * If `instance` is `undefined`, relative to `path`.
     */
    mcp: any;
    /**
     * Should game files be verified each launch?
     */
    verify: boolean;
    /**
     * Files to ignore from instance. (idk actually luuxis please verify this)
     */
    ignored: string[];
    /**
     * Custom JVM arguments. Read more on [wiki.vg](https://wiki.vg/Launching_the_game#JVM_Arguments)
     */
    JVM_ARGS: string[];
    /**
     * Custom game arguments. Read more on [wiki.vg](https://wiki.vg/Launching_the_game#Game_Arguments)
     */
    GAME_ARGS: string[];
    /**
     * Java options.
     */
    java: javaOPTS;
    /**
     * Screen options.
     */
    screen: screen;
    /**
     * Memory limit options.
     */
    memory: memory;
};
export default class Launch extends EventEmitter {
    options: LaunchOPTS;
    Launch(opt: LaunchOPTS): Promise<boolean>;
    start(): Promise<boolean>;
    DownloadGame(): Promise<any>;
}
export {};
