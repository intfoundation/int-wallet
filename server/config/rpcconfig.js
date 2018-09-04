/**
 *@file    rpcconfig.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/24
 *@disc    rpc config
 */

"use strict";
/**
 * host为peer节点的ip, port为peer节点启动的rpc端口
 * 如果启动的为本地 peer, host 则为 localhost
 * */
let rpcCoing = {
    host: 'localhost',
    port: '18089'
}
module.exports = rpcCoing;