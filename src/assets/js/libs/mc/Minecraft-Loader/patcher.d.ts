/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
import { EventEmitter } from 'events';
interface ForgePatcherOptions {
    path: string;
    loader: {
        type: string;
    };
}
interface Config {
    java: string;
    minecraft: string;
    minecraftJson: string;
}
interface ProfileData {
    client: string;
    [key: string]: any;
}
export interface Profile {
    data: Record<string, ProfileData>;
    processors?: any[];
    libraries?: Array<{
        name?: string;
    }>;
    path?: string;
}
export default class ForgePatcher extends EventEmitter {
    private readonly options;
    private readonly dependencyResolver;
    private readonly processorRetryAttempts;
    private readonly maxRetryAttempts;
    constructor(options: ForgePatcherOptions);
    patcher(profile: Profile, config: Config, neoForgeOld?: boolean): Promise<void>;
    check(profile: Profile): boolean;
    private setArgument;
    private computePath;
    /**
     * Retries a processor execution after dependency resolution
     */
    private retryProcessor;
    private readJarManifest;
}
export {};
