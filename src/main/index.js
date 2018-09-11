import { app, BrowserWindow, ipcMain } from 'electron' // eslint-disable-line
import path from 'path';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    title: 'INT Wallet',
  });

  mainWindow.loadURL(winURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  /**
   * will download
   **/
  // mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
  //   // 设置保存路径,使Electron不提示保存对话框。
  //   // item.setSavePath(savePath + item.getFilename());
  //
  //   item.on('updated', (event, state) => {
  //     if (state === 'interrupted') {
  //       console.log('Download is interrupted but can be resumed');
  //     } else if (state === 'progressing') {
  //       if (item.isPaused()) {
  //         console.log('Download is paused');
  //       } else {
  //         console.log(`Received bytes: ${item.getReceivedBytes()}`);
  //       }
  //     }
  //   });
  //   item.once('done', (event, state) => {
  //     if (state === 'completed') {
  //       console.log('Download successfully');
  //
  //     } else {
  //       console.log(`Download failed: ${state}`);
  //     }
  //   })
  // });

  /**
   * main process and renderer process communication
   * download file
   * */
  // let downloadPath;//下载路径
  // let savePath; //保存路径
  // ipcMain.on('download', (event, args) => {
  //   let arr=args.split("+");
  //   downloadPath=arr[0];
  //   savePath=arr[1];
  //   console.log(downloadPath);
  //   console.log(savePath);
  //   // 下面这句会触发will-download事件
  //   mainWindow.webContents.downloadURL(downloadPath);
  // });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
