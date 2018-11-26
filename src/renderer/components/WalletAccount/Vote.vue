<template>
    <div class="vote" v-loading="isloading">
        <div class="item-title">
            <i class="vote-icon icon-common"></i>
            <span class="item-text">Vote</span>
        </div>

        <div class="item-content">
            <div class="transactionForm">
                <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign" style="overflow: hidden">
                    <el-form-item label="FROM">
                        <el-select v-model="formLabelAlign.account" placeholder="" @change="selectFrom" style="display: block;">
                            <el-option
                                    v-for="(item, index) in balance"
                                    :key="index"
                                    :label="'Account' + ++index + '-' + item.address"
                                    :value="item.address">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="VOTES">
                        <el-input v-model="formLabelAlign.votes" readonly></el-input>
                    </el-form-item>
                    <el-form-item label="BALANCE">
                        <el-input class="balance" v-model="formLabelAlign.balance" readonly></el-input>
                    </el-form-item>

                </el-form>
                <template>
                    <div class="title" style="margin-top: 25px;">Candidates</div>
                </template>
                <el-table
                        :data="candidates"
                        tooltip-effect="dark"
                        style="width: 100%"
                        @selection-change="handleSelectionChange">
                    <el-table-column
                            type="selection"
                            width="55">
                    </el-table-column>
                    <el-table-column
                            label="Address"
                            width="500">
                        <template slot-scope="scope">{{ scope.row.address }}</template>
                    </el-table-column>
                    <el-table-column
                            prop="votes"
                            label="Votes"
                            show-overflow-tooltip>
                    </el-table-column>
                </el-table>
                <el-row style="margin-top: 40px;">
                    <el-col  class="fee">
                        <span class="title">SELECT FEE</span>
                        <p><b>{{txfee}}</b> INT</p>
                        <el-slider v-model="formLabelAlign.fee" :min="slideMin" :max="slideMax"></el-slider>
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
                        <span class="title">TOTAL</span>
                        <p style="font-size: 16px;">Votes: <span class="total-value" style="margin-left: 15px;">{{formLabelAlign.votes}}</span></p>
                        <p style="font-size: 16px;">TxFee: <span class="total-value" style="margin-left: 15px;">{{+txfee}}</span> INT</p>
                    </el-col>
                </el-row>
                <el-button  class="send-btn" @click="sendTransaction"><span>SEND</span></el-button>
            </div>


        </div>


        <el-dialog
                title="vote"
                :visible.sync="centerDialogVisible"
                width="40%"
                center
                class="dark-blue-header two-btn">
            <div class="second-detail" style="padding-bottom: 15px;border-bottom: 1px solid #ccc;">
                <div>
                    <span>Votes:</span>
                    <!--这个单位还要根据前面的名称做动态绑定-->
                    <span>{{formLabelAlign.votes}}</span>
                </div>
                <div>
                    <span>From:</span>
                    <span>{{formLabelAlign.account}}</span>
                </div>
                <div>
                    You are about to execute a function on a contract. This might involve transfer
                    of value.
                </div>
            </div>

            <div class="stripe">
                <div class="stripe-item">
                    <span>Gas limit</span>
                    <span>50000</span>
                </div>

                <div class="stripe-item">
                    <span>Gas price</span>
                    <span>{{formLabelAlign.fee}}</span>
                </div>

                <div style="text-align: center">
                    <el-input
                        type="password"
                        placeholder="Enter password to confim the transaction"
                        v-model="password"
                        @keyup.enter.native="submitTransaction"></el-input>
                </div>
            </div>
            <span slot="footer" class="dialog-footer">
              <el-row>
                <el-col :span="12"><el-button @click="cancelTransaction" class="btn1">Cancel</el-button></el-col>
                <el-col :span="12"><el-button class="btn2" @click="submitTransaction">Confirm</el-button></el-col>
              </el-row>
            </span>
        </el-dialog>
    </div>
</template>

<script>
  import Intjs from 'intjs';

  const intjs = new Intjs('localhost', 8555);
  /* eslint-disable */
  export default {
    name: 'vote',
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
        balanceValue: '',
        slideMin: 0,
        slideMax: 100,
        isloading: false,
        formLabelAlign: {
          account: '',
          votes: 0.00,
          // amount: 0.00,
          balance: 0.00,
          fee: 20,
        },
        candidates: [],
        multipleSelection: [],
      };
    },
    computed: {
      txfee () {
        let x = (this.formLabelAlign.fee * 50000) / Math.pow(10, 18);
        return x;
      }
    },
    methods: {
      sendActiveIndex () {
        this.$emit('listenToActive', 4)
      },
      /**
       * 初始化
       * */
      async init () {
        this.isloading = true;
        let files = await intjs.getAccounts();
        this.formLabelAlign.fee = await intjs.getPrice();
        // this.slideMin = 0;
        this.slideMax = 2000 * Math.pow(10, 9);
        if (files.err) {
          this.$message.error('Reading keystore file error');
        } else {
          this.fileName = files;
          let balanceArray = [];
          this.fileName.forEach(async (value) => {
            let address = value;
            let result = await intjs.getBalance(address);
            balanceArray.push({address: address, balance: result.balance });
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
        this.getAllCandidates();
      },

      /***
       * 获取所有候选节点及票数
       */
      getAllCandidates() {
        setImmediate(async () => {
          let candidates = await intjs.getCandidates();
          let voteResult = await intjs.getVote();
          this.isloading = false;
          if (candidates.err) {
            this.$message.error('Error in obtaining candidate nodes.');
          } else if (candidates.length !== 0) {
            for (let i = 0; i < candidates.length; i++) {
              this.candidates.push({address: candidates[i], votes: 0});
            }
          }

          if (voteResult.err) {
            this.$message.error('Error in obtaining node votes.');
          } else if (voteResult.vote.size !== 0) {
            this.candidates.forEach( (value) => {
              if (voteResult.vote.has(value.address)) {
                value.votes = voteResult.vote.get(value.address).toString();
                value.votes = +value.votes / Math.pow(10, 18);
              }
            });
          }

          this.candidates.sort((a, b) => {
            return (b.votes - a.votes);
          });
        });
      },

      selectFrom () {
        if (this.formLabelAlign.account) {
          this.balance.forEach((value) => {
            if (value.address === this.formLabelAlign.account) {
              this.formLabelAlign.balance = (value.balance / Math.pow(10,18)).toFixed(2);
              this.balanceValue = value.balance / Math.pow(10,18);
            }
          });
          setImmediate(async () => {
            let result = await intjs.getStake(this.formLabelAlign.account);
            if (result.err) {
              this.$message.error('Error in obtaining votes.');
              return;
            } else {
              this.formLabelAlign.votes = (result.stake / Math.pow(10,18)).toFixed(2);
            }
          });
        } else {
          this.$message({
            message: 'Please choose an address.',
            type: 'warning'
          });
        }
      },

      sendTransaction() {
        if (this.formLabelAlign.from === '') {
          this.$message.error('Please choose From address.');
        } else if (this.formLabelAlign.votes === 0) {
          this.$message.error('Remaining votes is 0, please mortgage first.');
        } else if (this.multipleSelection.length === 0) {
          this.$message.error('Please choose at least 1 candidate node.');
        } else if (+this.formLabelAlign.fee < 200*Math.pow(10,9)) {
          this.$message.error('Txfee is too slow.');
        } else if (+this.formLabelAlign.fee > 2000*Math.pow(10,9)) {
          this.$message.error('Txfee is too high.');
        } else if (((+this.formLabelAlign.amount + this.txfee)*Math.pow(10,18)) > +this.balanceValue * Math.pow(10,18)) {
            this.$message.error('Balance is not enough.');
        } else {
          this.centerDialogVisible = true;
        }
      },

      cancelTransaction() {
        this.centerDialogVisible = false;
        this.$message.error('Vote cancel');
      },

      submitTransaction() {
        if (this.password === '') {
          this.$message.error('Please input the password.');
        } else if (this.password.length < 9) {
          this.$message.error('Password length must be greater than or equal to 9.');
        } else {
          setImmediate(async() => {
            let params = {
              method: 'vote',
              value: 0,
              limit: '50000',
              price: this.formLabelAlign.fee,
              input: {candidates: this.multipleSelection},
              password: this.password,
              from: this.formLabelAlign.account
            }
            let result = await intjs.sendTransaction(params);
            console.log('---re vote---', result)
              if (result.err) {
                this.centerDialogVisible = false;
                this.$message.error('Vote failed');
              } else {
                this.centerDialogVisible = false;
                this.$message({
                  message: `Vote successfully，hash:${result.hash}`,
                  type: 'success'
                });
              }
          });
        }
      },

      handleSelectionChange(val) {
        if (val.length !== 0) {
          val.forEach((value) => {
            this.multipleSelection.push(value.address);
          });
        }
      }
    },
    mounted() {
      this.init();
      this.sendActiveIndex();
    },
  };
</script>

<style lang="scss">
    .vote {
        background-color: #fff;
        border-radius: 5px;
        .vote-icon {
            width: 18px;
            height: 18px;
            background-image: url("../../assets/images/vote.png");
            & > span {

            }
        }
        .want-to-send {
            margin-top: 20px!important;
        }
        .el-form-item {
            float: left;
            width: 45%;
            margin-right: 20px;
            .el-select {
                width: 100%;
            }
        }
        .el-row {
            .title {
                display: inline-block;
                font-weight: 500;
                margin-bottom: 20px;
            }
        }
        .candidates {
            margin-bottom: 10px;
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
