<template>
    <div class="wallets">
        <h3 class="title">Accounts Overview</h3>
        <div class="content">
            <el-tag>Accounts</el-tag>
            <p>Accounts are password protected keys that can hold INT and INT-based tokens.</p>
            <el-row>
                <ul class="account-list">
                    <li>
                        <a href="">
                            <dl>
                                <dt>Account 1</dt>
                                <dd class="price"><span>0.00 </span>INT</dd>
                                <dd class="address">0x464f07B20C2fe737...</dd>
                            </dl>
                        </a>
                    </li>
                    <li>
                        <a href="">
                            <dl>
                                <dt>Account 1</dt>
                                <dd class="price"><span>0.00 </span>INT</dd>
                                <dd class="address">0x464f07B20C2fe737...</dd>
                            </dl>
                        </a>
                    </li>
                    <li>
                        <a href="">
                            <dl>
                                <dt>Account 1</dt>
                                <dd class="price"><span>0.00 </span>INT</dd>
                                <dd class="address">0x464f07B20C2fe737...</dd>
                            </dl>
                        </a>
                    </li>
                    <li>
                        <a href="">
                            <dl>
                                <dt>Account 1</dt>
                                <dd class="price"><span>0.00 </span>INT</dd>
                                <dd class="address">0x464f07B20C2fe737...</dd>
                            </dl>
                        </a>
                    </li>
                    <li>
                        <a href="">
                            <dl>
                                <dt>Account 1</dt>
                                <dd class="price"><span>0.00 </span>INT</dd>
                                <dd class="address">0x464f07B20C2fe737...</dd>
                            </dl>
                        </a>
                    </li>
                </ul>
            </el-row>
            <el-row>
                <el-button type="primary" @click="addAccount">Add Account</el-button>
            </el-row>
        </div>
    </div>
</template>

<script>
  import Intjs from 'intjs';
  // import { ipcRenderer } from 'electron';
  import fs from 'fs';
  export default {
    name: 'wallets',
    data() {
      return {

      };
    },
    components: {

    },
    methods: {
      /* eslint-disable */
      init () {
        // let keyStorePath = `${__dirname}/data/keystore/`;
        // let keyStores = fs.readFileSync(keyStorePath);
        // console.log(keyStores);
      },
      addAccount() {
        this.$prompt('请输入密码', '创建帐户', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /[\w]{9,}/,
          inputErrorMessage: '密码格式不正确',
        }).then(({ value }) => {
          this.$message({
            type: 'success',
            message: ' 创建成功 ',
          });
          this.createWallet(value);
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '取消输入',
          });
        });
      },
      async createWallet(password) {
        let intjs = new Intjs('localhost', 18089);
        let account = await intjs.create();
        let data = await intjs.encrypt(account.secret, password);

        data.address = account.address;

        let fileName = data.address + '.json';
        let fileData = JSON.stringify(data);
        let rootDir = process.cwd();

        fs.writeFileSync(`${rootDir}/data/keystore/` + fileName, fileData);

        // let blob = new Blob([JSON.stringify(data)], {type: 'application/octet-stream'});
        // let url = URL.createObjectURL(blob);
        // console.log(url);
        // let aLink = document.createElement('a');
        // let evt = document.createEvent('HTMLEvents');

        // evt.initEvent("click", false, false);

        // aLink.download = fileName;
        // aLink.href = url;
        // console.log(aLink);
        // aLink.dispatchEvent(evt);

        // let savePath = `${__dirname}/data/keystore/`;
        // console.log(savePath);
        // ipcRenderer.send('download', url + "+" + savePath);
      },
    },
    computed: {

    },
    mounted() {
        this.init();
    },
  };
</script>

<style scoped lang="scss">
    .wallets {
        padding: 20px 40px;
    }
    .title {
        font-weight: 500;
        margin-bottom: 10px;
    }
    .content {
        margin-bottom: 10px;
        p {
            margin: 20px 0;
            font-size: 12px;
        }
        .account-list {
            list-style: none;
            li {
                float: left;
                a {
                    text-decoration: none;
                    color: #333;
                    dl {
                        margin-right: 10px;
                        margin-bottom: 20px;
                    }
                    dd {
                        margin-top: 5px;
                        color: #969696;
                    }
                }
            }
            .price {
                span {
                    font-size: 12px;
                }
            }
            .address {
                font-size: 12px;
            }

        }
    }
</style>