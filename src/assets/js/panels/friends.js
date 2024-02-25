/**
 * @author TECNO BROS
 
 */

'use strict';

import { logger, database, changePanel } from '../utils.js';

const { ipcRenderer } = require('electron');
const pkg = require('../package.json');
const fetch = require('node-fetch');
const axios = require("axios");

const Swal = require("./assets/js/libs/sweetalert/sweetalert2.all.min");
const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
});

let amigos;

const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)
import { Lang } from "../utils/lang.js";

class Friends {
    static id = "friends";
    async init(config, news) {
        this.config = config;
        this.database = await new database().init();
        this.lang = await new Lang().GetLang();
        this.AddFriend();
        this.Solicitudes();
        this.GetOnlineUsers();
        this.ObtenerAmigos();
        this.Chat();
    }

    async Chat() {
        document.getElementById("chat-btn").addEventListener("click", () => {
            changePanel("chat");
        });

        document.getElementById("back-chat-btn").addEventListener("click", () => {
            changePanel("friends");
        });
    }

    async GetOnlineUsers() {
        ipcRenderer.send("socket", "getOnlineUsers", {});

        ipcRenderer.on("onlineUsers", (e, data) => {
        });

        ipcRenderer.on('amigos', async (e, amigos_) => {
            amigos = amigos_;
        });
    }

    async AddFriend() {
        let btnAddFriends = document.getElementById('add-friends');
        
        let uuid = (await this.database.get("1234", "accounts-selected")).value;
        let account = (await this.database.get(uuid.selected, "accounts")).value;

        btnAddFriends.addEventListener('click', (e) => {
            // Crear el elemento modal
            const modal = document.createElement('div');
            modal.className = 'modal is-active';

            // Crear el fondo del modal
            const modalBackground = document.createElement('div');
            modalBackground.className = 'modal-background';

            // Crear el contenido del modal
            const modalCard = document.createElement('div');
            modalCard.className = 'modal-card';

            // Crear el encabezado del modal
            const modalHeader = document.createElement('header');
            modalHeader.className = 'modal-card-head';

            const modalTitle = document.createElement('p');
            modalTitle.className = 'modal-card-title';
            modalTitle.textContent = this.lang.add_friend_text;

            const closeButton = document.createElement('button');
            closeButton.className = 'delete';
            closeButton.setAttribute('aria-label', 'close');

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);

            // Crear el cuerpo del modal
            const modalBody = document.createElement('section');
            modalBody.className = 'resultado-amigos modal-card-body';

            const inputContainer = document.createElement('div');
            inputContainer.className = 'content';

            const inputControl = document.createElement('div');
            inputControl.className = 'control is-info';

            const input = document.createElement('input');
            input.className = 'input';
            input.setAttribute('type', 'text');
            input.setAttribute('placeholder', this.lang.username);

            inputControl.appendChild(input);
            inputContainer.appendChild(inputControl);
            modalBody.appendChild(inputContainer);

            // Crear el contenido de la caja en el cuerpo del modal
            //crea un div

            const users = document.createElement('div');
            modalBody.appendChild(users);

            // Crear el pie del modal
            const modalFooter = document.createElement('footer');
            modalFooter.className = 'modal-card-foot';

            const searchButton = document.createElement('button');
            searchButton.className = 'button is-info';
            searchButton.textContent = this.lang.search;

            modalFooter.appendChild(searchButton);

            // Agregar elementos al modal
            modalCard.appendChild(modalHeader);
            modalCard.appendChild(modalBody);
            modalCard.appendChild(modalFooter);

            modal.appendChild(modalBackground);
            modal.appendChild(modalCard);

            // Agregar el modal al documento
            document.body.appendChild(modal);

            closeButton.addEventListener('click', () => {
                modal.remove();
            });

            searchButton.addEventListener('click', () => {
                inputControl.classList.add('is-loading');
                input.setAttribute('disabled', 'disabled');

                users.innerHTML = '';

                fetch('http://api.battlylauncher.com/api/users/buscarUsuarios', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: input.value
                    })
                }).then(res => res.json()).then(async res => {
                    inputControl.classList.remove('is-loading');
                    input.removeAttribute('disabled');

                    if (res.error) {
                        console.error(res.error);
                        return;
                    }

                    /* para cada usuario en el array de respuesta (data.usuarios) => crear esto:

                    <div class="box">
                    <article class="media">
                        <div class="media-left">
                            <figure class="image is-32x32">
                                <img src="https://bulma.io/images/placeholders/128x128.png" alt="Image">
                            </figure>
                        </div>
                        <div class="media-content">
                            <div class="content">
                                <p style="font-size: 20px;">
                                    Usuario
                                </p>
                            </div>
                        </div>
                        <div class="media-right" style="display: flex; align-items: center;">
                            <button class="button is-info is-square" style="margin-left: auto; height: 30px; width: 10px;">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </article>
                    </div>

                    Y añadirlo debajo del input

                    */
                    
                    for (let user of res.usuarios) {
                        try {
                            await axios.get(`http://api.battlylauncher.com/api/skin/${user}.png`)
                            const box = document.createElement('div');
                            box.className = 'box';

                            const mediaArticle = document.createElement('article');
                            mediaArticle.className = 'media';

                            const mediaLeft = document.createElement('div');
                            mediaLeft.className = 'media-left';

                            // Crear la imagen dentro del visor de cara
                            const imgInsideFaceViewer = document.createElement('img');
                            imgInsideFaceViewer.className = 'mc-face-viewer-8x';

                            mediaLeft.appendChild(imgInsideFaceViewer);

                            const mediaContent = document.createElement('div');
                            mediaContent.className = 'media-content';

                            const content = document.createElement('div');
                            content.className = 'content';

                            const userParagraph = document.createElement('p');
                            userParagraph.style.fontSize = '20px';
                            userParagraph.textContent = user;

                            content.appendChild(userParagraph);
                            mediaContent.appendChild(content);

                            const mediaRight = document.createElement('div');
                            mediaRight.className = 'media-right';
                            mediaRight.style.display = 'flex';
                            mediaRight.style.alignItems = 'center';

                            const addButton = document.createElement('button');
                            addButton.className = 'button is-info is-square';
                            addButton.style.marginLeft = 'auto';
                            addButton.style.height = '30px';
                            addButton.style.width = '30px';

                            const plusIcon = document.createElement('i');
                            plusIcon.className = 'fa-solid fa-plus';

                            addButton.appendChild(plusIcon);
                            mediaRight.appendChild(addButton);

                            mediaArticle.appendChild(mediaLeft);
                            mediaArticle.appendChild(mediaContent);
                            mediaArticle.appendChild(mediaRight);

                            box.appendChild(mediaArticle);
                            users.appendChild(box);
                            imgInsideFaceViewer.style.backgroundImage = `url(http://api.battlylauncher.com/api/skin/${user}.png)`


                            addButton.addEventListener('click', () =>
                            {

                                let amigosArray = [];
                                for (let amigo of amigos) {
                                    amigosArray.push(amigo.username);
                                }
                                
                                if (user == account.name) {
                                    Toast.fire({
                                        icon: "error",
                                        title: this.lang.you_cannot_add_yourself
                                    });
                                    return;
                                } else if (amigosArray.includes(user)) {
                                    Toast.fire({
                                        icon: "error",
                                        title: this.lang.you_already_have_this_friend,
                                    });
                                    return;
                                } else {
                                    ipcRenderer.send('enviarSolicitud', {
                                        sender: account.name,
                                        sended: user,
                                        password: account.password
                                    });

                                    Toast.fire({
                                        icon: "success",
                                        title: `${this.lang.request_sent_to} ${user} ${this.lang.correctly}.`,
                                    });
                                }
                            });
                                    
                        } catch (error) {
                            console.log(`❌ Error al obtener la skin de ${user}.`);
                            const box = document.createElement('div');
                            box.className = 'box';

                            const mediaArticle = document.createElement('article');
                            mediaArticle.className = 'media';

                            const mediaLeft = document.createElement('div');
                            mediaLeft.className = 'media-left';

                            // Crear la imagen dentro del visor de cara
                            const imgInsideFaceViewer = document.createElement('img');
                            imgInsideFaceViewer.className = 'mc-face-viewer-8x';

                            mediaLeft.appendChild(imgInsideFaceViewer);

                            const mediaContent = document.createElement('div');
                            mediaContent.className = 'media-content';

                            const content = document.createElement('div');
                            content.className = 'content';

                            const userParagraph = document.createElement('p');
                            userParagraph.style.fontSize = '20px';
                            userParagraph.textContent = user;

                            content.appendChild(userParagraph);
                            mediaContent.appendChild(content);

                            const mediaRight = document.createElement('div');
                            mediaRight.className = 'media-right';
                            mediaRight.style.display = 'flex';
                            mediaRight.style.alignItems = 'center';

                            const addButton = document.createElement('button');
                            addButton.className = 'button is-info is-square';
                            addButton.style.marginLeft = 'auto';
                            addButton.style.height = '30px';
                            addButton.style.width = '30px';

                            const plusIcon = document.createElement('i');
                            plusIcon.className = 'fa-solid fa-plus';

                            addButton.appendChild(plusIcon);
                            mediaRight.appendChild(addButton);

                            mediaArticle.appendChild(mediaLeft);
                            mediaArticle.appendChild(mediaContent);
                            mediaArticle.appendChild(mediaRight);

                            box.appendChild(mediaArticle);
                            users.appendChild(box);
                            imgInsideFaceViewer.style.backgroundImage = `url(https://minotar.net/skin/MHF_Steve.png)`

                            addButton.addEventListener('click', () =>
                            {

                                let amigosArray = [];
                                for (let amigo of amigos) {
                                    amigosArray.push(amigo.username);
                                }
                                
                                if (user == account.name) {
                                    Toast.fire({
                                        icon: "error",
                                        title: this.lang.you_cannot_add_yourself
                                    });
                                    return;
                                } else if (amigosArray.includes(user)) {
                                    Toast.fire({
                                        icon: "error",
                                        title: this.lang.you_already_have_this_friend,
                                    });
                                    return;
                                } else {
                                    ipcRenderer.send('enviarSolicitud', {
                                        sender: account.name,
                                        sended: user,
                                        password: account.password
                                    });

                                    Toast.fire({
                                        icon: "success",
                                        title: `${this.lang.request_sent_to} ${user} ${this.lang.correctly}.`,
                                    });
                                }
                            });
                        }
                    }

                }).catch(err => {
                    inputControl.classList.remove('is-loading');
                    input.removeAttribute('disabled');
                    console.error(err);
                });
            });

        });
    }



    async Solicitudes() {
        let btnSolicitudes = document.getElementById('solicitudes');
        let uuid = (await this.database.get("1234", "accounts-selected")).value;
        let account = (await this.database.get(uuid.selected, "accounts")).value;

        // Definir la función del evento fuera del addEventListener
        const handleSolicitudesClick = async (e) => {
            // Crear el elemento modal
            const modal = document.createElement('div');
            modal.className = 'modal is-active';

            // Crear el fondo del modal
            const modalBackground = document.createElement('div');
            modalBackground.className = 'modal-background';

            // Crear el contenido del modal
            const modalCard = document.createElement('div');
            modalCard.className = 'modal-card';

            // Crear el encabezado del modal
            const modalHeader = document.createElement('header');
            modalHeader.className = 'modal-card-head';

            const modalTitle = document.createElement('p');
            modalTitle.className = 'modal-card-title';
            modalTitle.textContent = this.lang.friend_requests;

            const closeButton = document.createElement('button');
            closeButton.className = 'delete';
            closeButton.setAttribute('aria-label', 'close');

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);

            closeButton.addEventListener('click', () => {
                modal.remove();
            });

            // Crear el cuerpo del modal
            const modalBody = document.createElement('section');
            modalBody.className = 'modal-card-body';

            ipcRenderer.send('obtener-solicitudes', {
                username: account.name,
                password: account.password
            });
            ipcRenderer.on('solicitudes', async (e, solicitudes) => {

                if (solicitudes.enviadas.length == 0 && solicitudes.recibidas.length == 0) {
                    const box = document.createElement('div');
                    box.className = 'box';

                    const article = document.createElement('article');
                    article.className = 'media';

                    const mediaLeft = document.createElement('div');
                    mediaLeft.className = 'media-left';

                    const img = document.createElement('img');
                    img.className = 'mc-face-viewer-8x';
                    mediaLeft.appendChild(img);

                    const mediaContent = document.createElement('div');
                    mediaContent.className = 'media-content';

                    const content = document.createElement('div');
                    content.className = 'content';

                    const userParagraph = document.createElement('p');
                    userParagraph.style.fontSize = '20px';
                    userParagraph.textContent = this.lang.you_dont_have_any_friend_requests;

                    content.appendChild(userParagraph);
                    mediaContent.appendChild(content);

                    article.appendChild(mediaLeft);
                    article.appendChild(mediaContent);

                    box.appendChild(article);

                    modalBody.appendChild(box);
                    
                    img.style.backgroundImage = "url('https://minotar.net/skin/MHF_Steve.png')";
                }

                for (let solicitud of solicitudes.recibidas) {
                    try {
                        await axios.get(`http://api.battlylauncher.com/api/skin/${solicitud}.png`)

                        const box1 = document.createElement('div');
                        box1.className = 'box';

                        const article1 = document.createElement('article');
                        article1.className = 'media';

                        const mediaLeft1 = document.createElement('div');
                        mediaLeft1.className = 'media-left';

                        const img1 = document.createElement('img');
                        img1.className = 'mc-face-viewer-8x';

                        mediaLeft1.appendChild(img1);

                        const mediaContent1 = document.createElement('div');
                        mediaContent1.className = 'media-content';

                        const content1 = document.createElement('div');
                        content1.className = 'content';

                        const userParagraph1 = document.createElement('p');
                        userParagraph1.style.fontSize = '20px';
                        userParagraph1.textContent = solicitud;

                        content1.appendChild(userParagraph1);
                        mediaContent1.appendChild(content1);

                        const mediaRight1 = document.createElement('div');
                        mediaRight1.className = 'media-right';
                        mediaRight1.style.display = 'flex';
                        mediaRight1.style.flexDirection = 'column';
                        mediaRight1.style.alignItems = 'center';

                        const acceptButton1 = document.createElement('button');
                        acceptButton1.className = 'button is-success is-square';
                        acceptButton1.style.height = '30px';
                        acceptButton1.style.width = '10px';

                        const acceptIcon1 = document.createElement('i');
                        acceptIcon1.className = 'fa-solid fa-check';

                        acceptButton1.appendChild(acceptIcon1);
                        mediaRight1.appendChild(acceptButton1);

                        const rejectButton1 = document.createElement('button');
                        rejectButton1.className = 'button is-danger is-square';
                        rejectButton1.style.height = '30px';
                        rejectButton1.style.width = '10px';
                        rejectButton1.style.marginTop = '5px';

                        const rejectIcon1 = document.createElement('i');
                        rejectIcon1.className = 'fa-solid fa-xmark';

                        rejectButton1.appendChild(rejectIcon1);
                        mediaRight1.appendChild(rejectButton1);

                        article1.appendChild(mediaLeft1);
                        article1.appendChild(mediaContent1);
                        article1.appendChild(mediaRight1);

                        box1.appendChild(article1);

                        modalBody.appendChild(box1);
                        img1.style.backgroundImage = "url('http://api.battlylauncher.com/api/skin/" + solicitud + ".png')";


                        closeButton.addEventListener('click', () => {
                            modal.remove();
                        });

                        acceptButton1.addEventListener('click', () => {
                            ipcRenderer.send('aceptar-solicitud', {
                                username: account.name,
                                solicitud: solicitud,
                                password: account.password
                            });

                            Toast.fire({
                                icon: "success",
                                title: this.lang.request_accepted
                            });

                            modal.remove();
                        });

                        rejectButton1.addEventListener('click', () => {
                            ipcRenderer.send('rechazar-solicitud', {
                                username: account.name,
                                solicitud: solicitud,
                                password: account.password
                            });

                            Toast.fire({
                                icon: "success",
                                title: this.lang.request_rejected
                            });

                            modal.remove();
                        });
                    } catch (error) {
                            console.log(`❌ Error al obtener la skin de ${user}.`);
                        const box1 = document.createElement('div');
                        box1.className = 'box';

                        const article1 = document.createElement('article');
                        article1.className = 'media';

                        const mediaLeft1 = document.createElement('div');
                        mediaLeft1.className = 'media-left';

                        const img1 = document.createElement('img');
                        img1.className = 'mc-face-viewer-8x';

                        mediaLeft1.appendChild(img1);

                        const mediaContent1 = document.createElement('div');
                        mediaContent1.className = 'media-content';

                        const content1 = document.createElement('div');
                        content1.className = 'content';

                        const userParagraph1 = document.createElement('p');
                        userParagraph1.style.fontSize = '20px';
                        userParagraph1.textContent = solicitud;

                        content1.appendChild(userParagraph1);
                        mediaContent1.appendChild(content1);

                        const mediaRight1 = document.createElement('div');
                        mediaRight1.className = 'media-right';
                        mediaRight1.style.display = 'flex';
                        mediaRight1.style.flexDirection = 'column';
                        mediaRight1.style.alignItems = 'center';

                        const acceptButton1 = document.createElement('button');
                        acceptButton1.className = 'button is-success is-square';
                        acceptButton1.style.height = '30px';
                        acceptButton1.style.width = '10px';

                        const acceptIcon1 = document.createElement('i');
                        acceptIcon1.className = 'fa-solid fa-check';

                        acceptButton1.appendChild(acceptIcon1);
                        mediaRight1.appendChild(acceptButton1);

                        const rejectButton1 = document.createElement('button');
                        rejectButton1.className = 'button is-danger is-square';
                        rejectButton1.style.height = '30px';
                        rejectButton1.style.width = '10px';
                        rejectButton1.style.marginTop = '5px';

                        const rejectIcon1 = document.createElement('i');
                        rejectIcon1.className = 'fa-solid fa-xmark';

                        rejectButton1.appendChild(rejectIcon1);
                        mediaRight1.appendChild(rejectButton1);

                        article1.appendChild(mediaLeft1);
                        article1.appendChild(mediaContent1);
                        article1.appendChild(mediaRight1);

                        box1.appendChild(article1);

                        modalBody.appendChild(box1);
                        img1.style.backgroundImage = "url('https://minotar.net/skin/MHF_Steve.png')";


                        closeButton.addEventListener('click', () => {
                            modal.remove();
                        });

                        acceptButton1.addEventListener('click', () => {
                            ipcRenderer.send('aceptar-solicitud', {
                                username: account.name,
                                solicitud: solicitud,
                                password: account.password
                            });

                            Toast.fire({
                                icon: "success",
                                title: this.lang.request_accepted
                            });

                            modal.remove();
                        });

                        rejectButton1.addEventListener('click', () => {
                            ipcRenderer.send('rechazar-solicitud', {
                                username: account.name,
                                solicitud: solicitud,
                                password: account.password
                            });

                            Toast.fire({
                                icon: "success",
                                title: this.lang.request_rejected
                            });

                            modal.remove();
                        });
                    }
                }

                for (let solicitud of solicitudes.enviadas) {
                    try {
                        await axios.get(`http://api.battlylauncher.com/api/skin/${solicitud}.png`)
                    
                        // Crear el segundo cuadro de solicitud
                        const box2 = document.createElement('div');
                        box2.className = 'box';

                        const article2 = document.createElement('article');
                        article2.className = 'media';

                        const mediaLeft2 = document.createElement('div');
                        mediaLeft2.className = 'media-left';

                        const img2 = document.createElement('img');
                        img2.className = 'mc-face-viewer-8x';

                        mediaLeft2.appendChild(img2);

                        const mediaContent2 = document.createElement('div');
                        mediaContent2.className = 'media-content';

                        const content2 = document.createElement('div');
                        content2.className = 'content';

                        const userParagraph2 = document.createElement('p');
                        userParagraph2.style.fontSize = '20px';
                        userParagraph2.textContent = solicitud;

                        content2.appendChild(userParagraph2);
                        mediaContent2.appendChild(content2);

                        const mediaRight2 = document.createElement('div');
                        mediaRight2.className = 'media-right';
                        mediaRight2.style.display = 'flex';
                        mediaRight2.style.flexDirection = 'column';
                        mediaRight2.style.alignItems = 'center';

                        const rejectButton2 = document.createElement('button');
                        rejectButton2.className = 'button is-danger is-square';
                        rejectButton2.style.height = '30px';
                        rejectButton2.style.width = '10px';
                        rejectButton2.style.marginTop = '5px';

                        const rejectIcon2 = document.createElement('i');
                        rejectIcon2.className = 'fa-solid fa-ban';

                        rejectButton2.appendChild(rejectIcon2);
                        mediaRight2.appendChild(rejectButton2);

                        article2.appendChild(mediaLeft2);
                        article2.appendChild(mediaContent2);
                        article2.appendChild(mediaRight2);

                        box2.appendChild(article2);

                        modalBody.appendChild(box2);
                        img2.style.backgroundImage = "url('http://api.battlylauncher.com/api/skin/" + solicitud + ".png')";
                    } catch (error) {
                            console.log(`❌ Error al obtener la skin de ${user}.`);
                        // Crear el segundo cuadro de solicitud
                        const box2 = document.createElement('div');
                        box2.className = 'box';

                        const article2 = document.createElement('article');
                        article2.className = 'media';

                        const mediaLeft2 = document.createElement('div');
                        mediaLeft2.className = 'media-left';

                        const img2 = document.createElement('img');
                        img2.className = 'mc-face-viewer-8x';

                        mediaLeft2.appendChild(img2);

                        const mediaContent2 = document.createElement('div');
                        mediaContent2.className = 'media-content';

                        const content2 = document.createElement('div');
                        content2.className = 'content';

                        const userParagraph2 = document.createElement('p');
                        userParagraph2.style.fontSize = '20px';
                        userParagraph2.textContent = solicitud;

                        content2.appendChild(userParagraph2);
                        mediaContent2.appendChild(content2);

                        const mediaRight2 = document.createElement('div');
                        mediaRight2.className = 'media-right';
                        mediaRight2.style.display = 'flex';
                        mediaRight2.style.flexDirection = 'column';
                        mediaRight2.style.alignItems = 'center';

                        const rejectButton2 = document.createElement('button');
                        rejectButton2.className = 'button is-danger is-square';
                        rejectButton2.style.height = '30px';
                        rejectButton2.style.width = '10px';
                        rejectButton2.style.marginTop = '5px';

                        const rejectIcon2 = document.createElement('i');
                        rejectIcon2.className = 'fa-solid fa-ban';

                        rejectButton2.appendChild(rejectIcon2);
                        mediaRight2.appendChild(rejectButton2);

                        article2.appendChild(mediaLeft2);
                        article2.appendChild(mediaContent2);
                        article2.appendChild(mediaRight2);

                        box2.appendChild(article2);

                        modalBody.appendChild(box2);
                        img2.style.backgroundImage = "url('https://minotar.net/skin/MHF_Steve.png')";
                    }
                }
            });


            // Crear el pie del modal
            const modalFooter = document.createElement('footer');
            modalFooter.className = 'modal-card-foot';

            // Agregar elementos al modal
            modalCard.appendChild(modalHeader);
            modalCard.appendChild(modalBody);
            modalCard.appendChild(modalFooter);

            modal.appendChild(modalBackground);
            modal.appendChild(modalCard);
            
            
            document.body.appendChild(modal);
        };

        // Añadir el manejador de eventos al botón
        btnSolicitudes.addEventListener('click', handleSolicitudesClick);
    }


    async ObtenerAmigos() {
        let btnAmigos = document.getElementById('friends-btn');
        let uuid = (await this.database.get("1234", "accounts-selected")).value;
        let account = (await this.database.get(uuid.selected, "accounts")).value;

        let panelAmigos = document.getElementById('lista-de-amigos');

        let amigosObtenidos = false;

        // Definir la función del evento fuera del addEventListener
        btnAmigos.addEventListener('click', async (e) => {
            panelAmigos.innerHTML = '';
        
            document.querySelector(".preload-content").style.display = "block";
            const loadingText = document.getElementById("loading-text");
            loadingText.innerHTML = this.lang.loading_friends;

            ipcRenderer.send('obtener-amigos', {
                username: account.name,
                password: account.password
            });

            setTimeout(() => {
                if (!amigosObtenidos) {
                    console.log('❌ Error al obtener la lista de amigos. Comprueba tu conexión a internet y vuelve a intentarlo más tarde.');
                    const box = document.createElement('div');
                    box.className = 'box';

                    const article = document.createElement('article');
                    article.className = 'media';

                    const mediaLeft = document.createElement('div');
                    mediaLeft.className = 'media-left';

                    const img = document.createElement('div');
                    img.className = 'mc-face-viewer-8x';
                    img.style.backgroundImage = "url('https://minotar.net/skin/MHF_Steve.png')";
                    mediaLeft.appendChild(img);

                    const mediaContent = document.createElement('div');
                    mediaContent.className = 'media-content';

                    const content = document.createElement('div');
                    content.className = 'content';

                    const userParagraph = document.createElement('p');
                    userParagraph.style.fontSize = '20px';
                    userParagraph.textContent = this.lang.error_loading_friends;
                    userParagraph.style.textAlign = 'center';

                    content.appendChild(userParagraph);
                    mediaContent.appendChild(content);

                    article.appendChild(mediaContent);

                    box.appendChild(article);

                    panelAmigos.appendChild(box);

                    document.querySelector(".preload-content").style.display = "none";
                }
            }, 10000);

        });

        let amigosOnline = [];
        let amigosAusente = [];
        let amigosOffline = [];
        ipcRenderer.on('amigos', async (e, amigos) => {

            amigosObtenidos = true;
        
            if (amigos.length == 0) {
                const box = document.createElement('div');
                box.className = 'box';

                const article = document.createElement('article');
                article.className = 'media';

                const mediaLeft = document.createElement('div');
                mediaLeft.className = 'media-left';

                const img = document.createElement('div');
                img.className = 'mc-face-viewer-8x';
                img.style.backgroundImage = "url('https://minotar.net/skin/MHF_Steve.png')";
                mediaLeft.appendChild(img);

                const mediaContent = document.createElement('div');
                mediaContent.className = 'media-content';

                const content = document.createElement('div');
                content.className = 'content';

                const userParagraph = document.createElement('p');
                userParagraph.style.fontSize = '20px';
                userParagraph.textContent = 'No tienes amigos';

                content.appendChild(userParagraph);
                mediaContent.appendChild(content);

                article.appendChild(mediaLeft);
                article.appendChild(mediaContent);

                box.appendChild(article);

                panelAmigos.appendChild(box);

                document.querySelector(".preload-content").style.display = "none";
            }

            //ordenar los amigos para mostrar los que están ausentes, online y offline
            let amigosOrdenados = amigos.sort((a, b) => {
                if (a.estado === "ausente" && b.estado === "online") {
                    return -1;
                } else if (a.estado === "ausente" && b.estado === "offline") {
                    return -1;
                } else if (a.estado === "online" && b.estado === "ausente") {
                    return 1;
                } else if (a.estado === "online" && b.estado === "offline") {
                    return -1;
                } else if (a.estado === "offline" && b.estado === "ausente") {
                    return 1;
                } else if (a.estado === "offline" && b.estado === "online") {
                    return 1;
                } else {
                    //ordenar alfabéticamente ignorando mayúsculas
                    let nameA = a.username.toUpperCase();
                    let nameB = b.username.toUpperCase();
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    return 0;
                }
            });

            for (let amigo of amigosOrdenados) {
                let username = amigo.username;
                let status = amigo.estado;
                let details = amigo.details ? amigo.details : 'Offline';

                if (status === "online") {
                    try {
                        await axios.get(`http://api.battlylauncher.com/api/skin/${username}.png`)

                    
                        const box = document.createElement('div');
                        box.className = 'box friend-card';

                        const article = document.createElement('article');
                        article.className = 'media';

                        const mediaLeft = document.createElement('div');
                        mediaLeft.className = 'media-left';

                        const figure = document.createElement('figure');
                        figure.className = 'image is-64x64';

                        const img = document.createElement('div');
                        img.className = 'mc-face-viewer-8x';
                        img.alt = 'Image';
                        img.style.borderRadius = '5px';

                        const statusOverlay = document.createElement('div');
                        statusOverlay.className = 'status-overlay';

                        const statusImg = document.createElement('img');
                        statusImg.src = 'assets/images/icon.png';
                        statusImg.alt = 'Status';
                        statusImg.style.width = '25px';
                        statusImg.style.borderRadius = '5px';

                        statusOverlay.appendChild(statusImg);
                        figure.appendChild(img);
                        figure.appendChild(statusOverlay);
                        mediaLeft.appendChild(figure);

                        const mediaContent = document.createElement('div');
                        mediaContent.className = 'media-content';

                        const content = document.createElement('div');
                        content.className = 'content';

                        const strong = document.createElement('strong');
                        strong.className = 'friend-username';
                        strong.textContent = username;

                        const span = document.createElement('span');
                        span.style.marginLeft = '3px';

                        const statusImg2 = document.createElement('img');
                        statusImg2.src = 'assets/images/status/online.png';
                        statusImg2.alt = '';
                        statusImg2.style.width = '15px';
                        statusImg2.style.display = 'inline';

                        span.appendChild(statusImg2);

                        const br = document.createElement('br');

                        const status = document.createElement('span');
                        status.textContent = this.lang.in_the_main_menu;

                        // Agregamos la etiqueta <p> y colocamos strong, span, br y status dentro de ella
                        const paragraph = document.createElement('p');
                        paragraph.appendChild(strong);
                        paragraph.appendChild(span);
                        paragraph.appendChild(br);
                        paragraph.appendChild(status);

                        content.appendChild(paragraph);
                        mediaContent.appendChild(content);

                        article.appendChild(mediaLeft);
                        article.appendChild(mediaContent);

                        box.appendChild(article);

                        panelAmigos.appendChild(box);
                        img.style.backgroundImage = `url('http://api.battlylauncher.com/api/skin/${username}.png')`;

                    } catch (error) {
                            console.log(`❌ Error al obtener la skin de ${username}.`);

                        const box = document.createElement('div');
                        box.className = 'box friend-card';

                        const article = document.createElement('article');
                        article.className = 'media';

                        const mediaLeft = document.createElement('div');
                        mediaLeft.className = 'media-left';

                        const figure = document.createElement('figure');
                        figure.className = 'image is-64x64';

                        const img = document.createElement('div');
                        img.className = 'mc-face-viewer-8x';
                        img.alt = 'Image';
                        img.style.borderRadius = '5px';

                        const statusOverlay = document.createElement('div');
                        statusOverlay.className = 'status-overlay';

                        const statusImg = document.createElement('img');
                        statusImg.src = 'assets/images/icon.png';
                        statusImg.alt = 'Status';
                        statusImg.style.width = '25px';
                        statusImg.style.borderRadius = '5px';

                        statusOverlay.appendChild(statusImg);
                        figure.appendChild(img);
                        figure.appendChild(statusOverlay);
                        mediaLeft.appendChild(figure);

                        const mediaContent = document.createElement('div');
                        mediaContent.className = 'media-content';

                        const content = document.createElement('div');
                        content.className = 'content';

                        const strong = document.createElement('strong');
                        strong.className = 'friend-username';
                        strong.textContent = username;

                        const span = document.createElement('span');
                        span.style.marginLeft = '3px';

                        const statusImg2 = document.createElement('img');
                        statusImg2.src = 'assets/images/status/online.png';
                        statusImg2.alt = '';
                        statusImg2.style.width = '15px';
                        statusImg2.style.display = 'inline';

                        span.appendChild(statusImg2);

                        const br = document.createElement('br');

                        const status = document.createElement('span');
                        status.textContent = this.lang.in_the_main_menu;

                        // Agregamos la etiqueta <p> y colocamos strong, span, br y status dentro de ella
                        const paragraph = document.createElement('p');
                        paragraph.appendChild(strong);
                        paragraph.appendChild(span);
                        paragraph.appendChild(br);
                        paragraph.appendChild(status);

                        content.appendChild(paragraph);
                        mediaContent.appendChild(content);

                        article.appendChild(mediaLeft);
                        article.appendChild(mediaContent);

                        box.appendChild(article);

                        panelAmigos.appendChild(box);
                        img.style.backgroundImage = `url('https://minotar.net/skin/MHF_Steve.png')`;
                    }

                } else if (status === "ausente") {
                    
                    let version;
                    let icon;

                    if (details.includes("Forge")) {
                        version = "Forge";
                        icon = "https://pbs.twimg.com/profile_images/778706890914095109/fhMDH9o6_400x400.jpg";
                    } else if (details.includes("Fabric")) {
                        version = "Fabric";
                        icon = "https://battlylauncher.com/assets/img/fabric.png";
                    } else if (details.includes("Quilt")) {
                        version = "Quilt";
                        icon = "https://battlylauncher.com/assets/img/quilt.png";
                    } else if (details.includes("OptiFine")) {
                        version = "OptiFine";
                        icon = "https://cdn.discordapp.com/attachments/933698201486237716/1170390085561237674/OptiFine_Logo.webp";
                    } else if (details.includes("Vanilla")) {
                        version = "Vanilla";
                        icon = "https://battlylauncher.com/assets/img/vanilla.png";
                    } else if (details.includes("LabyMod")) {
                        version = "LabyMod";
                        icon = "https://battlylauncher.com/assets/img/labymod.png";
                    } else if (details.includes("CMPack")) {
                        version = "CMPack";
                        icon = "https://battlylauncher.com/assets/img/cmpack.png";
                    } else if (details.includes("Ares")) {
                        version = "Ares";
                        icon = "https://battlylauncher.com/assets/img/ares.png";
                    } else if (details.includes("BatMod")) {
                        version = "BatMod";
                        icon = "https://battlylauncher.com/assets/img/batmod.png";
                    } else if (details.includes("Battly")) {
                        version = "Battly";
                        icon = "https://battlylauncher.com/assets/img/logo_500.png";
                    } else {
                        version = "Desconocida";
                        icon = "https://battlylauncher.com/assets/img/logo_500.png";
                    }

                    try {
                        await axios.get(`http://api.battlylauncher.com/api/skin/${username}.png`)

                        const box = document.createElement('div');
                        box.className = 'box friend-card';

                        const article = document.createElement('article');
                        article.className = 'media';

                        const mediaLeft = document.createElement('div');
                        mediaLeft.className = 'media-left';

                        const figure = document.createElement('figure');
                        figure.className = 'image is-64x64';

                        const img = document.createElement('div');
                        img.className = 'mc-face-viewer-8x';
                        img.alt = 'Image';
                        img.style.borderRadius = '5px';

                        const statusOverlay = document.createElement('div');
                        statusOverlay.className = 'status-overlay';

                        const statusImg = document.createElement('img');
                        statusImg.src = icon;
                        statusImg.alt = 'Status';
                        statusImg.style.width = '25px';
                        statusImg.style.borderRadius = '5px';
                    
                        statusOverlay.appendChild(statusImg);
                        figure.appendChild(img);
                        figure.appendChild(statusOverlay);
                        mediaLeft.appendChild(figure);

                        const mediaContent = document.createElement('div');
                        mediaContent.className = 'media-content';
                    
                        const content = document.createElement('div');
                        content.className = 'content';

                        const strong = document.createElement('strong');
                        strong.className = 'friend-username';
                        strong.textContent = username;

                        const span = document.createElement('span');
                        span.style.marginLeft = '3px';

                        const statusImg2 = document.createElement('img');
                        statusImg2.src = 'assets/images/status/idle.png';
                        statusImg2.alt = '';
                        statusImg2.style.width = '15px';
                        statusImg2.style.display = 'inline';

                        span.appendChild(statusImg2);

                        const br = document.createElement('br');

                        const status = document.createElement('span');
                        status.textContent = details;

                        const paragraph = document.createElement('p');
                        paragraph.appendChild(strong);
                        paragraph.appendChild(span);
                        paragraph.appendChild(br);
                        paragraph.appendChild(status);

                        content.appendChild(paragraph);
                        mediaContent.appendChild(content);

                        article.appendChild(mediaLeft);
                        article.appendChild(mediaContent);

                        box.appendChild(article);

                        panelAmigos.appendChild(box);
                        img.style.backgroundImage = `url('http://api.battlylauncher.com/api/skin/${username}.png')`;
                    } catch (error) {
                            console.log(`❌ Error al obtener la skin de ${username}.`);
                        const box = document.createElement('div');
                        box.className = 'box friend-card';

                        const article = document.createElement('article');
                        article.className = 'media';

                        const mediaLeft = document.createElement('div');
                        mediaLeft.className = 'media-left';

                        const figure = document.createElement('figure');
                        figure.className = 'image is-64x64';

                        const img = document.createElement('div');
                        img.className = 'mc-face-viewer-8x';
                        img.alt = 'Image';
                        img.style.borderRadius = '5px';

                        const statusOverlay = document.createElement('div');
                        statusOverlay.className = 'status-overlay';

                        const statusImg = document.createElement('img');
                        statusImg.src = icon;
                        statusImg.alt = 'Status';
                        statusImg.style.width = '25px';
                        statusImg.style.borderRadius = '5px';
                    
                        statusOverlay.appendChild(statusImg);
                        figure.appendChild(img);
                        figure.appendChild(statusOverlay);
                        mediaLeft.appendChild(figure);

                        const mediaContent = document.createElement('div');
                        mediaContent.className = 'media-content';
                    
                        const content = document.createElement('div');
                        content.className = 'content';

                        const strong = document.createElement('strong');
                        strong.className = 'friend-username';
                        strong.textContent = username;

                        const span = document.createElement('span');
                        span.style.marginLeft = '3px';

                        const statusImg2 = document.createElement('img');
                        statusImg2.src = 'assets/images/status/idle.png';
                        statusImg2.alt = '';
                        statusImg2.style.width = '15px';
                        statusImg2.style.display = 'inline';

                        span.appendChild(statusImg2);

                        const br = document.createElement('br');

                        const status = document.createElement('span');
                        status.textContent = details;

                        const paragraph = document.createElement('p');
                        paragraph.appendChild(strong);
                        paragraph.appendChild(span);
                        paragraph.appendChild(br);
                        paragraph.appendChild(status);

                        content.appendChild(paragraph);
                        mediaContent.appendChild(content);

                        article.appendChild(mediaLeft);
                        article.appendChild(mediaContent);

                        box.appendChild(article);

                        panelAmigos.appendChild(box);
                        img.style.backgroundImage = `url('https://minotar.net/skin/MHF_Steve.png')`;
                    }

                } else {                    
                    try {
                        await axios.get(`http://api.battlylauncher.com/api/skin/${username}.png`)
                    
                        const box = document.createElement('div');
                        box.className = 'box friend-card';

                        const article = document.createElement('article');
                        article.className = 'media';

                        const mediaLeft = document.createElement('div');
                        mediaLeft.className = 'media-left';

                        const figure = document.createElement('figure');
                        figure.className = 'image is-64x64';

                        const img = document.createElement('div');
                        img.className = 'mc-face-viewer-8x';
                        img.alt = 'Image';
                        img.style.borderRadius = '5px';

                        figure.appendChild(img);
                        mediaLeft.appendChild(figure);

                        const mediaContent = document.createElement('div');
                        mediaContent.className = 'media-content';

                        const content = document.createElement('div');
                        content.className = 'content';

                        const strong = document.createElement('strong');
                        strong.className = 'friend-username';
                        strong.textContent = username;

                        const span = document.createElement('span');
                        span.style.marginLeft = '3px';

                        const statusImg = document.createElement('img');
                        statusImg.src = 'assets/images/status/offline.png';
                        statusImg.alt = '';
                        statusImg.style.width = '15px';
                        statusImg.style.display = 'inline';

                        span.appendChild(statusImg);

                        const br = document.createElement('br');

                        const status = document.createElement('span');
                        status.textContent = 'Offline';

                        const paragraph = document.createElement('p');
                        paragraph.appendChild(strong);
                        paragraph.appendChild(span);
                        paragraph.appendChild(br);
                        paragraph.appendChild(status);

                        content.appendChild(paragraph);
                        mediaContent.appendChild(content);

                        article.appendChild(mediaLeft);
                        article.appendChild(mediaContent);

                        box.appendChild(article);

                        panelAmigos.appendChild(box);
                        img.style.backgroundImage = `url('http://api.battlylauncher.com/api/skin/${username}.png')`;
                    }
                    
                    catch (error) {
                            console.log(`❌ Error al obtener la skin de ${username}.`);
                        const box = document.createElement('div');
                        box.className = 'box friend-card';

                        const article = document.createElement('article');
                        article.className = 'media';

                        const mediaLeft = document.createElement('div');
                        mediaLeft.className = 'media-left';

                        const figure = document.createElement('figure');
                        figure.className = 'image is-64x64';

                        const img = document.createElement('div');
                        img.className = 'mc-face-viewer-8x';
                        img.alt = 'Image';
                        img.style.borderRadius = '5px';

                        figure.appendChild(img);
                        mediaLeft.appendChild(figure);

                        const mediaContent = document.createElement('div');
                        mediaContent.className = 'media-content';

                        const content = document.createElement('div');
                        content.className = 'content';

                        const strong = document.createElement('strong');
                        strong.className = 'friend-username';
                        strong.textContent = username;

                        const span = document.createElement('span');
                        span.style.marginLeft = '3px';

                        const statusImg = document.createElement('img');
                        statusImg.src = 'assets/images/status/offline.png';
                        statusImg.alt = '';
                        statusImg.style.width = '15px';
                        statusImg.style.display = 'inline';

                        span.appendChild(statusImg);

                        const br = document.createElement('br');

                        const status = document.createElement('span');
                        status.textContent = 'Offline';

                        const paragraph = document.createElement('p');
                        paragraph.appendChild(strong);
                        paragraph.appendChild(span);
                        paragraph.appendChild(br);
                        paragraph.appendChild(status);

                        content.appendChild(paragraph);
                        mediaContent.appendChild(content);

                        article.appendChild(mediaLeft);
                        article.appendChild(mediaContent);

                        box.appendChild(article);

                        panelAmigos.appendChild(box);
                        img.style.backgroundImage = `url('https://minotar.net/skin/MHF_Steve.png')`;
                    }
                }

                document.querySelector(".preload-content").style.display = "none";
            }
        });
    }
}
export default Friends;