/**
 * @author TECNO BROS
 
 */
"use strict";

const { ipcRenderer } = require("electron");
import { database, changePanel, accountSelect, Slider } from "../utils.js";
const dataDirectory =
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? process.env.HOME + "/Library/Application Support"
    : process.env.HOME);
const Swal = require("./assets/js/libs/sweetalert/sweetalert2.all.min.js");
const { getValue, setValue } = require('./assets/js/utils/storage');
const tinycolor = require("tinycolor2");
const os = require("os");
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 5000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

import { Alert } from "../utils/alert.js";
import { AskModal } from '../utils/askModal.js';
const ModalAsk = new AskModal();

const { Lang } = require("./assets/js/utils/lang.js");
const { StringLoader } = require("./assets/js/utils/stringLoader.js");
let lang;
new Lang().GetLang().then(lang_ => {
  lang = lang_;
}).catch(error => {
  console.error("Error:", error);
});
class Settings {
  static id = "settings";
  async init(config) {
    this.config = config;
    this.database = await new database().init();

    await window.ensureStringLoader();
    await window.stringLoader.applyStrings();

    this.newSettings();
    this.initSettingsDefault();
    this.initTab();
    this.initAccount();
    this.initRam();
    this.initLauncherSettings();
    this.newTheme();
    this.initTheme();
    this.Java();

    this.initClickSoundSetting();

    // Apply strings again after all DOM is ready
    await window.stringLoader.applyStrings();
  }

  initClickSoundSetting() {

    const radios = document.querySelectorAll('input[name="sound"]');

    getValue('sound-click').then(val => {
      const enabled = val === 'true' || val === true;
      radios[0].checked = !!enabled;
      radios[1].checked = !enabled;
    });

    radios.forEach(radio => {
      radio.addEventListener('change', async () => {
        const enabled = radios[0].checked;
        await setValue('sound-click', enabled ? 'true' : 'false');
      });
    });

    document.addEventListener('click', async (e) => {

      const enabled = (await getValue('sound-click')) === 'true';
      if (!enabled) return;

      const audio = new Audio('./assets/audios/click.mp3');
      audio.volume = 0.5;
      audio.play();
    }, true);
  }

  async initTheme() {
    document
      .getElementById("restablecer-fondo")
      .addEventListener("click", (e) => {
        const body = document.querySelector("body");
        body.style.background =
          "linear-gradient(#00000066, #00000066), black url('./assets/images/background/light.jpg') no-repeat center center fixed";

        const video = document.getElementById("video-background");
        const source = video.querySelector("source");

        source.src = "";
        video.load();

        localStorage.removeItem("background-img");
        localStorage.removeItem("background-video");

        new Alert().ShowAlert({
          title: lang.background_set_successfully,
          icon: "success",
        });
      });

    document
      .getElementById("obtener-socketid")
      .addEventListener("click", (e) => {
        ipcRenderer.send("obtenerSocketID");
      });

    document.getElementById("language-selector").value = await getValue("lang");
    document.getElementById("language-selector-btn").addEventListener("click", async () => {
      let lang_ = document.getElementById("language-selector");

      new Alert().ShowAlert({
        title: lang.changing_language,
        text: lang.changing_language_text,
        icon: "info",
      });

      await setValue("lang", lang_.value);

      setTimeout(() => {
        ipcRenderer.send("restartLauncher");
      }, 4000);
    });

    document
      .getElementById("background-btn")
      .addEventListener("click", async (e) => {
        let account = await this.database?.getSelectedAccount();
        let isPremium = account.premium;

        if (isPremium) {
          document.getElementById("background-btn").style.display =
            "";
          document.getElementById("launchboost-panel").style.display = "block";
        } else {
          document.getElementById("background-btn").style.display =
            "none";
          document.getElementById("launchboost-panel").style.display = "none";
        }
      });

    document
      .getElementById("launcher-btn")
      .addEventListener("click", async (e) => {
        let account = await this.database?.getSelectedAccount();
        let isPremium = account.premium;

        if (isPremium) {
          document.getElementById("launchboost-panel").style.display = "block";
        } else {
          document.getElementById("launchboost-panel").style.display = "none";
        }
      });

    document
      .getElementById("resize-background-select")
      .addEventListener("click", (e) => {
        document.getElementById("background-input-file").click();
      });

    //si no acaba con mp4, return alert

    let modalUserInfo = document.getElementById("modaluserinfo");
    let modalSkin = document.getElementById("skin");

    let btnCerrar = document.getElementById("cerrar-userinfo-btn");
    let btnEliminarCuenta = document.getElementById(
      "eliminarcuenta-userinfo-btn"
    );
    let btnCerrar2 = document.getElementById("cerrar2-userinfo-btn");
    let btnCerrarSkin = document.getElementById("cerrar-skin-btn");

    let btnCerrarPreview = document.getElementById("cerrar-preview-btn");

    document.getElementById("launchboost").addEventListener("click", async () => {

      if (document.getElementById("launchboost").checked) {
        await setValue("launchboost", true);
      } else {
        await setValue("launchboost", false);
      }
    });
  }

  initAccount() {

    document.querySelector("#accounts").addEventListener("click", async (e) => {
      if (e.target.id === "add-account") return;
      if (e.target.id === "add-account-btn") return;

      let div = e.target;
      console.log(div);

      let uuid = div.id;

      if (
        e.composedPath()[0].classList.contains("account") ||
        e.composedPath()[0].classList.contains("account-image") ||
        e.composedPath()[0].classList.contains("account-name")
      ) {
        if (e.target.id === "user-name") {
          uuid = e.target.parentElement.id;
        }
        accountSelect(uuid, true);
        this.database?.selectAccount(uuid);
      }

      if (e.target.classList.contains("fa-fire")) {
        console.log("es premium");
        const modal = document.createElement("div");
        modal.classList.add("modal", "is-active");

        const modalBackground = document.createElement("div");
        modalBackground.classList.add("modal-background");

        const modalCard = document.createElement("div");
        modalCard.classList.add("modal-card");
        modalCard.classList.add("modal-animated");
        modalCard.style.backgroundColor = "#0f1623";
        modalCard.style.height = "90%";

        const modalHeader = document.createElement("header");
        modalHeader.classList.add("modal-card-head");
        modalHeader.style.backgroundColor = "#0f1623";

        const modalTitle = document.createElement("h1");
        modalTitle.classList.add("modal-card-title");
        modalTitle.textContent = await window.getString("settings.congratulations");
        modalTitle.style.color = "#fff";
        modalTitle.style.fontSize = "30px";
        modalTitle.style.fontWeight = "600";

        const closeButton = document.createElement("button");
        closeButton.classList.add("delete");
        closeButton.setAttribute("aria-label", "close");

        closeButton.addEventListener("click", async () => {
          modal.classList.remove("is-active");
          await setValue("WelcomePremiumShown", true);
        });

        await this.createInteractivePremiumTour();
        await setValue("WelcomePremiumShown", true);

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);

        modalBody.appendChild(content);

        modalFooter.appendChild(acceptButton);

        modalCard.appendChild(modalHeader);
        modalCard.appendChild(modalBody);
        modalCard.appendChild(modalFooter);

        modal.appendChild(modalBackground);
        modal.appendChild(modalCard);

        document.body.appendChild(modal);
      }

      if (
        e.target.classList.contains("account-delete") ||
        e.target.classList.contains("fa-arrow-right")
      ) {
        let div_ = e.target.parentElement;
        let uuid_ = div_.id;
        let modalUserInfo = document.getElementById("modaluserinfo");
        let userImage = document.getElementById("user-image");
        let userName = document.getElementById("user-name");
        let userUUID = document.getElementById("user-uuid");
        let btnMostrarSkin = document.getElementById(
          "mostrarskin-userinfo-btn"
        );

        let accounts = await this.database.getAccounts();
        let account = accounts.find((account) =>
          account.uuid === uuid ? uuid : uuid_
        );

        const axios = require("axios");

        try {
          await axios.get(
            `https://api.battlylauncher.com/api/skin/${account.name}.png`
          );
          userImage.style.backgroundImage = `url(https://api.battlylauncher.com/api/skin/${account.name}.png)`;

          btnMostrarSkin.onclick = function () {

            const modalDiv = document.createElement("div");
            modalDiv.classList.add("modal");
            modalDiv.classList.add("is-active");
            modalDiv.id = "skin";

            const modalBackgroundDiv = document.createElement("div");
            modalBackgroundDiv.classList.add("modal-background");

            const modalContentDiv = document.createElement("div");
            modalContentDiv.classList.add("modal-content");
            modalContentDiv.style.height = "60%";

            const styleElement = document.createElement("style");
            styleElement.textContent = `
                            #skin-viewer *{ background-image: url('https://api.battlylauncher.com/api/skin/${account.name}.png'); }
                        `;

            const skinViewerDiv = document.createElement("div");
            skinViewerDiv.id = "skin-viewer";
            skinViewerDiv.classList.add("mc-skin-viewer-11x", "spin");

            const playerDiv = document.createElement("div");
            playerDiv.classList.add("player");

            const bodyParts = [
              "head",
              "body",
              "left-arm",
              "right-arm",
              "left-leg",
              "right-leg",
            ];

            bodyParts.forEach((part) => {
              const partDiv = document.createElement("div");
              partDiv.classList.add(part);

              const innerElements = [
                "top",
                "left",
                "front",
                "right",
                "back",
                "bottom",
                "accessory",
              ];
              innerElements.forEach((innerElement) => {
                const innerDiv = document.createElement("div");
                innerDiv.classList.add(innerElement);
                partDiv.appendChild(innerDiv);
              });

              playerDiv.appendChild(partDiv);
            });

            skinViewerDiv.appendChild(playerDiv);

            const closeButton = document.createElement("button");
            closeButton.classList.add("modal-close", "is-large");
            closeButton.setAttribute("aria-label", "close");
            closeButton.id = "cerrar-skin-btn";

            modalContentDiv.appendChild(styleElement);
            skinViewerDiv.appendChild(playerDiv);
            modalContentDiv.appendChild(skinViewerDiv);
            modalDiv.appendChild(modalBackgroundDiv);
            modalDiv.appendChild(modalContentDiv);
            modalDiv.appendChild(closeButton);

            document.body.appendChild(modalDiv);

            closeButton.onclick = function () {
              modalDiv.remove();
            };
          };
        } catch (error) {
          userImage.style.backgroundImage = `url(https://minotar.net/skin/MHF_Steve.png)`;
          btnMostrarSkin.onclick = function () {

            const modalDiv = document.createElement("div");
            modalDiv.classList.add("modal");
            modalDiv.classList.add("is-active");
            modalDiv.id = "skin";

            const modalBackgroundDiv = document.createElement("div");
            modalBackgroundDiv.classList.add("modal-background");

            const modalContentDiv = document.createElement("div");
            modalContentDiv.classList.add("modal-content");
            modalContentDiv.style.height = "60%";

            const styleElement = document.createElement("style");
            styleElement.textContent = `
                            #skin-viewer *{ background-image: url('https://minotar.net/skin/MHF_Steve.png'); }
                        `;

            const skinViewerDiv = document.createElement("div");
            skinViewerDiv.id = "skin-viewer";
            skinViewerDiv.classList.add(
              "mc-skin-viewer-11x",
              "legacy",
              "legacy-cape",
              "spin"
            );

            const playerDiv = document.createElement("div");
            playerDiv.classList.add("player");

            const bodyParts = [
              "head",
              "body",
              "left-arm",
              "right-arm",
              "left-leg",
              "right-leg",
              "cape",
            ];
            bodyParts.forEach((part) => {
              const partDiv = document.createElement("div");
              partDiv.classList.add(part);

              const innerElements = [
                "top",
                "left",
                "front",
                "right",
                "back",
                "bottom",
                "accessory",
              ];
              innerElements.forEach((innerElement) => {
                const innerDiv = document.createElement("div");
                innerDiv.classList.add(innerElement);
                partDiv.appendChild(innerDiv);
              });

              playerDiv.appendChild(partDiv);
            });

            const closeButton = document.createElement("button");
            closeButton.classList.add("modal-close", "is-large");
            closeButton.setAttribute("aria-label", "close");
            closeButton.id = "cerrar-skin-btn";

            modalContentDiv.appendChild(styleElement);
            skinViewerDiv.appendChild(playerDiv);
            modalContentDiv.appendChild(skinViewerDiv);
            modalDiv.appendChild(modalBackgroundDiv);
            modalDiv.appendChild(modalContentDiv);
            modalDiv.appendChild(closeButton);

            document.body.appendChild(modalDiv);

            closeButton.onclick = function () {
              modalDiv.remove();
            };
          };
        }

        modalUserInfo.value = uuid;
        modalUserInfo.classList.add("is-active");

        let btnDeleteAccount = document.getElementById(
          "eliminarcuenta-userinfo-btn"
        );
        btnDeleteAccount.onclick = async () => {
          let accounts = await this.database.getAccounts();
          let account = accounts.find((account) =>
            account.uuid === uuid ? uuid : uuid_
          );
          this.database.deleteAccount(account.uuid);
          div_.remove();
          modalUserInfo.classList.remove("is-active");

          document.getElementById(uuid ? uuid : uuid_).remove();
          new Alert().ShowAlert({
            title: lang.account_deleted_successfully,
            icon: "success",
          });

          let accounts_ = await this.database.getAccounts();
          if (!accounts_.length) {
            changePanel("login");
          }
        };

        userName.textContent = account.name;
        userUUID.textContent = account.uuid;
      } else if (e.target.id === "account-skin") {
        let modalSkin = document.getElementById("skin");
        let skinImage = document.getElementById("skin-image");
        let skinName = document.getElementById("skin-name");

        modalSkin.classList.add("is-active");
        let account = await this.database.getAccount(uuid);

        skinImage.style.backgroundImage = `url(https://api.battlylauncher.com/api/skin/${account.name}.png)`;
        skinName.textContent = account.name;
      }
    });

    document.getElementById("add-account-btn").addEventListener("click", () => {
      changePanel("login");
    });
  }

  async initRam() {
    const os = require("os");

    const totalMem = Math.trunc((os.totalmem() / 1073741824) * 10) / 10;

    const freeMem = Math.trunc((os.freemem() / 1073741824) * 10) / 10;

    document.getElementById("total-ram").textContent = `${totalMem} GB`;
    document.getElementById("free-ram").textContent = `${freeMem} GB`;

    if (this._ramSliderInited) return;
    this._ramSliderInited = true;

    const sliderDiv = document.querySelector(".memory-slider");
    const MIN_GB = 0.5;
    const STEP = 0.5;
    const MAX_GB = Math.max(MIN_GB, Math.floor(totalMem));

    sliderDiv.setAttribute("min", MIN_GB);
    sliderDiv.setAttribute("max", MAX_GB);
    sliderDiv.setAttribute("step", STEP);

    const ramDB = (await this.database.get("1234", "ram"))?.value;
    const initial = ramDB ? {
      min: parseFloat(ramDB.ramMin),
      max: parseFloat(ramDB.ramMax)
    } : { min: MIN_GB, max: Math.min(1, MAX_GB) };

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    initial.min = clamp(initial.min, MIN_GB, MAX_GB);
    initial.max = clamp(initial.max, initial.min, MAX_GB);

    const slider = new Slider(".memory-slider", initial.min, initial.max);
    this._ramSlider = slider;

    const minSpan = document.querySelector(".slider-touch-left span");
    const maxSpan = document.querySelector(".slider-touch-right span");
    const setBubbles = (a, b) => {
      minSpan?.setAttribute("value", `${a} GB`);
      maxSpan?.setAttribute("value", `${b} GB`);
    };
    setBubbles(initial.min, initial.max);

    slider.on("change", async (min, max) => {
      min = clamp(min, MIN_GB, MAX_GB);
      max = clamp(max, min, MAX_GB);
      setBubbles(min, max);

      await this.database.update(
        { uuid: "1234", ramMin: String(min), ramMax: String(max) },
        "ram"
      );
    });

    await this.initRamAuto();
  }

  async initRamAuto() {
    this._autoRamToggle = document.getElementById('b-auto-ram-toggle');
    this._autoRamStatus = document.getElementById('b-auto-ram-status');
    const sliderDiv = document.querySelector('.memory-slider');
    if (!this._autoRamToggle || !sliderDiv) return;

    let enabled = await getValue('b-auto-ram-enabled');
    enabled = enabled === true || enabled === 'true';
    this._autoRamToggle.checked = enabled;

    this._applyAutoRamUI(enabled);

    this._autoRamToggle.addEventListener('change', async () => {
      const isOn = !!this._autoRamToggle.checked;
      await setValue('b-auto-ram-enabled', isOn ? 'true' : 'false');
      this._applyAutoRamUI(isOn);
      if (isOn) {
        try { await this._autoRamRecomputeAndApply(); } catch (e) { console.error(e); }
      }
    });

    if (enabled) {
      try { await this._autoRamRecomputeAndApply(); } catch (_) { }
    }
  }

  async _applyAutoRamUI(isOn) {
    const sliderDiv = document.querySelector('.memory-slider');

    const recoEl = this._ensureRecoEl();
    recoEl.hidden = !isOn;
    if (isOn) recoEl.style.removeProperty('display'); else recoEl.style.display = 'none';
    if (!isOn) recoEl.textContent = '';

    if (this._autoRamTimer) {
      clearInterval(this._autoRamTimer);
      this._autoRamTimer = null;
    }

    if (sliderDiv) {
      sliderDiv.classList.toggle('is-ram-auto', isOn);
    }

    if (this._autoRamStatus) {
      this._autoRamStatus.innerHTML = isOn
        ? await window.getString("settings.autoRamStatusActive")
        : await window.getString("settings.autoRamStatusInactive");
    }

    if (isOn) {
      this._autoRamTimer = setInterval(() => {

        this._autoRamRecomputeAndApply().catch(() => { });
      }, 5 * 60 * 1000);

    }
  }

  async _autoRamRecomputeAndApply() {
    window.getString("settings.autoRamRecalculating").then(msg => console.log(msg));
    if (!this._ramSlider) {
      console.warn('Auto RAM: no hay slider activo');
      return;
    }
    const os = require('os');

    const totalGB = Math.max(1, Math.floor(os.totalmem() / 1073741824));
    const freeGB = Math.max(0, Math.round((os.freemem() / 1073741824) * 10) / 10);
    const freePct = Math.max(0, Math.min(100, (freeGB / totalGB) * 100));

    let targetPct;
    if (freePct >= 60) targetPct = 0.60;

    else if (freePct >= 40) targetPct = 0.50;
    else if (freePct >= 25) targetPct = 0.40;
    else if (freePct >= 15) targetPct = 0.30;
    else targetPct = 0.20;

    const hardCapPct = 0.70;
    const finalPct = Math.min(targetPct, hardCapPct);

    const STEP = 0.5;
    const roundToStep = (v) => Math.max(STEP, Math.round(v / STEP) * STEP);

    let maxGB = roundToStep(totalGB * finalPct);

    const safeMax = Math.max(STEP, Math.min(maxGB, roundToStep(Math.max(STEP, freeGB - 0.5))));
    maxGB = Math.min(maxGB, safeMax);

    const MIN_REC = 1;
    let minGB = Math.min(maxGB, MIN_REC);

    const sliderDiv = document.querySelector('.memory-slider');
    const maxAttr = parseFloat(sliderDiv?.getAttribute('max') || String(totalGB));
    const minAttr = parseFloat(sliderDiv?.getAttribute('min') || '0.5');

    maxGB = Math.max(minAttr, Math.min(maxGB, maxAttr));
    minGB = Math.max(minAttr, Math.min(minGB, maxGB));

    if (this._ramSlider && typeof this._ramSlider.set === 'function') {
      this._ramSlider.set(minGB, maxGB);

      const minSpan = document.querySelector('.slider-touch-left span');
      const maxSpan = document.querySelector('.slider-touch-right span');
      minSpan?.setAttribute('value', `${minGB} GB`);
      maxSpan?.setAttribute('value', `${maxGB} GB`);
    }

    console.log(`Auto RAM: recomendando ${minGB}–${maxGB} GB (objetivo ${Math.round(finalPct * 100)}%)`);

    this.database.update(
      { uuid: '1234', ramMin: String(minGB), ramMax: String(maxGB) },
      'ram'
    );

    window.getString("settings.autoRamApplied").then(msg => console.log(msg));

    if (this._autoRamStatus) {
      const pctText = Math.round(finalPct * 100);
      this._autoRamStatus.innerHTML =
        `Estado: <b>Activado</b> &middot; Libre: ${freeGB}/${totalGB} GB (${Math.round(freePct)}%) &middot; ` +
        `Asignado: <b>${minGB}–${maxGB} GB</b> (objetivo ≈ ${pctText}%, tope 70%)`;
    }

    const recoEl = this._ensureRecoEl();
    const fmt = n => (Math.round(n * 10) / 10).toString();

    console.log(`Ahora, Battly te recomienda poner como mínimo ${fmt(minGB)} GB y como máximo ${fmt(maxGB)} GB`);
    recoEl.style.display = 'block';
    recoEl.hidden = false;
    recoEl.textContent = `Ahora, Battly te recomienda poner como mínimo ${fmt(minGB)} GB y como máximo ${fmt(maxGB)} GB`;
  }

  async initResolution() {
    let resolutionDatabase = (await this.database.get("1234", "screen"))?.value
      ?.screen;
    let resolution = resolutionDatabase
      ? resolutionDatabase
      : {
        width: "1280",
        height: "720",
      };

    let width = document.querySelector(".width-size");
    width.value = resolution.width;

    let height = document.querySelector(".height-size");
    height.value = resolution.height;

    let select = document.getElementById("select");
    select.addEventListener("change", (event) => {
      let resolution =
        select.options[select.options.selectedIndex].value.split(" x ");
      select.options.selectedIndex = 0;

      width.value = resolution[0];
      height.value = resolution[1];
      this.database.update(
        {
          uuid: "1234",
          screen: {
            width: resolution[0],
            height: resolution[1],
          },
        },
        "screen"
      );
    });
  }

  async initLauncherSettings() {
    let launcherDatabase = (await this.database.get("1234", "launcher"))?.value;
    let settingsLauncher = {
      uuid: "1234",
      launcher: {
        close: launcherDatabase?.launcher?.close || "close-launcher",
        closeMusic: launcherDatabase?.launcher?.closeMusic || "close-music",
      },
    };

    await setValue('launcher', settingsLauncher);

    let closeLauncher = document.getElementById("launcher-close");
    let closeMusic = document.getElementById("music-close");
    let openLauncher = document.getElementById("launcher-open");
    let openMusic = document.getElementById("music-open");

    if (settingsLauncher.launcher.close === "close-launcher") {
      closeLauncher.checked = true;
    } else if (settingsLauncher.launcher.close === "open-launcher") {
      openLauncher.checked = true;
    }

    if (settingsLauncher.launcher.closeMusic === "close-music") {
      closeMusic.checked = true;
    } else if (settingsLauncher.launcher.closeMusic === "open-music") {
      openMusic.checked = true;
    }

    let autoSyncCheckbox = document.getElementById("auto-sync-enabled");
    let autoSyncEnabled = await getValue("autoSyncEnabled");
    if (autoSyncCheckbox) {
      autoSyncCheckbox.checked = autoSyncEnabled === true;
    }

    closeLauncher.addEventListener("change", async () => {
      if (closeLauncher.checked) {
        openLauncher.checked = false;
      }
      if (!closeLauncher.checked) closeLauncher.checked = true;
      settingsLauncher.launcher.close = "close-launcher";

      await this.database.update(settingsLauncher, "launcher");
      await setValue('launcher', settingsLauncher);
    });

    openLauncher.addEventListener("change", async () => {
      if (openLauncher.checked) {
        closeLauncher.checked = false;
      }
      if (!openLauncher.checked) openLauncher.checked = true;
      settingsLauncher.launcher.close = "open-launcher";

      await this.database.update(settingsLauncher, "launcher");
      await setValue('launcher', settingsLauncher);
    });

    closeMusic.addEventListener("change", async () => {
      if (closeMusic.checked) {
        openMusic.checked = false;
      }
      if (!closeMusic.checked) closeMusic.checked = true;
      settingsLauncher.launcher.closeMusic = "close-music";

      await this.database.update(settingsLauncher, "launcher");
      await setValue('launcher', settingsLauncher);

      if (typeof ipcRenderer !== 'undefined') {
        ipcRenderer.send('music-panel-config-changed', 'close-music');
      }
    });

    openMusic.addEventListener("change", async () => {
      if (openMusic.checked) {
        closeMusic.checked = false;
      }
      if (!openMusic.checked) openMusic.checked = true;
      settingsLauncher.launcher.closeMusic = "open-music";

      await this.database.update(settingsLauncher, "launcher");
      await setValue('launcher', settingsLauncher);

      if (typeof ipcRenderer !== 'undefined') {
        ipcRenderer.send('music-panel-config-changed', 'open-music');
      }
    });

    if (autoSyncCheckbox) {
      autoSyncCheckbox.addEventListener("change", async () => {
        await setValue("autoSyncEnabled", autoSyncCheckbox.checked);
        console.log("🔄 Auto-sync configuración actualizada:", autoSyncCheckbox.checked);
      });
    }
  }

  initTab() {
    let TabBtn = document.querySelectorAll(".tab-btn");
    let TabContent = document.querySelectorAll(".tabs-settings-content");

    for (let i = 0; i < TabBtn.length; i++) {
      TabBtn[i].addEventListener("click", () => {
        if (TabBtn[i].classList.contains("save-tabs-btn")) return;
        for (let j = 0; j < TabBtn.length; j++) {
          TabContent[j].classList.remove("active-tab-content");
          TabBtn[j].classList.remove("active-tab-btn");
        }
        TabContent[i].classList.add("active-tab-content");
        TabBtn[i].classList.add("active-tab-btn");
      });
    }

    document.querySelector("#save-btn").addEventListener("click", async (e) => {
      e.preventDefault();

      const accountsBtn = document.querySelector("#accounts-btn");
      document.querySelectorAll(".b-settings-nav-btn").forEach((el) => {
        el.classList.remove("b-settings-active");
      });
      accountsBtn.click();
      changePanel("home");
    });
  }

  async initSettingsDefault() {
    if (!(await this.database.getAll("accounts-selected")).length) {
      this.database.add(
        {
          uuid: "1234",
        },
        "accounts-selected"
      );
    }

    if (!(await this.database.getAll("java-args")).length) {
      this.database.add(
        {
          uuid: "1234",
          args: [],
        },
        "java-args"
      );
    }

    if (!(await this.database.getAll("launcher")).length) {
      this.database.add(
        {
          uuid: "1234",
          launcher: {
            close: "close-launcher",
          },
        },
        "launcher"
      );
    }

    if (!(await this.database.getAll("ram")).length) {
      this.database.add(
        {
          uuid: "1234",
          ramMin: "0.5",
          ramMax: "1",
        },
        "ram"
      );
    }

    if (!(await this.database.getAll("screen")).length) {
      this.database.add(
        {
          uuid: "1234",
          screen: {
            width: "1280",
            height: "720",
          },
        },
        "screen"
      );
    }
  }

  async Java() {

    let configClient = await getValue("java-path");
    const javaPathStored =
      (typeof configClient === "string" && configClient) ||
      (configClient?.java_config?.java_path) ||
      (lang?.java_path_didnt_set || "");

    const javaPathInputTxt = document.getElementById("ruta-java-input");
    const javaPathInputFile = document.getElementById("java-path-input-file");
    if (javaPathInputTxt) javaPathInputTxt.value = javaPathStored || "";

    document.getElementById("open-explorer-java-path").addEventListener("click", async () => {
      javaPathInputFile.value = "";
      javaPathInputFile.click();
      await new Promise((resolve) => {
        const t = setInterval(() => { if (javaPathInputFile.value) { clearInterval(t); resolve(); } }, 100);
      });

      if (javaPathInputFile.value.replace(".exe", "").endsWith("java")) {
        const file = javaPathInputFile.files[0].path;
        if (javaPathInputTxt) javaPathInputTxt.value = file;
        await setValue("java-path", file);
        new Alert().ShowAlert({ title: await window.getString("settings.javaPathSetSuccessfully"), icon: "success" });
      } else {
        new Alert().ShowAlert({ title: await window.getString("settings.theFileNameJava"), icon: "error" });
      }
    });

    document.getElementById("java-path-reset").addEventListener("click", async () => {
      if (javaPathInputTxt) javaPathInputTxt.value = lang?.java_path_didnt_set || "Ruta de java no establecida";
      await setValue("java-path", "");
      new Alert().ShowAlert({ title: await window.getString("settings.javaPathResetSuccessfully"), icon: "success" });
    });

    const fs = require("fs");
    const path = require("path");
    const os = require("os");
    const crypto = require("crypto");

    const BASE_DIR = path.join(dataDirectory, ".battly");
    const RUNTIME_DIR = path.join(BASE_DIR, "runtime");
    const MC_ASSETS_DIR = path.join(BASE_DIR, "mc-assets");
    const ALL_JSON_URL = "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";

    function ensureDirSync(dir) { try { fs.mkdirSync(dir, { recursive: true }); } catch { } }
    function fileExists(p) { try { return !!p && fs.existsSync(p); } catch { return false; } }
    function isWin() { return os.platform() === "win32"; }
    function isMac() { return os.platform() === "darwin"; }
    function binName() { return isWin() ? "javaw.exe" : "java"; }
    function getJavaExeRelative() { return isWin() ? path.join("bin", "javaw.exe") : path.join("bin", "java"); }

    function mojangArchOS(intelEnabledMac = false) {
      const p = os.platform();
      const a = os.arch();
      const map = {
        win32: { x64: "windows-x64", ia32: "windows-x86", arm64: "windows-arm64" },
        darwin: { x64: "mac-os", arm64: intelEnabledMac ? "mac-os" : "mac-os-arm64" },
        linux: { x64: "linux", ia32: "linux-i386" }
      };
      return map[p]?.[a] || null;
    }

    async function getFileHash(filePath, algorithm = "sha1") {
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        const input = fs.createReadStream(filePath);
        input.on("error", reject);
        input.on("data", chunk => hash.update(chunk));
        input.on("end", () => resolve(hash.digest("hex")));
      });
    }

    async function fetchAllJSON() {
      ensureDirSync(MC_ASSETS_DIR);
      const cache = path.join(MC_ASSETS_DIR, "java-runtime-all.json");
      try {
        const r = await fetch(ALL_JSON_URL);
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        fs.writeFileSync(cache, JSON.stringify(j, null, 2));
        return j;
      } catch {
        if (fileExists(cache)) {
          try { return JSON.parse(fs.readFileSync(cache, "utf8")); } catch { }
        }
        throw new Error("No se pudo obtener all.json de Mojang");
      }
    }

    function componentForMajor(major) {

      if (major === 8) return "jre-legacy";
      if (major === 16) return "java-runtime-alpha";
      if (major === 17) return "java-runtime-gamma";
      if (major === 21) return "java-runtime-delta";

      return "java-runtime-gamma";
    }

    async function resolveRuntimeForMajor(all, major, intelEnabledMac = false) {
      const archOS = mojangArchOS(intelEnabledMac);
      if (!archOS) throw new Error("Arquitectura/SO no soportado por Mojang");
      const comp = componentForMajor(major);

      const entry = all?.[archOS]?.[comp]?.[0];
      const versionName = entry?.version?.name;
      const manifestUrl = entry?.manifest?.url;
      if (!versionName || !manifestUrl) {
        throw new Error(`No se encontró un runtime Mojang con Java ${major} para ${archOS}.`);
      }
      return { archOS, versionName, manifestUrl, component: comp };
    }

    async function fetchManifest(url) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Manifest ${r.status}`);
      return await r.json();
    }

    async function downloadOne(url, destPath, onChunk) {
      ensureDirSync(path.dirname(destPath));
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error((await window.getString("settings.downloadFailed")).replace("{0}", url).replace("{1}", res.status));
      const size = Number(res.headers.get("content-length") || 0);

      const ws = fs.createWriteStream(destPath);
      const reader = res.body.getReader();
      let downloaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        downloaded += value.length;
        ws.write(value);
        if (onChunk) onChunk(downloaded, size);
      }
      ws.end();
      await new Promise((resolve, reject) => {
        ws.on("finish", resolve);
        ws.on("error", reject);
        ws.on("close", resolve);
      });
      return { size };
    }

    const listEl = document.getElementById("b-java-list");
    const selectedBar = document.getElementById("b-java-selected");
    const selectedText = document.getElementById("b-java-selected-version");
    const clearBtn = document.getElementById("b-java-clear");
    if (!listEl) return;

    async function loadInstalledMap() {
      const raw = await getValue("java-installed");
      if (!raw) return {};
      try { return (typeof raw === "string") ? JSON.parse(raw) : raw; }
      catch { return {}; }
    }
    async function saveInstalledMap(map) { await setValue("java-installed", JSON.stringify(map)); }
    async function getSelectedMajor() { const v = await getValue("java-selected-major"); return v ? parseInt(v, 10) : null; }
    async function setSelectedMajor(m) { await setValue("java-selected-major", String(m || "")); }

    function parseMajorFromDir(dirName) {
      const clean = dirName.replace(/^jdk-|^jre-/i, "");

      const m = clean.match(/^(\d{1,2})/);
      return m ? parseInt(m[1], 10) : null;
    }

    async function bootstrapScanRuntime() {
      let changed = false;
      const map = await loadInstalledMap();
      if (!fileExists(RUNTIME_DIR)) return;

      const entries = fs.readdirSync(RUNTIME_DIR, { withFileTypes: true });
      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        const name = ent.name;

        const major = parseMajorFromDir(name);

        if (!major) continue;

        let candidate = path.join(RUNTIME_DIR, name, getJavaExeRelative());
        if (isMac()) {

          if (!fileExists(candidate)) {
            const macAlt = path.join(RUNTIME_DIR, name, "Contents", "Home", "bin", "java");
            if (fileExists(macAlt)) candidate = macAlt;
          }
        }
        if (fileExists(candidate)) {
          if (!map[major]?.path || !fileExists(map[major].path)) {
            map[major] = { path: candidate, source: "scan" };
            changed = true;
          }
        }
      }
      if (changed) await saveInstalledMap(map);
    }

    async function paintCard(card, installed) {
      card.dataset.installed = installed ? "true" : "false";
      const dot = card.querySelector(".b-java-dot");
      const status = card.querySelector(".b-java-status");
      const btnDl = card.querySelector(".b-java-action.b-download");
      const btnUse = card.querySelector(".b-java-action.b-use");

      if (installed) {
        dot.classList.remove("b-missing"); dot.classList.add("b-ok");
        status.classList.remove("b-missing"); status.classList.add("b-ok");
        status.textContent = await window.getString("settings.installed");
        if (btnDl) btnDl.hidden = true;
        if (btnUse) btnUse.hidden = false;
        card.style.borderColor = "#1f7a3a";
      } else {
        dot.classList.add("b-missing"); dot.classList.remove("b-ok");
        status.classList.add("b-missing"); status.classList.remove("b-ok");
        status.textContent = await window.getString("settings.notInstalled");
        if (btnDl) btnDl.hidden = false;
        if (btnUse) btnUse.hidden = true;
        card.style.borderColor = "#7a2a2a";
      }
    }

    async function isInstalledMajor(major) {
      const map = await loadInstalledMap();
      const exe = map?.[major]?.path;
      return fileExists(exe);
    }

    async function refreshCards() {
      const installedMap = await loadInstalledMap();
      const cards = Array.from(listEl.querySelectorAll(".b-java-card"));

      for (const card of cards) {
        const major = parseInt(card.dataset.version, 10);
        let exe = installedMap?.[major]?.path;
        const installed = fileExists(exe);
        paintCard(card, installed);
      }
      await syncSelectedBar();
    }

    async function syncSelectedBar() {
      const sel = await getSelectedMajor();
      if (!sel) { if (selectedBar) selectedBar.style.display = "none"; return; }
      const map = await loadInstalledMap();
      const exe = map?.[sel]?.path || "";
      if (selectedText) selectedText.innerHTML = `Java ${sel} – <code style="color:#9DA2B0">${exe}</code>`;
      if (selectedBar) selectedBar.style.display = "flex";
    }

    async function selectVersion(major) {
      const map = await loadInstalledMap();
      const exe = map?.[major]?.path;
      if (!fileExists(exe)) {
        new Alert().ShowAlert({ title: await window.getString("settings.versionNotInstalled"), icon: "error" });
        return;
      }
      await setSelectedMajor(major);
      await setValue("java-path", exe);
      if (javaPathInputTxt) javaPathInputTxt.value = exe;

      Array.from(listEl.querySelectorAll(".b-java-card")).forEach(c => c.classList.remove("b-settings-active"));
      listEl.querySelector(`.b-java-card[data-version="${major}"]`)?.classList.add("b-settings-active");

      await syncSelectedBar();
      new Alert().ShowAlert({ title: `Java ${major} ${await window.getString("settings.javaSelected")}`, icon: "success" });

      const cards = Array.from(listEl.querySelectorAll(".b-java-card"));
      for (const card of cards) {
        const v = parseInt(card.dataset.version, 10);
        const status = card.querySelector(".b-java-status");
        if (status) {
          if (v === major) status.textContent = await window.getString("settings.installedAndSelected");
          else if (status.textContent === await window.getString("settings.installedAndSelected")) status.textContent = await window.getString("settings.installed");
        }
      }
      cards.forEach(c => c.style.borderColor = "");
      const selCard = listEl.querySelector(`.b-java-card[data-version="${major}"]`);
      if (selCard) {
        selCard.style.borderColor = "#5499ff";
        const useBtn = selCard.querySelector(".b-java-action.b-use");
        if (useBtn) useBtn.textContent = await window.getString("settings.using");
      }
    }

    async function buildJavaCardsDynamically() {
      const listEl = document.getElementById("b-java-list");
      if (!listEl) return;

      const CANDIDATES = [
        { major: 8, title: "Java 8", small: "(1.8)" },
        { major: 16, title: "Java 16" },
        { major: 17, title: "Java 17", tag: await window.getString("settings.recommended") },
        { major: 21, title: "Java 21", tag: await window.getString("settings.lts") },
      ];

      let all = null;
      try { all = await fetchAllJSON(); }
      catch (e) { console.error("all.json error", e); }

      listEl.innerHTML = "";
      for (const v of CANDIDATES) {

        let show = true;
        if (all) {
          try {
            await resolveRuntimeForMajor(all, v.major, false);
          } catch {

            show = true;
          }
        }
        if (!show) continue;

        const btn = document.createElement("button");
        btn.className = "b-java-card";
        btn.type = "button";
        btn.id = `b-java-item-${v.major}`;
        btn.dataset.version = String(v.major);
        btn.dataset.installed = "false";

        const badge = v.tag ? `<small class="b-java-tag">${v.tag}</small>` : "";
        const smallTxt = v.small ? ` <small>${v.small}</small>` : "";

        btn.innerHTML = `
        <div class="b-java-left">
          <span class="b-java-dot b-missing" aria-hidden="true"></span>
          <div class="b-java-info">
            <strong class="b-java-title">${v.title}${smallTxt} ${badge}</strong>
            <span class="b-java-status b-missing">${await window.getString("settings.notInstalled")}</span>
          </div>
        </div>
        <div class="b-java-actions">
          <span class="b-java-action b-download">
            <i class="fa-solid fa-download"></i> ${await window.getString("settings.download")}
          </span>
          <span class="b-java-action b-use" hidden>
            <i class="fa-solid fa-check"></i> ${await window.getString("settings.use")}
          </span>
        </div>
      `;
        listEl.appendChild(btn);
      }
    }

    let javaModal = null;
    let currentMajor = null;

    async function ensureJavaModal() {
      if (javaModal) return javaModal;

      const root = document.createElement("div");
      root.id = "b-java-download-modal";
      root.className = "modal";
      root.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card glass" style="width:520px;">
        <header class="modal-card-head">
          <p class="modal-card-title">
            <i class="fa-solid fa-download" style="margin-right:.5rem;"></i>
            ${await window.getString("settings.download")} <span id="b-java-modal-version"></span>
          </p>
          <button class="delete" aria-label="close"></button>
        </header>
        <section class="modal-card-body" style="background:#0f1623">
          <article id="b-java-warning" class="message is-info" style="display:none;">
            <div class="message-body">${await window.getString("settings.downloadCanTakeMinutes")}</div>
          </article>
          <div id="b-java-progress-wrap" style="display:block;">
            <progress id="b-java-progress" class="progress is-info" value="0" max="100"></progress>
            <p id="b-java-progress-text" style="color:#9DA2B0;margin-top:.25rem">${await window.getString("settings.downloadingProgressStart")}</p>
          </div>
          <textarea id="b-java-log" class="textarea" readonly disabled
            style="margin-top:.5rem;height:160px;resize:none;background:#0c1420;color:#9DA2B0;"></textarea>
        </section>
        <footer class="modal-card-foot" style="justify-content:flex-end">
          <button class="button" id="b-java-modal-cancel">${await window.getString("settings.cancel")}</button>
          <button class="button is-info" id="b-java-modal-download">${await window.getString("settings.download")}</button>
        </footer>
      </div>
    `;

      const els = {
        root,
        bg: root.querySelector(".modal-background"),
        closeX: root.querySelector(".delete"),
        cancelBtn: root.querySelector("#b-java-modal-cancel"),
        downloadBtn: root.querySelector("#b-java-modal-download"),
        version: root.querySelector("#b-java-modal-version"),
        warn: root.querySelector("#b-java-warning"),
        progressWrap: root.querySelector("#b-java-progress-wrap"),
        progress: root.querySelector("#b-java-progress"),
        progressText: root.querySelector("#b-java-progress-text"),
        log: root.querySelector("#b-java-log"),
      };

      const onClose = () => closeModal();
      els.bg.addEventListener("click", onClose);
      els.closeX.addEventListener("click", onClose);
      els.cancelBtn.addEventListener("click", onClose);
      function onEsc(e) { if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", onEsc); } }
      document.addEventListener("keydown", onEsc);

      els.downloadBtn.addEventListener("click", () => downloadCurrent());

      javaModal = els;
      return javaModal;
    }

    async function openModal(major) {
      if (await isInstalledMajor(major)) {
        new Alert().ShowAlert({ title: `Java ${major} ${await window.getString("settings.javaAlreadyInstalled")}`, icon: "info" });
        return;
      }

      currentMajor = major;
      const m = ensureJavaModal();
      if (!document.body.contains(m.root)) document.body.appendChild(m.root);

      m.version.textContent = `Java ${major}`;
      m.warn.style.display = "none";
      m.progressWrap.style.display = "block";
      m.progress.value = 0;
      m.progressText.textContent = await window.getString("settings.downloadingProgressStart");
      m.downloadBtn.disabled = false;
      m.log.value = "📦 Preparando descargas…";
      m.log.scrollTop = m.log.scrollHeight;

      requestAnimationFrame(() => m.root.classList.add("is-active"));
    }

    function closeModal() {
      if (!javaModal) return;
      javaModal.root.classList.remove("is-active");
      javaModal.root.remove();
      javaModal = null;
      currentMajor = null;
    }

    async function installJavaFromMojang(major, onProgress) {
      ensureDirSync(BASE_DIR);
      ensureDirSync(RUNTIME_DIR);

      const all = await fetchAllJSON();
      const { archOS, versionName, manifestUrl } = await resolveRuntimeForMajor(all, major, false);
      const manifest = await fetchManifest(manifestUrl);

      const entries = Object.entries(manifest.files || {});
      const exeKey = isWin() ? "bin/javaw.exe" : "bin/java";
      const exeEntry = entries.find(([rel]) => rel.endsWith(exeKey));
      if (!exeEntry) throw new Error("El runtime Mojang no trae bin/java");

      const toDeletePrefix = exeEntry[0].replace(exeKey, "");
      const files = [];
      for (const [relPath, info] of entries) {
        if (info.type === "directory") continue;
        const url = info.downloads?.raw?.url;
        if (!url) continue;
        files.push({
          rel: path.join(relPath.replace(toDeletePrefix, "")),
          executable: !!info.executable,
          sha1: info.downloads.raw.sha1,
          size: info.downloads.raw.size,
          url,
        });
      }

      const baseOut = path.resolve(RUNTIME_DIR, `jre-${versionName}-${archOS}`);
      ensureDirSync(baseOut);

      let totalBytes = files.reduce((a, f) => a + (Number(f.size) || 0), 0) || 0;
      let doneBytes = 0;

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const destAbs = path.join(baseOut, f.rel);
        ensureDirSync(path.dirname(destAbs));

        if (fileExists(destAbs) && f.sha1) {
          const sha = await getFileHash(destAbs, "sha1");
          if (sha && sha.toLowerCase() === String(f.sha1).toLowerCase()) {
            if (onProgress) onProgress({ phase: "file-start", file: path.basename(destAbs), size: f.size, fileIndex: i });
            if (onProgress) onProgress({ phase: "download", file: path.basename(destAbs), downloaded: f.size, size: f.size, fileIndex: i });
            doneBytes += (Number(f.size) || 0);
            if (onProgress) onProgress({ phase: "file-done", file: path.basename(destAbs), size: f.size, fileIndex: i });
            continue;
          } else {
            try { fs.unlinkSync(destAbs); } catch { }
          }
        }

        if (onProgress) onProgress({ phase: "file-start", file: path.basename(destAbs), size: f.size, fileIndex: i });

        let lastReported = 0;
        await downloadOne(f.url, destAbs, (downloaded, size) => {

          const delta = Math.max(0, downloaded - lastReported);
          lastReported = downloaded;
          doneBytes += delta;

          let pct = totalBytes ? (doneBytes / totalBytes) * 100 : (size ? (downloaded / size) * 100 : 0);
          if (onProgress) onProgress({
            phase: "download",
            file: path.basename(destAbs),
            downloaded, size,
            percent: pct,
            fileIndex: i
          });
        });

        if (f.sha1) {
          const sha = await getFileHash(destAbs, "sha1");
          if (!sha || sha.toLowerCase() !== String(f.sha1).toLowerCase()) {
            try { fs.unlinkSync(destAbs); } catch { }
            throw new Error(`Checksum SHA1 no válido para ${destAbs}`);
          }
        }

        if (!isWin() && f.executable) {
          try { fs.chmodSync(destAbs, 0o755); } catch { }
        }

        if (onProgress) onProgress({ phase: "file-done", file: path.basename(destAbs), size: f.size, fileIndex: i });
      }

      const finalExe = path.join(baseOut, getJavaExeRelative());
      if (!fileExists(finalExe)) throw new Error(await window.getString("settings.javaExecutableNotFound"));
      if (!isWin()) { try { fs.chmodSync(finalExe, 0o755); } catch { } }
      return finalExe;
    }

    async function downloadCurrent() {
      if (!currentMajor) return;

      if (await isInstalledMajor(currentMajor)) {
        new Alert().ShowAlert({ title: `Java ${currentMajor} ${await window.getString("settings.javaAlreadyInstalled")}`, icon: "info" });
        closeModal();
        return;
      }

      const m = ensureJavaModal();
      m.downloadBtn.disabled = true;
      m.warn.style.display = "block";
      m.progressWrap.style.display = "block";
      m.progress.value = 0;
      m.progressText.textContent = await window.getString("settings.downloadingProgressStart");
      m.log.value = await window.getString("settings.preparingDownloads");
      m.log.scrollTop = m.log.scrollHeight;

      const scrollLog = () => { m.log.scrollTop = m.log.scrollHeight; };
      const ensureNewLine = () => { if (m.log.value && !m.log.value.endsWith("\n")) m.log.value += "\n"; };
      const lineInfoByKey = new Map();
      const keyFor = (p) => {
        const raw = (p && (p.file || p.fileName || p.name || p.url)) || "";
        return raw || `file-${(p && p.fileIndex) ?? 0}-${Date.now()}`;
      };
      const labelFor = (p) => {
        const raw = (p && (p.file || p.fileName || p.name || p.url)) || "paquete";
        const base = String(raw).split(/[\\/]/).pop();
        return base || "paquete";
      };
      const startFileLine = async (key, label) => {
        ensureNewLine();
        const text = (await window.getString("settings.downloadingFile")).replace("{0}", label);
        const start = m.log.value.length;
        m.log.value += text;
        lineInfoByKey.set(key, { start, text });
        scrollLog();
      };
      const finishFileLine = (key) => {
        const info = lineInfoByKey.get(key);
        if (!info) return;
        const endIdx = info.start + info.text.length;
        m.log.value = m.log.value.slice(0, endIdx) + " ✅" + m.log.value.slice(endIdx);
        m.log.value += "\n";
        lineInfoByKey.delete(key);
        scrollLog();
      };

      let lastPercentShown = 0;

      try {
        const exePath = await installJavaFromMojang(Number(currentMajor), async (p) => {
          if (!p) return;

          if (p.phase === "file-start") {
            const key = keyFor(p);
            const label = labelFor(p);
            await startFileLine(key, label);
            return;
          }

          if (p.phase === "download") {
            const key = keyFor(p);

            let pct = (typeof p.percent === "number") ? p.percent : 0;
            pct = Math.max(lastPercentShown, Math.min(99, pct));
            lastPercentShown = pct;
            m.progress.value = pct;
            m.progressText.textContent = (await window.getString("settings.downloadingProgress")).replace("{0}", Math.round(pct));
            return;
          }

          if (p.phase === "file-done") {
            const key = keyFor(p);
            finishFileLine(key);
            m.progress.value = Math.max(m.progress.value, 95);
            m.progressText.textContent = (await window.getString("settings.downloadingProgress")).replace("{0}", Math.round(m.progress.value));
            return;
          }
        });

        for (const k of Array.from(lineInfoByKey.keys())) finishFileLine(k);

        const map = await loadInstalledMap();
        map[currentMajor] = { path: exePath, source: "mojang" };
        await saveInstalledMap(map);

        m.progress.value = 100;
        m.progressText.textContent = await window.getString("settings.completed");
        ensureNewLine();
        m.log.value += await window.getString("settings.completedMessage");
        scrollLog();

        const card = listEl.querySelector(`.b-java-card[data-version="${currentMajor}"]`);
        if (card) paintCard(card, true);
        await selectVersion(currentMajor);

        new Alert().ShowAlert({ title: (await window.getString("settings.javaInstalledSuccess")).replace("{0}", currentMajor), icon: "success" });
        closeModal();

      } catch (err) {
        console.error("[Launcher]: download mojang java error", err);
        m.downloadBtn.disabled = false;
        m.progressText.textContent = await window.getString("settings.downloadError");
        ensureNewLine();
        m.log.value += await window.getString("settings.downloadErrorMessage");
        scrollLog();
        new Alert().ShowAlert({ title: await window.getString("settings.javaDownloadError"), icon: "error" });
      }
    }

    function wireCards() {
      const cards = Array.from(listEl.querySelectorAll(".b-java-card"));
      for (const card of cards) {
        const major = parseInt(card.dataset.version, 10);
        const btnUse = card.querySelector(".b-java-action.b-use");
        const btnDl = card.querySelector(".b-java-action.b-download");

        card.addEventListener("click", async (e) => {
          if (e.target.closest(".b-java-action")) return;
          const installed = card.dataset.installed === "true";
          if (installed) await selectVersion(major);
          else openModal(major);
        });

        btnUse?.addEventListener("click", async (e) => { e.stopPropagation(); await selectVersion(major); });
        btnDl?.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (await isInstalledMajor(major)) {
            new Alert().ShowAlert({ title: `Java ${major} ${await window.getString("settings.javaAlreadyInstalled")}`, icon: "info" });
            return;
          }
          openModal(major);
        });
      }
    }

    clearBtn?.addEventListener("click", async () => {
      await setSelectedMajor("");
      await setValue("java-path", "");
      if (javaPathInputTxt) javaPathInputTxt.value = lang?.java_path_didnt_set || "Ruta de java no establecida";
      if (selectedBar) selectedBar.style.display = "none";
      new Alert().ShowAlert({ title: await window.getString("settings.javaSelectionCleared"), icon: "success" });
    });

    await buildJavaCardsDynamically();
    await bootstrapScanRuntime();
    await refreshCards();
    wireCards();

    const sel = await getSelectedMajor();
    if (sel) {
      const map = await loadInstalledMap();
      const exe = map?.[sel]?.path;
      if (exe && javaPathInputTxt) javaPathInputTxt.value = exe;
    }
  }







  async ensureRamSlider() {

    const sliderDiv = document.querySelector(".memory-slider");
    if (!sliderDiv) return;

    const os = require("os");
    const totalGB = Math.max(1, Math.floor((os.totalmem() / 1073741824)));
    const MIN_GB = 0.5;
    const STEP = 0.5;
    const MAX_GB = Math.max(MIN_GB, totalGB);

    sliderDiv.setAttribute("min", MIN_GB);
    sliderDiv.setAttribute("max", MAX_GB);
    sliderDiv.setAttribute("step", STEP);

    if (this._ramSlider) {
      this._ramSlider.refresh();
      return;
    }

    const ramDB = (await this.database.get("1234", "ram"))?.value;
    const initMin = ramDB ? parseFloat(ramDB.ramMin) : MIN_GB;
    const initMax = ramDB ? parseFloat(ramDB.ramMax) : Math.min(1, MAX_GB);

    this._ramSlider = new Slider(".memory-slider", initMin, initMax);

    const minSpan = document.querySelector(".slider-touch-left span");
    const maxSpan = document.querySelector(".slider-touch-right span");
    const setBubbles = (a, b) => {
      minSpan?.setAttribute("value", `${a} GB`);
      maxSpan?.setAttribute("value", `${b} GB`);
    };
    setBubbles(this._ramSlider.minValue, this._ramSlider.maxValue);

    this._ramSlider.on("change", async (min, max) => {
      setBubbles(min, max);
      await this.database.update(
        { uuid: "1234", ramMin: String(min), ramMax: String(max) },
        "ram"
      );
    });

    if (!this._ramResizeObs) {
      this._ramResizeObs = new ResizeObserver(() => this._ramSlider?.refresh());
      this._ramResizeObs.observe(sliderDiv);
    }

    requestAnimationFrame(() => this._ramSlider?.refresh());
  }

  _ensureRecoEl() {
    let el = document.getElementById('b-auto-ram-reco');
    if (!el) {
      el = document.createElement('p');
      el.id = 'b-auto-ram-reco';
      el.style.display = 'block';

      const anchor = this._autoRamStatus || document.getElementById('b-auto-ram-status');
      if (anchor && anchor.parentElement) {
        anchor.insertAdjacentElement('afterend', el);
      } else {

        document.body.appendChild(el);
      }
    }
    return el;
  }


  async newTheme() {
    const API = 'https://api.battlylauncher.com/api/themes';
    const IMGUR_CLIENT_ID = '56b4c1812c2116a';
    const account = await this.database.getSelectedAccount();
    if (account.type !== "battly") return;
    const authToken = account?.token;
    const authHeader = { Authorization: `Bearer ${authToken}` };
    const ACTIVE_KEY = 'activeThemeCloud_v1';
    const setActive = id => localStorage.setItem(ACTIVE_KEY, id);
    const getActive = () => localStorage.getItem(ACTIVE_KEY);
    const isPremium = !!account?.premium;

    let myThemes = [];
    const themeList = document.getElementById('themeList');
    const createBtn = document.getElementById('createBtn');
    const shareBtn = document.getElementById('shareBtn');
    let themeModal = null;
    let editing = null;
    let tempBgURL = null;
    let tempBgAnimated = false;

    const open = m => m.classList.add('is-active');
    const close = m => m.classList.remove('is-active');

    const api = async (path, body) => {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return res.json();
    };

    const loadMyThemes = async () => { myThemes = await api('/my', {}); };

    const loadDefaultTheme = async () => {
      try {
        const res = await fetch(`${API}/default`, {
          method: 'GET',
          headers: authHeader
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.error('Error cargando tema predeterminado:', err);
      }
      return null;
    };

    const loadAllThemes = async () => {
      await loadMyThemes();

      const defaultTheme = await loadDefaultTheme();
      if (defaultTheme) {

        myThemes.unshift(defaultTheme);
      }
    };

    const ensureThemeModal = async () => {
      if (themeModal) return themeModal;

      themeModal = document.createElement('div');
      themeModal.className = 'modal theme-modal';
      themeModal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card glass" style="width:560px;">
        <header class="modal-card-head">
          <p class="modal-card-title">
            <i class="fa-solid fa-palette mr-2"></i><span id="modalTitle">Nuevo tema</span>
          </p>
          <button class="delete" aria-label="close"></button>
        </header>
        <section class="modal-card-body" style="background:#0f1623">
          <label class="label">${await window.getString("settings.themeNameLabel")}</label>
          <input id="themeName" class="input notchange" type="text" placeholder="${await window.getString("settings.myTheme")}">
          <div style="display:flex;gap:20px;">
            <div style="width:100%">
              <label class="label">${await window.getString("settings.buttonColor")}</label>
              <input id="btnColor" class="input notchange" type="color" value="#3e8ed0">
              <label class="label">${await window.getString("settings.footerBarColor")}</label>
              <input id="footerColor" class="input notchange" type="color" value="#0a0a0a">
              <label class="label">${await window.getString("settings.loadingColor")}</label>
              <input id="loadingColor" class="input notchange" type="color" value="#000000">
            </div>
            <div style="width:100%">
              <label class="label">${await window.getString("settings.footerOpacity")}</label>
              <input id="footerOpacity" type="range" min="0" max="1" step="0.05" value="0.8">
              <label class="label" style="margin-top: 15px !important;">${await window.getString("settings.startupSound")}</label>
              <div class="select is-fullwidth" style="height: 35px !important;">
                <select id="startupSound" style="height: 35px !important;">
                  <option value="start">${await window.getString("settings.soundOptions.retro")}</option>
                  <option value="start1">${await window.getString("settings.soundOptions.fulgor")}</option>
                  <option value="start2">${await window.getString("settings.soundOptions.neon")}</option>
                  <option value="start3">${await window.getString("settings.soundOptions.centella")}</option>
                  <option value="start4">${await window.getString("settings.soundOptions.adventure")}</option>
                  <option value="start5">${await window.getString("settings.soundOptions.battle")}</option>
                  <option value="start6">${await window.getString("settings.soundOptions.modern")}</option>
                </select>
              </div>
              <label class="label mt-4" style="margin-top: 20px !important;">${await window.getString("settings.background")}</label>
              <button id="bgSelectBtn" class="button is-info is-fullwidth" type="button" style="margin-bottom: 10px;">
                <span class="icon"><i class="fa-solid fa-image"></i></span>
                <span>${await window.getString("settings.selectImage")}</span>
              </button>
              <input id="bgFileInput" type="file" accept="image/png,image/jpeg,image/gif,image/webp" style="display:none;">
              ${!isPremium ? `<p class="help is-danger" id="gifRestriction" style="margin-top:8px">${await window.getString("settings.gifOnlyPremium")}</p>` : ''}
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button cancel is-danger is-outlined">${await window.getString("settings.cancel")}</button>
          <button id="saveTheme" class="button is-info is-outlined">
            <i class="fa-solid fa-floppy-disk mr-2"></i>${await window.getString("settings.save")}
          </button>
        </footer>
      </div>`;

      document.body.appendChild(themeModal);

      const reset = () => {
        editing = null;
        tempBgURL = null;
        tempBgAnimated = false;
        themeModal.querySelector('#bgFileInput').value = '';
        close(themeModal);
      };
      themeModal.querySelector('.delete').onclick =
        themeModal.querySelector('.cancel').onclick = reset;

      const bgInput = themeModal.querySelector('#bgFileInput');
      const bgSelectBtn = themeModal.querySelector('#bgSelectBtn');

      // Click en el botón abre el selector de archivos
      bgSelectBtn.addEventListener('click', () => {
        bgInput.click();
      });

      const isProbablyGifUrl = (url) => /\.gif($|\?)/i.test(url || '');

      bgInput.onchange = async () => {
        const file = bgInput.files[0];
        if (!file) return;

        const isGifSelected = (file.type && file.type.toLowerCase() === 'image/gif') || /\.gif$/i.test(file.name || '');

        if (isGifSelected && !isPremium) {
          ModalAsk.ask({
            title: await window.getString("settings.premiumFeature"),
            text: await window.getString("settings.uploadAnimatedPremiumOnly"),
            icon: 'info',
            confirmButtonText: await window.getString("settings.accept"),
            confirmButtonColor: '#3085d6'
          });
          bgInput.value = '';
          tempBgURL = null;
          tempBgAnimated = false;
          return;
        }

        ModalAsk.ask({
          title: await window.getString("settings.uploadingImage"),
          text: isGifSelected ? await window.getString("settings.uploadingGif") : await window.getString("settings.pleaseWaitUploading"),
          html: `
          <progress id="bgBar" class="progress is-info mt-2" style="display:block"></progress>
          <p id="bgDone" class="has-text-success mt-1" style="display:none">
            <i class="fa-solid fa-check me-1" stlye="margin-right: 5px;"></i>${await window.getString("settings.imageUploaded")}
          </p>`,
          showCancelButton: false,
          icon: 'info',
          onConfirm: () => {
            bgInput.value = '';
            tempBgURL = null;
            tempBgAnimated = false;
            themeModal.querySelector('#bgBar').style.display = 'none';
            themeModal.querySelector('#bgBar').value = 0;
            themeModal.querySelector('#bgDone').style.display = 'none';
            throw new Error('cancelled');
          },
          showButtons: false
        });

        const bar = document.querySelector('#bgBar');
        const ok = document.querySelector('#bgDone');
        bar.style.display = 'block';

        // Subir a Wasabi/S3 en lugar de Imgur
        try {
          const formData = new FormData();
          formData.append('background', file);

          const res = await fetch('https://api.battlylauncher.com/api/v2/background/subir', {
            method: 'POST',
            headers: authHeader,
            body: formData
          });

          const d = await res.json();

          if (d.status !== 200 || !d.url) {
            throw new Error(d.message || 'Error al subir la imagen');
          }

          tempBgURL = d.url;
          tempBgAnimated = Boolean(d.animated || isGifSelected);

          bar.value = 100;
          ok.style.display = 'block';
          setTimeout(() => {
            bar.parentElement.parentElement.parentElement.parentElement.remove();
            bgInput.value = '';
          }, 3000);
        } catch (err) {
          ModalAsk.ask({
            title: await window.getString("settings.errorUploadingImage"),
            text: await window.getString("settings.couldNotUploadImage"),
            icon: 'error',
            confirmButtonText: await window.getString("settings.accept"),
            confirmButtonColor: '#3085d6'
          });
          bar.style.display = 'none'; bar.value = 0; ok.style.display = 'none';
          setTimeout(() => {
            bar.parentElement.parentElement.parentElement.parentElement.remove();
            bgInput.value = '';
          }, 3000);
          tempBgURL = null;
          tempBgAnimated = false;
        }
      }; themeModal.querySelector('#saveTheme').onclick = async () => {
        const data = {
          name: themeModal.querySelector('#themeName').value.trim() || 'Sin nombre',
          btnColor: themeModal.querySelector('#btnColor').value,
          footerColor: themeModal.querySelector('#footerColor').value,
          footerOpacity: themeModal.querySelector('#footerOpacity').value,
          loadingColor: themeModal.querySelector('#loadingColor').value,
          startupSound: themeModal.querySelector('#startupSound').value,
          background: tempBgURL || editing?.background || null,

          animated: (tempBgURL !== null) ? tempBgAnimated : (editing?.animated || false)
        };

        if (data.animated && !isPremium) {
          ModalAsk.ask({
            title: await window.getString("settings.premiumFeature"),
            text: await window.getString("settings.cantSaveAnimatedNonPremium"),
            icon: 'info',
            confirmButtonText: await window.getString("settings.accept"),
            confirmButtonColor: '#3085d6'
          });
          return;
        }

        try {
          if (editing) {
            await api('/update', { id: editing._id, ...data });
            Object.assign(editing, data);
          } else {
            const { id } = await api('/create', data);
            editing = { _id: id, ...data, isPublic: false, reviewStatus: null };
          }
          ModalAsk.ask({
            title: await window.getString("settings.themeSaved"),
            text: await window.getString("settings.themeSavedCorrectly"),
            icon: 'success',
            confirmButtonText: await window.getString("settings.accept"),
            confirmButtonColor: '#3085d6'
          });
          await loadAllThemes();
          await render();
          await applyTheme(editing);
          close(themeModal);
        } catch (error) {
          if (error === 'cancelled') return;
          console.error('Error al guardar el tema:', error);
          ModalAsk.ask({
            title: await window.getString("settings.errorSaving"),
            text: await window.getString("settings.couldNotSaveTheme"),
            icon: 'error',
            confirmButtonText: await window.getString("settings.accept"),
            confirmButtonColor: '#3085d6'
          });
        }
      };

      return themeModal;
    };

    async function buildReviewModal(theme, status, rejectReason = '') {
      const THEME_ID = theme._id;
      const activeIdx = { requested: 0, pending: 1, approved: 2, rejected: 2, draft: 0 }[status] ?? 0;

      document.getElementById('reviewStateModal')?.remove();

      const wrap = document.createElement('div');
      wrap.id = 'reviewStateModal';
      wrap.innerHTML = `
      <div class="modal is-active">
        <div class="modal-background"></div>
        <div class="modal-card glass" style="width:620px">
          <header class="modal-card-head">
            <p class="modal-card-title"><i class="fa-solid fa-circle-info mr-2"></i>${await window.getString("settings.publishationStatus")}</p>
            <button class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body" style="background:#0f1623">
            <div class="timeline">
              <div class="step ${activeIdx >= 0 ? 'active' : ''}"><small>${await window.getString("settings.requestSent")}</small></div>
              <div class="step ${activeIdx >= 1 ? 'active' : ''}"><small>${await window.getString("settings.inReview")}</small></div>
              <div class="step ${activeIdx >= 2 ? 'active' : ''}"><small>${status === 'rejected' ? await window.getString("settings.rejected") : await window.getString("settings.published")}</small></div>
            </div>
            ${status === 'pending' ? `<p class="b-themes-status-theme-text">${await window.getString("settings.themeBeingReviewed")}</p>` : ''}
            ${status === 'approved' ? `<p class="has-text-success b-themes-status-theme-text">${await window.getString("settings.congratulationsPublished")}</p>` : ''}
            ${status === 'rejected' ? `<article class="message is-warning mt-4" style="padding:10px"><div class="message-body"><strong>${await window.getString("settings.rejectionReason")}</strong><br>${rejectReason || await window.getString("settings.notSpecified")}</div></article>` : ''}
          </section>
          <footer class="modal-card-foot" style="justify-content:flex-end">
            ${(status === 'rejected' || status === 'draft') ? `<button class="button is-info is-outlined" id="btnReSubmit"><i class="fa-solid fa-paper-plane mr-1"></i>${await window.getString("settings.resubmitForReview")}</button>` : ''}
            <button class="button cancel is-danger is-outlined" id="btnUnpublish">${await window.getString("settings.unpublish")}</button>
            <button class="button" id="btnClose">${await window.getString("settings.close")}</button>
          </footer>
        </div>
      </div>`;

      document.body.appendChild(wrap);

      wrap.querySelector('#btnClose')?.addEventListener('click', () => wrap.remove());

      wrap.querySelector('#btnUnpublish')?.addEventListener('click', async () => {
        try {
          await ModalAsk.ask({
            title: await window.getString("settings.unpublishTheme"),
            text: await window.getString("settings.sureUnpublishTheme"),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: await window.getString("settings.unpublish"),
            cancelButtonText: await window.getString("settings.cancel"),
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            preConfirm: () => true
          });

          await api('/unpublish', { id: THEME_ID });

          await ModalAsk.ask({
            title: 'Despublicado ✔',
            text: 'Tu tema ha sido despublicado',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });

          wrap.remove();
          await render();
          if (editing?._id === THEME_ID) {
            editing.isPublic = false;
            editing.reviewStatus = 'draft';
            setActive('');
            persist(editing);
          }
        } catch (err) {
          if (err === 'cancelled') return;
          console.error('unpublish', err);
          ModalAsk.ask({
            title: await window.getString("settings.errorUnpublishTheme"),
            text: await window.getString("settings.couldNotUnpublishTheme"),
            icon: 'error',
            confirmButtonText: await window.getString("settings.accept")
          });
        }
      });

      wrap.querySelector('#btnReSubmit')?.addEventListener('click', async () => {
        try {
          await api('/requestReview', { id: THEME_ID });
          ModalAsk.ask({
            title: await window.getString("settings.resubmittedSuccess"),
            text: await window.getString("settings.themeResubmittedToReview"),
            icon: 'success',
            confirmButtonText: await window.getString("settings.accept")
          });
          wrap.remove();
          await render();
        } catch {
          console.error('requestReview', err);
          ModalAsk.ask({
            title: await window.getString("settings.errorResubmittingTheme"),
            text: await window.getString("settings.couldNotResubmitTheme"),
            icon: 'error',
            confirmButtonText: await window.getString("settings.accept")
          });
        }
      });
    }

    const render = async () => {
      themeList.innerHTML = '';
      const active = getActive();

      for (const t of myThemes) {
        const card = document.createElement('div');
        card.className = 'theme-card' + (t._id === active ? ' active' : '');
        card.dataset.id = t._id;
        card.style.setProperty('--btn-color', t.btnColor);
        card.style.setProperty('--footer-color', t.footerColor);
        card.style.setProperty('--loading-color', t.loadingColor);
        if (t.background) card.style.setProperty('--thumb', `url(${t.background})`);
        if (t.background) card.dataset.hasBg = 'true';

        const isDefaultTheme = t._id === 'battly-default-theme' || t.isDefault;

        let iconHTML = '';
        if (isDefaultTheme) {

          iconHTML = `<i class="fa-solid fa-shield-halved" style="color:#28a745" title="Tema del sistema"></i>`;
        } else {
          iconHTML = `<i class="fa-solid fa-paper-plane publish" title="${await window.getString("settings.sendToReviewTooltip")}"></i>`;
          if (t.reviewStatus === 'pending') iconHTML = `<i class="fa-solid fa-circle-info publish" style="color:#3ea6ff" title="${await window.getString("settings.inReviewTooltip")}"></i>`;
          if (t.reviewStatus === 'rejected') iconHTML = `<i class="fa-solid fa-triangle-exclamation publish" style="color:#ffc107" title="${await window.getString("settings.rejectedTooltip")}"></i>`;
          if (t.isPublic) iconHTML = `<i class="fa-solid fa-eye publish" title="${await window.getString("settings.publishedTooltip")}"></i>`;
        }

        card.innerHTML = `
        <span class="theme-card-title">${t.name}${t.animated ? ` <span title="${await window.getString("settings.animatedBackgroundTooltip")}" style="font-size:12px;color:#66d1ff">(GIF)</span>` : ''}${isDefaultTheme ? ' <span style="font-size:12px;color:#28a745">(Sistema)</span>' : ''}</span>
        <div class="card-actions">
          ${isDefaultTheme ? '' : `<i class="fa-solid fa-pen-to-square edit" title="${await window.getString("settings.editTooltip")}"></i>`}
          ${isDefaultTheme ? '' : `<i class="fa-solid fa-trash delete" title="${await window.getString("settings.deleteTooltip")}"></i>`}
          ${isDefaultTheme ? '' : `<i class="fa-solid fa-share share-theme" title="Compartir tema" style="color:#4ecdc4;"></i>`}
          ${iconHTML}
        </div>`;

        const act = card.querySelector('.card-actions');
        act.style.cssText = 'position:absolute;top:6px;right:8px;display:flex;gap:8px;font-size:16px;color:#fff;opacity:0;transition:opacity .15s';
        card.onmouseenter = () => { act.style.opacity = 1; };
        card.onmouseleave = () => { act.style.opacity = 0; };
        card.onclick = async e => { if (!e.target.closest('.card-actions')) await applyTheme(t); };

        if (!isDefaultTheme) {
          const editBtn = card.querySelector('.edit');
          if (editBtn) {
            editBtn.onclick = async () => {
              if (t.isPublic) return ModalAsk.ask({
                title: await window.getString("settings.editableNotPublic"),
                text: await window.getString("settings.themePublishedCantEditMessage"),
                icon: 'info',
                confirmButtonText: await window.getString("settings.accept"),
                confirmButtonColor: '#3085d6'
              });
              const m = await ensureThemeModal();
              m.querySelector('#modalTitle').textContent = await window.stringLoader.getString("settings.editTheme");
              m.querySelector('#themeName').value = t.name;
              m.querySelector('#btnColor').value = t.btnColor;
              m.querySelector('#footerColor').value = t.footerColor;
              m.querySelector('#footerOpacity').value = t.footerOpacity;
              m.querySelector('#loadingColor').value = t.loadingColor;
              m.querySelector('#startupSound').value = t.startupSound;
              editing = t; tempBgURL = null; tempBgAnimated = false; open(m);
            };
          }
        }

        if (!isDefaultTheme) {
          const deleteBtn = card.querySelector('.delete');
          if (deleteBtn) {
            deleteBtn.onclick = async () => {
              try {
                await ModalAsk.ask({
                  title: (await window.getString("settings.deleteThemeConfirm")).replace("{0}", t.name),
                  text: await window.getString("settings.deleteThemeConfirmMessage"),
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: await window.getString("settings.eliminate"),
                  confirmButtonColor: '#d33',
                  cancelButtonText: await window.getString("settings.close"),
                  cancelButtonColor: '#3085d6',
                  preConfirm: () => true
                })

                await api('/delete', { id: t._id });
                myThemes = myThemes.filter(x => x._id !== t._id);
                if (getActive() === t._id) setActive(myThemes[0]?._id || '');
                await render();
              } catch (err) {
                if (err === 'cancelled') return;
                console.error('delete', err);
                ModalAsk.ask({
                  title: await window.getString("settings.errorDeleting"),
                  text: await window.getString("settings.couldNotDeleteThemeMessage"),
                  icon: 'error',
                  confirmButtonText: await window.getString("settings.accept"),
                  confirmButtonColor: '#3085d6'
                });
              }
            };
          }
        }

        if (!isDefaultTheme) {
          const shareBtn = card.querySelector('.share-theme');
          if (shareBtn) {
            shareBtn.onclick = async () => {
              await shareTheme(t._id, t.name);
            };
          }
        }

        const publishBtn = card.querySelector('.publish');
        if (publishBtn && !isDefaultTheme) {
          publishBtn.onclick = async () => {
            if (!t.isPublic && (!t.reviewStatus || t.reviewStatus === 'draft')) {
              try {
                await api('/requestReview', { id: t._id });
                ModalAsk.ask({
                  title: await window.getString("settings.sentForReview"),
                  text: await window.getString("settings.themeSentForReview"),
                  icon: 'success',
                  confirmButtonText: await window.getString("settings.accept"),
                  confirmButtonColor: '#3085d6'
                });
                t.reviewStatus = 'requested';
                await render();
              } catch {
                console.error('requestReview', err);
                ModalAsk.ask({
                  title: await window.getString("settings.errorSending"),
                  text: await window.getString("settings.couldNotSendThemeForReview"),
                  icon: 'error',
                  confirmButtonText: await window.getString("settings.accept"),
                  confirmButtonColor: '#3085d6'
                });
              }
            } else {
              try {
                const { status, reason } = await api('/reviewStatus', { id: t._id });
                t.reviewStatus = status;
                await render();
                await buildReviewModal(t, status, reason);
              } catch {
                console.error('reviewStatus', err);
                ModalAsk.ask({
                  title: await window.getString("settings.errorCheckingStatus"),
                  text: await window.getString("settings.couldNotCheckThemeStatus"),
                  icon: 'error',
                  confirmButtonText: await window.getString("settings.accept"),
                  confirmButtonColor: '#3085d6'
                });
              }
            }
          };
        }

        themeList.appendChild(card);
      }
    };

    const persist = async t => {
      await setValue('theme-color', t.btnColor);
      await setValue('theme-color-hover', tinycolor(t.btnColor).darken(10).toString());
      await setValue('theme-color-bottom-bar', t.footerColor);
      await setValue('theme-opacity-bottom-bar', t.footerOpacity);
      await setValue('background-loading-screen-color', t.loadingColor);
      await setValue('sonido-inicio', t.startupSound);
      if (t.background && (!t.animated || isPremium)) {
        await setValue('background-img', t.background);
      }
    };

    async function refreshDOM(t = {}) {

      let isPremium = false;
      try {
        const acc = await (window?.database?.getSelectedAccount?.() ?? Promise.resolve(null));
        isPremium = !!acc?.premium;
      } catch (_) { }

      const color = t.btnColor ?? (await getValue("theme-color")) ?? "#3e8ed0";
      const colorHover = t.btnHoverColor ?? (await getValue("theme-color-hover")) ?? tinycolor(color).darken(10).toString();
      const colorBottomBar = t.footerColor ?? (await getValue("theme-color-bottom-bar")) ?? "#0f1623";
      const opacityBottomBar = t.footerOpacity ?? (await getValue("theme-opacity-bottom-bar")) ?? "1";
      const backgroundImg = t.background ?? (await getValue("background-img")) ?? null;
      const backgroundVideo = t.backgroundVideo ?? (await getValue("background-video")) ?? null;
      const loadingColor = t.loadingColor ?? (await getValue("loading-color")) ?? color;

      document.documentElement.style.setProperty('--btn-color', color);
      document.documentElement.style.setProperty('--btn-hover', colorHover);
      document.documentElement.style.setProperty('--footer-color', colorBottomBar);
      document.documentElement.style.setProperty('--loading-color', loadingColor);
      document.documentElement.style.setProperty('--footer-opacity', String(opacityBottomBar));

      const bottomBars = document.querySelectorAll(".bottom_bar");
      const bottomBarSettings = document.getElementById("bottom_bar_settings");
      await setValue("theme-color-bottom-bar", colorBottomBar);

      const applyBackgroundColor = (elements, col) => {
        elements.forEach(el => {
          if (el.classList.contains("button")) {
            el.addEventListener("mouseover", () => { el.style.backgroundColor = tinycolor(col).darken(10).toString(); });
            el.addEventListener("mouseout", () => { el.style.backgroundColor = col; });
          }
          if (!el.classList?.contains("notchange")) el.style.backgroundColor = col;
        });
      };
      const applyOpacity = (elements, op) => {
        elements.forEach(el => el.style.opacity = op);
      };

      applyBackgroundColor(bottomBars, colorBottomBar);
      if (bottomBarSettings) {
        bottomBarSettings.style.backgroundColor = colorBottomBar;

        bottomBarSettings.style.background = tinycolor(colorBottomBar).setAlpha(opacityBottomBar).toRgbString();
      }
      applyOpacity([...(bottomBars || []), ...(bottomBarSettings ? [bottomBarSettings] : [])], opacityBottomBar);

      let buttons = document.querySelectorAll(".button");
      buttons = Array.from(buttons).filter(b => !b.classList.contains("btn-dont-change"));
      applyBackgroundColor(buttons, color);

      buttons.forEach(button => {
        if (!button.dataset.hoverApplied) {
          button.addEventListener("mouseover", () => { button.style.backgroundColor = colorHover; });
          button.addEventListener("mouseout", () => { button.style.backgroundColor = color; });
          button.dataset.hoverApplied = "1";
        } else {

          button.style.backgroundColor = color;
        }
      });

      applyBackgroundColor(
        document.querySelectorAll(".btn, .tab-btn, .input, .select, .select-version, .select-selected, .select-selected span, .file-cta"),
        color
      );

      document.querySelector(".b-settings-acc-add").style.backgroundColor = color;
      document.querySelector(".b-settings-acc-add").style.borderColor = tinycolor(color).darken(10).toString();

      document.getElementById('dynamic-theme-style')?.remove();

      const style = document.createElement('style');
      style.id = 'dynamic-theme-style';
      style.innerHTML = `
      .b-settings-nav-btn.b-settings-active {
        background-color: ${color} !important;
      }
      .b-settings-nav-btn:hover {
        background-color: ${tinycolor(color).darken(10).toString()} !important;
      }
      `;
      document.head.appendChild(style);

      setTimeout(() => {
        document.querySelectorAll(".b-settings-acc-card").forEach(el => el.style.backgroundColor = color);
      }, 3000);

      if (backgroundImg) {
        Object.assign(document.body.style, {
          backgroundImage: `url(${backgroundImg})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center'
        });
      } else {

        document.body.style.backgroundImage = "";
      }

      const video = document.getElementById("video-background");
      if (video) {
        if (backgroundVideo) {
          video.style.display = "";
          const srcEl = video.querySelector("source");
          if (srcEl) srcEl.src = backgroundVideo;
          try { video.load(); video.play().catch(() => { }); } catch (_) { }
        } else {
          video.style.display = "none";
          try { video.pause(); } catch (_) { }
        }
      }

      const launchBoostVal = await getValue("launchboost");
      const launchBoostEl = document.getElementById("launchboost");
      if (launchBoostEl) {
        if (!launchBoostVal) {
          launchBoostEl.removeAttribute("checked");
        } else {
          launchBoostEl.setAttribute("checked", "checked");
        }
      }

      const btnMusic = document.getElementById("music-btn");
      if (btnMusic && !btnMusic.dataset.listenerApplied) {
        btnMusic.addEventListener("click", () => {
          if (typeof changePanel === "function") changePanel("music");
        });
        btnMusic.dataset.listenerApplied = "1";
      }
    }

    async function InitTheme() {
      await refreshDOM({});
    }

    const applyTheme = async t => {
      if (t.animated && !isPremium) {
        ModalAsk.ask({
          title: await window.getString("settings.premiumFunctionTitle"),
          text: await window.getString("settings.cantSetAnimatedNonPremium"),
          icon: 'info',
          confirmButtonText: await window.getString("settings.accept"),
          confirmButtonColor: '#3085d6'
        });
        return;
      }
      setActive(t._id);
      refreshDOM(t);
      persist(t);
      await render();
    };

    createBtn.onclick = async () => {
      const m = await ensureThemeModal();
      m.querySelector('#modalTitle').textContent = await window.stringLoader.getString("settings.newTheme");
      m.querySelectorAll('input,select').forEach(el => {
        if (el.type === 'color') el.value = el.id === 'btnColor' ? '#3e8ed0' : el.id === 'footerColor' ? '#0a0a0a' : '#000000';
        else if (el.type === 'range') el.value = 0.8;
        else el.value = '';
      });
      editing = null; tempBgURL = null; tempBgAnimated = false; open(m);
    };

    shareBtn.onclick = async () => {
      try {
        await showShareModal();
      } catch (error) {
        console.error('Error al abrir modal de compartir:', error);
        ModalAsk.ask({
          title: await window.getString("settings.error"),
          text: "Error al cargar la función de compartir",
          icon: 'error',
          confirmButtonText: await window.getString("settings.accept"),
          confirmButtonColor: '#3085d6'
        });
      }
    };

    const showShareModal = async () => {

      const userThemes = myThemes.filter(t => t._id !== 'battly-default-theme' && !t.isDefault && t.owner);

      if (userThemes.length === 0) {
        return ModalAsk.ask({
          title: "Sin temas para compartir",
          text: "No tienes temas propios para compartir. Crea un tema personalizado primero.",
          icon: 'info',
          confirmButtonText: await window.getString("settings.accept"),
          confirmButtonColor: '#3085d6'
        });
      }

      const shareModal = document.createElement('div');
      shareModal.className = 'modal share-modal';
      shareModal.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card glass" style="width:600px;">
          <header class="modal-card-head" style="background:#1a2332; border-bottom:1px solid #444;">
            <p class="modal-card-title has-text-white">
              <i class="fa-solid fa-share" style="margin-right:8px;"></i>Compartir Temas
            </p>
            <button class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body" style="background:#0f1623;">
            <div class="tabs is-boxed">
              <ul style="border-bottom:1px solid #444;">
                <li class="is-active" data-tab="share">
                  <a style="color:#fff; border-color:#444;"><span class="icon is-small"><i class="fa-solid fa-share" aria-hidden="true"></i></span>
                  <span>Compartir</span></a>
                </li>
                <li data-tab="import">
                  <a style="color:#aaa; border-color:#444;"><span class="icon is-small"><i class="fa-solid fa-download" aria-hidden="true"></i></span>
                  <span>Importar</span></a>
                </li>
                <li data-tab="stats">
                  <a style="color:#aaa; border-color:#444;"><span class="icon is-small"><i class="fa-solid fa-chart-line" aria-hidden="true"></i></span>
                  <span>Estadísticas</span></a>
                </li>
              </ul>
            </div>

            <div id="tab-share" class="tab-content is-active">
              <h5 class="title is-5 mb-4 has-text-white">Selecciona un tema para compartir:</h5>
              <div class="share-themes-list" style="max-height:300px; overflow-y:auto;">
                ${userThemes.map(theme => `
                  <div class="theme-share-item" data-theme-id="${theme._id}" style="display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid #444; border-radius:8px; margin-bottom:10px; cursor:pointer; transition:background 0.2s;">
                    <div>
                      <strong style="color:#fff;">${theme.name}</strong>
                      <div style="font-size:12px; color:#aaa;">
                        <span style="display:inline-block; width:12px; height:12px; background:${theme.btnColor}; border-radius:2px; margin-right:5px;"></span>
                        <span style="display:inline-block; width:12px; height:12px; background:${theme.footerColor}; border-radius:2px; margin-right:5px;"></span>
                        ${theme.animated ? '<i class="fa-solid fa-play" title="Animado"></i>' : ''}
                      </div>
                    </div>
                    <button class="button is-small is-info" onclick="shareTheme('${theme._id}', '${theme.name}')" style="font-size:12px; padding:6px 12px;">
                      <i class="fa-solid fa-share" style="margin-right:4px;"></i>Compartir
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <div id="tab-import" class="tab-content" style="display:none;">
              <h5 class="title is-5 mb-4 has-text-white">Importar tema desde enlace:</h5>
              <div class="field">
                <label class="label has-text-white">Código o enlace de compartir:</label>
                <div class="control">
                  <input id="import-code" class="input" type="text" placeholder="Pega aquí el código o enlace del tema">
                </div>
                <p class="help has-text-grey-light">Pega el código de compartir o la URL completa del tema</p>
              </div>
              <div class="field">
                <label class="label has-text-white">Nombre personalizado (opcional):</label>
                <div class="control">
                  <input id="import-name" class="input" type="text" placeholder="Mi tema importado">
                </div>
              </div>
              <div class="field">
                <div class="control">
                  <button id="import-btn" class="button is-success is-small" style="font-size:13px; padding:8px 16px;">
                    <i class="fa-solid fa-download" style="margin-right:6px;"></i>Importar Tema
                  </button>
                </div>
              </div>
            </div>

            <div id="tab-stats" class="tab-content" style="display:none;">
              <h5 class="title is-5 mb-4 has-text-white">Tus temas compartidos:</h5>
              <div id="stats-content">
                <div class="has-text-centered has-text-white">
                  <i class="fa-solid fa-spinner fa-spin"></i> Cargando estadísticas...
                </div>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot" style="background:#0f1623; border-top:1px solid #444;">
            <button class="button cancel is-small" style="background:#444; color:#fff; border:1px solid #666;">Cerrar</button>
          </footer>
        </div>`;

      document.body.appendChild(shareModal);

      const tabs = shareModal.querySelectorAll('.tabs li');
      const tabContents = shareModal.querySelectorAll('.tab-content');

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {

          tabs.forEach(t => {
            t.classList.remove('is-active');
            const link = t.querySelector('a');
            link.style.color = '#aaa';
            link.style.borderColor = '#444';
          });
          tabContents.forEach(tc => tc.style.display = 'none');

          tab.classList.add('is-active');
          const link = tab.querySelector('a');
          link.style.color = '#fff';
          link.style.borderColor = '#3e8ed0';

          const tabId = tab.dataset.tab;
          shareModal.querySelector(`#tab-${tabId}`).style.display = 'block';

          if (tabId === 'stats') {
            loadShareStats();
          }
        });
      });

      shareModal.querySelector('#import-btn').addEventListener('click', async () => {
        const code = shareModal.querySelector('#import-code').value.trim();
        const customName = shareModal.querySelector('#import-name').value.trim();

        if (!code) {
          return ModalAsk.ask({
            title: "Código requerido",
            text: "Por favor, ingresa un código o enlace de compartir",
            icon: 'warning',
            confirmButtonText: await window.getString("settings.accept")
          });
        }

        await importTheme(code, customName);
      });

      const closeModal = () => {
        shareModal.classList.remove('is-active');
        setTimeout(() => shareModal.remove(), 300);
      };

      shareModal.querySelector('.delete').onclick = closeModal;
      shareModal.querySelector('.cancel').onclick = closeModal;
      shareModal.querySelector('.modal-background').onclick = closeModal;

      shareModal.classList.add('is-active');

      const loadShareStats = async () => {
        try {
          const stats = await api('/share/stats', {});
          const statsContent = shareModal.querySelector('#stats-content');

          if (stats.sharedThemes.length === 0) {
            statsContent.innerHTML = `
              <div class="has-text-centered">
                <i class="fa-solid fa-info-circle" style="font-size:3rem; color:#888; margin-bottom:1rem;"></i>
                <p class="has-text-white">Aún no has compartido ningún tema</p>
              </div>`;
            return;
          }

          statsContent.innerHTML = stats.sharedThemes.map(share => `
            <div class="share-stat-item" style="padding:15px; border:1px solid #444; border-radius:8px; margin-bottom:10px; background:rgba(255,255,255,0.02);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color:#fff;">${share.themeName}</strong>
                  <div style="font-size:12px; color:#aaa;">
                    Compartido el ${new Date(share.createdAt).toLocaleDateString()}
                    ${share.isExpired ? ' <span style="color:#ff6b6b;">(Expirado)</span>' : ''}
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:14px; color:#4ecdc4;">
                    <i class="fa-solid fa-eye" style="margin-right:4px;"></i>${share.accessCount} vistas
                  </div>
                </div>
              </div>
              <div style="margin-top:10px;">
                <div class="field has-addons">
                  <div class="control is-expanded">
                    <input class="input is-small" type="text" value="${share.shareUrl}" readonly style="font-size:11px;">
                  </div>
                  <div class="control">
                    <button class="button is-small is-info" onclick="copyToClipboard('${share.shareUrl}')" style="padding:4px 8px;">
                      <i class="fa-solid fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('');

        } catch (error) {
          console.error('Error cargando estadísticas:', error);
          shareModal.querySelector('#stats-content').innerHTML = `
            <div class="has-text-centered">
              <i class="fa-solid fa-exclamation-triangle" style="color:#ff6b6b; font-size:2rem; margin-bottom:1rem;"></i>
              <p class="has-text-white">Error al cargar las estadísticas</p>
            </div>`;
        }
      };
    };

    window.shareTheme = async (themeId, themeName) => {
      try {
        const result = await api('/share', { id: themeId });

        ModalAsk.ask({
          title: "¡Tema compartido!",
          html: `
            <p>Tu tema "<strong>${themeName}</strong>" ha sido compartido exitosamente.</p>
            <div class="field has-addons" style="margin-top:15px;">
              <div class="control is-expanded">
                <input id="share-url-copy" class="input is-small" type="text" value="${result.shareUrl}" readonly style="font-size:11px;">
              </div>
              <div class="control">
                <button class="button is-info is-small" onclick="copyToClipboard('${result.shareUrl}')" style="padding:4px 8px;">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </div>
            <p class="help" style="color:#666;">Este enlace expira el ${new Date(result.expiresAt).toLocaleDateString()}</p>
          `,
          icon: 'success',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#3085d6'
        });

      } catch (error) {
        console.error('Error compartiendo tema:', error);
        ModalAsk.ask({
          title: "Error",
          text: "No se pudo compartir el tema. Inténtalo de nuevo.",
          icon: 'error',
          confirmButtonText: await window.getString("settings.accept")
        });
      }
    };

    window.importTheme = async (code, customName) => {
      try {

        let shareCode = code;
        if (code.includes('/theme/import/')) {
          shareCode = code.split('/theme/import/')[1];
        }

        const body = customName ? { customName } : {};
        const result = await api(`/import/${shareCode}`, body);

        ModalAsk.ask({
          title: "¡Tema importado!",
          text: `El tema ha sido importado correctamente a tu colección.`,
          icon: 'success',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#3085d6'
        });

        await loadAllThemes();
        await render();

      } catch (error) {
        console.error('Error importando tema:', error);
        ModalAsk.ask({
          title: "Error al importar",
          text: "No se pudo importar el tema. Verifica el código e inténtalo de nuevo.",
          icon: 'error',
          confirmButtonText: await window.getString("settings.accept")
        });
      }
    };

    window.copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        Toast.fire({
          icon: 'success',
          title: 'Copiado al portapapeles'
        });
      } catch (error) {
        console.error('Error copiando al portapapeles:', error);
        Toast.fire({
          icon: 'error',
          title: 'Error al copiar'
        });
      }
    };

    try {
      await loadAllThemes();

      if (!myThemes.length) {
        const { id } = await api('/create', {
          name: 'Predeterminado',
          btnColor: '#3e8ed0',
          footerColor: '#0a0a0a',
          footerOpacity: 0.85,
          loadingColor: '#000000',
          startupSound: 'Battle',
          background: null,
          animated: false
        });
        myThemes.push({
          _id: id,
          name: 'Predeterminado',
          btnColor: '#3e8ed0',
          footerColor: '#0a0a0a',
          footerOpacity: 0.85,
          loadingColor: '#000000',
          startupSound: 'Battle',
          background: null,
          animated: false,
          isPublic: false,
          reviewStatus: 'draft'
        });
      }

      let themeToApply = myThemes.find(t => t._id === getActive());
      if (!themeToApply) {

        themeToApply = myThemes.find(t => t._id === 'battly-default-theme' || t.isDefault);
      }
      if (!themeToApply) {

        themeToApply = myThemes[0];
      }

      if (themeToApply) {
        await applyTheme(themeToApply);
      } else {

        await render();
      }
    } catch (err) {
      console.error(err);
      ModalAsk.ask({
        title: await window.getString("settings.errorLoadingThemes"),
        text: await window.getString("settings.couldNotLoadThemesMessage"),
        icon: 'error',
        confirmButtonText: await window.getString("settings.accept"),
        confirmButtonColor: '#3085d6'
      });
    }

    ipcRenderer.on('applyTheme', async (event, themeId) => {
      await loadAllThemes();
      const theme = myThemes.find(t => t._id === themeId._id);
      if (theme) await applyTheme(theme);
    });
  }

  async newSettings() {

    const panels = {
      cuentas: document.getElementById('b-settings-panel-cuentas'),
      java: document.getElementById('b-settings-panel-java'),
      ram: document.getElementById('b-settings-panel-ram'),
      launcher: document.getElementById('b-settings-panel-launcher'),
      tema: document.getElementById('b-settings-panel-tema'),
      fondo: document.getElementById('b-settings-panel-fondo')
    };
    const titles = {
      cuentas: await window.getString("settings.myAccounts"),
      java: await window.getString("settings.javaSettings"),
      ram: await window.getString("settings.ramSettings"),
      launcher: await window.getString("settings.battlyConfigurationTitle"),
      tema: await window.getString("settings.battlyTheme"),
      fondo: await window.getString("settings.customizeBackground")
    };

    const showPanel = async (key) => {
      for (const k in panels) if (panels[k]) panels[k].style.display = (k === key ? 'block' : 'none');

      const h = document.getElementById('b-settings-title');
      if (h) h.textContent = titles[key];

      document.querySelectorAll('.b-settings-nav-btn')
        .forEach(btn => btn.classList.toggle('b-settings-active', btn.dataset.target === key));

      if (key === 'ram') {

        requestAnimationFrame(() => requestAnimationFrame(() => this.ensureRamSlider()));

        try {
          if (this._autoRamToggle?.checked) await this._autoRamRecomputeAndApply();
        } catch { }
      }
    };

    document.querySelectorAll('.b-settings-nav-btn')
      .forEach(btn => btn.addEventListener('click', () => showPanel(btn.dataset.target)));

    showPanel('cuentas');

    const profileMenu = document.getElementById('b-settings-profile-menu');
    const copyBtn = document.getElementById('b-settings-copy-uuid');
    const viewBtn = document.getElementById('b-settings-view-profile');
    const skinBtn = document.getElementById('b-settings-skin');
    const logoutBtn = document.getElementById('b-settings-logout');

    document.addEventListener('click', (e) => {
      const trig = e.target.closest('.b-settings-menu-trigger');
      if (trig) {
        const card = trig.closest('.b-settings-acc-card');
        if (!card || !profileMenu) return;
        const uuid = card.dataset.uuid || card.id;
        profileMenu.dataset.uuid = uuid;
        profileMenu.dataset.username = card.dataset.username || card.querySelector('.b-settings-acc-name')?.textContent || '';

        const rect = trig.getBoundingClientRect();
        profileMenu.style.top = `${rect.bottom + window.scrollY + 6}px`;
        profileMenu.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
        profileMenu.style.transform = 'translateX(-50%)';
        profileMenu.style.display = 'block';
        return;
      }
      if (!e.target.closest('#b-settings-profile-menu')) hideContextMenu();
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideContextMenu(); });

    copyBtn?.addEventListener('click', async () => {
      const uuid = profileMenu?.dataset.uuid || '';
      try {
        await navigator.clipboard.writeText(uuid);
        new Alert().ShowAlert({
          title: await window.getString("settings.uuidCopied"),
          message: await window.getString("logs.idCopiedCorrectly"),
          icon: "success",
        });
      } catch {
        new Alert().ShowAlert({
          title: 'Error al copiar UUID',
          message: 'No se pudo copiar la UUID',
          icon: "error",
        });
      }
      hideContextMenu();
    });

    viewBtn?.addEventListener('click', () => {
      const uuid = profileMenu?.dataset.uuid;
      const username = profileMenu?.dataset.username || '';
      if (uuid) openProfileModal(uuid, username);
      hideContextMenu();
    });

    const customizeProfileBtn = document.getElementById('b-settings-customize-profile');

    customizeProfileBtn?.addEventListener('click', () => {
      const uuid = profileMenu?.dataset.uuid;
      if (uuid) {

        this.openProfileCustomizationModal(uuid);
      }
      hideContextMenu();
    });

    skinBtn?.addEventListener('click', () => {
      const uuid = profileMenu?.dataset.uuid;
      try {
        openSkinCustomizer(uuid);
      } catch {
        new Alert().ShowAlert({
          title: 'Abrir personalizador de skin (pendiente de UI)',
          icon: "info",
        });
      }
      hideContextMenu();
    });

    const thiss = this;

    logoutBtn?.addEventListener('click', async () => {
      try {
        const db = thiss?.database;
        const userUUID = profileMenu?.dataset?.uuid;
        if (!db || !userUUID) return;

        const account = await db.getAccount(userUUID);
        if (!account) return;

        const activeBefore = await db.getSelectedAccount();

        await db.deleteAccount(account.uuid);
        document.getElementById(account.uuid)?.remove();

        const remaining = await db.getAccounts();
        const wasActive = activeBefore && activeBefore.uuid === account.uuid;

        if (wasActive) {
          const next = remaining.find(a => a && a.uuid !== account.uuid);

          if (next) {
            await db.selectAccount(next.uuid);
            new Alert().ShowAlert({
              title: await window.getString("settings.sessionClosed"),
              text: `${await window.getString("accounts.accountDeletedSuccessfully")} ${await window.getString("settings.willRestartBattlyRecent")}`,
              icon: 'success'
            });
            setTimeout(() => {
              ipcRenderer.send('reload-app');
            }, 3000);
          } else {
            new Alert().ShowAlert({
              title: await window.getString("settings.hasLoggedOut"),
              text: await window.getString("settings.noMoreAccounts"),
              icon: 'success'
            });
            setTimeout(() => {
              ipcRenderer.send('reload-app');
            }, 3000);
          }
        } else {
          new Alert().ShowAlert({
            title: await window.getString("settings.sessionClosed"),
            text: `${await window.getString("accounts.accountDeletedSuccessfully")} ${await window.getString("settings.activeAccountMaintained")}`,
            icon: 'success'
          });
        }
      } catch (err) {
        window.getString("settings.errorClosingSession").then(msg => console.error(msg, err));
        new Alert().ShowAlert({
          title: await window.getString("errors.error"),
          text: await window.getString("settings.couldNotCloseSession"),
          icon: 'error'
        });
      }
    });

    function hideContextMenu() { if (profileMenu) profileMenu.style.display = 'none'; }

    function openProfileModal(uuid, username) {
      console.log('Abriendo perfil para:' + uuid + ' (' + username + ')');
      ensureProfileModal(uuid, username);
    }

    async function ensureProfileModal(uuid, username) {
      if (!username) return null;
      let modal = document.getElementById('profile-modal');
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = 'profile-modal';
      modal.className = 'modal is-active';
      modal.dataset.uuid = uuid;
      modal.dataset.username = username;
      modal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card" style="background:#0f1623;max-width:720px;width:95%;">
        <header class="modal-card-head" style="background:#0f1623;">
          <p class="modal-card-title" style="color:#fff;font-weight:700;">Perfil</p>
          <button class="delete" aria-label="close"></button>
        </header>
        <section class="modal-card-body" style="background:#0f1623; padding: 0px;">
          <div class="main-user-profile">
            <div class="main-user-profile-left">
              <canvas id="skin_container" data-engine="three.js r156" width="276" height="331"
                style="touch-action: none; width: 250px; height: 300px;"></canvas>
            </div>
            <div class="main-user-profile-right">
              <h1>${modal.dataset.username}</h1>
              <h2>CEO y desarrollador de Battly Launcher.</h2>
            </div>
          </div>
          <div class="main-user-secondary-profile">
            <div class="main-user-secondary-profile-comments-panel-invisible">
              <div>
                <h1 class="user-secondary-info-title">${await window.getString("settings.userUuid")}</h1>
                <h2 class="user-secondary-info-desc">${modal.dataset.uuid}</h2>
                <br>
                <h1 class="user-secondary-info-title">${await window.getString("settings.accountCreationDate")}</h1>
                <h2 class="user-secondary-info-desc">${await window.getString("settings.accountCreatedOn")} <span id="creation-time"></span></h2>
              </div>
            </div>
          </div>
        </section>
      </div>`;
      document.body.appendChild(modal);

      let skin_container = document.getElementById("skin_container");
      let mainUserProfile = document.querySelector(".main-user-profile");
      let skinViewer = new skinview3d.SkinViewer({
        canvas: skin_container,
        width: 250,
        height: 500,
        skin: `https://api.battlylauncher.com/api/skin/${encodeURIComponent(modal.dataset.username)}.png`,
        animation: new skinview3d.WalkingAnimation()
      });

      skinViewer.playerObject.rotateY(0.3);
      skinViewer.zoom = 0.8;

      skin_container.addEventListener("mouseover", () => {
        skinViewer.animation = new skinview3d.WaveAnimation;
        skinViewer.playerObject.rotateY(0.3);
      });
      skin_container.addEventListener("mouseout", () => {
        skinViewer.animation = new skinview3d.WalkingAnimation;
        skinViewer.playerObject.rotateY(0.3);
      });

      let opened = false;
      skin_container.addEventListener("click", () => {
        mainUserProfile.style.height = opened ? "300px" : "400px";
        opened = !opened;
      });

      const userBadge = 'verified' ?? null;
      const userTitle = document.querySelector(".main-user-profile-right h1");
      if (userBadge) {
        if (userBadge === "verified") {
          userTitle.innerHTML += `<div class="badge" style="background-image: url('./assets/img/verified.webp');">
          <span class="button-span">
            <h1><i class="fa-regular fa-circle-check"></i>Cuenta verificada</h1>
            <h2>Esta cuenta está verificada por el team de Battly</h2>
          </span>
        </div>`;
        }

      }

      const close = () => modal.remove();
      modal.querySelector('.modal-background').addEventListener('click', close);
      modal.querySelector('.delete').addEventListener('click', close);
      document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('is-active')) return;
        if (e.key === 'Escape') close();
      });

      return modal;
    }

    function openSkinCustomizer(uuid) {
      console.log('Abrir personalizador de skin para:', uuid);
    }

    let account = await this.database?.getSelectedAccount();
    let isPremium = account?.premium;
    if (isPremium) {
      document.getElementById("background-btn").style.display = "";
      document.getElementById("launchboost-panel").style.display = "block";
    } else {
      document.getElementById("background-btn").style.display = "none";
      document.getElementById("launchboost-panel").style.display = "none";
    }
  }


  async createInteractivePremiumTour() {
    const features = [
      {
        title: "🎉 ¡Felicidades!",
        subtitle: "Ahora eres usuario Premium de Battly",
        description: "Si estás leyendo esto es porque eres usuario Plus (premium) de Battly (o habrás usado truquitos para ver este mensaje). Ahora podrás disfrutar de todas tus ventajas en Battly como:",
        icon: "🎉",
        color: "#4ecdc4",
        animation: "bounce"
      },
      {
        title: "Fondo animado en Battly",
        subtitle: "Videos de fondo personalizados",
        description: "Exactamente, normalmente podías añadir una imagen de fondo, pero al ser premium podrás añadir un fondo animado (un video que se repite).",
        icon: "🎬",
        color: "#ff6b6b",
        animation: "fadeInUp",
        demo: "background"
      },
      {
        title: "Skins HD + Capas Custom",
        subtitle: "Personalización avanzada de tu avatar",
        description: "Normalmente, siendo usuario normal, sólo podías subir tu skin y elegir entre las 4 capas que te da Battly, pero ahora podrás añadir una skin HD y tu propia capa.",
        icon: "👤",
        color: "#95e1d3",
        animation: "fadeInLeft",
        demo: "skin"
      },
      {
        title: "Insignia única en Battly",
        subtitle: "Destaca en la comunidad",
        description: "Cuando acabes de leer esto, mira tu perfil, habrá aparecido un 👑, eso significa que eres premium.",
        icon: "👑",
        color: "#fce38a",
        animation: "fadeInRight",
        demo: "badge"
      },
      {
        title: "Rol en el servidor de Discord",
        subtitle: "Acceso exclusivo en Discord",
        description: "Si eres premium, tendrás un rol especial en el servidor de Discord de Battly.",
        icon: "💬",
        color: "#a8e6cf",
        animation: "fadeInDown",
        demo: "discord"
      }
    ];

    let currentStep = 0;

    const tourContainer = document.createElement('div');
    tourContainer.className = 'premium-tour-container';
    tourContainer.innerHTML = `
      <style>
        .premium-tour-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        .tour-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          width: 90%;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          transform: scale(0.8);
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .tour-card.active {
          transform: scale(1);
          opacity: 1;
        }

        .feature-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          display: block;
          animation: pulse 2s infinite;
        }

        .feature-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .feature-subtitle {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
          font-weight: 300;
        }

        .feature-description {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .tour-progress {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 30px;
        }

        .progress-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .progress-dot.active {
          background: #fff;
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
        }

        .tour-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .nav-button {
          padding: 12px 24px;
          border: none;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .nav-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .nav-button.primary {
          background: linear-gradient(45deg, #ff6b6b, #ee5a24);
          border: none;
        }

        .nav-button.primary:hover {
          background: linear-gradient(45deg, #ee5a24, #ff6b6b);
        }

        .demo-area {
          margin: 20px 0;
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 15px;
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .background-demo {
          width: 100%;
          height: 80px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 10px;
          position: relative;
          overflow: hidden;
        }

        .background-demo::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shine 2s infinite;
        }

        .skin-demo {
          width: 80px;
          height: 80px;
          background: #8b4513;
          border-radius: 10px;
          position: relative;
          margin: 0 auto;
          box-shadow: 0 0 20px rgba(139, 69, 19, 0.5);
        }

        .skin-demo::after {
          content: 'HD';
          position: absolute;
          top: -10px;
          right: -10px;
          background: #ff6b6b;
          color: white;
          padding: 2px 6px;
          border-radius: 5px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .badge-demo {
          font-size: 3rem;
          animation: glow 2s ease-in-out infinite alternate;
        }

        .discord-demo {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }

        .discord-logo {
          width: 40px;
          height: 40px;
          background: #5865f2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes glow {
          from { text-shadow: 0 0 10px #fce38a, 0 0 20px #fce38a, 0 0 30px #fce38a; }
          to { text-shadow: 0 0 20px #fce38a, 0 0 30px #fce38a, 0 0 40px #fce38a; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
          40%, 43% { transform: translate3d(0,-30px,0); }
          70% { transform: translate3d(0,-15px,0); }
          90% { transform: translate3d(0,-4px,0); }
        }
      </style>

      <div class="tour-card active">
        <div class="tour-progress">
          ${features.map((_, index) => `<div class="progress-dot ${index === 0 ? 'active' : ''}" data-step="${index}"></div>`).join('')}
        </div>

        <div class="feature-content">
          <span class="feature-icon">${features[0].icon}</span>
          <h1 class="feature-title">${features[0].title}</h1>
          <h2 class="feature-subtitle">${features[0].subtitle}</h2>
          <p class="feature-description">${features[0].description}</p>
          <div class="demo-area" id="demo-area" style="display: none;"></div>
        </div>

        <div class="tour-navigation">
          <button class="nav-button" id="prev-btn" disabled>Anterior</button>
          <button class="nav-button" id="skip-btn">Saltar Tour</button>
          <button class="nav-button primary" id="next-btn">Siguiente</button>
        </div>
      </div>
    `;

    document.body.appendChild(tourContainer);

    const tourCard = tourContainer.querySelector('.tour-card');
    const progressDots = tourContainer.querySelectorAll('.progress-dot');
    const featureIcon = tourContainer.querySelector('.feature-icon');
    const featureTitle = tourContainer.querySelector('.feature-title');
    const featureSubtitle = tourContainer.querySelector('.feature-subtitle');
    const featureDescription = tourContainer.querySelector('.feature-description');
    const demoArea = tourContainer.querySelector('#demo-area');
    const prevBtn = tourContainer.querySelector('#prev-btn');
    const nextBtn = tourContainer.querySelector('#next-btn');
    const skipBtn = tourContainer.querySelector('#skip-btn');

    const updateContent = async (step) => {
      const feature = features[step];

      tourCard.style.transform = 'scale(0.9)';
      tourCard.style.opacity = '0.7';

      setTimeout(() => {

        featureIcon.textContent = feature.icon;
        featureTitle.textContent = feature.title;
        featureSubtitle.textContent = feature.subtitle;
        featureDescription.textContent = feature.description;

        progressDots.forEach((dot, index) => {
          dot.classList.toggle('active', index === step);
        });

        prevBtn.disabled = step === 0;
        nextBtn.textContent = step === features.length - 1 ? 'Finalizar' : 'Siguiente';

        if (feature.demo) {
          demoArea.style.display = 'block';
          demoArea.innerHTML = getDemoContent(feature.demo);
        } else {
          demoArea.style.display = 'none';
        }

        tourCard.style.transform = 'scale(1)';
        tourCard.style.opacity = '1';

        featureIcon.style.animation = `${feature.animation || 'pulse'} 1s ease-out`;

      }, 200);
    };

    const getDemoContent = (demoType) => {
      switch (demoType) {
        case 'background':
          return '<div class="background-demo"></div>';
        case 'skin':
          return '<div class="skin-demo"></div>';
        case 'badge':
          return '<div class="badge-demo">👑</div>';
        case 'discord':
          return '<div class="discord-demo"><div class="discord-logo">D</div><span style="color: #fff;">Rol Premium</span></div>';
        default:
          return '';
      }
    };

    nextBtn.addEventListener('click', async () => {
      if (currentStep < features.length - 1) {
        currentStep++;
        await updateContent(currentStep);
      } else {

        tourContainer.style.transform = 'scale(0.8)';
        tourContainer.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(tourContainer);
        }, 500);
      }
    });

    prevBtn.addEventListener('click', async () => {
      if (currentStep > 0) {
        currentStep--;
        await updateContent(currentStep);
      }
    });

    skipBtn.addEventListener('click', () => {
      tourContainer.style.transform = 'scale(0.8)';
      tourContainer.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(tourContainer);
      }, 500);
    });

    progressDots.forEach((dot, index) => {
      dot.addEventListener('click', async () => {
        currentStep = index;
        await updateContent(currentStep);
      });
    });

    setTimeout(() => {
      tourCard.classList.add('active');
    }, 100);
  }

  async openProfileCustomizationModal(uuid) {
    const modal = document.getElementById('b-profile-customization-modal');
    const closeBtn = document.getElementById('b-profile-modal-close');
    const background = modal.querySelector('.modal-background');

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');

    const closeModal = () => {
      modal.classList.remove('is-active');
      modal.setAttribute('aria-hidden', 'true');
    };

    closeBtn.addEventListener('click', closeModal);
    background.addEventListener('click', closeModal);

    await this.initProfileCustomization(uuid);
  }

  async initProfileCustomization(uuid) {

    const baseURL = 'https://api.battlylauncher.com';

    const currentProfile = {
      borderColor: '#7289da',
      borderStyle: 'solid',
      borderWidth: 3,
      nameColor: '#ffffff',
      backgroundColor: '#2c2f33',
      backgroundImage: null,
      isPremium: false
    };

    let originalProfile = { ...currentProfile };
    const elements = {};

    const account = await this.database.getAccount(uuid);
    console.log('Cuenta para personalización:');
    console.log(account);
    if (!account) {
      console.error('Cuenta no encontrada');
      return;
    }

    const token = account.token || localStorage.getItem('battly_token');
    const username = account.name || localStorage.getItem('battly_username');
    const isPremium = account.premium || false;

    elements.tabs = {
      border: document.getElementById('custom-tab-border'),
      name: document.getElementById('custom-tab-name'),
      background: document.getElementById('custom-tab-background')
    };

    elements.sections = {
      border: document.getElementById('border-controls-section'),
      name: document.getElementById('name-controls-section'),
      background: document.getElementById('background-controls-section')
    };

    elements.borderColorPicker = document.getElementById('border-color-picker');
    elements.borderColorText = document.getElementById('border-color-text');
    elements.borderStyleSelect = document.getElementById('border-style-select');
    elements.borderWidthSlider = document.getElementById('border-width-slider');
    elements.borderWidthValue = document.getElementById('border-width-value');

    elements.nameColorPicker = document.getElementById('name-color-picker');
    elements.nameColorText = document.getElementById('name-color-text');

    elements.bgColorPicker = document.getElementById('bg-color-picker');
    elements.bgColorText = document.getElementById('bg-color-text');
    elements.bgImageInput = document.getElementById('bg-image-input');
    elements.bgImageLabel = document.getElementById('bg-image-label');

    elements.presetCards = document.querySelectorAll('.preset-card');

    elements.previewCard = document.getElementById('preview-card');
    elements.previewAvatar = document.getElementById('preview-avatar');
    elements.previewUsername = document.getElementById('preview-username');

    elements.saveBtn = document.getElementById('save-customization-btn');
    elements.resetBtn = document.getElementById('reset-customization-btn');
    elements.removeBgBtn = document.getElementById('remove-bg-btn');

    if (!elements.borderColorPicker) {
      console.warn('Elementos del modal no encontrados');
      return;
    }

    this.initNewModalFunctionality(elements, currentProfile);

    this.initProfileEventListeners(elements, currentProfile, originalProfile, baseURL, token, username);

    await this.loadUserProfile(elements, currentProfile, originalProfile, baseURL, token, username, isPremium, uuid);
  }

  initNewModalFunctionality(elements, currentProfile) {

    this.initTabFunctionality(elements);

    this.initPresetFunctionality(elements, currentProfile);

    this.switchToTab('border', elements);
  }

  initTabFunctionality(elements) {

    Object.keys(elements.tabs).forEach(tabKey => {
      const tabElement = elements.tabs[tabKey];
      if (tabElement) {
        tabElement.addEventListener('click', () => {
          this.switchToTab(tabKey, elements);
        });
      }
    });
  }

  switchToTab(tabKey, elements) {

    Object.values(elements.tabs).forEach(tab => {
      if (tab) tab.classList.remove('active');
    });

    Object.values(elements.sections).forEach(section => {
      if (section) section.classList.remove('active');
    });

    if (elements.tabs[tabKey]) {
      elements.tabs[tabKey].classList.add('active');
    }

    if (elements.sections[tabKey]) {
      elements.sections[tabKey].classList.add('active');
    }
  }

  initPresetFunctionality(elements, currentProfile) {

    const presets = {
      default: {
        borderColor: '#7289da',
        borderStyle: 'solid',
        borderWidth: 3,
        nameColor: '#ffffff',
        backgroundColor: '#2c2f33'
      },
      premium: {
        borderColor: '#ff6b6b',
        borderStyle: 'solid',
        borderWidth: 4,
        nameColor: '#fce38a',
        backgroundColor: '#1a1a1a'
      },
      neon: {
        borderColor: '#00ff88',
        borderStyle: 'solid',
        borderWidth: 3,
        nameColor: '#ff0080',
        backgroundColor: '#0a0a0a'
      },
      classic: {
        borderColor: '#ffffff',
        borderStyle: 'solid',
        borderWidth: 2,
        nameColor: '#ffffff',
        backgroundColor: '#36393f'
      },
      fire: {
        borderColor: '#ff4500',
        borderStyle: 'solid',
        borderWidth: 4,
        nameColor: '#ffd700',
        backgroundColor: '#2f1b14'
      },
      ice: {
        borderColor: '#00bfff',
        borderStyle: 'solid',
        borderWidth: 3,
        nameColor: '#e0ffff',
        backgroundColor: '#1e3a5f'
      }
    };

    elements.presetCards.forEach(card => {
      card.addEventListener('click', () => {
        const presetKey = card.dataset.preset;
        if (presets[presetKey]) {

          Object.assign(currentProfile, presets[presetKey]);

          this.applyProfileToUI(elements, currentProfile, 'https://api.battlylauncher.com');

          this.updatePreview(elements, currentProfile, 'https://api.battlylauncher.com');

          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.transform = 'scale(1)';
          }, 150);
        }
      });
    });
  }

  initProfileEventListeners(elements, currentProfile, originalProfile, baseURL, token, username) {

    elements.borderColorPicker.addEventListener('input', (e) => {
      currentProfile.borderColor = e.target.value;
      elements.borderColorText.value = e.target.value;
      this.updatePreview(elements, currentProfile, baseURL);
    });

    elements.borderColorText.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        currentProfile.borderColor = e.target.value;
        elements.borderColorPicker.value = e.target.value;
        this.updatePreview(elements, currentProfile, baseURL);
      }
    });

    elements.borderStyleSelect.addEventListener('change', (e) => {
      currentProfile.borderStyle = e.target.value;
      this.updatePreview(elements, currentProfile, baseURL);
    });

    const borderWidthSlider = elements.borderWidthSlider;
    if (borderWidthSlider) {

      borderWidthSlider.addEventListener('input', (e) => {
        currentProfile.borderWidth = parseInt(e.target.value);
        elements.borderWidthValue.textContent = e.target.value;
        this.updatePreview(elements, currentProfile, baseURL);
      });

      const minusBtn = borderWidthSlider.parentElement.querySelector('.slider-minus');
      const plusBtn = borderWidthSlider.parentElement.querySelector('.slider-plus');

      if (minusBtn) {
        minusBtn.addEventListener('click', () => {
          const currentValue = parseInt(borderWidthSlider.value);
          if (currentValue > 1) {
            borderWidthSlider.value = currentValue - 1;
            borderWidthSlider.dispatchEvent(new Event('input'));
          }
        });
      }

      if (plusBtn) {
        plusBtn.addEventListener('click', () => {
          const currentValue = parseInt(borderWidthSlider.value);
          if (currentValue < 10) {
            borderWidthSlider.value = currentValue + 1;
            borderWidthSlider.dispatchEvent(new Event('input'));
          }
        });
      }
    }

    elements.nameColorPicker.addEventListener('input', (e) => {
      currentProfile.nameColor = e.target.value;
      elements.nameColorText.value = e.target.value;
      this.updatePreview(elements, currentProfile, baseURL);
    });

    elements.nameColorText.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        currentProfile.nameColor = e.target.value;
        elements.nameColorPicker.value = e.target.value;
        this.updatePreview(elements, currentProfile, baseURL);
      }
    });

    elements.bgColorPicker.addEventListener('input', (e) => {
      currentProfile.backgroundColor = e.target.value;
      elements.bgColorText.value = e.target.value;
      this.updatePreview(elements, currentProfile, baseURL);
    });

    elements.bgColorText.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        currentProfile.backgroundColor = e.target.value;
        elements.bgColorPicker.value = e.target.value;
        this.updatePreview(elements, currentProfile, baseURL);
      }
    });

    elements.bgImageLabel.addEventListener('click', () => {
      if (!currentProfile.isPremium) {
        new Alert().ShowAlert({
          icon: 'warning',
          title: 'Solo usuarios Battly+',
          text: 'Solo usuarios Battly+ pueden usar imágenes de fondo'
        });
      } else {
        elements.bgImageInput.click();
      }
    });

    elements.bgImageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!currentProfile.isPremium) {
        new Alert().ShowAlert({
          icon: 'warning',
          title: 'Solo usuarios Battly+',
          text: 'Solo usuarios Battly+ pueden usar imágenes de fondo'
        });
        e.target.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        new Alert().ShowAlert({
          icon: 'error',
          title: 'Imagen demasiado grande',
          text: 'La imagen no puede superar los 5MB'
        });
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        currentProfile.backgroundImage = event.target.result;
        this.updatePreview(elements, currentProfile, baseURL);
      };
      reader.readAsDataURL(file);
    });

    elements.saveBtn.addEventListener('click', () => this.saveProfile(elements, currentProfile, originalProfile, baseURL, token, username));

    elements.resetBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres restaurar los valores originales?')) {
        Object.assign(currentProfile, originalProfile);
        this.applyProfileToUI(elements, currentProfile);
        this.updatePreview(elements, currentProfile, baseURL);
        elements.bgImageInput.value = '';
      }
    });

    elements.removeBgBtn.addEventListener('click', () => this.removeBackgroundImage(elements, currentProfile, baseURL, token));
  }


  async loadUserProfile(elements, currentProfile, originalProfile, baseURL, token, username, isPremium, uuid) {
    try {
      console.log('Usuario cargado:');
      console.log(username);
      console.log(isPremium);

      if (!token || !username) {
        console.error('No hay sesión activa');
        return;
      }

      const response = await fetch(`${baseURL}/api/v2/users/profile/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.status === 200 && data.profile) {
        Object.assign(currentProfile, {
          ...data.profile,
          isPremium: isPremium
        });
        Object.assign(originalProfile, currentProfile);
        this.applyProfileToUI(elements, currentProfile, baseURL);
        this.updatePreview(elements, currentProfile, baseURL);
        elements.previewUsername.textContent = data.profile.username || username;
        this.loadUserSkin(username, elements);
      } else {

        currentProfile.isPremium = isPremium;
        currentProfile.username = username;
        elements.previewUsername.textContent = username;
        this.loadUserSkin(username, elements);
        this.applyProfileToUI(elements, currentProfile, baseURL);
        this.updatePreview(elements, currentProfile, baseURL);
      }
    } catch (error) {
      console.error('Error al cargar perfil:');

      console.error(error);

      try {
        currentProfile.isPremium = isPremium;
        currentProfile.username = username;
        elements.previewUsername.textContent = username;
        elements.previewAvatar.textContent = username.charAt(0).toUpperCase();
        this.applyProfileToUI(elements, currentProfile, baseURL);
        this.updatePreview(elements, currentProfile, baseURL);
      } catch (e) {
        console.error('Error al cargar cuenta local:');
        console.error(e);
      }
    }
  }

  applyProfileToUI(elements, currentProfile, baseURL) {
    if (elements.borderColorPicker) elements.borderColorPicker.value = currentProfile.borderColor;
    if (elements.borderColorText) elements.borderColorText.value = currentProfile.borderColor;
    if (elements.borderStyleSelect) elements.borderStyleSelect.value = currentProfile.borderStyle;
    if (elements.borderWidthSlider) elements.borderWidthSlider.value = currentProfile.borderWidth;
    if (elements.borderWidthValue) elements.borderWidthValue.textContent = currentProfile.borderWidth;

    if (elements.nameColorPicker) elements.nameColorPicker.value = currentProfile.nameColor;
    if (elements.nameColorText) elements.nameColorText.value = currentProfile.nameColor;

    if (elements.bgColorPicker) elements.bgColorPicker.value = currentProfile.backgroundColor;
    if (elements.bgColorText) elements.bgColorText.value = currentProfile.backgroundColor;

    if (!currentProfile.isPremium) {
      if (elements.bgImageInput) elements.bgImageInput.disabled = true;
      if (elements.bgImageLabel) elements.bgImageLabel.classList.add('disabled');
      const premiumNotice = document.getElementById('premium-notice-bg');
      if (premiumNotice) premiumNotice.style.display = 'flex';
    } else {
      if (elements.bgImageInput) elements.bgImageInput.disabled = false;
      if (elements.bgImageLabel) elements.bgImageLabel.classList.remove('disabled');
      const premiumNotice = document.getElementById('premium-notice-bg');
      if (premiumNotice) premiumNotice.style.display = 'none';

      if (currentProfile.backgroundImage) {
        const currentBgPreview = document.getElementById('current-bg-preview');
        const currentBgImg = document.getElementById('current-bg-img');
        if (currentBgPreview) currentBgPreview.style.display = 'block';
        if (currentBgImg) currentBgImg.src = `${baseURL}${currentProfile.backgroundImage}`;
      }
    }
  }

  updatePreview(elements, currentProfile, baseURL) {

    if (currentProfile.borderColor && currentProfile.borderStyle && currentProfile.borderWidth) {
      if (elements.previewCard) elements.previewCard.style.border = `${currentProfile.borderWidth}px ${currentProfile.borderStyle} ${currentProfile.borderColor}`;
      if (elements.previewAvatar) elements.previewAvatar.style.border = `${currentProfile.borderWidth}px ${currentProfile.borderStyle} ${currentProfile.borderColor}`;
    }

    if (elements.previewUsername) elements.previewUsername.style.color = currentProfile.nameColor;

    if (currentProfile.backgroundColor) {
      if (elements.previewCard) elements.previewCard.style.backgroundColor = currentProfile.backgroundColor;
    }

    let bgUrl = null;
    if (currentProfile.backgroundImage && currentProfile.isPremium) {
      if (currentProfile.backgroundImage.startsWith('data:image')) {
        bgUrl = currentProfile.backgroundImage;
      } else if (currentProfile.backgroundImage.startsWith('http')) {
        bgUrl = currentProfile.backgroundImage;
      } else {
        if (currentProfile.backgroundImage.startsWith('/profile-backgrounds')) {
          bgUrl = `${baseURL}${currentProfile.backgroundImage}`;
        } else {
          bgUrl = currentProfile.backgroundImage;
        }
      }
    }
    if (bgUrl) {
      if (elements.previewCard) {
        elements.previewCard.style.backgroundImage = `url('${bgUrl}')`;
        elements.previewCard.style.backgroundSize = 'cover';
        elements.previewCard.style.backgroundPosition = 'center';
        elements.previewCard.style.backgroundRepeat = 'no-repeat';
      }
    } else {
      if (elements.previewCard) {
        elements.previewCard.style.backgroundImage = '';
        elements.previewCard.style.backgroundSize = '';
        elements.previewCard.style.backgroundPosition = '';
        elements.previewCard.style.backgroundRepeat = '';
      }
    }
  }

  async saveProfile(elements, currentProfile, originalProfile, baseURL, token, username) {
    try {
      elements.saveBtn.disabled = true;
      elements.saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

      if (elements.bgImageInput.files.length > 0 && currentProfile.isPremium) {
        const formData = new FormData();
        formData.append('background', elements.bgImageInput.files[0]);

        const uploadResponse = await fetch(`${baseURL}/api/v2/users/profile/upload-background`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadResponse.json();

        if (uploadData.status === 200) {
          currentProfile.backgroundImage = uploadData.imageUrl;
        } else {
          throw new Error(uploadData.message || 'Error al subir imagen');
        }
      }

      const response = await fetch(`${baseURL}/api/v2/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          borderColor: currentProfile.borderColor,
          borderStyle: currentProfile.borderStyle,
          borderWidth: currentProfile.borderWidth,
          nameColor: currentProfile.nameColor,
          backgroundColor: currentProfile.backgroundColor,
          backgroundImage: currentProfile.backgroundImage
        })
      });

      const data = await response.json();

      if (data.status === 200) {
        new Alert().ShowAlert({
          icon: 'success',
          title: 'Perfil actualizado',
          text: '✅ Perfil actualizado correctamente'
        });
        Object.assign(originalProfile, currentProfile);
        elements.bgImageInput.value = '';

        if (data.profile.backgroundImage) {
          currentProfile.backgroundImage = `${baseURL}${data.profile.backgroundImage}`;
          document.getElementById('current-bg-preview').style.display = 'block';
          document.getElementById('current-bg-img').src = currentProfile.backgroundImage;
        }
        this.updatePreview(elements, currentProfile, baseURL);
      } else {
        throw new Error(data.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      new Alert().ShowAlert({
        icon: 'error',
        title: 'Error al guardar',
        text: '❌ Error al guardar los cambios: ' + error.message
      });
    } finally {
      elements.saveBtn.disabled = false;
      const saveText = await window.getString('settings.save');
      elements.saveBtn.innerHTML = `<i class="fa-solid fa-save"></i> ${saveText}`;
    }
  }

  async removeBackgroundImage(elements, currentProfile, baseURL, token) {
    const confirmDelete = await new Alert().ShowAlert({
      icon: 'warning',
      title: '¿Eliminar imagen de fondo?',
      text: '¿Estás seguro de que quieres eliminar la imagen de fondo?',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmDelete.isConfirmed) return;

    try {
      const response = await fetch(`${baseURL}/api/v2/users/profile/background`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.status === 200) {
        currentProfile.backgroundImage = null;
        document.getElementById('current-bg-preview').style.display = 'none';
        this.updatePreview(elements, currentProfile, baseURL);
        alert('✅ Imagen eliminada correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      new Alert().ShowAlert({
        icon: 'error',
        title: 'Error',
        text: '❌ Error al eliminar la imagen'
      });
    }
  }

  loadUserSkin(username, elements) {
    if (!username || !elements.previewAvatar) return;

    const skinUrl = `https://api.battlylauncher.com/api/skin/${encodeURIComponent(username)}.png`;

    elements.previewAvatar.style.backgroundImage = `url('${skinUrl}')`;
  }


}
export default Settings;
