import { app, BrowserWindow,  Menu, shell, globalShortcut, ipcMain } from 'electron' // eslint-disable-line
import { INTNode } from './INTNode';

const INTNODE = new INTNode();

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

/* eslint-disable */
const createMenu = function (webviews) {
    webviews = webviews || [];

    // 注册快捷键
    register();

    const meun = Menu.buildFromTemplate(menuList(webviews));
    Menu.setApplicationMenu(meun);
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 720,
    useContentSize: true,
    width: 1200,
    // title: 'INT Wallet',
  });

  mainWindow.loadURL(winURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // INTNODE.init();
  // ipcMain.on('mode', (event, arg) => {
  //     event.returnValue = INTNODE.network;
  // });
  // console.info(`Watch mode event, return value: ${INTNODE.network} network`);

  createMenu();
}

app.on('ready', createWindow);

app.on('will-quit', () => {
    // 清空所有快捷键
    globalShortcut.unregisterAll();
});

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

/* eslint-disable */

let register = function () {

    globalShortcut.register('CommandOrControl+N', () => {

    });

    globalShortcut.register('Alt+CommandOrControl+I', () => {

    });

    globalShortcut.register('Alt+CommandOrControl+1', () => {
        // INTNODE.restart('main');
    });

    globalShortcut.register('Alt+CommandOrControl+2', () => {
        // INTNODE.restart('test');
    });
};

let menuList = function (webviews) {
    webviews = webviews || [];

    const meunList = [];

    const template = [
        // {
        //     label: 'Account',
        //     submenu: [
        //         {
        //             label: 'New Account',
        //             acceleration: 'CommandOrControl+N',
        //             click() {
        //
        //             }
        //         }
        //     ]
        // },
        {
            label: 'Edit',
            submenu: [
                {role: 'undo'},
                {role: 'redo'},
                {type: 'separator'},
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'pasteandmatchstyle'},
                {role: 'delete'},
                {role: 'selectall'},
            ]
        },
        {
            label: 'View',
            submenu: [
                {role: 'reload'},
                {role: 'forcereload'},
                {type: 'separator'},
                {role: 'resetzoom'},
                {role: 'zoomin'},
                {role: 'zoomout'},
                {type: 'separator'},
                {role: 'togglefullscreen'}
            ]
        },
        {
            label: 'Develop',
            submenu: [
                {role: 'toggledevtools'},
                {
                    label: 'Switching Network',
                    submenu: [
                        {
                            label: 'Main Network',
                            checked: INTNODE.network === 'main',
                            accelerator: 'Alt+CommandOrControl+1',
                            type: 'radio',
                            click() {
                                INTNODE.restart('main');
                            }
                        },
                        {
                            label: 'Test Network',
                            checked: INTNODE.network === 'test',
                            accelerator: 'Alt+CommandOrControl+2',
                            type: 'radio',
                            click() {
                                INTNODE.restart('test');
                            }
                        }
                    ]
                }
            ]
        },
        {
            role: 'window',
            submenu: [
                {role: 'minimize'},
                {role: 'close'},
                {role: 'zoom'},
                {type: 'separator'},
                {role: 'front'}
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Contribute',
                    click () { shell.openExternal('https://github.com/intfoundation/int-wallet') }
                },
                {
                    label: 'INT Chain Web Wallet',
                    click () { shell.openExternal('http://wallet.intchain.io') }
                },
                {
                    label: 'Report an issue on github',
                    click () { shell.openExternal('https://github.com/intfoundation/int-wallet/issues') }
                }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: 'INT Wallet',
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                {role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        });

        // Edit menu
        template[1].submenu.push(
            {type: 'separator'},
            {
                label: 'Speech',
                submenu: [
                    {role: 'startspeaking'},
                    {role: 'stopspeaking'}
                ]
            }
        );
    }

    return template;
};
