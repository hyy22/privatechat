import { defineStore } from 'pinia';
import { initDB } from '@/utils/indexdb.js';

export const useDbStore = defineStore('db', {
  state: () => {
    return {
      db: null,
    };
  },
  actions: {
    async openDB() {
      this.db = await initDB(...arguments);
    },
  },
});
