const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const AnalyticsHelper = require('./assets/js/utils/analyticsHelper.js');
import * as NBT from "../../../../node_modules/nbtify/dist/index.js";
import { LoadAPI } from "../utils/loadAPI.js";
const { Launch } = require("./assets/js/libs/mc/Index");
import { consoleOutput } from "./logger.js";
let consoleOutput_ = + consoleOutput;
import { logger, database, changePanel } from "../utils.js";
import { CrashReport } from "./crash-report.js";
const got = require("got");
const dataDirectory = process.env.APPDATA || (process.platform == "darwin" ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
const ShowCrashReport = new CrashReport().ShowCrashReport;
const { Lang } = require("./assets/js/utils/lang.js");
let langs;
new Lang().GetLang().then(lang_ => {
  langs = lang_;
}).catch(error => {
  console.error("Error:", error);
});

class LoadMinecraft {
  async LaunchMinecraft(options) {
    console.log("Launching Minecraft...");
    console.log(options);
    const db = await new database().init();
    const BattlyConfig = await new LoadAPI().GetConfig();
    const launcherSettings = (await db.get("1234", "launcher")).value;
    let account = await db.getSelectedAccount();

    // Track Minecraft start
    const minecraftStartTime = Date.now();
    AnalyticsHelper.trackMinecraftStart(
      options.loader.enable ? `${options.version}-${options.loader.type}` : options.version,
      options.loader.enable ? options.loader.type : null
    ).catch(err => console.error('Error tracking Minecraft start:', err));

    async function UpdateStatus(username, status, details) {
      console.log(`🧩 ${username} > ${status} > ${details}`);

      if (account.type === "battly") {
        ipcRenderer.send("updateStatus", {
          status: status,
          details: details,
          token: account.token,
        });
      }
    }

    let version_real;
    if (options.loader.enable) {
      version_real = `${options.version}-${options.loader.type}`;
    } else {
      version_real = options.version;
    }

    async function downloadFile(url, outputPath) {
      try {

        const response = await got(url, {
          responseType: 'buffer'

        });

        fs.writeFileSync(outputPath, response.body);

        console.log(`Archivo descargado y guardado en ${outputPath}`);
      } catch (error) {
        console.error('Error al descargar el archivo:', error.message);
      }
    }

    async function checkJavaAvailability(requiredJavaVersion) {
      const javaExe = process.platform === "win32" ? "java.exe" : "java";
      const runtimeDir = path.join(dataDirectory, ".battly", "runtime");

      if (!fs.existsSync(runtimeDir)) {
        fs.mkdirSync(runtimeDir, { recursive: true });
        return null;
      }

      let folders = fs.readdirSync(runtimeDir).filter(f => f.startsWith(requiredJavaVersion));

      if (folders.length === 0) {

        const majorVersionMatch = requiredJavaVersion.match(/(\d+)/);
        if (majorVersionMatch) {
          const majorVersion = majorVersionMatch[1];
          folders = fs.readdirSync(runtimeDir).filter(f =>
            f.includes(`jre-${majorVersion}`) ||
            f.includes(`java-${majorVersion}`) ||
            f.includes(`jdk-${majorVersion}`)
          );
        }
      }

      if (folders.length === 0) {
        return null;
      }

      const javaPath = path.join(runtimeDir, folders[0], "bin", javaExe);
      return fs.existsSync(javaPath) ? javaPath : null;
    }

    async function downloadJavaIfNeeded(requiredJavaVersion) {
      console.log(`Verificando Java versión ${requiredJavaVersion}...`);

      const existingJava = await checkJavaAvailability(requiredJavaVersion);
      if (existingJava) {
        console.log(`Java ${requiredJavaVersion} ya está disponible en: ${existingJava}`);
        return existingJava;
      }

      console.log(`Java ${requiredJavaVersion} no encontrado. Descargando...`);

      try {

        const downloadJavaVersion = require('./download-java.js');

        let javaMajorVersion = "17";

        if (requiredJavaVersion.includes("jre-8") ||
          requiredJavaVersion.includes("java-8") ||
          requiredJavaVersion.includes("1.8")) {
          javaMajorVersion = "8";
        } else if (requiredJavaVersion.includes("jre-11") ||
          requiredJavaVersion.includes("java-11")) {
          javaMajorVersion = "11";
        } else if (requiredJavaVersion.includes("jre-17") ||
          requiredJavaVersion.includes("java-17")) {
          javaMajorVersion = "17";
        } else if (requiredJavaVersion.includes("jre-21") ||
          requiredJavaVersion.includes("java-21")) {
          javaMajorVersion = "21";
        } else {

          const versionMatch = requiredJavaVersion.match(/(\d+)/);
          if (versionMatch) {
            const extractedVersion = parseInt(versionMatch[1]);
            if ([8, 11, 17, 21].includes(extractedVersion)) {
              javaMajorVersion = extractedVersion.toString();
            }
          }
        }

        const javaBasePath = path.join(dataDirectory, ".battly");

        const javaPath = await downloadJavaVersion(javaMajorVersion, {
          basePath: javaBasePath,
          imageType: "jre",
          intelEnabledMac: false,
          onProgress: (progress) => {
            if (progress.phase === 'download') {
              const percent = progress.percent ? progress.percent.toFixed(1) : 'unknown';
              console.log(`Descargando Java: ${percent}% - ${progress.file || 'archivo'}`);

              const progressText = document.getElementById("progressText1-download");
              const logTextArea = document.getElementById("battly-logs");
              if (progressText && percent !== 'unknown') {
                progressText.innerHTML = `☕ ${langs.downloading_java || 'Descargando Java'} ${javaMajorVersion}... ${percent}%`;
              }
              if (logTextArea) {
                if (progress.fileIndex === 1 && progress.totalFiles) {
                  logTextArea.innerHTML += `\n☕ ${langs.downloading_java || 'Descargando Java'} ${javaMajorVersion}...`;
                }
                if (percent !== 'unknown') {

                  const lines = logTextArea.innerHTML.split('\n');
                  if (lines.length > 0 && lines[lines.length - 1].includes('☕')) {
                    lines[lines.length - 1] = `☕ ${langs.downloading_java || 'Descargando Java'} ${javaMajorVersion}... ${percent}%`;
                    logTextArea.innerHTML = lines.join('\n');
                  }
                }
                logTextArea.scrollTop = logTextArea.scrollHeight;
              }
            } else if (progress.phase === 'extract') {
              const progressText = document.getElementById("progressText1-download");
              const logTextArea = document.getElementById("battly-logs");
              if (progressText) {
                progressText.innerHTML = `☕ ${langs.installing_java || 'Instalando Java'} ${javaMajorVersion}...`;
              }
              if (logTextArea) {
                logTextArea.innerHTML += `\n🔧 ${langs.installing_java || 'Instalando Java'} ${javaMajorVersion}...`;
                logTextArea.scrollTop = logTextArea.scrollHeight;
              }
            }
          }
        });

        console.log(`Java ${javaMajorVersion} descargado correctamente en: ${javaPath}`);

        const logTextArea = document.getElementById("battly-logs");
        if (logTextArea) {
          logTextArea.innerHTML += `\n✅ Java ${javaMajorVersion} instalado correctamente.`;
          logTextArea.scrollTop = logTextArea.scrollHeight;
        }

        return javaPath;

      } catch (error) {
        console.error(`Error descargando Java ${requiredJavaVersion}:`, error);
        throw new Error(`No se pudo descargar Java ${requiredJavaVersion}. Error: ${error.message}`);
      }
    }

    async function handleDownload(version_real, account, dataDirectory) {
      if (version_real.endsWith("-forge")) {
        try {
          const response = await got(`https://api.battlylauncher.com/battlylauncher/optifine/versions/${version_real.replace("-forge", "")}`, {
            headers: {
              Authorization: account.token,
            },
            responseType: 'json'

          });

          const data = response.body;
          console.log(data);

          if (data.error) {
            console.error(data.error);
            return;
          }

          let versionToDownload = data[0];
          let downloadUrl = versionToDownload.download.link;
          let filename = versionToDownload.download.filename;
          let destPath = path.join(dataDirectory, '.battly', 'mods', filename);

          if (versionToDownload.requiredJavaVersion) {
            try {
              await downloadJavaIfNeeded(versionToDownload.requiredJavaVersion);
            } catch (javaError) {
              console.error("Error con Java para OptiFine:", javaError);

            }
          }

          const modsDir = path.join(dataDirectory, '.battly', 'mods');
          if (!fs.existsSync(modsDir)) {
            fs.mkdirSync(modsDir, { recursive: true });
          }

          console.log(`Descargando OptiFine ${filename}...`);

          await downloadFile(downloadUrl, destPath);

          console.log(`OptiFine ${filename} descargado correctamente.`);
        } catch (error) {
          console.error(error.message);
        }
      }
    }

    console.log("EL valor recivido es" + options.isOptiForgeChecked)

    if (options.isOptiForgeChecked) {
      handleDownload(version_real, { token: account.token }, dataDirectory);
    }

    const Launcher = new Launch();
    await Launcher.Launch(options);

    let JSONDownloadShown = false;
    let seMostroExtrayendo_core = false;
    let lastProgreso = -1;
    let progresoShown = false;
    let iniciando = false;
    let inicio = false;
    let estimatedTime = `- ${langs.calculating_time}...`;

    const progressText1 = document.getElementById("progressText1-download");
    const logTextArea1 = document.getElementById("battly-logs");
    const progressFill1 = document.getElementById("progress");
    const modalDiv1 = document.getElementById("modalDiv1-download");

    function updateTextareaScroll() {
      logTextArea1.scrollTop = logTextArea1.scrollHeight;

    }

    Launcher.on("downloadJSON", (download) => {
      if (!JSONDownloadShown) {
        progressText1.innerHTML = langs.downloading_json_files;
        JSONDownloadShown = true;
      }
      consoleOutput_ += `[JSON] ▶️ ${download.file}\n`;
      if (download.type === "info") {
        logTextArea1.innerHTML += `🔃 ${langs.downloading} ${download.file}...\n`;
        updateTextareaScroll();
      } else if (download.type === "success") {
        logTextArea1.innerHTML += `✅ ${download.file} ${langs.downloaded_successfully}.\n`;
        updateTextareaScroll();
      }
    });

    Launcher.on('extract', extract => {
      console.log(`[EXTRACT] ${extract}`);
      consoleOutput_ += `[EXTRACT] ${extract}\n`;
      if (seMostroExtrayendo_core) {
        progressText1.innerHTML = langs.extracting_loader;
      } else {
        logTextArea1.innerHTML += `\n${langs.extracting_loader}...`;
        updateTextareaScroll();
        seMostroExtrayendo_core = true;
      }
    });

    Launcher.on('progress', (progress, size, element) => {
      element = element.replace("Libraries", langs.libraries)
      console.log(`Descargando ${element} ${progress} / ${size}`);
      if (!progresoShown) {
        progressFill1.classList.remove("animated-fill");
        progressText1.innerHTML = langs.downloading_version;
        progresoShown = true;
      }
      let progreso = ((progress / size) * 100).toFixed(0);
      if (progreso > 100) {
        progreso = 100;
      }

      if (progreso != lastProgreso) {
        logTextArea1.innerHTML += `\n${langs.downloading} ${element}... ${progreso}%`;
        lastProgreso = progreso;
      } else {
      }

      consoleOutput_ += `[DESCARGANDO] ${element} ${progress} / ${size}\n`;
      updateTextareaScroll();
      ipcRenderer.send("main-window-progress", {
        progress,
        size,
      });
      if (!isNaN(progress)) {
        progressFill1.max = size;
        progressFill1.value = progress;
      }
    });

    Launcher.on('check', (progress, size, element) => {
      element = element.replace("libraries", langs.libraries);
      console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
      let progreso = ((progress / size) * 100).toFixed(0);
      if (progreso > 100) {
        progreso = 100;
      }

      if (progreso != lastProgreso) {
        logTextArea1.innerHTML += `\n🔃 ${langs.checking} ${element} ... ${progreso}%`;
        lastProgreso = progreso;
        updateTextareaScroll();
      } else {
      }

      consoleOutput_ += `[INSTALANDO MC] ${progress} / ${size}\n`;
      let seMostroInstalando = false;
      if (seMostroInstalando) {
        progressText1.innerHTML = langs.installing_loader;
      } else {
        seMostroInstalando = true;
      }
      let size_actual = 100;
      let progress_actual = ((progress / size) * 100).toFixed(0);
      ipcRenderer.send("main-window-progress", {
        progress_actual,
        size_actual,
      });

      progressFill1.max = size;
      progressFill1.value = progress;
      console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
    });

    Launcher.on('estimated', (time) => {
      ipcRenderer.send("main-window-progress-reset");

      if (isNaN(time) || !isFinite(time)) {
        estimatedTime = `- ${langs.estimated_time_not_available}`;
      } else {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = Math.floor(time - hours * 3600 - minutes * 60);

        if (hours > 0) {
          estimatedTime =
            hours > 1
              ? `- ${langs.remaining} ${hours}h`
              : `- ${langs.remaining_two} ${hours}h`;
        } else if (minutes > 0) {
          estimatedTime =
            minutes > 1
              ? `- ${langs.remaining} ${minutes}m`
              : `- ${langs.remaining_two} ${minutes}m`;
        } else {
          estimatedTime =
            seconds > 1
              ? `- ${langs.remaining} ${seconds}s`
              : `- ${langs.remaining_two} ${seconds}s`;
        }
      }

    })

    Launcher.on('speed', (speed) => {
      let velocidad = speed / 1067008;

      progressText1.innerHTML = `🔃 ${langs.downloading}... (${velocidad.toFixed(2)} MB/s) - ${estimatedTime}`;
    })

    let logBuffer = [];
    let updateScheduled = false;
    let updateTimeout = null;

    function scheduleUpdate() {
      if (!updateScheduled) {
        updateScheduled = true;
        updateTimeout = setTimeout(() => {

          logTextArea1.innerHTML += logBuffer.join('');
          logBuffer = [];

          updateTextareaScroll();
          updateScheduled = false;
        }, 500);

      }
    }

    Launcher.on('patch', patch => {
      progressText1.innerHTML = `🔃 ${langs.applying_patches}`;

      logBuffer.push(`\n${patch}`);
      consoleOutput_ += `[INSTAL. LOADER] ${patch}\n`;

      progressFill1.removeAttribute("max");
      progressFill1.removeAttribute("value");

      scheduleUpdate();
    });

    Launcher.on('data', async (e) => {
      console.log(`[MC] ${e}`);
      new logger("Minecraft", "#36b030");
      consoleOutput_ += `[MC] ${e}\n`;

      if (e.includes("Launching with arguments"))
        progressText1.innerHTML = `${langs.starting_minecraft}...`;

      if (iniciando == false) {
        iniciando = true;

        let serversDat = `${dataDirectory}/.battly/servers.dat`;

        if (fs.existsSync(serversDat)) {
          try {
            const serversDatFile = fs.readFileSync(serversDat);
            const serversDatData = await NBT.read(serversDatFile);

            const servers = BattlyConfig.promoted_servers;
            const existingIPs = new Set(serversDatData.data.servers.map(server => server.ip));

            const serversArray = servers.reduce((accumulator, server) => {
              if (!existingIPs.has(server.ip) && server.enabled) {
                accumulator.push(server);
              } else if (existingIPs.has(server.ip) && !server.enabled) {

                serversDatData.data.servers = serversDatData.data.servers.filter(existingServer => existingServer.ip !== server.ip);
              } else if (existingIPs.has(server.ip) && server.enabled) {

                serversDatData.data.servers = serversDatData.data.servers.filter(existingServer => existingServer.ip !== server.ip);
                accumulator.push(server);
              }
              return accumulator;
            }, []);

            serversDatData.data.servers = serversArray.concat(serversDatData.data.servers);
            console.log(serversDatData);
            const editedServersDat = await NBT.write(serversDatData);
            fs.writeFileSync(serversDat, editedServersDat);
          } catch (error) {
            console.error("Error al procesar el archivo NBT");
            console.error(error);
          }
        } else {
          try {
            let servers = BattlyConfig.promoted_servers;

            let serversArray = [];

            for (let i = 0; i < servers.length; i++) {
              const newServer = {
                name: servers[i].name,
                ip: servers[i].ip,
                icon: servers[i].icon,
              };
              serversArray.push(newServer);
            }

            const newData = { servers: serversArray };
            const editedServersDat = await NBT.write(newData);
            fs.writeFileSync(serversDat, editedServersDat);
          } catch (error) {
            console.error("Error al crear el nuevo archivo NBT:", error);
          }
        }
      }

      if (e.includes("Incompatible mods found!")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_six} \nError:\n${e}`, options, account
        );
      }

      if (e.includes("Failed to start the minecraft server")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_one} \nError:\n${e}`, options, account
        );
      }
      if (e.includes('Exception in thread "main" ')) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_two} \nError:\n${e}`, options, account
        );
      }

      if (
        e.includes(
          "There is insufficient memory for the Java Runtime Environment to continue."
        )
      ) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_three} \nError:\n${e}`, options, account
        );
      }
      if (e.includes("Could not reserve enough space for object heap")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_three} \nError:\n${e}`, options, account
        );
      }

      if (e.includes("Forge patcher exited with code 1")) {
        modalDiv1.remove();
        ShowCrashReport(`${langs.error_detected_four} \nError:\n${e}`, options, account);
      }

      if (e.includes("Unable to launch")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_five} \nError:\n${e}`, options, account
        );
      }

      if (
        e.includes("Minecraft Crash Report") &&
        !e.includes("THIS IS NOT A ERROR")
      ) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_one} \nError:\n${e}`, options, account
        );
      }

      if (e.includes("java.lang.ClassCastException")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_five} \nError:\n${e}`, options, account
        );
      }

      if (e.includes("Minecraft has crashed!")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_five} \nError:\n${e}`, options, account
        );
      }

      if (
        e.includes(`Setting user: ${account.name}`) ||
        e.includes("Launching wrapped minecraft")
      ) {
        if (inicio == false) {

          if (launcherSettings.launcher.close === "close-launcher")
            ipcRenderer.send("main-window-hide");

          let typeOfVersion;
          if (version_real.endsWith("-forge")) {
            typeOfVersion = "Forge";
          } else if (version_real.endsWith("-fabric")) {
            typeOfVersion = "Fabric";
          } else if (version_real.endsWith("-quilt")) {
            typeOfVersion = "Quilt";
          } else {
            typeOfVersion = "";
          }
          ipcRenderer.send(
            "new-status-discord-jugando",
            `${langs.playing_in} ${version_real
              .replace("-forge", "")
              .replace("-fabric", "")
              .replace("-quilt", "")} ${typeOfVersion}`
          );

          UpdateStatus(
            account.name,
            "ausente",
            `${langs.playing_in} ${version_real
              .replace("-forge", "")
              .replace("-fabric", "")
              .replace("-quilt", "")} ${typeOfVersion}`
          );

          modalDiv1.remove();
          inicio = true;
          progressText1.innerHTML = `${langs.minecraft_started_correctly}.`;
          ipcRenderer.send("new-notification", {
            title: langs.minecraft_started_correctly,
            body: langs.minecraft_started_correctly_body,
          });

          ipcRenderer.send("main-window-progress-reset");
        }
      }
    })

    Launcher.on('close', code => {
      console.log(`---------- [MC] Código de salida: ${code}\n ----------`)
      consoleOutput_ += `---------- [MC] Código de salida: ${code}\n ----------`;
      if (launcherSettings.launcher.close === "close-launcher")
        ipcRenderer.send("main-window-show");

      // Track Minecraft close
      const playTime = Date.now() - minecraftStartTime;
      const versionPlayed = options.loader.enable
        ? `${options.version}-${options.loader.type}`
        : options.version;

      AnalyticsHelper.trackMinecraftClose(versionPlayed, playTime)
        .catch(err => console.error('Error tracking Minecraft close:', err));

      ipcRenderer.send("updateStatus", {
        status: "online",
        details: langs.in_the_menu,
        username: account.name,
      });

      UpdateStatus(account.name, "online", langs.in_the_menu);

      new logger("Launcher", "#3e8ed0");
      console.log("🔧 Minecraft cerrado");

      ipcRenderer.send("delete-and-new-status-discord");
    });

    Launcher.on('error', err => {
      console.error(err);
      consoleOutput_ += `[ERROR] ${JSON.stringify(err, null, 2)}\n`;

      logTextArea1.innerHTML = `\n❌ ${err}`;
    });
  }

  async DownloadFiles(options) {

  }
}

export { LoadMinecraft };