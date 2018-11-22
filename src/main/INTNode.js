/**
 *@file    INTNode.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/11/21
 *@disc    Start INT Node
 */

/* eslint-disable */
const EventEmitter = require('events').EventEmitter;
const { spawn} = require('child_process');
const os = require('os');

const STATES = {
    STARTING: 0,
    STARTED: 1,
    CONNECTED: 2,
    STOPPING: 3,
    STOPPED: 4,
    ERROR: -1
};

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
        // this._nodeType = null;
    }


    init(network) {
        this.start(network);
    }

    restart() {
        this.start(this._network);
    }

    stop() {

    }

    start(network) {
        if (network === 'test') {
            console.warn('Node will connect the test network');
        }

        this.__startNode(network);
    }

    __startNode(network) {
        this.state = STATES.STARTING;
        this._network = network;
        // this._nodeType = nodeType;

        // let binPath = this.getBinPath();

        this.__startProcess(network);
    }

    __startProcess(network) {
        let args = [];

        if (network === 'main') {
            args.push('--main');
        }

        if (network === 'test') {
            args.push('--test');
        }

        const proc = spawn('int-cli', args);

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
}
