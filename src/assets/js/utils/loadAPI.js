/**
 * @author TECNO BROS
 
 */

const pkg = require('../package.json');
let url = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url

let config = `${url}/launcher/config-launcher/config.json`;
let news = `${url}/launcher/news-launcher/news.json`;
const axios = require("axios")
const https = require("https")
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const fs = require("fs");
const path = require("path");
const dataDirectory = process.env.APPDATA || (process.platform == "darwin" ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);

const configURL = "https://api.battlylauncher.com/battlylauncher/launcher/config-launcher/config.json";
const versionsURL = "https://api.battlylauncher.com/battlylauncher/launcher/config-launcher/versions.json";
const versionsMojangURL = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";

const loadingText = document.getElementById("loading-text");
import { Lang } from "./lang.js";

let lang = await new Lang().GetLang();
class LoadAPI {
    constructor() {
    }
    async GetConfig() {
        loadingText.innerHTML = lang.loading_config;
        document.querySelector(".preload-content").style.display = "";
        try {
            const response = await axios.get(configURL, { httpsAgent });
            const data = response.data;

            loadingText.innerHTML = lang.config_loaded;

            if (!fs.existsSync(path.join(`${dataDirectory}/.battly`, "battly"))) fs.mkdirSync(path.join(`${dataDirectory}/.battly`, "battly"));
            if (!fs.existsSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher"))) fs.mkdirSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher"));
            if (!fs.existsSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher"))) fs.mkdirSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher"));

            fs.writeFileSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher", "config.json"), JSON.stringify(data, null, 4));

            return data;
        } catch (error) {
            try {
                const data = fs.readFileSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher", "config.json"));
                const parsedData = JSON.parse(data);

                loadingText.innerHTML = lang.error_loading_config;

                return parsedData;
            } catch (err) {
                console.log(err);
                return Promise.reject(err);
            }
        }
    }

    async GetVersions() {
        loadingText.innerHTML = lang.loading_versions
        try {
            const response = await axios.get(versionsURL, { httpsAgent });
            const data = response.data;

            loadingText.innerHTML = lang.versions_loaded;

            fs.writeFileSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher", "versions.json"), JSON.stringify(data, null, 4));

            return data;
        } catch (error) {
            try {
                const data = fs.readFileSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher", "versions.json"));
                const parsedData = JSON.parse(data);

                loadingText.innerHTML = lang.error_loading_versions;

                return parsedData;
            } catch (err) {
                console.log(err);
                return Promise.reject(err);
            }
        }
    }

    async GetVersionsMojang() {
        loadingText.innerHTML = lang.loading_minecraft_versions;
        try {
            const response = await axios.get(versionsMojangURL, { httpsAgent });
            const data = response.data;

            loadingText.innerHTML = lang.minecraft_versions_loaded;

            fs.writeFileSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher", "versions-mojang.json"), JSON.stringify(data, null, 4));

            setTimeout(() => {
                loadingText.innerHTML = lang.starting_battly;
            }, 2000);

            return data;
        } catch (error) {
            loadingText.innerHTML = lang.error_loading_minecraft_versions;
            try {
                const data = fs.readFileSync(path.join(`${dataDirectory}/.battly`, "battly", "launcher", "config-launcher", "versions-mojang.json"));
                const parsedData = JSON.parse(data);

                return parsedData;
            } catch (err) {
                console.log(err);
                return Promise.reject(err);
            }
        }
    }
}


export { LoadAPI };