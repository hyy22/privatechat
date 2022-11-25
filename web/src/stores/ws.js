import { defineStore } from 'pinia';

// 最大重试次数
const MAX_RETRY_TIMES = 10;
// 剩余重试次数
let retryTimes = MAX_RETRY_TIMES;
// 是否自动重连
let autoReconnect = true;
export const useWsStore = defineStore('ws', {
  state: () => {
    return {
      ws: null,
    };
  },
  actions: {
    initWs(options) {
      const { url, onMessage, onConnect, onDisconnect } = options;
      let socket = new WebSocket(url);
      // Connection opened
      socket.addEventListener('open', async () => {
        // 重置
        retryTimes = MAX_RETRY_TIMES;
        autoReconnect = true;
        onConnect && onConnect();
      });
      // Listen for messages
      socket.addEventListener('message', async (e) => {
        let msg = {};
        try {
          msg = JSON.parse(e.data);
          onMessage && onMessage(msg);
        } catch (e) {
          return;
        }
      });
      // reconnect
      socket.addEventListener('close', () => {
        if (autoReconnect && retryTimes > 0) {
          console.warn('websocket重连中...');
          retryTimes--;
          setTimeout(this.initWs(options), 3000);
        } else {
          console.error('websocket已断开！');
          onDisconnect && onDisconnect();
        }
      });
      this.ws = socket;
    },
    removeWs() {
      if (!this.ws) return;
      autoReconnect = false;
      this.ws.close();
      this.ws = null;
    },
  },
});
