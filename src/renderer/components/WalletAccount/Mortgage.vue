<template>
    <div class="mortgage">
        <div class="item-title">
            <i class="mortgage-icon icon-common"></i>
            <span class="item-text">Mortgage</span>
        </div>

        <div class="item-content">
            <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign" class="transactionForm">
                <el-form-item label="ACCOUNT">
                    <el-select v-model="formLabelAlign.account" placeholder="" @change="selectAccount" style="display: block;">
                        <el-option
                            v-for="(item, index) in balance"
                            :key="index"
                            :label="'Account-' + ++index + '-balance-' + ((item.balance / Math.pow(10, 18)).toFixed(2))"
                            :value="item.address">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="VOTES">
                    <el-input v-model="formLabelAlign.votes" readonly></el-input>
                </el-form-item>
                <el-form-item label="AMOUNT">
                    <el-input v-model="formLabelAlign.amount"></el-input>
                </el-form-item>
                <el-form-item label="BALANCE">
                    <el-input class="balance" v-model="formLabelAlign.balance" readonly>{{formLabelAlign.balance}}</el-input>
                </el-form-item>
                <template>
                    <!-- `checked` 为 true 或 false -->
                    <el-checkbox v-model="checked" @click.native="sendEverything">Mortgage all</el-checkbox>
                </template>

                <el-row class="want-to-send">
                    <el-col :span="7">
                        You want to mortgage <span style="font-size: 16px;color: #3c31d7;">{{formLabelAlign.amount}}</span> votes.
                    </el-col>
                </el-row>

                <el-row style="margin-top: 40px;">
                    <el-col  class="fee">
                        <span class="title">SELECT FEE</span>
                        <p><b>{{txfee}}</b> INT</p>
                        <el-slider v-model="formLabelAlign.fee" :min="slideMin" :max="slideMax"></el-slider>
                        <div>
                            <span>CHEAPER</span>
                            <span style="float: right;">FASTER</span>
                        </div>
                    </el-col>
                    <el-col :span="11" style="float: right;">
                        <div class="declare1">This is the most amount of money that might be used to process this transaction. Your transaction will be mined</div>
                        <div class="declare2">probably within 10 seconds.</div>
                    </el-col>
                </el-row>

                <el-row>
                    <el-col :span="8" style="margin-top: 40px;">
                        <span class="title">TOTAL</span>
                        <p><span class="total-value">{{checked ? balanceValue : (formLabelAlign.amount + +txfee)}}</span> INT</p>
                    </el-col>
                </el-row>

                <el-button  class="send-btn" @click="sendTransaction"><span>SEND</span></el-button>
            </el-form>
        </div>
        <el-dialog
                title="Transaction"
                :visible.sync="centerDialogVisible"
                width="40%"
                center
                class="dark-blue-header two-btn">
            <div class="second-detail" style="padding-bottom: 15px;border-bottom: 1px solid #ccc;">
                <div>
                    <span>Amount:</span>
                    <!--这个单位还要根据前面的名称做动态绑定-->
                    <span>{{formLabelAlign.amount}}</span>
                </div>
                <div>
                    <span>From:</span>
                    <span>{{formLabelAlign.account}}</span>
                </div>
                <div>
                    You are about to execute a function of mortgage. This might involve transfer
                    of value.
                </div>
            </div>

            <div class="stripe">
                <div class="stripe-item">
                    <span>Gas limit</span>
                    <span>50000</span>
                </div>

                <div class="stripe-item">
                    <span>Gas price</span>
                    <span>{{formLabelAlign.fee}}</span>
                </div>

                <!--<div class="stripe-item">-->
                <!--<span>Gas price</span>-->
                <!--<span>0.002 INT per mllin gas</span>-->
                <!--</div>-->

                <div style="text-align: center">
                    <el-input type="password" placeholder="Enter password to confim the transaction" v-model="password"></el-input>
                </div>
            </div>
            <span slot="footer" class="dialog-footer">
              <el-row>
                <el-col :span="12"><el-button @click="cancelTransaction" class="btn1">Cancel</el-button></el-col>
                <el-col :span="12"><el-button class="btn2" @click="submitTransaction">Confirm</el-button></el-col>
              </el-row>
            </span>
        </el-dialog>

    </div>
</template>

<script>
  import Intjs from 'intjs';

  const intjs = new Intjs('localhost', 18089);
  /* eslint-disable */
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
        balanceValue: '',
        slideMin: 0,
        slideMax: 100,
        formLabelAlign: {
          account: '',
          votes: 0.00,
          amount: 0.00,
          balance: 0.00,
          fee: 20,
        },
      };
    },
    computed: {
      txfee () {
        let x = (this.formLabelAlign.fee * 50000) / Math.pow(10, 18);
        return x;
      }
    },
    methods: {
      sendActiveIndex () {
        this.$emit('listenToActive', 2)
      },
      sendEverything () {
        if (!this.checked) {
          this.formLabelAlign.amount = this.balanceValue - this.txfee;
        } else {
          this.formLabelAlign.amount = 0;
        }
      },
      /**
       * 初始化
       * */
      async init () {
        let files = await intjs.getAccounts();
        this.formLabelAlign.fee = await intjs.getPrice();
        // this.slideMin = 0;
        this.slideMax = 2000 * Math.pow(10, 9);
        if (files.err) {
          this.$message.error('读取 keystore 文件名出错');
        } else {
          this.fileName = files;
          let balanceArray = [];
          this.fileName.forEach(async (value) => {
            let address = value;
            let result = await intjs.getBalance(address);
            balanceArray.push({address: address, balance: result.balance });
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
              this.formLabelAlign.balance = (value.balance / Math.pow(10,18)).toFixed(2);
              this.balanceValue = value.balance / Math.pow(10,18);
            }
          });
          setImmediate(async () => {
            let result = await intjs.getStake(this.formLabelAlign.account);
            if (result.err) {
              this.$message.error('获取票据出错');
            } else {
              this.formLabelAlign.votes = (result.stake / Math.pow(10,18)).toFixed(2);
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
        } else if (+this.formLabelAlign.fee < 200*Math.pow(10,9)) {
            this.$message.error('手续费用太低');
        } else if (+this.formLabelAlign.fee > 2000*Math.pow(10,9)) {
            this.$message.error('手续费用太高');
        } else if (((+this.formLabelAlign.amount + this.txfee)*Math.pow(10,18)) > +this.balanceValue * Math.pow(10, 18)) {
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
            let params = {
              method: 'mortgage',
              value: this.formLabelAlign.amount*Math.pow(10, 18),
              limit: '500000',
              price: this.formLabelAlign.fee,
              input: this.formLabelAlign.amount*Math.pow(10,18),
              password: this.password,
              from: this.formLabelAlign.account
            }
              let result = await intjs.sendTransaction(params);
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
          });
        }
      },
    },
    mounted() {
      this.init();
      this.sendActiveIndex();
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
            min-width: 500px;
            max-width: 600px;

            .stripe {
                padding: 20px 10px 0px;
                .stripe-item {
                    background-color: #F4F8FF;
                    border-radius: 4px;
                    padding: 9px 14px;
                    margin-bottom: 10px;
                    font-size: 13px;
                    & > span:nth-of-type(2) {
                        float: right;
                    }
                }
                .el-input {
                    margin-top: 20px;
                    width: 300px;
                }
            }
        }
    }
</style>
