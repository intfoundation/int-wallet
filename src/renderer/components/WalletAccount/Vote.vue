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
                        <el-select v-model="formLabelAlign.from" placeholder="" @change="selectFrom" style="display: block;">
                            <el-option
                                    v-for="(item, index) in accountList"
                                    :key="index"
                                    :label="'Account' + ++index + '-' + item"
                                    :value="item">
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
                    <el-col style="margin-top: 40px;">
                        <span class="title">TOTAL</span>
                        <p style="font-size: 16px;">
                            <span>Votes: </span>
                            <span class="total-value">{{formLabelAlign.votes}}</span>
                        </p>
                        <p style="font-size: 16px;">
                            <span>TxFee: </span>
                            <span class="total-value">{{+txfee}}</span>
                            <span class="unit">&nbsp;INT</span>
                        </p>
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
                    <span>{{formLabelAlign.from}}</span>
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
  import { sendActiveIndex } from './common/index';
  import store from '../../utils/storage';
  const intjs = new Intjs('localhost', 8555);
  /* eslint-disable */
  export default {
    name: 'vote',
    data() {
      return {
        accountList:[],
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
        slideMax: 2000 * Math.pow(10, 9),
        isloading: false,
        formLabelAlign: {
          from: '',
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
    created () {
      this.getAddress();
      sendActiveIndex(this, 4);
      this.getAllCandidates();
    },
    async mounted () {
      let price = await this.$store.dispatch('getPrice')
      if (price.err) {
        this.formLabelAlign.fee = 200000000000;
      } else {
        this.formLabelAlign.fee = price
      }
    },
    methods: {
      getAddress () {
        let storage = store.get('accountList')
        storage = JSON.parse(storage)
        this.accountList = storage
      },
      /***
       * 获取所有候选节点及票数
       */
      async getAllCandidates() {
        let voteResult = await intjs.getVote();
        this.isloading = false;
        if (voteResult.err) {
            this.$message.error('Error in obtaining node votes.');
          } else if (voteResult.length !== 0) {
            for(let i in voteResult) {
              voteResult[i].vote = +voteResult[i].vote.toString() / Math.pow(10, 18)
              this.candidates.push({
                address: voteResult[i].address,
                votes: voteResult[i].vote
              })
            }
          }
      },

      selectFrom () {
        this.$store.dispatch('selectFromAction', {that: this, isStake: true})
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
        let params = {
          method: 'vote',
          value: '0',
          limit: '50000',
          price: this.formLabelAlign.fee.toString(),
          input: {candidates: this.multipleSelection},
          password: this.password,
          from: this.formLabelAlign.from
        }
        this.$store.dispatch('sendTransaction', {that: this, params: params, type: 'vote'})
      },

      handleSelectionChange(val) {
        if (val.length !== 0) {
          val.forEach((value) => {
            this.multipleSelection.push(value.address);
          });
        }
      }
    }
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
            .total-value {
                margin-left: 15px;
                vertical-align: middle;
            }
            .unit {
                font-size: 15px;
                vertical-align: -3px;
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
