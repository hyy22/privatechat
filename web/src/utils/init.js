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
  // 更新网页标题
  document.title = config.PROJECT_NAME;
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
    const { publicKey } = userStore.userInfo;
    let errorMsg;
    if (!rsaStore.privateKey) {
      errorMsg = '私钥读取失败，请选择导入或重新生成';
    } else if (rsaStore.publicKey !== publicKey) {
      errorMsg = '公钥不一致会导致解密失败，请选择导入私钥或重新生成';
    }
    if (errorMsg) {
      try {
        await Dialog({
          title: '秘钥错误？',
          message: errorMsg,
          showCancelButton: true,
          confirmButtonText: '导入私钥',
          cancelButtonText: '重新生成秘钥',
        });
        try {
          const { publicKey, privateKey } = await importPrivateKey();
          rsaStore.updateRsaKeys(publicKey, privateKey);
          await syncPublicKey(publicKey);
          rsaStore.publicKey = publicKey;
        } catch (e) {
          console.error(`rsa import fail: `, e.message);
        }
      } catch (e) {
        rsaStore.updateRsaKeys();
        await syncPublicKey(rsaStore.publicKey);
        rsaStore.publicKey = publicKey;
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
        // 如果是踢出需要跳转登录页
        if (msg.type === 'KICKED_OUT') {
          wsStore.removeWs();
          userStore.removeToken();
          router.push('/login');
          Toast('当前账号已在其他设备上登录，当前设备已下线');
          return;
        }
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
  function initIndexedDb(userId) {
    return dbStore.openDB(
      `PRIVATE_CHAT_${userId}`,
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
  }

  // 白名单页面
  const whiteList = ['/login', '/register', '/not_found'];
  // 无法使用beforeEach，需要再use(router)之前调用
  router.beforeResolve(async (to, from, next) => {
    if (whiteList.includes(to.path)) {
      next();
    } else {
      if (userStore.token) {
        // 获取个人信息
        await getUserInfo();
        // 秘钥检测
        await checkRsaKeys();
        // 初始化数据库
        await initIndexedDb(userStore.userInfo.id);
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
