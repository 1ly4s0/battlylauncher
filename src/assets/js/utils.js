/**
 * @author TECNO BROS
 
 */

import config from './utils/config.js';
import database from './utils/database.js';
import logger from './utils/logger.js';
import slider from './utils/slider.js';
const axios = require('axios');
const { ipcRenderer } = require('electron');
import { Alert } from "./utils/alert.js";

let lang;
import { Lang } from "./utils/lang.js";

export {
    config as config,
    database as database,
    logger as logger,
    changePanel as changePanel,
    addAccount as addAccount,
    slider as Slider,
    accountSelect as accountSelect
}

async function Langs() {
    lang = await new Lang().GetLang();
}

let db;
async function LoadDatabase() {
    db = await new database().init();
    console.log(`✅ Base de datos cargada`);

}

LoadDatabase();

Langs();

function changePanel(id) {
    const rectangulos = document.querySelectorAll('.rectangulo');
    const preloadContent = document.querySelector('.preload-content');
    document.getElementById("loading-text").innerHTML = "Cargando";

    preloadContent.style.display = "block"; // Muestra el contenido de carga

    setTimeout(() => {
        rectangulos.forEach((rectangulo, index) => {
            rectangulo.classList.toggle('subiendo', index === 0);
            rectangulo.classList.toggle('bajando', index === 1);
            rectangulo.classList.toggle('invertido');
        });

        document.getElementById("loading-text").innerHTML = "";
    }, 10);
    
    
    setTimeout(() => {
        let active = document.querySelector('.active');
        if (active) active.classList.toggle('active');
        let panel = document.querySelector(`.${id}`);
        panel.classList.add('active');
    }, 500);
    
    setTimeout(() => {
        document.getElementById("loading-text").innerHTML = "Listo";
        rectangulos.forEach((rectangulo, index) => {
            rectangulo.classList.toggle('subiendo', index === 0);
            rectangulo.classList.toggle('bajando', index === 1);
            rectangulo.classList.toggle('invertido');
        });

        document.getElementById("loading-text").innerHTML = "";
      
        setTimeout(() => {
            preloadContent.style.display = "none";
        }, 500);
    }, 1000);
}




async function addAccount(data, isPremium) {
    document.querySelector(".preload-content").style.display = "block";
    let div = document.createElement("div");
    div.classList.add("account");
    div.id = data.uuid;
    console.log(`✅ Cuenta: ${div.id} agregada`)
    div.innerHTML = `
        <img class="account-image mc-face-viewer-8x">
        <div class="account-name" id="user-name"> ${data.name}${isPremium ? '<i class="fa-solid fa-fire" style="cursor:pointer;margin-left:5px;"></i>' : ''}</div>
        <div class="account-delete"><i class="fa-solid fa-arrow-right" id="` + data.uuid + `"></i></div>
        `
    await document.querySelector('.accounts').appendChild(div);

    headplayer(data.uuid, data.name);
}

function accountSelect(uuid) {
    console.log(`✅ Cuenta seleccionada: ${uuid}`)
    let account = document.getElementById(uuid);
    let activeAccount = document.querySelector('.active-account');


    let accounts = db.getAccounts();
    let accountData = accounts.find(account => account.uuid === uuid);
    ipcRenderer.send('select-account', accountData);

    if (activeAccount) activeAccount.classList.toggle('active-account');
    account.classList.add('active-account');

    

    new Alert().ShowAlert({
        icon: 'success',
        title: lang.account_selected,
        text: `${lang.account_selected_text} ${account.querySelector('.account-name').innerHTML} ${lang.account_selected_text_two}`
    });

    
    if (account.querySelector('.account-name').innerHTML.includes('fa-solid fa-fire')) {
        console.log('Es premium');
        let WelcomePremiumShown = localStorage.getItem('WelcomePremiumShown');
        if (!WelcomePremiumShown || WelcomePremiumShown === 'false' || WelcomePremiumShown === null || WelcomePremiumShown === undefined) {
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
    }
    //headplayer(pseudo);
}

async function headplayer(id, pseudo) {
    try {
        await axios.get(`https://api.battlylauncher.com/api/skin/${pseudo}.png`)
        const element = document.querySelector(`[id="${id}"] .account-image`);
        element.style.backgroundImage = `url(https://api.battlylauncher.com/api/skin/${pseudo}.png)`
    } catch (error) {
        const element = document.querySelector(`[id="${id}"] .account-image`);
        element.style.backgroundImage = `url(https://minotar.net/skin/MHF_Steve.png)`
    }
}
