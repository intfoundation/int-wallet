<template>
    <div class="token">
        <div class="item-title">
            <i class="token-icon icon-common"></i>
            <span class="item-text">Custom Tokens</span>
        </div>
        <div class="item-content">
            <div class="first-text">Accounts</div>
            <div class="have-account-first">Tokens are currencies and other fungibles built on the Ethereum platform. In order for accounts to watch for tokens and send them, you have to add their address to this list. You can create your own token by simply modifying this example of a custom token contract or learning more about Ethereum Tokens.
            </div>

            <!--token卡片-->
            <div style="margin: 30px 0 20px;">
                <router-link :to="item.url" tag="div" class="accounts" v-for="(item, index) in card"
                             :class="{'blue': index == 0, 'light-blue': index == 1, 'yellow': index == 2, 'purple': index == 3}">
                    <div>{{item.account}}</div>
                    <div>{{item.value}}<span style="font-size: 14px;">INT</span></div>
                    <div>{{item.address}}</div>
                </router-link>
            </div>
            <el-button class="token-btn"><span>WATCH TOKEN</span></el-button>
        </div>

        <el-dialog
            title="Add token"
            :visible.sync="tokenFormVisible"
            width="40%"
            center
            class="dark-blue-header two-btn">

            <!--watch token 表格-->
            <el-form :label-position="labelPosition" label-width="80px" :model="formToken">
                <el-form-item label="TOKEN CONTRACT ADDRESS">
                    <el-input v-model="formToken.address"></el-input>
                </el-form-item>
                <el-form-item label="TOKEN NAME">
                    <el-input v-model="formToken.name" placeholder="0x000000…"></el-input>
                </el-form-item>
                <el-form-item label="TOKEN SYMBOL">
                    <el-input v-model="formToken.symbol" placeholder="0.0">
                        </el-input>
                </el-form-item>
                <el-form-item label="DECIMALS PLACES OF SMALLEST UNIT">
                    <el-input class="balance" v-model="formToken.unit">{{}}</el-input>
                </el-form-item>

                <el-form-item label="PREVIEW">
                    <el-input class="balance" v-model="formToken.unit" type="textarea">{{}}</el-input>
                </el-form-item>

            </el-form>

            <span slot="footer" class="dialog-footer">
              <el-row>
                <el-col :span="12"><el-button @click="visible = false" class="btn1">Cancel</el-button></el-col>
                <el-col :span="12"><el-button class="btn2">Confirm</el-button></el-col>
              </el-row>
            </span>
        </el-dialog>

    </div>
</template>

<script>
  import Intjs from 'intjs';

  const intjs = new Intjs('localhost', 8555);
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
    name: 'token',
    data() {
      return {
        card: cardList,
        tokenFormVisible: true,
        labelPosition: 'top',
        formToken: {
          address: '',
          name: '',
          symbol: '',
          unit: '',
          review: '',
        },
      };
    },
    methods: {
      /* eslint-disable */
      /**
       * 初始化
       * */
      async init () {
        let files = await intjs.getAccounts();
        if (files.err) {
          this.$message.error('读取 keystore 文件出错');
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
    .token {
        background-color: #fff;
        border-radius: 5px;
        .token-icon {
            width: 18px;
            height: 18px;
            background-image: url("../../assets/images/custom-tokens.png");
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
        .token-btn {
            background-color: #3C31D7;
            width: 192px;
            color: #fff;
            height: 40px;
            border-radius: 4px;
            & > span {
                opacity: 0.85;
            }
        }
        .el-dialog {
            .el-dialog__body {
                padding: 25px 55px 30px;
                .el-form-item__label {
                    padding: 0px;
                }
                input {
                    background-color: #F4F8FF;
                    height: 36px;
                }
                textarea {
                    background-color: #F4F8FF;
                    width: 250px;
                    height: 72px;
                }
            }
        }
    }
</style>
