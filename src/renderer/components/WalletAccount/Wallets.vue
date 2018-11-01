<template>
    <div class="wallets">
      <div class="item-title">
        <div>
          <i class="wallet icon-common"></i>
          <span>Wallets</span>
        </div>
      </div>

      <div class="item-content">
        <div class="first-text">Accounts</div>
        <div v-if="isHaveAccount" class="no-account-first">YOU HAVE NO ACCOUNTS YET</div>
        <div v-if="isHaveAccount" class="no-account-second">You need to create at least one account with a strong password</div>
        <div v-else class="have-account-first">Accounts are password protected keys that can hold Ether and Ethereum-based tokens. They can control contracts, but can't display
          incoming transactions.
        </div>
        <div style="margin: 30px 0 20px;max-width: 700px;">
          <router-link :to="{path: '/accounts/detail', query: {address: item.address}}" tag="div" class="accounts" v-for="(item, index) in balanceList"
                       :class="{'blue': index%3 == 0, 'light-blue': index%3 == 1, 'yellow': index%3== 2}">
            <div>Accounts {{index + 1}}</div>
            <div>{{ item.balance }}<span style="font-size: 14px;"> INT</span></div>
            <div class="account-address">{{item.address}}</div>
          </router-link>
        </div>
        <div>
          <span class="add" @click="pop">+</span>
          <span class="add-text" @click="pop">ADD ACCOUNT</span>
        </div>
        <div class="transaction">
          <div>Transaction record</div>
          <div class="no-transaction" v-if="txList.length === 0">No transaction record.</div>

          <!--交易记录-->
          <div v-if="txList.length > 0">
            <!--每一条交易记录-->
            <div class="trasaction-record" v-for="item in txList" @click="openTxDetail(item)">
              <!--左侧-->
              <div class="date">
                <div class="bold-text">{{new Date(item.block.timestamp*1000).getDate()}}</div>
                <div style="color: #999;">{{new Date(item.block.timestamp*1000).getMonth()+1}} 月</div>
              </div>
              <!--右侧-->
              <div style="display: inline-block;padding-left: 20px;">
                <div class="bold-text">Send</div>
                <div style="color: #999;font-size: 13px;margin-top: 8px;">
                  <span class="spe-caller">{{item.tx.caller}}</span>
                  <i class="arrow-right icon-common" style="vertical-align: top;"></i>
                  <span style="vertical-align: top;">{{item.tx.input.to}}</span>
                </div>
              </div>
              <div style="float: right;" class="rpc">
                <span style="color: #D7316F">-{{(item.tx.value / Math.pow(10, 18)).toFixed(3)}}</span>
                <span style="color: #666;">&nbsp;INT</span>
                <span class="right-angle"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-dialog
        title="Create an account"
        :visible.sync="visible"
        class="two-btn"
        @close="some"
        center>
          <el-dialog
              class="hijk"
              title="Be careful"
              :visible.sync="carefulVisible"
              :show-close="showClose"
              center
              append-to-body>
              <div class="ttt">Make sure you backup your keyfiles AND password!</div>
              <div class="fff">You can find your keyfiles folder using the main menu-> File -> Backup
                  -> Accounts.Keep a copy of the "keystore" folder where you can't lose it!</div>
              <span slot="footer" class="dialog-footer">
                  <el-button class="btnConfirm" @click="carefulConfirm" style="font-size: 18px;">Confirm</el-button>
              </span>
          </el-dialog>


          <div class="input-entire">
              <input
              :type="!showPassword1 ? 'password' : 'text' "
              v-model="firstPassword"
              placeholder="Please enter a password of at least 9 characters">
              <i
              class="icon-common"
              :class="!showPassword1 ? 'openEye' : 'closeEye'"
              @click="switchEye1"></i>
            </div>
            <div class="input-entire">
              <input
              :type="!showPassword2 ? 'password' : 'text' "
              v-model="secondPassword"
              placeholder="Enter the wallet password again">
              <i
              class="icon-common"
              :class="!showPassword2 ? 'openEye' : 'closeEye'"
              @click="switchEye2"></i>
            </div>
            <div class="notice-item" v-if="passwordError">
              <i class="notice icon-common"></i>
              <span>Password entry error</span>
            </div>
            <span slot="footer" class="dialog-footer">
              <el-row>
                <el-col :span="12"><el-button @click="close" class="btn1">Cancel</el-button></el-col>
                <el-col :span="12"><el-button @click="addAccount" class="btn2" :disabled="passwordError || !firstPassword || !secondPassword">Confirm</el-button></el-col>
              </el-row>
            </span>
        </el-dialog>


      <el-dialog
        class="txDetail"
        title="Transaction"
        :visible.sync="transactionVisible"
        center>
        <div class="first-detail">
          <div>{{ transDetail.hash }}</div>
          <div>{{ transDetail.time }}</div>
        </div>
        <div class="second-detail">
          <div>
            <span>Amount:</span>
            <span>0.01 INT</span>
          </div>
          <div>
            <span>From:</span>
            <span>Accounts 1</span>
          </div>
          <div>
            <span>To:</span>
            <span>0x960Bd04ac250da64972Cd43cD246a2D</span>
          </div>
          <div>
            <span>Fee paid:</span>
            <span>0.0034234344 INT</span>
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button class="btn2" @click="transactionVisible = false" style="font-size: 18px;">Confirm</el-button>
        </span>
      </el-dialog>
    </div>
</template>

<script>
  /* eslint-disable */
  import Intjs from 'intjs';
  import moment from 'moment';
  // import { ipcRenderer } from 'electron';

  const intjs = new Intjs('localhost', 18089);

  export default {
    name: 'wallets',
    data() {
      return {
        fileName: [],
        balanceList: [],
        searchTx: '',
        visible: false,
        showPassword1: false,
        showPassword2: false,
        carefulVisible: false,
        transactionVisible: false,
        card: [],
        firstPassword: '',
        secondPassword: '',
        passwordError: false,
        isHaveAccount: false,
        showClose: false,
        txList: [],
        transDetail: {
          hash: '',
          time: ''
        },
      };
    },
    watch: {
      firstPassword(val) {
        if (val === this.secondPassword) {
          this.passwordError = false;
        } else {
          this.passwordError = true;
        }
      },
      secondPassword(val) {
        if (val === this.firstPassword) {
          this.passwordError = false;
        } else {
          this.passwordError = true;
        }
      },
    },
    methods: {
      openTxDetail(transobj) {
        this.transactionVisible = true;
        this.transDetail.hash = transobj.tx.hash;
        this.transDetail.time = moment(new Date(transobj.block.timestamp * 1000)).format("dddd, MMMM Do YYYY, h:mm:ss a");
      },
      some() {
        this.firstPassword = '';
        this.secondPassword = '';
      },
      switchEye1() {
        this.showPassword1 = !this.showPassword1;
      },
      switchEye2() {
        this.showPassword2 = !this.showPassword2;
      },
      close() {
        this.visible = false;
        this.firstPassword = '';
        this.secondPassword = '';
      },

      /**
       * 初始化
       * */
      async init () {
        let files = await intjs.getAccounts();
        console.log('@@@@@@', files)
        if (files.err) {
          this.isHaveAccount = true;
            this.$message({
                message: '请先创建帐户',
                type: 'warning'
            });
        } else {
          this.fileName = files;
          let balanceArray = [];
          this.fileName.forEach(async (value) => {
            let address = value;
            let result = await intjs.getBalance(address);
            balanceArray.push({address: address, balance: (result.balance / Math.pow(10,18)).toFixed(2)});
            await this.getTransactionHash(address);
          });
          this.balanceList = balanceArray;
        }
      },
      // 弹出创建账户的弹框
      pop () {
        this.visible = true;
      },
      /**
       * 创建帐户
       * */
      addAccount() {
        let reg = /[\w]{9,}/;
        if (!this.firstPassword || !this.secondPassword) return;

        if (this.firstPassword != this.secondPassword) {
            this.passwordError = true;
            return;
        }
        if (!reg.test(this.firstPassword)) return
          this.carefulVisible = true;
      },
      async carefulConfirm() {
        await this.createWallet(this.firstPassword);
        await this.init();
        this.carefulVisible = false;
        this.visible = false
      },


      /**
       * 生成 keystore
       * */
      async createWallet(password) {
         let result = await intjs.newAccount(password);
         if (result.err) {
            this.$message({
              type: 'error',
              message: '帐户创建失败'
            });
         } else {
           this.$message({
             type: 'success',
             message: ' 帐户创建成功，地址： ' + result,
           });
         }
      },
      async getTransactionHash(address) {
        let txInformation = await intjs.chainClient.getTransactionByAddress({address});
        if (txInformation.err === 0) {
          txInformation.txs.forEach(async(item) => {
            let result = await intjs.getTransactionReceipt(item.txhash);
            this.txList.push(result)
          })
        }
        console.log('[[[[]]]', this.txList)
      },
      addWalletContract() {
        // this.$prompt('请输入密码', '创建帐户', {
        //   confirmButtonText: '确定',
        //   cancelButtonText: '取消',
        //   inputPattern: /[\w]{9,}/,
        //   inputErrorMessage: '密码格式不正确',
        // }).then(({ value }) => {
        //   this.$message({
        //     type: 'success',
        //     message: ' 创建成功 ',
        //   });
        //   // this.createWallet(value);
        //   // this.init();
        // }).catch(() => {
        //   this.$message({
        //     type: 'info',
        //     message: '取消输入',
        //   });
        // });
      },
    },
    mounted() {
      this.init();
    },
  };
</script>

<style lang="scss">
    .wallets {
      background-color: #fff;
      border-radius: 5px;
      .item-content {
        .no-account-first {
          font-size: 18px;
          margin-bottom: 5px;
          margin-top: 28px;
        }
        no-account-second {
          color: #666;
          margin-bottom: 28px;
        }

        .blue {
          background-color: #2B68FD;
        }
        .light-blue {
          background-color: #2BA4FD;
        }
        .yellow {
          background-color: #FDB32B;
        }
        .purple {
          background-color: #A72BFD;
        }
        .accounts {
          color: #fff;
          width: 180px;
          border-radius: 4px;
          padding: 8px 12px;
          margin-bottom: 15px;
          display: inline-block;
          margin-right: 20px;
          & > div:nth-of-type(1) {
            opacity: 0.85;
          }
          & > div:nth-of-type(2) {
            font-size: 20px;
            opacity: 0.85;
            margin: 10px 0 5px;
          }
          & > div:nth-of-type(3) {
            opacity: 0.85;
            font-size: 12px;
          }
          .account-address {
              width: 150px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
          }
        }
        .add {
          display: inline-block;
          width: 58px;
          height: 58px;
          color: #3C31D7;
          border: 1px solid #3C31D7;
          font-size: 48px;
          line-height: 1;
          text-align: center;
          font-weight: 300;
          vertical-align: middle;
        }
        .add-text {
          vertical-align: middle;
          color: #3C31D7;
          margin-left: 16px;
          font-weight: 500;
        }
        .transaction {
          margin-top: 40px;
          & > div:nth-of-type(1) {
            color: #3C31D7;
            font-size: 28px;
          }
          .no-transaction {
            margin-top: 10px;
            color: #999;
          }
          .trasaction-record {
            background-color: #F4F8FF;
            border-radius: 4px;
            padding: 20px 36px;
            margin-top: 20px;
            .date {
              display: inline-block;
              border-right: 1px solid #ccc;
              padding-right: 20px;
              vertical-align: top;
            }
            .arrow-right {
              width: 15px;
              height: 12px;
              background-image: url("../../assets/images/arrow-right.png");
              margin: 0 15px;
            }
            .rpc {
              float: right;
              line-height: 49px;
              font-size: 16px;
              .right-angle {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-top: 2px solid #ccc;
                border-right: 2px solid #ccc;
                transform: rotate(45deg);
                margin-left: 20px;
              }
            }
          }
        }
      }
      .txDetail {
        .el-dialog__header {
          background-color: #F4F8FF;
          text-align: left;
        }
        .el-dialog__title {
          padding-left: 20px;
          color: #3C31D7;
        }
        .first-detail {
          padding-bottom: 25px;
          padding-left: 20px;
          border-bottom: 1px solid #ccc;
          text-align: left;
          font-size: 16px;
          div:first-of-type {
            color: #3C31D7;
            margin-bottom: 10px;
          }
        }
        .second-detail {
          padding-top: 24px;
          text-align: left;
          padding-left: 40px;
          & > div {
            span:nth-of-type(1) {
              display: inline-block;
              text-align: right;
              width: 100px;
              margin-right: 10px;
              color: #999;
            }
            span:nth-of-type(2) {
              color: #666;
            }
          }
          & > div:not(first-of-type) {
            margin-bottom: 15px;
          }
        }
      }

      .el-dialog {
        min-width: 500px;
        max-width: 650px;
        .el-dialog__header {
          border-bottom: 1px solid #ccc;
          padding: 20px;
          .el-dialog__title {
            color: #333;
          }
        }
        .el-dialog__body {
          text-align: center;
          border-bottom: 1px solid #ccc;
          padding: 25px 25px 40px;
          .input-entire {
            position: relative;
            width: 328px;
            margin: 16px auto;
            input {
              width: 328px;
              height: 42px;
              border-radius: 4px;
              border: 1px solid #ccc;
              outline: none;
              padding-left: 18px;
            }
          }
          .notice-item {
            text-align: center;
            margin-left: -150px;
            .notice {
              width: 15px;
              height: 15px;
              background-image: url('../../assets/images/notice.png');
              background-size: cover;
              vertical-align: middle;
            }
            & span {
              color: #D7316F;
              font-size: 12px;
            }
          }
        }
        .openEye {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 11px;
          background-image: url('../../assets/images/eyes-open.png')
        }
        .closeEye {
          position: absolute;
          right: 20px;
          top: 51%;
          transform: translateY(-50%);
          width: 18px;
          height: 8px;
          background-image: url('../../assets/images/eyes-close.png')
        }
      }
    }
  .wallet {
    width: 18px;
    height: 15px;
    background-image: url('../../assets/images/wallet.png');
    margin-right: 10px;
  }
  .bold-text {
    color: #666;
    font-size: 20px;
    margin-bottom: 5px;
  }
  .hijk {
      .el-dialog__header {
          padding: 15px;
          background-color: #F4F8FF;
          text-align: left;
          border-bottom: 1px solid #ccc;
      }
      .el-dialog__title {
          padding-left: 20px;
          color: #3C31D7;
      }
      .ttt {
          font-size: 18px;
          margin-bottom: 25px;
      }
      .fff {
          padding-left: 15px;
          text-align: left;
          line-height: 20px;
          margin-bottom: 16px;
      }
      .el-dialog__footer {
          padding: 15px 20px;
          .btnConfirm {
              border: none;
              background: #fff;
              color: #3C31D7;
          }
      }
  }
  .spe-caller {
    display: inline-block;
    width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

</style>
