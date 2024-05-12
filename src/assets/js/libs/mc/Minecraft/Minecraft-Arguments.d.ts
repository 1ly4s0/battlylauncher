/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
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
