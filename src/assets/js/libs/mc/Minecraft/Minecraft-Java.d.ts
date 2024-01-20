/**
 * @author TECNO BROS
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
export default class java {
    options: any;
    constructor(options: any);
    GetJsonJava(jsonversion: any): Promise<void | {
        error: boolean;
        message: string;
        files?: undefined;
        path?: undefined;
    } | {
        files: any;
        path: string;
        error?: undefined;
        message?: undefined;
    }>;
}
