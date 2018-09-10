<template>
  <div id="app">
    <transition name="el-fade-in-linear">
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>
  export default {
    name: 'int-wallet',
  };
</script>

<style lang="scss">
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
</style>
