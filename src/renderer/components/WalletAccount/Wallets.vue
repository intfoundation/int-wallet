<template>
    <div class="wallets">
      <div class="item-title">
        <div>
          <i class="wallet icon-common"></i>
          <span>Wallets</span>
        </div>
      </div>

      <div class="item-content">
        <div>Accounts</div>
        <div>YOU HAVE NO ACCOUNTS YET</div>
        <div>You need to create at least one account with a strong password</div>
        <div>
          <span class="add" @click="pop">+</span>
          <span class="add-text" @click="pop">ADD ACCOUNT</span>
        </div>
      </div>

      <el-dialog
        title="Create an account"
        :visible.sync="visible"
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

      // 这个dialog
      <el-dialog
        title="Be careful"
        :visible.sync="carefulVisible"
        center>
        <div>Make sure you backup your keyfiles AND password!</div>
        <div>You can find your keyfiles folder using the main menu-> File -> Backup 
        -> Accounts.Keep a copy of the "keystore" folder where you can't lose it!</div>
        <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="dialogVisible = false">Confirm</el-button>
        </span>
      </el-dialog>
    </div>
</template>

<script>
  import Intjs from 'intjs';
  // import { ipcRenderer } from 'electron';

  const intjs = new Intjs('localhost', 18089);

  export default {
    name: 'wallets',
    data() {
      return {
        fileName: [],
        balance: [],
        searchTx: '',
        visible: false,
        showPassword: false,
        carefulVisible: true,
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
    .wallets {
      background-color: #fff;
      border-radius: 5px;
      .item-title {
        padding: 28px 32px;
        border-bottom: 1px solid #ccc;
      }
      .item-content {
        padding: 40px 104px;
        div:nth-of-type(1) {
          color: #3C31D7;
          font-size: 28px;
          margin-bottom: 28px;
        }
        div:nth-of-type(2) {
          font-size: 18px;
          margin-bottom: 5px;
        }
        div:nth-of-type(3) {
          color: #666;
          margin-bottom: 28px;
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
      }
      .el-dialog {
        min-width: 500px;
        max-width: 600px;
        .el-dialog__header {
          border-bottom: 1px solid #ccc;
          padding: 20px;
          .el-dialog__title {
            color: #3C31D7;
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
        .el-dialog__footer {
          padding: 15px;
          .el-col:first-of-type {
            border-right: 1px solid #ccc;
          }
          .el-button {
            border: none;
          }
          .el-button:hover {
            background: none;
          }
          .btn1:hover {
            color: #333;
          }
          .btn2 {
            color: #3C31D7;
          }
          .btn2:hover {
            color: #3C31D7;
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
  .icon-common {
    display: inline-block;
    vertical-align: middle;
    background-size: cover;
    background-size: cover;
  }
  // .btn {
  //   border: 1px solid red;
  // }
</style>
