/**
 * @author TECNO BROS
 
 */

'use strict';
const {
	ipcRenderer
} = require('electron');
import {
	config
} from './utils.js';

let dev = process.env.NODE_ENV === 'dev';
const fs = require('fs');
const fetch = require('node-fetch');
const axios = require("axios");
import { Lang } from './utils/lang.js';

// Crea una instancia de la clase Lang
const langInstance = new Lang();

// Llama a GetLang en la instancia


/**
 * Represents the Splash class.
 * @class
 */
class Splash {
	/**
	 * Creates an instance of Splash.
	 * @constructor
	 */
	constructor() {
		this.splash = document.querySelector(".splash");
		this.splashMessage = document.querySelector(".splash-message");
		this.splashAuthor = document.querySelector(".splash-author");
		this.message = document.querySelector(".message");
		this.progress = document.querySelector("progress");
		document.addEventListener('DOMContentLoaded', () => this.startAnimation());
		langInstance.GetLang().then(lang => {
			this.lang = lang;
			this.message.innerHTML = this.lang.salutate;
		}).catch(error => {
			console.error(error);
		});
	}


	/**
	 * Starts the splash animation.
	 * @async
	 */
	async startAnimation() {
		let splashes = [{
			"message": "Battly Launcher",
			"author": "TECNO BROS"
		},]
		
		let sonidoDB = localStorage.getItem("sonido-inicio") ? localStorage.getItem("sonido-inicio") : "start";
		let sonido_inicio = new Audio('./assets/audios/' + sonidoDB + '.mp3');
		sonido_inicio.volume = 0.8;
		let splash = splashes[Math.floor(Math.random() * splashes.length)];
		this.splashMessage.textContent = splash.message;
		this.splashAuthor.children[0].textContent = "" + splash.author;
		await sleep(100);
		document.querySelector("#splash").style.display = "block";
		await sleep(500);
		sonido_inicio.play();
		this.splash.classList.add("opacity");
		await sleep(500);
		this.splash.classList.add("translate");
		this.splashMessage.classList.add("opacity");
		this.splashAuthor.classList.add("opacity");
		this.message.classList.add("opacity");
		await sleep(1000);
		
		fetch("https://google.com").then(async () => {
			this.checkUpdate();
	}).catch(async () => {
			this.setStatus(this.lang.checking_connection);
			await sleep(2000);
			this.setStatus(this.lang.no_connection);
			await sleep(3000);
			this.setStatus(this.lang.starting_battly);
			await sleep(500);
			this.startLauncher();
		})
		
	}

	/**
	 * Checks for updates.
	 * @async
	 */
	async checkUpdate() {
		if(dev) return sleep(500).then(async () => { 
			
		//aplicar las animaciones pero al reves
		this.splash.classList.remove("translate");
		this.splashMessage.classList.remove("opacity");
		this.splashAuthor.classList.remove("opacity");
		await sleep(500);
		this.startLauncher(); 
		});
		this.setStatus(this.lang.checking_updates);
		
		ipcRenderer.invoke('update-app').then(err => {
			if(err) {
            	if (err.error) {
                	let error = err.message;
					error = error.toString().slice(0, 50);
                	this.shutdown(`${this.lang.update_error}${error}`);
            	}
			}
        })

        ipcRenderer.on('updateAvailable', () => {
            this.setStatus(this.lang.update_available);
            this.toggleProgress();
            
			let boton_actualizar = document.getElementById("btn_actualizar");
			boton_actualizar.style.display = "block";
			boton_actualizar.addEventListener("click", () => {
				this.setStatus(this.lang.downloading_update);			
				ipcRenderer.send('start-update');
			})

			let boton_cancelar = document.getElementById("btn_jugar");
			boton_cancelar.style.display = "block";
			boton_cancelar.addEventListener("click", () => {
				this.setStatus(this.lang.update_cancelled);
				this.maintenanceCheck();
			})
        })

        ipcRenderer.on('download-progress', (event, progress) => {
            this.setProgress(progress.transferred, progress.total);
        })

        ipcRenderer.on('update-not-available', () => {
            this.maintenanceCheck();
        })

		ipcRenderer.on('update-downloaded', async () => {
			this.setStatus(this.lang.update_downloaded);
			await sleep(5000);
			this.toggleProgress();
			ipcRenderer.send('update-window-close');
			ipcRenderer.send('start-update');
		}
		)
	}

	/**
	 * Checks for maintenance mode.
	 * @async
	 */
	async maintenanceCheck() {
		config.GetConfig().then(async res => {
			if (res.maintenance) return this.shutdown(res.maintenance_message);
			this.setStatus(this.lang.starting_launcher);
			
		//aplicar las animaciones pero al reves
		this.splash.classList.remove("translate");
		this.splashMessage.classList.remove("opacity");
		this.splashAuthor.classList.remove("opacity");
		await sleep(500);
			setTimeout(() => {
				this.startLauncher();
			}, 1000);
			return true;
		}).catch(e => {
			console.error(e);
			return this.shutdown(this.lang.error_connecting_server);
		})
	}

	/**
	 * Starts the launcher.
	 * @async
	 */
	async startLauncher() {
		this.setStatus(this.lang.ending);
		await sleep(500);
		ipcRenderer.send('main-window-open');
		ipcRenderer.send('update-window-close');
	}

	/**
	 * Shuts down the launcher.
	 * @param {string} text - The shutdown message.
	 */
	shutdown(text) {
		this.setStatus(`${text}<br>Cerrando 10s`);
		let i = 10;
		setInterval(() => {
			this.setStatus(`${text}<br>${this.lang.closing_countdown} ${i}s`);
			if (i < 0) ipcRenderer.send('update-window-close');
		}, 1000);
	}

	/**
	 * Sets the status message.
	 * @param {string} text - The status message.
	 */
	setStatus(text) {
		this.message.innerHTML = text;
	}

	/**
	 * Toggles the progress bar.
	 */
	toggleProgress() {
		if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
	}

	/**
	 * Sets the progress bar value.
	 * @param {number} value - The progress value.
	 * @param {number} max - The maximum progress value.
	 */
	setProgress(value, max) {
		this.progress.value = value;
		this.progress.max = max;
	}
		

}

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
	if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
		ipcRenderer.send("update-window-dev-tools");
	}
})
new Splash();
