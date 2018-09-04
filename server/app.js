/**
 *@file    app.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/8/17
 *@disc    web 服务器入口
 */
"use strict";

const http = require('http');
const express = require('express');

const Transactions = require('./routers/transactions');
const Tokens = require('./routers/tokens');
const Votes = require('./routers/votes');
const Accounts = require('./routers/accounts');

let app = express();
let port = process.env.PORT || '3000';

/**
 * Create HTTP server.
 */

let server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

app.get('/', function (req, res) {
    res.send('Hello World')
});


app.use('/account', Accounts);

app.use('/transactions', Transactions);

app.use('/tokens', Tokens);

app.use('/votes', Votes);























/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    let host = server.address().address;
    let port = server.address().port;

    console.log('Express listening at http://%s:%s', host, port);
}
