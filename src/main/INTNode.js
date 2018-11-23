/**
 *@file    INTNode.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/11/21
 *@disc    Start INT Node
 */

/* eslint-disable */
import { app, dialog, ipcMain } from 'electron';
const EventEmitter = require('events').EventEmitter;
const { spawn} = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const STATES = {
    STARTING: 0,
    STARTED: 1,
    CONNECTED: 2,
    STOPPING: 3,
    STOPPED: 4,
    ERROR: -1
};

const DEFAULT_NETWORK = 'main';

/**
 * INT node
*/
/* eslint-disable */
export class INTNode extends EventEmitter {
    constructor() {
        super();

        this.STATES = STATES;
        this.state = STATES.STOPPED;
        this._network = null;
        this._node = null;
        this._isOwnNode = null;
    }

    get network() {
        return this._network;
    }

    set network(n) {
        this._network = n;
    }

    init() {
        this._network = DEFAULT_NETWORK;

        this.getUserData();
        this.start(this._network);
    }

    restart(network) {
        this.start(network);

        // ipcMain.emit('switch-network');
        // console.info(`Emit switch network event, switch network to ${network} network`);
    }

    stop() {
        if (!this._node) {
            return
        }

        this.state = STATES.STOPPING;
        console.info(`Stopping existing node: ${this._node}`);

        this._node.stdout.removeAllListeners('data');
        this._node.stderr.removeAllListeners('data');
        this._node.stdin.removeAllListeners('error');
        this._node.removeAllListeners('error');
        this._node.removeAllListeners('exit');

        this._node.kill('SIGINT');

        const killTimer = setTimeout(() => {
            if (this._node) {
                this._node.kill('SIGKILL');
            }
        }, 5000);

        this._node.once('close', () => {
            clearTimeout(killTimer);
            this._node = null;
            this.state = STATES.STOPPED;
            console.info(`Previous node has been stopped`);
        });
    }

    start(network) {
        try {
            this.stop();
        } catch(err) {
            console.error(`Stop node error ${err}`);
        }

        this._startNode(network);
    }

    _startNode(network) {
        this._network = network;

        if (this._network === 'test') {
            console.info('Node will connect the test network');
            dialog.showMessageBox({
                type: 'info',
                buttons: ['OK'],
                title: 'Network',
                message: 'Node will connect the test network',
                },
                () => {}
                );
        }

        if (this._network === 'main') {
            console.info('Node will connect the main network');
            dialog.showMessageBox({
                    type: 'info',
                    buttons: ['OK'],
                    title: 'Network',
                    message: 'Node will connect the main network',
                },
                () => {}
                );
        }

        this.setUserData(this._network);
        this.state = STATES.STARTING;

        try {
            this._startProcess(this._network);
            console.info(`Start process with network ${this._network}`);
        } catch(err) {
            console.error(`Start process error ${err}`);
        }
    }

    _startProcess(network) {
        let args = [];

        if (network === 'main') {
            args.push('--main');
        }

        if (network === 'test') {
            args.push('--test');
        }

        const proc = spawn('int-cli', args);

        this._node = proc;
        this.state = STATES.STARTED;

        proc.once('error', error => {
            if (this.state === STATES.STARTING) {
                this.state = STATES.ERROR;
            }
        });

        proc.stdout.on('data', data => {

        });

        proc.stderr.on('data', data => {

        });

        proc.once('close', code => {

        });

    }

    async setNetwork() {

    }

    async getNetwork() {

    }

    // getBinPath() {
    //     if (os.platform() === 'win32') {
    //         return '/usr/local/bin/int-cli';
    //     }
    //
    //     if (os.platform() === 'darwin') {
    //         return '/usr/local/bin/int-cli';
    //     }
    // }

    getUserData() {
        let userPath = app.getPath('userData');
        // console.log(path);
        let filePath = path.join(userPath, 'network.json');

        try{
            let data = fs.readFileSync(filePath, 'utf-8');
            let network = JSON.parse(data);
            this._network = network.network;
            console.info(`Get user data ${data}`);
        } catch(err) {
            this._network = null;
            console.error(`Get user data error ${err}`);
        }
    }

    setUserData(data) {
        let userPath = app.getPath('userData');
        let filePath = path.join(userPath, 'network.json');
        let wd = JSON.stringify({"network": data});

        try{
            fs.writeFileSync(filePath, wd);
            console.info(`Set user data ${wd}`);
        } catch(err) {
            console.error(`Set user data error ${err}`);
        }
    }

    getUserPath() {
        return app.getPath('userData');
    }
}
