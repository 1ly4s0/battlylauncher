/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
const path = require('path');
const { app, BrowserWindow, session } = require('electron');
const defaultProperties = {
    width: 1000,
    height: 650,
    resizable: false,
    center: true,
    icon: path.join(__dirname, '../../../assets/icons', `Microsoft.${(process.platform === 'win32') ? 'ico' : 'png'}`),
};
module.exports = async function (url) {
    await new Promise((resolve) => {
        app.whenReady().then(() => {
            session.defaultSession.cookies.get({ domain: 'live.com' }).then((cookies) => {
                for (let cookie of cookies) {
                    let urlcookie = `http${cookie.secure ? "s" : ""}://${cookie.domain.replace(/$\./, "") + cookie.path}`;
                    session.defaultSession.cookies.remove(urlcookie, cookie.name);
                }
            });
            return resolve();
        });
    });
    return new Promise(resolve => {
        app.whenReady().then(() => {
            const mainWindow = new BrowserWindow(defaultProperties);
            mainWindow.setMenu(null);
            mainWindow.loadURL(url);
            var loading = false;
            mainWindow.on("close", () => {
                if (!loading)
                    resolve("cancel");
            });
            mainWindow.webContents.on("did-finish-load", () => {
                const loc = mainWindow.webContents.getURL();
                if (loc.startsWith("https://login.live.com/oauth20_desktop.srf")) {
                    const urlParams = new URLSearchParams(loc.substr(loc.indexOf("?") + 1)).get("code");
                    if (urlParams) {
                        resolve(urlParams);
                        loading = true;
                    }
                    else {
                        resolve("cancel");
                    }
                    try {
                        mainWindow.close();
                    }
                    catch {
                        console.error("Failed to close window!");
                    }
                }
            });
        });
    });
};
