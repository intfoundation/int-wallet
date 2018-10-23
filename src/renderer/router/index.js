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
      component: require('@/components/WalletAccount/Layout').default,
      children: [
        {
          path: '/wallets',
          name: 'wallets',
          component: require('@/components/WalletAccount/Wallets').default,
        },
        {
          path: '/accounts/detail',
          name: 'AccountsDetail',
          component: require('@/components/WalletAccount/AccountsDetail').default,
        },
        {
          path: '/send',
          name: 'send',
          component: require('@/components/WalletAccount/Send').default,
        },
        {
          path: '/mortgage',
          name: 'mortgage',
          component: require('@/components/WalletAccount/Mortgage').default,
        },
        {
          path: '/unmortgage',
          name: 'unmortgage',
          component: require('@/components/WalletAccount/Unmortgage').default,
        },
        {
          path: '/vote',
          name: 'vote',
          component: require('@/components/WalletAccount/Vote').default,
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
