import { defineStore } from 'pinia';
import cache from '@/utils/cache';

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      token: cache().get('tk') || '',
      userInfo: null,
    };
  },
  actions: {
    setToken(val) {
      this.token = val;
      cache().set('tk', val);
    },
    removeToken() {
      this.token = '';
      this.userInfo = null;
      cache().remove('tk');
    },
    setUserInfo(val) {
      this.userInfo = val;
    },
  },
});
