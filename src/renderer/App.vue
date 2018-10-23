<template>
  <div id="app">
    <transition name="el-fade-in-linear">
      <router-view></router-view>
      <!--这是项目中第一个<router-view>，它对应最外层的路由-->
    </transition>
  </div>
</template>

<script>
  export default {
    name: 'int-wallet',
  };
</script>

<style lang="scss">
  @import './style/common';
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: system, -apple-system, ".SFNSDisplay-Regular", "Helvetica Neue", Helvetica, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #333;
  }
  .el-message-box {
    width: 280px;
  }
  #app {
    min-width: 1200px;
  }
</style>
