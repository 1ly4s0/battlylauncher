/**
 * @author TECNO BROS
 
 */
export default class MinecraftArguments {
    options: any;
    authenticator: any;
    constructor(options: any);
    GetArguments(json: any, loaderJson: any): Promise<{
        game: any;
        jvm: string[];
        classpath: any[];
        mainClass: any;
    }>;
    GetGameArguments(json: any, loaderJson: any): Promise<any>;
    GetJVMArguments(json: any): Promise<string[]>;
    GetClassPath(json: any, loaderJson: any): Promise<{
        classpath: any[];
        mainClass: any;
    }>;
}
