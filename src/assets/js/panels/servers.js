/**
 * @author TECNO BROS
 
 */

"use strict";

import { logger, database, changePanel } from "../utils.js";

const { ipcRenderer } = require("electron");
const pkg = require("../package.json");
const fs = require("fs");
const https = require("https");
const { Launch, Mojang } = require("./assets/js/libs/mc/Index");

import { LoadAPI } from "../utils/loadAPI.js";
let thiss;

const dataDirectory =
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? `${process.env.HOME}/Library/Application Support`
    : process.env.HOME);

class Servers {
  static id = "servers";
  async init(config, news) {
    this.config = config;
    this.database = await new database().init();
    this.VersionsMojang = await new LoadAPI().GetVersionsMojang();
    thiss = this;
    this.FirstLoad();
  }

  async FirstLoad() {
    if (!fs.existsSync(`${dataDirectory}/.battly/servers/servers.json`)) {
      fs.writeFileSync(`${dataDirectory}/.battly/servers/servers.json`, "[]");
      const domainInput = document.getElementById("domainInput");
      const serverIP = document.getElementById("serverIP");
      const warningMessage = document.getElementById("warningMessage");
      const forbiddenWords = ["api", "server", "oficial", "battly"];
      const versionSelectServers = document.getElementById(
        "versionSelectServers"
      );

      for (let i = 0; i < this.VersionsMojang.versions.length; i++) {
        const option = document.createElement("option");
        option.value = this.VersionsMojang.versions[i].id;
        option.text = this.VersionsMojang.versions[i].id;
        versionSelectServers.appendChild(option);
      }

      document.getElementById("servers-btn").addEventListener("click", () => {
        changePanel("servers");

        setTimeout(() => {
          domainInput.addEventListener("input", function () {
            const domain = domainInput.value;
            const containsForbiddenWord = forbiddenWords.some((word) =>
              domain.includes(word)
            );

            if (domain.length >= 3 && !containsForbiddenWord) {
              serverIP.textContent = domain + ".battly.pro";
              warningMessage.style.display = "none";
            } else if (domain === "") {
              serverIP.textContent = "dominio.battly.pro";
              warningMessage.style.display = "none";
            } else {
              warningMessage.style.display = "block";
              if (containsForbiddenWord) {
                warningMessage.textContent =
                  "¡Dominio no permitido! No puede contener palabras como " +
                  forbiddenWords.join(", ") +
                  ".";
              } else {
                warningMessage.textContent =
                  "¡Dominio no permitido! Debe tener al menos 3 caracteres.";
              }
            }
          });

          setTimeout(() => {
            document.querySelector(".fullscreen-text").classList.add("scaleup");
          }, 2000);

          setTimeout(() => {
            document.querySelector(".fullscreen-text").classList.add("fadeout");
          }, 7000);

          setTimeout(() => {
            document.querySelector(".fullscreen-text").style.display = "none";
            document.querySelector(".panel-container").style.display = "flex";
            document
              .querySelector(".panel-container")
              .classList.add("animate__zoomIn");
          }, 500);
        }, 1000);
      });

      document.getElementById("create-server").addEventListener("click", () => {
        document.querySelector(".panel-container-creating").style.display =
          "flex";
        document.querySelector(".panel-container").style.display = "none";
        const DownloadServerStatusPanel = document.getElementById(
          "download-server-status-panel"
        );

        let domain = domainInput.value;
        let version = versionSelectServers.value;
        let realVersion = versionSelectServers.value;

        for (let i = 0; i < this.VersionsMojang.versions.length; i++) {
          if (this.VersionsMojang.versions[i].id === version) {
            version = this.VersionsMojang.versions[i].url;
          }
        }

        let neccesaryJava;

        fetch(version)
          .then((response) => response.json())
          .then(async (data) => {
            let file = data.downloads.server.url;
            neccesaryJava = data.javaVersion.component;

            let serverName = domain;
            let serverIP = domain + ".battly.pro";
            let serverPort = 25565;

            fs.mkdirSync(`${dataDirectory}/.battly/servers/${serverName}`, {
              recursive: true,
            });

            //descargar el server
            const fileStream = fs.createWriteStream(
              `${dataDirectory}/.battly/servers/${serverName}/server.jar`
            );

            fs.mkdirSync(
              `${dataDirectory}/.battly/servers/${serverName}/java`,
              {
                recursive: true,
              }
            );

            async function DownloadJAR() {
              return new Promise((resolve, reject) => {
                https
                  .get(file, function (response) {
                    const totalSize = parseInt(
                      response.headers["content-length"],
                      10
                    );
                    let downloadedSize = 0;

                    const downloadStatusServer = document.createElement("div");
                    downloadStatusServer.classList.add(
                      "download-status-server"
                    );
                    const whatisdownloading = document.createElement("p");
                    whatisdownloading.classList.add("whatisdownloading");
                    whatisdownloading.textContent = "Descargando archivos";
                    const percentajewhatisloading = document.createElement("p");
                    const spanStatus = document.createElement("span");
                    const spanIcon = document.createElement("span");

                    percentajewhatisloading.classList.add(
                      "percentajewhatisloading"
                    );
                    percentajewhatisloading.appendChild(spanStatus);
                    percentajewhatisloading.appendChild(spanIcon);
                    spanStatus.innerHTML = `0% `;
                    spanIcon.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i>`;
                    downloadStatusServer.appendChild(whatisdownloading);
                    downloadStatusServer.appendChild(percentajewhatisloading);

                    DownloadServerStatusPanel.appendChild(downloadStatusServer);

                    response.on("data", (chunk) => {
                      downloadedSize += chunk.length;
                      const percentage = Math.round(
                        (downloadedSize / totalSize) * 100
                      );
                      spanStatus.innerHTML = `${percentage}% `;
                    });

                    response.pipe(fileStream);

                    fileStream.on("finish", function () {
                      fileStream.close();
                      spanStatus.innerHTML = `100% `;
                      spanIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
                      resolve();
                    });

                    fileStream.on("error", function (err) {
                      console.error("Download error:", err);
                      reject(err);
                    });
                  })
                  .on("error", function (err) {
                    console.error("Request error:", err);
                    reject(err);
                  });
              });
            }

            async function DownloadJava() {
              await fetch(
                "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json"
              )
                .then((response) => response.json())
                .then(async (data) => {
                  let file = data["windows-x64"][neccesaryJava][0].manifest.url;
                  if (process.arch === "ia32") {
                    file = data["windows-x86"][neccesaryJava][0].manifest.url;
                  }

                  const downloadStatusServer = document.createElement("div");
                  downloadStatusServer.classList.add("download-status-server");
                  const whatisdownloading = document.createElement("p");
                  whatisdownloading.classList.add("whatisdownloading");
                  whatisdownloading.textContent = "Descargando Java";
                  const percentajewhatisloading = document.createElement("p");
                  const spanStatus = document.createElement("span");
                  const spanIcon = document.createElement("span");

                  percentajewhatisloading.classList.add(
                    "percentajewhatisloading"
                  );
                  percentajewhatisloading.appendChild(spanStatus);
                  percentajewhatisloading.appendChild(spanIcon);
                  spanStatus.innerHTML = `0% `;
                  spanIcon.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i>`;
                  downloadStatusServer.appendChild(whatisdownloading);
                  downloadStatusServer.appendChild(percentajewhatisloading);

                  DownloadServerStatusPanel.appendChild(downloadStatusServer);

                  if (
                    !fs.existsSync(`${dataDirectory}/.battly/${serverName}`)
                  ) {
                    await fs.mkdirSync(
                      `${dataDirectory}/.battly/${serverName}`,
                      {
                        recursive: true,
                      }
                    );
                  } else if (
                    !fs.existsSync(
                      `${dataDirectory}/.battly/servers/${serverName}/java`
                    )
                  ) {
                    await fs.mkdirSync(
                      `${dataDirectory}/.battly/servers/${serverName}/java`,
                      {
                        recursive: true,
                      }
                    );
                  }

                  await fetch(file)
                    .then((response) => response.json())
                    .then(async (data) => {
                      let totalFiles = Object.keys(data.files).length;
                      let actualFiles = 0;
                      for (let fileName in data.files) {
                        let file = data.files[fileName];

                        if (file.type === "directory") {
                          fs.mkdirSync(
                            `${dataDirectory}/.battly/servers/${serverName}/java/${fileName}`,
                            { recursive: true }
                          );
                          actualFiles++;
                        } else if (file.type === "file") {
                          const fileUrl = file.downloads.raw.url;
                          const fileStream = fs.createWriteStream(
                            `${dataDirectory}/.battly/servers/${serverName}/java/${fileName}`
                          );

                          await new Promise((resolve, reject) => {
                            https
                              .get(fileUrl, function (response) {
                                response.pipe(fileStream);

                                fileStream.on("finish", function () {
                                  fileStream.close();
                                  actualFiles++;
                                  spanStatus.innerHTML = `${Math.round(
                                    (actualFiles / totalFiles) * 100
                                  )}% `;

                                  if (actualFiles === totalFiles) {
                                    spanStatus.innerHTML = `100% `;
                                    spanIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
                                  }
                                  resolve();
                                });

                                fileStream.on("error", function (err) {
                                  console.error("Download error:", err);
                                  reject(err);
                                });
                              })
                              .on("error", function (err) {
                                console.error("Request error:", err);
                                reject(err);
                              });
                          });
                        }
                      }
                    });
                });
            }

            let Servers = [
              {
                name: serverName,
                ip: serverIP,
                version: realVersion,
              },
            ];

            if (
              fs.existsSync(`${dataDirectory}/.battly/servers/servers.json`)
            ) {
              Servers = JSON.parse(
                fs.readFileSync(
                  `${dataDirectory}/.battly/servers/servers.json`,
                  "utf8"
                )
              );
              Servers.push({
                name: serverName,
                ip: serverIP,
                version: realVersion,
              });
            }

            fs.writeFileSync(
              `${dataDirectory}/.battly/servers/servers.json`,
              JSON.stringify(Servers)
            );

            // Llamar a las funciones y esperar a que terminen
            await DownloadJAR();
            await DownloadJava();

            fs.writeFileSync(
              `${dataDirectory}/.battly/servers/${serverName}/eula.txt`,
              "eula=true"
            );

            //ejecutar el server
            const { spawn } = require("child_process");
            const bat = spawn(
              `${dataDirectory}/.battly/servers/${serverName}/java/bin/java.exe`,
              [
                `-javaagent:${dataDirectory}/.battly/authlib-injector.jar=api.battlylauncher.com`,
                "-jar",
                `${dataDirectory}/.battly/servers/${serverName}/server.jar`,
                "nogui",
              ],
              { cwd: `${dataDirectory}/.battly/servers/${serverName}` }
            );

            let LaunchOrNot = confirm("¿Quieres abrir Minecraft?");

            if (LaunchOrNot) LaunchMinecraft();
            async function LaunchMinecraft() {
              let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
              let uuid = (await thiss.database.get("1234", "accounts-selected"))
                .value;
              let account = thiss.database
                .getAccounts()
                .find((account) => account.uuid === uuid.selected);
              let ram = (await thiss.database.get("1234", "ram")).value;
              let Resolution = (await thiss.database.get("1234", "screen"))
                .value;
              let launcherSettings = (
                await thiss.database.get("1234", "launcher")
              ).value;

              let launch = new Launch();
              let opts = {
                url:
                  thiss.config.game_url === "" ||
                    thiss.config.game_url === undefined
                    ? `${urlpkg}/files`
                    : thiss.config.game_url,
                authenticator: account,
                detached: true,
                timeout: 10000,
                path: `${dataDirectory}/.battly`,
                downloadFileMultiple: 40,
                version: versionSelectServers.value,
                verify: false,
                ignored: ["loader"],
                java: false,
                memory: {
                  min: `${ram.ramMin * 1024}M`,
                  max: `${ram.ramMax * 1024}M`,
                },
                JVM_ARGS: [
                  "-javaagent:authlib-injector.jar=https://api.battlylauncher.com",
                  "-Dauthlibinjector.mojangAntiFeatures=enabled",
                  "-Dauthlibinjector.noShowServerName",
                  "-Dauthlibinjector.disableHttpd",
                ],
                GAME_ARGS: ["-server", "localhost"],
              };

              launch.Launch(opts);

              launch.on("data", (data) => {
                console.log(data);
              });

              launch.on("error", (error) => {
                console.log(error);
              });

              launch.on("exit", (code) => {
                console.log(`Child exited with code ${code}`);
              });
            }

            bat.stdout.on("data", (data) => {
              console.log(data.toString());
            });

            bat.stderr.on("data", (data) => {
              console.log(data.toString());
            });

            bat.on("exit", (code) => {
              console.log(`Child exited with code ${code}`);
            });
          });
      });
    } else {
      document.getElementById("servers-btn").addEventListener("click", () => {
        changePanel("servers");
        let Servers = JSON.parse(
          fs.readFileSync(
            `${dataDirectory}/.battly/servers/servers.json`,
            "utf8"
          )
        );

        let server = Servers[0];
        console.log(server);

        document.querySelector(".servers-main-panel").style.display = "block";
        document.querySelector(
          ".servers-principal-panel-content-server-header-title"
        ).innerHTML = server.name;
        document.querySelector(
          ".servers-principal-panel-content-server-header-subtitle"
        ).innerHTML = server.ip;

        let buttons = document.querySelectorAll(
          ".servers-principal-panel-content-server-left-bar button"
        );
        let servers = document.querySelectorAll(
          ".servers-principal-panel-content-server"
        );

        buttons.forEach((button, index) => {
          button.addEventListener("click", () => {
            servers.forEach((server) => {
              server.classList.add("inactive");
              server.classList.remove("active");
            });
            servers[index].classList.remove("inactive");
            servers[index].classList.add("active");
            console.log(index);

            let host = "0.0.0.0";
            let port = 25565;
            if (index === 1) {
              const util = require("minecraft-server-util");
              util
                .status(host, port)
                .then((response) => {
                  const players = response.players.sample || [];

                  let playersHTML = document.querySelector(
                    ".servers-principal-panel-content-server-content-players-players"
                  );

                  playersHTML.innerHTML = "";

                  players.forEach((player) => {
                    let playerHTML = document.createElement("div");
                    playerHTML.classList.add(
                      "servers-principal-panel-content-server-content-players-players-player"
                    );
                    let img = document.createElement("div");
                    img.classList.add("account-image");
                    img.classList.add("mc-face-viewer-6x");
                    img.style.backgroundImage = `url('https://api.battlylauncher.com/api/skin/${player.name}')`;
                    let playerData = document.createElement("div");
                    playerData.classList.add(
                      "servers-principal-panel-content-server-content-players-players-player-data"
                    );
                    let playerName = document.createElement("p");
                    playerName.classList.add(
                      "servers-principal-panel-content-server-content-players-players-player-data-name"
                    );
                    playerName.textContent = player.name;
                    let playerID = document.createElement("p");
                    playerID.textContent = player.id;
                    let copy = document.createElement("i");
                    copy.classList.add("fa-solid");
                    copy.classList.add("fa-copy");
                    playerID.appendChild(copy);
                    let controlButtons = document.createElement("div");
                    controlButtons.classList.add(
                      "servers-principal-panel-content-server-content-players-players-player-control-buttons"
                    );
                    let banButton = document.createElement("button");
                    banButton.classList.add("button");
                    banButton.classList.add("is-danger");
                    banButton.classList.add("is-small");
                    let banIcon = document.createElement("i");
                    banIcon.classList.add("fa-solid");
                    banIcon.classList.add("fa-ban");
                    banButton.appendChild(banIcon);
                    let muteButton = document.createElement("button");
                    muteButton.classList.add("button");
                    muteButton.classList.add("is-warning");
                    muteButton.classList.add("is-small");
                    let muteIcon = document.createElement("i");
                    muteIcon.classList.add("fa-solid");
                    muteIcon.classList.add("fa-user-slash");
                    muteButton.appendChild(muteIcon);

                    controlButtons.appendChild(banButton);
                    controlButtons.appendChild(muteButton);
                    playerData.appendChild(playerName);
                    playerData.appendChild(playerID);
                    playerHTML.appendChild(img);
                    playerHTML.appendChild(playerData);
                    playerHTML.appendChild(controlButtons);
                    playersHTML.appendChild(playerHTML);

                    copy.addEventListener("click", () => {
                      navigator.clipboard.writeText(player.id);
                    });
                  });
                })
                .catch((error) => {
                  /* crear un div con el error */
                  console.error(error);

                  let playersHTML = document.querySelector(
                    ".servers-principal-panel-content-server-content-players-players"
                  );

                  playersHTML.innerHTML = "";

                  let errorHTML = document.createElement("div");
                  errorHTML.classList.add(
                    "servers-principal-panel-content-server-content-players-players-player"
                  );
                  let errorData = document.createElement("div");
                  errorData.classList.add(
                    "servers-principal-panel-content-server-content-players-players-player-data"
                  );
                  let errorText = document.createElement("p");
                  errorText.textContent = "No hay jugadores conectados";
                  errorData.appendChild(errorText);
                  errorHTML.appendChild(errorData);
                  playersHTML.appendChild(errorHTML);

                  console.error("No hay jugadores conectados");
                });
            }
          });
        });

        servers.forEach((server) => {
          server.classList.add("inactive");
        });

        servers[0].classList.remove("inactive");
        let startServerButton = document.getElementById("start-server-button");
        let serverStatusPanel = document.getElementById("server-status-panel");
        let serverStatusText = document.getElementById("server-status-text");
        let connectToServerButton = document.getElementById(
          "connect-to-server-button"
        );
        let stopServerButton = document.getElementById("stop-server-button");

        startServerButton.addEventListener("click", () => {
          startServerButton.classList.remove("is-success");
          startServerButton.classList.add("is-warning");
          startServerButton.classList.add("is-loading");
          startServerButton.disabled = true;

          serverStatusText.innerHTML = "Iniciando servidor...";
          serverStatusPanel.style.backgroundColor = "#FFA500";

          const { spawn } = require("child_process");
          const bat = spawn(
            `${dataDirectory}/.battly/servers/${server.name}/java/bin/java.exe`,
            [
              `-javaagent:${dataDirectory}/.battly/authlib-injector.jar=api.battlylauncher.com`,
              "-jar",
              `${dataDirectory}/.battly/servers/${server.name}/server.jar`,
              "nogui",
            ],
            { cwd: `${dataDirectory}/.battly/servers/${server.name}` }
          );

          bat.stdout.on("data", (data) => {
            document.getElementById("server-logs").innerHTML += data.toString();

            if (data.toString().includes("Done")) {
              startServerButton.classList.remove("is-loading");
              startServerButton.classList.remove("is-warning");
              startServerButton.classList.add("is-success");
              startServerButton.style.display = "none";
              stopServerButton.style.display = "";
              serverStatusText.innerHTML = "Servidor iniciado";
              serverStatusPanel.style.backgroundColor = "#48c78e";

              setTimeout(() => {
                stopServerButton.disabled = false;
                connectToServerButton.classList.remove("is-warning");
                connectToServerButton.classList.add("is-success");

                connectToServerButton.disabled = false;

                stopServerButton.addEventListener("click", (e) => {
                  stopServerButton.classList.remove("is-danger");
                  stopServerButton.classList.add("is-warning");
                  stopServerButton.classList.add("is-loading");
                  stopServerButton.disabled = true;

                  serverStatusText.innerHTML = "Apagando servidor...";
                  serverStatusPanel.style.backgroundColor = "#FFA500";

                  const { exec } = require("child_process");
                  exec(
                    `taskkill /F /PID ${bat.pid}`,
                    (error, stdout, stderr) => {
                      if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                      }

                      serverStatusText.innerHTML = "Servidor apagado";
                      serverStatusPanel.style.backgroundColor = "#f14668";
                      stopServerButton.classList.remove("is-loading");
                      stopServerButton.classList.remove("is-warning");
                      stopServerButton.classList.add("is-danger");
                      stopServerButton.style.display = "none";
                      startServerButton.style.display = "";
                      startServerButton.disabled = false;
                      connectToServerButton.classList.remove("is-success");
                      connectToServerButton.classList.add("is-link");
                      connectToServerButton.disabled = true;
                      connectToServerButton.innerHTML =
                        "Conectarme al servidor";
                    }
                  );
                });
              }, 3000);
            }
          });

          bat.stderr.on("data", (data) => {
            document.getElementById("server-logs").innerHTML += data.toString();
          });

          bat.on("exit", (code) => {
            console.log(`Child exited with code ${code}`);
          });
        });

        connectToServerButton.addEventListener("click", async () => {
          connectToServerButton.classList.remove("is-success");
          connectToServerButton.classList.add("is-warning");
          connectToServerButton.classList.add("is-loading");
          connectToServerButton.disabled = true;

          connectToServerButton.innerHTML = "Iniciando Minecraft...";

          let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
          let uuid = (await thiss.database.get("1234", "accounts-selected"))
            .value;
          console.log(uuid);
          let account = thiss.database
            .getAccounts()
            .find((account) => account.uuid === uuid.selected);
          let ram = (await thiss.database.get("1234", "ram")).value;

          let launch = new Launch();
          let opts = {
            url:
              thiss.config.game_url === "" ||
                thiss.config.game_url === undefined
                ? `${urlpkg}/files`
                : thiss.config.game_url,
            authenticator: account,
            detached: true,
            timeout: 10000,
            path: `${dataDirectory}/.battly`,
            downloadFileMultiple: 40,
            version: server.version,
            verify: false,
            ignored: ["loader"],
            java: false,
            memory: {
              min: `${ram.ramMin * 1024}M`,
              max: `${ram.ramMax * 1024}M`,
            },
            JVM_ARGS: [
              "-javaagent:authlib-injector.jar=https://api.battlylauncher.com",
              "-Dauthlibinjector.mojangAntiFeatures=enabled",
              "-Dauthlibinjector.noShowServerName",
              "-Dauthlibinjector.disableHttpd",
            ],
            GAME_ARGS: ["-server", "localhost"],
          };

          launch.Launch(opts);

          launch.on("data", (data) => {
            if (data.includes("Setting user:")) {
              connectToServerButton.classList.remove("is-loading");
              connectToServerButton.classList.remove("is-warning");
              connectToServerButton.classList.add("is-success");
              connectToServerButton.innerHTML = "Iniciado";
            }
          });

          launch.on("error", (error) => {
            console.log(error);
          });

          launch.on("exit", (code) => {
            console.log(`Child exited with code ${code}`);
          });
        });
      });
    }
  }
}
export default Servers;
