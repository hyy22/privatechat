import { DataTypes } from 'sequelize';
import { helper } from '../utils.js';

export default async function(sequelize) {
  const Friend = sequelize.define('Friend', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'relation', // 复合唯一键
    },
    friendUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'relation', // 复合唯一键
    },
    pass: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    tableName: 'friends'
  });
  // 关联user表
  Friend.belongsTo(sequelize.models.User, {
    as: 'friendUserInfo',
    foreignKey: 'friendUserId',
    targetKey: 'id',
  });
  await Friend.sync();

  // 查询用户好友列表并返回数量
  function findFriendsByUserId(userId) {
    return Friend.findAndCountAll({
      where: {
        userId,
        pass: true,
      },
      include: {
        model: sequelize.models.User,
        as: 'friendUserInfo',
        required: true,
        attributes: {
          exclude: ['password', 'createdAt', 'updatedAt'],
        },
        // belongsTo不能使用through
        // through: {}
      }
    });
  }
  // 添加好友关系，已存在直接返回不存在就添加
  async function addFriendRelation(userId, friendUserId) {
    return Friend.findOrCreate({
      where: {
        userId,
        friendUserId,
      }
    });
  }
  // 同意好友请求
  async function agreeFriendRelation(userId, friendUserId) {
    const t = await sequelize.transaction();
    try {
      await Friend.update({ pass: true }, {
        where: {
          userId: friendUserId,
          friendUserId: userId,
        },
        transaction: t,
      });
      await Friend.findOrCreate({
        where: {
          userId,
          friendUserId,
        },
        defaults: {
          pass: true,
        },
        transaction: t,
      });
      await t.commit();
      return true;
    } catch (e) {
      console.log(e);
      t.rollback();
      return false;
    }
  }
  // 解除好友关系
  function removeFriendRelation(userId, friendUserId) {
    return Friend.destroy({
      where: {
        userId,
        friendUserId,
      }
    });
  }
  // 获取好友记录
  function findFriendRow(userId, friendUserId, options) {
    let condition = {
      userId,
      friendUserId,
    };
    if (helper.isType(options, 'object')) {
      Object.assign(condition, options);
    }
    return Friend.findOne({
      where: condition,
      raw: true,
    });
  }

  return {
    findFriendsByUserId,
    addFriendRelation,
    agreeFriendRelation,
    removeFriendRelation,
    findFriendRow,
  };
}