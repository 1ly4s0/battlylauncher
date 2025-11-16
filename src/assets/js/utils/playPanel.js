const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");
const { getValue, setValue } = require('./assets/js/utils/storage');
const { LaunchDownloadedVersion } = require('./launcher');

const dataDirectory =
    process.env.APPDATA ||
    (process.platform == "darwin"
        ? `${process.env.HOME}/Library/Application Support`
        : process.env.HOME);

async function HandlePlayPanel(instance) {
    const thiss = instance;

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
                  Iniciarás la versión: <span id="versionYouAreStarting"></span>
                </p>
                <button class="styled-start-version-btn" id="start-game-btn" style="display: none;">
                  <div class="svg-wrapper-1">
                    <div class="svg-wrapper">
                      <i class="fa-solid fa-gamepad"></i>
                    </div>
                  </div>
                  <span>Jugar</span>
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

                await LaunchDownloadedVersion(instance, {
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

            await LaunchDownloadedVersion(instance, {
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

module.exports = { HandlePlayPanel };