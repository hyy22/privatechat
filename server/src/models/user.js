import { DataTypes, Op } from 'sequelize';

export default async function(sequelize) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    initialAutoIncrement: 10000,
    tableName: 'users'
  });
  await User.sync();

  // 判断是否可用
  function findOneUser(userName, password) {
    const condition = {};
    if (!userName) return null;
    condition.userName = userName;
    if (typeof password !== 'undefined') {
      condition.password = password;
    }
    return User.findOne({ where: condition});
  }
  // 注册
  async function addUser({ userName, password, avatar, signature, publicKey }) {
    const hasOne = await findOneUser(userName);
    if (hasOne) {
      throw new Error('用户名已被占用');
    }
    return User.create({ userName, password, avatar, signature, publicKey });
  }
  // 根据用户id查询
  async function findByUserId(id) {
    return User.findByPk(id, {
      attributes: {
        exclude: ['password', 'createdAt', 'updatedAt'],
      },
      raw: true,
    });
  }
  // 更新用户信息
  async function updateByUserId(id, data) {
    return User.update(data, {
      where: {
        id,
      }
    });
  }
  // 查询多个用户
  async function findManyUsersByIds(ids = []) {
    return User.findAll({
      raw: true,
      attributes: {
        exclude: ['password', 'createdAt', 'updatedAt'],
      },
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });
  }

  return {
    findOneUser,
    addUser,
    findByUserId,
    updateByUserId,
    findManyUsersByIds,
  };
}