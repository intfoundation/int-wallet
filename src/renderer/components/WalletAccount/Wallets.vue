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
        <div v-if="false" class="no-account-first">YOU HAVE NO ACCOUNTS YET</div>
        <div v-if="false" class="no-account-second">You need to create at least one account with a strong password</div>
        <div class="have-account-first">Accounts are password protected keys that can hold Ether and Ethereum-based tokens. They can control contracts, but can't display
          incoming transactions.
        </div>
        <div style="margin: 30px 0 20px;">
          <router-link :to="item.url" tag="div" class="accounts" v-for="(item, index) in card"
                       :class="{'blue': index == 0, 'light-blue': index == 1, 'yellow': index == 2, 'purple': index == 3}">
            <div>{{item.account}}</div>
            <div>{{item.value}}<span style="font-size: 14px;">INT</span></div>
            <div>{{item.address}}</div>
          </router-link>
        </div>
        <div>
          <span class="add" @click="pop">+</span>
          <span class="add-text" @click="pop">ADD ACCOUNT</span>
        </div>
        <div class="transaction">
          <div v-if="false">Transaction record</div>
          <div class="no-transaction">No transaction record.</div>

          <!--交易记录-->
          <div>
            <!--每一条交易记录-->
            <div class="trasaction-record">
              <!--左侧-->
              <div class="date">
                <div class="bold-text">24</div>
                <div style="color: #999;">9月</div>
              </div>
              <!--右侧-->
              <div style="display: inline-block;padding-left: 20px;">
                <div class="bold-text">Send</div>
                <div style="color: #999;font-size: 13px;margin-top: 8px;">
                  <span>Accounts2</span>
                  <i class="arrow-right icon-common"></i>
                  <span>0xaf09dec48FDd83D2acfewebewbwefwevedvewwfcew</span>
                </div>
              </div>
              <div style="float: right;" class="rpc">
                <span style="color: #D7316F">-0.99</span>
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
        center>
        <div class="input-entire">
          <input
          :type="!showPassword ? 'password' : 'text' "
          placeholder="Please enter a password of at least 9 characters">
          <i
          class="icon-common"
          :class="!showPassword ? 'openEye' : 'closeEye'"
          @click="switchEye"></i>
        </div>
        <div class="input-entire">
          <input
          :type="!showPassword ? 'password' : 'text' "
          placeholder="Enter the wallet password again">
          <i
          class="icon-common"
          :class="!showPassword ? 'openEye' : 'closeEye'"
          @click="switchEye"></i>
        </div>
        <div class="notice-item">
          <i class="notice icon-common"></i>
          <span>Password entry error</span>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-row>
            <el-col :span="12"><el-button @click="visible = false" class="btn1">Cancel</el-button></el-col>
            <el-col :span="12"><el-button @click="addAccount" class="btn2">Confirm</el-button></el-col>
          </el-row>
        </span>
      </el-dialog>

      <el-dialog
        class="hijk"
        title="Be careful"
        :visible.sync="carefulVisible"
        center>
        <div class="ttt">Make sure you backup your keyfiles AND password!</div>
        <div class="fff">You can find your keyfiles folder using the main menu-> File -> Backup
        -> Accounts.Keep a copy of the "keystore" folder where you can't lose it!</div>
        <span slot="footer" class="dialog-footer">
          <el-button class="btn2" @click="carefulVisible = false" style="font-size: 18px;">Confirm</el-button>
        </span>
      </el-dialog>

      <el-dialog
        class="txDetail"
        title="Transaction"
        :visible.sync="transactionVisible"
        center>
        <div class="first-detail">
          <div class="">0x9e2db90c20cc877c7ea92ceb557fafa772f3f255816</div>
          <div class="">Sunday, September 30, 2018 11:18 AM</div>
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
  import Intjs from 'intjs';
  // import { ipcRenderer } from 'electron';

  const intjs = new Intjs('localhost', 18089);
  const cardList = [];
  for (let i = 0; i < 4; i += 1) {
    cardList.push({
      account: 'Accounts1',
      value: '2.99',
      address: '0xaf09dec48FDd83D2ac…',
      url: '/accounts/detail',
    });
  }
  export default {
    name: 'wallets',
    data() {
      return {
        fileName: [],
        balance: [],
        searchTx: '',
        visible: true,
        showPassword: false,
        carefulVisible: false,
        transactionVisible: false,
        card: cardList,
      };
    },
    methods: {
      switchEye() {
        this.showPassword = !this.showPassword;
      },
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
      // 弹出创建账户的弹框
      pop () {
        this.visible = true;
      },
      /**
       * 创建帐户
       * */
      addAccount() {
        this.$prompt('请输入密码', '创建帐户', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /[\w]{9,}/,
          inputErrorMessage: '密码格式不正确',
        }).then(async ({ value }) => {
          await this.createWallet(value);
          await this.init();

        }).catch(() => {
          this.$message({
            type: 'info',
            message: '取消输入',
          });
        });
      },

      /**
       * 生成 keystore
       * */
      async createWallet(password) {
         // console.log(password);
         let result = await intjs.newAccount(password);
         if (result.err) {
            this.$message.err('帐户创建失败');
         } else {
           this.$message({
             type: 'success',
             message: ' 帐户创建成功，地址： ' + result,
           });
         }
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
    computed: {

    },
    mounted() {
        this.init();
    },
  };
</script>

<style lang="scss">
  /*@import '../../style/common';*/
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
          /*background-color: #2B68FD;*/
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
      .hijk {
        .el-dialog__header {
          background-color: #F4F8FF;
          text-align: left;
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
      }
      .el-dialog {
        min-width: 500px;
        max-width: 600px;
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

</style>
