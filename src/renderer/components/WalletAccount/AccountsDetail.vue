<template>
    <div class="accounts-detail">
        <div class="item-title" style="font-weight: 500;">
            <i class="wallet icon-common"></i>
            <router-link to="/wallets" class="crumb-wallet">Wallets</router-link>
            <span class="trangle"></span>
            <span>Accounts Details</span>
        </div>
        <div class="item-content">
            <div class="first-text">Accounts</div>
            <div class="small-text">{{address}}</div>
            <div class="middle-number">{{balance}} <span>INT</span></div>
            <!--账户持有的token-->
            <div class="token" v-if="tokenBalance !== '' ">
                <span>INT1NXXTMLqmDf4vf7KcNYzvxr36LCL4oTZvq</span>
                <span style="float: right;">{{tokenBalance}}</span>
            </div>

            <!--注意事项-->
            <div class="note">
                <div>NOTE：</div>
                <div>Accounts can't display incoming transactions, but can receive, hold and send INT. To see incoming transactions create a wallet contract to store ether.
                </div>
                <div>If your balance doesn't seem updated, make sure that you are in sync with the network.</div>
            </div>

            <!--四个功能性-->
            <div class="function">
                <router-link :to="{path: '/send', query: {address: address} }" tag="span">
                    <i class="transfer icon-common"></i>
                    <span>Transfer INT & Tokens</span>
                </router-link>


                <span @click="doCopy">
                    <i class="copy-address icon-common"></i>
                    <span>Copy address</span>
                </span>

                <a @click="openQR">
                    <i class="show-qr icon-common"></i>
                    <span>Show QR-Code</span>
                </a>
            </div>

            <!--交易记录-->
            <div class="transaction">
                <div>Transaction record</div>
                <div class="no-transaction" v-if="txList.length === 0">No transaction record.</div>

                <!--交易记录-->
                <div v-if="txList.length > 0">
                    <!--每一条交易记录-->
                    <div class="trasaction-record" v-for="item in txList">
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
            title="Show QR-Code"
            :visible.sync="showQR"
            center
            class="dark-blue-header two-btn">
            <canvas id="canvas"></canvas>
            <div>Point a compatible mobile app to this code</div>
            <span slot="footer" class="dialog-footer">
          <el-row>
            <el-col :span="12"><el-button @click="showQR = false" class="btn1">Cancel</el-button></el-col>
            <el-col :span="12"><el-button  @click="showQR = false" class="btn2">Confirm</el-button></el-col>
          </el-row>
        </span>
        </el-dialog>
    </div>
</template>

<script>
  /* eslint-disable */
  import Intjs from 'intjs';
  import axios from 'axios';
  import QRCode from 'qrcode';
  const intjs = new Intjs('localhost', 18089);
    export default {
      data() {
        return {
          showQR: false,
          address: '',
          balance: '',
          pageSize: 10000,
          txList: [],
          tokenBalance: ''
        };
      },
      created() {
        this.address = this.$route.query.address;
      },
      mounted() {
        this.getTransactionHash(this.address)
        // this.getTokenAccount()
        this.getTokenBalance()
      },
      methods: {
        openQR () {
          this.showQR = true;
          let that = this;
          setTimeout(function() {
            let dom = document.getElementById('canvas')
            QRCode.toCanvas(dom, that.address, function() {
            })
          }, 0)
        },
        doCopy () {
          this.$copyText(this.address).then( () => {
            this.$message({
              type: 'success',
              message: '复制成功',
              duration: 1000
            })
          }, () => {
            this.$message({
              type: 'error',
              message: '复制失败',
              duration: 1000
            })
          })
        },
        async getTransactionHash(address) {
          let result = await intjs.getBalance(address);
          this.balance = +result.balance / Math.pow(10, 18);
          let txInformation = await intjs.chainClient.getTransactionByAddress({address});
          if (txInformation.err === 0) {
            txInformation.txs.forEach(async(item) => {
              let result = await intjs.getTransactionReceipt(item.txhash);
              this.txList.push(result)
            })
          }
        },
        getTokenAccount (){
          const that = this;
          axios.get('https://explorer.intchain.io/api/wallet/walletList', {
            params: {
              source: 'wallet',
              pageSize: that.pageSize,
              address: that.address,
            },
          })
            .then((res) => {
              const result = res.data;
              if (result.status === 'success') {
                let tokenlist = result.data.tokenList;
                if (tokenlist.length != 0) {
                  tokenlist.forEach(function(item){
                    that.balanceAndToken.push({
                      name: item.coin,
                      balance: item.balance
                    })
                  })
                }
              }
            })
            .catch(error => {
              console.log(error);
            });
        },
        async getTokenBalance () {
          let that = this;
          let result = await intjs.getTokenBalance('INT1NXXTMLqmDf4vf7KcNYzvxr36LCL4oTZvq', that.address);
          that.tokenBalance = +result.balance / Math.pow(10, 18);
        }
      }
    };
</script>

<style lang="scss">
    .accounts-detail {
        background-color: #fff;
        border-radius: 5px;
        .wallet {
            width: 18px;
            height: 15px;
            background-image: url('../../assets/images/wallet.png');
            margin-right: 10px;
        }
        .crumb-wallet {
            text-decoration: none;
            color: #333;
        }
        .crumb-wallet:hover {
            color: #3C31D7;
        }
        .trangle {
            display: inline-block;
            width: 0;
            height: 0;
            border-top: 5px solid transparent;
            border-bottom: 5px solid transparent;
            border-left: 5px solid #8A8F99;
            margin: 0 10px;
        }
        .middle-number {
            color: #3c31d7;
            font-size: 20px;
            margin: 15px 0;
            & > span {
                color: #999;
                font-size: 14px;
            }
        }
        .token {
            background-color: #F4F8FF;
            border-radius: 4px;
            padding: 12px 28px;
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
        }
        .note {
            margin-top: 50px;
            color: #999;
            font-size: 12px;
            padding-bottom: 50px;
            border-bottom: 1px solid #ccc;
            & > div:first-of-type {
                color: #666;
                margin-bottom: 10px;
            }
            & > div:nth-of-type(2) {
                margin-bottom: 10px;
            }
        }
        .function {
            padding: 32px 0;
            display: flex;
            justify-content: space-between;
            color: #3C31D7;
            & > span {
                cursor: pointer;
            }
            .transfer {
                width: 18px;
                height: 18px;
                background-image: url("../../assets/images/transfer.png");
                margin-right: 5px;
            }
            .explorer {
                width: 18px;
                height: 18px;
                background-image: url("../../assets/images/explorer.png");
                margin-right: 5px;
            }
            .copy-address {
                width: 18px;
                height: 18px;
                background-image: url("../../assets/images/copy-address.png");
                margin-right: 5px;
            }
            .show-qr {
                width: 18px;
                height: 18px;
                background-image: url("../../assets/images/show-qr.png");
                margin-right: 5px;
            }
        }
        .transaction {
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
        #canvas {
            width: 120px !important;
            height: 120px !important;
        }
        .el-dialog__body {
            text-align: center;
        }
    }
</style>
