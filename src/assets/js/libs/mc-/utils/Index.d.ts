/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
declare function getPathLibraries(main: any, nativeString?: any, forceExt?: any): {
    path: string;
    name: string;
};
declare function getFileHash(filePath: string, algorithm?: string): Promise<unknown>;
declare function isold(json: any): boolean;
declare function loader(type: string): {
    metaData: string;
    meta: string;
    promotions: string;
    install: string;
    universal: string;
    client: string;
    legacyMetaData?: undefined;
    legacyInstall?: undefined;
    json?: undefined;
} | {
    legacyMetaData: string;
    metaData: string;
    legacyInstall: string;
    install: string;
    meta?: undefined;
    promotions?: undefined;
    universal?: undefined;
    client?: undefined;
    json?: undefined;
} | {
    metaData: string;
    json: string;
    meta?: undefined;
    promotions?: undefined;
    install?: undefined;
    universal?: undefined;
    client?: undefined;
    legacyMetaData?: undefined;
    legacyInstall?: undefined;
};
declare let mirrors: string[];
declare function getFileFromArchive(jar: string, file?: string, path?: string): Promise<unknown>;
declare function createZIP(files: any, ignored?: any): Promise<unknown>;
declare function skipLibrary(lib: any): boolean;
export { getPathLibraries, isold, getFileHash, mirrors, loader, getFileFromArchive, createZIP, skipLibrary };
