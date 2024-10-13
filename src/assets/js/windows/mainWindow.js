/**
 * @author TECNO BROS
 */

"use strict";
const electron = require("electron");
const path = require("path");
const os = require("os");
const pkg = require("../../../../package.json");
let mainWindow = undefined;
let notificationWindow = undefined;
let selectLangWindow = undefined;
const { app, net, protocol } = require("electron");
const { ipcMain } = require("electron");

function getWindow() {
  return mainWindow;
}

function destroyWindow() {
  if (!mainWindow) return;
  mainWindow.close();
  mainWindow = undefined;
}

async function createWindow() {
  destroyWindow();
  mainWindow = new electron.BrowserWindow({
    title: pkg.productname,
    width: 1280,
    height: 720,
    minWidth: 980,
    minHeight: 552,
    resizable: true,
    icon: `./src/assets/images/icon.${os.platform() === "win32" ? "ico" : "png"
      }`,
    frame: os.platform() === "win32" ? false : true,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: true,
    },
  });

  notificationWindow = new electron.BrowserWindow({
    title: pkg.productname,
    width: 350,
    height: 200,
    minWidth: 200,
    minHeight: 100,
    resizable: false,
    x: electron.screen.getPrimaryDisplay().workAreaSize.width - 370,
    y: electron.screen.getPrimaryDisplay().workAreaSize.height - 220,
    icon: `./src/assets/images/icon.${os.platform() === "win32" ? "ico" : "png"
      }`,
    transparent: true,
    frame: false,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: false,
    },
  });

  selectLangWindow = new electron.BrowserWindow({
    title: pkg.productname,
    width: 853,
    height: 480,
    minWidth: 853,
    minHeight: 480,
    resizable: true,
    icon: `./src/assets/images/icon.${os.platform() === "win32" ? "ico" : "png"
      }`,
    transparent: true,
    frame: false,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: false,
    },
  });

  notificationWindow.setSkipTaskbar(true);

  notificationWindow.loadFile(
    path.join(electron.app.getAppPath(), "src", "panels", "music-small.html")
  );

  notificationWindow.hide();

  mainWindow.loadFile(
    path.join(electron.app.getAppPath(), "src", "launcher.html")
  );

  electron.Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  let lang;
  mainWindow.once("ready-to-show", () => {
    mainWindow.webContents
      .executeJavaScript("localStorage.getItem('lang')")
      .then((result) => {
        lang = result;
        if (
          lang === null ||
          lang === undefined ||
          lang === "" ||
          lang === "null"
        ) {
          selectLangWindow.loadFile(
            path.join(
              electron.app.getAppPath(),
              "src",
              "panels",
              "select-lang.html"
            )
          );
          selectLangWindow.once("ready-to-show", () => {
            if (selectLangWindow) {
              //selectLangWindow.openDevTools();
              selectLangWindow.show();
            }
          });
        } else {
          if (mainWindow) {
            //mainWindow.openDevTools();
            mainWindow.show();
          }
        }
      })
      .catch((error) => {
        console.error("Error al ejecutar JavaScript:", error);
      });
  });

  let musicPlayed = false;
  ipcMain.on("set-song", () => {
    musicPlayed = true;
  });

  notificationWindow.once("ready-to-show", () => {
    if (notificationWindow) {
      //notificationWindow.openDevTools();
      notificationWindow.show();
    }
  });

  mainWindow.once("minimize", () => {
    // Mostrar la ventana de notificación después de un retraso mínimo
    if (mainWindow) {
      if (musicPlayed) {
        setTimeout(() => {
          notificationWindow.show();
        }, 100);
      }
    }
  });

  mainWindow.once("restore", () => {
    // Ocultar la ventana de notificación
    if (notificationWindow) {
      notificationWindow.hide();
    }
  });

  mainWindow.on("close", () => {
    process.exit(0);
  });

  ipcMain.on("closed", () => {
    if (notificationWindow) {
      notificationWindow.close();
      notificationWindow = undefined;
    }
  });

  ipcMain.on("main-window-hide", () => {
    if (mainWindow) {
      if (musicPlayed) {
        notificationWindow.show();
      }
    }
  });

  ipcMain.on("main-window-show", () => {
    if (mainWindow) {
      notificationWindow.hide();
    }
  });

  ipcMain.on("get-song", (song) => {
    notificationWindow.webContents.send("get-song-test", song);
  });

  ipcMain.on("play--song", () => {
    notificationWindow.webContents.send("play-song");
  });

  ipcMain.on("pause--song", () => {
    notificationWindow.webContents.send("pause-song");
  });

  ipcMain.on("play-pause", () => {
    mainWindow.webContents.send("play-pause");
  });

  ipcMain.on("next", () => {
    mainWindow.webContents.send("next");
    ipcMain.send("next");
  });

  ipcMain.on("prev", () => {
    mainWindow.webContents.send("prev");
    ipcMain.send("prev");
  });

  ipcMain.on("change-lang", (event, lang) => {
    selectLangWindow.close();
    app.relaunch();
    app.exit();
  });
}

module.exports = {
  getWindow,
  createWindow,
  destroyWindow,
};
