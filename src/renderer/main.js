import Vue from 'vue';
import axios from 'axios';
import VueClipboard from 'vue-clipboard2';

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';


import App from './App';
import router from './router';
import store from './store';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

Vue.use(ElementUI, { size: 'small', zIndex: 3000 });
Vue.use(VueClipboard);

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
  // render: h => h(App),
}).$mount('#app');
