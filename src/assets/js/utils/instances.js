'use strict';

import { logger, database, changePanel } from '../utils.js';
import { Alert } from "./alert.js";
import { LoadAPI } from "../utils/loadAPI.js";

const { ipcRenderer, shell } = require('electron');
const { Lang } = require("./assets/js/utils/lang.js");
const { Launch, Mojang } = require("./assets/js/libs/mc/Index");
const pkg = require('../package.json');
const fs = require('fs');
const path = require('path');

import { AskModal } from '../utils/askModal.js';
const modal_ = new AskModal();

const dataDirectory =
    process.env.APPDATA ||
    (process.platform === 'darwin'
        ? `${process.env.HOME}/Library/Application Support`
        : process.env.HOME);

function createEl(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.classes) options.classes.forEach(cls => el.classList.add(cls));
    if (options.attributes) {
        for (const attr in options.attributes) {
            el.setAttribute(attr, options.attributes[attr]);
        }
    }
    if (options.style) {
        for (const key in options.style) {
            el.style[key] = options.style[key];
        }
    }
    if (options.innerHTML) el.innerHTML = options.innerHTML;
    if (options.textContent) el.textContent = options.textContent;
    if (options.eventListeners) {
        options.eventListeners.forEach(({ event, handler }) => {
            el.addEventListener(event, handler);
        });
    }
    return el;
}

async function fetchForgeMetadata() {
    const axios = require("axios");
    const response = await axios.get(
        "https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json"
    );
    return response.data;
}

async function fetchFabricLoaderVersions(gameVersion) {
    const axios = require("axios");
    const response = await axios.get(
        `https://meta.fabricmc.net/v2/versions/loader/${gameVersion}`
    );
    return response.data.map(e => ({
        version: e.loader.version,
        stable: e.loader.stable
    }));
}

async function fetchNeoForgeAllVersions() {
    const axios = require("axios");
    const url = "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge";
    const data = await axios.get(url).then(r => r.data);

    const versions = (data?.versions ?? []).slice().reverse();
    return versions;
}

async function fetchNeoForgeVersionsFor(gameVersion) {
    const all = await fetchNeoForgeAllVersions();

    const m = String(gameVersion).match(/^1\.(\d+)/);
    if (!m) return [];
    const series = `${parseInt(m[1], 10)}.`;

    const filtered = all.filter(v => typeof v === "string" && v.startsWith(series));
    return filtered;
}

async function updateForgeOptions(versionOptions, versionOptionsVersion, langs) {
    versionOptionsVersion.innerHTML = "";
    const loadingOption = createEl("option", {
        innerHTML: langs.loading,
        attributes: { value: "loading" }
    });
    versionOptionsVersion.appendChild(loadingOption);
    const data = await fetchForgeMetadata();
    versionOptionsVersion.innerHTML = "";
    const recommendedOption = createEl("option", {
        innerHTML: langs.recommended,
        attributes: { value: "recommended" }
    });
    for (const versionKey in data) {
        if (versionKey === versionOptions.value.replace("-forge", "")) {
            const build = data[versionKey];
            versionOptionsVersion.appendChild(recommendedOption);
            for (let j = 0; j < build.length - 1; j++) {
                const option = createEl("option", {
                    innerHTML: build[j],
                    attributes: { value: build[j] }
                });
                versionOptionsVersion.appendChild(option);
            }
            if (build.length > 0) {
                const latestOption = createEl("option", {
                    innerHTML: langs.latest,
                    attributes: { value: build[build.length - 1] }
                });
                versionOptionsVersion.appendChild(latestOption);
                versionOptionsVersion.value = build[build.length - 1];
            }
        }
    }
}

async function updateLoaderOptions(versionOptions, versionOptionsVersion, langs) {

    const value = versionOptions.value;
    const isForge = value.endsWith("-forge");
    const isFabric = value.endsWith("-fabric");
    const isQuilt = value.endsWith("-quilt");
    const isNeoForge = value.endsWith("-neoforge");
    const isVanilla = !value.includes("-");

    if (isForge) {
        await updateForgeOptions(versionOptions, versionOptionsVersion, langs);
        return;
    }

    versionOptionsVersion.innerHTML = "";
    const loadingOption = createEl("option", {
        innerHTML: langs.loading,
        attributes: { value: "loading" }
    });
    versionOptionsVersion.appendChild(loadingOption);

    if (isFabric) {
        const gameVersion = value.replace("-fabric", "");
        const loaders = await fetchFabricLoaderVersions(gameVersion);

        versionOptionsVersion.innerHTML = "";

        const stableLoaders = loaders.filter(l => l.stable);
        const unstableLoaders = loaders.filter(l => !l.stable);

        if (stableLoaders.length) {
            const recommended = createEl("option", {
                innerHTML: langs.recommended,
                attributes: { value: stableLoaders[0].version }
            });
            versionOptionsVersion.appendChild(recommended);
        }

        [...stableLoaders, ...unstableLoaders].forEach(l => {
            const opt = createEl("option", {
                innerHTML: l.version,
                attributes: { value: l.version }
            });
            versionOptionsVersion.appendChild(opt);
        });

        const latestOption = createEl("option", {
            innerHTML: langs.latest,
            attributes: { value: "latest" }
        });
        versionOptionsVersion.appendChild(latestOption);
        versionOptionsVersion.value = "latest";
        return;
    }

    if (isNeoForge) {
        const gameVersion = value.replace("-neoforge", "");
        let list = [];
        try {
            list = await fetchNeoForgeVersionsFor(gameVersion);
        } catch (e) {
            console.warn("NeoForge API error:", e);
        }

        versionOptionsVersion.innerHTML = "";

        if (list.length > 0) {

            const latestOption = createEl("option", {
                innerHTML: langs.latest,
                attributes: { value: "latest" }
            });
            versionOptionsVersion.appendChild(latestOption);

            list.forEach(v => {
                versionOptionsVersion.appendChild(
                    createEl("option", { innerHTML: v, attributes: { value: v } })
                );
            });

            versionOptionsVersion.value = "latest";
        } else {

            versionOptionsVersion.appendChild(
                createEl("option", { innerHTML: langs.no_builds ?? "N/A", attributes: { value: "latest" } })
            );
            versionOptionsVersion.value = "latest";
        }
        return;
    }

    versionOptionsVersion.innerHTML = "";
    if (isQuilt) {
        versionOptionsVersion.appendChild(
            createEl("option", { innerHTML: langs.latest, attributes: { value: "latest" } })
        );
        versionOptionsVersion.value = "latest";
        return;
    }
    if (isVanilla) {
        versionOptionsVersion.appendChild(
            createEl("option", {
                innerHTML: langs.no_builds ?? "N/A",
                attributes: { value: "latest" }
            })
        );
        versionOptionsVersion.value = "latest";
        return;
    }

    versionOptionsVersion.appendChild(
        createEl("option", {
            innerHTML: langs.no_builds ?? "N/A",
            attributes: { value: "latest" }
        })
    );
    versionOptionsVersion.value = "latest";
}

function createModalBase({ titleText, zIndex = "3" }) {
    const modal = createEl("div", {
        classes: ["modal", "is-active"],
        style: { zIndex }
    });
    const modalBackground = createEl("div", { classes: ["modal-background"] });
    const modalCard = createEl("div", {
        classes: ["modal-card", "modal-animated", "ten-radius"],
        style: { backgroundColor: "#0f1623" }
    });
    const modalHeader = createEl("header", {
        classes: ["modal-card-head"],
        style: { backgroundColor: "#0f1623", display: "flex", alignItems: "center" }
    });
    const modalTitle = createEl("p", {
        classes: ["modal-card-title"],
        style: { color: "#fff", fontSize: "25px", fontFamily: "Poppins" },
        innerHTML: titleText
    });

    const viewToggleContainer = createEl("div", {
        classes: ["view-toggle"],
        style: { marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }
    });
    const listIcon = createEl("i", {
        classes: ["fas", "fa-list"],
        attributes: { title: "Vista lista" },
        style: { cursor: "pointer", color: "#fff" }
    });
    const gridIcon = createEl("i", {
        classes: ["fas", "fa-th"],
        attributes: { title: "Vista cuadrícula" },
        style: { cursor: "pointer", color: "#fff" }
    });
    viewToggleContainer.append(listIcon, gridIcon);

    const closeBtn = createEl("button", {
        classes: ["delete"],
        attributes: { "aria-label": "close" }
    });
    const headerRow = document.createDocumentFragment();
    headerRow.append(modalTitle, viewToggleContainer, closeBtn);
    modalHeader.appendChild(headerRow);
    modalCard.appendChild(modalHeader);
    modal.append(modalBackground, modalCard);
    closeBtn.addEventListener("click", () => modal.remove());
    return { modal, modalBackground, modalCard, modalHeader, modalTitle, closeBtn, listIcon, gridIcon };
}


class Instances {
    Instancias = async () => {

        const loadAPI = new LoadAPI();
        const BattlyConfig = await loadAPI.GetConfig();
        const Versions = await loadAPI.GetVersions();
        const VersionsMojang = await loadAPI.GetVersionsMojang();
        const database_ = await new database().init();
        const config_ = BattlyConfig;
        const langInstance = new Lang();
        const langs = await langInstance.GetLang();

        this.langs = langs;
        this.Versions = Versions;
        this.VersionsMojang = VersionsMojang;

        const instanciasBtn = document.getElementById("instancias-btn");

        instanciasBtn.addEventListener("click", async () => {

            const { modal, modalCard, modalHeader, closeBtn, listIcon, gridIcon } = createModalBase({
                titleText: `<i class="fa-solid fa-folder"></i> ${langs.instances}`
            });
            modalCard.style.maxHeight = "85%";
            modalCard.style.height = "auto";
            modal.style.zIndex = "2";

            const modalBody = createEl("section", {
                classes: ["modal-card-body"],
                style: { backgroundColor: "#0f1623", color: "#fff" }
            });
            modalBody.appendChild(createEl("p", { innerHTML: langs.welcome_instances }));
            modalBody.appendChild(createEl("br"));

            const instancesContainer = createEl("div", {
                classes: ["instances-container", "list-view"],
                style: { display: "flex", flexDirection: "column", gap: "1rem" }
            });
            modalBody.appendChild(instancesContainer);

            listIcon.addEventListener("click", () => {
                instancesContainer.classList.remove("grid-view");
                instancesContainer.classList.add("list-view");
            });
            gridIcon.addEventListener("click", () => {
                instancesContainer.classList.remove("list-view");
                instancesContainer.classList.add("grid-view");
            });

            modalCard.append(modalHeader, modalBody);

            const instancesPath = path.join(dataDirectory, ".battly", "instances");
            if (!fs.existsSync(instancesPath)) fs.mkdirSync(instancesPath, { recursive: true });
            const instancias = fs.readdirSync(instancesPath);
            let openedInstance = null;

            const createInstanceCard = (instanceDir, index) => {
                try {
                    const instancePath = path.join(instancesPath, instanceDir, "instance.json");
                    const instanceData = JSON.parse(fs.readFileSync(instancePath));

                    const card = createEl("div", {
                        classes: ["card", "ten-radius", `card-instance${index}`],
                        style: { marginBottom: "-5px", backgroundColor: "rgb(22, 29, 43)" }
                    });
                    const cardHeader = createEl("header", {
                        classes: ["card-header"],
                        style: { color: "#fff", cursor: "pointer" }
                    });
                    const cardTitle = createEl("p", {
                        classes: ["card-header-title"],
                        style: { color: "#fff" }
                    });
                    const cardTitleSpan = createEl("span", { textContent: instanceData.name });
                    const cardTitleEdit = createEl("span", {
                        innerHTML: `<i class="fa-solid fa-edit"></i>`,
                        style: { cursor: "pointer", marginLeft: "10px" }
                    });
                    cardTitleEdit.addEventListener("mouseover", () => { cardTitleEdit.style.opacity = "0.7"; });
                    cardTitleEdit.addEventListener("mouseout", () => { cardTitleEdit.style.opacity = "1"; });
                    cardTitle.append(cardTitleSpan, cardTitleEdit);

                    const cardIcon = createEl("button", {
                        classes: ["card-header-icon"],
                        attributes: { "aria-label": "more options" }
                    });
                    const iconSpan = createEl("span", { classes: ["icon"] });
                    const iconImage = createEl("i", { classes: ["fas", "fa-angle-down"] });
                    iconSpan.appendChild(iconImage);
                    cardIcon.appendChild(iconSpan);
                    cardHeader.append(cardTitle, cardIcon);

                    const cardContent = createEl("div", {
                        classes: ["card-content"],
                        attributes: { id: "content" },
                        style: { display: "none" }
                    });
                    const cardImage = createEl("figure", { classes: ["image", "is-32x32"] });
                    const imgEl = createEl("img", { attributes: { src: instanceData.image }, style: { borderRadius: "5px" } });
                    cardImage.appendChild(imgEl);
                    const cardDescription = createEl("div", {
                        classes: ["content"],
                        style: { marginLeft: "10px", color: "#fff", fontFamily: "Poppins", fontWeight: "700" },
                        textContent: instanceData.description
                    });
                    cardContent.append(cardImage, cardDescription);

                    const cardFooter = createEl("footer", {
                        classes: ["card-footer"],
                        attributes: { id: "footer" },
                        style: { display: "none" }
                    });

                    const openButton = createEl("button", {
                        classes: ["card-footer-item", "button", "is-info", "ten-radius", "is-outlined", "has-icon-separator-5px"],
                        style: { margin: "5px" }
                    });
                    const openIcon = createEl("i", { classes: ["fa-solid", "fa-square-up-right"] });
                    const openText = createEl("span", { textContent: this.langs.open_instance, classes: ["btn-text"] });
                    openButton.append(openIcon, openText);

                    const openFolderButton = createEl("button", {
                        classes: ["card-footer-item", "button", "is-warning", "ten-radius", "is-outlined", "has-icon-separator-5px"],
                        style: { margin: "5px" }
                    });
                    const folderIcon = createEl("i", { classes: ["fa-solid", "fa-folder-open"] });
                    const folderText = createEl("span", { textContent: this.langs.open_instance_folder, classes: ["btn-text"] });
                    openFolderButton.append(folderIcon, folderText);

                    const deleteButton = createEl("button", {
                        classes: ["card-footer-item", "button", "is-danger", "ten-radius", "is-outlined", "has-icon-separator-5px"],
                        style: { margin: "5px" }
                    });
                    const deleteIcon = createEl("i", { classes: ["fa-solid", "fa-trash"] });
                    const deleteText = createEl("span", { textContent: this.langs.delete_instance, classes: ["btn-text"] });
                    deleteButton.append(deleteIcon, deleteText);

                    cardFooter.append(openButton, openFolderButton, deleteButton);
                    card.append(cardHeader, cardContent, cardFooter);
                    instancesContainer.appendChild(card);

                    cardHeader.addEventListener("click", () => {
                        if (cardContent.style.display === "none") {
                            if (openedInstance !== null && openedInstance !== index) {
                                const prevCard = document.querySelector(`.card-instance${openedInstance}`);
                                if (prevCard) {
                                    const prevContent = prevCard.querySelector(".card-content");
                                    const prevFooter = prevCard.querySelector(".card-footer");
                                    const prevIcon = prevCard.querySelector("i");
                                    if (prevContent && prevFooter && prevIcon) {
                                        prevContent.style.display = "none";
                                        prevFooter.style.display = "none";
                                        prevIcon.classList.remove("fa-angle-up");
                                        prevIcon.classList.add("fa-angle-down");
                                    }
                                }
                            }
                            openedInstance = index;
                            cardContent.style.display = "flex";
                            cardFooter.style.display = "flex";
                            iconImage.classList.remove("fa-angle-down");
                            iconImage.classList.add("fa-angle-up");
                        } else {
                            cardContent.style.display = "none";
                            cardFooter.style.display = "none";
                            iconImage.classList.remove("fa-angle-up");
                            iconImage.classList.add("fa-angle-down");
                            openedInstance = null;
                        }
                    });

                    cardTitleEdit.addEventListener("click", () => {
                        this.showEditInstanceModal(instanceData, instanceDir, cardTitleSpan, imgEl, cardDescription);
                    });

                    openFolderButton.addEventListener("click", () => {
                        const instanceFolder = path.join(instancesPath, instanceDir);
                        shell.openPath(instanceFolder.replace(/\//g, "\\")).then(() => {
                            new Alert().ShowAlert({ icon: "success", title: this.langs.folder_opened });
                        });
                    });

                    deleteButton.addEventListener("click", async () => {
                        try {
                            await modal_.ask({
                                title: this.langs.are_you_sure,
                                text: this.langs.are_you_sure_text,
                                showCancelButton: true,
                                confirmButtonText: this.langs.yes_delete,
                                cancelButtonText: this.langs.no_cancel,
                                confirmButtonColor: "#3e8ed0",
                                cancelButtonColor: "#d33",
                                preConfirm: () => true
                            });

                            card.remove();
                            if (card.nextSibling && card.nextSibling.tagName === "BR") card.nextSibling.remove();
                            fs.rmdirSync(path.join(instancesPath, instanceDir), { recursive: true });

                            new Alert().ShowAlert({ icon: "success", title: this.langs.instance_deleted_correctly });
                        } catch (_) { /* cancel */ }
                    });

                    // Asegurar estructura
                    [
                        path.join(instancesPath, instanceDir, "battly"),
                        path.join(instancesPath, instanceDir, "battly", "mods-internos"),
                        path.join(instancesPath, instanceDir, "battly", "launcher"),
                        path.join(instancesPath, instanceDir, "battly", "launcher", "config-launcher"),
                        path.join(instancesPath, instanceDir, "battly", "launcher", "forge"),
                        path.join(instancesPath, instanceDir, "battly", "launcher", "mc-assets")
                    ].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

                    // Lanzar instancia
                    openButton.addEventListener("click", async () => {
                        let loader =
                            instanceData.version.endsWith("-forge") ? "forge" :
                                instanceData.version.endsWith("-fabric") ? "fabric" :
                                    instanceData.version.endsWith("-quilt") ? "quilt" :
                                        instanceData.version.endsWith("-neoforge") ? "neoforge" :
                                            null;

                        let version = instanceData.version;
                        const loader_json = instanceData.loader;
                        let loaderVersion = instanceData.loaderVersion;

                        if (/(?:-forge|-fabric|-quilt|-neoforge)$/.test(instanceData.version)) {
                            version = instanceData.version.replace(/-(forge|fabric|quilt|neoforge)$/, "");
                        }

                        if (
                            instanceData.version.endsWith("-forge") &&
                            loaderVersion &&
                            !loaderVersion.includes(version)
                        ) {
                            loaderVersion = `${version}-${loaderVersion}`;
                        }

                        // Cuenta y ajustes
                        let account = await database_?.getSelectedAccount();
                        const ram = (await database_.get("1234", "ram")).value;
                        const Resolution = (await database_.get("1234", "screen")).value;
                        const launcherSettings = (await database_.get("1234", "launcher")).value;
                        const urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;

                        const launchOpts = {
                            url: (config_.game_url === "" || config_.game_url === undefined) ? `${urlpkg}/files` : config_.game_url,
                            beforeLaunch: BattlyConfig.beforeLaunch,
                            authenticator: account,
                            detached: true,
                            timeout: 10000,
                            path: path.join(instancesPath, instanceDir),
                            downloadFileMultiple: 100,
                            version: version,
                            loader: {
                                type: loader_json ? loader_json : loader,
                                build: loaderVersion ? loaderVersion : "latest",
                                enable: true,
                            },
                            verify: false,
                            java: false,
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
                        };

                        const launch = new Launch();
                        launch.Launch(launchOpts);

                        // Modal de preparación
                        this.showPreparingModal(launch, account, version, loader_json ? loader_json : loader, launcherSettings, langs);
                    });
                } catch (error) {
                    console.log("❌ No se ha podido leer el archivo instance.json", error);
                }
            };
            instancias.forEach((instanceDir, index) => {
                createInstanceCard(instanceDir, index);
            });

            const createCard = createEl("div", { classes: ["card", "ten-radius"], style: { cursor: "pointer", width: "100%" } });
            const createCardHeader = createEl("header", { classes: ["card-header"] });
            const createCardTitle = createEl("p", { classes: ["card-header-title"], textContent: langs.create_instance });
            const createCardIcon = createEl("button", { classes: ["card-header-icon"], attributes: { "aria-label": "more options" } });
            const createIconSpan = createEl("span", { classes: ["icon"] });
            const createIconImage = createEl("i", { classes: ["fas", "fa-plus"] });
            createIconSpan.appendChild(createIconImage);
            createCardIcon.appendChild(createIconSpan);
            createCardHeader.append(createCardTitle, createCardIcon);
            createCard.appendChild(createCardHeader);

            const modalFooter = createEl("footer", { classes: ["modal-card-foot"], style: { backgroundColor: "#0f1623" } });
            modalFooter.appendChild(createCard);
            modalCard.append(modalHeader, modalBody, modalFooter);
            document.body.appendChild(modal);

            closeBtn.addEventListener("click", () => modal.remove());

            createCard.addEventListener("click", () => {
                this.showCreateInstanceModal(Versions, this.VersionsMojang, langs, instancesPath);
            });
        });
    }

    showEditInstanceModal(instanceData, instanceDir, cardTitleSpan, imgEl, cardDescription) {
        const { modal } = createModalBase({ titleText: this.langs.edit_instance });
        const modalCard = modal.querySelector(".modal-card");

        const modalCardBody = createEl("section", {
            classes: ["modal-card-body"],
            style: { backgroundColor: "#0f1623" }
        });

        const nameLabel = createEl("p", { style: { color: "#fff" }, textContent: this.langs.instance_name });
        const nameInput = createEl("input", {
            classes: ["input", "is-info"],
            attributes: { type: "text" },
            style: { fontFamily: "Poppins", fontWeight: "500", fontSize: "12px" }
        });
        nameInput.value = instanceData.name;

        const descriptionLabel = createEl("p", { style: { color: "#fff" }, textContent: this.langs.instance_description });
        const descriptionTextarea = createEl("textarea", {
            classes: ["textarea", "is-info"],
            style: { fontFamily: "Poppins", height: "20px", fontWeight: "500", fontSize: "12px" }
        });
        descriptionTextarea.value = instanceData.description;

        const imageLabel = createEl("p", { style: { color: "#fff" }, textContent: this.langs.instance_image });
        const imageContainer = createEl("div", { style: { display: "flex" } });
        const imageFigure = createEl("figure", { classes: ["image", "is-64x64"], style: { marginRight: "10px" } });
        const image = createEl("img", { attributes: { src: instanceData.image }, style: { borderRadius: "5px" } });
        imageFigure.appendChild(image);
        const fileContainer = createEl("div", { classes: ["file", "is-info", "is-boxed"], style: { height: "65px" } });
        const fileLabel = createEl("label", { classes: ["file-label"] });
        const fileInput = createEl("input", { classes: ["file-input"], attributes: { type: "file", name: "resume" } });
        const fileCta = createEl("span", { classes: ["file-cta"] });
        const fileIcon = createEl("span", { classes: ["file-icon"] });
        const uploadIcon = createEl("i", { classes: ["fas", "fa-cloud-upload-alt"] });
        fileIcon.appendChild(uploadIcon);
        const fileLabelText = createEl("span", { style: { fontSize: "10px" }, textContent: this.langs.select_a_file });
        fileCta.append(fileIcon, fileLabelText);
        fileLabel.append(fileInput, fileCta);
        fileContainer.appendChild(fileLabel);
        imageContainer.append(imageFigure, fileContainer);

        const versionLabel = createEl("p", { style: { color: "#fff" }, textContent: this.langs.instance_version });

        const adv = `
      <article class="message is-danger" style="margin-bottom: 10px;">
        <div class="message-body" style="padding: 0.5rem 0.8rem">
          <p style="font-size: 13px;">${this.langs.instance_version2}</p>
        </div>
      </article>
    `;
        const advElement = createEl("div", { innerHTML: adv });

        const versionSelectContainer = createEl("div", { classes: ["select", "is-info"] });
        const versionOptions = createEl("select");
        versionSelectContainer.appendChild(versionOptions);

        const versionVersionSelectContainer = createEl("div", { classes: ["select", "is-info"], style: { marginLeft: "5px" } });
        const versionOptionsVersion = createEl("select");
        versionVersionSelectContainer.appendChild(versionOptionsVersion);

        modalCardBody.append(
            nameLabel, nameInput, createEl("br"), createEl("br"),
            descriptionLabel, descriptionTextarea, createEl("br"),
            imageLabel, imageContainer, createEl("br"),
            versionLabel, advElement, versionSelectContainer, versionVersionSelectContainer
        );

        const modalCardFoot = createEl("footer", { classes: ["modal-card-foot"], style: { backgroundColor: "#0f1623" } });
        const saveButton = createEl("button", {
            classes: ["button", "is-info", "is-responsive"],
            style: { fontSize: "12px", fontFamily: "Poppins", color: "#fff", marginLeft: "0px" },
            textContent: this.langs.save_instance
        });
        modalCardFoot.appendChild(saveButton);
        modal.querySelector(".modal-card").append(modalCardBody, modalCardFoot);
        document.body.appendChild(modal);

        for (let i = 0; i < this.Versions.versions.length; i++) {
            const ver = this.Versions.versions[i];
            if (
                ver.version.endsWith("-forge") ||
                ver.version.endsWith("-fabric") ||
                ver.version.endsWith("-quilt") ||
                ver.version.endsWith("-neoforge")
            ) {
                const option = createEl("option", { attributes: { value: ver.version }, innerHTML: ver.name });
                versionOptions.appendChild(option);
            }
        }

        if (this.VersionsMojang?.versions?.length) {
            this.VersionsMojang.versions
                .filter(v => v.type === "release")
                .forEach(v => {
                    const option = createEl("option", {
                        attributes: { value: v.id },

                        innerHTML: `${v.id} - Vanilla`
                    });
                    versionOptions.appendChild(option);
                });
        }

        const hasSuffix = /-(forge|fabric|quilt|neoforge)$/.test(instanceData.version);
        versionOptions.value = hasSuffix
            ? instanceData.version
            : (instanceData.loader
                ? `${instanceData.version}-${instanceData.loader}`
                : instanceData.version);

        setTimeout(async () => {
            await updateLoaderOptions(versionOptions, versionOptionsVersion, this.langs);
            if (instanceData.loaderVersion) {
                versionOptionsVersion.value = instanceData.loaderVersion;
            }
        }, 500);

        versionSelectContainer.addEventListener("change", async () => {
            await updateLoaderOptions(versionOptions, versionOptionsVersion, this.langs);
        });

        fileInput.addEventListener("change", () => {
            const files = fileInput.files;
            if (files && files.length > 0) {
                const reader = new FileReader();
                reader.onload = (e) => { image.src = e.target.result; };
                reader.readAsDataURL(files[0]);
            }
        });

        saveButton.addEventListener("click", () => {
            const name = nameInput.value;
            const description = descriptionTextarea.value;
            const versionSel = versionOptions.value;
            const loaderVersion = versionOptionsVersion.value;
            const imagen = fileInput.files && fileInput.files[0] ? fileInput.files[0].path : instanceData.image;

            if (name && description && versionSel) {
                const isLoader = /-(forge|fabric|quilt|neoforge)$/.test(versionSel);
                const pureVersion = isLoader ? versionSel.replace(/-(forge|fabric|quilt|neoforge)$/, "") : versionSel;
                const loaderType = isLoader ? versionSel.split("-").pop() : null;

                const newInstanceData = {
                    name,
                    description,
                    id: instanceData.id,
                    image: imagen,
                    version: isLoader ? versionSel : pureVersion,
                    loader: loaderType,
                    loaderVersion: loaderVersion ? loaderVersion : "latest",
                };
                fs.writeFileSync(
                    path.join(dataDirectory, ".battly", "instances", instanceData.id, "instance.json"),
                    JSON.stringify(newInstanceData)
                );
                modal.remove();
                cardTitleSpan.textContent = name;
                imgEl.src = imagen;
                cardDescription.textContent = description;
                new Alert().ShowAlert({ icon: "success", title: this.langs.instance_saved_correctly });
            } else {
                new Alert().ShowAlert({ icon: "error", title: this.langs.fill_all_fields });
            }
        });
    }

    showCreateInstanceModal(Versions, VersionsMojang, langs, instancesPath) {
        const { modal } = createModalBase({ titleText: langs.create_instance });
        const modalCard = modal.querySelector(".modal-card");

        const modalCardBody = createEl("section", {
            classes: ["modal-card-body"],
            style: { backgroundColor: "#0f1623" }
        });

        const nameLabel = createEl("p", { style: { color: "#fff" }, textContent: langs.instance_name });
        const nameInput = createEl("input", {
            classes: ["input", "is-info"],
            attributes: { type: "text", placeholder: langs.name },
            style: { fontFamily: "Poppins", fontWeight: "500", fontSize: "12px" }
        });

        const descriptionLabel = createEl("p", { style: { color: "#fff" }, textContent: langs.instance_description });
        const descriptionTextarea = createEl("textarea", {
            classes: ["textarea", "is-info"],
            attributes: { name: "about", placeholder: langs.description },
            style: { fontFamily: "Poppins", height: "20px", fontWeight: "500", fontSize: "12px" }
        });

        const imageLabel = createEl("p", { style: { color: "#fff" }, textContent: langs.instance_image });
        const imageContainer = createEl("div", { style: { display: "flex" } });
        const imageFigure = createEl("figure", { classes: ["image", "is-64x64"], style: { marginRight: "10px" } });
        const image = createEl("img", { attributes: { src: "./assets/images/icons/minecraft.png" }, style: { borderRadius: "5px" } });
        imageFigure.appendChild(image);
        const fileContainer = createEl("div", { classes: ["file", "is-info", "is-boxed"], style: { height: "65px" } });
        const fileLabel = createEl("label", { classes: ["file-label"] });
        const fileInput = createEl("input", { classes: ["file-input"], attributes: { type: "file", name: "resume" } });
        const fileCta = createEl("span", { classes: ["file-cta"] });
        const fileIcon = createEl("span", { classes: ["file-icon"] });
        const uploadIcon = createEl("i", { classes: ["fas", "fa-cloud-upload-alt"] });
        fileIcon.appendChild(uploadIcon);
        const fileLabelText = createEl("span", { style: { fontSize: "10px" }, textContent: langs.select_a_file });
        fileCta.append(fileIcon, fileLabelText);
        fileLabel.append(fileInput, fileCta);
        fileContainer.appendChild(fileLabel);
        imageContainer.append(imageFigure, fileContainer);

        const versionLabel = createEl("p", { style: { color: "#fff" }, textContent: langs.instance_version });
        const versionSelectContainer = createEl("div", { classes: ["select", "is-info"] });
        const versionOptions = createEl("select");
        versionSelectContainer.appendChild(versionOptions);

        const versionVersionSelectContainer = createEl("div", { classes: ["select", "is-info"], style: { marginLeft: "5px" } });
        const versionOptionsVersion = createEl("select");
        versionVersionSelectContainer.appendChild(versionOptionsVersion);

        modalCardBody.append(
            nameLabel, nameInput, createEl("br"), createEl("br"),
            descriptionLabel, descriptionTextarea, createEl("br"),
            imageLabel, imageContainer, createEl("br"),
            versionLabel, versionSelectContainer, versionVersionSelectContainer
        );

        const modalCardFoot = createEl("footer", { classes: ["modal-card-foot"], style: { backgroundColor: "#0f1623" } });
        const createButton = createEl("button", {
            classes: ["button", "is-info", "is-responsive"],
            style: { fontSize: "12px", fontFamily: "Poppins", color: "#fff", marginLeft: "0px" },
            textContent: langs.create_instance
        });
        modalCardFoot.appendChild(createButton);
        modalCard.append(modalCardBody, modalCardFoot);
        document.body.appendChild(modal);

        for (let i = 0; i < Versions.versions.length; i++) {
            const ver = Versions.versions[i];
            if (
                ver.version.endsWith("-forge") ||
                ver.version.endsWith("-fabric") ||
                ver.version.endsWith("-quilt") ||
                ver.version.endsWith("-neoforge")
            ) {
                const option = createEl("option", { attributes: { value: ver.version }, innerHTML: ver.name });
                versionOptions.appendChild(option);
            }
        }
        if (VersionsMojang?.versions?.length) {
            VersionsMojang.versions
                .filter(v => v.type === "release")
                .forEach(v => {
                    const option = createEl("option", { attributes: { value: v.id }, innerHTML: `${v.id} - Vanilla` });
                    versionOptions.appendChild(option);
                });
        }

        setTimeout(async () => {
            await updateLoaderOptions(versionOptions, versionOptionsVersion, langs);
        }, 500);

        versionSelectContainer.addEventListener("change", async () => {
            await updateLoaderOptions(versionOptions, versionOptionsVersion, langs);
        });

        fileInput.addEventListener("change", () => {
            const files = fileInput.files;
            if (files && files.length > 0) {
                const reader = new FileReader();
                reader.onload = (e) => { image.src = e.target.result; };
                reader.readAsDataURL(files[0]);
            }
        });

        createButton.addEventListener("click", () => {
            const name = nameInput.value;
            const description = descriptionTextarea.value;
            const versionSel = versionOptions.value;
            const loaderVersion = versionOptionsVersion.value;

            if (name && description && versionSel) {
                let randomString = Math.random().toString(36).substring(2, 8);
                const instanceDir = path.join(instancesPath, randomString);
                if (!fs.existsSync(instancesPath)) fs.mkdirSync(instancesPath);
                if (!fs.existsSync(instanceDir)) fs.mkdirSync(instanceDir);
                else {
                    randomString = Math.random().toString(36).substring(2, 8);
                    fs.mkdirSync(path.join(instancesPath, randomString));
                }
                let imagenPath;
                if (fileInput.files && fileInput.files.length > 0) {
                    imagenPath = path.join(instancesPath, randomString, "icon.png");
                    fs.copyFileSync(fileInput.files[0].path, imagenPath);
                } else {
                    const defaultImage = "/assets/images/icons/minecraft.png";
                    const buffer = fs.readFileSync(path.join(__dirname, defaultImage));
                    imagenPath = path.join(instancesPath, randomString, "icon.png");
                    fs.writeFileSync(imagenPath, buffer);
                }

                const isLoader = /-(forge|fabric|quilt|neoforge)$/.test(versionSel);
                const pureVersion = isLoader ? versionSel.replace(/-(forge|fabric|quilt|neoforge)$/, "") : versionSel;
                const loaderType = isLoader ? versionSel.split("-").pop() : null;

                const instance = {
                    id: randomString,
                    image: imagenPath,
                    name: name,
                    description: description,
                    loader: loaderType,

                    loaderVersion: loaderVersion,
                    version: pureVersion + (loaderType ? `-${loaderType}` : ""),
                };
                fs.writeFileSync(path.join(instancesPath, randomString, "instance.json"), JSON.stringify(instance));
                modal.remove();
                new Alert().ShowAlert({ icon: "success", title: langs.instance_created_correctly });
            } else {
                new Alert().ShowAlert({ icon: "error", title: langs.fill_all_fields });
            }
        });
    }

    showPreparingModal(launch, account, version, loaderType, launcherSettings, langs) {
        const preparingModal = createEl("div", { classes: ["modal", "is-active"], style: { zIndex: "4" } });
        const preparingModalBackground = createEl("div", { classes: ["modal-background"] });
        const preparingModalCard = createEl("div", { classes: ["modal-card", "modal-animated"], style: { backgroundColor: "#0f1623" } });
        const preparingModalCardHead = createEl("header", { classes: ["modal-card-head"], style: { backgroundColor: "#0f1623" } });
        const preparingModalCardTitle = createEl("p", { classes: ["modal-card-title"], style: { color: "#fff" } });
        const preparingIcon = createEl("i", { classes: ["fa-solid", "fa-spinner", "fa-spin-pulse", "fa-sm"], style: { color: "#fff", marginRight: "5px", verticalAlign: "middle" } });
        preparingModalCardTitle.appendChild(preparingIcon);
        preparingModalCardTitle.appendChild(document.createTextNode(langs.preparing_instance));
        preparingModalCardHead.appendChild(preparingModalCardTitle);
        const preparingModalCardBody = createEl("section", { classes: ["modal-card-body"], style: { backgroundColor: "#0f1623", color: "#fff" } });
        const preparingMessage = createEl("p", { textContent: langs.preparing_instance });
        const progress = createEl("progress", { classes: ["progress", "is-info"], attributes: { max: "100" } });
        preparingModalCardBody.append(preparingMessage, document.createElement("br"));

        const card1 = createEl("div", { classes: ["card"] });
        const cardHeader1 = createEl("header", { classes: ["card-header"] });
        const cardHeaderTitle1 = createEl("p", { classes: ["card-header-title"], textContent: langs.downloading_version });
        const cardHeaderIcon1 = createEl("button", { classes: ["card-header-icon"], attributes: { "aria-label": "more options" } });
        const iconSpan1 = createEl("span", { classes: ["icon"] });
        const icon1 = createEl("i", { classes: ["fas", "fa-angle-down"], attributes: { "aria-hidden": "true" } });
        iconSpan1.appendChild(icon1);
        cardHeaderIcon1.appendChild(iconSpan1);
        cardHeader1.append(cardHeaderTitle1, cardHeaderIcon1);
        const cardContent1 = createEl("div", { classes: ["card-content"], attributes: { id: "content" }, style: { display: "none" } });
        const content1 = createEl("div", { classes: ["content"], textContent: `🔄 ${langs.downloading_version}` });
        content1.style.fontFamily = "Poppins";
        content1.style.fontWeight = "700";
        cardContent1.appendChild(content1);
        card1.append(cardHeader1, cardContent1);
        preparingModalCardBody.append(card1, createEl("br"));

        const card2 = createEl("div", { classes: ["card"] });
        const cardHeader2 = createEl("header", { classes: ["card-header"] });
        const cardHeaderTitle2 = createEl("p", { classes: ["card-header-title"], textContent: langs.downloading_loader });
        const cardHeaderIcon2 = createEl("button", { classes: ["card-header-icon"], attributes: { "aria-label": "more options" } });
        const iconSpan2 = createEl("span", { classes: ["icon"] });
        const icon2 = createEl("i", { classes: ["fas", "fa-angle-down"], attributes: { "aria-hidden": "true" } });
        iconSpan2.appendChild(icon2);
        cardHeaderIcon2.appendChild(iconSpan2);
        cardHeader2.append(cardHeaderTitle2, cardHeaderIcon2);
        const cardContent2 = createEl("div", { classes: ["card-content"], attributes: { id: "content" }, style: { display: "none" } });
        const content2 = createEl("div", { classes: ["content"], textContent: `🔄 ${langs.installing_loader}` });
        content2.style.fontFamily = "Poppins";
        content2.style.fontWeight = "700";
        cardContent2.appendChild(content2);
        card2.append(cardHeader2, cardContent2);

        const card3 = createEl("div", { classes: ["card"] });
        const cardHeader3 = createEl("header", { classes: ["card-header"] });
        const cardHeaderTitle3 = createEl("p", { classes: ["card-header-title"], textContent: langs.downloading_java });
        const cardHeaderIcon3 = createEl("button", { classes: ["card-header-icon"], attributes: { "aria-label": "more options" } });
        const iconSpan3 = createEl("span", { classes: ["icon"] });
        const icon3 = createEl("i", { classes: ["fas", "fa-angle-down"], attributes: { "aria-hidden": "true" } });
        iconSpan3.appendChild(icon3);
        cardHeaderIcon3.appendChild(iconSpan3);
        cardHeader3.append(cardHeaderTitle3, cardHeaderIcon3);
        const cardContent3 = createEl("div", { classes: ["card-content"], attributes: { id: "content" }, style: { display: "none" } });
        const content3 = createEl("div", { classes: ["content"], textContent: `🔄 ${langs.installing_java}` });
        content3.style.fontFamily = "Poppins";
        content3.style.fontWeight = "700";
        cardContent3.appendChild(content3);
        card3.append(cardHeader3, cardContent3);
        preparingModalCardBody.append(card3, createEl("br"), card2);

        const preparingModalCardFoot = createEl("footer", { classes: ["modal-card-foot"], style: { backgroundColor: "#0f1623" } });
        preparingModalCard.append(preparingModalCardHead, preparingModalCardBody, preparingModalCardFoot);
        preparingModal.append(preparingModalBackground, preparingModalCard);
        document.body.appendChild(preparingModal);

        launch.on("extract", () => { new logger("Extract", "#00d1b2"); });

        let assetsShown = false, javaShown = false, librariesShown = false;
        let content1Text = document.createTextNode(`🔄 ${langs.checking_assets}`);
        let content3Text = document.createTextNode(`🔄 ${langs.checking_java}`);
        let content2Text = document.createTextNode(`🔄 ${langs.checking_instance} ${loaderType}...`);

        launch.on("progress", (progress, size, element) => {
            if (element === "Assets") {
                if (!assetsShown) {
                    content1.appendChild(document.createElement("br"));
                    content1.appendChild(content1Text);
                    cardContent1.style.display = "block";
                    cardContent2.style.display = "none";
                    cardContent3.style.display = "none";
                    assetsShown = true;
                }
                content1Text.textContent = `🔄 ${langs.downloading_assets}... (${Math.round((progress / size) * 100)}%)`;
            } else if (element === "Java") {
                if (!javaShown) {
                    content3.appendChild(document.createElement("br"));
                    content3.appendChild(content3Text);
                    cardContent1.style.display = "none";
                    cardContent2.style.display = "none";
                    cardContent3.style.display = "block";
                    javaShown = true;
                }
                content3Text.textContent = `🔄 ${langs.downloading_java}... (${Math.round((progress / size) * 100)}%)`;
            } else if (element === "libraries") {
                if (!librariesShown) {
                    content2.appendChild(document.createElement("br"));
                    content2.appendChild(content2Text);
                    cardContent1.style.display = "none";
                    cardContent2.style.display = "block";
                    cardContent3.style.display = "none";
                    librariesShown = true;
                }
                content2Text.textContent = `🔄 ${langs.downloading} ${loaderType}... (${Math.round((progress / size) * 100)}%)`;
            }
        });

        let assetsShownCheck = false, javaShownCheck = false, librariesShownCheck = false;
        launch.on("check", (progress, size, element) => {
            if (element === "assets") {
                if (!assetsShownCheck) {
                    content1.appendChild(document.createElement("br"));
                    content1.appendChild(content1Text);
                    cardContent1.style.display = "block";
                    cardContent2.style.display = "none";
                    cardContent3.style.display = "none";
                    assetsShownCheck = true;
                }
                content1Text.textContent = `🔄 ${langs.checking_assets}... (${Math.round((progress / size) * 100)}%)`;
            } else if (element === "java") {
                if (!javaShownCheck) {
                    content3.appendChild(document.createElement("br"));
                    content3.appendChild(content3Text);
                    cardContent1.style.display = "none";
                    cardContent2.style.display = "none";
                    cardContent3.style.display = "block";
                    javaShownCheck = true;
                }
                content3Text.textContent = `🔄 ${langs.checking_java}... (${Math.round((progress / size) * 100)}%)`;
            } else if (element === "libraries") {
                if (!librariesShownCheck) {
                    content2.appendChild(document.createElement("br"));
                    content2.appendChild(content2Text);
                    cardContent1.style.display = "none";
                    cardContent2.style.display = "block";
                    cardContent3.style.display = "none";
                    librariesShownCheck = true;
                }
                content2Text.textContent = `🔄 ${langs.checking_instance} ${loaderType}... (${Math.round((progress / size) * 100)}%)`;
            }
        });

        launch.on("speed", (speed) => {
            preparingMessage.textContent = `${langs.downloading_instance} (${(speed / 1067008).toFixed(2)} MB/s)`;
        });

        launch.on("patch", () => { new logger("Patch", "#00d1b2"); });

        let inicio = false;
        launch.on("data", (e) => {
            if (!inicio) {
                if (e.includes("Launching wrapped minecraft") || e.includes("Setting user: ")) {
                    preparingModal.remove();
                    const typeOfVersion =
                        loaderType === "forge" ? "Forge" :
                            loaderType === "fabric" ? "Fabric" :
                                loaderType === "quilt" ? "Quilt" :
                                    loaderType === "neoforge" ? "NeoForge" :
                                        "";
                    ipcRenderer.send("new-status-discord-jugando", `${langs.playing_in} ${version} ${typeOfVersion}`);
                    this.UpdateStatus(account.name, "ausente", `${langs.playing_in} ${version} ${typeOfVersion}`);
                    ipcRenderer.send("new-notification", {
                        title: langs.minecraft_started_correctly,
                        body: langs.minecraft_started_correctly_body,
                    });
                    ipcRenderer.send("main-window-progress-reset");
                    inicio = true;
                    if (launcherSettings.launcher.close === "close-launcher") ipcRenderer.send("main-window-hide");
                }
            }
        });

        launch.on("close", (code) => {
            if (launcherSettings.launcher.close === "close-launcher") ipcRenderer.send("main-window-show");
            ipcRenderer.send("updateStatus", {
                status: "online",
                details: langs.in_the_menu,
                username: account.name,
            });
            console.info(`MineCraft cerrado con el código ${code}`);
            preparingModal.remove();
        });

        launch.on("error", (err) => {
            new logger("[Error]", "#ff3860");
            console.log(err);
        });
    }

    UpdateStatus(username, status, details) {
        console.log(`UpdateStatus: ${username} - ${status} - ${details}`);
    }
}

export { Instances };

