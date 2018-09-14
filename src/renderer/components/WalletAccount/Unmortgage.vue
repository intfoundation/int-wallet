<template>
    <div class="unmortgage">
        <h3 class="title">Unmortgage</h3>
        <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign">
            <el-form-item label="ACCOUNT">
                <el-select class="select-from" v-model="formLabelAlign.account" placeholder="" @change="selectAccount">
                    <el-option v-for="(item, index) in balance" :key="item.address" :label="'Account-' + ++index" :value="item.address"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="VOTES">
                <el-input v-model="formLabelAlign.votes" readonly></el-input>
            </el-form-item>
            <el-form-item label="AMOUNT">
                <el-input v-model="formLabelAlign.amount">{{formLabelAlign.amount}}</el-input>
            </el-form-item>
            <el-form-item label="BALANCE">
                <el-input class="balance" v-model="formLabelAlign.balance" readonly>{{formLabelAlign.balance}}</el-input>
            </el-form-item>
            <template>
                <!-- `checked` 为 true 或 false -->
                <el-checkbox v-model="checked">Unmortgage all</el-checkbox>
            </template>
        </el-form>
        <el-row class="want-to-send">
            <el-col :span="6">
                You want to unmortgage <b>{{formLabelAlign.amount}} votes.</b>
            </el-col>
        </el-row>
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
                <p><b>{{Number(formLabelAlign.amount) + formLabelAlign.fee/20}}</b> INT</p>
            </el-col>
        </el-row>
        <hr>
        <el-row>
            <el-col :span="4">
                <el-button type="primary" @click="sendTransaction">SEND</el-button>
            </el-col>
        </el-row>
        <el-dialog
                title="Unmortgage"
                :visible.sync="centerDialogVisible"
                width="40%"
                center>
            <p>Account: <span>{{formLabelAlign.account}}</span></p>
            <p>Votes: <span>{{formLabelAlign.votes}}</span></p>
            <p>Amount: <span>{{formLabelAlign.amount}}</span></p>
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
    name: 'unmortgage',
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
          account: '',
          votes: 0.00,
          amount: 0.00,
          balance: 0.00,
          fee: 20,
        },
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


      selectAccount() {
        if (this.formLabelAlign.account) {
          this.balance.forEach((value) => {
            if (value.address === this.formLabelAlign.account) {
              this.formLabelAlign.balance = value.balance;
            }
          });
          setImmediate(async () => {
            let result = await intjs.getStoke(this.formLabelAlign.account);
            if (result.err) {
              this.$message.error(result.err);
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
        if (this.formLabelAlign.account === '') {
          this.$message.error('请选择 Account 地址');
        } else if (Number(this.formLabelAlign.amount) === 0) {
          this.$message.error('换回的票数不能为 0');
        } else if (this.formLabelAlign.fee < 0.005) {
          this.$message.error('交易费用必须大于等于0.005 INT');
        } else if ((this.formLabelAlign.votes < Number(this.formLabelAlign.amount) )) {
          this.$message.error('余票不足');
        } else if (this.formLabelAlign.balance < 0.005) {
          this.$message.error('费用不足');
        } else {
          this.centerDialogVisible = true;
        }
      },

      cancelTransaction() {
        this.centerDialogVisible = false;
        this.$message.error('取消退票');
      },

      submitTransaction() {
        if (this.password === '') {
          this.$message.error('请输入密码');
        } else if (this.password.length < 9) {
          this.$message.error('密码长度必须大于等于9');
        } else {
          let rootDir = process.cwd();
          let keystorePath = `${rootDir}/data/keystore/${this.formLabelAlign.account}.json`;
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
              let result = await intjs.mortgage(this.formLabelAlign.amount.toString(), (this.formLabelAlign.fee/20*10^18).toString(), account.privateKey.toString());
              if (result.err) {
                this.$message.error(result.err);
              } else {
                this.centerDialogVisible = false;
                this.$message({
                  message: `退票成功，hash:${result.hash}`,
                  type: 'success'
                });
              }
            }
          })
        }
      },
    },
    computed: {

    },
    mounted() {
      this.init();
    },
  };
</script>

<style scoped lang="scss">
    .unmortgage {
        padding: 20px 40px;
        .el-form {
            margin-top: 30px;
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
    }
</style>