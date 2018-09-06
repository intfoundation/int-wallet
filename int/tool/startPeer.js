/**
 *@file    startPeer.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/27
 *@disc    start peer
 */

"use strict";
const client = require('../client');

let peerConfig = new Map();
peerConfig.set('genesis', './data/intchain/genesis');
peerConfig.set('dataDir', './data/intchain/peer');
peerConfig.set('loggerConsole', true);
peerConfig.set('loggerLevel', 'debug');
peerConfig.set('net', 'bdt');
peerConfig.set('host', '0.0.0.0');
peerConfig.set('port', '13011|13010');
peerConfig.set('peerid', 'peer');
peerConfig.set('sn', 'SN_PEER_TEST@127.0.0.1@12999@12998');
peerConfig.set('rpchost', '0.0.0.0');
peerConfig.set('rpcport', '18089');
peerConfig.set('forceClean', true);

let start = async function() {
    await client.host.initPeer(peerConfig);
}


start();
