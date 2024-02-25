/**
 * @author TECNO BROS
 
 */
export default class Json {
    options: any;
    constructor(options: any);
    GetInfoVersion(): Promise<{
        error: boolean;
        message: string;
        InfoVersion?: undefined;
        json?: undefined;
        version?: undefined;
    } | {
        InfoVersion: any;
        json: any;
        version: string;
        error?: undefined;
        message?: undefined;
    }>;
}
