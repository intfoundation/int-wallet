<template>
    <div class="send" v-loading="isloading">
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
                            :label="'Account' + ++index + '-' + item.address"
                            :value="item.address">
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="TO">
                    <el-input v-model="formLabelAlign.to" placeholder="INT000000…"></el-input>
                </el-form-item>

                <el-form-item label="AMOUNT">
                    <el-input v-model="formLabelAlign.amount" placeholder="0.0" :readonly="checked" @keypress.native="checkNumber($event)"></el-input>
                </el-form-item>

                <el-form-item label="BALANCE">
                    <el-input v-model="formLabelAlign.balance" readonly></el-input>
                </el-form-item>

                <template>
                    <!-- `checked` 为 true 或 false -->
                    <el-checkbox v-model="checked" @click.native="sendEverything">Send everything</el-checkbox>
                </template>


                <el-row class="want-to-send">
                    <el-col :span="6">
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
                    <el-col :span="10" style="margin-top: 40px;">
                        <span class="title" style="font-size: 16px;">TOTAL</span>
                        <p><span class="total-value">{{checked ? formLabelAlign.balance : ((+formLabelAlign.amount + +txfee))}}</span> INT</p>
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
  import Intjs from 'intjs';
  import { sendActiveIndex, init, selectFromAction, checkTransaction } from './common/index';
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
          balance: '',
          fee: 20,
        },
      };
    },
    mounted() {
      if (this.$route.query.address) {
        this.formLabelAlign.to = this.$route.query.address
      }
      init(this);
      sendActiveIndex(this, 1)
    },

    computed: {
      txfee () {
        if (this.formLabelAlign.fee > 20) {
          let x = (this.formLabelAlign.fee * 50000) / Math.pow(10, 18);
          if (this.checked) {
            this.formLabelAlign.amount = this.formLabelAlign.balance - x;
          } else {
            this.formLabelAlign.amount = this.formLabelAlign.amount;
          }
          return x;
        }
      }
    },
    methods: {
      checkNumber(e) {
        if ( e.keyCode < 48 || e.keyCode > 57) {
          e.preventDefault()
          alert('Please input numbers only.')
        }
      },
      // async getTokenBalance () {
      //   let that = this;
      //   let result = await intjs.getTokenBalance('INT1NXXTMLqmDf4vf7KcNYzvxr36LCL4oTZvq', that.address);
      //   that.tokenBalance = +result.balance / Math.pow(10, 18);
      // },
      sendEverything () {
        if (!this.checked) {
          this.formLabelAlign.amount = this.formLabelAlign.balance - this.txfee;
        } else {
          this.formLabelAlign.amount = 0;
        }
      },
      // getTokenAccount() {
      //   const that = this;
      //   axios.get('https://explorer.intchain.io/api/wallet/walletList', {
      //     params: {
      //       source: 'wallet',
      //       pageSize: that.pageSize,
      //       address: that.formLabelAlign.from,
      //     },
      //   })
      //     .then((res) => {
      //       const result = res.data;
      //       if (result.status === 'success') {
      //         console.log('+++++***((((((', result);
      //         let tokenlist = result.data.tokenList;
      //         if (tokenlist.length != 0) {
      //           tokenlist.forEach(function(item){
      //             that.balanceAndToken.push({
      //               name: item.coin,
      //               balance: item.balance
      //             })
      //           })
      //         }
      //       }
      //     })
      //     .catch(error => {
      //       console.log(error);
      //     });
      // },
       selectFrom () {
         selectFromAction(this)
       },
      sendTransaction() {
        checkTransaction(this)
      },
      cancelTransaction() {
        this.centerDialogVisible = false;
        this.$message.error('Transaction cancel');
      },
      submitTransaction() {
        if (this.password === '') {
          this.$message.error('Please input the password.');
        } else if (this.password.length < 9) {
          this.$message.error('Password length must be greater than or equal to 9.');
        } else {
          setImmediate(async() => {
            let params = {
              from: this.formLabelAlign.from,
              method: '',
              value: 0,
              limit: '50000',
              price: this.formLabelAlign.fee,
              input: {},
              password: this.password
            }
              params.method = 'transferTo';
              params.input = {to: this.formLabelAlign.to};
              params.value = this.formLabelAlign.amount*Math.pow(10,18);
            // else {
            //   params.method = 'transferTokenTo';
            //   params.input = {to: this.formLabelAlign.to, tokenid: 'INT1NXXTMLqmDf4vf7KcNYzvxr36LCL4oTZvq', amount: this.formLabelAlign.amount*Math.pow(10,18)};
            // }
              let result = await intjs.sendTransaction(params);
              console.log('--rrrsend---', result)
              if (result.err) {
                this.centerDialogVisible = false;
                this.$message.error('Transaction failed');
              } else {
                this.centerDialogVisible = false;
                this.$message({
                  message: `Transaction successfully，hash:${result.hash}`,
                  type: 'success'
                });
              }
          });

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
