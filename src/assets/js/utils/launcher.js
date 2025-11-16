const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");
const { getValue, setValue } = require('./storage');
import { logger, database, changePanel } from "../utils.js";

const dataDirectory =
    process.env.APPDATA ||
    (process.platform == "darwin"
        ? `${process.env.HOME}/Library/Application Support`
        : process.env.HOME);

const ShowCrashReport = require("./crash-report.js").CrashReport.prototype.ShowCrashReport;

async function LaunchDownloadedVersion(instance, versionData) {
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
    let selectedAccount = await instance.database.getSelectedAccount();

    const pkg = require("../package.json");
    let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
    let ram = (await instance.database.get("1234", "ram")).value;
    const gameUrl = instance.config.game_url || `${urlpkg}/files`;
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
                build: instance.BattlyConfig.loader.build,
                enable: loader === "vanilla" ? false : loaderEnabled,
            },
            verify: false,
            ignored: selectedAccount.type === "microsoft" ? ["libraries/com/mojang/authlib"] : [],
            java: false,
            memory: memory,
            beforeLaunch: instance.BattlyConfig.beforeLaunch,
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
                let launcherSettings = (await instance.database.get("1234", "launcher")).value;
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

            let launcherSettings = (await instance.database.get("1234", "launcher")).value;
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

                let launcherSettings = (await instance.database.get("1234", "launcher")).value;
                ipcRenderer.send("main-window-hide", { shouldHideLauncher: launcherSettings.launcher.close === "close-launcher" });
            }

            console.log(e)
        });

        launcher.on('close', async (code) => {
            console.log("🎮 Minecraft cerrado con código:", code);

            await instance.trackPlayedWorlds();

            let launcherSettings = (await instance.database.get("1234", "launcher")).value;
            if (launcherSettings.launcher.close === "close-launcher") ipcRenderer.send("main-window-show");

            const autoSyncEnabled = await getValue('autoSyncEnabled');
            console.log("🔍 Estado de autoSyncEnabled:", autoSyncEnabled);

            if (autoSyncEnabled) {
                console.log('🔄 Iniciando sincronización automática en segundo plano...');
                instance.startAutoBackupOnGameClose().catch(err => {
                    console.error('❌ Error en sincronización automática:', err);
                });
            } else {
                console.log('⏸️ Sincronización automática desactivada. No se realizará backup.');
            }
        });
    }
}

module.exports = { LaunchDownloadedVersion };