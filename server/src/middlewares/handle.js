import jwt from 'jsonwebtoken';
import { accessLogger } from '../logger.js';

export default async (ctx, next) => {
  const accessTime = Date.now();
  // 解析token并设置userId
  handleToken(ctx);
  try {
    await next();
    // 返回参数包装
    ctx.body = ctx.body || {
      code: ctx.state.code || 0,
      data: ctx.state.data || null,
      message: 'ok',
      newToken: ctx.state.newToken || '',
    };
  } catch (e) {
    // 错误日志
    ctx.logger.error(e);
    let { message, expose, code } = e || {};
    // 错误处理，只暴露用户级别的错误
    ctx.status = 200;
    ctx.body = {
      code: code || -100,
      data: null,
      message: expose ? message || e.toString() : 'unknown_error',
      newToken: ctx.state.newToken || '',
    };
  }
  // 访问日志
  process.nextTick(() => {
    const { ip, url, method, header, query, body } = ctx.request;
    const loggerData = {
      ip,
      method,
      url,
      data: method === 'GET' ? query : body,
      access_time: accessTime,
      user_id: ctx.token && ctx.token.userId || 0,
      user_agent: header['user-agent'] || '',
      code: ctx.body.code,
      cost: Date.now() - accessTime,
    };
    accessLogger.info(JSON.stringify(loggerData));
  });
};

/**
 * 处理token，不做校验，只做解析和续签
 * @param {Object} ctx context
 */
function handleToken(ctx) {
  const { authorization } = ctx.header;
  const { secret, exp: expTime } = ctx.config.auth;
  try {
    const { exp } = ctx.token = jwt.verify(authorization.split(' ')[1], secret);
    const now = Date.now();
    if (exp > now && exp - now < expTime / 2) {
      ctx.state.newToken = jwt.sign({
        ...ctx.token,
        exp: now + expTime,
      }, secret);
    } else if (now > exp) {
      // token过期
      ctx.token = null;
    }
  } catch (e) {
    // token解析失败
    ctx.token = null;
  }
}
