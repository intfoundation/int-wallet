<template>
    <div id="wrapper">
        <el-row>
            <el-col :span="24" class="header">
                <el-menu :default-active="activeIndex" class="el-menu-nav" mode="horizontal" @select="">
                    <el-menu-item index="1" @click="walletInfor">Wallets</el-menu-item>
                    <el-menu-item index="2" @click="sendTx">Send</el-menu-item>
                    <el-menu-item index="3" @click="mortgage">Mortgage</el-menu-item>
                    <el-menu-item index="4" @click="unmortgage">Unmortgage</el-menu-item>
                    <el-menu-item index="5" @click="vote">Vote</el-menu-item>
                </el-menu>
            </el-col>
        </el-row>
        <el-row>
            <el-col :span="24" class="main">
                <transition name="el-fade-in-linear">
                    <router-view></router-view>
                </transition>
            </el-col>
        </el-row>
    </div>
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
  #wrapper {
      width: 100vw;
      height: 100vh;
      min-width: 800px;
      min-height: 400px;
      /*padding: 30px 40px;*/
      .el-menu-item:first-child {
          margin-left: 40px;
      }
  }
</style>