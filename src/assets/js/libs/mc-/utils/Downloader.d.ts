/**
 * @author TECNO BROS
 
 */
interface downloadOptions {
    url: string;
    path: string;
    length: number;
    folder: string;
}
export default class download {
    on: any;
    emit: any;
    constructor();
    downloadFile(url: string, path: string, fileName: string): Promise<unknown>;
    downloadFileMultiple(files: downloadOptions, size: number, limit?: number, timeout?: number): Promise<unknown>;
    checkURL(url: string, timeout?: number): Promise<unknown>;
    checkMirror(baseURL: string, mirrors: any): Promise<false | {
        url: string;
        size: any;
        status: any;
    }>;
}
export {};
