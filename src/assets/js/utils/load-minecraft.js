/**
 * @author TECNO BROS
 
 */

const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
import * as NBT from "../../../../node_modules/nbtify/dist/index.js";
import { LoadAPI } from "../utils/loadAPI.js";
const { Launch } = require("./assets/js/libs/mc/Index");
const Launcher = new Launch();
import { consoleOutput } from "./logger.js";
let consoleOutput_ = + consoleOutput;
import { logger, database, changePanel } from "../utils.js";
import { Lang } from "./lang.js";
import { CrashReport } from "./crash-report.js";
const got = require("got");
const dataDirectory = process.env.APPDATA || (process.platform == "darwin" ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
const ShowCrashReport = new CrashReport().ShowCrashReport;
let langs;

async function LoadLang() {
  langs = await new Lang().GetLang();
}

LoadLang();

class LoadMinecraft {
  async LaunchMinecraft(options) {
    console.log("Launching Minecraft...");
    console.log(options);
    const db = await new database().init();
    const BattlyConfig = await new LoadAPI().GetConfig();
    const launcherSettings = (await db.get("1234", "launcher")).value;
    const uuid = (await db.get("1234", "accounts-selected")).value;
    const account = db.getAccounts().find(account => account.uuid === uuid.selected);

    async function UpdateStatus(username, status, details) {
      console.log(`🧩 ${username} > ${status} > ${details}`);

      if (account.type === "battly") {
        if (
          !account.password ||
          account.password === "" ||
          account.password === undefined ||
          account.password === null
        ) {
          new Alert().ShowAlert({
            icon: "error",
            title: langs.password_not_set,
          });

          this.database.delete(uuid.selected, "accounts");
          return;
        } else {
          ipcRenderer.send("updateStatus", {
            status: status,
            details: details,
            username: username,
            password: account.password,
          });
        }
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
        // Realiza la solicitud HTTP para obtener el archivo
        const response = await got(url, {
          responseType: 'buffer' // Obtiene el archivo como un buffer
        });

        // Crea un flujo de escritura para guardar el archivo
        fs.writeFileSync(outputPath, response.body);

        console.log(`Archivo descargado y guardado en ${outputPath}`);
      } catch (error) {
        console.error('Error al descargar el archivo:', error.message);
      }
    }

    // Función para manejar la descarga según la versión
    async function handleDownload(version_real, account, dataDirectory) {
      if (version_real.endsWith("-forge")) {
        try {
          const response = await got(`https://api.battlylauncher.com/battlylauncher/optifine/versions/${version_real.replace("-forge", "")}`, {
            headers: {
              Authorization: account.token,
            },
            responseType: 'json' // Obtiene la respuesta como JSON
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
      logTextArea1.scrollTop = logTextArea1.scrollHeight; // Hacer que el scrollTop sea igual a la altura del contenido
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
        logTextArea1.innerHTML = `${langs.extracting_loader}.`;
        updateTextareaScroll();
        seMostroExtrayendo_core = true;
      }
    });

    Launcher.on('progress', (progress, size, element) => {
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
        progressFill1.style.width = `${((progress / size) * 100).toFixed(0)}%`;
      }
    });

    Launcher.on('check', (progress, size, element) => {
      console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
      let progreso = ((progress / size) * 100).toFixed(0);
      if (progreso > 100) {
        progreso = 100;
      }

      if (progreso != lastProgreso) {
        logTextArea1.innerHTML += `🔃 ${langs.downloading}... ${progreso}%\n`;
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

      progressFill1.style.width = `${((progress / size) * 100).toFixed(0)}%`;
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

    Launcher.on('patch', patch => {
      console.log(`[INSTALANDO LOADER] ${patch}`);
      logTextArea1.innerHTML += `🔃 ${langs.extracting_loader}... [${patch}]\n`;
      updateTextareaScroll();
      consoleOutput_ += `[INSTAL. LOADER] ${patch}\n`;
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
                // Si está deshabilitado y la IP existe, la eliminamos
                serversDatData.data.servers = serversDatData.data.servers.filter(existingServer => existingServer.ip !== server.ip);
              } else if (existingIPs.has(server.ip) && server.enabled) {
                // Si está habilitado y la IP existe, la reemplazamos eliminando la antigua
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

      if (e.includes("Failed to start the minecraft server")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_one} \nError:\n${e}`
        );
      }
      if (e.includes('Exception in thread "main" ')) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_two} \nError:\n${e}`
        );
      }

      if (
        e.includes(
          "There is insufficient memory for the Java Runtime Environment to continue."
        )
      ) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_three} \nError:\n${e}`
        );
      }
      if (e.includes("Could not reserve enough space for object heap")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_three} \nError:\n${e}`
        );
      }

      if (e.includes("Forge patcher exited with code 1")) {
        modalDiv1.remove();
        ShowCrashReport(`${langs.error_detected_four} \nError:\n${e}`);
      }

      if (e.includes("Unable to launch")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_five} \nError:\n${e}`
        );
      }

      if (
        e.includes("Minecraft Crash Report") &&
        !e.includes("THIS IS NOT A ERROR")
      ) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_one} \nError:\n${e}`
        );
      }

      if (e.includes("java.lang.ClassCastException")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_five} \nError:\n${e}`
        );
      }

      if (e.includes("Minecraft has crashed!")) {
        modalDiv1.remove();
        return ShowCrashReport(
          `${langs.error_detected_five} \nError:\n${e}`
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

      modalDiv1.remove();

      return ShowCrashReport(
        `${langs.error_detected_one} \nError:\n${JSON.stringify(err, null, 2)}`
      );
    });
  }

  async DownloadFiles(options) {

  }
}

export { LoadMinecraft };