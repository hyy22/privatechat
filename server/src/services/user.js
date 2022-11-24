import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// 登录
export async function login(ctx) {
  const schema = Joi.object({
    userName: Joi.string().min(2).max(10).required(),
    password: Joi.string().required(),
  });
  const { error } = schema.validate(ctx.request.body, { allowUnknown: true });
  if (error) {
    ctx.throwError(error);
    return;
  }
  const { userName, password } = ctx.request.body;
  const user = await ctx.db.User.findOneUser(userName, password);
  if (!user) {
    ctx.throwError(new Error('账号或者密码错误'));
    return;
  }
  const token = jwt.sign({ userId: user.id, userName: user.userName, uuid: uuidv4() }, ctx.config.auth.secret);
  ctx.state.data = token;
}

// 注册
export async function register(ctx) {
  const schema = Joi.object({
    userName: Joi.string().min(2).max(10).required(),
    password: Joi.string().required(),
    avatar: Joi.string(),
    signature: Joi.string().empty('').max(200), // ???字符串默认都是必填，如果更改需要添加empty('')
    publicKey: Joi.string().required(),
  });
  const { error } = schema.validate(ctx.request.body, { allowUnknown: true });
  if (error) {
    ctx.throwError(error);
    return;
  }
  const { userName, password, avatar, signature, publicKey } = ctx.request.body;
  // 入库
  try {
    const result = await ctx.db.User.addUser({ userName, password, avatar, signature, publicKey });
    ctx.state.data = result.id;
  } catch (e) {
    ctx.throwError(e);
  }
}

// 获取用户信息
export async function getUserInfo(ctx) {
  const { userId } = ctx.request.body;
  const user = await ctx.db.User.findByUserId(userId || ctx.token.userId);
  ctx.state.data = user;
}

// 同步公钥
export async function syncPublicKey(ctx) {
  const { publicKey } = ctx.request.body;
  await ctx.db.User.updateByUserId(ctx.token.userId, {
    publicKey,
  });
  ctx.state.data = true;
}