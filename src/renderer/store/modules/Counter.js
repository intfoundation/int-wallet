/* eslint-disable */
import store from '../../utils/storage'
import Intjs from 'intjs';
const intjs = new Intjs('localhost', 8555);

const state = {
  accountList: [],
  isHaveAccount: false
};

const mutations = {
  GET_ACCOUNTLIST (state, files) {
    state.accountList = files
  },
  HAVE_ACCOUNT (state) {
    state.isHaveAccount = true
  }
};

const actions = {
  async getAccountList ({ commit }, that) {
    try {
      that.isloading = true;
      let files = await intjs.getAccounts();
      if (files.err) { // 这里报的err应该是和catch里抓出来的不一样
        that.$message({
          message: 'Reading keystore file error.',
          type: 'error'
        });
      } else if (files.length === 0) {
        commit('HAVE_ACCOUNT')
      } else {
        commit('GET_ACCOUNTLIST', files)
        store.set('accountList', files)
        return files;
      }
    } catch (err) {
      throw new Error(err)
    }
  },
  async getPrice ({ commit }, that) {
    try {
      let price = await intjs.getPrice()
      if (price.err) {
        that.$message({
          message: 'Error in obtaining price.',
          type: 'error'
        });
      } else {
        return price
      }
    } catch (err) {
      throw new Error(err)
    }
  },
  async selectFromAction ( {commit}, data ) {
    let that = data.that
    let isStake = data.isStake
    if (that.formLabelAlign.from) {
      for (let value of that.accountList) {
        if (value === that.formLabelAlign.from) {
          let result = await intjs.getBalance(value);
          that.formLabelAlign.balance = +result.balance / Math.pow(10, 18)
          if (isStake) {
            let stake = await intjs.getStake(that.formLabelAlign.from);
            if (stake.err) {
              that.$message.error('Error in obtaining votes');
            } else {
              that.formLabelAlign.votes = (stake.stake / Math.pow(10,18)).toFixed(2);
            }
          }
        }
      }
    } else {
      that.$message({
        message: 'Please choose an address.',
        type: 'warning'
      });
    }
  },
  sendTransaction({ commit }, data) {
    let that = data.that
    let params = data.params
    let type = data.type
    if (that.password === '') {
      that.$message.error('Please input the password.');
    } else if (that.password.length < 9) {
      that.$message.error('Password length must be greater than or equal to 9.');
    } else {
      setImmediate(async() => {
        let result = await intjs.sendTransaction(params);
        console.log(`---${type}--result---`, result)
        if (result.err) {
          that.centerDialogVisible = false;
          that.$message.error(`${type} failed`);
        } else {
          that.centerDialogVisible = false;
          that.$message({
            message: `${type} successfully，hash:${result.hash}`,
            type: 'success'
          });
        }
      });
    }
  }
};

export default {
  state,
  mutations,
  actions,
};
