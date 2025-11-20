'use strict';
const { ipcRenderer } = require('electron');
import { config } from './utils.js';

let dev = process.env.NODE_ENV === 'dev';
const fs = require('fs');
const fetch = require('node-fetch');
const axios = require("axios");
const { getValue, setValue } = require('./assets/js/utils/storage');
import { LoadAPI } from "./utils/loadAPI.js";

require('./assets/js/libs/errorReporter');
require('./assets/js/utils/stringLoader.js');

let stringLoader = null;

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
		await this.LoadStrings();

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

	async LoadStrings() {
		if (!stringLoader) {
			try {
				await window.ensureStringLoader();
				stringLoader = window.stringLoader;
				console.log("Strings loaded successfully");
			} catch (error) {
				console.error("Error loading strings:", error);
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

		message.innerHTML = strings[stringLoader?.getCurrentLanguage() || "en"];

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
			this.setStatus(stringLoader?.getString("launcher.checking_connection") || "Checking connection...");
			await sleep(1000);
			this.setStatus(stringLoader?.getString("launcher.no_connection") || "No connection");
			await sleep(1500);
			this.setStatus(stringLoader?.getString("launcher.starting_battly") || "Starting Battly...");
			await sleep(500);
			this.startBattly();
		});
	}

	async checkMaintenance() {
		try {
			const res = await new LoadAPI().GetConfig(true);

			if (res.maintenance) return this.shutdown(res.maintenance_message);
			this.setStatus(stringLoader?.getString("launcher.starting_launcher") || "Starting launcher...");
			await sleep(500);
			setTimeout(() => {
				this.checkForUpdates();
			}, 1000);
			return true;
		} catch (error) {
			console.error(error);
			return this.shutdown(stringLoader?.getString("launcher.error_connecting_server") || "Error connecting to server");
		}
	}

	async startBattly() {
		splash_.classList.remove("translate");
		splashMessage.classList.add("animate__animated", "animate__flipOutX");
		splashAuthor.classList.add("animate__animated", "animate__flipOutX");
		this.setStatus(stringLoader?.getString("launcher.ending") || "Closing...");
		await sleep(500);
		ipcRenderer.send('main-window-open');
		ipcRenderer.send('update-window-close');
	}

	shutdown(text) {
		this.setStatus(`${text}<br>${stringLoader?.getString("launcher.closing_countdown") || "Closing in"} 10s`);
		let i = 10;
		setInterval(() => {
			this.setStatus(`${text}<br>${stringLoader?.getString("launcher.closing_countdown") || "Closing in"} ${i}s`);
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

		this.setStatus(stringLoader?.getString("launcher.checking_updates") || "Checking for updates...");

		ipcRenderer.invoke('update-app').then(err => {
			if (err) {
				if (err.error) {
					let error = err.message;
					error = error.toString().slice(0, 50);
					this.shutdown(`${stringLoader?.getString("launcher.update_error") || "Update error"} <br> ${error}`);
				}
			}
		})

		ipcRenderer.on('updateAvailable', () => {
			this.setStatus(stringLoader?.getString("launcher.update_available") || "Update available");

			let boton_actualizar = document.getElementById("btn_actualizar");
			boton_actualizar.style.display = "block";
			boton_actualizar.addEventListener("click", () => {
				this.setStatus(stringLoader?.getString("launcher.downloading_update") || "Downloading update...");
				this.toggleProgress();
				ipcRenderer.send('start-update');
			})

			let boton_cancelar = document.getElementById("btn_jugar");
			boton_cancelar.style.display = "block";
			boton_cancelar.addEventListener("click", () => {
				this.setStatus(stringLoader?.getString("launcher.update_cancelled") || "Update cancelled");
				this.checkMaintenance();
			})
		})

		ipcRenderer.on('updateNewAvailable', () => {
			this.setStatus(stringLoader?.getString("launcher.update_available") || "Update available");

			ipcRenderer.send('start-new-update');
		})

		ipcRenderer.on('download-progress', (event, progress) => {
			this.setProgress(progress.transferred, progress.total);
		})

		ipcRenderer.on('update-not-available', () => {
			this.startBattly();
		})

		ipcRenderer.on('update-downloaded', async () => {
			this.setStatus(stringLoader?.getString("launcher.update_downloaded") || "Update downloaded");
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

