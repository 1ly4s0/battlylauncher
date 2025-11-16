"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
const Index_js_1 = require("../utils/Index.js");
const DependencyResolver_js_1 = __importDefault(require("../utils/DependencyResolver.js"));
class ForgePatcher extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.processorRetryAttempts = new Map();
        this.maxRetryAttempts = 2; // Maximum retry attempts per processor
        this.options = options;
        this.dependencyResolver = new DependencyResolver_js_1.default(path_1.default.join(this.options.path, 'libraries'));
    }
    async patcher(profile, config, neoForgeOld = true) {
        const { processors } = profile;
        if (!processors || processors.length === 0) {
            console.log('No processors found in profile, skipping patcher');
            return;
        }
        console.log(`Starting patcher with ${processors.length} processors`);
        // Pre-emptively check and resolve common missing dependencies
        console.log('🔍 Checking for missing dependencies...');
        await this.dependencyResolver.resolveMissingDependencies();
        try {
            for (const [index, processor] of Object.entries(processors)) {
                if (processor.sides && !processor.sides.includes('client')) {
                    console.log(`Skipping processor ${index} (not for client side)`);
                    continue;
                }
                console.log(`Processing processor ${index}/${processors.length}`);
                const jarInfo = (0, Index_js_1.getPathLibraries)(processor.jar);
                const jarPath = path_1.default.resolve(this.options.path, 'libraries', jarInfo.path, jarInfo.name);
                // Check if the processor JAR exists and is valid
                if (!fs_1.default.existsSync(jarPath)) {
                    const errorMessage = `Processor JAR not found: ${jarPath}`;
                    console.error(errorMessage);
                    throw new Error(errorMessage);
                }
                const args = processor.args
                    .map(arg => this.setArgument(arg, profile, config, neoForgeOld))
                    .map(arg => this.computePath(arg));
                const classPaths = processor.classpath.map(cp => {
                    const cpInfo = (0, Index_js_1.getPathLibraries)(cp);
                    return `"${path_1.default.join(this.options.path, 'libraries', cpInfo.path, cpInfo.name)}"`;
                });
                const mainClass = await this.readJarManifest(jarPath);
                if (!mainClass) {
                    const errorMessage = `Unable to determine main class in JAR: ${jarPath}`;
                    console.error(errorMessage);
                    // Emit error but continue with other processors
                    this.emit('error', new Error(errorMessage));
                    console.log('Continuing with next processor...');
                    continue;
                }
                try {
                    await new Promise((resolve, reject) => {
                        const spawned = (0, child_process_1.spawn)(`"${path_1.default.resolve(config.java)}"`, [
                            '-classpath',
                            [`"${jarPath}"`, ...classPaths].join(path_1.default.delimiter),
                            mainClass,
                            ...args
                        ], { shell: true });
                        let stderrData = '';
                        let stdoutData = '';
                        spawned.stdout.on('data', data => {
                            const output = data.toString('utf-8');
                            stdoutData += output;
                            this.emit('patch', output);
                        });
                        spawned.stderr.on('data', data => {
                            const output = data.toString('utf-8');
                            stderrData += output;
                            this.emit('patch', output);
                        });
                        spawned.on('close', async (code) => {
                            if (code !== 0) {
                                const errorMessage = `Forge patcher failed with exit code ${code}`;
                                const detailedError = stderrData.trim() || stdoutData.trim() || 'No additional error details available';
                                console.error(`${errorMessage}. Details: ${detailedError}`);
                                console.error(`JAR: ${jarPath}`);
                                console.error(`Main class: ${mainClass}`);
                                console.error(`Args: ${args.join(' ')}`);
                                // Check if this is a missing dependency error and try to resolve it
                                if (detailedError.includes('NoClassDefFoundError') || detailedError.includes('ClassNotFoundException')) {
                                    const processorIndex = parseInt(index);
                                    const retryCount = this.processorRetryAttempts.get(processorIndex) || 0;
                                    if (retryCount >= this.maxRetryAttempts) {
                                        console.log(`❌ Max retry attempts (${this.maxRetryAttempts}) reached for processor ${processorIndex}. Skipping...`);
                                        console.log('Continuing with remaining processors...');
                                        resolve(); // Continue with next processor instead of failing completely
                                        return;
                                    }
                                    console.log(`🔧 Detected missing dependency error. Attempting automatic resolution... (attempt ${retryCount + 1}/${this.maxRetryAttempts})`);
                                    try {
                                        const resolved = await this.dependencyResolver.resolveFromErrorLog(detailedError);
                                        if (resolved) {
                                            console.log('✅ Dependencies resolved! Retrying processor...');
                                            // Increment retry count
                                            this.processorRetryAttempts.set(processorIndex, retryCount + 1);
                                            // Retry the processor once after resolving dependencies
                                            this.retryProcessor(jarPath, classPaths, mainClass, args, config.java)
                                                .then(() => resolve())
                                                .catch((retryError) => {
                                                console.error('❌ Retry failed after dependency resolution:', retryError.message);
                                                console.log('Continuing with remaining processors...');
                                                resolve(); // Continue instead of failing completely
                                            });
                                            return; // Don't resolve/reject yet, wait for retry
                                        }
                                        else {
                                            console.log('❌ Could not resolve dependencies automatically');
                                            console.log('Continuing with remaining processors...');
                                            resolve(); // Continue with next processor
                                            return;
                                        }
                                    }
                                    catch (depError) {
                                        console.error('❌ Dependency resolution failed:', depError.message);
                                        console.log('Continuing with remaining processors...');
                                        resolve(); // Continue with next processor
                                        return;
                                    }
                                }
                                // Create a proper Error object instead of just emitting a string
                                const error = new Error(`${errorMessage}: ${detailedError}`);
                                this.emit('error', error);
                                // Reject the promise to properly handle the error
                                reject(error);
                            }
                            else {
                                resolve();
                            }
                        });
                        spawned.on('error', (error) => {
                            console.error(`Failed to spawn patcher process: ${error.message}`);
                            const spawnError = new Error(`Failed to spawn patcher process: ${error.message}`);
                            this.emit('error', spawnError);
                            reject(spawnError);
                        });
                    });
                    console.log(`Processor ${index} completed successfully`);
                }
                catch (processorError) {
                    console.error(`Processor ${index} failed:`, processorError.message);
                    // Emit error for this specific processor
                    this.emit('error', processorError);
                    // Decide whether to continue or fail completely
                    // For now, let's continue with other processors but log the error
                    console.log('Continuing with remaining processors...');
                }
            }
            console.log('Patcher completed for all processors');
        }
        catch (error) {
            console.error('Fatal error in patcher:', error.message);
            this.emit('error', error);
            throw error; // Re-throw to let caller handle it
        }
    }
    check(profile) {
        const { processors } = profile;
        let files = [];
        for (const processor of Object.values(processors)) {
            if (processor.sides && !processor.sides.includes('client'))
                continue;
            processor.args.forEach(arg => {
                const finalArg = arg.replace('{', '').replace('}', '');
                if (profile.data[finalArg]) {
                    if (finalArg === 'BINPATCH')
                        return;
                    files.push(profile.data[finalArg].client);
                }
            });
        }
        files = Array.from(new Set(files));
        for (const file of files) {
            const lib = (0, Index_js_1.getPathLibraries)(file.replace('[', '').replace(']', ''));
            const filePath = path_1.default.resolve(this.options.path, 'libraries', lib.path, lib.name);
            if (!fs_1.default.existsSync(filePath))
                return false;
        }
        return true;
    }
    setArgument(arg, profile, config, neoForgeOld) {
        const finalArg = arg.replace('{', '').replace('}', '');
        const universalLib = profile.libraries.find(lib => {
            if (this.options.loader.type === 'forge')
                return lib.name.startsWith('net.minecraftforge:forge');
            else
                return lib.name.startsWith(neoForgeOld ? 'net.neoforged:forge' : 'net.neoforged:neoforge');
        });
        if (profile.data[finalArg]) {
            if (finalArg === 'BINPATCH') {
                const jarInfo = (0, Index_js_1.getPathLibraries)(profile.path || (universalLib?.name ?? ''));
                return `"${path_1.default.join(this.options.path, 'libraries', jarInfo.path, jarInfo.name).replace('.jar', '-clientdata.lzma')}"`;
            }
            return profile.data[finalArg].client;
        }
        return arg
            .replace('{SIDE}', 'client')
            .replace('{ROOT}', `"${path_1.default.dirname(path_1.default.resolve(this.options.path, 'forge'))}"`)
            .replace('{MINECRAFT_JAR}', `"${config.minecraft}"`)
            .replace('{MINECRAFT_VERSION}', `"${config.minecraftJson}"`)
            .replace('{INSTALLER}', `"${path_1.default.join(this.options.path, 'libraries')}"`)
            .replace('{LIBRARY_DIR}', `"${path_1.default.join(this.options.path, 'libraries')}"`);
    }
    computePath(arg) {
        if (arg.startsWith('[')) {
            const libInfo = (0, Index_js_1.getPathLibraries)(arg.replace('[', '').replace(']', ''));
            return `"${path_1.default.join(this.options.path, 'libraries', libInfo.path, libInfo.name)}"`;
        }
        return arg;
    }
    /**
     * Retries a processor execution after dependency resolution
     */
    async retryProcessor(jarPath, classPaths, mainClass, args, javaPath) {
        console.log('🔄 Retrying processor after dependency resolution...');
        return new Promise((resolve, reject) => {
            const spawned = (0, child_process_1.spawn)(`"${path_1.default.resolve(javaPath)}"`, [
                '-classpath',
                [`"${jarPath}"`, ...classPaths].join(path_1.default.delimiter),
                mainClass,
                ...args
            ], { shell: true });
            let stderrData = '';
            let stdoutData = '';
            spawned.stdout.on('data', data => {
                const output = data.toString('utf-8');
                stdoutData += output;
                this.emit('patch', `[RETRY] ${output}`);
            });
            spawned.stderr.on('data', data => {
                const output = data.toString('utf-8');
                stderrData += output;
                this.emit('patch', `[RETRY] ${output}`);
            });
            spawned.on('close', code => {
                if (code !== 0) {
                    const retryError = new Error(`Retry failed with exit code ${code}: ${stderrData.trim() || stdoutData.trim()}`);
                    reject(retryError);
                }
                else {
                    console.log('✅ Processor retry succeeded!');
                    resolve();
                }
            });
            spawned.on('error', (error) => {
                reject(new Error(`Failed to spawn retry process: ${error.message}`));
            });
        });
    }
    async readJarManifest(jarPath) {
        try {
            const manifestContent = await (0, Index_js_1.getFileFromArchiveWithRecovery)(jarPath, 'META-INF/MANIFEST.MF');
            if (!manifestContent)
                return null;
            const content = manifestContent.toString();
            const mainClassLine = content.split('Main-Class: ')[1];
            if (!mainClassLine)
                return null;
            return mainClassLine.split('\r\n')[0];
        }
        catch (error) {
            console.error(`Failed to read JAR manifest from ${jarPath}:`, error.message);
            // Check if this is a ZIP corruption error
            if (error.message.includes('Invalid or unsupported zip format') ||
                error.message.includes('No END header found')) {
                console.log(`Detected corrupted JAR file. Consider providing a redownload URL for automatic recovery.`);
            }
            return null;
        }
    }
}
exports.default = ForgePatcher;
//# sourceMappingURL=patcher.js.map