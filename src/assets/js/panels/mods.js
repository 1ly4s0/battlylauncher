'use strict';

import {
    database,
    changePanel,
    addAccount,
    accountSelect
} from '../utils.js';

const { ipcRenderer } = require('electron');
const axios = require('axios');
const dataDirectory = process.env.APPDATA || (process.platform == 'darwin'
    ? `${process.env.HOME}/Library/Application Support`
    : process.env.HOME
);
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const toml = require('toml');
const { shell } = require('electron');
const marked = require('marked');

const preloadContent = document.querySelector('.preload-content');

const { StringLoader } = require("./assets/js/utils/stringLoader.js");

import { Alert } from "../utils/alert.js";

import { AskModal } from '../utils/askModal.js';
const modal_ = new AskModal();

class Mods {
    static id = "mods";

    async init(config) {
        this.config = config;
        this.database = await new database().init();

        await window.ensureStringLoader();
        await window.stringLoader.applyStrings();

        this.Inicio();

        this.InsalarModPack();
        this.GetLocalMods();
        this.NewScript();

        // Observar cuando el panel se activa
        this.setupPanelObserver();
    }

    setupPanelObserver() {
        const { getValue } = require('./assets/js/utils/storage');
        const panel = document.querySelector('.panel.mods');

        if (!panel) return;

        let wasActive = panel.classList.contains('active');

        const observer = new MutationObserver(async (mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isActive = panel.classList.contains('active');

                    // Solo ejecutar si cambió de inactivo a activo
                    if (isActive && !wasActive) {
                        const tutorialCompleted = await getValue("modsTutorialCompleted");
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
            id: "mods-welcome",
            title: getString('tour.mods.welcome'),
            text: getString('tour.mods.welcomeText'),
            buttons: [
                {
                    text: getString('tour.next'),
                    action: tour.next,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        tour.addStep({
            title: getString('tour.mods.searchTitle'),
            text: getString('tour.mods.searchText'),
            attachTo: {
                element: "#input_buscar_mods",
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
            title: getString('tour.mods.filtersTitle'),
            text: getString('tour.mods.filtersText'),
            attachTo: {
                element: "#content-select",
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
            title: getString('tour.mods.loaderTitle'),
            text: getString('tour.mods.loaderText'),
            attachTo: {
                element: "#loader-select",
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
            title: getString('tour.mods.versionTitle'),
            text: getString('tour.mods.versionText'),
            attachTo: {
                element: ".b-mods-version-checkbox-container",
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
            title: getString('tour.mods.sortTitle'),
            text: getString('tour.mods.sortText'),
            attachTo: {
                element: "#sort-select",
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
            title: getString('tour.mods.localModsTitle'),
            text: getString('tour.mods.localModsText'),
            attachTo: {
                element: "#mods-installed-local-btn",
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
            id: "mods-finish",
            title: getString('tour.mods.finishTitle'),
            text: getString('tour.mods.finishText'),
            buttons: [
                {
                    text: getString('tour.finish'),
                    action: tour.complete,
                    classes: "button is-info is-outlined",
                },
            ],
        });

        try {
            await modal_.ask({
                title: "¿Quieres un tour por el sistema de mods?",
                text: "Te guiaré a través de las características principales.",
                showCancelButton: true,
                confirmButtonText: "Sí, quiero el tour",
                cancelButtonText: "No, gracias",
                preConfirm: () => true
            });

            await tour.start();
            await setValue("modsTutorialCompleted", true);

        } catch (err) {
            await setValue("modsTutorialCompleted", true);
            if (err !== "cancelled") {
                console.error("Error al iniciar el tour de mods:", err);
            }
        }
    } async NewScript() {
        let thiss = this;

        let currentPage = 1;
        const limit = 40;
        let totalHits = 0;
        let totalPages = 1;

        const modGrid = document.getElementById("mod-grid");
        const pageInfo = document.getElementById("pageInfo");
        const resultsCount = document.getElementById("results-count");
        const prevPageBtn = document.getElementById("prevPage");
        const nextPageBtn = document.getElementById("nextPage");
        const sortSelect = document.getElementById("sort-select");
        const loaderSelect = document.getElementById("loader-select");
        const contentSelect = document.getElementById("content-select");
        const goToPageInput = document.getElementById("goToPageInput");
        const goToPageBtn = document.getElementById("goToPageBtn");
        const resetBtn = document.getElementById("resetBtn");
        const input_buscar_mods = document.getElementById("input_buscar_mods");
        const searchBtn = document.getElementById("searchBtn");
        const versionCheckboxes = document.querySelectorAll(".b-mods-version-checkbox");

        loadMods();

        versionCheckboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                currentPage = 1;
                loadMods();
            });
        });

        input_buscar_mods.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                currentPage = 1;
                loadMods();
            }
        });

        searchBtn.addEventListener("click", () => {
            currentPage = 1;
            loadMods();
        });

        sortSelect.addEventListener("change", () => {
            currentPage = 1;
            loadMods();
        });

        loaderSelect.addEventListener("change", () => {
            currentPage = 1;
            loadMods();
        });

        contentSelect.addEventListener("change", () => {
            currentPage = 1;
            loadMods();
        });

        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                loadMods();
            }
        });

        nextPageBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadMods();
            }
        });

        goToPageBtn.addEventListener("click", () => {
            const page = parseInt(goToPageInput.value);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                currentPage = page;
                loadMods();
            }
        });

        resetBtn.addEventListener("click", () => {
            loaderSelect.value = "";
            contentSelect.value = "";
            sortSelect.value = "relevance";
            input_buscar_mods.value = "";
            versionCheckboxes.forEach(cb => cb.checked = false);
            currentPage = 1;
            loadMods();
        });

        function buildFacets() {
            let facetsArray = [];

            let contentVal = contentSelect.value;
            console.log(contentVal);
            if (contentVal === "mod") {
                facetsArray.push(["project_type:mod"]);
            } else if (contentVal === "resourcepack") {
                facetsArray.push(["project_type:resourcepack"]);
            } else if (contentVal === "shader") {
                facetsArray.push(["project_type:shader"]);
            } else if (contentVal === "resourcepack") {
                facetsArray.push(["project_type:resourcepack"]);
            } else if (contentVal === "modpack") {
                facetsArray.push(["project_type:modpack"]);
            } else if (contentVal === "datapack") {
                facetsArray.push(["project_type:datapack"]);
            } else {
                facetsArray.push(["project_type:mod"]);
            }

            let loaderVal = loaderSelect.value;
            if (loaderVal) {
                facetsArray.push([`categories:${loaderVal.toLowerCase()}`]);
            }

            const selectedVersions = Array.from(versionCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => `versions:${cb.value}`);
            if (selectedVersions.length > 0) {
                facetsArray.push(selectedVersions);
            }
            return encodeURIComponent(JSON.stringify(facetsArray));
        }

        function getTwoUniqueIndices(max) {

            if (max < 2) return [];
            const first = Math.floor(Math.random() * max);

            let second = Math.floor(Math.random() * (max - 1));
            if (second >= first) second += 1;
            return [first, second];
        }

        async function loadMods() {
            const offset = (currentPage - 1) * limit;
            const sortBy = sortSelect.value;
            const query = encodeURIComponent(input_buscar_mods.value.trim());
            const facetsParam = buildFacets();

            let url = `https://api.modrinth.com/v2/search?limit=${limit}&index=${sortBy}&facets=${facetsParam}&offset=${offset}`;
            if (query) url += `&query=${query}`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                totalHits = data.total_hits || 0;
                totalPages = totalHits > 0 ? Math.ceil(totalHits / limit) : 1;

                modGrid.innerHTML = "";
                pageInfo.textContent = totalHits > 0
                    ? window.stringLoader.getString("mods.pageInfo", { currentPage, totalPages })
                    : window.stringLoader.getString("mods.noResults");
                const start = totalHits > 0 ? offset + 1 : 0;
                const end = totalHits > 0 ? Math.min(offset + limit, totalHits) : 0;
                resultsCount.textContent = totalHits > 0
                    ? window.stringLoader.getString("mods.resultsCount", { start, end, totalHits })
                    : window.stringLoader.getString("mods.noResultsCount");

                prevPageBtn.disabled = currentPage <= 1 || totalHits === 0;
                nextPageBtn.disabled = currentPage >= totalPages || totalHits === 0;

                if (!data.hits || data.hits.length === 0) {
                    const empty = document.createElement("div");
                    empty.style.textAlign = "center";
                    empty.style.padding = "1rem";
                    empty.innerHTML = `
                <p style="opacity:.8">${window.stringLoader.getString("mods.noProjectsFound")}</p>
                <button id="btn-clear-filters" class="button is-small is-info is-outlined" style="margin-top:.5rem">
                    ${window.stringLoader.getString("mods.clearFilters")}
                </button>`;
                    modGrid.appendChild(empty);
                    empty.querySelector('#btn-clear-filters').onclick = () => {
                        loaderSelect.value = "";
                        contentSelect.value = "";
                        sortSelect.value = "relevance";
                        input_buscar_mods.value = "";
                        versionCheckboxes.forEach(cb => (cb.checked = false));
                        currentPage = 1;
                        loadMods();
                    };
                    return;
                }

                const adIndices = getTwoUniqueIndices(data.hits.length);

                data.hits.forEach(async (mod, index) => {

                    if (adIndices.includes(index)) {
                        const adContainer = document.createElement("div");
                        adContainer.innerHTML = `
          <iframe src="https://battlylauncher.com/ads/728x90"
                  autoplay muted="muted"
                  style="width: 100%; height: 90px; border: none; margin-bottom: 1rem; display: block; border-radius: 10px;"
                  scrolling="no" frameborder="0"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  allow="fullscreen; autoplay"
                  allowtransparency="true">
          </iframe>`;
                        modGrid.appendChild(adContainer);
                    }

                    const { title, author, description, icon_url } = mod;
                    const categories = mod.categories || [];
                    const projectType = mod.project_type;

                    const modItem = document.createElement("div");
                    modItem.className = "b-mods-mod-item";

                    const img = document.createElement("img");
                    img.src = icon_url || "https://placehold.co/40/66d1ff/000000?text=?";
                    img.alt = title || "Proyecto";

                    const modInfo = document.createElement("div");
                    modInfo.className = "b-mods-mod-info";

                    const h3 = document.createElement("h3");
                    h3.innerHTML = `${title ?? await window.getString("mods.noTitle")} <span>by ${author ?? await window.getString("mods.unknown")}</span>`;

                    const p = document.createElement("p");
                    p.textContent = description ?? "";

                    const tagsDiv = document.createElement("div");
                    tagsDiv.className = "b-mods-tags";
                    categories.forEach((cat) => {
                        const tagSpan = document.createElement("span");
                        tagSpan.className = "b-mods-tag";
                        tagSpan.textContent = cat;
                        tagsDiv.appendChild(tagSpan);
                    });

                    modInfo.appendChild(h3);
                    modInfo.appendChild(p);
                    modInfo.appendChild(tagsDiv);

                    modItem.appendChild(img);
                    modItem.appendChild(modInfo);
                    modGrid.appendChild(modItem);

                    modItem.addEventListener("click", () => {
                        thiss.ShowPanelInfo(mod.project_id);
                    });
                });

                if (currentPage >= totalPages && totalHits > 0) {
                    const endMessage = document.createElement("p");
                    endMessage.textContent = await window.getString("mods.endMessage");
                    endMessage.style.textAlign = "center";
                    endMessage.style.marginTop = "1rem";
                    endMessage.style.fontStyle = "italic";
                    modGrid.appendChild(endMessage);
                }
            } catch (error) {
                console.error("Error al cargar los mods:", error);
            }
        }

    }

    async GetLocalMods() {

        let thisss = this;

        const cmpSemverLike = (a, b) => {
            const pa = String(a).split(/[^0-9]+/).filter(Boolean).map(n => parseInt(n, 10));
            const pb = String(b).split(/[^0-9]+/).filter(Boolean).map(n => parseInt(n, 10));
            const len = Math.max(pa.length, pb.length);
            for (let i = 0; i < len; i++) {
                const da = pa[i] ?? 0, db = pb[i] ?? 0;
                if (da !== db) return da - db;
            }
            return 0;
        };

        const normalizeBracketRange = (s) => {
            if (!s) return null;
            s = s.trim();
            if (/^>=/.test(s)) return { min: s.replace(/^>=\s*/, ''), minInc: true, max: null, maxInc: false };
            if (/^>/.test(s)) return { min: s.replace(/^>\s*/, ''), minInc: false, max: null, maxInc: false };
            if (s.startsWith("[") || s.startsWith("(")) {
                const mm = s.match(/^([\[\(])\s*([^,\s]+)?\s*,\s*([^\]\)]*)\s*([\]\)])$/);
                if (!mm) return null;
                const min = mm[2] || null;
                const max = mm[3] || null;
                return { min, minInc: mm[1] === "[", max, maxInc: mm[4] === "]" };
            }
            return { min: s, minInc: true, max: null, maxInc: false };
        };

        const semverNums = (v) => (String(v).match(/\d+(\.\d+)*/)?.[0] || "")
            .split(".").filter(Boolean).map(n => parseInt(n, 10));

        const cmpVers = (a, b) => {
            const pa = semverNums(a), pb = semverNums(b);
            const len = Math.max(pa.length, pb.length);
            for (let i = 0; i < len; i++) {
                const da = pa[i] ?? 0, db = pb[i] ?? 0;
                if (da !== db) return da - db;
            }
            return 0;
        };

        const satisfiesRange = (version, rangeStr) => {
            if (!version || !rangeStr) return true;
            const r = normalizeBracketRange(rangeStr);
            if (!r) return true;
            if (r.min) {
                const c = cmpVers(version, r.min);
                if (c < 0 || (c === 0 && !r.minInc)) return false;
            }
            if (r.max) {
                const c = cmpVers(version, r.max);
                if (c > 0 || (c === 0 && !r.maxInc)) return false;
            }
            return true;
        };

        const stripTrailingDash = (v) => v && v.endsWith("-") ? v.slice(0, -1) : v;
        const lowerPath = (s) => (s || '').replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+/, '').toLowerCase();

        document.getElementById("content-select").addEventListener("change", async () => {
            let typeOfSearch = document.getElementById("content-select").value;
            const type = {
                "": "Mods",
                mod: "Mods",
                resourcepack: "ResourcePacks",
                shader: "Shaders",
                modpack: "ModPacks",
                datapack: "DataPacks",
            };
            document.getElementById("battlymodstext").innerHTML = type[typeOfSearch];
        });

        let modsBtn = document.getElementById("button_ver_mods");

        modsBtn.addEventListener("click", async () => {
            const modal = document.createElement('div');
            modal.classList.add('modal', 'is-active');
            modal.style.zIndex = '9999';

            const modalBackground = document.createElement('div');
            modalBackground.classList.add('modal-background');

            const modalCard = document.createElement('div');
            modalCard.classList.add('modal-card', 'modal-animated');
            modalCard.style.backgroundColor = '#0f1623';
            modalCard.style.maxHeight = '80%';

            const modalHeader = document.createElement('header');
            modalHeader.classList.add('modal-card-head');
            modalHeader.style.backgroundColor = '#0f1623';

            const modalTitle = document.createElement('p');
            modalTitle.classList.add('modal-card-title');
            modalTitle.style.color = '#fff';
            modalTitle.innerHTML = '<i class="fa-solid fa-puzzle"></i> ' + await window.getString("mods.mods");

            const closeBtn = document.createElement('button');
            closeBtn.classList.add('delete');
            closeBtn.setAttribute('aria-label', 'close');
            closeBtn.addEventListener('click', () => { modal.remove(); });

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeBtn);

            const modalBody = document.createElement('section');
            modalBody.classList.add('modal-card-body');
            modalBody.style.backgroundColor = '#0f1623';
            modalBody.style.color = '#fff';

            const bodyText = document.createElement('p');
            bodyText.innerHTML = await window.getString("mods.welcomeMods");

            const lineBreak = document.createElement('br');

            const statusText = document.createElement('p');
            statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin-pulse"></i> ${await window.getString("mods.loadingMods")}`;

            const modalMods = document.createElement('div');
            modalMods.style.display = 'none';

            modalBody.appendChild(bodyText);
            modalBody.appendChild(lineBreak);
            modalBody.appendChild(statusText);
            modalBody.appendChild(modalMods);

            modal.appendChild(modalBackground);
            modal.appendChild(modalCard);
            modalCard.appendChild(modalHeader);
            modalCard.appendChild(modalBody);
            document.body.appendChild(modal);

            const modsDirectory = `${dataDirectory}/.battly/mods`;
            if (!fs.existsSync(modsDirectory)) fs.mkdirSync(modsDirectory);

            const mods = fs.readdirSync(modsDirectory)
                .filter(file => ['.jar', '.disabledmod'].includes(path.extname(file)))
                .map(file => path.join(modsDirectory, file));

            if (!mods.length) {
                const noModsText = document.createElement('p');
                noModsText.innerHTML = await window.getString("mods.noModsFound");
                noModsText.style.textAlign = 'center';
                noModsText.style.color = '#fff';
                modalBody.appendChild(noModsText);
                modalMods.style.display = 'none';
                statusText.remove();
                return;
            }

            let forgeMapCache = null;
            const loadForgeMapFromMaven = async () => {
                if (forgeMapCache) return forgeMapCache;
                const res = await fetch("https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json", { headers: { "accept": "application/json" } });
                if (!res.ok) throw new Error(`Forge maven-metadata HTTP ${res.status}`);
                const data = await res.json();
                const map = {};
                const mcVersions = Object.keys(data).sort(cmpSemverLike);
                for (const mc of mcVersions) {
                    for (const entry of data[mc] || []) {
                        const parts = String(entry).split("-");
                        if (parts.length < 2) continue;
                        const forgeStr = parts.slice(1).join("-");
                        const major = parseInt(forgeStr.split(".")[0], 10);
                        if (Number.isNaN(major)) continue;
                        if (!map[major]) map[major] = { mcs: new Set(), firstMc: mc, lastMc: mc };
                        map[major].mcs.add(mc);
                        if (cmpSemverLike(mc, map[major].firstMc) < 0) map[major].firstMc = mc;
                        if (cmpSemverLike(mc, map[major].lastMc) > 0) map[major].lastMc = mc;
                    }
                }
                for (const k of Object.keys(map)) map[k].mcs = Array.from(map[k].mcs).sort(cmpSemverLike);
                forgeMapCache = map;
                return map;
            };

            const inferMinecraftFromFabricJson = (jsonText) => {
                let j; try { j = JSON.parse(jsonText); } catch { return null; }
                let dep = j?.depends?.minecraft;
                if (!dep) return null;

                const norm = (s) => String(s).trim();
                const handle = (sRaw) => {
                    if (!sRaw) return null;
                    const s = norm(sRaw);

                    let m = s.match(/^>=\s*([0-9][0-9.\-x]+)\-?$/i);
                    if (m) return `${stripTrailingDash(m[1])}+`;

                    m = s.match(/^~\s*([0-9]+(?:\.[0-9]+){1,2})$/i);
                    if (m) return `${m[1]}+`;

                    m = s.match(/^\^\s*([0-9]+(?:\.[0-9]+){0,2})$/i);
                    if (m) return `${m[1]}+`;

                    m = s.match(/^([0-9]+(?:\.[0-9x]+)*)$/i);
                    if (m) return m[1];

                    const br = normalizeBracketRange(s);
                    if (br?.min && !br.max) return `${stripTrailingDash(br.min)}+`;
                    if (br?.min && br?.max) return `${stripTrailingDash(br.min)} – ${stripTrailingDash(br.max)}`;

                    return s;
                };

                if (typeof dep === 'string') return handle(dep);
                if (Array.isArray(dep) && dep.length) return handle(dep[0]);
                if (typeof dep === 'object') {
                    const first = Object.values(dep).find(v => typeof v === 'string');
                    if (first) return handle(first);
                }
                return null;
            };

            const extractForgeMinMajor = (tomlText) => {
                const m1 = tomlText.match(/loaderVersion\s*=\s*"\s*\[([0-9]+)\s*,/i);
                if (m1) return parseInt(m1[1], 10);
                const depBlocks = tomlText.split(/\[\[dependencies[^\]]*\]\]/i).slice(1).map(s => s.trim());
                for (const block of depBlocks) {
                    const mId = block.match(/modId\s*=\s*"(.*?)"/i)?.[1];
                    if (mId?.toLowerCase() !== "forge") continue;
                    const vr = block.match(/versionRange\s*=\s*"(.*?)"/i)?.[1];
                    const br = normalizeBracketRange(vr);
                    if (br?.min) {
                        const minMajor = parseInt(br.min, 10);
                        if (!Number.isNaN(minMajor)) return minMajor;
                    }
                }
                return null;
            };

            const inferMinecraftFromForgeToml = async (tomlText) => {
                const minMajor = extractForgeMinMajor(tomlText);
                if (!minMajor) return null;
                const map = await loadForgeMapFromMaven();
                const majors = Object.keys(map).map(n => parseInt(n, 10)).sort((a, b) => a - b);
                const out = new Set();
                for (const mj of majors) {
                    if (mj < minMajor) continue;
                    for (const mc of map[mj].mcs) out.add(mc);
                }
                const list = Array.from(out).sort(cmpSemverLike);
                if (!list.length) return null;
                return list[list.length - 1];
            };

            const inferMinecraftFromNeoForgeToml = (tomlText) => {
                const depBlocks = tomlText.split(/\[\[dependencies[^\]]*\]\]/i).slice(1).map(s => s.trim());
                for (const block of depBlocks) {
                    const mId = block.match(/modId\s*=\s*"(.*?)"/i)?.[1];
                    if (mId?.toLowerCase() !== "minecraft") continue;
                    const vr = block.match(/versionRange\s*=\s*"(.*?)"/i)?.[1];
                    const br = normalizeBracketRange(vr);
                    if (!br) continue;
                    if (br.min && !br.max) return br.min;
                    if (br.min && br.max) return `${br.min} – ${br.max}`;
                }
                return null;
            };

            const deriveMcFromVersionish = (s) => {
                if (!s) return null;
                const m = String(s).match(/mc\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
                return m ? m[1] : null;
            };
            const deriveMcFromJarName = (jarPath) => {
                const base = (jarPath || '').split(/[\\/]/).pop();
                return deriveMcFromVersionish(base);
            };

            const readFabricMinecraftFromManifest = async (zip) => {
                const mf = zip.files.find(f => f.path.toLowerCase() === 'meta-inf/manifest.mf');
                if (!mf) return null;
                const txt = (await mf.buffer()).toString('utf8');

                const lines = txt.replace(/\r\n/g, '\n').split('\n');
                const kv = {};
                let lastKey = null;
                for (let line of lines) {
                    if (!line) continue;
                    if (line.startsWith(' ')) {
                        if (lastKey) kv[lastKey] += line.slice(1);
                        continue;
                    }
                    const i = line.indexOf(':');
                    if (i > 0) {
                        const k = line.slice(0, i).trim();
                        const v = line.slice(i + 1).trim();
                        kv[k] = v;
                        lastKey = k;
                    }
                }
                return kv['Fabric-Minecraft-Version'] || null;
            };

            const resolveFabricIconEntry = (zip, manifest, modIdGuess) => {
                const collectIconCandidates = (iconField) => {
                    const out = [];
                    if (!iconField) return out;
                    if (typeof iconField === 'string') out.push(iconField);
                    else if (Array.isArray(iconField)) out.push(...iconField);
                    else if (typeof iconField === 'object') {
                        if (iconField.file) out.push(iconField.file);
                        for (const v of Object.values(iconField)) if (typeof v === 'string') out.push(v);
                    }
                    return out;
                };

                const iconCandidates = collectIconCandidates(manifest.icon);
                const filesLC = zip.files.map(f => ({ entry: f, p: lowerPath(f.path) }));

                for (const cand of iconCandidates) {
                    const want = lowerPath(cand);
                    const exact = filesLC.find(f => f.p === want);
                    if (exact) return exact.entry;
                }
                for (const cand of iconCandidates) {
                    const want = lowerPath(cand);
                    const soft = filesLC.find(f => f.p.endsWith(want));
                    if (soft) return soft.entry;
                }

                const pngSet = [
                    'icon.png',
                    'mod_logo.png',
                    modIdGuess ? `assets/${modIdGuess}/icon.png` : null,
                    modIdGuess ? `${modIdGuess}.png` : null,
                ].filter(Boolean);
                const altSet = [];
                for (const base of pngSet) {
                    altSet.push(base.replace(/\.png$/i, '.webp'));
                    altSet.push(base.replace(/\.png$/i, '.jpg'));
                }
                const fallbacks = [...pngSet, ...altSet];

                for (const f of fallbacks) {
                    const want = lowerPath(f);
                    const exact = filesLC.find(e => e.p === want);
                    if (exact) return exact.entry;
                }
                for (const f of fallbacks) {
                    const want = lowerPath(f);
                    const soft = filesLC.find(e => e.p.endsWith(want));
                    if (soft) return soft.entry;
                }

                if (typeof manifest.icon === 'string') {
                    const want = lowerPath(manifest.icon);
                    const soft = filesLC.find(e => e.p.endsWith(want));
                    if (soft) return soft.entry;
                }

                const anyIcon = filesLC.find(e => /(^|\/)icon[^/]*\.(png|webp|jpg)$/i.test(e.p));
                if (anyIcon) return anyIcon.entry;

                const anyImage = filesLC.find(e => /\.(png|webp|jpg)$/i.test(e.p));
                return anyImage ? anyImage.entry : null;
            };

            const parseForgeNeoDependencies = (rawToml, modId) => {
                const out = [];
                const re = new RegExp(String.raw`\[\[dependencies\.${modId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\]\][\s\S]*?(?=\[\[|$)`, 'gi');
                let m;
                while ((m = re.exec(rawToml)) !== null) {
                    const block = m[0];
                    const depId = block.match(/modId\s*=\s*"(.*?)"/i)?.[1] || block.match(/modId\s*=\s*'(.*?)'/i)?.[1];
                    const type = block.match(/type\s*=\s*"(.*?)"/i)?.[1] || block.match(/type\s*=\s*'(.*?)'/i)?.[1] || 'required';
                    const vr = block.match(/versionRange\s*=\s*"(.*?)"/i)?.[1] || block.match(/versionRange\s*=\s*'(.*?)'/i)?.[1] || null;

                    if (!depId) continue;
                    const depIdLC = depId.toLowerCase();
                    if (depIdLC === 'minecraft') continue;
                    if (type && type.toLowerCase() !== 'required') continue;

                    out.push({ id: depIdLC, range: vr || null, source: 'forge-neo' });
                }
                return out;
            };

            const parseFabricDependencies = (jsonText) => {
                let j; try { j = JSON.parse(jsonText); } catch { return []; }
                const out = [];
                const deps = j?.depends || {};
                for (const [k, v] of Object.entries(deps)) {
                    const id = String(k).toLowerCase();
                    if (id === 'minecraft') continue;
                    let range = null;
                    if (typeof v === 'string') range = v;
                    else if (Array.isArray(v) && v.length) range = String(v[0]);
                    else if (typeof v === 'object') {
                        const val = Object.values(v).find(x => typeof x === 'string');
                        if (val) range = val;
                    }
                    out.push({ id, range, source: 'fabric' });
                }
                return out;
            };

            const detected = [];

            await Promise.all(mods.map(async (modPath) => {
                try {
                    const zip = await unzipper.Open.file(modPath);

                    const manifestEntry =
                        zip.files.find(entry => entry.path.toLowerCase().endsWith('fabric.mod.json')) ||
                        zip.files.find(entry => entry.path.toLowerCase().endsWith('quilt.mod.json')) ||
                        zip.files.find(entry => entry.path.toLowerCase().endsWith('mods.toml'));

                    if (!manifestEntry) return;

                    const manifestContent = await manifestEntry.buffer();
                    const manifestString = manifestContent.toString('utf8');

                    let manifest, modInfo, loaderKind, mcVersion = null, modId = null, modName = null, modVersion = null, deps = [], modIconEntry = null;

                    if (manifestEntry.path.toLowerCase().endsWith('mods.toml')) {
                        const rawToml = manifestString;
                        manifest = toml.parse(rawToml);
                        manifest.__rawToml = rawToml;
                        modInfo = manifest.mods?.[0] || {};
                        const hasNeo = /\bmodId\s*=\s*"(?:neoforge|neo)"/i.test(rawToml) || /\bloader\s*=\s*"(?:neoforge|neo)"/i.test(rawToml);
                        loaderKind = hasNeo ? 'neoforge' : 'forge';

                        if (loaderKind === 'neoforge') mcVersion = inferMinecraftFromNeoForgeToml(rawToml);
                        else mcVersion = await inferMinecraftFromForgeToml(rawToml);
                        if (!mcVersion) mcVersion = deriveMcFromVersionish(modInfo.version) || deriveMcFromJarName(modPath) || null;

                        modId = (modInfo.modId || modInfo.id || '').toLowerCase() || null;
                        modName = modInfo.displayName || modInfo.name || modId || 'Unknown Mod';
                        modVersion = modInfo.version || 'Unknown Version';

                        if (modId) deps = parseForgeNeoDependencies(rawToml, modId);

                        if (manifest.icon) {
                            modIconEntry = zip.files.find((entry) => lowerPath(entry.path) === lowerPath(manifest.icon))
                                || zip.files.find((entry) => lowerPath(entry.path).endsWith(lowerPath(manifest.icon)));
                        }
                        if (!modIconEntry) modIconEntry = zip.files.find((entry) => entry.path.toLowerCase().endsWith("icon.png"));
                        if (!modIconEntry) modIconEntry = zip.files.find((entry) => entry.path.toLowerCase().endsWith("mod_logo.png"));
                        if (!modIconEntry && modId) {
                            modIconEntry = zip.files.find((entry) => entry.path.toLowerCase().endsWith(`${modId}.png`))
                                || zip.files.find((entry) => entry.path.toLowerCase().endsWith(`assets/${modId}/icon.png`));
                        }
                    } else {
                        manifest = JSON.parse(manifestString);
                        modInfo = manifest;
                        loaderKind = 'fabric';

                        mcVersion = inferMinecraftFromFabricJson(manifestString)
                            || deriveMcFromVersionish(manifest.version)
                            || await readFabricMinecraftFromManifest(zip)
                            || deriveMcFromJarName(modPath)
                            || null;

                        modId = (manifest.id || '').toLowerCase() || null;
                        modName = manifest.name || modId || 'Unknown Mod';
                        modVersion = manifest.version || 'Unknown Version';

                        deps = parseFabricDependencies(manifestString);

                        const modIdGuess = manifest?.id || null;
                        modIconEntry = resolveFabricIconEntry(zip, manifest, modIdGuess);
                    }

                    const modIconBase64 = modIconEntry
                        ? `data:image/png;base64,${(await modIconEntry.buffer()).toString('base64')}`
                        : 'https://battlylauncher.com/assets/img/mc-icon.png';

                    detected.push({
                        path: modPath,
                        id: modId,
                        name: modName,
                        version: modVersion,
                        loader: loaderKind,
                        mcVersion: mcVersion,
                        deps,
                        icon: modIconBase64,
                    });
                } catch (error) {
                    console.error(`Error processing mod: ${modPath}`);
                    console.log(error);
                }
            }));


            modalBody.removeChild(statusText);
            modalMods.style.display = 'block';

            for (const mod of detected) {
                const mcBadge = mod.mcVersion ? `<span class="b-mods-mc-version-badge">MC ${mod.mcVersion}</span>` : '';
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '10px';
                card.style.backgroundColor = 'transparent';
                card.style.border = '1px solid #3f3f3f';
                card.id = mod.path;

                card.innerHTML = `
<header class="card-header is-flex">
  <img src="${mod.icon}" style="width:30px;height:30px;margin-left:15px;align-self:center;border-radius:5px;">
  <p class="card-header-title" style="color:#fff;padding-left:10px;display:flex;align-items:center;gap:6px;">
    <span>${mod.name}</span>
    <span style="font-size:12px;opacity:.85;">${mod.loader || 'unknown'}</span>
    ${mcBadge}
  </p>
  <div class="buttons buttons-no-margin" style="margin-right:10px;">
    ${mod.path.endsWith('.disabledmod') ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>'}
    <i class="fa-solid fa-folder-open"></i>
    <i class="fa-solid fa-trash"></i>
    <i class="fa-solid fa-angle-down"></i>
  </div>
</header>
<div class="card-content" style="display:none;padding:15px;font-family:Poppins;font-weight:700;color:#fff;font-size:13px;">
  <div style="display:flex;flex-direction:column;gap:6px;">
    <div><b>ID:</b> ${mod.id || '—'}</div>
    <div><b>Versión mod:</b> ${mod.version || '—'}</div>
    <div><b>Loader:</b> ${mod.loader || '—'}</div>
    <div><b>Minecraft:</b> ${mod.mcVersion || '—'}</div>
    <div><b>Dependencias:</b> ${mod.deps.length ? mod.deps.map(d => `${d.id}${d.range ? ` (${d.range})` : ''}`).join(', ') : '—'}</div>
  </div>
</div>`;

                modalMods.appendChild(card);

                const [deactivateButton, openButton, deleteButton, toggleButton] = card.querySelectorAll('.buttons-no-margin > i');
                const cardContent = card.querySelector('.card-content');

                deactivateButton.addEventListener('click', async () => {
                    try {
                        const currentPath = path.resolve(mod.path);
                        let newPath;
                        if (currentPath.endsWith('.disabledmod')) newPath = currentPath.replace('.disabledmod', '.jar');
                        else if (currentPath.endsWith('.jar')) newPath = currentPath.replace('.jar', '.disabledmod');
                        else return;

                        fs.renameSync(currentPath, newPath);
                        mod.path = newPath;

                        deactivateButton.classList.toggle('fa-eye');
                        deactivateButton.classList.toggle('fa-eye-slash');

                        new Alert().ShowAlert({
                            icon: 'success',
                            title: currentPath.endsWith('.disabledmod') ? await window.getString("mods.modActivated") : await window.getString("mods.modDeactivated"),
                        });
                    } catch (error) {
                        console.error("Error renaming file:", error);
                    }
                });

                openButton.addEventListener('click', () => shell.showItemInFolder(mod.path));

                deleteButton.addEventListener('click', async () => {
                    try {
                        await modal_.ask({
                            title: await window.getString("mods.areYouSure"),
                            text: await window.getString("mods.areYouSureText"),
                            showCancelButton: true,
                            confirmButtonText: await window.getString("mods.yesDelete"),
                            cancelButtonText: await window.getString("mods.noCancel"),
                            confirmButtonColor: '#f14668',
                            cancelButtonColor: '#3e8ed0',
                            preConfirm: () => true
                        });
                        card.remove();
                        fs.unlinkSync(mod.path);
                        new Alert().ShowAlert({ icon: 'success', title: await window.getString("mods.modDeletedCorrectly") });
                    } catch (err) { console.error(err); }
                });

                toggleButton.addEventListener('click', () => {
                    const isVisible = cardContent.style.display !== 'none';
                    cardContent.style.display = isVisible ? 'none' : 'block';
                    toggleButton.classList.toggle('fa-angle-down');
                    toggleButton.classList.toggle('fa-angle-up');
                });
            }
        });
    }


    async InsalarModPack() {
        let btnInstalarModPack = document.getElementById("button_instalar_modpack");

        btnInstalarModPack.addEventListener("click", async () => {

            const modalDiv = document.createElement("div");
            modalDiv.className = "modal is-active";
            modalDiv.style.zIndex = "9999";

            const modalBackgroundDiv = document.createElement("div");
            modalBackgroundDiv.className = "modal-background";
            modalDiv.appendChild(modalBackgroundDiv);

            const modalCardDiv = document.createElement("div");
            modalCardDiv.className = "modal-card";
            modalCardDiv.classList.add("modal-animated");
            modalDiv.appendChild(modalCardDiv);

            const headerDiv = document.createElement("header");
            headerDiv.className = "modal-card-head";
            modalCardDiv.appendChild(headerDiv);

            const titleP = document.createElement("p");
            titleP.className = "modal-card-title";
            titleP.textContent = await window.getString('mods.installModpackText');
            titleP.style.color = "#fff";
            headerDiv.appendChild(titleP);

            const closeButton = document.createElement("button");
            closeButton.className = "delete";
            closeButton.setAttribute("aria-label", "close");
            headerDiv.appendChild(closeButton);

            const bodySection = document.createElement("section");
            bodySection.className = "modal-card-body";
            modalCardDiv.appendChild(bodySection);

            const textP = document.createElement("p");
            textP.textContent = await window.getString('mods.compatibleWithCurseforgeOrModrinth');
            textP.style.color = "#fff";
            bodySection.appendChild(textP);

            const fileDiv = document.createElement("div");
            fileDiv.className = "file is-small is-boxed has-name";
            fileDiv.style.alignItems = "center";
            bodySection.appendChild(fileDiv);

            const fileLabel = document.createElement("label");
            fileLabel.className = "file-label";
            fileLabel.style.width = "100%";
            fileDiv.appendChild(fileLabel);

            const fileInput = document.createElement("input");
            fileInput.className = "file-input";
            fileInput.setAttribute("type", "file");
            fileInput.setAttribute("name", "resume");
            fileInput.setAttribute("accept", ".zip, .mrpack");

            fileLabel.appendChild(fileInput);

            const fileCtaSpan = document.createElement("span");
            fileCtaSpan.className = "file-cta";
            fileCtaSpan.style.width = "100%";
            fileLabel.appendChild(fileCtaSpan);

            const fileIconSpan = document.createElement("span");
            fileIconSpan.className = "file-icon";
            fileCtaSpan.appendChild(fileIconSpan);

            const fileIcon = document.createElement("i");
            fileIcon.className = "fas fa-upload";
            fileIconSpan.appendChild(fileIcon);

            const fileLabelSpan = document.createElement("span");
            fileLabelSpan.className = "file-label";
            fileLabelSpan.textContent = await window.getString("mods.selectAFile");
            fileLabelSpan.style.fontSize = "10px";
            fileCtaSpan.appendChild(fileLabelSpan);

            const fileNameSpan = document.createElement("span");
            fileNameSpan.className = "file-name";
            fileNameSpan.style.textAlign = "center";
            fileNameSpan.style.width = "100%";
            fileNameSpan.style.maxWidth = "100%";
            fileNameSpan.textContent = await window.getString("mods.zipMrpack");
            fileNameSpan.style.color = "#fff";
            fileLabel.appendChild(fileNameSpan);

            const footerDiv = document.createElement("footer");
            footerDiv.className = "modal-card-foot";
            footerDiv.style.justifyContent = "space-between";
            modalCardDiv.appendChild(footerDiv);

            const cancelButton = document.createElement("button");
            cancelButton.className = "button is-outlined is-white";
            cancelButton.textContent = await window.getString("mods.cancel");
            footerDiv.appendChild(cancelButton);

            const installButton = document.createElement("button");
            installButton.className = "button is-info is-outlined";
            installButton.textContent = await window.getString("mods.install");
            installButton.disabled = true;
            footerDiv.appendChild(installButton);

            document.body.appendChild(modalDiv);

            let installationStarted = false;
            closeButton.addEventListener("click", async () => {
                modalDiv.remove();

                if (installationStarted) {
                    new Alert().ShowAlert({
                        icon: 'info',
                        title: await window.getString('mods.theInstallationIsIn2ndPlan'),
                        text: await window.getString('mods.theInstallationIsIn2ndPlanText')
                    });
                }
            });

            cancelButton.addEventListener("click", () => {
                modalDiv.remove();
            });

            fileInput.addEventListener("change", () => {
                const file = fileInput.files[0];
                if (file) {
                    fileNameSpan.textContent = file.name;
                    installButton.disabled = false;
                }
            });

            installButton.addEventListener("click", async () => {

                if (fileInput.files.length == 0) {
                    new Alert().ShowAlert({
                        icon: 'error',
                        title: await window.getString("mods.youDidntSelectedAnyFile")
                    })

                    installButton.disabled = true;
                } else {

                    modalDiv.remove();

                    installationStarted = true;

                    const file = fileInput.files[0];

                    const modal = document.createElement('div');
                    modal.className = 'modal is-active';

                    const modalBackground = document.createElement('div');
                    modalBackground.className = 'modal-background';

                    const modalCard = document.createElement('div');
                    modalCard.className = 'modal-card';
                    modalCard.classList.add("modal-animated");
                    modalCard.style.borderRadius = '15px';

                    const modalHeader = document.createElement('header');
                    modalHeader.className = 'modal-card-head';
                    modalHeader.style.backgroundColor = '#101726';

                    const modalTitle = document.createElement('p');
                    modalTitle.className = 'modal-card-title';
                    modalTitle.style.color = '#fff';
                    modalTitle.textContent = await window.getString("mods.installingModpackCanTake2");

                    const closeButton = document.createElement('button');
                    closeButton.className = 'delete';
                    closeButton.setAttribute('aria-label', 'close');

                    const modalSection = document.createElement('section');
                    modalSection.className = 'modal-card-body';
                    modalSection.style.backgroundColor = '#101726';

                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'content';

                    const extractingText = document.createElement('h3');
                    extractingText.style.color = '#fff';
                    extractingText.textContent = await window.getString("mods.extractingFiles");

                    const progressBar = document.createElement('progress');
                    progressBar.className = 'progress is-info';

                    const textArea = document.createElement('textarea');
                    textArea.className = 'textarea';
                    textArea.style.backgroundColor = '#1E2A47';
                    textArea.style.color = '#fff';
                    textArea.style.border = '1px solid #1E2A47';
                    textArea.style.borderRadius = '15px';
                    textArea.style.resize = 'none';
                    textArea.style.height = '100px';
                    textArea.style.fontFamily = "Poppins";
                    textArea.rows = 10;
                    textArea.readOnly = true;
                    textArea.placeholder = await window.getString("mods.logs");
                    textArea.style.fontSize = '13px';
                    textArea.style.overflowY = 'hidden';

                    modalHeader.appendChild(modalTitle);
                    modalHeader.appendChild(closeButton);

                    contentDiv.appendChild(extractingText);
                    contentDiv.appendChild(progressBar);
                    contentDiv.appendChild(textArea);

                    modalSection.appendChild(contentDiv);

                    modalCard.appendChild(modalHeader);
                    modalCard.appendChild(modalSection);

                    modal.appendChild(modalBackground);
                    modal.appendChild(modalCard);

                    document.body.appendChild(modal);

                    function scrollTextArea() {
                        textArea.scrollTop = textArea.scrollHeight;
                    }

                    const fs = require('fs-extra');
                    const fetch = require('node-fetch');
                    const path = require('path');

                    const BATTLY_API_BASE = 'https://api.battlylauncher.com';

                    const fsPromises = require('fs').promises;

                    async function descargarModModrinth(archivo, randomString) {
                        const writeLog = window.modrinthWriteLog || console.log;

                        try {
                            const basePath = `${dataDirectory}/.battly/instances/${randomString}`;

                            writeLog('[DESCARGA] Procesando modpack Modrinth', {
                                instanceId: randomString,
                                basePath
                            });

                            if (!archivo || typeof archivo !== 'object') {
                                throw new Error('Manifest de Modrinth inválido o vacío');
                            }

                            if (!archivo.dependencies || typeof archivo.dependencies !== 'object') {
                                throw new Error('Manifest de Modrinth no contiene dependencias');
                            }

                            if (!archivo.files || !Array.isArray(archivo.files)) {
                                throw new Error('Manifest de Modrinth no contiene lista de archivos');
                            }

                            const name = archivo.name || 'ModPack sin nombre';
                            const description = archivo.summary || await window.getString('mods.noDescription') || 'Sin descripción';
                            const version = archivo.dependencies.minecraft;

                            if (!version) {
                                throw new Error('No se encontró la versión de Minecraft en el manifest');
                            }

                            writeLog('[INFO] Información del modpack', {
                                name,
                                version,
                                totalFiles: archivo.files.length
                            });

                            let loader = null;
                            let loaderVersion = null;

                            if ("fabric-loader" in archivo.dependencies) {
                                loader = "fabric";
                                loaderVersion = archivo.dependencies["fabric-loader"];
                            } else if ("quilt-loader" in archivo.dependencies) {
                                loader = "quilt";
                                loaderVersion = archivo.dependencies["quilt-loader"];
                            } else if ("forge" in archivo.dependencies) {
                                loader = "forge";
                                loaderVersion = archivo.dependencies["forge"];
                            } else if ("neoforge" in archivo.dependencies) {
                                loader = "neoforge";
                                loaderVersion = archivo.dependencies["neoforge"];
                            }

                            if (!loader || !loaderVersion) {
                                throw new Error(`No se encontró un loader compatible. Loaders disponibles: ${Object.keys(archivo.dependencies).join(', ')}`);
                            }

                            writeLog(`[INFO] Loader detectado: ${loader} ${loaderVersion}`);

                            try {
                                const iconResponse = await fetch("https://battlylauncher.com/assets/img/mc-icon.png", { timeout: 5000 });
                                if (iconResponse.ok) {
                                    const iconBuffer = await iconResponse.buffer();
                                    await fsPromises.writeFile(path.join(basePath, "icon.png"), iconBuffer);
                                    writeLog('[INFO] Icono descargado correctamente');
                                }
                            } catch (iconError) {
                                writeLog('[ADVERTENCIA] No se pudo descargar el icono', iconError.message);
                            }

                            const instance = {
                                name,
                                description,
                                version,
                                image: path.join(basePath, "icon.png"),
                                id: randomString,
                                loader,
                                loaderVersion,
                            };

                            await fsPromises.writeFile(path.join(basePath, "instance.json"), JSON.stringify(instance, null, 2));
                            writeLog('[INFO] Archivo instance.json creado');

                            const files = archivo.files;
                            const totalFiles = files.length;
                            progressBar.max = totalFiles;

                            writeLog(`[DESCARGA] Total de archivos a descargar: ${totalFiles}`);

                            const uniqueFolders = [...new Set(files.map(file => path.dirname(file.path)))];
                            writeLog(`[INFO] Creando ${uniqueFolders.length} carpetas necesarias (método síncrono)`);

                            try {
                                uniqueFolders.forEach(folder => {
                                    try {
                                        const folderPath = path.join(basePath, folder);
                                        if (!fs.existsSync(folderPath)) {
                                            fs.mkdirSync(folderPath, { recursive: true });
                                        }
                                    } catch (err) {
                                        writeLog(`[ADVERTENCIA] Error creando carpeta ${folder}`, err.message);
                                    }
                                });
                                writeLog('[INFO] Carpetas creadas correctamente');
                            } catch (folderError) {
                                writeLog('[ERROR] Error crítico creando carpetas', {
                                    error: folderError.message,
                                    stack: folderError.stack
                                });
                                throw folderError;
                            }

                            let totalFilesDownloaded = 0;
                            let totalFilesFailed = 0;
                            const CONCURRENT_DOWNLOADS = 15;

                            let lastUpdate = Date.now();
                            const UPDATE_INTERVAL = 500;

                            writeLog(`[DESCARGA] Iniciando descarga con ${CONCURRENT_DOWNLOADS} workers concurrentes`);

                            const downloadFile = async (file, index) => {
                                const downloads = file.downloads || [];
                                const destination = path.join(basePath, file.path);
                                const fileName = path.basename(file.path);

                                if (downloads.length === 0) {
                                    console.warn(`No hay URLs de descarga para ${file.path}`);
                                    totalFilesFailed++;
                                    return false;
                                }

                                for (let i = 0; i < downloads.length; i++) {
                                    const fileDownload = downloads[i];
                                    try {
                                        const controller = new AbortController();
                                        const timeout = setTimeout(() => controller.abort(), 45000);

                                        const response = await fetch(fileDownload, {
                                            signal: controller.signal
                                        });

                                        clearTimeout(timeout);

                                        if (!response.ok) {
                                            throw new Error(`HTTP ${response.status}`);
                                        }

                                        const fileStream = fs.createWriteStream(destination);
                                        await new Promise((resolve, reject) => {
                                            response.body.pipe(fileStream);
                                            response.body.on("error", reject);
                                            fileStream.on("finish", resolve);
                                            fileStream.on("error", reject);
                                        });

                                        totalFilesDownloaded++;
                                        progressBar.value = totalFilesDownloaded;

                                        const now = Date.now();
                                        if (now - lastUpdate > UPDATE_INTERVAL) {
                                            const percentage = ((totalFilesDownloaded / totalFiles) * 100).toFixed(1);
                                            textArea.value = `✓ Descargados: ${totalFilesDownloaded}/${totalFiles} (${percentage}%)\n⚠ Errores: ${totalFilesFailed}\n📦 Último: ${fileName}`;
                                            scrollTextArea();
                                            lastUpdate = now;
                                        }

                                        return true;

                                    } catch (error) {
                                        if (i === downloads.length - 1) {

                                            console.error(`Error final en ${fileName}:`, error.message);
                                            totalFilesFailed++;
                                            return false;
                                        }

                                        await new Promise(resolve => setTimeout(resolve, 500));
                                    }
                                }
                                return false;
                            };

                            writeLog('[INFO] Preparando sistema de cola concurrente...');
                            const queue = [...files];
                            const workers = [];

                            writeLog(`[INFO] Creando ${CONCURRENT_DOWNLOADS} workers para procesar ${queue.length} archivos`);

                            try {
                                for (let i = 0; i < CONCURRENT_DOWNLOADS; i++) {
                                    workers.push(
                                        (async () => {
                                            while (queue.length > 0) {
                                                const file = queue.shift();
                                                if (file) {
                                                    await downloadFile(file, totalFilesDownloaded);
                                                }
                                            }
                                        })()
                                    );
                                }

                                writeLog('[INFO] Esperando a que todos los workers completen...');
                                await Promise.all(workers);
                                writeLog('[INFO] Todos los workers han completado');
                            } catch (workerError) {
                                writeLog('[ERROR] Error en sistema de workers', {
                                    error: workerError.message,
                                    stack: workerError.stack
                                });
                                throw workerError;
                            }

                            writeLog('[COMPLETADO] Descarga de archivos finalizada', {
                                descargados: totalFilesDownloaded,
                                errores: totalFilesFailed,
                                total: totalFiles
                            });

                            textArea.value = `✅ Completado!\n✓ Descargados: ${totalFilesDownloaded}/${totalFiles}\n⚠ Errores: ${totalFilesFailed}`;
                            scrollTextArea();

                            modal.remove();

                            writeLog('[ÉXITO] Instalación completada correctamente');

                            ipcRenderer.send("new-notification", {
                                title: await window.getString('mods.modpackInstalled') || 'ModPack instalado',
                                body: `ModPack ${name} ${await window.getString('mods.modpackInstalledCorrectly') || 'instalado correctamente'}.`,
                            });

                            new Alert().ShowAlert({
                                icon: "success",
                                title: await window.getString('mods.modpackInstalled') || 'ModPack instalado',
                                text: `ModPack ${name} ${await window.getString('mods.modpackInstalledCorrectly') || 'instalado correctamente'}.`,
                            });

                        } catch (error) {
                            writeLog('[ERROR FATAL] Error crítico en instalación de modpack', {
                                message: error.message,
                                stack: error.stack,
                                name: error.name
                            });

                            modal.remove();

                            try {
                                const basePath = `${dataDirectory}/.battly/instances/${randomString}`;
                                await fsPromises.rm(basePath, { recursive: true, force: true });
                            } catch (cleanupError) {
                                console.error('Error al limpiar carpeta:', cleanupError);
                            }

                            new Alert().ShowAlert({
                                icon: 'error',
                                title: await window.getString('mods.errorExtractingModpack') || 'Error al instalar modpack',
                                text: error.message || (await window.getString('mods.errorExtractingModpackText')) || 'No se pudo instalar el modpack de Modrinth',
                            });
                        }
                    }

                    let destinationFile = file.path;

                    const AdmZip = require('adm-zip');

                    const tipoArchivo = file.name.split('.').pop();

                    let json;

                    if (tipoArchivo === 'zip') {
                        const randomString = Math.random().toString(36).substring(2, 8);
                        const instancesFolder = `${dataDirectory}/.battly/instances`;
                        const instanceFolder = `${instancesFolder}/${randomString}`;
                        const tempFolder = `${dataDirectory}/.battly/temp`;
                        const destinationFolder = instanceFolder;
                        const modsFolder = `${destinationFolder}/mods`;

                        try {

                            await fs.promises.mkdir(instancesFolder, { recursive: true });
                            await fs.promises.mkdir(tempFolder, { recursive: true });
                            await fs.promises.mkdir(instanceFolder, { recursive: true });
                            await fs.promises.mkdir(modsFolder, { recursive: true });

                            const { fork } = require('child_process');
                            const extractProcess = fork(path.join(__dirname, '/assets/js/utils/extractChild.js'), [
                                JSON.stringify({
                                    destinationFile,
                                    destinationFolder,
                                }),
                            ]);

                            await new Promise((resolve, reject) => {
                                let updateBuffer = [];

                                let updateInterval = null;

                                const updateUI = () => {
                                    if (updateBuffer.length > 0) {

                                        textArea.value += updateBuffer.join('\n');
                                        updateBuffer = [];

                                        scrollTextArea();
                                    }
                                };

                                updateInterval = setInterval(updateUI, 100);

                                extractProcess.on('message', (message) => {
                                    if (message.type === 'progress') {

                                        updateBuffer.push(`Extrayendo: ${message.fileName}`);
                                    } else if (message.type === 'done') {

                                        clearInterval(updateInterval);
                                        updateUI();

                                        if (!fs.existsSync(path.join(destinationFolder, 'manifest.json'))) {
                                            Promise.all([
                                                window.getString('mods.theModpackIsNotCompatible'),
                                                window.getString('mods.theModpackIsNotCompatibleText')
                                            ]).then(([title, text]) => {
                                                new Alert().ShowAlert({
                                                    icon: 'error',
                                                    title: title || 'El ModPack no es compatible',
                                                    text: text || 'Asegúrate de que sea de CurseForge o Modrinth',
                                                });
                                            });

                                            fs.rmSync(destinationFolder, { recursive: true, force: true });
                                            modalDiv.remove();
                                            return;
                                        }

                                        fs.promises.readFile(path.join(destinationFolder, 'manifest.json'), 'utf8')
                                            .then((json) => {
                                                realizarSiguientePaso(json);
                                            })
                                            .catch((err) => {
                                                console.error('Error al leer el archivo manifest.json:', err);
                                            });
                                    }
                                });

                                extractProcess.on('exit', (code) => {
                                    if (code !== 0) {
                                        reject(new Error('El proceso de extracción finalizó con errores.'));
                                    } else {
                                        resolve();
                                    }
                                });

                                extractProcess.on('error', (error) => {
                                    clearInterval(updateInterval);

                                    reject(error);
                                });
                            });

                            async function realizarSiguientePaso(manifestData) {
                                try {

                                    const manifestPath = path.join(destinationFolder, 'manifest.json');
                                    if (!fs.existsSync(manifestPath)) {
                                        new Alert().ShowAlert({
                                            icon: 'error',
                                            title: await window.getString('mods.theModpackIsNotCompatible') || 'El ModPack no es compatible',
                                            text: await window.getString('mods.theModpackIsNotCompatibleText') || 'Asegúrate de que sea de CurseForge o Modrinth',
                                        });
                                        await fsPromises.rm(destinationFolder, { recursive: true, force: true }).catch(() => { });
                                        modal.remove();
                                        return;
                                    }

                                    const manifest = JSON.parse(manifestData);

                                    if (!manifest.files || !Array.isArray(manifest.files)) {
                                        throw new Error('Manifest inválido: no contiene archivos');
                                    }

                                    if (!manifest.minecraft || !manifest.minecraft.version) {
                                        throw new Error('Manifest inválido: no contiene versión de Minecraft');
                                    }

                                    if (!manifest.minecraft.modLoaders || !Array.isArray(manifest.minecraft.modLoaders) || manifest.minecraft.modLoaders.length === 0) {
                                        throw new Error('Manifest inválido: no contiene información de loaders');
                                    }

                                    const { files, name, author, minecraft } = manifest;
                                    const description = author || 'Sin descripción';
                                    const version = minecraft.version;
                                    const loader_ = minecraft.modLoaders[0].id;

                                    const loader = loader_.startsWith('fabric') ? 'fabric' :
                                        loader_.startsWith('forge') ? 'forge' :
                                            loader_.startsWith('quilt') ? 'quilt' :
                                                loader_.startsWith('neoforge') ? 'neoforge' : null;

                                    if (!loader) {
                                        throw new Error(`Loader desconocido: ${loader_}`);
                                    }

                                    const loaderVersion = loader_.replace(`${loader}-`, '');

                                    try {
                                        const iconResponse = await fetch('https://battlylauncher.com/assets/img/mc-icon.png', { timeout: 5000 });
                                        if (iconResponse.ok) {
                                            const iconBuffer = await iconResponse.buffer();
                                            await fsPromises.writeFile(`${instanceFolder}/icon.png`, iconBuffer);
                                        }
                                    } catch (iconError) {
                                        console.warn('No se pudo descargar el icono, usando predeterminado:', iconError);
                                    }

                                    const instance = {
                                        name: name || 'ModPack sin nombre',
                                        description,
                                        version,
                                        image: `${instanceFolder}/icon.png`,
                                        id: randomString,
                                        loader,
                                        loaderVersion: loader_.startsWith('forge') ? `${version}-${loaderVersion}` : loaderVersion,
                                    };

                                    await fsPromises.writeFile(path.join(instanceFolder, 'instance.json'), JSON.stringify(instance, null, 2));

                                    const overridesFolder = path.join(destinationFolder, 'overrides');
                                    if (fs.existsSync(overridesFolder)) {
                                        try {
                                            await fsPromises.copy(overridesFolder, destinationFolder);
                                            await fsPromises.rm(overridesFolder, { recursive: true, force: true });
                                        } catch (overrideError) {
                                            console.warn('Error copiando overrides:', overrideError);
                                        }
                                    }

                                    extractingText.textContent = await window.getString('mods.installingModpack') || 'Instalando ModPack';

                                    console.log('[CURSEFORGE] Obteniendo información de', files.length, 'mods en batch');
                                    textArea.value += `\n🔍 Obteniendo información de ${files.length} mods...\n`;
                                    scrollTextArea();

                                    let modsInfo = {};
                                    try {

                                        const modIds = files.map(mod => mod.projectID);

                                        const batchResponse = await fetch(`${BATTLY_API_BASE}/curseforge/mods/batch`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ modIds })
                                        });

                                        if (batchResponse.ok) {
                                            const batchData = await batchResponse.json();
                                            if (batchData.success && batchData.data) {

                                                batchData.data.forEach(mod => {
                                                    modsInfo[mod.id] = mod;
                                                });
                                                console.log('[CURSEFORGE] Información batch obtenida:', Object.keys(modsInfo).length, 'mods');
                                            }
                                        }
                                    } catch (batchError) {
                                        console.warn('[CURSEFORGE] Error obteniendo batch, continuando con método individual:', batchError);
                                    }

                                    textArea.value += `✓ Información obtenida, iniciando descargas...\n`;
                                    scrollTextArea();

                                    progressBar.max = files.length;
                                    let totalFilesDownloaded = 0;
                                    const CONCURRENT_DOWNLOADS = 15;

                                    const downloadWithRetry = async (mod, retries = 3) => {
                                        for (let i = 0; i < retries; i++) {
                                            try {

                                                const fileInfoResponse = await fetch(`${BATTLY_API_BASE}/curseforge/mod/${mod.projectID}/file/${mod.fileID}`);

                                                if (!fileInfoResponse.ok) {
                                                    throw new Error(`Error HTTP: ${fileInfoResponse.status}`);
                                                }

                                                const fileInfoData = await fileInfoResponse.json();

                                                if (!fileInfoData.success) {
                                                    throw new Error(fileInfoData.error || 'Error al obtener información del archivo');
                                                }

                                                const fileInfo = fileInfoData.data.data;
                                                const downloadUrl = fileInfo.downloadUrl;
                                                const fileName = fileInfo.fileName;

                                                if (!downloadUrl) {
                                                    throw new Error('URL de descarga no disponible');
                                                }

                                                const modInfo = modsInfo[mod.projectID];
                                                const modName = modInfo?.name || `Mod ${mod.projectID}`;

                                                const destinationDir = fileName.endsWith('.jar')
                                                    ? modsFolder
                                                    : `${destinationFolder}/resourcepacks`;

                                                await fsPromises.mkdir(destinationDir, { recursive: true });

                                                const response = await fetch(downloadUrl, { redirect: 'follow' });
                                                if (!response.ok) throw new Error(`Error al descargar: ${response.status}`);

                                                const rutaArchivo = path.join(destinationDir, fileName);
                                                const fileStream = fs.createWriteStream(rutaArchivo);

                                                await new Promise((resolve, reject) => {
                                                    response.body.pipe(fileStream);
                                                    response.body.on('error', reject);
                                                    fileStream.on('finish', resolve);
                                                });

                                                totalFilesDownloaded++;
                                                progressBar.value = totalFilesDownloaded;

                                                if (totalFilesDownloaded % 10 === 0 || totalFilesDownloaded === files.length) {
                                                    textArea.value = `✓ Descargados: ${totalFilesDownloaded}/${files.length} mods\nÚltimo: ${modName}`;
                                                    scrollTextArea();
                                                }

                                                return;

                                            } catch (error) {
                                                console.error(`Intento ${i + 1} fallido para mod ${mod.projectID}:`, error.message);
                                                if (i === retries - 1) {
                                                    textArea.value += `\n⚠ Error descargando mod ${mod.projectID}: ${error.message}`;
                                                    scrollTextArea();
                                                }
                                                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                                            }
                                        }
                                    };

                                    const queue = [...files];
                                    const workers = [];

                                    for (let i = 0; i < CONCURRENT_DOWNLOADS; i++) {
                                        workers.push(
                                            (async () => {
                                                while (queue.length > 0) {
                                                    const mod = queue.shift();
                                                    if (mod) {
                                                        await downloadWithRetry(mod);
                                                    }
                                                }
                                            })()
                                        );
                                    }

                                    await Promise.all(workers);

                                    textArea.value = `✅ Completado!\n✓ Descargados: ${totalFilesDownloaded}/${files.length} mods`;
                                    scrollTextArea();

                                    modal.remove();
                                    ipcRenderer.send('new-notification', {
                                        title: await window.getString('mods.modpackInstalled') || 'ModPack instalado',
                                        body: `ModPack ${name} ${await window.getString('mods.modpackInstalledCorrectly') || 'instalado correctamente'}.`,
                                    });

                                    new Alert().ShowAlert({
                                        icon: 'success',
                                        title: await window.getString('mods.modpackInstalled') || 'ModPack instalado',
                                        text: `ModPack ${name} ${await window.getString('mods.modpackInstalledCorrectly') || 'instalado correctamente'}.`,
                                    });

                                } catch (error) {
                                    console.error('Error crítico en instalación de modpack:', error);
                                    modal.remove();

                                    try {
                                        await fsPromises.rm(destinationFolder, { recursive: true, force: true });
                                    } catch (cleanupError) {
                                        console.error('Error al limpiar carpeta:', cleanupError);
                                    }

                                    new Alert().ShowAlert({
                                        icon: 'error',
                                        title: await window.getString('mods.errorExtractingModpack') || 'Error al instalar modpack',
                                        text: error.message || (await window.getString('mods.errorExtractingModpackText')) || 'No se pudo instalar el modpack',
                                    });
                                }
                            }

                        } catch (error) {
                            console.error('Error al extraer el archivo ZIP:', error);
                            new Alert().ShowAlert({
                                icon: 'error',
                                title: await window.getString('mods.errorExtractingModpack') || 'Error al extraer modpack',
                                text: await window.getString('mods.errorExtractingModpackText') || 'No se pudo extraer el modpack',
                            });
                        }
                    } else if (tipoArchivo === 'mrpack') {

                        const fs = require('fs-extra');
                        const logFilePath = path.join(dataDirectory, '.battly', 'modrinth-install.log');

                        window.modrinthWriteLog = (message, data = null) => {
                            const timestamp = new Date().toISOString();
                            let logEntry = `[${timestamp}] ${message}`;

                            if (data) {
                                if (typeof data === 'object') {
                                    logEntry += '\n' + JSON.stringify(data, null, 2);
                                } else {
                                    logEntry += ' ' + data;
                                }
                            }

                            logEntry += '\n' + '-'.repeat(80) + '\n';

                            try {
                                fs.appendFileSync(logFilePath, logEntry);
                                console.log(message, data || '');
                            } catch (err) {
                                console.error('Error escribiendo log:', err);
                            }
                        };

                        const writeLog = window.modrinthWriteLog;

                        try {
                            fs.writeFileSync(logFilePath, `=== INICIO DE INSTALACIÓN MODRINTH ===\n=== ${new Date().toLocaleString()} ===\n\n`);
                            writeLog('[INFO] Archivo de log creado en: ' + logFilePath);
                            textArea.value += `📝 Log guardándose en:\n${logFilePath}\n\n`;
                            scrollTextArea();
                        } catch (err) {
                            console.error('Error creando archivo de log:', err);
                        }

                        const originalOnError = window.onerror;
                        const originalOnUnhandledRejection = window.onunhandledrejection;

                        window.onerror = function (message, source, lineno, colno, error) {
                            const errorData = {
                                message,
                                source,
                                lineno,
                                colno,
                                stack: error?.stack || 'No stack available'
                            };

                            writeLog('[ERROR GLOBAL] Error no manejado capturado:', errorData);

                            textArea.value += `\n❌ ERROR NO MANEJADO: ${message}\n`;
                            textArea.value += `  Archivo: ${source}:${lineno}:${colno}\n`;
                            textArea.value += `  Ver detalles en: ${logFilePath}\n`;
                            scrollTextArea();
                            return false;
                        };

                        window.onunhandledrejection = function (event) {
                            const errorData = {
                                reason: event.reason?.toString() || 'Unknown reason',
                                stack: event.reason?.stack || 'No stack available'
                            };

                            writeLog('[ERROR PROMISE] Promise rechazada no manejada:', errorData);

                            textArea.value += `\n❌ PROMESA RECHAZADA: ${event.reason}\n`;
                            textArea.value += `  Ver detalles en: ${logFilePath}\n`;
                            scrollTextArea();
                        };

                        try {
                            writeLog('[INICIO] ===== INSTALACIÓN DE MODPACK MODRINTH =====');

                            let randomString = Math.random().toString(36).substring(2, 8);
                            writeLog('[INFO] ID de instancia generado: ' + randomString);

                            if (!fs.existsSync(`${dataDirectory}/.battly/instances`)) {
                                fs.mkdirSync(`${dataDirectory}/.battly/instances`);
                                writeLog('[INFO] Carpeta instances creada');
                            }

                            if (!fs.existsSync(`${dataDirectory}/.battly/instances/${randomString}`)) {
                                fs.mkdirSync(`${dataDirectory}/.battly/instances/${randomString}`);
                            } else {

                                randomString = Math.random().toString(36).substring(2, 8);

                                fs.mkdirSync(`${dataDirectory}/.battly/instances/${randomString}`);
                                writeLog('[INFO] ID de instancia regenerado: ' + randomString);
                            }
                            const destinationFolder = `${dataDirectory}/.battly/instances/${randomString}`;
                            writeLog('[INFO] Carpeta de destino: ' + destinationFolder);

                            writeLog('[PASO 1] Creando carpeta de instancia: ' + destinationFolder);
                            fs.mkdirSync(`${dataDirectory}/.battly/instances/${randomString}`, {
                                recursive: true
                            });

                            if (!fs.existsSync(destinationFolder)) {
                                fs.mkdirSync(destinationFolder);
                            }

                            writeLog('[PASO 2] Extrayendo archivo .mrpack');
                            textArea.value = '📦 Extrayendo archivos del modpack...\n';
                            scrollTextArea();

                            try {
                                const zip = new AdmZip(destinationFile);
                                const zipEntries = zip.getEntries();
                                writeLog('[INFO] Total de entradas en ZIP: ' + zipEntries.length);

                                writeLog('[INFO] Extrayendo archivos manualmente (método seguro)...');

                                let extractedCount = 0;
                                for (const entry of zipEntries) {
                                    try {
                                        if (!entry.isDirectory) {
                                            const entryPath = path.join(destinationFolder, entry.entryName);
                                            const entryDir = path.dirname(entryPath);

                                            if (!fs.existsSync(entryDir)) {
                                                fs.mkdirSync(entryDir, { recursive: true });
                                            }

                                            zip.extractEntryTo(entry.entryName, entryDir, false, true);
                                            extractedCount++;

                                            if (extractedCount % 100 === 0) {
                                                writeLog(`[PROGRESO] Extraídos ${extractedCount}/${zipEntries.length} archivos`);
                                            }
                                        }
                                    } catch (entryError) {
                                        writeLog('[ADVERTENCIA] Error extrayendo: ' + entry.entryName, entryError.message);
                                    }
                                }

                                writeLog(`[COMPLETADO] Extracción completada: ${extractedCount} archivos extraídos`);
                            } catch (zipError) {
                                writeLog('[ERROR] Error crítico en extracción ZIP', {
                                    error: zipError.message,
                                    stack: zipError.stack
                                });
                                throw new Error(`Error extrayendo ZIP: ${zipError.message}`);
                            }

                            textArea.value += '✓ Extracción completada\n';
                            scrollTextArea();

                            writeLog('[PASO 3] Verificando manifest');
                            const manifestPath = path.join(destinationFolder, 'modrinth.index.json');
                            if (!fs.existsSync(manifestPath)) {
                                throw new Error('No se encontró modrinth.index.json en el modpack');
                            }

                            writeLog('[PASO 4] Leyendo manifest');
                            json = await fs.readFile(manifestPath, 'utf8');

                            let manifestData;
                            try {
                                manifestData = JSON.parse(json);
                                writeLog('[INFO] Manifest parseado correctamente', {
                                    name: manifestData.name,
                                    files: manifestData.files?.length || 0,
                                    dependencies: Object.keys(manifestData.dependencies || {})
                                });
                            } catch (parseError) {
                                throw new Error(`El manifest está corrupto: ${parseError.message}`);
                            }

                            writeLog('[PASO 5] Procesando overrides');
                            textArea.value += '📁 Procesando archivos adicionales (overrides)...\n';
                            scrollTextArea();

                            const overridesPath = path.join(destinationFolder, 'overrides');
                            writeLog('[INFO] Verificando overrides en: ' + overridesPath);

                            if (fs.existsSync(overridesPath)) {
                                try {
                                    writeLog('[INFO] Carpeta overrides encontrada, listando contenido...');

                                    const overridesContent = fs.readdirSync(overridesPath, { recursive: true });
                                    writeLog('[INFO] Total de archivos/carpetas en overrides: ' + overridesContent.length);

                                    if (overridesContent.length === 0) {
                                        writeLog('[INFO] La carpeta overrides está vacía, omitiendo (no se eliminará para evitar crashes)');
                                        textArea.value += '  → Carpeta overrides vacía, omitida\n';
                                        scrollTextArea();
                                    } else {

                                        const firstFiles = overridesContent.slice(0, 10);
                                        writeLog('[INFO] Primeros archivos', firstFiles);

                                        textArea.value += `  → Copiando ${overridesContent.length} archivos adicionales...\n`;
                                        scrollTextArea();

                                        try {
                                            fs.accessSync(destinationFolder, fs.constants.W_OK);
                                            writeLog('[INFO] Permisos de escritura verificados en destino');
                                        } catch (permError) {
                                            writeLog('[ERROR] Sin permisos de escritura', {
                                                path: destinationFolder,
                                                error: permError.message
                                            });
                                            throw new Error(`Sin permisos de escritura en ${destinationFolder}: ${permError.message}`);
                                        }

                                        writeLog('[INFO] Iniciando copia de overrides archivo por archivo (modo síncrono)...');
                                        let copiedFiles = 0;

                                        for (const item of overridesContent) {
                                            const sourcePath = path.join(overridesPath, item);
                                            const destPath = path.join(destinationFolder, item);

                                            try {

                                                if (fs.existsSync(sourcePath)) {
                                                    const stats = fs.statSync(sourcePath);

                                                    if (stats.isFile()) {

                                                        const destDir = path.dirname(destPath);
                                                        if (!fs.existsSync(destDir)) {
                                                            fs.mkdirSync(destDir, { recursive: true });
                                                        }

                                                        fs.copyFileSync(sourcePath, destPath);
                                                        copiedFiles++;

                                                        if (copiedFiles % 10 === 0) {
                                                            writeLog(`[PROGRESO] Copiados ${copiedFiles}/${overridesContent.length} archivos`);
                                                        }
                                                    }
                                                }
                                            } catch (copyError) {
                                                writeLog(`[ERROR] Error copiando archivo: ${item}`, {
                                                    source: sourcePath,
                                                    dest: destPath,
                                                    error: copyError.message,
                                                    code: copyError.code,
                                                    stack: copyError.stack
                                                });

                                            }
                                        }

                                        writeLog(`[COMPLETADO] Copia finalizada: ${copiedFiles} archivos copiados de ${overridesContent.length}`);
                                        textArea.value += `  → ${copiedFiles} archivos copiados exitosamente\n`;
                                        scrollTextArea();

                                        writeLog('[INFO] NO eliminando carpeta overrides - ya no es necesario, archivos copiados exitosamente');

                                        textArea.value += '✓ Archivos adicionales procesados\n';
                                        scrollTextArea();
                                    }

                                } catch (overrideError) {
                                    const errorDetails = {
                                        message: overrideError.message,
                                        stack: overrideError.stack,
                                        code: overrideError.code,
                                        path: overrideError.path,
                                        syscall: overrideError.syscall
                                    };

                                    writeLog('[ERROR CRÍTICO] Error en procesamiento de overrides', errorDetails);

                                    textArea.value += `⚠ Error procesando overrides: ${overrideError.message}\n`;
                                    if (overrideError.code) {
                                        textArea.value += `  Código: ${overrideError.code}\n`;
                                    }
                                    if (overrideError.path) {
                                        textArea.value += `  Archivo problemático: ${overrideError.path}\n`;
                                    }
                                    textArea.value += `  Ver detalles completos en: ${logFilePath}\n`;
                                    textArea.value += `  Continuando sin archivos adicionales...\n`;
                                    scrollTextArea();

                                    writeLog('[INFO] Omitiendo eliminación de overrides por error anterior');

                                    writeLog('[ADVERTENCIA] Continuando instalación sin overrides');
                                }
                            } else {
                                writeLog('[INFO] No se encontró carpeta overrides, continuando...');
                                textArea.value += '  → No hay archivos adicionales\n';
                                scrollTextArea();
                            }

                            writeLog('[PASO 6] Iniciando descarga de mods');
                            writeLog('[INFO] Llamando a descargarModModrinth', {
                                instanceId: randomString,
                                totalFiles: manifestData.files?.length || 0
                            });

                            extractingText.textContent = await window.getString('mods.installingModpack') || 'Instalando ModPack';
                            textArea.value += '\n🔄 Descargando archivos del modpack...\n';
                            scrollTextArea();

                            try {
                                await descargarModModrinth(manifestData, randomString);
                                writeLog('[ÉXITO] Descarga de mods completada');
                            } catch (downloadError) {
                                writeLog('[ERROR] Error en descarga de mods', {
                                    message: downloadError.message,
                                    stack: downloadError.stack
                                });
                                throw downloadError;

                            }

                            writeLog('[ÉXITO] ===== INSTALACIÓN COMPLETADA =====');

                        } catch (error) {
                            const errorDetails = {
                                message: error.message,
                                stack: error.stack,
                                name: error.name,
                                code: error.code,
                                syscall: error.syscall
                            };

                            writeLog('[ERROR FATAL] Error en instalación de modpack', errorDetails);

                            textArea.value += `\n\n❌ ERROR FATAL:\n${error.message}\n`;
                            textArea.value += `\n📝 Log completo guardado en:\n${logFilePath}\n`;
                            textArea.value += `\n⚠ Por favor, copia la ruta del log y revísalo para más detalles.\n`;
                            textArea.value += `\n💡 Puedes abrir el archivo en: ${logFilePath}\n`;
                            if (error.stack) {
                                textArea.value += `\nStack trace (resumido):\n${error.stack.substring(0, 500)}...\n`;
                            }
                            scrollTextArea();

                            try {
                                const { shell } = require('electron');

                                const logDirectory = path.dirname(logFilePath);
                                shell.showItemInFolder(logFilePath);
                                textArea.value += `\n📂 Carpeta de logs abierta en el explorador\n`;
                                scrollTextArea();
                            } catch (shellError) {
                                writeLog('[ERROR] No se pudo abrir el explorador de archivos', shellError.message);
                            }

                            await new Promise(resolve => setTimeout(resolve, 8000));

                            modal.remove();

                            new Alert().ShowAlert({
                                icon: 'error',
                                title: await window.getString('mods.errorExtractingModpack') || 'Error al instalar modpack',
                                text: `${error.message}\n\nLog completo: ${logFilePath}` || (await window.getString('mods.errorExtractingModpackText')) || 'No se pudo instalar el modpack de Modrinth'
                            });
                        } finally {

                            writeLog('[INFO] Restaurando handlers de error globales');
                            writeLog('[FIN] ===== FIN DEL LOG DE INSTALACIÓN =====');
                            window.onerror = originalOnError;
                            window.onunhandledrejection = originalOnUnhandledRejection;
                        }

                    } else {
                        new Alert().ShowAlert({
                            icon: 'error',
                            title: await window.getString('mods.theModpackIsNotCompatible') || 'El ModPack no es compatible',
                            text: await window.getString('mods.theModpackIsNotCompatibleText') || 'Asegúrate de que sea de CurseForge o Modrinth.'
                        })
                    }

                }
            });

        });
    }

    async Inicio() {

        let boton_mods = document.getElementById("boton_abrir_mods");
        boton_mods.addEventListener("click", () => {
            changePanel("mods");
        });

        let boton_volver = document.getElementById("volver");
        boton_volver.addEventListener("click", () => {
            changePanel("home");
        });

        if (!fs.existsSync(`${dataDirectory}/.battly/mods`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/mods`);
        }
    }

    async DescargarMod(modVersion, mod_data) {
        const fetch = require('node-fetch');
        const { pipeline } = require('stream');
        const { promisify } = require('util');
        const streamPipeline = promisify(pipeline);

        try {

            const downloadLink = modVersion?.files?.[0]?.url;
            const fileName = modVersion?.files?.[0]?.filename || `${mod_data?.id || 'archivo'}.bin`;
            const project_type = mod_data?.project_type;

            console.log(`El tipo de proyecto es: ${project_type}`);
            const nombre = mod_data?.title || mod_data?.name || mod_data?.slug || mod_data?.id || 'Recurso';

            const tDownloading = await window.getString('mods.downloadingMod') + '...' || 'Descargando...';
            const tErrDownloading = await window.getString('mods.errorDownloadingMod') || 'Error descargando';
            const tDownloadedOk = await window.getString('mods.modDownloadedSuccessfully') || 'descargado correctamente';

            if (!downloadLink) {
                new Alert().ShowAlert({
                    icon: 'error',
                    title: `${tErrDownloading} ${nombre}.`,
                    text: 'No se pudo determinar el enlace de descarga.'
                });
                return;
            }

            new Alert().ShowAlert({
                icon: 'info',
                title: tDownloading
            });

            const baseDir = path.join(dataDirectory, '.battly');
            const dirs = {
                mod: path.join(baseDir, 'mods'),
                resourcepack: path.join(baseDir, 'resourcepacks'),
                shader: path.join(baseDir, 'shaderpacks'),
                modpack: path.join(baseDir, 'temp')

            };

            if (project_type === 'mod' || project_type === 'resourcepack' || project_type === 'shader') {
                const outDir =
                    project_type === 'mod' ? dirs.mod :
                        project_type === 'resourcepack' ? dirs.resourcepack :
                            dirs.shader;

                await fs.promises.mkdir(outDir, { recursive: true });
                const outPath = path.join(outDir, fileName);

                const response = await fetch(downloadLink);
                if (!response.ok) throw new Error(`HTTP ${response.status} al descargar: ${downloadLink}`);

                await streamPipeline(response.body, fs.createWriteStream(outPath));

                new Alert().ShowAlert({
                    icon: 'success',
                    title: `${nombre} ${tDownloadedOk}.`
                });

            } else if (project_type === 'modpack') {
                console.log("Es un modpack");

                await fs.promises.mkdir(dirs.modpack, { recursive: true });
                const tempFilePath = path.join(dirs.modpack, fileName);

                const response = await fetch(downloadLink);
                if (!response.ok) throw new Error(`HTTP ${response.status} al descargar modpack: ${downloadLink}`);

                await streamPipeline(response.body, fs.createWriteStream(tempFilePath));

                await this.instalarModPackDesdeTemp(tempFilePath, fileName);

                new Alert().ShowAlert({
                    icon: 'success',
                    title: `${nombre} ${tDownloadedOk}.`
                });

            } else {

                await fs.promises.mkdir(dirs.modpack, { recursive: true });
                const tempFilePath = path.join(dirs.modpack, fileName);

                const response = await fetch(downloadLink);
                if (!response.ok) throw new Error(`HTTP ${response.status} al descargar (tipo desconocido): ${downloadLink}`);

                await streamPipeline(response.body, fs.createWriteStream(tempFilePath));

                new Alert().ShowAlert({
                    icon: 'warning',
                    title: `Descarga completada`,
                    text: `Tipo de proyecto desconocido (${project_type}). Archivo guardado en temp: ${fileName}`
                });
            }

            const deps = Array.isArray(modVersion?.dependencies) ? modVersion.dependencies : [];
            if (deps.length > 0) {
                await this.DescargarDependencias(deps, modVersion);
            }

        } catch (err) {
            const tErrDownloading = await window.getString('mods.errorDownloadingMod') || 'Error descargando';
            const nombre = mod_data?.title || mod_data?.name || mod_data?.slug || mod_data?.id || 'Recurso';

            new Alert().ShowAlert({
                icon: 'error',
                title: `${tErrDownloading} ${nombre}.`,
                text: String(err?.message || err)
            });
            console.error('[DescargarMod] Error:', err);
        }
    }


    async ObtenerMod(id) {
        const mod_data = await axios.get(`https://api.modrinth.com/v2/project/${id}/version`)
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                console.log(error);
            });
        return mod_data;
    }

    async instalarModPackDesdeTemp(tempFilePath, fileName) {
        const fsExtra = require('fs-extra');
        const fsPromises = fsExtra.promises;
        const path = require('path');
        const AdmZip = require('adm-zip');
        const { fork } = require('child_process');
        const fetch = require('node-fetch');
        const axios = require('axios');

        const BATTLY_API_BASE = 'https://api.battlylauncher.com';

        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal is-active';
        modalDiv.innerHTML = `
<div class="modal-background"></div>
<div class="modal-card">
  <header class="modal-card-head" style="background:#101726;">
    <p class="modal-card-title" style="color:#fff;">${await window.getString("mods.installingModpackCanTake2")}</p>
    <button class="delete" aria-label="close"></button>
  </header>
  <section class="modal-card-body" style="background:#101726; color:#fff;">
    <h3 id="inst-text">Extrayendo archivos...</h3>
    <progress id="inst-progress" class="progress is-info" value="0"></progress>
    <textarea id="inst-log" class="textarea" readonly
      style="margin-top:1rem; height:100px; background:#1E2A47; color:#fff; overflow-y:auto;"></textarea>
  </section>
</div>`;
        document.body.appendChild(modalDiv);
        const extractingText = modalDiv.querySelector('#inst-text');
        const progressBar = modalDiv.querySelector('#inst-progress');
        const textArea = modalDiv.querySelector('#inst-log');
        modalDiv.querySelector('.delete').onclick = () => modalDiv.remove();
        const scrollLog = () => { textArea.scrollTop = textArea.scrollHeight; };

        const randomId = Math.random().toString(36).substr(2, 8);
        const instancesDir = path.join(dataDirectory, '.battly', 'instances');
        const instanceFolder = path.join(instancesDir, randomId);
        const modsFolder = path.join(instanceFolder, 'mods');
        await fsPromises.mkdir(modsFolder, { recursive: true });

        if (fileName.endsWith('.zip')) {
            await new Promise((res, rej) => {
                const child = fork(path.join(__dirname, 'assets/js/utils/extractChild.js'), [
                    JSON.stringify({ destinationFile: tempFilePath, destinationFolder: instanceFolder })
                ]);
                let buffer = [];
                const timer = setInterval(() => {
                    if (buffer.length) {
                        textArea.value += buffer.join('\n') + '\n';
                        buffer = [];
                        scrollLog();
                    }
                }, 100);
                child.on('message', msg => {
                    if (msg.type === 'progress') buffer.push(`Extrayendo: ${msg.fileName}`);
                    if (msg.type === 'done') {
                        clearInterval(timer);
                        res();
                    }
                });
                child.on('error', rej);
                child.on('exit', code => code === 0 ? res() : rej(new Error('Extracción fallida')));
            });
        } else if (fileName.endsWith('.mrpack')) {
            const zip = new AdmZip(tempFilePath);
            zip.extractAllTo(instanceFolder, true);
        } else {
            modalDiv.remove();
            throw new Error('El archivo no es .zip ni .mrpack');
        }

        let manifest;
        let isModrinth = false;
        const manifestPath = path.join(instanceFolder, 'manifest.json');
        const indexPath = path.join(instanceFolder, 'modrinth.index.json');

        try {
            if (await fsExtra.pathExists(manifestPath)) {
                const manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
                manifest = JSON.parse(manifestContent);
            } else if (await fsExtra.pathExists(indexPath)) {
                const indexContent = await fsPromises.readFile(indexPath, 'utf8');
                manifest = JSON.parse(indexContent);
                isModrinth = true;
            } else {
                modalDiv.remove();
                await fsExtra.remove(instanceFolder);
                new Alert().ShowAlert({
                    icon: 'error',
                    title: await window.getString('mods.theModpackIsNotCompatible') || 'El ModPack no es compatible',
                    text: await window.getString('mods.theModpackIsNotCompatibleText') || 'Asegúrate de que sea de CurseForge o Modrinth.'
                });
                return;
            }
        } catch (parseError) {
            modalDiv.remove();
            await fsExtra.remove(instanceFolder);
            new Alert().ShowAlert({
                icon: 'error',
                title: 'Error al leer manifest',
                text: `El archivo manifest está corrupto: ${parseError.message}`
            });
            return;
        }

        try {
            const iconBuf = await (await fetch('https://battlylauncher.com/assets/img/mc-icon.png', { timeout: 5000 })).buffer();
            await fsPromises.writeFile(path.join(instanceFolder, 'icon.png'), iconBuf);
        } catch (iconError) {
            console.warn('No se pudo descargar el icono:', iconError);
        }

        const { name, author, minecraft, versionId, dependencies } = manifest;
        const packName = name || 'ModPack sin nombre';
        const packVersion = isModrinth
            ? (dependencies?.minecraft || 'Unknown')
            : ((minecraft && minecraft.version) || 'Unknown');
        const packDesc = author || 'Sin descripción';

        let loaderId;
        let loader;
        let loaderVer;

        try {
            if (isModrinth) {
                if (!dependencies) {
                    throw new Error('Manifest de Modrinth sin dependencias');
                }

                if (dependencies['fabric-loader']) {
                    loaderId = 'fabric-loader';
                    loader = 'fabric';
                    loaderVer = dependencies['fabric-loader'];
                } else if (dependencies['quilt-loader']) {
                    loaderId = 'quilt-loader';
                    loader = 'quilt';
                    loaderVer = dependencies['quilt-loader'];
                } else if (dependencies['forge']) {
                    loaderId = 'forge';
                    loader = 'forge';
                    loaderVer = dependencies['forge'];
                } else if (dependencies['neoforge']) {
                    loaderId = 'neoforge';
                    loader = 'neoforge';
                    loaderVer = dependencies['neoforge'];
                } else {
                    throw new Error('No se encontró un loader compatible en el manifest');
                }
            } else {

                if (!minecraft || !minecraft.modLoaders || !Array.isArray(minecraft.modLoaders) || minecraft.modLoaders.length === 0) {
                    throw new Error('Manifest de CurseForge sin información de loaders');
                }

                loaderId = minecraft.modLoaders[0].id;
                loader = loaderId.replace('-loader', '');

                if (loaderId.includes('fabric')) loader = 'fabric';
                else if (loaderId.includes('forge')) loader = 'forge';
                else if (loaderId.includes('quilt')) loader = 'quilt';
                else if (loaderId.includes('neoforge')) loader = 'neoforge';

                loaderVer = loaderId.replace(`${loader}-`, '');
            }
        } catch (loaderError) {
            modalDiv.remove();
            await fsExtra.remove(instanceFolder);
            new Alert().ShowAlert({
                icon: 'error',
                title: 'Error al detectar loader',
                text: loaderError.message
            });
            return;
        }

        const instanceData = {
            name: packName,
            description: packDesc,
            version: packVersion,
            image: path.join(instanceFolder, 'icon.png'),
            id: randomId,
            loader,
            loaderVersion: loader === 'forge'
                ? `${packVersion}-${loaderVer}`
                : loaderVer
        };

        await fsPromises.writeFile(
            path.join(instanceFolder, 'instance.json'),
            JSON.stringify(instanceData, null, 2)
        );

        const overridesSrc = path.join(instanceFolder, 'overrides');
        if (await fsExtra.pathExists(overridesSrc)) {
            try {
                await fsExtra.copy(overridesSrc, instanceFolder);
                await fsExtra.remove(overridesSrc);
            } catch (overrideError) {
                console.warn('Error copiando overrides:', overrideError);
            }
        }

        extractingText.textContent = await window.getString('mods.installingModpack') || 'Instalando ModPack';

        if (!manifest.files || !Array.isArray(manifest.files)) {
            modalDiv.remove();
            await fsExtra.remove(instanceFolder);
            new Alert().ShowAlert({
                icon: 'error',
                title: 'Manifest inválido',
                text: 'El modpack no contiene una lista de archivos válida'
            });
            return;
        }

        const files = manifest.files;
        progressBar.max = files.length;
        let completed = 0;

        async function descargarModModrinth(fileEntry, instanceId) {
            const basePath = path.join(dataDirectory, '.battly', 'instances', instanceId);

            if (!fileEntry.path) {
                console.warn('Archivo sin ruta:', fileEntry);
                return;
            }

            if (!fileEntry.downloads || !Array.isArray(fileEntry.downloads) || fileEntry.downloads.length === 0) {
                console.warn(`No hay URLs de descarga para ${fileEntry.path}`);
                return;
            }

            const destPath = path.join(basePath, fileEntry.path);

            try {
                await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
            } catch (mkdirError) {
                console.error(`Error creando directorio para ${fileEntry.path}:`, mkdirError);
                throw mkdirError;
            }

            for (let i = 0; i < fileEntry.downloads.length; i++) {
                const url = fileEntry.downloads[i];
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 45000);

                    const resp = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeout);

                    if (!resp.ok) {
                        throw new Error(`HTTP ${resp.status}`);
                    }

                    const ws = fsExtra.createWriteStream(destPath);
                    await new Promise((res, rej) => {
                        resp.body.pipe(ws);
                        resp.body.on('error', rej);
                        ws.on('finish', res);
                        ws.on('error', rej);
                    });

                    return;

                } catch (downloadError) {
                    console.error(`Error descargando ${fileEntry.path} (intento ${i + 1}/${fileEntry.downloads.length}):`, downloadError.message);

                    if (i === fileEntry.downloads.length - 1) {

                        throw new Error(`No se pudo descargar ${fileEntry.path} después de ${fileEntry.downloads.length} intentos`);
                    }

                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        if (isModrinth) {
            const CONCURRENT_DOWNLOADS = 15;
            let lastUpdate = Date.now();
            const UPDATE_INTERVAL = 500;
            let failed = 0;

            const queue = [...files];
            const workers = [];

            for (let i = 0; i < CONCURRENT_DOWNLOADS; i++) {
                workers.push(
                    (async () => {
                        while (queue.length > 0) {
                            const fileEntry = queue.shift();
                            if (fileEntry) {
                                try {
                                    await descargarModModrinth(fileEntry, randomId);
                                    completed++;
                                    progressBar.value = completed;

                                    const now = Date.now();
                                    if (now - lastUpdate > UPDATE_INTERVAL) {
                                        const percentage = ((completed / files.length) * 100).toFixed(1);
                                        textArea.value = `✓ Descargados: ${completed}/${files.length} (${percentage}%)\n⚠ Errores: ${failed}\n📦 Último: ${path.basename(fileEntry.path)}`;
                                        scrollLog();
                                        lastUpdate = now;
                                    }
                                } catch (e) {
                                    console.error('Error Modrinth:', e);
                                    failed++;
                                }
                            }
                        }
                    })()
                );
            }

            await Promise.all(workers);
            textArea.value = `✅ Completado!\n✓ Descargados: ${completed}/${files.length}\n⚠ Errores: ${failed}`;
            scrollLog();
        } else {

            for (let m of files) {
                try {

                    const infoResponse = await fetch(`${BATTLY_API_BASE}/curseforge/mod/${m.projectID}/file/${m.fileID}`);

                    if (!infoResponse.ok) {
                        throw new Error(`HTTP ${infoResponse.status}`);
                    }

                    const infoData = await infoResponse.json();

                    if (!infoData.success) {
                        throw new Error(infoData.error || 'Error al obtener datos del archivo');
                    }

                    const info = infoData.data;
                    const downloadUrl = info.data.downloadUrl;
                    const fileName = info.data.fileName;

                    if (!downloadUrl) {
                        throw new Error('URL de descarga no disponible');
                    }

                    const destDir = fileName.endsWith('.jar')
                        ? modsFolder
                        : path.join(instanceFolder, 'resourcepacks');
                    await fsPromises.mkdir(destDir, { recursive: true });

                    const resp = await fetch(downloadUrl, { redirect: 'follow' });
                    if (!resp.ok) {
                        throw new Error(`Error descargando: HTTP ${resp.status}`);
                    }

                    const ws = fsExtra.createWriteStream(path.join(destDir, fileName));
                    await new Promise((res, rej) => {
                        resp.body.pipe(ws);
                        resp.body.on('error', rej);
                        ws.on('finish', res);
                    });
                } catch (e) {
                    console.error('Error CurseForge:', e);
                }
                completed++;
                progressBar.value = completed;
                textArea.value += `\n(${completed}/${files.length}) ${await window.getString('mods.installingMod') || 'Instalando mod'} ${m.projectID}`;
                scrollLog();
            }
        }

        modalDiv.remove();
        ipcRenderer.send('new-notification', {
            title: await window.getString('mods.modpackInstalled') || 'ModPack instalado',
            body: await window.getString('mods.modpackInstalledCorrectly') || 'instalado correctamente'
        });
        new Alert().ShowAlert({
            icon: 'success',
            title: await window.getString('mods.modpackInstalled') || 'ModPack instalado',
            text: await window.getString('mods.modpackInstalledCorrectly') || 'instalado correctamente'
        });
    }




    async ObtenerModData(id) {
        const mod_data = await axios.get(`https://api.modrinth.com/v2/project/${id}`)
            .then(r => r.data)
            .catch(err => { console.log(err); return null; });
        return mod_data;
    }

    async ObtenerVersionPorId(versionId) {
        try {
            const r = await fetch(`https://api.modrinth.com/v2/version/${versionId}`, {
                headers: { 'User-Agent': 'BattlyLauncher/1.0' }
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return await r.json();
        } catch (e) {
            console.error('ObtenerVersionPorId error', e);
            return null;
        }
    }

    async DescargarDependencias(dependencies, parentVersion, visited = new Set(), reporter = null) {
        const fetch = require('node-fetch');
        const { pipeline } = require('stream');
        const { promisify } = require('util');
        const streamPipeline = promisify(pipeline);
        const fs = require('fs');
        const path = require('path');

        const tErr = await window.getString('mods.errorDownloadingDependency') || 'Error descargando dependencia';
        const tDep = await window.getString('mods.dependency') || 'Dependencia';

        const desiredGameVersions = Array.isArray(parentVersion?.game_versions) ? parentVersion.game_versions : [];
        const desiredLoaders = Array.isArray(parentVersion?.loaders) ? parentVersion.loaders : [];

        const modsDir = path.join(dataDirectory, '.battly', 'mods');
        await fs.promises.mkdir(modsDir, { recursive: true });

        const fetchJson = async (url) => {
            const r = await fetch(url, { headers: { 'User-Agent': 'BattlyLauncher/1.0' } });
            if (!r.ok) throw new Error(`HTTP ${r.status} @ ${url}`);
            return r.json();
        };

        const intersects = (a = [], b = []) => a.some(v => b.includes(v));
        const rankVersionType = (t) => (t === 'release' ? 3 : t === 'beta' ? 2 : t === 'alpha' ? 1 : 0);

        const pickBestVersion = (list, wantGames, wantLoaders) => {
            const filtered = list.filter(v =>
                (!wantGames.length || intersects(v.game_versions || [], wantGames)) &&
                (!wantLoaders.length || intersects(v.loaders || [], wantLoaders))
            );
            if (!filtered.length) return null;
            filtered.sort((a, b) => {
                const byType = rankVersionType(b.version_type) - rankVersionType(a.version_type);
                if (byType !== 0) return byType;
                const da = new Date(a.date_published).getTime() || 0;
                const db = new Date(b.date_published).getTime() || 0;
                return db - da;
            });
            return filtered[0];
        };

        const primaryFile = (version) => {
            if (!version?.files?.length) return null;

            const jar = version.files.find(f => (f.url || '').toLowerCase().endsWith('.jar'));
            return jar || version.files.find(f => f.primary) || version.files[0];
        };

        const results = [];

        for (const depRef of (dependencies || [])) {
            const key = depRef.version_id || depRef.project_id || JSON.stringify(depRef);
            if (visited.has(key)) continue;
            visited.add(key);

            try {
                let depVersion;

                if (depRef.version_id) {
                    depVersion = await fetchJson(`https://api.modrinth.com/v2/version/${depRef.version_id}`);
                } else if (depRef.project_id) {
                    const versions = await fetchJson(`https://api.modrinth.com/v2/project/${depRef.project_id}/version`);
                    depVersion = pickBestVersion(versions, desiredGameVersions, desiredLoaders) || versions[0];
                } else {
                    throw new Error('Referencia de dependencia sin project_id ni version_id.');
                }

                if (!depVersion) throw new Error('No se encontró versión compatible para la dependencia.');

                const depName =
                    depVersion?.name ||
                    depVersion?.version_number ||
                    depRef.project_id ||
                    tDep;

                reporter?.onDependency?.(depName);

                const file = primaryFile(depVersion);
                if (!file?.url) throw new Error('Archivo de dependencia no disponible.');

                const filename = file.filename || (new URL(file.url).pathname.split('/').pop());
                const outPath = path.join(modsDir, filename);

                if (fs.existsSync(outPath)) {
                    results.push({ name: depName, filename, path: outPath, status: 'exists' });
                } else {
                    const res = await fetch(file.url);
                    if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${file.url}`);
                    await streamPipeline(res.body, fs.createWriteStream(outPath));
                    results.push({ name: depName, filename, path: outPath, status: 'downloaded' });
                }

                const subDeps = Array.isArray(depVersion?.dependencies) ? depVersion.dependencies : [];
                if (subDeps.length > 0) {
                    const subResults = await this.DescargarDependencias(subDeps, depVersion, visited, reporter);
                    results.push(...subResults);
                }

            } catch (err) {
                console.error('[DescargarDependencias] Error con', depRef, err);
                new Alert().ShowAlert({
                    icon: 'error',
                    title: `${tErr}: ${depRef.project_id || depRef.version_id || await window.getString("mods.unknown2")}`,
                    text: String(err?.message || err)
                });
            }
        }

        return results;
    }

    async ShowPanelInfo(id) {

        let loadingModal = document.createElement("div");
        loadingModal.classList.add("modal", "is-active");
        loadingModal.style.justifyContent = "center";
        loadingModal.style.flexWrap = "nowrap";
        loadingModal.style.flexDirection = "row";
        loadingModal.innerHTML = `
  <div class="modal-background"></div>
  <div class="main-mod-panel modal-animated loading-panel">
    <div class="mod-card">
      <div class="media">
        <div class="media-left">
          <figure class="image" style="background-color:#111827;border-radius:10px;border:1px solid #1c1c1c;width:120px;height:120px;"></figure>
        </div>
        <div class="media-content mod-data-info-content">
          <p class="title is-3" style="font-weight:700;"></p>
          <p class="subtitle" style="font-size:15px;font-weight:500;"></p>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <button class="button is-danger"><span class="icon"><i class="fa fa-solid fa-close"></i></span></button>
          <button class="button is-warning"><span class="icon"><i class="fa fa-solid fa-info"></i></span></button>
          <button class="button is-info"><span class="icon"><i class="fa fa-solid fa-download"></i></span></button>
        </div>
      </div>
    </div>
    <div class="mod-card mod-data-description" style="margin-top:20px;">
      <p></p><p></p><p></p><p></p>
    </div>
  </div>`;
        document.body.appendChild(loadingModal);

        const mod_data = await this.ObtenerModData(id);

        const mod_data_downloads = await this.ObtenerMod(id);

        loadingModal.remove();

        let modalDiv = document.createElement("div");
        modalDiv.classList.add("modal", "is-active");
        modalDiv.style.justifyContent = "center";
        modalDiv.style.flexWrap = "nowrap";
        modalDiv.style.flexDirection = "row";
        modalDiv.innerHTML = `
  <div class="modal-background"></div>
  <div class="main-mod-panel">
    <div class="mod-card">
      <div class="media">
        <div class="media-left">
          <figure class="image" style="background-color:#111827;border-radius:10px;border:1px solid #1c1c1c;width:120px;height:120px;">
            <img src="${mod_data?.icon_url ? mod_data.icon_url : "assets/images/pregunta.png"}" alt="Image" style="border-radius:10px;">
          </figure>
        </div>
        <div class="media-content mod-data-info-content">
          <p class="title is-3" style="font-weight:700;">${mod_data?.title || ''}</p>
          <div class="subtitle" style="font-size:15px;font-weight:500;">
            <span id="mod-short-description">${mod_data?.description || ''}</span>
            <br>
            <div class="stats">
              <span class="a-tag"><i class="fa fa-solid fa-download"></i> ${mod_data?.downloads ?? 0}</span>
              <span class="a-tag"><i class="fa fa-solid fa-heart"></i> ${mod_data?.followers ?? 0}</span>
              <span class="a-tag"><i class="fa fa-solid fa-cube"></i>
                ${(mod_data?.loaders || []).map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}
              </span>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <button class="button is-danger"><span class="icon"><i class="fa fa-solid fa-close"></i></span></button>
          <button class="button is-warning" onclick="window.open('https://modrinth.com/mod/${mod_data?.id}', '_blank');">
            <span class="icon"><i class="fa fa-solid fa-info"></i></span>
          </button>
          <button class="button is-info"><span class="icon"><i class="fa fa-solid fa-download"></i></span></button>
        </div>
      </div>
    </div>
    <div class="mod-card mod-data-description" style="margin-top:20px;">
      ${marked.parse(mod_data?.body || '')}
    </div>
  </div>`;
        document.body.appendChild(modalDiv);

        const closeBtn = modalDiv.querySelector(".is-danger");
        const downloadBtn = modalDiv.querySelector(".is-info");

        closeBtn.addEventListener("click", () => {
            modalDiv.querySelector(".main-mod-panel").classList.remove("modal-animated");
            setTimeout(() => modalDiv.querySelector(".main-mod-panel").classList.add("modal-animated-reverse"), 100);
            setTimeout(() => modalDiv.remove(), 400);
        });

        const rankVersionType = (t) => (t === 'release' ? 3 : t === 'beta' ? 2 : t === 'alpha' ? 1 : 0);
        const pickBestVersion = (list) => {
            const copy = [...list];
            copy.sort((a, b) => {
                const byType = rankVersionType(b.version_type) - rankVersionType(a.version_type);
                if (byType !== 0) return byType;
                const da = new Date(a.date_published).getTime() || 0;
                const db = new Date(b.date_published).getTime() || 0;
                return db - da;
            });
            return copy[0] || null;
        };
        const unique = (arr) => Array.from(new Set(arr));
        const parseMc = (s) => (s || '').split('.').map(n => parseInt(n, 10));
        const cmpMcDesc = (a, b) => {
            const aa = parseMc(a), bb = parseMc(b);
            for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
                const av = aa[i] ?? 0, bv = bb[i] ?? 0;
                if (av !== bv) return bv - av;
            }
            return 0;
        };

        const resolveInstallTarget = (projectType) => {
            const base = path.join(dataDirectory, '.battly');
            const map = {
                mod: { dir: path.join(base, 'mods'), prefer: ['.jar'], allowDeps: true },
                shader: { dir: path.join(base, 'shaderpacks'), prefer: ['.zip'], allowDeps: false },
                resourcepack: { dir: path.join(base, 'resourcepacks'), prefer: ['.zip'], allowDeps: false },
                datapack: { dir: path.join(base, 'datapacks'), prefer: ['.zip'], allowDeps: false },
                modpack: { dir: path.join(base, 'temp'), prefer: ['.mrpack'], allowDeps: false },
            };
            return map[(projectType || 'mod').toLowerCase()] || map.mod;
        };

        const pickBestFile = (versionObj, preferredExts = ['.jar']) => {
            const files = Array.isArray(versionObj?.files) ? versionObj.files : [];
            if (!files.length) throw new Error('Versión sin archivos');
            for (const ext of preferredExts) {
                const hit = files.find(f => (f.filename || '').toLowerCase().endsWith(ext));
                if (hit) return { url: hit.url, filename: hit.filename || new URL(hit.url).pathname.split('/').pop() };
            }
            const primary = files.find(f => f.primary);
            if (primary) return { url: primary.url, filename: primary.filename || new URL(primary.url).pathname.split('/').pop() };
            const f0 = files[0];
            return { url: f0.url, filename: f0.filename || new URL(f0.url).pathname.split('/').pop() };
        };

        const downloadModWithReporting = async (chosenVersion, modData, loader, mcVersion, reporter) => {
            const self = this;

            const projectType = (modData?.project_type || 'mod').toLowerCase();
            const { dir: installDir, prefer: preferredExts, allowDeps } = resolveInstallTarget(projectType);
            if (!fs.existsSync(installDir)) fs.mkdirSync(installDir, { recursive: true });

            const saveFromUrl = async (url, filename, destDir) => {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
                const ab = await res.arrayBuffer();
                const buf = Buffer.from(ab);
                const outPath = path.join(destDir, filename);
                await fs.promises.writeFile(outPath, buf);
                return outPath;
            };

            const downloaded = [];
            const dependencies = [];

            reporter?.onStatus?.(modData?.title || 'archivo');
            const mainFile = pickBestFile(chosenVersion, preferredExts);
            if (!mainFile?.url) throw new Error('Archivo principal no disponible');
            const mainPath = await saveFromUrl(mainFile.url, mainFile.filename, installDir);
            downloaded.push({ name: modData?.title || mainFile.filename, path: mainPath });

            if (allowDeps) {
                const deps = (chosenVersion?.dependencies || [])
                    .filter(d => (d.dependency_type || '').toLowerCase() !== 'incompatible');

                for (const dep of deps) {
                    try {
                        const depProjId = dep.project_id;
                        const depName = dep.name || depProjId || 'Dependencia';
                        reporter?.onDependency?.(depName);

                        let depVersionObj = null;
                        if (dep.version_id) {
                            depVersionObj = await self.ObtenerVersionPorId(dep.version_id);
                        } else if (depProjId) {
                            const depVersions = await self.ObtenerMod(depProjId);
                            const pickCompatibleVersion = (versions) => {
                                const list = (versions || []).filter(v => {
                                    const okLoader = Array.isArray(v.loaders) ? v.loaders.includes(loader) : true;
                                    const okMc = Array.isArray(v.game_versions) ? v.game_versions.includes(mcVersion) : true;
                                    return okLoader && okMc;
                                });
                                if (!list.length) return null;
                                list.sort((a, b) => {
                                    const t = (x) => (x.version_type === 'release' ? 3 : x.version_type === 'beta' ? 2 : x.version_type === 'alpha' ? 1 : 0);
                                    const byType = t(b) - t(a);
                                    if (byType !== 0) return byType;
                                    const da = new Date(a.date_published).getTime() || 0;
                                    const db = new Date(b.date_published).getTime() || 0;
                                    return db - da;
                                });
                                return list[0];
                            };
                            depVersionObj = pickCompatibleVersion(depVersions);
                        }
                        if (!depVersionObj) continue;

                        const modsDir = resolveInstallTarget('mod').dir;
                        if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir, { recursive: true });

                        const depFile = pickBestFile(depVersionObj, ['.jar']);
                        if (!depFile?.url) continue;

                        const depOut = await saveFromUrl(depFile.url, depFile.filename, modsDir);
                        dependencies.push({ name: depName, path: depOut });
                    } catch (e) {
                        console.error('Fallo descargando dependencia', dep, e);
                    }
                }
            }

            reporter?.onDone?.('Descarga completada');
            return { downloaded, dependencies, installDir };
        };

        downloadBtn.addEventListener("click", async () => {
            const modalDownloadMod = document.createElement("div");
            modalDownloadMod.classList.add("modal", "is-active");

            let loaderInputs = '';
            (mod_data.loaders || []).forEach((loader, index) => {
                loaderInputs += `
      <label class="b-mods-radio">
        <input type="radio" name="radio_loader" ${index === 0 ? 'checked' : ''}/>
        <span class="b-mods-name">${loader.charAt(0).toUpperCase() + loader.slice(1)}</span>
      </label>`;
            });

            modalDownloadMod.innerHTML = `
    <div class="modal-background"></div>
    <div class="modal-card modal-animated">
      <section class="modal-card-body download-mod-modal-card-body">
        <h1 class="h1-download-mod-title">Descargar ${mod_data.title}</h1>
        <hr>
        <p class="p-download-mod-text">1) Elige el Loader</p>
        <div class="b-mods-radio-inputs">${loaderInputs}</div>
        <br>
        <p class="p-download-mod-text">2) Elige la versión de Minecraft</p>
        <div class="select is-info is-outlined" style="width:100%;margin-bottom:.5rem;">
          <select id="select-mc" style="width:100%;"></select>
        </div>
        <p class="p-download-mod-text">3) Elige la versión del mod</p>
        <div class="select is-info is-outlined" style="width:100%;">
          <select id="select-modver" style="width:100%;"></select>
        </div>
        <br><br>
        <div class="dowmload-mod-modal-buttons">
          <button class="button is-danger is-outlined">Cancelar</button>
          <button class="button is-info is-outlined" disabled>Descargar</button>
        </div>
      </section>
    </div>`;
            document.body.appendChild(modalDownloadMod);

            const btnCancel = modalDownloadMod.querySelector(".button.is-danger");
            const btnDownload = modalDownloadMod.querySelector(".button.is-info");
            const selectMc = modalDownloadMod.querySelector("#select-mc");
            const selectModVer = modalDownloadMod.querySelector("#select-modver");
            const loaderInputsEls = modalDownloadMod.querySelectorAll(".b-mods-radio-inputs input");

            let selectedLoader = loaderInputsEls[0]?.nextElementSibling?.innerText?.toLowerCase() || '';
            let selectedMc = null;
            let selectedModVersionId = null;

            const getVersionsBy = (loader, mcVersion) => {
                return (mod_data_downloads || []).filter(v => {
                    const okLoader = v.loaders?.includes(loader);
                    const okMc = mcVersion ? (v.game_versions || []).includes(mcVersion) : true;
                    return okLoader && okMc;
                });
            };

            const buildMcOptions = async (loader) => {
                const mcs = [];
                for (const v of (mod_data_downloads || [])) {
                    if (v.loaders?.includes(loader)) for (const gv of (v.game_versions || [])) mcs.push(gv);
                }
                const uniqMcs = unique(mcs).sort(cmpMcDesc);
                selectMc.innerHTML = [
                    `<option value="">${await window.getString('mods.chooseMinecraftVersion')}</option>`,
                    ...uniqMcs.map(mc => `<option value="${mc}">${mc}</option>`)
                ].join('');
                selectModVer.innerHTML = `<option value="">${await window.getString('mods.chooseModVersion')}</option>`;
                btnDownload.disabled = true;
                selectedMc = null;
                selectedModVersionId = null;
            };

            const buildModVersionOptions = async (loader, mcVersion) => {
                const list = getVersionsBy(loader, mcVersion);
                if (!list.length) {
                    selectModVer.innerHTML = `<option value="">No hay versiones compatibles</option>`;
                    btnDownload.disabled = true;
                    selectedModVersionId = null;
                    return;
                }
                const ordered = [...list].sort((a, b) => {
                    const byType = rankVersionType(b.version_type) - rankVersionType(a.version_type);
                    if (byType !== 0) return byType;
                    const da = new Date(a.date_published).getTime() || 0;
                    const db = new Date(b.date_published).getTime() || 0;
                    return db - da;
                });
                selectModVer.innerHTML = [
                    `<option value="">${await window.getString('mods.chooseModVersion')}</option>`,
                    `<option value="__latest__">Última compatible (recomendada)</option>`,
                    ...ordered.map(v => `<option value="${v.id}">${v.version_number}</option>`)
                ].join('');
                btnDownload.disabled = true;
                selectedModVersionId = null;
            };

            await buildMcOptions(selectedLoader);

            loaderInputsEls.forEach(input => {
                input.addEventListener("change", async () => {
                    selectedLoader = input.nextElementSibling.innerText.toLowerCase();
                    await buildMcOptions(selectedLoader);
                });
            });

            selectMc.addEventListener("change", async () => {
                selectedMc = selectMc.value || null;
                await buildModVersionOptions(selectedLoader, selectedMc);
            });

            selectModVer.addEventListener("change", () => {
                selectedModVersionId = selectModVer.value || null;
                btnDownload.disabled = !(selectedLoader && selectedMc && selectedModVersionId);
            });

            btnCancel.addEventListener("click", () => {
                modalDownloadMod.querySelector(".modal-card").classList.remove("modal-animated");
                setTimeout(() => modalDownloadMod.querySelector(".modal-card").classList.add("modal-animated-reverse"), 100);
                setTimeout(() => modalDownloadMod.remove(), 400);
            });

            btnDownload.addEventListener("click", async () => {

                if (mod_data.project_type === "modpack") {
                    try {
                        modalDownloadMod.remove();
                        modalDiv.remove();

                        const waiting = document.createElement("div");
                        waiting.classList.add("modal", "is-active");
                        waiting.innerHTML = `
          <div class="modal-background"></div>
          <div class="modal-card modal-animated">
            <section class="modal-card-body" style="text-align:center;">
              <h1 class="h1-download-mod-title" style="font-weight:700;">${await window.getString('mods.downloading') || 'Descargando'}</h1>
              <br><div class="loader"></div>
              <p id="download-status" style="margin-top:10px;font-size:12px;opacity:.85;">
                Preparando descarga de ${mod_data.title}…
              </p>
            </section>
          </div>`;
                        document.body.appendChild(waiting);
                        const statusEl = waiting.querySelector("#download-status");

                        const candidates = (mod_data_downloads || []).filter(v =>
                            (v.files || []).some(f => (f.filename || '').toLowerCase().endsWith('.mrpack'))
                        );
                        const chosen = pickBestVersion(candidates);
                        if (!chosen) throw new Error('No se encontró ninguna versión .mrpack para este modpack.');

                        const mrFile = (chosen.files || []).find(f => (f.filename || '').toLowerCase().endsWith('.mrpack')) || chosen.files?.[0];
                        const fileUrl = mrFile?.url;
                        const fileName = mrFile?.filename || `battly-${mod_data.id}.mrpack`;
                        if (!fileUrl) throw new Error('No se pudo resolver la URL del archivo .mrpack');

                        const tempDir = path.join(dataDirectory, '.battly', 'temp');
                        const downloadPath = path.join(tempDir, fileName);
                        await fs.promises.mkdir(tempDir, { recursive: true });

                        statusEl.textContent = `Descargando ${fileName}…`;
                        const resp = await fetch(fileUrl);
                        if (!resp.ok) throw new Error(`HTTP ${resp.status} al descargar ${fileUrl}`);
                        const ab = await resp.arrayBuffer();
                        await fs.promises.writeFile(downloadPath, Buffer.from(ab));

                        waiting.querySelector(".modal-card").classList.remove("modal-animated");
                        setTimeout(() => waiting.querySelector(".modal-card").classList.add("modal-animated-reverse"), 100);
                        setTimeout(() => waiting.remove(), 400);

                        await this.instalarModPackDesdeTemp(downloadPath, fileName);
                    } catch (e) {
                        console.error(e);
                        new Alert().ShowAlert({ icon: 'error', title: await window.getString("mods.errorDownloadingModpack"), text: String(e?.message || e) });
                    }
                    return;
                }

                if (!(selectedLoader && selectedMc && selectedModVersionId)) return;

                const compatibles = getVersionsBy(selectedLoader, selectedMc);
                let chosenVersion = null;
                if (selectedModVersionId === "__latest__") chosenVersion = pickBestVersion(compatibles);
                else chosenVersion = (compatibles || []).find(v => v.id === selectedModVersionId) || null;

                if (!chosenVersion) {
                    new Alert().ShowAlert({
                        icon: 'error',
                        title: 'No se pudo resolver la versión seleccionada',
                        text: 'Prueba con otra combinación de loader/versión de Minecraft.'
                    });
                    return;
                }

                modalDownloadMod.remove();
                modalDiv.remove();

                const downloadingModal = document.createElement("div");
                downloadingModal.classList.add("modal", "is-active");
                downloadingModal.innerHTML = `
      <div class="modal-background"></div>
      <div class="modal-card modal-animated">
        <section class="modal-card-body downloading-mod-modal-card-body" style="text-align:center;">
          <h1 class="h1-download-mod-title" style="font-weight:700;">${await window.getString('mods.downloading') || 'Descargando'}</h1>
          <br><div class="loader"></div>
          <p id="download-status" style="margin-top:10px;font-size:12px;opacity:.85;">
            Descargando ${mod_data.title}…
          </p>
        </section>
      </div>`;
                document.body.appendChild(downloadingModal);
                const statusEl = downloadingModal.querySelector("#download-status");

                const reporter = {
                    setStatus: (text) => { if (statusEl) statusEl.textContent = text; },
                    onStatus: (name) => { if (statusEl) statusEl.textContent = `Descargando ${name}…`; },
                    onDependency: (depName) => { if (statusEl) statusEl.textContent = `Descargando dependencia ${depName}…`; },
                    onDone: (summary) => { if (statusEl) statusEl.textContent = summary; }
                };

                try {
                    const result = await downloadModWithReporting(chosenVersion, mod_data, selectedLoader, selectedMc, reporter);
                    const depCount = result.dependencies?.length || 0;
                    const title = depCount > 0
                        ? (await window.getString('mods.modAndDepsDownloaded') || 'Mod y dependencias descargadas')
                        : (await window.getString('mods.modDownloaded') || 'Descarga completada');
                    new Alert().ShowAlert({
                        icon: 'success',
                        title,
                        text: (depCount > 0)
                            ? `Mod ${mod_data.title} y ${depCount} dependencia${depCount === 1 ? '' : 's'} descargado${depCount === 1 ? '' : 's'} correctamente`
                            : `Mod ${mod_data.title} descargado correctamente`
                    });

                    downloadingModal.querySelector(".modal-card").classList.remove("modal-animated");
                    setTimeout(() => downloadingModal.querySelector(".modal-card").classList.add("modal-animated-reverse"), 100);
                    setTimeout(() => downloadingModal.remove(), 400);
                } catch (e) {
                    reporter.setStatus(await window.getString('mods.downloadError') || 'Error en la descarga');
                    new Alert().ShowAlert({ icon: 'error', title: await window.getString('mods.downloadError') || 'Error en la descarga', text: String(e?.message || e) });
                    setTimeout(() => downloadingModal.remove(), 1200);
                }
            });
        });
    }

    async downloadModWithReporting(chosenVersion, modData, loader, mcVersion, reporter) {
        const fs = require('fs');
        const path = require('path');

        const modsDir = `${dataDirectory}/.battly/mods`;
        if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir, { recursive: true });

        const saveFromUrl = async (url, filename) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
            const ab = await res.arrayBuffer();
            const buf = Buffer.from(ab);
            const outPath = path.join(modsDir, filename);
            fs.writeFileSync(outPath, buf);
            return outPath;
        };

        const pickFile = (versionObj) => {
            const files = versionObj.files || [];
            const jar = files.find(f => (f.url || '').toLowerCase().endsWith('.jar')) || files.find(f => f.primary) || files[0];
            if (!jar) throw new Error('Versión sin archivos');
            const name = jar.filename || (new URL(jar.url).pathname.split('/').pop());
            return { url: jar.url, filename: name };
        };

        const pickCompatibleVersion = (versions) => {
            const list = (versions || []).filter(v => {
                const okLoader = v.loaders?.includes(loader);
                const okMc = (v.game_versions || []).includes(mcVersion);
                return okLoader && okMc;
            });
            if (!list.length) return null;
            list.sort((a, b) => {
                const t = (x) => (x.version_type === 'release' ? 3 : x.version_type === 'beta' ? 2 : x.version_type === 'alpha' ? 1 : 0);
                const byType = t(b) - t(a);
                if (byType !== 0) return byType;
                const da = new Date(a.date_published).getTime() || 0;
                const db = new Date(b.date_published).getTime() || 0;
                return db - da;
            });
            return list[0];
        };

        const downloaded = [];
        const dependencies = [];

        const mainFile = pickFile(chosenVersion);
        reporter?.onStatus?.(modData.title);
        const mainPath = await saveFromUrl(mainFile.url, mainFile.filename);
        downloaded.push({ name: modData.title, path: mainPath });

        const deps = (chosenVersion.dependencies || []).filter(d => (d.dependency_type || '').toLowerCase() !== 'incompatible');
        for (const dep of deps) {
            try {
                const depProjId = dep.project_id;
                const depName = dep.name || depProjId || 'Dependencia';
                reporter?.onDependency?.(depName);

                let depVersionObj = null;

                if (dep.version_id) {
                    const depVersion = await this.ObtenerVersionPorId(dep.version_id);
                    depVersionObj = depVersion;
                } else if (depProjId) {
                    const depVersions = await this.ObtenerMod(depProjId);

                    depVersionObj = pickCompatibleVersion(depVersions);
                }

                if (!depVersionObj) continue;

                const { url, filename } = pickFile(depVersionObj);
                const depPath = await saveFromUrl(url, filename);
                dependencies.push({ name: depName, path: depPath });
            } catch (e) {
                console.error('Fallo descargando dependencia', dep, e);
            }
        }

        reporter?.onDone?.('Descarga completada');
        return { downloaded, dependencies };
    }
}

export default Mods;
