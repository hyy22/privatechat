import Joi from 'joi';

// 补全消息用户信息
async function completeMessageUserInfo(ctx, messageRows = []) {
  if (!messageRows.length) return [];
  const userIds = messageRows.reduce((prev, cur) => {
    const { fromUserId, toUserId } = cur;
    if (fromUserId !== 0) prev.add(fromUserId);
    if (toUserId !== 0) prev.add(toUserId);
    return prev;
  }, new Set());
  const users = await ctx.db.User.findManyUsersByIds([...userIds]);
  const userMap = users.reduce((prev, cur) => {
    prev.set(cur.id, cur);
    return prev;
  }, new Map());
  userMap.set(0, {
    id: 0,
    userName: 'system',
    avatar: '',
    signature: '',
    publicKey: '',
  });
  return messageRows.map(v => {
    return {
      ...v,
      fromUser: userMap.get(v.fromUserId),
      toUser: userMap.get(v.toUserId),
    };
  });
}

// 获取新消息列表
export async function getNewMessageList(ctx) {
  const messageRows = await ctx.db.Message.findUnReceivedMessages(ctx.token.userId);
  ctx.state.data = await completeMessageUserInfo(ctx, messageRows);
}

// 发送消息
export async function sendMessage(ctx) {
  const schema = Joi.object({
    toUserId: Joi.number().required(),
    type: Joi.string().required(),
    content: Joi.string().empty(''),
  });
  const { error } = schema.validate(ctx.request.body, { allowUnknown: true });
  if (error) {
    ctx.throwError(error);
    return;
  }
  const { toUserId, type, content } = ctx.request.body;
  const { userId } = ctx.token;
  // 自己不能发给自己
  if (userId === toUserId) {
    ctx.throwError(new Error('无法向自己发消息'), ctx.errorCode.APP_ILLEGAL_CHAT);
    return;
  }
  // 除了addFriend和agreeFriend，其他类型消息都要判断是否为对方好友才能发送
  if (type === 'ADD_FRIEND') {
    await handleAddFriend(ctx, toUserId);
  } else if (type === 'AGREE_FRIEND') {
    await handleAgreeFriend(ctx, toUserId);
  } else {
    const friendRow = await ctx.db.Friend.findFriendRow(toUserId, userId, { pass: true });
    if (!friendRow) {
      ctx.throwError(new Error('对方不是你的好友，无法发送消息'), ctx.errorCode.APP_ILLEGAL_CHAT);
      return;
    }
  }
  // 构造消息对象
  const messageObject = {
    fromUserId: userId,
    toUserId,
    type,
    content
  };
  // 数据库存一份加密数据，并通过每天定时任务清理
  const message = (await ctx.db.Message.createMessage(messageObject)).toJSON();
  delete message.hasReceived;
  // 通过ws通道发送实时消息
  const [messageWithUserInfo] = await completeMessageUserInfo(ctx, [message]);
  // console.log('messageWithUserInfo', messageWithUserInfo);
  ctx.sendMessageByUserId(toUserId, messageWithUserInfo);
  ctx.state.data = message;
  // 如果有三方渠道，推送通知
  process.nextTick(async () => {
    const channels = await ctx.db.Channel.findChannelsByUserId(toUserId, true);
    channels.forEach(async v => {
      let content;
      try {
        content = JSON.parse(v.content);
      } catch (e) {
        ctx.logger.error(`channel id ${v.id} content parse fail`);
        return;
      }
      switch(v.type) {
      case 'DINGTALK': {
        // 钉钉
        const messageTypeMap = {
          'TEXT': '你收到一条消息',
          'IMAGE': '你收到一条图片消息',
          'ADD_FRIEND': '你收到一个好友请求',
        };
        const response = await ctx.fetch(content.url, {
          method: 'post',
          body: JSON.stringify({
            msgtype: 'text',
            text: {
              content: `${content.keyword}-${messageTypeMap[message.type]}`,
            }
          }),
          headers: {'Content-Type': 'application/json'}
        });
        const data = await response.json();
        ctx.logger.info(`channel id ${v.id} push result: ${JSON.stringify(data)}`);
        break;
      }
      }
    });
  });
}

// 消息已接收回执
export async function reportReceiveMessage(ctx) {
  const { messageIds = [] } = ctx.request.body;
  if (!messageIds.length || messageIds.some(v => !/^\d+$/.test(v))) {
    ctx.throwError(new Error('参数错误'));
    return;
  }
  await ctx.db.Message.updateReceiveStatus(messageIds);
}

// 发送添加好友请求
async function handleAddFriend(ctx, to) {
  // 判断用户是否存在
  const user = await ctx.db.User.findByUserId(to);
  if (!user) {
    ctx.throwError(new Error(`不存在id为${to}的用户`));
    return;
  }
  // 是否已经是好友
  const friendRow = await ctx.db.Friend.findFriendRow(ctx.token.userId, to, { pass: true });
  if (friendRow) {
    ctx.throwError(new Error('ta已经是好友了！'));
    return;
  }
  return ctx.db.Friend.addFriendRelation(ctx.token.userId, to);
}

// 同意好友请求
async function handleAgreeFriend(ctx, to) {
  const row = await ctx.db.Friend.findFriendRow(to, ctx.token.userId);
  if (!row) {
    ctx.throwError(new Error('消息已过期'));
    return;
  }
  return ctx.db.Friend.agreeFriendRelation(ctx.token.userId, to);
}