const axios = require("axios");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const https = require("https");
const { getValue, setValue } = require("./assets/js/utils/storage");
const { Lang } = require("./assets/js/utils/lang.js");

const CONFIG_URL = "https://api.battlylauncher.com/v3/launcher/config-launcher/config.json";
const VERSIONS_URL = "https://api.battlylauncher.com/v3/battlylauncher/launcher/config-launcher/versions.json";
const MOJANG_VERSIONS_URL = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";

let songStarted = false;

const dataDirectory =
    process.env.APPDATA ||
    (process.platform === "darwin"
        ? `${process.env.HOME}/Library/Application Support`
        : process.env.HOME);

const insecureTLS = process.env.BATTLY_INSECURE_TLS === "true";
const httpsAgent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: !insecureTLS,
});

const http = axios.create({
    timeout: 10000,
    httpsAgent,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    headers: {
        Accept: "application/json",
    },
});

function getLocalPath(...sub) {
    return path.join(dataDirectory, ".battly", "battly", "launcher", ...sub);
}
async function ensureDirFor(filePath) {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
}
async function readJSONSafe(filePath) {
    const raw = await fsp.readFile(filePath, "utf8");
    return JSON.parse(raw);
}
async function writeJSONAtomic(filePath, dataObj) {
    await ensureDirFor(filePath);
    const tmp = `${filePath}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(dataObj, null, 2), "utf8");
    await fsp.rename(tmp, filePath);
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function getEl(id) {
    if (typeof document === "undefined") return null;
    return document.getElementById(id);
}

async function readMeta(metaPath) {
    try {
        return await readJSONSafe(metaPath);
    } catch {
        return {};
    }
}
async function writeMeta(metaPath, meta) {
    try {
        await writeJSONAtomic(metaPath, meta);
    } catch (e) {
        console.error("Error writing meta:");
        console.error(e);
    }
}

async function getWithRetry(url, config, retries = 2) {
    let attempt = 0;
    let lastErr;
    while (attempt <= retries) {
        try {
            return await http.get(url, config);
        } catch (err) {
            lastErr = err;
            if (attempt < retries) {
                const backoff = 500 * Math.pow(2, attempt);
                await sleep(backoff);
            }
            attempt++;
        }
    }
    throw lastErr;
}

function setLoadingText(keyOrText) {
    const el = getEl("loading-text");
    if (!el) return;
    el.innerHTML = keyOrText;
}
function applyChristmasUI(config, { startup, lang }) {
    if (!config || typeof document === "undefined") return;
    const snow = getEl("christmas-snowflakes");
    const up = getEl("rectangulo-arriba");
    const down = getEl("rectangulo-abajo");
    if (!config.christmasTheme?.enabled) {
        if (!startup && snow) snow.style.display = "none";
        return;
    }
    if (!startup) {
        if (up) up.src = "assets/images/icons/pengu_christmas.gif";
        if (down) down.src = "assets/images/icons/pengu_christmas.gif";
        if (snow) snow.style.display = "";
    }
    if (config.christmasTheme?.songEnabled && !songStarted) {
        try {
            const audio = new Audio("assets/audios/jingle-bells.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => { });
            songStarted = true;
        } catch { }
    }
}

let songPlayed = false;

class LoadAPI {
    constructor() {
        this.paths = {
            config: getLocalPath("config-launcher", "config.json"),
            versions: getLocalPath("config-launcher", "versions.json"),
            mojangVersions: getLocalPath("config-launcher", "versions-mojang.json"),
        };
        this.meta = {
            config: `${this.paths.config}.meta.json`,
            versions: `${this.paths.versions}.meta.json`,
            mojang: `${this.paths.mojangVersions}.meta.json`,
        };
        this._langPromise = null;
    }

    async lang() {
        if (!this._langPromise) this._langPromise = new Lang().GetLang();
        try {
            return await this._langPromise;
        } catch (e) {
            console.error("Lang load error:", e);
            return {
                loading_config: "Cargando configuración...",
                config_loaded: "Configuración cargada.",
                error_loading_config: "Error cargando configuración.",
                loading_versions: "Cargando versiones...",
                versions_loaded: "Versiones cargadas.",
                error_loading_versions: "Error cargando versiones.",
                loading_minecraft_versions: "Cargando versiones de Minecraft...",
                minecraft_versions_loaded: "Versiones de Minecraft cargadas.",
                error_loading_minecraft_versions: "Error cargando versiones de Minecraft.",
                starting_battly: "Iniciando Battly...",
            };
        }
    }

    async loadFile({ url, localPath, metaPath, loadingKey, successKey, errorKey, startup = false, applyUI = false }) {
        const lang = await this.lang();
        if (!startup) setLoadingText(lang[loadingKey] || loadingKey);
        let offlineMode = "false";
        try {
            offlineMode = String(await getValue("offline-mode"));
        } catch { }
        if (offlineMode === "true") {
            try {
                const data = await readJSONSafe(localPath);
                if (!startup) setLoadingText(lang[successKey] || successKey);
                if (applyUI && url === CONFIG_URL) applyChristmasUI(data, { startup, lang });
                return data;
            } catch (err) {
                if (!startup) setLoadingText(lang[errorKey] || errorKey);
                throw err;
            }
        }
        const meta = await readMeta(metaPath);
        const headers = {};
        try {
            const res = await getWithRetry(url, { headers });
            const data = res.data;
            await writeJSONAtomic(localPath, data);
            await writeMeta(metaPath, {
                etag: res.headers.etag || meta.etag || null,
                lastModified: res.headers["last-modified"] || meta.lastModified || null,
                updatedAt: Date.now(),
            });
            if (!startup) setLoadingText(lang[successKey] || successKey);
            if (applyUI && url === CONFIG_URL) {
                applyChristmasUI(data, { startup, lang });
                if (data?.christmasTheme?.songEnabled && !songPlayed) {
                    songPlayed = true;
                }
            }
            return data;
        } catch (networkErr) {
            console.warn("Fallo online, intentando offline:", networkErr?.message || networkErr);
            try {
                const data = await readJSONSafe(localPath);
                if (!startup) setLoadingText(lang[errorKey] || errorKey);
                if (applyUI && url === CONFIG_URL) applyChristmasUI(data, { startup, lang });
                return data;
            } catch (diskErr) {
                if (!startup) setLoadingText(lang[errorKey] || errorKey);
                throw diskErr;
            }
        }
    }

    async GetConfig(startup = false) {
        const lang = await this.lang();
        return this.loadFile({
            url: CONFIG_URL,
            localPath: this.paths.config,
            metaPath: this.meta.config,
            loadingKey: "loading_config",
            successKey: "config_loaded",
            errorKey: "error_loading_config",
            startup,
            applyUI: true,
        });
    }

    async GetVersions() {
        return this.loadFile({
            url: VERSIONS_URL,
            localPath: this.paths.versions,
            metaPath: this.meta.versions,
            loadingKey: "loading_versions",
            successKey: "versions_loaded",
            errorKey: "error_loading_versions",
            startup: false,
            applyUI: false,
        });
    }

    async GetVersionsMojang() {
        const data = await this.loadFile({
            url: MOJANG_VERSIONS_URL,
            localPath: this.paths.mojangVersions,
            metaPath: this.meta.mojang,
            loadingKey: "loading_minecraft_versions",
            successKey: "minecraft_versions_loaded",
            errorKey: "error_loading_minecraft_versions",
            startup: false,
            applyUI: false,
        });
        const lang = await this.lang();
        setTimeout(() => setLoadingText(lang.starting_battly || "Starting Battly..."), 2000);
        return data;
    }
}

export { LoadAPI };
