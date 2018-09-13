<template>
    <div class="vote">
        <h3 class="title">Vote</h3>
        <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign">
            <el-form-item label="FROM">
                <el-select class="select-from" v-model="formLabelAlign.from" placeholder="" @change="selectFrom">
                    <el-option v-for="(item, index) in balance" :key="item.id" :label="'Account-' + ++index" :value="item.address"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Votes">
                <el-input v-model="formLabelAlign.votes"></el-input>
            </el-form-item>
            <!--<el-form-item label="AMOUNT">-->
                <!--<el-input v-model="formLabelAlign.amount">{{formLabelAlign.amount}}</el-input>-->
            <!--</el-form-item>-->
            <el-form-item label="BALANCE">
                <el-input class="balance" v-model="formLabelAlign.balance" readonly>{{formLabelAlign.balance}}</el-input>
            </el-form-item>
        </el-form>
        <template>
            <el-row class="candidates">
                <el-col :span="8">
                    <span class="title">Candidates</span>
                </el-col>
            </el-row>
            <el-table
                    :data="candidates"
                    tooltip-effect="dark"
                    style="width: 100%"
                    @selection-change="handleSelectionChange">
                <el-table-column
                        type="selection"
                        width="55">
                </el-table-column>
                <el-table-column
                        label="Address"
                        width="500">
                    <template slot-scope="scope">{{ scope.row.address }}</template>
                </el-table-column>
                <el-table-column
                        prop="votes"
                        label="Votes"
                        show-overflow-tooltip>
                </el-table-column>
            </el-table>
            <!--<div style="margin-top: 20px">-->
                <!--<el-button @click="toggleSelection([tableData3[1], tableData3[2]])">切换第二、第三行的选中状态</el-button>-->
                <!--<el-button @click="toggleSelection()">取消选择</el-button>-->
            <!--</div>-->
        </template>
        <el-row>
            <el-col :span="8" class="fee">
                <span class="title">SELECT FEE</span>
                <p><b>{{formLabelAlign.fee/20}}</b> INT</p>
                <el-slider v-model="formLabelAlign.fee"></el-slider>
            </el-col>
        </el-row>
        <el-row>
            <el-col :span="8" class="total">
                <span class="title">TOTAL</span>
                <p><b>{{formLabelAlign.fee/20}}</b> INT</p>
            </el-col>
        </el-row>
        <hr>
        <el-row>
            <el-col :span="4">
                <el-button type="primary" @click="sendTransaction">SEND</el-button>
            </el-col>
        </el-row>
        <el-dialog
                title="Transaction"
                :visible.sync="centerDialogVisible"
                width="40%"
                center>
            <p>From: <span>{{formLabelAlign.from}}</span></p>
            <p>Votes: <span>{{formLabelAlign.votes}}</span></p>
            <p>Fee: <span>{{formLabelAlign.fee/20}}</span></p>
            <p>Password: <input type="password" placeholder="Enter password" v-model="password"></p>
            <span slot="footer" class="dialog-footer">
            <el-button @click="cancelTransaction">Cancel</el-button>
            <el-button type="primary" @click="submitTransaction">Send Transaction</el-button>
          </span>
        </el-dialog>

    </div>
</template>

<script>
  import Intjs from 'intjs';
  // import { ipcRenderer } from 'electron';
  import fs from 'fs';

  const intjs = new Intjs('localhost', 18089);
  export default {
    name: 'vote',
    data() {
      return {
        fileName: [],
        balance: [],
        checkedFrom: '',
        checked: false,
        isSelected: true,
        labelPosition: 'top',
        centerDialogVisible: false,
        password: '',
        formLabelAlign: {
          from: '',
          votes: 0.00,
          // amount: 0.00,
          balance: 0.00,
          fee: 20,
        },
        candidates: [],
        multipleSelection: [],
      };
    },
    components: {

    },
    methods: {
      /* eslint-disable */
      /**
       * 初始化
       * */
      init () {
        let rootDir = process.cwd();
        let keystorePath = `${rootDir}/data/keystore/`;

        if (!fs.existsSync(keystorePath)) {
          fs.mkdir(keystorePath);
        }
        this.readDir(keystorePath).then(
          (data) => {
            this.fileName = data;
            this.fileName.forEach(async (value) => {
              let address = value.slice(0, -5);
              let result = await intjs.getBalance(address);

              this.balance.push({address: address, balance: result.balance});
            });
          },
          (err) => {
            console.log('readDir error;' + err);
          });
        this.getAllCandidates();
      },
      /**
       * 读取目录下所有文件
       */
      readDir (path) {
        return new Promise((resolve, reject) => {
          fs.readdir(path, (err, files) => {
            if (err) {
              reject(err);
            } else {
              resolve(files);
            }
          });
        });
      },

      /***
       * 获取所有候选节点及票数
       */
      getAllCandidates() {
        setImmediate(async () => {
          let candidates = await intjs.getCandidates();
          let voteResult = await intjs.getVote();

          if (candidates.err) {
            this.$message.error(candidates.err);
          } else if (candidates.length !== 0) {
            for (let i = 0; i < candidates.length; i++) {
              this.candidates.push({address: candidates[i], votes: 0});
            }
          }

          if (voteResult.err) {
            this.$message.error(voteResult.err);
          } else if (voteResult.vote.size !== 0) {
            this.candidates.forEach( (value) => {
              // console.log(value);
              // console.log(voteResult.vote.get(value.address));
              if (voteResult.vote.get(value.address)) {
                value.votes = voteResult.vote.get(value.address);
              }
            });
          }

          this.candidates.sort((a, b) => {
            return (b.votes - a.votes);
          });
        });
      },

      selectFrom () {
        if (this.formLabelAlign.from) {
          this.balance.forEach((value) => {
            if (value.address === this.formLabelAlign.from) {
              this.formLabelAlign.balance = value.balance;
            }
          });
          setImmediate(async () => {
            let result = await intjs.getStoke(this.formLabelAlign.from);
            if (result.err) {
              this.$message.error(result.err);
              return;
            } else {
              this.formLabelAlign.votes = result.stoke;
            }
          });
        } else {
          this.$message({
            message: '请选择一个地址',
            type: 'warning'
          });
        }
      },

      sendTransaction() {
        if (this.formLabelAlign.from === '') {
          this.$message.error('请选择 From 地址');
        } else if (this.formLabelAlign.votes === 0) {
          this.$message.error('余额为0，请先换票');
        } else if (this.multipleSelection.length === 0) {
          this.$message.error('请至少选择一个候选节点');
        } else if (this.formLabelAlign.fee < 0.005) {
          this.$message.error('交易费用必须大于等于0.005 INT');
        } else if (this.formLabelAlign.balance < 0.005) {
          this.$message.error('余额不足');
        } else {
          this.centerDialogVisible = true;
        }
      },

      cancelTransaction() {
        this.centerDialogVisible = false;
        this.$message.error('取消投票');
      },

      submitTransaction() {
        if (this.password === '') {
          this.$message.error('请输入密码');
        } else if (this.password.length < 9) {
          this.$message.error('密码长度必须大于等于9');
        } else {
          let rootDir = process.cwd();
          let keystorePath = `${rootDir}/data/keystore/${this.formLabelAlign.from}.json`;

          fs.readFile(keystorePath, 'utf8', async (err, data) => {
            if (err) {
              this.centerDialogVisible = false;
              this.$message.error('帐号文件不存在');
            } else {
              let keystore = JSON.parse(data);
              // console.log(keystore);
              // console.log(this.password);
              let account = intjs.decrypt(keystore, this.password);
              // console.log(account);
              let result = await intjs.vote(this.multipleSelection, (this.formLabelAlign.fee/20*10^18).toString(), account.privateKey.toString());
              if (result.err) {
                this.$message.error(result.err);
              } else {
                this.centerDialogVisible = false;
                this.$message({
                  message: `投票成功，hash:${result.hash}`,
                  type: 'success'
                });
              }
            }
          })
        }
      },

      handleSelectionChange(val) {
        if (val.length !== 0) {
          val.forEach((value) => {
            this.multipleSelection.push(value.address);
          });
        }
      }
    },
    computed: {

    },
    mounted() {
      this.init();
    },
  };
</script>

<style scoped lang="scss">
    .vote {
        padding: 20px 40px;
        .el-form {
            min-height: 200px;
            margin-top: 30px;
            margin-bottom: 30px;
        }
        .want-to-send {
            margin-top: 20px!important;
        }
        .el-form-item {
            float: left;
            width: 45%;
            margin-right: 20px;
            .el-select {
                width: 100%;
            }
        }
        .el-row {
            margin: 50px 0;
            .title {
                display: inline-block;
                font-weight: 500;
                margin-bottom: 20px;
            }
            .fee {

            }
        }
        .el-dialog {
            min-height: 100px!important;
            .el-dialog__header {

            }
            .el-dialog__body {
                min-height: 100px;
                .el-from {
                    min-height: 80px;
                }
                p {
                    width: 100%;
                    margin: 10px auto;
                    span {
                        font-size: 12px;
                    }
                    input {
                        padding: 5px 10px;
                    }
                }
            }
        }
        .candidates {
            margin-bottom: 10px;
        }
    }
</style>