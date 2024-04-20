/**
 * @author TECNO BROS
 
 */
"use strict";
import { logger, database, changePanel } from "../utils.js";

const { Client, Status } = require("minecraft-launcher-core");
const { Launch, Mojang } = require("./assets/js/libs/mc/Index");
const { ipcRenderer, ipcMain, shell } = require("electron");

const pkg = require("../package.json");
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

function ShowPanelError(error) {
  let audioError = new Audio("./assets/audios/error.mp3");
  audioError.play();

  ipcRenderer.send("new-notification", {
    title: "Error al abrir Minecraft",
    body: "Consulta el error abriendo Battly.",
  });
  // Crear el elemento div principal con la clase "modal is-active"
  const modalDiv = document.createElement("div");
  modalDiv.className = "modal is-active";
  modalDiv.style.zIndex = "4";

  // Crear el elemento div con la clase "modal-background" y agregarlo al div principal
  const modalBackgroundDiv = document.createElement("div");
  modalBackgroundDiv.className = "modal-background";
  modalDiv.appendChild(modalBackgroundDiv);

  // Crear el elemento div con la clase "modal-card" y el estilo de fondo y agregarlo al div principal
  const modalCardDiv = document.createElement("div");
  modalCardDiv.className = "modal-card";
  modalCardDiv.style.backgroundColor = "#212121";
  modalDiv.appendChild(modalCardDiv);

  // Crear el elemento header con la clase "modal-card-head" y el estilo de fondo y agregarlo al div modal-card
  const headerDiv = document.createElement("header");
  headerDiv.className = "modal-card-head";
  headerDiv.style.backgroundColor = "#212121";
  modalCardDiv.appendChild(headerDiv);

  // Crear el elemento p con la clase "modal-card-title", el estilo de color y texto, y agregarlo al div header
  const titleP = document.createElement("p");
  titleP.className = "modal-card-title";
  titleP.style.color = "#fff";
  titleP.textContent = "Error al abrir Minecraft";
  headerDiv.appendChild(titleP);

  // Crear el elemento section con la clase "modal-card-body" y el estilo de fondo y color, y agregarlo al div modal-card
  const bodySection = document.createElement("section");
  bodySection.className = "modal-card-body";
  bodySection.style.backgroundColor = "#212121";
  bodySection.style.color = "#fff";
  modalCardDiv.appendChild(bodySection);

  // Crear el elemento p con el mensaje de error y agregarlo al div section
  const errorP = document.createElement("p");
  errorP.textContent =
    "Esto es un mensaje de error al iniciar Minecraft. Esto no es por culpa de Battly, no reportar este problema.";
  bodySection.appendChild(errorP);

  // Crear el elemento div con la clase "card" y agregarlo al div section
  const cardDiv = document.createElement("div");
  cardDiv.className = "card";
  bodySection.appendChild(cardDiv);

  // Crear el elemento header con la clase "card-header" y agregarlo al div card
  const cardHeaderDiv = document.createElement("header");
  cardHeaderDiv.className = "card-header";
  cardDiv.appendChild(cardHeaderDiv);

  // Crear el elemento p con la clase "card-header-title" y agregarlo al div card-header
  const cardTitleP = document.createElement("p");
  cardTitleP.className = "card-header-title";
  cardTitleP.textContent = "Error encontrado";
  cardHeaderDiv.appendChild(cardTitleP);

  // Crear el elemento div con la clase "card-content" y el id "content" y agregarlo al div card
  const cardContentDiv = document.createElement("div");
  cardContentDiv.className = "card-content";
  cardContentDiv.id = "content";
  cardDiv.appendChild(cardContentDiv);

  // Crear el elemento textarea con las clases y atributos y agregarlo al div card-content
  const textarea = document.createElement("textarea");
  textarea.className = "textarea errores is-info is-family-code";
  textarea.disabled = true;
  textarea.rows = "10";
  textarea.cols = "50";
  textarea.textContent = error;
  cardContentDiv.appendChild(textarea);

  // Crear el elemento footer con la clase "modal-card-foot" y el estilo de fondo y agregarlo al div modal-card
  const footerDiv = document.createElement("footer");
  footerDiv.className = "modal-card-foot";
  footerDiv.style.backgroundColor = "#212121";
  modalCardDiv.appendChild(footerDiv);

  // Crear el elemento button con las clases y atributos y agregarlo al div modal-card-foot
  const closeButton = document.createElement("button");
  closeButton.className = "button is-danger";
  closeButton.textContent = "Cerrar";
  closeButton.addEventListener("click", () => {
    modalDiv.remove();
  });

  //boton de guardar logs, mostrará un dialogo para guardar los logs en un archivo de texto, abrirá el explorador de archivos y se podrá guardar donde quiera
  const saveLogsButton = document.createElement("button");
  saveLogsButton.className = "button is-info";
  saveLogsButton.textContent = "Guardar logs";
  saveLogsButton.addEventListener("click", () => {
    let logs = document.querySelector(".errores").value;
    let logsPath = path.join(__dirname, "logs.txt");
    fs.writeFileSync(logsPath, logs);
    shell.openPath(logsPath);
  });

  const discordBtn = document.createElement("button");
  discordBtn.className = "button is-info";
  discordBtn.addEventListener("click", () => {
    shell.openExternal("https://discord.gg/tecno-bros-885235460178342009");
  });
  discordBtn.innerHTML = '<span><i class="fab fa-discord"></i> Discord</span>';

  footerDiv.appendChild(closeButton);
  footerDiv.appendChild(saveLogsButton);
  footerDiv.appendChild(discordBtn);
  // Agregar saltos de línea al final del código
  modalDiv.appendChild(document.createElement("br"));

  // Agregar el div principal al cuerpo del documento
  document.body.appendChild(modalDiv);
}

import { LoadAPI } from "../utils/loadAPI.js";

const fetch = require("node-fetch");
let offlineMode = false;
fetch("https://google.com")
  .then(async () => {
    offlineMode = false;
  })
  .catch(async () => {
    offlineMode = true;
  });

const fs = require("fs");
const path = require("path");

const dataDirectory =
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? `${process.env.HOME}/Library/Application Support`
    : process.env.HOME);

let logFilePath = `${dataDirectory}/.battly/Registro.log`;
import { consoleOutput } from "../utils/logger.js";
let consoleOutput_;

import { Lang } from "../utils/lang.js";
import { Alert } from "../utils/alert.js";
import * as NBT from "../../../../node_modules/nbtify/dist/index.js";

let lang;
let langs;
class Home {
  static id = "home";
  async init(config, news) {
    lang = await new Lang().GetLang();
    langs = lang;
    this.WaitData();
    this.config = config;
    this.news = await news;
    this.offlineMode = offlineMode;
    this.ShowNews();
    this.BattlyConfig = await new LoadAPI().GetConfig();
    this.Versions = await new LoadAPI().GetVersions();
    this.VersionsMojang = await new LoadAPI().GetVersionsMojang();
    this.database = await new database().init();
    this.initNews();
    this.initLaunch();
    this.initStatusServer();
    this.initBtn();
    this.CargarMods();
    this.IniciarEstadoDiscord();
    this.CargarVersiones();
    this.initConfig();
    this.InitTheme();
    this.GetLogsSocket();
    this.CambiarRutaJava();
    this.Instancias();
    this.GenerarLogsSocket();
    this.SetStatus();
    this.Solicitudes();
    this.Ads();
    this.ContextMenuSettings();
  }

  async ContextMenuSettings() {
    var container = document.getElementById("settings-btn");
    var contextMenu = document.getElementById("contextMenu");

    container.addEventListener("contextmenu", function (event) {
      if (contextMenu.style.display === "none") {
        event.preventDefault();
        var rect = container.getBoundingClientRect();
        var x = rect.left + window.pageXOffset + 35;
        var y = rect.top + window.pageYOffset - 80;

        // Ajustamos la posición para que el menú aparezca arriba del botón
        y = y - contextMenu.offsetHeight;

        contextMenu.style.display = "block";
        contextMenu.style.left = x + "px";
        contextMenu.style.top = y + "px";
        contextMenu.style.zIndex = "9999999"; // Ajusta el z-index a un valor más alto
      } else {
        contextMenu.style.display = "none";
      }
    });

    document.addEventListener("click", function (event) {
      contextMenu.style.display = "none";
    });

  }

  async Ads() {
    fetch("https://api.battlylauncher.com/ads/get").then(async (res) => {
      let adsData = await res.json();

      let ads = document.getElementById("ads");
      ads.style.backgroundImage = `url(${adsData.image})`;
      ads.addEventListener("click", () => {
        shell.openExternal(adsData.link);
      });
    });
    /*
    setTimeout(() => {
      console.log("alerting")
      new Alert().ShowAlert({
        title: "Testing",
        text: "Esta es una alerta de prueba de info",
        icon: "info"
    });
    }, 5000);

    setTimeout(() => {
      console.log("alerting")
      new Alert().ShowAlert(
        "Testing",
        "Esta es una alerta de prueba de error",
        "error"
      );
    }, 12000);

    setTimeout(() => {
      console.log("alerting")
      new Alert().ShowAlert(
        "Testing",
        "Esta es una alerta de prueba de success",
        "success"
      );
    }, 19000);

    setTimeout(() => {
      console.log("alerting")
      new Alert().ShowAlert(
        "Testing",
        "Esta es una alerta de prueba de warning",
        "warning"
      );
    }, 25000);
    */
  }

  async Solicitudes() {
    ipcRenderer.on("cargarSolicitudAmistad", async (event, args) => {
      changePanel("friends");
    });

    document.getElementById("friends-btn").addEventListener("click", () => {
      changePanel("friends");
    });

    document
      .getElementById("friends-volver-btn")
      .addEventListener("click", () => {
        document.querySelector(".preload-content").style.display = "";
        console.log("Volver");
        changePanel("home");
      });
  }

  async SetStatus() {
    let selectedAccount = (await this.database.get("1234", "accounts-selected"))
      .value;
    let accounts = this.database.getAccounts();

    accounts.forEach((account) => {
      if (account.uuid === selectedAccount.selected) {
        this.UpdateStatus(account.name, "online", langs.in_the_menu);
      }
    });
  }

  async UpdateStatus(username, status, details) {
    console.log(`🧩 ${username} > ${status} > ${details}`);

    let uuid = (await this.database.get("1234", "accounts-selected")).value;
    let account = this.database.getAccounts().find(account => account.uuid === uuid.selected);

    if (account.type === "battly") {
      if (
        !account.password ||
        account.password === "" ||
        account.password === undefined ||
        account.password === null
      ) {
        new Alert().ShowAlert({
          icon: "error",
          title: langs.password_not_set,
        });

        this.database.delete(uuid.selected, "accounts");
        return;
      } else {
        ipcRenderer.send("updateStatus", {
          status: status,
          details: details,
          username: username,
          password: account.password,
        });
      }
    }
  }

  async Registros() {
    let logs = document.getElementById("battly-logs").value;

    fs.mkdirSync(`${dataDirectory}/.battly/temp`, { recursive: true });
    fs.writeFileSync(`${dataDirectory}/.battly/temp/logs.txt`, logs);
    shell.openPath(`${dataDirectory}/.battly/temp/logs.txt`);

    new Alert().ShowAlert({
      icon: "success",
      title: langs.logs_saved_correctly,
    });
  }

  async Instancias() {
    let instanciasBtn = document.getElementById("instancias-btn");

    instanciasBtn.addEventListener("click", async () => {
      // Crear el elemento modal
      const modal = document.createElement("div");
      modal.classList.add("modal", "is-active");
      modal.style.zIndex = "2";

      // Crear el fondo del modal
      const modalBackground = document.createElement("div");
      modalBackground.classList.add("modal-background");

      // Crear el div del contenido del modal
      const modalCard = document.createElement("div");
      modalCard.classList.add("modal-card");
      modalCard.style.backgroundColor = "#212121";
      modalCard.style.height = "85%";

      // Crear el encabezado del modal
      const modalHeader = document.createElement("header");
      modalHeader.classList.add("modal-card-head");
      modalHeader.style.backgroundColor = "#212121";

      const modalTitle = document.createElement("p");
      modalTitle.classList.add("modal-card-title");
      modalTitle.style.color = "#fff";
      modalTitle.innerHTML =
        '<i class="fa-solid fa-folder"></i> ' + langs.instances;

      const closeBtn = document.createElement("button");
      closeBtn.classList.add("delete");
      closeBtn.setAttribute("aria-label", "close");

      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(closeBtn);

      // Crear la sección del cuerpo del modal
      const modalBody = document.createElement("section");
      modalBody.classList.add("modal-card-body");
      modalBody.style.backgroundColor = "#212121";
      modalBody.style.color = "#fff";

      const bodyText = document.createElement("p");
      bodyText.innerHTML = langs.welcome_instances;

      const lineBreak = document.createElement("br");
      const lineBreak2 = document.createElement("br");

      modalBody.appendChild(bodyText);
      modalBody.appendChild(lineBreak);

      // Crear la primera tarjeta

      //obtener todas las carpetas que hay en la carpeta de instancias
      let instancias;
      if (!fs.existsSync(`${dataDirectory}/.battly/instances`)) {
        fs.mkdirSync(`${dataDirectory}/.battly/instances`);
        instancias = fs.readdirSync(`${dataDirectory}/.battly/instances`);
      } else {
        instancias = fs.readdirSync(`${dataDirectory}/.battly/instances`);
      }

      //crear un array vacío
      let instanciasArray = [];
      let openedInstance;
      //recorrer todas las carpetas
      if (instancias.length > 0) {
        for (let i = 0; i < instancias.length; i++) {
          //obtener el archivo instance.json
          try {
            let instance = fs.readFileSync(
              `${dataDirectory}/.battly/instances/${instancias[i]}/instance.json`
            );
            //convertir el archivo a JSON
            let instance_json = JSON.parse(instance);
            instanciasArray.push(instance_json);

            // Crear el header de la primera tarjeta

            const card1 = document.createElement("div");
            card1.classList.add("card");
            card1.classList.add(`card-instance${i}`);
            card1.style.marginBottom = "-15px";

            const cardHeader1 = document.createElement("header");
            cardHeader1.classList.add("card-header");
            cardHeader1.style.cursor = "pointer";

            const cardTitle1 = document.createElement("p");
            cardTitle1.classList.add("card-header-title");

            const cardTitleSpan = document.createElement("span");
            cardTitleSpan.innerHTML = instance_json.name;

            const cardTitleEdit = document.createElement("span");
            cardTitleEdit.innerHTML = `<i class="fa-solid fa-edit"></i>`;
            cardTitleEdit.style.cursor = "pointer";
            cardTitleEdit.style.marginLeft = "10px";

            cardTitleEdit.addEventListener("mouseover", function () {
              cardTitleEdit.style.opacity = "0.7";
            });

            cardTitleEdit.addEventListener("mouseout", function () {
              cardTitleEdit.style.opacity = "1";
            });

            cardTitle1.appendChild(cardTitleSpan);
            cardTitle1.appendChild(cardTitleEdit);

            const cardIcon1 = document.createElement("button");
            cardIcon1.classList.add("card-header-icon");
            cardIcon1.setAttribute("aria-label", "more options");

            const icon1 = document.createElement("span");
            icon1.classList.add("icon");

            const iconImage1 = document.createElement("i");
            iconImage1.classList.add("fas", "fa-angle-down");

            icon1.appendChild(iconImage1);
            cardIcon1.appendChild(icon1);

            // Crear el contenido de la primera tarjeta

            const cardContent1 = document.createElement("div");
            cardContent1.classList.add("card-content");
            cardContent1.setAttribute("id", "content");
            cardContent1.style.display = "none";

            const cardImage1 = document.createElement("figure");
            cardImage1.classList.add("image", "is-32x32");

            const img1 = document.createElement("img");
            img1.setAttribute("src", instance_json.image);
            img1.style.borderRadius = "5px";

            const cardDescription1 = document.createElement("div");
            cardDescription1.classList.add("content");
            cardDescription1.style.marginLeft = "10px";
            cardDescription1.textContent = instance_json.description;
            //añadir font-family: 'Poppins';font-weight: 700;
            cardDescription1.style.fontFamily = "Poppins";
            cardDescription1.style.fontWeight = "700";

            // Crear el footer de la primera tarjeta

            const cardFooter1 = document.createElement("footer");
            cardFooter1.classList.add("card-footer");
            cardFooter1.setAttribute("id", "footer");
            cardFooter1.style.display = "none";

            const openButton1 = document.createElement("button");
            openButton1.classList.add("card-footer-item", "button", "is-info");
            openButton1.innerHTML =
              '<span><i class="fa-solid fa-square-up-right"></i> ' +
              langs.open_instance +
              "</span>";
            openButton1.style.margin = "5px";

            const editButton1 = document.createElement("button");
            editButton1.classList.add(
              "card-footer-item",
              "button",
              "is-warning"
            );
            editButton1.innerHTML =
              '<span><i class="fa-solid fa-folder-open"></i> ' +
              langs.open_instance_folder +
              "</span>";
            editButton1.style.margin = "5px";

            const deleteButton1 = document.createElement("button");
            deleteButton1.classList.add(
              "card-footer-item",
              "button",
              "is-danger"
            );
            deleteButton1.innerHTML =
              '<span><i class="fa-solid fa-folder-minus"></i> ' +
              langs.delete_instance +
              "</span>";
            deleteButton1.style.margin = "5px";

            card1.appendChild(cardHeader1);
            cardHeader1.appendChild(cardTitle1);
            cardHeader1.appendChild(cardIcon1);
            card1.appendChild(cardContent1);
            cardContent1.appendChild(cardImage1);
            cardImage1.appendChild(img1);
            cardContent1.appendChild(cardDescription1);
            card1.appendChild(cardFooter1);
            cardFooter1.appendChild(openButton1);
            cardFooter1.appendChild(editButton1);
            cardFooter1.appendChild(deleteButton1);
            cardFooter1.appendChild(lineBreak2);
            modalBody.appendChild(card1);

            const lineBreak3 = document.createElement("br");
            modalBody.appendChild(lineBreak3);

            cardHeader1.addEventListener("click", () => {
              if (cardContent1.style.display === "none") {
                if (openedInstance) {
                  const card_ = document.querySelector(`.card-instance${openedInstance}`);
                  if (card_) {
                    
                    const cardContent_ = card_.querySelector(".card-content");
                    const cardFooter_ = card_.querySelector(".card-footer");
                    const iconImage_ = card_.querySelector("i");

                    cardContent_.style.display = "none";
                    cardFooter_.style.display = "none";
                    iconImage_.classList.remove("fa-angle-up");
                    iconImage_.classList.add("fa-angle-down");

                    openedInstance = i;

                    cardContent1.style.display = "flex";
                    cardFooter1.style.display = "flex";
                    iconImage1.classList.remove("fa-angle-down");
                    iconImage1.classList.add("fa-angle-up");
                  } else {
                    openedInstance = i;
                    cardContent1.style.display = "flex";
                    cardFooter1.style.display = "flex";
                    iconImage1.classList.remove("fa-angle-down");
                    iconImage1.classList.add("fa-angle-up");
                  }
                } else {
                  openedInstance = i;
                  cardContent1.style.display = "flex";
                  cardFooter1.style.display = "flex";
                  iconImage1.classList.remove("fa-angle-down");
                  iconImage1.classList.add("fa-angle-up");
                }
              } else {
                if(openedInstance === i) {
                  cardContent1.style.display = "none";
                  cardFooter1.style.display = "none";
                  iconImage1.classList.remove("fa-angle-up");
                  iconImage1.classList.add("fa-angle-down");
                  openedInstance = null;
                } else {
                  const card_ = document.querySelector(`.card-instance${i}`);
                  const cardContent_ = card_.querySelector(".card-content");
                  const cardFooter_ = card_.querySelector(".card-footer");
                  const iconImage_ = card_.querySelector("i");

                  cardContent_.style.display = "none";
                  cardFooter_.style.display = "none";
                  iconImage_.classList.remove("fa-angle-up");
                  iconImage_.classList.add("fa-angle-down");

                  openedInstance = i;

                  cardContent1.style.display = "flex";
                  cardFooter1.style.display = "flex";
                  iconImage1.classList.remove("fa-angle-down");
                  iconImage1.classList.add("fa-angle-up");
                }
              }
            });

            editButton1.addEventListener("click", () => {
              let path = `${dataDirectory}/.battly/instances/${instancias[i]}`;
              shell.openPath(path.replace(/\//g, "\\")).then(() => {
                new Alert().ShowAlert({
                  icon: "success",
                  title: langs.folder_opened,
                });
              });
            });

            deleteButton1.addEventListener("click", () => {
              //eliminar el card, y eliminar la carpeta de la instancia
              Swal.fire({
                title: langs.are_you_sure,
                text: langs.are_you_sure_text,
                showCancelButton: true,
                confirmButtonColor: "#3e8ed0",
                cancelButtonColor: "#d33",
                confirmButtonText: langs.yes_delete,
                cancelButtonText: langs.no_cancel,
              }).then((result) => {
                if (result.isConfirmed) {
                  card1.remove();
                  lineBreak3.remove();
                  fs.rmdirSync(
                    `${dataDirectory}/.battly/instances/${instancias[i]}`,
                    { recursive: true }
                  );
                  new Alert().ShowAlert({
                    icon: "success",
                    title: langs.instance_deleted_correctly,
                  });
                }
              });
            });

            cardTitleEdit.addEventListener("click", async () => {
              console.log("Editando instancia");

              let instance = fs.readFileSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/instance.json`
              );

              let instance_json = JSON.parse(instance);
              console.log(instance_json);

              const modal = document.createElement("div");
              modal.className = "modal is-active";
              modal.style.zIndex = "3";

              // Modal background
              const modalBackground = document.createElement("div");
              modalBackground.className = "modal-background";

              // Modal card
              const modalCard = document.createElement("div");
              modalCard.className = "modal-card";
              modalCard.style.backgroundColor = "#212121";

              // Modal card head
              const modalCardHead = document.createElement("header");
              modalCardHead.className = "modal-card-head";
              modalCardHead.style.backgroundColor = "#212121";

              const modalCardTitle = document.createElement("p");
              modalCardTitle.className = "modal-card-title";
              modalCardTitle.style.fontSize = "25px";
              modalCardTitle.style.fontFamily = "Poppins";
              modalCardTitle.style.color = "#fff";
              modalCardTitle.innerText = langs.edit_instance;

              const closeButton = document.createElement("button");
              closeButton.className = "delete";
              closeButton.setAttribute("aria-label", "close");

              modalCardHead.appendChild(modalCardTitle);
              modalCardHead.appendChild(closeButton);

              // Modal card body
              const modalCardBody = document.createElement("section");
              modalCardBody.className = "modal-card-body";
              modalCardBody.style.backgroundColor = "#212121";

              const nameLabel = document.createElement("p");
              nameLabel.style.color = "#fff";
              nameLabel.innerText = langs.instance_name;

              const nameInput = document.createElement("input");
              nameInput.className = "input is-info";
              nameInput.type = "text";
              nameInput.style.fontFamily = "Poppins";
              nameInput.style.fontWeight = "500";
              nameInput.style.fontSize = "12px";
              nameInput.value = instance_json.name;

              const descriptionLabel = document.createElement("p");
              descriptionLabel.style.color = "#fff";
              descriptionLabel.innerText = langs.instance_description;

              const descriptionTextarea = document.createElement("textarea");
              descriptionTextarea.className = "textarea is-info";
              descriptionTextarea.style.fontFamily = "Poppins";
              descriptionTextarea.style.height = "20px";
              descriptionTextarea.style.fontWeight = "500";
              descriptionTextarea.style.fontSize = "12px";
              descriptionTextarea.setAttribute("name", "about");
              descriptionTextarea.innerText = instance_json.description;

              const imageLabel = document.createElement("p");
              imageLabel.style.color = "#fff";
              imageLabel.innerText = langs.instance_image;

              const imageContainer = document.createElement("div");
              imageContainer.style.display = "flex";

              const imageFigure = document.createElement("figure");
              imageFigure.className = "image is-64x64";
              imageFigure.style.marginRight = "10px";

              const image = document.createElement("img");
              image.src = instance_json.image;
              image.style.borderRadius = "5px";

              const fileContainer = document.createElement("div");
              fileContainer.className = "file is-info is-boxed";
              fileContainer.style.height = "65px";

              const fileLabel = document.createElement("label");
              fileLabel.className = "file-label";

              const fileInput = document.createElement("input");
              fileInput.className = "file-input";
              fileInput.type = "file";
              fileInput.setAttribute("name", "resume");

              const fileCta = document.createElement("span");
              fileCta.className = "file-cta";

              const fileIcon = document.createElement("span");
              fileIcon.className = "file-icon";

              const uploadIcon = document.createElement("i");
              uploadIcon.className = "fas fa-cloud-upload-alt";

              const fileLabelText = document.createElement("span");
              fileLabelText.style.fontSize = "10px";
              fileLabelText.innerText = langs.select_a_file;

              fileIcon.appendChild(uploadIcon);
              fileCta.appendChild(fileIcon);
              fileCta.appendChild(fileLabelText);
              fileLabel.appendChild(fileInput);
              fileLabel.appendChild(fileCta);
              fileContainer.appendChild(fileLabel);

              imageFigure.appendChild(image);
              imageContainer.appendChild(imageFigure);
              imageContainer.appendChild(fileContainer);

              const versionLabel = document.createElement("p");
              versionLabel.style.color = "#fff";
              versionLabel.innerText = langs.instance_version;
              
              const adv = `
              <article class="message is-danger" style="margin-bottom: 10px;">
                <div class="message-body" style="padding: 0.5rem 0.8rem">
                  <p style="font-size: 13px;">${langs.instance_version2}</p>
                </div>
              </article>
              `;

              const element = document.createElement("div");
              element.innerHTML = adv;

              const versionSelect = document.createElement("div");
              versionSelect.className = "select is-info";

              const versionOptions = document.createElement("select");
              versionSelect.appendChild(versionOptions);

              const versionVersionSelect = document.createElement("div");
              versionVersionSelect.className = "select is-info";
              versionVersionSelect.style.marginLeft = "5px";

              const versionOptionsVersion = document.createElement("select");
              versionVersionSelect.appendChild(versionOptionsVersion);

              modalCardBody.appendChild(nameLabel);
              modalCardBody.appendChild(nameInput);
              modalCardBody.appendChild(document.createElement("br"));
              modalCardBody.appendChild(document.createElement("br"));
              modalCardBody.appendChild(descriptionLabel);
              modalCardBody.appendChild(descriptionTextarea);
              modalCardBody.appendChild(document.createElement("br"));
              modalCardBody.appendChild(imageLabel);
              modalCardBody.appendChild(imageContainer);
              modalCardBody.appendChild(document.createElement("br"));
              modalCardBody.appendChild(versionLabel);
              modalCardBody.appendChild(element);
              modalCardBody.appendChild(versionSelect);
              modalCardBody.appendChild(versionVersionSelect);

              // Modal card foot
              const modalCardFoot = document.createElement("footer");
              modalCardFoot.className = "modal-card-foot";
              modalCardFoot.style.backgroundColor = "#212121";

              const createButton = document.createElement("button");
              createButton.className = "button is-info is-responsive";
              createButton.style.fontSize = "12px";
              createButton.style.fontFamily = "Poppins";
              createButton.style.color = "#fff";
              createButton.style.marginLeft = "0px";
              createButton.innerText = langs.save_instance;

              modalCardFoot.appendChild(createButton);

              // Construir la estructura del modal
              modalCard.appendChild(modalCardHead);
              modalCard.appendChild(modalCardBody);
              modalCard.appendChild(modalCardFoot);

              modal.appendChild(modalBackground);
              modal.appendChild(modalCard);

              // Agregar el modal al contenedor en el DOM
              document.body.appendChild(modal);

              let versiones = this.Versions;
              for (let i = 0; i < versiones.versions.length; i++) {
                if (
                  versiones.versions[i].version.endsWith("-forge") ||
                  versiones.versions[i].version.endsWith("-fabric") ||
                  versiones.versions[i].version.endsWith("-quilt")
                ) {
                  let version = versiones.versions[i];
                  let option = document.createElement("option");
                  option.value = version.version;
                  option.innerHTML = version.name;
                  versionOptions.appendChild(option);
                }
              }

              setTimeout(async () => {
                  let forgeVersionType = versionOptions;
                  const axios = require("axios");
                  await axios
                    .get(
                      "https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json"
                    )
                    .then((response) => {
                      let data = response.data;

                      // Agregar las opciones de "latest" y "recommended"
                      let latestOption = document.createElement("option");
                      latestOption.value = "latest";
                      latestOption.innerHTML = langs.latest;
                      versionOptionsVersion.appendChild(latestOption);

                      let recommendedOption = document.createElement("option");
                      recommendedOption.value = "recommended";
                      recommendedOption.innerHTML = langs.recommended;
                      versionOptionsVersion.appendChild(recommendedOption);

                      for (let version in data) {
                        if (version === forgeVersionType.value.replace("-forge", "")) {
                          let build = data[version];
                          // Limpiar el select antes de agregar nuevas opciones
                          versionOptionsVersion.innerHTML = "";

                          // Agregar las opciones de "latest" y "recommended" nuevamente
                          versionOptionsVersion.appendChild(latestOption.cloneNode(true));
                          versionOptionsVersion.appendChild(
                            recommendedOption.cloneNode(true)
                          );

                          // Agregar las otras versiones
                          for (let j = 0; j < build.length; j++) {
                            let option = document.createElement("option");
                            option.value = build[j];
                            option.innerHTML = build[j];
                            versionOptionsVersion.appendChild(option);
                          }
                        }
                      }
                    });
              }, 500);

        versionSelect.addEventListener("change", async () => {
                versionOptionsVersion.innerHTML = "";
                let optionLoading = document.createElement("option");
                optionLoading.value = "loading";
                optionLoading.innerHTML = langs.loading;
                versionOptionsVersion.selectedIndex = 0;
                versionOptionsVersion.appendChild(optionLoading);


                let forgeVersionType = versionOptions;
                const axios = require("axios");
                await axios
                  .get(
                    "https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json"
                  )
                  .then((response) => {
                    let data = response.data;
                
                    versionOptionsVersion.innerHTML = "";

                    // Agregar las opciones de "latest" y "recommended"
                    let latestOption = document.createElement("option");
                    latestOption.value = "latest";
                    latestOption.innerHTML = langs.latest;
                    versionOptionsVersion.appendChild(latestOption);

                    let recommendedOption = document.createElement("option");
                    recommendedOption.value = "recommended";
                    recommendedOption.innerHTML = langs.recommended;
                    versionOptionsVersion.appendChild(recommendedOption);

                    for (let version in data) {
                      if (version === forgeVersionType.value.replace("-forge", "")) {
                        let build = data[version];
                        // Limpiar el select antes de agregar nuevas opciones
                        versionOptionsVersion.innerHTML = "";

                        // Agregar las opciones de "latest" y "recommended" nuevamente
                        versionOptionsVersion.appendChild(latestOption.cloneNode(true));
                        versionOptionsVersion.appendChild(
                          recommendedOption.cloneNode(true)
                        );

                        // Agregar las otras versiones
                        for (let j = 0; j < build.length; j++) {
                          let option = document.createElement("option");
                          option.value = build[j];
                          option.innerHTML = build[j];
                          versionOptionsVersion.appendChild(option);
                        }
                      }
                    }
                  });
              });

              if (instance_json.version.endsWith("-forge") || instance_json.version.endsWith("-fabric") || instance_json.version.endsWith("-quilt")) {
                versionOptions.value = instance_json.version;
              } else if (instance_json.loader) {
                versionOptions.value = instance_json.version + "-" + instance_json.loader;
              } else {
                versionOptions.value = instance_json.version;
              }

              closeButton.addEventListener("click", () => {
                modal.remove();
              });

              fileInput.addEventListener("change", () => {
                let imagen = fileInput.files ? fileInput.files : null;
                if (imagen.length > 0) {
                  let reader = new FileReader();
                  reader.onload = function (e) {
                    image.src = e.target.result;
                  };
                  reader.readAsDataURL(imagen[0]);
                }
              });

              createButton.addEventListener("click", () => {
                let name = nameInput.value;
                let description = descriptionTextarea.value;
                let version = versionOptions.value;
                let loaderVersion = versionOptionsVersion.value;
                let imagen = fileInput.files[0] ? fileInput.files[0].path : instance_json.image;

                if (name && description && version) {
                  let instance_data = {
                    name: name,
                    description: description,
                    id: instance_json.id,
                    image: imagen,
                    version: version,
                    loaderVersion: loaderVersion ? loaderVersion : "latest",
                  };

                  console.log(instance_data);


                  let instance_json_new = JSON.stringify(instance_data);
                  fs.writeFileSync(
                    path.join(
                      `${dataDirectory}/.battly/instances/${instance_json.id}`,
                      "instance.json"
                    ),
                    instance_json_new
                  );

                  //eliminar el modal
                  modal.remove();

                  cardTitleSpan.innerHTML = name;
                  img1.src = imagen;
                  cardDescription1.textContent = description;

                  instance_json = instance_data;

                  new Alert().ShowAlert({
                    icon: "success",
                    title: langs.instance_saved_correctly,
                  });
                } else {
                  new Alert().ShowAlert({
                    icon: "error",
                    title: langs.fill_all_fields,
                  });
                }
              });
            });

            let loader;
            if (instance_json.version.endsWith("-forge")) {
              loader = "forge";
            } else if (instance_json.version.endsWith("-fabric")) {
              loader = "fabric";
            } else if (instance_json.version.endsWith("-quilt")) {
              loader = "quilt";
            }

            let version;

            let loader_json = null;
            if (instance_json.loader) loader_json = instance_json.loader;

            let loaderVersion = null;
            if (loader_json) loaderVersion = loader_json.loaderVersion;

            if (
              instance_json.version.endsWith("-forge") ||
              instance_json.version.endsWith("-fabric") ||
              instance_json.version.endsWith("-quilt")
            ) {
              version = instance_json.version
                .replace("-forge", "")
                .replace("-fabric", "")
                .replace("-quilt", "");
            } else {
              version = instance_json.version;
            }

            if (
              !fs.existsSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly`
              )
            ) {
              fs.mkdirSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly`
              );
            }

            if (
              !fs.existsSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/mods-internos`
              )
            ) {
              fs.mkdirSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/mods-internos`
              );
            }

            if (
              !fs.existsSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/launcher`
              )
            ) {
              fs.mkdirSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/launcher`
              );
            }

            if (
              !fs.existsSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/launcher/config-launcher`
              )
            ) {
              fs.mkdirSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/launcher/config-launcher`
              );
            }

            if (
              !fs.existsSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/launcher/forge`
              )
            ) {
              fs.mkdirSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/launcher/forge`
              );
            }

            if (
              !fs.existsSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/launcher/mc-assets`
              )
            ) {
              fs.mkdirSync(
                `${dataDirectory}/.battly/instances/${instancias[i]}/battly/launcher/mc-assets`
              );
            }

            let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
            let uuid = (await this.database.get("1234", "accounts-selected"))
              .value;
            let account = this.database.getAccounts().find(account => account.uuid === uuid.selected);
            let ram = (await this.database.get("1234", "ram")).value;
            let Resolution = (await this.database.get("1234", "screen")).value;
            let launcherSettings = (await this.database.get("1234", "launcher"))
              .value;

            openButton1.addEventListener("click", () => {
              let launch = new Launch();
              let opts;
              if (account.type === "battly") {
                opts = {
                  url:
                    this.config.game_url === "" ||
                    this.config.game_url === undefined
                      ? `${urlpkg}/files`
                      : this.config.game_url,
                  authenticator: account,
                  detached: true,
                  timeout: 10000,
                  path: `${dataDirectory}/.battly/instances/${instancias[i]}`,
                  downloadFileMultiple: 20,
                  version: version,
                  loader: {
                    type: loader_json ? loader_json : loader,
                    build: loaderVersion
                      ? loaderVersion
                      : this.BattlyConfig.loader.build,
                    enable: true,
                  },
                  verify: false,
                  ignored: ["loader"],
                  java: false,
                  memory: {
                    min: `${ram.ramMin * 1024}M`,
                    max: `${ram.ramMax * 1024}M`,
                  },
                  JVM_ARGS: [
                    "-javaagent:authlib-injector.jar=http://localhost",
                    "-Dauthlibinjector.mojangAntiFeatures=enabled",
                    "-Dauthlibinjector.noShowServerName",
                    "-Dauthlibinjector.disableHttpd"
                  ],
                };
              } else {
                opts = {
                  url:
                    this.config.game_url === "" ||
                    this.config.game_url === undefined
                      ? `${urlpkg}/files`
                      : this.config.game_url,
                  authenticator: account,
                  detached: true,
                  timeout: 10000,
                  path: `${dataDirectory}/.battly/instances/${instancias[i]}`,
                  downloadFileMultiple: 20,
                  version: version,
                  loader: {
                    type: loader_json ? loader_json : loader,
                    build: loaderVersion
                      ? loaderVersion
                      : this.BattlyConfig.loader.build,
                    enable: true,
                  },
                  verify: false,
                  ignored: ["loader"],
                  java: false,
                  memory: {
                    min: `${ram.ramMin * 1024}M`,
                    max: `${ram.ramMax * 1024}M`,
                  },
                };
              }

              launch.Launch(opts);

              // Crear el elemento modal
              const preparingModal = document.createElement("div");
              preparingModal.className = "modal is-active";
              preparingModal.style.zIndex = "4";

              // Modal background
              const preparingModalBackground = document.createElement("div");
              preparingModalBackground.className = "modal-background";

              // Modal card
              const preparingModalCard = document.createElement("div");
              preparingModalCard.className = "modal-card";
              preparingModalCard.style.backgroundColor = "#212121";

              // Modal card head
              const preparingModalCardHead = document.createElement("header");
              preparingModalCardHead.className = "modal-card-head";
              preparingModalCardHead.style.backgroundColor = "#212121";

              const preparingModalCardTitle = document.createElement("p");
              preparingModalCardTitle.className = "modal-card-title";
              preparingModalCardTitle.style.color = "#fff";

              const preparingIcon = document.createElement("i");
              preparingIcon.className =
                "fa-solid fa-spinner fa-spin-pulse fa-sm";
              preparingIcon.style.color = "#fff";
              preparingIcon.style.marginRight = "5px";
              preparingIcon.style.verticalAlign = "middle";

              const preparingText = document.createTextNode(
                langs.preparing_instance
              );

              preparingModalCardTitle.appendChild(preparingText);

              preparingModalCardHead.appendChild(preparingModalCardTitle);

              // Modal card body
              const preparingModalCardBody = document.createElement("section");
              preparingModalCardBody.className = "modal-card-body";
              preparingModalCardBody.style.backgroundColor = "#212121";
              preparingModalCardBody.style.color = "#fff";

              const preparingMessage = document.createElement("p");
              let preparingMessageText = document.createTextNode(
                langs.preparing_instance
              );
              preparingMessage.appendChild(preparingMessageText);
              preparingMessage.appendChild(document.createElement("br"));

              const progress = document.createElement("progress");
              progress.className = "progress is-info";
              progress.setAttribute("max", "100");

              preparingModalCardBody.appendChild(preparingMessage);
              preparingModalCardBody.appendChild(progress);

              // Crear tarjeta 1
              const card1 = document.createElement("div");
              card1.className = "card";

              const cardHeader1 = document.createElement("header");
              cardHeader1.className = "card-header";

              const cardHeaderTitle1 = document.createElement("p");
              cardHeaderTitle1.className = "card-header-title";
              cardHeaderTitle1.appendChild(
                document.createTextNode(langs.downloading_version)
              );

              const cardHeaderIcon1 = document.createElement("button");
              cardHeaderIcon1.className = "card-header-icon";
              cardHeaderIcon1.setAttribute("aria-label", "more options");

              const iconSpan1 = document.createElement("span");
              iconSpan1.className = "icon";

              const icon1 = document.createElement("i");
              icon1.className = "fas fa-angle-down";
              icon1.setAttribute("aria-hidden", "true");

              iconSpan1.appendChild(icon1);
              cardHeaderIcon1.appendChild(iconSpan1);

              cardHeader1.appendChild(cardHeaderTitle1);
              cardHeader1.appendChild(cardHeaderIcon1);

              const cardContent1 = document.createElement("div");
              cardContent1.className = "card-content";
              cardContent1.id = "content";
              cardContent1.style.display = "none";

              const content1 = document.createElement("div");
              content1.className = "content";
              content1.appendChild(
                document.createTextNode(`🔄 ${langs.downloading_version}`)
              );
              content1.style.fontFamily = "Poppins";
              content1.style.fontWeight = "700";

              cardContent1.appendChild(content1);

              card1.appendChild(cardHeader1);
              card1.appendChild(cardContent1);

              preparingModalCardBody.appendChild(card1);
              preparingModalCardBody.appendChild(document.createElement("br"));

              // Crear tarjeta 2
              const card2 = document.createElement("div");
              card2.className = "card";

              const cardHeader2 = document.createElement("header");
              cardHeader2.className = "card-header";

              const cardHeaderTitle2 = document.createElement("p");
              cardHeaderTitle2.className = "card-header-title";
              cardHeaderTitle2.appendChild(
                document.createTextNode(langs.downloading_loader)
              );

              const cardHeaderIcon2 = document.createElement("button");
              cardHeaderIcon2.className = "card-header-icon";
              cardHeaderIcon2.setAttribute("aria-label", "more options");

              const iconSpan2 = document.createElement("span");
              iconSpan2.className = "icon";

              const icon2 = document.createElement("i");
              icon2.className = "fas fa-angle-down";
              icon2.setAttribute("aria-hidden", "true");

              iconSpan2.appendChild(icon2);
              cardHeaderIcon2.appendChild(iconSpan2);

              cardHeader2.appendChild(cardHeaderTitle2);
              cardHeader2.appendChild(cardHeaderIcon2);

              const cardContent2 = document.createElement("div");
              cardContent2.className = "card-content";
              cardContent2.id = "content";
              cardContent2.style.display = "none";

              const content2 = document.createElement("div");
              content2.className = "content";
              content2.appendChild(
                document.createTextNode(`🔄 ${langs.installing_loader}`)
              );
              content2.style.fontFamily = "Poppins";
              content2.style.fontWeight = "700";

              cardContent2.appendChild(content2);

              card2.appendChild(cardHeader2);
              card2.appendChild(cardContent2);

              // Crear tarjeta 3
              const card3 = document.createElement("div");
              card3.className = "card";

              const cardHeader3 = document.createElement("header");
              cardHeader3.className = "card-header";

              const cardHeaderTitle3 = document.createElement("p");
              cardHeaderTitle3.className = "card-header-title";
              cardHeaderTitle3.appendChild(
                document.createTextNode(langs.downloading_java)
              );

              const cardHeaderIcon3 = document.createElement("button");
              cardHeaderIcon3.className = "card-header-icon";
              cardHeaderIcon3.setAttribute("aria-label", "more options");

              const iconSpan3 = document.createElement("span");
              iconSpan3.className = "icon";

              const icon3 = document.createElement("i");
              icon3.className = "fas fa-angle-down";
              icon3.setAttribute("aria-hidden", "true");

              iconSpan3.appendChild(icon3);
              cardHeaderIcon3.appendChild(iconSpan3);

              cardHeader3.appendChild(cardHeaderTitle3);
              cardHeader3.appendChild(cardHeaderIcon3);

              const cardContent3 = document.createElement("div");
              cardContent3.className = "card-content";
              cardContent3.id = "content";
              cardContent3.style.display = "none";

              const content3 = document.createElement("div");
              content3.className = "content";
              content3.appendChild(
                document.createTextNode(`🔄 ${langs.installing_java}`)
              );
              content3.style.fontFamily = "Poppins";
              content3.style.fontWeight = "700";

              cardContent3.appendChild(content3);

              card3.appendChild(cardHeader3);
              card3.appendChild(cardContent3);

              preparingModalCardBody.appendChild(card3);
              preparingModalCardBody.appendChild(document.createElement("br"));
              preparingModalCardBody.appendChild(card2);

              // Modal card foot
              const preparingModalCardFoot = document.createElement("footer");
              preparingModalCardFoot.className = "modal-card-foot";
              preparingModalCardFoot.style.backgroundColor = "#212121";

              // Construir la estructura del modal
              preparingModalCard.appendChild(preparingModalCardHead);
              preparingModalCard.appendChild(preparingModalCardBody);
              preparingModalCard.appendChild(preparingModalCardFoot);

              preparingModal.appendChild(preparingModalBackground);
              preparingModal.appendChild(preparingModalCard);

              // Agregar el modal al contenedor en el DOM
              document.body.appendChild(preparingModal);
              modal.remove();

              launch.on("extract", (extract) => {
                new logger("Extract", "#00d1b2");
              });

              let assetsShown = false;
              let javaShown = false;
              let librariesShown = false;

              let content1Text;
              content1Text = document.createTextNode(
                `🔄 ${langs.checking_assets}`
              );
              let content3Text;
              content3Text = document.createTextNode(
                `🔄 ${langs.checking_java}`
              );
              let content2Text;
              content2Text = document.createTextNode(
                `🔄 ${langs.checking_instance} ${
                  loader_json ? loader_json : loader
                }...`
              );

              launch.on("progress", (progress, size, element) => {
                new logger("Progress", "#00d1b2");
                //console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);

                if (element === "Assets") {
                  if (!assetsShown) {
                    //añadir un br
                    content1.appendChild(document.createElement("br"));
                    content1.appendChild(content1Text);
                    cardContent1.style.display = "block";
                    cardContent2.style.display = "none";
                    cardContent3.style.display = "none";
                    assetsShown = true;
                  }

                  content1Text.textContent = `🔄 ${
                    langs.downloading_assets
                  }... (${Math.round((progress / size) * 100)}%)`;
                } else if (element === "Java") {
                  if (!javaShown) {
                    content3.appendChild(document.createElement("br"));
                    content3.appendChild(content3Text);
                    cardContent1.style.display = "none";
                    cardContent2.style.display = "none";
                    cardContent3.style.display = "block";
                    javaShown = true;
                  }

                  content3Text.textContent = `🔄 ${
                    langs.downloading_java
                  }... (${Math.round((progress / size) * 100)}%)`;
                } else if (element === "libraries") {
                  if (!librariesShown) {
                    content2.appendChild(content2Text);
                    cardContent1.style.display = "none";
                    cardContent2.style.display = "block";
                    cardContent3.style.display = "none";
                    librariesShown = true;
                  }

                  content2Text.textContent = `🔄 ${langs.downloading} ${
                    loader_json ? loader_json : loader
                  }... (${Math.round((progress / size) * 100)}%)`;
                }
              });

              let assetsShownCheck = false;
              let javaShownCheck = false;
              let librariesShownCheck = false;

              launch.on("check", (progress, size, element) => {
                new logger("Check", "#00d1b2");

                if (element === "assets") {
                  if (!assetsShownCheck) {
                    //añadir un br
                    content1.appendChild(document.createElement("br"));
                    content1.appendChild(content1Text);
                    cardContent1.style.display = "block";
                    cardContent2.style.display = "none";
                    cardContent3.style.display = "none";
                    assetsShownCheck = true;
                  }

                  content1Text.textContent = `🔄 ${
                    langs.checking_assets
                  }... (${Math.round((progress / size) * 100)}%)`;
                } else if (element === "java") {
                  if (!javaShownCheck) {
                    content3.appendChild(document.createElement("br"));
                    content3.appendChild(content3Text);
                    cardContent1.style.display = "none";
                    cardContent2.style.display = "none";
                    cardContent3.style.display = "block";
                    javaShownCheck = true;
                  }

                  content3Text.textContent = `🔄 ${
                    langs.checking_java
                  }... (${Math.round((progress / size) * 100)}%)`;
                } else if (element === "libraries") {
                  if (!librariesShownCheck) {
                    content2.appendChild(document.createElement("br"));
                    content2.appendChild(content2Text);
                    cardContent1.style.display = "none";
                    cardContent2.style.display = "block";
                    cardContent3.style.display = "none";
                    librariesShownCheck = true;
                  }

                  content2Text.textContent = `🔄 ${langs.checking_instance} ${
                    loader_json ? loader_json : loader
                  }... (${Math.round((progress / size) * 100)}%)`;
                }
              });

              launch.on("speed", (speed) => {
                preparingMessageText.textContent = `${
                  langs.downloading_instance
                } (${(speed / 1067008).toFixed(2)} MB/s)`;
              });

              launch.on("patch", (patch) => {
                new logger("Patch", "#00d1b2");
              });

              let inicio = false;
              launch.on("data", (e) => {
                new logger("Data", "#00d1b2");
                if (!inicio) {
                  if (
                    e.includes(`Setting user: ${account.name}`) ||
                    e.includes("Launching wrapped minecraft")
                  ) {
                    let typeOfVersion;
                    if (loader === "forge") {
                      typeOfVersion = "Forge";
                    } else if (loader === "fabric") {
                      typeOfVersion = "Fabric";
                    } else if (loader === "quilt") {
                      typeOfVersion = "Quilt";
                    } else {
                      typeOfVersion = "";
                    }

                    ipcRenderer.send(
                      "new-status-discord-jugando",
                      `${langs.playing_in} ${version} ${typeOfVersion}`
                    );

                    this.UpdateStatus(
                      account.name,
                      "ausente",
                      `${langs.playing_in} ${version} ${typeOfVersion}`
                    );
                  }

                  ipcRenderer.send("new-notification", {
                    title: langs.minecraft_started_correctly,
                    body: langs.minecraft_started_correctly_body,
                  });

                  ipcRenderer.send("main-window-progress-reset");

                  preparingModal.remove();
                  inicio = true;

                  if (launcherSettings.launcher.close === "close-launcher")
                    ipcRenderer.send("main-window-hide");
                }
              });

              launch.on("close", (code) => {
                if (launcherSettings.launcher.close === "close-launcher")
                  ipcRenderer.send("main-window-show");

                ipcRenderer.send("updateStatus", {
                  status: "online",
                  details: langs.in_the_menu,
                  username: account.name,
                });
              });

              launch.on("error", (err) => {
                new logger("[Error]", "#ff3860");
                console.log(err);
              });
            });
          } catch {
            console.log("❌ No se ha podido leer el archivo instance.json");
          }
        }
      }

      const card2 = document.createElement("div");
      card2.classList.add("card");
      card2.style.cursor = "pointer";
      card2.style.width = "100%";

      const cardHeader2 = document.createElement("header");
      cardHeader2.classList.add("card-header");

      const cardTitle2 = document.createElement("p");
      cardTitle2.classList.add("card-header-title");
      cardTitle2.textContent = langs.create_instance;

      const cardIcon2 = document.createElement("button");
      cardIcon2.classList.add("card-header-icon");
      cardIcon2.setAttribute("aria-label", "more options");

      const icon2 = document.createElement("span");
      icon2.classList.add("icon");

      const iconImage2 = document.createElement("i");
      iconImage2.classList.add("fas", "fa-plus");

      icon2.appendChild(iconImage2);
      cardIcon2.appendChild(icon2);

      const cardFooter1 = document.createElement("footer");
      cardFooter1.classList.add("modal-card-foot");
      cardFooter1.style.backgroundColor = "#212121";
      cardFooter1.appendChild(card2);

      // Agregar elementos al DOM
      document.body.appendChild(modal);
      modal.appendChild(modalBackground);
      modal.appendChild(modalCard);
      modalCard.appendChild(modalHeader);
      modalCard.appendChild(modalBody);
      card2.appendChild(cardHeader2);
      cardHeader2.appendChild(cardTitle2);
      cardHeader2.appendChild(cardIcon2);
      modalCard.appendChild(cardFooter1);

      closeBtn.addEventListener("click", () => {
        modal.remove();
      });

      card2.addEventListener("click", () => {
        // Crear el elemento modal
        const modal = document.createElement("div");
        modal.className = "modal is-active";
        modal.style.zIndex = "3";

        // Modal background
        const modalBackground = document.createElement("div");
        modalBackground.className = "modal-background";

        // Modal card
        const modalCard = document.createElement("div");
        modalCard.className = "modal-card";
        modalCard.style.backgroundColor = "#212121";

        // Modal card head
        const modalCardHead = document.createElement("header");
        modalCardHead.className = "modal-card-head";
        modalCardHead.style.backgroundColor = "#212121";

        const modalCardTitle = document.createElement("p");
        modalCardTitle.className = "modal-card-title";
        modalCardTitle.style.fontSize = "25px";
        modalCardTitle.style.fontFamily = "Poppins";
        modalCardTitle.style.color = "#fff";
        modalCardTitle.innerText = langs.create_instance;

        const closeButton = document.createElement("button");
        closeButton.className = "delete";
        closeButton.setAttribute("aria-label", "close");

        modalCardHead.appendChild(modalCardTitle);
        modalCardHead.appendChild(closeButton);

        // Modal card body
        const modalCardBody = document.createElement("section");
        modalCardBody.className = "modal-card-body";
        modalCardBody.style.backgroundColor = "#212121";

        const nameLabel = document.createElement("p");
        nameLabel.style.color = "#fff";
        nameLabel.innerText = langs.instance_name;

        const nameInput = document.createElement("input");
        nameInput.className = "input is-info";
        nameInput.type = "text";
        nameInput.style.fontFamily = "Poppins";
        nameInput.style.fontWeight = "500";
        nameInput.style.fontSize = "12px";
        nameInput.setAttribute("placeholder", langs.name);

        const descriptionLabel = document.createElement("p");
        descriptionLabel.style.color = "#fff";
        descriptionLabel.innerText = langs.instance_description;

        const descriptionTextarea = document.createElement("textarea");
        descriptionTextarea.className = "textarea is-info";
        descriptionTextarea.style.fontFamily = "Poppins";
        descriptionTextarea.style.height = "20px";
        descriptionTextarea.style.fontWeight = "500";
        descriptionTextarea.style.fontSize = "12px";
        descriptionTextarea.setAttribute("name", "about");
        descriptionTextarea.setAttribute("placeholder", langs.description);

        const imageLabel = document.createElement("p");
        imageLabel.style.color = "#fff";
        imageLabel.innerText = langs.instance_image;

        const imageContainer = document.createElement("div");
        imageContainer.style.display = "flex";

        const imageFigure = document.createElement("figure");
        imageFigure.className = "image is-64x64";
        imageFigure.style.marginRight = "10px";

        const image = document.createElement("img");
        image.src = "./assets/images/icons/minecraft.png";
        image.style.borderRadius = "5px";

        const fileContainer = document.createElement("div");
        fileContainer.className = "file is-info is-boxed";
        fileContainer.style.height = "65px";

        const fileLabel = document.createElement("label");
        fileLabel.className = "file-label";

        const fileInput = document.createElement("input");
        fileInput.className = "file-input";
        fileInput.type = "file";
        fileInput.setAttribute("name", "resume");

        const fileCta = document.createElement("span");
        fileCta.className = "file-cta";

        const fileIcon = document.createElement("span");
        fileIcon.className = "file-icon";

        const uploadIcon = document.createElement("i");
        uploadIcon.className = "fas fa-cloud-upload-alt";

        const fileLabelText = document.createElement("span");
        fileLabelText.style.fontSize = "10px";
        fileLabelText.innerText = langs.select_a_file;

        fileIcon.appendChild(uploadIcon);
        fileCta.appendChild(fileIcon);
        fileCta.appendChild(fileLabelText);
        fileLabel.appendChild(fileInput);
        fileLabel.appendChild(fileCta);
        fileContainer.appendChild(fileLabel);

        imageFigure.appendChild(image);
        imageContainer.appendChild(imageFigure);
        imageContainer.appendChild(fileContainer);

        const versionLabel = document.createElement("p");
        versionLabel.style.color = "#fff";
        versionLabel.innerText = langs.instance_version;

        const versionSelect = document.createElement("div");
        versionSelect.className = "select is-info";

        const versionVersionSelect = document.createElement("div");
              versionVersionSelect.className = "select is-info";
              versionVersionSelect.style.marginLeft = "5px";

              const versionOptionsVersion = document.createElement("select");
              versionVersionSelect.appendChild(versionOptionsVersion);

        const versionOptions = document.createElement("select");

        versionSelect.appendChild(versionOptions);

        modalCardBody.appendChild(nameLabel);
        modalCardBody.appendChild(nameInput);
        modalCardBody.appendChild(document.createElement("br"));
        modalCardBody.appendChild(document.createElement("br"));
        modalCardBody.appendChild(descriptionLabel);
        modalCardBody.appendChild(descriptionTextarea);
        modalCardBody.appendChild(document.createElement("br"));
        modalCardBody.appendChild(imageLabel);
        modalCardBody.appendChild(imageContainer);
        modalCardBody.appendChild(document.createElement("br"));
        modalCardBody.appendChild(versionLabel);
        modalCardBody.appendChild(versionSelect);
        modalCardBody.appendChild(versionVersionSelect);

        // Modal card foot
        const modalCardFoot = document.createElement("footer");
        modalCardFoot.className = "modal-card-foot";
        modalCardFoot.style.backgroundColor = "#212121";

        const createButton = document.createElement("button");
        createButton.className = "button is-info is-responsive";
        createButton.style.fontSize = "12px";
        createButton.style.fontFamily = "Poppins";
        createButton.style.color = "#fff";
        createButton.style.marginLeft = "0px";
        createButton.innerText = langs.create_instance;

        modalCardFoot.appendChild(createButton);

        // Construir la estructura del modal
        modalCard.appendChild(modalCardHead);
        modalCard.appendChild(modalCardBody);
        modalCard.appendChild(modalCardFoot);

        modal.appendChild(modalBackground);
        modal.appendChild(modalCard);

        // Agregar el modal al contenedor en el DOM
        document.body.appendChild(modal);

        let versiones = this.Versions;
              for (let i = 0; i < versiones.versions.length; i++) {
                if (
                  versiones.versions[i].version.endsWith("-forge") ||
                  versiones.versions[i].version.endsWith("-fabric") ||
                  versiones.versions[i].version.endsWith("-quilt")
                ) {
                  let version = versiones.versions[i];
                  let option = document.createElement("option");
                  option.value = version.version;
                  option.innerHTML = version.name;
                  versionOptions.appendChild(option);
                }
              }

              setTimeout(async () => {
                  let forgeVersionType = versionOptions;
                  const axios = require("axios");
                  await axios
                    .get(
                      "https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json"
                    )
                    .then((response) => {
                      let data = response.data;

                      // Agregar las opciones de "latest" y "recommended"
                      let latestOption = document.createElement("option");
                      latestOption.value = "latest";
                      latestOption.innerHTML = langs.latest;
                      versionOptionsVersion.appendChild(latestOption);

                      let recommendedOption = document.createElement("option");
                      recommendedOption.value = "recommended";
                      recommendedOption.innerHTML = langs.recommended;
                      versionOptionsVersion.appendChild(recommendedOption);

                      for (let version in data) {
                        if (version === forgeVersionType.value.replace("-forge", "")) {
                          let build = data[version];
                          // Limpiar el select antes de agregar nuevas opciones
                          versionOptionsVersion.innerHTML = "";

                          // Agregar las opciones de "latest" y "recommended" nuevamente
                          versionOptionsVersion.appendChild(latestOption.cloneNode(true));
                          versionOptionsVersion.appendChild(
                            recommendedOption.cloneNode(true)
                          );

                          // Agregar las otras versiones
                          for (let j = 0; j < build.length; j++) {
                            let option = document.createElement("option");
                            option.value = build[j];
                            option.innerHTML = build[j];
                            versionOptionsVersion.appendChild(option);
                          }
                        }
                      }
                    });
              }, 500);

        versionSelect.addEventListener("change", async () => {
                versionOptionsVersion.innerHTML = "";
                let optionLoading = document.createElement("option");
                optionLoading.value = "loading";
                optionLoading.innerHTML = langs.loading;
                versionOptionsVersion.selectedIndex = 0;
                versionOptionsVersion.appendChild(optionLoading);


                let forgeVersionType = versionOptions;
                const axios = require("axios");
                await axios
                  .get(
                    "https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json"
                  )
                  .then((response) => {
                    let data = response.data;
                
                    versionOptionsVersion.innerHTML = "";

                    // Agregar las opciones de "latest" y "recommended"
                    let latestOption = document.createElement("option");
                    latestOption.value = "latest";
                    latestOption.innerHTML = langs.latest;
                    versionOptionsVersion.appendChild(latestOption);

                    let recommendedOption = document.createElement("option");
                    recommendedOption.value = "recommended";
                    recommendedOption.innerHTML = langs.recommended;
                    versionOptionsVersion.appendChild(recommendedOption);

                    for (let version in data) {
                      if (version === forgeVersionType.value.replace("-forge", "")) {
                        let build = data[version];
                        // Limpiar el select antes de agregar nuevas opciones
                        versionOptionsVersion.innerHTML = "";

                        // Agregar las opciones de "latest" y "recommended" nuevamente
                        versionOptionsVersion.appendChild(latestOption.cloneNode(true));
                        versionOptionsVersion.appendChild(
                          recommendedOption.cloneNode(true)
                        );

                        // Agregar las otras versiones
                        for (let j = 0; j < build.length; j++) {
                          let option = document.createElement("option");
                          option.value = build[j];
                          option.innerHTML = build[j];
                          versionOptionsVersion.appendChild(option);
                        }
                      }
                    }
                  });
              });

        closeButton.addEventListener("click", () => {
          modal.remove();
        });

        fileInput.addEventListener("change", () => {
          let imagen = fileInput.files ? fileInput.files : null;
          if (imagen.length > 0) {
            let reader = new FileReader();
            reader.onload = function (e) {
              image.src = e.target.result;
            };
            reader.readAsDataURL(imagen[0]);
          }
        });

        createButton.addEventListener("click", () => {
          let name = nameInput.value;
          let description = descriptionTextarea.value;
          let version = versionOptions.value;
          let loaderVersion = versionOptionsVersion.value;

          if (name && description && version) {
            //crear un string random de 6 caracteres
            let randomString = Math.random().toString(36).substring(2, 8);
            //crear el archivo de la instancia
            //comprobar si existe la carpeta de instancias
            if (!fs.existsSync(`${dataDirectory}/.battly/instances`)) {
              fs.mkdirSync(`${dataDirectory}/.battly/instances`);
            }

            //comprobar si existe la carpeta de la instancia
            if (
              !fs.existsSync(
                `${dataDirectory}/.battly/instances/${randomString}`
              )
            ) {
              fs.mkdirSync(
                `${dataDirectory}/.battly/instances/${randomString}`
              );
            } else {
              //generar otro string random
              randomString = Math.random().toString(36).substring(2, 8);
              //crear la carpeta de la instancia
              fs.mkdirSync(
                `${dataDirectory}/.battly/instances/${randomString}`
              );
            }

            let imagen = fileInput.files ? fileInput.files : null;
            if (imagen.length > 0) {
              fs.copyFileSync(
                imagen[0].path,
                `${dataDirectory}/.battly/instances/${randomString}/icon.png`
              );
            } else {
              //descargar la imagen https://bulma.io/images/placeholders/128x128.png y moverla a la carpeta de la instancia
              imagen = "/assets/images/icons/minecraft.png";
              //convertir a buffer
              let buffer = fs.readFileSync(__dirname + imagen);
              //escribir el archivo
              fs.writeFileSync(
                `${dataDirectory}/.battly/instances/${randomString}/icon.png`,
                buffer
              );
            }

            let instance = {
              id: randomString,
              image: `${dataDirectory}/.battly/instances/${randomString}/icon.png`,
              name: name,
              description: description,
              loader: version.endsWith("-forge") ? "forge" : version.endsWith("-fabric") ? "fabric" : version.endsWith("-quilt") ? "quilt" : null,
              loaderVersion: loaderVersion,
              version: version.replace("-forge", "").replace("-fabric", "").replace("-quilt", ""),
            };

            let instance_json = JSON.stringify(instance);
            fs.writeFileSync(
              path.join(
                `${dataDirectory}/.battly/instances/${randomString}`,
                "instance.json"
              ),
              instance_json
            );

            //eliminar el modal
            modal.remove();

            new Alert().ShowAlert({
              icon: "success",
              title: langs.instance_created_correctly,
            });
          } else {
            new Alert().ShowAlert({
              icon: "error",
              title: langs.fill_all_fields,
            });
          }
        });
      });
    });
  }

  async CambiarRutaJava() {
    let inputRutaJava = document.getElementById("ruta-java-input");

    let ruta_java = localStorage.getItem("java-path");

    if (ruta_java) {
      inputRutaJava.value = ruta_java;
    } else {
      //si es windows
      if (process.platform === "win32") {
        //hacer un scan en ``${dataDirectory}/.battly/runtime`` ver si están la carpeta jre-17.0.8-win32 o jre-17.0.1.12.1-win32
        if (
          fs.existsSync(`${dataDirectory}/.battly/runtime/jre-17.0.8-win32`)
        ) {
          //si existe, poner la ruta en el input
          inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.8-win32/bin/java.exe`;
          localStorage.setItem(
            "java-path",
            `${dataDirectory}/.battly/runtime/jre-17.0.8-win32/bin/java.exe`
          );
        } else if (
          fs.existsSync(
            `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32`
          )
        ) {
          //si existe, poner la ruta en el input
          inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32/bin/java.exe`;
          localStorage.setItem(
            "java-path",
            `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32/bin/java.exe`
          );
        } else if (
          fs.existsSync(
            `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64`
          )
        ) {
          inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64/bin/java.exe`;
          localStorage.setItem(
            "java-path",
            `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64/bin/java.exe`
          );
        } else if (
          fs.existsSync(
            `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64`
          )
        ) {
          inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64/bin/java.exe`;
          localStorage.setItem(
            "java-path",
            `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64/bin/java.exe`
          );
        } else {
          inputRutaJava.value =
            "Java no encontrado. Haz click aquí para buscarlo.";
        }
      } else {
        inputRutaJava.value =
          "Java no encontrado. Haz click aquí para buscarlo.";
      }
    }
  }

  async GenerarLogsSocket() {
    ipcRenderer.on("getLogsAnterior", async () => {
      let generated = consoleOutput + "\n" + consoleOutput_;
      await fs.writeFileSync(logFilePath, generated);
    });
  }

  async GetLogsSocket() {
    ipcRenderer.on("avisoObtenerLogs", async (event, args) => {
      Swal.fire({
        title: langs.title_access_logs,
        text: langs.text_access_logs,
        html: `${langs.requester} ${args.user}<br>${langs.reason}: ${args.razon}<br><br>${langs.text_access_logs_two}`,
        showCancelButton: true,
        confirmButtonText: langs.allow,
        confirmButtonColor: "#3e8ed0",
        cancelButtonText: langs.deny,
        cancelButtonColor: "#f14668",
      }).then(async (result) => {
        if (result.isConfirmed) {
          if (!fs.existsSync(logFilePath)) {
            let generated = consoleOutput + "\n" + consoleOutput_;
            await fs.writeFileSync(logFilePath, generated);

            let uuid = (await this.database.get("1234", "accounts-selected")).value;
            let account = this.database.getAccounts().find(account => account.uuid === uuid.selected);
            let ram = (await this.database.get("1234", "ram")).value;
            let Resolution = (await this.database.get("1234", "screen")).value;
            let launcherSettings = (await this.database.get("1234", "launcher"))
              .value;
            
            let accountsOnlyUsernamesAndUUID = this.database.getAccounts().map(account => {
              return {
                username: account.name,
                uuid: account.uuid
              }
            });
      
            let accountOnlyUsernameAndUUID = {
              username: account.name,
              uuid: account.uuid,
            };

            const userData = {
              selectedAccount: accountOnlyUsernameAndUUID,
              accounts: accountsOnlyUsernamesAndUUID,
              ram: ram,
              resolution: Resolution,
              launcherSettings: launcherSettings,
              javaPath: localStorage.getItem("java-path"),
              lang: localStorage.getItem("lang"),
              theme: {
                background_loading_screen_color: localStorage.getItem("background-loading-screen-color"),
                bottom_bar_opacity: localStorage.getItem("theme-opacity-bottom-bar"),
                color_bottom_bar: localStorage.getItem("theme-color-bottom-bar"),
                color: localStorage.getItem("theme-color"),
                start_sound: localStorage.getItem("sonido-inicio"),
                playing_song: localStorage.getItem("songPlaying"),
              },
              news_shown: {
                news_shown_v17: localStorage.getItem("news_shown_v1.7"),
                news_shown_v18: localStorage.getItem("news_shown_v1.8"),
              },
              welcome_premium_shown: localStorage.getItem("WelcomePremiumShown"),
            };


            ipcRenderer.send("obtenerLogs", userData);
          } else {
            await fs.unlinkSync(logFilePath);
            let generated = consoleOutput + "\n" + consoleOutput_;
            await fs.writeFileSync(logFilePath, generated);

            let uuid = (await this.database.get("1234", "accounts-selected")).value;
            let account = this.database.getAccounts().find(account => account.uuid === uuid.selected);
            let ram = (await this.database.get("1234", "ram")).value;
            let Resolution = (await this.database.get("1234", "screen")).value;
            let launcherSettings = (await this.database.get("1234", "launcher"))
              .value;
            
            let accountsOnlyUsernamesAndUUID = this.database.getAccounts().map(account => {
              return {
                username: account.name,
                uuid: account.uuid
              }
            });
      
            let accountOnlyUsernameAndUUID = {
              username: account.name,
              uuid: account.uuid,
            };

            const userData = {
              selectedAccount: accountOnlyUsernameAndUUID,
              accounts: accountsOnlyUsernamesAndUUID,
              ram: ram,
              resolution: Resolution,
              launcherSettings: launcherSettings,
              javaPath: localStorage.getItem("java-path"),
              lang: localStorage.getItem("lang"),
              theme: {
                background_loading_screen_color: localStorage.getItem("background-loading-screen-color"),
                bottom_bar_opacity: localStorage.getItem("theme-opacity-bottom-bar"),
                color_bottom_bar: localStorage.getItem("theme-color-bottom-bar"),
                color: localStorage.getItem("theme-color"),
                start_sound: localStorage.getItem("sonido-inicio"),
                playing_song: localStorage.getItem("songPlaying"),
              },
              news_shown: {
                news_shown_v17: localStorage.getItem("news_shown_v1.7"),
                news_shown_v18: localStorage.getItem("news_shown_v1.8"),
              },
              welcome_premium_shown: localStorage.getItem("WelcomePremiumShown"),
            };

            ipcRenderer.send("obtenerLogs", userData);
          }
        } else {
          new Alert().ShowAlert({
            icon: "error",
            title: langs.access_logs_denied,
            text: langs.access_logs_denied_text,
          });
        }
      });
    });

    ipcRenderer.on("enviarSocketID", async (event, args) => {
      Swal.fire({
        title: langs.title_access_logs,
        text: `${langs.your_unique_id_is} ${args.sessionID} ${langs.dont_share_it}`,
        confirmButtonText: langs.copy,
      }).then(async (result) => {
        if (result.isConfirmed) {
          navigator.clipboard.writeText(args.sessionID);
          new Alert().ShowAlert({
            icon: "success",
            title: langs.id_copied_correctly,
          });
        }
      });
    });
  }

  async WaitData() {
    if (!fs.existsSync(`${dataDirectory}/.battly`)) {
      fs.mkdirSync(`${dataDirectory}/.battly`);
    }

    if (!fs.existsSync(`${dataDirectory}/.battly/instances`)) {
      fs.mkdirSync(`${dataDirectory}/.battly/instances`);
    }

    if (!fs.existsSync(`${dataDirectory}/.battly/battly`)) {
      fs.mkdirSync(`${dataDirectory}/.battly/battly`);
    }

    if (!fs.existsSync(`${dataDirectory}/.battly/battly/mods-internos`)) {
      fs.mkdirSync(`${dataDirectory}/.battly/battly/mods-internos`);
    }

    if (!fs.existsSync(`${dataDirectory}/.battly/battly/launcher`)) {
      fs.mkdirSync(`${dataDirectory}/.battly/battly/launcher`);
    }

    if (
      !fs.existsSync(`${dataDirectory}/.battly/battly/launcher/config-launcher`)
    ) {
      fs.mkdirSync(`${dataDirectory}/.battly/battly/launcher/config-launcher`);
    }

    if (!fs.existsSync(`${dataDirectory}/.battly/battly/launcher/forge`)) {
      fs.mkdirSync(`${dataDirectory}/.battly/battly/launcher/forge`);
    }

    if (!fs.existsSync(`${dataDirectory}/.battly/battly/launcher/mc-assets`)) {
      fs.mkdirSync(`${dataDirectory}/.battly/battly/launcher/mc-assets`);
    }
  }

  async ShowNews() {
    let btnShowNews = document.getElementById("btnShowNews");
    btnShowNews.addEventListener("click", async () => {
      changePanel("news");
    });
    let news_shown = localStorage.getItem("news_shown_v1.8");
    if (
      !news_shown ||
      news_shown == "false" ||
      news_shown == null ||
      news_shown == undefined
    ) {
      setTimeout(function () {
        changePanel("news");
      }, 3000);
    }
  }

  async InitTheme() {
    const btnDownload1 = document.getElementById("music-btn");
    btnDownload1.addEventListener("click", () => {
      changePanel("music");
    });

    let color = localStorage.getItem("theme-color");
    let colorHover = localStorage.getItem("theme-color-hover");
    if (!color) color = "#3e8ed0";
    if (!colorHover) colorHover = tinycolor(color).darken(10).toString();
    let color_bottom_bar = localStorage.getItem("theme-color-bottom-bar");
    let opacity = localStorage.getItem("theme-opacity-bottom-bar");
    let background_img = localStorage.getItem("background-img");
    let background_loading_screen_color = localStorage.getItem("background-loading-screen-color");
    let background_video = localStorage.getItem("background-video");

    let buttons = document.querySelectorAll(".button");
    let btns = document.querySelectorAll(".btn");
    let tab_btns = document.querySelectorAll(".tab-btn");
    let inputs = document.querySelectorAll(".input");
    let select = document.querySelectorAll(".select");
    let select_options = document.querySelectorAll(".select-version");
    let select_selected = document.querySelectorAll(".select-selected");
    let select_selected_span = document.querySelectorAll(
      ".select-selected span"
    );
    let accounts = document.querySelectorAll(".account");
    let rectangulos = document.querySelectorAll(".rectangulo");


    let bottom_bar_settings = document.querySelector(".bottom_bar_settings");
    let bottom_bar_mods = document.querySelector(".bottom_bar_mods");

    if (color_bottom_bar) {
    } else {
      color_bottom_bar.value = "#1f1f1f";
      localStorage.setItem("theme-color-bottom-bar", "#1f1f1f");
    }

    let bottom_bar = document.querySelectorAll(".bottom_bar");
    bottom_bar.forEach((bar) => {
      bar.style.backgroundColor = color_bottom_bar;
    });
    bottom_bar_settings.style.backgroundColor = color_bottom_bar;
    bottom_bar_mods.style.backgroundColor = color_bottom_bar;

    buttons.forEach((button) => {
      button.style.backgroundColor = color;
      button.addEventListener("mouseover", () => {
        const span = button.querySelector("span");
        colorHover = localStorage.getItem("theme-color-hover");
        button.style.backgroundColor = colorHover;
        if (span) {
          span.classList.add("animate__animated")
          span.classList.add("animate__infinite")
          span.classList.add("animate__pulse")
        }
      });

      button.addEventListener("mouseout", () => {
        const span = button.querySelector("span");
        color = localStorage.getItem("theme-color");
        button.style.backgroundColor = color;
        if (span) {
          span.classList.remove("animate__animated")
          span.classList.remove("animate__infinite")
          span.classList.remove("animate__pulse")
        }
      });
    });

    let video = document.getElementById("video-background");
    let source = video.querySelector('source');
    video.style.display = "none";

    if (!background_video || background_video == null || background_video == undefined) {
      video.style.display = "none";
    } else {
      console.log("entra");
      video.style.display = "";
      source.src = background_video;
      video.load();
      video.play();
    }

    if (opacity) {
      bottom_bar.forEach((bar) => {
        bar.style.opacity = opacity;
      });

      bottom_bar_settings.style.opacity = opacity;
      bottom_bar_mods.style.opacity = opacity;
    } else {
      bottom_bar.forEach((bar) => {
        bar.style.opacity = "1";
      });

      bottom_bar_settings.style.opacity = "1";
      bottom_bar_mods.style.opacity = "1";
    }

    document.querySelector(".save-tabs-btn").style.backgroundColor = color;

    btns.forEach((btn) => {
      btn.style.backgroundColor = color;
    });

    tab_btns.forEach((tab_btn) => {
      tab_btn.style.backgroundColor = color;
    });

    inputs.forEach((input) => {
      input.style.backgroundColor = color;
    });

    select.forEach((select) => {
      select.style.backgroundColor = color;
    });

    select_options.forEach((select_option) => {
      select_option.style.backgroundColor = color;
    });

    select_selected.forEach((select_selected) => {
      select_selected.style.backgroundColor = color;
    });

    select_selected_span.forEach((select_selected_span) => {
      select_selected_span.style.backgroundColor = color;
    });

    accounts.forEach((account) => {
      account.style.backgroundColor = color;
      //si contiene la clase active-account
      if (!account.classList.contains("active-account")) {
        //hacer que el border sea el mismo color pero más oscuro
        let colorOscuro = tinycolor(color).darken(10).toString();
        account.style.border = `4px solid ${colorOscuro}`;
      } else {
        //hacer que el hover sea el mismo color pero más oscuro
        let colorOscuro = tinycolor(color).darken(10).toString();
        //hover
        account.addEventListener("mouseover", () => {
          account.style.border = `4px solid ${colorOscuro}`;
        });

        account.addEventListener("mouseout", () => {
          account.style.border = `4px solid #00ff91`;
        });
      }
    });

    document.querySelectorAll(".file-cta").forEach((fileCta) => {
      fileCta.style.backgroundColor = color;
    });

    if (background_img) {
      document.body.style.backgroundImage = `url(${background_img})`;
    } else {
    }

    if (background_loading_screen_color) {
      rectangulos.forEach((rectangulo) => {
        rectangulo.style.backgroundColor = background_loading_screen_color;
      });
    }
  }

  async IniciarEstadoDiscord() {
    ipcRenderer.send("new-status-discord");
  }

  async CargarVersiones() {
    let versiones = document.getElementById("listaDeVersiones");
    let btnReloadVersions = document.getElementById("reiniciar-versiones");
    btnReloadVersions.addEventListener("click", () => {
      versiones.innerHTML = "";
      this.CargarVersiones();

      new Alert().ShowAlert({
        icon: "success",
        title: langs.version_list_updated,
      });
    });
    try {
      let versiones_nuevas = fs.readdirSync(
        dataDirectory + "/.battly/versions"
      );

      let versions_vanilla = [];

      for (let i = 0; i < versiones_nuevas.length; i++) {
        let data_versions_mojang = this.VersionsMojang;

        for (let i = 0; i < data_versions_mojang.versions.length; i++) {
          let version = data_versions_mojang.versions[i].id;
          versions_vanilla.push(version);
        }

        let version = versiones_nuevas[i];

        if (!versions_vanilla.includes(version)) {
          let option = document.createElement("option");
          //si contiene OptiFine- eliminar todo lo que vaya después de OptiFine pero incluir la palabra OptiFine
          if (version.includes("OptiFine_")) {
            // Usa una expresión regular para eliminar todo después de "OptiFine" y agrega "OptiFine"
            let version_optifine = version.replace(/OptiFine.*$/, "OptiFine");
            option.value = version + `-extra`;
            option.innerHTML = version_optifine;
            versiones.appendChild(option);
          } else {
            option.value = version + `-extra`;
            option.innerHTML = version;
            versiones.appendChild(option);
          }
        } else {
          let option = document.createElement("option");
          option.value = version + ``;
          option.innerHTML = version + "";
          versiones.appendChild(option);
        }
      }
    } catch {}
  }

  async CargarMods() {
    let BotonUnirseServidorDiscord = document.getElementById(
      "BotonUnirseServidorDiscord"
    );
    BotonUnirseServidorDiscord.addEventListener("click", function () {
      window.open("https://discord.gg/tecno-bros-885235460178342009", "_blank");
    });
      
    document.getElementById("openBattlyFolderButton").addEventListener("click", () => {
      shell.openPath(`${dataDirectory}\\.battly`).then(() => {
        new Alert().ShowAlert({
          icon: "success",
          title: langs.battly_folder_opened,
        });
      });
    });
  }

  async initConfig() {
    let config = this.BattlyConfig;
    let config_json = JSON.stringify(config);
    fs.mkdirSync(
      `${dataDirectory}/${
        process.platform == "darwin"
          ? this.config.dataDirectory
          : `.${this.config.dataDirectory}`
      }`,
      {
        recursive: true,
      }
    );
    fs.mkdirSync(
      `${dataDirectory}/${
        process.platform == "darwin"
          ? this.config.dataDirectory
          : `.${this.config.dataDirectory}`
      }/versions`,
      {
        recursive: true,
      }
    );

    let versionsConfig = this.Versions;
    let config_json_versions = JSON.stringify(versionsConfig);
    fs.mkdirSync(
      `${dataDirectory}/${
        process.platform == "darwin"
          ? this.config.dataDirectory
          : `.${this.config.dataDirectory}`
      }`,
      {
        recursive: true,
      }
    );

    document.getElementById(
      "instancias-btn"
    ).innerHTML = `<span><i class="fa-solid fa-folder"></i> ${langs.instances}</span>`;
    document.getElementById(
      "download-btn"
    ).innerHTML = `<span><i class="fa-solid fa-cloud-arrow-down"></i> ${langs.download}</span>`;
    document.getElementById(
      "play-btn"
    ).innerHTML = `<span><i class="fa-solid fa-gamepad"></i> ${langs.play}</span>`;
    document.getElementById("news-battly").innerHTML = `${langs.news_battly}`;
    document.getElementById(
      "status-battly"
    ).innerHTML = `${langs.status_battly}`;
    document.getElementById(
      "playing-now-text"
    ).innerHTML = `${langs.playing_now_text}`;
    document.getElementById(
      "playing-now-body"
    ).innerHTML = `${langs.playing_now_body}`;
    document.getElementById("ads-text").innerHTML = `${langs.ads_text}`;

    /* settings */
    document.getElementById("accounts-btn-text").innerHTML = `${langs.accounts_btn}`;
    document.getElementById("java-btn-text").innerHTML = `${langs.java_btn}`;
    document.getElementById("ram-btn-text").innerHTML = `${langs.ram_btn}`;
    document.getElementById("launcher-btn-text").innerHTML = `${langs.launcher_btn}`;
    document.getElementById("theme-btn-text").innerHTML = `${langs.theme_btn}`;
    document.getElementById(
      "background-btn-text"
    ).innerHTML = `${langs.background_btn}`;
    document.getElementById("save-btn-text").innerHTML = `${langs.save_btn}`;
    document.getElementById(
      "account-information"
    ).innerHTML = `${langs.account_information}`;
    document.getElementById("mc-id-text").innerHTML = `${langs.mc_id_text}`;
    document.getElementById(
      "mostrarskin-userinfo-btn"
    ).innerHTML = `${langs.showskin_userinfo_btn}`;
    document.getElementById(
      "eliminarcuenta-userinfo-btn"
    ).innerHTML = `${langs.deleteaccount_userinfo_btn}`;
    document.getElementById("establecer-skin").innerHTML = `${langs.set_skin}`;
    document.getElementById("cerrar-userinfo-btn").innerHTML = `${langs.close}`;
    document.getElementById("my-accounts").innerHTML = `${langs.my_accounts}`;
    document.getElementById(
      "add-account-text"
    ).innerHTML = `${langs.add_account_text}`;
    document.getElementById(
      "java-settings"
    ).innerHTML = `${langs.java_settings}`;
    document.getElementById(
      "java-text-info"
    ).innerHTML = `${langs.java_text_info}`;
    document.getElementById(
      "java-text-info2"
    ).innerHTML = `${langs.java_text_info2}`;
    document.getElementById("ram-settings").innerHTML = `${langs.ram_settings}`;
    document.getElementById(
      "ram-text-info"
    ).innerHTML = `${langs.ram_text_info}`;
    document.getElementById("of-ram").innerHTML = `${langs.of_ram}`;
    document.getElementById(
      "of-ram-disponible"
    ).innerHTML = `${langs.of_ram_disponible}`;
    document.getElementById(
      "you-have-a-total"
    ).innerHTML = `${langs.you_have_a_total}`;
    document.getElementById(
      "ram-text-info"
    ).innerHTML = `${langs.ram_text_info}`;
    document.getElementById(
      "battly-settings"
    ).innerHTML = `${langs.battly_settings}`;
    document.getElementById(
      "battly-settings-information"
    ).innerHTML = `${langs.battly_settings_information}`;
    document.getElementById(
      "music_settings_information"
    ).innerHTML = `${langs.music_settings_information}`;
    document.getElementById(
      "minimalize-battly"
    ).innerHTML = `${langs.minimalize_battly}`;
    document.getElementById(
      "keep-battly-opened"
    ).innerHTML = `${langs.keep_battly_opened}`;
    document.getElementById(
      "obtener-socketid-text"
    ).innerHTML = `${langs.get_socketid}`;
    document.getElementById("battly-theme").innerHTML = `${langs.battly_theme}`;
    document.getElementById(
      "battly-theme-text"
    ).innerHTML = `${langs.battly_theme_text}`;
    document.getElementById(
      "change-theme-text"
    ).innerHTML = `${langs.change_theme_text}`;
    document.getElementById(
      "buttons-color"
    ).innerHTML = `${langs.buttons_color}`;
    document.getElementById(
      "bottom-bar-text"
    ).innerHTML = `${langs.bottom_bar_text}`;
    document.getElementById(
      "bottom-bar-opacity"
    ).innerHTML = `${langs.bottom_bar_opacity}`;
    document.getElementById(
      "starting-music"
    ).innerHTML = `${langs.starting_music}`;
    document.getElementById(
      "resize-image-text"
    ).innerHTML = `${langs.resize_image_text}`;
    document.getElementById(
      "establecer-fondo"
    ).innerHTML = `${langs.set_background_text}`;
    document.getElementById("cerrar-preview-btn").innerHTML = `${langs.cancel}`;
    document.getElementById(
      "customize-background"
    ).innerHTML = `${langs.customize_background}`;
    document.getElementById(
      "resize-background"
    ).innerHTML = `${langs.resize_background}`;
    document.getElementById(
      "background-image-text"
    ).innerHTML = `${langs.background_image_text}`;
    document.getElementById(
      "restablecer-fondo"
    ).innerHTML = `${langs.reset_background}`;
    document.getElementById(
      "select-a-background"
    ).innerHTML = `${langs.select_a_background}`;
    document.getElementById(
      "button_instalar_modpack"
    ).innerHTML = `${langs.install_modpack}`;
    document.getElementById("volver").innerHTML = `${langs.return}`;
    document.getElementById(
      "input_buscar_mods"
    ).placeholder = `${langs.search_mods}`;
    document.getElementById("add-friends").innerHTML = `${langs.add_friend}`;
    document.getElementById("solicitudes").innerHTML = `${langs.show_requests}`;
    document.getElementById("friends-volver-btn").innerHTML = `${langs.return}`;
    document.getElementById(
      "welcome_battly_social"
    ).innerHTML = `${langs.welcome_battly_social}`;
    document.getElementById(
      "friends_list_text"
    ).innerHTML = `${langs.friends_list_text}`;
    document.getElementById(
      "start_minecraft_text"
    ).innerHTML = `${langs.start_minecraft_text}`;
    document.getElementById(
      "textInfo"
    ).innerHTML = `${langs.select_the_version_that_you_want}`;
    document.getElementById(
      "select_a_version"
    ).innerHTML = `${langs.select_a_version}`;
    document.getElementById("show-playlists-text").innerHTML = `${langs.playlists}`;
    document.getElementById("no_song").innerHTML = `${langs.no_song}`;
    document.getElementById("return-btn").innerHTML = `${langs.return}`;
    //document.getElementById("playing-now").innerHTML = `${langs.playing_now}`;
    document.getElementById(
      "nombre-de-cancion"
    ).placeholder = `${langs.song_name}`;
    document.getElementById(
      "reproducir-btn-text"
    ).innerHTML = `${langs.search_song}`;
    document.getElementById(
      "save-playlist-text"
    ).innerHTML = `${langs.save_playlist}`;
    document.getElementById("cancel-btn-login").innerHTML = `${langs.cancel}`;
    //document.getElementById("cancel_login_two").innerHTML = `${langs.cancel}`;
    document.getElementById(
      "lost_your_account"
    ).innerHTML = `${langs.lost_your_account}`;
    document.getElementById(
      "recover_it_here"
    ).innerHTML = `${langs.recover_it_here}`;
    document.getElementById("username_text").placeholder = `${langs.username}`;
    document.getElementById("password_text").placeholder = `${langs.password}`;
    document.getElementById(
      "register_open_btn"
    ).innerHTML = `${langs.register_open_btn}`;
    document.getElementById("login-text").innerHTML = `${langs.login}`;
    document.getElementById(
      "you-dont-have-account"
    ).innerHTML = `${langs.you_dont_have_account}`;
    document.getElementById("login-btn").innerHTML = `${langs.login}`;
    document.getElementById("background-loading-screen-color-text").innerHTML = `${langs.background_loading_screen_color_text}`;
    document.getElementById("you_are_premium_background").innerHTML = `${langs.you_are_premium_background}`;
    
    document.getElementById("button_ver_mods").innerHTML = `${langs.mods_list_button}`;
    document.getElementById("login-with-microsoft").innerHTML = `${langs.login_microsoft_adv_title}`;
    document.getElementById("select_a_type_background").innerHTML = `${langs.select_a_type_background}`;
    document.getElementById("static-background-text").innerHTML = `${langs.static_background_text}`;
    document.getElementById("animated-background-text").innerHTML = `${langs.animated_background_text}`;
    document.getElementById("minimize_music").innerHTML = `${langs.minimize_music}`;
    document.getElementById("keep_music_opened").innerHTML = `${langs.keep_music_opened}`;
  }

  async initNews() {
    let news = document.getElementById("battly-news-div");
    if (this.news) {
      if (!this.news.length) {
        let blockNews = document.createElement("div");
        blockNews.classList.add("news-block", "opacity-1");
        blockNews.innerHTML = `
                    <div class="news-header">
                        <div class="header-text">
                            <div class="title_">No hay noticias disponibles actualmente.</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>Puedes seguir todas las noticias relacionadas con el servidor aquí.</p>
                        </div>
                    </div>`;
        news.appendChild(blockNews);
      } else {
        for (let News of this.news) {
          let date = await this.getdate(News.publish_date);
          let blockNews = document.createElement("div");
          blockNews.classList.add("news-block");
          blockNews.innerHTML = `
                        <div class="news-header">
                            <div class="header-text">
                                <div class="title_">${News.title}</div>
                            </div>
                            <div class="date">
                                <div class="day">${date.day}</div>
                                <div class="month">${date.month}</div>
                            </div>
                        </div>
                        <div class="news-content">
                            <div class="bbWrapper">
                                <p>${News.content.replace(/\n/g, "</br>")}</p>
                                <p class="news-author"><span><i class="fa-solid fa-hammer"></i> ${
                                  News.author
                                }</span></p>
                            </div>
                        </div>`;
          news.appendChild(blockNews);
        }
      }
    } else {
      let blockNews = document.createElement("div");
      blockNews.classList.add("news-block", "opacity-1");
      blockNews.innerHTML = `
                <div class="news-header">
                    <div class="header-text">
                        <div class="title">Error</div>
                    </div>
                </div>
                <div class="news-content">
                    <div class="bbWrapper">
                        <p>No se puede conectar al servidor de noticias.</br>Por favor, comprueba tu conexión a internet</p>
                    </div>
                </div>`;
      // news.appendChild(blockNews);
    }

    if (this.BattlyConfig.adv === true) {
      const advStatus = this.BattlyConfig.advStatus;
      const advText = this.BattlyConfig.advText;

      document.getElementById("warning-status").classList.add(advStatus);
      document.getElementById("warning-status").style.display = "block";

      document.getElementById("warning-status-message").innerHTML = advText;
    } else {
      document.getElementById("warning-status").style.display = "none";
    }
  }

  async initLaunch() {
    //crear el archivo launcher_profiles.json en la ruta de main del launcher
    let launcherProfiles;
    let accounts = await this.database.getAll("accounts");
    let accountsSelected = await this.database.get("1234", "accounts-selected");

    let profiles = {};
    let profiles_ = [];
    for (let account of accounts) {
      profiles_.push(account);
    }

    for (let i = 0; i < profiles_.length; i++) {
      let profileName = profiles_[i].value.name;
      profiles[profiles_[i].value.uuid] = {
        created: Date.now(),
        icon: "Grass",
        lastUsed: "1970-01-02T00:00:00.000Z",
        lastVersionId: "latest-release",
        name: "",
        type: "latest-release",
      };
    }

    launcherProfiles = {
      profiles: profiles,
      settings: {
        crashAssistance: true,
        enableAdvanced: false,
        enableAnalytics: true,
        enableHistorical: false,
        enableReleases: true,
        enableSnapshots: false,
        keepLauncherOpen: false,
        profileSorting: "ByLastPlayed",
        showGameLog: false,
        showMenu: false,
        soundOn: false,
      },
      version: 3,
    };

    let launcherProfilesJson = JSON.stringify(launcherProfiles);
    fs.mkdirSync(
      `${dataDirectory}/${
        process.platform == "darwin"
          ? this.config.dataDirectory
          : `.${this.config.dataDirectory}`
      }`,
      {
        recursive: true,
      }
    );
    fs.writeFileSync(
      path.join(
        `${dataDirectory}/${
          process.platform == "darwin"
            ? this.config.dataDirectory
            : `.${this.config.dataDirectory}`
        }`,
        "launcher_profiles.json"
      ),
      launcherProfilesJson
    );

    let data = this.BattlyConfig;
    let new_version = data.new_version;
    let new_version_message = data.new_version_message;
    let new_version_news = data.new_version_news;
    let new_version_html = data.new_version_html;

    if (new_version == true) {
      const Swal_ = require("./assets/js/libs/sweetalert/sweetalert2.all.min");

      Swal_.fire({
        title: new_version_message,
        html: new_version_html,
        confirmButtonText: langs.accept,
      });
    }

    let mcModPack;

    document.getElementById("play-btn").addEventListener("click", async () => {
      let modalStartVersions = document.getElementById("modalStartVersion");
      modalStartVersions.classList.add("is-active");
      let modalCard = modalStartVersions.querySelector(".modal-card");
      modalCard.style.animationDuration = "0.5s";
      modalCard.classList.remove("animate__fadeOutUp");
      modalCard.classList.add("animate__animated");
      modalCard.classList.add("animate__fadeInDown");
    });

    document
      .getElementById("closeStartVersion")
      .addEventListener("click", async () => {
        let modalStartVersions = document.getElementById("modalStartVersion");
        let modalCard = modalStartVersions.querySelector(".modal-card");
        modalCard.classList.remove("animate__fadeInDown");
        modalCard.classList.add("animate__fadeOutUp");

        setTimeout(() => {
          modalStartVersions.classList.remove("is-active");
        }, 300);
      });

    document
      .getElementById("cancelStartVersion")
      .addEventListener("click", async () => {
        let modalStartVersions = document.getElementById("modalStartVersion");
        modalStartVersions.classList.remove("is-active");
      });

    let data_versions = this.Versions;
    let data_versions_mojang = this.VersionsMojang;

    document
      .getElementById("listaDeVersiones")
      .addEventListener("change", async () => {
        let version_selected =
          document.getElementById("listaDeVersiones").value;
        let versiones = data_versions.versions;

        //comprobar si la versión es compatible con forge, fabric o quilt, obteniendo las versiones, ejemplo:
        /* {"versions":[{"version":"1.20.1","name":"1.20.1"},{"version":"1.20.1-forge","name":"1.20.1 - Forge"},{"version":"1.20.1-fabric","name":"1.20.1 - Fabric"},{"version":"1.20.1-quilt","name":"1.20.1 - Quilt"} ]} */
        let radioVanilla = document.getElementById("radioVanilla");
        let radioForge = document.getElementById("radioForge");
        let radioFabric = document.getElementById("radioFabric");
        let radioQuilt = document.getElementById("radioQuilt");

        let versions_vanilla = [];
        let versiones_compatible_forge = [];
        let versiones_compatible_fabric = [];
        let versiones_compatible_quilt = [];

        for (let i = 0; i < versiones.length; i++) {
          let version = versiones[i].version;
          if (version.endsWith("-forge")) {
            versiones_compatible_forge.push(versiones[i].realVersion);
          } else if (version.endsWith("-fabric")) {
            versiones_compatible_fabric.push(versiones[i].realVersion);
          } else if (version.endsWith("-quilt")) {
            versiones_compatible_quilt.push(versiones[i].realVersion);
          }
        }

        for (let i = 0; i < data_versions_mojang.versions.length; i++) {
          let version = data_versions_mojang.versions[i].id;
          versions_vanilla.push(version);
        }

        if (
          versiones_compatible_forge.includes(version_selected) &&
          versiones_compatible_fabric.includes(version_selected) &&
          versiones_compatible_quilt.includes(version_selected)
        ) {
          document.getElementById("tipo-de-versiones").style.display = "";
          radioVanilla.style.display = "";
          radioForge.style.display = "";
          radioFabric.style.display = "";
          radioQuilt.style.display = "";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else if (
          versiones_compatible_forge.includes(version_selected) &&
          versiones_compatible_fabric.includes(version_selected)
        ) {
          document.getElementById("tipo-de-versiones").style.display = "";
          radioVanilla.style.display = "";
          radioForge.style.display = "";
          radioFabric.style.display = "";
          radioQuilt.style.display = "none";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else if (
          versiones_compatible_forge.includes(version_selected) &&
          versiones_compatible_quilt.includes(version_selected)
        ) {
          document.getElementById("tipo-de-versiones").style.display = "";
          radioVanilla.style.display = "";
          radioForge.style.display = "";
          radioFabric.style.display = "none";
          radioQuilt.style.display = "";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else if (
          versiones_compatible_fabric.includes(version_selected) &&
          versiones_compatible_quilt.includes(version_selected)
        ) {
          document.getElementById("tipo-de-versiones").style.display = "";
          radioVanilla.style.display = "";
          radioForge.style.display = "none";
          radioFabric.style.display = "";
          radioQuilt.style.display = "";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else if (versiones_compatible_forge.includes(version_selected)) {
          document.getElementById("tipo-de-versiones").style.display = "";
          radioVanilla.style.display = "";
          radioForge.style.display = "";
          radioFabric.style.display = "none";
          radioQuilt.style.display = "none";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else if (versiones_compatible_fabric.includes(version_selected)) {
          document.getElementById("tipo-de-versiones").style.display = "";
          radioVanilla.style.display = "";
          radioForge.style.display = "none";
          radioFabric.style.display = "";
          radioQuilt.style.display = "none";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else if (versiones_compatible_quilt.includes(version_selected)) {
          document.getElementById("tipo-de-versiones").style.display = "";
          radioVanilla.style.display = "";
          radioForge.style.display = "none";
          radioFabric.style.display = "none";
          radioQuilt.style.display = "";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else if (versions_vanilla.includes(version_selected)) {
          document.getElementById("tipo-de-versiones").style.display = "";
          radioVanilla.style.display = "";
          radioForge.style.display = "none";
          radioFabric.style.display = "none";
          radioQuilt.style.display = "none";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else if (version_selected === "dx") {
          document.getElementById("tipo-de-versiones").display = "none";
          radioVanilla.style.display = "none";
          radioForge.style.display = "none";
          radioFabric.style.display = "none";
          radioQuilt.style.display = "none";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "none";
        } else {
          document.getElementById("tipo-de-versiones").display = "none";
          radioVanilla.style.display = "none";
          radioForge.style.display = "none";
          radioFabric.style.display = "none";
          radioQuilt.style.display = "none";
          let footermodaliniciarversion = document.getElementById(
            "footermodaliniciarversion"
          );
          footermodaliniciarversion.style.display = "";
        }
      });

    //radio con name loader
    let radio = document.getElementsByName("loader");
    radio.forEach((element) => {
      element.addEventListener("click", async () => {
        let footermodaliniciarversion = document.getElementById(
          "footermodaliniciarversion"
        );
        footermodaliniciarversion.style.display = "";
      });
    });

    document
      .getElementById("startStartVersion")
      .addEventListener("click", async () => {
        let version = document.getElementById("listaDeVersiones").value;
        let versionType;
        let progressBar1 = document.getElementById("progressBar1_");
        let modalDiv1 = document.getElementById("modalStartVersion");

        let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
        let uuid = (await this.database.get("1234", "accounts-selected")).value;
        let account = this.database.getAccounts().find(account => account.uuid === uuid.selected);
        let ram = (await this.database.get("1234", "ram")).value;
        let Resolution = (await this.database.get("1234", "screen")).value;
        let launcherSettings = (await this.database.get("1234", "launcher"))
          .value;

        let isForgeCheckBox = false;
        let isFabricCheckBox = false;
        let isQuiltCheckBox = false;

        let settings_btn = document.getElementById("settings-btn");
        let select_versions = document.getElementById("select-version");
        let mods_btn = document.getElementById("boton_abrir_mods");
        let discord_btn = document.getElementById("BotonUnirseServidorDiscord");

        let footermodaliniciarversion = document.getElementById(
          "footermodaliniciarversion"
        );
        footermodaliniciarversion.style.display = "none";

        let textInfo = document.getElementById("textInfo");
        textInfo.innerHTML = `<i class="fa-solid fa-spinner fa-spin-pulse"></i>${langs.starting_version_can_take}`;

        let radio = document.getElementsByName("loader");

        radio.forEach((element) => {
          if (element.checked) {
            if (version.endsWith("-extra")) {
              versionType = "extra";
            } else {
              versionType = element.value;
            }
          }
        });

        if (versionType === "vanilla") {
          version = version;
        } else if (versionType === "fabric") {
          version += `-fabric`;
        } else if (versionType === "forge") {
          version += `-forge`;
        } else if (versionType === "quilt") {
          version += `-quilt`;
        } else {
        }

        let version_real;
        if (version.endsWith("-forge")) {
          version_real = version.replace("-forge", "");
        } else if (version.endsWith("-fabric")) {
          version_real = version.replace("-fabric", "");
        } else if (version.endsWith("-quilt")) {
          version_real = version.replace("-quilt", "");
        } else if (version.endsWith("-extra")) {
          version_real = version.replace("-extra", "");
        } else {
          version_real = version;
        }

        if (version.endsWith("-forge")) {
          version = version.replace("-forge", "");
          isForgeCheckBox = true;
          isFabricCheckBox = false;
          isQuiltCheckBox = false;
        } else if (version.endsWith("-fabric")) {
          version = version.replace("-fabric", "");
          isFabricCheckBox = true;
          isForgeCheckBox = false;
          isQuiltCheckBox = false;
        } else if (version.endsWith("-quilt")) {
          version = version.replace("-quilt", "");
          isQuiltCheckBox = true;
          isForgeCheckBox = false;
          isFabricCheckBox = false;
        }

        let type;
        if (isForgeCheckBox == true) {
          type = "forge";
          mcModPack = "forge";
        } else if (isFabricCheckBox == true) {
          type = "fabric";
          mcModPack = "fabric";
        } else if (isQuiltCheckBox == true) {
          type = "quilt";
          mcModPack = "quilt";
        }

        //hacer un json.parse del archivo de versiones y obtener el dato "assets"

        //comprobar si existe el archivo de versiones

        // Si la versión acaba con -extra hacer let assets = JSON.parse(fs.readFileSync(`${dataDirectory}/.battly/versions/${version_real}/${version_real}.json`)).assets;
        // si no, ignorar
        let assets;
        let versionData;
        if (version_real === "1.8") {
          assets = "1.8";
          versionData = {
            number: assets,
            custom: version_real,
            type: "release",
          };
        } else if (
          version.endsWith("-extra") &&
          !version.includes("OptiFine") &&
          !version_real.includes("LabyMod")
        ) {
          assets = JSON.parse(
            fs.readFileSync(
              `${dataDirectory}/${
                process.platform == "darwin"
                  ? this.config.dataDirectory
                  : `.${this.config.dataDirectory}`
              }/versions/${version_real}/${version_real}.json`
            )
          ).assets;
          versionData = {
            number: assets,
            custom: version_real,
            type: "release",
          };
        } else if (version.includes("OptiFine") && version.endsWith("-extra")) {
          assets = JSON.parse(
            fs.readFileSync(
              `${dataDirectory}/${
                process.platform == "darwin"
                  ? this.config.dataDirectory
                  : `.${this.config.dataDirectory}`
              }/versions/${version_real}/${version_real}.json`
            )
          ).inheritsFrom;
          versionData = {
            number: assets,
            custom: version_real,
            type: "release",
          };
        } else if (version.includes("LabyMod") && version.endsWith("-extra")) {
          assets = JSON.parse(
            fs.readFileSync(
              `${dataDirectory}/${
                process.platform == "darwin"
                  ? this.config.dataDirectory
                  : `.${this.config.dataDirectory}`
              }/versions/${version_real}/${version_real}.json`
            )
          )._minecraftVersion;
          versionData = {
            number: version_real,
            type: "release",
          };
        } else if (
          version_real.endsWith("-forge") ||
          version_real.endsWith("-fabric") ||
          version_real.endsWith("-quilt")
        ) {
          versionData = version;
        } else {
          versionData = version_real;
        }

        let playBtn = document.getElementById("download-btn");
        let info = document.getElementById("textInfoStatus");
        let logTextArea1 = document.getElementById("logTextArea1_");

        if (Resolution.screen.width == "<auto>") {
          screen = false;
        } else {
          screen = {
            width: Resolution.screen.width,
            height: Resolution.screen.height,
          };
        }

        let opts;

        console.log("AAAAAAAAAAAAAAAAAA")
        console.log(version)

        let javapath = localStorage.getItem("java-path");
        if (version.endsWith("-extra")) {
          if (!javapath || javapath == null || javapath == undefined) {
            if (account.type === "battly") {
              console.log("No hay java path")
              opts = {
                url:
                  this.config.game_url === "" ||
                    this.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : this.config.game_url,
                authorization: account,
                authenticator: account,
                detached: false,
                timeout: 10000,
                root: `${dataDirectory}/.battly`,
                path: `${dataDirectory}/.battly`,
                overrides: {
                  detached: false,
                  screen: screen,
                },
                downloadFileMultiple: 20,
                //javaPath: "C:\\Users\\ilyas\\Desktop\\RND Projects\\Java\\bin\\java.exe",
                version: versionData,
                loader: {
                  type: type,
                  build: this.BattlyConfig.loader.build,
                  enable: isForgeCheckBox
                    ? true
                    : isFabricCheckBox
                      ? true
                      : isQuiltCheckBox
                        ? true
                        : false,
                },
                verify: false,
                ignored: ["loader"],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
                customArgs: [
                  "-javaagent:authlib-injector.jar=http://localhost",
                  "-Dauthlibinjector.mojangAntiFeatures=enabled",
                    "-Dauthlibinjector.noShowServerName",
                    "-Dauthlibinjector.disableHttpd"
                ],
              };
            } else {
              opts = {
                url:
                  this.config.game_url === "" ||
                    this.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : this.config.game_url,
                authorization: account,
                authenticator: account,
                detached: false,
                timeout: 10000,
                root: `${dataDirectory}/.battly`,
                path: `${dataDirectory}/.battly`,
                overrides: {
                  detached: false,
                  screen: screen,
                },
                downloadFileMultiple: 20,
                //javaPath: "C:\\Users\\ilyas\\Desktop\\RND Projects\\Java\\bin\\java.exe",
                version: versionData,
                loader: {
                  type: type,
                  build: this.BattlyConfig.loader.build,
                  enable: isForgeCheckBox
                    ? true
                    : isFabricCheckBox
                      ? true
                      : isQuiltCheckBox
                        ? true
                        : false,
                },
                verify: false,
                ignored: ["loader"],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
              };
            }
          } else {
            if (account.type === "battly") {
              console.log("HAY JAVA PATH")
              opts = {
                url:
                  this.config.game_url === "" ||
                    this.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : this.config.game_url,
                authorization: account,
                authenticator: account,
                detached: false,
                timeout: 10000,
                root: `${dataDirectory}/.battly`,
                path: `${dataDirectory}/.battly`,
                overrides: {
                  detached: false,
                  screen: screen,
                },
                downloadFileMultiple: 20,
                javapath: javapath,
                version: versionData,
                loader: {
                  type: type,
                  build: this.BattlyConfig.loader.build,
                  enable: isForgeCheckBox
                    ? true
                    : isFabricCheckBox
                      ? true
                      : isQuiltCheckBox
                        ? true
                        : false,
                },
                verify: false,
                ignored: ["loader"],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
                customArgs: [
                  "-javaagent:authlib-injector.jar=http://localhost",
                  "-Dauthlibinjector.mojangAntiFeatures=enabled",
                    "-Dauthlibinjector.noShowServerName",
                    "-Dauthlibinjector.disableHttpd"
                ],
              };
            } else {
              opts = {
                url:
                  this.config.game_url === "" ||
                    this.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : this.config.game_url,
                authorization: account,
                authenticator: account,
                detached: false,
                timeout: 10000,
                root: `${dataDirectory}/.battly`,
                path: `${dataDirectory}/.battly`,
                overrides: {
                  detached: false,
                  screen: screen,
                },
                downloadFileMultiple: 20,
                javapath: javapath,
                version: versionData,
                loader: {
                  type: type,
                  build: this.BattlyConfig.loader.build,
                  enable: isForgeCheckBox
                    ? true
                    : isFabricCheckBox
                      ? true
                      : isQuiltCheckBox
                        ? true
                        : false,
                },
                verify: false,
                ignored: ["loader"],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
              };
            }
          }
        } else {
          console.log("NO ES EXTRA")
          if (account.type === "battly") {
            console.log("battly");
            opts = {
              url:
                this.config.game_url === "" ||
                  this.config.game_url === undefined
                  ? `${urlpkg}/files`
                  : this.config.game_url,
              authorization: account,
              authenticator: account,
              detached: false,
              timeout: 10000,
              root: `${dataDirectory}/.battly`,
              path: `${dataDirectory}/.battly`,
              overrides: {
                detached: false,
                screen: screen,
              },
              downloadFileMultiple: 20,
              version: versionData,
              loader: {
                type: type,
                build: this.BattlyConfig.loader.build,
                enable: isForgeCheckBox
                  ? true
                  : isFabricCheckBox
                    ? true
                    : isQuiltCheckBox
                      ? true
                      : false,
              },
              verify: false,
              ignored: ["loader"],
              java: false,
              memory: {
                min: `${ram.ramMin * 1024}M`,
                max: `${ram.ramMax * 1024}M`,
              },
              JVM_ARGS: [
                "-javaagent:authlib-injector.jar=http://localhost",
                "-Dauthlibinjector.mojangAntiFeatures=enabled",
                    "-Dauthlibinjector.noShowServerName",
                    "-Dauthlibinjector.disableHttpd"
              ],
            };
          } else {
            opts = {
              url:
                this.config.game_url === "" ||
                  this.config.game_url === undefined
                  ? `${urlpkg}/files`
                  : this.config.game_url,
              authorization: account,
              authenticator: account,
              detached: false,
              timeout: 10000,
              root: `${dataDirectory}/.battly`,
              path: `${dataDirectory}/.battly`,
              overrides: {
                detached: false,
                screen: screen,
              },
              downloadFileMultiple: 20,
              javaPath: javapath,
              version: versionData,
              loader: {
                type: type,
                build: this.BattlyConfig.loader.build,
                enable: isForgeCheckBox
                  ? true
                  : isFabricCheckBox
                    ? true
                    : isQuiltCheckBox
                      ? true
                      : false,
              },
              verify: false,
              ignored: ["loader"],
              java: false,
              memory: {
                min: `${ram.ramMin * 1024}M`,
                max: `${ram.ramMax * 1024}M`,
              },
            };
          }
        }

        const launch = new Client();
        const launch_core = new Launch();

        try {
          if (version === "1.8") {
            await launch.launch(opts);
            document.getElementById("carga-de-versiones").style.display = "";
          } else if (
            version_real.endsWith("-forge") ||
            version_real.endsWith("-fabric") ||
            version_real.endsWith("-quilt")
          ) {
            await launch_core.Launch(opts);
            document.getElementById("carga-de-versiones").style.display = "";
          } else if (version.endsWith("-extra")) {
            launch.launch(opts);
            document.getElementById("carga-de-versiones").style.display = "";
          } else {
            await launch_core.Launch(opts);
            document.getElementById("carga-de-versiones").style.display = "";
          }
        } catch (error) {
          setTimeout(() => {
            playBtn.style.display = "";
            info.style.display = "none";
            progressBar1.style.display = "none";
          }, 3000);
          console.log(error);
        }

        launch.on("extract", (extract) => {
          consoleOutput_ += `[EXTRACT] ${extract}\n`;
          let seMostroInstalando = false;
          if (seMostroInstalando) {
          } else {
            seMostroInstalando = true;
          }
        });

        launch.on("debug", (e) => {
          consoleOutput_ += `[DEBUG] ${JSON.stringify(e, null, 2)}\n`;
          if (e.includes("Failed to start due to TypeError"))
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);

          if (e.includes("Downloaded and extracted natives")) {
            progressBar1.style.display = "";
            progressBar1.max = 100;
            progressBar1.value = 0;

            info.innerHTML = langs.downloading_files;
          }

          if (e.includes("Attempting to download Minecraft version jar")) {
            info.innerHTML = langs.downloading_version;
          }

          if (e.includes("Attempting to download assets")) {
            info.innerHTML = langs.downloading_assets;
          }

          if (e.includes("Downloaded Minecraft version jar")) {
            info.innerHTML = langs.downloading_libraries;
          }

          if (e.includes("Downloaded and extracted natives")) {
            info.innerHTML = langs.downloading_natives;
          }

          if (e.includes("Failed to start the minecraft server"))
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);
          if (e.includes('Exception in thread "main" '))
            return ShowPanelError(`${langs.error_detected_two} \nError:\n${e}`);

          if (
            e.includes(
              "There is insufficient memory for the Java Runtime Environment to continue."
            )
          )
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );
          if (e.includes("Could not reserve enough space for object heap"))
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );

          if (e.includes("Forge patcher exited with code 1")) {
            ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
            progressBar1.style.display = "none";
            info.style.display = "none";
            playBtn.style.display = "";
          }

          if (e.includes("Unable to launch"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (
            e.includes("Minecraft Crash Report") &&
            !e.includes("THIS IS NOT A ERROR")
          )
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);

          if (e.includes("java.lang.ClassCastException"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (e.includes("Minecraft has crashed!"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );
        });
        launch.on("data", (e) => {
          consoleOutput_ += `[DEBUG] ${JSON.stringify(e, null, 2)}\n`;
          if (e.includes("Failed to start du<e to TypeError")) {
            new Alert().ShowAlert({
              icon: "error",
              title: "Error al iniciar Minecraft",
            });
            progressBar1.style.display = "none";
            progressBar1.max = 100;
            progressBar1.value = 0;
            playBtn.style.display = "";
            info.style.display = "none";
            crasheo = true;
          }
        });

        launch.on("progress", function (e) {
          let total = e.total;
          let current = e.task;

          let progress = ((current / total) * 100).toFixed(0);
          let total_ = 100;

          ipcRenderer.send("main-window-progress_", {
            total_,
            progress,
          });

          progressBar1.style.display = "";
          progressBar1.max = total;
          progressBar1.value = current;
        });

        let crasheo = false;

        launch.on("estimated", (time) => {
          ipcRenderer.send("main-window-progress-reset");
          /*
                                  let hours = Math.floor(time / 3600);
                                  let minutes = Math.floor((time - hours * 3600) / 60);
                                  let seconds = Math.floor(time - hours * 3600 - minutes * 60);
                                  console.log(`${hours}h ${minutes}m ${seconds}s`);*/
        });

        let timeoutId;

        launch.on("speed", (speed) => {
          /*
                                                  let velocidad = speed / 1067008;

                                                  if (velocidad > 0) {
                                                      clearTimeout(timeoutId); // cancela el mensaje de alerta si la velocidad no es cero
                                                  } else {
                                                      timeoutId = setTimeout(() => {
                                                          progressBar1.style.display = "none"
                                                          progressBar1.max = 100;
                                                          progressBar1.value = 0;
                                                          playBtn.style.display = ""
                                                          info.style.display = "none"
                                                          clearTimeout(timeoutId);
                                                          const swal  = require('sweetalert');
                                                          crasheo = true;

                                                          new Alert().ShowAlert({
                                                              title: "Error",
                                                              text: "Error al descargar esta versión. Reinicia el launcher o inténtalo de nuevo más tarde. [ERROR: 2]",
                                                              icon: "error",
                                                              button: "Aceptar",
                                                          }).then((value) => {
                                                              if(value) {
                                                                  ipcRenderer.send('restartLauncher')
                                                              }
                                                          });
                                                          
                                                      }, 10000);
                                                  }*/
        });

        launch.on("patch", (patch) => {
          consoleOutput_ += `[INSTALANDO LOADER] ${patch}\n`;
          let seMostroInstalando = false;
          if (seMostroInstalando) {
          } else {
            logTextArea1.innerHTML = `${langs.installing_loader}...`;
            seMostroInstalando = true;
          }

          info.innerHTML = `${langs.installing_loader}...`;
        });

        let inicio = false;
        let iniciando = false;
        launch.on("data", async (e) => {
          new logger("Minecraft", "#36b030");
          consoleOutput_ += `[MC] ${e}\n`;
          if (launcherSettings.launcher.close === "close-launcher")
            ipcRenderer.send("main-window-hide");

          if (e.includes("Launching with arguments"))
            info.innerHTML = `${langs.starting_minecraft}...`;

          if (e.includes("Failed to start the minecraft server"))
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);
          if (e.includes('Exception in thread "main" '))
            return ShowPanelError(`${langs.error_detected_two} \nError:\n${e}`);

          if (
            e.includes(
              "There is insufficient memory for the Java Runtime Environment to continue."
            )
          )
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );
          if (e.includes("Could not reserve enough space for object heap"))
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );

          if (e.includes("Forge patcher exited with code 1")) {
            ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
            progressBar1.style.display = "none";
            info.style.display = "none";
            playBtn.style.display = "";
          }

          if (e.includes("Unable to launch"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (
            e.includes("Minecraft Crash Report") &&
            !e.includes("THIS IS NOT A ERROR")
          )
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);

          if (e.includes("java.lang.ClassCastException"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (e.includes("Minecraft has crashed!"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (
            e.includes(`Setting user: ${account.name}`) ||
            e.includes("Launching wrapped minecraft")
          ) {
            if (inicio == false) {
              let typeOfVersion;
              if (version_real.endsWith("-forge")) {
                typeOfVersion = "Forge";
              } else if (version_real.endsWith("-fabric")) {
                typeOfVersion = "Fabric";
              } else if (version_real.endsWith("-quilt")) {
                typeOfVersion = "Quilt";
              } else {
                typeOfVersion = "";
              }

              if (version_real.includes("OptiFine")) {
                let version_optifine = version_real.substring(0, 6);
                version_optifine = version_optifine.replace("-", "");

                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} OptiFine ${version_optifine}`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} OptiFine ${version_optifine}`
                );
              } else if (version_real.includes("LabyMod")) {
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} LabyMod`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} LabyMod`
                );
              } else if (version_real.includes("cmpack")) {
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} CMPack`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} CMPack`
                );
              } else {
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} ${version_real
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} ${version_real
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );
              }

              modalDiv1.classList.remove("is-active");
              inicio = true;
              info.innerHTML = `${langs.minecraft_started_correctly}.`;
              logTextArea1.innerHTML = ``;
              textInfo.innerHTML = `Selecciona la versión que quieres abrir`;
              ipcRenderer.send("new-notification", {
                title: langs.minecraft_started_correctly,
                body: langs.minecraft_started_correctly_body,
              });

              ipcRenderer.send("main-window-progress-reset");
            }
          }

          if (e.includes("Connecting to")) {
            let msj = e.split("Connecting to ")[1].split("...")[0];
            info.innerHTML = `Conectando a ${msj}`;
          }
        });

        launch.on("close", (code) => {
          consoleOutput_ += `---------- [MC] Código de salida: ${code}\n ----------`;
          if (launcherSettings.launcher.close === "close-launcher")
            ipcRenderer.send("main-window-show");

          ipcRenderer.send("updateStatus", {
            status: "online",
            details: langs.in_the_menu,
            username: account.name,
          });
          info.style.display = "none";
          playBtn.style.display = "";
          info.innerHTML = `Verificando archivos...`;
          footermodaliniciarversion.style.display = "";
          textInfo.innerHTML = "Selecciona la versión que quieres abrir";
          new logger("Launcher", "#3e8ed0");
          console.log("🔧 Minecraft cerrado");
          document.getElementById("carga-de-versiones").style.display = "none";

          progressBar1.style.display = "none";

          //convertir todos los strings a null
          version = null;
          versionType = null;
          versionData = null;
          version_real = null;
          assets = null;
          type = null;
          isForgeCheckBox = false;
          isFabricCheckBox = false;
          isQuiltCheckBox = false;
          document.getElementById("radioVanilla").removeAttribute("checked");
          document.getElementById("radioForge").removeAttribute("checked");
          document.getElementById("radioFabric").removeAttribute("checked");
          document.getElementById("radioQuilt").removeAttribute("checked");

          ipcRenderer.send("delete-and-new-status-discord");
        });

        launch.on("error", (err) => {
          consoleOutput_ += `[ERROR] ${JSON.stringify(err, null, 2)}\n`;

          progressBar1.style.display = "none";
          info.style.display = "none";
          playBtn.style.display = "";

          return new Alert().ShowAlert({
            title: "Error",
            text:
              "Error al iniciar Minecraft. Error desconocido. Vuelve a iniciar Minecraft. [ERROR: 7] \nError: " +
              err.error,
            icon: "error",
            button: "Aceptar",
          });
        });

        let seMostroExtrayendo_core = false;
        let seMostroInstalando_core = false;

        launch_core.on("extract", (extract) => {
          consoleOutput_ += `[EXTRACT] ${extract}\n`;
          if (seMostroExtrayendo_core) {
          } else {
            logTextArea1.innerHTML = `${langs.extracting_loader}.`;
            seMostroExtrayendo_core = true;
          }
        });

        launch_core.on("debug", (e) => {
          consoleOutput_ += `[MC] ${JSON.stringify(e, null, 2)}\n`;
          if (e.includes("Failed to start due to TypeError")) {
            new Alert().ShowAlert({
              icon: "error",
              title: "Error al iniciar Minecraft",
            });
            progressBar1.style.display = "none";
            progressBar1.max = 100;
            progressBar1.value = 0;
            playBtn.style.display = "";
            info.style.display = "none";
            crasheo = true;
          }

          if (e.includes("Downloaded and extracted natives")) {
            progressBar1.style.display = "";
            progressBar1.max = 100;
            progressBar1.value = 0;

            info.innerHTML = langs.downloading_files;
          }

          if (e.includes("Attempting to download Minecraft version jar")) {
            info.innerHTML = langs.downloading_version;
          }

          if (e.includes("Attempting to download assets")) {
            info.innerHTML = langs.downloading_assets;
          }

          if (e.includes("Downloaded Minecraft version jar")) {
            info.innerHTML = langs.downloading_libraries;
          }

          if (e.includes("Downloaded and extracted natives")) {
            info.innerHTML = langs.downloading_natives;
          }

          if (e.includes("Failed to start the minecraft server"))
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);
          if (e.includes('Exception in thread "main" '))
            return ShowPanelError(`${langs.error_detected_two} \nError:\n${e}`);

          if (
            e.includes(
              "There is insufficient memory for the Java Runtime Environment to continue."
            )
          )
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );
          if (e.includes("Could not reserve enough space for object heap"))
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );

          if (e.includes("Forge patcher exited with code 1")) {
            ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
            progressBar1.style.display = "none";
            info.style.display = "none";
            playBtn.style.display = "";
          }

          if (e.includes("Unable to launch"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (
            e.includes("Minecraft Crash Report") &&
            !e.includes("THIS IS NOT A ERROR")
          )
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);

          if (e.includes("java.lang.ClassCastException"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (e.includes("Minecraft has crashed!"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );
        });
        launch_core.on("data", async (e) => {
          new logger("Minecraft", "#36b030");
          consoleOutput_ += `[MC] ${e}\n`;
          if (launcherSettings.launcher.close === "close-launcher")
            ipcRenderer.send("main-window-hide");
          progressBar1.style.display = "none";

          if (e.includes("Launching with arguments"))
            info.innerHTML = `${langs.starting_minecraft}...`;

          if (iniciando == false) {
            iniciando = true;

            /* editar archivo servers.dat */
            let serversDat = `${dataDirectory}/.battly/servers.dat`;

            if (fs.existsSync(serversDat)) {
              try {
                const serversDatFile = fs.readFileSync(serversDat);
                const serversDatData = await NBT.read(serversDatFile);

                let servers = this.BattlyConfig.promoted_servers;

                let serversArray = [];

                for (let i = 0; i < servers.length; i++) {
                  const newServer = {
                    name: servers[i].name,
                    ip: servers[i].ip,
                    icon: servers[i].icon,
                  };

                  // Verificar si la IP ya existe en el archivo servers.dat
                  const ipExists = serversDatData.data.servers.some(
                    (server) => server.ip === newServer.ip
                  );

                  if (!ipExists) {
                    serversArray.push(newServer);
                  }
                }

                // Añadir los nuevos servidores al array existente en serversDatData.data.servers
                serversDatData.data.servers = serversArray.concat(
                  serversDatData.data.servers
                );
                const editedServersDat = await NBT.write(serversDatData);
                fs.writeFileSync(serversDat, editedServersDat);
              } catch (error) {
                console.error("Error al procesar el archivo NBT:", error);
              }
            } else {
              try {
                let servers = this.BattlyConfig.promoted_servers;

                let serversArray = [];

                for (let i = 0; i < servers.length; i++) {
                  const newServer = {
                    name: servers[i].name,
                    ip: servers[i].ip,
                    icon: servers[i].icon,
                  };
                  serversArray.push(newServer);
                }

                // Crear un nuevo archivo servers.dat con los servidores nuevos
                const newData = { servers: serversArray };
                const editedServersDat = await NBT.write(newData);
                fs.writeFileSync(serversDat, editedServersDat);
              } catch (error) {
                console.error("Error al crear el nuevo archivo NBT:", error);
              }
            }
          }

          if (e.includes("Failed to start the minecraft server"))
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);
          if (e.includes('Exception in thread "main" '))
            return ShowPanelError(`${langs.error_detected_two} \nError:\n${e}`);

          if (
            e.includes(
              "There is insufficient memory for the Java Runtime Environment to continue."
            )
          )
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );
          if (e.includes("Could not reserve enough space for object heap"))
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );

          if (e.includes("Forge patcher exited with code 1")) {
            ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
            progressBar1.style.display = "none";
            info.style.display = "none";
            playBtn.style.display = "";
          }

          if (e.includes("Unable to launch"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (
            e.includes("Minecraft Crash Report") &&
            !e.includes("THIS IS NOT A ERROR")
          )
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);

          if (e.includes("java.lang.ClassCastException"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (e.includes("Minecraft has crashed!"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (
            e.includes(`Setting user: ${account.name}`) ||
            e.includes("Launching wrapped minecraft")
          ) {
            if (inicio == false) {
              let typeOfVersion;
              if (version_real.endsWith("-forge")) {
                typeOfVersion = "Forge";
              } else if (version_real.endsWith("-fabric")) {
                typeOfVersion = "Fabric";
              } else if (version_real.endsWith("-quilt")) {
                typeOfVersion = "Quilt";
              } else {
                typeOfVersion = "";
              }

              if (version_real.includes("OptiFine")) {
                let version_optifine = version_real.substring(0, 6);
                version_optifine = version_optifine.replace("-", "");

                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} OptiFine ${version_optifine}`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} OptiFine ${version_optifine}`
                );
              } else if (version_real.includes("LabyMod")) {
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} LabyMod`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} LabyMod`
                );
              } else if (version_real.includes("cmpack")) {
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} CMPack`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} CMPack`
                );
              } else {
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} ${version_real
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} ${version_real
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );
              }

              modalDiv1.classList.remove("is-active");
              inicio = true;
              info.innerHTML = `${langs.minecraft_started_correctly}.`;
              logTextArea1.innerHTML = ``;
              textInfo.innerHTML = `Selecciona la versión que quieres abrir`;
              ipcRenderer.send("new-notification", {
                title: langs.minecraft_started_correctly,
                body: langs.minecraft_started_correctly_body,
              });

              ipcRenderer.send("main-window-progress-reset");
            }
          }

          if (e.includes("Connecting to")) {
            let msj = e.split("Connecting to ")[1].split("...")[0];
            info.innerHTML = `Conectando a ${msj}`;
          }
        });

        launch_core.on("progress", (progress, size) => {
          consoleOutput_ += `[DESCARGANDO] ${progress} / ${size}\n`;
          if (seMostroInstalando_core) {
          } else {
            seMostroInstalando_core = true;
          }
          let progreso = ((progress / size) * 100).toFixed(0);
          //si el progreso es más de 100, ponerlo a 100
          if (progreso > 100) {
            progreso = 100;
          }
          progressBar1.style.display = "block";
          info.innerHTML = `Descargando... ${progreso}%`;
          ipcRenderer.send("main-window-progress", {
            progress,
            size,
          });
          progressBar1.value = progress;
          progressBar1.max = size;
        });
        launch_core.on("check", (progress, size) => {
          consoleOutput_ += `[INSTALANDO MC] ${progress} / ${size}\n`;
          let seMostroInstalando = false;
          if (seMostroInstalando) {
          } else {
            logTextArea1.innerHTML = `${langs.extracting_loader}.`;
            seMostroInstalando = true;
          }
          progressBar1.style.display = "";
          let size_actual = 100;
          let progress_actual = ((progress / size) * 100).toFixed(0);
          ipcRenderer.send("main-window-progress", {
            progress_actual,
            size_actual,
          });
          info.innerHTML = `Extrayendo ModPack... ${progress_actual}%`;
          progressBar1.value = progress;
          progressBar1.max = size;
        });

        launch_core.on("estimated", (time) => {
          ipcRenderer.send("main-window-progress-reset");
          /*
                                  let hours = Math.floor(time / 3600);
                                  let minutes = Math.floor((time - hours * 3600) / 60);
                                  let seconds = Math.floor(time - hours * 3600 - minutes * 60);
                                  console.log(`${hours}h ${minutes}m ${seconds}s`);*/
        });

        launch_core.on("speed", (speed) => {
          /*
                                                  let velocidad = speed / 1067008;
                      
                                                  if (velocidad > 0) {
                                                      clearTimeout(timeoutId); // cancela el mensaje de alerta si la velocidad no es cero
                                                  } else {
                                                      timeoutId = setTimeout(() => {
                                                          progressBar1.style.display = "none"
                                                          progressBar1.max = 100;
                                                          progressBar1.value = 0;
                                                          playBtn.style.display = ""
                                                          info.style.display = "none"
                                                          clearTimeout(timeoutId);
                                                          const swal  = require('sweetalert');
                                                          crasheo = true;
                      
                                                          new Alert().ShowAlert({
                                                              title: "Error",
                                                              text: "Error al descargar esta versión. Reinicia el launcher o inténtalo de nuevo más tarde. [ERROR: 2]",
                                                              icon: "error",
                                                              button: "Aceptar",
                                                          }).then((value) => {
                                                              if(value) {
                                                                  ipcRenderer.send('restartLauncher')
                                                              }
                                                          });
                                                          
                                                      }, 10000);
                                                  }*/
        });

        let seMostroInstalando = false;
        launch_core.on("patch", (patch) => {
          consoleOutput_ += `[INSTALANDO LOADER] ${patch}\n`;
          if (seMostroInstalando) {
          } else {
            logTextArea1.innerHTML = `${langs.extracting_loader}.`;
            seMostroInstalando = true;
          }
        });

        launch_core.on("data", async (e) => {
          new logger("Minecraft", "#36b030");
          consoleOutput_ += `[MC] ${e}\n`;
          if (launcherSettings.launcher.close === "close-launcher")
            ipcRenderer.send("main-window-hide");
          progressBar1.style.display = "none";

          if (e.includes("Launching with arguments"))
            info.innerHTML = `${langs.starting_minecraft}...`;

          if (iniciando == false) {
            iniciando = true;

            let serversDat = `${dataDirectory}/.battly/servers.dat`;

            if (fs.existsSync(serversDat)) {
              try {
                const serversDatFile = fs.readFileSync(serversDat);
                const serversDatData = await NBT.read(serversDatFile);

                let servers = this.BattlyConfig.promoted_servers;

                let serversArray = [];

                for (let i = 0; i < servers.length; i++) {
                  const newServer = {
                    name: servers[i].name,
                    ip: servers[i].ip,
                    icon: servers[i].icon,
                  };

                  // Verificar si la IP ya existe en el archivo servers.dat
                  const ipExists = serversDatData.data.servers.some(
                    (server) => server.ip === newServer.ip
                  );

                  if (!ipExists) {
                    serversArray.push(newServer);
                  }
                }

                // Añadir los nuevos servidores al array existente en serversDatData.data.servers
                serversDatData.data.servers = serversArray.concat(
                  serversDatData.data.servers
                );
                const editedServersDat = await NBT.write(serversDatData);
                fs.writeFileSync(serversDat, editedServersDat);
              } catch (error) {
                console.error("Error al procesar el archivo NBT:", error);
              }
            } else {
              try {
                let servers = this.BattlyConfig.promoted_servers;

                let serversArray = [];

                for (let i = 0; i < servers.length; i++) {
                  const newServer = {
                    name: servers[i].name,
                    ip: servers[i].ip,
                    icon: servers[i].icon,
                  };
                  serversArray.push(newServer);
                }

                // Crear un nuevo archivo servers.dat con los servidores nuevos
                const newData = { servers: serversArray };
                const editedServersDat = await NBT.write(newData);
                fs.writeFileSync(serversDat, editedServersDat);
              } catch (error) {
                console.error("Error al crear el nuevo archivo NBT:", error);
              }
            }
          }

          if (e.includes("Failed to start the minecraft server"))
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);
          if (e.includes('Exception in thread "main" '))
            return ShowPanelError(`${langs.error_detected_two} \nError:\n${e}`);

          if (
            e.includes(
              "There is insufficient memory for the Java Runtime Environment to continue."
            )
          )
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );
          if (e.includes("Could not reserve enough space for object heap"))
            return ShowPanelError(
              `${langs.error_detected_three} \nError:\n${e}`
            );

          if (e.includes("Forge patcher exited with code 1")) {
            ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
            progressBar1.style.display = "none";
            info.style.display = "none";
            playBtn.style.display = "";
          }

          if (e.includes("Unable to launch"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (
            e.includes("Minecraft Crash Report") &&
            !e.includes("THIS IS NOT A ERROR")
          )
            return ShowPanelError(`${langs.error_detected_one} \nError:\n${e}`);

          if (e.includes("java.lang.ClassCastException"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (e.includes("Minecraft has crashed!"))
            return ShowPanelError(
              `${langs.error_detected_five} \nError:\n${e}`
            );

          if (
            e.includes(`Setting user: ${account.name}`) ||
            e.includes("Launching wrapped minecraft")
          ) {
            if (inicio == false) {
              let typeOfVersion;
              if (version_real.endsWith("-forge")) {
                typeOfVersion = "Forge";
              } else if (version_real.endsWith("-fabric")) {
                typeOfVersion = "Fabric";
              } else if (version_real.endsWith("-quilt")) {
                typeOfVersion = "Quilt";
              } else {
                typeOfVersion = "";
              }
              ipcRenderer.send(
                "new-status-discord-jugando",
                `${langs.playing_in} ${version_real
                  .replace("-forge", "")
                  .replace("-fabric", "")
                  .replace("-quilt", "")} ${typeOfVersion}`
              );

              this.UpdateStatus(
                account.name,
                "ausente",
                `${langs.playing_in} ${version_real
                  .replace("-forge", "")
                  .replace("-fabric", "")
                  .replace("-quilt", "")} ${typeOfVersion}`
              );
              modalDiv1.classList.remove("is-active");
              inicio = true;
              info.innerHTML = `${langs.minecraft_started_correctly}.`;
              logTextArea1.innerHTML = ``;
              textInfo.innerHTML = `Selecciona la versión que quieres abrir`;
              ipcRenderer.send("new-notification", {
                title: langs.minecraft_started_correctly,
                body: langs.minecraft_started_correctly_body,
              });

              ipcRenderer.send("main-window-progress-reset");
            }
          }
        });

        launch_core.on("close", (code) => {
          consoleOutput_ += `---------- [MC] Código de salida: ${code}\n ----------`;
          modalDiv1.classList.remove("is-active");
          if (launcherSettings.launcher.close === "close-launcher")
            ipcRenderer.send("main-window-show");

          ipcRenderer.send("updateStatus", {
            status: "online",
            details: langs.in_the_menu,
            username: account.name,
          });
          progressBar1.style.display = "none";
          info.style.display = "none";
          playBtn.style.display = "";
          info.innerHTML = `Verificando archivos...`;
          footermodaliniciarversion.style.display = "";
          textInfo.innerHTML = "Selecciona la versión que quieres abrir";
          new logger("Launcher", "#3e8ed0");
          console.log("🔧 Minecraft cerrado");

          progressBar1.style.display = "none";

          version = null;
          versionType = null;
          versionData = null;
          version_real = null;
          assets = null;
          type = null;
          isForgeCheckBox = false;
          isFabricCheckBox = false;
          isQuiltCheckBox = false;
          document.getElementById("radioVanilla").removeAttribute("checked");
          document.getElementById("radioForge").removeAttribute("checked");
          document.getElementById("radioFabric").removeAttribute("checked");
          document.getElementById("radioQuilt").removeAttribute("checked");

          ipcRenderer.send("delete-and-new-status-discord");
        });

        launch_core.on("error", (err) => {
          consoleOutput_ += `[ERROR] ${JSON.stringify(err, null, 2)}\n`;
        });
      });

    document
      .getElementById("download-btn")
      .addEventListener("click", async () => {


        let versionMojangData = this.VersionsMojang;
        versionMojangData = versionMojangData.versions;

        let snapshots = [];
        let releases = [];
        let betas = [];
        let alphas = [];

        for (let i = 0; i < versionMojangData.length; i++) {
          if (versionMojangData[i].type == "release") {
            releases.push(versionMojangData[i]);
          } else if (versionMojangData[i].type == "snapshot") {
            snapshots.push(versionMojangData[i]);
          }
        }

        let versionBattlyData = this.Versions;
        versionBattlyData = versionBattlyData.versions;

        let forgeVersions = [];
        let fabricVersions = [];
        let quiltVersions = [];
        let optifineVersions = [];

        for (let i = 0; i < versionBattlyData.length; i++) {
          if (versionBattlyData[i].version.endsWith("-forge")) {
            forgeVersions.push(versionBattlyData[i]);
          } else if (versionBattlyData[i].version.endsWith("-fabric")) {
            fabricVersions.push(versionBattlyData[i]);
          } else if (versionBattlyData[i].version.endsWith("-quilt")) {
            quiltVersions.push(versionBattlyData[i]);
          } else if (versionBattlyData[i].version.endsWith("-optifine")) {
            optifineVersions.push(versionBattlyData[i]);
          }
        }

        //betas
        for (let i = 0; i < versionMojangData.length; i++) {
          if (versionMojangData[i].type == "old_beta") {
            betas.push(versionMojangData[i]);
          }
        }

        //alphas
        for (let i = 0; i < versionMojangData.length; i++) {
          if (versionMojangData[i].type == "old_alpha") {
            alphas.push(versionMojangData[i]);
          }
        }

        // Crear el div modal principal
        let modalDiv = document.createElement("div");
        modalDiv.classList.add("modal");
        modalDiv.classList.add("is-active");

        // Crear el fondo del modal
        let modalBackground = document.createElement("div");
        modalBackground.classList.add("modal-background");

        // Crear el div del contenido del modal
        let modalCard = document.createElement("div");
        modalCard.classList.add("modal-card");

        // Crear el encabezado del modal
        let modalHeader = document.createElement("header");
        modalHeader.classList.add("modal-card-head");
        modalHeader.style.backgroundColor = "#212121";

        let modalTitle = document.createElement("p");
        modalTitle.classList.add("modal-card-title");
        modalTitle.style.color = "white";
        modalTitle.innerText = langs.download_version;

        let modalCloseButton = document.createElement("button");
        modalCloseButton.classList.add("delete");
        modalCloseButton.setAttribute("aria-label", "close");

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(modalCloseButton);

        // Crear la sección del cuerpo del modal
        let modalSection = document.createElement("section");
        modalSection.classList.add("modal-card-body");
        modalSection.style.backgroundColor = "#212121";

        let cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        let cardContentDiv = document.createElement("div");
        cardContentDiv.classList.add("card-content");
        cardContentDiv.style.backgroundColor = "#212121";

        let mediaDiv = document.createElement("div");
        mediaDiv.classList.add("media");

        let mediaLeftDiv = document.createElement("div");
        mediaLeftDiv.classList.add("media-left");

        let imageFigure = document.createElement("figure");
        imageFigure.classList.add("image");
        imageFigure.classList.add("is-48x48");

        let image = document.createElement("img");
        image.src = "./assets/images/icons/minecraft.png";
        image.alt = "Placeholder image";
        image.id = "versionImg";

        imageFigure.appendChild(image);
        mediaLeftDiv.appendChild(imageFigure);
        mediaDiv.appendChild(mediaLeftDiv);

        let mediaContentDiv = document.createElement("div");
        mediaContentDiv.classList.add("media-content");

        let title = document.createElement("p");
        title.classList.add("title");
        title.classList.add("is-4");
        title.id = "titleVersions";
        title.style.color = "white";
        title.innerText = "Java";

        let subtitle = document.createElement("p");
        subtitle.classList.add("subtitle");
        subtitle.classList.add("is-6");
        subtitle.id = "subtitleVersions";
        subtitle.style.color = "white";
        subtitle.innerHTML = '<i class="fas fa-download"></i> 1.20.1';

        mediaContentDiv.appendChild(title);
        mediaContentDiv.appendChild(subtitle);
        mediaDiv.appendChild(mediaContentDiv);

        cardContentDiv.appendChild(mediaDiv);

        let contentDiv = document.createElement("div");
        contentDiv.classList.add("content");
        const hr = document.createElement("hr");
        const span = document.createElement("span");
        span.style.fontSize = "20px";
        span.style.color = "white";
        span.innerText = langs.type_of_version;
        contentDiv.appendChild(hr);
        contentDiv.appendChild(span);
        const br = document.createElement("br");
        contentDiv.appendChild(br);
        contentDiv.style.color = "white";
        contentDiv.innerHTML += `
<div class="radio-button-container">
  <input type="radio" class="radio-button__input" id="radio1-inicio" name="option" value="vanilla">
  <label class="radio-button__label" for="radio1-inicio">
    <span class="radio-button__custom"></span>
    Vanilla
  </label>
  <input type="radio" class="radio-button__input" id="radio2-inicio" name="option" value="fabric">
  <label class="radio-button__label" for="radio2-inicio">
    <span class="radio-button__custom"></span>
    Fabric
  </label>
  <input type="radio" class="radio-button__input" id="radio3-inicio" name="option" value="forge">
  <label class="radio-button__label" for="radio3-inicio">
    <span class="radio-button__custom"></span>
    Forge
  </label>
  <input type="radio" class="radio-button__input" id="radio4-inicio" name="option" value="quilt">
  <label class="radio-button__label" for="radio4-inicio">
    <span class="radio-button__custom"></span>
    Quilt
  </label>
  <input type="radio" class="radio-button__input" id="radio5-inicio" name="option" value="optifine">
  <label class="radio-button__label" for="radio5-inicio">
    <span class="radio-button__custom"></span>
    OptiFine
  </label>
  <input type="radio" class="radio-button__input" id="radio6-inicio" name="option" value="clientes">
  <label class="radio-button__label" for="radio6-inicio">
    <span class="radio-button__custom"></span>
    Clients
  </label>
</div>
<br>
<br>
<div id="tipoDeVersiones">
<div id="divNormal">
              <input type="radio" class="radio-button__input" id="radio7-inicio" name="opcion" value="normal">
  <label class="radio-button__label radio-button__input-with-margin" id="opcionNormal" for="radio7-inicio">
    <span class="radio-button__custom"></span>
    Normal
  </label>
              <br>
              <div class="select is-link" id="normal" style="width: auto;">
                <select id="selectNormal">
                </select>
              </div>

            </div>


              <div id="divSnapshot">
                <input type="radio" class="radio-button__input" id="radio8-inicio" name="opcion" value="snapshot">
  <label class="radio-button__label radio-button__input-with-margin" id="opcionSnapshot" for="radio8-inicio">
    <span class="radio-button__custom"></span>
    Snapshot
  </label>
                <br>
                <div class="select is-link" id="snapshot" style="width: auto;">
                  <select id="selectSnapshot">
                  </select>
                </div>
              </div>

              <div id="divBeta">

                <input type="radio" class="radio-button__input" id="radio9-inicio" name="opcion" value="beta">
  <label class="radio-button__label radio-button__input-with-margin" id="opcionBeta" for="radio9-inicio">
    <span class="radio-button__custom"></span>
    Beta
  </label>
                <br>
                <div class="select is-link" id="beta" style="width: auto;">
                    <select id="selectBeta">
                    </select>
                    </div>
                    </div>

                <div id="divAlpha">

                <input type="radio" class="radio-button__input" id="radio20-inicio" name="opcion" value="alpha">
  <label class="radio-button__label radio-button__input-with-margin" id="opcionAlpha" for="radio20-inicio">
    <span class="radio-button__custom"></span>
    Alpha
  </label>
                    <br>
                    <div class="select is-link" id="alpha" style="width: auto;">
                        <select id="selectAlpha">
                        </select>
                    </div>
                </div>

            </div>

              <div id="versionesFabric">
                <label>${langs.choose_fabric_version}
                </label>
                <br>
                <div class="select is-link" id="fabric" style="width: auto;">
                  <select id="selectFabric">
                  </select>
                </div>
              </div>

              <div id="versionesForge">
                <label>${langs.choose_forge_version}
                </label>
                <br>
                <div class="select is-link" id="forge" style="width: auto;">
                  <select id="selectForge">
                  </select>
                </div>
                <div class="select is-link" id="forgebuild" style="width: auto;">
                  <select id="selectForgeBuild">
                    <option value="recommended">${langs.recommended}</option>
                    <option value="latest">${langs.latest}</option>
                  </select>
                </div>
              </div>

              <div id="versionesQuilt">
                <label>${langs.choose_quilt_version}
                </label>
                <br>
                <div class="select is-link" id="quilt" style="width: auto;">
                  <select id="selectQuilt">
                  </select>
                </div>
              </div>

              <div id="versionesOptiFine">
                <label>${langs.choose_optifine_version}
                </label>
                <br>
                <div class="select is-link" id="optifine" style="width: auto;">
                  <select id="selectOptiFine">
                  </select>
                </div>
              </div>
              <div id="versionesClientes">
                <label>${langs.choose_a_client}
                </label>
                <br>
                <div class="select is-link" id="clientes" style="width: auto;">
                  <select id="selectClientes">
                  </select>
                </div>
              </div>
</div>

`;

        cardContentDiv.appendChild(contentDiv);
        cardDiv.appendChild(cardContentDiv);

        let cardFooterDiv = document.createElement("div");
        cardFooterDiv.classList.add("card-footer");

        let cardFooterItemDiv = document.createElement("div");
        cardFooterItemDiv.classList.add("card-footer-item");
        cardFooterItemDiv.style.backgroundColor = "#212121";

        let footerText = document.createElement("p");
        footerText.style.fontSize = "10px";
        footerText.style.color = "white";
        footerText.innerHTML = langs.mojang_copyright;

        cardFooterItemDiv.appendChild(footerText);
        cardFooterDiv.appendChild(cardFooterItemDiv);
        cardDiv.appendChild(cardFooterDiv);

        modalSection.appendChild(cardDiv);

        // Crear el pie del modal
        let modalFooter = document.createElement("footer");
        modalFooter.classList.add("modal-card-foot");
        modalFooter.style.backgroundColor = "#212121";

        let downloadButton = document.createElement("button");
        downloadButton.classList.add("button");
        downloadButton.classList.add("is-info");
        downloadButton.innerText = langs.download_version;

        let deleteButton = document.createElement("button");
        deleteButton.classList.add("button");
        deleteButton.classList.add("is-danger");
        deleteButton.innerText = langs.delete_version;

        modalFooter.appendChild(downloadButton);
        modalFooter.appendChild(deleteButton);

        // Agregar elementos al modal
        modalCard.appendChild(modalHeader);
        modalCard.appendChild(modalSection);
        modalCard.appendChild(modalFooter);

        modalDiv.appendChild(modalBackground);
        modalDiv.appendChild(modalCard);

        document.body.appendChild(modalDiv);
        // Agregar el modal al cuerpo del documento
        modalCloseButton.addEventListener("click", function () {
          //eliminar el modal
          modalDiv.remove();
        });

        const normal = document.getElementById("normal");
        const normalVersionType = document.getElementById("selectNormal");
        const snapshot = document.getElementById("snapshot");
        const beta = document.getElementById("beta");
        const snapshotVersionType = document.getElementById("selectSnapshot");
        const betaVersionType = document.getElementById("selectBeta");
        const alpha = document.getElementById("alpha");
        const alphaVersionType = document.getElementById("selectAlpha");
        const selectAlpha = document.getElementById("selectAlpha");
        const selectForgeBuild = document.getElementById("selectForgeBuild");

        let radioNormal = document.getElementById("opcionNormal");
        let radioSnapshot = document.getElementById("opcionSnapshot");

        let tipoDeVersiones = document.getElementById("tipoDeVersiones");

        normal.style.display = "none";
        snapshot.style.display = "none";
        beta.style.display = "none";
        alpha.style.display = "none";

        const radio = document.getElementsByName("opcion");

        radio.forEach((element) => {
          element.addEventListener("click", () => {
            if (element.value == "normal") {
              normal.style.display = "";
              snapshot.style.display = "none";
              beta.style.display = "none";
              alpha.style.display = "none";
            } else if (element.value == "snapshot") {
              normal.style.display = "none";
              snapshot.style.display = "";
              beta.style.display = "none";
              alpha.style.display = "none";
            } else if (element.value == "beta") {
              normal.style.display = "none";
              snapshot.style.display = "none";
              beta.style.display = "";
              alpha.style.display = "none";
            } else if (element.value == "alpha") {
              normal.style.display = "none";
              snapshot.style.display = "none";
              beta.style.display = "none";
              alpha.style.display = "";
            }
          });
        });

        //si vanilla está seleccionado, style.display = "" en todos los radio de tipo de versión
        //en cambio, si está seleccionado otra versión que nosea vanilla, style.display = "none" en todos los radio de tipo de versión

        const radio2 = document.getElementsByName("option");
        const fabric = document.getElementById("versionesFabric");
        const fabricVersionType = document.getElementById("selectFabric");
        const forge = document.getElementById("versionesForge");
        const forgeVersionType = document.getElementById("selectForge");
        const quilt = document.getElementById("versionesQuilt");
        const quiltVersionType = document.getElementById("selectQuilt");
        const optifine = document.getElementById("versionesOptiFine");
        const optifineVersionType = document.getElementById("selectOptiFine");
        const clientes = document.getElementById("versionesClientes");
        const clientesVersionType = document.getElementById("selectClientes");

        let titleVersions = document.getElementById("titleVersions");
        let subtitleVersions = document.getElementById("subtitleVersions");
        let versionImg = document.getElementById("versionImg");

        deleteButton.style.display = "none";

        tipoDeVersiones.style.display = "none";
        fabric.style.display = "none";
        forge.style.display = "none";
        quilt.style.display = "none";
        optifine.style.display = "none";
        clientes.style.display = "none";

        for (let i = 0; i < versionBattlyData.length; i++) {
          if (versionBattlyData[i].type === "client") {
            clientesVersionType.innerHTML += `<option value="${versionBattlyData[i].version}" img="${versionBattlyData[i].imgUrl}" download="${versionBattlyData[i].downlaodUrl}" folderName="${versionBattlyData[i].folderName}">${versionBattlyData[i].name}</option>`;
          }
        }

        radio2.forEach((element) => {
          element.addEventListener("click", () => {
            if (element.value == "vanilla") {
              versionImg.src = "./assets/images/icons/minecraft.png";
              tipoDeVersiones.style.display = "";
              radioNormal.style.display = "";
              radioSnapshot.style.display = "";
              fabric.style.display = "none";
              forge.style.display = "none";
              quilt.style.display = "none";
              optifine.style.display = "none";
              clientes.style.display = "none";
              titleVersions.innerHTML = "Java";
              subtitleVersions.innerHTML =
                '<i class="fas fa-download"></i> ' + normalVersionType.value;
            } else if (element.value == "fabric") {
              versionImg.src = "./assets/images/icons/fabric.png";
              tipoDeVersiones.style.display = "none";
              fabric.style.display = "";
              forge.style.display = "none";
              quilt.style.display = "none";
              optifine.style.display = "none";
              clientes.style.display = "none";
              titleVersions.innerHTML = "Fabric";
              subtitleVersions.innerHTML =
                '<i class="fas fa-download"></i> ' +
                fabricVersionType.value.replace("-fabric", "");
            } else if (element.value == "forge") {
              versionImg.src = "./assets/images/icons/forge.png";
              tipoDeVersiones.style.display = "none";
              fabric.style.display = "none";
              forge.style.display = "";
              quilt.style.display = "none";
              optifine.style.display = "none";
              clientes.style.display = "none";
              titleVersions.innerHTML = "Forge";
              subtitleVersions.innerHTML =
                '<i class="fas fa-download"></i> ' +
                forgeVersionType.value.replace("-forge", "");
            } else if (element.value == "quilt") {
              versionImg.src = "./assets/images/icons/quilt.png";
              tipoDeVersiones.style.display = "none";
              fabric.style.display = "none";
              forge.style.display = "none";
              quilt.style.display = "";
              optifine.style.display = "none";
              clientes.style.display = "none";
              titleVersions.innerHTML = "Quilt";
              subtitleVersions.innerHTML =
                '<i class="fas fa-download"></i> ' +
                quiltVersionType.value.replace("-quilt", "");
            } else if (element.value == "optifine") {
              versionImg.src = "./assets/images/icons/optifine.png";
              tipoDeVersiones.style.display = "none";
              fabric.style.display = "none";
              forge.style.display = "none";
              quilt.style.display = "none";
              optifine.style.display = "";
              clientes.style.display = "none";
              titleVersions.innerHTML = "OptiFine";
              subtitleVersions.innerHTML =
                '<i class="fas fa-download"></i> ' +
                optifineVersionType.value.replace("-optifine", "");
            } else if (element.value == "clientes") {
              versionImg.src = "./assets/images/icons/clients.png";
              tipoDeVersiones.style.display = "none";
              fabric.style.display = "none";
              forge.style.display = "none";
              quilt.style.display = "none";
              optifine.style.display = "none";
              clientes.style.display = "";
              titleVersions.innerHTML = "Clientes";
              subtitleVersions.innerHTML =
                '<i class="fas fa-download"></i> ' + clientesVersionType.name;
            }
          });
        });

        normalVersionType.addEventListener("change", () => {
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' + normalVersionType.value;
          if (
            fs.existsSync(
              `${dataDirectory}/.battly/versions/${normalVersionType.value}`
            )
          ) {
            deleteButton.style.display = "";
          } else {
            deleteButton.style.display = "none";
          }
        });

        snapshotVersionType.addEventListener("change", () => {
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' + snapshotVersionType.value;
          if (
            fs.existsSync(
              `${dataDirectory}/.battly/versions/${snapshotVersionType.value}`
            )
          ) {
            deleteButton.style.display = "";
          } else {
            deleteButton.style.display = "none";
          }
        });

        betaVersionType.addEventListener("change", () => {
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' + betaVersionType.value;
          if (
            fs.existsSync(
              `${dataDirectory}/.battly/versions/${betaVersionType.value}`
            )
          ) {
            deleteButton.style.display = "";
          } else {
            deleteButton.style.display = "none";
          }
        });

        alphaVersionType.addEventListener("change", () => {
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' + alphaVersionType.value;
          if (
            fs.existsSync(
              `${dataDirectory}/.battly/versions/${alphaVersionType.value}`
            )
          ) {
            deleteButton.style.display = "";
          } else {
            deleteButton.style.display = "none";
          }
        });

        fabricVersionType.addEventListener("change", () => {
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' +
            fabricVersionType.value.replace("-fabric", "");
        });

        forgeVersionType.addEventListener("change", async () => {
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' +
            forgeVersionType.value.replace("-forge", "");

          const axios = require("axios");
          await axios
            .get(
              "https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json"
            )
            .then((response) => {
              let data = response.data;

              // Agregar las opciones de "latest" y "recommended"
              let latestOption = document.createElement("option");
              latestOption.value = "latest";
              latestOption.innerHTML = langs.latest;
              selectForgeBuild.appendChild(latestOption);

              let recommendedOption = document.createElement("option");
              recommendedOption.value = "recommended";
              recommendedOption.innerHTML = langs.recommended;
              selectForgeBuild.appendChild(recommendedOption);

              for (let version in data) {
                if (version === forgeVersionType.value.replace("-forge", "")) {
                  let build = data[version];
                  // Limpiar el select antes de agregar nuevas opciones
                  selectForgeBuild.innerHTML = "";

                  // Agregar las opciones de "latest" y "recommended" nuevamente
                  selectForgeBuild.appendChild(latestOption.cloneNode(true));
                  selectForgeBuild.appendChild(
                    recommendedOption.cloneNode(true)
                  );

                  // Agregar las otras versiones
                  for (let j = 0; j < build.length; j++) {
                    let option = document.createElement("option");
                    option.value = build[j];
                    option.innerHTML = build[j];
                    selectForgeBuild.appendChild(option);
                  }
                }
              }
            });
        });

        quiltVersionType.addEventListener("change", () => {
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' +
            quiltVersionType.value.replace("-quilt", "");
        });

        optifineVersionType.addEventListener("change", () => {
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' +
            optifineVersionType.value.replace("-optifine", "");
        });

        clientesVersionType.addEventListener("change", () => {
          let selectedIndex = clientesVersionType.selectedIndex;
          subtitleVersions.innerHTML =
            '<i class="fas fa-download"></i> ' +
            clientesVersionType.options[selectedIndex].text;

          // Obtener el valor del atributo "img"
          let imgUrl =
            clientesVersionType.options[selectedIndex].getAttribute("img");

          // Usar imgUrl según tus necesidades
          versionImg.src = imgUrl;
        });

        let selectNormal = document.getElementById("selectNormal");
        let selectSnapshot = document.getElementById("selectSnapshot");
        let selectBeta = document.getElementById("selectBeta");

        for (let i = 0; i < releases.length; i++) {
          let option = document.createElement("option");
          option.value = releases[i].id;
          option.innerHTML = releases[i].id;
          selectNormal.appendChild(option);
        }

        for (let i = 0; i < snapshots.length; i++) {
          let option = document.createElement("option");
          option.value = snapshots[i].id;
          option.innerHTML = snapshots[i].id;
          selectSnapshot.appendChild(option);
        }

        for (let i = 0; i < betas.length; i++) {
          let option = document.createElement("option");
          option.value = betas[i].id;
          option.innerHTML = betas[i].id;
          selectBeta.appendChild(option);
        }

        for (let i = 0; i < alphas.length; i++) {
          let option = document.createElement("option");
          option.value = alphas[i].id;
          option.innerHTML = alphas[i].id;
          selectAlpha.appendChild(option);
        }

        let selectFabric = document.getElementById("selectFabric");
        let selectForge = document.getElementById("selectForge");
        let selectQuilt = document.getElementById("selectQuilt");
        let selectOptiFine = document.getElementById("selectOptiFine");

        for (let i = 0; i < fabricVersions.length; i++) {
          let option = document.createElement("option");
          option.value = fabricVersions[i].version;
          option.innerHTML = fabricVersions[i].version.replace("-fabric", "");
          selectFabric.appendChild(option);
        }

        for (let i = 0; i < forgeVersions.length; i++) {
          let option = document.createElement("option");
          option.value = forgeVersions[i].version;
          option.innerHTML = forgeVersions[i].version.replace("-forge", "");
          selectForge.appendChild(option);
        }

        for (let i = 0; i < quiltVersions.length; i++) {
          let option = document.createElement("option");
          option.value = quiltVersions[i].version;
          option.innerHTML = quiltVersions[i].version.replace("-quilt", "");
          selectQuilt.appendChild(option);
        }

        for (let i = 0; i < optifineVersions.length; i++) {
          let option = document.createElement("option");
          option.value = optifineVersions[i].version;
          option.innerHTML = optifineVersions[i].version.replace(
            "-optifine",
            ""
          );
          selectOptiFine.appendChild(option);
        }

        deleteButton.addEventListener("click", () => {
          Swal.fire({
            title: langs.are_you_sure,
            text: langs.delete_version_text,
            showCancelButton: true,
            confirmButtonColor: "#00d1b2",
            cancelButtonColor: "#ff3860",
            confirmButtonText: langs.yes_delete,
            cancelButtonText: langs.no_cancel,
          }).then((result) => {
            if (result.isConfirmed) {
              fs.rmdirSync(
                `${dataDirectory}/.battly/versions/${normalVersionType.value}`,
                {
                  recursive: true,
                }
              );
              deleteButton.style.display = "none";
              new Alert().ShowAlert({
                icon: "success",
                title: langs.version_deleted_correctly,
              });
            }
          });
        });

        let version;
        let versionType;

        //comprobar el radio seleccionado, vanilla, fabric, forge o quilt
        //si es vanilla, comprobar si el radio de tipo de versión es normal o snapshot
        //si es normal, comprobar el valor del select de normal
        //si es snapshot, comprobar el valor del select de snapshot
        //si es fabric, comprobar el valor del select de fabric
        //si es forge, comprobar el valor del select de forge
        //si es quilt, comprobar el valor del select de quilt

        downloadButton.addEventListener("click", async () => {
          //comprobar si hay alguna opción seleccionada
          if (document.querySelector('input[name="option"]:checked') == null)
            return new Alert().ShowAlert({
              icon: "error",
              title: langs.you_need_select_version,
            });

          //obtener el valor de option y ver si el value de checked es vanilla
          if (
            document.querySelector('input[name="option"]:checked').value ==
              "vanilla" &&
            document.querySelector('input[name="opcion"]:checked') == null
          )
            return new Alert().ShowAlert({
              icon: "error",
              title: langs.you_need_select_version,
            });
          
          if (this.database.getAccounts().length == 0) return new Alert().ShowAlert({
            icon: "error",
            title: langs.no_accounts,
            text: langs.no_accounts_text
          });

          let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
          let uuid = (await this.database.get("1234", "accounts-selected"))
            .value;
          let account = this.database.getAccounts().find(account => account.uuid === uuid.selected);
          let ram = (await this.database.get("1234", "ram")).value;
          let Resolution = (await this.database.get("1234", "screen")).value;
          let launcherSettings = (await this.database.get("1234", "launcher"))
            .value;
          ipcRenderer.send("main-window-progress-loading");
          let radio = document.getElementsByName("option");
          let radio2 = document.getElementsByName("opcion");

          radio.forEach((element) => {
            if (element.checked) {
              version = element.value;
            }
          });

          radio2.forEach((element) => {
            if (element.checked) {
              versionType = element.value;
            }
          });

          let tipo_del_loader = version;

          if (version == "vanilla") {
            if (versionType == "normal") {
              version = selectNormal.value;
            } else if (versionType == "snapshot") {
              version = selectSnapshot.value;
            } else if (versionType == "beta") {
              version = selectBeta.value;
            } else if (versionType == "alpha") {
              version = selectAlpha.value;
            }
          } else if (version == "fabric") {
            version = selectFabric.value;
            versionType = "fabric";
          } else if (version == "forge") {
            version = selectForge.value;
            versionType = "forge";
          } else if (version == "quilt") {
            version = selectQuilt.value;
            versionType = "quilt";
          } else if (version == "optifine") {
            await LaunchOptiFineVersion(
              account,
              ram,
              Resolution,
              launcherSettings
            );
            return;
          } else if (version == "clientes") {
            await LaunchClientVersion(
              account,
              ram,
              Resolution,
              launcherSettings
            );
            return;
          }

          async function LaunchClientVersion(
            account,
            ram,
            Resolution,
            launcherSettings
          ) {
            const https = require("https");

            let client = clientesVersionType.value;

            modalDiv.remove();

            // Crear el div modal principal
            let modalDiv1 = document.createElement("div");
            modalDiv1.classList.add("modal");
            modalDiv1.classList.add("is-active");

            // Crear el fondo del modal
            let modalBackground1 = document.createElement("div");
            modalBackground1.classList.add("modal-background");

            // Crear el div del contenido del modal
            let modalCard1 = document.createElement("div");
            modalCard1.classList.add("modal-card");
            modalCard1.style.backgroundColor = "#212121";

            // Crear el encabezado del modal
            let modalHeader1 = document.createElement("header");
            modalHeader1.classList.add("modal-card-head");
            modalHeader1.style.backgroundColor = "#212121";

            let modalTitle1 = document.createElement("p");
            modalTitle1.classList.add("modal-card-title");
            modalTitle1.style.color = "white";
            modalTitle1.innerText = `${langs.downloading_client}...`;

            modalHeader1.appendChild(modalTitle1);

            // Crear la sección del cuerpo del modal
            let modalSection1 = document.createElement("section");
            modalSection1.classList.add("modal-card-body");
            modalSection1.style.backgroundColor = "#212121";

            let cardDiv1 = document.createElement("div");
            cardDiv1.classList.add("card");
            let cardContentDiv1 = document.createElement("div");
            cardContentDiv1.classList.add("card-content");
            cardContentDiv1.style.backgroundColor = "#212121";

            let contentDiv1 = document.createElement("div");
            contentDiv1.classList.add("content");

            let progressText1 = document.createElement("span");
            progressText1.style.fontSize = "15px";
            progressText1.style.color = "white";
            progressText1.innerText = langs.starting_download_client_can_take;

            const progressBar1 = document.createElement("progress");
            progressBar1.className = "progress is-info";
            progressBar1.setAttribute("max", "100");
            progressBar1.style.borderRadius = "5px";

            let logText1 = document.createElement("span");
            logText1.style.fontSize = "15px";
            logText1.style.color = "white"; 
            logText1.innerText = langs.log;

            let logTextArea1 = document.createElement("textarea");
            logTextArea1.classList.add("textarea");
            logTextArea1.classList.add("is-link");
            logTextArea1.id = "battly-logs";
            logTextArea1.placeholder = langs.battly_log;
            logTextArea1.disabled = true;
            logTextArea1.style.overflow = "hidden";
            logTextArea1.style.backgroundColor = "#212121";
            logTextArea1.style.color = "white";

            contentDiv1.appendChild(progressText1);
            contentDiv1.appendChild(document.createElement("br"));
            contentDiv1.appendChild(progressBar1);
            contentDiv1.appendChild(document.createElement("br"));
            contentDiv1.appendChild(logText1);
            contentDiv1.appendChild(logTextArea1);
            cardContentDiv1.appendChild(contentDiv1);

            let cardFooterDiv1 = document.createElement("div");
            cardFooterDiv1.classList.add("card-footer");
            cardFooterDiv1.style.backgroundColor = "#212121";

            let cardFooterItemDiv1 = document.createElement("div");
            cardFooterItemDiv1.classList.add("card-footer-item");

            let footerText1 = document.createElement("p");
            footerText1.style.fontSize = "10px";
            footerText1.innerHTML = langs.mojang_copyright;
            footerText1.style.color = "white";

            cardFooterItemDiv1.appendChild(footerText1);
            cardFooterDiv1.appendChild(cardFooterItemDiv1);
            cardContentDiv1.appendChild(contentDiv1);
            cardDiv1.appendChild(cardContentDiv1);

            modalSection1.appendChild(cardDiv1);

            /* <footer class="modal-card-foot">
      <button class="button is-info" id="guardar-logs-inicio">Guardar Logs</button>
    </footer>
*/

            // Crear el pie del modal
            let modalFooter1 = document.createElement("footer");
            modalFooter1.classList.add("modal-card-foot");
            modalFooter1.style.backgroundColor = "#212121";

            let guardarLogsInicio = document.createElement("button");
            guardarLogsInicio.classList.add("button");
            guardarLogsInicio.classList.add("is-info");
            guardarLogsInicio.id = "guardar-logs-inicio";
            guardarLogsInicio.innerText = langs.save_logs;

            modalFooter1.appendChild(guardarLogsInicio);

            // Agregar elementos al modal
            modalCard1.appendChild(modalHeader1);
            modalCard1.appendChild(modalSection1);
            modalCard1.appendChild(modalFooter1);

            modalDiv1.appendChild(modalBackground1);
            modalDiv1.appendChild(modalCard1);

            // Agregar el modal al cuerpo del documento
            document.body.appendChild(modalDiv1);

            ipcRenderer.send("main-window-progress-loading");

            const clientURL =
              clientesVersionType.options[
                clientesVersionType.selectedIndex
              ].getAttribute("download");
            const folderName =
              clientesVersionType.options[
                clientesVersionType.selectedIndex
              ].getAttribute("folderName");

            async function downloadFiles() {
              try {
                // Crear carpeta
                await fs.mkdirSync(`${dataDirectory}/.battly/temp`, {
                  recursive: true,
                });

                // Descargar archivo JAR
                const zipPath = `${dataDirectory}/.battly/temp/${client}.zip`;
                const zipFile = await fs.createWriteStream(zipPath);
                const response = await downloadFile(clientURL, zipFile);
              } catch (error) {
                console.error("Error:", error);
              }
            }

            async function downloadFile(url, file) {
              return new Promise((resolve, reject) => {
                https
                  .get(url, (response) => {
                    let totalLength = response.headers["content-length"];
                    let actual = 0;
                    let progress = 0;

                    if (response.statusCode === 200) {
                      logTextArea1.value += `🔄 ${langs.downloading} ${folderName}...\n`;
                      updateTextareaScroll();
                      response.pipe(file);

                      response.on("data", (chunk) => {
                        actual += chunk.length;
                        progress = parseInt(
                          ((actual / totalLength) * 100).toFixed(0)
                        );

                        // Asegúrate de que progressBar1 es el elemento correcto para la barra de progreso
                        progressBar1.value = progress;
                      });

                      file.on("finish", () => {
                        file.close();
                        logTextArea1.value += `✅ ${folderName} ${langs.downloaded_successfully}.\n`;
                        updateTextareaScroll();
                        resolve(response);
                      });
                    } else {
                      logTextArea1.value += `❌ ${langs.error_downloading} ${url}. ${langs.status}: ${response.statusCode}\n`;
                      reject(
                        `Error al descargar ${url}. Estado: ${response.statusCode}`
                      );
                    }
                  })
                  .on("error", (error) => {
                    logTextArea1.value += `❌ ${langs.error_http}: ${error.message}\n`;
                    reject(`Error en la solicitud HTTP: ${error.message}`);
                  });
              });
            }

            const ADM = require("adm-zip");

            async function ExtractFiles() {
              const zipFilePath = `${dataDirectory}/.battly/temp/${client}.zip`;
              const extractPath = `${dataDirectory}/.battly`;

              const zip = new ADM(zipFilePath);

              // Obtener la lista de entradas en el zip
              const entries = zip.getEntries();

              // Establecer el máximo de la barra de progreso al número total de archivos
              progressBar1.max = entries.length;

              // Extraer cada archivo por separado
              for (let index = 0; index < entries.length; index++) {
                const entry = entries[index];

                let progress = parseInt(
                  ((index + 1) / entries.length) * 100
                ).toFixed(0);
                // Mostrar progreso
                logTextArea1.value += `🔄 ${langs.extracting} ${entry.name} - ${langs.progress}: ${progress}%\n`;

                progressBar1.value = index + 1;

                zip.extractEntryTo(entry, extractPath, true, true);

                updateTextareaScroll();
              }

              logTextArea1.value += `✅ ${langs.files_extracted_successfully}\n`;
              updateTextareaScroll();
              progressBar1.max = 100;
            }

            async function DeleteTempFiles() {
              logTextArea1.value += `🔄 ${langs.deleting_temp_files}...\n`;
              updateTextareaScroll();

              await fs.rmdirSync(`${dataDirectory}/.battly/temp`, {
                recursive: true,
              });
              logTextArea1.value += `✅ ${langs.temp_files_deleted_successfully}\n`;
              updateTextareaScroll();
            }

            function updateTextareaScroll() {
              logTextArea1.scrollTop = logTextArea1.scrollHeight; // Hacer que el scrollTop sea igual a la altura del contenido
            }

            async function CheckAndDownloadJava() {
              if (!fs.existsSync(`${dataDirectory}/.battly/versions/1.20.1`)) {
                modalDiv1.remove();

                new Alert().ShowAlert({
                  icon: "error",
                  title: langs.version_java_error_title,
                  text: langs.version_java_error,
                });
                return false;
              } else {
                const inputRutaJava = document.getElementById("ruta-java-input");
                if (process.platform === "win32") {
                  if (
                    fs.existsSync(`${dataDirectory}/.battly/runtime/jre-17.0.8-win32`)
                  ) {
                    //si existe, poner la ruta en el input
                    inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.8-win32/bin/java.exe`;
                    localStorage.setItem(
                      "java-path",
                      `${dataDirectory}/.battly/runtime/jre-17.0.8-win32/bin/java.exe`
                    );
                  } else if (
                    fs.existsSync(
                      `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32`
                    )
                  ) {
                    //si existe, poner la ruta en el input
                    inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32/bin/java.exe`;
                    localStorage.setItem(
                      "java-path",
                      `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32/bin/java.exe`
                    );
                  } else if (
                    fs.existsSync(
                      `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64`
                    )
                  ) {
                    inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64/bin/java.exe`;
                    localStorage.setItem(
                      "java-path",
                      `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64/bin/java.exe`
                    );
                  } else if (
                    fs.existsSync(
                      `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64`
                    )
                  ) {
                    inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64/bin/java.exe`;
                    localStorage.setItem(
                      "java-path",
                      `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64/bin/java.exe`
                    );
                  } else {
                    inputRutaJava.value =
                      "Java no encontrado. Haz click aquí para buscarlo.";
                  }
                } else {
                  inputRutaJava.value =
                    "Java no encontrado. Haz click aquí para buscarlo.";
                }
              }

              return true;
            }

            const launch = new Client();

            // Descargar los archivos y esperar
            try {
              progressText1.innerHTML = `🔄 ${langs.downloading_files}...`;
              logText1.innerHTML = `🔄 ${langs.downloading_files}...`;
              updateTextareaScroll();
              await CheckAndDownloadJava().then(async (result) => {
                if (!result) return;
                else {
                  await downloadFiles();
                  await ExtractFiles();
                  await DeleteTempFiles();

                  let realVersion = await fs.readFileSync(
                    `${dataDirectory}/.battly/versions/${folderName}/${folderName}.json`,
                    "utf-8"
                  );
                  realVersion = JSON.parse(realVersion).assets;

                  logText1.innerHTML = `🔄 ${langs.installing_minecraft_files}...`;
                  logTextArea1.innerHTML += `✅ ${langs.client_files_downloaded_successfully}.\n🔄 ${langs.installing_minecraft_files}...\n`;
                  updateTextareaScroll();
                  progressBar1.value = 100;
                  // Realizar el lanzamiento después de descargar los archivos
                  let javapath = localStorage.getItem("java-path");
                  if (!javapath || javapath == null || javapath == undefined) {
                    if (account.type === "battly") {
                      console.log("Battly");
                      launch.launch({
                        authorization: account,
                        detached: false,
                        timeout: 10000,
                        root: `${dataDirectory}/.battly`,
                        path: `${dataDirectory}/.battly`,
                        overrides: {
                          detached: false,
                          screen: screen,
                        },
                        downloadFileMultiple: 20,
                        version: {
                          custom: folderName,
                          number: realVersion,
                          type: "release",
                        },
                        verify: false,
                        ignored: ["loader"],
                        memory: {
                          min: `${ram.ramMin * 1024}M`,
                          max: `${ram.ramMax * 1024}M`,
                        },
                        customArgs: [
                          "-javaagent:authlib-injector.jar=http://localhost",
                          "-Dauthlibinjector.mojangAntiFeatures=enabled",
                          "-Dauthlibinjector.noShowServerName",
                          "-Dauthlibinjector.disableHttpd"
                        ],
                      });
                    } else {
                      launch.launch({
                        authorization: account,
                        detached: false,
                        timeout: 10000,
                        root: `${dataDirectory}/.battly`,
                        path: `${dataDirectory}/.battly`,
                        overrides: {
                          detached: false,
                          screen: screen,
                        },
                        downloadFileMultiple: 20,
                        version: {
                          custom: folderName,
                          number: realVersion,
                          type: "release",
                        },
                        verify: false,
                        ignored: ["loader"],
                        memory: {
                          min: `${ram.ramMin * 1024}M`,
                          max: `${ram.ramMax * 1024}M`,
                        },
                      });
                    }
                  } else {
                    if (account.type === "battly") {
                      console.log("Battly");
                      launch.launch({
                        authorization: account,
                        detached: false,
                        timeout: 10000,
                        root: `${dataDirectory}/.battly`,
                        path: `${dataDirectory}/.battly`,
                        overrides: {
                          detached: false,
                          screen: screen,
                        },
                        downloadFileMultiple: 20,
                        version: {
                          custom: folderName,
                          number: realVersion,
                          type: "release",
                        },
                        java: true,
                        javaPath: javapath,
                        verify: false,
                        ignored: ["loader"],
                        memory: {
                          min: `${ram.ramMin * 1024}M`,
                          max: `${ram.ramMax * 1024}M`,
                        },
                        customArgs: [
                          "-javaagent:authlib-injector.jar=http://localhost",
                          "-Dauthlibinjector.mojangAntiFeatures=enabled",
                          "-Dauthlibinjector.noShowServerName",
                          "-Dauthlibinjector.disableHttpd"
                        ],
                      });
                    } else {
                      launch.launch({
                        authorization: account,
                        detached: false,
                        timeout: 10000,
                        root: `${dataDirectory}/.battly`,
                        path: `${dataDirectory}/.battly`,
                        overrides: {
                          detached: false,
                          screen: screen,
                        },
                        downloadFileMultiple: 20,
                        version: {
                          custom: folderName,
                          number: realVersion,
                          type: "release",
                        },
                        java: true,
                        javaPath: javapath,
                        verify: false,
                        ignored: ["loader"],
                        memory: {
                          min: `${ram.ramMin * 1024}M`,
                          max: `${ram.ramMax * 1024}M`,
                        },
                      });
                    }
                  }

                  launch.on("debug", (e) => {
                    if (e.includes("Attempting to download assets")) {
                      progressText1.innerHTML = `🔄 ${langs.downloading_assets}...`;
                      logText1.innerHTML = `🔄 ${langs.downloading_assets}...`;
                      progressBar1.value = 0;
                    }

                    if (e.includes("Failed to start the minecraft server"))
                      return ShowPanelError(
                        `${langs.error_detected_one} \nError:\n${e}`
                      );
                    if (e.includes('Exception in thread "main" '))
                      return ShowPanelError(
                        `${langs.error_detected_two} \nError:\n${e}`
                      );

                    if (
                      e.includes(
                        "There is insufficient memory for the Java Runtime Environment to continue."
                      )
                    )
                      return ShowPanelError(
                        `${langs.error_detected_three} \nError:\n${e}`
                      );
                    if (
                      e.includes("Could not reserve enough space for object heap")
                    )
                      return ShowPanelError(
                        `${langs.error_detected_three} \nError:\n${e}`
                      );

                    if (e.includes("Forge patcher exited with code 1")) {
                      ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
                      progressBar1.style.display = "none";
                      info.style.display = "none";
                      playBtn.style.display = "";
                    }

                    if (e.includes("Unable to launch"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );

                    if (
                      e.includes("Minecraft Crash Report") &&
                      !e.includes("THIS IS NOT A ERROR")
                    )
                      return ShowPanelError(
                        `${langs.error_detected_one} \nError:\n${e}`
                      );

                    if (e.includes("java.lang.ClassCastException"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );

                    if (e.includes("Minecraft has crashed!"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );
                  });

                  let inicio = false;
                  launch.on("data", (e) => {
                    //si sale que está iniciando, eliminar el modaldiv1
                    if (!inicio) {
                      new logger("Minecraft", "#36b030");
                      if (
                        e.includes("Setting user") ||
                        e.includes("Launching wrapped minecraft")
                      ) {
                        modalDiv1.remove();
                        ipcRenderer.send("new-notification", {
                          title: langs.minecraft_started_correctly,
                          body: langs.minecraft_started_correctly_body,
                        });

                        if (launcherSettings.launcher.close === "close-launcher")
                          ipcRenderer.send("main-window-hide");

                        ipcRenderer.send("main-window-progress-reset");

                        inicio = true;
                      }
                    }

                    if (e.includes("Failed to start the minecraft server"))
                      return ShowPanelError(
                        `${langs.error_detected_one} \nError:\n${e}`
                      );
                    if (e.includes('Exception in thread "main" '))
                      return ShowPanelError(
                        `${langs.error_detected_two} \nError:\n${e}`
                      );

                    if (
                      e.includes(
                        "There is insufficient memory for the Java Runtime Environment to continue."
                      )
                    )
                      return ShowPanelError(
                        `${langs.error_detected_three} \nError:\n${e}`
                      );
                    if (
                      e.includes("Could not reserve enough space for object heap")
                    )
                      return ShowPanelError(
                        `${langs.error_detected_three} \nError:\n${e}`
                      );

                    if (e.includes("Forge patcher exited with code 1")) {
                      ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
                      progressBar1.style.display = "none";
                      info.style.display = "none";
                      playBtn.style.display = "";
                    }

                    if (e.includes("Unable to launch"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );

                    if (
                      e.includes("Minecraft Crash Report") &&
                      !e.includes("THIS IS NOT A ERROR")
                    )
                      return ShowPanelError(
                        `${langs.error_detected_one} \nError:\n${e}`
                      );

                    if (e.includes("java.lang.ClassCastException"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );

                    if (e.includes("Minecraft has crashed!"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );
                  });

                  let progressShown = false;
                  launch.on("progress", (e) => {
                    if (!progressShown) {
                      logTextArea1.value += `🔄 ${langs.downloading_minecraft_files}...`;
                      progressShown = true;
                    }
                    let progress = ((e.task / e.total) * 100).toFixed(2);
                    progressText1.innerHTML = `🔄 ${langs.downloading_files}... ${progress}%`;
                    progressBar1.value = progress;
                  });

                  launch.on("close", (e) => {
                    //eliminar el modaldiv1
                    modalDiv1.remove();

                    if (launcherSettings.launcher.close === "close-launcher")
                      ipcRenderer.send("main-window-show");

                    ipcRenderer.send("updateStatus", {
                      status: "online",
                      details: langs.in_the_menu,
                      username: account.name,
                    });
                  });

                  //download status
                  launch.on("download-status", (e) => {
                    if (e.type == "task") {
                      if (e.task == "Downloading") {
                        progressText1.innerHTML =
                          `🔄 ${langs.downloading_files}... ${e.progress}%`;
                        progressBar1.value = e.progress;
                      }
                    }
                  });
                }
              });
            } catch (error) {
              console.error("Error durante la descarga:");
              console.error(error);
            }
          }

          async function LaunchOptiFineVersion(
            account,
            ram,
            Resolution,
            launcherSettings
          ) {
            const https = require("https");
            const fs = require("fs");
            const util = require("util");
            const mkdir = util.promisify(fs.mkdir);

            let version = selectOptiFine.value;
            version = version.replace("-optifine", "");

            // Obtén el valor de fileName desde los datos de la versión
            let fileName = "";
            let realVersion = "";
            for (let i = 0; i < optifineVersions.length; i++) {
              if (optifineVersions[i].realVersion == version) {
                fileName = optifineVersions[i].fileName;
                realVersion = optifineVersions[i].realVersion;
              }
            }

            modalDiv.remove();

            // Crear el div modal principal
            let modalDiv1 = document.createElement("div");
            modalDiv1.classList.add("modal");
            modalDiv1.classList.add("is-active");

            // Crear el fondo del modal
            let modalBackground1 = document.createElement("div");
            modalBackground1.classList.add("modal-background");

            // Crear el div del contenido del modal
            let modalCard1 = document.createElement("div");
            modalCard1.classList.add("modal-card");
            modalCard1.style.backgroundColor = "#212121";

            // Crear el encabezado del modal
            let modalHeader1 = document.createElement("header");
            modalHeader1.classList.add("modal-card-head");
            modalHeader1.style.backgroundColor = "#212121";

            let modalTitle1 = document.createElement("p");
            modalTitle1.classList.add("modal-card-title");
            modalTitle1.innerText = `${langs.downloading_version}...`;
            modalTitle1.style.color = "white";

            modalHeader1.appendChild(modalTitle1);

            // Crear la sección del cuerpo del modal
            let modalSection1 = document.createElement("section");
            modalSection1.classList.add("modal-card-body");
            modalSection1.style.backgroundColor = "#212121";

            let cardDiv1 = document.createElement("div");
            cardDiv1.classList.add("card");
            let cardContentDiv1 = document.createElement("div");
            cardContentDiv1.classList.add("card-content");
            cardContentDiv1.style.backgroundColor = "#212121";

            let contentDiv1 = document.createElement("div");
            contentDiv1.classList.add("content");

            let progressText1 = document.createElement("span");
            progressText1.style.fontSize = "15px";
            progressText1.style.color = "white";
            progressText1.innerText = langs.starting_download_can_take;

            /* crear esto:
            <div class="progress-bar success battly-s3gsqm" id="progress-bar">
                                            <div class="progress-fill battly-s3gsqm" id="progress" style="width: 0%;"></div>
                                        </div>
            */
            
            const progressBar1 = document.createElement("div");
            progressBar1.className = "progress-bar info battly-s3gsqm";
            progressBar1.id = "progress-bar";

            const progressFill1 = document.createElement("div");
            progressFill1.className = "progress-fill battly-s3gsqm animated-fill";
            progressFill1.id = "progress";
            progressFill1.style.width = "0%";
            progressBar1.appendChild(progressFill1);

            let logText1 = document.createElement("span");
            logText1.style.fontSize = "15px";
            logText1.innerText = langs.log;
            logText1.style.color = "white";

            let logTextArea1 = document.createElement("textarea");
            logTextArea1.classList.add("textarea");
            logTextArea1.classList.add("is-link");
            logTextArea1.id = "battly-logs";
            logTextArea1.placeholder = langs.battly_log;
            logTextArea1.disabled = true;
            logTextArea1.style.overflow = "hidden";
            logTextArea1.style.backgroundColor = "#212121";
            logTextArea1.style.color = "white";

            contentDiv1.appendChild(progressText1);
            contentDiv1.appendChild(document.createElement("br"));
            contentDiv1.appendChild(progressBar1);
            contentDiv1.appendChild(document.createElement("br"));
            contentDiv1.appendChild(logText1);
            contentDiv1.appendChild(logTextArea1);
            cardContentDiv1.appendChild(contentDiv1);

            let cardFooterDiv1 = document.createElement("div");
            cardFooterDiv1.classList.add("card-footer");
            cardFooterDiv1.style.backgroundColor = "#212121";

            let cardFooterItemDiv1 = document.createElement("div");
            cardFooterItemDiv1.classList.add("card-footer-item");

            let footerText1 = document.createElement("p");
            footerText1.style.fontSize = "10px";
            footerText1.innerHTML = langs.mojang_copyright;
            footerText1.style.color = "white";

            cardFooterItemDiv1.appendChild(footerText1);
            cardFooterDiv1.appendChild(cardFooterItemDiv1);
            cardContentDiv1.appendChild(contentDiv1);
            cardDiv1.appendChild(cardContentDiv1);

            modalSection1.appendChild(cardDiv1);

            /* <footer class="modal-card-foot">
      <button class="button is-info" id="guardar-logs-inicio">Guardar Logs</button>
    </footer>
*/

            // Crear el pie del modal
            let modalFooter1 = document.createElement("footer");
            modalFooter1.classList.add("modal-card-foot");
            modalFooter1.style.backgroundColor = "#212121";

            let guardarLogsInicio = document.createElement("button");
            guardarLogsInicio.classList.add("button");
            guardarLogsInicio.classList.add("is-info");
            guardarLogsInicio.id = "guardar-logs-inicio";
            guardarLogsInicio.innerText = langs.save_logs;

            modalFooter1.appendChild(guardarLogsInicio);

            // Agregar elementos al modal
            modalCard1.appendChild(modalHeader1);
            modalCard1.appendChild(modalSection1);
            modalCard1.appendChild(modalFooter1);

            modalDiv1.appendChild(modalBackground1);
            modalDiv1.appendChild(modalCard1);

            // Agregar el modal al cuerpo del documento
            document.body.appendChild(modalDiv1);

            ipcRenderer.send("main-window-progress-loading");

            const jarURL = `https://raw.githubusercontent.com/1ly4s0/battlylauncher-optifine/main/${fileName}/${fileName}.jar`;
            const jsonURL = `https://raw.githubusercontent.com/1ly4s0/battlylauncher-optifine/main/${fileName}/${fileName}.json`;

            async function downloadFiles() {
              try {
                // Crear carpeta
                await mkdir(`${dataDirectory}/.battly/versions/${fileName}`, {
                  recursive: true,
                });

                // Descargar archivo JAR
                const jarPath = `${dataDirectory}/.battly/versions/${fileName}/${fileName}.jar`;
                const jarFile = fs.createWriteStream(jarPath);
                const response = await downloadFile(jarURL, jarFile);

                // Descargar archivo JSON
                const jsonPath = `${dataDirectory}/.battly/versions/${fileName}/${fileName}.json`;
                const jsonFile = fs.createWriteStream(jsonPath);
                const jsonResponse = await downloadFile(jsonURL, jsonFile);
              } catch (error) {
                console.error("Error:", error);
              }
            }

            function downloadFile(url, file) {
              return new Promise((resolve, reject) => {
                https
                  .get(url, (response) => {
                    if (response.statusCode === 200) {
                      response.pipe(file);
                      file.on("finish", () => {
                        file.close();
                        resolve(response);
                      });
                    } else {
                      logTextArea1.value += `❌ ${langs.error_downloading} ${url}. ${langs.status}: ${response.statusCode}\n`;
                      reject(
                        `Error al descargar ${url}. Estado: ${response.statusCode}`
                      );
                    }
                  })
                  .on("error", (error) => {
                    logTextArea1.value += `❌ ${langs.error_http}: ${error.message}\n`;
                    reject(`Error en la solicitud HTTP: ${error.message}`);
                  });
              });
            }

            function updateTextareaScroll() {
              logTextArea1.scrollTop = logTextArea1.scrollHeight; // Hacer que el scrollTop sea igual a la altura del contenido
            }

            async function CreateLibrariesDirectory() {
              progressFill1.classList.remove("animated-fill");
              if (!fs.existsSync(`${dataDirectory}/.battly/libraries`)) {
                logTextArea1.value += `🔄 ${langs.creating_folder} libraries...\n`;
                updateTextareaScroll();
                fs.mkdirSync(`${dataDirectory}/.battly/libraries`, {
                  recursive: true,
                });
                logTextArea1.value += `✅ ${langs.folder} libraries ${langs.created_successfully}.\n`;
                progressFill1.style.width = "10%";
                updateTextareaScroll();
              } else {
                logTextArea1.value +=
                  `⏩ ${langs.the_folder} libraries ${langs.already_exists}. ${langs.skipping}...\n`;
                progressFill1.style.width = "20%";
                updateTextareaScroll();
              }

              if (
                !fs.existsSync(`${dataDirectory}/.battly/libraries/optifine`)
              ) {
                logTextArea1.value += `🔄 ${langs.creating_folder} optifine...\n`;
                updateTextareaScroll();
                fs.mkdirSync(`${dataDirectory}/.battly/libraries/optifine`, {
                  recursive: true,
                });
                logTextArea1.value += `✅ ${langs.folder} optifine ${created_successfully}.\n`;
                progressFill1.style.width = "20%";
                updateTextareaScroll();
              } else {
                logTextArea1.value +=
                  `⏩ ${langs.the_folder} optifine ${langs.already_exists}. ${langs.skipping}...\n`;
                progressFill1.style.width = "20%";
                updateTextareaScroll();
              }

              if (
                !fs.existsSync(
                  `${dataDirectory}/.battly/libraries/optifine/OptiFine`
                )
              ) {
                logTextArea1.value += `🔄 ${langs.creating_folder} OptiFine...\n`;
                updateTextareaScroll();
                fs.mkdirSync(
                  `${dataDirectory}/.battly/libraries/optifine/OptiFine`,
                  {
                    recursive: true,
                  }
                );
                logTextArea1.value += `✅ ${langs.folder} OptiFine ${created_successfully}.\n`;
                progressFill1.style.width = "30%";
                updateTextareaScroll();
              } else {
                logTextArea1.value +=
                  `⏩ ${langs.the_folder} OptiFine ${langs.already_exists}. ${langs.skipping}...\n`;
                progressFill1.style.width = "30%";
                updateTextareaScroll();
              }

              if (
                !fs.existsSync(
                  `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of`
                )
              ) {
                logTextArea1.value += `🔄 ${langs.creating_folder} launchwrapper-of...\n`;
                updateTextareaScroll();
                fs.mkdirSync(
                  `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of`,
                  {
                    recursive: true,
                  }
                );
                logTextArea1.value += `✅ ${langs.folder} launchwrapper-of ${created_successfully}.\n`;
                progressFill1.style.width = "40%";
                updateTextareaScroll();
              } else {
                logTextArea1.value +=
                  `⏩ ${langs.the_folder} launchwrapper-of ${langs.already_exists}. ${langs.skipping}...\n`;
                progressFill1.style.width = "40%";
                updateTextareaScroll();
              }

              if (
                !fs.existsSync(
                  `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.1`
                )
              ) {
                logTextArea1.value += `🔄 ${langs.creating_folder} 2.1...\n`;
                updateTextareaScroll();
                fs.mkdirSync(
                  `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.1`,
                  {
                    recursive: true,
                  }
                );
                logTextArea1.value += `✅ ${langs.folder} 2.1 ${created_successfully}.\n`;
                progressFill1.style.width = "50%";
                updateTextareaScroll();
              } else {
                logTextArea1.value +=
                  `⏩ ${langs.the_folder} 2.1 ${langs.already_exists}. ${langs.skipping}...\n`;
                progressFill1.style.width = "50%";
                updateTextareaScroll();
              }

              if (
                !fs.existsSync(
                  `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.2`
                )
              ) {
                logTextArea1.value += `🔄 ${langs.creating_folder} 2.2...\n`;
                updateTextareaScroll();
                fs.mkdirSync(
                  `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.2`,
                  {
                    recursive: true,
                  }
                );
                logTextArea1.value += `✅ ${langs.folder} 2.2 ${created_successfully}.\n`;
                progressFill1.style.width = "60%";
                updateTextareaScroll();
              } else {
                logTextArea1.value +=
                  `⏩ ${langs.the_folder} 2.2 ${langs.already_exists}. ${langs.skipping}...\n`;
                progressFill1.style.width = "60%";
                updateTextareaScroll();
              }

              if (
                !fs.existsSync(
                  `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.3`
                )
              ) {
                logTextArea1.value += `🔄 ${langs.creating_folder} 2.3...\n`;
                updateTextareaScroll();
                fs.mkdirSync(
                  `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.3`,
                  {
                    recursive: true,
                  }
                );
                logTextArea1.value += `✅ ${langs.folder} 2.3 ${created_successfully}.\n`;
                progressFill1.style.width = "70%";
                updateTextareaScroll();
              } else {
                logTextArea1.value +=
                  `⏩ ${langs.the_folder} 2.3 ${langs.already_exists}. ${langs.skipping}...\n`;
                progressFill1.style.width = "70%";
                updateTextareaScroll();
              }

              if (
                !fs.existsSync(
                  `${dataDirectory}/.battly/libraries/optifine/OptiFine/${fileName.replace(
                    "-OptiFine",
                    ""
                  )}`
                )
              ) {
                logTextArea1.value +=
                  `🔄 ${langs.creating_folder} ` +
                  fileName.replace("-OptiFine", "") +
                  "...\n";
                updateTextareaScroll();
                fs.mkdirSync(
                  `${dataDirectory}/.battly/libraries/optifine/OptiFine/${fileName.replace(
                    "-OptiFine",
                    ""
                  )}`,
                  {
                    recursive: true,
                  }
                );
                logTextArea1.value +=
                  `✅ ${langs.folder} ` +
                  fileName.replace("-OptiFine", "") +
                  ` ${langs.created_successfully}.\n`;
                progressFill1.style.width = "80%";
                updateTextareaScroll();
              } else {
                logTextArea1.value +=
                  `⏩ ${langs.the_folder} ` +
                  fileName.replace("-OptiFine", "") +
                  ` ${langs.already_exists}. ${langs.skipping}...\n`;
                progressFill1.style.width = "80%";
                updateTextareaScroll();
              }

              const libraryJARURL = `https://raw.githubusercontent.com/1ly4s0/battlylauncher-optifine/main/libraries/optifine/OptiFine/${fileName.replace(
                "-OptiFine",
                ""
              )}/OptiFine-${fileName.replace("-OptiFine", "")}.jar`;

              logTextArea1.value +=
                `🔄 ${langs.downloading_jar_file_of}...\n`;
              updateTextareaScroll();
              const libraryJARFile = fs.createWriteStream(
                `${dataDirectory}/.battly/libraries/optifine/OptiFine/${fileName.replace(
                  "-OptiFine",
                  ""
                )}/OptiFine-${fileName.replace("-OptiFine", "")}.jar`
              );
              const libraryJARResponse = await downloadFile(
                libraryJARURL,
                libraryJARFile
              );
              logTextArea1.value += `✅ ${langs.jar_file_of} OptiFine ${langs.downloaded_successfully}: ${libraryJARResponse.statusCode}\n`;
              updateTextareaScroll();

              /* ahora descargar launchwrapper-of-2.1.jar, launchwrapper-of-2.2.jar y launchwrapper-of-2.3.jar  y ponerlos en sus respectivas carpetas */

              const wrapperJARURL21 = `https://raw.githubusercontent.com/1ly4s0/battlylauncher-optifine/main/libraries/optifine/launchwrapper-of/2.1/launchwrapper-of-2.1.jar`;
              const wrapperJARURL22 = `https://raw.githubusercontent.com/1ly4s0/battlylauncher-optifine/main/libraries/optifine/launchwrapper-of/2.2/launchwrapper-of-2.2.jar`;
              const wrapperJARURL23 = `https://raw.githubusercontent.com/1ly4s0/battlylauncher-optifine/main/libraries/optifine/launchwrapper-of/2.3/launchwrapper-of-2.3.jar`;

              const wrapperJAR21File = fs.createWriteStream(
                `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.1/launchwrapper-of-2.1.jar`
              );
              logTextArea1.value +=
                `🔄 ${langs.downloading_file} launchwrapper 2.1...\n`;
              updateTextareaScroll();

              const wrapperJAR22File = fs.createWriteStream(
                `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.2/launchwrapper-of-2.2.jar`
              );
              logTextArea1.value +=
                `🔄 ${langs.downloading_file} launchwrapper 2.2...\n`;
              updateTextareaScroll();

              const wrapperJAR23File = fs.createWriteStream(
                `${dataDirectory}/.battly/libraries/optifine/launchwrapper-of/2.3/launchwrapper-of-2.3.jar`
              );
              logTextArea1.value +=
                `🔄 ${langs.downloading_file} launchwrapper 2.3...\n`;
              updateTextareaScroll();

              const wrapperJAR21Response = await downloadFile(
                wrapperJARURL21,
                wrapperJAR21File
              );
              logTextArea1.value += `✅ ${langs.downloading_jar_file_of} launchwrapper-of-2.1 ${langs.downloaded_successfully}: ${wrapperJAR21Response.statusCode}\n`;
              progressFill1.style.width = "85%";
              updateTextareaScroll();

              const wrapperJAR22Response = await downloadFile(
                wrapperJARURL22,
                wrapperJAR22File
              );
              logTextArea1.value += `✅ ${langs.downloading_jar_file_of} launchwrapper-of-2.2 ${langs.downloaded_successfully}: ${wrapperJAR22Response.statusCode}\n`;
              progressFill1.style.width = "90%";
              updateTextareaScroll();

              const wrapperJAR23Response = await downloadFile(
                wrapperJARURL23,
                wrapperJAR23File
              );
              logTextArea1.value += `✅ ${langs.downloading_jar_file_of} launchwrapper-of-2.3 ${langs.downloaded_successfully}: ${wrapperJAR23Response.statusCode}\n`;
              progressFill1.style.width = "95%";
              updateTextareaScroll();
            }

            async function CheckAndDownloadJava() {
              if (!fs.existsSync(`${dataDirectory}/.battly/versions/1.20.1`)) {
                modalDiv1.remove();

                new Alert().ShowAlert({
                  icon: "error",
                  title: langs.version_java_error_title,
                  text: langs.version_java_error,
                });
                return false;
              } else {
                const inputRutaJava = document.getElementById("ruta-java-input");
                if (process.platform === "win32") {
                  if (
                    fs.existsSync(`${dataDirectory}/.battly/runtime/jre-17.0.8-win32`)
                  ) {
                    //si existe, poner la ruta en el input
                    inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.8-win32/bin/java.exe`;
                    localStorage.setItem(
                      "java-path",
                      `${dataDirectory}/.battly/runtime/jre-17.0.8-win32/bin/java.exe`
                    );
                  } else if (
                    fs.existsSync(
                      `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32`
                    )
                  ) {
                    //si existe, poner la ruta en el input
                    inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32/bin/java.exe`;
                    localStorage.setItem(
                      "java-path",
                      `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-win32/bin/java.exe`
                    );
                  } else if (
                    fs.existsSync(
                      `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64`
                    )
                  ) {
                    inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64/bin/java.exe`;
                    localStorage.setItem(
                      "java-path",
                      `${dataDirectory}/.battly/runtime/jre-17.0.8-windows-x64/bin/java.exe`
                    );
                  } else if (
                    fs.existsSync(
                      `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64`
                    )
                  ) {
                    inputRutaJava.value = `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64/bin/java.exe`;
                    localStorage.setItem(
                      "java-path",
                      `${dataDirectory}/.battly/runtime/jre-17.0.1.12.1-windows-x64/bin/java.exe`
                    );
                  } else {
                    inputRutaJava.value =
                      "Java no encontrado. Haz click aquí para buscarlo.";
                  }
                } else {
                  inputRutaJava.value =
                    "Java no encontrado. Haz click aquí para buscarlo.";
                }
              }

              return true;
            }

            const launch = new Client();

            // Descargar los archivos y esperar
            try {
              progressText1.innerHTML = `🔄 ${langs.downloading_files}...`;
              logText1.innerHTML = `🔄 ${langs.downloading_files}...`;
              await CheckAndDownloadJava().then(async (result) => {
                if (!result) return;
                else {
                  await downloadFiles();
                  await CreateLibrariesDirectory();

                  progressText1.innerHTML =
                    `✅ ${langs.downloading_files_completed}.`;
                  logText1.innerHTML = `🔄 ${langs.opening_optifine}...`;
                  logTextArea1.innerHTML += `✅ ${langs.downloading_files_completed_installing_dependencies}...`;
                  progressFill1.style.width = "100%";

                  // Realizar el lanzamiento después de descargar los archivos
                  let javapath = localStorage.getItem("java-path");
                  if (!javapath || javapath == null || javapath == undefined) {
                    if (account.type === "battly") {
                      console.log("Battly");
                      launch.launch({
                        authorization: account,
                        detached: false,
                        timeout: 10000,
                        root: `${dataDirectory}/.battly`,
                        path: `${dataDirectory}/.battly`,
                        overrides: {
                          detached: false,
                          screen: screen,
                        },
                        downloadFileMultiple: 20,
                        version: {
                          custom: fileName,
                          number: realVersion,
                          type: "release",
                        },
                        verify: false,
                        ignored: ["loader"],
                        memory: {
                          min: `${ram.ramMin * 1024}M`,
                          max: `${ram.ramMax * 1024}M`,
                        },
                        customArgs: [
                          "-javaagent:authlib-injector.jar=http://localhost",
                          "-Dauthlibinjector.mojangAntiFeatures=enabled",
                          "-Dauthlibinjector.noShowServerName",
                          "-Dauthlibinjector.disableHttpd"
                        ],
                      });
                    } else {
                      launch.launch({
                        authorization: account,
                        detached: false,
                        timeout: 10000,
                        root: `${dataDirectory}/.battly`,
                        path: `${dataDirectory}/.battly`,
                        overrides: {
                          detached: false,
                          screen: screen,
                        },
                        downloadFileMultiple: 20,
                        version: {
                          custom: fileName,
                          number: realVersion,
                          type: "release",
                        },
                        verify: false,
                        ignored: ["loader"],
                        memory: {
                          min: `${ram.ramMin * 1024}M`,
                          max: `${ram.ramMax * 1024}M`,
                        },
                      });
                    }
                  } else {
                    if (account.type === "battly") {
                      console.log("Battly");
                      launch.launch({
                        authorization: account,
                        detached: false,
                        timeout: 10000,
                        root: `${dataDirectory}/.battly`,
                        path: `${dataDirectory}/.battly`,
                        overrides: {
                          detached: false,
                          screen: screen,
                        },
                        downloadFileMultiple: 20,
                        version: {
                          custom: fileName,
                          number: realVersion,
                          type: "release",
                        },
                        java: true,
                        javaPath: javapath,
                        verify: false,
                        ignored: ["loader"],
                        memory: {
                          min: `${ram.ramMin * 1024}M`,
                          max: `${ram.ramMax * 1024}M`,
                        },
                        customArgs: [
                          "-javaagent:authlib-injector.jar=http://localhost",
                          "-Dauthlibinjector.mojangAntiFeatures=enabled",
                          "-Dauthlibinjector.noShowServerName",
                          "-Dauthlibinjector.disableHttpd"
                        ],
                      });
                    } else {
                      launch.launch({
                        authorization: account,
                        detached: false,
                        timeout: 10000,
                        root: `${dataDirectory}/.battly`,
                        path: `${dataDirectory}/.battly`,
                        overrides: {
                          detached: false,
                          screen: screen,
                        },
                        downloadFileMultiple: 20,
                        version: {
                          custom: fileName,
                          number: realVersion,
                          type: "release",
                        },
                        java: true,
                        javaPath: javapath,
                        verify: false,
                        ignored: ["loader"],
                        memory: {
                          min: `${ram.ramMin * 1024}M`,
                          max: `${ram.ramMax * 1024}M`,
                        },
                      });
                    }
                  }

                  launch.on("debug", (e) => {
                    if (e.includes("Attempting to download assets")) {
                      progressText1.innerHTML = `🔄 ${langs.downloading_files}...`;
                      logText1.innerHTML = `🔄 ${langs.downloading_files}...`;
                      progressFill1.style.width = "0%";
                    }

                    if (e.includes("Failed to start the minecraft server"))
                      return ShowPanelError(
                        `${langs.error_detected_one} \nError:\n${e}`
                      );
                    if (e.includes('Exception in thread "main" '))
                      return ShowPanelError(
                        `${langs.error_detected_two} \nError:\n${e}`
                      );

                    if (
                      e.includes(
                        "There is insufficient memory for the Java Runtime Environment to continue."
                      )
                    )
                      return ShowPanelError(
                        `${langs.error_detected_three} \nError:\n${e}`
                      );
                    if (
                      e.includes("Could not reserve enough space for object heap")
                    )
                      return ShowPanelError(
                        `${langs.error_detected_three} \nError:\n${e}`
                      );

                    if (e.includes("Forge patcher exited with code 1")) {
                      ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
                      progressBar1.style.display = "none";
                      info.style.display = "none";
                      playBtn.style.display = "";
                    }

                    if (e.includes("Unable to launch"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );

                    if (
                      e.includes("Minecraft Crash Report") &&
                      !e.includes("THIS IS NOT A ERROR")
                    )
                      return ShowPanelError(
                        `${langs.error_detected_one} \nError:\n${e}`
                      );

                    if (e.includes("java.lang.ClassCastException"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );

                    if (e.includes("Minecraft has crashed!"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );
                  });

                  let inicio = false;
                  launch.on("data", (e) => {
                    //si sale que está iniciando, eliminar el modaldiv1
                    if (!inicio) {
                      new logger("Minecraft", "#36b030");
                      if (
                        e.includes("Setting user") ||
                        e.includes("Launching wrapped minecraft")
                      ) {
                        modalDiv1.remove();
                        ipcRenderer.send("new-notification", {
                          title: langs.minecraft_started_correctly,
                          body: langs.minecraft_started_correctly_body,
                        });

                        if (launcherSettings.launcher.close === "close-launcher")
                          ipcRenderer.send("main-window-hide");

                        ipcRenderer.send("main-window-progress-reset");

                        inicio = true;
                      }
                    }

                    if (e.includes("Failed to start the minecraft server"))
                      return ShowPanelError(
                        `${langs.error_detected_one} \nError:\n${e}`
                      );
                    if (e.includes('Exception in thread "main" '))
                      return ShowPanelError(
                        `${langs.error_detected_two} \nError:\n${e}`
                      );

                    if (
                      e.includes(
                        "There is insufficient memory for the Java Runtime Environment to continue."
                      )
                    )
                      return ShowPanelError(
                        `${langs.error_detected_three} \nError:\n${e}`
                      );
                    if (
                      e.includes("Could not reserve enough space for object heap")
                    )
                      return ShowPanelError(
                        `${langs.error_detected_three} \nError:\n${e}`
                      );

                    if (e.includes("Forge patcher exited with code 1")) {
                      ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
                      progressBar1.style.display = "none";
                      info.style.display = "none";
                      playBtn.style.display = "";
                    }

                    if (e.includes("Unable to launch"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );

                    if (
                      e.includes("Minecraft Crash Report") &&
                      !e.includes("THIS IS NOT A ERROR")
                    )
                      return ShowPanelError(
                        `${langs.error_detected_one} \nError:\n${e}`
                      );

                    if (e.includes("java.lang.ClassCastException"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );

                    if (e.includes("Minecraft has crashed!"))
                      return ShowPanelError(
                        `${langs.error_detected_five} \nError:\n${e}`
                      );
                  });

                  let progressShown = false;
                  launch.on("progress", (e) => {
                    if (!progressShown) {
                      logTextArea1.value += `🔄 ${langs.downloading_minecraft_files}...`;
                      progressShown = true;
                    }

                    let progress = ((e.task / e.total) * 100).toFixed(2);
                    progressText1.innerHTML =
                      "🔄 Descargando archivos... " + progress + "%";
                    progressFill1.style.width = progress + "%";
                  });

                  launch.on("close", (e) => {
                    //eliminar el modaldiv1
                    modalDiv1.remove();

                    if (launcherSettings.launcher.close === "close-launcher")
                      ipcRenderer.send("main-window-show");

                    ipcRenderer.send("updateStatus", {
                      status: "online",
                      details: langs.in_the_menu,
                      username: account.name,
                    });
                  });

                  //download status
                  launch.on("download-status", (e) => {
                    if (e.type == "task") {
                      if (e.task == "Downloading") {
                        progressText1.innerHTML =
                          `🔄 ${langs.downloading_files}... ` + e.progress + "%";
                        progressFill1.style.width = e.progress + "%";
                      }
                    }
                  });
                }
              });
              
            } catch (error) {
              console.error("Error durante la descarga:");
              console.error(error);
            }
          }

          modalDiv.remove();

          // Crear el div modal principal
          let modalDiv1 = document.createElement("div");
          modalDiv1.classList.add("modal");
          modalDiv1.classList.add("is-active");

          // Crear el fondo del modal
          let modalBackground1 = document.createElement("div");
          modalBackground1.classList.add("modal-background");

          // Crear el div del contenido del modal
          let modalCard1 = document.createElement("div");
          modalCard1.classList.add("modal-card");
          modalCard1.style.backgroundColor = "#212121";

          // Crear el encabezado del modal
          let modalHeader1 = document.createElement("header");
          modalHeader1.classList.add("modal-card-head");
          modalHeader1.style.backgroundColor = "#212121";

          let modalTitle1 = document.createElement("p");
          modalTitle1.classList.add("modal-card-title");
          modalTitle1.innerText = `${langs.downloading_version}...`;
          modalTitle1.style.color = "white";

          modalHeader1.appendChild(modalTitle1);

          // Crear la sección del cuerpo del modal
          let modalSection1 = document.createElement("section");
          modalSection1.classList.add("modal-card-body");
          modalSection1.style.backgroundColor = "#212121";

          let cardDiv1 = document.createElement("div");
          cardDiv1.classList.add("card");
          let cardContentDiv1 = document.createElement("div");
          cardContentDiv1.classList.add("card-content");
          cardContentDiv1.style.backgroundColor = "#212121";

          let contentDiv1 = document.createElement("div");
          contentDiv1.classList.add("content");

          let progressText1 = document.createElement("span");
          progressText1.style.fontSize = "15px";
          progressText1.innerText = langs.starting_download_can_take;
          progressText1.style.color = "white";

          const progressBar1 = document.createElement("div");
          progressBar1.className = "progress-bar info battly-s3gsqm";
          progressBar1.id = "progress-bar";

          const progressFill1 = document.createElement("div");
          progressFill1.className = "progress-fill battly-s3gsqm animated-fill";
          progressFill1.id = "progress";
          progressFill1.style.width = "0%";
          progressBar1.appendChild(progressFill1);

          let logText1 = document.createElement("span");
          logText1.style.fontSize = "15px";
          logText1.innerText = langs.log;
          logText1.style.color = "white";

          let logTextArea1 = document.createElement("textarea");
          logTextArea1.classList.add("textarea");
          logTextArea1.classList.add("is-link");
            logTextArea1.id = "battly-logs";
          logTextArea1.placeholder = langs.battly_log;
          logTextArea1.disabled = true;
          logTextArea1.style.overflow = "hidden";
          logTextArea1.style.backgroundColor = "#212121";
          logTextArea1.style.color = "white";

          contentDiv1.appendChild(progressText1);
          contentDiv1.appendChild(document.createElement("br"));
          contentDiv1.appendChild(progressBar1);
          contentDiv1.appendChild(document.createElement("br"));
          contentDiv1.appendChild(logText1);
          contentDiv1.appendChild(logTextArea1);
          cardContentDiv1.appendChild(contentDiv1);

          let cardFooterDiv1 = document.createElement("div");
          cardFooterDiv1.classList.add("card-footer");
          cardFooterDiv1.style.backgroundColor = "#212121";

          let cardFooterItemDiv1 = document.createElement("div");
          cardFooterItemDiv1.classList.add("card-footer-item");

          let footerText1 = document.createElement("p");
          footerText1.style.fontSize = "10px";
          footerText1.innerHTML = langs.mojang_copyright;
          footerText1.style.color = "white";

          cardFooterItemDiv1.appendChild(footerText1);
          cardFooterDiv1.appendChild(cardFooterItemDiv1);
          cardContentDiv1.appendChild(contentDiv1);
          cardDiv1.appendChild(cardContentDiv1);

          modalSection1.appendChild(cardDiv1);

          /* <footer class="modal-card-foot">
      <button class="button is-info" id="guardar-logs-inicio">Guardar Logs</button>
    </footer>
*/

          // Crear el pie del modal
          let modalFooter1 = document.createElement("footer");
          modalFooter1.classList.add("modal-card-foot");
          modalFooter1.style.backgroundColor = "#212121";

          let guardarLogsInicio = document.createElement("button");
          guardarLogsInicio.classList.add("button");
          guardarLogsInicio.classList.add("is-info");
          guardarLogsInicio.id = "guardar-logs-inicio";
          guardarLogsInicio.innerText = langs.save_logs;

          modalFooter1.appendChild(guardarLogsInicio);

          // Agregar elementos al modal
          modalCard1.appendChild(modalHeader1);
          modalCard1.appendChild(modalSection1);
          modalCard1.appendChild(modalFooter1);

          modalDiv1.appendChild(modalBackground1);
          modalDiv1.appendChild(modalCard1);

          // Agregar el modal al cuerpo del documento
          document.body.appendChild(modalDiv1);

          function updateTextareaScroll() {
            logTextArea1.scrollTop = logTextArea1.scrollHeight; // Hacer que el scrollTop sea igual a la altura del contenido
          }

          guardarLogsInicio.addEventListener("click", () => {
            this.Registros();
          });

          let isForgeCheckBox = false;
          let isFabricCheckBox = false;
          let isQuiltCheckBox = false;

          let settings_btn = document.getElementById("settings-btn");
          let select_versions = document.getElementById("select-version");
          let mods_btn = document.getElementById("boton_abrir_mods");
          let discord_btn = document.getElementById(
            "BotonUnirseServidorDiscord"
          );

          let version_real = version
            .replace("-extra", "")
            .replace("-forge", "")
            .replace("-fabric", "")
            .replace("-quilt", "");

          if (versionType === "forge") {
            version = version.replace("-forge", "");
            isForgeCheckBox = true;
            isFabricCheckBox = false;
            isQuiltCheckBox = false;
          } else if (versionType === "fabric") {
            version = version.replace("-fabric", "");
            isFabricCheckBox = true;
            isForgeCheckBox = false;
            isQuiltCheckBox = false;
          } else if (versionType === "quilt") {
            version = version.replace("-quilt", "");
            isQuiltCheckBox = true;
            isForgeCheckBox = false;
            isFabricCheckBox = false;
          }

          let type;
          if (isForgeCheckBox == true) {
            type = "forge";
            mcModPack = "forge";
          } else if (isFabricCheckBox == true) {
            type = "fabric";
            mcModPack = "fabric";
          } else if (isQuiltCheckBox == true) {
            type = "quilt";
            mcModPack = "quilt";
          } else {
            type = "vanilla";
            mcModPack = "vanilla";
          }

          //hacer un json.parse del archivo de versiones y obtener el dato "assets"

          //comprobar si existe el archivo de versiones

          // Si la versión acaba con -extra hacer let assets = JSON.parse(fs.readFileSync(`${dataDirectory}/.battly/versions/${version_real}/${version_real}.json`)).assets;
          // si no, ignorar
          let assets;
          let versionData;
          if (version_real === "1.8") {
            assets = "1.8";
            versionData = {
              number: assets,
              custom: version_real,
              type: "release",
            };
          } else if (
            version.endsWith("-extra") &&
            !version.includes("OptiFine") &&
            !version.includes("LabyMod")
          ) {
            assets = JSON.parse(
              fs.readFileSync(
                `${dataDirectory}/${
                  process.platform == "darwin"
                    ? this.config.dataDirectory
                    : `.${this.config.dataDirectory}`
                }/versions/${version_real}/${version_real}.json`
              )
            ).assets;

            versionData = {
              number: assets,
              custom: version_real,
              type: "release",
            };
          } else if (
            version.includes("OptiFine") &&
            version.endsWith("-extra")
          ) {
            assets = JSON.parse(
              fs.readFileSync(
                `${dataDirectory}/${
                  process.platform == "darwin"
                    ? this.config.dataDirectory
                    : `.${this.config.dataDirectory}`
                }/versions/${version_real}/${version_real}.json`
              )
            ).inheritsFrom;

            versionData = {
              number: assets,
              custom: version_real,
              type: "release",
            };
          } else if (
            version.includes("LabyMod") &&
            version.endsWith("-extra")
          ) {
            assets = JSON.parse(
              fs.readFileSync(
                `${dataDirectory}/${
                  process.platform == "darwin"
                    ? this.config.dataDirectory
                    : `.${this.config.dataDirectory}`
                }/versions/${version_real}/${version_real}.json`
              )
            )._minecraftVersion;

            versionData = {
              number: version_real,
              type: "release",
            };
          } else {
            versionData = version_real;
          }

          let playBtn = document.getElementById("download-btn");
          let info = progressText1;

          if (Resolution.screen.width == "<auto>") {
            screen = false;
          } else {
            screen = {
              width: Resolution.screen.width,
              height: Resolution.screen.height,
            };
          }

          let opts;
          console.log(version)
          if (!version.endsWith("-extra") && !version.includes("OptiFine")) {
            if (account.type === "battly") {
              opts = {
                url:
                  this.config.game_url === "" ||
                  this.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : this.config.game_url,
                authorization: account,
                authenticator: account,
                detached: false,
                timeout: 10000,
                root: `${dataDirectory}/.battly`,
                path: `${dataDirectory}/.battly`,
                overrides: {
                  detached: false,
                  screen: screen,
                },
                downloadFileMultiple: 20,
                //javaPath: "C:\\Users\\ilyas\\Desktop\\RND Projects\\Java\\bin\\java.exe",
                version: versionData,
                loader: {
                  type: type,
                  build: selectForgeBuild.value,
                  enable: isForgeCheckBox
                    ? true
                    : isFabricCheckBox
                    ? true
                    : isQuiltCheckBox
                    ? true
                    : false,
                },
                verify: false,
                ignored: ["loader", ...this.config.ignored],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
                JVM_ARGS: [
                  "-javaagent:authlib-injector.jar=http://localhost",
                  "-Dauthlibinjector.mojangAntiFeatures=enabled",
                    "-Dauthlibinjector.noShowServerName",
                    "-Dauthlibinjector.disableHttpd"
                ],
              };
            } else {
              opts = {
                url:
                  this.config.game_url === "" ||
                  this.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : this.config.game_url,
                authorization: account,
                authenticator: account,
                detached: false,
                timeout: 10000,
                root: `${dataDirectory}/.battly`,
                path: `${dataDirectory}/.battly`,
                overrides: {
                  detached: false,
                  screen: screen,
                },
                downloadFileMultiple: 20,
                //javaPath: "C:\\Users\\ilyas\\Desktop\\RND Projects\\Java\\bin\\java.exe",
                version: versionData,
                loader: {
                  type: type,
                  build: selectForgeBuild.value,
                  enable: isForgeCheckBox
                    ? true
                    : isFabricCheckBox
                    ? true
                    : isQuiltCheckBox
                    ? true
                    : false,
                },
                verify: false,
                ignored: ["loader", ...this.config.ignored],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
              };
            }
          } else {
            if (account.type === "battly") {
              opts = {
                url:
                  this.config.game_url === "" ||
                  this.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : this.config.game_url,
                authorization: account,
                authenticator: account,
                detached: false,
                timeout: 10000,
                root: `${dataDirectory}/.battly`,
                path: `${dataDirectory}/.battly`,
                overrides: {
                  detached: false,
                  screen: screen,
                },
                downloadFileMultiple: 20,
                //javaPath: "C:\\Users\\ilyas\\Desktop\\RND Projects\\Java\\bin\\java.exe",
                version: versionData,
                loader: {
                  type: type,
                  build: this.BattlyConfig.loader.build,
                  enable: isForgeCheckBox
                    ? true
                    : isFabricCheckBox
                    ? true
                    : isQuiltCheckBox
                    ? true
                    : false,
                },
                verify: false,
                ignored: ["loader", ...this.config.ignored],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
                customArgs: [
                  "-javaagent:authlib-injector.jar=http://localhost",
                  "-Dauthlibinjector.mojangAntiFeatures=enabled",
                    "-Dauthlibinjector.noShowServerName",
                    "-Dauthlibinjector.disableHttpd"
                ],
              };
            } else {
              opts = {
                url:
                  this.config.game_url === "" ||
                  this.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : this.config.game_url,
                authorization: account,
                authenticator: account,
                detached: false,
                timeout: 10000,
                root: `${dataDirectory}/.battly`,
                path: `${dataDirectory}/.battly`,
                overrides: {
                  detached: false,
                  screen: screen,
                },
                downloadFileMultiple: 20,
                //javaPath: "C:\\Users\\ilyas\\Desktop\\RND Projects\\Java\\bin\\java.exe",
                version: versionData,
                loader: {
                  type: type,
                  build: this.BattlyConfig.loader.build,
                  enable: isForgeCheckBox
                    ? true
                    : isFabricCheckBox
                    ? true
                    : isQuiltCheckBox
                    ? true
                    : false,
                },
                verify: false,
                ignored: ["loader", ...this.config.ignored],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
              };
            }
          }

          const launch = new Client();
          const launch_core = new Launch();

          try {
            /*
                                    Si la versión acaba con -forge o -fabric, iniciar launch_core.launch(opts);
                                    Si no, iniciar launch.launch(opts);
                                    */
            if (version === "1.8") {
              await launch.launch(opts);
              document.getElementById("carga-de-versiones").style.display = "";
            } else if (
              version.endsWith("-forge") ||
              version.endsWith("-fabric") ||
              version.endsWith("-quilt")
            ) {
              await launch_core.Launch(opts);
              document.getElementById("carga-de-versiones").style.display = "";
            } else if (version.endsWith("-extra")) {
              launch.launch(opts);
              document.getElementById("carga-de-versiones").style.display = "";
            } else {
              await launch_core.Launch(opts);
              document.getElementById("carga-de-versiones").style.display = "";
            }
          } catch (error) {
            setTimeout(() => {
              playBtn.style.display = "";
              info.style.display = "none";
              progressBar1.style.display = "none";
            }, 3000);
            console.log(error);
          }

          launch.on("extract", (extract) => {
            consoleOutput_ += `[EXTRACT] ${extract}\n`;
            let seMostroInstalando = false;
            if (seMostroInstalando) {
            } else {
              progressText1.innerHTML = langs.extracting_loader;
              logTextArea1.innerHTML = `${langs.extracting_loader}.`;
              updateTextareaScroll();
              seMostroInstalando = true;
            }
          });

          let JSONDownloadShown = false;

          launch_core.on("downloadJSON", (download) => {
            if (!JSONDownloadShown) {
              progressText1.innerHTML = langs.downloading_json_files;
              JSONDownloadShown = true;
            }
            console.log(download)
            consoleOutput_ += `[Descargando información de la versión] ▶️ ${download.file}\n`;
            if (download.type === "info") {
              logTextArea1.innerHTML += `🔃 ${langs.downloading} ${download.file}...\n`;
              updateTextareaScroll();
            } else if(download.type === "success") {
              logTextArea1.innerHTML += `✅ ${download.file} ${langs.downloaded_successfully}.\n`;
              updateTextareaScroll();
            }
          });

          launch.on("debug", (e) => {
            consoleOutput_ += `[ERROR] ${JSON.stringify(e, null, 2)}\n`;
            if (e.includes("Failed to start due to TypeError")) {
              new Alert().ShowAlert({
                icon: "error",
                title: "Error al iniciar Minecraft",
              });
              progressBar1.style.display = "none";
              progressBar1.max = 100;
              progressBar1.value = 0;
              playBtn.style.display = "";
              info.style.display = "none";
              crasheo = true;
            }

            if (e.includes("Downloaded and extracted natives")) {
              progressBar1.style.display = "";
              progressBar1.max = 100;
              progressBar1.value = 0;

              info.innerHTML = langs.downloading_files;
            }

            if (e.includes("Attempting to download Minecraft version jar")) {
              info.innerHTML = langs.downloading_version;
            }

            if (e.includes("Attempting to download assets")) {
              info.innerHTML = langs.downloading_assets;
            }

            if (e.includes("Downloaded Minecraft version jar")) {
              info.innerHTML = langs.downloading_libraries;
            }

            if (e.includes("Downloaded and extracted natives")) {
              info.innerHTML = langs.downloading_natives;
            }

            if (e.includes("Failed to start the minecraft server"))
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );
            if (e.includes('Exception in thread "main" '))
              return ShowPanelError(
                `${langs.error_detected_two} \nError:\n${e}`
              );

            if (
              e.includes(
                "There is insufficient memory for the Java Runtime Environment to continue."
              )
            )
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );
            if (e.includes("Could not reserve enough space for object heap"))
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );

            if (e.includes("Forge patcher exited with code 1")) {
              ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
              progressBar1.style.display = "none";
              info.style.display = "none";
              playBtn.style.display = "";
            }

            if (e.includes("Unable to launch"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (
              e.includes("Minecraft Crash Report") &&
              !e.includes("THIS IS NOT A ERROR")
            )
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );

            if (e.includes("java.lang.ClassCastException"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (e.includes("Minecraft has crashed!"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );
          });

          let progressShown = false;
          launch.on("progress", function (e) {
            if (!progressShown) {
              progressFill1.classList.remove("animated-fill");
              progressShown = true;
            }
            let total = e.total;
            let current = e.task;

            let progress = ((current / total) * 100).toFixed(0);
            let total_ = 100;

            ipcRenderer.send("main-window-progress_", {
              total_,
              progress,
            });

            progressBar1.style.display = "";
            progressFill1.style.width = progress + "%";
          });

          let crasheo = false;

          launch.on("estimated", (time) => {
            ipcRenderer.send("main-window-progress-reset");
            /*
                                    let hours = Math.floor(time / 3600);
                                    let minutes = Math.floor((time - hours * 3600) / 60);
                                    let seconds = Math.floor(time - hours * 3600 - minutes * 60);
                                    console.log(`${hours}h ${minutes}m ${seconds}s`);*/
          });

          let timeoutId;

          launch.on("speed", (speed) => {
            /*
                                                    let velocidad = speed / 1067008;

                                                    if (velocidad > 0) {
                                                        clearTimeout(timeoutId); // cancela el mensaje de alerta si la velocidad no es cero
                                                    } else {
                                                        timeoutId = setTimeout(() => {
                                                            progressBar1.style.display = "none"
                                                            progressBar1.max = 100;
                                                            progressBar1.value = 0;
                                                            playBtn.style.display = ""
                                                            info.style.display = "none"
                                                            clearTimeout(timeoutId);
                                                            const swal  = require('sweetalert');
                                                            crasheo = true;

                                                            new Alert().ShowAlert({
                                                                title: "Error",
                                                                text: "Error al descargar esta versión. Reinicia el launcher o inténtalo de nuevo más tarde. [ERROR: 2]",
                                                                icon: "error",
                                                                button: "Aceptar",
                                                            }).then((value) => {
                                                                if(value) {
                                                                    ipcRenderer.send('restartLauncher')
                                                                }
                                                            });
                                                            
                                                        }, 10000);
                                                    }*/
          });

          launch.on("patch", (patch) => {
            consoleOutput_ += `[INSTALANDO LOADER] ${patch}\n`;
            let seMostroInstalando = false;
            if (seMostroInstalando) {
            } else {
              logTextArea1.innerHTML = `${langs.installing_loader}...\n`;
              seMostroInstalando = true;
            }

            info.innerHTML = `${langs.installing_loader}...`;
          });

          let inicio = false;
          let iniciando = false;
          launch.on("data", async (e) => {
            new logger("Minecraft", "#36b030");
            consoleOutput_ += `[MC] ${e}\n`;
            if (launcherSettings.launcher.close === "close-launcher")
              ipcRenderer.send("main-window-hide");

            if (e.includes("Launching with arguments"))
              info.innerHTML = `${langs.starting_minecraft}...`;

            if (iniciando == false) {
              new Alert().ShowAlert({
                icon: "info",
                title: `${langs.starting_minecraft}...`,
              });
              iniciando = true;
            }

            let serversDat = `${dataDirectory}/.battly/servers.dat`;

            if (fs.existsSync(serversDat)) {
              try {
                const serversDatFile = fs.readFileSync(serversDat);
                const serversDatData = await NBT.read(serversDatFile);

                let servers = this.BattlyConfig.promoted_servers;

                let serversArray = [];

                for (let i = 0; i < servers.length; i++) {
                  const newServer = {
                    name: servers[i].name,
                    ip: servers[i].ip,
                    icon: servers[i].icon,
                  };

                  // Verificar si la IP ya existe en el archivo servers.dat
                  const ipExists = serversDatData.data.servers.some(
                    (server) => server.ip === newServer.ip
                  );

                  if (!ipExists) {
                    serversArray.push(newServer);
                  }
                }

                // Añadir los nuevos servidores al array existente en serversDatData.data.servers
                serversDatData.data.servers = serversArray.concat(
                  serversDatData.data.servers
                );
                const editedServersDat = await NBT.write(serversDatData);
                fs.writeFileSync(serversDat, editedServersDat);
              } catch (error) {
                console.error("Error al procesar el archivo NBT:", error);
              }
            } else {
              try {
                let servers = this.BattlyConfig.promoted_servers;

                let serversArray = [];

                for (let i = 0; i < servers.length; i++) {
                  const newServer = {
                    name: servers[i].name,
                    ip: servers[i].ip,
                    icon: servers[i].icon,
                  };
                  serversArray.push(newServer);
                }

                // Crear un nuevo archivo servers.dat con los servidores nuevos
                const newData = { servers: serversArray };
                const editedServersDat = await NBT.write(newData);
                fs.writeFileSync(serversDat, editedServersDat);
              } catch (error) {
                console.error("Error al crear el nuevo archivo NBT:", error);
              }
            }

            if (e.includes("Failed to start the minecraft server"))
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );
            if (e.includes('Exception in thread "main" '))
              return ShowPanelError(
                `${langs.error_detected_two} \nError:\n${e}`
              );

            if (
              e.includes(
                "There is insufficient memory for the Java Runtime Environment to continue."
              )
            )
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );
            if (e.includes("Could not reserve enough space for object heap"))
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );

            if (e.includes("Forge patcher exited with code 1")) {
              ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
              progressBar1.style.display = "none";
              info.style.display = "none";
              playBtn.style.display = "";
            }

            if (e.includes("Unable to launch"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (
              e.includes("Minecraft Crash Report") &&
              !e.includes("THIS IS NOT A ERROR")
            )
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );

            if (e.includes("java.lang.ClassCastException"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (e.includes("Minecraft has crashed!"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (
              e.includes(`Setting user: ${account.name}`) ||
              e.includes("Launching wrapped minecraft")
            ) {
              if (inicio == false) {
                let typeOfVersion;
                if (version.endsWith("-forge")) {
                  typeOfVersion = "Forge";
                } else if (version_real.endsWith("-fabric")) {
                  typeOfVersion = "Fabric";
                } else if (version_real.endsWith("-quilt")) {
                  typeOfVersion = "Quilt";
                } else {
                  typeOfVersion = "";
                }
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} ${version
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} ${version_real
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );

                modalDiv1.remove();
                inicio = true;
                info.innerHTML = `${langs.minecraft_started_correctly}.`;
                ipcRenderer.send("new-notification", {
                  title: langs.minecraft_started_correctly,
                  body: langs.minecraft_started_correctly_body,
                });

                ipcRenderer.send("main-window-progress-reset");
              }
            }

            if (e.includes("Connecting to")) {
              let msj = e.split("Connecting to ")[1].split("...")[0];
              info.innerHTML = `Conectando a ${msj}`;
            }
          });

          launch.on("close", (code) => {
            consoleOutput_ += `---------- [MC] Código de salida: ${code}\n ----------`;
            if (launcherSettings.launcher.close === "close-launcher")
              ipcRenderer.send("main-window-show");

            ipcRenderer.send("updateStatus", {
              status: "online",
              details: langs.in_the_menu,
              username: account.name,
            });
            info.style.display = "none";
            playBtn.style.display = "";
            info.innerHTML = `Verificando archivos...`;
            new logger("Launcher", "#3e8ed0");
            progressBar1.style.display = "none";
            console.log("🔧 Minecraft cerrado");

            ipcRenderer.send("delete-and-new-status-discord");

            version = null;
            versionType = null;
            versionData = null;
            version_real = null;
            assets = null;
            type = null;
            isForgeCheckBox = false;
            isFabricCheckBox = false;
            isQuiltCheckBox = false;
            document.getElementById("radioVanilla").removeAttribute("checked");
            document.getElementById("radioForge").removeAttribute("checked");
            document.getElementById("radioFabric").removeAttribute("checked");
            document.getElementById("radioQuilt").removeAttribute("checked");
          });

          let seMostroExtrayendo_core = false;
          let seMostroInstalando_core = false;
          

          launch_core.on("extract", (extract) => {
            consoleOutput_ += `[EXTRACT] ${extract}\n`;
            if (seMostroExtrayendo_core) {
              progressText1.innerHTML = langs.extracting_loader;
            } else {
              logTextArea1.innerHTML = `${langs.extracting_loader}.`;
              updateTextareaScroll();
              seMostroExtrayendo_core = true;
            }
          });

          let downloadingFiles_core_shown = false;

          launch_core.on("debug", (e) => {
            if (!downloadingFiles_core_shown) {
              progressText1.innerHTML = langs.downloading_files;
              downloadingFiles_core_shown = true;
            }
            consoleOutput_ += `[MC] ${JSON.stringify(e, null, 2)}\n`;
            if (e.includes("Failed to start due to TypeError")) {
              progressBar1.style.display = "none";
              progressBar1.max = 100;
              progressBar1.value = 0;
              playBtn.style.display = "";
              info.style.display = "none";
              crasheo = true;
            }

            if (e.includes("Downloaded and extracted natives")) {
              progressBar1.style.display = "";
              progressBar1.max = 100;
              progressBar1.value = 0;

              info.innerHTML = langs.downloading_files;
            }

            if (e.includes("Attempting to download Minecraft version jar")) {
              info.innerHTML = langs.downloading_version;
            }

            if (e.includes("Attempting to download assets")) {
              info.innerHTML = langs.downloading_assets;
            }

            if (e.includes("Downloaded Minecraft version jar")) {
              info.innerHTML = langs.downloading_libraries;
            }

            if (e.includes("Downloaded and extracted natives")) {
              info.innerHTML = langs.downloading_natives;
            }

            if (e.includes("Failed to start the minecraft server"))
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );
            if (e.includes('Exception in thread "main" '))
              return ShowPanelError(
                `${langs.error_detected_two} \nError:\n${e}`
              );

            if (
              e.includes(
                "There is insufficient memory for the Java Runtime Environment to continue."
              )
            )
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );
            if (e.includes("Could not reserve enough space for object heap"))
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );

            if (e.includes("Forge patcher exited with code 1")) {
              ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
              progressBar1.style.display = "none";
              info.style.display = "none";
              playBtn.style.display = "";
            }

            if (e.includes("Unable to launch"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (
              e.includes("Minecraft Crash Report") &&
              !e.includes("THIS IS NOT A ERROR")
            )
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );

            if (e.includes("java.lang.ClassCastException"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (e.includes("Minecraft has crashed!"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );
          });
          launch_core.on("data", async (e) => {
            new logger("Minecraft", "#36b030");
            consoleOutput_ += `[MC] ${e}\n`;
            if (launcherSettings.launcher.close === "close-launcher")
              ipcRenderer.send("main-window-hide");
            progressBar1.style.display = "none";

            if (e.includes("Launching with arguments"))
              info.innerHTML = `${langs.starting_minecraft}...`;

            if (iniciando == false) {
              iniciando = true;

              let serversDat = `${dataDirectory}/.battly/servers.dat`;

              if (fs.existsSync(serversDat)) {
                try {
                  const serversDatFile = fs.readFileSync(serversDat);
                  const serversDatData = await NBT.read(serversDatFile);

                  let servers = this.BattlyConfig.promoted_servers;

                  let serversArray = [];

                  for (let i = 0; i < servers.length; i++) {
                    const newServer = {
                      name: servers[i].name,
                      ip: servers[i].ip,
                      icon: servers[i].icon,
                    };

                    // Verificar si la IP ya existe en el archivo servers.dat
                    const ipExists = serversDatData.data.servers.some(
                      (server) => server.ip === newServer.ip
                    );

                    if (!ipExists) {
                      serversArray.push(newServer);
                    }
                  }

                  // Añadir los nuevos servidores al array existente en serversDatData.data.servers
                  serversDatData.data.servers = serversArray.concat(
                    serversDatData.data.servers
                  );
                  const editedServersDat = await NBT.write(serversDatData);
                  fs.writeFileSync(serversDat, editedServersDat);
                } catch (error) {
                  console.error("Error al procesar el archivo NBT:", error);
                }
              } else {
                try {
                  let servers = this.BattlyConfig.promoted_servers;

                  let serversArray = [];

                  for (let i = 0; i < servers.length; i++) {
                    const newServer = {
                      name: servers[i].name,
                      ip: servers[i].ip,
                      icon: servers[i].icon,
                    };
                    serversArray.push(newServer);
                  }

                  // Crear un nuevo archivo servers.dat con los servidores nuevos
                  const newData = { servers: serversArray };
                  const editedServersDat = await NBT.write(newData);
                  fs.writeFileSync(serversDat, editedServersDat);
                } catch (error) {
                  console.error("Error al crear el nuevo archivo NBT:", error);
                }
              }
            }

            if (e.includes("Failed to start the minecraft server"))
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );
            if (e.includes('Exception in thread "main" '))
              return ShowPanelError(
                `${langs.error_detected_two} \nError:\n${e}`
              );

            if (
              e.includes(
                "There is insufficient memory for the Java Runtime Environment to continue."
              )
            )
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );
            if (e.includes("Could not reserve enough space for object heap"))
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );

            if (e.includes("Forge patcher exited with code 1")) {
              ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
              progressBar1.style.display = "none";
              info.style.display = "none";
              playBtn.style.display = "";
            }

            if (e.includes("Unable to launch"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (
              e.includes("Minecraft Crash Report") &&
              !e.includes("THIS IS NOT A ERROR")
            )
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );

            if (e.includes("java.lang.ClassCastException"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (e.includes("Minecraft has crashed!"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (
              e.includes(`Setting user: ${account.name}`) ||
              e.includes("Launching wrapped minecraft")
            ) {
              if (inicio == false) {
                let typeOfVersion;
                if (version_real.endsWith("-forge")) {
                  typeOfVersion = "Forge";
                } else if (version_real.endsWith("-fabric")) {
                  typeOfVersion = "Fabric";
                } else if (version_real.endsWith("-quilt")) {
                  typeOfVersion = "Quilt";
                } else {
                  typeOfVersion = "";
                }
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} ${version_real
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} ${version_real
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );

                modalDiv1.remove();
                inicio = true;
                info.innerHTML = `${langs.minecraft_started_correctly}.`;
                ipcRenderer.send("new-notification", {
                  title: langs.minecraft_started_correctly,
                  body: langs.minecraft_started_correctly_body,
                });

                ipcRenderer.send("main-window-progress-reset");
              }
            }
          });

          let lastProgreso = -1;

          let progresoShown = false;
          launch_core.on("progress", (progress, size) => {
            if (!progresoShown) {
              progressFill1.classList.remove("animated-fill");
              progressText1.innerHTML = langs.downloading_version;
              progresoShown = true;
            }
            let progreso = ((progress / size) * 100).toFixed(0);
            if (progreso > 100) {
              progreso = 100;
            }

            if (progreso != lastProgreso) {
              logTextArea1.innerHTML += `\n${langs.downloading_version}... ${progreso}%`;
              lastProgreso = progreso;
            } else {
            }

            consoleOutput_ += `[DESCARGANDO] ${progress} / ${size}\n`;
            updateTextareaScroll();
            ipcRenderer.send("main-window-progress", {
              progress,
              size,
            });
            if (!isNaN(progress)) {
              // Solo asignar progressBar1.value si progress es un número
              progressFill1.style.width = `${((progress / size) * 100).toFixed(0)}%`;
            }
          });
          launch_core.on("check", (progress, size) => {
            let progreso = ((progress / size) * 100).toFixed(0);
            if (progreso > 100) {
              progreso = 100;
            }

            if (progreso != lastProgreso) {
              logTextArea1.innerHTML += `🔃 ${langs.downloading}... ${progreso}%\n`;
              lastProgreso = progreso;
              updateTextareaScroll();
            } else {
            }

            consoleOutput_ += `[INSTALANDO MC] ${progress} / ${size}\n`;
            let seMostroInstalando = false;
            if (seMostroInstalando) {
              progressText1.innerHTML = langs.installing_loader;
            } else {
              seMostroInstalando = true;
            }
            progressBar1.style.display = "";
            let size_actual = 100;
            let progress_actual = ((progress / size) * 100).toFixed(0);
            ipcRenderer.send("main-window-progress", {
              progress_actual,
              size_actual,
            });
            
            progressFill1.style.width = `${((progress / size) * 100).toFixed(0)}%`;
          });

          let estimatedTime = `- ${langs.calculating_time}...`;

          launch_core.on("estimated", (time) => {
            ipcRenderer.send("main-window-progress-reset");

            if (isNaN(time) || !isFinite(time)) {
              estimatedTime = `- ${langs.estimated_time_not_available}`;
            } else {
              let hours = Math.floor(time / 3600);
              let minutes = Math.floor((time - hours * 3600) / 60);
              let seconds = Math.floor(time - hours * 3600 - minutes * 60);

              if (hours > 0) {
                estimatedTime =
                  hours > 1
                    ? `- ${langs.remaining} ${hours}h`
                    : `- ${langs.remaining_two} ${hours}h`;
              } else if (minutes > 0) {
                estimatedTime =
                  minutes > 1
                    ? `- ${langs.remaining} ${minutes}m`
                    : `- ${langs.remaining_two} ${minutes}m`;
              } else {
                estimatedTime =
                  seconds > 1
                    ? `- ${langs.remaining} ${seconds}s`
                    : `- ${langs.remaining_two} ${seconds}s`;
              }
            }
          });

          launch_core.on("speed", (speed) => {
            let velocidad = speed / 1067008;

            info.innerHTML = `🔃 ${langs.downloading}... (${velocidad.toFixed(2)} MB/s) - ${estimatedTime}`;
            /*
                        
                                                    if (velocidad > 0) {
                                                        clearTimeout(timeoutId); // cancela el mensaje de alerta si la velocidad no es cero
                                                    } else {
                                                        timeoutId = setTimeout(() => {
                                                            progressBar1.style.display = "none"
                                                            progressBar1.max = 100;
                                                            progressBar1.value = 0;
                                                            playBtn.style.display = ""
                                                            info.style.display = "none"
                                                            clearTimeout(timeoutId);
                                                            const swal  = require('sweetalert');
                                                            crasheo = true;
                        
                                                            new Alert().ShowAlert({
                                                                title: "Error",
                                                                text: "Error al descargar esta versión. Reinicia el launcher o inténtalo de nuevo más tarde. [ERROR: 2]",
                                                                icon: "error",
                                                                button: "Aceptar",
                                                            }).then((value) => {
                                                                if(value) {
                                                                    ipcRenderer.send('restartLauncher')
                                                                }
                                                            });
                                                            
                                                        }, 10000);
                                                    }*/
          });

          launch_core.on("patch", (patch) => {
            logTextArea1.innerHTML += `🔃 ${langs.extracting_loader}... [${patch}]\n`;
            updateTextareaScroll();
            consoleOutput_ += `[INSTAL. LOADER] ${patch}\n`;
          });

          launch_core.on("data", async (e) => {
            new logger("Minecraft", "#36b030");
            consoleOutput_ += `[MC] ${e}\n`;
            if (launcherSettings.launcher.close === "close-launcher")
              ipcRenderer.send("main-window-hide");
            progressBar1.style.display = "none";

            if (e.includes("Launching with arguments"))
              info.innerHTML = `${langs.starting_minecraft}...`;

            if (iniciando == false) {
              new Alert().ShowAlert({
                icon: "info",
                title: `${langs.starting_minecraft}...`,
              });
              iniciando = true;

              let serversDat = `${dataDirectory}/.battly/servers.dat`;

              if (fs.existsSync(serversDat)) {
                try {
                  const serversDatFile = fs.readFileSync(serversDat);
                  const serversDatData = await NBT.read(serversDatFile);

                  let servers = this.BattlyConfig.promoted_servers;

                  let serversArray = [];

                  for (let i = 0; i < servers.length; i++) {
                    const newServer = {
                      name: servers[i].name,
                      ip: servers[i].ip,
                      icon: servers[i].icon,
                    };

                    // Verificar si la IP ya existe en el archivo servers.dat
                    const ipExists = serversDatData.data.servers.some(
                      (server) => server.ip === newServer.ip
                    );

                    if (!ipExists) {
                      serversArray.push(newServer);
                    }
                  }

                  // Añadir los nuevos servidores al array existente en serversDatData.data.servers
                  serversDatData.data.servers = serversArray.concat(
                    serversDatData.data.servers
                  );
                  const editedServersDat = await NBT.write(serversDatData);
                  fs.writeFileSync(serversDat, editedServersDat);
                } catch (error) {
                  console.error("Error al procesar el archivo NBT:", error);
                }
              } else {
                try {
                  let servers = this.BattlyConfig.promoted_servers;

                  let serversArray = [];

                  for (let i = 0; i < servers.length; i++) {
                    const newServer = {
                      name: servers[i].name,
                      ip: servers[i].ip,
                      icon: servers[i].icon,
                    };
                    serversArray.push(newServer);
                  }

                  // Crear un nuevo archivo servers.dat con los servidores nuevos
                  const newData = { servers: serversArray };
                  const editedServersDat = await NBT.write(newData);
                  fs.writeFileSync(serversDat, editedServersDat);
                } catch (error) {
                  console.error("Error al crear el nuevo archivo NBT:", error);
                }
              }
            }

            if (e.includes("Failed to start the minecraft server"))
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );
            if (e.includes('Exception in thread "main" '))
              return ShowPanelError(
                `${langs.error_detected_two} \nError:\n${e}`
              );

            if (
              e.includes(
                "There is insufficient memory for the Java Runtime Environment to continue."
              )
            )
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );
            if (e.includes("Could not reserve enough space for object heap"))
              return ShowPanelError(
                `${langs.error_detected_three} \nError:\n${e}`
              );

            if (e.includes("Forge patcher exited with code 1")) {
              ShowPanelError(`${langs.error_detected_four} \nError:\n${e}`);
              progressBar1.style.display = "none";
              info.style.display = "none";
              playBtn.style.display = "";
            }

            if (e.includes("Unable to launch"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (
              e.includes("Minecraft Crash Report") &&
              !e.includes("THIS IS NOT A ERROR")
            )
              return ShowPanelError(
                `${langs.error_detected_one} \nError:\n${e}`
              );

            if (e.includes("java.lang.ClassCastException"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (e.includes("Minecraft has crashed!"))
              return ShowPanelError(
                `${langs.error_detected_five} \nError:\n${e}`
              );

            if (
              e.includes(`Setting user: ${account.name}`) ||
              e.includes("Launching wrapped minecraft")
            ) {
              if (inicio == false) {
                let typeOfVersion;
                if (version.endsWith("-forge")) {
                  typeOfVersion = "Forge";
                } else if (version.endsWith("-fabric")) {
                  typeOfVersion = "Fabric";
                } else if (version.endsWith("-quilt")) {
                  typeOfVersion = "Quilt";
                } else {
                  typeOfVersion = "";
                }
                ipcRenderer.send(
                  "new-status-discord-jugando",
                  `${langs.playing_in} ${version
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );

                this.UpdateStatus(
                  account.name,
                  "ausente",
                  `${langs.playing_in} ${version_real
                    .replace("-forge", "")
                    .replace("-fabric", "")
                    .replace("-quilt", "")} ${typeOfVersion}`
                );
                modalDiv1.remove();
                inicio = true;
                info.innerHTML = `${langs.minecraft_started_correctly}.`;
                ipcRenderer.send("new-notification", {
                  title: langs.minecraft_started_correctly,
                  body: langs.minecraft_started_correctly_body,
                });

                ipcRenderer.send("main-window-progress-reset");
              }
            }

            if (e.includes("Connecting to")) {
              let msj = e.split("Connecting to ")[1].split("...")[0];
              info.innerHTML = `Conectando a ${msj}`;
            }
          });

          launch_core.on("close", (code) => {
            consoleOutput_ += `---------- [MC] Código de salida: ${code}\n ----------`;
            modalDiv1.remove();
            if (launcherSettings.launcher.close === "close-launcher")
              ipcRenderer.send("main-window-show");

            ipcRenderer.send("updateStatus", {
              status: "online",
              details: langs.in_the_menu,
              username: account.name,
            });
            progressBar1.style.display = "none";
            info.style.display = "none";
            playBtn.style.display = "";
            info.innerHTML = `Verificando archivos...`;
            new logger("Launcher", "#3e8ed0");
            console.log("🔧 Minecraft cerrado");

            progressBar1.style.display = "none";
            ipcRenderer.send("delete-and-new-status-discord");

            version = null;
            versionType = null;
            versionData = null;
            version_real = null;
            assets = null;
            type = null;
            isForgeCheckBox = false;
            isFabricCheckBox = false;
            isQuiltCheckBox = false;
            document.getElementById("radioVanilla").removeAttribute("checked");
            document.getElementById("radioForge").removeAttribute("checked");
            document.getElementById("radioFabric").removeAttribute("checked");
            document.getElementById("radioQuilt").removeAttribute("checked");
          });

          launch_core.on("error", (err) => {
            consoleOutput_ += `[ERROR] ${JSON.stringify(err, null, 2)}\n`;
          });
        });
      });
  }

  async initStatusServer() {
    let APIServerData = document.getElementById("Battly_API_Desc");
    let WEBServerData = document.getElementById("Battly_WEB_Desc");
    let APIServerStatus = document.getElementById("Battly_API_Estado");
    let WEBServerStatus = document.getElementById("Battly_WEB_Estado");
    let miembrosEnLinea = document.getElementById("Miembros_Online");

    let APIServer = "https://api.battlylauncher.com";
    let WEBServer = "https://battlylauncher.com";
    let APIMembers = `${APIServer}/battlylauncher/usuarios_online`;

    const https = require("https");
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const axios = require("axios");
    await axios
      .get(APIServer, {
        httpsAgent,
      })
      .then((res) => {
        if (res.status === 200) {
          APIServerData.innerHTML = `<span class="green">${langs.operative}</span>`;
          APIServerStatus.className = "online";
        } else {
          APIServerData.innerHTML = `<span class="red">${langs.no_connected}</span>`;
          APIServerStatus.className = "online off";
        }
      })
      .catch((err) => {
        APIServerData.innerHTML = `<span class="red">${langs.no_connected}</span>`;
        APIServerStatus.className = "online off";
      });

    await axios
      .get(WEBServer, {
        httpsAgent,
      })
      .then((res) => {
        if (res.status === 200) {
          WEBServerData.innerHTML = `<span class="green">${langs.operative}</span>`;
          WEBServerStatus.className = "online";
        } else {
          WEBServerData.innerHTML = `<span class="red">${langs.no_connected}</span>`;
          WEBServerStatus.className = "online off";
        }
      })
      .catch((err) => {
        WEBServerData.innerHTML = `<span class="red">${langs.no_connected}</span>`;
        WEBServerStatus.className = "online off";
      });

    await axios
      .get(APIMembers, {
        httpsAgent,
      })
      .then((res) => {
        if (res.status === 200) {
          miembrosEnLinea.innerHTML = `${res.data.usuarios} ${langs.users_online}`;
        }
      })
      .catch((err) => {
        miembrosEnLinea.innerHTML = "0";
      });
  }

  initBtn() {
    document.getElementById("settings-btn").addEventListener("click", () => {
      changePanel("settings");
    });
  }

  async getdate(e) {
    let date = new Date(e);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let allMonth = [
      langs.january,
      langs.february,
      langs.march,
      langs.april,
      langs.may,
      langs.june,
      langs.july,
      langs.august,
      langs.september,
      langs.october,
      langs.november,
      langs.december,
    ];
    return {
      year: year,
      month: allMonth[month - 1],
      day: day,
    };
  }
}
export default Home;
