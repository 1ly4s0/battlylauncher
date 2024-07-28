'use strict';

import {
    database,
    changePanel,
    addAccount,
    accountSelect
} from '../utils.js';
const {
    ipcRenderer
} = require('electron');
const axios = require('axios');
const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const toml = require('toml');
const { shell } = require('electron');

const Swal = require('./assets/js/libs/sweetalert/sweetalert2.all.min.js');
const preloadContent = document.querySelector('.preload-content');

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
})
let lang;
import { Lang } from "../utils/lang.js";
import { Alert } from "../utils/alert.js";

class Mods {
    static id = "mods";


    async init(config) {
        this.config = config
        this.database = await new database().init();
        lang = await new Lang().GetLang();
        this.Inicio();
        this.BuscarMods();
        this.InsalarModPack();
        this.GetLocalMods();
    }

    async GetLocalMods() {
        let thisss = this;

        document.getElementById("select-type-of-search-mods").addEventListener("change", async () => {
            let typeOfSearch = document.getElementById("select-type-of-search-mods").value;

            const type = {
                mod: "Mods",
                resourcepack: "ResourcePacks",
                shader: "Shaders",
            }
            document.getElementById("battlymodstext").innerHTML = type[typeOfSearch];

            thisss.CargarMods(0, typeOfSearch);
        });

        let modsBtn = document.getElementById("button_ver_mods");

        modsBtn.addEventListener("click", async () => {
            // Crear el elemento modal
            const modal = document.createElement('div');
            modal.classList.add('modal', 'is-active');
            modal.style.zIndex = '9999';

            // Crear el fondo del modal
            const modalBackground = document.createElement('div');
            modalBackground.classList.add('modal-background');

            // Crear el div del contenido del modal
            const modalCard = document.createElement('div');
            modalCard.classList.add('modal-card');
            modalCard.style.backgroundColor = '#212121';

            // Crear el encabezado del modal
            const modalHeader = document.createElement('header');
            modalHeader.classList.add('modal-card-head');
            modalHeader.style.backgroundColor = '#212121';

            const modalTitle = document.createElement('p');
            modalTitle.classList.add('modal-card-title');
            modalTitle.style.color = '#fff';
            modalTitle.innerHTML = '<i class="fa-solid fa-puzzle"></i> ' + lang.mods;

            const closeBtn = document.createElement('button');
            closeBtn.classList.add('delete');
            closeBtn.setAttribute('aria-label', 'close');

            closeBtn.addEventListener('click', () => {
                modal.remove();
            });

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeBtn);

            // Crear la sección del cuerpo del modal
            const modalBody = document.createElement('section');
            modalBody.classList.add('modal-card-body');
            modalBody.style.backgroundColor = '#212121';
            modalBody.style.color = '#fff';

            const bodyText = document.createElement('p');
            bodyText.innerHTML = lang.welcome_mods;

            const lineBreak = document.createElement('br');
            const lineBreak2 = document.createElement('br');

            modalBody.appendChild(bodyText);
            modalBody.appendChild(lineBreak);

            modal.appendChild(modalBackground);
            modal.appendChild(modalCard);
            modalCard.appendChild(modalHeader);
            modalCard.appendChild(modalBody);


            // Crear la primera tarjeta

            //obtener todas las carpetas que hay en la carpeta de instancias
            let mods;
            const modsDirectory = `${dataDirectory}/.battly/mods`;

            if (!fs.existsSync(modsDirectory)) {
                fs.mkdirSync(modsDirectory);
            }

            mods = await fs.readdirSync(modsDirectory)
                .filter(file => path.extname(file) === '.jar' || path.extname(file) === '.disabledmod')
                .map(file => path.join(modsDirectory, file));
            let modsArray = [];
            if (mods.length > 0) {
                for (let i = 0; i < mods.length; i++) {
                    try {
                        const zip = await unzipper.Open.file(mods[i]);

                        const manifestEntry = zip.files.find(entry =>
                            entry.path.toLowerCase().endsWith('mods.toml')
                        );

                        const FabricManifestEntry = zip.files.find(entry =>
                            entry.path.toLowerCase().endsWith('fabric.mod.json')
                        );

                        const QuiltManifestEntry = zip.files.find(entry =>
                            entry.path.toLowerCase().endsWith('quilt.mod.json')
                        );

                        if (manifestEntry) {
                            const manifestContent = await manifestEntry.buffer();
                            const manifestString = manifestContent.toString('utf8');

                            try {
                                const tomlData = toml.parse(manifestString);

                                if (tomlData.mods && Array.isArray(tomlData.mods) && tomlData.mods.length > 0) {
                                    const modInfo = tomlData.mods[0];

                                    let modObject = {
                                        name: modInfo.displayName || '',
                                        version: modInfo.version || '',
                                        description: modInfo.description || '',
                                    };

                                    modsArray.push(modObject);


                                    // Crear el header de la primera tarjeta

                                    const card1 = document.createElement('div');
                                    card1.classList.add('card');
                                    card1.style.marginBottom = '10px';
                                    card1.style.color = '#fff !important';
                                    card1.style.backgroundColor = '#323232';
                                    card1.id = mods[i];

                                    card1.innerHTML = `
   <header class="card-header is-flex">
      <p class="card-header-title" style="
         color: #fff;
         ">${modObject.name}</p>
      <div class="buttons buttons-no-margin" style="margin-right: 10px;">
      ${mods[i].endsWith('.disabledmod') ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>'}
                    <i class="fa-solid fa-folder-open"></i>
                    <i class="fa-solid fa-trash"></i>
                    <i class="fa-solid fa-angle-down"></i>
      </div>
   </header>
   <div class="card-content" id="content" style="display: none; padding-top: 15px;
    padding-bottom: 15px;">
      <div class="content" style="margin-left: -5px; font-family: Poppins; font-weight: 700; color: #fff;">${modObject.description}</div>
   </div>
                                    `;


                                    modalBody.appendChild(card1);

                                    const openButton = card1.querySelector('.buttons-no-margin').children[3];
                                    const deleteButton = card1.querySelector('.buttons-no-margin').children[2];
                                    const playButton = card1.querySelector('.buttons-no-margin').children[1];
                                    const deactivateButton = card1.querySelector('.buttons-no-margin').children[0];
                                    const cardContent1 = card1.querySelector('.card-content');

                                    deactivateButton.addEventListener('click', () => {
                                        if (mods[i].endsWith('.disabledmod')) {
                                            const modPath = mods[i].replace(/\//g, '\\');
                                            const enabledModPath = modPath.replace('.disabledmod', '.jar');
                                            fs.renameSync(modPath, enabledModPath);

                                            deactivateButton.classList.remove('fa-eye');
                                            deactivateButton.classList.add('fa-eye-slash');

                                            new Alert().ShowAlert({
                                                icon: 'success',
                                                title: lang.mod_activated,
                                            });
                                        } else {
                                            const modPath = mods[i].replace(/\//g, '\\');
                                            const disabledModPath = modPath.replace('.jar', '.disabledmod');
                                            fs.renameSync(modPath, disabledModPath);

                                            deactivateButton.classList.remove('fa-eye-slash');
                                            deactivateButton.classList.add('fa-eye');

                                            new Alert().ShowAlert({
                                                icon: 'success',
                                                title: lang.mod_deactivated,
                                            });
                                        }
                                    });

                                    openButton.addEventListener('click', () => {
                                        if (cardContent1.style.display === 'none') {
                                            cardContent1.style.display = 'flex';
                                            openButton.classList.remove('fa-angle-down');
                                            openButton.classList.add('fa-angle-up');
                                        } else {
                                            cardContent1.style.display = 'none';
                                            openButton.classList.remove('fa-angle-up');
                                            openButton.classList.add('fa-angle-down');
                                        }
                                    });

                                    playButton.addEventListener('click', () => {
                                        console.log('Abriendo la carpeta del mod...');
                                        try {
                                            console.log('Abriendo la carpeta del mod...');
                                            let modPath = mods[i].replace(/\//g, '\\');
                                            console.log(modPath);
                                            shell.showItemInFolder(`${modPath}`);
                                        } catch (error) {
                                            console.error('Error al abrir el gestor de archivos:', error);
                                        }
                                    });



                                    deleteButton.addEventListener('click', () => {
                                        Swal.fire({
                                            title: lang.are_you_sure,
                                            text: lang.are_you_sure_text,
                                            showCancelButton: true,
                                            confirmButtonColor: '#f14668',
                                            cancelButtonColor: '#3e8ed0',
                                            confirmButtonText: lang.yes_delete,
                                            cancelButtonText: lang.no_cancel,
                                        }).then((result) => {
                                            if (result.isConfirmed) {
                                                card1.remove();
                                                lineBreak3.remove();
                                                fs.unlinkSync(mods[i]);
                                                new Alert().ShowAlert({
                                                    icon: 'success',
                                                    title: lang.mod_deleted_correctly,
                                                });
                                            }
                                        });
                                    });

                                    closeBtn.addEventListener('click', () => {
                                        modal.remove();
                                    });



                                } else {
                                    console.log("No se ha encontrado el archivo manifest.json");
                                }
                            } catch (error) {
                                console.log(error);
                            }
                        } else if (FabricManifestEntry) {
                            const manifestContent = await FabricManifestEntry.buffer();
                            const manifestString = manifestContent.toString('utf8');
                            const manifest = JSON.parse(manifestString);

                            let modObject = {
                                name: manifest.name || '',
                                version: manifest.version || '',
                                description: manifest.description || '',
                            };

                            modsArray.push(modObject);

                            // Crear el header de la primera tarjeta

                            const card1 = document.createElement('div');
                            card1.classList.add('card');
                            card1.style.marginBottom = '10px';
                            card1.style.color = '#fff !important';
                            card1.style.backgroundColor = '#323232';
                            card1.id = mods[i];

                            card1.innerHTML = `
   <header class="card-header is-flex">
      <p class="card-header-title" style="
         color: #fff;
         ">${modObject.name}</p>
      <div class="buttons buttons-no-margin" style="margin-right: 10px;">
      ${mods[i].endsWith('.disabledmod') ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>'}
                    <i class="fa-solid fa-folder-open"></i>
                    <i class="fa-solid fa-trash"></i>
                    <i class="fa-solid fa-angle-down"></i>
      </div>
   </header>
   <div class="card-content" id="content" style="display: none; padding-top: 15px;
    padding-bottom: 15px;">
      <div class="content" style="margin-left: -5px; font-family: Poppins; font-weight: 700; color: #fff;">${modObject.description}</div>
   </div>
                                    `;


                            modalBody.appendChild(card1);

                            const openButton = card1.querySelector('.buttons-no-margin').children[3];
                            const deleteButton = card1.querySelector('.buttons-no-margin').children[2];
                            const playButton = card1.querySelector('.buttons-no-margin').children[1];
                            const deactivateButton = card1.querySelector('.buttons-no-margin').children[0];
                            const cardContent1 = card1.querySelector('.card-content');

                            deactivateButton.addEventListener('click', () => {
                                if (mods[i].endsWith('.disabledmod')) {
                                    const modPath = mods[i].replace(/\//g, '\\');
                                    const enabledModPath = modPath.replace('.disabledmod', '.jar');
                                    fs.renameSync(modPath, enabledModPath);

                                    deactivateButton.classList.remove('fa-eye');
                                    deactivateButton.classList.add('fa-eye-slash');

                                    new Alert().ShowAlert({
                                        icon: 'success',
                                        title: lang.mod_activated,
                                    });
                                } else {
                                    const modPath = mods[i].replace(/\//g, '\\');
                                    const disabledModPath = modPath.replace('.jar', '.disabledmod');
                                    fs.renameSync(modPath, disabledModPath);

                                    deactivateButton.classList.remove('fa-eye-slash');
                                    deactivateButton.classList.add('fa-eye');

                                    new Alert().ShowAlert({
                                        icon: 'success',
                                        title: lang.mod_deactivated,
                                    });
                                }
                            });

                            openButton.addEventListener('click', () => {
                                if (cardContent1.style.display === 'none') {
                                    cardContent1.style.display = 'flex';
                                    openButton.classList.remove('fa-angle-down');
                                    openButton.classList.add('fa-angle-up');
                                } else {
                                    cardContent1.style.display = 'none';
                                    openButton.classList.remove('fa-angle-up');
                                    openButton.classList.add('fa-angle-down');
                                }
                            });

                            playButton.addEventListener('click', () => {
                                console.log('Abriendo la carpeta del mod...');
                                try {
                                    console.log('Abriendo la carpeta del mod...');
                                    let modPath = mods[i].replace(/\//g, '\\');
                                    console.log(modPath);
                                    shell.showItemInFolder(`${modPath}`);
                                } catch (error) {
                                    console.error('Error al abrir el gestor de archivos:', error);
                                }
                            });

                            deleteButton.addEventListener('click', () => {
                                //eliminar el card, y eliminar la carpeta de la instancia
                                Swal.fire({
                                    title: lang.are_you_sure,
                                    text: lang.are_you_sure_text,
                                    showCancelButton: true,
                                    confirmButtonColor: '#f14668',
                                    cancelButtonColor: '#3e8ed0',
                                    confirmButtonText: lang.yes_delete,
                                    cancelButtonText: lang.no_cancel,
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        card1.remove();
                                        lineBreak3.remove();
                                        fs.unlinkSync(mods[i]);
                                        new Alert().ShowAlert({
                                            icon: 'success',
                                            title: lang.mod_deleted_correctly,
                                        });
                                    }
                                });
                            });

                            closeBtn.addEventListener('click', () => {
                                modal.remove();
                            });

                        } else if (QuiltManifestEntry) {
                            const manifestContent = await QuiltManifestEntry.buffer();
                            const manifestString = manifestContent.toString('utf8');
                            const manifest = JSON.parse(manifestString);

                            let modObject = {
                                name: manifest.quilt_loader.metadata.name || '',
                                version: manifest.quilt_loader.version || '',
                                description: manifest.quilt_loader.metadata.description || '',
                            };

                            modsArray.push(modObject);


                            const card1 = document.createElement('div');
                            card1.classList.add('card');
                            card1.style.marginBottom = '10px';
                            card1.style.color = '#fff !important';
                            card1.style.backgroundColor = '#323232';
                            card1.id = mods[i];

                            card1.innerHTML = `
   <header class="card-header is-flex">
      <p class="card-header-title" style="
         color: #fff;
         ">${modObject.name}</p>
      <div class="buttons buttons-no-margin" style="margin-right: 10px;">
      ${mods[i].endsWith('.disabledmod') ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>'}
                    <i class="fa-solid fa-folder-open"></i>
                    <i class="fa-solid fa-trash"></i>
                    <i class="fa-solid fa-angle-down"></i>
      </div>
   </header>
   <div class="card-content" id="content" style="display: none; padding-top: 15px;
    padding-bottom: 15px;">
      <div class="content" style="margin-left: -5px; font-family: Poppins; font-weight: 700; color: #fff;">${modObject.description}</div>
   </div>
                                    `;


                            modalBody.appendChild(card1);

                            const openButton = card1.querySelector('.buttons-no-margin').children[3];
                            const deleteButton = card1.querySelector('.buttons-no-margin').children[2];
                            const playButton = card1.querySelector('.buttons-no-margin').children[1];
                            const deactivateButton = card1.querySelector('.buttons-no-margin').children[0];
                            const cardContent1 = card1.querySelector('.card-content');

                            deactivateButton.addEventListener('click', () => {
                                if (mods[i].endsWith('.disabledmod')) {
                                    const modPath = mods[i].replace(/\//g, '\\');
                                    const enabledModPath = modPath.replace('.disabledmod', '.jar');
                                    fs.renameSync(modPath, enabledModPath);

                                    deactivateButton.classList.remove('fa-eye');
                                    deactivateButton.classList.add('fa-eye-slash');

                                    new Alert().ShowAlert({
                                        icon: 'success',
                                        title: lang.mod_activated,
                                    });
                                } else {
                                    const modPath = mods[i].replace(/\//g, '\\');
                                    const disabledModPath = modPath.replace('.jar', '.disabledmod');
                                    fs.renameSync(modPath, disabledModPath);

                                    deactivateButton.classList.remove('fa-eye-slash');
                                    deactivateButton.classList.add('fa-eye');

                                    new Alert().ShowAlert({
                                        icon: 'success',
                                        title: lang.mod_deactivated,
                                    });
                                }
                            });

                            openButton.addEventListener('click', () => {
                                if (cardContent1.style.display === 'none') {
                                    cardContent1.style.display = 'flex';
                                    openButton.classList.remove('fa-angle-down');
                                    openButton.classList.add('fa-angle-up');
                                } else {
                                    cardContent1.style.display = 'none';
                                    openButton.classList.remove('fa-angle-up');
                                    openButton.classList.add('fa-angle-down');
                                }
                            });

                            playButton.addEventListener('click', () => {
                                console.log('Abriendo la carpeta del mod...');
                                try {
                                    console.log('Abriendo la carpeta del mod...');
                                    let modPath = mods[i].replace(/\//g, '\\');
                                    console.log(modPath);
                                    shell.showItemInFolder(`${modPath}`);
                                } catch (error) {
                                    console.error('Error al abrir el gestor de archivos:', error);
                                }
                            });

                            deleteButton.addEventListener('click', () => {
                                //eliminar el card, y eliminar la carpeta de la instancia
                                Swal.fire({
                                    title: lang.are_you_sure,
                                    text: lang.are_you_sure_text,
                                    showCancelButton: true,
                                    confirmButtonColor: '#f14668',
                                    cancelButtonColor: '#3e8ed0',
                                    confirmButtonText: lang.yes_delete,
                                    cancelButtonText: lang.no_cancel,
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        card1.remove();
                                        lineBreak3.remove();
                                        fs.unlinkSync(mods[i]);
                                        new Alert().ShowAlert({
                                            icon: 'success',
                                            title: lang.mod_deleted_correctly,
                                        });
                                    }
                                });
                            });

                            closeBtn.addEventListener('click', () => {
                                modal.remove();
                            });
                        } else {
                            console.log("No se ha encontrado el archivo manifest.json");
                        }

                    } catch (error) {
                        console.log(error);
                    }
                    document.body.appendChild(modal);

                }
            }
        });
    }


    async InsalarModPack() {
        let btnInstalarModPack = document.getElementById("button_instalar_modpack");

        btnInstalarModPack.addEventListener("click", async () => {
            // Crear el elemento div con la clase "modal is-active"
            const modalDiv = document.createElement("div");
            modalDiv.className = "modal is-active";
            modalDiv.style.zIndex = "9999";

            // Crear el elemento div con la clase "modal-background" y añadirlo como hijo de modalDiv
            const modalBackgroundDiv = document.createElement("div");
            modalBackgroundDiv.className = "modal-background";
            modalDiv.appendChild(modalBackgroundDiv);

            // Crear el elemento div con la clase "modal-card" y añadirlo como hijo de modalDiv
            const modalCardDiv = document.createElement("div");
            modalCardDiv.className = "modal-card";
            modalDiv.appendChild(modalCardDiv);

            // Crear el elemento header con la clase "modal-card-head" y añadirlo como hijo de modalCardDiv
            const headerDiv = document.createElement("header");
            headerDiv.className = "modal-card-head";
            modalCardDiv.appendChild(headerDiv);

            // Crear el elemento p con la clase "modal-card-title" y añadirlo como hijo de headerDiv
            const titleP = document.createElement("p");
            titleP.className = "modal-card-title";
            titleP.textContent = lang.install_modpack_text;
            titleP.style.color = "#fff";
            headerDiv.appendChild(titleP);

            // Crear el botón para cerrar el modal y añadirlo como hijo de headerDiv
            const closeButton = document.createElement("button");
            closeButton.className = "delete";
            closeButton.setAttribute("aria-label", "close");
            headerDiv.appendChild(closeButton);

            // Crear el elemento section con la clase "modal-card-body" y añadirlo como hijo de modalCardDiv
            const bodySection = document.createElement("section");
            bodySection.className = "modal-card-body";
            modalCardDiv.appendChild(bodySection);

            // Crear el elemento p con el texto y añadirlo como hijo de bodySection
            const textP = document.createElement("p");
            textP.textContent = lang.compatible_with_curseforge_or_modrinth
            textP.style.color = "#fff";
            bodySection.appendChild(textP);

            // Crear el elemento div con las clases "file is-small is-boxed has-name" y estilos, y añadirlo como hijo de bodySection
            const fileDiv = document.createElement("div");
            fileDiv.className = "file is-small is-boxed has-name";
            fileDiv.style.alignItems = "center";
            bodySection.appendChild(fileDiv);

            // Crear el elemento label con la clase "file-label" y añadirlo como hijo de fileDiv
            const fileLabel = document.createElement("label");
            fileLabel.className = "file-label";
            fileDiv.appendChild(fileLabel);

            // Crear el elemento input con la clase "file-input" y atributo tipo "file" y añadirlo como hijo de fileLabel
            const fileInput = document.createElement("input");
            fileInput.className = "file-input";
            fileInput.setAttribute("type", "file");
            fileInput.setAttribute("name", "resume");
            fileInput.setAttribute("accept", ".zip, .mrpack"); // Establece las extensiones permitidas
            fileLabel.appendChild(fileInput);

            // Crear el elemento span con la clase "file-cta" y añadirlo como hijo de fileLabel
            const fileCtaSpan = document.createElement("span");
            fileCtaSpan.className = "file-cta";
            fileLabel.appendChild(fileCtaSpan);

            // Crear el elemento span con la clase "file-icon" y añadirlo como hijo de fileCtaSpan
            const fileIconSpan = document.createElement("span");
            fileIconSpan.className = "file-icon";
            fileCtaSpan.appendChild(fileIconSpan);

            // Crear el icono dentro de fileIconSpan
            const fileIcon = document.createElement("i");
            fileIcon.className = "fas fa-upload";
            fileIconSpan.appendChild(fileIcon);

            // Crear el elemento span con la clase "file-label" y añadirlo como hijo de fileCtaSpan
            const fileLabelSpan = document.createElement("span");
            fileLabelSpan.className = "file-label";
            fileLabelSpan.textContent = lang.select_a_file;
            fileLabelSpan.style.fontSize = "10px";
            fileCtaSpan.appendChild(fileLabelSpan);

            // Crear el elemento span con la clase "file-name" y estilos, y añadirlo como hijo de fileLabel
            const fileNameSpan = document.createElement("span");
            fileNameSpan.className = "file-name";
            fileNameSpan.style.textAlign = "center";
            fileNameSpan.textContent = "ZIP/MRPACK";
            fileNameSpan.style.color = "#fff";
            fileLabel.appendChild(fileNameSpan);

            // Crear el elemento footer con la clase "modal-card-foot" y añadirlo como hijo de modalCardDiv
            const footerDiv = document.createElement("footer");
            footerDiv.className = "modal-card-foot";
            modalCardDiv.appendChild(footerDiv);

            // Crear el botón "Instalar" y añadirlo como hijo de footerDiv
            const installButton = document.createElement("button");
            installButton.className = "button is-info is-outlined";
            installButton.textContent = lang.install;
            footerDiv.appendChild(installButton);

            // Crear el botón "Cancelar" y añadirlo como hijo de footerDiv
            const cancelButton = document.createElement("button");
            cancelButton.className = "button is-outlined is-white";
            cancelButton.textContent = lang.cancel;
            footerDiv.appendChild(cancelButton);

            // Agregar modalDiv al documento como último hijo del body
            document.body.appendChild(modalDiv);


            let installationStarted = false;
            closeButton.addEventListener("click", () => {
                modalDiv.remove();

                if (installationStarted) {
                    new Alert().ShowAlert({
                        icon: 'info',
                        title: lang.the_installation_is_in_2nd_plan,
                        text: lang.the_installation_is_in_2nd_plan_text
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
                }
            });

            installButton.addEventListener("click", async () => {

                if (fileInput.files.length == 0) {
                    new Alert().ShowAlert({
                        icon: 'error',
                        title: lang.you_didnt_selected_any_file
                    })
                } else {

                    footerDiv.remove();

                    installationStarted = true;

                    const file = fileInput.files[0];

                    /* eliminar el bodySection */
                    bodySection.remove();

                    /* crear el nuevo bodySection */
                    const bodySection2 = document.createElement("section");
                    bodySection2.className = "modal-card-body";
                    modalCardDiv.appendChild(bodySection2);

                    /* añadir esto:
                    
                          <p><i class="fa-solid fa-spinner fa-spin-pulse"></i> Instalando ModPack... Puede tardar...</p>
                          <progress class="progress is-info" value="45" max="100"></progress>
                    */

                    const textP2 = document.createElement("p");
                    textP2.innerHTML = `<span><i class="fa-solid fa-spinner fa-spin-pulse"></i> ${lang.installing_modpack_can_take}</span>`;
                    textP2.style.color = "#fff";
                    bodySection2.appendChild(textP2);

                    const progress = document.createElement("progress");
                    progress.className = "progress is-info";
                    progress.value = "0";
                    progress.max = "100";
                    bodySection2.appendChild(progress);

                    /* eliminar el footerDiv */
                    footerDiv.remove();

                    /* crear el nuevo footerDiv */
                    const footerDiv2 = document.createElement("footer");
                    footerDiv2.className = "modal-card-foot";
                    modalCardDiv.appendChild(footerDiv2);


                    const fs = require('fs-extra');
                    const fetch = require('node-fetch');
                    const path = require('path');

                    // Reemplaza con la ruta real de tu archivo manifest.json
                    const apiKey = '$2a$10$S7nVFhQKpxteK4Fwf9yoxejmI.NjJiE53Qh4IeaDbIu/./oTM/MKa'; // Reemplaza con tu clave API de CurseForge




                    async function descargarModModrinth(archivo, randomString) {

                        let name = archivo.name;
                        let description = archivo.summary ? archivo.summary : lang.no_description;
                        let version = archivo.dependencies.minecraft;
                        let loader;
                        let loaderVersion;
                        let loader_ = archivo.dependencies["fabric-loader"];
                        let loader_forge = archivo.dependencies["forge"];

                        if (loader_) {
                            loader = "fabric";
                            loaderVersion = loader_;
                        } else if (loader_forge) {
                            loader = "forge";
                            loader_ = archivo.dependencies["forge"];
                            loaderVersion = loader_;
                        } else {
                            loader = "quilt";
                            loader_ = archivo.dependencies["quilt-loader"];
                            loaderVersion = loader_;
                        }



                        if (name && description && version && loader && loaderVersion) {
                            fetch("https://battlylauncher.com/assets/img/mc-icon.png")
                                .then((res) => res.buffer())
                                .then((buffer) => {
                                    fs.writeFileSync(
                                        `${dataDirectory}/.battly/instances/${randomString}/icon.png`,
                                        buffer
                                    );
                                });


                            let instance = {
                                name: name,
                                description: description,
                                version: version,
                                image: `${dataDirectory}/.battly/instances/${randomString}/icon.png`,
                                id: randomString,
                                loader: loader,
                                loaderVersion: loaderVersion,
                            };

                            let instance_json = JSON.stringify(instance);
                            fs.writeFileSync(
                                path.join(
                                    `${dataDirectory}/.battly/instances/${randomString}`,
                                    "instance.json"
                                ),
                                instance_json
                            );


                            let files = [];
                            let totalFiles = archivo.files.length;
                            let totalFilesDownloaded = 0;

                            let percent = 0;
                            progress.max = totalFiles;


                            for (let i = 0; i < archivo.files.length; i++) {
                                const file = archivo.files[i];
                                let path = file.path;
                                let fileSize = file.fileSize;
                                let downloads = file.downloads;

                                //crear las carpetas necesarias
                                let carpetas = path.split("/");
                                let carpetas2 = carpetas.slice(0, carpetas.length - 1);
                                let carpetas3 = carpetas2.join("/");
                                let carpetas4 = `${dataDirectory}/.battly/instances/${randomString}/${carpetas3}`;
                                if (!fs.existsSync(carpetas4)) {
                                    fs.mkdirSync(carpetas4, {
                                        recursive: true,
                                    });
                                }

                                for (let fileDownload of downloads) {
                                    await fetch(fileDownload).then((res) => {
                                        const dest = fs.createWriteStream(`${dataDirectory}/.battly/instances/${randomString}/${path}`);
                                        res.body.pipe(dest);
                                        totalFilesDownloaded++;
                                        progress.value = totalFilesDownloaded;

                                        textP2.innerHTML = `<i class="fa-solid fa-spinner fa-spin-pulse"></i>${lang.installing_modpack_can_take}<br><br>${lang.installing_file} ${path} (${totalFilesDownloaded} / ${totalFiles})`;
                                        textP2.style.color = "#fff";
                                        if (totalFilesDownloaded == totalFiles) {
                                            modalDiv.remove();

                                            ipcRenderer.send("new-notification", {
                                                title: lang.modpack_installed,
                                                body: `ModPack ${name} ${lang.modpack_installed_correctly}.`
                                            });

                                            new Alert().ShowAlert({
                                                icon: 'success',
                                                title: lang.modpack_installed,
                                                text: `ModPack ${name} ${lang.modpack_installed_correctly}.`
                                            });
                                        }
                                    });
                                }
                            }
                        }
                    }

                    async function descargarMod(projectID, fileID, destino, manifestPath) {
                        const url = `https://api.curseforge.com/v1/mods/${projectID}/files/${fileID}/download-url`;
                        const modData = `https://api.curseforge.com/v1/mods/${projectID}`
                        const axios = require('axios');
                        const responseDatos = await axios.get(modData, {
                            headers: {
                                'x-api-key': apiKey,
                            },
                        });

                        try {
                            const response = await fetch(url, {
                                headers: {
                                    'X-Api-Key': apiKey,
                                },
                            });

                            if (response.ok) {
                                const {
                                    data
                                } = await response.json();
                                const response2 = await fetch(data);

                                if (response2.ok) {
                                    const archivoDescargado = await response2.buffer();
                                    // Guarda el archivo en la carpeta 'destino'
                                    await fs.writeFile(path.join(destino, `${responseDatos.data.data.name.replace(/[\/\\:*?"<>|]/g, "_")}.jar`), archivoDescargado);
                                } else { }
                            } else { }
                        } catch (error) {
                            console.error(`Error al descargar el mod ${projectID}-${fileID}:`);
                            console.error(error);
                        }
                    }

                    let destinationFile = file.path;

                    const AdmZip = require('adm-zip');

                    const tipoArchivo = file.name.split('.').pop();

                    //ruta del archivo

                    let json;

                    if (tipoArchivo === 'zip') {
                        let randomString = Math.random().toString(36).substring(2, 8);
                        if (!fs.existsSync(`${dataDirectory}/.battly/instances`)) {
                            fs.mkdirSync(`${dataDirectory}/.battly/instances`);
                        }

                        //comprobar si existe la carpeta de la instancia
                        if (!fs.existsSync(`${dataDirectory}/.battly/instances/${randomString}`)) {
                            fs.mkdirSync(`${dataDirectory}/.battly/instances/${randomString}`);
                        } else {
                            //generar otro string random
                            randomString = Math.random().toString(36).substring(2, 8);
                            //crear la carpeta de la instancia
                            fs.mkdirSync(`${dataDirectory}/.battly/instances/${randomString}`);
                        }
                        const destinationFolder = `${dataDirectory}/.battly/instances/${randomString}`;




                        if (!fs.existsSync(destinationFolder)) {
                            fs.mkdirSync(destinationFolder);
                        }

                        if (!fs.existsSync(dataDirectory + '/.battly/temp')) {
                            fs.mkdirSync(dataDirectory + '/.battly/temp');
                        }

                        if (!fs.existsSync(destinationFolder + '/mods')) {
                            fs.mkdirSync(destinationFolder + '/mods');
                        }

                        const destinoMods = destinationFolder + '/mods';

                        const zip = new AdmZip(destinationFile);
                        zip.extractAllTo(destinationFolder, true);

                        if (!fs.existsSync(path.join(destinationFolder, 'manifest.json'))) {
                            new Alert().ShowAlert({
                                icon: 'error',
                                title: lang.the_modpack_is_not_compatible,
                                text: lang.the_modpack_is_not_compatible_text
                            })

                            fs.removeSync(destinationFolder);
                            modalDiv.remove();
                            return;
                        }
                        json = await fs.readFile(path.join(destinationFolder, 'manifest.json'), 'utf8');
                        console.log(json);

                        if (json === undefined || json === null || json === '') {
                            new Alert().ShowAlert({
                                icon: 'error',
                                title: lang.the_modpack_is_not_compatible,
                                text: lang.the_modpack_is_not_compatible_text
                            })
                        }

                        setTimeout(async () => {


                            const manifestPath = `${destinationFolder}/manifest.json`;
                            async function leerManifest() {
                                try {
                                    const manifestData = await fs.readFile(manifestPath, 'utf8');
                                    const manifest = JSON.parse(manifestData);
                                    return manifest;
                                } catch (error) {
                                    throw error;
                                }
                            }

                            const manifest = await leerManifest(path.join(destinationFolder, 'manifest.json'));

                            let total = manifest.files.length;
                            let restante = total;
                            let totalFilesDownloaded = 0;

                            let name = manifest.name;
                            let description = manifest.author ? manifest.author : "Sin descripción";
                            let version = manifest.minecraft.version;
                            let loader;
                            let loaderVersion;
                            let loader_ = manifest.minecraft.modLoaders[0].id;

                            if (loader_.startsWith("fabric")) {
                                loader = "fabric";
                                loaderVersion = loader_.replace("fabric-", "");
                            } else if (loader_.startsWith("forge")) {
                                loader = "forge";
                                loaderVersion = loader_.replace("forge-", "");
                            } else {
                                loader = "quilt";
                                loaderVersion = loader_.replace("quilt-", "");
                            }



                            if (name && description && version && loader && loaderVersion) {



                                //descargar la imagen https://bulma.io/images/placeholders/128x128.png y moverla a la carpeta de la instancia
                                fetch("https://battlylauncher.com/assets/img/mc-icon.png")
                                    .then((res) => res.buffer())
                                    .then((buffer) => {
                                        fs.writeFileSync(
                                            `${dataDirectory}/.battly/instances/${randomString}/icon.png`,
                                            buffer
                                        );
                                    });


                                let instance = {
                                    name: name,
                                    description: description,
                                    version: version,
                                    image: `${dataDirectory}/.battly/instances/${randomString}/icon.png`,
                                    id: randomString,
                                    loader: loader,
                                    loaderVersion: loaderVersion,
                                };

                                let instance_json = JSON.stringify(instance);
                                fs.writeFileSync(
                                    path.join(
                                        `${dataDirectory}/.battly/instances/${randomString}`,
                                        "instance.json"
                                    ),
                                    instance_json
                                );

                                await fs.copy(path.join(destinationFolder, 'overrides'), destinationFolder);

                                //eliminar la carpeta overrides
                                await fs.remove(path.join(destinationFolder, 'overrides'));


                                for (const mod of manifest.files) {
                                    await descargarMod(mod.projectID, mod.fileID, destinoMods, manifestPath);
                                    const modData = `https://api.curseforge.com/v1/mods/${mod.projectID}`
                                    const axios = require('axios');
                                    const responseDatos = await axios.get(modData, {
                                        headers: {
                                            'x-api-key': apiKey,
                                        },
                                    });

                                    restante--;
                                    progress.max = total;
                                    progress.value = total - restante;
                                    totalFilesDownloaded++;
                                    textP2.innerHTML = `<i class="fa-solid fa-spinner fa-spin-pulse"></i>${lang.installing_modpack_can_take}<br><br>${lang.installing_mod} ${responseDatos.data.data.name} (${totalFilesDownloaded} / ${total})`;
                                    textP2.style.color = "#fff";

                                    if (restante === 0) {
                                        modalDiv.remove();

                                        ipcRenderer.send("new-notification", {
                                            title: lang.modpack_installed,
                                            body: `ModPack ${name} ${lang.modpack_installed_correctly}.`
                                        });

                                        new Alert().ShowAlert({
                                            icon: 'success',
                                            title: lang.modpack_installed,
                                            text: `ModPack ${name} ${lang.modpack_installed_correctly}.`
                                        });
                                    }

                                }
                            }
                        }, 1000);
                    } else if (tipoArchivo === 'mrpack') {
                        let randomString = Math.random().toString(36).substring(2, 8);
                        if (!fs.existsSync(`${dataDirectory}/.battly/instances`)) {
                            fs.mkdirSync(`${dataDirectory}/.battly/instances`);
                        }

                        //comprobar si existe la carpeta de la instancia
                        if (!fs.existsSync(`${dataDirectory}/.battly/instances/${randomString}`)) {
                            fs.mkdirSync(`${dataDirectory}/.battly/instances/${randomString}`);
                        } else {
                            //generar otro string random
                            randomString = Math.random().toString(36).substring(2, 8);
                            //crear la carpeta de la instancia
                            fs.mkdirSync(`${dataDirectory}/.battly/instances/${randomString}`);
                        }
                        const destinationFolder = `${dataDirectory}/.battly/instances/${randomString}`;

                        fs.mkdirSync(`${dataDirectory}/.battly/instances/${randomString}`, {
                            recursive: true
                        });

                        if (!fs.existsSync(destinationFolder)) {
                            fs.mkdirSync(destinationFolder);
                        }

                        const zip = new AdmZip(destinationFile);
                        await zip.extractAllTo(destinationFolder, true);
                        json = await fs.readFile(path.join(destinationFolder, 'modrinth.index.json'), 'utf8');

                        //mover lo que hay en la carpeta overrides a la carpeta battly
                        await fs.copy(path.join(destinationFolder, 'overrides'), destinationFolder);

                        //eliminar la carpeta overrides
                        await fs.remove(path.join(destinationFolder, 'overrides'));

                        await descargarModModrinth(JSON.parse(json), randomString);

                    } else {
                        new Alert().ShowAlert({
                            icon: 'error',
                            title: lang.the_modpack_is_not_compatible,
                            text: lang.the_modpack_is_not_compatible_text
                        })
                    }


                }
            });

        });
    }


    async Inicio() {
        let btnOpenMods = document.getElementById("boton_abrir_mods");
        btnOpenMods.addEventListener("click", () => {
            document.getElementById("navbar-mods").style.display = "none";
            document.getElementById("home-features-mods").style.height = "100%";
            this.CargarMods(0, "mod");
        });
        let boton_mods = document.getElementById("boton_abrir_mods");
        boton_mods.addEventListener("click", () => {
            changePanel("mods");
        });

        let boton_volver = document.getElementById("volver");
        boton_volver.addEventListener("click", () => {
            changePanel("home");
        });

        let mods_container = document.getElementById("mods_container");
        let actualPage = 0;
        /* comprobar si se ha deslizado el scroll hasta el final */
        mods_container.addEventListener("scroll", () => {
            // Verificar si estamos cerca del final con un pequeño margen (por ejemplo, 10 píxeles)
            if (mods_container.scrollTop + mods_container.clientHeight + 10 >= mods_container.scrollHeight) {
                actualPage += 50;
                this.CargarMods(actualPage, "mod");
            }
        });

        //comprobar si existe el directorio de mods
        if (!fs.existsSync(`${dataDirectory}/.battly/mods`)) {
            fs.mkdirSync(`${dataDirectory}/.battly/mods`);
        }
    }

    async BuscarMods() {
        let input_buscar_mods = document.getElementById("input_buscar_mods");
        let boton_buscar_mods = document.getElementById("boton_buscar_mods");

        //al hacer click en enter que ejecute la función this.CargarMods(input_buscar_mods.value);
        input_buscar_mods.addEventListener("keyup", (event) => {
            if (event.keyCode === 13) {
                event.preventDefault();
                if (input_buscar_mods.value == "") {
                    let typeOfSearch = document.getElementById("select-type-of-search-mods").value;
                    this.CargarMods(0, typeOfSearch);
                } else {
                    let typeOfSearch = document.getElementById("select-type-of-search-mods").value;
                    this.BuscarModsPorNombre(input_buscar_mods.value, typeOfSearch);
                }
            }
        });
    }



    async BuscarModsPorNombre(nombre, typeOfSearch) {
        document.getElementById("navbar-mods").style.display = "none";
        document.getElementById("mods_container").classList.add("animate-height");
        document.getElementById("mods_container").style.height = "60%";
        setTimeout(() => {
            document.getElementById("navbar-mods").style.display = "";
        }, 1000);
        let thiss = this;
        let mods_container = document.getElementById("mods_container");
        mods_container.innerHTML = "";

        let offset = 0; // Número de resultados a omitir
        let currentOffset = 0; // Número de resultados a omitir actual
        const limit = 20; // Número de resultados por página
        let selected_page = 0;

        async function CargarModsOffset(nombre, offset) {
            const loadingText = document.getElementById("loading-text");
            loadingText.innerText = lang.searching_mods;

            await axios.get(`https://api.modrinth.com/v2/search?limit=20&query=${nombre}&facets=[["project_type:${typeOfSearch}"]]&index=relevance&offset=${offset}`).then(async (response) => {
                selected_page = 0;
                let mods = response.data.hits;
                mods_container.innerHTML = "";
                let totalMods = mods.length;
                let totalModsCargados = 0;

                for (let i = 0; i < mods.length; i++) {
                    totalModsCargados++;
                    if (totalModsCargados == totalMods) {
                    }
                    let mod = mods[i];

                    let mod_card = document.createElement("div");
                    mod_card.classList.add("feature-card2-feature-card");

                    let mod_download = document.createElement("a");
                    mod_download.classList.add("feature-card2-download");

                    let mod_download_icon = document.createElement("img");
                    mod_download_icon.classList.add("feature-card2-download-icon");
                    mod_download_icon.src = "assets/images/descargar.png";

                    let mod_icon = document.createElement("img");
                    mod_icon.classList.add("feature-card2-icon");
                    mod_icon.src = mod.icon_url ? mod.icon_url : "assets/images/pregunta.png";

                    let mod_container = document.createElement("div");
                    mod_container.classList.add("feature-card2-container");

                    let mod_name = document.createElement("h2");
                    mod_name.classList.add("feature-card2-text");
                    mod_name.innerText = mod.title;

                    let mod_description = document.createElement("span");
                    if (mod.description.length > 100) {
                        mod_description.innerText = mod.description.slice(0, 80) + "...".replace('\n', '');
                    } else {
                        mod_description.innerText = mod.description.replace('\n', '');
                    }
                    mod_description.style.color = "#fff";

                    mod_container.appendChild(mod_name);
                    mod_container.appendChild(mod_description);

                    mod_download.appendChild(mod_download_icon);

                    mod_card.appendChild(mod_download);
                    mod_card.appendChild(mod_icon);
                    mod_card.appendChild(mod_container);

                    mods_container.appendChild(mod_card);

                    mod_download.addEventListener("click", () => {
                        thiss.ShowPanelInfo(mod.project_id);
                    });
                }
            }).catch((error) => {
                console.log(error);
            });
        }


        let totalhits;
        async function setTotalHits(total) {
            totalhits = total;
        }

        document.getElementById("anterior_btn_mods").addEventListener("click", () => {
            if (currentOffset > 0) {
                currentOffset -= limit;
                CargarModsOffset(nombre, currentOffset);
            }
        });

        document.getElementById("siguiente_btn_mods").addEventListener("click", () => {
            currentOffset += limit;
            CargarModsOffset(nombre, currentOffset);
        });


        async function CrearPaginacion(total_hits, selectedPage) {
            var paginationList = document.getElementById('pagination-mods');
            paginationList.innerHTML = '';

            // Crea el primer elemento como página actual
            var firstPage = document.createElement('li');
            var firstLink = document.createElement('a');
            firstLink.className = 'pagination-link';
            console.log(selectedPage);
            if (selectedPage === 0) {
                firstLink.classList.add('is-current');
            }
            firstLink.setAttribute('aria-label', 'Goto page 1');
            firstLink.textContent = '1';
            firstLink.addEventListener('click', function () {
                // Actualiza el offset actual
                currentOffset = 0;

                // Carga los mods con el nuevo offset
                CargarModsOffset(nombre, currentOffset);

                // Elimina la clase is-current de otros botones y añade a este
                EliminarClaseCurrent();
                this.classList.add('is-current');
            });
            firstPage.appendChild(firstLink);
            paginationList.appendChild(firstPage);

            // Crea más elementos de paginación si hay más de 20 resultados
            for (var i = 2; i <= Math.ceil(total_hits / limit); i++) {
                var pageItem = document.createElement('li');
                var pageLink = document.createElement('a');
                pageLink.className = 'pagination-link';
                if (selectedPage === i) {
                    pageLink.classList.add('is-current');
                }
                pageLink.setAttribute('aria-label', 'Goto page ' + i);
                pageLink.textContent = i;

                // Agrega el evento click para llamar a la función CargarModsOffset con el número de página
                pageLink.addEventListener('click', function () {
                    // Actualiza el offset actual
                    currentOffset = (parseInt(this.textContent) - 1) * limit;

                    // Carga los mods con el nuevo offset
                    CargarModsOffset(nombre, currentOffset);

                    // Elimina la clase is-current de otros botones y añade a este
                    EliminarClaseCurrent();
                    this.classList.add('is-current');
                });

                pageItem.appendChild(pageLink);
                paginationList.appendChild(pageItem);
            }
        }


        function EliminarClaseCurrent() {
            var currentPages = document.querySelectorAll('.pagination-link.is-current');
            currentPages.forEach(function (page) {
                page.classList.remove('is-current');
            });
        }

        // Ajusta la URL de la llamada a la API para incluir el offset
        await axios.get(`https://api.modrinth.com/v2/search?limit=${limit}&query=${nombre}&facets=[["project_type:${typeOfSearch}"]]&index=relevance&offset=${offset}`).then(async (response) => {
            let mods = response.data.hits;
            let total_hits = response.data.total_hits;
            let totalMods = mods.length;
            let totalModsCargados = 0;

            if (total_hits > limit) {
                await CrearPaginacion(total_hits, 0);
                setTotalHits(total_hits);
            }

            for (let i = 0; i < mods.length; i++) {
                totalModsCargados++;
                if (totalModsCargados == totalMods) {
                }
                let mod = mods[i];

                let mod_card = document.createElement("div");
                mod_card.classList.add("feature-card2-feature-card");

                let mod_download = document.createElement("a");
                mod_download.classList.add("feature-card2-download");

                let mod_download_icon = document.createElement("img");
                mod_download_icon.classList.add("feature-card2-download-icon");
                mod_download_icon.src = "assets/images/descargar.png";

                let mod_icon = document.createElement("img");
                mod_icon.classList.add("feature-card2-icon");
                mod_icon.src = mod.icon_url ? mod.icon_url : "assets/images/pregunta.png";

                let mod_container = document.createElement("div");
                mod_container.classList.add("feature-card2-container");

                let mod_name = document.createElement("h2");
                mod_name.classList.add("feature-card2-text");
                mod_name.innerText = mod.title;

                let mod_description = document.createElement("span");
                if (mod.description.length > 100) {
                    mod_description.innerText = mod.description.slice(0, 100) + "...".replace('\n', '');
                } else {
                    mod_description.innerText = mod.description.replace('\n', '');
                }
                mod_description.style.color = "#fff";

                mod_container.appendChild(mod_name);
                mod_container.appendChild(mod_description);

                mod_download.appendChild(mod_download_icon);

                mod_card.appendChild(mod_download);
                mod_card.appendChild(mod_icon);
                mod_card.appendChild(mod_container);

                mods_container.appendChild(mod_card);

                mod_download.addEventListener("click", () => {
                    thiss.ShowPanelInfo(mod.project_id);
                });
            }
        }).catch((error) => {
            console.log(error);
        });
    }


    async DescargarMod(downloadLink, mod, nombre, fileName, modData, project_type) {

        let mod_data = modData;

        const fetch = require('node-fetch');

        new Alert().ShowAlert({
            icon: 'info',
            title: `${lang.downloading_mod}...`
        })

        let error_downloading_mod = lang.error_downloading_mod;
        let mod_downloaded_successfully = lang.mod_downloaded_successfully;

        if (project_type === "mod") {
            let file = fs.createWriteStream(`${dataDirectory}/.battly/mods/${fileName}`);
            let request = await fetch(downloadLink);
            await new Promise((resolve, reject) => {
                request.body.pipe(file);
                request.body.on("error", (err) => {
                    new Alert().ShowAlert({
                        icon: 'error',
                        title: `${error_downloading_mod} ${nombre}.`,
                        text: err
                    })
                    reject(err);
                });
                file.on("finish", function () {
                    resolve();
                    new Alert().ShowAlert({
                        icon: 'success',
                        title: `${nombre} ${mod_downloaded_successfully}.`
                    })
                });
            });
        } else if (project_type === "resourcepack") {
            let file = fs.createWriteStream(`${dataDirectory}/.battly/resourcepacks/${fileName}`);
            let request = await fetch(downloadLink);
            await new Promise((resolve, reject) => {
                request.body.pipe(file);
                request.body.on("error", (err) => {
                    new Alert().ShowAlert({
                        icon: 'error',
                        title: `${error_downloading_mod} ${nombre}.`,
                        text: err
                    })
                    reject(err);
                });
                file.on("finish", function () {
                    resolve();
                    new Alert().ShowAlert({
                        icon: 'success',
                        title: `${nombre} ${mod_downloaded_successfully}.`
                    })
                });
            });
        } else if (project_type === "shader") {
            let file = fs.createWriteStream(`${dataDirectory}/.battly/shaderpacks/${fileName}`);
            let request = await fetch(downloadLink);
            await new Promise((resolve, reject) => {
                request.body.pipe(file);
                request.body.on("error", (err) => {
                    new Alert().ShowAlert({
                        icon: 'error',
                        title: `${error_downloading_mod} ${nombre}.`,
                        text: err
                    })
                    reject(err);
                });
                file.on("finish", function () {
                    resolve();
                    new Alert().ShowAlert({
                        icon: 'success',
                        title: `${nombre} ${mod_downloaded_successfully}.`
                    })
                });
            });
        }



        if (mod_data.dependencies.length > 0) {
            console.log("El MOD data")
            console.log(mod_data);
            this.DescargarDependencias(mod, mod_data.game_versions);
        }
    }

    async ObtenerMod(id) {
        const mod_data = await axios.get(`https://api.modrinth.com/v2/project/${id}/version`).then((response) => {
            return response.data;
        }).catch((error) => {
            console.log(error);
        });
        return mod_data;
    }

    async ObtenerModData(id) {
        const mod_data = await axios.get(`https://api.modrinth.com/v2/project/${id}`).then((response) => {
            return response.data;
        }).catch((error) => {
            console.log(error);
        });
        return mod_data;
    }

    async DescargarDependencias(mod, supportedVersions) {
        const mod_data = await this.ObtenerMod(mod);

        if (mod_data[0].dependencies.length > 0) {

            for (let i = 0; i < mod_data[0].dependencies.length; i++) {
                console.log("La dependencia es:")
                console.log(mod_data[0].dependencies[i]);
                console.log("La dependencia es requerida")
                const dependencyData = await this.ObtenerMod(mod_data[0].dependencies[i].project_id);
                console.log("La dependencia es:")
                for (let dependency of dependencyData) {
                    for (let version of supportedVersions) {
                        console.log("Las versiones soportadas por el mod son:")
                        console.log(version)
                        console.log("La dependencia es:")
                        console.log(dependency)
                        if (dependency.game_versions.includes(version)) {
                            const downloadLink = dependency.files[0].url;
                            const response = await fetch(downloadLink);
                            const fileBuffer = await response.arrayBuffer();
                            const fs = require('fs');
                            fs.writeFile(`${dataDirectory}/.battly/mods/${dependency.files[0].filename}`, Buffer.from(fileBuffer), (err) => {
                                if (err) {
                                    new Alert().ShowAlert({
                                        icon: 'error',
                                        title: `${lang.error_downloading_dependency}: ${dependency.name}`,
                                        text: err.message
                                    });
                                } else {
                                    new Alert().ShowAlert({
                                        icon: 'success',
                                        title: `${lang.dependency}: ${dependency.name} ${lang.downloaded_successfully_two}.`
                                    });
                                }
                            });

                            return;
                        }
                    }
                }
            }
        }
    }

    async ShowPanelInfo(id) {
        const loadingText = document.getElementById("loading-text");
        loadingText.innerText = lang.loading_mod_information;
        const mod_data = await this.ObtenerModData(id);
        const mod_data_downloads = await this.ObtenerMod(id);


        let loaders = mod_data.loaders;
        let loadersText = "";
        for (let i = 0; i < loaders.length; i++) {
            if (i == 0) {
                loadersText += loaders[i].charAt(0).toUpperCase() + loaders[i].slice(1);
            } else if (i == loaders.length - 1) {
                loadersText += " - " + loaders[i].charAt(0).toUpperCase() + loaders[i].slice(1);
            }
        }

        let versiones_soportadas = mod_data.game_versions;
        let versiones_soportadas_text = "";

        for (let i = 0; i < versiones_soportadas.length; i++) {
            if (i == 0) {
                versiones_soportadas_text += versiones_soportadas[i];
            } else if (i == versiones_soportadas.length - 1) {
                versiones_soportadas_text += " - " + versiones_soportadas[i];
            }
        }

        let loadersInfo = `<i class="fa-solid fa-circle-info"></i> ${loadersText} (${versiones_soportadas_text})`;

        let mod_body = document.getElementById("battly_mods");


        let modalDiv = document.createElement("div");
        modalDiv.classList.add("modal");
        modalDiv.classList.backgroundColor = "#212121";

        let modalBackgroundDiv = document.createElement("div");
        modalBackgroundDiv.classList.add("modal-background");

        let modalCardDiv = document.createElement("div");
        modalCardDiv.style.height = "90%";
        modalCardDiv.classList.add("modal-card");
        modalCardDiv.style.backgroundColor = "#212121";

        let modalHeader = document.createElement("header");
        modalHeader.classList.add("modal-card-head");
        modalHeader.style.backgroundColor = "#212121";

        let modalTitle = document.createElement("p");
        modalTitle.classList.add("modal-card-title");
        modalTitle.innerText = lang.mod_information;
        modalTitle.style.color = "#fff";

        let modalCloseButton = document.createElement("button");
        modalCloseButton.classList.add("delete");
        modalCloseButton.setAttribute("aria-label", "close");

        let modalSection = document.createElement("section");
        modalSection.classList.add("modal-card-body");
        modalSection.style.scrollbarColor = "#d3d3d3 #d3d3d3";
        modalSection.style.scrollbarWidth = "thin";

        let cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        cardDiv.style.backgroundColor = "#212121";

        let cardContentDiv = document.createElement("div");
        cardContentDiv.classList.add("card-content");
        cardContentDiv.style.backgroundColor = "#212121";

        let mediaDiv = document.createElement("div");
        mediaDiv.classList.add("media");

        let mediaLeftDiv = document.createElement("div");
        mediaLeftDiv.classList.add("media-left");

        let mediaImage = document.createElement("figure");
        mediaImage.classList.add("image");
        mediaImage.classList.add("is-48x48");

        let mediaImageSrc = document.createElement("img");
        mediaImageSrc.src = mod_data.icon_url ? mod_data.icon_url : "assets/images/pregunta.png";
        mediaImageSrc.alt = "Image";

        let mediaContentDiv = document.createElement("div");
        mediaContentDiv.classList.add("media-content");
        mediaContentDiv.style.backgroundColor = "#212121";

        let mediaTitle = document.createElement("p");
        mediaTitle.classList.add("title");
        mediaTitle.classList.add("is-4");
        mediaTitle.innerText = mod_data.title;
        mediaTitle.style.color = "#fff";

        let mediaSubtitle = document.createElement("p");
        mediaSubtitle.classList.add("subtitle");
        mediaSubtitle.classList.add("is-6");
        mediaSubtitle.innerHTML = loadersInfo;
        mediaSubtitle.style.color = "#fff";

        let contentDiv = document.createElement("div");
        contentDiv.classList.add("content");
        contentDiv.style.backgroundColor = "#212121";

        let contentText = document.createElement("p");
        contentText.style.color = "#fff";
        contentText.innerHTML = `
  ${mod_data.description}
  <br>
  <hr>
  ${lang.mod_stats}
  <br>
  <i class="fa-solid fa-download"></i> ${lang.downloads}: ${mod_data.downloads}
  <br>
  <i class="fa-solid fa-heart"></i> ${lang.followers}: ${mod_data.followers}
  <br>
  <br>
  ${mod_data.body.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">').replace(/### (.*?)\n/g, '<h3>$1</h3>\n').replace(/## (.*?)\n/g, '<h2>$1</h2>\n').replace(/# (.*?)\n/g, '<h1>$1</h1>\n').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>').replace(/- (.*)\n/g, '<li>$1</li>\n').replace(/\n---\n/g, '\n<hr>\n').replace(/<!--(.*?)-->/g, '<!--$1-->').replace(/__(.*?)__/g, '<u>$1</u>').replace(/_(.*?)_/g, '<i>$1</i>').replace(/\*(.*?)\*/g, '<i>$1</i>')}
  <br>
  <br>

  <button class="button is-info is-outlined" onclick="window.open('https://modrinth.com/mod/${mod_data.id}', '_blank');">${lang.view_on_modrinth}</button>`;

        let footerDiv = document.createElement("footer");
        footerDiv.classList.add("modal-card-foot");
        footerDiv.style.backgroundColor = "#212121";

        let selectDiv = document.createElement("div");
        selectDiv.classList.add("select");
        selectDiv.classList.add("is-link");
        selectDiv.style.marginRight = "10px";
        selectDiv.style.width = "auto";
        selectDiv.style.maxWidth = "300px";

        let selectElement = document.createElement("select");
        selectElement.style.width = "auto";
        selectElement.style.height = "40px";
        selectElement.style.transform = "translate(0px, -5px)";
        for (let version of mod_data_downloads) {
            let versionName = version.version_number;
            let versionID = version.id;
            let supportedVersions = version.game_versions;
            let supportedVersionsText = "";
            for (let i = 0; i < supportedVersions.length; i++) {
                //poner todas las versiones separadas por - y la última no tenga el -
                if (i == 0) {
                    supportedVersionsText += supportedVersions[i];
                } else if (i == supportedVersions.length - 1) {
                    supportedVersionsText += " - " + supportedVersions[i];
                }
            }
            let optionElement = document.createElement("option");
            optionElement.value = versionID;
            optionElement.innerText = `${supportedVersionsText} (${versionName})`
            selectElement.appendChild(optionElement);
        }

        let downloadButton = document.createElement("button");
        downloadButton.classList.add("button");
        downloadButton.classList.add("is-info");
        downloadButton.innerText = lang.download_mod;

        let deleteButton = document.createElement("button");
        deleteButton.classList.add("button");
        deleteButton.innerText = lang.delete_mod;
        if (fs.existsSync(`${dataDirectory}/.battly/mods/${mod_data_downloads[0].files[0].filename}`)) {
            deleteButton.classList.add("is-danger");
            deleteButton.classList.add("is-active");

        } else {
            deleteButton.classList.add("is-hidden");
        }

        let cardFooterDiv = document.createElement("div");
        cardFooterDiv.classList.add("card-footer");

        let cardFooterItem = document.createElement("div");
        cardFooterItem.classList.add("card-footer-item");

        let cardFooterText = document.createElement("p");
        cardFooterText.style.fontSize = "10px";
        cardFooterText.innerHTML = lang.all_this_information_copyright_modrinth;
        cardFooterText.style.color = "#fff";

        // Agregar elementos al DOM
        mediaImage.appendChild(mediaImageSrc);
        mediaLeftDiv.appendChild(mediaImage);
        mediaDiv.appendChild(mediaLeftDiv);

        mediaContentDiv.appendChild(mediaTitle);
        mediaContentDiv.appendChild(mediaSubtitle);

        contentDiv.appendChild(contentText);

        selectDiv.appendChild(selectElement);

        footerDiv.appendChild(selectDiv);
        footerDiv.appendChild(downloadButton);
        footerDiv.appendChild(deleteButton);

        cardFooterItem.appendChild(cardFooterText);

        cardFooterDiv.appendChild(cardFooterItem);

        mediaDiv.appendChild(mediaLeftDiv);
        mediaDiv.appendChild(mediaContentDiv);

        cardContentDiv.appendChild(mediaDiv);
        cardContentDiv.appendChild(contentDiv);
        cardContentDiv.appendChild(cardFooterDiv);

        cardDiv.appendChild(cardContentDiv);

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(modalCloseButton);

        modalSection.appendChild(cardDiv);

        modalCardDiv.appendChild(modalHeader);
        modalCardDiv.appendChild(modalSection);
        modalCardDiv.appendChild(footerDiv);

        modalDiv.appendChild(modalBackgroundDiv);
        modalDiv.appendChild(modalCardDiv);

        mod_body.appendChild(modalDiv);

        modalDiv.classList.add("is-active");

        downloadButton.addEventListener("click", () => {
            this.DescargarMod(mod_data_downloads[selectElement.selectedIndex].files[0].url, mod_data.id, mod_data.title, mod_data_downloads[selectElement.selectedIndex].files[0].filename, mod_data_downloads[selectElement.selectedIndex], mod_data.project_type);
        });

        deleteButton.addEventListener("click", () => {
            /* eliminar el archivo */
            fs.unlink(`${dataDirectory}/.battly/mods/${mod_data_downloads[0].files[0].filename}`, (err) => {
                if (err) {
                    console.error(err)
                    return
                }
            });

            /* eliminar las dependencias */
            if (mod_data_downloads[0].dependencies.length > 0) {
                for (let i = 0; i < mod_data_downloads[0].dependencies.length; i++) {
                    const dependency = mod_data_downloads[0].dependencies[i].project_id;
                    const dependency_data = this.ObtenerMod(dependency);
                    if (dependency_data[0].files.length > 0) {
                        fs.unlink(`${dataDirectory}/.battly/mods/${dependency_data[0].files[0].filename}`, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        });
                    }
                }
            }

            new Alert().ShowAlert({
                icon: 'success',
                title: `${mod_data.title} ${lang.deleted_successfully}.`
            })

        });

        modalCloseButton.addEventListener("click", () => {
            modalDiv.classList.remove("is-active");
            modalDiv.remove();
        });
    }


    async CargarMods(page, typeOfSearch) {
        document.getElementById("navbar-mods").style.display = "none";
        document.getElementById("home-features-mods").style.height = "100%";
        let mods_container = document.getElementById("mods_container");
        if (!page || page == undefined || page == null) {
            mods_container.innerHTML = "";
            page = 0;
        }
        const loadingText = document.getElementById("loading-text");
        loadingText.innerText = lang.searching_mods;



        await axios.get(`https://api.modrinth.com/v2/search?limit=20&index=relevance&facets=[["project_type:${typeOfSearch}"]]&offset=${page}`).then(async (response) => {
            let mods = response.data.hits;

            let totalMods = mods.length;
            let totalModsCargados = 0;

            for (let i = 0; i < mods.length; i++) {
                totalModsCargados++;
                if (totalModsCargados == totalMods) {
                }
                let mod = mods[i];

                let mod_card = document.createElement("div");
                mod_card.classList.add("feature-card2-feature-card");

                let mod_download = document.createElement("a");
                mod_download.classList.add("feature-card2-download");

                let mod_download_icon = document.createElement("img");
                mod_download_icon.classList.add("feature-card2-download-icon");
                mod_download_icon.src = "assets/images/descargar.png";

                let mod_icon = document.createElement("img");
                mod_icon.classList.add("feature-card2-icon");
                mod_icon.src = mod.icon_url ? mod.icon_url : "assets/images/pregunta.png";

                let mod_container = document.createElement("div");
                mod_container.classList.add("feature-card2-container");

                let mod_name = document.createElement("h2");
                mod_name.classList.add("feature-card2-text");
                mod_name.innerText = mod.title;

                let mod_description = document.createElement("span");
                if (mod.description.length > 100) {
                    mod_description.innerText = mod.description.slice(0, 100) + "...";
                } else {
                    mod_description.innerText = mod.description;
                }
                mod_description.style.color = "#fff";

                mod_container.appendChild(mod_name);
                mod_container.appendChild(mod_description);

                mod_download.appendChild(mod_download_icon);

                mod_card.appendChild(mod_download);
                mod_card.appendChild(mod_icon);
                mod_card.appendChild(mod_container);

                mods_container.appendChild(mod_card);

                mod_download.addEventListener("click", () => {
                    this.ShowPanelInfo(mod.project_id);
                });
            }

        }).catch((error) => {
            console.log(error);
        });
    }
}

export default Mods;