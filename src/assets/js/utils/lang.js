const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");
const { getValue, setValue } = require('./storage');

const dataDirectory =
  process.env.APPDATA ||
  (process.platform === "darwin"
    ? `${process.env.HOME}/Library/Application Support`
    : process.env.HOME);

let instance = null; // Singleton

class Lang {
  constructor() {
    if (instance) return instance;
    instance = this;

    this.stringsCache = null;
    this.cachePromise = null;

    // Cargar el idioma en segundo plano al iniciar
    this.init();
  }

  async init() {
    try {
      this.stringsCache = await this.loadLang();
    } catch (error) {
      console.error("Failed to load language at init:", error);
    }
  }

  async loadLang() {
    let langLocalStorage = await getValue("lang");
    if (!langLocalStorage) {
      langLocalStorage = "es";
      await setValue("lang", "es");
    }
    const langPath = path.join(
      dataDirectory,
      ".battly",
      "battly",
      "launcher",
      "langs",
      `${langLocalStorage}.json`
    );
    const offlineMode = await getValue("offline-mode") === "true";

    const readLangFromFile = async () => {
      try {
        const data = await fs.readFile(langPath, "utf8");
        return JSON.parse(data);
      } catch (error) {
        console.warn("Language file not found or unreadable, defaulting:", error);
        return {};
      }
    };

    const saveLangToFile = async (data) => {
      try {
        await fs.mkdir(path.dirname(langPath), { recursive: true });
        await fs.writeFile(langPath, JSON.stringify(data), "utf8");
      } catch (error) {
        console.error("Error saving language file:", error);
      }
    };

    if (offlineMode) {
      console.log("Offline mode: loading language from local file...");
      return readLangFromFile();
    }

    try {
      console.log("Fetching language from API...");
      const response = await fetch(
        `https://api.battlylauncher.com/launcher/langs/${langLocalStorage}`
      );
      const { strings, version } = await response.json();

      const localVersion = await getValue("langVersion") || 0;

      console.log(`API version: ${version}, local version: ${localVersion}`);
      if (version.toString() !== localVersion.toString()) {
        console.log("New language version, saving to local file...");
        await setValue("langVersion", version);
        await saveLangToFile(strings);
      }

      return strings;
    } catch (error) {
      console.error(
        "Error fetching language from API, falling back to local file:",
        error
      );
      return readLangFromFile();
    }
  }

  async GetLang() {
    if (this.stringsCache) {
      return this.stringsCache;
    }

    if (!this.cachePromise) {
      this.cachePromise = this.loadLang().then((data) => {
        this.stringsCache = data;
        return data;
      });
    }

    return this.cachePromise;
  }
}

module.exports = { Lang };
