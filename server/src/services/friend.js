import Joi from 'joi';

// 获取好友列表
export async function getFriendList(ctx) {
  ctx.state.data = await ctx.db.Friend.findFriendsByUserId(ctx.token.userId);
}

// 移除好友
export async function removeFriend(ctx) {
  const { targetUserId } = ctx.request.body;
  const { error } = Joi.number().validate(targetUserId);
  if (error) {
    ctx.throwError(error);
    return;
  }
  await ctx.db.Friend.removeFriendRelation(ctx.token.userId, targetUserId);
  ctx.state.data = true;
}

// 拒绝好友请求
export async function rejectFriend(ctx) {
  const { targetUserId } = ctx.request.body;
  const { error } = Joi.number().validate(targetUserId);
  if (error) {
    ctx.throwError(error);
    return;
  }
  // 只有在pass: false时可以删除
  const friendRow = await ctx.db.Friend.findFriendRow(targetUserId, ctx.token.userId);
  if (friendRow && !friendRow.pass) {
    await ctx.db.Friend.removeFriendRelation(targetUserId, ctx.token.userId);
    ctx.state.data = true;
  } else {
    ctx.state.data = false;
  }
}