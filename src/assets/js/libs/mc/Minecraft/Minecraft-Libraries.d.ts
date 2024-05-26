/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
export default class Libraries {
    json: any;
    options: any;
    constructor(options: any);
    Getlibraries(json: any): Promise<any[]>;
    GetAssetsOthers(url: any, OnlyLaunch: any): Promise<any[]>;
    natives(bundle: any): Promise<any>;
}
