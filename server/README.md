# SERVER

## 项目结构

```
server/src
├── app.js koa处理请求响应
├── config.js 配置文件
├── errorCode.js 错误码枚举
├── logger.js 日志公共方法
├── middlewares 中间件
│   ├── auth.js 权限检查
│   └── handle.js 响应请求响应的外层模型
├── models 数据库相关
│   ├── friend.js 好友db
│   ├── index.js 初始化db
│   ├── message.js 消息db
│   └── user.js 用户db
├── router.js 路由
├── server.js 入口
├── services 服务相关
│   ├── friend.js 好友服务
│   ├── message.js 消息服务
│   ├── upload.js 上传服务
│   └── user.js 用户服务
├── tasks 任务
│   └── clean_msg_daily.js 每日清理已收消息脚本
├── utils.js 公共方法
└── websocket.js websocket公共方法
```

### 服务启动`server.js`

1. 开启http服务
2. 升级websocket服务、身份验证
3. 初始化数据库
4. 初始化任务
5. 扩展ctx

### http请求处理`app.js`

1. 跨域中间件
2. 静态文件服务中间件
3. body解析中间件
4. 外层处理中间件 token解析、token续签、日志记录、统一返回值格式
5. 路由挂载


## 接口文档

统一使用`post`方式请求，除上传接口外`content-type`统一使用`application/json`

### 通用

**上传文件**

```
url /upload
needLogin false
```

### 用户

**注册**

```
url /register
data { userName: String, password: String, avatar: String, signature?: String, publicKey: String }
needLogin false
```

**登录**

```
url /login
data { userName: String, password: String }
needLogin false
```

**获取用户信息**

```
url /get_user_info
data { userId?: Number }
needLogin true
```

**公钥同步**

```
url /sync_public_key
data { publicKey: String }
needLogin true
```

### 好友

**获取好友列表**

```
url /get_friend_list
data {}
needLogin true
```

**删除好友**

```
url /remove_friend
data { targetUserId: Number }
needLogin true
```

**拒绝好友请求**

```
url /reject_friend
data { targetUserId: Number }
needLogin true
```

**发送好友请求**

content为客户端解密后的内容，结构为{ note: '发送了好友请求' }

```
url /send_message
data { toUserId: Number, type: 'ADD_FRIEND', content: String }
needLogin true
```

**同意好友请求**

content为客户端解密后的内容，结构为{ note: '同意了好友请求' }

```
url /send_message
data { toUserId: Number, type: 'AGREE_FRIEND', content: String }
needLogin true
```

### 消息

**获取未接收到消息列表**

```
url /get_message_list
data {}
needLogin true
```

**发送文本消息**

content为客户端解密后的内容，结构为{ text: '123' }

```
url /send_message
data { toUserId: Number, type: 'TEXT', content: String }
needLogin true
```

**发送图片消息**

content为客户端解密后的内容，结构为{ data: '图片dataurl' }

```
url /send_message
data { toUserId: Number, type: 'IMAGE', content: String }
needLogin true
```

**接收回执**

```
url /report_receive_message
data { messageIds: Number[] }
needLogin true
```

## 返回结构

```
{
  id: 1,
  fromUser: {},
  toUser: {},
  createdAt: '',
  type: 'TEXT',
  content: '加密内容'
}
```

## 错误码

-10x 应用级别错误

-40x 权限级别错误

## 发送消息流程

1. 通过/send_message发送消息
2. 判断对方是否是好友，不是好友会拦截（添加、同意好友除外）
3. 服务端保存消息对象（加密后的），并通过websocket转发给在线用户，保存的消息会在收到接收回执后通过定时任务清除。不在线的用户通过/get_message_list获取未接收的消息列表

