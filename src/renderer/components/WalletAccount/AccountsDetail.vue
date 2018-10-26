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
            <div class="small-text">0xaf09dec48FDd83D2afjqp20093840280024hf203302</div>
            <div class="middle-number">2.99 <span>INT</span></div>
            <!--账户持有的token-->
            <div class="token">
                <span>Internet Node Token</span>
                <span>727.995532 INT</span>
            </div>

            <div class="token">
                <span>Internet Node Token</span>
                <span>727.995532 INT</span>
            </div>

            <!--注意事项-->
            <div class="note">
                <div>NOTE：</div>
                <div>Accounts can't display incoming transactions, but can receive, hold and send INT. To see incoming transactions create a wallet contract to store ether.
                </div>
                <div>If your balance doesn't seem updated, make sure that you are in sync with the network.</div>
            </div>

            <!--最后的链接-->
            <div class="function">
                <router-link to="" tag="span">
                    <i class="transfer icon-common"></i>
                    <span>Transfer INT & Tokens</span>
                </router-link>

                <router-link to="" tag="span">
                    <i class="explorer icon-common"></i>
                    <span>View on INT explorer</span>
                </router-link>

                <router-link to="" tag="span">
                    <i class="copy-address icon-common"></i>
                    <span>Copy address</span>
                </router-link>

                <router-link to="" tag="span">
                    <i class="show-qr icon-common"></i>
                    <span>Show QR-Code</span>
                </router-link>
            </div>
        </div>
        <el-dialog
            title="Show QR-Code"
            :visible.sync="aaa"
            center>
           <div>Point a compatible mobile app to this code</div>
            <span slot="footer" class="dialog-footer">
          <el-row>
            <el-col :span="12"><el-button @click="aaa = false" class="btn1">Cancel</el-button></el-col>
            <el-col :span="12"><el-button  class="btn2">Confirm</el-button></el-col>
          </el-row>
        </span>
        </el-dialog>
    </div>
</template>

<script>
    export default {
      data() {
        return {
          aaa: true,
        };
      },
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
            & > span {
                margin-right: 45%;
            }
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
            padding: 32px 0 98px 0;
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
    }
</style>
