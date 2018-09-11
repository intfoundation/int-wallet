<template>
    <div class="send">
        <h3 class="title">Send</h3>
        <el-form :label-position="labelPosition" label-width="80px" :model="formLabelAlign">
            <el-form-item label="FROM">
                <el-select v-model="formLabelAlign.from" placeholder="">
                    <el-option label="Account1" value="1B9fwBTCazecwsPjkUroHW9jbJTUZYehLV" :selected="isSelected"></el-option>
                    <el-option label="Account2" value="1B9fwBTCazecwsPjkUroHW9jbJTUZYehLV"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="TO">
                <el-input v-model="formLabelAlign.to"></el-input>
            </el-form-item>
            <el-form-item label="AMOUNT">
                <el-input v-model="formLabelAlign.amount"></el-input>
            </el-form-item>
            <el-form-item label="INT">
                <el-input v-model="formLabelAlign.int"></el-input>
            </el-form-item>
            <template>
                <!-- `checked` 为 true 或 false -->
                <el-checkbox v-model="checked">Send everything</el-checkbox>
            </template>
        </el-form>
        <el-row>
            <el-col :span="8" class="fee">
                <span class="title">SELECT FEE</span>
                <p><b>10.00</b> INT</p>
                <el-slider v-model="fee"></el-slider>
            </el-col>
        </el-row>
        <el-row>
            <el-col :span="8" class="total">
                <span class="title">TOTAL</span>
                <p><b>10.00</b> INT</p>
            </el-col>
        </el-row>
        <hr>
        <el-row>
            <el-col :span="4">
                <el-button type="primary">SEND</el-button>
            </el-col>
        </el-row>
    </div>
</template>

<script>
  export default {
    name: 'send',
    data() {
      return {
        checked: true,
        isSelected: true,
        labelPosition: 'top',
        formLabelAlign: {
          from: '',
          to: '',
          amount: '',
          int: '',
        },
        fee: 20,
      };
    },
    components: {

    },
    methods: {
      /* eslint-disable */
    },
    computed: {

    },
    mounted() {

    },
  };
</script>

<style scoped lang="scss">
    .send {
        padding: 20px 40px;
        .el-form {
            margin-top: 50px;
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
            margin: 50px 0;
            .title {
                display: inline-block;
                font-weight: 500;
                margin-bottom: 20px;
            }
            .fee {

            }
        }
    }
</style>