import { DataTypes, Op } from 'sequelize';
import { helper } from '../utils.js';

export default async function(sequelize) {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    fromUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    toUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hasReceived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    updatedAt: false,
  });
  await Message.sync();

  // 生成消息记录
  function createMessage({ fromUserId, toUserId, type, content }) {
    return Message.create({
      fromUserId,
      toUserId,
      type,
      content: helper.isType(content, 'object') ? JSON.stringify(content) : content,
    }, { raw: true });
  }
  // 查询未接收过的消息
  function findUnReceivedMessages(userId) {
    return Message.findAll({
      attributes: {
        exclude: ['hasReceived', 'updatedAt'],
      },
      where: {
        toUserId: userId,
        hasReceived: false,
      },
      raw: true,
    });
  }
  // 接收回执
  function updateReceiveStatus(messageIds = []) {
    Message.update({ hasReceived: true }, {
      where: {
        id: {
          [Op.in]: messageIds,
        },
      }
    });
  }
  // 删除已收消息
  function removeReceivedMessages() {
    Message.destroy({
      where: {
        hasReceived: true,
      }
    });
  }

  return {
    createMessage,
    findUnReceivedMessages,
    updateReceiveStatus,
    removeReceivedMessages,
  };
}