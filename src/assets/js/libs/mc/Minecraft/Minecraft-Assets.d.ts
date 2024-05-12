/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
export default class MinecraftAssets {
    assetIndex: any;
    options: any;
    constructor(options: any);
    GetAssets(json: any): Promise<any[]>;
    copyAssets(json: any): void;
}
