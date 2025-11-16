/**
 * @author TECNO BROS
 
 */

"use strict";
const electron = require("electron");
const { ipcMain, BrowserView } = require("electron");
const path = require("path");
const os = require("os");
let updateWindow = undefined;
let updatePanelWindow = undefined;
let dev = process.env.NODE_ENV === "dev";

function getWindow() {
    return updateWindow;
}

function destroyWindow() {
    if (!updateWindow) return;
    updateWindow.close();
    updateWindow = undefined;
}

async function createWindow() {
    destroyWindow();
    updateWindow = new electron.BrowserWindow({
        title: "Iniciando Battly",
        width: 400,
        height: 500,
        resizable: false,
        icon: `./src/assets/images/icon.${os.platform() === "win32" ? "ico" : "png"}`,
        transparent: os.platform() === 'win32',
        frame: false,
        show: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            devTools: true
        },
    });

    electron.Menu.setApplicationMenu(null);
    updateWindow.setMenuBarVisibility(false);
    updateWindow.loadFile(path.join(electron.app.getAppPath(), 'src', 'index.html'));
    updateWindow.once('ready-to-show', () => {
        if (updateWindow) {
            if (dev) {
                updateWindow.openDevTools();
            }
        }
    });

    ipcMain.on("start-new-update", () => {

        updateWindow.close();

        updatePanelWindow = new electron.BrowserWindow({
            title: "Iniciando Battly",
            width: 800,
            height: 500,
            resizable: false,
            icon: `./src/assets/images/icon.${os.platform() === "win32" ? "ico" : "png"}`,
            transparent: os.platform() === 'win32',
            frame: false,
            show: true,
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
                devTools: true
            },
        });



        updatePanelWindow.setMenuBarVisibility(false);
        updatePanelWindow.loadFile(path.join(electron.app.getAppPath(), 'src', 'update.html'));
        updatePanelWindow.once('ready-to-show', () => {
            if (updatePanelWindow) {
                //updatePanelWindow.openDevTools();
            }
        });
    });
}

module.exports = {
    getWindow,
    createWindow,
    destroyWindow,
};