"use strict";

import { logger, database, changePanel } from "../utils.js";
import { LoadAPI } from "../utils/loadAPI.js";
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const axios = require("axios");
const crypto = require("crypto");
const pidusage = require("pidusage");
const util = require("minecraft-server-util");
const { Launch } = require("./assets/js/libs/mc/Index");
import { AskModal } from "../utils/askModal.js";
import { wsLatency } from "../utils/latency.js";
import { Alert } from "../utils/alert.js";
const { getValue, setValue } = require('./assets/js/utils/storage');
const markdown = require("markdown").markdown;

const modal = new AskModal();

const pkg = require("../package.json");
const { Chart } = require("chart.js/auto");
let electronShell = null;
let ipcRenderer = null;
try {
  electronShell = require("electron").shell;
  ipcRenderer = require("electron").ipcRenderer;
} catch { }

const CLIENT_SECRET = "$sh5*S#vO$%RF@b9#821EB6pKGFLXe";
const AUDIENCE = "frp-client";
const dataDirectory =
  process.env.APPDATA ||
  (process.platform === "darwin"
    ? `${process.env.HOME}/Library/Application Support`
    : process.env.HOME);
const BATTLY_DIR = path.join(
  os.homedir(),
  process.platform === "win32" ? "AppData/Roaming/.battly" : ".battly"
);
const TEMP_DIR = path.join(BATTLY_DIR, "temp");
const FRPC_TARGET_PATH = path.join(BATTLY_DIR, "frpc.exe");
fs.mkdirSync(BATTLY_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });

const EDITABLE_EXTS = [".json", ".txt", ".properties"];

function sha256File(filePath) {
  return new Promise((res, rej) => {
    const hash = crypto.createHash("sha256");
    const rs = fs.createReadStream(filePath);
    rs.on("error", rej);
    rs.on("data", d => hash.update(d));
    rs.on("end", () => res(hash.digest("hex")));
  });
}

class Servers {
  static id = "servers";

  config = {};
  database = null;
  VersionsMojang = null;
  serverProc = null;
  frpcProc = null;
  assignDomainBox = null;
  assignPortBox = null;

  serverDir = "";
  subdomain = "";
  versionId = "";
  serverId = null;
  serverRunning = false;

  regions = [];
  selectedRegion = "eu";
  apiUrl = "https://root.battly.eu";

  cpuChart = null; ramChart = null;
  monitorTimer = null; playerTimer = null;
  consoleOutput = null;

  currentDir = "";

  async init(config) {
    this.config = config;
    this.database = await new database().init();
    this.VersionsMojang = await new LoadAPI().GetVersionsMojang();

    await this.discoverRegions();
    await this.prepareUI()
    this.attachLoadingDots();

    await this.initShareSystem();

    if (typeof window !== "undefined") {
      window.battlyServersInstance = this;
      window.sendConsoleCommand = () => this.sendCommand();
      window.updatePropertyMeta = (m, k, v) => { document.getElementById(m).textContent = `${k}=${v}`; this.setServerProperty(k, v); };
      window.toggleProperty = (m, k) => this.toggleBooleanProperty(m, k);
      window.battlyListFiles = (r = "") => this.listFiles(r);
      window.battlyOpenFile = (r) => this.openFileEditor(r);
      window.battlyDeletePath = (r) => this.deletePath(r);
      window.battlyGoUp = () => this.goToParentDir();
    }

    document.getElementById("b-servers-checkForLatency").onclick = async () => {
      const button = document.getElementById("b-servers-checkForLatency");
      button.classList.add("is-loading");
      button.disabled = true;
      await this.discoverRegions();
      button.classList.remove("is-loading");
      button.disabled = false;
    }

    document.getElementById("b-servers-cancel-server-creation").onclick = () => {
      changePanel("home");
      document.querySelector(".panel-container-creating").style.display = "none";
      document.querySelector(".panel-container").style.display = "none";
      document.querySelector(".fullscreen-text-div").style.display = "flex";
      document.querySelector(".b-servers-main-container").style.display = "none";
    };
  }

  async deleteServer() {
    this.stopServer();
    this.closeTunnel();

    const token = await this.getAuthToken();
    if (!token) throw new Error("Token de usuario no disponible");

    if (!this.serverId) throw new Error("Identificador del servidor no definido");

    const resp = await axios.post(`${this.apiUrl}/delete-server`, {
      token,
      serverId: this.serverId
    }).then(r => r.data)
      .catch(e => { throw new Error(e.response?.data?.error || e.message); });

    if (resp.status !== "success") throw new Error("Backend rechazó la operación");

    try {
      fs.rmSync(this.serverDir, { recursive: true, force: true });
    } catch (e) { console.warn("⚠ No se pudo borrar la carpeta local:", e.message); }

    this.cleanupServerUI();
    this.serverDir = "";
    this.subdomain = "";
    this.versionId = "";
    this.serverId = null;
    document.querySelector(".b-servers-main-container").style.display = "none";
    document.querySelector(".panel-container").style.display = "flex";
  }

  createStepBox(label, panel) {
    const box = document.createElement("div");
    box.className = "download-status-server";
    box.innerHTML = `
    <p class="whatisdownloading">${label}</p>
    <p class="percentajewhatisloading">
      <span><i class="fa fa-rotate fa-spin"></i></span>
    </p>`;
    panel.appendChild(box);
    return box.querySelector("i");
  }

  async discoverRegions() {
    const seedHosts = ["https://root.battly.eu", "https://root.battly.org"];
    let list = null;
    for (const h of seedHosts) {
      try {
        const { data } = await axios.get(`${h}/regions`, { timeout: 5000 });
        if (Array.isArray(data) && data.length) { list = data; break; }
      } catch { }
    }
    if (!list) list = [
      { id: "eu", frps_domain: "root.battly.eu" },
      { id: "latam", frps_domain: "root.battly.org" }
    ];

    const tests = await Promise.all(list.map(async r => {
      let latency = 9999;
      try { latency = await wsLatency(r.frps_domain, 5); }
      catch { }
      return { ...r, latency };
    }));

    this.regions = tests.sort((a, b) => a.latency - b.latency);
    this.selectedRegion = this.regions[0].id;
    this.apiUrl = `https://${this.regions[0].frps_domain}`;

    const sel = document.getElementById("regionSelectServers");
    if (sel) {
      sel.innerHTML = "";
      this.regions.forEach(r => {
        const o = document.createElement("option");
        o.value = r.id;
        o.textContent = `${r.id.toUpperCase()}  –  ${r.latency} ms`;
        if (r.id === this.selectedRegion) o.selected = true;
        sel.appendChild(o);
      });
      document.getElementById("regionLatencyInfo").textContent =
        `${window.stringLoader.getString("servers.selectedRegion")} ${this.selectedRegion.toUpperCase()} (${this.regions[0].latency} ${window.stringLoader.getString("servers.msLatency")})`;
      sel.onchange = e => {
        this.selectedRegion = e.target.value;
        const item = this.regions.find(x => x.id === this.selectedRegion);
        this.apiUrl = `https://${item.frps_domain}`;
        this.refreshDomainSuffix();
      };
    }
  }

  async getUserName() {
    let acc = await this.database?.getSelectedAccount();
    console.log("Cuenta seleccionada:", acc);

    return acc?.name || "jugador";
  }

  async runRegionWorkflow() {
    const statusBox = document.getElementById("loading-b-servers-status-text");
    const createPanel = document.querySelector(".panel-container");
    const errorBox = document.getElementById("b-servers-error");

    const wait = ms => new Promise(r => setTimeout(r, ms));

    statusBox.innerHTML = window.stringLoader.getString("servers.connectingToServer");
    statusBox.style.display = "block";
    errorBox.style.display = "none";
    createPanel.style.display = "none";

    const t0 = performance.now();
    const bad = await this.checkHealth();
    const elapsed = performance.now() - t0;
    if (elapsed < 2000) await wait(2000 - elapsed);

    if (bad.length) {
      statusBox.style.display = "none";
      errorBox.innerHTML = window.stringLoader.getString("servers.noResponse");
      errorBox.style.display = "block";
      return;
    }

    statusBox.innerHTML = window.stringLoader.getString("servers.speedTest");
    const t1 = performance.now();

    try {
      await this.discoverRegions();
    } catch (err) {
      console.error("discoverRegions() falló:", err);
      statusBox.style.display = "none";
      errorBox.innerHTML = window.stringLoader.getString("servers.speedTestError");
      errorBox.style.display = "block";
      return;
    }

    const elapsed2 = performance.now() - t1;
    if (elapsed2 < 2000) await wait(2000 - elapsed2);

    const t2 = performance.now();

    statusBox.innerHTML = window.stringLoader.getString("servers.checkingActiveServers");

    const elapsed3 = performance.now() - t2;
    if (elapsed3 < 2000) await wait(2000 - elapsed3);

    const list = await this.fetchRemoteServers();
    const [srv] = list || [];

    if (srv) {
      const user = await this.getUserName();
      const suffix = (srv.region || "eu") === "eu" ? ".battly.eu" : ".battly.org";

      statusBox.innerHTML =
        window.stringLoader.getString("servers.welcomeBack")
          .replace("{user}", `<b>${user}</b>`) // Use placeholders in lang file
          .replace("{server}", `<b>${srv.subdomain}${suffix}</b>`);
      statusBox.style.display = "block";
      createPanel.style.display = "none";

      await wait(2000);
      await this.routeByServerState();
      return;
    }

    statusBox.style.display = "none";
    createPanel.style.display = "flex";
    document.querySelector(".fullscreen-text-div").style.display = "none";
    document
      .querySelector(".panel-container")
      .classList.add("animate__zoomIn");
  }

  async checkHealth() {
    const seed = [
      { id: "eu", host: "root.battly.eu" },
      { id: "latam", host: "root.battly.org" }
    ];
    const bad = [];

    await Promise.all(seed.map(async ({ id, host }) => {
      try {
        const resp = await axios.get(`https://${host}/ping`, { timeout: 1800 });
        if (resp.status !== 204) bad.push(id);
      } catch (err) {
        console.warn(`Server ${id} (${host}) is not responding:`, err.message);
        bad.push(id);
      }
    }));

    return bad.length === seed.length ? bad : [];
  }




  async prepareUI() {
    const serversPath = `${dataDirectory}/.battly/servers`;
    fs.mkdirSync(serversPath, { recursive: true });
    if (!fs.existsSync(`${serversPath}/servers.json`))
      fs.writeFileSync(`${serversPath}/servers.json`, "[]");

    const schemaUrl = "https://api.battlylauncher.com/api/battlyservers/configs/server.properties.json";
    const { data: schema } = await axios.get(schemaUrl);

    const cols = document.querySelector('#opciones .columns');
    cols.innerHTML = "";

    Object.entries(schema).forEach(([propKey, meta]) => {
      const col = document.createElement('div');
      col.classList.add('column', 'is-6', 'b-servers-column');

      const box = document.createElement('div');
      box.classList.add('b-servers-server-property-box');

      const h3 = document.createElement('h3');
      h3.textContent = meta.descriptions.es.title;
      box.appendChild(h3);

      let control;
      switch (meta.type) {
        case 'integer':
          control = document.createElement('input');
          control.type = 'number';
          control.value = meta.default;
          control.onchange = async () => {
            this.setServerProperty(propKey, control.value);
            document.getElementById(`${propKey}Meta`).textContent =
              `${propKey}=${control.value}`;
            try {
              const userToken = await this.getAuthToken();
              const { data: { authToken } } = await axios.post(
                `${this.apiUrl}/get-server-authtoken`,
                { token: userToken, serverId: this.serverId }
              );
              const fullPath = path.join(this.serverDir, "server.properties");
              const content = fs.readFileSync(fullPath, "utf8");
              const contentBase64 = Buffer.from(content, "utf8").toString("base64");
              await axios.post(
                `${this.apiUrl}/upload-config`,
                {
                  authToken,
                  serverId: this.serverId,
                  filename: "server.properties",
                  contentBase64
                }
              );
            } catch (err) {
              console.error("Error subiendo server.properties:", err);
              new Alert().ShowAlert({
                icon: "error",
                title: "Falló la subida de configuración",
                text: err.response?.data?.error || err.message
              });
            }
          };
          break;

        case 'boolean':
          control = document.createElement('button');
          control.textContent = meta.default ? '✔' : '✖';
          control.onclick = async () => {
            const newVal = !(control.textContent === '✔');
            this.setServerProperty(propKey, newVal);
            control.textContent = newVal ? '✔' : '✖';
            document.getElementById(`${propKey}Meta`).textContent =
              `${propKey}=${newVal}`;
            try {
              const userToken = await this.getAuthToken();
              const { data: { authToken } } = await axios.post(
                `${this.apiUrl}/get-server-authtoken`,
                { token: userToken, serverId: this.serverId }
              );
              const fullPath = path.join(this.serverDir, "server.properties");
              const content = fs.readFileSync(fullPath, "utf8");
              const contentBase64 = Buffer.from(content, "utf8").toString("base64");
              await axios.post(
                `${this.apiUrl}/upload-config`,
                {
                  authToken,
                  serverId: this.serverId,
                  filename: "server.properties",
                  contentBase64
                }
              );
            } catch (err) {
              console.error("Error subiendo server.properties:", err);
              new Alert().ShowAlert({
                icon: "error",
                title: "Falló la subida de configuración",
                text: err.response?.data?.error || err.message
              });
            }
          };
          break;

        case 'select':
          control = document.createElement('select');
          Object.entries(meta.options).forEach(([optValue, labels]) => {
            const o = document.createElement('option');
            o.value = optValue;
            o.textContent = labels.es;
            if (optValue === meta.default) o.selected = true;
            control.appendChild(o);
          });
          control.onchange = async () => {
            this.setServerProperty(propKey, control.value);
            document.getElementById(`${propKey}Meta`).textContent =
              `${propKey}=${control.value}`;
            try {
              const userToken = await this.getAuthToken();
              const { data: { authToken } } = await axios.post(
                `${this.apiUrl}/get-server-authtoken`,
                { token: userToken, serverId: this.serverId }
              );
              const fullPath = path.join(this.serverDir, "server.properties");
              const content = fs.readFileSync(fullPath, "utf8");
              const contentBase64 = Buffer.from(content, "utf8").toString("base64");
              await axios.post(
                `${this.apiUrl}/upload-config`,
                {
                  authToken,
                  serverId: this.serverId,
                  filename: "server.properties",
                  contentBase64
                }
              );
            } catch (err) {
              console.error("Error subiendo server.properties:", err);
              new Alert().ShowAlert({
                icon: "error",
                title: "Falló la subida de configuración",
                text: err.response?.data?.error || err.message
              });
            }
          };
          break;

        case 'string':
        default:
          control = document.createElement('input');
          control.type = 'text';
          control.value = meta.default;
          control.onchange = async () => {
            this.setServerProperty(propKey, control.value);
            document.getElementById(`${propKey}Meta`).textContent =
              `${propKey}=${control.value}`;
            try {
              const userToken = await this.getAuthToken();
              const { data: { authToken } } = await axios.post(
                `${this.apiUrl}/get-server-authtoken`,
                { token: userToken, serverId: this.serverId }
              );
              const fullPath = path.join(this.serverDir, "server.properties");
              const content = fs.readFileSync(fullPath, "utf8");
              const contentBase64 = Buffer.from(content, "utf8").toString("base64");
              await axios.post(
                `${this.apiUrl}/upload-config`,
                {
                  authToken,
                  serverId: this.serverId,
                  filename: "server.properties",
                  contentBase64
                }
              );
            } catch (err) {
              console.error("Error subiendo server.properties:", err);
              new Alert().ShowAlert({
                icon: "error",
                title: "Falló la subida de configuración",
                text: err.response?.data?.error || err.message
              });
            }
          };
      }

      control.classList.add('b-servers-server-property-input');
      control.dataset.prop = propKey;
      box.appendChild(control);

      const metaP = document.createElement('p');
      metaP.classList.add('b-servers-server-property-meta');
      metaP.textContent = `${propKey}=${meta.default}`;
      metaP.id = `${propKey}Meta`;
      box.appendChild(metaP);

      col.appendChild(box);
      cols.appendChild(col);
    });

    const deleteButton = document.createElement("button");
    deleteButton.id = "b-servers-deleteServerButton";
    deleteButton.className = "button is-danger is-fullwidth";
    deleteButton.innerHTML = `<i class="fa fa-trash"></i> Eliminar servidor`;
    deleteButton.style.margin = "1rem 0";
    cols.appendChild(deleteButton);

    const selVer = document.getElementById("versionSelectServers");
    this.VersionsMojang.versions.forEach(v => {
      const o = document.createElement("option");
      o.value = v.id;
      o.textContent = v.id;
      selVer.appendChild(o);
    });

    document.getElementById("servers-btn").addEventListener("click", async () => {
      changePanel("servers");
      await this.checkAndShowPolicies();
      this.runRegionWorkflow();
    });

    document.getElementById("b-servers-back-to-home").addEventListener("click", () => {
      this.cleanupServerUI();
      changePanel("home");
    });

    this.setupDomainValidation();

    document.getElementById("create-server").addEventListener("click", () => this.handleCreateServer());

    const originalShowPanel = window.showPanel;
    window.showPanel = (id) => {
      originalShowPanel(id);
      if (id === "archivos") setTimeout(() => this.listFiles(), 50);
    };

    this.refreshDomainSuffix();

    deleteButton.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      try {
        await modal.ask({
          title: "Eliminar servidor",
          text: `¿Seguro que quieres borrar ${this.subdomain}?`,
          showCancelButton: true,
          confirmButtonText: "Eliminar",
          cancelButtonText: "Cancelar",
          preConfirm: () => true
        });
        btn.classList.add("is-loading");
        btn.disabled = true;
        await this.deleteServer();
        new Alert().ShowAlert({ icon: "success", title: "Servidor eliminado correctamente" });
      } catch (err) {
        if (err !== "cancelled") {
          new Alert().ShowAlert({ icon: "error", title: "Error", text: err.message || err });
        }
        btn.classList.remove("is-loading");
        btn.disabled = false;
      }
    });
  }




  cleanupServerUI() {

    clearInterval(this.monitorTimer);
    clearInterval(this.playerTimer);
    this.monitorTimer = this.playerTimer = null;

    if (this.historyWatcherPath) {
      fs.unwatchFile(this.historyWatcherPath);
      this.historyWatcherPath = null;
    }

    if (this.cpuChart) { this.cpuChart.destroy(); this.cpuChart = null; }
    if (this.ramChart) { this.ramChart.destroy(); this.ramChart = null; }
  }

  async routeByServerState() {
    const list = await this.fetchRemoteServers();
    const [s] = list;
    if (!s) {
      document.querySelector(".panel-container").style.display = "flex";
      document.querySelector(".fullscreen-text-div").style.display = "none";
      return false;
    }
    this.subdomain = s.subdomain;
    this.versionId = s.version;
    this.serverId = s._id;
    this.selectedRegion = s.region || this.selectedRegion;
    const suffix = this.selectedRegion === "eu" ? ".battly.eu" : ".battly.org";
    this.apiUrl = `https://${this.regions.find(r => r.id === this.selectedRegion).frps_domain}`;

    this.serverDir = `${dataDirectory}/.battly/servers/${this.subdomain}`;
    document.querySelector(".fullscreen-text-div").style.display = "none";
    document.querySelector(".panel-container").style.display = "none";
    this.showManagementPanel();
    this.updateActionButtons();
    this.refreshPlayers();

    return true;
  }

  refreshDomainSuffix() {
    const span = document.getElementById("serverIP");
    const input = document.getElementById("domainInput");
    const suffix = this.selectedRegion === "eu" ? ".battly.eu" : ".battly.org";
    const v = input.value.trim();
    span.textContent = v ? `${v}${suffix}` : `dominio${suffix}`;
  }


  setupDomainValidation() {
    const input = document.getElementById("domainInput");
    const spanIP = document.getElementById("serverIP");
    const warn = document.getElementById("warningMessage");
    const badWords = ["api", "server", "oficial", "battly"];
    input.addEventListener("input", () => {
      const v = input.value.toLowerCase();
      const invalid = badWords.some(w => v.includes(w));
      const suffix = this.selectedRegion === "eu" ? ".battly.eu" : ".battly.org";
      if (v.length >= 3 && !invalid) {
        spanIP.textContent = `${v}${suffix}`; warn.style.display = "none";
      } else if (v === "") {
        spanIP.textContent = `dominio${suffix}`; warn.style.display = "none";
      } else {
        warn.style.display = "block";
        warn.textContent = invalid
          ? `¡Dominio no permitido! No puede contener ${badWords.join(", ")}.`
          : "¡Dominio no permitido! Debe tener al menos 3 caracteres.";
      }
    });
  }

  attachLoadingDots() {
    let d = 0;
    setInterval(() => {
      document.getElementById("b-servers-loading-text-dots").textContent =
        ".".repeat(d);
      d = (d + 1) % 4;
    }, 500);
  }


  async checkAndShowPolicies() {
    const p = this.config.battlyservers.policies;
    if (!p?.version) return;

    const key = "battly-policies-version";
    const accepted = await getValue(key) || "0";
    console.log(`Políticas actuales: ${p.version}, aceptadas: ${accepted}`);
    if (accepted.toString() === p.version.toString()) return;

    try {
      const resp = await axios.get(p.latestUrl);
      const mdText = resp.data;

      const htmlContent = markdown.toHTML(mdText);

      await modal.ask({
        title: `Términos & Políticas (v${p.version})`,
        html: `<div class="policy-content" style="max-height:60vh;overflow:auto">
                 ${htmlContent}
               </div>`,
        showCancelButton: false,
        confirmButtonText: "Entendido"
      });

      await setValue(key.toString(), p.version.toString());
    } catch (err) {
      console.error("No se pudieron cargar las políticas:", err);
    }
  }

  async askEULA() {
    try {
      await modal.ask({
        title: "EULA de Minecraft",
        html: `
      <p>Antes de crear tu servidor, debes aceptar la <a href="https://account.mojang.com/documents/minecraft_eula" target="_blank">
      End User License Agreement (EULA)</a> de Minecraft.</p>`,
        showCancelButton: true,
        confirmButtonText: "Acepto",
        cancelButtonText: "No acepto",
        preConfirm: () => true,
        acceptButtonType: "is-info",
        rejectButtonType: "is-danger"
      });
    } catch (err) {
      if (err !== "cancelled") {
        new Alert().ShowAlert({
          icon: "error",
          title: "Error",
          text: err.message || err
        });
      }
      throw new Error("No se aceptó la EULA");
    }
  }

  async handleCreateServer() {
    try {
      if (document.getElementById("domainInput").value.length < 3) {
        throw new Error("El dominio debe tener al menos 3 caracteres");
      }

      await this.checkAndShowPolicies();
      await this.askEULA();
      document.querySelector(".panel-container-creating").style.display = "flex";
      document.querySelector(".panel-container").style.display = "none";

      this.subdomain = document.getElementById("domainInput").value.trim().toLowerCase();

      const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

      if (!domainRegex.test(this.subdomain)) {
        document.querySelector(".panel-container-creating").style.display = "none";
        document.querySelector(".panel-container").style.display = "flex";
        throw new Error(
          "El dominio solo puede contener letras minúsculas, números y guiones. " +
          "No puede empezar ni terminar con guión, y no puede contener espacios, " +
          "mayúsculas ni caracteres especiales."
        );
      }

      if (this.subdomain.includes('--')) {
        document.querySelector(".panel-container-creating").style.display = "none";
        document.querySelector(".panel-container").style.display = "flex";
        throw new Error("El dominio no puede contener guiones consecutivos (--) ");
      }

      this.versionId = document.getElementById("versionSelectServers").value;
      this.selectedRegion = document.getElementById("regionSelectServers").value;
      this.apiUrl = `https://${this.regions.find(r => r.id === this.selectedRegion).frps_domain}`;

      const suffix = this.selectedRegion === "eu" ? "eu" : "org";
      const fullSubdomain = `${this.subdomain}.${suffix}`;

      const token = await this.getAuthToken();
      const check = await this.safePost(
        `${this.apiUrl}/check-if-available`,
        { token, subdomain: fullSubdomain }
      );
      if (!check || !check.available) {
        throw new Error(check?.error || "Subdominio no disponible");
      }

      this.serverDir = `${dataDirectory}/.battly/servers/${this.subdomain}`;
      fs.mkdirSync(`${this.serverDir}/java`, { recursive: true });

      const maniURL = this.VersionsMojang.versions.find(v => v.id === this.versionId)?.url;
      const { javaComponent } = await this.downloadFileWithProgress(
        maniURL,
        `${this.serverDir}/server.jar`,
        "Descargando servidor",
        document.querySelector(".panel-container-creating-progresses")
      );
      await this.downloadJavaRuntime(javaComponent, this.serverDir,
        document.querySelector(".panel-container-creating-progresses"));

      const createResp = await this.safePost(
        `${this.apiUrl}/create-server`,
        { token, subdomain: fullSubdomain, version: this.versionId }
      );
      if (!createResp || createResp.status !== "success") {
        throw new Error(createResp?.error || "Error creando servidor");
      }
      this.serverId = createResp._id;

      fs.writeFileSync(`${this.serverDir}/eula.txt`, "eula=true", "utf8");

      await new Promise((resolve) => {
        const javaExe = process.platform === "win32"
          ? path.join(this.serverDir, "java/bin/java.exe")
          : path.join(this.serverDir, "java/bin/java");
        const proc = require("child_process").spawn(
          javaExe,
          ["-jar", `${this.serverDir}/server.jar`, "nogui"],
          { cwd: this.serverDir, stdio: "ignore" }
        );

        const propsPath = path.join(this.serverDir, "server.properties");
        const watcher = fs.watch(this.serverDir, (evt, name) => {
          if (name === "server.properties") {
            watcher.close();
            proc.stdin && proc.stdin.write("stop\n");
            proc.once("exit", () => resolve());
          }
        });

        setTimeout(() => {
          watcher.close();
          proc.kill();
          resolve();
        }, 5000);
      });

      const owner = await this.getUserName();
      this.setServerProperty("online-mode", "false");
      this.setServerProperty(
        "motd",
        `Entra al servidor de ${owner} creado con Battly Launcher.`
      );

      await this.startServer();

      document.querySelector(".panel-container-creating").style.display = "none";
      this.showManagementPanel();
    } catch (err) {
      document.querySelector(".panel-container-creating").style.display = "none";
      document.querySelector(".panel-container").style.display = "flex";

      new Alert().ShowAlert({
        icon: "error",
        title: "No se pudo crear el servidor",
        text: err.message
      });
    }
  }



  async downloadFileWithProgress(manifestURL, target, label, uiPanel) {
    const box = document.createElement("div");
    box.className = "download-status-server";
    box.innerHTML = `
      <p class="whatisdownloading">${label}</p>
      <p class="percentajewhatisloading"><span>0%</span> <span><i class="fa fa-rotate fa-spin"></i></span></p>`;
    uiPanel.appendChild(box);
    const pctSpan = box.querySelector("span");

    const manifest = await (await fetch(manifestURL)).json();
    const jarURL = manifest.downloads.server.url;
    const javaComponent = manifest.javaVersion.component;

    return new Promise((resolve, reject) => {
      https
        .get(jarURL, (res) => {
          const total = parseInt(res.headers["content-length"] || "0", 10);
          let done = 0;
          const ws = fs.createWriteStream(target);
          res.on("data", (c) => {
            done += c.length;
            pctSpan.textContent = `${Math.round((done / total) * 100)}%`;
          });
          res.pipe(ws);
          ws.on("finish", () => {
            ws.close();
            pctSpan.textContent = "100%";
            box.querySelector("i").className = "fa fa-check";
            resolve({ javaComponent });
          });
          ws.on("error", reject);
        })
        .on("error", reject);
    });
  }

  async downloadJavaRuntime(component, dir, uiPanel) {
    const index =
      "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";
    const data = await (await fetch(index)).json();
    const maniURL =
      data["windows-x64"][component]?.[0].manifest.url ||
      data["windows-x86"][component]?.[0].manifest.url;
    if (!maniURL) throw new Error("Runtime Java no encontrado");

    const box = document.createElement("div");
    box.className = "download-status-server";
    box.innerHTML =
      `<p class="whatisdownloading">Descargando Java Runtime</p>
        <p class="percentajewhatisloading">
        <span>0%</span>
        <span>
          <i class="fa fa-rotate fa-spin"></i>
        </span>
      </p>`;
    uiPanel.appendChild(box);
    const span = box.querySelector("span");

    const mf = await (await fetch(maniURL)).json();
    const files = Object.entries(mf.files);
    let done = 0;
    for (const [fname, f] of files) {
      const dest = path.join(dir, "java", fname);
      if (f.type === "directory") {
        fs.mkdirSync(dest, { recursive: true });
      } else {
        await new Promise((res, rej) => {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          const ws = fs.createWriteStream(dest);
          https
            .get(f.downloads.raw.url, (r) => r.pipe(ws))
            .on("error", rej);
          ws.on("finish", () => ws.close(res));
          ws.on("error", rej);
        });
      }
      done++;
      span.textContent = `${Math.round((done / files.length) * 100)}% `;
    }
    span.textContent = "100%";
    box.querySelector("i").className = "fa fa-check";
  }


  async showManagementPanel() {
    await this.syncConfigs();
    this.refreshPropertiesPanel();
    this.initHistoryWatcher();
    this.refreshLists();
    document.querySelector(".b-servers-main-container").style.display = "flex";
    const suffix = this.selectedRegion === "eu" ? ".battly.eu" : ".battly.org";
    document.querySelector(".b-servers-content-header h1")
      .textContent = `${window.stringLoader.getString("servers.title")} – ${this.subdomain}${suffix} `;

    const stop = document.querySelector(".b-servers-stop-btn");
    const rst = document.querySelector(".b-servers-restart-btn");
    const conn = document.querySelector(".b-servers-connect-btn");
    stop.onclick = () => (this.serverRunning ? this.stopServer() : this.startServer());
    rst.onclick = () => this.restartServer();
    conn.onclick = () => this.launchMinecraft();

    this.setupCharts();
    this.updateActionButtons();
  }


  initHistoryWatcher() {
    const ucPath = path.join(this.serverDir, "usercache.json");
    if (!fs.existsSync(ucPath)) return;

    const refresh = () => {
      let data;
      try { data = JSON.parse(fs.readFileSync(ucPath, "utf8")); }
      catch { return; }

      this.renderPlayerHistory(data);
    };

    refresh();
    fs.watchFile(ucPath, { interval: 1000 }, (cur, prev) => {
      if (cur.mtimeMs !== prev.mtimeMs) refresh();
    });
  }


  renderPlayerHistory(list) {
    const box = document.querySelector("#historico .columns");
    if (!box) return;

    const seen = new Set([...box.querySelectorAll("[data-uuid]")]
      .map(el => el.dataset.uuid));

    const banFile = path.join(this.serverDir, 'banned-players.json');
    const bannedList = this.getFile(banFile);
    list.forEach(u => {
      if (seen.has(u.uuid)) return;
      const col = document.createElement("div");
      col.className = "column is-6 b-servers-column";
      col.dataset.uuid = u.uuid;
      col.innerHTML = `
      <div class="b-servers-player-card">
        <div class="b-servers-player-avatar">
          <img src="https://mc-heads.net/avatar/${u.name}/64" alt="${u.name}">
        </div>
        <div class="b-servers-player-info">
          <h4 class="b-servers-player-name is-white">${u.name}</h4>
          <p class="b-servers-player-subtitle">Unido el: ${u.expiresOn}</p>
        </div>
        <div class="b-servers-player-actions">
          <button class="button ${bannedList.some(b => b.uuid === u.uuid) ? 'is-link' : 'is-danger'} is-small"
            onclick="battlyServersInstance.toggleBan('${u.name}', '${u.uuid}', this)">
            <i class="fa ${bannedList.some(b => b.uuid === u.uuid) ? 'fa-undo' : 'fa-ban'}"></i>
            ${bannedList.some(b => b.uuid === u.uuid) ? 'Desbanear' : 'Banear'}
          </button>
          <button class="button is-success is-small"
                  onclick="battlyServersInstance.toggleWhitelist('${u.name}','${u.uuid}')">
            <i class="fa fa-user-check"></i> Whitelist
          </button>
          <button class="button is-warning is-small"
                  onclick="battlyServersInstance.toggleBlacklist('${u.name}','${u.uuid}')">
            <i class="fa fa-user-times"></i> Blacklist
          </button>
        </div>
      </div> `;
      box.appendChild(col);
    });
  }

  getFile(pathName, def = []) {
    try { return JSON.parse(fs.readFileSync(pathName, "utf8")); }
    catch { return def; }
  }
  saveFile(pathName, json) {
    fs.writeFileSync(pathName, JSON.stringify(json, null, 2));
  }

  async toggleBan(name, uuid, btn) {
    const fpath = path.join(this.serverDir, "banned-players.json");
    let list = this.getFile(fpath);
    const isBanned = list.some(u => u.uuid === uuid);

    if (this.serverRunning) {
      const cmd = isBanned ? `pardon ${name} ` : `ban ${name} `;
      this.serverProc.stdin.write(cmd + "\n");
    }

    if (!isBanned) {
      list.push({
        name, uuid,
        created: new Date().toISOString(),
        source: "BattlyPanel",
        expires: 0,
        reason: "Baneado"
      });
      btn.innerHTML = `<i class="fa fa-undo" ></i> Desbanear`;
      btn.classList.replace("is-danger", "is-link");
    } else {
      list = list.filter(u => u.uuid !== uuid);
      btn.innerHTML = `<i class="fa fa-ban" ></i> Banear`;
      btn.classList.replace("is-link", "is-danger");
    }

    this.saveFile(fpath, list);
    this.refreshLists();

    try {
      const token = await this.getAuthToken();
      const { data: { authToken } } = await axios.post(
        `${this.apiUrl}/get-server-authtoken`,
        { token, serverId: this.serverId }
      );
      const contentBase64 = Buffer.from(JSON.stringify(list, null, 2)).toString("base64");
      await axios.post(`${this.apiUrl}/upload-config`, {
        authToken, serverId: this.serverId,
        filename: "banned-players.json",
        contentBase64
      });
    } catch (e) {
      console.error("Error subiendo banned-players.json", e);
    }
  }

  toggleWhitelist(name, uuid) {
    const f = path.join(this.serverDir, "whitelist.json");
    let list = this.getFile(f);
    const i = list.findIndex(e => e.uuid === uuid);
    if (i === -1)
      list.push({ name, uuid, added: new Date().toISOString() });
    else
      list.splice(i, 1);
    this.saveFile(f, list);
    this.refreshLists();
  }

  toggleBlacklist(name, uuid) {
    const f = path.join(this.serverDir, "blacklist.json");
    let list = this.getFile(f);
    const i = list.findIndex(e => e.uuid === uuid);
    if (i === -1) list.push({ name, uuid });
    else list.splice(i, 1);
    this.saveFile(f, list);
    this.refreshLists();
  }

  refreshLists() {
    const fill = (selector, file, dateKey = "created", label) => {
      const body = document.querySelector(selector);
      if (!body) return;
      const data = this.getFile(path.join(this.serverDir, file));
      if (data.length === 0) {
        body.innerHTML = `
              <tr>
                <td colspan="2" class="has-text-centered">
                  No hay nadie en la ${label}
                </td>
              </tr>`;
      } else {
        body.innerHTML = data.map(e => `
              <tr>
                <td>${e.name}</td>
                <td>${e[dateKey] || "—"}</td>
              </tr>
            `).join("");
      }
    };
    fill("#banlistTableBody", "banned-players.json", "created", "lista de baneados");
    fill("#whitelistTableBody", "whitelist.json", "added", "lista blanca");
    fill("#blacklistTableBody", "blacklist.json", "created", "lista negra");
  }


  setupCharts() {
    const c1 = document.getElementById("cpuChart").getContext("2d");
    const c2 = document.getElementById("ramChart").getContext("2d");
    this.cpuChart = new Chart(c1, {
      type: "line",
      data: { labels: [], datasets: [{ label: "CPU %", data: [], fill: true }] },
      options: { scales: { y: { beginAtZero: true, max: 100 } } },
    });
    this.ramChart = new Chart(c2, {
      type: "line",
      data: { labels: [], datasets: [{ label: "RAM MB", data: [], fill: true }] },
      options: { scales: { y: { beginAtZero: true } } },
    });
  }


  setServerProperty(key, value) {
    const file = path.join(this.serverDir, "server.properties");
    let map = {};
    if (fs.existsSync(file))
      fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((l) => {
        if (l.trim().startsWith("#") || !l.includes("=")) return;
        const [k, ...rest] = l.split("=");
        map[k.trim()] = rest.join("=");
      });
    map[key] = value;
    const out = Object.entries(map).map(([k, v]) => `${k}=${v}`).join("\n");
    fs.writeFileSync(file, out);
  }

  toggleBooleanProperty(metaId, propName) {
    const span = document.getElementById(metaId);
    let current = (span.textContent.split("=")[1] || "").trim() === "true";
    current = !current;
    span.textContent = `${propName}=${current}`;
    this.setServerProperty(propName, current);

    const btn = event.currentTarget;
    btn.classList.toggle("b-servers-check-toggle", current);
    btn.classList.toggle("b-servers-cross-toggle", !current);
    btn.innerHTML = `<i class="fa fa-${current ? "check" : "times"}"></i>`;
  }


  async updateCharts() {
    if (!this.serverProc || this.serverProc.killed) return;
    try {
      const { cpu, memory } = await pidusage(this.serverProc.pid);
      const cpuP = Math.round(cpu);
      const ramM = Math.round(memory / 1024 / 1024);
      const ts = new Date().toLocaleTimeString();
      const push = (chart, val) => {
        chart.data.labels.push(ts);
        chart.data.datasets[0].data.push(val);
        if (chart.data.labels.length > 20) {
          chart.data.labels.shift();
          chart.data.datasets[0].data.shift();
        }
        chart.update();
      };
      push(this.cpuChart, cpuP);
      push(this.ramChart, ramM);
    } catch (_) { }
  }

  refreshPropertiesPanel() {
    const propsFile = path.join(this.serverDir, 'server.properties');
    if (!fs.existsSync(propsFile)) return;
    const lines = fs.readFileSync(propsFile, 'utf8').split(/\r?\n/);
    const map = {};
    lines.forEach(l => {
      if (l.trim().startsWith('#') || !l.includes('=')) return;
      const [k, ...rest] = l.split('=');
      map[k.trim()] = rest.join('=');
    });

    document.querySelectorAll('.b-servers-server-property-input').forEach(ctrl => {
      const key = ctrl.dataset.prop;
      if (!(key in map)) return;
      const val = map[key];
      if (ctrl.tagName === 'INPUT' || ctrl.tagName === 'SELECT') ctrl.value = val;
      else if (ctrl.tagName === 'BUTTON') ctrl.textContent = (val === 'true') ? '✔' : '✖';
      const metaP = document.getElementById(`${key}Meta`);
      if (metaP) metaP.textContent = `${key}=${val}`;
    });
  }

  async refreshPlayers() {
    const box = document.querySelector("#jugadores .columns");
    if (!box) return;

    try {
      const { players } = await util.status("127.0.0.1", 25565, { timeout: 800 });
      const list = players.sample || [];
      box.innerHTML = "";
      if (list.length === 0) {
        box.innerHTML = `<p class="is-white">${window.stringLoader.getString("servers.noPlayersConnected")}</p>`;
        return;
      }
      list.forEach((p) => {
        const col = document.createElement("div");
        col.className = "column is-6 b-servers-column";
        col.innerHTML = `
          <div class="b-servers-player-card">
            <div class="b-servers-player-avatar">
              <img src="https://mc-heads.net/avatar/${p.name}/64" alt="${p.name}">
            </div>
            <div class="b-servers-player-info">
              <h4 class="b-servers-player-name is-white">${p.name}</h4>
              <p class="b-servers-player-subtitle">Conectado</p>
            </div>
            <div class="b-servers-player-actions">
              <button class="b-servers-btn-kick" onclick="battlyServersInstance.kickPlayer('${p.name}')">
                <i class="fa fa-exclamation-triangle"></i>
                <span class="b-servers-tooltip">Kickear</span>
              </button>
              <button class="is-danger"
                    onclick="battlyServersInstance.toggleBan('${p.name}', '${p.uuid}', this)">
              <i class="fa fa-ban"></i> Banear
              </button>
            </div>
          </div>`;
        box.appendChild(col);
      });
    } catch {
      box.innerHTML = `<p class="is-white">${window.stringLoader.getString("servers.serverOffline")}</p>`;
    }
  }

  async startServer() {
    if (this.serverRunning) return;

    const javaExe = process.platform === "win32"
      ? path.join(this.serverDir, "java/bin/java.exe")
      : path.join(this.serverDir, "java/bin/java");

    const totalMemBytes = os.totalmem();
    const heapBytes = Math.floor(totalMemBytes * 0.15);

    const heapMB = Math.max(512, Math.floor(heapBytes / 1024 / 1024));

    const javaArgs = [
      `-Xms${heapMB}M`,
      `-Xmx${heapMB}M`,

      '-XX:+UseG1GC',
      '-XX:MaxGCPauseMillis=200',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+DisableExplicitGC',
      '-XX:+AlwaysPreTouch',
      `-XX:G1HeapRegionSize=8M`,
      `-XX:G1ReservePercent=20`,
      `-XX:InitiatingHeapOccupancyPercent=15`,
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxInlineLevel=15',
      `-XX:G1NewSizePercent=30`,
      `-XX:G1MaxNewSizePercent=40`,
      `-XX:G1HeapWastePercent=5`,
      `-XX:G1MixedGCCountTarget=4`,
      `-XX:G1MixedGCLiveThresholdPercent=90`,
      `-XX:G1RSetUpdatingPauseTimePercent=5`,
      `-XX:MaxTenuringThreshold=1`,
      '-XX:+PerfDisableSharedMem',

      '-Dusing.aikars.flags=https://mcflags.emc.gs',
      '-Daikars.new.flags=true',

      `-javaagent:${dataDirectory}/.battly/authlib-injector.jar=api.battlylauncher.com`,

      '-jar',
      `${this.serverDir}/server.jar`,
      'nogui'
    ];

    this.serverProc = require("child_process").spawn(
      javaExe,
      javaArgs,
      { cwd: this.serverDir, windowsHide: true }
    );

    await this.tryCreateTunnel();

    this.consoleOutput = document.getElementById("consoleOutput");
    const addLine = (d) => {
      if (!this.consoleOutput) return;
      this.consoleOutput.innerHTML += `${d}`.replace(/[<>&]/g, m => ({
        "<": "&lt;", ">": "&gt;", "&": "&amp;"
      }[m])) + "<br>";
      this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    };
    this.serverProc.stdout.on("data", addLine);
    this.serverProc.stderr.on("data", addLine);
    this.serverProc.on("exit", () => {
      addLine("*** Servidor parado ***");
      this.closeTunnel();
      this.serverRunning = false;
      this.updateActionButtons();
      clearInterval(this.monitorTimer);
      clearInterval(this.playerTimer);
    });

    this.serverRunning = true;
    this.updateActionButtons();
    this.monitorTimer = setInterval(() => this.updateCharts(), 5000);
    this.playerTimer = setInterval(() => this.refreshPlayers(), 10000);
  }


  stopServer() {
    if (this.serverProc && this.serverRunning) {
      this.serverProc.stdin.write("stop\n");
      this.closeTunnel();
    }
  }

  restartServer() {
    if (!this.serverRunning) return this.startServer();
    this.stopServer();
    const pid = this.serverProc.pid;
    const waitExit = setInterval(() => {
      try { process.kill(pid, 0); } catch { clearInterval(waitExit); this.startServer(); }
    }, 1000);
  }

  sendCommand() {
    const input = document.getElementById("consoleCommand");
    const cmd = input.value.trim();
    if (cmd && this.serverRunning) this.serverProc.stdin.write(cmd + "\n");
    input.value = "";
  }

  updateActionButtons() {
    const stop = document.querySelector(".b-servers-stop-btn");
    if (!stop) return;
    if (this.serverRunning) {
      stop.innerHTML = '<i class="fa fa-stop"></i> Parar servidor';
      stop.classList.remove("is-success");
      stop.classList.add("is-warning");
    } else {
      stop.innerHTML = '<i class="fa fa-play"></i> Iniciar servidor';
      stop.classList.remove("is-warning");
      stop.classList.add("is-success");
    }
  }

  async getAuthToken() {
    let account = await this.database?.getSelectedAccount();
    return account?.token || account?.access_token || account?.jwt || null;
  }

  async fetchRemoteServers() {
    const token = await this.getAuthToken();
    if (!token) return [];

    for (const r of this.regions) {
      try {
        const url = `https://${r.frps_domain}`;
        const { data } = await axios.post(`${url}/servers`, { token });

        if (Array.isArray(data) && data.length) {
          this.selectedRegion = r.id;
          this.apiUrl = url;
          return data;
        }
      } catch { }
    }
    return [];
  }



  kickPlayer(n) {
    if (this.serverProc) this.serverProc.stdin.write(`kick ${n}\n`);
  }

  async safePost(url, body) {
    try {
      const { data } = await axios.post(url, body, { timeout: 8000 });
      return data;
    } catch (e) {
      console.error("✖ POST", url, e.response?.status, e.response?.data || e.message);
      return null;
    }
  };

  async tryCreateTunnel() {
    const token = await this.getAuthToken();
    if (!token) return;

    const welcome = await this.safePost(`${this.apiUrl}/welcome`, { token });

    let cfg = null;
    if (welcome?.status === "success") {
      cfg = welcome.server;
    } else {
      const resp = await this.safePost(`${this.apiUrl}/create-tunnel`, {
        token, serverId: this.serverId
      });
      if (resp?.status === "success" || resp?.status === "exists") {
        cfg = resp;
        if (!cfg._id) {
          const w2 = await this.safePost(`${this.apiUrl}/welcome`, { token, region: this.selectedRegion });
          if (w2?.status === "success") cfg = w2.server;
        }
      }
    }

    if (!cfg) {
      console.warn("No se pudo obtener configuración de túnel");
      return;
    }

    if (cfg && cfg._id) this.serverId = cfg._id;

    if (this.assignDomainBox) {
      this.assignDomainBox.className = "fa fa-check";
      this.assignDomainBox = null;
    }
    if (this.assignPortBox) {
      this.assignPortBox.className = "fa fa-check";
      this.assignPortBox = null;
    }

    const frpc = await this.ensureFrpc();
    const ini = await this.writeFrpcIni(cfg, token);
    this.frpcProc = require("child_process")
      .spawn(frpc, ["-c", ini], { stdio: "inherit" });
    this.frpcProc.unref();
  }


  closeTunnel() {
    if (this.frpcProc && !this.frpcProc.killed) {
      try { this.frpcProc.kill("SIGTERM"); }
      catch { }
    }
    this.frpcProc = null;
  }

  async ensureFrpc() {
    const target = FRPC_TARGET_PATH;
    const { url, sha256 } = this.config.libraries.frpc ?? {};

    if (fs.existsSync(target)) {
      try {
        const current = await sha256File(target);
        if (current.toLowerCase() === sha256?.toLowerCase()) {
          if (this.tunnelBox) { this.tunnelBox.className = "fa fa-check"; }
          return target;
        }
      } catch { }
    }

    if (!url) throw new Error("URL de frpc no definida en la configuración");

    await new Promise((res, rej) => {
      https.get(url, response => {
        if (response.statusCode !== 200) return rej(new Error("HTTP " + response.statusCode));
        const total = parseInt(response.headers["content-length"] || "0", 10);
        let done = 0;

        fs.mkdirSync(path.dirname(target), { recursive: true });
        const ws = fs.createWriteStream(target);

        response.on("data", chunk => {
          done += chunk.length;
        });
        response.pipe(ws);
        ws.on("finish", () => ws.close(res));
        ws.on("error", rej);
      }).on("error", rej);
    });

    const finalHash = await sha256File(target);
    if (finalHash.toLowerCase() !== sha256?.toLowerCase()) {
      fs.unlinkSync(target);
      throw new Error("El SHA-256 de frpc no coincide");
    }

    if (this.tunnelBox) { this.tunnelBox.className = "fa fa-check"; }

    try { fs.chmodSync(target, 0o755); } catch { }

    return target;
  }

  async writeFrpcIni(cfg, token) {
    const ini = `
[common]
server_addr = ${cfg.frps_domain}
server_port = ${cfg.frps_port}
tls_enable  = true
authentication_method = oidc
oidc_client_id     = ${token}
oidc_client_secret = ${CLIENT_SECRET}
oidc_audience      = ${AUDIENCE}
oidc_token_endpoint_url = ${this.apiUrl}/token

[${cfg.subdomain}]
type        = tcp
local_ip    = 127.0.0.1
local_port  = 25565
use_encryption = true
use_compression = true
remote_port = ${cfg.remote_port}`.trim();
    const p = path.join(TEMP_DIR, `frpc-${cfg.subdomain}.ini`);
    fs.writeFileSync(p, ini);
    return p;
  }

  async launchMinecraft() {
    const urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
    let account = await this.database?.getSelectedAccount();
    const ram = (await this.database.get("1234", "ram")).value;
    const launch = new Launch();
    launch.Launch({
      url:
        !this.config.game_url || this.config.game_url === ""
          ? `${urlpkg}/files`
          : this.config.game_url,
      authenticator: account,
      path: `${dataDirectory}/.battly`,
      version: this.versionId,
      memory: {
        min: `${ram.ramMin * 1024}M`,
        max: `${ram.ramMax * 1024}M`,
      },
      JVM_ARGS: [
        "-javaagent:authlib-injector.jar=https://api.battlylauncher.com",
        "-Dauthlibinjector.mojangAntiFeatures=enabled",
        "-Dauthlibinjector.noShowServerName",
        "-Dauthlibinjector.disableHttpd",
      ],
      GAME_ARGS: ["-server", "localhost"],
    });
  }

  abs(rel) {
    return path.join(this.serverDir, rel);
  }

  listFiles(rel = this.currentDir) {
    if (!this.serverDir) return;
    this.currentDir = path.normalize(rel);
    const dirPath = this.abs(this.currentDir);
    let rows = "";

    const tbody = document.querySelector("#archivos tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='4'>Cargando…</td></tr>";

    let entries;
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      tbody.innerHTML = "<tr><td colspan='4'>No se puede leer el directorio</td></tr>";
      return;
    }

    if (this.currentDir) {
      rows += `<tr onclick="battlyGoUp()" style="cursor:pointer;">
          <td><i class="fa fa-level-up-alt"></i> …</td><td>—</td><td>—</td><td></td></tr>`;
    }

    for (const ent of entries) {
      const relPath = path.join(this.currentDir, ent.name);
      const full = this.abs(relPath);
      let size = "—";
      let mtime = "—";
      try {
        const st = fs.statSync(full);
        mtime = new Date(st.mtimeMs).toLocaleString();
        if (st.isFile()) size = (st.size / 1024).toFixed(1) + " KB";
      } catch { }
      const isDir = ent.isDirectory();
      const icon = isDir ? "folder" : this.iconForExtension(ent.name);
      const dlBtn = !isDir ? `<button class="button is-small is-info" onclick="battlyServersInstance.downloadPath('${relPath.replace(/\\/g, "\\")}')"><i class="fa fa-download"></i></button>` : "";
      const editBtn = !isDir && EDITABLE_EXTS.includes(path.extname(ent.name)) ? `<button class="button is-small is-success" onclick="battlyOpenFile('${relPath.replace(/\\/g, "\\")}')"><i class='fa fa-edit'></i></button>` : "";
      const delBtn = `<button class="button is-small is-danger" onclick="battlyDeletePath('${relPath.replace(/\\/g, "\\")}')"><i class='fa fa-trash-alt'></i></button>`;
      rows += `<tr ${isDir ? `onclick=\"battlyListFiles('${relPath.replace(/\\/g, "\\")}')\" style='cursor:pointer;'` : ""}>
        <td><i class="fa fa-${icon}"></i> ${ent.name}</td>
        <td>${size}</td>
        <td>${mtime}</td>
        <td style="display:flex;gap:5px;">${dlBtn}${editBtn}${delBtn}</td>
      </tr>`;
    }
    tbody.innerHTML = rows;
  }

  iconForExtension(name) {
    const ext = path.extname(name).toLowerCase();
    if (!ext) return "file";
    if (ext === ".zip" || ext === ".jar") return "file-archive";
    if (ext === ".json") return "file-code";
    return "file-alt";
  }

  goToParentDir() {
    this.listFiles(path.dirname(this.currentDir));
  }

  openFileEditor(relPath) {
    const ext = path.extname(relPath).toLowerCase();
    if (!EDITABLE_EXTS.includes(ext))
      return alert("Tipo de archivo no soportado para edición");

    const absPath = this.abs(relPath);
    const content = fs.readFileSync(absPath, "utf8");
    const { modal, textarea } = this.ensureFileModal();
    const statusEl = modal.querySelector("#fileEditorStatus");
    const saveBtn = modal.querySelector("[data-save]");

    textarea.value = (ext === ".json")
      ? (() => { try { return JSON.stringify(JSON.parse(content), null, 2); } catch { return content; } })()
      : content;

    const validate = () => {
      /* Reset estilos */
      statusEl.style.color = "#f14668";
      saveBtn.disabled = true;

      if (ext === ".json") {
        try {
          JSON.parse(textarea.value);
          statusEl.textContent = "✔ JSON válido";
          statusEl.style.color = "#48c78e";
          saveBtn.disabled = false;
        } catch (e) {
          statusEl.textContent = "✖ " + e.message.split("\n")[0];
        }
        return;
      }

      const words = textarea.value.split(/\s+/);
      const mistakes = words.filter(w => w.length > 4 && w === w.toLowerCase() && !w.match(/[0-9]/))
        .filter(w => !(new Intl.Collator("es").compare(w, w) === 0));

      if (mistakes.length === 0) {
        statusEl.textContent = "✔ Sin errores detectados";
        statusEl.style.color = "#48c78e";
        saveBtn.disabled = false;
      } else {
        statusEl.textContent = `⚠ Posibles errores: ${mistakes.slice(0, 5).join(", ")}…`;
      }
    };

    textarea.addEventListener("input", validate);
    validate();

    saveBtn.onclick = async () => {
      if (saveBtn.disabled) return;

      fs.writeFileSync(absPath, textarea.value, "utf8");

      try {
        const userToken = await this.getAuthToken();
        const resp1 = await axios.post(
          `${this.apiUrl}/get-server-authtoken`,
          { token: userToken, serverId: this.serverId }
        );
        const { authToken } = resp1.data;

        const filename = path.basename(relPath);
        const contentBase64 = Buffer.from(textarea.value, "utf8").toString("base64");

        await axios.post(
          `${this.apiUrl}/upload-config`,
          { authToken, serverId: this.serverId, filename, contentBase64 }
        );

        console.log(`✔ Archivo ${filename} subido correctamente`);
      } catch (err) {
        console.error("❌ Error subiendo configuración:", err);
        new Alert().ShowAlert({
          icon: "error",
          title: "No se pudo subir la configuración",
          text: err.response?.data?.error || err.message
        });
      }

      modal.classList.remove("is-active");
      this.listFiles(this.currentDir);
      this.refreshPropertiesPanel();
    };


    modal.classList.add("is-active");
  }

  async syncConfigs() {
    const userToken = await this.getAuthToken();
    const { data: { authToken } } = await axios.post(
      `${this.apiUrl}/get-server-authtoken`,
      { token: userToken, serverId: this.serverId }
    );

    for (const filename of ["server.properties", "whitelist.json", "banned-players.json"]) {
      try {
        const resp = await axios.get(
          `${this.apiUrl}/download-config/${this.serverId}/${filename}`,
          { params: { authToken }, responseType: "arraybuffer" }
        );
        const dest = path.join(this.serverDir, filename);
        fs.writeFileSync(dest, Buffer.from(resp.data), "utf8");
      } catch (e) {
      }
    }
  }


  ensureFileModal() {
    let modal = document.getElementById("fileEditorModal");
    if (!modal) {
      const tpl = `<div class="modal" id="fileEditorModal">
        <div class="modal-background" onclick="document.getElementById('fileEditorModal').classList.remove('is-active')"></div>
        <div class="modal-card" style="width:80%;max-width:900px;">
          <header class="modal-card-head">
            <p class="modal-card-title">Editor de archivo</p>
            <button class="delete" aria-label="close" onclick="document.getElementById('fileEditorModal').classList.remove('is-active')"></button>
          </header>
          <section class="modal-card-body">
              <textarea id="fileEditorTextarea" spellcheck="true"></textarea>

            <p id="fileEditorStatus" style="margin-top:6px;font-size:0.9rem;"></p>
          </section>

          <footer class="modal-card-foot" style="justify-content:flex-end;">
            <button class="button" onclick="document.getElementById('fileEditorModal').classList.remove('is-active')">Cancelar</button>
            <button class="button is-success" data-save>Guardar</button>
          </footer>
        </div>
      </div>`;
      document.body.insertAdjacentHTML("beforeend", tpl);
      modal = document.getElementById("fileEditorModal");
    }
    return { modal, textarea: modal.querySelector("#fileEditorTextarea") };
  }

  deletePath(relPath) {
    const ok = confirm(`¿Seguro que quieres borrar “${relPath}”? Esta acción no se puede deshacer.`);
    if (!ok) return;
    const absPath = this.abs(relPath);
    try {
      const st = fs.statSync(absPath);
      if (st.isDirectory()) fs.rmSync(absPath, { recursive: true, force: true });
      else fs.unlinkSync(absPath);
      this.listFiles(this.currentDir);
    } catch (e) {
      alert("No se pudo borrar: " + e.message);
    }
  }

  downloadPath(relPath) {
    const absPath = this.abs(relPath);
    if (electronShell) {
      electronShell.showItemInFolder(absPath);
    } else {
      alert("Descarga disponible sólo en modo escritorio (Electron)");
    }
  }


  async initShareSystem() {
    const shareButton = document.getElementById('b-servers-share-button');
    if (shareButton) {
      shareButton.addEventListener('click', () => this.openShareModal());
    }

    this.listenForServerInvites();
  }

  async openShareModal() {
    const modal = document.getElementById('shareServerModal');
    if (!modal) return;

    modal.classList.add('is-active');

    const loading = document.getElementById('share-friends-loading');
    const friendsList = document.getElementById('share-friends-list');
    const noFriends = document.getElementById('share-no-friends');

    loading.style.display = 'block';
    friendsList.innerHTML = '';
    noFriends.style.display = 'none';

    try {

      const account = await this.database?.getSelectedAccount();
      if (!account?.token) {
        throw new Error('No hay cuenta autenticada');
      }

      const response = await fetch('https://api.battlylauncher.com/api/v2/users/obtenerAmigos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${account.token}`
        }
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const onlineFriends = (data.amigos || []).filter(f => f.estado !== 'offline');

      loading.style.display = 'none';

      if (onlineFriends.length === 0) {
        noFriends.style.display = 'block';
        return;
      }

      this.renderShareFriendsList(onlineFriends);

      const searchInput = document.getElementById('share-friend-search');
      searchInput.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        document.querySelectorAll('.share-friend-card').forEach(card => {
          const name = card.dataset.friendName.toLowerCase();
          card.style.display = name.includes(search) ? 'flex' : 'none';
        });
      });

    } catch (error) {
      console.error('Error al cargar amigos:', error);
      loading.style.display = 'none';
      friendsList.innerHTML = `
        <div style="text-align: center; padding: 30px; color: rgba(255, 255, 255, 0.7);">
          <i class="fa fa-exclamation-triangle" style="font-size: 48px; color: #e67e22;"></i>
          <p style="margin-top: 15px;">Error al cargar amigos. Intenta de nuevo.</p>
        </div>
      `;
    }
  }

  renderShareFriendsList(friends) {
    const friendsList = document.getElementById('share-friends-list');
    friendsList.innerHTML = '';

    friends.forEach(friend => {
      const card = document.createElement('div');
      card.className = 'share-friend-card';
      card.dataset.friendName = friend.nombre;
      card.dataset.friendUuid = friend.uuid;

      const statusText = friend.estado === 'online' ? 'En línea' :
        friend.estado === 'ingame' ? 'Jugando' : 'Conectado';

      card.innerHTML = `
        <img class="share-friend-avatar" 
             src="https://mc-heads.net/avatar/${friend.uuid || friend.nombre}/64" 
             alt="${friend.nombre}">
        <div class="share-friend-info">
          <div class="share-friend-name is-inter">${friend.nombre}</div>
          <div class="share-friend-status is-inter">
            <span class="share-friend-status-dot"></span>
            ${statusText}
          </div>
        </div>
        <button class="button is-small share-friend-btn is-inter" data-friend-uuid="${friend.uuid}">
          <i class="fa fa-paper-plane"></i> Invitar
        </button>
      `;

      const inviteBtn = card.querySelector('.share-friend-btn');
      inviteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sendServerInvite(friend, e.target);
      });

      friendsList.appendChild(card);
    });
  }

  async sendServerInvite(friend, btnElement) {
    const btn = btnElement.closest('.share-friend-btn');
    const originalText = btn.innerHTML;

    try {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Enviando...';

      const account = await this.database?.getSelectedAccount();
      const suffix = this.selectedRegion === 'eu' ? '.battly.eu' : '.battly.org';

      const response = await fetch('https://api.battlylauncher.com/api/v2/servers/invitar-amigo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${account.token}`
        },
        body: JSON.stringify({
          friendUuid: friend.uuid,
          serverName: `${this.subdomain}${suffix}`,
          serverVersion: this.versionId,
          subdomain: this.subdomain,
          region: this.selectedRegion
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      btn.innerHTML = '<i class="fa fa-check"></i> Enviado';
      btn.classList.remove('is-info');
      btn.classList.add('is-success');

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('is-success');
        btn.classList.add('is-info');
        btn.disabled = false;
      }, 2000);

      new Alert().ShowAlert({
        icon: 'success',
        title: '¡Invitación enviada!',
        text: `Se envió la invitación a ${friend.nombre}`
      });

    } catch (error) {
      console.error('Error al enviar invitación:', error);
      btn.innerHTML = '<i class="fa fa-times"></i> Error';
      btn.classList.add('is-danger');

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('is-danger');
        btn.disabled = false;
      }, 2000);

      new Alert().ShowAlert({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo enviar la invitación'
      });
    }
  }

  listenForServerInvites() {
    if (typeof ipcRenderer !== 'undefined') {
      console.log('✅ Listener de invitaciones registrado');
      ipcRenderer.on('server-invite-received', (event, inviteData) => {
        console.log('📨 Invitación recibida en renderer:', inviteData);
        try {
          this.showServerInviteModal(inviteData);
        } catch (error) {
          console.error('❌ Error al mostrar modal:', error);
        }
      });
    } else {
      console.warn('⚠️ ipcRenderer no disponible');
    }
  }
  showServerInviteModal(inviteData) {
    console.log('🎯 Intentando mostrar modal con datos:', inviteData);
    const { friendName, friendUuid, serverName, serverVersion, subdomain, region } = inviteData;

    const modal = document.getElementById('serverInviteModal');
    if (!modal) {
      console.error('❌ Modal no encontrado en el DOM');
      return;
    }
    console.log('✅ Modal encontrado');

    const friendNameEl = document.getElementById('invite-friend-name');
    const friendAvatarEl = document.getElementById('invite-friend-avatar');
    const serverNameEl = document.getElementById('invite-server-name');
    const serverVersionEl = document.getElementById('invite-server-version');

    if (!friendNameEl || !friendAvatarEl || !serverNameEl || !serverVersionEl) {
      console.error('❌ Elementos del modal no encontrados');
      return;
    }

    friendNameEl.textContent = friendName;
    friendAvatarEl.src = `https://mc-heads.net/avatar/${friendUuid || friendName}/128`;
    serverNameEl.textContent = serverName;
    serverVersionEl.textContent = serverVersion;

    console.log('✅ Datos del modal actualizados');

    modal.classList.add('is-active');
    console.log('✅ Modal mostrado');

    const acceptBtn = document.getElementById('accept-server-invite');
    const rejectBtn = document.getElementById('reject-server-invite');

    acceptBtn.replaceWith(acceptBtn.cloneNode(true));
    rejectBtn.replaceWith(rejectBtn.cloneNode(true));

    const newAcceptBtn = document.getElementById('accept-server-invite');
    const newRejectBtn = document.getElementById('reject-server-invite');

    newAcceptBtn.addEventListener('click', async () => {
      modal.classList.remove('is-active');
      await this.acceptServerInvite(inviteData);
    });

    newRejectBtn.addEventListener('click', () => {
      modal.classList.remove('is-active');
      new Alert().ShowAlert({
        icon: 'info',
        title: 'Invitación rechazada',
        text: 'Has rechazado la invitación al servidor'
      });
    });
  }

  async acceptServerInvite(inviteData) {
    try {
      const { subdomain, region, serverVersion } = inviteData;

      changePanel('servers');

      await new Promise(resolve => setTimeout(resolve, 500));

      this.subdomain = subdomain;
      this.selectedRegion = region;
      this.versionId = serverVersion;

      const suffix = region === 'eu' ? '.battly.eu' : '.battly.org';
      this.apiUrl = `https://${this.regions.find(r => r.id === region).frps_domain}`;

      new Alert().ShowAlert({
        icon: 'info',
        title: 'Conectando al servidor...',
        text: `Preparando Minecraft ${serverVersion} para conectar a ${subdomain}${suffix}`,
        timer: 3000,
        showConfirmButton: false
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.launchMinecraft();

    } catch (error) {
      console.error('Error al aceptar invitación:', error);
      new Alert().ShowAlert({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo conectar al servidor'
      });
    }
  }
}
if (typeof window !== "undefined") {
  window.showPanel = (id) => {
    document.querySelectorAll(".b-servers-panel-container")
      .forEach(p => p.classList.toggle("active", p.id === id));
    document.querySelectorAll(".b-servers-sidebar .b-servers-menu-list a")
      .forEach(a => {
        const h = a.getAttribute("onclick") || "";
        a.classList.toggle("active", h.includes(id));
      });
  };
  window.openModal = id => document.getElementById(id)?.classList.add("is-active");
  window.closeModal = id => document.getElementById(id)?.classList.remove("is-active");
}



export default Servers;
