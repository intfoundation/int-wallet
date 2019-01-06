<template>
    <div class="send" v-loading="isloading" id="send">
        <div class="item-title">
            <i class="send-icon icon-common"></i>
            <span class="item-text">Send</span>
        </div>
        <div class="item-content">
            <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign" class="transactionForm">
                <!--<div class="first-text" style="margin-bottom: 16px;">Send founds</div>-->

                <el-form-item label="FROM">
                    <el-select v-model="formLabelAlign.from" placeholder="" @change="selectFrom" style="display: block;">
                        <el-option
                            v-for="(item, index) in accountList"
                            :key="index"
                            :label="'Account' + ++index + '-' + item"
                            :value="item">
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="TO">
                    <el-input v-model="formLabelAlign.to" placeholder="INT000000…"></el-input>
                </el-form-item>

                <el-form-item label="AMOUNT">
                    <el-input v-model="formLabelAlign.amount" placeholder="0.0" :readonly="checked"></el-input>
                </el-form-item>

                <el-form-item label="BALANCE">
                    <el-input v-model="formLabelAlign.balance" readonly></el-input>
                </el-form-item>

                <template>
                    <!-- `checked` 为 true 或 false -->
                    <el-checkbox v-model="checked" @click.native="sendEverything">Send everything</el-checkbox>
                </template>


                <el-row class="want-to-send">
                    <el-col>
                        You want to send <span style="font-size: 16px;color: #3c31d7;">{{formLabelAlign.amount}}</span> INT.
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
                        <span class="title" style="font-size: 16px;">TOTAL</span>
                        <p><span class="total-value">{{ totalINT }}</span> INT</p>
                    </el-col>
                </el-row>
                <el-button @click="sendTransaction" class="send-btn"><span>SEND</span></el-button>
            </el-form>

        </div>

        <!--点击send之后的弹框-->
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
                    <span>To:</span>
                    <span>{{formLabelAlign.to}}</span>
                </div>
                <div v-if = false>
                    You are about to execute a function on a contract. This might involve transfer
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
                        placeholder="Enter password to confirm the transaction"
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
  /* eslint-disable */
  import { BigNumber } from 'bignumber.js';
  import store from '../../utils/storage'
  import Intjs from 'intjs';
  import { sendActiveIndex } from './common/index';
  const intjs = new Intjs('localhost', 8555);
  export default {
    name: 'send',
    data() {
      return {
        accountList: [],
        balance: [],
        checkedFrom: '',
        checked: false,
        isSelected: true,
        labelPosition: 'top',
        centerDialogVisible: false,
        password: '',
        pageSize: 10000,
        slideMin: 0,
        slideMax: 2000 * Math.pow(10, 9),
        balanceValue: '',
        from_address: '',
        tokenName: '',
        isloading: false,
        balanceAndToken: [],
        formLabelAlign: {
          from: '',
          to: '',
          amount: 0,
          balance: 0.00,
          fee: 20,
        },
      };
    },
    created () {
      this.getAddress()
    },
    async mounted() {
      if (this.$route.query.address) {
        this.formLabelAlign.from = this.$route.query.address
        let result = await intjs.getBalance(this.formLabelAlign.from)
        if (result.err) {
          that.$message.error('Error in getting account balance');
        } else {
          this.formLabelAlign.balance = +result.balance / Math.pow(10, 18)
        }
      }
      let price = await this.$store.dispatch('getPrice')
      if (price.err) {
        this.formLabelAlign.fee = 200000000000;
      } else {
        this.formLabelAlign.fee = price
      }
      sendActiveIndex(this, 1)
    },

    computed: {
      txfee () {
        if (this.formLabelAlign.fee > 20) {
          let x = (this.formLabelAlign.fee * 50000) / Math.pow(10, 18);
          let bigNX = new BigNumber(x)
          if (this.checked) {
            let bigNBalance = new BigNumber(this.formLabelAlign.balance)
            this.formLabelAlign.amount = bigNBalance.minus(bigNX).toString()
          } else {
            this.formLabelAlign.amount = this.formLabelAlign.amount;
          }
          return x;
        }
      },
      totalINT () {
        if (+this.formLabelAlign.amount >= 0) {
          return this.checked ? this.formLabelAlign.balance : (+this.formLabelAlign.amount + +this.txfee)
        }
      }
    },
    methods: {
      getAddress () {
        let storage = store.get('accountList')
        storage = JSON.parse(storage)
        this.accountList = storage
        console.log('---accountlist---', this.accountList)
      },
      sendEverything () {
        if (!this.checked) {
          let bigNBalance = new BigNumber(this.formLabelAlign.balance )
          let bigNTxfee = new BigNumber(this.txfee)
          this.formLabelAlign.amount = bigNBalance.minus(bigNTxfee).toString()
        } else {
          this.formLabelAlign.amount = 0;
        }
      },
      selectFrom () {
        this.$store.dispatch('selectFromAction', {that: this, isStake: false})
      },
      async sendTransaction() {
        if (this.formLabelAlign.from === '') {
          this.$message.error('Please choose From address.');
        } else if (this.formLabelAlign.to === '') {
          this.$message.error('Please choose To address.');
        }
        let status = await this.isValidAddress(this.formLabelAlign.to)
        if (!status) {
          this.$message.error('Invalid Address.');
        }else if(!Number(this.formLabelAlign.amount)) {
          this.$message.error('Amount is not valid.');
        }else if (Number(this.formLabelAlign.amount) <= 0) {
          this.$message.error('The number of amount should greater than 0.');
        } else if (this.formLabelAlign.amount.split('.')[1] !== undefined && this.formLabelAlign.amount.split('.')[1].length > 18) {
          this.$message.error('More than 18 decimal places.');
        } else if (+this.formLabelAlign.fee < 200*Math.pow(10,9)) {
          this.$message.error('Txfee is too slow.');
        } else if (+this.formLabelAlign.fee > 2000*Math.pow(10,9)) {
          this.$message.error('Txfee is too high.');
        } else if ( ((+this.formLabelAlign.amount + +this.txfee)*Math.pow(10,18)) > +this.formLabelAlign.balance*Math.pow(10,18)) {
          this.$message.error('Balance is not enough.');
        } else {
          this.centerDialogVisible = true;
        }
      },
      cancelTransaction() {
        this.centerDialogVisible = false;
        this.$message.error('Transaction cancel');
      },

       isValidAddress (address) {
        let status = intjs.isValidAddress(address)
        return status
      },

      async submitTransaction() {
        let bigNAmount = new BigNumber(this.formLabelAlign.amount)
        let s = new BigNumber(Math.pow(10, 18))
        let amount = bigNAmount.times(s).toString()
        let params = {
          from: this.formLabelAlign.from,
          method: 'transferTo',
          value: amount,
          limit: '50000',
          price: this.formLabelAlign.fee.toString(),
          input: {to: this.formLabelAlign.to},
          password: this.password
        }
        let status = await this.$store.dispatch('sendTransaction', {that: this, params: params, type: 'Transaction'})
        if (status) {
          this.formLabelAlign.from = ''
          this.formLabelAlign.to = ''
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
        }
      },
    }
  };
</script>

<style lang="scss">
    .send {
        background-color: #fff;
        border-radius: 5px;
        .send-icon {
            width: 18px;
            height: 18px;
            background-image: url("../../assets/images/send.png");
        }
        .want-to-send {
            margin-top: 20px !important;
        }
        .el-row {
            .title {
                display: inline-block;
                font-weight: 500;
                margin-bottom: 20px;
            }
            .fee {
                width: 330px;
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
