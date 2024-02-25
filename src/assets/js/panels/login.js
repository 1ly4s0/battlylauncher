/**
 * @author TECNO BROS
 
 */

'use strict';

import { database, changePanel, addAccount, accountSelect } from '../utils.js';
const { ipcRenderer } = require('electron');
import { Lang } from "../utils/lang.js";

class Login {
    static id = "login";
    async init(config) {
        this.config = config
        this.database = await new database().init();
        this.lang = await new Lang().GetLang();
        this.getOffline()
        this.getOnline()
        this.OpenWeb()
    }

    async OpenWeb() {
        let register_open_btn = document.getElementById("register_open_btn")
        register_open_btn.addEventListener("click", () => {
            window.open("https://battlylauncher.com/register", "_blank")
        });
    }

    getOnline() {
        console.log(`🔃 Iniciando panel de Microsoft...`)
        this.loginMicrosoft();
        document.querySelector('.cancel-login').addEventListener("click", () => {
            document.querySelector(".cancel-login").style.display = "none";
            changePanel("settings");
        })
    }

    getOffline() {
        console.log(`🔃 Iniciando panel de offline...`)
        this.loginOffline();
        document.querySelector('.cancel-login').addEventListener("click", () => {
            document.querySelector(".cancel-login").style.display = "none";
            changePanel("settings");
        })
    }

    loginMicrosoft() {
        let microsoftBtn = document.getElementById("microsoft-button")
        let mojangBtn = document.querySelector('.mojang')
        let cancelBtn = document.querySelector('.cancel-login')

        microsoftBtn.addEventListener("click", () => {
            document.querySelector(".preload-content").style.display = "";
            document.getElementById("loading-text").innerHTML = this.lang.a_microsoft_panel_opened;
            microsoftBtn.disabled = true;
            mojangBtn.disabled = true;
            cancelBtn.disabled = true;
            ipcRenderer.invoke('Microsoft-window', this.config.client_id).then(account_connect => {
                document.querySelector(".preload-content").style.display = "";
                document.getElementById("loading-text").innerHTML = this.lang.logging_in;
                
                if (!account_connect) {
                    document.getElementById("loading-text").innerHTML = this.lang.error_logging_in;
                    setTimeout(() => {
                        document.querySelector(".preload-content").style.display = "none";
                        changePanel("settings");
                    }, 3000);
                    console.log("❌ Error al iniciar sesión con Microsoft");
                    microsoftBtn.disabled = false;
                    mojangBtn.disabled = false;
                    cancelBtn.disabled = false;
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
                }

                let profile = {
                    uuid: account_connect.uuid,
                    skins: account_connect.profile.skins || [],
                    capes: account_connect.profile.capes || []
                }

                this.database.add(account, 'accounts')
                this.database.add(profile, 'profile')
                this.database.update({ uuid: "1234", selected: account.uuid }, 'accounts-selected');

                addAccount(account)
                accountSelect(account.uuid)
                let news_shown = localStorage.getItem("news_shown_v1.7");
                if (!news_shown || news_shown == "false" || news_shown == null || news_shown == undefined) {
                    document.querySelector(".preload-content").style.display = "none";
                    changePanel("news");
                } else {
                    document.querySelector(".preload-content").style.display = "none";
                    changePanel("home")
                }

                microsoftBtn.disabled = false;
                mojangBtn.disabled = false;
                cancelBtn.disabled = false;
                cancelBtn.style.display = "none";
            }).catch(err => {
                console.log(err)
                microsoftBtn.disabled = false;
                mojangBtn.disabled = false;
                cancelBtn.disabled = false;

                document.getElementById("loading-text").innerHTML = this.lang.error_logging_in;
                setTimeout(() => {
                    document.querySelector(".preload-content").style.display = "none";
                    changePanel("settings");
                }, 3000);

            });
        })
    }

    

    async loginOffline() {
        let mailInput = document.getElementById("username_text")
        let passwordInput = document.getElementById("password_text")
        let cancelMojangBtn = document.getElementById("cancelar-btn-login")
        let infoLoginPanel = document.getElementById("info-login-panel")
        let infoLogin = document.getElementById("info-login")
        let loginBtn = document.getElementById("login-btn")

        cancelMojangBtn.addEventListener("click", () => {
            mailInput.value = "";
            passwordInput.value = "";
            infoLogin.innerHTML = "&nbsp;";
            infoLoginPanel.classList.remove("is-active");
            changePanel("settings");
        })


        loginBtn.addEventListener("click", async () => {
            cancelMojangBtn.disabled = false;
            loginBtn.disabled = true;
            mailInput.disabled = true;
            passwordInput.disabled = true;
            infoLoginPanel.classList.add("is-active");
            infoLogin.innerHTML = this.lang.logging_in;


            if (mailInput.value == "") {
                infoLogin.innerHTML = this.lang.set_your_username;
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
                infoLogin.innerHTML = this.lang.threecharacters_username;
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
                infoLogin.innerHTML = this.lang.set_your_password;
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
                infoLogin.innerHTML = this.lang.threecharacters_password;
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

            let accounts;
            var request = indexedDB.open("database", 1);

            request.onerror = function (event) {
                console.log("❌ Error al abrir la base de datos");
            };

            request.onsuccess = function (event) {
                // Obtener la base de datos
                var db = event.target.result;

                // Iniciar una transacción
                var transaction = db.transaction("accounts", "readonly");

                // Obtener el almacén de objetos desde la transacción
                var objectStore = transaction.objectStore("accounts");

                // Hacer una solicitud para obtener todos los registros
                var getAllRequest = objectStore.getAll();

                // Manejar el evento de éxito de la solicitud
                getAllRequest.onsuccess = function (event) {
                    // Obtener los datos del resultado de la solicitud
                    accounts = event.target.result;
                    console.log("✅ Base de datos abierta correctamente");
                    console.log(accounts);
                };

                // Manejar el evento de éxito de la transacción
                transaction.oncomplete = function (event) {
                    // Cerrar la base de datos después de completar la transacción
                    db.close();
                };
            };

            //comprobar si el usuario existe
            try {
                let account = accounts.find(account => account.value.uuid == uuid_);
                if (account) {
                    infoLogin.innerHTML = this.lang.account_already_exists;
                    setTimeout(() => {
                        infoLoginPanel.classList.remove("is-active");
                    }, 3000);
                    cancelMojangBtn.disabled = false;
                    loginBtn.disabled = false;
                    mailInput.disabled = false;
                    passwordInput.disabled = false;
                    return
                }
            } catch (error) {
                console.log("No hay cuentas")
                console.log(error)
            }
            

            const axios = require("axios");

            let data = await axios.post("https://battlylauncher.com/api/battly/launcher/login", {
                Headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "username": mailInput.value ? mailInput.value : "1",
                    "password": passwordInput.value ? passwordInput.value : "1"
                })
            }).catch(err => {
                console.log(err)
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                mailInput.value = "";
                passwordInput.value = "";
                infoLogin.innerHTML = this.lang.username_or_password_incorrect;
                setTimeout(() => {
                    infoLoginPanel.classList.remove("is-active");
                }, 3000);
                return
            })

            if(data.data.status == "error") {
                infoLogin.innerHTML = data.data.error
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                infoLogin.innerHTML = data.data.message;
                setTimeout(() => {
                    infoLoginPanel.classList.remove("is-active");
                }, 3000);
                return
            }

            if (data.data.status == "success") {
            

                

                account = {
                    type: "battly",
                    access_token: "1234",
                    client_token: "1234",
                    uuid: uuid_,
                    name: mailInput.value,
                    password: passwordInput.value,
                    user_properties: '{}',
                    meta: {
                        type: "cracked",
                        offline: true
                    }
                }

                await this.database.add(account, 'accounts')
                await this.database.update({ uuid: "1234", selected: account.uuid }, 'accounts-selected');

                infoLoginPanel.classList.remove("is-active");

                await addAccount(account)
                await accountSelect(account.uuid)
                let news_shown = localStorage.getItem("news_shown_v1.7");
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

                let welcome = document.querySelector('.news-list');
                let blockWelcome = document.createElement('div');
                blockWelcome.classList.add('news-block', 'opacity-1');
                blockWelcome.innerHTML = `
                    <div class="news-header">
                        <div class="header-text">
                            <div class="title_">${this.lang.welcome_again_to_battly}, ${account.name}</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>${this.lang.we_hope_you_enjoy}</p>
                        </div>
                    </div>`;
                welcome.prepend(blockWelcome);
            }
        })
    }
}

export default Login;