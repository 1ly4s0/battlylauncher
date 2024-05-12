/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
export default class AZauth {
    url: string;
    constructor(url: string);
    login(username: string, password: string, A2F?: any): Promise<{
        A2F: boolean;
        error?: undefined;
        reason?: undefined;
        message?: undefined;
        access_token?: undefined;
        client_token?: undefined;
        uuid?: undefined;
        name?: undefined;
        user_properties?: undefined;
        user_info?: undefined;
        meta?: undefined;
    } | {
        error: boolean;
        reason: any;
        message: any;
        A2F?: undefined;
        access_token?: undefined;
        client_token?: undefined;
        uuid?: undefined;
        name?: undefined;
        user_properties?: undefined;
        user_info?: undefined;
        meta?: undefined;
    } | {
        access_token: any;
        client_token: any;
        uuid: any;
        name: any;
        user_properties: string;
        user_info: {
            banned: any;
            money: any;
            role: any;
        };
        meta: {
            online: boolean;
            type: string;
        };
        A2F?: undefined;
        error?: undefined;
        reason?: undefined;
        message?: undefined;
    }>;
    verify(user: any): Promise<{
        error: boolean;
        reason: any;
        message: any;
        access_token?: undefined;
        client_token?: undefined;
        uuid?: undefined;
        name?: undefined;
        user_properties?: undefined;
        user_info?: undefined;
        meta?: undefined;
    } | {
        access_token: any;
        client_token: any;
        uuid: any;
        name: any;
        user_properties: string;
        user_info: {
            banned: any;
            money: any;
            role: any;
        };
        meta: {
            online: boolean;
            type: string;
        };
        error?: undefined;
        reason?: undefined;
        message?: undefined;
    }>;
    signout(user: any): Promise<boolean>;
}
