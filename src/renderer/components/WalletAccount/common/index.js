/* eslint-disable */
import Intjs from 'intjs';
const intjs = new Intjs('localhost', 8555);

const sendActiveIndex = function (that, index) {
  that.$emit('listenToActive', index);
}

const init = async function (that) {
  that.isloading = true;
  let files = await intjs.getAccounts();
  let price = await intjs.getPrice();
  if (price.err) {
    that.formLabelAlign.fee = 200000000000;
  } else {
    that.formLabelAlign.fee = price
  }
  if (files.err) {
    that.$message({
      message: 'Reading keystore file error.',
      type: 'error'
    });
  } else {
    for(let value of files){
      let address = value;
      that.accountList.push({address: address});
    }
    that.isloading = false;
  }
}


const selectFromAction = async function(that){
    if (that.formLabelAlign.from) {
      for (let value of that.accountList) {
        if (value.address === that.formLabelAlign.from) {
          let result = await intjs.getBalance(value.address);
          that.formLabelAlign.balance = +result.balance / Math.pow(10, 18)
        }
      }
    } else {
      that.$message({
        message: 'Please choose an address.',
        type: 'warning'
      });
    }
}

const selectFromAction2 = async function(that) {
  if (that.formLabelAlign.from) {
    for (let value of that.accountList) {
      if (value.address === that.formLabelAlign.from) {
        let result = await intjs.getBalance(value.address);
        that.formLabelAlign.balance = +result.balance / Math.pow(10, 18)
      }
    }
    let stake = await intjs.getStake(that.formLabelAlign.from);
    if (stake.err) {
      that.$message.error('Error in obtaining votes');
    } else {
      that.formLabelAlign.votes = (stake.stake / Math.pow(10,18)).toFixed(2);
    }
  } else {
    that.$message({
      message: 'Please choose an address.',
      type: 'warning'
    });
  }
}

const checkTransaction = function(that) {
  if (that.formLabelAlign.from === '') {
    that.$message.error('Please choose From address.');
  } else if (that.formLabelAlign.to === '') {
    that.$message.error('Please choose To address.');
  } else if (Number(that.formLabelAlign.amount) === 0) {
    that.$message.error('The number of amount should not be 0.');
  } else if (+that.formLabelAlign.fee < 200*Math.pow(10,9)) {
    that.$message.error('Txfee is too slow.');
  } else if (+that.formLabelAlign.fee > 2000*Math.pow(10,9)) {
    that.$message.error('Txfee is too high.');
  } else if ( ((+that.formLabelAlign.amount + +that.txfee)*Math.pow(10,18)) > +that.formLabelAlign.balance*Math.pow(10,18)) {
    that.$message.error('Balance is not enough.');
  } else {
    that.centerDialogVisible = true;
  }
}

export {
  sendActiveIndex,
  init,
  selectFromAction,
  checkTransaction,
  selectFromAction2
}

