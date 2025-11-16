'use strict';
const { ipcRenderer } = require('electron');
import { config } from './utils.js';

let dev = process.env.NODE_ENV === 'dev';
const fs = require('fs');
const fetch = require('node-fetch');
const axios = require("axios");
const { Lang } = require('./assets/js/utils/lang.js');
const { getValue, setValue } = require('./assets/js/utils/storage');
import { LoadAPI } from "./utils/loadAPI.js";

require('./assets/js/libs/errorReporter');

let lang = null;

let splash_;
let splashMessage;
let splashAuthor;
let message;
let progress;

class Splash {
	constructor() {
		this.init();
	}

	async init() {
		await this.LoadLang();

		if (document.readyState === "complete" || document.readyState === "interactive") {
			splash_ = document.querySelector(".splash");
			splashMessage = document.querySelector(".splash-message");
			splashAuthor = document.querySelector(".splash-author");
			message = document.querySelector(".message");
			progress = document.querySelector("progress");

			this.start();
		} else {
			document.addEventListener('DOMContentLoaded', () => this.start());
		}
	}

	async LoadLang() {
		if (!lang) {
			try {
				lang = await new Lang().GetLang();
				console.log("Idioma cargado:", lang);
			} catch (error) {
				console.error("Error cargando el idioma:", error);
			}
		}
	}

	async start() {
		console.log("Ejecutando start()");
		let splashes = [{ "message": "Battly Launcher", "author": "TECNO BROS" }];

		let strings = {
			"es": "¡Hola!",
			"en": "Hello!",
			"fr": "Bonjour!",
			"de": "Hallo!",
			"it": "Ciao!",
			"pt": "Olá!",
			"ru": "Привет!",
			"ja": "こんにちは!",
			"ar": "مرحبا!",
		};

		message.innerHTML = strings[await getValue("lang") ? await getValue("lang") : "en"];

		let sonidoDB = await getValue("sonido-inicio") || "start";
		let sonido_inicio = new Audio(`./assets/audios/${sonidoDB}.mp3`);
		sonido_inicio.volume = 0.8;
		let splash = splashes[Math.floor(Math.random() * splashes.length)];
		splashMessage.textContent = splash.message;
		splashAuthor.children[0].textContent = splash.author;
		await sleep(100);
		document.querySelector(".splash").style.display = "block";
		document.querySelector(".splash").classList.add("animate__animated", "animate__jackInTheBox");
		await sleep(500);
		sonido_inicio.play();
		splash_.classList.add("opacity");
		await sleep(500);
		document.querySelector("#splash").style.display = "block";
		splash_.classList.add("translate");
		splashMessage.classList.add("animate__animated", "animate__flipInX");
		splashAuthor.classList.add("animate__animated", "animate__flipInX");
		message.classList.add("animate__animated", "animate__flipInX");

		await sleep(1000);

		fetch("https://google.com").then(async () => {
			this.checkMaintenance();
			await setValue("offline-mode", false);
		}).catch(async () => {
			await setValue("offline-mode", true);
			this.setStatus(lang.checking_connection);
			await sleep(1000);
			this.setStatus(lang.no_connection);
			await sleep(1500);
			this.setStatus(lang.starting_battly);
			await sleep(500);
			this.startBattly();
		});
	}

	async checkMaintenance() {
		try {
			const res = await new LoadAPI().GetConfig(true);

			if (res.maintenance) return this.shutdown(res.maintenance_message);
			this.setStatus(lang.starting_launcher);
			await sleep(500);
			setTimeout(() => {
				this.checkForUpdates();
			}, 1000);
			return true;
		} catch (error) {
			console.error(error);
			return this.shutdown(lang.error_connecting_server);
		}
	}

	async startBattly() {
		splash_.classList.remove("translate");
		splashMessage.classList.add("animate__animated", "animate__flipOutX");
		splashAuthor.classList.add("animate__animated", "animate__flipOutX");
		this.setStatus(lang.ending);
		await sleep(500);
		ipcRenderer.send('main-window-open');
		ipcRenderer.send('update-window-close');
	}

	shutdown(text) {
		this.setStatus(`${text}<br>${lang.closing_countdown} 10s`);
		let i = 10;
		setInterval(() => {
			this.setStatus(`${text}<br>${lang.closing_countdown} ${i}s`);
			if (i < 0) ipcRenderer.send('update-window-close');
			i--;
		}, 1000);
	}

	setStatus(text) {
		message.innerHTML = text;
	}

	toggleProgress() {
		if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
	}

	setProgress(value, max) {
		this.progress.value = value;
		this.progress.max = max;
	}

	async checkForUpdates() {
		if (dev) return sleep(500).then(async () => {

			splash_.classList.remove("translate");
			splashMessage.classList.add("animate__animated", "animate__flipOutX");
			splashAuthor.classList.add("animate__animated", "animate__flipOutX");
			await sleep(500);
			this.startBattly();
		});

		this.setStatus(lang.checking_updates);

		ipcRenderer.invoke('update-app').then(err => {
			if (err) {
				if (err.error) {
					let error = err.message;
					error = error.toString().slice(0, 50);
					this.shutdown(`${lang.update_error} <br> ${error}`);
				}
			}
		})

		ipcRenderer.on('updateAvailable', () => {
			this.setStatus(lang.update_available);

			let boton_actualizar = document.getElementById("btn_actualizar");
			boton_actualizar.style.display = "block";
			boton_actualizar.addEventListener("click", () => {
				this.setStatus(lang.downloading_update);
				this.toggleProgress();
				ipcRenderer.send('start-update');
			})

			let boton_cancelar = document.getElementById("btn_jugar");
			boton_cancelar.style.display = "block";
			boton_cancelar.addEventListener("click", () => {
				this.setStatus(lang.update_cancelled);
				this.checkMaintenance();
			})
		})

		ipcRenderer.on('updateNewAvailable', () => {
			this.setStatus(lang.update_available);

			ipcRenderer.send('start-new-update');
		})

		ipcRenderer.on('download-progress', (event, progress) => {
			this.setProgress(progress.transferred, progress.total);
		})

		ipcRenderer.on('update-not-available', () => {
			this.startBattly();
		})

		ipcRenderer.on('update-downloaded', async () => {
			this.setStatus(lang.update_downloaded);
			await sleep(5000);
			this.toggleProgress();
			ipcRenderer.send('update-window-close');
			ipcRenderer.send('start-update');
		})
	}
}

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
	if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
		ipcRenderer.send("update-window-dev-tools");

		console.log("%c¡ESPERA!", "color: #3e8ed0; font-size: 70px; font-weight: bold; font-family: 'Poppins'; text-shadow: 0 0 5px #000;");
		console.log("%c¡No hagas nada aquí si no sabes lo que estás haciendo!", "color: #3e8ed0; font-size: 18px; font-weight: bold; font-family: 'Poppins';");
		console.log("%cTampoco pegues nada externo aquí, ¡hay un 101% de posibilidades de que sea un virus!", "color: #3e8ed0; font-size: 15px; font-weight: bold; font-family: 'Poppins';");
	}
});

new Splash();

console.log('[ErrorReporter] Sistema de reporte manual listo. Presiona Ctrl+E para reportar errores.');

