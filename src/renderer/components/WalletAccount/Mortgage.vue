<template>
    <div class="mortgage" v-loading="isloading">
        <div class="item-title">
            <i class="mortgage-icon icon-common"></i>
            <span class="item-text">Mortgage</span>
        </div>
        <div class="item-content">
            <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign" class="transactionForm">
                <el-form-item label="ACCOUNT">
                    <el-select v-model="formLabelAlign.from" placeholder="" @change="selectAccount" style="display: block;">
                        <el-option
                            v-for="(item, index) in accountList"
                            :key="index"
                            :label="'Account' + ++index + '-' + item"
                            :value="item">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="VOTES">
                    <el-input v-model="formLabelAlign.votes" readonly></el-input>
                </el-form-item>
                <el-form-item label="AMOUNT">
                    <el-input v-model="formLabelAlign.amount" :readonly="checked"></el-input>
                </el-form-item>
                <el-form-item label="BALANCE">
                    <el-input class="balance" v-model="formLabelAlign.balance" readonly>{{formLabelAlign.balance}}</el-input>
                </el-form-item>
                <template>
                    <!-- `checked` 为 true 或 false -->
                    <el-checkbox v-model="checked" @click.native="sendEverything">Mortgage all</el-checkbox>
                </template>

                <el-row class="want-to-send">
                    <el-col>
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
                    <el-col style="margin-top: 40px;">
                        <span class="title">TOTAL</span>
                        <p style="font-size: 16px;">
                            <span>Votes: </span>
                            <span class="total-value">{{formLabelAlign.amount}}</span>
                        </p>
                        <p style="font-size: 16px;">
                            <span>TxFee: </span>
                            <span class="total-value">{{txfee}}</span>
                            <span class="unit">&nbsp;INT</span>
                        </p>
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
                    <span>{{formLabelAlign.from}}</span>
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

                <div style="text-align: center">
                    <el-input
                        type="password"
                        placeholder="Enter password to confim the transaction"
                        v-model="password"
                        @keyup.enter.native="submitTransaction"></el-input>
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
  // import Intjs from 'intjs';
  import { sendActiveIndex } from './common/index';
  import store from '../../utils/storage';
  // const intjs = new Intjs('localhost', 8555);
  /* eslint-disable */
  export default {
    name: 'mortgage',
    data() {
      return {
        fileName: [],
        accountList: [],
        checkedFrom: '',
        checked: false,
        isSelected: true,
        labelPosition: 'top',
        centerDialogVisible: false,
        password: '',
        balanceValue: '',
        slideMin: 0,
        slideMax: 2000 * Math.pow(10, 9),
        isloading: false,
        formLabelAlign: {
          from: '',
          votes: 0.00,
          amount: 0.00,
          balance: 0.00,
          fee: 20,
        },
      };
    },
    computed: {
      txfee () {
        if(this.formLabelAlign.fee > 20) {
          let x = (this.formLabelAlign.fee * 50000) / Math.pow(10, 18);
          if (this.checked) {
            this.formLabelAlign.amount = +this.formLabelAlign.balance - x;
          } else {
            this.formLabelAlign.amount = +this.formLabelAlign.amount;
          }
          return x;
        }
      }
    },
    created () {
      this.getAddress();
      sendActiveIndex(this, 2);
    },
    async mounted () {
      let price = await this.$store.dispatch('getPrice')
      if (price.err) {
        this.formLabelAlign.fee = 200000000000;
      } else {
        this.formLabelAlign.fee = price
      }
    },
    methods: {
      getAddress () {
        let storage = store.get('accountList')
        storage = JSON.parse(storage)
        this.accountList = storage
      },
      sendEverything () {
        if (!this.checked) {
          this.formLabelAlign.amount = this.balanceValue - this.txfee;
        } else {
          this.formLabelAlign.amount = 0;
        }
      },

      selectAccount() {
        this.$store.dispatch('selectFromAction', {that: this, isStake: true})
      },

      sendTransaction() {
        if (this.formLabelAlign.from === '') {
          this.$message.error('Please choose Account address.');
        } else if (typeof this.formLabelAlign.amount !== 'number') {
          this.$message.error('The input of amount should be number.');
        } else if (Number(this.formLabelAlign.amount) <= 0) {
          this.$message.error('The number of votes should be greater than 0.');
        } else if (+this.formLabelAlign.fee < 200*Math.pow(10,9)) {
          this.$message.error('Txfee is too slow.');
        } else if (+this.formLabelAlign.fee > 2000*Math.pow(10,9)) {
          this.$message.error('Txfee is too high.');
        } else if (((+this.formLabelAlign.amount + this.txfee)*Math.pow(10,18)) > +this.formLabelAlign.balance * Math.pow(10, 18)) {
          this.$message.error('Balance is not enough.');
        } else {
          this.centerDialogVisible = true;
        }
      },

      cancelTransaction() {
        this.centerDialogVisible = false;
        this.$message.error('Mortgage cancel');
      },

      async submitTransaction() {
        let amount = (this.formLabelAlign.amount*Math.pow(10, 18)).toString()
        let params = {
          method: 'mortgage',
          value: amount,
          limit: '50000',
          price: this.formLabelAlign.fee.toString(),
          input: {amount: amount},
          password: this.password,
          from: this.formLabelAlign.from
       }
        await this.$store.dispatch('sendTransaction', {that: this, params: params, type: 'mortgage'})
        this.formLabelAlign.from = ''
        this.formLabelAlign.votes = ''
        this.formLabelAlign.balance = ''
        this.formLabelAlign.amount = 0
        this.checked = false
        this.password = ''
        let price = await this.$store.dispatch('getPrice', {that: this})
        if (price.err) {
          this.formLabelAlign.fee = 200000000000;
        } else {
          this.formLabelAlign.fee = price
        }
      },
    }
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
            .total-value {
                margin-left: 15px;
                vertical-align: middle;
            }
            .unit {
                font-size: 15px;
                vertical-align: -3px;
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
