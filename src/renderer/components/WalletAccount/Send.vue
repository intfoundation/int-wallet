<template>
    <div class="send">
        <h3 class="title">Send</h3>
        <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign">
            <el-form-item label="FROM">
                <el-select class="select-from" v-model="formLabelAlign.from" placeholder="" @change="selectFrom">
                    <el-option v-for="(item, index) in balance" :key="item.address" :label="'Account-' + ++index" :value="item.address"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="TO">
                <el-input v-model="formLabelAlign.to"></el-input>
            </el-form-item>
            <el-form-item label="AMOUNT">
                <el-input v-model="formLabelAlign.amount">{{checked ? formLabelAlign.balance : formLabelAlign.amount}}</el-input>
            </el-form-item>
            <el-form-item label="BALANCE">
                <el-input class="balance" v-model="formLabelAlign.balance" readonly>{{formLabelAlign.balance}}</el-input>
            </el-form-item>
            <template>
                <!-- `checked` 为 true 或 false -->
                <el-checkbox v-model="checked">Send everything</el-checkbox>
            </template>
        </el-form>
        <el-row class="want-to-send">
            <el-col :span="6">
                You want to send <b>{{formLabelAlign.amount}} INT.</b>
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
                title="Transaction"
                :visible.sync="centerDialogVisible"
                width="40%"
                center>
            <p>From: <span>{{formLabelAlign.from}}</span></p>
            <p>To: <span>{{formLabelAlign.to}}</span></p>
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

  const intjs = new Intjs('localhost', 18089);

  export default {
    name: 'send',
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
          to: '',
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
      async init () {
        let files = await intjs.readFile();
        if (files.err) {
          this.$message.error('读取 keystore 文件出错');
        } else {
          this.fileName = files;
          let balanceArray = [];
          this.fileName.forEach(async (value) => {
            let address = value.slice(0, -5);
            let result = await intjs.getBalance(address);
            balanceArray.push({address: address, balance: result.balance});
          });
          // TODO 异步拿到的数据怎么排序？
          if (balanceArray.length !== 0) {
            balanceArray.sort(function (a, b) {
              console.log(b.balance - a.balance);
              return (b.balance - a.balance);
            });
          }
          this.balance = balanceArray;
        }
      },

      selectFrom () {
        if (this.formLabelAlign.from) {
          this.balance.forEach((value) => {
            if (value.address === this.formLabelAlign.from) {
              this.formLabelAlign.balance = value.balance;
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
        } else if (this.formLabelAlign.to === '') {
          this.$message.error('请输入 To 地址');
        } else if (Number(this.formLabelAlign.amount) === 0) {
          this.$message.error('转账金额不能为 0');
        } else if (this.formLabelAlign.fee < 0.005) {
          this.$message.error('交易费用必须大于等于0.005 INT');
        } else if ((this.formLabelAlign.balance < (Number(this.formLabelAlign.amount) + this.formLabelAlign.fee/20)) || this.formLabelAlign.balance === 0) {
          this.$message.error('余额不足');
        } else {
            this.centerDialogVisible = true;
        }
      },
      cancelTransaction() {
        this.centerDialogVisible = false;
        this.$message.error('取消交易');
      },
      submitTransaction() {
        if (this.password === '') {
          this.$message.error('请输入密码');
        } else if (this.password.length < 9) {
          this.$message.error('密码长度必须大于等于9');
        } else {
          setImmediate(async() => {
            let keystore = await intjs.readKeystore(this.formLabelAlign.from);
            if (keystore.err) {
              this.$message.error('读取 keystore 文件出错');
            } else {
              let keyParse = JSON.parse(keystore);
              // console.log(keyParse);
              // console.log(this.password);
              let account = intjs.decrypt(keyParse, this.password);
              // console.log(account);
              let result = await intjs.transferTo(this.formLabelAlign.to, (this.formLabelAlign.amount*10^18).toString(), (this.formLabelAlign.fee/20*10^18).toString(), account.privateKey.toString());
              if (result.err) {
                this.centerDialogVisible = false;
                this.$message.error('交易失败');
              } else {
                this.centerDialogVisible = false;
                this.$message({
                  message: `交易成功，hash:${result.hash}`,
                  type: 'success'
                });
              }
            }
          });

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
    .send {
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
