<template>
    <div class="vote">
        <div class="item-title">
            <i class="vote-icon icon-common"></i>
            <span class="item-text">Vote</span>
        </div>

        <div class="item-content">
            <div class="transactionForm">
                <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign" style="overflow: hidden">
                    <el-form-item label="FROM">
                        <el-select class="select-from" v-model="formLabelAlign.from" placeholder="" @change="selectFrom">
                            <el-option v-for="(item, index) in balance" :key="item.address" :label="'Account-' + ++index" :value="item.address"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="VOTES">
                        <el-input v-model="formLabelAlign.votes"></el-input>
                    </el-form-item>
                    <el-form-item label="BALANCE">
                        <el-input class="balance" v-model="formLabelAlign.balance" readonly>{{formLabelAlign.balance}}</el-input>
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
                        <p><b>{{formLabelAlign.fee/20}}</b> INT</p>
                        <el-slider v-model="formLabelAlign.fee"></el-slider>
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
                <el-button  class="send-btn"><span>SEND</span></el-button>
            </div>


        </div>


        <el-dialog
                title="Transaction"
                :visible.sync="centerDialogVisible"
                width="40%"
                center>
            <p>From: <span>{{formLabelAlign.from}}</span></p>
            <p>Votes: <span>{{formLabelAlign.votes}}</span></p>
            <p>Fee: <span>{{formLabelAlign.fee/20}}</span></p>
            <p>Password: <input type="password" placeholder="Enter password" v-model="password"></p>
            <span slot="footer" class="dialog-footer">
            <el-button @click="cancelTransaction">Cancel</el-button>
            <el-button type="primary" @click="submitTransaction">Send Transaction</el-button>
          </span>
        </el-dialog>
    </div>
</template>

<script>
  import Intjs from 'intjs';

  const intjs = new Intjs('localhost', 18089);
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
    components: {

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
        this.getAllCandidates();
      },

      /***
       * 获取所有候选节点及票数
       */
      getAllCandidates() {
        setImmediate(async () => {
          let candidates = await intjs.getCandidates();
          let voteResult = await intjs.getVote();

          if (candidates.err) {
            this.$message.error('获取候选节点出错');
          } else if (candidates.length !== 0) {
            for (let i = 0; i < candidates.length; i++) {
              this.candidates.push({address: candidates[i], votes: 0});
            }
          }

          if (voteResult.err) {
            this.$message.error('获取节点票数出错');
          } else if (voteResult.vote.size !== 0) {
            this.candidates.forEach( (value) => {
              // console.log(value);
              // console.log(voteResult.vote.get(value.address));
              if (voteResult.vote.get(value.address)) {
                value.votes = voteResult.vote.get(value.address);
              }
            });
          }

          this.candidates.sort((a, b) => {
            return (b.votes - a.votes);
          });
        });
      },

      selectFrom () {
        if (this.formLabelAlign.from) {
          this.balance.forEach((value) => {
            if (value.address === this.formLabelAlign.from) {
              this.formLabelAlign.balance = value.balance;
            }
          });
          setImmediate(async () => {
            let result = await intjs.getStoke(this.formLabelAlign.from);
            if (result.err) {
              this.$message.error(result.err);
              return;
            } else {
              this.formLabelAlign.votes = result.stoke;
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
        } else if (this.formLabelAlign.votes === 0) {
          this.$message.error('余额为0，请先换票');
        } else if (this.multipleSelection.length === 0) {
          this.$message.error('请至少选择一个候选节点');
        } else if (this.formLabelAlign.fee < 0.005) {
          this.$message.error('交易费用必须大于等于0.005 INT');
        } else if (this.formLabelAlign.balance < 0.005) {
          this.$message.error('余额不足');
        } else {
          this.centerDialogVisible = true;
        }
      },

      cancelTransaction() {
        this.centerDialogVisible = false;
        this.$message.error('取消投票');
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
              let result = await intjs.vote(this.multipleSelection, (this.formLabelAlign.fee/20*10^18).toString(), account.privateKey.toString());
              if (result.err) {
                this.centerDialogVisible = false;
                this.$message.error('投票失败');
              } else {
                this.centerDialogVisible = false;
                this.$message({
                  message: `投票成功，hash:${result.hash}`,
                  type: 'success'
                });
              }
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
    computed: {

    },
    mounted() {
      this.init();
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
    }
</style>
