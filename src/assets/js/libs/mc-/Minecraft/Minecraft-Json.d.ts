/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
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
