const fs = require('fs');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const stream = require('stream');
const util = require('util');
const progress = require('progress-stream');
const { ipcRenderer } = require('electron');
const marked = require('marked');

import { Lang } from './utils/lang.js';

const pipeline = util.promisify(stream.pipeline);
let lang;

const pkgVersion = async () => {
    const pkg = await fs.promises.readFile("package.json");
    return JSON.parse(pkg);
};

class Splash {
    constructor() {
        this.load();
    }

    async load() {
        try {
            const res = await fetch("https://api.battlylauncher.com/launcher/config-launcher/config.json");
            const data = await res.json();
            const version = data.battly.release;
            document.getElementById("version_id").innerHTML = `v${version.latest_version} (build ${version.latest_build})`;
            document.getElementById("update-date").innerHTML = version.latest_version_date;

            const newsRes = await fetch(version.latest_version_news_url);
            let news = await newsRes.text();
            news = marked.parse(news);
            document.getElementById("version-news").innerHTML = news;

            document.getElementById("start-download").addEventListener("click", () => {
                this.startDownload(version);
                document.getElementById("start-download").style.display = "none";
            });

            lang = await new Lang().GetLang();
        } catch (error) {
            console.error("Error loading configuration:", error);
        }
    }

    async startDownload(version) {
        try {
            const actualPkg = await pkgVersion();
            if (actualPkg.version !== version.latest_version || actualPkg.buildVersion !== version.latest_build) {
                console.log("Actualización disponible");
                ipcRenderer.send("update-window-new");
                document.querySelector(".download-status").style.display = "block";

                const downloadUrl = version.latest_version_download_url;
                const zipPath = `${__dirname}/update.zip`;
                const outputPath = __dirname;

                await this.downloadAndUnzip(downloadUrl, zipPath, outputPath);
            }
        } catch (error) {
            console.error("Error during update process:", error);
        }
    }

    updateProgress(progress) {
        const progressBar = document.getElementById("download-progress-bar");
        const progressText = document.getElementById("download-progress-text");
        if (progressBar) {
            progressBar.value = progress;
        }
        if (progressText) {
            progressText.innerText = `Progreso: ${progress}%`;
        }
    }

    log(data) {
        const logElement = document.getElementById("log");
        logElement.innerHTML += `\n${data}`;
        logElement.scrollTop = logElement.scrollHeight;
    }

    async downloadFileWithProgress(url, dest) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`);

        const totalSize = Number(response.headers.get('content-length'));
        const progressStream = progress({ length: totalSize, time: 100 });

        progressStream.on('progress', (progress) => {
            const percentage = Math.round(progress.percentage);
            this.log(`Descargando... ${percentage}%`);
            this.updateProgress(percentage);
        });

        await pipeline(response.body, progressStream, fs.createWriteStream(dest));
    }

    async unzipWithProgress(zipPath, outputPath) {
        const zip = new AdmZip(zipPath);
        const zipEntries = zip.getEntries();
        const totalFiles = zipEntries.length;
        let extractedFiles = 0;
        this.updateProgress(0);

        for (const entry of zipEntries) {
            const fullPath = `${outputPath}/${entry.entryName}`;
            if (entry.isDirectory) {
                fs.mkdirSync(fullPath, { recursive: true });
            } else {
                fs.writeFileSync(fullPath, entry.getData());
            }
            extractedFiles++;
            const progress = Math.round((extractedFiles / totalFiles) * 100);
            this.log(`Descomprimiendo... ${progress}%`);
            this.updateProgress(progress);

            if (extractedFiles === totalFiles) {
                this.log('¡Actualización completada! Reiniciando...');
                setTimeout(() => {
                    ipcRenderer.send("restartLauncher");
                }, 1000);
            }
        }
    }

    async downloadAndUnzip(url, zipPath, outputPath) {
        try {
            await this.downloadFileWithProgress(url, zipPath);
            await this.unzipWithProgress(zipPath, outputPath);
        } catch (error) {
            console.error('Error during download or unzip:', error);
            this.log('Error al descargar o descomprimir el archivo de actualización');
            this.log(error);
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 123)) {
        ipcRenderer.send("update-window-dev-tools");

        console.log("%c¡ESPERA!", "color: #3e8ed0; font-size: 70px; font-weight: bold; font-family: 'Poppins'; text-shadow: 0 0 5px #000;");
        console.log("%c¡No hagas nada aquí si no sabes lo que estás haciendo!", "color: #3e8ed0; font-size: 18px; font-weight: bold; font-family: 'Poppins';");
        console.log("%cTampoco pegues nada externo aquí, ¡hay un 101% de posibilidades de que sea un virus!", "color: #3e8ed0; font-size: 15px; font-weight: bold; font-family: 'Poppins';");
    }
});

new Splash();
