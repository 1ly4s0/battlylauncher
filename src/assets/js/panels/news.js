/**
 * @author TECNO BROS
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

import { logger, database, changePanel } from '../utils.js';

const { Launch, Status } = require('minecraft-java-core');
const { ipcRenderer } = require('electron');
const launch = new Launch();
const pkg = require('../package.json');
const rpc = require('discord-rpc');
const client = new rpc.Client({ transport: 'ipc' });

const Swal = require('sweetalert2');

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

const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)

class NewsPanel {
    static id = "news";
    async init(config, news) {
        this.config = config
        this.First();
    }

    async First() {
    let card1 = document.getElementById('card1');
    let card2 = document.getElementById('card2');
    let card3 = document.getElementById('card3');
    let card4 = document.getElementById('card4');
    let card5 = document.getElementById('card5');

    let btnShowPanel2 = document.getElementById('show-panel-2');
    let btnShowPanel3 = document.getElementById('show-panel-3');
    let btnShowPanel4 = document.getElementById('show-panel-4');
    let btnShowPanel5 = document.getElementById('show-panel-5');
    let btnTerminar = document.getElementById('terminar');

    btnShowPanel2.addEventListener('click', showCard2);
    btnShowPanel3.addEventListener('click', showCard3);
    btnShowPanel4.addEventListener('click', showCard4);
    btnShowPanel5.addEventListener('click', showCard5);
    btnTerminar.addEventListener('click', terminar);

    card1.style.display = '';
    card2.style.display = 'none';
    card3.style.display = 'none';
    card4.style.display = 'none';
    card5.style.display = 'none';
    
    function showCard2() {
      card1.classList.add('animate__zoomOutUp');
  
      // Después de aplicar la animación, espera a que termine y luego oculta la tarjeta nuevamente
      card1.addEventListener('animationend', function () {
        card1.style.display = 'none';
        card2.style.display = 'block';
        card2.classList.add('animate__jackInTheBox');
      });
    }

    function showCard3() {
      card2.classList.add('animate__zoomOutUp');
  
      // Después de aplicar la animación, espera a que termine y luego oculta la tarjeta nuevamente
      card2.addEventListener('animationend', function () {
        card2.style.display = 'none';
        card3.style.display = 'block';
        card3.classList.add('animate__jackInTheBox');
      });
    }

    function showCard4() {
      card3.classList.add('animate__zoomOutUp');
  
      // Después de aplicar la animación, espera a que termine y luego oculta la tarjeta nuevamente
      card3.addEventListener('animationend', function () {
        card3.style.display = 'none';
        card4.style.display = 'block';
        card4.classList.add('animate__jackInTheBox');
      });
    }

    function showCard5() {
      card4.classList.add('animate__zoomOutUp');
  
      // Después de aplicar la animación, espera a que termine y luego oculta la tarjeta nuevamente
      card4.addEventListener('animationend', function () {
        card4.style.display = 'none';
        card5.style.display = 'block';
        card5.classList.add('animate__jackInTheBox');
      });
    }

    function terminar() {
        card5.classList.add('animate__zoomOutUp');
        card5.addEventListener('animationend', function () {
            card5.style.display = 'none';
        });
  
        // Después de aplicar la animación, espera a que termine y luego oculta la tarjeta nuevamente
        let preload = document.querySelector(".preload-content");
        preload.style.display = "";

        Toast.fire({
          title: '¡Disfruta ❤️!',
        })

        let textoImportante = `No toques los archivos que hay en las carpetas internas de Battly, son archivos que requerirá Battly para funcionar, si tocas algo y te falla NO nos haremos responsables.

        Battly Team.`

        const fs = require('fs');
        const path = require('path');
        if(!fs.existsSync(`${dataDirectory}/.battly`)) {
          fs.mkdirSync(path.join(`${dataDirectory}/.battly/battly`), {
            recursive: true
          });
        }
        if(!fs.existsSync(`${dataDirectory}/.battly/battly/mods-internos`)) {
          fs.mkdirSync(path.join(`${dataDirectory}/.battly/battly/mods-internos`), {
            recursive: true
          });
        }
        if(!fs.existsSync(`${dataDirectory}/.battly/battly/IMPORTANTE.txt`)) {
        fs.writeFileSync(path.join(`${dataDirectory}/.battly/battly`, 'IMPORTANTE.txt'), textoImportante);
        }

        setTimeout(() => {
            localStorage.setItem('news_shown_v1.6', true);
            changePanel('home');

            let preload = document.querySelector(".preload-content");
            preload.style.display = "none";
        }, 1000);

      
    }
    }
}
export default NewsPanel;