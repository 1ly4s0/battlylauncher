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
let lang;

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
		this.LoadLang();
		this.splash = document.querySelector(".splash");
		this.splashMessage = document.querySelector(".splash-message");
		this.splashAuthor = document.querySelector(".splash-author");
		this.message = document.querySelector(".message");
		this.progress = document.querySelector("progress");
		document.addEventListener('DOMContentLoaded', () => this.startAnimation());
	}

	async LoadLang() {
		lang = await new Lang().GetLang();
		this.message.innerHTML = lang.salutate;
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
		document.querySelector(".splash").style.display = "block";
		document.querySelector(".splash").classList.add("animate__animated", "animate__jackInTheBox")
		await sleep(500);
		sonido_inicio.play();
		this.splash.classList.add("opacity");
		await sleep(500);
		document.querySelector("#splash").style.display = "block";
		this.splash.classList.add("translate");
		this.splashMessage.classList.add("animate__animated", "animate__flipInX");
		this.splashAuthor.classList.add("animate__animated", "animate__flipInX");
		this.message.classList.add("animate__animated", "animate__flipInX");
		await sleep(1000);
		
		fetch("https://google.com").then(async () => {
			this.checkUpdate();
	}).catch(async () => {
			this.setStatus(lang.checking_connection);
			await sleep(2000);
			this.setStatus(lang.no_connection);
			await sleep(3000);
			this.setStatus(lang.starting_battly);
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
		this.splashMessage.classList.add("animate__animated", "animate__flipOutX");
		this.splashAuthor.classList.add("animate__animated", "animate__flipOutX");
		await sleep(500);
		this.startLauncher(); 
		});
		this.setStatus(lang.checking_updates);
		
		ipcRenderer.invoke('update-app').then(err => {
			if(err) {
            	if (err.error) {
                	let error = err.message;
					error = error.toString().slice(0, 50);
                	this.shutdown(`${lang.update_error}${error}`);
            	}
			}
        })

        ipcRenderer.on('updateAvailable', () => {
            this.setStatus(lang.update_available);
            this.toggleProgress();
            
			let boton_actualizar = document.getElementById("btn_actualizar");
			boton_actualizar.style.display = "block";
			boton_actualizar.addEventListener("click", () => {
				this.setStatus(lang.downloading_update);			
				ipcRenderer.send('start-update');
			})

			let boton_cancelar = document.getElementById("btn_jugar");
			boton_cancelar.style.display = "block";
			boton_cancelar.addEventListener("click", () => {
				this.setStatus(lang.update_cancelled);
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
			this.setStatus(lang.update_downloaded);
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
			this.setStatus(lang.starting_launcher);
			
		//aplicar las animaciones pero al reves
		this.splash.classList.remove("translate");
		this.splashMessage.classList.add("animate__animated", "animate__flipOutX");
		this.splashAuthor.classList.add("animate__animated", "animate__flipOutX");
		await sleep(500);
			setTimeout(() => {
				this.startLauncher();
			}, 1000);
			return true;
		}).catch(e => {
			console.error(e);
			return this.shutdown(lang.error_connecting_server);
		})
	}

	/**
	 * Starts the launcher.
	 * @async
	 */
	async startLauncher() {
		this.setStatus(lang.ending);
		await sleep(500);
		ipcRenderer.send('main-window-open');
		ipcRenderer.send('update-window-close');
	}

	/**
	 * Shuts down the launcher.
	 * @param {string} text - The shutdown message.
	 */
	shutdown(text) {
		this.setStatus(`${text}<br>${lang.closing_countdown} 10s`);
		let i = 10;
		setInterval(() => {
			this.setStatus(`${text}<br>${lang.closing_countdown} ${i}s`);
			if (i < 0) ipcRenderer.send('update-window-close');
			i--;
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
