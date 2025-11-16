"use strict";

console.time("🕐 LoadHomeImports")
import { logger, database, changePanel } from "../utils.js";

const { StringLoader } = require("./assets/js/utils/stringLoader.js");

const { ipcRenderer, ipcMain, shell } = require("electron");


import { LoadAPI } from "../utils/loadAPI.js";
import { CrashReport } from "../utils/crash-report.js";
import { LoadMinecraft } from "../utils/load-minecraft.js";
import { Download } from "../utils/home/download.js";
import { Instances } from "../utils/instances.js";
const { getValue, setValue } = require('./assets/js/utils/storage');


const fetch = require("node-fetch");

const fs = require("fs");
const path = require("path");

const dataDirectory =
    process.env.APPDATA ||
    (process.platform == "darwin"
        ? `${process.env.HOME}/Library/Application Support`
        : process.env.HOME);

let logFilePath = `${dataDirectory}/.battly/Registro.log`;
import { consoleOutput } from "../utils/logger.js";
let consoleOutput_;

import { Alert } from "../utils/alert.js";


const ShowCrashReport = new CrashReport().ShowCrashReport;
const LaunchMinecraft = new LoadMinecraft().LaunchMinecraft;
const DownloadFiles = new LoadMinecraft().DownloadFiles;
const InstancesClass = new Instances().Instancias;

import { AskModal } from '../utils/askModal.js';
const modal = new AskModal();


console.timeEnd("🕐 LoadHomeImports")
class Home {
    static id = "home";
    async init(config, news) {
        console.time("🕐 HomePanelInit");

        if (!window.stringLoader) {
            window.stringLoader = new StringLoader();
        }
        await window.stringLoader.loadStrings();

        console.time("🌐 Load API Data");
        const [battlyConfig, versions, versionsMojang, db] = await Promise.all([
            new LoadAPI().GetConfig(),
            new LoadAPI().GetVersions(),
            new LoadAPI().GetVersionsMojang(),
            new database().init()
        ]);
        console.timeEnd("🌐 Load API Data");

        this.BattlyConfig = battlyConfig;
        this.Versions = versions;
        this.VersionsMojang = versionsMojang;
        this.database = db;

        console.time("⏳ Wait Data");
        this.WaitData();
        console.timeEnd("⏳ Wait Data");

        this.config = config;
        this.news = await news;

        console.time("📰 Show News");
        this.ShowNews();
        console.timeEnd("📰 Show News");

        console.time("🔄 Background Sync");
        console.timeEnd("🔄 Background Sync");

        console.time("📰 Init News");
        this.initNews();
        console.timeEnd("📰 Init News");

        console.time("🌐 Init Server Status");
        this.initStatusServer();
        console.timeEnd("🌐 Init Server Status");

        console.time("🎛 Init Buttons");
        this.initBtn();
        console.timeEnd("🎛 Init Buttons");

        console.time("📂 Load Mods");
        this.CargarMods();
        console.timeEnd("📂 Load Mods");

        console.time("🎮 Init Discord State");
        this.IniciarEstadoDiscord();
        console.timeEnd("🎮 Init Discord State");

        console.time("⚙ Init Config");
        this.initConfig();
        console.timeEnd("⚙ Init Config");

        console.time("🎨 Init Theme");
        this.InitTheme();
        console.timeEnd("🎨 Init Theme");

        console.time("📜 Get Logs Socket");
        this.GetLogsSocket();
        console.timeEnd("📜 Get Logs Socket");

        console.time("🔧 Change Java Path");
        this.CambiarRutaJava();
        console.timeEnd("🔧 Change Java Path");

        console.time("📜 Generate Logs Socket");
        this.GenerarLogsSocket();
        console.timeEnd("📜 Generate Logs Socket");

        console.time("📶 Set Status");
        this.SetStatus();
        console.timeEnd("📶 Set Status");

        console.time("📡 Requests");
        this.Solicitudes();
        console.timeEnd("📡 Requests");

        console.time("📢 Ads");
        console.timeEnd("📢 Ads");

        console.time("📖 InstancesClass");
        InstancesClass();
        console.timeEnd("📖 InstancesClass");

        console.time("📖 Tutorial");
        this.InitTutorialAfterNews();
        console.timeEnd("📖 Tutorial");

        console.log("Home panel initialized");
        console.timeEnd("🕐 HomePanelInit");

        this.addEventListenerButtonsSound();

        this.HandlePlayPanel();

        this.LoadAnalytics();

        this.BattlySavesCloud();

        this.syncBackupHistoryOnInit();
    }


    async LoadAnalytics() {



        const Store = require('electron-store');
        const store = new Store({ name: 'battly-data' });
        const SERVICE = 'Battly Launcher';


        async function migrateAllLocalStorageSecure() {
            console.log('🔄 Iniciando migración segura de localStorage → electron-store');

            const store = new Store({
                name: 'battly-data',
            });

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                let raw = await localStorage.getItem(key);
                let val;
                try {
                    val = JSON.parse(raw);
                } catch {
                    val = raw;
                }
                store.set(key, val);
                console.log(`  • Migrada la clave "${key}"`);
            }
        }
    }



    async LaunchDownloadedVersion(versionData) {
        console.log("🚀 Iniciando LaunchDownloadedVersion con datos:");
        console.log(versionData);

        async function getVersionAssets(version) {
            const versionFile = `${dataDirectory}/.battly/versions/${version}/${version}.json`;
            if (!fs.existsSync(versionFile)) return null;

            const versionData = JSON.parse(fs.readFileSync(versionFile, "utf-8"));
            if (version.toLowerCase().includes("optifine")) return versionData.inheritsFrom;
            return versionData.assets ? versionData.assets : null;
        }

        let version = versionData.version;
        let isExtra = versionData.isExtra;
        let loader = versionData.loader;
        let loaderEnabled = loader ? true : false;
        let selectedAccount = await this.database.getSelectedAccount();

        const pkg = require("../package.json");
        let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
        let ram = (await this.database.get("1234", "ram")).value;
        const gameUrl = this.config.game_url || `${urlpkg}/files`;
        const rootPath = `${dataDirectory}/.battly`;
        const memory = { min: `${ram.ramMin * 1024}M`, max: `${ram.ramMax * 1024}M` };

        const JVM_ARGS = [
            "-javaagent:authlib-injector.jar=https://api.battlylauncher.com",
            "-Dauthlibinjector.mojangAntiFeatures=enabled",
            "-Dauthlibinjector.noShowServerName",
            "-Dauthlibinjector.disableHttpd",
        ];

        if (!isExtra) {
            const opts = {
                url: gameUrl,
                authenticator: selectedAccount,
                detached: false,
                timeout: 10000,
                path: rootPath,
                downloadFileMultiple: 40,
                version: version,
                loader: {
                    type: loader,
                    build: this.BattlyConfig.loader.build,
                    enable: loader === "vanilla" ? false : loaderEnabled,
                },
                verify: false,
                ignored: selectedAccount.type === "microsoft" ? ["libraries/com/mojang/authlib"] : [],
                java: false,
                memory: memory,
                beforeLaunch: this.BattlyConfig.beforeLaunch,
                JVM_ARGS: selectedAccount.type === "battly" ? JVM_ARGS : [],
            };

            console.log("Opciones de lanzamiento:");
            console.log(opts);

            const { Launch } = require("./assets/js/libs/mc/Index");
            const Launcher = new Launch();

            await Launcher.Launch(opts);

            Launcher.on("progress", (progress) => {
                console.log("Progress: ", progress);
            });

            Launcher.on("error", (error) => {
                console.error("Error: ", error);
                ShowCrashReport(error);
            });

            let dataEvent = false;
            Launcher.on("data", async (data) => {
                new logger("Minecraft", "#36b030");
                if (!dataEvent) {
                    document.getElementById("launching-mc-modal-status-container-files").querySelector("i").classList.remove("fa-sync");
                    document.getElementById("launching-mc-modal-status-container-files").querySelector("i").classList.remove("fa-spin");
                    document.getElementById("launching-mc-modal-status-container-files").querySelector("i").classList.add("fa-check");
                    let launcherSettings = (await this.database.get("1234", "launcher")).value;
                    ipcRenderer.send("main-window-hide", { shouldHideLauncher: launcherSettings.launcher.close === "close-launcher" });
                    dataEvent = true;

                    await setValue('lastMinecraftLaunch', {
                        timestamp: Date.now(),
                        version: versionData.id || versionData.version
                    });
                }

                if (data.includes("Setting user")) {
                    const launchingModal = document.getElementById("launching-modal");
                    if (launchingModal) {
                        launchingModal.remove();
                    }
                }
            });

            Launcher.on("close", async (code) => {
                console.log("Launcher closed with code:");
                console.log(code);
                new logger("Launcher", "#3e8ed0");

                let launcherSettings = (await this.database.get("1234", "launcher")).value;
                if (launcherSettings.launcher.close === "close-launcher") ipcRenderer.send("main-window-show");
            });

        } else {
            const assetsVersion = await getVersionAssets(versionData.customVersion);

            if (!assetsVersion) {
                console.error(`Error: No se pudo obtener la versión base de la versión extra: ${versionData.customVersion}`);
                return;
            }

            let runtimePath = `${dataDirectory}/.battly/runtime`;
            let selectecJavaPath;
            let selectedRuntimeVersion = versionData.requiredJavaVersion;

            console.log(`🔎 Intentando buscar la versión de Java`);
            if (!selectedRuntimeVersion) {
                console.log(`⚠️ No se encontró la versión de Java requerida, buscando la versión por defecto...`);
                const localStoragejavaPath = await getValue("java-path");
                if (localStoragejavaPath) {
                    console.log(`✅ Se encontró la ruta de Java en el almacenamiento local: ${localStoragejavaPath}`);
                    selectecJavaPath = localStoragejavaPath;
                } else {
                    console.log(`⚠️ No se encontró la ruta de Java en el almacenamiento local, buscando la versión por defecto...`);
                    const javaPriority = ["jre-8", "jre-17", "jre-11", "jre-16", "jre-21"];
                    const folders = fs.readdirSync(runtimePath);

                    for (const javaVersion of javaPriority) {
                        for (const folder of folders) {
                            if (folder.includes(javaVersion)) {
                                selectecJavaPath = `${runtimePath}/${folder}/bin/java${process.platform === "win32" ? ".exe" : ""}`;
                                console.log(`✅ Se encontró la ruta de Java ${javaVersion.replace("jre-", "")}. Se intentará iniciar Minecraft con esta versión`);
                                break;
                            }
                        }
                        if (selectecJavaPath) break;
                    }
                }
            } else {
                console.log(`🔎 Se encontró la versión de Java requerida: ${selectedRuntimeVersion}`);
                fs.readdirSync(runtimePath).forEach((folder) => {
                    if (folder.includes(selectedRuntimeVersion)) {
                        selectecJavaPath = `${runtimePath}/${folder}/bin/java${process.platform === "win32" ? ".exe" : ""}`;
                        console.log(`✅ Se encontró la ruta de Java ${selectedRuntimeVersion}. Se intentará iniciar Minecraft con esta versión`);
                    }
                });
            }

            const opts = {
                authorization: selectedAccount,
                root: rootPath,
                version: {
                    number: assetsVersion,
                    custom: versionData.customVersion,
                    type: "release"
                },
                memory: {
                    max: `${memory.max}`,
                    min: `${memory.min}`
                },
                javaPath: selectecJavaPath,
            };

            console.log("Opciones de lanzamiento:");
            console.log(opts);

            const { Client } = require('minecraft-launcher-core');
            const launcher = new Client();

            launcher.launch(opts);

            let dataEvent = false;
            launcher.on('debug', (e) => {

                if (e.includes("Launching with arguments")) {
                    document.getElementById("launching-mc-modal-status-container-files").querySelector("i").classList.remove("fa-sync");
                    document.getElementById("launching-mc-modal-status-container-files").querySelector("i").classList.remove("fa-spin");
                    document.getElementById("launching-mc-modal-status-container-files").querySelector("i").classList.add("fa-check");
                    dataEvent = true;
                }

                console.log(e)

            });
            launcher.on('data', async (e) => {
                if (e.includes("Setting user")) {
                    const launchingModal = document.getElementById("launching-modal");
                    if (launchingModal) {
                        launchingModal.remove();
                    }

                    let launcherSettings = (await this.database.get("1234", "launcher")).value;
                    ipcRenderer.send("main-window-hide", { shouldHideLauncher: launcherSettings.launcher.close === "close-launcher" });
                }

                console.log(e)
            });

            launcher.on('close', async (code) => {
                console.log("🎮 Minecraft cerrado con código:", code);

                await this.trackPlayedWorlds();

                let launcherSettings = (await this.database.get("1234", "launcher")).value;
                if (launcherSettings.launcher.close === "close-launcher") ipcRenderer.send("main-window-show");

                const autoSyncEnabled = await getValue('autoSyncEnabled');
                console.log("🔍 Estado de autoSyncEnabled:", autoSyncEnabled);

                if (autoSyncEnabled) {
                    console.log('🔄 Iniciando sincronización automática en segundo plano...');
                    this.startAutoBackupOnGameClose().catch(err => {
                        console.error('❌ Error en sincronización automática:', err);
                    });
                } else {
                    console.log('⏸️ Sincronización automática desactivada. No se realizará backup.');
                }
            });
        }
    }


    async HandlePlayPanel() {
        const thiss = this;

        function getLoaderOptionsHTML() {
            const loaders = [
                { id: "vanilla", icon: "minecraft.png", title: "Vanilla", desc: "La versión original de Minecraft. Sin modificaciones." },
                { id: "fabric", icon: "fabric.png", title: "Fabric", desc: "Un modloader ligero y fácil de usar para mods." },
                { id: "forge", icon: "forge.png", title: "Forge", desc: "El modloader más popular; gran cantidad de mods." },
                { id: "quilt", icon: "quilt.png", title: "Quilt", desc: "Modloader experimental para Minecraft, moderno y compatible." },
                { id: "legacyfabric", icon: "legacyfabric.png", title: "LegacyFabric", desc: "La versión legacy de Fabric para Minecraft antiguas." },
                { id: "neoforge", icon: "neoforge.png", title: "NeoForge", desc: "Modloader moderno y ligero, versión moderna de Forge." }
            ];
            return loaders
                .map(loader => `
            <div class="loader-option" data-loader="${loader.id}" id="playLoaderType-${loader.id}">
              <img src="./assets/images/icons/${loader.icon}" alt="">
              <span class="button-span">
                <h1>${loader.title}</h1>
                <h2>${loader.desc}</h2>
              </span>
            </div>
          `)
                .join("");
        }

        function formatVersion(version = "") {
            if (!version) return "";

            if (/optifine/i.test(version)) {
                return version.replace(/-?optifine.*$/i, "-OptiFine");
            }

            const suffixes = [
                "forge",
                "fabric",
                "quilt",
                "legacyfabric",
                "neoforge",
            ];

            for (const suffix of suffixes) {
                if (new RegExp(suffix, "i").test(version)) {
                    return version.replace(new RegExp(`[\\s-]*${suffix}`, "i"), "").trim();
                }
            }

            return version;
        }

        function getCompatibleLoaders(version) {
            if (!version) return [];

            const { versions } = thiss.Versions;
            const suffixMap = {
                "-forge": "forge",
                "-fabric": "fabric",
                "-quilt": "quilt",
                "-neoforge": "neoforge",
                "-legacyfabric": "legacyfabric",
            };

            const loaders = new Set();

            versions
                .filter(v => v.realVersion === version)
                .forEach(v => {
                    for (const [suffix, loader] of Object.entries(suffixMap)) {
                        if (v.version.endsWith(suffix)) {
                            loaders.add(loader);
                            break;
                        }
                    }
                });

            return Array.from(loaders);
        }

        function setVersionsInSelect(selectElement) {
            if (!selectElement) return;

            const { versions } = thiss.Versions;
            const localVersions = fs.readdirSync(`${dataDirectory}/.battly/versions`);

            const fragment = document.createDocumentFragment();

            localVersions.forEach((version) => {
                const option = document.createElement("option");
                option.value = version;
                option.innerText = version;
                option.dataset.isExtra = "true";

                const exactMatch = versions.find(v => v.realVersion === version);
                if (exactMatch) {
                    delete option.dataset.isExtra;
                    option.value = exactMatch.realVersion;
                    option.innerText = exactMatch.realVersion;
                    fragment.appendChild(option);
                    return;
                }

                if (/optifine/i.test(version)) {
                    const [base] = version.split("-");
                    const ofMatch = versions.find(v => v.version === `${base}-optifine`);
                    if (ofMatch?.requiredJavaVersion) {
                        option.dataset.requiredJavaVersion = ofMatch.requiredJavaVersion;
                    }
                    fragment.appendChild(option);
                    return;
                }

                const folderMatch = versions.find(v => v.folderName === version);
                if (folderMatch?.requiredJavaVersion) {
                    option.dataset.requiredJavaVersion = folderMatch.requiredJavaVersion ?? "jre-17";
                }

                fragment.appendChild(option);
            });

            selectElement.appendChild(fragment);
        }

        function getLoaderIcon(version) {
            const icons = {
                optifine: "optifine.png",
                neoforge: "neoforge.png",
                legacyfabric: "legacyfabric.png",
                forge: "forge.png",
                fabric: "fabric.png",
                quilt: "quilt.png",
                "battly client": "battly.png",
                cmpack: "cmpack.png",
                ares: "ares.png",
                batmod: "batmod.png"
            };
            const lower = version.toLowerCase();
            for (let key in icons) {
                if (lower.includes(key)) return `https://battlylauncher.com/assets/img/battlylauncher/${icons[key]}`;
            }
            return "https://battlylauncher.com/assets/img/battlylauncher/minecraft.png";
        }

        function formatDate(isoDate) {
            const date = new Date(isoDate);
            const now = new Date();
            const opts = { hour: "2-digit", minute: "2-digit" };
            if (date.toDateString() === now.toDateString()) {
                return `Hoy a las ${date.toLocaleTimeString("es-ES", opts)}`;
            }
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return `Ayer a las ${date.toLocaleTimeString("es-ES", opts)}`;
            }
            return date.toLocaleDateString("es-ES", { day: "2-digit", month: "long" }) +
                ` a las ${date.toLocaleTimeString("es-ES", opts)}`;
        }

        async function createRecentVersionsList() {
            const latest3Versions = await getValue("latest3Versions") || [];
            const container = document.createElement("div");
            container.classList.add("recent-versions-list");

            latest3Versions.forEach(({ version, dateOpened, isExtra, requiredJavaVersion, customVersion }) => {
                const formattedVersion = formatVersion(isExtra === "true" ? customVersion : version);
                const versionItem = document.createElement("div");
                versionItem.classList.add("recent-version-item");
                versionItem.dataset.version = version;
                versionItem.dataset.isExtra = isExtra;
                versionItem.dataset.requiredJavaVersion = requiredJavaVersion || '';
                versionItem.dataset.customVersion = customVersion || '';
                versionItem.innerHTML = `
            <div class="version-item">
              <div class="version-item-info">
                <div class="version-item-icon">
                  <img src="${getLoaderIcon(isExtra === "true" ? customVersion : version)}" alt="">
                </div>
                <div class="version-item-name">
                  <h1 data-raw-version="${isExtra === "true" ? customVersion : version}">${formattedVersion}</h1>
                  <h2>${formatDate(dateOpened)}</h2>
                </div>
              </div>
              <button class="button is-info is-outlined start-version-button">
                <span><i class="fas fa-play"></i></span>
              </button>
            </div>
          `;
                container.appendChild(versionItem);
            });
            return container;
        }

        const playButton = document.getElementById("play-btn");
        playButton.addEventListener("click", async () => {
            const playModal = document.createElement("div");
            playModal.classList.add("modal", "is-active");
            playModal.id = "start-version-modal";
            playModal.innerHTML = `
          <div class="modal-background"></div>
          <div class="modal-card modal-animated w60">
            <section class="modal-card-body start-version-mod-modal-card-body">
              <div style="display: flex; justify-content: space-between;">
                <h1 class="h1-start-version-title">${await window.getString('game.startMinecraft')}</h1>
                <button class="delete" id="close-modal-start-btn" aria-label="close"></button>
              </div>
              <br><br>
              <div class="flexed-start-verion-div">
                <div class="recent-versions">
                  <h1 class="h1-start-version-title">${await window.getString('game.recentVersions')}</h1>
                  ${(await createRecentVersionsList()).outerHTML}
                </div>
                <div class="start-version">
                  <h1 class="h1-start-version-title">${await window.getString('game.selectVersion')}</h1>
                  <div class="select is-info modded-play-select">
                    <select id="version-select">
                      <option value="">${await window.getString('game.chooseVersion')}</option>
                    </select>
                  </div>
                  <br><br>
                  <div class="start-version-loaders">
                    ${getLoaderOptionsHTML()}
                  </div>
                  <br><br>
                  <div style="display: flex; justify-content: space-between; align-items: center;" id="footermodaliniciarversion">
                    <p style="color: #fff; display: none;" id="versionYouAreStartingMain">
                      ${await window.getString('homePanel.startingVersion') || 'You will start version:'} <span id="versionYouAreStarting"></span>
                    </p>
                    <button class="styled-start-version-btn" id="start-game-btn" style="display: none;">
                      <div class="svg-wrapper-1">
                        <div class="svg-wrapper">
                          <i class="fa-solid fa-gamepad"></i>
                        </div>
                      </div>
                      <span>${await window.getString('homePanel.play') || 'Play'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>`;

            document.body.appendChild(playModal);

            playModal.querySelector("#close-modal-start-btn")
                .addEventListener("click", () => playModal.remove());

            playModal.querySelectorAll('.start-version-button').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.recent-version-item');
                    const version = item.dataset.version;
                    const customVersion = item.dataset.customVersion;
                    const extra = item.dataset.isExtra === 'true';
                    const reqJava = item.dataset.requiredJavaVersion;

                    let loader;
                    if (version.endsWith("-forge") || version.endsWith("-fabric") ||
                        version.endsWith("-quilt") || version.endsWith("-neoforge") ||
                        version.endsWith("-legacyfabric")) {
                        loader = version.split("-").pop();
                    }

                    const baseVersion = extra ? customVersion : version.replace(/-?(vanilla|forge|fabric|quilt|neoforge|legacyfabric)$/, "");
                    const formattedVersion = baseVersion + (loader ? `-${loader}` : "");

                    const uniqueId = extra ? customVersion : `${baseVersion}-${loader || 'vanilla'}`;
                    let latest3Versions = await getValue("latest3Versions") || [];

                    latest3Versions = latest3Versions.filter(entry => entry.uniqueId !== uniqueId);

                    latest3Versions.unshift({
                        uniqueId: uniqueId,
                        version: version,
                        dateOpened: new Date().toISOString(),
                        isExtra: String(extra),
                        requiredJavaVersion: reqJava,
                        customVersion: customVersion
                    });

                    latest3Versions = latest3Versions.slice(0, 3);
                    await setValue("latest3Versions", latest3Versions);

                    const launchingModal = document.createElement("div");
                    launchingModal.classList.add("modal", "is-active");
                    launchingModal.id = "launching-modal";
                    launchingModal.innerHTML = `
                        <div class="modal-background"></div>
                        <div class="modal-card launching-mc-modal">
                            <h1>Minecraft está iniciando...</h1>
                            <div class="launching-mc-modal-status-containers">
                                <div class="launching-mc-modal-status-container" id="launching-mc-modal-status-container-files">
                                    <p>Comprobando archivos...</p>
                                    <i class="fas fa-sync fa-spin"></i>
                                </div>
                                <div class="launching-mc-modal-status-container" id="launching-mc-modal-status-container-launcher">
                                    <p>Iniciando Minecraft...</p>
                                    <i class="fas fa-sync fa-spin"></i>
                                </div>
                            </div>
                        </div>
                        `;

                    document.body.appendChild(launchingModal);
                    playModal.remove();

                    launchingModal.querySelector(".modal-background").addEventListener("click", () => {
                        launchingModal.classList.remove("is-active");
                    });

                    thiss.LaunchDownloadedVersion({
                        version: baseVersion,
                        loader: loader,
                        isExtra: extra,
                        requiredJavaVersion: reqJava,
                        customVersion: customVersion
                    });
                });
            });


            const versionSelect = playModal.querySelector("#version-select");
            const startGameBtn = playModal.querySelector("#start-game-btn");
            const versionLabel = playModal.querySelector("#versionYouAreStarting");
            const versionMainText = playModal.querySelector("#versionYouAreStartingMain");
            const loadersWrapper = playModal.querySelector(".start-version-loaders");
            setVersionsInSelect(versionSelect);

            function resetLoaderState() {
                playModal.querySelectorAll(".loader-option").forEach(opt => {
                    opt.classList.remove("selected-loader");
                    opt.style.display = "none";
                });
                startGameBtn.style.display = "none";
                delete startGameBtn.dataset.loader;
            }

            versionSelect.addEventListener("change", async (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const selectedVersion = e.target.value;
                const isExtra = selectedOption.dataset.isExtra === "true";
                const requiredJava = selectedOption.dataset.requiredJavaVersion || "";
                const customVersion = selectedVersion;

                resetLoaderState();
                versionLabel.textContent = selectedVersion || "";
                versionMainText.style.display = selectedVersion ? "" : "none";
                startGameBtn.dataset.version = selectedVersion;
                startGameBtn.dataset.isExtra = isExtra;
                startGameBtn.dataset.requiredJavaVersion = requiredJava;

                if (!selectedVersion) return;

                if (isExtra || /optifine/i.test(selectedVersion)) {
                    loadersWrapper.style.display = "none";
                    startGameBtn.style.display = "flex";
                    return;
                }

                const compatibleLoaders = ["vanilla", ...getCompatibleLoaders(selectedVersion)];

                loadersWrapper.style.display = "flex";
                compatibleLoaders.forEach(loader => {
                    const opt = playModal.querySelector(`#playLoaderType-${loader}`);
                    if (opt) opt.style.display = "flex";
                });
            });

            playModal.querySelectorAll(".loader-option").forEach(opt => {
                opt.addEventListener("click", () => {
                    const loaderId = opt.dataset.loader;
                    const loaderTxt = opt.querySelector("h1")?.innerText || "";

                    const selVersion = startGameBtn.dataset.version;
                    if (!selVersion) return;

                    const isExtraOrOptiFine = startGameBtn.dataset.isExtra === "true" ||
                        /optifine/i.test(selVersion);
                    if (isExtraOrOptiFine) return;

                    playModal.querySelectorAll(".loader-option")
                        .forEach(o => o.classList.toggle("selected-loader", o === opt));

                    startGameBtn.style.display = "flex";
                    startGameBtn.dataset.loader = loaderId;

                    versionLabel.textContent = `${formatVersion(selVersion)} ${loaderTxt}`;
                });
            });

            async function getVersionAssets(version) {
                const versionFile = `${dataDirectory}/.battly/versions/${version}/${version}.json`;
                if (!fs.existsSync(versionFile)) return null;

                const versionData = JSON.parse(fs.readFileSync(versionFile, "utf-8"));
                if (version.toLowerCase().includes("optifine")) return versionData.inheritsFrom;
                return versionData.assets ? versionData.assets : null;
            }

            startGameBtn.addEventListener("click", async () => {
                const { version, loader, isExtra, requiredJavaVersion } = startGameBtn.dataset;

                const formattedBaseVersion = isExtra === "true" ? await getVersionAssets(version) : version;
                const customVersion = isExtra === "true" ? version : '';

                const uniqueId = isExtra === "true" ? customVersion : `${version}-${loader || 'vanilla'}`;
                let latest3Versions = await getValue("latest3Versions") || [];

                latest3Versions = latest3Versions.filter(entry => entry.uniqueId !== uniqueId);

                latest3Versions.unshift({
                    uniqueId: uniqueId,
                    version: formattedBaseVersion,
                    dateOpened: new Date().toISOString(),
                    isExtra: isExtra,
                    requiredJavaVersion: requiredJavaVersion,
                    customVersion: customVersion
                });

                latest3Versions = latest3Versions.slice(0, 3);
                await setValue("latest3Versions", latest3Versions);

                thiss.LaunchDownloadedVersion({
                    version: formattedBaseVersion,
                    loader: loader,
                    isExtra: isExtra === "true",
                    requiredJavaVersion: requiredJavaVersion,
                    customVersion: version,
                });

                const launchingModal = document.createElement("div");
                launchingModal.classList.add("modal", "is-active");
                launchingModal.id = "launching-modal";
                launchingModal.innerHTML = `
                    <div class="modal-background"></div>
                    <div class="modal-card launching-mc-modal">
                        <h1>Minecraft está iniciando...</h1>
                        <div class="launching-mc-modal-status-containers">
                            <div class="launching-mc-modal-status-container" id="launching-mc-modal-status-container-files">
                                <p>Comprobando archivos...</p>
                                <i class="fas fa-sync fa-spin"></i>
                            </div>
                            <div class="launching-mc-modal-status-container" id="launching-mc-modal-status-container-launcher">
                                <p>Iniciando Minecraft...</p>
                                <i class="fas fa-sync fa-spin"></i>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(launchingModal);
                launchingModal.querySelector(".modal-background").addEventListener("click", () => {
                    launchingModal.classList.remove("is-active");
                });

                const playModal = document.getElementById("start-version-modal");
                if (playModal) playModal.remove();
            });

        });
    }




    startBackgroundSync() {
        const { syncGoogleDrive } = require('./assets/js/utils/syncGoogleDrive');
        syncGoogleDrive().then(() => {
            console.log('Sync completed');
        }).catch((error) => {
            console.error('Sync failed:', error);
        });
    }

    async InitTutorialAfterNews() {
        // Check if news have been viewed AND user is logged in before showing tutorial
        const checkNewsViewedAndUserLogged = async () => {
            const newsShown = await getValue("news_shown_v3.0");
            const selectedAccount = await getValue("selected-account");

            // If news haven't been shown yet, wait and check again
            if (!newsShown || newsShown === "false" || newsShown === null || newsShown === undefined) {
                setTimeout(checkNewsViewedAndUserLogged, 1000); // Check every second
                return;
            }

            // If user is not logged in, wait and check again
            if (!selectedAccount || selectedAccount === null || selectedAccount === undefined) {
                setTimeout(checkNewsViewedAndUserLogged, 1000); // Check every second
                return;
            }

            // News have been viewed and user is logged in, now show tutorial
            this.Tutorial();
        };

        // Start checking
        checkNewsViewedAndUserLogged();
    }

    async Tutorial() {
        const Shepherd = require("./assets/js/utils/shepherd.cjs");
        const tour = new Shepherd.default.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                classes: "shadow-md bg-purple-dark",
                scrollTo: { behavior: "smooth", block: "center" },
            },
        });

        tour.addStep({
            id: "welcome",
            title: "¡Bienvenido a Battly!",
            text: "Soy Nivix, tu guía en Battly. Te enseñaré cómo usar Battly en general y aprovechar el 100% de sus funciones.",
            buttons: [
                {
                    text: "¡Vamos!",
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "Menú de inicio",
            text: "Este es el menú de inicio de Battly. Aquí podrás ver las últimas noticias, tus amigos en línea y acceder a cualquier sección de Battly.",
            attachTo: {
                element: ".panel.home",
                on: "bottom",
            },
            buttons: [
                {
                    text: await window.getString('tour.next') || "Next",
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: await window.getString('tour.newsTitle') || "News",
            text: await window.getString('tour.newsText') || "Here you can see the latest Battly and Minecraft news. Whenever there's new news, we'll let you know.",
            attachTo: {
                element: ".home-news",
                on: "bottom",
            },
            buttons: [
                {
                    text: await window.getString('tour.next') || "Next",
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: await window.getString('tour.newsTitle') || "News",
            text: await window.getString('tour.newsToggleText') || "Here you can toggle between Battly news and Minecraft news.",
            attachTo: {
                element: "#typeofnewsMain",
                on: "bottom",
            },
            buttons: [
                {
                    text: await window.getString('tour.great') || "Great!",
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: await window.getString('tour.onlineFriendsTitle') || "Online Friends",
            text: await window.getString('tour.onlineFriendsText') || "Here you can see your online friends. If you have friends online, you'll see them here.",
            attachTo: {
                element: ".main-home-panel-left-online-friends",
                on: "top-start",
            },
            buttons: [
                {
                    text: await window.getString('tour.next') || "Next",
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: await window.getString('tour.battlyStatusTitle') || "Battly Status",
            text: await window.getString('tour.battlyStatusText') || "Here you can see Battly's status. If there's any problem with Battly, we'll let you know here.",
            attachTo: {
                element: ".main-home-panel-right",
                on: "left-start",
            },
            buttons: [
                {
                    text: "Siguiente",
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "Descargar versiones",
            text: "Presioando aquí podrás descargar las versiones de Minecraft que quieras.",
            attachTo: {
                element: "#download-btn",
                on: "top",
            },
            buttons: [
                {
                    text: "Siguiente",
                    action:
                        () => {
                            document.getElementById("download-btn").click();
                            tour.next();
                        },
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "Descargar versiones",
            text: "Para descargar una versión de Minecraft, simplemente selecciona la versión que quieras y presiona el botón de descargar.",
            attachTo: {
                element: "#download-panel-right-version",
                on: "left-start",
            },
            buttons: [
                {
                    text: "¡Entendido!",
                    action: () => {
                        document.querySelector(".modal-close.is-large").click();
                        tour.next();
                    },
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "Abrir versiones",
            text: "Aquí podrás abrir las versiones de Minecraft que hayas descargado.",
            attachTo: {
                element: "#play-btn",
                on: "top",
            },
            buttons: [
                {
                    text: "Siguiente",
                    action:
                        () => {
                            document.getElementById("play-btn").click();
                            tour.next();
                        },
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "Versiones recientes",
            text: "Aquí podrás ver las versiones de Minecraft que has jugado recientemente.",
            attachTo: {
                element: ".recent-versions",
                on: "top",
            },
            buttons: [
                {
                    text: "Siguiente",
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: await window.getString('tour.playVersionsTitle') || "Play Versions",
            text: await window.getString('tour.playVersionsText') || "To play a Minecraft version, simply select the version you want and press the play button.",
            attachTo: {
                element: ".start-version",
                on: "top",
            },
            buttons: [
                {
                    text: await window.getString('tour.great') || "Great!",
                    action: () => {
                        document.querySelector("#close-modal-start-btn").click();
                        tour.next();
                    },
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "¡Listo!",
            text: "De momento, ya has aprendido lo básico de Battly. Cuando vayas descubriendo más cosas de Battly, te iré enseñando a usarlas. ¡Diviértete!",
            buttons: [
                {
                    text: "¡Gracias!",
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        if (await getValue("baseTutorialCompleted")) return;
        try {
            await modal.ask({
                title: "¿Quieres hacer un tour por Battly?",
                text: "Te guiaré a través de las características principales de Battly.",
                showCancelButton: true,
                confirmButtonText: "Sí, quiero hacer el tour",
                cancelButtonText: "No, gracias",
                preConfirm: () => true
            });

            await tour.start();

            await setValue("baseTutorialCompleted", true);

        } catch (err) {
            await setValue("baseTutorialCompleted", true);
            if (err !== "cancelled") {
                console.error("Error al iniciar el tour:", err);
                new Alert().ShowAlert({
                    icon: "error",
                    title: window.stringLoader.getString("home.error"),
                    text: window.stringLoader.getString("home.couldNotStartTour")
                });
            }
        }

    }

    async BattlySavesCloud() {
        const { google } = require("googleapis");
        const mime = require('mime-types');

        async function saveBackupLog(backupData, drive = null) {
            const backupHistory = await getValue('backupHistory') || [];
            backupHistory.unshift(backupData);

            if (backupHistory.length > 50) {
                backupHistory.splice(50);
            }

            await setValue('backupHistory', backupHistory);

            if (drive) {
                await syncBackupHistoryToDrive(drive, backupHistory);
            }
        }

        async function getBackupHistory() {
            return await getValue('backupHistory') || [];
        }

        async function syncBackupHistoryToDrive(drive, localHistory) {
            try {
                const battlyFolder = await findOrCreateFolder(drive, 'root', 'Battly');

                const query = `name='backup-history.json' and '${battlyFolder.id}' in parents`;
                const res = await drive.files.list({
                    q: query,
                    fields: 'files(id, name)'
                });

                const historyData = JSON.stringify(localHistory, null, 2);
                const media = {
                    mimeType: 'application/json',
                    body: historyData
                };

                if (res.data.files && res.data.files.length > 0) {
                    await drive.files.update({
                        fileId: res.data.files[0].id,
                        media: media
                    });
                } else {
                    await drive.files.create({
                        requestBody: {
                            name: 'backup-history.json',
                            parents: [battlyFolder.id],
                            mimeType: 'application/json'
                        },
                        media: media,
                        fields: 'id, name'
                    });
                }

                console.log('✅ Historial sincronizado con Google Drive');
            } catch (error) {
                console.error('⚠️ Error al sincronizar historial con Drive:', error);
            }
        }

        async function downloadBackupHistoryFromDrive(drive) {
            try {
                const battlyFolder = await findOrCreateFolder(drive, 'root', 'Battly');

                const query = `name='backup-history.json' and '${battlyFolder.id}' in parents`;
                const res = await drive.files.list({
                    q: query,
                    fields: 'files(id, name, modifiedTime)'
                });

                if (res.data.files && res.data.files.length > 0) {
                    const fileId = res.data.files[0].id;

                    const fileRes = await drive.files.get({
                        fileId: fileId,
                        alt: 'media'
                    }, { responseType: 'text' });

                    const driveHistory = JSON.parse(fileRes.data);
                    console.log('✅ Historial descargado desde Google Drive');
                    return driveHistory;
                }

                return null;
            } catch (error) {
                console.error('⚠️ Error al descargar historial desde Drive:', error);
                return null;
            }
        }

        async function mergeBackupHistories(localHistory, driveHistory) {
            if (!driveHistory) return localHistory;

            const mergedMap = new Map();

            localHistory.forEach(backup => {
                mergedMap.set(backup.id, backup);
            });

            driveHistory.forEach(backup => {
                if (mergedMap.has(backup.id)) {
                    const existing = mergedMap.get(backup.id);
                    if (new Date(backup.timestamp) > new Date(existing.timestamp)) {
                        mergedMap.set(backup.id, backup);
                    }
                } else {
                    mergedMap.set(backup.id, backup);
                }
            });

            const merged = Array.from(mergedMap.values())
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 50);

            return merged;
        }

        async function syncBackupHistoryOnStart(drive) {
            try {
                const localHistory = await getValue('backupHistory') || [];
                const driveHistory = await downloadBackupHistoryFromDrive(drive);

                if (driveHistory) {
                    const merged = await mergeBackupHistories(localHistory, driveHistory);
                    await setValue('backupHistory', merged);

                    await syncBackupHistoryToDrive(drive, merged);

                    console.log(`✅ Sincronización completada: ${merged.length} registros`);
                    return merged.length;
                } else {
                    console.log('ℹ️ No hay historial en Drive, usando solo local');
                    return localHistory.length;
                }
            } catch (error) {
                console.error('⚠️ Error en sincronización:', error);
                return 0;
            }
        }

        async function saveTokens(tokens) {
            await setValue('googleTokens', JSON.stringify(tokens));
        }

        function openAuthWindow(modalDiv) {
            const authWindow = window.open('https://battlylauncher.com/google-drive/auth', 'authWindow', 'width=600,height=600');

            window.addEventListener('message', (event) => {
                if (event.origin !== 'https://battlylauncher.com') return;
                if (event.data.type === 'google-tokens') {
                    const tokens = event.data.tokens;

                    fs.writeFileSync(`${dataDirectory}/.battly/battly/launcher/tokens.json`, JSON.stringify(tokens));

                    saveTokens(tokens);
                    authWindow.close();
                    modalDiv.remove();
                }
            });
        }

        async function renewAccessTokenIfNeeded(refresh_token) {
            try {
                const response = await fetch('https://battlylauncher.com/google-drive/refresh-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refresh_token }),
                });

                if (!response.ok) {
                    throw new Error('Error al refrescar el token');
                }

                const newTokens = await response.json();
                saveTokens(newTokens);
                return newTokens;
            } catch (error) {
                console.error('Error al renovar el token de acceso:', error);
                return null;
            }
        }

        const viewHistoryBtn = document.getElementById("view-backup-history-btn");
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener("click", async () => {
                const tokens = await getValue("googleTokens");
                if (tokens) {
                    try {
                        const parsedTokens = JSON.parse(tokens);
                        const auth = new google.auth.OAuth2();
                        auth.setCredentials(parsedTokens);
                        const drive = google.drive({ version: 'v3', auth });

                        syncBackupHistoryOnStart(drive).then(() => {
                            console.log('🔄 Historial sincronizado antes de mostrar');
                        }).catch(err => {
                            console.warn('⚠️ No se pudo sincronizar:', err);
                        });
                    } catch (error) {
                        console.warn('⚠️ Error al preparar sincronización:', error);
                    }
                }

                await showBackupHistory();
            });
        }

        document.getElementById("save-drive").addEventListener("click", async () => {
            console.log("Iniciando proceso de guardado en Google Drive...");
            if (!(await getValue("googleTokens"))) {
                const modalDiv1 = document.createElement("div");
                modalDiv1.classList.add("modal", "is-active");
                modalDiv1.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card modal-animated" style="border-radius: 15px;">
            <section class="modal-card-body" style="background-color: #101726;">
                <div class="content" style="text-align: center;">
                    <img src="assets/images/rnd/1.png">
                    <h2 style="color: #fff;">¿Quieres guardar tus mundos de Battly en tu cuenta de Google Drive?
                    </h2>
                    <p style="color: #fff;">Si guardas tus mundos en tu cuenta de Google Drive, podrás acceder a ellos
                        desde cualquier
                        dispositivo. Aparte, si pierdes tus mundos, podrás recuperarlos fácilmente.</p>

                </div>
            </section>
            <footer class="modal-card-foot"
                style="background-color: #0f1623; display: flex; justify-content: flex-end !important;">
                <button class="button is-info is-outlined">Guardar mundos</button>
                <button class="button is-warning is-outlined">Ignorar</button>
            </footer>
        </div>`;

                document.body.appendChild(modalDiv1);

                modalDiv1.querySelector(".button.is-info.is-outlined").addEventListener("click", async () => {
                    modalDiv1.querySelector(".content").innerHTML =
                        `<img src="assets/images/rnd/1.png">
              <h2 style="color: #fff;">Espera un momento...
              </h2>
              <p style="color: #fff;">En unos segundos, se abrirá una ventana para iniciar sesión en tu cuenta de
                Google, simplemente deberás hacerlo y aceptar los permisos de acceso a los archivos a Battly.
                <br>
                  <br>
                    Tus datos se guardan localmente y no se almacenan en los servidores de Battly; Battly no
                    accederá a archivos/carpetas que no sean relacionadas a tus mundos.
                  </p>`
                        ;

                    modalDiv1.querySelector(".modal-card-foot").querySelectorAll("button").forEach(btn => btn.setAttribute("disabled", "true"));
                    modalDiv1.querySelector(".modal-card-foot").querySelectorAll("button.is-info.is-outlined").forEach(btn => btn.classList.add("is-loading"));

                    setTimeout(() => {
                        openAuthWindow(modalDiv1);
                        modalDiv1.querySelector(".content h2").innerHTML = window.stringLoader.getString("home.continueInLoginWindow");
                        modalDiv1.querySelector(".content p").innerHTML = window.stringLoader.getString("home.afterLoginInstructions");
                    }, 7000);
                });

                modalDiv1.querySelector(".button.is-warning.is-outlined").addEventListener("click", () => {
                    modalDiv1.remove();
                });
            } else {
                let tokens = JSON.parse(await getValue("googleTokens"));
                console.log(tokens);

                const auth = new google.auth.OAuth2();
                auth.setCredentials(tokens);

                if (auth.isTokenExpiring()) {
                    tokens = await renewAccessTokenIfNeeded(tokens.refresh_token);
                    if (!tokens) {
                        openAuthWindow();
                        return;
                    }
                    auth.setCredentials(tokens);
                }

                const modalDiv = document.createElement("div");
                modalDiv.classList.add("modal", "is-active");
                modalDiv.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card modal-animated" style="border-radius: 15px;">
          <section class="modal-card-body" style="background-color: #101726;">
            <div class="content" style="text-align: center;">
              <h2 style="color: #fff;">Battly está guardando tus mundos, esto puede tardar...</h2>
              <p style="color: #fff;">Por favor, no cierres la aplicación ni apagues tu dispositivo</p>
              <div class="uploaded-files">
                <table id="progress-table" style="background-color: #101726;">
                </table>
              </div>
              <progress id="progress-bar" class="progress is-info"></progress>
            </div>
          </section>
          <footer class="modal-card-foot" style="background-color: #0f1623; display: none; justify-content: flex-end !important;">
          </footer>
        </div>
      `;

                document.body.appendChild(modalDiv);

                const drive = google.drive({ version: 'v3', auth });

                const rootLocalDirectory = `${dataDirectory}/.battly/saves`;
                const battlyFolder = await findOrCreateFolder(drive, 'root', 'Battly');

                const progressTable = modalDiv.querySelector("#progress-table");
                const worldFolders = fs.readdirSync(rootLocalDirectory, { withFileTypes: true }).filter(entry => entry.isDirectory());

                const backupData = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    status: 'in-progress',
                    worlds: [],
                    totalFiles: 0,
                    totalSize: 0,
                    duration: 0
                };

                const startTime = Date.now();

                for (const worldFolder of worldFolders) {
                    let worldRow = document.createElement("tr");
                    worldRow.innerHTML = `<td style="color: #fff;">${worldFolder.name}</td><td style="color: #3e8ed0;">Creando carpetas...</td>`;
                    progressTable.appendChild(worldRow);

                    const worldFolderPath = `${rootLocalDirectory}/${worldFolder.name}`;
                    const driveFolder = await findOrCreateFolder(drive, battlyFolder.id, worldFolder.name);

                    const worldStats = await getWorldStats(worldFolderPath);

                    await createSubfoldersRecursive(drive, driveFolder.id, worldFolderPath);

                    worldRow.querySelector("td:nth-child(2)").innerText = "Subiendo archivos del mundo...";
                    const uploadResults = await uploadFilesRecursive(drive, driveFolder.id, worldFolderPath);

                    worldRow.querySelector("td:nth-child(2)").style.color = "#48c774";
                    worldRow.querySelector("td:nth-child(2)").innerText = "Mundo subido";

                    backupData.worlds.push({
                        name: worldFolder.name,
                        files: worldStats.fileCount,
                        size: worldStats.totalSize,
                        uploadedFiles: uploadResults.uploadedFiles,
                        updatedFiles: uploadResults.updatedFiles,
                        folderId: driveFolder.id
                    });

                    backupData.totalFiles += worldStats.fileCount;
                    backupData.totalSize += worldStats.totalSize;
                }

                backupData.duration = Date.now() - startTime;
                backupData.status = 'completed';

                await saveBackupLog(backupData, drive);

                modalDiv.querySelector("#progress-bar").style.display = "none";
                modalDiv.querySelector(".content h2").innerText = "Mundos subidos correctamente";
                modalDiv.querySelector(".content p").innerHTML = `
                    Tus mundos se han subido correctamente a tu cuenta de Google Drive<br>
                    <small style="color: #aaa;">
                        ${backupData.worlds.length} mundo(s) • ${backupData.totalFiles} archivo(s) • 
                        ${(backupData.totalSize / 1024 / 1024).toFixed(2)} MB • 
                        ${(backupData.duration / 1000).toFixed(1)}s
                    </small>
                `;
                modalDiv.querySelector(".modal-card-foot").innerHTML = `
                    <button class="button is-info is-outlined" id="view-backup-history-btn">Ver historial</button>
                    <button class="button is-success is-outlined">Aceptar</button>
                `;
                modalDiv.querySelector(".modal-card-foot").style.display = "flex";

                modalDiv.querySelector("#view-backup-history-btn").addEventListener("click", async () => {
                    modalDiv.remove();
                    await showBackupHistory();
                });

                modalDiv.querySelector(".button.is-success.is-outlined").addEventListener("click", () => {
                    modalDiv.remove();
                });
            }
        });

        async function createSubfoldersRecursive(drive, parentFolderId, localFolderPath) {
            const folderContents = fs.readdirSync(localFolderPath, { withFileTypes: true });

            for (const entry of folderContents) {
                const entryPath = `${localFolderPath}/${entry.name}`;

                if (entry.isDirectory()) {
                    const folder = await findOrCreateFolder(drive, parentFolderId, entry.name);
                    await createSubfoldersRecursive(drive, folder.id, entryPath);
                }
            }
        }

        async function downloadWorldsFromDrive(drive, localDirectory) {
            const battlyFolder = await findOrCreateFolder(drive, 'root', 'Battly');

            const files = await drive.files.list({
                q: `'${battlyFolder.id}' in parents`,
                fields: 'files(id, name, mimeType)'
            });

            for (const file of files.data.files) {
                const filePath = `${localDirectory}/${file.name}`;

                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    if (!fs.existsSync(filePath)) {
                        fs.mkdirSync(filePath, { recursive: true });
                    }
                    await downloadWorldsFromDrive(drive, filePath);
                } else {
                    const dest = fs.createWriteStream(filePath);
                    await drive.files.get({
                        fileId: file.id,
                        alt: 'media'
                    }, { responseType: 'stream' }, (err, res) => {
                        if (err) throw err;
                        res.data.pipe(dest);
                    });
                }
            }
        }

        async function uploadFilesRecursive(drive, parentFolderId, localFolderPath) {
            const folderContents = fs.readdirSync(localFolderPath, { withFileTypes: true });

            let uploadedFiles = 0;
            let updatedFiles = 0;

            const uploadPromises = folderContents.map(async (entry) => {
                const entryPath = `${localFolderPath}/${entry.name}`;

                if (entry.isFile()) {
                    const query = `name='${entry.name}' and '${parentFolderId}' in parents`;
                    const res = await drive.files.list({
                        q: query,
                        fields: 'files(id, name)'
                    });

                    if (res.data.files && res.data.files.length > 0) {
                        await drive.files.update({
                            fileId: res.data.files[0].id,
                            media: {
                                mimeType: mime.lookup(entryPath) || 'application/octet-stream',
                                body: fs.readFileSync(entryPath)
                            }
                        });
                        updatedFiles++;
                    } else {
                        const res = await drive.files.create({
                            requestBody: {
                                name: entry.name,
                                parents: [parentFolderId]
                            },
                            media: {
                                mimeType: mime.lookup(entryPath) || 'application/octet-stream',
                                body: fs.readFileSync(entryPath)
                            },
                            fields: 'id, name'
                        });

                        await drive.files.update({
                            fileId: res.data.id ?? res.data.files[0].id,
                            media: {
                                mimeType: mime.lookup(entryPath) || 'application/octet-stream',
                                body: fs.readFileSync(entryPath)
                            },
                            fields: 'id, name'
                        });
                        uploadedFiles++;
                    }
                } else if (entry.isDirectory()) {
                    const folder = await findOrCreateFolder(drive, parentFolderId, entry.name);
                    const subResults = await uploadFilesRecursive(drive, folder.id, entryPath);
                    uploadedFiles += subResults.uploadedFiles;
                    updatedFiles += subResults.updatedFiles;
                }
            });

            await Promise.all(uploadPromises);
            return { uploadedFiles, updatedFiles };
        }

        async function getWorldStats(worldPath) {
            let fileCount = 0;
            let totalSize = 0;

            function scanDirectory(dirPath) {
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });

                for (const entry of entries) {
                    const entryPath = `${dirPath}/${entry.name}`;

                    if (entry.isFile()) {
                        fileCount++;
                        try {
                            const stats = fs.statSync(entryPath);
                            totalSize += stats.size;
                        } catch (err) {
                            console.error(`Error al obtener stats de ${entryPath}:`, err);
                        }
                    } else if (entry.isDirectory()) {
                        scanDirectory(entryPath);
                    }
                }
            }

            scanDirectory(worldPath);
            return { fileCount, totalSize };
        }

        async function showBackupHistory() {
            const history = await getBackupHistory();

            const historyModal = document.createElement("div");
            historyModal.classList.add("modal", "is-active");
            historyModal.innerHTML = `
                <div class="modal-background"></div>
                <div class="modal-card modal-animated" style="border-radius: 15px; max-width: 900px;">
                    <header class="modal-card-head" style="background-color: #101726;">
                        <p class="modal-card-title" style="color: #fff;">
                            <i class="fas fa-history"></i> Historial de Copias de Seguridad
                        </p>
                        <button class="delete" aria-label="close" id="close-history-modal"></button>
                    </header>
                    <section class="modal-card-body" style="background-color: #101726; max-height: 600px; overflow-y: auto;">
                        <div id="backup-history-content">
                            ${history.length === 0 ?
                    '<p style="color: #aaa; text-align: center; padding: 40px;">No hay copias de seguridad registradas</p>' :
                    generateHistoryHTML(history)
                }
                        </div>
                    </section>
                    <footer class="modal-card-foot" style="background-color: #0f1623; justify-content: space-between;">
                        <div>
                            <button class="button is-danger is-outlined" id="clear-history-btn">
                                <i class="fas fa-trash"></i> Limpiar historial
                            </button>
                            <button class="button is-warning is-outlined" id="sync-history-btn">
                                <i class="fas fa-sync-alt"></i> Sincronizar
                            </button>
                        </div>
                        <button class="button is-info is-outlined" id="close-history-btn">Cerrar</button>
                    </footer>
                </div>
            `;

            document.body.appendChild(historyModal);

            historyModal.querySelector("#close-history-modal").addEventListener("click", () => {
                historyModal.remove();
            });

            historyModal.querySelector("#close-history-btn").addEventListener("click", () => {
                historyModal.remove();
            });

            historyModal.querySelector("#clear-history-btn").addEventListener("click", async () => {
                try {
                    await modal.ask({
                        title: '¿Limpiar historial?',
                        text: '¿Estás seguro de que quieres eliminar todo el historial de copias de seguridad? Esta acción no se puede deshacer.',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, limpiar',
                        cancelButtonText: 'Cancelar',
                        preConfirm: () => true
                    });

                    await setValue('backupHistory', []);
                    historyModal.querySelector("#backup-history-content").innerHTML =
                        '<p style="color: #aaa; text-align: center; padding: 40px;">No hay copias de seguridad registradas</p>';

                    new Alert().ShowAlert({
                        icon: "success",
                        title: "Historial limpiado",
                        text: "El historial de copias de seguridad se ha eliminado correctamente"
                    });
                } catch (err) {
                }
            });

            historyModal.querySelector("#sync-history-btn").addEventListener("click", async () => {
                const syncBtn = historyModal.querySelector("#sync-history-btn");
                const originalHTML = syncBtn.innerHTML;

                try {
                    syncBtn.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> ${window.stringLoader.getString("home.syncing")}`;
                    syncBtn.disabled = true;

                    const tokens = await getValue("googleTokens");
                    if (!tokens) {
                        new Alert().ShowAlert({
                            icon: "warning",
                            title: window.stringLoader.getString("home.notAuthenticated"),
                            text: window.stringLoader.getString("home.mustLoginGoogleDrive")
                        });
                        return;
                    }

                    const parsedTokens = JSON.parse(tokens);
                    const auth = new google.auth.OAuth2();
                    auth.setCredentials(parsedTokens);
                    const drive = google.drive({ version: 'v3', auth });

                    const syncedCount = await syncBackupHistoryOnStart(drive);

                    const updatedHistory = await getBackupHistory();
                    historyModal.querySelector("#backup-history-content").innerHTML =
                        updatedHistory.length === 0 ?
                            '<p style="color: #aaa; text-align: center; padding: 40px;">No hay copias de seguridad registradas</p>' :
                            generateHistoryHTML(updatedHistory);

                    new Alert().ShowAlert({
                        icon: "success",
                        title: "Sincronizado",
                        text: `Se sincronizaron ${syncedCount} registro(s) desde Google Drive`
                    });
                } catch (error) {
                    console.error('Error en sincronización:', error);
                    new Alert().ShowAlert({
                        icon: "error",
                        title: "Error",
                        text: "No se pudo sincronizar con Google Drive"
                    });
                } finally {
                    syncBtn.innerHTML = originalHTML;
                    syncBtn.disabled = false;
                }
            });
        }

        function generateHistoryHTML(history) {
            return history.map((backup, index) => {
                const date = new Date(backup.timestamp);
                const formattedDate = date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const statusColor = backup.status === 'completed' ? '#48c774' : '#f14668';
                const statusText = backup.status === 'completed' ? 'Completada' : 'Fallida';

                return `
                    <div class="box" style="background-color: #0f1623; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <h3 style="color: #fff; margin-bottom: 10px;">
                                    <i class="fas fa-cloud-upload-alt"></i> 
                                    Copia de Seguridad #${history.length - index}
                                </h3>
                                <p style="color: #aaa; font-size: 0.9em; margin-bottom: 15px;">
                                    <i class="far fa-clock"></i> ${formattedDate}
                                </p>
                                
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                                    <div style="background-color: #101726; padding: 10px; border-radius: 5px;">
                                        <p style="color: #aaa; font-size: 0.8em;">Mundos</p>
                                        <p style="color: #fff; font-size: 1.2em; font-weight: bold;">
                                            <i class="fas fa-globe"></i> ${backup.worlds.length}
                                        </p>
                                    </div>
                                    <div style="background-color: #101726; padding: 10px; border-radius: 5px;">
                                        <p style="color: #aaa; font-size: 0.8em;">Archivos</p>
                                        <p style="color: #fff; font-size: 1.2em; font-weight: bold;">
                                            <i class="fas fa-file"></i> ${backup.totalFiles}
                                        </p>
                                    </div>
                                    <div style="background-color: #101726; padding: 10px; border-radius: 5px;">
                                        <p style="color: #aaa; font-size: 0.8em;">Tamaño</p>
                                        <p style="color: #fff; font-size: 1.2em; font-weight: bold;">
                                            <i class="fas fa-hdd"></i> ${(backup.totalSize / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <div style="background-color: #101726; padding: 10px; border-radius: 5px;">
                                        <p style="color: #aaa; font-size: 0.8em;">Duración</p>
                                        <p style="color: #fff; font-size: 1.2em; font-weight: bold;">
                                            <i class="fas fa-stopwatch"></i> ${(backup.duration / 1000).toFixed(1)}s
                                        </p>
                                    </div>
                                </div>

                                ${backup.worlds.length > 0 ? `
                                    <details style="margin-top: 10px;">
                                        <summary style="color: #3e8ed0; cursor: pointer; user-select: none;">
                                            <i class="fas fa-chevron-down"></i> Ver detalles de mundos
                                        </summary>
                                        <div style="margin-top: 10px; padding-left: 20px;">
                                            ${backup.worlds.map(world => `
                                                <div style="background-color: #101726; padding: 8px; margin-bottom: 5px; border-radius: 3px;">
                                                    <p style="color: #fff; font-weight: bold;">${world.name}</p>
                                                    <p style="color: #aaa; font-size: 0.85em;">
                                                        ${world.files} archivos • 
                                                        ${(world.size / 1024 / 1024).toFixed(2)} MB • 
                                                        ${world.uploadedFiles} nuevos • 
                                                        ${world.updatedFiles} actualizados
                                                    </p>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </details>
                                ` : ''}
                            </div>
                            
                            <div style="text-align: right;">
                                <span style="background-color: ${statusColor}; color: #fff; padding: 5px 10px; border-radius: 5px; font-size: 0.85em;">
                                    ${statusText}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        async function findOrCreateFolder(drive, parentFolderId, folderName) {
            const query = `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`;

            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name)'
            });

            if (res.data.files && res.data.files.length > 0) {
                return res.data.files[0];
            }

            const folder = await drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentFolderId]
                },
                fields: 'id, name'
            });

            return folder.data;
        }
    }

    async syncBackupHistoryOnInit() {
        try {
            const tokens = await getValue("googleTokens");
            if (!tokens) {
                console.log('ℹ️ No hay tokens de Google Drive, saltando sincronización');
                return;
            }

            const { google } = require("googleapis");
            const parsedTokens = JSON.parse(tokens);
            const auth = new google.auth.OAuth2();
            auth.setCredentials(parsedTokens);

            if (auth.isTokenExpiring()) {
                console.log('⚠️ Token expirado, se requiere re-autenticación');
                return;
            }

            const drive = google.drive({ version: 'v3', auth });

            console.log('🔄 Sincronizando historial de copias de seguridad...');

            const localHistory = await getValue('backupHistory') || [];
            console.log(`📱 Historial local: ${localHistory.length} registro(s)`);

            const driveHistory = await this.downloadBackupHistoryFromDrive(drive);

            if (driveHistory && driveHistory.length > 0) {
                console.log(`☁️ Historial en Drive: ${driveHistory.length} registro(s)`);

                const merged = await this.mergeBackupHistories(localHistory, driveHistory);
                console.log(`🔀 Historial fusionado: ${merged.length} registro(s)`);

                await setValue('backupHistory', merged);

                await this.syncBackupHistoryToDrive(drive, merged);

                console.log(`✅ Sincronización completada: ${merged.length} registro(s) disponibles`);
            } else {
                console.log('ℹ️ No hay historial en Drive o es la primera sincronización');

                if (localHistory.length > 0) {
                    await this.syncBackupHistoryToDrive(drive, localHistory);
                    console.log(`⬆️ Historial local subido a Drive: ${localHistory.length} registro(s)`);
                }
            }
        } catch (error) {
            console.error('⚠️ Error en sincronización automática:', error);
        }
    }

    async downloadBackupHistoryFromDrive(drive) {
        try {
            const battlyFolder = await this.findOrCreateFolderForSync(drive, 'root', 'Battly');

            const query = `name='backup-history.json' and '${battlyFolder.id}' in parents`;
            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name, modifiedTime)'
            });

            if (res.data.files && res.data.files.length > 0) {
                const fileId = res.data.files[0].id;

                const fileRes = await drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                }, { responseType: 'text' });

                const driveHistory = JSON.parse(fileRes.data);
                return driveHistory;
            }

            return null;
        } catch (error) {
            console.error('⚠️ Error al descargar historial desde Drive:', error);
            return null;
        }
    }

    async syncBackupHistoryToDrive(drive, localHistory) {
        try {
            const battlyFolder = await this.findOrCreateFolderForSync(drive, 'root', 'Battly');

            const query = `name='backup-history.json' and '${battlyFolder.id}' in parents`;
            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name)'
            });

            const historyData = JSON.stringify(localHistory, null, 2);
            const media = {
                mimeType: 'application/json',
                body: historyData
            };

            if (res.data.files && res.data.files.length > 0) {
                await drive.files.update({
                    fileId: res.data.files[0].id,
                    media: media
                });
            } else {
                await drive.files.create({
                    requestBody: {
                        name: 'backup-history.json',
                        parents: [battlyFolder.id],
                        mimeType: 'application/json'
                    },
                    media: media,
                    fields: 'id, name'
                });
            }
        } catch (error) {
            console.error('⚠️ Error al sincronizar historial con Drive:', error);
        }
    }

    async mergeBackupHistories(localHistory, driveHistory) {
        if (!driveHistory) return localHistory;

        const mergedMap = new Map();

        localHistory.forEach(backup => {
            mergedMap.set(backup.id, backup);
        });

        driveHistory.forEach(backup => {
            if (mergedMap.has(backup.id)) {
                const existing = mergedMap.get(backup.id);
                if (new Date(backup.timestamp) > new Date(existing.timestamp)) {
                    mergedMap.set(backup.id, backup);
                }
            } else {
                mergedMap.set(backup.id, backup);
            }
        });

        const merged = Array.from(mergedMap.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 50);

        return merged;
    }

    async findOrCreateFolderForSync(drive, parentFolderId, folderName) {
        const query = `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`;

        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name)'
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0];
        }

        const folder = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId]
            },
            fields: 'id, name'
        });

        return folder.data;
    }

    async startAutoBackupOnGameClose() {
        try {
            ipcRenderer.send('sync-started');
            console.log('🔄 Sincronización iniciada - Battly no se cerrará hasta completar');

            const tokens = await getValue("googleTokens");
            if (!tokens) {
                console.log('⚠️ No hay tokens de Google Drive, cancelando sincronización automática');
                ipcRenderer.send('sync-finished');
                return;
            }

            const { google } = require("googleapis");
            const mime = require('mime-types');

            const parsedTokens = JSON.parse(tokens);
            const auth = new google.auth.OAuth2();
            auth.setCredentials(parsedTokens);

            if (auth.isTokenExpiring()) {
                console.log('⚠️ Token expirado, cancelando sincronización automática');
                ipcRenderer.send('sync-finished');
                return;
            }

            const drive = google.drive({ version: 'v3', auth });

            this.showSystemNotification('Battly Launcher', 'Iniciando copia de seguridad automática...');

            console.log('📦 Comenzando copia de seguridad automática...');

            const rootLocalDirectory = `${dataDirectory}/.battly/saves`;

            if (!fs.existsSync(rootLocalDirectory)) {
                console.log('ℹ️ No hay mundos para respaldar');
                return;
            }

            const battlyFolder = await this.findOrCreateFolderForSync(drive, 'root', 'Battly');
            const worldFolders = fs.readdirSync(rootLocalDirectory, { withFileTypes: true })
                .filter(entry => entry.isDirectory());

            if (worldFolders.length === 0) {
                console.log('ℹ️ No hay mundos para respaldar');
                return;
            }

            const backupData = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                status: 'in-progress',
                worlds: [],
                totalFiles: 0,
                totalSize: 0,
                duration: 0,
                autoBackup: true
            };

            const startTime = Date.now();

            for (const worldFolder of worldFolders) {
                console.log(`📁 Respaldando mundo: ${worldFolder.name}`);

                const worldFolderPath = `${rootLocalDirectory}/${worldFolder.name}`;
                const driveFolder = await this.findOrCreateFolderForSync(drive, battlyFolder.id, worldFolder.name);

                const worldStats = await this.getWorldStatsForAutoBackup(worldFolderPath);

                await this.createSubfoldersRecursiveForAutoBackup(drive, driveFolder.id, worldFolderPath);
                const uploadResults = await this.uploadFilesRecursiveForAutoBackup(drive, driveFolder.id, worldFolderPath);

                backupData.worlds.push({
                    name: worldFolder.name,
                    files: worldStats.fileCount,
                    size: worldStats.totalSize,
                    uploadedFiles: uploadResults.uploadedFiles,
                    updatedFiles: uploadResults.updatedFiles,
                    folderId: driveFolder.id
                });

                backupData.totalFiles += worldStats.fileCount;
                backupData.totalSize += worldStats.totalSize;
            }

            backupData.duration = Date.now() - startTime;
            backupData.status = 'completed';

            await this.saveBackupLogForAutoBackup(backupData, drive);

            console.log(`✅ Copia de seguridad automática completada en ${(backupData.duration / 1000).toFixed(1)}s`);

            const { remote } = require('electron');
            const mainWindow = remote.getCurrentWindow();
            const wasHidden = !mainWindow.isVisible();

            if (wasHidden) {
                this.showSystemNotification(
                    'Copia de Seguridad Completada',
                    `${backupData.worlds.length} mundo(s) respaldado(s) • Cerrando Battly...`
                );
            } else {
                this.showSystemNotification(
                    'Copia de Seguridad Completada',
                    `${backupData.worlds.length} mundo(s) respaldado(s) • ${(backupData.totalSize / 1024 / 1024).toFixed(2)} MB`
                );
            }

            ipcRenderer.send('sync-finished');

            if (wasHidden) {
                setTimeout(() => {
                    console.log('👋 Cerrando Battly tras completar sincronización...');
                    process.exit(0);
                }, 2000);
            }

        } catch (error) {
            console.error('❌ Error en copia de seguridad automática:', error);
            this.showSystemNotification('Error en Copia de Seguridad', 'No se pudo completar la copia automática');

            ipcRenderer.send('sync-finished');
        }
    }

    showSystemNotification(title, message) {
        try {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('show-notification', { title, message });
        } catch (error) {
            console.error('Error al mostrar notificación:', error);
        }
    }

    async getWorldStatsForAutoBackup(worldPath) {
        let fileCount = 0;
        let totalSize = 0;

        function scanDirectory(dirPath) {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = `${dirPath}/${entry.name}`;

                if (entry.isFile()) {
                    fileCount++;
                    try {
                        const stats = fs.statSync(entryPath);
                        totalSize += stats.size;
                    } catch (err) {
                        console.error(`Error al obtener stats de ${entryPath}:`, err);
                    }
                } else if (entry.isDirectory()) {
                    scanDirectory(entryPath);
                }
            }
        }

        scanDirectory(worldPath);
        return { fileCount, totalSize };
    }

    async createSubfoldersRecursiveForAutoBackup(drive, parentFolderId, localFolderPath) {
        const folderContents = fs.readdirSync(localFolderPath, { withFileTypes: true });

        for (const entry of folderContents) {
            const entryPath = `${localFolderPath}/${entry.name}`;

            if (entry.isDirectory()) {
                const folder = await this.findOrCreateFolderForSync(drive, parentFolderId, entry.name);
                await this.createSubfoldersRecursiveForAutoBackup(drive, folder.id, entryPath);
            }
        }
    }

    async uploadFilesRecursiveForAutoBackup(drive, parentFolderId, localFolderPath) {
        const { mime } = require('mime-types');
        const folderContents = fs.readdirSync(localFolderPath, { withFileTypes: true });

        let uploadedFiles = 0;
        let updatedFiles = 0;

        const uploadPromises = folderContents.map(async (entry) => {
            const entryPath = `${localFolderPath}/${entry.name}`;

            if (entry.isFile()) {
                const query = `name='${entry.name}' and '${parentFolderId}' in parents`;
                const res = await drive.files.list({
                    q: query,
                    fields: 'files(id, name)'
                });

                const mimeType = require('mime-types').lookup(entryPath) || 'application/octet-stream';

                if (res.data.files && res.data.files.length > 0) {
                    await drive.files.update({
                        fileId: res.data.files[0].id,
                        media: {
                            mimeType: mimeType,
                            body: fs.readFileSync(entryPath)
                        }
                    });
                    updatedFiles++;
                } else {
                    await drive.files.create({
                        requestBody: {
                            name: entry.name,
                            parents: [parentFolderId]
                        },
                        media: {
                            mimeType: mimeType,
                            body: fs.readFileSync(entryPath)
                        },
                        fields: 'id, name'
                    });
                    uploadedFiles++;
                }
            } else if (entry.isDirectory()) {
                const folder = await this.findOrCreateFolderForSync(drive, parentFolderId, entry.name);
                const subResults = await this.uploadFilesRecursiveForAutoBackup(drive, folder.id, entryPath);
                uploadedFiles += subResults.uploadedFiles;
                updatedFiles += subResults.updatedFiles;
            }
        });

        await Promise.all(uploadPromises);
        return { uploadedFiles, updatedFiles };
    }

    async saveBackupLogForAutoBackup(backupData, drive) {
        const backupHistory = await getValue('backupHistory') || [];
        backupHistory.unshift(backupData);

        if (backupHistory.length > 50) {
            backupHistory.splice(50);
        }

        await setValue('backupHistory', backupHistory);

        if (drive) {
            await this.syncBackupHistoryToDrive(drive, backupHistory);
        }
    }

    async trackPlayedWorlds() {
        try {
            const fs = require('fs');
            const path = require('path');
            const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
            const savesPath = `${dataDirectory}/.battly/saves`;

            if (!fs.existsSync(savesPath)) {
                return;
            }

            const worlds = fs.readdirSync(savesPath, { withFileTypes: true })
                .filter(entry => entry.isDirectory())
                .map(dir => {
                    const worldPath = path.join(savesPath, dir.name);
                    const levelDatPath = path.join(worldPath, 'level.dat');

                    let lastPlayed = 0;
                    if (fs.existsSync(levelDatPath)) {
                        const stats = fs.statSync(levelDatPath);
                        lastPlayed = stats.mtime.getTime();
                    }

                    return {
                        name: dir.name,
                        lastPlayed: lastPlayed
                    };
                });

            worlds.sort((a, b) => b.lastPlayed - a.lastPlayed);

            const recentWorlds = worlds.slice(0, 10);
            await setValue('recentWorlds', recentWorlds);

            console.log('🎮 Mundos recientes actualizados:', recentWorlds.length);
        } catch (error) {
            console.error('Error al rastrear mundos jugados:', error);
        }
    }

    async addEventListenerButtonsSound() {
    }

    async ContextMenuSettings() {
        const contextMenu = document.querySelector(".wrapper-contextmenu"),
            shareMenu = contextMenu.querySelector(".share-menu-contextmenu");

        window.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            let x = e.offsetX,
                y = e.offsetY,
                winWidth = window.innerWidth,
                winHeight = window.innerHeight,
                cmWidth = contextMenu.offsetWidth,
                cmHeight = contextMenu.offsetHeight;

            if (x > winWidth - cmWidth - shareMenu.offsetWidth) {
                shareMenu.style.left = "-150px";
            } else {
                shareMenu.style.left = "";
                shareMenu.style.right = "-200px";
            }

            x = x > winWidth - cmWidth ? winWidth - cmWidth - 5 : x;
            y = y > winHeight - cmHeight ? winHeight - cmHeight - 5 : y;

            contextMenu.style.left = `${x}px`;
            contextMenu.style.top = `${y}px`;
            contextMenu.style.visibility = "visible";
        });

        document.addEventListener(
            "click",
            () => (contextMenu.style.visibility = "hidden")
        );
    }

    async Ads() {
        fetch("https://api.battlylauncher.com/ads/get").then(async (res) => {
            let adsData = await res.json();

            let ads = document.getElementById("ads");
            ads.src = adsData.image;
            ads.addEventListener("click", () => {
                shell.openExternal(adsData.link);
            });
        });
    }

    async Solicitudes() {
        ipcRenderer.on("cargarSolicitudAmistad", async (event, args) => {
            changePanel("friends");
        });

        document.getElementById("friends-btn").addEventListener("click", () => {
            changePanel("friends");
        });

        document
            .getElementById("friends-volver-btn")
            .addEventListener("click", () => {
                changePanel("home");
            });
    }

    async SetStatus() {
        let account = await this.database?.getSelectedAccount();
        console.log(`Setting status for account: ${account.name}`);
        this.UpdateStatus(account.name, "online", await window.getString('home.inTheMenu') || 'en el menú');
    }

    async UpdateStatus(username, status, details) {
        console.log(`🧩 ${username} > ${status} > ${details}`);

        let account = await this.database?.getSelectedAccount();
        console.log(account);

        if (account?.type === "battly") {
            console.log("Updating Battly status...");
            if (!account.token) {
                new Alert().ShowAlert({
                    icon: "error",
                    title: await window.getString('home.passwordNotSet') || 'No has establecido contraseña',
                });

                this.database.delete(uuid, "accounts");
                return;
            }

            ipcRenderer.send("updateStatus", {
                username,
                status,
                details,
                token: account.token,
            });
        }
    }


    async Registros() {
        let logs = document.getElementById("battly-logs").value;

        fs.mkdirSync(`${dataDirectory} /.battly / temp`, { recursive: true });
        fs.writeFileSync(`${dataDirectory} /.battly / temp / logs.txt`, logs);
        shell.openPath(`${dataDirectory} /.battly / temp / logs.txt`);

        new Alert().ShowAlert({
            icon: "success",
            title: await window.getString('home.logsSavedCorrectly') || 'Logs guardados correctamente',
        });
    }



    async CambiarRutaJava() {
        let inputRutaJava = document.getElementById("ruta-java-input");

        let ruta_java = await getValue("java-path");

        if (ruta_java) {
            inputRutaJava.value = ruta_java;
        } else {
            if (process.platform === "win32") {
                if (
                    fs.existsSync(`${dataDirectory} /.battly / runtime / jre - 17.0.8 - win32`)
                ) {
                    inputRutaJava.value = `${dataDirectory} /.battly / runtime / jre - 17.0.8 - win32 / bin / java.exe`;
                    await setValue(
                        "java-path",
                        `${dataDirectory} /.battly / runtime / jre - 17.0.8 - win32 / bin / java.exe`
                    );
                } else if (
                    fs.existsSync(
                        `${dataDirectory} /.battly / runtime / jre - 17.0.1.12.1 - win32`
                    )
                ) {
                    inputRutaJava.value = `${dataDirectory} /.battly / runtime / jre - 17.0.1.12.1 - win32 / bin / java.exe`;
                    await setValue(
                        "java-path",
                        `${dataDirectory} /.battly / runtime / jre - 17.0.1.12.1 - win32 / bin / java.exe`
                    );
                } else if (
                    fs.existsSync(
                        `${dataDirectory} /.battly / runtime / jre - 17.0.8 - windows - x64`
                    )
                ) {
                    inputRutaJava.value = `${dataDirectory} /.battly / runtime / jre - 17.0.8 - windows - x64 / bin / java.exe`;
                    await setValue(
                        "java-path",
                        `${dataDirectory} /.battly / runtime / jre - 17.0.8 - windows - x64 / bin / java.exe`
                    );
                } else if (
                    fs.existsSync(
                        `${dataDirectory} /.battly / runtime / jre - 17.0.1.12.1 - windows - x64`
                    )
                ) {
                    inputRutaJava.value = `${dataDirectory} /.battly / runtime / jre - 17.0.1.12.1 - windows - x64 / bin / java.exe`;
                    await setValue(
                        "java-path",
                        `${dataDirectory} /.battly / runtime / jre - 17.0.1.12.1 - windows - x64 / bin / java.exe`
                    );
                } else {
                    inputRutaJava.value =
                        "Java no encontrado. Haz click aquí para buscarlo.";
                }
            } else {
                inputRutaJava.value =
                    "Java no encontrado. Haz click aquí para buscarlo.";
            }
        }
    }

    async GenerarLogsSocket() {
        ipcRenderer.on("getLogsAnterior", async () => {
            let generated = consoleOutput + "\n" + consoleOutput_;
            await fs.writeFileSync(logFilePath, generated);
        });
    }

    async GetLogsSocket() {
        ipcRenderer.on("avisoObtenerLogs", async (event, args) => {
            try {
                await modal.ask({
                    title: await window.getString('home.titleAccessLogs') || 'Acceso a logs',
                    text: await window.getString('home.textAccessLogs') || '¿Quieres dar acceso a tus logs?',
                    html: `${await window.getString('home.requester') || 'Solicitante:'} ${args.user} < br > ${await window.getString('home.reason') || 'Razón'}: ${args.razon} < br > <br>${await window.getString('home.textAccessLogsTwo') || '¿Estás seguro de que quieres compartir tus logs?'}`,
                    showCancelButton: true,
                    confirmButtonText: await window.getString('home.allow') || 'Permitir',
                    cancelButtonText: await window.getString('home.deny') || 'Denegar',
                    preConfirm: () => true
                });

                if (!fs.existsSync(logFilePath)) {
                    let generated = consoleOutput + "\n" + consoleOutput_;
                    await fs.writeFileSync(logFilePath, generated);

                    let account = await this.database?.getSelectedAccount();
                    let ram = (await this.database.get("1234", "ram")).value;
                    let Resolution = (await this.database.get("1234", "screen")).value;
                    let launcherSettings = (await this.database.get("1234", "launcher")).value;

                    let accountsOnlyUsernamesAndUUID = this.database.getAccounts().map(account => ({
                        username: account.name,
                        uuid: account.uuid,
                    }));

                    let accountOnlyUsernameAndUUID = {
                        username: account.name,
                        uuid: account.uuid,
                    };

                    const userData = {
                        selectedAccount: accountOnlyUsernameAndUUID,
                        accounts: accountsOnlyUsernamesAndUUID,
                        ram: ram,
                        resolution: Resolution,
                        launcherSettings: launcherSettings,
                        javaPath: await getValue("java-path"),
                        lang: await getValue("lang"),
                        theme: {
                            background_loading_screen_color: await getValue("background-loading-screen-color"),
                            bottom_bar_opacity: await getValue("theme-opacity-bottom-bar"),
                            color_bottom_bar: await getValue("theme-color-bottom-bar"),
                            color: await getValue("theme-color"),
                            start_sound: await getValue("sonido-inicio"),
                            playing_song: await getValue("songPlaying"),
                        },
                        news_shown: {
                            news_shown_v17: await getValue("news_shown_v1.7"),
                            news_shown_v18: await getValue("news_shown_v2.0"),
                        },
                        welcome_premium_shown: await getValue("WelcomePremiumShown"),
                    };

                    ipcRenderer.send("obtenerLogs", userData);
                } else {
                    await fs.unlinkSync(logFilePath);
                    let generated = consoleOutput + "\n" + consoleOutput_;
                    await fs.writeFileSync(logFilePath, generated);

                    let account = await this.database?.getSelectedAccount();
                    let ram = (await this.database.get("1234", "ram")).value;
                    let Resolution = (await this.database.get("1234", "screen")).value;
                    let launcherSettings = (await this.database.get("1234", "launcher")).value;

                    let accountsOnlyUsernamesAndUUID = this.database.getAccounts().map(account => ({
                        username: account.name,
                        uuid: account.uuid,
                    }));

                    let accountOnlyUsernameAndUUID = {
                        username: account.name,
                        uuid: account.uuid,
                    };

                    const userData = {
                        selectedAccount: accountOnlyUsernameAndUUID,
                        accounts: accountsOnlyUsernamesAndUUID,
                        ram: ram,
                        resolution: Resolution,
                        launcherSettings: launcherSettings,
                        javaPath: await getValue("java-path"),
                        lang: await getValue("lang"),
                        theme: {
                            background_loading_screen_color: await getValue("background-loading-screen-color"),
                            bottom_bar_opacity: await getValue("theme-opacity-bottom-bar"),
                            color_bottom_bar: await getValue("theme-color-bottom-bar"),
                            color: await getValue("theme-color"),
                            start_sound: await getValue("sonido-inicio"),
                            playing_song: await getValue("songPlaying"),
                        },
                        news_shown: {
                            news_shown_v17: await getValue("news_shown_v1.7"),
                            news_shown_v18: await getValue("news_shown_v2.0"),
                        },
                        welcome_premium_shown: await getValue("WelcomePremiumShown"),
                    };

                    ipcRenderer.send("obtenerLogs", userData);
                }

            } catch (err) {
                if (err === 'cancelled') {
                    new Alert().ShowAlert({
                        icon: "error",
                        title: await window.getString('home.accessLogsDenied') || 'Acceso a logs denegado',
                        text: await window.getString('home.accessLogsDeniedText') || 'Has denegado el acceso a los logs'
                    });
                } else {
                    console.error("Error inesperado al procesar solicitud de logs:", err);
                }
            }
        });


        ipcRenderer.on("enviarSocketID", async (event, args) => {
            try {
                await modal.ask({
                    title: await window.getString('home.titleAccessLogs') || 'Acceso a logs',
                    text: `${await window.getString('home.yourUniqueIdIs') || 'Tu ID único es'} ${args.sessionID} ${await window.getString('home.dontShareIt') || 'no lo compartas'}`,
                    showCancelButton: false,
                    confirmButtonText: await window.getString('home.copy') || 'Copiar',
                    preConfirm: () => true
                });

                navigator.clipboard.writeText(args.sessionID);
                new Alert().ShowAlert({
                    icon: "success",
                    title: await window.getString('home.idCopiedCorrectly') || 'ID copiado correctamente',
                });

            } catch (err) {
                console.error("Error al copiar ID:", err);
            }
        });

    }

    async WaitData() {
        if (!fs.existsSync(`${dataDirectory}/.battly`)) {
            fs.mkdirSync(`${dataDirectory}/.battly`);
        }

        if (!fs.existsSync(`${dataDirectory}/.battly/instances`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/instances`);
        }

        if (!fs.existsSync(`${dataDirectory}/.battly/battly`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/battly`);
        }

        if (!fs.existsSync(`${dataDirectory}/.battly/battly/mods-internos`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/battly/mods-internos`);
        }

        if (!fs.existsSync(`${dataDirectory}/.battly/battly/launcher`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/battly/launcher`);
        }

        if (
            !fs.existsSync(`${dataDirectory}/.battly/battly/launcher/config-launcher`)
        ) {
            fs.mkdirSync(`${dataDirectory}/.battly/battly/launcher/config-launcher`);
        }

        if (!fs.existsSync(`${dataDirectory}/.battly/battly/launcher/forge`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/battly/launcher/forge`);
        }

        if (!fs.existsSync(`${dataDirectory}/.battly/battly/launcher/mc-assets`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/battly/launcher/mc-assets`);
        }
    }

    async ShowNews() {
        let btnShowNews = document.getElementById("btnShowNews");
        btnShowNews.addEventListener("click", async () => {
            changePanel("news");
        });
        let news_shown = await getValue("news_shown_v3.0");
        if (
            !news_shown ||
            news_shown == "false" ||
            news_shown == null ||
            news_shown == undefined
        ) {
            setTimeout(function () {
                changePanel("news");
            }, 1500);
        }
    }

    async InitTheme() {
        const btnDownload1 = document.getElementById("music-btn");
        btnDownload1.addEventListener("click", () => {
            changePanel("music");
        });

        const video = document.getElementById("video-background");
        let backgroundVideo = await getValue("background-video");

        if (backgroundVideo) {
            video.style.display = "";
            video.querySelector("source").src = backgroundVideo;
            video.load();
            video.play();
        } else {
            video.style.display = "none";
        }

        if (!await getValue("launchboost")) {
            document.getElementById("launchboost").removeAttribute("checked");
        }
    }


    async IniciarEstadoDiscord() {
        ipcRenderer.send("new-status-discord");
    }

    async CargarMods() {
        let BotonUnirseServidorDiscord = document.getElementById(
            "BotonUnirseServidorDiscord"
        );
        BotonUnirseServidorDiscord.addEventListener("click", function () {
            const os = require("os");
            const shell = require("electron").shell;

            if (os.platform() === "win32") {
                shell.openExternal("https://discord.gg/tecno-bros-885235460178342009");
            } else {
                window.open(
                    "https://discord.gg/tecno-bros-885235460178342009",
                    "_blank"
                );
            }
        });

        document
            .getElementById("openBattlyFolderButton")
            .addEventListener("click", async () => {
                shell.openPath(`${dataDirectory}\\.battly`).then(async () => {
                    new Alert().ShowAlert({
                        icon: "success",
                        title: await window.getString('home.battlyFolderOpened') || 'Carpeta de Battly abierta',
                    });
                });
            });
    }

    async initConfig() {
        let opened = false;
        let moreSettingsBtn = document.getElementById("more-settings-btn");
        moreSettingsBtn.addEventListener("click", () => {
            const moreOptions = document.querySelector(".more-options");
            const moreSettingsIcon = document.querySelector("#more-settings-btn i");
            if (opened) {
                moreOptions.style.transition =
                    "max-height 0.3s ease-in, opacity 0.3s ease-in, visibility 0s 0.3s";
                moreOptions.classList.remove("active");
                moreSettingsIcon.style.transform = "rotate(0deg)";
            } else {
                moreOptions.style.transition =
                    "max-height 0.3s ease-out, opacity 0.3s ease-out, visibility 0s";
                moreOptions.classList.add("active");
                moreSettingsIcon.style.transform = "rotate(180deg)";
            }
            opened = !opened;

            document.addEventListener("click", (e) => {
                if (
                    !moreSettingsBtn.contains(e.target) &&
                    !moreOptions.contains(e.target)
                ) {
                    moreOptions.style.transition =
                        "max-height 0.3s ease-in, opacity 0.3s ease-in, visibility 0s 0.3s";
                    moreOptions.classList.remove("active");
                    moreSettingsIcon.style.transform = "rotate(0deg)";
                    opened = false;
                }
            });
        });

        const slider = document.querySelector(".home-online-friends");
        let isDown = false;
        let startX;
        let scrollLeft;
        let velX = 0;
        let momentumID;

        slider.addEventListener("mousedown", (e) => {
            isDown = true;
            slider.classList.add("active");
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;

            document.querySelectorAll(".online-friend").forEach((friend) => {
                friend.style.cursor = "grabbing";
            });
            cancelMomentumTracking();
        });

        slider.addEventListener("mouseleave", () => {
            isDown = false;
            slider.classList.remove("active");

            document.querySelectorAll(".online-friend").forEach((friend) => {
                friend.style.cursor = "pointer";
            });

            beginMomentumTracking();
        });

        slider.addEventListener("mouseup", () => {
            isDown = false;
            slider.classList.remove("active");

            document.querySelectorAll(".online-friend").forEach((friend) => {
                friend.style.cursor = "pointer";
            });

            beginMomentumTracking();
        });

        slider.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.1;
            velX = walk - (slider.scrollLeft - scrollLeft);
            slider.scrollLeft = scrollLeft - walk;
        });

        function beginMomentumTracking() {
            cancelMomentumTracking();
            momentumID = requestAnimationFrame(momentumLoop);
        }

        function cancelMomentumTracking() {
            cancelAnimationFrame(momentumID);
        }

        function momentumLoop() {
            slider.scrollLeft -= velX;
            velX *= 0.95;
            if (Math.abs(velX) > 0.5) {
                momentumID = requestAnimationFrame(momentumLoop);
            }
        }
        if (!fs.existsSync(`${dataDirectory}/.battly`)) {
            fs.mkdirSync(`${dataDirectory}/.battly`);
        } else if (!fs.existsSync(`${dataDirectory}/.battly/instances`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/instances`);
        } else if (!fs.existsSync(`${dataDirectory}/.battly/versions`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/versions`);
        }

        await window.stringLoader.loadStrings();

        window.stringLoader.applyStrings();

        const tooltips = {
            "boton_abrir_mods": window.stringLoader.getString("tooltips.mods"),
            "music-btn": window.stringLoader.getString("tooltips.music"),
            "instancias-btn": window.stringLoader.getString("tooltips.instances"),
            "download-btn": window.stringLoader.getString("tooltips.download"),
            "play-btn": window.stringLoader.getString("tooltips.play")
        };

        Object.keys(tooltips).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const spanElement = element.querySelector(".button-span, .play-button-span");
                if (spanElement) {
                    spanElement.innerHTML = tooltips[id];
                }
            }
        });

        const inputElements = document.querySelectorAll('input[placeholder]');
        inputElements.forEach(input => {
            if (input.id === 'input_buscar_mods') {
                input.placeholder = window.stringLoader.getString("mods.searchMods");
            }
        });


    }

    async initNews() {
        let news = document.getElementById("battly-news-div");
        let thiss = this;

        async function LoadNews() {
            if (thiss.news) {
                if (!thiss.news.length) {
                    let blockNews = document.createElement("div");
                    blockNews.classList.add("news-block", "opacity-1");
                    blockNews.innerHTML = `
      <div class="new-panel">
        <div class="new-panel-top">
          <p class="new-panel-title">${await window.getString('homePanel.noNewsAvailable') || 'No news currently available.'}</p>
        </div>
        <div class="new-panel-bottom">
          <p class="new-panel-description">${await window.getString('homePanel.followNews') || 'You can follow all news related to the server here.'}</p>
        </div>
      </div>`;
                    news.appendChild(blockNews);
                } else {
                    for (let News of thiss.news) {
                        let date = await thiss.getdate(News.publish_date);
                        let blockNews = document.createElement("div");
                        blockNews.classList.add("news-block");
                        blockNews.innerHTML = `
      <div class="new-panel">
        <div class="new-panel-top">
          <p class="new-panel-title">${News.title}</p>
          <div class="new-panel-date">
            <p class="new-panel-date-day">${date.day}</p>
            <p class="new-panel-date-month">${date.month}</p>
          </div>
        </div>
        <div class="new-panel-bottom">
          <p class="new-panel-description">${News.content.replace(
                            /\n/g,
                            "</br>"
                        )}</p>
          <p class="new-panel-author"><span><i class="fa-solid fa-hammer"></i> ${News.author
                            }</span></p>
        </div>
      </div>`;
                        news.appendChild(blockNews);
                    }
                }
            } else {
                let blockNews = document.createElement("div");
                blockNews.classList.add("news-block", "opacity-1");
                blockNews.innerHTML = `
      <div class="news-header">
        <div class="header-text">
          <div class="title">Error</div>
        </div>
      </div>
      <div class="news-content">
        <div class="bbWrapper">
          <p>${await window.getString('homePanel.cannotConnectToNews') || 'Cannot connect to news server.</br>Please check your internet connection'}</p>
      </div>
    </div>`;
                news.appendChild(blockNews);
            }

            if (thiss.BattlyConfig.adv === true) {
                console.log("Mostrar aviso de publicidad");
                console.log(thiss.BattlyConfig);
                const advStatus = thiss.BattlyConfig.advStatus;
                const advText = thiss.BattlyConfig.advText;

                document.getElementById("warning-status").classList.add(advStatus);
                document.getElementById("warning-status").style.display = "block";

                document.getElementById("warning-status-message").innerHTML = advText;
            } else {
                document.getElementById("warning-status").style.display = "none";
            }
        }

        let totalNewsLoaded = 0;


        news.addEventListener("scroll", async () => {
            const scrollPosition = Math.round(news.scrollTop + news.clientHeight);
            const scrollThreshold = Math.round(news.scrollHeight);

            console.log(`${scrollPosition} >= ${scrollThreshold}`);

            if (scrollPosition >= scrollThreshold) {
                if (document.getElementById("typeOfNews").value === "minecraft") {
                    totalNewsLoaded += 10;
                    console.log(totalNewsLoaded);
                    LoadMinecraftNews();
                }
            }
        });

        document.getElementById("header-text-to-add").addEventListener("click", () => {
            const os = require("os");
            if (os.platform() === "win32") {
                shell.openExternal("https://battlylauncher.com/premium?utm_source=launcher&utm_medium=header&utm_campaign=premium");
            } else {
                window.open("https://battlylauncher.com/premium?utm_source=launcher&utm_medium=header&utm_campaign=premium", "_blank");
            }
        });


        async function LoadMinecraftNews() {
            function compareDates(a, b) {
                let dateA = new Date(a.date);
                let dateB = new Date(b.date);
                return dateB - dateA;
            }

            function convertDates(date) {
                let date_ = new Date(date);
                let day = date_.getDate();
                let month = date_.getMonth() + 1;
                let year = date_.getFullYear();
                return `${day} / ${month} / ${year}`;
            }

            fetch("https://launchercontent.mojang.com/v2/javaPatchNotes.json", {
                method: "GET",
            })
                .then((response) => response.json())
                .then((data) => {
                    let minecraftNews = data.entries;
                    minecraftNews.sort(compareDates);
                    for (let i = 0; i < totalNewsLoaded + 10 && i < minecraftNews.length; i++) {
                        fetch(`https://launchercontent.mojang.com/v2/${minecraftNews[i].contentPath}`, {
                            method: "GET",
                        }).then((response) => response.json()).then((data_) => {
                            console.log(data_);
                            let blockNews = document.createElement("div");
                            blockNews.classList.add("news-block");
                            blockNews.innerHTML = `
                    <div class="new-panel">
                        <div class="new-panel-top">
                            <p class="new-panel-title">${minecraftNews[i].title}</p>
                            <div class="new-panel-date">
                                <p class="new-panel-date-day">${convertDates(minecraftNews[i].date)}</p>
                            </div>
                        </div>
                        <div class="new-panel-bottom">
                            <p class="new-panel-description">${data_.body}</p>
                            <p class="new-panel-author"><span><i class="fa-solid fa-hammer"></i> Mojang</span></p>
                        </div>
                    </div>`;
                            news.appendChild(blockNews);
                        });
                    }
                });
        }

        LoadNews();

        document.getElementById("typeOfNews").addEventListener("change", (e) => {
            let type = e.target.value;
            news.innerHTML = "";
            if (type === "battly") {
                LoadNews();
            } else {
                LoadMinecraftNews();
            }
        });
    }

    async initStatusServer() {
        const APIServerData = document.getElementById("Battly_API_Desc");
        const WEBServerData = document.getElementById("Battly_WEB_Desc");
        const APIServerStatus = document.getElementById("Battly_API_Estado");
        const WEBServerStatus = document.getElementById("Battly_WEB_Estado");
        const miembrosEnLinea = document.getElementById("Miembros_Online");

        const APIServer = "https://api.battlylauncher.com";
        const WEBServer = "https://battlylauncher.com";
        const APIMembers = `${APIServer}/battlylauncher/usuarios_online`;

        async function fetchWithTimeout(url, options = {}, timeout = 15000) {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal, cache: "no-store" });
                return response;
            } finally {
                clearTimeout(id);
            }
        }

        async function checkStatus(url) {
            try {
                const res = await fetchWithTimeout(url);
                return res.ok;
            } catch {
                return false;
            }
        }

        async function getJson(url) {
            try {
                const res = await fetchWithTimeout(url);
                return res.ok ? await res.json() : null;
            } catch {
                return null;
            }
        }

        const [apiOk, webOk, membersData] = await Promise.all([
            checkStatus(APIServer),
            checkStatus(WEBServer),
            getJson(APIMembers),
        ]);

        APIServerData.innerHTML = apiOk
            ? `<span class="green">${await window.getString('home.operative') || 'Operativo'}</span>`
            : `<span class="red">${await window.getString('home.notConnected') || 'No operativo - No conectado'}</span>`;

        WEBServerData.innerHTML = webOk
            ? `<span class="green">${await window.getString('home.operative') || 'Operativo'}</span>`
            : `<span class="red">${await window.getString('home.notConnected') || 'No operativo - No conectado'}</span>`;

        const usuarios = Number(membersData?.usuarios);
        miembrosEnLinea.textContent = Number.isFinite(usuarios) && usuarios >= 0
            ? `${usuarios} ${await window.getString('home.usersOnline') || 'usuarios online'}`
            : "0";

        if (APIServerStatus) APIServerStatus.textContent = apiOk ? "OK" : "DOWN";
        if (WEBServerStatus) WEBServerStatus.textContent = webOk ? "OK" : "DOWN";
    }


    initBtn() {
        document.getElementById("settings-btn").addEventListener("click", () => {
            changePanel("settings");
        });

        document.getElementById("download-btn").addEventListener("click", () => {
            new Download().HandleDownloadPanel();
        });
    }

    async getdate(e) {
        let date = new Date(e);
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let allMonth = [
            await window.getString('months.january') || 'Enero',
            await window.getString('months.february') || 'Febrero',
            await window.getString('months.march') || 'Marzo',
            await window.getString('months.april') || 'Abril',
            await window.getString('months.may') || 'Mayo',
            await window.getString('months.june') || 'Junio',
            await window.getString('months.july') || 'Julio',
            await window.getString('months.august') || 'Agosto',
            await window.getString('months.september') || 'Septiembre',
            await window.getString('months.october') || 'Octubre',
            await window.getString('months.november') || 'Noviembre',
            await window.getString('months.december') || 'Diciembre',
        ];
        return {
            year: year,
            month: allMonth[month - 1],
            day: day,
        };
    }
}
export default Home;
