"use strict";
/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const events_1 = __importDefault(require("events"));
const node_7z_1 = __importDefault(require("node-7z"));
const _7zip_bin_1 = __importDefault(require("7zip-bin"));
const Index_js_1 = require("../utils/Index.js");
const Downloader_js_1 = __importDefault(require("../utils/Downloader.js"));
class JavaDownloader extends events_1.default {
    constructor(options) {
        super();
        this.options = options;
    }
    async getJavaFiles(jsonversion, OnlyLaunch) {
        if (this.options.java.version)
            return await this.getJavaOther(jsonversion, this.options.java.version);
        const archMapping = {
            win32: { x64: 'windows-x64', ia32: 'windows-x86', arm64: 'windows-arm64' },
            darwin: { x64: 'mac-os', arm64: this.options.intelEnabledMac ? "mac-os" : "mac-os-arm64" },
            linux: { x64: 'linux', ia32: 'linux-i386' }
        };
        const osPlatform = os_1.default.platform();
        const arch = os_1.default.arch();
        const osArchMapping = archMapping[osPlatform];
        const javaVersion = jsonversion.javaVersion?.component || 'jre-legacy';
        let files = [];
        if (!osArchMapping)
            return await this.getJavaOther(jsonversion);
        const archOs = osArchMapping[arch];
        let javaVersionsJson;
        try {
            if (!OnlyLaunch) {
                javaVersionsJson = await (0, node_fetch_1.default)(`https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json`).then(res => res.json());
                fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, "runtime"), { recursive: true });
                fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, "runtime/java-versions.json"), JSON.stringify(javaVersionsJson));
            }
            else {
                javaVersionsJson = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, "runtime/java-versions.json"), 'utf-8'));
            }
        }
        catch (e) {
            javaVersionsJson = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, "runtime/java-versions.json"), 'utf-8'));
        }
        const versionName = javaVersionsJson[archOs]?.[javaVersion]?.[0]?.version?.name;
        if (!versionName)
            return await this.getJavaOther(jsonversion);
        const manifestUrl = javaVersionsJson[archOs][javaVersion][0]?.manifest?.url;
        let manifest;
        try {
            if (!OnlyLaunch) {
                manifest = await (0, node_fetch_1.default)(manifestUrl).then(res => res.json());
                fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, `runtime/jre-${versionName}-${archOs}`), { recursive: true });
                fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, `runtime/jre-${versionName}-${archOs}/java-versions.json`), JSON.stringify(manifest));
            }
            else {
                manifest = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, `runtime/jre-${versionName}-${archOs}/java-versions.json`), 'utf-8'));
            }
        }
        catch (e) {
            manifest = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, `runtime/jre-${versionName}-${archOs}/java-versions.json`), 'utf-8'));
        }
        const javaFiles = Object.entries(manifest.files);
        const java = javaFiles.find(([path]) => path.endsWith(process.platform === 'win32' ? 'bin/javaw.exe' : 'bin/java'))[0];
        const toDelete = java.replace(process.platform === 'win32' ? 'bin/javaw.exe' : 'bin/java', '');
        for (let [path, info] of javaFiles) {
            if (info.type == "directory")
                continue;
            if (!info.downloads)
                continue;
            let file = {};
            file.path = `runtime/jre-${versionName}-${archOs}/${path.replace(toDelete, "")}`;
            file.executable = info.executable;
            file.sha1 = info.downloads.raw.sha1;
            file.size = info.downloads.raw.size;
            file.url = info.downloads.raw.url;
            file.type = "Java";
            files.push(file);
        }
        return {
            files,
            path: path_1.default.resolve(this.options.path, `runtime/jre-${versionName}-${archOs}/bin/java`),
        };
    }
    async getJavaOther(jsonversion, versionDownload) {
        const majorVersion = versionDownload || jsonversion.javaVersion?.majorVersion;
        const javaVersionURL = `https://api.adoptium.net/v3/assets/latest/${majorVersion ? majorVersion : 8}/hotspot`;
        let javaVersions;
        try {
            javaVersions = await (0, node_fetch_1.default)(javaVersionURL).then(res => res.json());
            fs_1.default.mkdirSync(path_1.default.resolve(this.options.path, "runtime"), { recursive: true });
            fs_1.default.writeFileSync(path_1.default.resolve(this.options.path, "runtime/other-java-versions.json"), JSON.stringify(javaVersions));
        }
        catch (e) {
            javaVersions = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(this.options.path, "runtime/other-java-versions.json"), 'utf-8'));
        }
        const { platform, arch } = this.getPlatformArch();
        const java = javaVersions.find(file => file.binary.image_type === this.options.java.type &&
            file.binary.architecture === arch &&
            file.binary.os === platform);
        if (!java)
            return { error: true, message: "No Java found" };
        const { checksum, link: url, name: fileName } = java.binary.package;
        const { release_name: version } = java;
        const image_type = java.binary.image_type;
        const pathFolder = path_1.default.resolve(this.options.path, `runtime/jre-${majorVersion}`);
        const filePath = path_1.default.resolve(pathFolder, fileName);
        await this.verifyAndDownloadFile({
            filePath,
            pathFolder,
            fileName,
            url,
            checksum,
            pathExtract: `${pathFolder}/${version}${image_type === 'jre' ? '-jre' : ''}`
        });
        let javaPath = `${pathFolder}/${version}${image_type === 'jre' ? '-jre' : ''}/bin/java`;
        if (platform == 'mac')
            javaPath = `${pathFolder}/${version}${image_type === 'jre' ? '-jre' : ''}/Contents/Home/bin/java`;
        if (!fs_1.default.existsSync(javaPath)) {
            await this.extract(filePath, pathFolder);
            await this.extract(filePath.replace('.gz', ''), pathFolder);
            if (fs_1.default.existsSync(filePath.replace('.gz', '')))
                fs_1.default.unlinkSync(filePath.replace('.gz', ''));
            if (platform !== 'windows')
                fs_1.default.chmodSync(javaPath, 0o755);
        }
        return {
            files: [],
            path: javaPath,
        };
    }
    getPlatformArch() {
        return {
            platform: {
                win32: 'windows',
                darwin: 'mac',
                linux: 'linux'
            }[os_1.default.platform()],
            arch: {
                x64: 'x64',
                ia32: 'x32',
                arm64: this.options.intelEnabledMac && os_1.default.platform() == 'darwin' ? "x64" : "aarch64",
                arm: 'arm'
            }[os_1.default.arch()]
        };
    }
    async verifyAndDownloadFile({ filePath, pathFolder, fileName, url, checksum, pathExtract }) {
        if (fs_1.default.existsSync(filePath)) {
            if (await (0, Index_js_1.getFileHash)(filePath, 'sha256') !== checksum) {
                fs_1.default.unlinkSync(filePath);
                fs_1.default.rmdirSync(pathExtract, { recursive: true });
            }
        }
        if (!fs_1.default.existsSync(filePath)) {
            if (!fs_1.default.existsSync(pathFolder))
                fs_1.default.mkdirSync(pathFolder, { recursive: true });
            let download = new Downloader_js_1.default();
            download.on('progress', (downloaded, size) => {
                this.emit('progress', downloaded, size, fileName);
            });
            await download.downloadFile(url, pathFolder, fileName);
        }
        if (await (0, Index_js_1.getFileHash)(filePath, 'sha256') !== checksum) {
            return { error: true, message: "Java checksum failed" };
        }
    }
    async extract(filePath, destPath) {
        return await new Promise((resolve, reject) => {
            if (os_1.default.platform() !== 'win32')
                fs_1.default.chmodSync(_7zip_bin_1.default.path7za, 0o755);
            const extract = node_7z_1.default.extractFull(filePath, destPath, {
                $bin: _7zip_bin_1.default.path7za,
                recursive: true,
                $progress: true,
            });
            extract.on('end', () => {
                resolve(true);
            });
            extract.on('error', (err) => {
                console.log(err);
                reject(err);
            });
            extract.on('progress', (progress) => {
                if (progress.percent > 0)
                    this.emit('extract', progress.percent);
            });
        });
    }
}
exports.default = JavaDownloader;
