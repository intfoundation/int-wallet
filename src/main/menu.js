/**
 *@file    menu.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/10/29
 *@disc    meun
 */
const { Menu, shell, globalShortcut } = require('electron');
// const devTool = require('electron-debug');

/* eslint-disable */
const createMenu = function (webviews) {
    webviews = webviews || [];

    // 注册快捷键
    register();

    const meun = Menu.buildFromTemplate(menuList(webviews));
    Menu.setApplicationMenu(meun);
}

let register = function () {

    globalShortcut.register('CommandOrControl+N', () => {

    });

    globalShortcut.register('Alt+CommandOrControl+I', () => {

    });
}

let menuList = function (webviews) {
    webviews = webviews || [];

    const meunList = [];

    const template = [
        {
            label: 'Account',
            submenu: [
                {
                    label: 'New Account',
                    acceleration: 'CommandOrControl+N',
                    click() {

                    }
                }
            ]
        },
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
                {role: 'toggledevtools'},
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
            ]
        },
        {
            role: 'window',
            submenu: [
                {role: 'minimize'},
                {role: 'close'}
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

        // // Window menu
        // template[5].submenu = [
        //     {role: 'close'},
        //     {role: 'minimize'},
        //     {role: 'zoom'},
        //     {type: 'separator'},
        //     {role: 'front'}
        // ]
    }

    return template;
}

module.exports = createMenu;