<script setup>
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';
import { Image, Loading, Icon } from 'vant';
import { responsive, formatTime } from '@/utils/index';

const props = defineProps({
  id: [Number, String],
  type: {
    type: String,
    required: true,
  },
  fromUser: Object,
  toUser: Object,
  createdAt: [String, Date],
  content: Object,
  read: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: 'PENDING', // PENDING发送中 SUCCESS发送成功 FAIL发送失败 DECRYPT_FAIL解密失败
  },
});
const emit = defineEmits(['longpress']);
const useStore = useUserStore();
const isMy = computed(() => {
  return useStore.userInfo && useStore.userInfo.id === props.fromUser.id;
});

// 模拟长按事件
let timer;
function handleTouchStart() {
  timer = setTimeout(() => {
    emit('longpress', props.id);
  }, 500);
}
function handleTouchEnd() {
  clearTimeout(timer);
}
function handleTouchMove() {
  clearTimeout(timer);
}
</script>

<template>
  <div :class="{ 'message-item': true, 'is-my': isMy }">
    <div class="time" v-if="props.createdAt">
      {{ formatTime(props.createdAt) }}
    </div>
    <div class="row" v-if="!isMy">
      <Image
        class="avatar"
        :src="props.fromUser.avatar"
        :width="responsive(100)"
        :height="responsive(100)"
        radius="5px" />
      <div class="text">
        <div class="nick">{{ props.fromUser.userName }}</div>
        <div
          class="content-wrapper"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd">
          <div class="content">
            <img
              v-if="props.type === 'IMAGE'"
              :src="props.content.data"
              width="" />
            <template v-else>{{
              props.content.text || props.content.note
            }}</template>
          </div>
          <Icon
            v-if="props.status === 'DECRYPT_FAIL'"
            class="icon"
            name="warning"
            size="18"
            color="#ee0a24" />
        </div>
      </div>
    </div>
    <div class="row" v-else>
      <div class="text">
        <div class="nick">{{ props.fromUser.userName }}</div>
        <div
          class="content-wrapper"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd">
          <Loading class="icon" v-if="props.status === 'PENDING'" />
          <Icon
            v-if="props.status === 'FAIL'"
            class="icon"
            name="warning"
            size="18"
            color="#ee0a24" />
          <div class="content">
            <img
              v-if="props.type === 'IMAGE'"
              :src="props.content.data"
              width="" />
            <template v-else>{{
              props.content.text || props.content.note
            }}</template>
          </div>
        </div>
      </div>
      <Image
        class="avatar"
        :src="props.toUser.avatar"
        :width="responsive(100)"
        :height="responsive(100)"
        radius="5px" />
    </div>
  </div>
</template>

<style lang="scss">
.message-item {
  padding: 30px;
  user-select: none;
  .time {
    text-align: center;
    font-size: 26px;
    color: #999;
  }
  .row {
    display: flex;
    margin-top: 30px;
    .avatar {
      flex: none;
      margin-right: 30px;
    }
    .text {
      flex: none;
      max-width: 60vw;
      box-sizing: border-box;
      color: #111;
    }
    .nick {
      font-size: 26px;
      color: #333;
      margin-bottom: 20px;
    }
    .content-wrapper {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    .icon {
      flex: none;
      margin-right: 20px;
      width: 30px;
      height: 30px;
    }
    .content {
      background-color: #fff;
      padding: 20px;
      border-radius: 10px;
      position: relative;
      white-space: pre;
      img {
        max-width: 450px;
      }
      &::before {
        content: '';
        position: absolute;
        top: 10px;
        left: -20px;
        width: 0;
        height: 0;
        border: 10px solid transparent;
        border-right-color: #fff;
      }
    }
  }
  &.is-my {
    .row {
      justify-content: flex-end;
      .avatar {
        margin-right: 0;
        margin-left: 30px;
      }
      .nick {
        text-align: right;
      }
      .content-wrapper {
        justify-content: flex-end;
      }
      .content {
        background-color: #1989fa;
        color: #fff;
        &::before {
          left: auto;
          right: -20px;
          border-right-color: transparent;
          border-left-color: #1989fa;
        }
      }
    }
  }
}
</style>
