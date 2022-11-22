export default async (ctx, next) => {
  if (!ctx.token) {
    ctx.throwError(new Error('token validate fail'), ctx.errorCode.USER_TOKEN_ERROR);
    return;
  }
  await next();
};