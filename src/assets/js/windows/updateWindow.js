/**
 * @author TECNO BROS
 
 */

"use strict";
const electron = require("electron");
const path = require("path");
const os = require("os");
let updateWindow = undefined;

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
            devTools: false
        },
    });

    


    electron.Menu.setApplicationMenu(null);
    updateWindow.setMenuBarVisibility(false);
        updateWindow.loadFile(path.join(electron.app.getAppPath(), 'src', 'index.html'));
        updateWindow.once('ready-to-show', () => {
            if (updateWindow) {
                //updateWindow.openDevTools();
            }
        });
}

module.exports = {
    getWindow,
    createWindow,
    destroyWindow,
};