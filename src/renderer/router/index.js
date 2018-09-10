import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      // name: 'wallet-account',
      // component: require('@/components/WalletAccount/WalletAccount').default,
      redirect: '/wallet-account',
    },
    {
      path: '/wallet-account',
      name: 'wallet-account',
      component: require('@/components/WalletAccount/WalletAccount').default,
      children: [
        {
          path: '/wallets',
          name: 'wallets',
          component: require('@/components/WalletAccount/Wallets').default,
        },
        {
          path: '/send',
          name: 'send',
          component: require('@/components/WalletAccount/Send').default,
        },
      ],
      redirect: '/wallets',
    },
    // {
    //   path: '*',
    //   redirect: '/',
    // },
  ],
});
