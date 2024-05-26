/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
export default class FabricMC extends EventEmitter {
    options: any;
    constructor(options?: {});
    downloadJson(Loader: any): Promise<any>;
    downloadLibraries(json: any): Promise<any>;
}
