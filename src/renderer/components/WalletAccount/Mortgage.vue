<template>
    <div class="mortgage">
        <div class="item-title">
            <i class="mortgage-icon icon-common"></i>
            <span class="item-text">Mortgage</span>
        </div>

        <div class="item-content">
            <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign" class="transactionForm">
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
                    <el-checkbox v-model="checked">Mortgage all</el-checkbox>
                </template>

                <el-row class="want-to-send">
                    <el-col :span="7">
                        You want to mortgage <span style="font-size: 16px;color: #3c31d7;">{{formLabelAlign.amount}}</span> votes.
                    </el-col>
                </el-row>

                <el-row style="margin-top: 40px;">
                    <el-col  class="fee">
                        <span class="title">SELECT FEE</span>
                        <p><b>{{formLabelAlign.fee/20}}</b> INT</p>
                        <el-slider v-model="formLabelAlign.fee"></el-slider>
                        <div>
                            <span>CHEAPER</span>
                            <span style="float: right;">FASTER</span>
                        </div>
                    </el-col>
                    <el-col :span="11" style="float: right;">
                        <div class="declare1">This is the most amount of money that might be used to process this transaction. Your transaction will be mined</div>
                        <div class="declare2">probably within 30 seconds.</div>
                    </el-col>
                </el-row>

                <el-row>
                    <el-col :span="8" style="margin-top: 40px;">
                        <span class="title">TOTAL</span>
                        <p><span class="total-value">{{Number(formLabelAlign.amount) + formLabelAlign.fee/20}}</span> INT</p>
                    </el-col>
                </el-row>

                <el-button  class="send-btn"><span>SEND</span></el-button>
            </el-form>


        </div>
        <el-dialog
            title="Mortgage"
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

  const intjs = new Intjs('localhost', 18089);
  export default {
    name: 'mortgage',
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
      async init () {
        let files = await intjs.readFile();
        if (files.err) {
          this.$message.error('读取 keystore 文件名出错');
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
          this.$message.error('换票数不能为 0');
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
        this.$message.error('取消换票');
      },

      submitTransaction() {
        if (this.password === '') {
          this.$message.error('请输入密码');
        } else if (this.password.length < 9) {
          this.$message.error('密码长度必须大于等于9');
        } else {
          setImmediate(async() => {
            let keystore = await intjs.readKeystore(this.formLabelAlign.account);
            if (keystore.err) {
              this.$message.error('读取 keystore 文件出错');
            } else {
              let keyParse = JSON.parse(keystore);
              // console.log(keyParse);
              // console.log(this.password);
              let account = intjs.decrypt(keyParse, this.password);
              // console.log(account);
              let result = await intjs.mortgage((this.formLabelAlign.amount*10^18).toString(), (this.formLabelAlign.fee/20*10^18).toString(), account.privateKey.toString());
              if (result.err) {
                this.centerDialogVisible = false;
                this.$message.error('换票失败');
              } else {
                this.centerDialogVisible = false;
                this.$message({
                  message: `换票成功，hash:${result.hash}`,
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

<style lang="scss">
    .mortgage {
        border-radius: 5px;
        background-color: #fff;
        .mortgage-icon {
            width: 18px;
            height: 18px;
            background-image: url("../../assets/images/mortgage.png");
        }
        .want-to-send {
            margin-top: 20px !important;
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
            .title {
                display: inline-block;
                font-weight: 500;
                margin-bottom: 20px;
            }
        }
        .el-dialog {
            min-height: 100px !important;

        }
    }
</style>
