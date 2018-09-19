"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rpc_server_1 = require("../lib/rpc_server");
const core_1 = require("../../core");
const util_1 = require("util");
const fs = require("fs");
function promisify(f) {
    return () => {
        let args = Array.prototype.slice.call(arguments);
        return new Promise((resolve, reject) => {
            args.push((err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
            f.apply(null, args);
        });
    };
}
class ChainServer {
    constructor(logger, chain, miner) {
        this.m_chain = chain;
        this.m_miner = miner;
        this.m_logger = logger;
    }
    init(commandOptions) {
        let host = commandOptions.get('rpchost');
        if (!host) {
            return false;
        }
        let port = commandOptions.get('rpcport');
        if (!port) {
            return false;
        }
        this.m_server = new rpc_server_1.RPCServer(host, parseInt(port, 10));
        this._initMethods();
        this.m_server.start();
        return true;
    }
    _initMethods() {
        this.m_server.on('sendTransaction', async (params, resp) => {
            let tx = new core_1.ValueTransaction();
            let err = tx.decode(new core_1.BufferReader(Buffer.from(params.tx, 'hex')));
            if (err) {
                await promisify(resp.write.bind(resp)(JSON.stringify(err)));
            }
            else {
                this.m_logger.debug(`rpc server txhash=${tx.hash}, nonce=${tx.nonce}, address=${tx.address}`);
                err = await this.m_chain.addTransaction(tx);
                await promisify(resp.write.bind(resp)(JSON.stringify(err)));
            }
            await promisify(resp.end.bind(resp)());
        });
        this.m_server.on('getTransactionReceipt', async (params, resp) => {
            let cr = await this.m_chain.getTransactionReceipt(params.tx);
            if (cr.err) {
                await promisify(resp.write.bind(resp)(JSON.stringify({ err: cr.err })));
            }
            else {
                await promisify(resp.write.bind(resp)(JSON.stringify({
                    err: core_1.ErrorCode.RESULT_OK,
                    block: cr.block.stringify(),
                    tx: cr.tx.stringify(),
                    receipt: cr.receipt.stringify()
                })));
            }
            await promisify(resp.end.bind(resp)());
        });
        this.m_server.on('getNonce', async (params, resp) => {
            let nonce = await this.m_chain.getNonce(params.address);
            await promisify(resp.write.bind(resp)(JSON.stringify(nonce)));
            await promisify(resp.end.bind(resp)());
        });
        this.m_server.on('view', async (params, resp) => {
            let cr = await this.m_chain.view(util_1.isUndefined(params.from) ? 'latest' : params.from, params.method, params.params);
            if (cr.err) {
                await promisify(resp.write.bind(resp)(JSON.stringify({ err: cr.err })));
            }
            else {
                let s;
                try {
                    s = core_1.toStringifiable(cr.value, true);
                    cr.value = s;
                }
                catch (e) {
                    this.m_logger.error(`call view ${params} returns ${cr.value} isn't stringifiable`);
                    cr.err = core_1.ErrorCode.RESULT_INVALID_FORMAT;
                    delete cr.value;
                }
                await promisify(resp.write.bind(resp)(JSON.stringify(cr)));
            }
            await promisify(resp.end.bind(resp)());
        });
        this.m_server.on('getBlock', async (params, resp) => {
            let hr = await this.m_chain.getHeader(params.which);
            if (hr.err) {
                await promisify(resp.write.bind(resp)(JSON.stringify({ err: hr.err })));
            }
            else {
                // 是否返回 block的transactions内容
                if (params.transactions) {
                    let block = await this.m_chain.getBlock(hr.header.hash);
                    if (block) {
                        // 处理block content 中的transaction, 然后再响应请求
                        let transactions = block.content.transactions.map((tr) => tr.stringify());
                        let res = { err: core_1.ErrorCode.RESULT_OK, block: hr.header.stringify(), transactions };
                        await promisify(resp.write.bind(resp)(JSON.stringify(res)));
                    }
                }
                else {
                    await promisify(resp.write.bind(resp)(JSON.stringify({ err: core_1.ErrorCode.RESULT_OK, block: hr.header.stringify() })));
                }
            }
            await promisify(resp.end.bind(resp))();
        });
        this.m_server.on('getPeers', async (args, resp) => {
            let peers = this.m_chain.node.base.node.dumpConns();
            await promisify(resp.write.bind(resp)(JSON.stringify(peers)));
            await promisify(resp.end.bind(resp)());
        });

        this.m_server.on('newAccount', async (params, resp) => {
            let keystore = params.keystore;
            let address = params.address;
            let fileName = address + '.json';
            let keyPath = process.cwd() + '/data/keystore/';

            if (!fs.existsSync(keyPath)) {
                fs.mkdirSync(keyPath);
            }
            try {
              fs.writeFileSync(keyPath + fileName, keystore);
            }catch (e) {
                this.m_logger.error(`write keystore failed, error:` + e);
            }
            await promisify(resp.write.bind(resp)(JSON.stringify({err: core_1.ErrorCode.RESULT_OK})));
            await promisify(resp.end.bind(resp)());
        });

        this.m_server.on('readFile', async (params, resp) => {
            let keyPath = process.cwd() + '/data/keystore/';

            if (!fs.existsSync(keyPath)) {
                fs.mkdirSync(keyPath);
            }

            fs.readdir(keyPath, async (err, files) => {
                if (err) {
                    this.m_logger.error(`read keystore files filed, error:` + err);
                    await promisify(resp.write.bind(resp)(JSON.stringify({err: core_1.ErrorCode.RESULT_NOT_FOUND})));
                } else {
                  await promisify(resp.write.bind(resp)(JSON.stringify({err: core_1.ErrorCode.RESULT_OK, files: files})));
                }
                await promisify(resp.end.bind(resp)());
            });
        });

        this.m_server.on('readKeystore', async (params, resp) => {
            let fileName = params.address + '.json';
            let keyStorePath = process.cwd() + '/data/keystore/';

            if (!fs.existsSync(keyStorePath)) {
              fs.mkdirSync(keyStorePath);
            }

            fs.readFile(keyStorePath + fileName,'utf8', async (err, data) => {
              if (err) {
                  this.m_logger.error(`read keystore filed, error: ` + err);
                  await promisify(resp.write.bind(resp)(JSON.stringify({err: core_1.ErrorCode.RESULT_NOT_FOUND})))
              } else {
                  await promisify(resp.write.bind(resp)(JSON.stringify({err: core_1.ErrorCode.RESULT_OK, keystore: data})));
              }
              await promisify(resp.end.bind(resp)());
            });
        });
    }
}
exports.ChainServer = ChainServer;
