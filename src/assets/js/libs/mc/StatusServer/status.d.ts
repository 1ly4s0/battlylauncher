/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
export default class status {
    ip: string;
    port: number;
    constructor(ip?: string, port?: number);
    getStatus(): Promise<unknown>;
}
