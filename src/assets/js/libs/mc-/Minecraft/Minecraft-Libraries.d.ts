/**
 * @author TECNO BROS
 
 */
export default class Libraries {
    json: any;
    options: any;
    constructor(options: any);
    Getlibraries(json: any): Promise<any[]>;
    GetAssetsOthers(url: any): Promise<any[]>;
    natives(bundle: any): Promise<any>;
}
