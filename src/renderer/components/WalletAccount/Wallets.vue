<template>
    <div class="wallets">
        <h3 class="title">Accounts Overview</h3>
        <div class="content">
            <el-tag>Accounts</el-tag>
            <p>Accounts are password protected keys that can hold INT and INT-based tokens.</p>
            <el-row>
                <ul class="account-list">
                    <li v-for="(item, index) in balance" :key="item.id">
                        <a href="">
                            <dl>
                                <dt>Account {{index + 1}}</dt>
                                <dd class="price"><span>{{Number(item.balance).toFixed(2)}} </span>INT</dd>
                                <dd class="address">{{item.address}}</dd>
                            </dl>
                        </a>
                    </li>
                </ul>
            </el-row>
            <el-row>
                <el-button type="primary" @click="addAccount">Add Account</el-button>
            </el-row>
        </div>
        <div class="content">
            <el-tag>Wallet Contracts</el-tag>
            <p>These contracts are stored on the blockchain and can hold and secure INT. They can have multiple accounts as owners and keep a full log of all transactions.</p>
            <!--<el-row>-->
                <!--<ul class="account-list">-->
                    <!--<li v-for="(item, index) in balance" :key="item.id">-->
                        <!--<a href="">-->
                            <!--<dl>-->
                                <!--<dt>Account {{index + 1}}</dt>-->
                                <!--<dd class="price"><span>{{Number(item.balance).toFixed(2)}} </span>INT</dd>-->
                                <!--<dd class="address">{{item.address}}</dd>-->
                            <!--</dl>-->
                        <!--</a>-->
                    <!--</li>-->
                <!--</ul>-->
            <!--</el-row>-->
            <el-row>
                <el-button type="primary" @click="addWalletContract">Add Wallet Contract</el-button>
            </el-row>
        </div>
        <div class="content">
            <el-tag>Latest Transactions</el-tag>
            <el-row>
                <el-col :span="8">
                    <el-input class="search-tx" v-model="searchTx" placeholder="Filter Transactions"></el-input>
                </el-col>
            </el-row>
            <el-table
                    :data="tableData"
                    stripe
                    style="width: 100%">
                <el-table-column
                        prop="date"
                        label="Date"
                        width="100">
                </el-table-column>
                <el-table-column
                        prop="transaction"
                        label="Transaction"
                        width="500">
                </el-table-column>
                <el-table-column
                        prop="amount"
                        label="Amount">
                </el-table-column>
            </el-table>
        </div>
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
        tableData: [{
          date: '2016-05-02',
          transaction: '张玉力',
          amount: '0.00001 INT',
        }, {
          date: '2016-05-04',
          transaction: '张玉力',
          amount: '0.00002 INT',
        }, {
          date: '2016-05-01',
          transaction: '张玉力',
          amount: '0.00004 INT',
        }, {
          date: '2016-05-03',
          transaction: '张玉力',
          amount: '0.0000006 INT',
        }],
      };
    },
    components: {

    },
    methods: {
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

<style scoped lang="scss">
    .wallets {
        padding: 20px 40px;
    }
    .title {
        font-weight: 500;
        margin-bottom: 10px;
    }
    .content {
        margin-top: 30px;
        margin-bottom: 50px;
        p {
            margin: 20px 0;
            font-size: 12px;
        }
        .account-list {
            list-style: none;
            li {
                float: left;
                a {
                    text-decoration: none;
                    color: #333;
                    dl {
                        margin-right: 10px;
                        margin-bottom: 20px;
                    }
                    dd {
                        margin-top: 5px;
                        color: #969696;
                    }
                }
            }
            .price {
                span {
                    font-size: 12px;
                }
            }
            .address {
                font-size: 12px;
            }

        }
        .search-tx {
            margin: 20px 0;
        }
    }
</style>