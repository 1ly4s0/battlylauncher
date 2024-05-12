/**
 * @author TECNO BROS
 
 */

const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { shell } = require("electron");
import { Lang } from "./lang.js";

let lang;

class CrashReport {
    async ShowCrashReport(error) {
        lang = await new Lang().GetLang();
        let audioError = new Audio("./assets/audios/error.mp3");
        audioError.play();

        ipcRenderer.send("new-notification", {
            title: lang["notification_crash_report_title"],
            body: lang["notification_crash_report_text"]
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
        errorP.textContent = lang["thats_a_error_message"];
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
        cardTitleP.textContent = lang["error_found"];
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
        closeButton.textContent = lang["close"];
        closeButton.addEventListener("click", () => {
            modalDiv.remove();
        });

        const checkSolution = document.createElement("button");
        checkSolution.className = "button is-primary";
        checkSolution.addEventListener("click", () => {
            let solucionEncontrada = false;
            const modal = document.createElement("div");
            modal.classList.add("modal", "is-active");
            modal.style.zIndex = "4";

            // Crear el fondo del modal
            const modalBackground = document.createElement("div");
            modalBackground.classList.add("modal-background");

            // Crear la tarjeta del modal
            const modalCard = document.createElement("div");
            modalCard.classList.add("modal-card");
            modalCard.style.backgroundColor = "#212121";
            modalCard.style.borderRadius = "5px";

            // Crear el cuerpo de la tarjeta del modal
            const modalCardBody = document.createElement("section");
            modalCardBody.classList.add("modal-card-body");
            modalCardBody.style.backgroundColor = "#212121";
            modalCardBody.style.textAlign = "center";

            // Crear la imagen
            const image = document.createElement("img");
            image.src = "./assets/images/icons/loading.gif";
            image.style.width = "70px";
            image.style.height = "70px";
            image.style.margin = "0 auto";
            image.alt = "";

            // Crear el párrafo
            const paragraph = document.createElement("p");
            paragraph.style.color = "#fff";
            paragraph.style.fontSize = "20px";
            paragraph.innerText = lang["searching_solution"];

            // Agregar la imagen y el párrafo al cuerpo de la tarjeta del modal
            modalCardBody.appendChild(image);
            modalCardBody.appendChild(paragraph);

            // Agregar el cuerpo de la tarjeta al modal
            modalCard.appendChild(modalCardBody);

            // Agregar el fondo del modal y la tarjeta del modal al modal
            modal.appendChild(modalBackground);
            modal.appendChild(modalCard);

            // Agregar el modal al documento body
            document.body.appendChild(modal);

            const actualLang = localStorage.getItem("lang");

            let possibleErrors;

            fetch(`https://api.battlylauncher.com/battlylauncher/api/v1/solutions/${actualLang}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        paragraph.innerHTML = `<span style='font-size: 16px;'>${lang["no_solution_found"]}</span>`;

                        const closeButton = document.createElement("button");
                        closeButton.className = "button is-danger";
                        closeButton.textContent = lang["close"];

                        closeButton.addEventListener("click", () => {
                            modal.remove();
                        });
                        return;
                    }

                    if (data.status === 404) {
                        paragraph.innerHTML = `<span style='font-size: 16px;'>${lang["no_solution_found"]}</span>`;

                        const closeButton = document.createElement("button");
                        closeButton.className = "button is-danger";
                        closeButton.textContent = lang["close"];

                        closeButton.addEventListener("click", () => {
                            modal.remove();
                        });
                        return;
                    }

                    possibleErrors = data.possibleErrors;
                    console.log(possibleErrors);
                    for (let solution of possibleErrors) {
                        if (error.includes(solution.error)) {
                            solucionEncontrada = true;

                            modalCardBody.innerHTML = "";

                            const finded = document.createElement("i");
                            finded.classList.add("fa-solid", "fa-check-circle");
                            finded.style.fontSize = "20px";
                            finded.style.color = "#00c4a7";

                            const findedText = document.createElement("h1");
                            findedText.style.color = "#fff";
                            findedText.style.fontSize = "20px";
                            findedText.style.fontWeight = "700";
                            findedText.innerText = lang["solution_found"];

                            modalCardBody.appendChild(finded);
                            modalCardBody.appendChild(findedText);



                            setTimeout(() => {
                                const sparkles = document.createElement("i");
                                sparkles.classList.add("fa-solid", "fa-wand-magic-sparkles");
                                sparkles.style.fontSize = "20px";
                                sparkles.style.color = "#00c4a7";

                                const BattlyAutoFix = document.createElement("h1");
                                BattlyAutoFix.style.color = "#fff";
                                BattlyAutoFix.style.fontSize = "20px";
                                BattlyAutoFix.style.fontWeight = "700";
                                BattlyAutoFix.innerHTML = `Battly <span style="color: #3e8ed0">AutoFix</span>`;

                                const errorTitle = document.createElement("h1");
                                errorTitle.style.color = "#fff";
                                errorTitle.style.fontSize = "27px";
                                errorTitle.style.fontWeight = "700";
                                errorTitle.innerText = solution.name;
                    
                                const errorParagraph = document.createElement("p");
                                errorParagraph.style.color = "#fff";
                                errorParagraph.style.fontSize = "16px";
                                errorParagraph.innerText = solution.solution;

                                const closeButton = document.createElement("button");
                                closeButton.className = "button is-danger";
                                closeButton.textContent = lang["close"];
                                closeButton.addEventListener("click", () => {
                                    modal.remove();
                                });

                                const lineBreak = document.createElement("br");

                                modalCardBody.innerHTML = "";

                                modalCardBody.appendChild(sparkles);
                                modalCardBody.appendChild(BattlyAutoFix);
                                modalCardBody.appendChild(lineBreak);
                                modalCardBody.appendChild(lineBreak);
                                modalCardBody.appendChild(errorTitle);
                                modalCardBody.appendChild(errorParagraph);
                                modalCardBody.appendChild(lineBreak);
                                modalCardBody.appendChild(closeButton);
                            }, 2000);
                        }
                    }
                });
        

            setTimeout(() => {
                if (!solucionEncontrada) {
                    paragraph.innerHTML += `<br><span style='font-size: 16px;'>${lang["searching_solution_taking_1"]}</span>`;
                }
            }, 10000);

            setTimeout(() => {
                if (!solucionEncontrada) {
                    paragraph.innerHTML += `<br><span style='font-size: 16px;'>${lang["searching_solution_taking_2"]}</span>`;
                }
            }, 20000);

            setTimeout(() => {
                if (!solucionEncontrada) {
                    paragraph.innerHTML += `<br><br><span style='font-size: 16px;'>${lang["searching_solution_taking_3"]}</span>`;
                    
                    const closeButton = document.createElement("button");
                    closeButton.className = "button is-danger";
                    closeButton.textContent = lang["close"];

                    closeButton.addEventListener("click", () => {
                        modal.remove();
                    });

                    modalCardBody.appendChild(closeButton);
                }
            }, 30000);
          
        });
        checkSolution.innerHTML = '<span><i class="fa-solid fa-wand-magic-sparkles"></i> ' + lang["find_solution"] + '</span>';

        //boton de guardar logs, mostrará un dialogo para guardar los logs en un archivo de texto, abrirá el explorador de archivos y se podrá guardar donde quiera
        const saveLogsButton = document.createElement("button");
        saveLogsButton.className = "button is-info";
        saveLogsButton.textContent = lang["save_logs"];
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

        footerDiv.appendChild(checkSolution);
        footerDiv.appendChild(saveLogsButton);
        footerDiv.appendChild(discordBtn);
        footerDiv.appendChild(closeButton);
        // Agregar saltos de línea al final del código
        modalDiv.appendChild(document.createElement("br"));

        // Agregar el div principal al cuerpo del documento
        document.body.appendChild(modalDiv);
    }
}

export { CrashReport };