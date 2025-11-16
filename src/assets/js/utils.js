import config from './utils/config.js';
import database from './utils/database.js';
import logger from './utils/logger.js';
import slider from './utils/slider.js';
const axios = require('axios');
const { ipcRenderer } = require('electron');
const { trackEvent } = require("@aptabase/electron/renderer");
import { Alert } from "./utils/alert.js";
const { getValue, setValue } = require('./assets/js/utils/storage');
const AnalyticsHelper = require('./assets/js/utils/analyticsHelper.js');

const { Lang } = require("./assets/js/utils/lang.js");
let lang;

new Lang().GetLang().then(lang_ => {
    lang = lang_;
}).catch(error => {
    console.error("Error cargando idioma:", error);
});

export {
    config as config,
    database as database,
    logger as logger,
    changePanel as changePanel,
    addAccount as addAccount,
    slider as Slider,
    accountSelect as accountSelect
}

let db;

const dbReady = LoadDatabase();

async function LoadDatabase() {
    db = await new database().init();
    console.log(`✅ Base de datos cargada`);

    const user = await db.getSelectedAccount?.();
}

const LOAD_TIME = 400;
const PAUSE_INFO = 100;

async function changePanel(id) {
    if (id === 'home') {
        document.getElementById("loading-text").style.display = "none";
    }

    const overlay = document.getElementById('loader-overlay');
    const leftDiamond = overlay.querySelector('.diamond-left');
    const rightDiamond = overlay.querySelector('.diamond-right');
    const loadingText = document.getElementById('loading-text');

    const actualPanel = document.querySelector('.panel.active')
        ? document.querySelector('.panel.active').classList[1]
        : 'home';

    overlay.style.display = 'grid';
    overlay.classList.remove('inert', 'hide');
    [leftDiamond, rightDiamond].forEach(el => el.classList.remove('final'));

    const activo = document.querySelector('.panel.active');
    if (activo) activo.classList.remove('active');
    const panel = document.querySelector(`.${id}`);
    if (panel) panel.classList.add('active');

    overlay.classList.add('show');

    await new Promise(r => requestAnimationFrame(r));
    overlay.classList.remove('show');
    overlay.classList.add('hide');

    await new Promise(r => setTimeout(r, LOAD_TIME));
    await new Promise(r => setTimeout(r, PAUSE_INFO));

    [leftDiamond, rightDiamond].forEach(el => el.classList.add('final'));
    overlay.classList.add('inert');
    overlay.style.display = 'none';
    loadingText.textContent = '';

    console.log(`✅ Panel cambiado a: ${id}`);

    // Track panel change
    AnalyticsHelper.trackPanelChange(id)
        .catch(err => console.error('Error tracking panel change:', err));
}

async function addAccount(data, isPremium, isOffline) {
    document.querySelector(".preload-content").style.display = "block";

    const div = document.createElement("div");
    div.classList.add("b-settings-acc-card");
    div.id = data.uuid;
    div.dataset.uuid = data.uuid
    div.dataset.username = data.name || 'Desconocido';

    console.log(`✅ Cuenta: ${div.id} agregada`);
    div.innerHTML = `
        <div style="display:flex;align-items: center;gap: 20px;">
            <div class="account-image mc-face-viewer-8x" data-offline="${isOffline}"></div>
            <div class="account-name" id="user-name">
                ${data.name}
                ${isPremium ? '<i class="fa-solid fa-fire" style="cursor:pointer;margin-left:5px;"></i>' : ''}
                ${isOffline ? '<i class="fa-solid fa-cube" style="cursor:pointer;margin-left:5px;"></i>' : ''}
            </div>
        </div>
        <svg class="b-settings-menu-trigger" viewBox="0 0 24 24" width="18" height="18" stroke="#FFFFFF"
            stroke-width="2" fill="none">
            <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    `;

    const container = document.querySelector('#accounts');
    console.assert(container, '#accounts NO encontrado');
    container.appendChild(div);

    div.addEventListener('click', async (e) => {
        if (
            e.target.closest('i.fa-fire') ||
            e.target.closest('i.fa-cube') ||
            e.target.closest('.b-settings-menu-trigger')
        ) {
            return;
        }
        const selectedAccount = await db.getSelectedAccount();
        if (selectedAccount) {
            if (selectedAccount?.uuid === data.uuid) {
                console.log(`❗ La cuenta ${data.uuid} ya está seleccionada`);
                return;
            } else {
                accountSelect(data.uuid, true);
            }
        }
    });

    headplayer(data.uuid, data.name, isOffline);
}

async function accountSelect(uuid, reload = false) {
    console.log(`✅ Cuenta seleccionada: ${uuid}`);

    await dbReady;

    const account = document.getElementById(uuid);
    if (!account) {
        console.warn(`❗ No se encontró la tarjeta con id ${uuid}`);
        return;
    }

    const activeAccount = document.querySelector('.active-account');
    const previousAccount = activeAccount ? {
        uuid: activeAccount.id,
        name: activeAccount.dataset.username
    } : null;

    if (activeAccount) activeAccount.classList.remove('active-account');
    account.classList.add('active-account');

    let accounts = [];

    const accountData = await db.getAccount(uuid);
    if (accountData) {
        ipcRenderer.send('select-account', accountData);
        await setValue('selected-account', uuid);
    }

    const t = lang || {};
    const titleOk = t.account_selected || 'Cuenta seleccionada';
    const textOk1 = t.account_selected_text || 'Has seleccionado';
    const textOk2 = t.account_selected_text_two || 'como cuenta activa';
    const accNameText = (account.querySelector('.account-name')?.textContent || '').trim();

    if (reload) {
        new Alert().ShowAlert({
            icon: 'success',
            title: "Aplicando cambios. Battly se reiniciará en unos segundos...",
        });
        setTimeout(() => {
            ipcRenderer.send('reload-app');
        }, 2000);
        return;
    } else {
        new Alert().ShowAlert({
            icon: 'success',
            title: titleOk,
            text: `${textOk1} ${accNameText} ${textOk2}`
        });
    }

    const hasPremiumIcon = !!account.querySelector('.account-name i.fa-fire');

    const ads = document.getElementById("ads");
    const headerText = document.getElementById("header-text-to-add");
    const headerFrame = document.getElementById("header-frame");

    if (hasPremiumIcon) {
        if (ads) ads.style.display = "none";
        if (headerText) headerText.innerHTML = "Premium Edition";
        if (headerFrame) headerFrame.style.background = 'linear-gradient(45deg, #C9A635, #B8860B, #A1752D, #8B6914, #70590E)';

        let WelcomePremiumShown = await getValue('WelcomePremiumShown');
        if (!WelcomePremiumShown || WelcomePremiumShown === 'false') {
            const modal = document.createElement('div');
            modal.classList.add('modal', 'is-active');

            const modalBackground = document.createElement('div');
            modalBackground.classList.add('modal-background');

            const modalCard = document.createElement('div');
            modalCard.classList.add('modal-card', 'modal-animated');
            modalCard.style.backgroundColor = '#0f1623';
            modalCard.style.height = '90%';

            const modalHeader = document.createElement('header');
            modalHeader.classList.add('modal-card-head');
            modalHeader.style.backgroundColor = '#0f1623';

            const modalTitle = document.createElement('h1');
            modalTitle.classList.add('modal-card-title');
            modalTitle.textContent = "¡Felicidades!";
            modalTitle.style.color = '#fff';
            modalTitle.style.fontSize = '30px';
            modalTitle.style.fontWeight = '600';

            const closeButton = document.createElement('button');
            closeButton.classList.add('delete');
            closeButton.setAttribute('aria-label', 'close');

            closeButton.addEventListener('click', async () => {
                modal.classList.remove('is-active');
                await setValue('WelcomePremiumShown', true);
            });

            const modalBody = document.createElement('section');
            modalBody.classList.add('modal-card-body');
            modalBody.style.backgroundColor = '#0f1623';

            const content = document.createElement('div');
            content.classList.add('content');
            content.style.color = '#fff';
            content.style.backgroundColor = '#0f1623';

            const texts = [
                t.premium_screen_1, t.premium_screen_2, t.premium_screen_3, t.premium_screen_4,
                t.premium_screen_5, t.premium_screen_6, t.premium_screen_7, t.premium_screen_8,
                t.premium_screen_9, t.premium_screen_10, t.premium_screen_11, t.premium_screen_12,
            ].filter(Boolean);

            for (let i = 0; i < texts.length; i++) {
                if (i === 1 || i === 3 || i === 5 || i === 7 || i === 9) {
                    const h2 = document.createElement('h2');
                    h2.innerHTML = texts[i];
                    content.appendChild(h2);
                } else {
                    const p = document.createElement('p');
                    p.innerHTML = texts[i];
                    content.appendChild(p);
                }
            }

            const modalFooter = document.createElement('footer');
            modalFooter.classList.add('modal-card-foot');
            modalFooter.style.backgroundColor = '#0f1623';

            const acceptButton = document.createElement('button');
            acceptButton.classList.add('button', 'is-info');
            acceptButton.textContent = 'Aceptar';

            acceptButton.addEventListener('click', async () => {
                modal.classList.remove('is-active');
                await setValue('WelcomePremiumShown', true);
            });

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
    } else {
        if (headerText) headerText.innerHTML = "Free Edition";
        if (headerFrame) headerFrame.style.background = `#0f1623`;
        if (ads) ads.style.display = "";
    }
}

async function headplayer(id, pseudo, isOffline) {
    if (!isOffline) {
        try {
            await axios.get(`https://api.battlylauncher.com/api/skin/${pseudo}.png`)
            const element = document.querySelector(`[id="${id}"] .account-image`);
            element.style.backgroundImage = `url(https://api.battlylauncher.com/api/skin/${pseudo}.png)`
        } catch (error) {
            const element = document.querySelector(`[id="${id}"] .account-image`);
            element.style.backgroundImage = `url(https://minotar.net/skin/MHF_Steve.png)`
        }
    } else {
        const element = document.querySelector(`[id="${id}"] .account-image`);
        element.style.backgroundImage = `url(https://minotar.net/skin/${pseudo}.png)`
    }
}

