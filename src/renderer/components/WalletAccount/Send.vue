<template>
    <div class="send">
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
                            v-for="(item, index) in balance"
                            :key="index"
                            :label="'Account' + ++index + '-' + item.address"
                            :value="item.address">
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="TO">
                    <el-input v-model="formLabelAlign.to" placeholder="0x000000…"></el-input>
                </el-form-item>

                <el-form-item label="AMOUNT">
                    <el-input v-model="formLabelAlign.amount" placeholder="0.0" :readonly="checked"></el-input>
                </el-form-item>

                <el-form-item label="BALANCE">
                    <el-select v-model="formLabelAlign.balance" placeholder="" style="display: block;" @change="selectToken">
                        <el-option
                            v-for="(item, index) in balanceAndToken"
                            :key="item.index"
                            :label="item.name + ' ' + ((item.balance / Math.pow(10,18)).toFixed(2))"
                            :value="item.name">
                        </el-option>
                    </el-select>
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
                    <el-col :span="8" style="margin-top: 40px;">
                        <span class="title" style="font-size: 16px;">TOTAL</span>
                        <!--<p><span class="total-value">{{Number(formLabelAlign.amount) + formLabelAlign.fee/20}}</span> INT</p>-->
                        <p><span class="total-value">{{checked ? balanceValue : ((+formLabelAlign.amount + +txfee))}}</span> INT</p>
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

                <!--<div class="stripe-item">-->
                    <!--<span>Gas price</span>-->
                    <!--<span>0.002 INT per mllin gas</span>-->
                <!--</div>-->

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
  import axios from 'axios';
  const intjs = new Intjs('localhost', 8555);
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
        pageSize: 10000,
        slideMin: 0,
        slideMax: 100,
        balanceValue: '',
        from_address: '',
        tokenName: '',
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

    computed: {
      txfee () {
        if (this.formLabelAlign.fee > 20) {
          let x = (this.formLabelAlign.fee * 50000) / Math.pow(10, 18);
          if (x.toString().split('.')[1].length > 5) {
            x = x.toFixed(5);
          } else {
            x = x;
          }
          return x;
        }
      }
    },
    methods: {
      async getTokenBalance () {
        let that = this;
        let result = await intjs.getTokenBalance('INT1NXXTMLqmDf4vf7KcNYzvxr36LCL4oTZvq', that.address);
        that.tokenBalance = +result.balance / Math.pow(10, 18);
      },
      sendActiveIndex () {
        this.$emit('listenToActive', 1)
      },
      sendEverything () {
        if (!this.checked) {
          this.formLabelAlign.amount = this.balanceValue - this.txfee;
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
      /**
       * 初始化
       * */
      async init () {
        let files = await intjs.getAccounts();
        this.formLabelAlign.fee = await intjs.getPrice();
        this.slideMax = 2000 * Math.pow(10, 9);
        if (files.err) {
          this.$message({
            message: '请先创建帐户',
            type: 'warning'
          });
        } else {
          this.fileName = files;
          let balanceArray = [];
          // await this.fileName.forEach(async (value,i) => {
          //   let address = value;
          //   let result = await intjs.getBalance(address);
          //   balanceArray.push({address: address, balance: result.balance});
          //   console.log(i)
          // });
          for(let value of this.fileName){
            let address = value;
            let result = await intjs.getBalance(address);
            balanceArray.push({address: address, balance: result.balance});
          }
          // TODO 异步拿到的数据怎么排序？
          if (balanceArray.length !== 0) {
            balanceArray.sort(function (a, b) {
              return (b.balance - a.balance);
            });
          }
          this.balance = balanceArray;
          // if (this.balance.length) {
          //   this.formLabelAlign.from = this.balance[0]
          //   this.formLabelAlign.balance = await intjs.getBalance(this.formLabelAlign.from.address)
          // }
        }
      },

       selectFrom () {
        if (this.formLabelAlign.from) {
          this.balance.forEach(async(value) => {
            if (value.address === this.formLabelAlign.from) {
              this.balanceAndToken = [];
              this.balanceAndToken.push({
                name: 'INT',
                balance: value.balance
              });
              let data = await intjs.getTokenBalance('INT1NXXTMLqmDf4vf7KcNYzvxr36LCL4oTZvq', this.formLabelAlign.from)
              this.balanceAndToken.push({
                name: 'INT1NXXTMLqmDf4vf7KcNYzvxr36LCL4oTZvq',
                balance: +data.balance
              });
              // this.getTokenAccount();
              this.balanceValue = value.balance / Math.pow(10,18);
              this.from_address = value.address;
            }
          });
        } else {
          this.$message({
            message: '请选择一个地址',
            type: 'warning'
          });
        }
      },
      selectToken (value) {
        this.tokenName = value;
      },
      sendTransaction() {
        if (this.formLabelAlign.from === '') {
          this.$message.error('请选择 From 地址');
        } else if (this.formLabelAlign.to === '') {
          this.$message.error('请输入 To 地址');
        } else if (Number(this.formLabelAlign.amount) === 0) {
          this.$message.error('转账金额不能为 0');
        } else if (+this.formLabelAlign.fee < 200*Math.pow(10,9)) {
          this.$message.error('手续费用太低');
        } else if (+this.formLabelAlign.fee > 2000*Math.pow(10,9)) {
          this.$message.error('手续费用太高');
        } else if ( ((+this.formLabelAlign.amount + +this.txfee)*Math.pow(10,18)) > +this.balanceValue*Math.pow(10,18)) {
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
          console.log('++++++')
          setImmediate(async() => {
            let params = {
              from: this.from_address,
              method: '',
              value: 0,
              limit: '50000',
              price: this.formLabelAlign.fee,
              input: {},
              password: this.password
            }
            if (this.tokenName === 'INT') {
              params.method = 'transferTo';
              params.input = {to: this.formLabelAlign.to};
              params.value = this.formLabelAlign.amount*Math.pow(10,18);
            } else {
              params.method = 'transferTokenTo';
              params.input = {to: this.formLabelAlign.to, tokenid: 'INT1NXXTMLqmDf4vf7KcNYzvxr36LCL4oTZvq', amount: this.formLabelAlign.amount*Math.pow(10,18)};
            }
              let result = await intjs.sendTransaction(params);
              console.log('--rrrsend---', result)
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
          });

        }
      },
    },
    mounted() {
      if (this.$route.query.address) {
        this.formLabelAlign.to = this.$route.query.address
      }
      this.init();
      this.sendActiveIndex()
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
