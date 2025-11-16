"use strict";

const fs = require("fs");
const { Microsoft, Mojang } = require("./assets/js/libs/mc/Index");
const { ipcRenderer } = require("electron");
const { getValue, setValue } = require('./assets/js/utils/storage');
import { Alert } from "./utils/alert.js";

import { createPerformanceTimer } from "./utils/launcherLogger.js";

require('./assets/js/libs/errorReporter');

import {
  config,
  logger,
  changePanel,
  database,
  addAccount,
  accountSelect,
} from "./utils.js";

import { LoadAPI } from "./utils/loadAPI.js";

class Launcher {
  async init() {
    this.initTheme();
    const loadingText = document.getElementById("loading-text");
    loadingText.innerHTML = "Cargando Panel de Inicio";
    this.initLog();
    console.log("🔄 Iniciando Launcher...");

    console.time("LangLauncher");
    const { Lang } = require("./assets/js/utils/lang.js");
    const langInstance = new Lang();

    const langTimer = createPerformanceTimer("Language Loading");
    const lang = await langInstance.GetLang().then((lang) => {
      langTimer.end();
      return lang;
    }).catch((error) => {
      console.error("Failed to load language", { error: error.message });
      return null;
    });

    const apiTimer = createPerformanceTimer("API Config Loading");
    await new LoadAPI().GetConfig().then((config) => {
      apiTimer.end();
      console.info("API Config loaded successfully");
      return config;
    }).catch((error) => {
      console.error("Failed to load API config", { error: error.message });
    });

    console.info("Starting Launcher initialization");

    if (process.platform == "win32") this.initFrame();

    const { config } = await import("./utils.js");

    const configTimer = createPerformanceTimer("Config Initialization");
    this.config = await new LoadAPI().GetConfig()
    configTimer.end();

    const newsTimer = createPerformanceTimer("News Loading");
    this.news = await config.GetNews();
    newsTimer.end();

    const dbTimer = createPerformanceTimer("Database Loading");
    const { database } = await import("./utils.js");

    dbTimer.end();

    const dbInitTimer = createPerformanceTimer("Database Initialization");
    this.database = await new database().init();
    dbInitTimer.end();

    const panelsTimer = createPerformanceTimer("Panels Loading");
    const panelNames = [
      "login",
      "music",
      "home",
      "settings",
      "mods",
      "news",
      "friends",
      "chat",
      "servers",
      "mybattly",
    ];

    const panels = await Promise.all(panelNames.map(async (name, index) => {
      const panelTimer = createPerformanceTimer(`Panel ${name}`);

      const loadingText = document.getElementById("loading-text");
      loadingText.innerHTML = `Cargando ${name}`;

      try {
        const panel = await import(`./panels/${name}.js`);
        panelTimer.end({ panelName: name, index });
        console.debug(`Panel ${name} loaded successfully`, { index });
        return panel;
      } catch (error) {
        console.error(`Failed to load panel ${name}`, {
          error: error.message,
          panelName: name,
          index
        });
        throw error;
      }
    }));
    panelsTimer.end({ totalPanels: panelNames.length });

    console.info("Starting panels initialization");

    const createPanelsTimer = createPerformanceTimer("Panels Creation");
    await this.createPanels(...panels.map((p, index) => ({ panel: p.default, index })));
    createPanelsTimer.end();

    const accountsTimer = createPerformanceTimer("Accounts Loading");
    await this.getAccounts();
    console.timeEnd("🕐 getAccountsLauncher");

    console.time("🕐 DisableIframeLogsLauncher")
    await this.disableIframeLogs();
    console.timeEnd("🕐 DisableIframeLogsLauncher");
  }

  async initTheme() {
    let backgroundLoadingScreenColor = await getValue("background-loading-screen-color");
    if (backgroundLoadingScreenColor) {
      document.querySelectorAll(".diamond").forEach(rect => rect.style.backgroundColor = backgroundLoadingScreenColor);
    }
  }

  initLog() {
    document.querySelector(".preload-content").style.display = "block";
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey && e.shiftKey && e.keyCode == 73) || e.keyCode == 123) {
        ipcRenderer.send("main-window-dev-tools");

        console.adv([
          "%c¡ESPERA!",
          "color: #3e8ed0; font-size: 70px; font-weight: bold; font-family: 'Poppins'; text-shadow: 0 0 5px #000;",
        ]);
        console.adv([
          "%c¡No hagas nada aquí si no sabes lo que estás haciendo!",
          "color: #3e8ed0; font-size: 18px; font-weight: bold; font-family: 'Poppins';",
        ]);
        console.adv([
          "%cTampoco pegues nada externo aquí, ¡hay un 101% de posibilidades de que sea un virus!",
          "color: red; font-size: 15px; font-weight: bold; font-family: 'Poppins';",
        ]);

        setTimeout(() => {
          console.adv([
            "%c¡ESPERA!",
            "color: #3e8ed0; font-size: 70px; font-weight: bold; font-family: 'Poppins'; text-shadow: 0 0 5px #000;",
          ]);
          console.adv([
            "%c¡No hagas nada aquí si no sabes lo que estás haciendo!",
            "color: #3e8ed0; font-size: 18px; font-weight: bold; font-family: 'Poppins';",
          ]);
          console.adv([
            "%cTampoco pegues nada externo aquí, ¡hay un 101% de posibilidades de que sea un virus!",
            "color: red; font-size: 15px; font-weight: bold; font-family: 'Poppins';",
          ]);
        }, 1000);

        setTimeout(() => {
          console.adv([
            "%c¡ESPERA!",
            "color: #3e8ed0; font-size: 70px; font-weight: bold; font-family: 'Poppins'; text-shadow: 0 0 5px #000;",
          ]);
          console.adv([
            "%c¡No hagas nada aquí si no sabes lo que estás haciendo!",
            "color: #3e8ed0; font-size: 18px; font-weight: bold; font-family: 'Poppins';",
          ]);
          console.adv([
            "%cTampoco pegues nada externo aquí, ¡hay un 101% de posibilidades de que sea un virus!",
            "color: red; font-size: 15px; font-weight: bold; font-family: 'Poppins';",
          ]);
        }, 1500);
      }
    });
    new logger("Launcher", "#3e8ed0");
  }

  initFrame() {
    const loadingText = document.getElementById("loading-text");
    loadingText.innerHTML = "Cargando paneles";
    document.querySelector(".preload-content").style.display = "block";
    console.log("🔄 Iniciando Frame...");
    document.querySelector(".titlebar").classList.toggle("hide");
    document.querySelector(".dragbar").classList.toggle("hide");

    document.querySelector("#minimize").addEventListener("click", () => {
      ipcRenderer.send("main-window-minimize");
    });

    let maximized = false;
    let maximize = document.querySelector("#maximize");
    maximize.addEventListener("click", () => {
      if (maximized) ipcRenderer.send("main-window-maximize");
      else ipcRenderer.send("main-window-maximize");
      maximized = !maximized;
      maximize.classList.toggle("icon-maximize");
      maximize.classList.toggle("icon-restore-down");
    });

    document.querySelector("#close").addEventListener("click", () => {
      ipcRenderer.send("main-window-close");
    });
  }

  async createPanels(...panels) {
    document.querySelector(".preload-content").style.display = "";
    let panelsElem = document.querySelector(".panels");

    console.time("🕐 Load Panels");

    const panelPromises = panels.map(async ({ panel }) => {
      console.log(`🔄 Iniciando panel de ${panel.name}...`);

      let div = document.createElement("div");
      div.classList.add("panel", panel.id);

      const content = await fs.promises.readFile(`${__dirname}/panels/${panel.id}.html`, "utf8");

      div.innerHTML = content;
      panelsElem.appendChild(div);

      new panel().init(this.config, this.news);
    });

    await Promise.all(panelPromises);

    console.timeEnd("🕐 Load Panels");
  }

  async getAccounts() {
    const loadingText = document.getElementById("loading-text");
    const preload = document.querySelector(".preload-content");
    const showPreload = (msg) => { loadingText.textContent = msg; preload.style.display = "block"; };
    const hidePreload = () => { preload.style.display = "none"; };

    showPreload("Cargando cuentas…");

    const accounts = await this.database.getAccounts();
    const selectedAccount = await this.database.getSelectedAccount();

    if (!accounts?.length) {
      changePanel("login");
      hidePreload();
      return;
    }

    console.log(`🔄 Iniciando ${accounts.length} cuenta(s)…`);

    const processAccount = async (acc) => {
      if (!acc?.meta) return;
      try {
        if (acc.type === "microsoft") {
          console.log(`🔄 Autenticando Microsoft (Xbox) – ${acc.name}`);
          showPreload("Autenticando cuenta de Microsoft…");

          const refresh = await new Microsoft(this.config.client_id).refresh(acc);
          if (refresh?.error) throw new Error(refresh.errorMessage);

          const updatedAccount = {
            type: "microsoft",
            access_token: refresh.access_token,
            client_token: refresh.client_token,
            uuid: refresh.uuid,
            name: refresh.name,
            refresh_token: refresh.refresh_token,
            user_properties: refresh.user_properties,
            meta: { type: refresh.meta.type, xuid: refresh.meta.xuid, demo: refresh.meta.demo }
          };
          const updatedProfile = {
            uuid: refresh.uuid,
            skins: refresh.profile?.skins ?? [],
            capes: refresh.profile?.capes ?? []
          };

          await this.database.updateAccount(acc.uuid, updatedAccount);

          addAccount(updatedAccount, false, true);
          if (refresh.uuid === selectedAccount?.uuid) accountSelect(refresh.uuid);
        } else if (acc.type === "battly") {
          console.log(`🔄 Autenticando Battly – ${acc.name}`);
          try {
            const res = await fetch("https://battlylauncher.com/api/launcher/hello", {
              headers: { Authorization: `Bearer ${acc.token}` }
            });
            const data = await res.json();
            if (data.status !== 200) {
              throw new Error(`Battly API devolvió ${data.status}`);
            }

            const updatedAccount = {
              type: "battly",
              uuid: data.data.uuid,
              name: data.data.username,
              token: acc.token,
              access_token: "1234",
              client_token: "1234",
              user_properties: "{}",
              premium: data.data.premium,
              skins: data.data.skins,
              connections: data.data.connections,
              meta: { type: "battly", offline: true }
            };

            await this.database.updateAccount(acc.uuid, updatedAccount);
            showPreload(`Actualizando perfil de ${updatedAccount.name}…`);
            addAccount(updatedAccount, data.data.premium, false);

            if (updatedAccount.uuid === selectedAccount?.uuid) {
              accountSelect(updatedAccount.uuid);
            }
          } catch (err) {
            throw new Error(`Error al autenticar con Battly: ${err.message ?? err}`);
          }
        }
      } catch (err) {
        console.error(`[Cuenta] ${acc.uuid}: ${err.message ?? err}`);
        await this.database.deleteAccount(acc.uuid);
        if (acc.uuid === selectedAccount?.uuid) {
          console.warn(`Cuenta seleccionada eliminada: ${acc.uuid}`);
          await this.database.removeAccount();
          const accounts = await this.database.getAccounts();
          if (accounts.length > 0) {
            const firstUuid = accounts[0].uuid;
            await this.database.selectAccount(firstUuid);

            if (!document.getElementById(firstUuid)) {
              let theresAccount = false;
              setInterval(() => {
                if (theresAccount) return;
                const accountElem = document.getElementById(firstUuid);
                if (accountElem) {
                  accountSelect(firstUuid);
                  theresAccount = true;

                  new Alert().ShowAlert({
                    title: "Cuenta eliminada",
                    text: `La cuenta ${acc.name} ha sido eliminada. Se ha seleccionado la cuenta ${accounts[0].name} automáticamente.`,
                    type: "info",
                  });
                }
              }, 1000);
            }
          } else {
            console.warn("No hay cuentas disponibles, cambiando al panel de login.");
            changePanel("login");
          }
        }
      }
    };

    await Promise.allSettled(accounts.map(processAccount));

    const stillSelected = await this.database.getSelectedAccount();
    if (!stillSelected) {
      const firstUuid = (await this.database.getAccounts())[0]?.uuid;
      if (firstUuid) {
        await this.database.selectAccount(firstUuid);
        accountSelect(firstUuid);
      }
    }

    if ((await this.database.getAccounts()).length === 0) {
      changePanel("login");
      hidePreload();
      return;
    }

    hidePreload();
    changePanel("home");
  }

  async disableIframeLogs() {
    const iframes = Array.from(document.getElementsByTagName('iframe'));
    for (const iframe of iframes) {
      iframe.addEventListener("load", () => {
        try {
          iframe.contentWindow.console.error = () => { };
        } catch (e) {

        }
      });
    }
  }

}

new Launcher().init();

