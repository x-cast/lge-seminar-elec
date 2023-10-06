const { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer } = require('electron')
const path = require("path");
const DB = require("./modules/db.js");
const update = require("./modules/update.js");
require('dotenv').config()

let db = null, resetInterval = null, resetCount = 0
let updateWin = null
const createWindow = (datas) => {
    console.log(process.env)
    const win = new BrowserWindow({
        name: "LGE-AdminPlayer",
        alwaysOnTop: true,
        autoHideMenuBar: true,
        resizable: false,
        height: 720,
        width: 1280,
        titleBarStyle: 'hidden',
        titleBarOverlay: true,
        webPreferences: {
            // devTools: false,
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js") // use a preload script
        }
    })
    win.webContents.on('did-finish-load', (evt) => {
        win.webContents.send('main', JSON.stringify(datas))
    })
    ipcMain.on('source', () => {
        const platforms = {
            win32: "windows",
            win64: "windows",
            linux: "linux",
            darwin: "macos",
        };
        const os = platforms[process.platform];
        win.webContents.send('source', JSON.stringify({ screenId: win.getMediaSourceId(), os }))
    })
    win.loadURL(`${process.env.LGE_ADDR}/seminar_docs/1/1?authrized=${process.env.LGE_KEY}`)
}

function createDefaultUpdateWindow() {
    updateWin = new BrowserWindow(
        {
            autoHideMenuBar: true,
            backgroundColor: "#eeeeee",
            webPreferences: { nodeIntegration: true },
        }
    );
    updateWin.on("closed", () => {
        updateWin = null;
    })
    // updateWin.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
    updateWin.loadFile(path.join(__dirname, 'loading.html'))
    return updateWin;
}

app.whenReady().then(() => {
    const autoUpdater = new update({
        needUpdate: () => {
            createDefaultUpdateWindow()
        },
        noUpdate: () => {
            createWindow()
        }
    }, isDev())
    autoUpdater.checkForUpdates();
})

app.on('window-all-closed', () => {
    app.quit();
});
app.on('browser-window-focus', function () {
    globalShortcut.register("CommandOrControl+R", () => {
        console.log("Refresh disable");
    });
    globalShortcut.register("F5", () => {
        console.log("Refresh disable");
    });
    globalShortcut.register("`", () => {
        resetCount++
        if (resetInterval == null) resetInterval = setTimeout(() => { resetInterval = null, resetCount = 0 }, 2000)
        if (resetCount >= 5) {
            db.deleteData("id")
            db.deleteData("name")
            db.deleteData("admin")
            app.quit()
        }
    })
});
app.on('browser-window-blur', function () {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('F5');
    globalShortcut.unregister('`');
});

function isDev() {
    return !app.isPackaged;
};