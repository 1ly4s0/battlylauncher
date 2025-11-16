"use strict";

// Configuración SSL para desarrollo - ignorar certificados autofirmados
if (process.env.NODE_ENV === "dev") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const {
  app,
  ipcMain,
  protocol,
  BrowserWindow,
  shell,
  screen,
} = require("electron");
const { Worker } = require("worker_threads");
const { Microsoft } = require("./assets/js/libs/mc");
const { autoUpdater } = require("electron-updater");
const { io } = require("socket.io-client");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { Notification, Menu, Tray } = require("electron");
const notifier = require("node-notifier");
const Store = require("electron-store");
const store = new Store({ name: "battly-data" });

let dev = process.env.NODE_ENV === "dev";
app.setAppUserModelId("Battly Launcher");

// Importar Analytics
const BattlyAnalytics = require("./assets/js/libs/battly-analytics.js");
let analytics = null;

const dataDirectory =
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? `${process.env.HOME}/Library/Application Support`
    : process.env.HOME);

if (!fs.existsSync(path.join(dataDirectory, ".battly")))
  fs.mkdirSync(path.join(dataDirectory, ".battly"));

let tray = null;
let isPlaying = false;
let selectedAccount = store.get("accounts")?.find((a => a.uuid === store.get("selected-account"))) || null;

const SOCKET_URL = "https://api.battlylauncher.com";

let sessionId = store.get("socket.sessionId") || null;
let heartbeatInterval = null;

let socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["polling", "websocket"], // Polling primero para evitar errores
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  auth: {
    token: selectedAccount?.token || null,
    sessionId: sessionId || null,
    client: "battly-launcher",
    version: app.getVersion(),
  },
});

function startHeartbeat() {

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected && selectedAccount) {
      console.log("💓 Enviando heartbeat...");
      socket.emit("updateStatus-v3", { status: "online" });
    }
  }, 30000);

}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function connectSocketIfReady() {
  if (!socket.connected) socket.connect();
}

function replaceSocket() {
  stopHeartbeat();
  try {
    if (socket && socket.connected) socket.disconnect();
  } catch (_) { }
  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    auth: () => ({
      token: selectedAccount?.token || null,
      sessionId: sessionId || null,
      client: "battly-launcher",
      version: app.getVersion(),
    }),
  });
  bindSocketEvents();
  connectSocketIfReady();
}

function bindSocketEvents() {

  // Limpiar listeners anteriores

  socket.on("connect", () => {
    console.log("✅ Conectado a Socket.IO");
    socket.emit("session-handshake-v3");
    startHeartbeat();

  });

  socket.on("session-v3", (payload) => {
    if (payload?.sessionId) {
      sessionId = payload.sessionId;
      store.set("socket.sessionId", sessionId);
      console.log("✅ Sesión recibida:", sessionId);

      if (selectedAccount) {
        socket.emit("updateStatus-v3", { status: "online" });
      }
    }
  });
  socket.on("disconnect", (reason) => {
    console.log("⚠️ Desconectado de Socket.IO:", reason);
    stopHeartbeat();

    if (reason === "io server disconnect") {

      console.log("🔄 Servidor desconectó, esperando...");
      setTimeout(() => {
        if (!socket.connected) {
          socket.connect();
        }
      }, 5000);
    }
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Error de conexión Socket.IO:", err?.message || err);
    stopHeartbeat();

  });

  socket.on("notificacion-v3", async (data) => {
    const { titulo, descripcion, url: openUrl } = data || {};
    notifier.notify(
      {
        title: titulo || "Battly",
        message: descripcion || "",
        icon: path.join(__dirname, "/assets/images/icon.png"),
        sound: true,
        wait: true,
        actions: ["Abrir"],
        appID: "Battly Launcher",
      },
      function (_err, response, metadata) {
        if (metadata?.activationType === "Abrir" && openUrl) {
          shell.openExternal(openUrl);
        }
      }
    );
  });

  socket.on("applyTheme-v3", (data) => {
    const window = MainWindow.getWindow();
    if (window) window.webContents.send("applyTheme", data);
  });

  socket.on("onlineUsers-v3", (data) => {
    const window = MainWindow.getWindow();
    if (window) window.webContents.send("onlineUsers", data);
  });

  socket.on("obtenerUsuariosPremium-v3", (data) => {
    const window = MainWindow.getWindow();
    if (window) window.webContents.send("obtenerUsuariosPremium", data);
  });

  socket.on("getLogs-v3", async (data) => {
    const window = MainWindow.getWindow();
    const RegistroLog = fs.readFileSync(
      `${dataDirectory}/.battly/Registro.log`,
      "utf8"
    );

    if (data?.shown) {
      window.webContents.send("getLogsAnterior", { RegistroLog });
      const logsB64 = Buffer.from(RegistroLog).toString("base64");
      socket.emit("sendLogs-v3", { logs: logsB64 });
    } else {
      const { user, razon } = data || {};
      window.webContents.send("avisoObtenerLogs", { user, razon });
    }
  });

  socket.on("server-invite-v3", (data) => {
    console.log("📨 Invitación de servidor recibida:", data);
    const window = MainWindow.getWindow();
    if (window) {
      window.webContents.send("server-invite-received", data);
    }
  });
}
bindSocketEvents();

// Inicializar sistema de analytics
async function initializeAnalytics() {
  try {
    const accounts = store.get("accounts") || [];
    const selectedUuid = store.get("selected-account");
    const account = accounts.find((a) => a.uuid === selectedUuid) || null;

    const userId = account?.uuid || 'anonymous';
    const userToken = account?.token || null;

    // Recolectar información del usuario y configuración
    const lastMinecraftLaunch = store.get('lastMinecraftLaunch');
    const latest3Versions = store.get('latest3Versions') || [];

    const userInfo = {
      username: account?.name || 'anonymous',
      uuid: account?.uuid || null,
      accountType: account?.meta?.type || 'offline',
      premium: account?.premium || false,
      theme: {
        color: store.get('theme-color') || null,
        colorBottomBar: store.get('theme-color-bottom-bar') || null,
        opacityBottomBar: store.get('theme-opacity-bottom-bar') || null
      },
      language: store.get('lang') || store.get('language') || 'es',
      minecraftVersion: lastMinecraftLaunch?.version || latest3Versions[0]?.version || null,
      lastVersionPlayed: lastMinecraftLaunch?.version || null,
      recentVersions: latest3Versions.slice(0, 3).map(v => v.version).join(', ') || null
    };

    const apiUrl = 'https://api.battlylauncher.com/api/analytics';

    analytics = new BattlyAnalytics(apiUrl, userId, userToken, userInfo);
    await analytics.init();

    // Trackear inicio del launcher
    analytics.track(BattlyAnalytics.Events.LAUNCHER_STARTED, {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      isPackaged: app.isPackaged,
      electronVersion: process.versions.electron,
      hasAccount: !!account,
      username: account?.name || 'anonymous'
    });

    console.log("✅ Analytics inicializado para usuario:", userId);
  } catch (error) {
    console.error("❌ Error inicializando analytics:", error);
    analytics = null;
  }
}

app.whenReady().then(async () => {
  tray = new Tray(path.join(__dirname, "/assets/images/icon.png"));
  updateTrayMenu();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Battly Launcher",
      type: "normal",
      icon: path.join(__dirname, "/assets/images/icon15px.png"),
      click: () => {
        const MainWindow = require("./assets/js/windows/mainWindow.js");
        MainWindow.getWindow().show();
      },
    },
    { type: "separator" },
    {
      label: "Abrir carpeta de Battly",
      type: "normal",
      click: () => shell.openPath(path.join(dataDirectory, ".battly")),
    },
    {
      label: "Battly Music",
      type: "submenu",
      submenu: [
        { label: "Reproducir/Pausar", click: () => PlayPause() },
        { label: "Siguiente", click: () => NextSong() },
        { label: "Anterior", click: () => PrevSong() },
      ],
    },
    { type: "separator" },
    {
      label: "Discord",
      click: () =>
        shell.openExternal("https://discord.gg/tecno-bros-885235460178342009"),
    },
    {
      label: "Sitio web",
      click: () => shell.openExternal("https://battlylauncher.com"),
    },
    { type: "separator" },
    { label: "Cerrar Battly", click: () => app.quit() },
  ]);
  tray.setToolTip("Battly Launcher");
  tray.setContextMenu(contextMenu);

  // Inicializar Analytics
  await initializeAnalytics();

  // sendAnalytics();
  connectSocketIfReady();
});

function sendAnalytics() {
  const accounts = store.get("accounts") || [];
  const selUuid = store.get("selected-account")?.value?.selected;
  const account = accounts.find((a) => a.uuid === selUuid) || null;

  const disp = screen.getPrimaryDisplay();
  const displayData = {
    screenWidth: disp.size.width,
    screenHeight: disp.size.height,
    scaleFactor: disp.scaleFactor,
    width: disp.size.width,

    height: disp.size.height
  };
  const appData = {
    appVersion: app.getVersion(),
    version: app.getVersion(),

    isPackaged: app.isPackaged,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    locale: app.getLocale(),
    launchMethod: 'normal'
  };

  const workerData = { account, displayData, appData };
  const worker = new Worker(
    path.join(__dirname, "assets/js/libs/analytics-worker.js"),
    { workerData }
  );

  worker.on("message", (msg) => {
    if (msg.success) {
      console.log("✅ Analytics enviados:", msg.metadata);

    } else {
      console.error("❌ Analytics falló:", msg.error);
    }
    worker.terminate();
  });

  worker.on("error", (err) => {
    console.error("❌ Error en worker analytics:", err);

    worker.terminate();
  });
}

function updateTrayMenu() {
  const playPauseLabel = isPlaying ? "Pausar" : "Reproducir";
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Battly Launcher",
      type: "normal",
      icon: path.join(__dirname, "/assets/images/icon15px.png"),
    },
    { type: "separator" },
    {
      label: "Abrir carpeta de Battly",
      click: () => shell.openPath(path.join(dataDirectory, ".battly")),
    },
    {
      label: "Battly Music",
      type: "submenu",
      submenu: [
        { label: playPauseLabel, click: () => PlayPause() },
        { label: "Siguiente", click: () => NextSong() },
        { label: "Anterior", click: () => PrevSong() },
      ],
    },
    { type: "separator" },
    {
      label: "Discord",
      click: () =>
        shell.openExternal("https://discord.gg/tecno-bros-885235460178342009"),
    },
    {
      label: "Sitio web",
      click: () => shell.openExternal("https://battlylauncher.com"),
    },
    { type: "separator" },
    { label: "Cerrar Battly", click: () => app.quit() },
  ]);
  tray.setContextMenu(contextMenu);
}

ipcMain.on("select-account", async (_event, data) => {

  if (selectedAccount?.uuid !== data?.uuid) {
    console.log("🔄 Cuenta cambiada, reemplazando socket...");
    selectedAccount = data || null;
    replaceSocket();

    // Reinicializar analytics con nueva cuenta
    if (analytics) {
      await analytics.close();
      await initializeAnalytics();
    }
  } else {
    console.log("✅ Misma cuenta, manteniendo socket existente");
    selectedAccount = data || null;
  }
});
ipcMain.on("socket", async (_i, event, data) => {
  const payload = Object.assign({}, data || {}, {
    _auth: { token: selectedAccount?.token || null },
  });
  socket.emit(`${event}-v3`, payload);
});

ipcMain.on("obtenerLogs", async (_event, data) => {
  const RegistroLog = fs.readFileSync(
    `${dataDirectory}/.battly/Registro.log`,
    "utf8"
  );
  const dataB64 = Buffer.from(JSON.stringify(data || {})).toString("base64");
  const logsB64 = Buffer.from(RegistroLog).toString("base64");
  socket.emit("sendLogs-v3", { userData: dataB64, logs: logsB64 });
});

ipcMain.on("obtenerSocketID", async () => {
  const sessionID = socket.id || null;
  const window = MainWindow.getWindow();
  if (window) window.webContents.send("enviarSocketID", { sessionID });
});

ipcMain.on("updateStatus", async (_event, data) => {
  const payload = Object.assign({}, data || {}, {
    _auth: { token: selectedAccount?.token || null },
  });
  socket.emit("updateStatus-v3", payload);
});

const UpdateWindow = require("./assets/js/windows/updateWindow.js");
const MainWindow = require("./assets/js/windows/mainWindow.js");

if (dev) {
  let appPath = path.resolve("./AppData/Launcher").replace(/\\/g, "/");
  if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
  app.setPath("userData", appPath);
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const window = MainWindow.getWindow();
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
      const customArg = commandLine.find((arg) =>
        arg.startsWith("battlylauncher://")
      );
      if (customArg) window.webContents.send("battly-login", customArg);
    }
  });

  app.whenReady().then(() => {
    if (store.get("launchboost")) {
      fetch(
        "https://api.battlylauncher.com/v3/launcher/config-launcher/config.json"
      )
        .then(async (res) => {
          let data = await res.json();
          let version = data.latestVersion;
          let actualVersion = require("../package.json").version;
          if (actualVersion != version) {
            UpdateWindow.createWindow();
          } else {
            MainWindow.createWindow();
          }
        })
        .catch(async () => {
          let file = await fs.readFileSync(
            path.join(
              dataDirectory,
              "/.battly/battly/launcher/config-launcher/config.json"
            ),
            "utf8"
          );
          let data = JSON.parse(file);
          let version = data.latestVersion;
          let actualVersion = require("../package.json").version;
          if (actualVersion != version) {
            UpdateWindow.createWindow();
          } else {
            MainWindow.createWindow();
          }
        });
    } else {
      UpdateWindow.createWindow();
    }
  });
}

process.on("uncaughtException", (error) => console.log(error));
process.on("unhandledRejection", (error) => console.log(error));

ipcMain.on("update-window-close", () => UpdateWindow.destroyWindow());
ipcMain.on("update-window-dev-tools", () =>
  UpdateWindow.getWindow().webContents.openDevTools()
);
ipcMain.on("main-window-open", () => MainWindow.createWindow());
ipcMain.on("main-window-dev-tools", () =>
  MainWindow.getWindow().webContents.openDevTools()
);
ipcMain.on("main-window-close", () => MainWindow.destroyWindow());
ipcMain.on("main-window-progress_", (_e, size_actual) => {
  MainWindow.getWindow().setProgressBar(
    parseInt(size_actual.progress) / parseInt(100)
  );
});
ipcMain.on("main-window-progress", (_e, size_actual) => {
  MainWindow.getWindow().setProgressBar(
    parseInt(size_actual.progress_actual) / parseInt(size_actual.size_actual)
  );
});
ipcMain.on("main-window-progress-loading", () =>
  MainWindow.getWindow().setProgressBar(2)
);
ipcMain.on("main-window-progress-reset", () =>
  MainWindow.getWindow().setProgressBar(-1)
);
ipcMain.on("main-window-minimize", () => MainWindow.getWindow().minimize());
ipcMain.on("main-window-maximize", () => {
  if (MainWindow.getWindow().isMaximized()) {
    MainWindow.getWindow().unmaximize();
  } else {
    MainWindow.getWindow().maximize();
  }
});
ipcMain.on("main-window-hide", () => MainWindow.getWindow().hide());
ipcMain.on("main-window-show", () => MainWindow.getWindow().show());

ipcMain.on("show-notification", (_event, { title, message }) => {
  const notification = new Notification({
    title: title,
    body: message,
    icon: path.join(__dirname, "assets/images/icon.png")
  });
  notification.show();

  // Track notification
  if (analytics) {
    analytics.track('notification:shown', {
      title,
      type: 'system'
    });
  }
});

// ==========================================
// ANALYTICS IPC HANDLERS
// ==========================================

ipcMain.handle("analytics-track", async (_event, eventType, properties = {}) => {
  if (analytics) {
    try {
      analytics.track(eventType, properties);
      return { success: true };
    } catch (error) {
      console.error("Analytics track error:", error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "Analytics not initialized" };
});

ipcMain.handle("analytics-log", async (_event, level, message, context = {}) => {
  if (analytics) {
    try {
      await analytics.log(level, message, context);
      return { success: true };
    } catch (error) {
      console.error("Analytics log error:", error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "Analytics not initialized" };
});

ipcMain.handle("get-system-info", async () => {

  const disp = screen.getPrimaryDisplay();
  return {
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    appVersion: app.getVersion(),
    locale: app.getLocale(),
    screenResolution: `${disp.size.width}x${disp.size.height}`,
    scaleFactor: disp.scaleFactor,
    isPackaged: app.isPackaged
  };
});

ipcMain.handle("submit-error-report", async (_event, reportData) => {
  try {
    console.log('[ErrorReport] Procesando reporte...');

    const userToken = selectedAccount?.token;
    console.log('[ErrorReport] Token de usuario obtenido:', userToken ? 'presente' : 'ausente');

    if (!userToken) {
      console.log('[ErrorReport] No hay token de usuario');
      return {
        success: false,
        error: "No hay sesión activa. Inicia sesión para enviar reportes."
      };
    }

    console.log('[ErrorReport] Usuario autenticado:', selectedAccount?.uuid);

    if (!reportData.comment || reportData.comment.trim().length < 10) {
      console.log('[ErrorReport] Comentario muy corto');
      return {
        success: false,
        error: "El comentario debe tener al menos 10 caracteres."
      };
    }

    if (reportData.comment.length > 1000) {
      console.log('[ErrorReport] Comentario muy largo');
      return {
        success: false,
        error: "El comentario no puede exceder 1000 caracteres."
      };
    }

    console.log('[ErrorReport] Enviando al servidor...');

    const apiUrl = "https://api.battlylauncher.com/api/error-reports";
    console.log('[ErrorReport] API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userToken}`
      },
      body: JSON.stringify({
        comment: reportData.comment,
        screenshot: reportData.screenshot,

        systemInfo: reportData.systemInfo,
        logs: reportData.logs,
        timestamp: reportData.timestamp
      })
    });

    console.log('[ErrorReport] Respuesta del servidor:', response.status);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error('[ErrorReport] Respuesta no es JSON:', contentType);
      const text = await response.text();
      console.error('[ErrorReport] Respuesta del servidor:', text.substring(0, 200));
      throw new Error('El servidor no respondió correctamente. Puede que no esté disponible.');
    }

    const result = await response.json();

    if (!response.ok) {

      if (response.status === 429) {
        console.log('[ErrorReport] Rate limit excedido');
        return {
          success: false,
          error: "Has alcanzado el límite de reportes. Intenta más tarde."
        };
      }

      console.log('[ErrorReport] Error del servidor:', result.error);
      return {
        success: false,
        error: result.error || "Error al enviar el reporte."
      };
    }

    console.log('[ErrorReport] Reporte enviado correctamente');
    return {
      success: true,
      message: "Reporte enviado correctamente. ¡Gracias por tu ayuda!"
    };

  } catch (error) {
    console.error('[ErrorReport] Error al enviar reporte:');
    console.error(error.message);
    console.error(error.stack);
    return {
      success: false,
      error: "Error de conexión. Verifica tu internet e intenta de nuevo."
    };
  }
});

ipcMain.handle("capture-window-screenshot", async (event) => {
  try {
    console.log('[Screenshot] Solicitando captura de pantalla...');

    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      console.error('[Screenshot] No se pudo obtener la ventana desde event.sender');

      const allWindows = BrowserWindow.getAllWindows();
      console.log('[Screenshot] Ventanas disponibles:', allWindows.length);

      if (allWindows.length > 0) {
        const mainWindow = allWindows[0];
        const image = await mainWindow.webContents.capturePage();
        const dataUrl = `data:image/png;base64,${image.toPNG().toString('base64')}`;
        console.log('[Screenshot] Captura realizada desde ventana principal');
        return dataUrl;
      }

      return null;
    }

    console.log('[Screenshot] Ventana obtenida, capturando página...');

    const image = await window.webContents.capturePage();

    console.log('[Screenshot] Imagen capturada, convirtiendo a base64...');

    const dataUrl = `data:image/png;base64,${image.toPNG().toString('base64')}`;

    console.log('[Screenshot] Captura realizada correctamente, tamaño:', image.getSize());
    return dataUrl;
  } catch (error) {
    console.error('[Screenshot] Error capturando ventana:');
    console.error(error.message);
    console.error(error.stack);
    return null;
  }
});

ipcMain.handle("Microsoft-window", async (_event, client_id) => {
  return await new Microsoft(client_id).getAuth();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async () => {
  // Cerrar sesión de analytics
  if (analytics) {
    analytics.track(BattlyAnalytics.Events.LAUNCHER_CLOSED, {
      timestamp: Date.now()
    });
    await analytics.close();
  }
});

ipcMain.on("restartLauncher", () => {
  app.relaunch();
  app.exit();
});

async function PlayPause() {
  isPlaying = !isPlaying;
  updateTrayMenu();
  const window = MainWindow.getWindow();
  window.webContents.send("play-pause");

  // Track music event
  if (analytics) {
    analytics.track(
      isPlaying ? BattlyAnalytics.Events.MUSIC_PLAYED : BattlyAnalytics.Events.MUSIC_PAUSED,
      { source: 'tray' }
    );
  }
}
async function NextSong() {
  isPlaying = true;
  updateTrayMenu();
  const window = MainWindow.getWindow();
  window.webContents.send("next-song");

  // Track music skip
  if (analytics) {
    analytics.track(BattlyAnalytics.Events.MUSIC_SKIPPED, {
      direction: 'next',
      source: 'tray'
    });
  }
}
async function PrevSong() {
  isPlaying = true;
  updateTrayMenu();
  const window = MainWindow.getWindow();
  window.webContents.send("prev-song");

  // Track music skip
  if (analytics) {
    analytics.track(BattlyAnalytics.Events.MUSIC_SKIPPED, {
      direction: 'previous',
      source: 'tray'
    });
  }
}

const rpc = require("./assets/js/libs/discord/index");
let client = new rpc.Client({ transport: "ipc" });
let startedAppTime = Date.now();

ipcMain.on("new-status-discord", async () => {
  client.login({ clientId: "917866962523152404" });
  client.on("ready", () => {
    client
      .request("SET_ACTIVITY", {
        pid: process.pid,
        activity: {
          details: "En el menú de inicio",
          assets: { large_image: "battly_512", large_text: "Battly Launcher" },
          buttons: [
            { label: "👥 Discord", url: "https://discord.gg/tecno-bros-885235460178342009" },
            { label: "⏬ Descargar", url: "https://battlylauncher.com" },
          ],
          instance: false,
          timestamps: { start: startedAppTime },
        },
      })
      .catch(() => { });
  });
});

ipcMain.on("new-status-discord-jugando", async (_event, status) => {
  if (status.endsWith("-forge")) status = status.replace("-forge", "") + " - Forge";
  else if (status.endsWith("-fabric")) status = status.replace("-fabric", "") + " - Fabric";
  if (client) await client.destroy();
  client = new rpc.Client({ transport: "ipc" });
  client.login({ clientId: "917866962523152404" });
  client.on("ready", () => {
    client
      .request("SET_ACTIVITY", {
        pid: process.pid,
        activity: {
          details: status,
          assets: {
            large_image: "battly_512",
            small_image: "mc_512",
            small_text: "Minecraft",
            large_text: "Battly Launcher",
          },
          buttons: [
            { label: "👥 Discord", url: "https://discord.gg/tecno-bros-885235460178342009" },
            { label: "⏬ Descargar", url: "https://battlylauncher.com" },
          ],
          instance: false,
          timestamps: { start: startedAppTime },
        },
      })
      .catch(() => { });
  });
});

ipcMain.on("delete-and-new-status-discord", async () => {
  if (client) client.destroy();
  client = new rpc.Client({ transport: "ipc" });
  client.login({ clientId: "917866962523152404" });
  client.on("ready", () => {
    client
      .request("SET_ACTIVITY", {
        pid: process.pid,
        activity: {
          details: "En el menú de inicio",
          assets: { large_image: "battly_512", large_text: "Battly Launcher" },
          buttons: [
            { label: "👥 Discord", url: "https://discord.gg/tecno-bros-885235460178342009" },
            { label: "⏬ Descargar", url: "https://battlylauncher.com" },
          ],
          instance: false,
          timestamps: { start: startedAppTime },
        },
      })
      .catch(() => { });
  });
});
ipcMain.on("delete-status-discord", async () => {
  if (client) client.destroy();
});

autoUpdater.autoDownload = false;
ipcMain.handle("update-app", () => {
  return new Promise(async (resolve) => {

    if (dev || !app.isPackaged) {
      console.log("⚠️ Modo desarrollo: saltar búsqueda de actualizaciones");

      setTimeout(() => {
        const w = UpdateWindow.getWindow();
        if (w) w.webContents.send("update-not-available");
      }, 100);
      return resolve({ error: false, message: "Development mode, updates skipped" });
    }

    autoUpdater
      .checkForUpdates()
      .then(() => resolve())
      .catch((error) => resolve({ error: true, message: error }));
  });
});
const pkgVersion = async () => ({ version: "3.0.0", buildVersion: 1004 });
ipcMain.handle("update-new-app", async () => {
  console.log(await pkgVersion());
  return new Promise(async (resolve, reject) => {
    fetch("https://api.battlylauncher.com/v3/launcher/config-launcher/config.json")
      .then(async (res) => {
        let data = await res.json();
        let version = data.battly.release;
        let actualBuild = (await pkgVersion()).buildVersion;
        if (actualBuild != version.latest_build) {
          resolve();
          const updateWindow = UpdateWindow.getWindow();
          if (updateWindow) updateWindow.webContents.send("updateNewAvailable");
        } else reject();
      })
      .catch((error) => resolve({ error: true, message: error }));
  });
});
autoUpdater.on("update-available", (info) => {
  const w = UpdateWindow.getWindow();
  if (w) w.webContents.send("updateAvailable");
});
ipcMain.on("start-update", () => {
  autoUpdater.downloadUpdate();
});
autoUpdater.on("update-not-available", () => {
  const w = UpdateWindow.getWindow();
  if (w) w.webContents.send("update-not-available");
});
autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall();
});
autoUpdater.on("download-progress", (progress) => {
  const w = UpdateWindow.getWindow();
  if (w) w.webContents.send("download-progress", progress);
});