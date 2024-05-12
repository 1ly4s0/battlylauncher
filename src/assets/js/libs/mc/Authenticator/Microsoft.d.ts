/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
export default class Microsoft {
    client_id: string;
    type: 'electron' | 'nwjs' | 'terminal';
    constructor(client_id: string);
    getAuth(type: string, url: string): Promise<any>;
    url(code: string): Promise<any>;
    refresh(acc: any): Promise<any>;
    getAccount(oauth2: any): Promise<any>;
    getProfile(mcLogin: any): Promise<any>;
}
