/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
export default class status {
    ip: string;
    port: number;
    constructor(ip?: string, port?: number);
    getStatus(): Promise<unknown>;
}
