/**
 * @author TECNO BROS
 
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
