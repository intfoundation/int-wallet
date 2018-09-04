/**
 *@file    token.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/17
 *@disc    通证相关中间件
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


router.get('/createToken', async (req, res, next) => {
    req.on('data', async (chunk) => {
        let chunkData = JSON.parse(chunk.toString());
        let tokenid = chunkData.tokenid;
        let preBalances = chunkData.preBalances;
        let amount = req.params.amount;
        let fee = req.params.fee;
        let secret = req.params.secret;

        let result = await intjs.createToken(tokenid, preBalances, amount, fee, secret);

        res.send(result);
    });
});

router.get('/transferTokenTo/:tokenid/:to/:amount/:fee/:secret', async (req, res, next) => {
    let tokenid = req.params.tokenid;
    let toAddress = req.params.to;
    let amount = req.params.amount;
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await intjs.transferTokenTo(tokenid, toAddress, amount, fee, secret);

    res.send(result);
});

router.get('/getTokenBalance/:tokenid/:address', async (req, res, next) => {
    let tokenid = req.params.tokenid;
    let address = req.params.address;

    let result = await intjs.getTokenBalance(tokenid, address);

    res.send(result);
});

module.exports = router;