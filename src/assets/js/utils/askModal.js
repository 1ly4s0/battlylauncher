"use strict";

let isAnimating = false;
let alertQueue = [];

class AskModal {
    constructor() { }

    async ask({ title, text = '', html = '', showCancelButton = true, confirmButtonText = 'Confirmar', cancelButtonText = 'Cancelar', preConfirm, acceptButtonType, rejectButtonType, showButtons = true }) {
        return new Promise((resolve, reject) => {
            const modalDiv = document.createElement("div");
            modalDiv.classList.add("modal", "is-active");
            modalDiv.style.zIndex = "99999999";
            modalDiv.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-card modal-animated" style="border-radius: 15px;">
                <section class="modal-card-body" style="background-color: #101726;">
                    <div class="content">
                        <h2 class="title" style="color: #fff;">${title}</h2>
                        <p class="subtitle" style="color: #fff;">${text}</p>
                        ${html}
                        <p class="validation-message" style="color: red; margin-top: 10px;"></p>
                    </div>
                </section>
                <footer class="modal-card-foot"
                    style="background-color: #0f1623; display: ${showButtons ? "flex" : "none"}; justify-content: flex-end;">
                    <button class="button ${acceptButtonType ?? "is-danger"} is-outlined confirm-btn">${confirmButtonText}</button>
                    ${showCancelButton ? `<button class="button ${rejectButtonType ?? "is-info"} is-outlined cancel-btn">${cancelButtonText}</button>` : ""}
                </footer>
            </div>`;

            document.body.appendChild(modalDiv);

            const confirmBtn = modalDiv.querySelector(".confirm-btn");
            const cancelBtn = modalDiv.querySelector(".cancel-btn");
            const validationMessage = modalDiv.querySelector(".validation-message");

            const close = () => {
                document.body.removeChild(modalDiv);
            };

            confirmBtn.addEventListener("click", async () => {
                try {
                    if (typeof preConfirm === "function") {
                        const result = await preConfirm();
                        if (result === false) return;
                        close();
                        resolve(result);
                    } else {
                        close();
                        resolve(true);
                    }
                } catch (err) {
                    validationMessage.textContent = err.message || 'Error en la validación';
                }
            });

            if (cancelBtn) {
                cancelBtn.addEventListener("click", () => {
                    close();
                    reject("cancelled");
                });
            }
        });
    }
}

export { AskModal };
