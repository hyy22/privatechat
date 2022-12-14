import { ref } from 'vue';
import { useUserStore } from '@/stores/user';
import { useDbStore } from '@/stores/db';
import {
  insertRows,
  removeRowByKey,
  findRowByIndex,
  findAllRows,
  updateRow,
} from '@/utils/indexdb';
import { findLastMessageByUserId } from '@/utils/message';

const RECENT_STORE = 'recents';
// [{ friendId, lastMessage, unreadCount }]
export default function useRecent() {
  const userStore = useUserStore();
  const dbStore = useDbStore();
  const recentList = ref([]);

  // 初始化数据库
  async function openDB() {
    return dbStore.db;
  }
  // 获取所有记录
  async function findRecentRows() {
    const db = await openDB();
    const rows = await findAllRows(db, RECENT_STORE);
    recentList.value = rows.reverse();
  }
  // 接收新消息
  async function handleNewMessage(messages = []) {
    const db = await openDB();
    for (let msg of messages) {
      const isMy = msg.fromUserId === userStore.userInfo.id;
      const friendId = isMy ? msg.toUserId : msg.fromUserId;
      const [curRow] = await findRowByIndex(
        db,
        RECENT_STORE,
        'friendId',
        friendId
      );
      if (curRow) {
        curRow.lastMessage = msg;
        if (!isMy) curRow.unreadCount += 1;
        await removeRowByKey(db, RECENT_STORE, curRow.id);
        delete curRow.id;
        await insertRows(db, RECENT_STORE, [curRow]);
      } else {
        const row = {
          friendId,
          lastMessage: msg,
          unreadCount: isMy ? 0 : 1,
        };
        await insertRows(db, RECENT_STORE, [row]);
      }
    }
  }
  // 更新好友最新一条会话记录
  async function updateFriendRecentMessage(friendId) {
    const db = await openDB();
    const row = await findLastMessageByUserId(friendId);
    const [curRow] = await findRowByIndex(
      db,
      RECENT_STORE,
      'friendId',
      friendId
    );
    if (!curRow) return;
    curRow.lastMessage = row;
    await updateRow(db, RECENT_STORE, curRow);
  }
  // 删除记录
  async function removeRecentMessage(friendId) {
    const db = await openDB();
    await removeRowByKey(db, RECENT_STORE, friendId);
    const index = recentList.value.findIndex((v) => v.friendId === friendId);
    if (index > -1) recentList.value.splice(index, 1);
  }
  // 清空未读数
  async function markRecentRead(friendId) {
    const db = await openDB();
    const [row] = await findRowByIndex(db, RECENT_STORE, 'friendId', friendId);
    if (!row) return;
    row.unreadCount = 0;
    await updateRow(db, RECENT_STORE, row);
  }

  return {
    recentList,
    findRecentRows,
    handleNewMessage,
    removeRecentMessage,
    markRecentRead,
    updateFriendRecentMessage,
  };
}
