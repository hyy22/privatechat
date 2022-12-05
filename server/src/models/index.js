import { Sequelize } from 'sequelize';
import initUserModel from './user.js';
import initFriendModel from './friend.js';
import initMessageModel from './message.js';
import initChannelModel from './channel.js';

export default async function(config) {
  const sequelize = new Sequelize(config.name, config.user, config.password, {
    host: config.host,
    port: config.port,
    dialect: 'mysql'
  });
  // 用户表
  const User = await initUserModel(sequelize);
  // 好友表
  const Friend = await initFriendModel(sequelize);
  // 消息表
  const Message = await initMessageModel(sequelize);
  // 渠道表
  const Channel = await initChannelModel(sequelize);
  return {
    User,
    Friend,
    Message,
    Channel,
  };
}