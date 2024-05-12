/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
type loader = {
    path?: string;
    type?: string;
    build?: string;
    enable?: boolean;
};
type screen = {
    width?: number;
    height?: number;
    fullscreen?: boolean;
};
type memory = {
    min?: string;
    max?: string;
};
type javaOPTS = {
    path?: string;
    version?: number;
    type?: string;
};
type LaunchOPTS = {
    url: string | null;
    authenticator: any;
    timeout?: number;
    path: string;
    version: string;
    instance?: string;
    detached?: boolean;
    downloadFileMultiple?: number;
    intelEnabledMac?: boolean;
    loader: loader;
    mcp: any;
    verify: boolean;
    ignored: string[];
    JVM_ARGS: string[];
    GAME_ARGS: string[];
    java: javaOPTS;
    screen: screen;
    memory: memory;
};
export default class Launch extends EventEmitter {
    options: LaunchOPTS;
    Launch(opt: LaunchOPTS): Promise<boolean>;
    start(): Promise<boolean>;
    DownloadGame(): Promise<any>;
}
export {};
