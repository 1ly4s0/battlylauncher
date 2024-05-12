"use strict";
/**
 * @author TECNO BROS
 
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importDefault(require("crypto"));
class Microsoft {
    constructor(client_id) {
        if (client_id === '' || !client_id)
            client_id = '00000000402b5328';
        this.client_id = client_id;
        if (!!process && !!process.versions && !!process.versions.electron) {
            this.type = 'electron';
        }
        else if (!!process && !!process.versions && !!process.versions.nw) {
            this.type = 'nwjs';
        }
        else {
            this.type = 'terminal';
        }
    }
    async getAuth(type, url) {
        if (!url)
            url = `https://login.live.com/oauth20_authorize.srf?client_id=${this.client_id}&response_type=code&redirect_uri=https://login.live.com/oauth20_desktop.srf&scope=XboxLive.signin%20offline_access&cobrandid=8058f65d-ce06-4c30-9559-473c9275a65d&prompt=select_account`;
        if (!type)
            type = this.type;
        if (type == "electron") {
            let usercode = await (require('./GUI/Electron.js'))(url);
            if (usercode === "cancel")
                return false;
            else
            return await this.url(usercode);
        }
        else if (type == "nwjs") {
            let usercode = await (require('./GUI/NW.js'))(url);
            if (usercode === "cancel")
                return false;
            else
            return await this.url(usercode);
        }
        else if (type == "terminal") {
            let usercode = await (require('./GUI/Terminal.js'))(url);
            if (usercode === "cancel")
                return false;
            else
            return await this.url(usercode);
        }
    }
    async url(code) {
        let oauth2 = await (0, node_fetch_1.default)("https://login.live.com/oauth20_token.srf", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `client_id=${this.client_id}&code=${code}&grant_type=authorization_code&redirect_uri=https://login.live.com/oauth20_desktop.srf`
        }).then(res => res.json()).catch(err => { return { error: err }; });
        ;
        if (oauth2.error)
            return oauth2;
        return await this.getAccount(oauth2);
    }
    async refresh(acc) {
        let timeStamp = Math.floor(Date.now() / 1000);
        let oauth2 = await (0, node_fetch_1.default)("https://login.live.com/oauth20_token.srf", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=refresh_token&client_id=${this.client_id}&refresh_token=${acc.refresh_token}`
        }).then(res => res.json()).catch(err => { return { error: err }; });

        ;
        if (oauth2.error) {
            oauth2.errorType = "oauth2";
            return oauth2;
        }
        ;
        if (timeStamp < (acc?.meta?.access_token_expires_in - 7200)) {
            let profile = await this.getProfile(acc);
            acc.refresh_token = oauth2.refresh_token;
            acc.profile = {
                skins: profile.skins,
                capes: profile.capes
            };
            return acc;
        }
        else {
            return await this.getAccount(oauth2);
        }
    }
    async getAccount(oauth2) {
        let xbl = await (0, node_fetch_1.default)("https://user.auth.xboxlive.com/user/authenticate", {
            method: "post",
            body: JSON.stringify({
                Properties: {
                    AuthMethod: "RPS",
                    SiteName: "user.auth.xboxlive.com",
                    RpsTicket: "d=" + oauth2.access_token
                },
                RelyingParty: "http://auth.xboxlive.com",
                TokenType: "JWT"
            }),
            headers: { "Content-Type": "application/json", Accept: "application/json" },
        }).then(res => res.json()).catch(err => { return { error: err }; });
        ;
        if (xbl.error) {
            xbl.errorType = "xbl";
            return xbl;
        }
        let xsts = await (0, node_fetch_1.default)("https://xsts.auth.xboxlive.com/xsts/authorize", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Properties: {
                    SandboxId: "RETAIL",
                    UserTokens: [xbl.Token]
                },
                RelyingParty: "rp://api.minecraftservices.com/",
                TokenType: "JWT"
            })
        }).then(res => res.json());
        if (xsts.error) {
            xsts.errorType = "xsts";
            return xsts;
        }
        let xboxAccount = await (0, node_fetch_1.default)("https://xsts.auth.xboxlive.com/xsts/authorize", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Properties: {
                    SandboxId: "RETAIL",
                    UserTokens: [xbl.Token]
                },
                RelyingParty: "http://xboxlive.com",
                TokenType: "JWT"
            })
        }).then(res => res.json()).catch(err => { return { error: err }; });
        if (xsts.error) {
            xsts.errorType = "xboxAccount";
            return xsts;
        }
        let mcLogin = await (0, node_fetch_1.default)("https://api.minecraftservices.com/authentication/login_with_xbox", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "identityToken": `XBL3.0 x=${xbl.DisplayClaims.xui[0].uhs};${xsts.Token}` })
        }).then(res => res.json()).catch(err => { return { error: err }; });
        if (mcLogin.error) {
            mcLogin.errorType = "mcLogin";
            return mcLogin;
        }
        let profile = await this.getProfile(mcLogin);
        if (profile.error) {
            profile.errorType = "profile";
            return profile;
        }
        return {
            access_token: mcLogin.access_token,
            client_token: crypto_1.default.randomBytes(16).toString('hex'),
            uuid: profile.id,
            name: profile.name,
            refresh_token: oauth2.refresh_token,
            user_properties: '{}',
            meta: {
                xuid: xboxAccount.DisplayClaims.xui[0].xid,
                type: "Xbox",
                access_token_expires_in: mcLogin.expires_in + Math.floor(Date.now() / 1000),
                demo: profile.error ? true : false
            },
            profile: {
                skins: profile.skins,
                capes: profile.capes
            }
        };
    }
    async getProfile(mcLogin) {
        let profile = await (0, node_fetch_1.default)("https://api.minecraftservices.com/minecraft/profile", {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${mcLogin.access_token}`
            }
        }).then(res => res.json()).catch(err => { return { error: err }; });
            ;
        if (profile.error)
            return profile;
        let skins = profile.skins;
        let capes = profile.capes;
        for (let skin of skins) {
            skin.base64 = `data:image/png;base64,${await getBass64(skin.url)}`;
        }
        for (let cape of capes) {
            cape.base64 = `data:image/png;base64,${await getBass64(cape.url)}`;
        }
        return {
            id: profile.id,
            name: profile.name,
            skins: profile.skins || [],
            capes: profile.capes || []
        };
    }
}
exports.default = Microsoft;
async function getBass64(url) {
    let response = await (0, node_fetch_1.default)(url);
    let buffer = await response.buffer();
    return buffer.toString('base64');
}
