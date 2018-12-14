/**
 *@file    logger.js
 *@author  Like (likeaixi@gmail.com)
 *@date    2018/12/13
 *@disc
 */

/* eslint-disable */
import { app } from 'electron';
import * as winston from 'winston';
import * as moment from 'moment';
import * as path from 'path';

require('winston-daily-rotate-file');

const userPath = app.getPath('userData');

const myLogFormatter = function (options) {
    const timestamp = options.timestamp();
    const level = options.level.toUpperCase();
    const message = options.message || '';
    let module = 'INT';
    if (options.meta && options.meta.module) {
        module = options.meta.module;
    }
    const formatted = `[${timestamp}] [${level}] ${module} - `;
    if (options.colorize) {
        const colorStr = winston.config.colorize(options.level, formatted);
        return `${colorStr}${message}`;
    }
    return `${formatted}${message}`;
};

const transportConsole = new winston.transports.Console({
    json: false,
    prettyPrint:true,
    colorize: true,
    handleExceptions: true,
    timestamp: function () {
        return moment().format('YYYY-MM-DD HH:MM:ss.SSS');
    },
    format: myLogFormatter,
});
const transportDailyFile = new winston.transports.DailyRotateFile({
    name: 'full',
    filename: path.join(userPath, '/logs/', '%DATE%intwallet.log'),
    json: false,
    datePattern: 'YYYY-MM-DD-HH.',
    prepend: false,
    maxFiles: '14d',
    maxSize: '20m',
    handleExceptions: true
});

const logger = new winston.Logger({
    level:'debug',
    transports: [
        transportConsole,
        transportDailyFile
    ]
});


export {logger};