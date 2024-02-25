/**
 * @author TECNO BROS
 
 */
export default class MinecraftAssets {
    assetIndex: any;
    options: any;
    constructor(options: any);
    GetAssets(json: any): Promise<any[]>;
    copyAssets(json: any): void;
}
