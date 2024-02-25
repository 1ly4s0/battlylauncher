/**
 * @author TECNO BROS
 
 */
export default class MinecraftBundle {
    options: any;
    constructor(options: any);
    checkBundle(bundle: any): Promise<any[]>;
    getTotalSize(bundle: any): Promise<number>;
    checkFiles(bundle: any): Promise<void>;
    getFiles(path: any, file?: any[]): any[];
}
