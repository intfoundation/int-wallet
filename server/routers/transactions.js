/**
 *@file    transactions.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/17
 *@disc    transaction middleware
 */

"use strict";
const express = require('express');
const router = express.Router();
const Intjs = require('intjs');
const rpcConfig = require('../config/rpcconfig');

const intjs = new Intjs(rpcConfig.host, rpcConfig.port);

/**
 * 转帐
 * */
router.get('/transferTo/:to/:amount/:fee/:secret', async (req, res, next) => {
    let toAddress = req.params.to;
    let amount = req.params.amount;
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await intjs.transferTo(toAddress, amount, fee, secret);

    res.send(result);
});

/**
 * 节点注册
 * */
router.get('/register/:fee/:secret', async (req, res, next) => {
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await intjs.register(fee, secret);

    res.send(result);
});

module.exports = router;