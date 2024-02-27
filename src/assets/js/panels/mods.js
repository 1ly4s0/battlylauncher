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

const Swal = require('./assets/js/libs/sweetalert/sweetalert2.all.min');

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

class Mods {
    static id = "mods";


    async init(config) {
        this.config = config
        this.database = await new database().init();
        lang = await new Lang().GetLang();
        this.Inicio();
        this.BuscarMods();
        this.CheckIfIsTheLatestScroll();
        this.InsalarModPack();
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
            fileCtaSpan.appendChild(fileLabelSpan);

            // Crear el elemento span con la clase "file-name" y estilos, y añadirlo como hijo de fileLabel
            const fileNameSpan = document.createElement("span");
            fileNameSpan.className = "file-name";
            fileNameSpan.style.textAlign = "center";
            fileNameSpan.textContent = "ZIP/MRPACK";
            fileLabel.appendChild(fileNameSpan);

            // Crear el elemento footer con la clase "modal-card-foot" y añadirlo como hijo de modalCardDiv
            const footerDiv = document.createElement("footer");
            footerDiv.className = "modal-card-foot";
            modalCardDiv.appendChild(footerDiv);

            // Crear el botón "Instalar" y añadirlo como hijo de footerDiv
            const installButton = document.createElement("button");
            installButton.className = "button is-info";
            installButton.textContent = lang.install;
            footerDiv.appendChild(installButton);

            // Crear el botón "Cancelar" y añadirlo como hijo de footerDiv
            const cancelButton = document.createElement("button");
            cancelButton.className = "button";
            cancelButton.textContent = lang.cancel;
            footerDiv.appendChild(cancelButton);

            // Agregar modalDiv al documento como último hijo del body
            document.body.appendChild(modalDiv);


            closeButton.addEventListener("click", () => {
                modalDiv.remove();
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
                    Toast.fire({
                        icon: 'error',
                        title: lang.you_didnt_selected_any_file
                    })
                } else {

                    footerDiv.remove();


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
                    textP2.innerHTML = lang.installing_modpack_can_take;
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
                            //crear un string random de 6 caracteres
                            
                            //crear el archivo de la instancia
                            //comprobar si existe la carpeta de instancias
                            

                        
                            
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

                                        textP2.innerHTML = `${lang.installing_modpack_can_take}<br><br>${lang.installing_file} ${path} (${totalFilesDownloaded} / ${totalFiles})`;
                                        if (totalFilesDownloaded == totalFiles) {
                                            modalDiv.remove();

                                            ipcRenderer.send("new-notification", {
                                                title: lang.modpack_installed,
                                                body: `ModPack ${name} ${lang.modpack_installed_correctly}.`
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
                        json = await fs.readFile(path.join(destinationFolder, 'manifest.json'), 'utf8');

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
                                    textP2.innerHTML = `${lang.installing_modpack_can_take}<br><br>${lang.installing_mod} ${responseDatos.data.data.name} (${totalFilesDownloaded} / ${total})`;

                                    if (restante === 0) {
                                        modalDiv.remove();
                                    
                                        ipcRenderer.send("new-notification", {
                                                title: lang.modpack_installed,
                                                body: `ModPack ${name} ${lang.modpack_installed_correctly}.`
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
                        Toast.fire({
                            icon: 'error',
                            title: lang.the_file_is_not_compatible
                        })
                    }


                }
            });

        });
    }

    async CheckIfIsTheLatestScroll() {
        const modsContainer = document.getElementById('mods_container');

        let options = {
            root: modsContainer,
            rootMargin: '0px',
            threshold: 1.0
        };

        //comprobar si ha scrolleado hasta el final con un observer
        let observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.CargarMods();
                }
            });
        }, options);

        observer.observe(modsContainer);

    }

    async Inicio() {
        let btnOpenMods = document.getElementById("boton_abrir_mods");
        btnOpenMods.addEventListener("click", () => {
            this.CargarMods();
        });
        let boton_mods = document.getElementById("boton_abrir_mods");
        boton_mods.addEventListener("click", () => {
            changePanel("mods");
        });

        let boton_volver = document.getElementById("volver");
        boton_volver.addEventListener("click", () => {
            changePanel("home");
            document.querySelector(".preload-content").style.display = "none";
        });

        let mods_container = document.getElementById("mods_container");
        /* comprobar si se ha deslizado el scroll hasta el final */
        mods_container.addEventListener("scroll", () => {
            if (mods_container.scrollTop + mods_container.clientHeight >= mods_container.scrollHeight) {
                this.CargarMods();
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
                    this.CargarMods();
                } else {
                    this.BuscarModsPorNombre(input_buscar_mods.value);
                }
            }
        });
    }

    async BuscarModsPorNombre(nombre) {
        document.querySelector(".preload-content").style.display = "block";
        const loadingText = document.getElementById("loading-text");
        loadingText.innerText = lang.searching_mods;

        mods_container.innerHTML = "";
        await axios.get(`https://api.modrinth.com/v2/search?limit=100&query=${nombre}&facets=[["project_type:mod"]]`).then(async (response) => {
            let mods = response.data.hits;
            let mods_container = document.getElementById("mods_container");

            let totalMods = mods.length;
            let totalModsCargados = 0;

            for (let i = 0; i < mods.length; i++) {
                totalModsCargados++;
                if (totalModsCargados == totalMods) {
                    document.querySelector(".preload-content").style.display = "none";
                }
                let mod = mods[i];

                let mod_data = await this.ObtenerMod(mod.project_id);

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

    async DescargarMod(downloadLink, mod, nombre, fileName) {

        const mod_data = await this.ObtenerMod(mod);

        const fetch = require('node-fetch');

        Toast.fire({
            icon: 'info',
            title: `${lang.downloading_mod}...`
        })

        let error_downloading_mod = lang.error_downloading_mod;
        let mod_downloaded_successfully = lang.mod_downloaded_successfully;

        let file = fs.createWriteStream(`${dataDirectory}/.battly/mods/${fileName}`);
        let request = await fetch(downloadLink);
        await new Promise((resolve, reject) => {
            request.body.pipe(file);
            request.body.on("error", (err) => {
                Toast.fire({
                    icon: 'error',
                    title: `${error_downloading_mod} ${nombre}.`,
                    text: err
                })
                reject(err);
            });
            file.on("finish", function () {
                resolve();
                Toast.fire({
                    icon: 'success',
                    title: `${nombre} ${mod_downloaded_successfully}.`
                })
            });
        });



        if (mod_data[0].dependencies.length > 0) {
            this.DescargarDependencias(mod, mod_data[0].dependencies[0].version_number);
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

    async DescargarDependencias(mod, version) {
        console.log(version);
        const mod_data = await this.ObtenerMod(mod);
        console.log(mod_data[0].dependencies)

        if (mod_data[0].dependencies.length > 0) {
            for (let i = 0; i < mod_data[0].dependencies.length; i++) {
                if (mod_data[0].dependencies[i].version_number == version) {
                    const dependency = mod_data[0].dependencies[i].project_id;
                    const dependency_data = await this.ObtenerMod(dependency);
                    if (dependency_data[0].files.length > 0) {
                        const downloadLink = dependency_data[0].files[0].url;
                        const response = await fetch(downloadLink);
                        const fileBuffer = await response.arrayBuffer();
                        const fs = require('fs');
                        fs.writeFile(`${dataDirectory}/.battly/mods/${dependency_data[0].files[0].filename}`, Buffer.from(fileBuffer), (err) => {
                            if (err) {
                                Toast.fire({
                                    icon: 'error',
                                    title: `${lang.error_downloading_dependency}: ${dependency_data[0].name}`,
                                    text: err.message
                                });
                            } else {
                                Toast.fire({
                                    icon: 'success',
                                    title: `${lang.dependency}: ${dependency_data[0].name} ${lang.downloaded_successfully_two}.`
                                });
                            }
                        });
                    }
                }
            }
        }
    }

    async ShowPanelInfo(id) {
        document.querySelector(".preload-content").style.display = "block";
        const loadingText = document.getElementById("loading-text");
        loadingText.innerText = lang.loading_mod_information;
        const mod_data = await this.ObtenerModData(id);
        const mod_data_downloads = await this.ObtenerMod(id);


        let loaders = mod_data.loaders;
        let loadersText = "";
        for (let i = 0; i < loaders.length; i++) {
            /* jungar todo y mostrar algo como Forge - Fabric - Rift , que el último no tenga el - */
            if (i == 0) {
                loadersText += loaders[i].charAt(0).toUpperCase() + loaders[i].slice(1);
            } else if (i == loaders.length - 1) {
                loadersText += " - " + loaders[i].charAt(0).toUpperCase() + loaders[i].slice(1);
            }
        }

        let versiones_soportadas = mod_data.game_versions;
        let versiones_soportadas_text = "";

        for (let i = 0; i < versiones_soportadas.length; i++) {
            /* Solo poner la primera y la última versión, ejemplo: si las soportadas son ["1.16.5", "1.17.1", "1.17.2"] solo poner 1.16.5 - 1.17.2 */
            if (i == 0) {
                versiones_soportadas_text += versiones_soportadas[i];
            } else if (i == versiones_soportadas.length - 1) {
                versiones_soportadas_text += " - " + versiones_soportadas[i];
            }
        }

        let loadersInfo = `<i class="fa-solid fa-circle-info"></i> ${loadersText} (${versiones_soportadas_text})`;

        let mod_body = document.getElementById("battly_mods");


        // Crear elementos
        let modalDiv = document.createElement("div");
        modalDiv.classList.add("modal");
        //añadir el z-index para que se vea por encima de todo

        let modalBackgroundDiv = document.createElement("div");
        modalBackgroundDiv.classList.add("modal-background");

        let modalCardDiv = document.createElement("div");
        modalCardDiv.classList.add("modal-card");

        let modalHeader = document.createElement("header");
        modalHeader.classList.add("modal-card-head");

        let modalTitle = document.createElement("p");
        modalTitle.classList.add("modal-card-title");
        modalTitle.innerText = lang.mod_information;

        let modalCloseButton = document.createElement("button");
        modalCloseButton.classList.add("delete");
        modalCloseButton.setAttribute("aria-label", "close");

        let modalSection = document.createElement("section");
        modalSection.classList.add("modal-card-body");
        modalSection.style.scrollbarColor = "#d3d3d3 #d3d3d3";
        modalSection.style.scrollbarWidth = "thin";

        // Crear contenido de la tarjeta
        let cardDiv = document.createElement("div");
        cardDiv.classList.add("card");

        let cardContentDiv = document.createElement("div");
        cardContentDiv.classList.add("card-content");

        // Crear contenido de media
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

        let mediaTitle = document.createElement("p");
        mediaTitle.classList.add("title");
        mediaTitle.classList.add("is-4");
        mediaTitle.innerText = mod_data.title;

        let mediaSubtitle = document.createElement("p");
        mediaSubtitle.classList.add("subtitle");
        mediaSubtitle.classList.add("is-6");
        mediaSubtitle.innerHTML = loadersInfo;

        // ...

        // Crear contenido de contenido
        let contentDiv = document.createElement("div");
        contentDiv.classList.add("content");

        let contentText = document.createElement("p");
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

        // ...

        // Crear footer
        let footerDiv = document.createElement("footer");
        footerDiv.classList.add("modal-card-foot");

        let selectDiv = document.createElement("div");
        selectDiv.classList.add("select");
        selectDiv.classList.add("is-link");
        selectDiv.style.marginRight = "10px";
        selectDiv.style.width = "auto";

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

        document.querySelector(".preload-content").style.display = "none";




        downloadButton.addEventListener("click", () => {
            this.DescargarMod(mod_data_downloads[selectElement.selectedIndex].files[0].url, mod_data.id, mod_data.title, mod_data_downloads[selectElement.selectedIndex].files[0].filename);
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

            Toast.fire({
                icon: 'success',
                title: `${mod_data.title} ${lang.deleted_successfully}.`
            })

        });

        modalCloseButton.addEventListener("click", () => {
            modalDiv.classList.remove("is-active");
            modalDiv.remove();
        });
    }


    async CargarMods() {
        document.querySelector(".preload-content").style.display = "block";
        const loadingText = document.getElementById("loading-text");
        loadingText.innerText = lang.searching_mods;
        await axios.get("https://api.modrinth.com/v2/search?limit=100&index=relevance").then(async (response) => {
            let mods = response.data.hits;
            let mods_container = document.getElementById("mods_container");
            mods_container.innerHTML = "";


            let totalMods = mods.length;
            let totalModsCargados = 0;

            for (let i = 0; i < mods.length; i++) {
                totalModsCargados++;
                if (totalModsCargados == totalMods) {
                    document.querySelector(".preload-content").style.display = "none";
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