import { toRaw } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from '@/stores/user';
import { useRsaStore } from '@/stores/rsa';
import { encrypt, decrypt } from '@/utils/crypto';
import request from '@/utils/request';
import { useDbStore } from '@/stores/db';
import {
  insertRows,
  removeRowsByCursor,
  findRowByIndex,
  removeRowByKey,
  findRowByKey,
  updateRow,
  findRowsByKeyCursorOffsetFromPrimaryKeyValue,
  findLastRowByIndex,
} from '@/utils/indexdb';
import useRecent from '@/composations/useRecent';

const MESSAGE_STORE = 'messages';
/**
 * 构建消息对象
 * @param {*} param0
 * @returns
 */
export function buildMessage({ toUser, type, content }) {
  const userStore = useUserStore();
  const message = {
    id: uuidv4(),
    type,
    content,
    toUserId: toUser.id,
    toUser,
    fromUserId: userStore.userInfo.id,
    fromUser: toRaw(userStore.userInfo), // 返回proxy对象，需要转化成普通对象
    status: 'PENDING',
    read: true,
    createdAt: new Date(),
  };
  return message;
}

/**
 * 发送消息
 * @param {*} message
 * @returns
 */
export async function sendMessage(message) {
  try {
    const result = await request({
      url: '/send_message',
      data: {
        ...message,
        // 内容加密
        content: encrypt(message.content, message.toUser.publicKey),
      },
    });
    if (result.code === 0) {
      const { id, createdAt } = result.data;
      message.id = id;
      message.createdAt = createdAt;
      message.status = 'SUCCESS';
      message.chatWithUserId = message.toUserId; // 聊天用户id，冗余字段，查询用
      // 入库
      addMessagesDB([message]);
      // 更新最近记录
      useRecent().handleNewMessage([message]);
      return message;
    }
    throw new Error(result.message);
  } catch (e) {
    message.status = 'FAIL';
    throw e;
  }
}

/**
 * 接收消息
 * @param {*} messages
 * @returns
 */
export async function receiveMessages(messages = []) {
  const rsaStore = useRsaStore();
  // 解密消息
  const formatMsgs = messages.map((v) => {
    v.read = false; // 标记为未读
    v.chatWithUserId = v.fromUserId; // 聊天用户id，冗余字段，查询用
    v.status = 'SUCCESS';
    let content = v.content;
    try {
      content = decrypt(content, rsaStore.privateKey);
    } catch (e) {
      v.status = 'DECRYPT_FAIL';
    }
    return {
      ...v,
      content,
    };
  });
  // 入库并上报
  await addMessagesDB(formatMsgs, true);
  // 更新最近记录
  await useRecent().handleNewMessage(formatMsgs);
  return formatMsgs;
}

/**
 * 获取指定类型的消息
 * @param {String} type 类型
 * @param {String} value 值
 * @returns
 */
export async function findMessageByType(type, value) {
  const db = await openDB();
  return findRowByIndex(db, MESSAGE_STORE, type, value);
}

/**
 * 获取指定人消息
 * @param {*} param0
 * @returns
 */
export async function findMessageRowsByUserId({
  userId,
  limit = 200,
  fromRowId,
}) {
  const db = await openDB();
  return findRowsByKeyCursorOffsetFromPrimaryKeyValue(db, MESSAGE_STORE, {
    key: 'chatWithUserId',
    query: IDBKeyRange.only(userId),
    direction: 'prev',
    limit,
    primaryKeyValue: fromRowId,
  });
}

/**
 * 获取用户最后一条消息记录
 * @param {*} userId 用户id
 * @returns
 */
export async function findLastMessageByUserId(userId) {
  const db = await openDB();
  return findLastRowByIndex(db, MESSAGE_STORE, {
    key: 'chatWithUserId',
    query: IDBKeyRange.only(userId),
  });
}

/**
 * 根据主键值删除消息
 * @param {Number | String} id 主键值
 * @returns
 */
export async function removeMessageById(id) {
  const db = await openDB();
  return removeRowByKey(db, MESSAGE_STORE, id);
}

/**
 * 删除与指定人聊天记录
 * @param {Number} userId 用户id
 * @returns
 */
export async function removeMessageRowsByUserId(userId) {
  const db = await openDB();
  return removeRowsByCursor(db, MESSAGE_STORE, {
    key: 'chatWithUserId',
    query: IDBKeyRange.only(userId),
  });
}

/**
 * 标记消息为已读
 * @param {Number} msgId 消息id
 * @returns
 */
export async function markMessageRead(msgId) {
  const db = await openDB();
  const row = await findRowByKey(db, MESSAGE_STORE, msgId);
  if (row) {
    row.read = true;
    return updateRow(db, MESSAGE_STORE, row);
  }
}

// 打开数据库
async function openDB() {
  const dbStore = useDbStore();
  return dbStore.db;
}

// 存入db
async function addMessagesDB(messages = [], report = false) {
  // 初始化数据库
  const db = await openDB();
  // 添加
  await insertRows(db, MESSAGE_STORE, messages);
  // 是否需要上报接收状态，从服务端接收的传true
  if (report) {
    await request({
      url: '/report_receive_message',
      data: {
        messageIds: messages.map((v) => v.id),
      },
    });
  }
}
