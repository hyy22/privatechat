<script setup>
import { Badge, Image, SwipeCell, Button, Dialog, Toast } from 'vant';
import config from '../../config';
import { responsive, formatTime } from '../../utils/index';
import request from '../../utils/request';

// 定义属性
const props = defineProps({
  avatar: String,
  id: Number,
  userName: {
    type: String,
    required: true,
  },
  signature: String,
  lastMessage: Object,
  unreadCount: {
    type: Number,
    default: 0,
  },
});
const emit = defineEmits(['remove-friend', 'remove-record', 'item-click']);

// 删除操作
async function removeFriend(type = 'record') {
  try {
    let mapping = {
      record: '记录',
      friend: '好友',
    };
    await Dialog.confirm({
      title: `确认删除${mapping[type]}?`,
    });
  } catch (e) {
    return;
  }
  if (type === 'friend') {
    const result = await request({
      url: '/remove_friend',
      data: {
        targetUserId: props.id,
      },
      showLoading: true,
    });
    if (result.code === 0) {
      emit('remove-friend', props.id);
      return;
    }
    Toast(result.message);
  } else if (type === 'record') {
    emit('remove-record', props.id);
  }
}
</script>

<template>
  <SwipeCell>
    <div class="friend-item" @click="emit('item-click')">
      <Badge
        v-if="props.unreadCount > 0"
        class="avatar"
        :content="props.unreadCount"
        :max="99">
        <Image
          :width="responsive(140)"
          :height="responsive(140)"
          radius="5px"
          :src="props.avatar || config.DEFAULT_AVATAR_URL"
          alt="" />
      </Badge>
      <Image
        v-else
        class="avatar"
        :width="responsive(140)"
        :height="responsive(140)"
        radius="5px"
        :src="props.avatar || config.DEFAULT_AVATAR_URL"
        alt="" />
      <div class="main">
        <div class="nickname">{{ props.userName }}</div>
        <div class="message ellipsis-1">
          <template v-if="!props.lastMessage || !props.lastMessage.content">{{
            props.signature
          }}</template>
          <template v-else>
            <template v-if="props.lastMessage.type === 'IMAGE'"
              >[图片]</template
            >
            <template v-else>{{
              props.lastMessage.content.text || props.lastMessage.content.note
            }}</template>
          </template>
        </div>
      </div>
      <div class="time" v-if="props.lastMessage">
        {{ formatTime(props.lastMessage.createdAt) }}
      </div>
    </div>
    <template #right>
      <Button
        class="friend-item__tool-btn"
        square
        type="danger"
        text="删除记录"
        @click="removeFriend('record')" />
      <Button
        class="friend-item__tool-btn"
        square
        type="primary"
        text="删除好友"
        @click="removeFriend('friend')" />
    </template>
  </SwipeCell>
</template>

<style lang="scss">
.friend-item {
  padding: 20px;
  background: #fff;
  margin-top: 2px;
  display: flex;
  .avatar {
    flex: none;
    margin-right: 20px;
  }
  .main {
    flex: auto;
    min-width: 0;
    padding: 20px 0;
  }
  .nickname {
    font-size: 30px;
  }
  .message {
    font-size: 26px;
    margin-top: 20px;
    color: #999;
  }
  .time {
    color: #666;
    margin-top: 20px;
  }
}
.friend-item__tool-btn {
  height: 100%;
  padding: 0 10px;
}
</style>
