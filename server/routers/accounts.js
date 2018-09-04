/**
 *@file    accounts.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/21
 *@disc    account middleware
 */

"use strict";
const express = require('express');
const router = express.Router();
const Intjs = require('intjs');
const rpcConfig = require('../config/rpcconfig');

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