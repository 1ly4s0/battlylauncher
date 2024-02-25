/**
 * @author TECNO BROS
 
 */
export default class ForgeMC {
    options: any;
    on: any;
    emit: any;
    constructor(options?: {});
    downloadInstaller(Loader: any): Promise<{
        error: string;
        filePath?: undefined;
        metaData?: undefined;
        ext?: undefined;
        id?: undefined;
    } | {
        filePath: string;
        metaData: any;
        ext: String;
        id: string;
        error?: undefined;
    }>;
    extractProfile(pathInstaller: any): Promise<any>;
    extractUniversalJar(profile: any, pathInstaller: any): Promise<boolean>;
    downloadLibraries(profile: any, skipForgeFilter: any): Promise<any>;
    patchForge(profile: any): Promise<boolean>;
    createProfile(id: any, pathInstaller: any): Promise<any>;
}
