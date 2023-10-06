
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');

module.exports = class Update {

    constructor(callback, dev) {
        if (dev) return callback.noUpdate()
        autoUpdater.vPrefixedTagName = false
        autoUpdater.on('checking-for-update', () => {
            log.info('업데이트 확인 중...');
        });
        autoUpdater.on('update-available', (info) => {
            log.info('업데이트가 가능합니다.');
            callback.needUpdate()
        });
        autoUpdater.on('update-not-available', (info) => {
            log.info('현재 최신버전입니다.');
            callback.noUpdate()
        });
        autoUpdater.on('error', (err) => {
            log.info('에러가 발생하였습니다. 에러내용 : ' + err);
            callback.noUpdate()
        });
        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = "다운로드 속도: " + progressObj.bytesPerSecond;
            log_message = log_message + ' - 현재 ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
            log.info(log_message);
        })
        autoUpdater.on('update-downloaded', (info) => {
            log.info('다운로드가 완료되었습니다. 업데이트를 진행합니다.');
            autoUpdater.quitAndInstall();
        });
    }

    checkForUpdates = () => {
        return autoUpdater.checkForUpdates();
    }


    sendStatusToWindow(text) {
        updateWin.webContents.send('message', text);
    }
}
