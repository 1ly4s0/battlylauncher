export default class forgePatcher {
    options: any;
    on: any;
    emit: any;
    constructor(options: any);
    patcher(profile: any, config: any, neoForgeOld?: boolean): Promise<void>;
    check(profile: any): boolean;
    setArgument(arg: any, profile: any, config: any, neoForgeOld: any): any;
    computePath(arg: any): any;
    readJarManifest(jarPath: string): Promise<any>;
}
