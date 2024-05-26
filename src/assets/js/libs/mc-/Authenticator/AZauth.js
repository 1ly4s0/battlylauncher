"use strict";
/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
class AZauth {
    constructor(url) {
        this.url = `${url}/api/auth`;
    }
    async login(username, password, A2F = null) {
        let response = await (0, node_fetch_1.default)(`${this.url}/authenticate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: username,
                password: password,
                code: A2F
            }),
        }).then((res) => res.json());
        if (response.status == 'pending' && response.reason == '2fa') {
            return { A2F: true };
        }
        if (response.status == 'error') {
            return {
                error: true,
                reason: response.reason,
                message: response.message
            };
        }
        return {
            access_token: response.access_token,
            client_token: response.uuid,
            uuid: response.uuid,
            name: response.username,
            user_properties: '{}',
            user_info: {
                banned: response.banned,
                money: response.money,
                role: response.role
            },
            meta: {
                online: false,
                type: 'AZauth',
            }
        };
    }
    async verify(user) {
        let response = await (0, node_fetch_1.default)(`${this.url}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                access_token: user.access_token
            }),
        }).then((res) => res.json());
        if (response.status == 'error') {
            return {
                error: true,
                reason: response.reason,
                message: response.message
            };
        }
        return {
            access_token: response.access_token,
            client_token: response.uuid,
            uuid: response.uuid,
            name: response.username,
            user_properties: '{}',
            user_info: {
                banned: response.banned,
                money: response.money,
                role: response.role
            },
            meta: {
                online: false,
                type: 'AZauth',
            }
        };
    }
    async signout(user) {
        let auth = await (0, node_fetch_1.default)(`${this.url}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: user.access_token
            }),
        }).then((res) => res.json());
        if (auth.error)
            return false;
        return true;
    }
}
exports.default = AZauth;
