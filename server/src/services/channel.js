import Joi from 'joi';

// 获取渠道列表
export async function getChannelList(ctx) {
  const channels = await ctx.db.Channel.findChannelsByUserId(ctx.token.userId);
  ctx.state.data = channels.map(v => {
    return {
      ...v,
      open: v.open === 1,
    };
  });
}

// 新增或修改渠道
export async function createOrUpdateChannel(ctx) {
  const schema = Joi.object({
    id: Joi.number(),
    type: Joi.string().required(),
    content: Joi.string().required(),
    open: Joi.boolean(),
  });
  const { error } = schema.validate(ctx.request.body, { allowUnknown: true });
  if (error) {
    ctx.throwError(error);
    return;
  }
  const { id, type, content, open } = ctx.request.body;
  if (id > 0) {
    await ctx.db.Channel.updateChannel({ id, userId: ctx.token.userId, type, content, open });
    ctx.state.data = id;
  } else {
    const row = await ctx.db.Channel.createChannel({ userId: ctx.token.userId, type, content, open });
    ctx.state.data = row.id;
  }
}

// 删除渠道
export async function removeChannelById(ctx) {
  const { id } = ctx.request.body;
  const { error } = Joi.number().validate(id);
  if (error) {
    ctx.throwError(error);
    return;
  }
  await ctx.db.Channel.removeChannel(id);
  ctx.state.data = true;
}