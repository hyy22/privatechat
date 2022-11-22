## 请求结构

```
{
  to: 123,
  type: 'ADD_FRIEND',
  content: '加密内容'
}
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

## 消息类型

### TEXT

普通文本消息

```
{
  text: '你好'
}
```

### IMAGE

普通图片消息

```
{
  data: '12345sdsadas'
}
```

### ADD_FRIEND

添加好友

```
{
  note: '添加好友说明'
}
```

### AGREE_FRIEND

同意好友请求

```
{
  note: '我同意了'
}
```

### UPDATE_INFO

修改个人信息

```
{
  userName: '昵称',
  avatar: '头像url',
  signature: '个性签名',
  publicKey: '公钥'
}
```

### REVOKE

撤回消息

```
{
  messageId: 消息id
}
```

### KICKED_OUT

强制下线

```
{
  reason: '下线原因'
}
```