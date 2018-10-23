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
                      <span>6498292</span>
                  </span>

                  <span>
                      <i class="block-time icon-common"></i>
                      <span>A Minite since last block</span>
                  </span>
              </div>
              <span class="balance">Balance: 10.99 INT</span>
          </div>
        </el-header>
        <el-container>
            <el-aside width="200px">
              <router-link class="aside-item" to="/wallets" tag="div">
                <div class="aside-item-inner">
                  <i class="wallet icon-common"></i>
                  <span>Wallets</span>
                </div>
              </router-link>
              <router-link class="aside-item" to="/send" tag="div">
                <div class="aside-item-inner">
                  <i class="send icon-common"></i>
                  <span>Send</span>
                </div>
              </router-link>
              <router-link class="aside-item" to="/" tag="div">
                <div class="aside-item-inner">
                  <i class="tokens icon-common"></i>
                  <span>Custom Tokens</span>
                </div>
              </router-link>
              <router-link class="aside-item" to="/mortgage" tag="div">
                <div class="aside-item-inner">
                  <i class="mortgage icon-common"></i>
                  <span>Mortgage</span>
                </div>
              </router-link>
              <router-link class="aside-item" to="/unmortgage" tag="div">
                <div class="aside-item-inner">
                  <i class="unmortgage icon-common"></i>
                  <span>Unmortgage</span>
                </div>
              </router-link>
              <router-link class="aside-item" to="/vote" tag="div">
                <div class="aside-item-inner">
                  <i class="vote icon-common"></i>
                  <span>Vote</span>
                </div>
              </router-link>
            </el-aside>
            <el-main>
                <router-view></router-view>
                <!--这是项目中第二层router-view，他对应的是第二层路由-->
            </el-main>
        </el-container>
    </el-container>
</template>

<script>
  import Wallets from './Wallets';
  export default {
    name: 'wallet-account',
    data() {
      return {
        activeIndex: '1',
      };
    },
    components: {
      Wallets,
    },
    methods: {
      walletInfor() {
        this.$router.push('/wallets');
      },
      sendTx() {
        this.$router.push('/send');
      },
      mortgage() {
        this.$router.push('/mortgage');
      },
      unmortgage() {
        this.$router.push('/unmortgage');
      },
      vote() {
        this.$router.push('/vote');
      },
    },
    computed: {

    },
    mounted() {

    },
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
                  width: 15px;
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
  .el-aside {
    // background-color: #bbb;
    .aside-item {
      height: 60px;
      border: 1px solid #e5edff;
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
        .send {
          width: 18px;
          height: 15px;
          background-image: url('../../assets/images/send.png');
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
        .unmortgage {
          width: 18px;
          height: 15px;
          background-image: url('../../assets/images/unmortgage.png');
          margin-right: 10px;
        }
        .vote {
          width: 18px;
          height: 15px;
          background-image: url('../../assets/images/vote.png');
          margin-right: 10px;
        }
        & span {
          font-size: 14px;
          vertical-align: middle;
        }
      }
    }
  }
  .el-main {
    background-color: #f5f5f5;
    padding: 70px 50px;
  }
</style>
