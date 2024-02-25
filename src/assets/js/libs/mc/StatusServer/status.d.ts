/**
 * @author TECNO BROS
 
 */
export default class status {
    ip: string;
    port: number;
    constructor(ip?: string, port?: number);
    getStatus(): Promise<unknown>;
}
