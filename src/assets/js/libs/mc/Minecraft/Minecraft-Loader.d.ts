/**
 * @author TECNO BROS
 
 */
export default class MinecraftLoader {
    options: any;
    on: any;
    emit: any;
    loaderPath: string;
    constructor(options: any);
    GetLoader(version: any, javaPath: any): Promise<unknown>;
    GetArguments(json: any, version: any): Promise<{
        game: any[];
        jvm: any[];
        mainClass?: undefined;
    } | {
        game: any;
        jvm: any;
        mainClass: any;
    }>;
}
