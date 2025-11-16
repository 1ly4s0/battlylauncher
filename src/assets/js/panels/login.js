'use strict';

import { database, changePanel, addAccount, accountSelect } from '../utils.js';
import { Alert } from '../utils/alert.js';
const { ipcRenderer, shell } = require('electron');
const Swal = require("./assets/js/libs/sweetalert/sweetalert2.all.min.js");
const { getValue, setValue } = require('./assets/js/utils/storage');

const { Lang } = require("./assets/js/utils/lang.js");
let lang;
new Lang().GetLang().then(lang_ => {
    lang = lang_;
}).catch(error => {
    console.error("Error:", error);
});

import { AskModal } from '../utils/askModal.js';
const modal = new AskModal();

class Login {
    static id = "login";
    async init(config) {
        this.config = config
        this.database = await new database().init();
        lang = await new Lang().GetLang();
        this.getOffline()
        this.getOnline()
    }

    getOnline() {
        console.log(`🔃 Iniciando panel de Microsoft...`)
        this.loginMicrosoft();

    }

    getOffline() {
        console.log(`🔃 Iniciando panel de offline...`)
        this.loginOffline();

    }

    loginMicrosoft() {
        let microsoftBtn = document.getElementById("microsoft-button")

        microsoftBtn.addEventListener("click", async () => {
            try {
                await modal.ask({
                    title: lang.login_microsoft_adv_title,
                    text: lang.login_microsoft_adv_text,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: lang.login_microsoft_accept,
                    cancelButtonText: lang.login_microsoft_cancel,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    preConfirm: () => true
                });

                document.querySelector(".preload-content").style.display = "";
                document.getElementById("loading-text").innerHTML = lang.a_microsoft_panel_opened;
                microsoftBtn.disabled = true;

                try {
                    const account_connect = await ipcRenderer.invoke('Microsoft-window', this.config.client_id);
                    console.log(account_connect);

                    document.querySelector(".preload-content").style.display = "";
                    document.getElementById("loading-text").innerHTML = lang.logging_in;

                    if (!account_connect) {
                        document.getElementById("loading-text").innerHTML = lang.error_logging_in;
                        setTimeout(() => {
                            document.querySelector(".preload-content").style.display = "none";
                            changePanel("settings");
                        }, 3000);
                        console.log("❌ Error al iniciar sesión con Microsoft");
                        microsoftBtn.disabled = false;
                        return;
                    }

                    let account = {
                        type: "microsoft",
                        access_token: account_connect.access_token,
                        client_token: account_connect.client_token,
                        uuid: account_connect.uuid,
                        name: account_connect.name,
                        refresh_token: account_connect.refresh_token,
                        user_properties: account_connect.user_properties,
                        meta: account_connect.meta
                    };

                    this.database.addAccount(account);
                    this.database.selectAccount(account.uuid);

                    addAccount(account, false, true);
                    accountSelect(account.uuid, true);

                    let news_shown = await getValue("news_shown_v2.0");
                    document.querySelector(".preload-content").style.display = "none";

                    if (!news_shown || news_shown == "false") {
                        changePanel("news");
                    } else {
                        changePanel("home");
                    }

                } catch (err) {
                    console.log(err);
                    microsoftBtn.disabled = false;
                    document.getElementById("loading-text").innerHTML = lang.error_logging_in;
                    setTimeout(() => {
                        document.querySelector(".preload-content").style.display = "none";
                        changePanel("settings");
                    }, 3000);
                }

                microsoftBtn.disabled = false;

            } catch (err) {

                console.log("❌ Cancelado por el usuario");
                console.error(err);
            }
        });

    }

    async loginOffline() {
        let mailInput = document.getElementById("username_text")
        let passwordInput = document.getElementById("password_text")
        let cancelMojangBtn = document.getElementById("cancelar-btn-login")
        let infoLoginPanel = document.getElementById("info-login-panel")
        let infoLogin = document.getElementById("info-login")
        let loginBtn = document.getElementById("login-btn")

        document.getElementById("google-button").addEventListener("click", () => {
            new Alert().ShowAlert({
                title: window.stringLoader.getString("login.loginWithGoogle"),
                message: window.stringLoader.getString("login.loginWithGoogleMsg"),
                type: "info"
            })

            const os = require('os').platform();

            if (os == "win32") shell.openExternal("https://battlylauncher.com/api/battly/google/login")
            else window.open("https://battlylauncher.com/api/battly/google/login", "_blank")

            document.getElementById("code-login-panel").classList.add("is-active");

        });

        document.getElementById("cancel-code-btn").addEventListener("click", () => {
            document.getElementById("code-login-panel").classList.remove("is-active");
        });

        document.getElementById("code-btn").addEventListener("click", () => {
            const code = document.getElementById("code-text").value;

            if (code == "") {
                new Alert().ShowAlert({
                    title: window.stringLoader.getString("login.authCode"),
                    message: window.stringLoader.getString("login.authCodeNotSet"),
                    type: "error"
                })
            } else {

                infoLoginPanel.classList.add("is-active");
                infoLogin.innerHTML = lang.checking_auth_code;

                fetch("https://battlylauncher.com/api/battly/google/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        code: code
                    })
                }).then(response => response.json()).then(async data => {
                    if (data.status == "error") {
                        new Alert().ShowAlert({
                            title: window.stringLoader.getString("login.errorTitle"),
                            message: data.message,
                            type: "error"
                        })

                        infoLogin.innerHTML = data.message;

                        setTimeout(() => {
                            infoLoginPanel.classList.remove("is-active");
                        }, 3000);
                    } else {

                        infoLogin.innerHTML = lang.logging_in;

                        let account = {
                            type: "battly",
                            access_token: "1234",
                            client_token: "1234",
                            uuid: data.user.uuid,
                            name: data.user.username,
                            token: data.user.token,
                            user_properties: '{}',
                            meta: {
                                type: "battly",
                                offline: true
                            }
                        }

                        infoLogin.innerHTML = lang.checking_if_you_are_premium;

                        let premiums = [];
                        try {
                            premiums = await fetch("https://api.battlylauncher.com/api/usuarios/obtenerUsuariosPremium").then(response => response.json()).then(data => data).catch(err => { });
                        } catch (error) {
                            premiums = [];
                        }

                        await this.database.addAccount(account)
                        await this.database?.selectAccount(account.uuid);

                        let isPremium;
                        if (!premiums) isPremium = false;
                        else isPremium = premiums.includes(account.name);
                        addAccount(account, isPremium, false);

                        document.getElementById("code-login-panel").classList.remove("is-active");
                        document.getElementById("code-text").value = "";

                        accountSelect(account.uuid, true);

                        infoLoginPanel.classList.remove("is-active");

                        let news_shown = await getValue("news_shown_v2.0");
                        if (!news_shown || news_shown == "false" || news_shown == null || news_shown == undefined) {
                            document.querySelector(".preload-content").style.display = "none";
                            changePanel("news");
                        } else {
                            document.querySelector(".preload-content").style.display = "none";
                            changePanel("home")
                        }

                        cancelMojangBtn.disabled = false;
                        cancelMojangBtn.click();
                        mailInput.value = "";
                        passwordInput.value = "";
                        loginBtn.disabled = false;
                        mailInput.disabled = false;
                        passwordInput.disabled = false;
                        loginBtn.style.display = "block";
                        infoLogin.innerHTML = "&nbsp;";

                        let welcome = document.getElementById('battly-news-div');
                        let blockWelcome = document.createElement('div');
                        blockWelcome.classList.add('news-block', 'opacity-1');
                        blockWelcome.innerHTML = `
                        <div class="news-header">
                            <div class="header-text">
                                <div class="title_">${lang.welcome_again_to_battly}, ${account.name}</div>
                            </div>
                        </div>
                        <div class="news-content">
                            <div class="bbWrapper">
                                <p>${lang.we_hope_you_enjoy}</p>
                            </div>
                        </div>`;
                        welcome.prepend(blockWelcome);
                    }
                }).catch(err => {
                    new Alert().ShowAlert({
                        title: "Error",
                        message: "Ocurrió un error al iniciar sesión.",
                        type: "error"
                    })
                })
            }
        });

        ipcRenderer.on("battly-login", async (event, data) => {
            let token = data.split("/login?token=")[1];
            console.log(token)

            fetch("https://battlylauncher.com/api/battly/launcher/loginWithToken", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }).then(response => response.json()).then(async data => {
                if (data.status == "error") {
                    new Alert().ShowAlert({
                        title: "Error",
                        message: data.message,
                        type: "error"
                    })
                } else {
                    let account = {
                        type: "battly",
                        access_token: "1234",
                        client_token: "1234",
                        uuid: data.data.uuid,
                        name: data.data.username,
                        token: data.data.token,
                        user_properties: '{}',
                        meta: {
                            type: "battly",
                            offline: true
                        }
                    }

                    infoLogin.innerHTML = lang.checking_if_you_are_premium;

                    let premiums = [];
                    try {
                        premiums = await fetch("https://api.battlylauncher.com/api/usuarios/obtenerUsuariosPremium").then(response => response.json()).then(data => data).catch(err => { });
                    } catch (error) {
                        premiums = [];
                    }

                    await this.database.addAccount(account)
                    await this.database?.selectAccount(account.uuid);

                    let isPremium;
                    if (!premiums) isPremium = false;
                    else isPremium = premiums.includes(account.name);
                    addAccount(account, isPremium, false);

                    accountSelect(account.uuid, true)

                    infoLoginPanel.classList.remove("is-active");

                    let news_shown = await getValue("news_shown_v2.0");
                    if (!news_shown || news_shown == "false" || news_shown == null || news_shown == undefined) {
                        document.querySelector(".preload-content").style.display = "none";
                        changePanel("news");
                    } else {
                        document.querySelector(".preload-content").style.display = "none";
                        changePanel("home")
                    }

                    cancelMojangBtn.disabled = false;
                    cancelMojangBtn.click();
                    mailInput.value = "";
                    passwordInput.value = "";
                    loginBtn.disabled = false;
                    mailInput.disabled = false;
                    passwordInput.disabled = false;
                    loginBtn.style.display = "block";
                    infoLogin.innerHTML = "&nbsp;";

                    let welcome = document.getElementById('battly-news-div');
                    let blockWelcome = document.createElement('div');
                    blockWelcome.classList.add('news-block', 'opacity-1');
                    blockWelcome.innerHTML = `
                    <div class="news-header">
                        <div class="header-text">
                            <div class="title_">${lang.welcome_again_to_battly}, ${account.name}</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>${lang.we_hope_you_enjoy}</p>
                        </div>
                    </div>`;
                    welcome.prepend(blockWelcome);
                }
            }).catch(err => {
                new Alert().ShowAlert({
                    title: "Error",
                    message: "Ocurrió un error al iniciar sesión.",
                    type: "error"
                })
            })
        });

        cancelMojangBtn.addEventListener("click", () => {
            if (this.database.getAccounts().length == 0) {
                new Alert().ShowAlert({
                    title: lang.no_accounts,
                    message: lang.no_accounts_message,
                    type: "error"
                })
            } else {
                changePanel("settings");
            }
        })

        loginBtn.addEventListener("click", async () => {
            cancelMojangBtn.disabled = false;
            loginBtn.disabled = true;
            mailInput.disabled = true;
            passwordInput.disabled = true;
            infoLoginPanel.classList.add("is-active");
            infoLogin.innerHTML = lang.logging_in;

            if (mailInput.value == "") {
                infoLogin.innerHTML = lang.set_your_username;
                setTimeout(() => {
                    infoLoginPanel.classList.remove("is-active");
                }, 3000);
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                return
            }

            if (mailInput.value.length < 3) {
                infoLogin.innerHTML = lang.threecharacters_username;
                setTimeout(() => {
                    infoLoginPanel.classList.remove("is-active");
                }, 3000);
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                return
            };

            if (passwordInput.value == "") {
                infoLogin.innerHTML = lang.set_your_password;
                setTimeout(() => {
                    infoLoginPanel.classList.remove("is-active");
                }, 3000);
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                return
            }

            if (passwordInput.value.length < 3) {
                infoLogin.innerHTML = lang.threecharacters_password;
                setTimeout(() => {
                    infoLoginPanel.classList.remove("is-active");
                }, 3000);
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                return
            };

            const crypto = require('crypto');
            async function uuid(username) {
                let md5Bytes = crypto.createHash('md5').update(username).digest();
                md5Bytes[6] &= 0x0f;
                md5Bytes[6] |= 0x30;
                md5Bytes[8] &= 0x3f;
                md5Bytes[8] |= 0x80;
                return md5Bytes.toString('hex');
            }

            let account;
            let uuid_;

            await uuid(mailInput.value).then(uuid => {
                uuid_ = uuid;
            });

            let accounts = await this.database.getAccounts();

            if (accounts.length != 0) {
                let account = accounts.find(account => account.uuid == uuid_);
                if (account) {
                    infoLogin.innerHTML = lang.account_already_exists;

                    setTimeout(() => {
                        infoLoginPanel.classList.remove("is-active");
                    }, 3000);
                    cancelMojangBtn.disabled = false;
                    loginBtn.disabled = false;
                    mailInput.disabled = false;
                    passwordInput.disabled = false;
                    return;
                }
            }

            fetch("https://battlylauncher.com/api/battly/launcher/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: mailInput.value,
                    password: passwordInput.value
                })
            }).then(response => response.json()).then(async data => {

                if (data.status == "error") {
                    infoLogin.innerHTML = data.error
                    cancelMojangBtn.disabled = false;
                    loginBtn.disabled = false;
                    mailInput.disabled = false;
                    passwordInput.disabled = false;
                    infoLogin.innerHTML = data.message;
                    setTimeout(() => {
                        infoLoginPanel.classList.remove("is-active");
                    }, 3000);
                    return
                }

                if (data.status == "success") {
                    account = {
                        type: "battly",
                        access_token: "1234",
                        client_token: "1234",
                        uuid: uuid_,
                        name: mailInput.value,
                        token: data.data.token,
                        user_properties: '{}',
                        meta: {
                            type: "battly",
                            offline: true
                        }
                    }

                    infoLogin.innerHTML = lang.checking_premium;

                    let premiums = [];
                    try {
                        premiums = await fetch("https://api.battlylauncher.com/api/usuarios/obtenerUsuariosPremium").then(response => response.json()).then(data => data).catch(err => { });
                    } catch (error) {
                        premiums = [];
                    }

                    await this.database.addAccount(account)
                    await this.database?.selectAccount(account.uuid);

                    let isPremium;
                    if (!premiums) isPremium = false;
                    else isPremium = premiums.includes(account.name);
                    addAccount(account, isPremium, false);

                    if (isPremium) {
                        document.getElementById("header-text-to-add").innerHTML = window.stringLoader.getString("login.premiumEdition");
                        document.getElementById("header-frame").style.background = `radial-gradient(ellipse farthest-corner at right bottom, #FEDB37 0%, #FDB931 8%, #9f7928 30%, #8A6E2F 40%, transparent 80%),
                        radial - gradient(ellipse farthest - corner at left top, #FFFFFF 0 %, #FFFFAC 8 %, #D1B464 25 %, #5d4a1f 62.5 %, #5d4a1f 100 %);`;
                    } else {
                        document.getElementById("header-frame").style.background = `#0f1623`;
                    }

                    infoLoginPanel.classList.remove("is-active");

                    await accountSelect(account.uuid, true);
                    let news_shown = await getValue("news_shown_v2.0");
                    if (!news_shown || news_shown == "false" || news_shown == null || news_shown == undefined) {
                        document.querySelector(".preload-content").style.display = "none";
                        changePanel("news");
                    } else {
                        document.querySelector(".preload-content").style.display = "none";
                        changePanel("home")
                    }

                    cancelMojangBtn.disabled = false;
                    cancelMojangBtn.click();
                    mailInput.value = "";
                    passwordInput.value = "";
                    loginBtn.disabled = false;
                    mailInput.disabled = false;
                    passwordInput.disabled = false;
                    loginBtn.style.display = "block";
                    infoLogin.innerHTML = "&nbsp;";

                    let welcome = document.getElementById('battly-news-div');
                    let blockWelcome = document.createElement('div');
                    blockWelcome.classList.add('news-block', 'opacity-1');
                    blockWelcome.innerHTML = `
                    <div class="news-header">
                        <div class="header-text">
                            <div class="title_">${lang.welcome_again_to_battly}, ${account.name}</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>${lang.we_hope_you_enjoy}</p>
                        </div>
                    </div>`;
                    welcome.prepend(blockWelcome);
                }
            }).catch(err => {
                console.log(err)
                infoLogin.innerHTML = lang.error_logging_in;
                setTimeout(() => {
                    infoLoginPanel.classList.remove("is-active");
                }, 3000);
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
            });
        })
    }
}

export default Login;