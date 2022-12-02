import { defineStore } from 'pinia';

export const useStatusStore = defineStore('status', {
  state: () => {
    return {
      // 是否有未读聊天消息
      hasUnreadChatMsg: false,
      // 是否有系统消息
      hasNewSystemNotify: false,
    };
  },
});
