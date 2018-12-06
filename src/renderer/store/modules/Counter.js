/* eslint-disable */

import Intjs from 'intjs';
const intjs = new Intjs('localhost', 8555);

const state = {
  accountList: [],
  isHaveAccount: false,
  price: null
};

const mutations = {
  GET_ACCOUNTLIST (state, files) {
    state.accountList = files
    console.log('---accountList---', state.accountList)
  },
  HAVE_ACCOUNT (state) {
    state.isHaveAccount = true
  },
  PRICE (state, price) {
    state.price = price
  }
};

const actions = {
  async getAccountList ({ commit }, that) {
    try {
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
        commit('PRICE', price)
        return price
      }
    } catch (err) {
      console.log('123')
      throw new Error(err)
    }
  }
};

export default {
  state,
  mutations,
  actions,
};
