/**
 *@file    vote.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/17
 *@disc    投票相关中间件
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


/**
 * 给节点投票
 * */
router.get('/vote', async (req, res, next) => {
    req.on('data', async (chunk) => {
        let chunkData = JSON.parse(chunk.toString());
        let candidates = chunkData.candidates;
        let fee = chunkData.fee;
        let secret = chunkData.secret;

        let result = await intjs.vote(candidates, fee, secret);

        res.send(result);
    });
});

/**
 * 获取所有节点的票数
 * */
router.get('/getVote', async (req, res, next) => {

    let result = await intjs.getVote();

    res.send(result);
});

/**
 * 获取某个地址的选票
 * */
router.get('/getStoke/:address', async (req, res, next) => {
    let address = req.params.address;

    let result = await intjs.getStoke(address);

    res.send(result);
});

/**
 * 余额兑换成选票
 * */
router.get('/mortgage/:mount/:fee/:secret', async (req, res, next) => {
    let amount = req.params.amount;
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await intjs.mortgage(amount, fee, secret);

    res.send(result);
});

/**
 * 把选票兑换成余额
 * */
router.get('/unmortgage/:mount/:fee/:secret', async (req, res, next) => {
    let amount = req.params.amount;
    let fee = req.params.fee;
    let secret = req.params.secret;

    let result = await intjs.unmortgage(amount, fee, secret);

    res.send(result);
});

/**
 * 获取所有的候选节点
 * */
router.get('/getCandidates', async (req, res, next) => {

    let result = await intjs.getCandidates();

    res.send(result);
});

module.exports = router;