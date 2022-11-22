import { Dialog, Toast } from 'vant';
import { useUserStore } from '../stores/user';
import { useRsaStore } from '../stores/rsa';
import { useWsStore } from '../stores/ws';
import { useDbStore } from '../stores/db';
import router from '../router';
import request from './request';
import { importPrivateKey, syncPublicKey } from '../utils/crypto';
import config from '../config';
import { receiveMessages } from '../utils/message';
import eventBus from './eventBus';

export default async function init() {
  const userStore = useUserStore();
  const rsaStore = useRsaStore();
  const wsStore = useWsStore();
  const dbStore = useDbStore();
  // 获取个人信息
  async function getUserInfo() {
    if (userStore.userInfo) return;
    const result = await request({
      url: '/get_user_info',
      data: {},
    });
    if (result.code === 0) {
      userStore.setUserInfo(result.data);
    }
  }
  // 检测证书
  async function checkRsaKeys() {
    if (!rsaStore.privateKey) {
      try {
        await Dialog({
          title: '秘钥遗失？',
          message: '秘钥加载失败，请选择导入或者重新生成',
          showCancelButton: true,
          confirmButtonText: '导入私钥',
          cancelButtonText: '重新生成秘钥',
        });
        try {
          const { publicKey, privateKey } = await importPrivateKey();
          rsaStore.updateRsaKeys(publicKey, privateKey);
          await syncPublicKey(publicKey);
        } catch (e) {
          console.error(`rsa import fail: `, e.message);
        }
      } catch (e) {
        rsaStore.updateRsaKeys();
        await syncPublicKey(rsaStore.publicKey);
      }
    }
  }
  // 获取新消息
  async function getNewMessageList() {
    const result = await request({
      url: '/get_message_list',
      data: {},
    });
    if (result.code === 0 && result.data.length) {
      return receiveMessages(result.data);
    }
    return [];
  }
  // 初始化im
  function initIM(tk) {
    if (wsStore.ws) return;
    wsStore.initWs({
      url: `${config.WS_BASE_URL}?tk=${tk}`,
      // 重连成功检测是否有新消息
      onConnect: async () => {
        const msgs = await getNewMessageList();
        if (msgs.length) {
          eventBus.emit('message', msgs);
        }
        console.log('websocket connected!');
      },
      // 接收到新消息
      onMessage: async (msg) => {
        const msgs = await receiveMessages([msg]);
        eventBus.emit('message', msgs);
        console.log('received a new message', msg);
      },
      // ws连接已断开
      onDisconnect: () => {
        eventBus.emit('disconnect');
        Toast('连接已断开，请刷新重试~');
        console.error('websocket is disconnected!');
      },
    });
  }

  // 初始化数据库
  await dbStore.openDB(
    [
      {
        storeName: 'messages',
        keyPath: 'id',
        indexes: [
          {
            name: 'chatWithUserId',
            key: 'chatWithUserId',
            options: { unique: false },
          },
          {
            name: 'type',
            key: 'type',
            options: { unique: false },
          },
        ],
      },
      {
        storeName: 'recents',
        keyPath: 'friendId',
      },
    ],
    1
  );

  // 白名单页面
  const whiteList = ['/login', '/register', '/not_found'];
  // 无法使用beforeEach，需要再use(router)之前调用
  router.beforeResolve(async (to, from, next) => {
    if (whiteList.includes(to.path)) {
      next();
    } else {
      if (userStore.token) {
        // 秘钥检测
        await checkRsaKeys();
        // 获取个人信息
        getUserInfo();
        // 初始化im
        initIM(userStore.token);
        next();
      } else {
        // 未登录
        userStore.setUserInfo(null);
        wsStore.removeWs();
        next({ path: '/login', query: { redirect: to.path } });
      }
    }
  });
  router.onError((e) => {
    console.error(`router fail:`, e.message);
  });
}
