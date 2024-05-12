/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
export default class Loader extends EventEmitter {
    options: any;
    constructor(options: any);
    install(): Promise<boolean>;
    forge(Loader: any): Promise<any>;
    neoForge(Loader: any): Promise<any>;
    fabric(Loader: any): Promise<any>;
    legacyFabric(Loader: any): Promise<any>;
    quilt(Loader: any): Promise<any>;
}
