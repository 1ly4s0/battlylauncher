/**
 * @author TECNO BROS
 
 */
'use strict';

const {
    ipcRenderer,
    ipcMain
} = require("electron");
import {
    database,
    changePanel,
    accountSelect,
    Slider
} from '../utils.js';
const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME)
const Swal = require("./assets/js/libs/sweetalert/sweetalert2.all.min.js");


const os = require('os');
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
})

import { Lang } from "../utils/lang.js";
import { Alert } from "../utils/alert.js";
let lang;

class Settings {
    static id = "settings";
    async init(config) {
        this.config = config;
        this.database = await new database().init();
        lang = await new Lang().GetLang();
        this.initSettingsDefault();
        this.initTab();
        this.initAccount();
        this.initRam();
        this.initLauncherSettings();
        this.initTheme();
        this.Java();
    }

    async initTheme() {
        let color = document.getElementById("theme-color");
        let color_db = localStorage.getItem("theme-color");
        let colorHover_db = localStorage.getItem("theme-color-hover");
        let color_bottom_bar = document.getElementById("theme-color-bottom-bar");
        let color_bottom_bar_db = localStorage.getItem("theme-color-bottom-bar");
        let opacity = document.getElementById("theme-opacity-bottom-bar");
        let opacity_db = localStorage.getItem("theme-opacity-bottom-bar");
        let background_loading_screen_color = localStorage.getItem("background-loading-screen-color");

        if (color_db) {
            color.value = color_db;
        } else {
            color.value = "#3e8ed0";
            localStorage.setItem("theme-color", "#3e8ed0");
        }

        if (colorHover_db) {
        } else {
            localStorage.setItem("theme-color-hover", tinycolor(color.value).darken(10).toString());
        }

        if (color_bottom_bar_db) {
            color_bottom_bar.value = color_bottom_bar_db;
        } else {
            color_bottom_bar.value = "#1f1f1f";
            localStorage.setItem("theme-color-bottom-bar", "#1f1f1f");
        }

        if (opacity_db) {
            opacity.value = opacity_db;
        } else {
            opacity.value = "0.5";
            localStorage.setItem("theme-opacity-bottom-bar", "1");
        }

        if (background_loading_screen_color) {
            document.getElementById("theme-color-loading-screen").value = background_loading_screen_color;
        } else {
            document.getElementById("theme-color-loading-screen").value = "#3498db";
            localStorage.setItem("background-loading-screen-color", "#3498db");
        }



        document.getElementById("theme-opacity-bottom-bar").addEventListener("input", (e) => {
            localStorage.setItem("theme-opacity-bottom-bar", e.target.value);
            let bottom_bar = document.querySelectorAll(".bottom_bar");
            bottom_bar.forEach((bar) => {
                bar.style.opacity = e.target.value;
            });

            let bottom_bar_settings = document.querySelector(".bottom_bar_settings");
            bottom_bar_settings.style.opacity = e.target.value;

            let bottom_bar_mods = document.querySelector(".bottom_bar_mods");
            bottom_bar_mods.style.opacity = e.target.value;
        });

        document.getElementById("theme-color-bottom-bar").addEventListener("input", (e) => {
            localStorage.setItem("theme-color-bottom-bar", e.target.value);
            let bottom_bar = document.querySelectorAll(".bottom_bar");
            bottom_bar.forEach((bar) => {
                bar.style.backgroundColor = e.target.value;
            });

            let bottom_bar_settings = document.querySelector(".bottom_bar_settings");
            let bottom_bar_mods = document.querySelector(".bottom_bar_mods");
            
            bottom_bar_settings.style.backgroundColor = e.target.value;
            bottom_bar_mods.style.backgroundColor = e.target.value;
        });

        document.getElementById("theme-color").addEventListener("input", (e) => {
            localStorage.setItem("theme-color", e.target.value);
            let buttons = document.querySelectorAll(".button");
            let btns = document.querySelectorAll(".btn");
            let tab_btns = document.querySelectorAll(".tab-btn");
            let inputs = document.querySelectorAll(".input");
            let select = document.querySelectorAll(".select");
            let select_options = document.querySelectorAll(".select-version");
            let select_selected = document.querySelectorAll(".select-selected");
            let select_selected_span = document.querySelectorAll(
                ".select-selected span"
            );


            buttons.forEach((button) => {
                button.style.backgroundColor = e.target.value;
            });

            document.querySelector(".save-tabs-btn").style.backgroundColor = e.target.value;

            btns.forEach((btn) => {
                btn.style.backgroundColor = e.target.value;
            });

            tab_btns.forEach((tab_btn) => {
                tab_btn.style.backgroundColor = e.target.value;
            });

            inputs.forEach((input) => {
                input.style.backgroundColor = e.target.value;
            });

            select.forEach((select) => {
                select.style.backgroundColor = e.target.value;
            });

            select_options.forEach((select_option) => {
                select_option.style.backgroundColor = e.target.value;
            });

            select_selected.forEach((select_selected) => {
                select_selected.style.backgroundColor = e.target.value;
            });

            select_selected_span.forEach((select_selected_span) => {
                select_selected_span.style.backgroundColor = e.target.value;
            });

            localStorage.setItem("theme-color-hover", tinycolor(e.target.value).darken(10).toString());
        });


        document.getElementById("restablecer-fondo").addEventListener("click", e => {
            const body = document.querySelector("body");
            body.style.background = "linear-gradient(#00000066, #00000066), black url('./assets/images/background/light.jpg') no-repeat center center fixed";

            const video = document.getElementById("video-background");
            const source = video.querySelector('source');

            source.src = "";
            video.load();

            localStorage.removeItem("background-img");
            localStorage.removeItem("background-video");

            new Alert().ShowAlert({
                title: lang.background_set_successfully,
                icon: "success",
            });
        })

        document.getElementById("obtener-socketid").addEventListener("click", e => {
            ipcRenderer.send("obtenerSocketID");
        });


        document.querySelector(".memory-slider").max = /* la RAM total del sistema */ Math.trunc(os.totalmem() / 1073741824 * 10) / 10;

        document.getElementById("theme-color-loading-screen").addEventListener("change", (e) => {
            localStorage.setItem("background-loading-screen-color", e.target.value);

            let rectangulos = document.querySelectorAll('.rectangulo');
            
            rectangulos.forEach((rectangulo, index) => {
                rectangulo.style.backgroundColor = e.target.value;
            });

        });

        
        document.getElementById("background-btn").addEventListener("click", async (e) => {
            let uuid = (await this.database.get("1234", "accounts-selected")).value;
            let account = this.database.getAccounts().find(account => account.uuid === uuid.selected);
            let isPremium;

            const accountDiv = document.getElementById(account.uuid);
            const accountName = accountDiv.querySelector('.account-name');
            if (accountName.querySelector('.fa-fire')) {
                isPremium = true;
                document.getElementById("animated-background-div").style.display = "";
                document.getElementById("not-animated-background-div").style.display = "none";
            } else {
                isPremium = false;
                document.getElementById("not-animated-background-div").style.display = "";
                document.getElementById("animated-background-div").style.display = "none";
            }
        });

        document.getElementById("resize-background-select").addEventListener("change", (e) => {
            console.log(e.target.value);
            if (e.target.value === "static-background") {
                document.getElementById("background-input").click();
            } else if (e.target.value === "animated-background") {
                document.getElementById("background-input-file").click();
            }
        });

        document.getElementById("background-input-file").addEventListener("change", (e) => {
            console.log(e.target.files[0]);
            let file = e.target.files[0];

            //si no acaba con mp4, return alert
            if (!file.name.endsWith(".mp4")) {
                new Alert().ShowAlert({
                    title: lang.invalid_file,
                    icon: "error",
                });
                return;
            }

                let video = document.getElementById("video-background");
                let source = video.querySelector('source');

                console.log(source);

                source.src = file.path;
                video.load();
                video.style.display = "";
                video.play();

                localStorage.setItem("background-video", file.path);
                new Alert().ShowAlert({
                    title: lang.background_set_successfully,
                    icon: "success",
                });
            

        });




        let modalUserInfo = document.getElementById('modaluserinfo');
        let modalSkin = document.getElementById('skin');

        let btnCerrar = document.getElementById('cerrar-userinfo-btn');
        let btnEliminarCuenta = document.getElementById('eliminarcuenta-userinfo-btn');
        let btnCerrar2 = document.getElementById('cerrar2-userinfo-btn');
        let btnCerrarSkin = document.getElementById('cerrar-skin-btn');

        btnCerrar.onclick = function() {
            modalUserInfo.classList.remove('is-active');
        }


        btnEliminarCuenta.onclick = function() {
            modalUserInfo.classList.remove('is-active');
        }

        btnCerrar2.onclick = function() {
            modalUserInfo.classList.remove('is-active');
        }

        let btnCerrarPreview = document.getElementById('cerrar-preview-btn');
        let preview = document.getElementById('modal-preview-background');

        btnCerrarPreview.onclick = function() {
            preview.classList.remove('is-active');
        }

        let fileInput = document.getElementById('background-input');
        fileInput.addEventListener('change', function() {
            handleFileSelect(this);
        });

        let saveClickListener = null;

        // Define la función handleFileSelect en el ámbito global
        function handleFileSelect(input) {
            const modalPreview = document.getElementById('modal-preview-background');
            const save = document.getElementById("establecer-fondo")
            let cropper = null;

            const result = document.querySelector('.result');
            const cropped = document.querySelector('.cropped');
            const img_result = document.querySelector('.img-result');

            modalPreview.classList.add('is-active');
            let file = input.files[0];

            let img = document.createElement('img');
            img.id = 'image';

            const reader = new FileReader();
            reader.onload = e => {
                if (e.target.result) {
                    img.src = e.target.result;
                    result.innerHTML = '';
                    result.appendChild(img);
                    cropper = new Cropper(img, {
                        aspectRatio: NaN,
                        viewMode: 1,
                        autoCropArea: 1,
                    });
                }
            };
            reader.readAsDataURL(file);

            save.addEventListener('click', e => {
                e.preventDefault();
                console.log("click");
                e.preventDefault();
                let imgSrc = cropper.getCroppedCanvas({
                    width: 960,
                }).toDataURL();
                cropped.classList.remove('hide');
                img_result.classList.remove('hide');
                cropped.src = imgSrc;

                const fs = require('fs');
                const path = require('path');

                let data = imgSrc.replace(/^data:image\/\w+;base64,/, "");
                let buf = Buffer.from(data, 'base64');

                fs.writeFile(path.join(`${dataDirectory}\\.battly\\battly\\background.png`), buf, function(err) {
                    if (err) console.log(err);
                });

                img.remove();

                modalPreview.classList.remove('is-active');

                //establecer el backgroundimage del body del html
                const body = document.querySelector("body");
                body.style.backgroundImage = `url(${imgSrc})`;
                body.style.backgroundRepeat = "no-repeat";
                body.style.backgroundSize = "cover";

                localStorage.setItem("background-img", imgSrc);

                new Alert().ShowAlert({
                    title: lang.background_set_successfully,
                    icon: "success",
                });

                return;
            });

            return;
        }


        let selectSonidoInicio = document.getElementById("sonido-inicio");
        let selectSonidoInicio_db = localStorage.getItem("sonido-inicio");

        if (selectSonidoInicio_db) {
            selectSonidoInicio.value = selectSonidoInicio_db;
        } else {
            selectSonidoInicio.value = "start";
            localStorage.setItem("sonido-inicio", "start");
        }

        selectSonidoInicio.addEventListener("change", (e) => {
            localStorage.setItem("sonido-inicio", e.target.value);
        });

        document.getElementById("reproducir-sonido-inicio").addEventListener("click", (e) => {
            let sonido_inicio = new Audio('./assets/audios/' + selectSonidoInicio.value + '.mp3');
            sonido_inicio.volume = 0.8;
            sonido_inicio.play();
        });
    }

    initAccount() {
        document.getElementById("copy-uuid").addEventListener("click", () => {
            let uuid = document.getElementById("user-uuid");
            navigator.clipboard.writeText(uuid.textContent);
            new Alert().ShowAlert({
                title: lang.uuid_copied_correctly,
                icon: "success",
            });

            document.getElementById("copy-uuid").classList.remove('fa-copy');
            document.getElementById("copy-uuid").classList.add('fa-check');

            setTimeout(() => {
                document.getElementById("copy-uuid").classList.remove('fa-check');
                document.getElementById("copy-uuid").classList.add('fa-copy');
            }, 2000);
        });
        document.querySelector('.accounts').addEventListener('click', async (e) => {
            if (e.target.id === "add-account") return;
            if (e.target.id === "add-account-btn") return;

            //obtener el div padre del elemento que se ha clickeado
            let div = e.target;
            console.log(div);
            //obtener el id del div padre
            let uuid = div.id;


            if (e.composedPath()[0].classList.contains('account') || e.composedPath()[0].classList.contains('account-image') || e.composedPath()[0].classList.contains('account-name')) {
                if (e.target.id === "user-name") {
                    uuid = e.target.parentElement.id;
                }
                accountSelect(uuid);
                this.database.update({
                    uuid: "1234",
                    selected: uuid
                }, 'accounts-selected');
            }

            //si contiene la clase fa-solid fa-fire
            if (e.target.classList.contains("fa-fire")) {
                console.log("es premium");
                const modal = document.createElement('div');
                modal.classList.add('modal', 'is-active');

                const modalBackground = document.createElement('div');
                modalBackground.classList.add('modal-background');

                const modalCard = document.createElement('div');
                modalCard.classList.add('modal-card');
                modalCard.style.backgroundColor = '#212121';
                modalCard.style.height = '90%';

                const modalHeader = document.createElement('header');
                modalHeader.classList.add('modal-card-head');
                modalHeader.style.backgroundColor = '#212121';

                const modalTitle = document.createElement('h1');
                modalTitle.classList.add('modal-card-title');
                modalTitle.textContent = "¡Felicidades!";
                modalTitle.style.color = '#fff';
                modalTitle.style.fontSize = '30px';
                modalTitle.style.fontWeight = '600';

                const closeButton = document.createElement('button');
                closeButton.classList.add('delete');
                closeButton.setAttribute('aria-label', 'close');
        
                closeButton.addEventListener('click', () => {
                    modal.classList.remove('is-active');
                    localStorage.setItem('WelcomePremiumShown', true);
                });

                const modalBody = document.createElement('section');
                modalBody.classList.add('modal-card-body');
                modalBody.style.backgroundColor = '#212121';

                const content = document.createElement('div');
                content.classList.add('content');
                content.style.color = '#fff';
                content.style.backgroundColor = '#212121';

                const texts = [
                    lang.premium_screen_1,
                    lang.premium_screen_2,
                    lang.premium_screen_3,
                    lang.premium_screen_4,
                    lang.premium_screen_5,
                    lang.premium_screen_6,
                    lang.premium_screen_7,
                    lang.premium_screen_8,
                    lang.premium_screen_9,
                    lang.premium_screen_10,
                    lang.premium_screen_11,
                    lang.premium_screen_12,
                ];


                for (let i = 0; i < texts.length; i++) {
                    if (i === 1 || i === 3 || i === 5 || i === 7 || i === 9) {
                        const h2 = document.createElement('h2');
                        h2.innerHTML = texts[i];
                        h2.style.color = '#fff';
                        h2.style.fontWeight = '600'
                        h2.style.marginBottom = '0px';
                        content.appendChild(h2);
                    } else {
                        const p = document.createElement('p');
                        p.innerHTML = texts[i];
                        p.style.color = '#fff';
                        p.style.fontWeight = '500'
                        p.style.marginBottom = '10px';
                        content.appendChild(p);
                    }
                }


                const modalFooter = document.createElement('footer');
                modalFooter.classList.add('modal-card-foot');
                modalFooter.style.backgroundColor = '#212121';

                const acceptButton = document.createElement('button');
                acceptButton.classList.add('button', 'is-info');
                acceptButton.textContent = 'Aceptar';
        
                acceptButton.addEventListener('click', () => {
                    modal.classList.remove('is-active');
                    localStorage.setItem('WelcomePremiumShown', true);
                });

                // Añadir elementos al modal
                modalHeader.appendChild(modalTitle);
                modalHeader.appendChild(closeButton);

                modalBody.appendChild(content);

                modalFooter.appendChild(acceptButton);

                modalCard.appendChild(modalHeader);
                modalCard.appendChild(modalBody);
                modalCard.appendChild(modalFooter);

                modal.appendChild(modalBackground);
                modal.appendChild(modalCard);

                document.body.appendChild(modal);
            }

            let selectedaccount = await this.database.get('1234', 'accounts-selected');

            if (e.target.classList.contains("account-delete") || e.target.classList.contains("fa-arrow-right")) {
                let div_ = e.target.parentElement;
                let uuid_ = div_.id;
                let modalUserInfo = document.getElementById('modaluserinfo');
                let userImage = document.getElementById('user-image');
                let userName = document.getElementById('user-name');
                let userUUID = document.getElementById('user-uuid');
                let btnMostrarSkin = document.getElementById('mostrarskin-userinfo-btn');


                let accounts = await this.database.getAccounts();
                let account = accounts.find(account => account.uuid === uuid ? uuid : uuid_);

                const axios = require('axios');
                
                try {
                    await axios.get(`https://api.battlylauncher.com/api/skin/${account.name}.png`);
                    userImage.style.backgroundImage = `url(https://api.battlylauncher.com/api/skin/${account.name}.png)`;

                    btnMostrarSkin.onclick = function () {
                        // Create the outermost div element
                        const modalDiv = document.createElement("div");
                        modalDiv.classList.add("modal");
                        modalDiv.classList.add("is-active");
                        modalDiv.id = "skin";

                        // Create the modal background div
                        const modalBackgroundDiv = document.createElement("div");
                        modalBackgroundDiv.classList.add("modal-background");

                        // Create the modal content div
                        const modalContentDiv = document.createElement("div");
                        modalContentDiv.classList.add("modal-content");
                        modalContentDiv.style.height = "60%";

                        // Create the style element
                        const styleElement = document.createElement("style");
                        styleElement.textContent = `
                            #skin-viewer *{ background-image: url('https://api.battlylauncher.com/api/skin/${account.name}.png'); }
                        `;

                        // Crear el elemento div del visor de piel
                        const skinViewerDiv = document.createElement("div");
                        skinViewerDiv.id = "skin-viewer";
                        skinViewerDiv.classList.add("mc-skin-viewer-11x", "spin");

                        // Crear el div del jugador
                        const playerDiv = document.createElement("div");
                        playerDiv.classList.add("player");

                        // Partes del cuerpo
                        const bodyParts = ["head", "body", "left-arm", "right-arm", "left-leg", "right-leg"];

                        // Crear cada parte del cuerpo
                        bodyParts.forEach((part) => {
                            const partDiv = document.createElement("div");
                            partDiv.classList.add(part);

                            // Elementos internos de cada parte
                            const innerElements = ["top", "left", "front", "right", "back", "bottom", "accessory"];
                            innerElements.forEach((innerElement) => {
                                const innerDiv = document.createElement("div");
                                innerDiv.classList.add(innerElement);
                                partDiv.appendChild(innerDiv);
                            });

                            playerDiv.appendChild(partDiv);
                        });

                        skinViewerDiv.appendChild(playerDiv);

                        // Create the close button
                        const closeButton = document.createElement("button");
                        closeButton.classList.add("modal-close", "is-large");
                        closeButton.setAttribute("aria-label", "close");
                        closeButton.id = "cerrar-skin-btn";

                        // Append all the elements to their respective parent elements
                        modalContentDiv.appendChild(styleElement);
                        skinViewerDiv.appendChild(playerDiv);
                        modalContentDiv.appendChild(skinViewerDiv);
                        modalDiv.appendChild(modalBackgroundDiv);
                        modalDiv.appendChild(modalContentDiv);
                        modalDiv.appendChild(closeButton);

                        // Append the entire modal to the document body or any other container element
                        document.body.appendChild(modalDiv);


                        closeButton.onclick = function () {
                            modalDiv.remove();
                        }

                    }
                } catch (error) {
                    userImage.style.backgroundImage = `url(https://minotar.net/skin/MHF_Steve.png)`;
                    btnMostrarSkin.onclick = function() {
                        // Create the outermost div element
                        const modalDiv = document.createElement("div");
                        modalDiv.classList.add("modal");
                        modalDiv.classList.add("is-active");
                        modalDiv.id = "skin";

                        // Create the modal background div
                        const modalBackgroundDiv = document.createElement("div");
                        modalBackgroundDiv.classList.add("modal-background");

                        // Create the modal content div
                        const modalContentDiv = document.createElement("div");
                        modalContentDiv.classList.add("modal-content");
                        modalContentDiv.style.height = "60%";

                        // Create the style element
                        const styleElement = document.createElement("style");
                        styleElement.textContent = `
                            #skin-viewer *{ background-image: url('https://minotar.net/skin/MHF_Steve.png'); }
                        `;

                        // Create the skin viewer div
                        const skinViewerDiv = document.createElement("div");
                        skinViewerDiv.id = "skin-viewer";
                        skinViewerDiv.classList.add("mc-skin-viewer-11x", "legacy", "legacy-cape", "spin");

                        // Create the player div
                        const playerDiv = document.createElement("div");
                        playerDiv.classList.add("player");

                        // Create the various body parts (Head, Body, Arms, Legs, Cape)
                        const bodyParts = ["head", "body", "left-arm", "right-arm", "left-leg", "right-leg", "cape"];
                        bodyParts.forEach((part) => {
                            const partDiv = document.createElement("div");
                            partDiv.classList.add(part);

                            // Create the inner elements for each body part (top, left, front, right, back, bottom, accessory)
                            const innerElements = ["top", "left", "front", "right", "back", "bottom", "accessory"];
                            innerElements.forEach((innerElement) => {
                                const innerDiv = document.createElement("div");
                                innerDiv.classList.add(innerElement);
                                partDiv.appendChild(innerDiv);
                            });

                            playerDiv.appendChild(partDiv);
                        });

                        // Create the close button
                        const closeButton = document.createElement("button");
                        closeButton.classList.add("modal-close", "is-large");
                        closeButton.setAttribute("aria-label", "close");
                        closeButton.id = "cerrar-skin-btn";

                        // Append all the elements to their respective parent elements
                        modalContentDiv.appendChild(styleElement);
                        skinViewerDiv.appendChild(playerDiv);
                        modalContentDiv.appendChild(skinViewerDiv);
                        modalDiv.appendChild(modalBackgroundDiv);
                        modalDiv.appendChild(modalContentDiv);
                        modalDiv.appendChild(closeButton);

                        // Append the entire modal to the document body or any other container element
                        document.body.appendChild(modalDiv);

                        closeButton.onclick = function() {
                            modalDiv.remove();
                        }

                    }
                }

                modalUserInfo.value = uuid;
                modalUserInfo.classList.add('is-active');

                let btnDeleteAccount = document.getElementById("eliminarcuenta-userinfo-btn")
                btnDeleteAccount.onclick = async () => {
                    let accounts = await this.database.getAccounts();
                    let account = accounts.find(account => account.uuid === uuid ? uuid : uuid_);
                    this.database.deleteAccount(account.uuid);
                    div_.remove();
                    modalUserInfo.classList.remove('is-active');
                    //eliminar el div de la cuenta seleccionada
                    document.getElementById(uuid ? uuid : uuid_).remove();
                    new Alert().ShowAlert({
                        title: lang.account_deleted_successfully,
                        icon: "success",
                    });

                    //si no hay cuentas, changePanel("login");
                    let accounts_ = await this.database.getAccounts();
                    if (!accounts_.length) {
                        changePanel("login");
                        document.querySelector(".cancel-login").style.display = "none";
                    }
                }

                userName.textContent = account.name;
                userUUID.textContent = account.uuid;


            } else if (e.target.id === "account-skin") {
                let modalSkin = document.getElementById('skin');
                let skinImage = document.getElementById('skin-image');
                let skinName = document.getElementById('skin-name');

                modalSkin.classList.add('is-active');
                let account = await this.database.getAccount(uuid);

                skinImage.style.backgroundImage = `url(https://api.battlylauncher.com/api/skin/${account.name}.png)`;
                skinName.textContent = account.name;
            }
        })

        document.getElementById('add-account-btn').addEventListener('click', () => {
            document.querySelector(".cancel-login").style.display = "contents";
            changePanel("login");
        })
    }

    async initRam() {
        let ramDatabase = (await this.database.get('1234', 'ram'))?.value;
        let totalMem = Math.trunc(os.totalmem() / 1073741824 * 10) / 10;
        let freeMem = Math.trunc(os.freemem() / 1073741824 * 10) / 10;

        document.getElementById("total-ram").textContent = `${totalMem} GB`;
        document.getElementById("free-ram").textContent = `${freeMem} GB`;

        let sliderDiv = document.querySelector(".memory-slider");
        sliderDiv.setAttribute("max", Math.trunc((100 * totalMem) / 100));

        let ram = ramDatabase ? ramDatabase : {
            ramMin: "0.5",
            ramMax: "0.5"
        };
        let slider = new Slider(".memory-slider", parseFloat(ram.ramMin), parseFloat(ram.ramMax));

        let minSpan = document.querySelector(".slider-touch-left span");
        let maxSpan = document.querySelector(".slider-touch-right span");

        minSpan.setAttribute("value", `${ram.ramMin} GB`);
        maxSpan.setAttribute("value", `${ram.ramMax} GB`);

        slider.on("change", (min, max) => {
            minSpan.setAttribute("value", `${min} GB`);
            maxSpan.setAttribute("value", `${max} GB`);
            this.database.update({
                uuid: "1234",
                ramMin: `${min}`,
                ramMax: `${max}`
            }, 'ram')
        });
    }

    async initResolution() {
        let resolutionDatabase = (await this.database.get('1234', 'screen'))?.value?.screen;
        let resolution = resolutionDatabase ? resolutionDatabase : {
            width: "1280",
            height: "720"
        };

        let width = document.querySelector(".width-size");
        width.value = resolution.width;

        let height = document.querySelector(".height-size");
        height.value = resolution.height;

        let select = document.getElementById("select");
        select.addEventListener("change", (event) => {
            let resolution = select.options[select.options.selectedIndex].value.split(" x ");
            select.options.selectedIndex = 0;

            width.value = resolution[0];
            height.value = resolution[1];
            this.database.update({
                uuid: "1234",
                screen: {
                    width: resolution[0],
                    height: resolution[1]
                }
            }, 'screen');
        });
    }

    async initLauncherSettings() {
        let launcherDatabase = (await this.database.get('1234', 'launcher'))?.value;
        let settingsLauncher = {
            uuid: "1234",
            launcher: {
                close: launcherDatabase?.launcher?.close || 'close-launcher',
                closeMusic: launcherDatabase?.launcher?.closeMusic || 'close-music'
            }
        }

        let closeLauncher = document.getElementById("launcher-close");
        let closeMusic = document.getElementById("music-close");
        let openLauncher = document.getElementById("launcher-open");
        let openMusic = document.getElementById("music-open");

        if (settingsLauncher.launcher.close === 'close-launcher') {
            closeLauncher.checked = true;
        } else if (settingsLauncher.launcher.close === 'open-launcher') {
            openLauncher.checked = true;
        }

        if (settingsLauncher.launcher.closeMusic === 'close-music') {
            closeMusic.checked = true;
        } else if (settingsLauncher.launcher.closeMusic === 'open-music') {
            openMusic.checked = true;
        }

        closeLauncher.addEventListener("change", () => {
            if (closeLauncher.checked) {
                openLauncher.checked = false;
            }
            if (!closeLauncher.checked) closeLauncher.checked = true;
            settingsLauncher.launcher.close = 'close-launcher';
            this.database.update(settingsLauncher, 'launcher');
        })

        openLauncher.addEventListener("change", () => {
            if (openLauncher.checked) {
                closeLauncher.checked = false;
            }
            if (!openLauncher.checked) openLauncher.checked = true;
            settingsLauncher.launcher.close = 'open-launcher';
            this.database.update(settingsLauncher, 'launcher');
        })

        closeMusic.addEventListener("change", () => {
            if (closeMusic.checked) {
                openMusic.checked = false;
            }
            if (!closeMusic.checked) closeMusic.checked = true;
            settingsLauncher.launcher.closeMusic = 'close-music';
            this.database.update(settingsLauncher, 'launcher');
        });

        openMusic.addEventListener("change", () => {
            if (openMusic.checked) {
                closeMusic.checked = false;
            }
            if (!openMusic.checked) openMusic.checked = true;
            settingsLauncher.launcher.closeMusic = 'open-music';
            this.database.update(settingsLauncher, 'launcher');
        });
    }

    initTab() {
        let TabBtn = document.querySelectorAll('.tab-btn');
        let TabContent = document.querySelectorAll('.tabs-settings-content');

        for (let i = 0; i < TabBtn.length; i++) {
            TabBtn[i].addEventListener('click', () => {
                if (TabBtn[i].classList.contains('save-tabs-btn')) return
                for (let j = 0; j < TabBtn.length; j++) {
                    TabContent[j].classList.remove('active-tab-content');
                    TabBtn[j].classList.remove('active-tab-btn');
                }
                TabContent[i].classList.add('active-tab-content');
                TabBtn[i].classList.add('active-tab-btn');
            });
        }

        document.querySelector('.save-tabs-btn').addEventListener('click', () => {
            document.querySelector('.default-tab-btn').click();

            let color = document.getElementById("theme-color");
            localStorage.setItem("theme-color", color.value);
            let color_bottom_bar = document.getElementById("theme-color-bottom-bar");
            localStorage.setItem("theme-color-bottom-bar", color_bottom_bar.value);

            changePanel("home");

            document.getElementById("loading-text").innerHTML = lang.settings_saved_successfully;


        })
    }

    async initSettingsDefault() {
        if (!(await this.database.getAll('accounts-selected')).length) {
            this.database.add({
                uuid: "1234"
            }, 'accounts-selected')
        }

        if (!(await this.database.getAll('java-args')).length) {
            this.database.add({
                uuid: "1234",
                args: []
            }, 'java-args')
        }

        if (!(await this.database.getAll('launcher')).length) {
            this.database.add({
                uuid: "1234",
                launcher: {
                    close: 'close-launcher'
                }
            }, 'launcher')
        }

        if (!(await this.database.getAll('ram')).length) {
            this.database.add({
                uuid: "1234",
                ramMin: "0.5",
                ramMax: "1"
            }, 'ram')
        }

        if (!(await this.database.getAll('screen')).length) {
            this.database.add({
                uuid: "1234",
                screen: {
                    width: "1280",
                    height: "720"
                }
            }, 'screen')
        }
    }


    async Java() {
        let javaPathText = document.getElementById("java-path-txt")
        javaPathText.textContent = `${dataDirectory}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}/runtime`;

        let configClient = localStorage.getItem("java-path")
        let javaPath = configClient?.java_config?.java_path || lang.java_path_didnt_set;
        let javaPathInputTxt = document.getElementById("ruta-java-input");
        let javaPathInputFile = document.getElementById("java-path-input-file");
        javaPathInputTxt.value = javaPath;

        document.getElementById("open-explorer-java-path").addEventListener("click", async () => {
            javaPathInputFile.value = '';
            javaPathInputFile.click();
            await new Promise((resolve) => {
                let interval;
                interval = setInterval(() => {
                    if (javaPathInputFile.value != '') resolve(clearInterval(interval));
                }, 100);
            });

            if (javaPathInputFile.value.replace(".exe", '').endsWith("java") || javaPathInputFile.value.replace(".exe", '').endsWith("javaw")) {
                let file = javaPathInputFile.files[0].path;
                javaPathInputTxt.value = file;
                localStorage.setItem("java-path", file);

                new Alert().ShowAlert({
                    title: lang.java_path_set_successfully,
                    icon: "success",
                });

            } else new Alert().ShowAlert({
                title: lang.the_file_name_java,
                icon: "error",
            });
        });

        document.getElementById("java-path-reset").addEventListener("click", async () => {
            javaPathInputTxt.value = 'Ruta de java no establecida';
            localStorage.removeItem("java-path");

            new Alert().ShowAlert({
                title: lang.java_path_reset_successfully,
                icon: "success",
            });
        });
    }
}
export default Settings;