// Copyright (c) 2016-2018, BuckyCloud, Inc. and other BDT contributors.
// The BDT project is supported by the GeekChain Foundation.
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the BDT nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

'use strict';

const EventEmitter = require('events');
const Base = require('../base/base.js');
const {HashDistance, Result: DHTResult, Config, EndPoint, FLAG_PRECISE, TOTAL_KEY} = require('./util.js');
const {Peer, LocalPeer} = require('./peer.js');
const Bucket = require('./bucket.js');
const DistributedValueTable = require('./distributed_value_table.js');
const TaskMgr = require('./taskmgr.js');
const DHTPackage = require('./packages/package.js');
const DHTPackageFactory = require('./package_factory.js');
const {PackageSender, SendStat} = require('./package_sender.js');
const PackageProcessor = require('./package_processor.js');
const RouteTable = require('./route_table.js');
const LocalValueMgr = require('./local_value_mgr.js');
const PiecePackageRebuilder = require('./piece_package_rebuilder.js');
const net = require('net');
const assert = require('assert');
const BaseUtil = require('../base/util.js');
const TimeHelper = BaseUtil.TimeHelper;

const DHTCommandType = DHTPackage.CommandType;

const LOG_TRACE = Base.BX_TRACE;
const LOG_INFO = Base.BX_INFO;
const LOG_WARN = Base.BX_WARN;
const LOG_DEBUG = Base.BX_DEBUG;
const LOG_CHECK = Base.BX_CHECK;
const LOG_ASSERT = Base.BX_ASSERT;
const LOG_ERROR = Base.BX_ERROR;

const ROOT_SERVICE_PATH = [];
const BASE_DHT_SERVICE_ID = '';


class DHTBase extends EventEmitter {
    constructor(mixSocket, localPeer, packageFactory, taskMgr) {
        super();
        this.m_bucket = new Bucket(localPeer);
        this.m_distributedValueTable = new DistributedValueTable();
        this.m_packageSender = new PackageSender(mixSocket, this.m_bucket);
        this.m_packageFactory = packageFactory;
        this.m_broadcastEventEmitter = new EventEmitter();
        
        let env = {
            bucket: this.m_bucket,
            packageSender: this.m_packageSender,
            packageFactory: this.m_packageFactory,
            distributedValueTable: this.m_distributedValueTable,
            broadcastEventEmitter: this.m_broadcastEventEmitter,
            taskMgr: taskMgr,
            taskExecutor: null,
        };
        this.m_taskExecutor = taskMgr.createTaskExecutor(env);
        this.m_packageSender.taskExecutor = this.m_taskExecutor;
        this.m_packageSender.on(PackageSender.Events.localPackage,
            cmdPackage => {
                let rootDHT = this;
                while (rootDHT.m_father) {
                    rootDHT = rootDHT.m_father;
                }
                this._process(cmdPackage, this.m_bucket.localPeer);
            });

        env.taskExecutor = this.m_taskExecutor;
        this.m_packageProcessor = new PackageProcessor(env);
        this.m_routeTable = new RouteTable(env);
        this.m_localValueMgr = new LocalValueMgr(env);
        
        this.m_subServiceDHTs = new Map();
    }

    // 返回本地peer当前状态信息的一个副本，不随peer运行状态改变而改变
    get localPeer() {
        let localPeer = this.m_bucket.localPeer;
        let peer = new Peer(localPeer);
        peer.answer = localPeer.answer;
        peer.question = localPeer.question;
        return peer;
    }

    // callback({result, peerlist})
    // onStep({result, peerlist}): 阶段性返回找到的peer，部分应用更需要响应的及时性，返回true将中断本次搜索，callback返回result=ABORT(7)
    findPeer(peerid, callback, onStep) {
        let appendLocalHost = (peers) => {
            if (peerid === this.m_bucket.localPeer.peerid) {
                let serviceDescriptor = this.m_bucket.localPeer.findService(this.servicePath);
                if (!serviceDescriptor || !serviceDescriptor.isSigninServer()) {
                    return;
                }

                let localPeer = null;
                if (peers.length === 0 || peers[0].peerid !== peerid) {
                    localPeer = new Peer(this.m_bucket.localPeer);
                    peers.unshift(localPeer);
                } else {
                    localPeer = peers[0];
                }

                let getLocalListenEPList = () => {
                    let eplist = [];
                    this.m_packageSender.mixSocket.eplist.forEach(ep => {
                        let addr = EndPoint.toAddress(ep);
                        if (addr) {
                            if (EndPoint.isZero(addr)) {
                                addr.address = EndPoint.loopback(addr.family);
                                ep = EndPoint.toString(addr);
                            }
                            eplist.push(ep);
                        }
                    });
                    return eplist;
                }
                localPeer.unionEplist(getLocalListenEPList());
            }
        }

        const generateCallback = (handler) => (result, peers = []) => {
            if (!handler) {
                return;
            }
            if (peerid === this.m_bucket.localPeer.peerid) {
                result = 0;
                appendLocalHost(peers);
            }
            return handler({result, peerlist: peers});
        }

        if (callback) {
            this._findPeer(peerid, generateCallback(callback), generateCallback(onStep));
        } else {
            return new Promise(resolve => {
                this._findPeer(peerid, generateCallback(resolve), generateCallback(onStep));
            });
        }
    }

    _findPeer(peerid, callback, onStep) {
        if (!Peer.isValidPeerid(peerid)) {
            if (callback) {
                callback(DHTResult.INVALID_ARGS, []);
            }
            LOG_ASSERT(false, `LOCALPEER(${this.m_bucket.localPeer.peerid}) findPeer peerid is invalid args:${peerid}.`);
            return DHTResult.INVALID_ARGS;
        }

        /* 就算是搜索自己，也可以返回距离自己较近的几个节点，在某些应用场景也是有价值的
        let peer = this.m_bucket.findPeer(peerid);
        if (peer && this.m_bucket.localPeer.peerid === peerid) {
            callback(DHTResult.SUCCESS, []);
            return DHTResult.SUCCESS;
        }
        */
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) findPeer peerid(${peerid}).`);

        this.m_taskExecutor.findPeer(peerid, true, callback, onStep);
        return DHTResult.PENDING;
    }

    saveValue(tableName, keyName, value) {
        if (typeof tableName === 'string' && tableName.length > 0
            && typeof keyName === 'string' && keyName.length > 0 && keyName != TOTAL_KEY
            && value !== undefined && value !== null) {

            LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) saveValue (${tableName}:${keyName}:${value}).`);

            this.m_localValueMgr.saveValue(tableName, keyName, value);
            return DHTResult.SUCCESS;
        } else {
            LOG_ASSERT(false, `SaveValue invalid args, (tableName: ${tableName}, keyName: ${keyName}, value: ${value}).`);
            return DHTResult.INVALID_ARGS;
        }
    }

    deleteValue(tableName, keyName) {
        if (typeof tableName === 'string' && tableName.length > 0
            && typeof keyName === 'string' && keyName.length > 0) {

            LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) deleteValue (${tableName}:${keyName}).`);
                
            this.m_localValueMgr.deleteValue(tableName, keyName);
            return DHTResult.SUCCESS;
        } else {
            LOG_ASSERT(false, `DeleteValue invalid args, (tableName: ${tableName}, keyName: ${keyName}).`);
            return DHTResult.INVALID_ARGS;
        }
    }

    // callback({result, values: Map<key, value>})
    getValue(tableName, keyName, flags = FLAG_PRECISE, callback = undefined) {
        const generateCallback = handler => {
            this._getValue(tableName, keyName, flags, (result, values = new Map()) => {
                handler({result, values})
            });
        }

        if (callback) {
            generateCallback(callback)
        } else {
            return new Promise(resolve => generateCallback(resolve))
        }
    }

    _getValue(tableName, keyName, flags = FLAG_PRECISE, callback = undefined) {
        if (typeof tableName === 'string' && tableName.length > 0
            && typeof keyName === 'string' && keyName.length > 0) {

            LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) getValue (${tableName}:${keyName}), flags:${flags}.`);
                
            // 可能本地节点就是最距离目标table最近的节点
/*            let values = null;
            if (keyName === TOTAL_KEY
                || (flags & FLAG_PRECISE)) {
                values = this.m_distributedValueTable.findValue(tableName, keyName);
            } else {
                values = this.m_distributedValueTable.findClosestValues(tableName, keyName);
            }

            if (values) {
                let localValues = this.m_localValueMgr.getValue(tableName, keyName);
                if (localValues && localValues.size > 0) {
                    localValues.forEach((value, key) => values.set(key, value));
                }

                if (callback) {
                    callback(DHTResult.SUCCESS, values);
                }
                return DHTResult.SUCCESS;
            }
            */

            const getValueCallback = (result, values, arrivedPeerids) => {
                let localValues = this.m_localValueMgr.getValue(tableName, keyName);
                if (localValues && localValues.size > 0) {
                    if (!values) {
                        values = new Map();
                    }
                    localValues.forEach((value, key) => values.set(key, value));
                }

                if (callback) {
                    if (values && values.size > 0) {
                        result = DHTResult.SUCCESS;
                    }
                    callback({result, values});
                }
            }

            this.m_taskExecutor.getValue(tableName, keyName, flags, {ttl: 1, isForward: false}, getValueCallback);

            return DHTResult.PENDING;
        } else {
            LOG_ASSERT(false, `GetValue invalid args, (tableName: ${tableName}, keyName: ${keyName}).`);
            return DHTResult.INVALID_ARGS;
        }
    }

    emitBroadcastEvent(eventName, params) {
        return this._emitBroadcastEvent(eventName, params);
    }

    _emitBroadcastEvent(eventName, params) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) emitBroadcastEvent(${eventName}:${params})`);
        if (typeof eventName === 'string') {
            this.m_taskExecutor.emitBroadcastEvent(eventName,
                params,
                this.m_bucket.localPeer,
                null,
                {});
            return DHTResult.PENDING;
        } else {
            LOG_ASSERT(false, `emitBroadcastEvent invalid args, (eventName type: ${typeof eventName}).`);
            return DHTResult.INVALID_ARGS;
        }
    }

    // listener(eventName, params, sourcePeer)
    attachBroadcastEventListener(eventName, listener) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) attachBroadcastEventListener(${eventName})`);
        if (typeof eventName === 'string' && typeof listener === 'function') {
            this.m_broadcastEventEmitter.on(eventName, listener);
            return {eventName, listener, result: DHTResult.SUCCESS};
        } else {
            LOG_ASSERT(false, `attachBroadcastEventListener invalid args type, (eventName type: ${typeof eventName}, listener type: ${typeof listener}).`);
            return {result: DHTResult.INVALID_ARGS};
        }
    }

    // attachBroadcastEventListener相同输入参数
    detachBroadcastEventListener(eventName, listener) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) detachBroadcastEventListener(${eventName})`);
        if (typeof eventName === 'string' && typeof listener === 'function') {
            this.m_broadcastEventEmitter.removeListener(eventName, listener);
            return DHTResult.SUCCESS;
        } else {
            LOG_ASSERT(false, `detachBroadcastEventListener invalid args type, (eventName type: ${typeof eventName}, listener type: ${typeof listener}).`);
            return DHTResult.INVALID_ARGS;
        }
    }

    get servicePath() {
        return ROOT_SERVICE_PATH;
    }

    get serviceID() {
        return BASE_DHT_SERVICE_ID;
    }

    prepareServiceDHT(servicePath) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) prepareServiceDHT(${servicePath})`);
        if (!servicePath || servicePath.length <= 0) {
            LOG_ASSERT(false, `prepareServiceDHT invalid args type, (servicePath: ${servicePath}).`);
            return null;
        }

        let fatherDHT = this;
        let serviceDHT = null;
        for (let serviceID of servicePath) {
            serviceDHT = fatherDHT.m_subServiceDHTs.get(serviceID);
            if (!serviceDHT) {
                serviceDHT = new ServiceDHT(fatherDHT, serviceID);
                fatherDHT.m_subServiceDHTs.set(serviceID, serviceDHT);
            }
            fatherDHT = serviceDHT;
        }

        return serviceDHT;
    }

    findServiceDHT(servicePath) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) prepareServiceDHT(${servicePath})`);
        if (!servicePath || servicePath.length <= 0) {
            LOG_ASSERT(false, `findServiceDHT invalid args type, (servicePath: ${servicePath}).`);
            return null;
        }

        let fatherDHT = this;
        let serviceDHT = null;
        for (let serviceID of servicePath) {
            serviceDHT = fatherDHT.m_subServiceDHTs.get(serviceID);
            if (!serviceDHT) {
                return null;
            }
            fatherDHT = serviceDHT;
        }
        return serviceDHT;
    }

    getAllOnlinePeers() {
        let peerList = [];
        this.m_bucket.forEachPeer(peer => {
            if (!peer.isTimeout(this.m_bucket.TIMEOUT_MS)) {
                peerList.push(new Peer(peer));
            }
        });
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) getAllOnlinePeers(count=${peerList.length})`);
        return peerList;
    }


    // @param  <number> count
    // @param  <boolean> fromLocal
    // @param  <function> callback({result, peerlist})
    // @param  <function> onStep({result, peerlist})
    getRandomPeers(count, fromLocal, callback, onStep) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) getRandomPeers count(${count}).`);

        // @var <array> peers
        if (fromLocal) {
            const peerlist = this.m_bucket.getRandomPeers({count}).map(peer => new Peer(peer));
            if (callback) {
                callback({result: DHTResult.SUCCESS, peerlist});
            } else {
                return Promise.resolve({result: DHTResult.SUCCESS, peerlist});
            }
            return DHTResult.SUCCESS;
        }

        const generateCallback = (handler) => (result, peers = []) => {
            if (!handler) {
                return;
            }
            return handler({result, peerlist: peers});
        }

        if (callback) {
            this.m_taskExecutor.findRandomPeer(count, true, generateCallback(callback), generateCallback(onStep));
            return DHTResult.PENDING;
        } else {
            return new Promise(resolve => {
                this.m_taskExecutor.findRandomPeer(count, true, generateCallback(resolve), generateCallback(onStep));
            });
        }
    }

    // private:
    // servicePath是协议包所属目标服务相对当前子服务的子路径
    _process(cmdPackage, remotePeer, remoteAddr, localAddr, servicePath) {
        LOG_TRACE(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) Got package(${DHTCommandType.toString(cmdPackage.cmdType)}), servicePath: ${cmdPackage.servicePath}`);
        if (!servicePath) {
            let targetServicePath = cmdPackage.servicePath || [];
            let selfServicePath = this.servicePath;
            if (targetServicePath.length < selfServicePath.length) {
                return;
            }
            for (let i = 0; i < selfServicePath.length; i++) {
                if (selfServicePath[i] !== targetServicePath[i]) {
                    return;
                }
            }
            servicePath = targetServicePath.slice(selfServicePath.length);
        }

        let [childServiceID, ...grandServicePath] = servicePath;
        if (!childServiceID) {
            if (this.isRunning()) {
                this.m_packageProcessor.process(cmdPackage, remotePeer, remoteAddr, localAddr);
            }
        } else {
            let childServiceDHT = this.m_subServiceDHTs.get(childServiceID);
            if (childServiceDHT) {
                childServiceDHT._process(cmdPackage, remotePeer, remoteAddr, localAddr, grandServicePath);
            }
        }
    }

    // serviceDescriptor是当前子服务网络的描述符
    _activePeer(peer, isSent, isReceived, isTrust, serviceDescriptor, cmdPackage) {
        // LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) Got new peer(${peer.peerid}) for (send:${isSent},recv:${isReceived},trust:${isTrust}),serviceDescriptor=${serviceDescriptor}`);
        if (!serviceDescriptor) {
            serviceDescriptor = peer.findService(this.servicePath);
            if (!serviceDescriptor) {
                this.m_bucket.removePeer(peer.peerid);
                return;
            }
        }

        let activedPeer = peer;
        if (serviceDescriptor.isSigninServer()) {
            if (this.isRunning()) {
                let existPeer = this.m_bucket.findPeer(peer.peerid);
                let isOnlineBefore = existPeer? existPeer.isOnline(this.m_bucket.TIMEOUT_MS) : true;
                let {peer: activedPeer, isNew, discard, replace} = this.m_bucket.activePeer(peer, isSent, isReceived, isTrust);
                if (isNew && !discard) {
                    LOG_TRACE(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) Got new peer(${peer.peerid}) for (send:${isSent},recv:${isReceived},trust:${isTrust}),serviceDescriptor=${serviceDescriptor}`);
                    this.m_routeTable.ping(activedPeer);
                }
            }
        } else {
            this.m_bucket.removePeer(peer.peerid);
        }

        let servicesForPeer = serviceDescriptor.services;
        if (this.m_subServiceDHTs) {
            this.m_subServiceDHTs.forEach((serviceDHT, serviceID) => {
                let serviceDescriptor = servicesForPeer? servicesForPeer.get(serviceID) : null;
                serviceDHT._activePeer(activedPeer, isSent, isReceived, isTrust, serviceDescriptor);
            });
        }
    }

    _update() {
        if (this.m_subServiceDHTs) {
            this.m_subServiceDHTs.forEach(serviceDHT => serviceDHT._update());
        }

        if (this.isRunning()) {
            this.m_localValueMgr.updateToRemote();
            this.m_distributedValueTable.clearOuttimeValues();

            // 刷新路由表带有盲目性，最后做，因为前面各种操作过后，路由表刷新中的部分操作（比如ping）就不需要了
            this.m_routeTable.refresh();
        }
    }

    isRunning() {
        return true;
    }

    _onSubServiceDHTStartWork(subServiceDHT) {
        this._fillNewSubServiceDHT(subServiceDHT);
    }

    _onSubServiceDHTOffWork(subServiceDHT) {
        // 不删掉它，避免再次生成时产生多个对象
        // this.m_subServiceDHTs.delete(subServiceDHT.serviceID);
        if (this.m_subServiceDHTs.size === 0 && !this.isRunning() && this.m_father) {
            this.m_father._onSubServiceDHTOffWork(this);
        }
    }

    _fillNewSubServiceDHT(subServiceDHT) {
        this.m_bucket.forEachPeer(peer => subServiceDHT._activePeer(peer, false, false, false));
        if (this.m_father) {
            this.m_father._fillNewSubServiceDHT(subServiceDHT);
        }
    }

    _logStatus() {
        let now = TimeHelper.uptimeMS();
        this.__lastLogTime = this.__lastLogTime || 0;
        if (now - this.__lastLogTime >= 600000) {
            this.__lastLogTime = now;
            LOG_DEBUG(`DHT.status(serviceID:${this.servicePath}):`);

            LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath})<><><><><>connected to ${this.m_bucket.peerCount} peers, bucketCount = ${this.m_bucket.bucketCount}.`);

            // print other peers (peerid, addres, eplist) except myself
            this.m_bucket.m_buckets.forEach( bucket => {

                // @var {array<object>} get other peers
                let peerList = bucket.peerList.filter(peer => {
                    return true;
                }).map(peer => {
                    return {
                        peerid: peer.peerid,
                        eplist: peer.eplist,
                        address:peer.address,
                        RTT: peer.RTT,
                    };
                });

                LOG_DEBUG('peerlist:', peerList);
            });

            if (!this.m_stat) {
                return;
            }
            let logPkgStat = stat => {
                LOG_DEBUG(`udp:${JSON.stringify(stat.udp)}`);
                LOG_DEBUG(`tcp:${JSON.stringify(stat.tcp)}`);
                let pkgsArray = [...stat.pkgs];
                LOG_DEBUG(`pkgs(cmdType,count):${JSON.stringify(pkgsArray)}`);
            };
            LOG_DEBUG('pkg.stat.recv:');
            logPkgStat(this.m_stat);
            LOG_DEBUG('pkg.stat.send:');
            logPkgStat(SendStat.stat());
        }
        this.m_subServiceDHTs.forEach(sub => sub._logStatus());
    }
}

class DHT extends DHTBase {
    /*
    PEERINFO: {
         peerid: string,
         eplist: ARRAY[ep_string], // 因为tcp端口不可复用，主动向其他peer发起的连接都可能用不同的端口，无法通过通信端口识别本地监听端口;
                                   // 所以使用tcp监听时必须用以下两种方式告知哪些地址是监听地址：
                                   // 1.eplist指定其监听EndPoint
                                   // 2.在调用process处理包时为socket.isReuseListener指定该socket是否使用了监听地址;
                                   // 而UDP协议本地发出和接收的端口就是监听端口，可以通过通信端口发现自己监听的eplist；
                                   // 初始化eplist和后面发现的监听地址都会被传播出去，而TCP主动发起连接的随机地址不会被传播；
         additionalInfo: ARRAY[[key_string, value]],
    }
    localPeerInfo: PEERINFO
     */
    constructor(mixSocket, localPeerInfo, appid = 0) {
        LOG_DEBUG(`DHT will be created with mixSocket:${mixSocket}, and localPeerInfo:(peerid:${localPeerInfo.peerid}, eplist:${localPeerInfo.eplist})`);
        LOG_ASSERT(Peer.isValidPeerid(localPeerInfo.peerid), `Local peerid is invalid:${localPeerInfo.peerid}.`);

        let localPeer = new LocalPeer(localPeerInfo);
        localPeer.___create_flag = 160809;
        let packageFactory = new DHTPackageFactory(appid);
        let taskMgr = new TaskMgr();
        super(mixSocket, localPeer, packageFactory, taskMgr);
        this.m_taskMgr = taskMgr;
        this.m_timer = null;
        this.m_highFrequencyTimer = null;

        this.m_piecePackageRebuilder = new PiecePackageRebuilder();

        SendStat.create(this.m_bucket);
        this.m_stat = {
            udp: {
                pkgs: 0,
                bytes: 0,
                req: 0,
                resp: 0,
            },
            tcp: {
                pkgs: 0,
                bytes: 0,
                req: 0,
                resp: 0,
            },
            pkgs: new Map(),
        }
    }

    start() {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) will start.`);

        if (!this.m_timer) {
            this.m_timer = setInterval(() => this._update(), 1000);
            // 对进行中的任务启用更高频的定时器，让任务处理更及时，并且压力更分散
            this.m_highFrequencyTimer = setInterval(() => {
                this.m_taskExecutor.taskMgr.wakeUpAllTask();
                this._logStatus();
            }, 200);
            
            this._activePeer(this.m_bucket.localPeer, false, false, false);
            this._update();
            setImmediate(() => this.emit(DHT.EVENT.start));
        }
    }

    stop() {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) will stop.`);
        if (this.m_timer) {
            clearInterval(this.m_timer);
            this.m_timer = null;
            clearInterval(this.m_highFrequencyTimer);
            this.m_highFrequencyTimer = null;
            setImmediate(() => this.emit(DHT.EVENT.stop));
        }

        this.___stopped_flag = 160809;
    }

    stat() {
        let senderStat = SendStat.stat();
        let map2Obj = __map => {
            let obj = {};
            __map.forEach((v, k) => obj[k] = v);
            return obj;
        };

        let stat = {
            udp: {
                send: {
                    pkgs: senderStat.udp.pkgs,
                    bytes: senderStat.udp.bytes,
                },
                recv: {
                    pkgs: this.m_stat.udp.pkgs,
                    bytes: this.m_stat.udp.bytes,
                },
                req: this.m_stat.udp.req,
                resp: this.m_stat.udp.resp,
            },
            tcp: {
                send: {
                    pkgs: senderStat.tcp.pkgs,
                    bytes: senderStat.tcp.bytes,
                },
                recv: {
                    pkgs: this.m_stat.tcp.pkgs,
                    bytes: this.m_stat.tcp.bytes,
                },
                req: this.m_stat.tcp.req,
                resp: this.m_stat.tcp.resp,
            },
            pkgs: {
                send: map2Obj(senderStat.pkgs),
                recv: map2Obj(this.m_stat.pkgs),
            },
        };


        return stat;
    }

    process(socket, message, remoteAddr, localAddr) {
        // LOG_DEBUG(`Got package from(${remoteAddr.address}:${remoteAddr.port})`);
        let localPeer = this.m_bucket.localPeer;
        let dhtDecoder = DHTPackageFactory.createDecoder(message, 0, message.length);
        if (!dhtDecoder) {
            LOG_ERROR(`LOCALPEER(${localPeer.peerid}:${this.servicePath}) Got Invalid message:${message}.`);
            return DHTResult.INVALID_PACKAGE;
        }

        // <TODO> 检查数据包的合法性
        let cmdPackage = dhtDecoder.decode();
        if (cmdPackage) {
            cmdPackage.__isCombine = message.__isCombine;
            this._onRecvPackage(cmdPackage, remoteAddr, message);
        }

        if (!cmdPackage || cmdPackage.appid !== this.m_packageFactory.appid) {
            LOG_WARN(`LOCALPEER(${localPeer.peerid}:${this.servicePath}) Got invalid package from(${remoteAddr.address}:${remoteAddr.port})`);
            return dhtDecoder.totalLength;
        }

        if (cmdPackage.servicePath && cmdPackage.servicePath.length) {
            LOG_DEBUG('[DHT]', 'servicePath: ',`${cmdPackage.servicePath}`);
        }

        const cmdType = cmdPackage.cmdType;
        if ((cmdType !== DHTCommandType.PACKAGE_PIECE_REQ && (!cmdPackage.dest || cmdPackage.dest.peerid !== localPeer.peerid))
            || !HashDistance.checkEqualHash(cmdPackage.dest.hash, localPeer.hash)) {
            LOG_WARN(`LOCALPEER(${localPeer.peerid}:${this.servicePath}) Got package(${DHTCommandType.toString(cmdType)}) ` + 
                `to other peer(id:${cmdPackage.dest.peerid},hash:${cmdPackage.dest.hash}),` +
                `localPeer is (id:${localPeer.peerid},hash:${localPeer.hash}),` +
                `from:${cmdPackage.src.peerid}:${EndPoint.toString(remoteAddr)}, to:${cmdPackage.common.dest.ep}`);
            return dhtDecoder.totalLength;
        }

        if (cmdType === DHTCommandType.PACKAGE_PIECE_REQ) {
            this._processPackagePiece(socket, cmdPackage, remoteAddr, localAddr);
            return dhtDecoder.totalLength;
        }

        if (typeof cmdPackage.src.peerid !== 'string' || cmdPackage.src.peerid.length === 0 ||
            !HashDistance.checkEqualHash(cmdPackage.src.hash, HashDistance.hash(cmdPackage.src.peerid))) {
            LOG_WARN(`LOCALPEER(${localPeer.peerid}:${this.servicePath}) Got package hash verify failed.(id:${cmdPackage.dest.peerid},hash:${cmdPackage.dest.hash}), localPeer is (id:${localPeer.peerid},hash:${localPeer.hash})`);
            return dhtDecoder.totalLength;
        }

        LOG_DEBUG(`LOCALPEER(${localPeer.peerid}:${this.servicePath}) Got package(${DHTPackage.CommandType.toString(cmdPackage.cmdType)}) from(${EndPoint.toString(remoteAddr)}|${cmdPackage.dest.peerid})`);
        if (cmdPackage.common.dest.ep) {
            // maintain local peer valid internet address
            localPeer.unionEplist([cmdPackage.common.dest.ep], socket.isReuseListener);
            // 被公网IPV4地址连通的包才可以用以辅助识别公网IP地址
            if (cmdPackage.src.peerid !== localPeer.peerid && 
                net.isIPv4(remoteAddr.address) && !EndPoint.isNAT(remoteAddr)) {
                localPeer.setSenderEP(cmdPackage.common.dest.ep, EndPoint.toString(localAddr));
            }
        }

        let remotePeer = new Peer(cmdPackage.common.src);
        remotePeer.address = remoteAddr;
        
        this._activePeer(remotePeer, false, true, true, null, cmdPackage);
        remotePeer = this.m_bucket.findPeer(remotePeer.peerid) || remotePeer;
        this._process(cmdPackage, remotePeer, remoteAddr, localAddr);

        this.m_routeTable.onRecvPackage(cmdPackage, socket, remotePeer, remoteAddr);

        if (cmdPackage.nodes) {
            cmdPackage.nodes.forEach(node => {
                if (node.id === 'string' && node.id.length > 0 &&
                    this.m_bucket.isExpandable(node.id)) {
                    this.m_taskExecutor.handshakeSource({peerid: node.id, eplist: node.eplist}, remotePeer, false, true);
                }
            });
        }

        return dhtDecoder.totalLength;
    }

    // 为了减少对应用层活动PEER的ping包，初始化中传入的socket上发送/接收任何包，应该通知一下DHT；
    // DHT模块可以减少对这些PEER的ping操作；
    // 启动时的初始节点也通过该接口传入；
    // remotePeerInfo：PEERINFO
    activePeer(remotePeerInfo, address, isSent, isReceived) {
        LOG_ASSERT(Peer.isValidPeerid(remotePeerInfo.peerid), `ActivePeer peerid is invalid:${remotePeerInfo.peerid}.`);
        if (!Peer.isValidPeerid(remotePeerInfo.peerid)) {
            return DHTResult.INVALID_ARGS;
        }

        let remotePeer = new Peer(remotePeerInfo);
        remotePeer.address = address;

        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) got new PEER(${remotePeerInfo.peerid}:${remotePeerInfo.eplist}) from user.`);
        this._activePeer(remotePeer, isSent, isReceived, false);
        return DHTResult.SUCCESS;
    }

    ping(remotePeerInfo, immediate) {
        LOG_ASSERT(Peer.isValidPeerid(remotePeerInfo.peerid), `ActivePeer peerid is invalid:${remotePeerInfo.peerid}.`);
        if (!Peer.isValidPeerid(remotePeerInfo.peerid)) {
            return DHTResult.INVALID_ARGS;
        }

        if (immediate || this.m_bucket.isExpandable(remotePeerInfo.peerid)) {
            this.m_routeTable.ping(remotePeerInfo);
        }
        return DHTResult.SUCCESS;
    }

    // 对某个节点发起主动握手
    handshake(remotePeer, agencyPeer, callback) {
        this.m_taskExecutor.handshakeSource(remotePeer, agencyPeer, false, false, null, callback);
    }

    updateLocalPeerAdditionalInfo(keyName, newValue) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) updateLocalPeerAdditionalInfo (${keyName}:${newValue}).`);
        this.m_bucket.localPeer.updateAdditionalInfo(keyName, newValue);
    }

    getLocalPeerAdditionalInfo(keyName) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) getLocalPeerAdditionalInfo (${keyName}).`);
        return this.m_bucket.localPeer.getAdditionalInfo(keyName);
    }

    deleteLocalPeerAdditionalInfo(keyName) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) deleteLocalPeerAdditionalInfo (${keyName}).`);
        return this.m_bucket.localPeer.deleteAdditionalInfo(keyName);
    }

    _update() {
        this.m_piecePackageRebuilder.clearTimeoutTasks();
        super._update()
    }

    _processPackagePiece(socket, cmdPackage, remoteAddr, localAddr) {
        if (!cmdPackage.body ||
            typeof cmdPackage.body.max === 'object' ||
            typeof cmdPackage.body.no === 'object' ||
            (!cmdPackage.body.max && cmdPackage.body.max !== 0) ||
            (!cmdPackage.body.no && cmdPackage.body.no !== 0) ||
            parseInt(cmdPackage.body.max) < parseInt(cmdPackage.body.no)) {
                return;
        }

        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) got package piece (taskid:${cmdPackage.body.taskid},max:${cmdPackage.body.max},no:${cmdPackage.body.no}).`);

        cmdPackage.body.max = parseInt(cmdPackage.body.max);
        cmdPackage.body.no = parseInt(cmdPackage.body.no);
        
        let respPackage = this.m_packageFactory.createPackage(DHTCommandType.PACKAGE_PIECE_RESP);
        respPackage.common.ackSeq = cmdPackage.common.seq;
        respPackage.body = {
            taskid: cmdPackage.body.taskid,
            no: cmdPackage.body.no,
        };

        let remotePeerInfo = {
            peerid: cmdPackage.body.peerid,
            eplist: [EndPoint.toString(remoteAddr)],
        };
        this.m_packageSender.sendPackage(remotePeerInfo, respPackage);

        let originalPackageBuffer = this.m_piecePackageRebuilder.onGotNewPiece(cmdPackage);
        if (originalPackageBuffer) {
            originalPackageBuffer.__isCombine = true;
            process.nextTick(() => this.process(socket, originalPackageBuffer, remoteAddr, localAddr));
        }
    }

    _onRecvPackage(cmdPackage, remoteAddr, message) {
        let localPeer = this.m_bucket.localPeer;
        if (!EndPoint.isNAT(remoteAddr)) {
            let stat = this.m_stat.tcp;
            if (remoteAddr.protocol === EndPoint.PROTOCOL.udp) {
                stat = this.m_stat.udp;
            }
            stat.pkgs++;
            stat.bytes += message.length;
    
            let isResp = DHTCommandType.isResp(cmdPackage.cmdType);
            localPeer.onPackageRecved(isResp);
            if (isResp) {
                stat.resp++;
            } else {
                stat.req++;
            }
        }

        let cmdType = cmdPackage.cmdType;
        if (cmdPackage.__isCombine) {
            cmdType = (DHTCommandType.PACKAGE_PIECE_REQ << 16) | cmdType;
        }
        let count = this.m_stat.pkgs.get(cmdType) || 0;
        count++;
        this.m_stat.pkgs.set(cmdType, count);
    }
}

DHT.EVENT = {
    start: 'start',
    stop: 'stop',
};

DHT.RESULT = DHTResult;
DHT.Package = DHTPackage;

class ServiceDHT extends DHTBase {
    constructor(father, serviceID) {
        super(father.m_packageSender.mixSocket,
            father.m_bucket.localPeer,
            father.m_packageFactory,
            father.m_taskExecutor.taskMgr);

        this.m_father = father;
        this.m_serviceID = serviceID;

        if (father.servicePath.length > 0) {
            this.m_servicePath = [...father.servicePath, this.serviceID];
        } else {
            this.m_servicePath = [this.serviceID];
        }
        this.m_taskExecutor.servicePath = this.m_servicePath;
        this.m_packageProcessor.servicePath = this.m_servicePath;
        this.m_flags = 0;
    }

    get servicePath() {
        return this.m_servicePath;
    }

    get serviceID() {
        return this.m_serviceID;
    }

    signinVistor() {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) signinVistor.`);
        let isRunningBefore = this.isRunning();
        this.m_flags |= ServiceDHT.FLAGS_SIGNIN_VISTOR;

        if (!isRunningBefore) {
            this._onStartWork();
        }
    }

    signoutVistor() {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) signoutVistor.`);
        this.m_flags &= ~ServiceDHT.FLAGS_SIGNIN_VISTOR;
        if (this.m_subServiceDHTs.size === 0 && !this.isRunning()) {
            this.m_father._onSubServiceDHTOffWork(this);
        }
    }

    signinServer() {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) signinServer.`);
        let isRunningBefore = this.isRunning();
        this.m_flags |= ServiceDHT.FLAGS_SIGNIN_SERVER;
        let localPeer = this.m_bucket.localPeer;
        localPeer.signinService(this.m_servicePath);
        this.m_bucket.activePeer(localPeer);
        if (!isRunningBefore) {
            this._onStartWork();
        }
    }

    signoutServer() {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) signoutServer.`);
        this.m_flags &= ~ServiceDHT.FLAGS_SIGNIN_SERVER;
        let localPeer = this.m_bucket.localPeer;
        localPeer.signoutService(this.m_servicePath);
        this.m_bucket.removePeer(localPeer.peerid);
        if (this.m_subServiceDHTs.size === 0 && !this.isRunning()) {
            this.m_father._onSubServiceDHTOffWork(this);
        }
    }

    updateServiceInfo(key, value) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) updateServiceInfo(${key}:${value}).`);
        this.m_bucket.localPeer.updateServiceInfo(this.m_servicePath, key, value);
    }

    getServiceInfo(key) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) getServiceInfo(${key}).`);
        let value = this.m_bucket.localPeer.getServiceInfo(this.m_servicePath, key);
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) getServiceInfo(${key}:${value}).`);
        return value;
    }

    deleteServiceInfo(key) {
        LOG_DEBUG(`LOCALPEER(${this.m_bucket.localPeer.peerid}:${this.servicePath}) deleteServiceInfo(${key}).`);
        this.m_bucket.localPeer.deleteServiceInfo(this.m_servicePath, key);
    }

    isRunning() {
        return this.m_flags != 0;
    }

    _onStartWork() {
        this.m_father._onSubServiceDHTStartWork(this);
        if (this.m_subServiceDHTs) {
            this.m_subServiceDHTs.forEach(subSrv => subSrv._onSuperServiceStartWork(this));
        }
    }

    _onSuperServiceStartWork(superService) {
        this.m_bucket.forEachPeer(peer => superService._activePeer(peer, false, false, false));
        if (this.m_subServiceDHTs) {
            this.m_subServiceDHTs.forEach(subSrv => subSrv._onSuperServiceStartWork(superService));
        }
    }
}
ServiceDHT.FLAGS_SIGNIN_VISTOR = 0x1;
ServiceDHT.FLAGS_SIGNIN_SERVER = 0x1 << 1;

module.exports = DHT;
