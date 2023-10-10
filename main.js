const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
const path = require("path");
const update = require("./modules/update.js");
require('dotenv').config({ path: require('path').join(__dirname, '.env') })

let deeplinkingUrl
let updateWin = null, mainWin = null
const createWindow = (datas) => {
    const win = new BrowserWindow({
        name: "LGE-AdminPlayer",
        autoHideMenuBar: true,
        resizable: false,
        height: 1080,
        width: 1920,
        titleBarStyle: 'hidden',
        roundedCorners: false,
        // titleBarOverlay: true,
        webPreferences: {
            // devTools: false,
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js") // use a preload script
        }
    })
    mainWin = win
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
    mainWin.on('closed', function () {
        mainWin = null
    })
    deeplinkingUrl = process.argv.slice(1) && process.argv.slice(1).find((arg) => arg.startsWith('lgeadminseminar://'));
    win.loadFile(path.join(__dirname, 'loading-first.html'))
    if (deeplinkingUrl != null && deeplinkingUrl != ".") {
        const data = deeplinkingUrl.replace("lgeadminseminar://", "")
        const realData = data.split("&")
        const channel = realData[0]
        const room = realData[1]
        mainWin.loadURL(`${process.env.LGE_ADDR}/seminar_docs/${channel}/${room}?authrized=${process.env.LGE_KEY}`)
    }
}

function createDefaultUpdateWindow() {
    if (mainWin != null) mainWin.quit()
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
    updateWin.loadFile(path.join(__dirname, 'loading.html'))
    return updateWin;
}
app.whenReady().then(() => {
    const autoUpdater = new update({
        needUpdate: () => {
            createDefaultUpdateWindow()
        },
        noUpdate: () => {
            if (BrowserWindow.getAllWindows().length === 0)
                createWindow()

            if (isDev())
                mainWin.loadURL(`${process.env.LGE_ADDR}/seminar_docs/1/1?authrized=${process.env.LGE_KEY}`)

        }
    }, isDev())
    autoUpdater.checkForUpdates();
})

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    return app.quit();
} else {
    app.on('second-instance', (e, argv) => {
        if (mainWin) {
            if (mainWin.isMinimized() || !mainWin.isVisible()) {
                mainWin.show();
            }
            mainWin.focus();
        }
        if (process.platform !== 'darwin') {
            deeplinkingUrl = argv.find((arg) => arg.startsWith('lgeadminseminar://'));
        }
        if (deeplinkingUrl != null) {
            const data = deeplinkingUrl.replace("lgeadminseminar://", "")
            const realData = data.split("&")
            const channel = realData[0]
            const room = realData[1]
            mainWin.loadURL(`${process.env.LGE_ADDR}/seminar_docs/${channel}/${room}?authrized=${process.env.LGE_KEY}`)
        } else app.quit()
    });
}

app.on('will-finish-launching', function () {
    // Protocol handler for osx
    app.on('open-url', function (event, url) {
        event.preventDefault()
        deeplinkingUrl = url
        const data = deeplinkingUrl.replace("lgeadminseminar://", "")
        const realData = data.split("&")
        const channel = realData[0]
        const room = realData[1]
        mainWin.loadURL(`${process.env.LGE_ADDR}/seminar_docs/${channel}/${room}?authrized=${process.env.LGE_KEY}`)
    })
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
});
app.on('browser-window-blur', function () {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('F5');
    globalShortcut.unregister('`');
});

if (!app.isDefaultProtocolClient('lgeadminseminar')) {
    // Define custom protocol handler. Deep linking works on packaged versions of the application!
    app.setAsDefaultProtocolClient('lgeadminseminar')
}

function isDev() {
    return !app.isPackaged;
};

function logEverywhere(s) {
    console.log(s)
    if (mainWin && mainWin.webContents) {
        mainWin.webContents.executeJavaScript(`console.log("${s}")`)
    }
}