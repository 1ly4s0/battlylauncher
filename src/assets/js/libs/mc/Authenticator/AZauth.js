"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
Object.defineProperty(exports, "__esModule", { value: true });
const node_buffer_1 = require("node:buffer");
class AZauth {
    /**
     * The constructor prepares the authentication and skin URLs from the base URL.
     * @param url The base URL of the AZauth server
     */
    constructor(url) {
        // '/api/auth' for authentication, '/api/skin-api/skins' for skin data
        this.url = new URL('/api/auth', url).toString();
        this.skinAPI = new URL('/api/skin-api/skins', url).toString();
    }
    /**
     * Authenticates a user using their username/email and password.
     * Optionally, a 2FA code can be provided.
     *
     * @param username The email or username for authentication
     * @param password The password
     * @param A2F Optional 2FA code
     * @returns A Promise that resolves to an AZauthUser object
     */
    async login(username, password, A2F = null) {
        const response = await fetch(`${this.url}/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: username,
                password,
                code: A2F
            })
        });
        const data = await response.json();
        // If the server indicates that 2FA is required
        if (data.status === 'pending' && data.reason === '2fa') {
            return { A2F: true };
        }
        // If the server returns an error status
        if (data.status === 'error') {
            return {
                error: true,
                reason: data.reason,
                message: data.message
            };
        }
        // If authentication is successful, return the complete user object
        return {
            access_token: data.access_token,
            client_token: data.uuid,
            uuid: data.uuid,
            name: data.username,
            user_properties: '{}',
            user_info: {
                id: data.id,
                banned: data.banned,
                money: data.money,
                role: data.role,
                verified: data.email_verified
            },
            meta: {
                online: false,
                type: 'AZauth'
            },
            profile: {
                skins: [await this.skin(data.id)]
            }
        };
    }
    /**
     * Verifies an existing session (e.g., for refreshing tokens).
     * @param user An AZauthUser object containing at least the access token
     * @returns A Promise that resolves to an updated AZauthUser object or an error object
     */
    async verify(user) {
        const response = await fetch(`${this.url}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: user.access_token
            })
        });
        const data = await response.json();
        // If the server indicates an error
        if (data.status === 'error') {
            return {
                error: true,
                reason: data.reason,
                message: data.message
            };
        }
        // Return the updated user session object
        return {
            access_token: data.access_token,
            client_token: data.uuid,
            uuid: data.uuid,
            name: data.username,
            user_properties: '{}',
            user_info: {
                id: data.id,
                banned: data.banned,
                money: data.money,
                role: data.role,
                verified: data.email_verified
            },
            meta: {
                online: false,
                type: 'AZauth'
            },
            profile: {
                skins: [await this.skin(data.id)]
            }
        };
    }
    /**
     * Logs out a user from the AZauth service (invalidates the token).
     * @param user The AZauthUser object with a valid access token
     * @returns A Promise that resolves to true if logout is successful, otherwise false
     */
    async signout(user) {
        const response = await fetch(`${this.url}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: user.access_token
            })
        });
        const data = await response.json();
        if (data.error)
            return false;
        return true;
    }
    /**
     * Retrieves the skin of a user by their ID (UUID).
     * If the skin exists, returns both the direct URL and a base64-encoded PNG.
     * If the skin doesn't exist, only the URL is returned.
     *
     * @param uuid The UUID or ID of the user
     * @returns A Promise resolving to an object with the skin URL (and optional base64 data)
     */
    async skin(uuid) {
        let response = await fetch(`${this.skinAPI}/${uuid}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        // If the skin is not found (404), return only the URL
        if (response.status === 404) {
            return {
                url: `${this.skinAPI}/${uuid}`
            };
        }
        // Otherwise, convert the skin image to a base64-encoded string
        const arrayBuffer = await response.arrayBuffer();
        const buffer = node_buffer_1.Buffer.from(arrayBuffer);
        return {
            url: `${this.skinAPI}/${uuid}`,
            base64: `data:image/png;base64,${buffer.toString('base64')}`
        };
    }
}
exports.default = AZauth;
//# sourceMappingURL=AZauth.js.map