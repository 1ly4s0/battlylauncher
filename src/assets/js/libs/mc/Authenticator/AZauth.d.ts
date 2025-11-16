/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
interface AZauthUser {
    access_token?: string;
    client_token?: string;
    uuid?: string;
    name?: string;
    user_properties?: string;
    user_info?: {
        id?: string;
        banned?: boolean;
        money?: number;
        role?: string;
        verified?: boolean;
    };
    meta?: {
        online: boolean;
        type: string;
    };
    profile?: {
        skins: Array<{
            url: string;
            base64?: string;
        }>;
    };
    error?: boolean;
    reason?: string;
    message?: string;
    A2F?: boolean;
}
export default class AZauth {
    private url;
    private skinAPI;
    /**
     * The constructor prepares the authentication and skin URLs from the base URL.
     * @param url The base URL of the AZauth server
     */
    constructor(url: string);
    /**
     * Authenticates a user using their username/email and password.
     * Optionally, a 2FA code can be provided.
     *
     * @param username The email or username for authentication
     * @param password The password
     * @param A2F Optional 2FA code
     * @returns A Promise that resolves to an AZauthUser object
     */
    login(username: string, password: string, A2F?: string | null): Promise<AZauthUser>;
    /**
     * Verifies an existing session (e.g., for refreshing tokens).
     * @param user An AZauthUser object containing at least the access token
     * @returns A Promise that resolves to an updated AZauthUser object or an error object
     */
    verify(user: AZauthUser): Promise<AZauthUser>;
    /**
     * Logs out a user from the AZauth service (invalidates the token).
     * @param user The AZauthUser object with a valid access token
     * @returns A Promise that resolves to true if logout is successful, otherwise false
     */
    signout(user: AZauthUser): Promise<boolean>;
    /**
     * Retrieves the skin of a user by their ID (UUID).
     * If the skin exists, returns both the direct URL and a base64-encoded PNG.
     * If the skin doesn't exist, only the URL is returned.
     *
     * @param uuid The UUID or ID of the user
     * @returns A Promise resolving to an object with the skin URL (and optional base64 data)
     */
    private skin;
}
export {};
