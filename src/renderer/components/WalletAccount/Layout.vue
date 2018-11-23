<template>
    <el-container>
        <el-header>
          <div class="wrapper">
              <img src="../../assets/images/int-logo.png" alt="int-logo" class="int-logo">
              <div class="nav-mid">
                  <span>
                      <i class="remote icon-common"></i>
                      <span>Remote</span>
                  </span>

                  <span>
                      <i class="block-height icon-common"></i>
                      <span v-if="!this.height.err">{{height}}</span>
                      <span v-else>Waiting for blocks...</span>
                  </span>

                  <!--<span>-->
                      <!--<i class="block-time icon-common"></i>-->
                      <!--<span>A Minite since last block</span>-->
                  <!--</span>-->
              </div>
              <span class="balance">Balance: {{ (totalBalance / Math.pow(10, 18)).toFixed(2) }} INT</span>
          </div>
        </el-header>
        <el-container>
            <el-aside width="200px">
                <router-link
                        class="aside-item"
                        :class="{'aside-item-active': activeIndex === index}"
                        :to="item.address" tag="div" v-for="(item, index) in navlist"
                        @click.native="switchNav(index)">
                    <div class="aside-item-inner">
                        <i
                            class="icon-common"
                            :class="[{'wallet': index === 0}, {'send': index === 1}, {'mortgage': index === 2},
                            {'unmortgage': index === 3 }, {'vote': index === 4},
                            {'active-wallet': index === 0 && activeIndex === index},
                            {'active-send': index === 1 && activeIndex === index},
                            {'active-mortgage': index === 2 && activeIndex === index},
                            {'active-unmortgage': index === 3 && activeIndex === index},
                            {'active-vote': index === 4 && activeIndex === index}]"></i>
                        <span :class="{'blue-color': activeIndex === index}">{{item.name}}</span>
                    </div>
                </router-link>
            </el-aside>
            <el-main>
                <router-view v-on:listenToActive="seeActiveIndex"></router-view>
                <!--这是项目中第二层router-view，他对应的是第二层路由-->
            </el-main>
        </el-container>
    </el-container>
</template>

<script>
  /* eslint-disable */
  import Intjs from 'intjs';
  const intjs = new Intjs('localhost', 8555);
  export default {
    name: 'wallet-account',
    data() {
      return {
        activeIndex: 0,
        height: '',
        time: '',
        navlist: [
          {
            address: '/wallets',
            name: 'Wallets',
            className: 'wallet',
            activeClassName: 'active-wallet'
          },
          {
            address: '/send',
            name: 'Send',
            className: 'send',
            activeClassName: 'active-send'
          },
          {
            address: '/mortgage',
            name: 'Mortgage',
            className: 'mortgage',
            activeClassName: 'active-mortgage'
          },
          {
            address: '/unmortgage',
            name: 'Unmortgage',
            className: 'unmortgage',
            activeClassName: 'active-unmortgage'
          },
          {
            address: '/vote',
            name: 'Vote',
            className: 'vote',
            activeClassName: 'active-vote'
          },
        ],
        totalBalance: 0,
        fileName: []
      };
    },
    mounted() {
      this.getBlockHeight()
      setInterval( () => {
        this.getBlockHeight()
      }, 10000)
      this.init()
    },
    methods: {
      seeActiveIndex (data) {
        this.activeIndex = data;
      },
      async init () {
        let files = await intjs.getAccounts();
        if (files.err) {
          this.isHaveAccount = true;
          this.$message({
            message: 'Please create an account first.',
            type: 'warning'
          });
        } else {
          this.fileName = files;
          this.fileName.forEach(async (value) => {
            let address = value;
            let result = await intjs.getBalance(address);
            this.totalBalance += +result.balance;
          });
        }
      },

      async getBlockHeight() {
        this.height = await intjs.getBlockNumber()
      },
      switchNav (index) {
        this.activeIndex = index;
      }
    }
  };
</script>

<style scoped lang="scss">
  .el-header {
      height: 72px !important;
      .wrapper {
          padding: 10px 40px;
          box-sizing: border-box;
          .int-logo {
              width: 72px;
              height: 52px;
              vertical-align: middle;
          }
          .nav-mid {
              display: inline-block;
              vertical-align: middle;
              margin-left: 8%;
              & span {
                  padding: 10px 30px;
              }
              & span:not(:last-of-type) {
                  border-right: 1px solid #ccc;
              }
              .remote {
                  width: 15px;
                  height: 15px;
                  background-image: url("../../assets/images/linkfrom.png");
              }
              .block-height {
                  width: 16px;
                  height: 15px;
                  background-image: url("../../assets/images/asset.png");
              }
              .block-time {
                  width: 15px;
                  height: 15px;
                  background-image: url("../../assets/images/time.png");
              }
          }
          .balance {
              float: right;
              line-height: 52px;
          }
      }
  }

  .el-main {
    background-color: #f5f5f5;
    padding: 20px 50px;
  }
  .el-aside {
      .aside-item-active {
          border-bottom: 2px solid #3C31D7;
      }
      .aside-item {
          height: 60px;
          margin: 0 10px;
          cursor: pointer;
          .aside-item-inner {
              line-height: 60px;
              margin-left: 25px;
              .wallet {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/wallet.png');
                  margin-right: 10px;
              }
              .active-wallet {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/wallet-active.png');
                  margin-right: 10px;
              }
              .send {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/send.png');
                  margin-right: 10px;
              }
              .active-send {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/send-active.png');
                  margin-right: 10px;
              }
              .tokens {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/custom-tokens.png');
                  margin-right: 10px;
              }
              .mortgage {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/mortgage.png');
                  margin-right: 10px;
              }
              .active-mortgage {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/mortgage-active.png');
                  margin-right: 10px;
              }
              .unmortgage {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/unmortgage.png');
                  margin-right: 10px;
              }
              .active-unmortgage {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/unmortgage-active.png');
                  margin-right: 10px;
              }
              .vote {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/vote.png');
                  margin-right: 10px;
              }
              .active-vote {
                  width: 18px;
                  height: 15px;
                  background-image: url('../../assets/images/vote-active.png');
                  margin-right: 10px;
              }
              .blue-color {
                  color: #3C31D7;
              }
              & span {
                  font-size: 14px;
                  vertical-align: middle;
              }
          }
      }
  }
</style>
