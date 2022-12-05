import { DataTypes } from 'sequelize';

export default async function(sequelize) {
  const Channel = sequelize.define('Channel', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'userId_type', // 复合唯一键
    },
    // 渠道类型
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'userId_type', // 复合唯一键
    },
    // 具体内容json
    content: {
      type: DataTypes.TEXT('medium'),
      allowNull: false,
    },
    // 是否开启通知渠道
    open: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    sequelize,
    tableName: 'channels'
  });
  await Channel.sync();

  // 查找用户的通知渠道列表
  function findChannelsByUserId(userId, open) {
    const condition = { userId };
    if (typeof open !== 'undefined') {
      condition.open = open;
    }
    return Channel.findAll({
      where: condition,
      raw: true,
    });
  }

  // 添加渠道
  function createChannel({ userId, type, content, open = true }) {
    return Channel.create({ userId, type, content, open });
  }
  
  // 更新渠道信息
  function updateChannel({ id, content, open }) {
    return Channel.update({ content, open }, {
      where: {
        id,
      }
    });
  }

  // 删除渠道
  function removeChannel(id) {
    return Channel.destroy({
      where: {
        id,
      }
    });
  }

  return {
    findChannelsByUserId,
    createChannel,
    updateChannel,
    removeChannel,
  };
}