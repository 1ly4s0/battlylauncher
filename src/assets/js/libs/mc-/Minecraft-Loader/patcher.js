"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
const Index_js_1 = require("../utils/Index.js");
class forgePatcher extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }
    async patcher(profile, config, neoForgeOld = true) {
        let { processors } = profile;
        for (let key in processors) {
            if (Object.prototype.hasOwnProperty.call(processors, key)) {
                let processor = processors[key];
                if (processor?.sides && !(processor?.sides || []).includes('client')) {
                    continue;
                }
                let jar = (0, Index_js_1.getPathLibraries)(processor.jar);
                let filePath = path_1.default.resolve(this.options.path, 'libraries', jar.path, jar.name);
                let args = processor.args.map(arg => this.setArgument(arg, profile, config, neoForgeOld)).map(arg => this.computePath(arg));
                let classPaths = processor.classpath.map(cp => {
                    let classPath = (0, Index_js_1.getPathLibraries)(cp);
                    return `"${path_1.default.join(this.options.path, 'libraries', `${classPath.path}/${classPath.name}`)}"`;
                });
                let mainClass = await this.readJarManifest(filePath);
                await new Promise((resolve) => {
                    const ps = (0, child_process_1.spawn)(`"${path_1.default.resolve(config.java)}"`, [
                        '-classpath',
                        [`"${filePath}"`, ...classPaths].join(path_1.default.delimiter),
                        mainClass,
                        ...args
                    ], { shell: true });
                    ps.stdout.on('data', data => {
                        this.emit('patch', data.toString('utf-8'));
                    });
                    ps.stderr.on('data', data => {
                        this.emit('patch', data.toString('utf-8'));
                    });
                    ps.on('close', code => {
                        if (code !== 0) {
                            this.emit('error', `Forge patcher exited with code ${code}`);
                            resolve();
                        }
                        resolve();
                    });
                });
            }
        }
    }
    check(profile) {
        let files = [];
        let { processors } = profile;
        for (let key in processors) {
            if (Object.prototype.hasOwnProperty.call(processors, key)) {
                let processor = processors[key];
                if (processor?.sides && !(processor?.sides || []).includes('client'))
                    continue;
                processor.args.map(arg => {
                    let finalArg = arg.replace('{', '').replace('}', '');
                    if (profile.data[finalArg]) {
                        if (finalArg === 'BINPATCH')
                            return;
                        files.push(profile.data[finalArg].client);
                    }
                });
            }
        }
        files = files.filter((item, index) => files.indexOf(item) === index);
        for (let file of files) {
            let libMCP = (0, Index_js_1.getPathLibraries)(file.replace('[', '').replace(']', ''));
            file = `${path_1.default.resolve(this.options.path, 'libraries', `${libMCP.path}/${libMCP.name}`)}`;
            if (!fs_1.default.existsSync(file))
                return false;
        }
        return true;
    }
    setArgument(arg, profile, config, neoForgeOld) {
        let finalArg = arg.replace('{', '').replace('}', '');
        let universalPath = profile.libraries.find(v => {
            if (this.options.loader.type === 'forge')
                return (v.name || '').startsWith('net.minecraftforge:forge');
            if (this.options.loader.type === 'neoforge')
                return (v.name || '').startsWith(neoForgeOld ? 'net.neoforged:forge' : 'net.neoforged:neoforge');
        });
        if (profile.data[finalArg]) {
            if (finalArg === 'BINPATCH') {
                let clientdata = (0, Index_js_1.getPathLibraries)(profile.path || universalPath.name);
                return `"${path_1.default
                    .join(this.options.path, 'libraries', `${clientdata.path}/${clientdata.name}`)
                    .replace('.jar', '-clientdata.lzma')}"`;
            }
            return profile.data[finalArg].client;
        }
        return arg
            .replace('{SIDE}', `client`)
            .replace('{ROOT}', `"${path_1.default.dirname(path_1.default.resolve(this.options.path, 'forge'))}"`)
            .replace('{MINECRAFT_JAR}', `"${config.minecraft}"`)
            .replace('{MINECRAFT_VERSION}', `"${config.minecraftJson}"`)
            .replace('{INSTALLER}', `"${this.options.path}/libraries"`)
            .replace('{LIBRARY_DIR}', `"${this.options.path}/libraries"`);
    }
    computePath(arg) {
        if (arg[0] === '[') {
            let libMCP = (0, Index_js_1.getPathLibraries)(arg.replace('[', '').replace(']', ''));
            return `"${path_1.default.join(this.options.path, 'libraries', `${libMCP.path}/${libMCP.name}`)}"`;
        }
        return arg;
    }
    async readJarManifest(jarPath) {
        let extraction = await (0, Index_js_1.getFileFromArchive)(jarPath, 'META-INF/MANIFEST.MF');
        if (extraction)
            return (extraction.toString("utf8")).split('Main-Class: ')[1].split('\r\n')[0];
        return null;
    }
}
exports.default = forgePatcher;
