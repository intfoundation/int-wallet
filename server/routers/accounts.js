/**
 *@file    accounts.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/21
 *@disc    帐户相关中间件
 */

"use strict";
const express = require('express');
const router = express.Router();
const Intjs = require('../index');
const rpcConfig = require('../config/rpcconfig');

/**
 * host为peer节点的ip, port为peer节点启动的rpc端口
 * 如果启动的为本地 peer, host 则为 localhost
 * */
const intjs = new Intjs(rpcConfig.host, rpcConfig.port);


router.get('/create', async (req, res, next) => {

    let result = await intjs.create();

    res.send(result);
});

router.get('/getBalance/:address', async (req, res, next) => {
    let address = req.params.address;

    let result = await intjs.getBalance(address);

    res.send(result);
});


module.exports = router;