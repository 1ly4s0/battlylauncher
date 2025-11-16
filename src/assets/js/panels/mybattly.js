'use strict';

console.time("🕐 MyBattly");
import { logger, database, changePanel } from '../utils.js';
import { Alert } from "../utils/alert.js";
import * as NBT from "../../../../node_modules/nbtify/dist/index.js";

const { Lang } = require("./assets/js/utils/lang.js");
const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
let lang;
new Lang().GetLang().then(lang_ => {
    lang = lang_;
}).catch(error => {
    console.error("Error:", error);
});

import { AskModal } from '../utils/askModal.js';
const modal = new AskModal();

console.timeEnd("🕐 MyBattly");

class MyBattly {
    static id = "mybattly";

    async init(config, news) {
        console.time("🕐 MyBattly init");

        this.database = await new database().init();
        this.config = config;
        lang = await new Lang().GetLang();
        this.Load();
        this.LoadFriends();

        // Observar cuando el panel se activa
        this.setupPanelObserver();

        console.timeEnd("🕐 MyBattly init");
    }

    setupPanelObserver() {
        const { getValue } = require('./assets/js/utils/storage');
        const panel = document.querySelector('.panel.mybattly');

        if (!panel) return;

        let wasActive = panel.classList.contains('active');

        const observer = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isActive = panel.classList.contains('active');

                    // Solo ejecutar si cambió de inactivo a activo
                    if (isActive && !wasActive) {
                        const tutorialCompleted = await getValue("mybattlyTutorialCompleted");
                        if (!tutorialCompleted) {
                            observer.disconnect();
                            setTimeout(() => {
                                this.startTutorial();
                            }, 800);
                        }
                    }

                    wasActive = isActive;
                }
            }
        });

        observer.observe(panel, { attributes: true });
    }

    async startTutorial() {
        const { getValue, setValue } = require('./assets/js/utils/storage');
        const Shepherd = require("./assets/js/utils/shepherd.cjs");

        const tour = new Shepherd.default.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                classes: "shadow-md bg-purple-dark",
                scrollTo: { behavior: "smooth", block: "center" },
            },
        });

        const getString = (key) => window.stringLoader?.getString(key) || key;

        tour.addStep({
            id: "mybattly-welcome",
            title: getString('tour.settings.welcome'),
            text: getString('tour.settings.welcomeText'),
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "Tu perfil",
            text: "Aquí puedes ver tu información de usuario, fecha de creación y estado de tu cuenta.",
            attachTo: {
                element: ".b-mybattly-main-panel-welcome",
                on: "bottom",
            },
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "Paneles de gestión",
            text: "Explora diferentes secciones para gestionar tus mods, mundos, texturas y más.",
            attachTo: {
                element: ".b-mybattly-panels-container",
                on: "top",
            },
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: "Estadísticas de usuario",
            text: "Aquí podrás ver tus estadísticas de juego, amigos y más información sobre tu actividad.",
            attachTo: {
                element: ".b-mybattly-main-panel-right",
                on: "left",
            },
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            id: "mybattly-finish",
            title: getString('tour.settings.finishTitle'),
            text: getString('tour.settings.finishText'),
            buttons: [
                {
                    text: getString('tour.finish'),
                    action: tour.complete,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        try {
            await modal.ask({
                title: "¿Quieres un tour por Mi Battly?",
                text: "Te guiaré a través de las características principales.",
                showCancelButton: true,
                confirmButtonText: "Sí, quiero el tour",
                cancelButtonText: "No, gracias",
                preConfirm: () => true
            });

            await tour.start();
            await setValue("mybattlyTutorialCompleted", true);

        } catch (err) {
            await setValue("mybattlyTutorialCompleted", true);
            if (err !== "cancelled") {
                console.error("Error al iniciar el tour de Mi Battly:", err);
            }
        }
    }

    async Load() {

        document.getElementById("mybattly-btn").addEventListener("click", () => {
            changePanel("mybattly");
            this.LoadDatas();
        });

        document.getElementById("back-mybattly-btn").addEventListener("click", () => {
            changePanel("home");
        });

        const loadButtons = document.querySelectorAll(".b-mybattly-load-panel");

        loadButtons.forEach((button) => {
            button.addEventListener("click", async () => {
                button.classList.add("is-loading");
                button.disabled = true;
                button.style.opacity = 1;

                const targetId = button.getAttribute("data-target");
                const panel = document.getElementById(targetId);
                const overlay = button.closest(".b-mybattly-panel-overlay");
                const unzipper = require('unzipper');
                const fs = require('fs');
                const path = require('path');
                const Swal = require("./assets/js/libs/sweetalert/sweetalert2.all.min");

                if (panel && overlay) {
                    if (targetId === "panel-mods") {

                        const modsTable = panel.querySelector("table tbody");

                        modsTable.innerHTML = "";

                        const modsDirectory = `${dataDirectory}/.battly/mods`;

                        if (!fs.existsSync(modsDirectory)) {
                            fs.mkdirSync(modsDirectory);
                        }

                        let mods = fs
                            .readdirSync(modsDirectory)
                            .filter((file) => {
                                const ext = path.extname(file);
                                return ext === ".jar" || ext === ".disabledmod";
                            })
                            .map((file) => path.join(modsDirectory, file));

                        let modsArray = [];

                        if (!mods.length) {
                            const emptyRow = document.createElement("tr");
                            const emptyCell = document.createElement("td");
                            emptyCell.colSpan = 5;
                            emptyCell.style.textAlign = "center";
                            emptyCell.style.color = "#fff";
                            emptyCell.style.fontFamily = "Poppins";
                            emptyCell.style.padding = "10px";
                            emptyCell.textContent = window.stringLoader.getString("mybattly.noMods");
                            emptyRow.appendChild(emptyCell);
                            modsTable.appendChild(emptyRow);

                            panel.classList.remove("b-mybattly-blur-panel");
                            overlay.style.animation = "disableBlur 0.5s linear forwards";
                            button.classList.remove("is-loading");
                            panel.style.display = "block";
                            return;
                        }

                        await Promise.all(
                            mods.map(async (modPath) => {
                                try {
                                    const zip = await unzipper.Open.file(modPath);

                                    const manifestEntry = zip.files.find((entry) =>
                                        entry.path.toLowerCase().endsWith("mods.toml") ||
                                        entry.path.toLowerCase().endsWith("fabric.mod.json") ||
                                        entry.path.toLowerCase().endsWith("quilt.mod.json")
                                    );

                                    if (!manifestEntry) {
                                        console.log("No manifest found for", modPath);
                                        return;
                                    }

                                    const manifestContent = await manifestEntry.buffer();
                                    const manifestString = manifestContent.toString("utf8");

                                    const toml = require('toml');

                                    const manifest = manifestEntry.path.toLowerCase().endsWith("mods.toml")
                                        ? toml.parse(manifestString)
                                        : JSON.parse(manifestString);

                                    const modInfo = manifest.mods?.[0] || manifest;

                                    const modIconEntry = zip.files.find((entry) =>
                                        entry.path.toLowerCase() === (manifest.icon?.toLowerCase() || "") ||
                                        entry.path.toLowerCase().endsWith(`icon.png`) ||
                                        entry.path.toLowerCase().endsWith(`mod_logo.png`) ||
                                        entry.path.toLowerCase().endsWith(modInfo.id + ".png")
                                    );

                                    const modIconBase64 = modIconEntry
                                        ? `data:image/png;base64,${(await modIconEntry.buffer()).toString("base64")}`
                                        : "https://battlylauncher.com/assets/img/mc-icon.png";

                                    const modObject = {
                                        name: modInfo.displayName || modInfo.name || "Unknown Mod",
                                        version: modInfo.version || "Unknown Version",
                                        description: modInfo.description || "No description provided.",
                                        image: modIconBase64,
                                    };

                                    modsArray.push(modObject);

                                    const row = document.createElement("tr");
                                    row.id = modPath;

                                    const isDisabled = modPath.endsWith(".disabledmod");
                                    const stateText = isDisabled ? "Inactivo" : "Activo";
                                    const stateTagClass = isDisabled ? "tag is-warning" : "tag is-success";

                                    row.innerHTML = `
                                <td>
                                    <img src="${modObject.image}" style="width: 30px; height: 30px; border-radius: 5px;" />
                                </td>
                                <td>${modObject.name}</td>
                                <td>${modObject.version}</td>
                                <td>
                                    <span class="${stateTagClass}">${stateText}</span>
                                </td>
                                <td>
                                    <!-- Usamos <i> o <button>, a tu gusto -->
                                    <div class="b-mybattly-actions-td">
                                    <i class="${isDisabled ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}"></i>
                                    <i class="fa-solid fa-folder-open"></i>
                                    <i class="fa-solid fa-trash"></i>
                                    <i class="fa-solid fa-angle-down"></i>
                                    </div>
                                </td>
                            `;

                                    const descRow = document.createElement("tr");
                                    descRow.style.display = "none";
                                    const descCell = document.createElement("td");
                                    descCell.colSpan = 5;
                                    descCell.style.color = "#fff";
                                    descCell.style.fontFamily = "Poppins";
                                    descCell.style.fontWeight = "700";
                                    descCell.style.backgroundColor = "#2B2B2B";

                                    descCell.style.padding = "10px";
                                    descCell.textContent = modObject.description;
                                    descRow.appendChild(descCell);

                                    modsTable.appendChild(row);
                                    modsTable.appendChild(descRow);

                                    const [deactivateIcon, openIcon, deleteIcon, toggleIcon] =
                                        row.querySelectorAll(".b-mybattly-actions-td > i");

                                    deactivateIcon.addEventListener("click", () => {
                                        try {
                                            const currentPath = path.resolve(modPath);
                                            let newPath;

                                            if (currentPath.endsWith(".disabledmod")) {
                                                newPath = currentPath.replace(".disabledmod", ".jar");
                                            } else if (currentPath.endsWith(".jar")) {
                                                newPath = currentPath.replace(".jar", ".disabledmod");
                                            } else {
                                                console.error("Unknown file type:", currentPath);
                                                return;
                                            }

                                            console.log("Renaming: " + currentPath + " -> " + newPath);
                                            fs.renameSync(currentPath, newPath);

                                            const modIndex = mods.indexOf(modPath);
                                            if (modIndex !== -1) {
                                                mods[modIndex] = newPath;
                                            }
                                            modPath = newPath;

                                            deactivateIcon.classList.toggle("fa-eye");
                                            deactivateIcon.classList.toggle("fa-eye-slash");

                                            const stateSpan = row.querySelector("span");
                                            if (stateSpan) {
                                                const wasDisabled = currentPath.endsWith(".disabledmod");
                                                stateSpan.className = wasDisabled
                                                    ? "tag is-success"
                                                    : "tag is-warning";
                                                stateSpan.textContent = wasDisabled ? "Activo" : "Inactivo";
                                            }

                                            new Alert().ShowAlert({
                                                icon: "success",
                                                title: currentPath.endsWith(".disabledmod")
                                                    ? window.stringLoader.getString("mybattly.modActivated")
                                                    : window.stringLoader.getString("mybattly.modDeactivated"),
                                            });
                                        } catch (error) {
                                            console.error("Error renaming file:");
                                            console.error(error);
                                        }
                                    });

                                    const shell = require('electron').shell;

                                    openIcon.addEventListener("click", () => shell.showItemInFolder(modPath));

                                    deleteIcon.addEventListener("click", async () => {
                                        try {
                                            await modal.ask({
                                                title: lang.are_you_sure,
                                                text: lang.are_you_sure_text,
                                                showCancelButton: true,
                                                confirmButtonText: lang.yes_delete,
                                                cancelButtonText: lang.no_cancel,
                                                confirmButtonColor: "#f14668",
                                                cancelButtonColor: "#3e8ed0",
                                                preConfirm: () => true
                                            });

                                            row.remove();
                                            descRow.remove();
                                            fs.unlinkSync(modPath);

                                            new Alert().ShowAlert({
                                                icon: "success",
                                                title: window.stringLoader.getString("mybattly.modDeleted"),
                                            });

                                        } catch (err) {
                                        }
                                    });

                                    toggleIcon.addEventListener("click", () => {
                                        const isVisible = descRow.style.display !== "none";
                                        descRow.style.display = isVisible ? "none" : "";
                                        toggleIcon.classList.toggle("fa-angle-down");
                                        toggleIcon.classList.toggle("fa-angle-up");
                                    });
                                } catch (error) {
                                    console.error("Error processing mod:", modPath, error);
                                }
                            })
                        );

                        panel.classList.remove("b-mybattly-blur-panel");
                        overlay.style.animation = "disableBlur 0.5s linear forwards";
                        button.classList.remove("is-loading");

                        panel.style.display = "block";
                    } else if (targetId === "panel-worlds") {

                        const worldsTable = panel.querySelector("table tbody");

                        worldsTable.innerHTML = "";

                        const worldsDirectory = `${dataDirectory}/.battly/saves`;

                        if (!fs.existsSync(worldsDirectory)) {
                            fs.mkdirSync(worldsDirectory);
                        }

                        let worlds = fs
                            .readdirSync(worldsDirectory, { withFileTypes: true })
                            .filter((entry) => entry.isDirectory())
                            .map((entry) => path.join(worldsDirectory, entry.name));

                        if (!worlds.length) {
                            const emptyRow = document.createElement("tr");
                            const emptyCell = document.createElement("td");
                            emptyCell.colSpan = 4;
                            emptyCell.style.textAlign = "center";
                            emptyCell.style.color = "#fff";
                            emptyCell.style.fontFamily = "Poppins";
                            emptyCell.style.padding = "10px";
                            emptyCell.textContent = window.stringLoader.getString("mybattly.noWorlds");
                            emptyRow.appendChild(emptyCell);
                            worldsTable.appendChild(emptyRow);

                            panel.classList.remove("b-mybattly-blur-panel");
                            overlay.style.animation = "disableBlur 0.5s linear forwards";
                            button.classList.remove("is-loading");
                            panel.style.display = "block";
                            return;
                        }

                        for (const worldPath of worlds) {
                            try {

                                const worldName = path.basename(worldPath);

                                const levelDatPath = path.join(worldPath, "level.dat");
                                const levelDatBuffer = await fs.readFileSync(levelDatPath);
                                const levelDat = await NBT.read(levelDatBuffer);

                                const gameModes = {
                                    0: "Survival",
                                    1: "Creativo",
                                    2: "Aventura",
                                    3: "Espectador",
                                };

                                const worldType = "Desconocido";

                                let worldIconBase64 = "https://battlylauncher.com/assets/img/mc-icon.png";
                                if (fs.existsSync(worldPath + "/icon.png")) {
                                    worldIconBase64 = `data:image/png;base64,${await fs.readFileSync(worldPath + "/icon.png", "base64")}`;
                                }

                                const row = document.createElement("tr");
                                row.id = worldPath;

                                row.innerHTML = `
                <td>
                    <img
                        src="${worldIconBase64}"
                        style="width: 30px; height: 30px;"
                        alt="world-icon"
                    />
                </td>
                <td>${worldName}</td>
                <td>${gameModes[parseInt(levelDat.data.Data.GameType) || 0]}</td>
                <td>
                    <button
                        class="button is-info is-small is-outlined b-mybattly-b-600 b-mybattly-is-poppins backup-btn"
                    >
                        Hacer copia de seguridad
                    </button>
                    <button
                        class="button is-danger is-small is-outlined b-mybattly-b-600 b-mybattly-is-poppins delete-btn"
                    >
                        Eliminar
                    </button>
                </td>
            `;

                                worldsTable.appendChild(row);

                                const backupBtn = row.querySelector(".backup-btn");
                                const deleteBtn = row.querySelector(".delete-btn");

                                backupBtn.addEventListener("click", (e) => {
                                    e.stopPropagation();

                                    new Alert().ShowAlert({
                                        icon: "info",
                                        title: window.stringLoader.getString("mybattly.backupInProgress")
                                    });
                                });

                                deleteBtn.addEventListener("click", async (e) => {
                                    e.stopPropagation();

                                    try {
                                        await modal.ask({
                                            title: lang.are_you_sure,
                                            text: lang.are_you_sure_text,
                                            showCancelButton: true,
                                            confirmButtonText: lang.yes_delete,
                                            cancelButtonText: lang.no_cancel,
                                            confirmButtonColor: "#f14668",
                                            cancelButtonColor: "#3e8ed0",
                                            preConfirm: () => true
                                        });

                                        row.remove();
                                        fs.rmdirSync(worldPath, { recursive: true });

                                        new Alert().ShowAlert({
                                            icon: "success",
                                            title: window.stringLoader.getString("mybattly.worldDeleted"),
                                        });

                                    } catch (err) {

                                    }
                                });

                                row.addEventListener("click", () => {
                                    ipcRenderer.send("load-world", worldPath);
                                });
                            } catch (error) {
                                console.error("Error processing world:");
                                console.error(error);
                            }
                        }

                        panel.classList.remove("b-mybattly-blur-panel");
                        overlay.style.animation = "disableBlur 0.5s linear forwards";
                        button.classList.remove("is-loading");

                        panel.style.display = "block";
                    } else if (targetId === "panel-resourcepacks") {
                        const rpsTable = panel.querySelector("table tbody");
                        rpsTable.innerHTML = "";

                        const rpsDirectory = `${dataDirectory}/.battly/resourcepacks`;
                        if (!fs.existsSync(rpsDirectory)) {
                            fs.mkdirSync(rpsDirectory);
                        }

                        let optionsPath = path.join(dataDirectory, ".battly", "options.txt");
                        let activeResourcePacks = [];
                        try {
                            const optionsContent = fs.readFileSync(optionsPath, "utf8");

                            const match = optionsContent.match(/resourcePacks:\[(.*?)\]/);
                            if (match) {

                                const arrayString = `[${match[1]}]`.replace(/'/g, '"');

                                activeResourcePacks = JSON.parse(arrayString);
                            }
                        } catch (err) {
                            console.warn("No se pudo leer o parsear options.txt:", err);

                        }

                        let packs = fs
                            .readdirSync(rpsDirectory)
                            .filter((file) => file.toLowerCase().endsWith(".zip"))
                            .map((file) => path.join(rpsDirectory, file));

                        if (!packs.length) {
                            const emptyRow = document.createElement("tr");
                            const emptyCell = document.createElement("td");
                            emptyCell.colSpan = 5;
                            emptyCell.style.textAlign = "center";
                            emptyCell.style.color = "#fff";
                            emptyCell.style.fontFamily = "Poppins";
                            emptyCell.style.padding = "10px";
                            emptyCell.textContent = window.stringLoader.getString("mybattly.noResourcePacks");
                            emptyRow.appendChild(emptyCell);
                            rpsTable.appendChild(emptyRow);

                            panel.classList.remove("b-mybattly-blur-panel");
                            overlay.style.animation = "disableBlur 0.5s linear forwards";
                            button.classList.remove("is-loading");
                            panel.style.display = "block";
                            return;
                        }

                        for (const rpPath of packs) {
                            try {
                                const rpFileName = path.basename(rpPath);

                                const zip = await unzipper.Open.file(rpPath);

                                const mcmetaEntry = zip.files.find((entry) =>
                                    entry.path.toLowerCase().endsWith("pack.mcmeta")
                                );
                                if (!mcmetaEntry) {
                                    console.warn("No pack.mcmeta found in:", rpPath);
                                    continue;
                                }

                                const versiones = {
                                    1: "13w24a–1.8.9",
                                    2: "15w31a–1.10.2",
                                    3: "16w32a–17w47b",
                                    4: "17w48a–19w46b",
                                    5: "1.15-pre1–1.16.2-pre3",
                                    6: "1.16.2-rc1–1.16.5",
                                    7: "20w45a–21w38a",
                                    8: "21w39a–1.18.2",
                                    9: "22w11a–1.19.2",
                                    10: "22w42a–22w44a",
                                    11: "22w45a–23w07a",
                                    12: "1.19.4-pre1–23w13a",
                                    13: "23w14a–23w16a",
                                    14: "23w17a–1.20.1",
                                    15: "23w31a",
                                    16: "23w32a–1.20.2-pre1",
                                    17: "1.20.2-pre2–23w41a",
                                    18: "23w42a",
                                    19: "23w43a–23w44a",
                                    20: "23w45a–23w46a",
                                    21: "1.20.3-pre1–23w51b",
                                    22: "24w03a–24w04a",
                                    23: "24w05a–24w05b",
                                    24: "24w06a–24w07a",
                                    25: "24w09a–24w10a",
                                    26: "24w11a",
                                    27: "24w12a",
                                    28: "24w13a–1.20.5-pre3",
                                    29: "1.20.5-pre4–1.20.6",
                                    30: "24w18a–24w20a",
                                    31: "24w21a–1.21.1",
                                    32: "24w33a",
                                    33: "24w34a–24w35a",
                                    34: "24w36a",
                                    35: "24w37a",
                                    36: "24w38a–24w39a",
                                    37: "24w40a",
                                    38: "1.21.2-pre1–1.21.2-pre2",
                                    39: "1.21.2-pre3–1.21.3",
                                    40: "24w44a",
                                    41: "24w45a",
                                    42: "24w46a",
                                    43: "1.21.4-pre1–1.21.4",
                                    44: "25w02a",
                                    45: "25w03a",
                                    46: "25w04a"
                                };

                                const mcmetaBuffer = await mcmetaEntry.buffer();
                                const mcmetaJson = JSON.parse(mcmetaBuffer.toString("utf8"));
                                const packInfo = mcmetaJson.pack || {};

                                const packFormat = packInfo.pack_format || "Desconocido";
                                const compatibleVersions = versiones[packFormat] || "Desconocido";
                                const packDesc = packInfo.description.slice(0, 20) + "..." || "Sin descripción";

                                const packPngEntry = zip.files.find(
                                    (entry) => entry.path.toLowerCase().endsWith("pack.png")
                                );
                                let packIconBase64 = "https://battlylauncher.com/assets/img/mc-icon.png";
                                if (packPngEntry) {
                                    const iconBuffer = await packPngEntry.buffer();
                                    packIconBase64 = `data:image/png;base64,${iconBuffer.toString("base64")}`;
                                }

                                const isActive = activeResourcePacks.includes(rpFileName);
                                const statusText = isActive ? "Activo" : "Inactivo";
                                const statusClass = isActive ? "tag is-success" : "tag is-warning";

                                const row = document.createElement("tr");
                                row.innerHTML = `
                <td>
                    <img src="${packIconBase64}" style="width: 30px; height: 30px;" alt="pack-icon" />
                </td>
                <td>${packDesc}</td>
                <td>${compatibleVersions}</td>
                <td>
                    <span class="${statusClass}" style="margin-right: 10px;">${statusText}</span>
                    </td>
                    <td>
                    <button class="button is-info is-small is-outlined b-mybattly-b-600 b-mybattly-is-poppins btn-toggle">
                        ${isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button class="button is-danger is-small is-outlined b-mybattly-b-600 b-mybattly-is-poppins btn-delete">
                        Eliminar
                    </button>
                </td>
            `;
                                rpsTable.appendChild(row);

                                const toggleBtn = row.querySelector(".btn-toggle");
                                const deleteBtn = row.querySelector(".btn-delete");

                                toggleBtn.addEventListener("click", () => {

                                    const currentlyActive = activeResourcePacks.includes(rpFileName);
                                    if (currentlyActive) {

                                        activeResourcePacks = activeResourcePacks.filter((rp) => rp !== rpFileName);
                                    } else {

                                        activeResourcePacks.push(rpFileName);
                                    }

                                    let optionsContent = "";
                                    try {
                                        optionsContent = fs.readFileSync(optionsPath, "utf8");
                                    } catch (err) {
                                        console.error("No se pudo leer options.txt para actualizar:", err);
                                        return;
                                    }

                                    const newResourcePacksString = JSON.stringify(activeResourcePacks)
                                        .replace(/^\[/, "")
                                        .replace(/\]$/, "");

                                    const newOptionsContent = optionsContent.replace(
                                        /resourcePacks:\[.*?\]/,
                                        `resourcePacks:[${newResourcePacksString}]`
                                    );

                                    fs.writeFileSync(optionsPath, newOptionsContent, "utf8");

                                    const statusSpan = row.querySelector("span");
                                    if (currentlyActive) {
                                        statusSpan.className = "tag is-warning";
                                        statusSpan.textContent = window.stringLoader.getString("mybattly.inactive");
                                        toggleBtn.textContent = window.stringLoader.getString("mybattly.activate");
                                    } else {
                                        statusSpan.className = "tag is-success";
                                        statusSpan.textContent = window.stringLoader.getString("mybattly.active");
                                        toggleBtn.textContent = window.stringLoader.getString("mybattly.deactivate");
                                    }
                                });

                                deleteBtn.addEventListener("click", async () => {
                                    try {
                                        await modal.ask({
                                            title: lang.are_you_sure,
                                            text: lang.are_you_sure_text,
                                            showCancelButton: true,
                                            confirmButtonText: lang.yes_delete,
                                            cancelButtonText: lang.no_cancel,
                                            confirmButtonColor: "#f14668",
                                            cancelButtonColor: "#3e8ed0",
                                            preConfirm: () => true
                                        });

                                        row.remove();

                                        fs.unlinkSync(rpPath);

                                        if (isActive) {
                                            activeResourcePacks = activeResourcePacks.filter(rp => rp !== rpFileName);

                                            try {
                                                let optionsContent = fs.readFileSync(optionsPath, "utf8");

                                                const newResourcePacksString = JSON.stringify(activeResourcePacks)
                                                    .replace(/^\[/, "")
                                                    .replace(/\]$/, "");

                                                const newOptionsContent = optionsContent.replace(
                                                    /resourcePacks:\[.*?\]/,
                                                    `resourcePacks:[${newResourcePacksString}]`
                                                );

                                                fs.writeFileSync(optionsPath, newOptionsContent, "utf8");
                                            } catch (err) {
                                                console.error("No se pudo actualizar options.txt tras eliminar:", err);
                                            }
                                        }

                                        new Alert().ShowAlert({
                                            icon: "success",
                                            title: window.stringLoader.getString("mybattly.resourcePackDeleted"),
                                        });

                                    } catch (err) {

                                    }
                                });
                            } catch (error) {
                                console.error("Error processing resource pack:", rpPath, error);
                            }
                        }

                        panel.classList.remove("b-mybattly-blur-panel");
                        overlay.style.animation = "disableBlur 0.5s linear forwards";
                        button.classList.remove("is-loading");

                        panel.style.display = "block";
                    }
                }
            });
        });

    }

    async LoadDatas() {
        const fs = require('fs');
        const path = require('path');
        const Swal = require("./assets/js/libs/sweetalert/sweetalert2.all.min");
        const { getValue } = require('./assets/js/utils/storage');

        const mods = await fs.readdirSync(`${dataDirectory}/.battly/mods`);
        const activatedModsCount = mods.filter((mod) => mod.endsWith(".jar")).length;
        const deactivatedModsCount = mods.filter((mod) => mod.endsWith(".disabledmod")).length;
        const totalMods = activatedModsCount + deactivatedModsCount;

        document.getElementById("mybattly-mods-count").innerHTML = totalMods;
        document.getElementById("mybattly-activated-mods-count").innerHTML = activatedModsCount;
        document.getElementById("mybattly-deactivated-mods-count").innerHTML = deactivatedModsCount;

        console.log(`[MyBattly] Activated mods: ${activatedModsCount}`);

        try {

            const worldsList = await fs.readdirSync(`${dataDirectory}/.battly/saves`, { withFileTypes: true });
            const onlyDirs = worldsList.filter((entry) => entry.isDirectory());
            document.getElementById("mybattly-worlds-count").innerHTML = onlyDirs.length;
        } catch (error) {

            document.getElementById("mybattly-worlds-count").innerHTML = 0;
            console.warn("[MyBattly] No se pudo cargar la lista de mundos:", error);
        }

        try {

            const resourcepacksList = await fs.readdirSync(`${dataDirectory}/.battly/resourcepacks`);
            const activeRPs = resourcepacksList.filter((rp) => rp.endsWith(".zip"));
            const disabledRPs = resourcepacksList.filter((rp) => rp.endsWith(".disabledzip"));
            const totalRPs = activeRPs.length + disabledRPs.length;

            document.getElementById("mybattly-resourcepacks-count").innerHTML = totalRPs;
        } catch (error) {

            document.getElementById("mybattly-resourcepacks-count").innerHTML = 0;
            console.warn("[MyBattly] No se pudo cargar la lista de resourcepacks:", error);
        }

        try {
            const backupHistory = await getValue('backupHistory') || [];
            const totalBackups = backupHistory.length;

            if (totalBackups > 0) {
                const lastBackup = backupHistory[0];

                const lastBackupDate = new Date(lastBackup.timestamp);
                const now = new Date();
                const diffTime = Math.abs(now - lastBackupDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                let timeText = '';
                if (diffDays === 0) {
                    if (diffHours === 0) {
                        timeText = 'hace menos de 1 hora';
                    } else if (diffHours === 1) {
                        timeText = 'hace 1 hora';
                    } else {
                        timeText = `hace ${diffHours} horas`;
                    }
                } else if (diffDays === 1) {
                    timeText = 'ayer';
                } else {
                    timeText = `hace ${diffDays} días`;
                }

                const backupStatElement = document.querySelector('.b-mybattly-stat-item:nth-child(2) .b-mybattly-ccc');
                if (backupStatElement) {
                    backupStatElement.innerHTML = `${totalBackups} realizadas`;
                }

                const backupNotification = document.querySelector('.b-mybattly-notification-message p');
                if (backupNotification) {
                    if (diffDays >= 7) {
                        backupNotification.innerHTML = `La última copia de seguridad fue ${timeText}, es recomendable hacer una nueva.`;
                    } else {
                        backupNotification.innerHTML = `La última copia de seguridad fue ${timeText}. Todo está actualizado.`;
                    }
                }
            } else {

                const backupStatElement = document.querySelector('.b-mybattly-stat-item:nth-child(2) .b-mybattly-ccc');
                if (backupStatElement) {
                    backupStatElement.innerHTML = window.stringLoader.getString("mybattly.noBackup");
                }

                const backupNotification = document.querySelector('.b-mybattly-notification-message p');
                if (backupNotification) {
                    backupNotification.innerHTML = window.stringLoader.getString("mybattly.noBackupNotification");
                }
            }
        } catch (error) {
            console.warn("[MyBattly] No se pudo cargar el historial de copias de seguridad:", error);
        }

        let account = await this.database?.getSelectedAccount();

        fetch('https://api.battlylauncher.com/api/v2/users/getUserStats', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${account.token}`,
            }
        }).then(res => res.json()).then(res => {
            if (res.error) {
                console.error(res.error);
                new Alert().ShowAlert({
                    icon: "error",
                    title: window.stringLoader.getString("mybattly.errorLoadingStats")
                });
                return;
            }

            console.log(res);

            const playedHours = Math.floor(res.data.tiempoJugado / 3600);
            const playedMinutes = Math.floor((res.data.tiempoJugado % 3600) / 60);

            document.getElementById("mybattly-stats-hours").innerHTML = window.stringLoader.getString("mybattly.playedTime", { hours: playedHours, minutes: playedMinutes });
        });

        const selectedAccount = await this.database.getSelectedAccount();
        const selectedAccountName = selectedAccount.name || window.stringLoader.getString("mybattly.noAccountSelected");
        document.getElementById("b-mybattly-username").innerHTML = selectedAccountName;

        try {
            const recentWorlds = await getValue('recentWorlds') || [];
            const recentWorldsList = document.querySelector('.b-mybattly-main-panel-recent-worlds ul');

            if (recentWorldsList) {
                recentWorldsList.innerHTML = '';

                if (recentWorlds.length === 0) {
                    recentWorldsList.innerHTML = `<li><p class="b-mybattly-b-500 b-mybattly-ccc">${window.stringLoader.getString("mybattly.noRecentWorlds")}</p></li>`;
                } else {

                    const topWorlds = recentWorlds.slice(0, 3);

                    topWorlds.forEach(world => {
                        const li = document.createElement('li');
                        const worldName = document.createElement('p');
                        worldName.className = 'b-mybattly-b-600 b-mybattly-white';
                        worldName.textContent = world.name;

                        const lastPlayed = document.createElement('p');
                        lastPlayed.className = 'b-mybattly-b-500 b-mybattly-ccc';

                        if (world.lastPlayed > 0) {
                            const now = Date.now();
                            const diffTime = now - world.lastPlayed;
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                            let timeText = '';
                            if (diffDays === 0) {
                                if (diffHours === 0) {
                                    timeText = 'Hace menos de 1 hora';
                                } else if (diffHours === 1) {
                                    timeText = 'Hace 1 hora';
                                } else {
                                    timeText = `Hace ${diffHours} horas`;
                                }
                            } else if (diffDays === 1) {
                                timeText = 'Ayer';
                            } else {
                                const date = new Date(world.lastPlayed);
                                timeText = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            }

                            lastPlayed.textContent = `Última jugada: ${timeText}`;
                        } else {
                            lastPlayed.textContent = window.stringLoader.getString("mybattly.neverPlayed");
                        }

                        li.appendChild(worldName);
                        li.appendChild(lastPlayed);
                        recentWorldsList.appendChild(li);
                    });
                }
            }
        } catch (error) {
            console.warn("[MyBattly] No se pudo cargar los mundos recientes:", error);
        }
    }

    async LoadFriends() {
        document.getElementById("mybattly-btn").addEventListener("click", async () => {
            const notificationsList = document.querySelector(".b-mybattly-notifications-list");
            let account = await this.database?.getSelectedAccount();

            fetch('https://api.battlylauncher.com/api/v2/users/obtenerSolicitudes', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${account.token}`,
                }
            }).then(res => res.json()).then(async res => {
                if (res.error) {
                    console.error(res.error);
                    new Alert().ShowAlert({
                        icon: "error",
                        title: window.stringLoader.getString("mybattly.errorLoadingRequests")
                    });
                    return;
                } else {
                    for (let solicitud of res.recibidas) {
                        const notification = document.createElement("div");
                        notification.classList.add("b-mybattly-notification-message");

                        notification.innerHTML = `
                    <h1><i class="fa-solid fa-user-friends"></i> Solicitud de amistad</h1>
                    <hr class="b-mybattly-hr" />
                    <p>${solicitud} te ha enviado una solicitud de amistad.</p>
                    <div class="b-mybattly-user-profile-last-register-actions">
                        <button
                            class="button is-info is-small is-outlined b-mybattly-b-600 b-mybattly-is-inter btn-dont-change">
                            Aceptar
                        </button>
                        <button
                            class="button is-danger is-small is-outlined b-mybattly-b-600 b-mybattly-is-inter btn-dont-change">
                            Rechazar
                        </button>
                    </div>
                `;

                        const acceptButton = notification.querySelector(".button.is-info");
                        const rejectButton = notification.querySelector(".button.is-danger");

                        acceptButton.addEventListener('click', () => {
                            fetch('https://api.battlylauncher.com/api/v2/users/aceptarSolicitud', {
                                method: 'POST',
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${account.token}`,
                                },
                                body: JSON.stringify({
                                    solicitud: solicitud,
                                })
                            }).then(res => res.json()).then(res => {
                                if (res.error) {
                                    console.error(res.error);

                                    new Alert().ShowAlert({
                                        icon: "error",
                                        title: window.stringLoader.getString("mybattly.errorAcceptingRequest")
                                    });
                                } else {
                                    new Alert().ShowAlert({
                                        icon: "success",
                                        title: window.stringLoader.getString("mybattly.requestAccepted")
                                    });
                                }
                            });

                            notification.remove();
                        });

                        rejectButton.addEventListener('click', () => {
                            fetch('https://api.battlylauncher.com/v2/api/users/rechazarSolicitud', {
                                method: 'POST',
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${account.token}`,
                                },
                                body: JSON.stringify({
                                    amigo: solicitud
                                })
                            }).then(res => res.json()).then(res => {
                                if (res.error) {
                                    console.error(res.error);

                                    new Alert().ShowAlert({
                                        icon: "error",
                                        title: window.stringLoader.getString("mybattly.errorRejectingRequest")
                                    });
                                } else {
                                    new Alert().ShowAlert({
                                        icon: "success",
                                        title: window.stringLoader.getString("mybattly.requestRejected")
                                    });
                                }
                            });

                            new Alert().ShowAlert({
                                icon: "success",
                                title: window.stringLoader.getString("mybattly.requestRejected")
                            });

                            notification.remove();
                        });

                        notificationsList.appendChild(notification);
                    }
                }
            });
        });
    }
}

export default MyBattly;
