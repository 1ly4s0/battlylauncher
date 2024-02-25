/**
 * @author TECNO BROS
 
 */
type loader = {
    rootPath?: boolean;
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
    javaPath: string;
    screen: screen;
    memory: memory;
};
export default class Launch {
    options: LaunchOPTS;
    on: any;
    emit: any;
    constructor();
    Launch(opt: LaunchOPTS): Promise<any>;
    start(): Promise<any>;
    DownloadGame(): Promise<any>;
}
export {};
