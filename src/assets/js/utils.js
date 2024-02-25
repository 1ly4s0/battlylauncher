/**
 * @author TECNO BROS
 
 */

import config from './utils/config.js';
import database from './utils/database.js';
import logger from './utils/logger.js';
import slider from './utils/slider.js';
const axios = require('axios');

export {
    config as config,
    database as database,
    logger as logger,
    changePanel as changePanel,
    addAccount as addAccount,
    slider as Slider,
    accountSelect as accountSelect
}


function changePanel(id) {
    let panel = document.querySelector(`.${id}`);
    let active = document.querySelector(`.active`)
    if (active) active.classList.toggle("active");
    panel.classList.add("active");
}

async function addAccount(data) {
    
    document.querySelector(".preload-content").style.display = "block";
    let div = document.createElement("div");
    div.classList.add("account");
    div.id = data.uuid;
    console.log(`✅ Cuenta: ${div.id} agregada`)
    div.innerHTML = `
        <img class="account-image mc-face-viewer-8x">
        <div class="account-name" id="user-name">${data.name}</div>
        <div class="account-delete"><i class="fa-solid fa-arrow-right" id="` + data.uuid + `"></i></div>
        `
    await document.querySelector('.accounts').appendChild(div);

    headplayer(data.uuid, data.name);
}

function accountSelect(uuid) {
    console.log(`✅ Cuenta seleccionada: ${uuid}`)
    let account = document.getElementById(uuid);
    let activeAccount = document.querySelector('.active-account')

    if (activeAccount) activeAccount.classList.toggle('active-account');
    account.classList.add('active-account');
    //headplayer(pseudo);
}

async function headplayer(id, pseudo) {
    try {
        await axios.get(`http://api.battlylauncher.com/api/skin/${pseudo}.png`)
        const element = document.querySelector(`[id="${id}"] .account-image`);
        element.style.backgroundImage = `url(http://api.battlylauncher.com/api/skin/${pseudo}.png)`
    } catch (error) {
        const element = document.querySelector(`[id="${id}"] .account-image`);
        element.style.backgroundImage = `url(https://minotar.net/skin/MHF_Steve.png)`
    }
}
