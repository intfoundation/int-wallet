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

const Base = require('../../base/base.js');
const {Result: DHTResult, Config} = require('../util.js');
const BaseUtil = require('../../base/util.js');
const TimeHelper = BaseUtil.TimeHelper;

const LOG_INFO = Base.BX_INFO;
const LOG_WARN = Base.BX_WARN;
const LOG_DEBUG = Base.BX_DEBUG;
const LOG_CHECK = Base.BX_CHECK;
const LOG_ASSERT = Base.BX_ASSERT;
const LOG_ERROR = Base.BX_ERROR;

const TaskConfig = Config.Task;

class Task {
    constructor(owner, {timeout = TaskConfig.TimeoutMS, maxIdleTime = TaskConfig.MaxIdleTimeMS} = {}) {
        if (new.target === Task) {
            throw new Error('Task is a base class, it must be extended.');
        }

        if (!timeout) {
            timeout = TaskConfig.TimeoutMS;
        }
        let now = TimeHelper.uptimeMS();
        this.m_owner = owner;
        this.m_id = owner.genTaskID();
        this.m_startTime = now;
        this.m_timeout = timeout || TaskConfig.TimeoutMS;
        this.m_lastActiveTime = now;
        this.m_maxIdleTime = maxIdleTime;

        this.m_callbackList = [];
    }

    get id() {
        return this.m_id
    }

    get type() {
        return this.constructor.name;
    }

    get isComplete() {
        return this.m_isComplete;
    }

    get deadline() {
        return this.m_startTime + this.m_timeout;
    }

    get consum() {
        return TimeHelper.uptimeMS() - this.m_startTime;
    }

    start() {
        this._startImpl();
    }

    process(cmd, ...args) {
        this.m_lastActiveTime = TimeHelper.uptimeMS();
        this._processImpl(cmd, ...args);
    }

    wakeUp() {
        let now = TimeHelper.uptimeMS();

        if (now - this.m_startTime > this.m_timeout) {
            this._onComplete(DHTResult.TIMEOUT);
            return;
        }

        if (now - this.m_lastActiveTime > this.m_maxIdleTime) {
            this.m_lastActiveTime = now;
            this._retry();
        }
    }
    
    stop() {
        this._stopImpl();
        this._onComplete(DHTResult.STOPPED);
    }

    get bucket() {
        return this.m_owner.bucket;
    }

    get packageFactory() {
        return this.m_owner.packageFactory;
    }

    get packageSender() {
        return this.m_owner.packageSender;
    }

    get distributedValueTable() {
        return this.m_owner.distributedValueTable;
    }

    get servicePath() {
        return this.m_owner.servicePath;
    }
    
    addCallback(callback) {
        this.m_callbackList.push(callback);
    }

    static genGlobalTaskID(peerid, taskid) {
        return `@pid:${peerid}@tid:${taskid}`;
    }

    _retry() {
        this._retryImpl();
    }

    _onComplete(result) {
        this.m_isComplete = true;
        this.m_owner.onTaskComplete(this);
        this._onCompleteImpl(result);
        setImmediate(() => this.m_callbackList = []);
    }

    _callback(...args) {
        this.m_callbackList.forEach(callback => setImmediate(() => callback(...args)));
    }

    // override 子类必须明确重载下列函数以明确行为
    _startImpl() {
        throw new Error('Task._startImpl it must be override.');
    }
    
    _stopImpl() {
        throw new Error('Task._stopImpl it must be override.');
    }

    _processImpl() {
        throw new Error('Task._processImpl it must be override.');
    }

    _retryImpl() {
        throw new Error('Task._retryImpl it must be override.');
    }

    _onCompleteImpl(result) {
        throw new Error('Task._onCompleteImpl it must be override.');
    }
}

module.exports = Task;