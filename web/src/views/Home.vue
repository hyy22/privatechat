<script setup>
import { computed, ref, onBeforeMount, onBeforeUnmount, watch } from 'vue';
import { Search, Toast } from 'vant';
import { useRouter } from 'vue-router';
import request from '@/utils/request';
import FriendItem from '@/components/friends/FriendItem.vue';
import useRecent from '@/composations/useRecent';
import eventBus from '@/utils/eventBus';
import { removeMessageRowsByUserId } from '@/utils/message';
import { useStatusStore } from '@/stores/status';

const router = useRouter();
const { recentList, findRecentRows, removeRecentMessage } = useRecent();
const statusStore = useStatusStore();

/**
 * 好友列表
 */
const friends = ref([]);
// 获取好友列表
async function queryFriendList() {
  const result = await request({
    url: '/get_friend_list',
    data: {},
  });
  if (result.code === 0) {
    friends.value = result.data.rows.map((v) => v.friendUserInfo);
    return;
  }
  Toast(result.message);
}
queryFriendList();

/**
 * 页面展示列表
 */
// 筛选
const searchFilterText = ref('');
// 全量会话列表
const recentSessionList = computed(() => {
  let recentRowsMap = new Map();
  let friendsRowsMap = friends.value.reduce((prev, cur) => {
    prev.set(cur.id, { ...cur, lastMessage: null, unreadCount: 0 });
    return prev;
  }, new Map());
  recentList.value.forEach((v) => {
    const friendRow = friendsRowsMap.get(v.friendId);
    if (friendRow) {
      recentRowsMap.set(v.friendId, {
        ...friendRow,
        lastMessage: v.lastMessage,
        unreadCount: v.unreadCount,
      });
      friendsRowsMap.delete(v.friendId);
    }
  });
  return [...recentRowsMap.values(), ...friendsRowsMap.values()];
});
// 筛选后的会话列表
const filterRecentSessionList = computed(() => {
  return searchFilterText.value
    ? recentSessionList.value.filter(
        (v) => v.userName.indexOf(searchFilterText.value) > -1
      )
    : recentSessionList.value;
});
// 监听会话变更，更新store
watch(recentSessionList, (v) => {
  statusStore.hasUnreadChatMsg = v.some((v) => v.unreadCount > 0);
});

/**
 * 好友管理
 */
// 添加好友回调
function handleAddFriend(user) {
  friends.value.push(user);
}
// 删除好友回调
function handleRemoveFriend(id) {
  const index = friends.value.findIndex((v) => v.id === id);
  if (index > -1) {
    friends.value.splice(index, 1);
  }
  handleRemoveRecordList(id);
}
// 删除好友聊天记录
function handleRemoveRecordList(id) {
  removeMessageRowsByUserId(id);
  removeRecentMessage(id);
}

/**
 * 路由
 */
// 跳转到会话页
async function handleItemClick(item) {
  router.push({ path: '/chat', query: { friendId: item.id } });
}

/**
 * 生命周期
 */
onBeforeMount(function () {
  // 更新消息列表
  findRecentRows();
  eventBus.on('message', (msgs) => {
    msgs.forEach((v) => {
      // 有同意好友消息，添加好友到列表
      if (v.type === 'AGREE_FRIEND') {
        handleAddFriend(v.fromUser);
      }
    });
    // 收到消息更新消息列表
    findRecentRows();
  });
  // 监听添加好友事件
  eventBus.on('add-friend', handleAddFriend);
});
onBeforeUnmount(function () {
  eventBus.off('message');
  eventBus.off('add-friend');
});
</script>

<template>
  <div class="home">
    <div class="home-wrapper">
      <Search
        v-model="searchFilterText"
        placeholder="请输入关键词"
        input-align="center" />
      <FriendItem
        v-for="item of filterRecentSessionList"
        :key="item.id"
        v-bind="item"
        @remove-friend="handleRemoveFriend"
        @remove-record="handleRemoveRecordList"
        @item-click="handleItemClick(item)" />
    </div>
  </div>
</template>

<style lang="scss">
.home {
  background: #f9f9f9;
}
.home-wrapper {
  margin-bottom: 130px;
}
</style>
