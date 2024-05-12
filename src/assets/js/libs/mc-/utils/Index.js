"use strict";
/**
 * @author TECNO BROS
 
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipLibrary = exports.createZIP = exports.getFileFromJar = exports.loader = exports.mirrors = exports.getFileHash = exports.isold = exports.getPathLibraries = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
function getPathLibraries(main, nativeString, forceExt) {
    let libSplit = main.split(':');
    let fileName = libSplit[3] ? `${libSplit[2]}-${libSplit[3]}` : libSplit[2];
    let finalFileName = fileName.includes('@') ? fileName.replace('@', '.') : `${fileName}${nativeString || ''}${forceExt || '.jar'}`;
    let pathLib = `${libSplit[0].replace(/\./g, '/')}/${libSplit[1]}/${libSplit[2].split('@')[0]}`;
    return {
        path: pathLib,
        name: `${libSplit[1]}-${finalFileName}`
    };
}
exports.getPathLibraries = getPathLibraries;
async function getFileHash(filePath, algorithm = 'sha1') {
    let shasum = crypto_1.default.createHash(algorithm);
    let file = fs_1.default.createReadStream(filePath);
    file.on('data', data => {
        shasum.update(data);
    });
    let hash = await new Promise(resolve => {
        file.on('end', () => {
            resolve(shasum.digest('hex'));
        });
    });
    return hash;
}
exports.getFileHash = getFileHash;
function isold(json) {
    return json.assets === 'legacy' || json.assets === 'pre-1.6';
}
exports.isold = isold;
function loader(type) {
    if (type === 'forge') {
        return {
            metaData: 'https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json',
            meta: 'https://files.minecraftforge.net/net/minecraftforge/forge/${build}/meta.json',
            promotions: 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json',
            install: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-installer',
            universal: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-universal',
            client: 'https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-client',
        };
    }
    else if (type === 'neoforge') {
        return {
            legacyMetaData: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/forge',
            metaData: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge',
            legacyInstall: 'https://maven.neoforged.net/net/neoforged/forge/${version}/forge-${version}-installer.jar',
            install: 'https://maven.neoforged.net/net/neoforged/neoforge/${version}/neoforge-${version}-installer.jar'
        };
    }
    else if (type === 'fabric') {
        return {
            metaData: 'https://meta.fabricmc.net/v2/versions',
            json: 'https://meta.fabricmc.net/v2/versions/loader/${version}/${build}/profile/json'
        };
    }
    else if (type === 'legacyfabric') {
        return {
            metaData: 'https://meta.legacyfabric.net/v2/versions',
            json: 'https://meta.legacyfabric.net/v2/versions/loader/${version}/${build}/profile/json'
        };
    }
    else if (type === 'quilt') {
        return {
            metaData: 'https://meta.quiltmc.org/v3/versions',
            json: 'https://meta.quiltmc.org/v3/versions/loader/${version}/${build}/profile/json'
        };
    }
}
exports.loader = loader;
let mirrors = [
    "https://maven.minecraftforge.net",
    "https://maven.neoforged.net/releases",
    "https://maven.creeperhost.net",
    "https://libraries.minecraft.net",
    "https://repo1.maven.org/maven2"
];
exports.mirrors = mirrors;
async function getFileFromJar(jar, file = null, path = null) {
    let fileReturn = [];
    let zip = new adm_zip_1.default(jar);
    let entries = zip.getEntries();
    return await new Promise(resolve => {
        for (let entry of entries) {
            if (!entry.isDirectory && !path) {
                if (entry.entryName == file)
                    fileReturn = entry.getData();
                if (!file)
                    fileReturn.push({ name: entry.entryName, data: entry.getData() });
            }
            if (!entry.isDirectory && entry.entryName.includes(path) && path) {
                fileReturn.push(entry.entryName);
            }
        }
        resolve(fileReturn);
    });
}
exports.getFileFromJar = getFileFromJar;
async function createZIP(files, ignored = null) {
    let zip = new adm_zip_1.default();
    return await new Promise(resolve => {
        for (let entry of files) {
            if (ignored && entry.name.includes(ignored))
                continue;
            zip.addFile(entry.name, entry.data);
        }
        resolve(zip.toBuffer());
    });
}
exports.createZIP = createZIP;
function skipLibrary(lib) {
    let Lib = { win32: "windows", darwin: "osx", linux: "linux" };
    let skip = false;
    if (lib.rules) {
        skip = true;
        lib.rules.forEach(({ action, os, features }) => {
            if (features)
                return true;
            if (action === 'allow' && ((os && os.name === Lib[process.platform]) || !os)) {
                skip = false;
            }
            if (action === 'disallow' && ((os && os.name === Lib[process.platform]) || !os)) {
                skip = true;
            }
        });
    }
    return skip;
}
exports.skipLibrary = skipLibrary;
