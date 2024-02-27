/**
 * @author TECNO BROS
 
 */

const { app, ipcMain, protocol, BrowserWindow, shell, ipcRenderer } = require('electron');
const { Microsoft } = require('./assets/js/libs/mc/Index');
const { autoUpdater } = require('electron-updater')
const { io } = require("socket.io-client");
const socket = io("http://api.battlylauncher.com");
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const fs = require('fs');
const path = require('path');
const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)
const { Notification } = require("electron");
app.setAppUserModelId("Battly Launcher");
let dev = process.env.NODE_ENV === 'dev';

if(!fs.existsSync(path.join(dataDirectory, '.battly'))) fs.mkdirSync(path.join(dataDirectory, '.battly'));

socket.on("connect", () => {
});


socket.on('notificacion', async (data) => {
    const { titulo, descripcion, url } = data;

    let notification;

    if (process.platform === 'win32') {
        notification = new Notification({
        toastXml: `
        <toast>
            <visual>
                <binding template="ToastGeneric">
                    <text>${titulo}</text>
                    <text>${descripcion}</text>
                </binding>
            </visual>
            <actions>
                <action
                    content="Abrir"
                    arguments="${url}"
                    activationType="protocol" />
            </actions>
        </toast>`
        });
    } else {
        notification = new Notification({
            title: titulo,
            body: descripcion,
            icon: path.join(__dirname, '/assets/images/icon.png')
        });
    }

    notification.show();

    notification.on('click', (event, arg) => {
        shell.openExternal(`${url}`);
    });
})

socket.on('solicitudAmistad', async (data) => {
    const { username } = data;


    let notification;

    if (process.platform === 'win32') {
        notification = new Notification({
            toastXml: `
        <toast>
            <visual>
                <binding template="ToastGeneric">
                    <text>Solicitud de amistad</text>
                    <text>${username} te ha enviado una solicitud de amistad.</text>
                </binding>
            </visual>
            <actions>
                <action
                    content="Aceptar"
                    arguments="${username}"
                    activationType="protocol" />
                <action
                    content="Rechazar"
                    arguments="${username}"
                    activationType="protocol" />
            </actions>
        </toast>`
        });
    } else {
        notification = new Notification({
            title: "Solicitud de amistad",
            body: `${username} te ha enviado una solicitud de amistad.`,
            icon: path.join(__dirname, '/assets/images/icon.png'),
            actions: [
                { type: 'button', text: 'Aceptar', },
                { type: 'button', text: 'Rechazar', }
            ]
        });
    }

    notification.show();

    notification.on('action', (event, arg) => {
        const window = MainWindow.getWindow();
        window.webContents.send('cargarSolicitudAmistad', { username });
    });
});

ipcMain.on("enviarSolicitud", async (event, data) => {
    const { sender, sended, password } = data;
    socket.emit('enviarSolicitud', {
        username: sender,
        amigo: sended,
        password: password
    })
});


ipcMain.on("socket", async (i, event, data) => {
    socket.emit(event, data);
});

socket.on("onlineUsers", (data) => {
    const window = MainWindow.getWindow();
    window.webContents.send('onlineUsers', data);
});

let shown = false;

socket.on('getLogs', async (data) => {
    if (shown) {
        const RegistroLog = fs.readFileSync(`${dataDirectory}/.battly/Registro.log`, 'utf8');
        const window = MainWindow.getWindow();
        window.webContents.send('getLogsAnterior', { RegistroLog });
        setTimeout(() => {
            socket.emit('sendLogs', RegistroLog);
        }, 3000);
    } else {
        const { user, razon } = data;
        const window = MainWindow.getWindow();
        window.webContents.send('avisoObtenerLogs', { user, razon });
    }
});

ipcMain.on('obtenerLogs', async (event, data) => {
    const RegistroLog = fs.readFileSync(`${dataDirectory}/.battly/Registro.log`, 'utf8');
    socket.emit('sendLogs', RegistroLog);
    shown = true;
});

ipcMain.on('obtenerSocketID', async (event, data) => {
    const sessionID = socket.id;
    const window = MainWindow.getWindow();
    window.webContents.send('enviarSocketID', { sessionID });
});

ipcMain.on('updateStatus', async (event, data) => {
    socket.emit('updateStatus', data);
});

ipcMain.on('obtener-solicitudes', async (event, data) => {
    socket.emit('mostrarSolicitudes', data);
});

socket.on("mostrarSolicitudes", (data) => {
    const window = MainWindow.getWindow();
    window.webContents.send('solicitudes', data);
});

ipcMain.on('aceptar-solicitud', async (event, data) => {
    socket.emit('aceptarSolicitud', data);
});

ipcMain.on('rechazar-solicitud', async (event, data) => {
    socket.emit('rechazarSolicitud', data);
});

ipcMain.on("obtener-amigos", async (event, data) => {
    socket.emit('obtenerAmigos', data);
});

socket.on("obtenerAmigos", (data) => {
    const window = MainWindow.getWindow();
    window.webContents.send('amigos', data);
});

if (!dev) {
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('battly', process.execPath, [path.resolve(process.argv[1])])
            app.setAsDefaultProtocolClient('battlylauncher', process.execPath, [path.resolve(process.argv[1])])
        }
    } else {
        app.setAsDefaultProtocolClient('battly')
        app.setAsDefaultProtocolClient('battlylauncher')
    }
}

const UpdateWindow = require("./assets/js/windows/updateWindow.js");
const MainWindow = require("./assets/js/windows/mainWindow.js");

if (dev) {
    let appPath = path.resolve('./AppData/Launcher').replace(/\\/g, '/');
    if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
    app.setPath('userData', appPath);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.whenReady().then(() => {
        UpdateWindow.createWindow();
    });
}

process.on('uncaughtException', (error) => {
    console.log(error);
});

process.on('unhandledRejection', (error) => {
    console.log(error);
});

ipcMain.on('update-window-close', () => UpdateWindow.destroyWindow())
ipcMain.on('update-window-dev-tools', () => UpdateWindow.getWindow().webContents.openDevTools())
ipcMain.on('main-window-open', () => MainWindow.createWindow())
ipcMain.on('main-window-dev-tools', () => MainWindow.getWindow().webContents.openDevTools())
ipcMain.on('main-window-close', () => MainWindow.destroyWindow())
ipcMain.on('main-window-progress_', (progress_actual, size_actual) => {
    MainWindow.getWindow().setProgressBar(parseInt(size_actual.progress) / parseInt(100));
})
ipcMain.on('main-window-progress', (progress_actual, size_actual) => {
    MainWindow.getWindow().setProgressBar(parseInt(size_actual.progress_actual) / parseInt(size_actual.size_actual));
})

ipcMain.on('main-window-progress-loading', () => {
    MainWindow.getWindow().setProgressBar(2);
})

ipcMain.on('main-window-progress-reset', () => {
    MainWindow.getWindow().setProgressBar(-1);
})
ipcMain.on('main-window-minimize', () => MainWindow.getWindow().minimize())

ipcMain.on('main-window-maximize', () => {
    if (MainWindow.getWindow().isMaximized()) {
        MainWindow.getWindow().unmaximize();
    } else {
        MainWindow.getWindow().maximize();
    }
})

ipcMain.on('main-window-hide', () => MainWindow.getWindow().hide())
ipcMain.on('main-window-show', () => MainWindow.getWindow().show())

ipcMain.handle('Microsoft-window', async (event, client_id) => {
    return await new Microsoft(client_id).getAuth();
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('restartLauncher', () => {
    app.relaunch();
    app.exit();
});

let songPlaying;
ipcMain.on('set-song', async (info, song) => {
    if (song) {
        ipcMain.emit('get-song', song);
    }
});


let startedAppTime = Date.now();

const rpc = require('./assets/js/libs/discord/index');
const { platform } = require('os');
let client = new rpc.Client({ transport: 'ipc' });

ipcMain.on('new-status-discord', async () => {
    client.login({ clientId: '917866962523152404' });
    client.on('ready', () => {
        client.request('SET_ACTIVITY', {
            pid: process.pid,
            activity: {
                details: 'En el menú de inicio',
                assets: {
                    large_image: 'battly_512',
                    large_text: 'Battly Launcher',
                },
                buttons: [
                    { label: '👥 Discord', url: "https://discord.gg/tecno-bros-885235460178342009" },
                    { label: '⏬ Descargar', url: "https://battlylauncher.com" }
                ],
                instance: false,
                timestamps: {
                    start: startedAppTime
                }
            },
        }).catch(error => { });
    });
});


ipcMain.on('new-status-discord-jugando', async (event, status) => {
    if (status.endsWith('-forge')) {
        status = status.replace('-forge', '');
        status = `${status} - Forge`;
    } else if (status.endsWith('-fabric')) {
        status = status.replace('-fabric', '');
        status = `${status} - Fabric`;
    } else {
        status = `${status}`;
    }

    if (client) await client.destroy();
    client = new rpc.Client({ transport: 'ipc' });
    client.login({ clientId: '917866962523152404' });
    client.on('ready', () => {
        client.request('SET_ACTIVITY', {
            pid: process.pid,
            activity: {
                details: status,
                assets: {
                    large_image: 'battly_512',
                    small_image: 'mc_512',
                    small_text: 'Minecraft',
                    large_text: 'Battly Launcher',
                },
                buttons: [
                    { label: '👥 Discord', url: "https://discord.gg/tecno-bros-885235460178342009" },
                    { label: '⏬ Descargar', url: "https://battlylauncher.com" }
                ],
                instance: false,
                timestamps: {
                    start: startedAppTime
                }
            },
        }).catch(error => { });
    });
});



ipcMain.on('new-notification', async (event, info) => {
    new Notification({
        title: info.title,
        body: info.body,
        icon: path.join(__dirname, '/assets/images/icon.png')
    }).show();
});

ipcMain.on('delete-and-new-status-discord', async () => {
    if (client) client.destroy();
    client = new rpc.Client({ transport: 'ipc' });
    client.login({ clientId: '917866962523152404' });
    client.on('ready', () => {
        client.request('SET_ACTIVITY', {
            pid: process.pid,
            activity: {
                details: 'En el menú de inicio',
                assets: {
                    large_image: 'battly_512',
                    large_text: 'Battly Launcher',
                },
                buttons: [
                    { label: '👥 Discord', url: "https://discord.gg/tecno-bros-885235460178342009" },
                    { label: '⏬ Descargar', url: "https://battlylauncher.com" }
                ],
                instance: false,
                timestamps: {
                    start: startedAppTime
                }
            },
        }).catch(error => { });
    });
});

ipcMain.on('delete-status-discord', async () => {
    if (client) client.destroy();
});

autoUpdater.autoDownload = false;

ipcMain.handle('update-app', () => {
    return new Promise(async (resolve, reject) => {
        autoUpdater.checkForUpdates().then(() => {
            resolve();
        }).catch(error => {
            console.log(error);
            resolve({
                error: true,
                message: error
            })
        })
    })
})

autoUpdater.on('update-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('updateAvailable');
});

ipcMain.on('start-update', () => {
    autoUpdater.downloadUpdate();
})

autoUpdater.on('update-not-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('update-not-available');
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progress) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('download-progress', progress);
})