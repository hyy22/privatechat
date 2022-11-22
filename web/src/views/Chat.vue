<script setup>
import { ref, onMounted, onBeforeUnmount, toRaw, reactive } from 'vue';
import {
  Button,
  NavBar,
  Toast,
  Field,
  Loading,
  ActionSheet,
  Uploader,
  Icon,
} from 'vant';
import { useRoute, useRouter } from 'vue-router';
import request from '../utils/request';
import useMessage from '../composations/useMessage';
import useRecent from '../composations/useRecent';
import eventBus from '../utils/eventBus';
import MessageItem from '../components/messages/MessageItem.vue';
import { startObserve } from '../utils/intersectionObserver';
import { responsive } from '../utils';

const { query } = useRoute();
// 聊天对象用户id
const targetUserId = Number(query.friendId);
const {
  messages,
  msgLoadAll,
  getHistoryMessages,
  handleSubmitMessage,
  handleReceiveMessages,
  handleRemoveMessage,
} = useMessage(targetUserId);
const { markRecentRead, updateFriendRecentMessage } = useRecent();
const router = useRouter();

/**
 * 获取对面用户信息
 */
const targetUserInfo = ref({});
async function getTargetUserInfo() {
  const result = await request({
    url: '/get_user_info',
    data: {
      userId: targetUserId,
    },
    loading: true,
  });
  if (result.code === 0) {
    targetUserInfo.value = result.data;
    return;
  }
  Toast(result.message);
}

/**
 * 监听新消息
 */
// 消息列表容器
const wrapper = ref(null);
// 新消息提示栏
const showBottomBar = ref(false);
function addMessageListener() {
  eventBus.on('message', async (msgs) => {
    // 过滤当前用户
    const newMsgs = msgs.filter((v) => v.chatWithUserId === targetUserId);
    if (newMsgs.length) {
      handleReceiveMessages(newMsgs);
      if (wrapper.value.scrollTop > 200) {
        showBottomBar.value = true;
      }
    }
    // 标记已读
    markRecentRead(targetUserId);
  });
}
// 滚动到底部
function scrollBottom() {
  wrapper.value.scrollTo(0, 0);
  showBottomBar.value = false;
}

/**
 * 发送消息
 */
// 文本消息
const tempMsg = ref('');
async function handleSendText() {
  if (!tempMsg.value) return;
  handleSubmitMessage({
    toUser: toRaw(targetUserInfo.value),
    type: 'TEXT',
    data: tempMsg.value,
  });
  tempMsg.value = '';
  scrollBottom();
}
// 图片上传校验
function handleBeforeImgUpload(f) {
  const files = Array.isArray(f) ? f : [f];
  return files.every((file) => {
    return /^image/.test(file.type);
  });
}
// 发送图片消息
function handleImgUpload(f) {
  const toRawF = toRaw(f);
  const files = Array.isArray(toRawF) ? toRawF : [toRawF];
  files.forEach((item) => {
    handleSubmitMessage({
      toUser: toRaw(targetUserInfo.value),
      type: 'IMAGE',
      data: item.file,
    });
  });
  scrollBottom();
}

/**
 * 操作栏
 */
const actionSheetBar = reactive({
  visible: false,
  messageId: 0,
  actions: [{ name: '删除消息' }],
});
function showActionSheetBar(id) {
  actionSheetBar.visible = true;
  actionSheetBar.messageId = id;
}
async function handleActionSheetSelect(item) {
  if (item.name === '删除消息') {
    await handleRemoveMessage(actionSheetBar.messageId);
    await updateFriendRecentMessage(targetUserId);
    actionSheetBar.visible = false;
  }
}

/**
 * 可视性检测
 */
let observer;
function initObserver() {
  observer = startObserve(
    ['#status-bar'],
    (entities = []) => {
      entities.forEach((e) => {
        if (e.target.id === 'status-bar' && e.isIntersecting) {
          getHistoryMessages();
        }
      });
    },
    {
      root: document.querySelector('.chat-list--wrapper'),
    }
  );
}

onMounted(async function () {
  // 标记已读
  markRecentRead(targetUserId);
  // 获取好友信息
  getTargetUserInfo();
  // 监听消息
  addMessageListener();
  // 监听状态栏
  initObserver();
});

onBeforeUnmount(function () {
  observer.cancel();
  eventBus.off('message');
});
</script>

<template>
  <div class="chat-view">
    <NavBar
      class="nav-bar"
      :title="targetUserInfo.userName"
      left-text="返回"
      left-arrow
      @click-left="router.back()" />
    <!-- 聊天记录 -->
    <div class="chat-list--wrapper" ref="wrapper">
      <div class="chat-list">
        <!-- 更多 -->
        <div id="status-bar">
          <Loading v-if="!msgLoadAll" size="20">加载中...</Loading>
          <span v-else-if="messages.length">加载完毕</span>
        </div>
        <MessageItem
          v-bind="item"
          v-for="item of messages"
          :key="item.id"
          @longpress="showActionSheetBar"></MessageItem>
        <!-- 到底 -->
        <div id="bottom-bar"></div>
      </div>
    </div>
    <!-- 聊天框 -->
    <div class="chat-input">
      <div class="tool-bar">
        <Uploader
          multiple
          accept="image/*"
          :before-read="handleBeforeImgUpload"
          :after-read="handleImgUpload">
          <Icon name="photo-o" :size="responsive(50)"></Icon>
        </Uploader>
      </div>
      <div class="row">
        <Field
          class="ipt"
          type="textarea"
          autosize
          v-model="tempMsg"
          placeholder="请输入"></Field>
        <Button class="btn" type="primary" @click="handleSendText">发送</Button>
      </div>
    </div>
    <teleport to="body">
      <!-- 提示框 -->
      <div v-show="showBottomBar" class="bottom-tipbar" @click="scrollBottom">
        查看最新消息
      </div>
      <ActionSheet
        v-model:show="actionSheetBar.visible"
        :actions="actionSheetBar.actions"
        cancel-text="取消"
        @select="handleActionSheetSelect"></ActionSheet>
    </teleport>
  </div>
</template>

<style lang="scss">
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  .nav-bar {
    flex: none;
  }
  .chat-input {
    flex: none;
  }
  .chat-list--wrapper {
    flex: auto;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #f3f3f3;
    transform: rotate(180deg) translateZ(0);
  }
  .chat-list {
    transform: rotate(-180deg) translateZ(0);
  }
  #status-bar {
    text-align: center;
    padding-top: 20px;
    color: #999;
  }
  .chat-input {
    .tool-bar {
      padding: 30px;
    }
    .row {
      padding: 0 30px 30px 0;
      display: flex;
      align-items: center;
    }
    .ipt {
      flex: auto;
      min-width: 0;
    }
    .btn {
      flex: none;
      margin-left: 30px;
    }
  }
}
.bottom-tipbar {
  position: fixed;
  z-index: 2;
  bottom: 500px;
  right: 0;
  padding: 18px;
  background-color: rgba($color: #1989fa, $alpha: 0.5);
  color: #fff;
  border-radius: 8px 0 0 8px;
}
</style>
