/**
 * @author TECNO BROS
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
export default class Loader {
    options: any;
    on: any;
    emit: any;
    constructor(options: any);
    install(): Promise<any>;
    forge(Loader: any): Promise<any>;
    neoForge(Loader: any): Promise<any>;
    fabric(Loader: any): Promise<any>;
    legacyFabric(Loader: any): Promise<any>;
    quilt(Loader: any): Promise<any>;
}
