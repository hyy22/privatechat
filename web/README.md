# WEB

## 项目结构

```
web/src
├── App.vue 入口vue
├── assets 静态资源
├── components 公共组件
│   ├── FootBar.vue 底部菜单
│   ├── Header.vue 头部导航
│   ├── friends
│   │   └── FriendItem.vue 好友item
│   └── messages
│       └── MessageItem.vue 消息item
├── composations
│   ├── useMessage.js 处理消息方法集合
│   └── useRecent.js 处理会话方法集合
├── config.js 配置文件
├── main.js 入口文件
├── router
│   └── index.js 路由
├── stores
│   ├── db.js 全局化indexedDB
│   ├── rsa.js 公钥私钥等状态和修改方法
│   ├── user.js token和用户信息等状态和修改方法
│   └── ws.js 全局websocket引用和方法
├── styles
│   └── common.scss 公共样式
├── utils
│   ├── cache.js localstorage封装
│   ├── crypto.js 加解密相关方法
│   ├── eventBus.js 消息订阅
│   ├── index.js 公共方法
│   ├── indexdb.js indexedDb使用封装
│   ├── init.js 初始化脚本
│   ├── intersectionObserver.js 可见性观察
│   ├── message.js 消息相关公共方法
│   ├── request.js fetch请求方法封装
│   └── worker.js 新线程处理加解密
└── views
    ├── Chat.vue 聊天页
    ├── Home.vue 会话页
    ├── Login.vue 登录页
    ├── Me.vue 我的页
    └── Register.vue 注册页
```
