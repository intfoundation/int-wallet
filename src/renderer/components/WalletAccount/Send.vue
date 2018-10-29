<template>
    <div class="send">
        <div class="item-title">
            <i class="send-icon icon-common"></i>
            <span class="item-text">Send</span>
        </div>
        <div class="item-content">
            <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign" class="transactionForm">
                <div class="first-text" style="margin-bottom: 16px;">Send founds</div>
                <el-form-item label="FROM">
                    <el-select class="select-from" v-model="formLabelAlign.from" placeholder="" @change="selectFrom">
                        <el-option v-for="(item, index) in balance" :key="item.address" :label="'Account-' + ++index" :value="item.address"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="TO">
                    <el-input v-model="formLabelAlign.to" placeholder="0x000000…"></el-input>
                </el-form-item>
                <el-form-item label="AMOUNT">
                    <el-input v-model="formLabelAlign.amount" placeholder="0.0">
                        {{checked ? formLabelAlign.balance : formLabelAlign.amount}}</el-input>
                </el-form-item>
                <el-form-item label="BALANCE">
                    <el-input class="balance" v-model="formLabelAlign.balance" readonly>{{formLabelAlign.balance}}</el-input>
                </el-form-item>
                <template>
                    <!-- `checked` 为 true 或 false -->
                    <el-checkbox v-model="checked">Send everything</el-checkbox>
                </template>

                <el-row class="want-to-send">
                    <el-col :span="6">
                        You want to send <span style="font-size: 16px;color: #3c31d7;">{{formLabelAlign.amount}}</span> INT.
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
                        <span class="title" style="font-size: 16px;">TOTAL</span>
                        <p><span class="total-value">{{Number(formLabelAlign.amount) + formLabelAlign.fee/20}}</span> INT</p>
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
                <div>
                    You are about to execute a function on a contract. This mightinvolve transfer
                    of value.
                </div>
            </div>

            <div class="stripe">
                <div class="stripe-item">
                    <span>Estimated fee consumption</span>
                    <span>00007512 INT (37.559 gas)</span>
                </div>

                <div class="stripe-item">
                    <span>00007512 INT (37.559 gas)</span>
                    <span>0.00027512 INT (137.559 gas)</span>
                </div>

                <div class="stripe-item">
                    <span>Gas price</span>
                    <span>0.002 INT per mllin gas</span>
                </div>

                <div style="text-align: center">
                    <el-input type="password" placeholder="Enter password to confim the transaction" v-model="password"></el-input>
                </div>
            </div>
            <span slot="footer" class="dialog-footer">
              <el-row>
                <el-col :span="12"><el-button @click="cancelTransaction" class="btn1">Cancel</el-button></el-col>
                <el-col :span="12"><el-button class="btn2">Confirm</el-button></el-col>
              </el-row>
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
          amount: '',
          balance: 0.00,
          fee: 20,
        },
      };
    },
    methods: {
      /* eslint-disable */
      /**
       * 初始化
       * */
      async init () {
        let files = await intjs.accounts();
        if (files.err) {
          this.$message.error('读取 keystore 文件出错');
        } else if (files.err) {
          this.$message({
            message: '获取账户失败',
            type: 'error'
          });
        } else {
          this.fileName = files;
          let balanceArray = [];
          this.fileName.forEach(async (value) => {
            let address = value;
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
    mounted() {
      this.init();
    },
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
        /*.el-form-item {*/
            /*float: left;*/
            /*width: 45%;*/
            /*margin-right: 20px;*/
            /*margin-bottom: 24px;*/
            /*.el-select {*/
                /*width: 100%;*/
            /*}*/
            /*.el-form-item__label {*/
                /*padding: 0;*/
            /*}*/
            /*.el-input__inner {*/
                /*height: 38px;*/
                /*line-height: 38px;*/
            /*}*/

        /*}*/


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
