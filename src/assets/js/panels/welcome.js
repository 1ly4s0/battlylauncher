/**
 * @author TECNO BROS
 
 */

'use strict';

import { logger, database, changePanel } from '../utils.js';

const { ipcRenderer } = require('electron');
const pkg = require('../package.json');


const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)

class Welcome {
    static id = "welcome";
    async init(config, news) {
        this.config = config
        this.MostrarPrimerPanel();
        this.MostrarSegundoPanel();
    }

    async MostrarPrimerPanel() {
        document.getElementById("bienvenido_1").style.display = "block";
        document.getElementById("bienvenido_2").style.display = "none";
    }

    async MostrarSegundoPanel() {
        let BotonContinuar = document.getElementById("bienvenido_1_boton");
        BotonContinuar.addEventListener("click", () => {
            changePanel("login");
        });
    }
}
export default Welcome;