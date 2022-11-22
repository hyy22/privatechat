import { defineStore } from 'pinia';

// 最大重试次数
const MAX_RETRY_TIMES = 10;
// 剩余重试次数
let retryTimes = MAX_RETRY_TIMES;
export const useWsStore = defineStore('ws', {
  state: () => {
    return {
      ws: null,
    };
  },
  actions: {
    initWs({ url, onMessage, onConnect, onDisconnect }) {
      let socket = new WebSocket(url);
      // Connection opened
      socket.addEventListener('open', async () => {
        // 重置次数
        retryTimes = MAX_RETRY_TIMES;
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
        if (retryTimes > 0) {
          console.warn('websocket重连中...');
          retryTimes--;
          setTimeout(this.initWs, 1000);
        } else {
          console.error('重连失败，websocket已断开！');
          onDisconnect && onDisconnect();
        }
      });
      this.ws = socket;
    },
    removeWs() {
      this.ws.close();
      this.ws = null;
    },
  },
});
