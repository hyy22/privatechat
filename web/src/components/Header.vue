<script setup>
import { reactive } from 'vue';
import {
  Dialog,
  Field,
  NavBar,
  Icon,
  Toast,
  Form,
  CellGroup,
  Button,
  Image,
} from 'vant';
import request from '../utils/request';
import config from '../config';
import { useUserStore } from '../stores/user';
import {
  buildMessage,
  sendMessage,
  findMessageByType,
  removeMessageById,
} from '../utils/message';
import { responsive } from '../utils';

// 属性
const props = defineProps({
  hasNew: {
    type: Boolean,
    default: false,
  },
});
// 事件
const emit = defineEmits(['add-friend', 'reject-friend', 'update:hasNew']);
// 弹窗组件
const DialogComponent = Dialog.Component;
/**
 * 添加好友
 */
const addFriendModal = reactive({
  visible: false,
  targetUserId: '',
  note: '',
});
// 显示添加好友弹窗
function showAddFriendModal() {
  const { userInfo } = useUserStore();
  addFriendModal.visible = true;
  addFriendModal.targetUserId = '';
  addFriendModal.note = `我是${userInfo.userName}，想加你为好友`;
}
// 提交添加好友弹窗
async function submitAddFriendModal() {
  const { targetUserId, note } = addFriendModal;
  if (!targetUserId) return;
  // 校验用户是否存在
  const result = await request({
    url: '/get_user_info',
    data: {
      userId: targetUserId,
    },
  });
  if (result.code !== 0) {
    return Toast(result.message);
  }
  if (!result.data) {
    return Toast('该用户不存在！');
  }
  const message = buildMessage({
    toUser: result.data,
    type: 'ADD_FRIEND',
    content: { note },
  });
  try {
    await sendMessage(message);
    Toast('申请已提交，请等待对方验证');
    addFriendModal.visible = false;
  } catch (e) {
    Toast(e.message);
  }
}
/**
 * 系统消息
 */
const systemMessageDialog = reactive({
  visible: false,
  messages: [],
});
// 显示弹窗
async function showSystemMessageDialog() {
  const { userInfo } = useUserStore();
  const messages = await findMessageByType('type', 'ADD_FRIEND');
  // 消息过滤，同一用户保留最后一次
  const sysMsgs = [
    ...messages
      .reduce((prev, cur) => {
        // 过滤掉自己发送的
        if (cur.fromUserId !== userInfo.id) {
          prev.set(cur.fromUserId, cur);
        }
        return prev;
      }, new Map())
      .values(),
  ];
  if (!sysMsgs.length) {
    Toast('暂无系统消息');
    return;
  }
  systemMessageDialog.messages = sysMsgs.reverse();
  systemMessageDialog.visible = true;
  emit('update:hasNew', false);
}
// 移除好友申请记录
async function removeFriendReqRecord(id) {
  await removeMessageById(id);
  const targetIndex = systemMessageDialog.messages.findIndex(
    (v) => v.id === id
  );
  if (targetIndex > -1) {
    systemMessageDialog.messages.splice(targetIndex, 1);
  }
  systemMessageDialog.visible = false;
}
// 同意好友
async function agreeAddFriend(row) {
  const message = buildMessage({
    toUser: { ...row.fromUser },
    type: 'AGREE_FRIEND',
    content: {
      note: '同意了你的好友请求',
    },
  });
  try {
    await sendMessage(message);
    emit('add-friend', { ...row.fromUser });
    removeFriendReqRecord(row.id);
  } catch (e) {
    Toast(e.message);
  }
}
// 拒绝添加
async function rejectAddFriend(row) {
  const result = await request({
    url: '/reject_friend',
    data: {
      targetUserId: row.fromUserId,
    },
    loading: true,
  });
  if (result.code === 0) {
    removeFriendReqRecord(row.id);
    return;
  }
  Toast(result.message);
}
</script>

<template>
  <NavBar :title="config.PROJECT_NAME" fixed>
    <template #left>
      <Icon
        name="chat-o"
        :dot="props.hasNew"
        size="18"
        @click="showSystemMessageDialog" />
    </template>
    <template #right>
      <Icon name="plus" size="18" @click="showAddFriendModal" />
    </template>
  </NavBar>
  <!-- 好友申请弹窗 -->
  <DialogComponent
    v-model:show="addFriendModal.visible"
    title="好友申请"
    :show-confirm-button="false"
    close-on-click-overlay>
    <Form @submit="submitAddFriendModal">
      <CellGroup inset>
        <Field
          label="好友id"
          v-model="addFriendModal.targetUserId"
          placeholder="请填写好友id"
          :rules="[{ required: true, message: '请填写好友id' }]" />
        <Field
          v-model="addFriendModal.note"
          type="textarea"
          autosize
          label="备注"
          placeholder="填写备注"
          :rules="[{ required: true, message: '请填写备注' }]" />
      </CellGroup>
      <div style="margin: 16px">
        <Button round block type="primary" native-type="submit">确定</Button>
      </div>
    </Form>
  </DialogComponent>
  <!-- 系统消息弹窗 -->
  <DialogComponent
    v-model:show="systemMessageDialog.visible"
    title="系统消息"
    :show-confirm-button="false"
    close-on-click-overlay>
    <div class="notice-wrapper">
      <div
        class="notice-item"
        v-for="item in systemMessageDialog.messages"
        :key="item.id">
        <Image
          class="avatar"
          :width="responsive(100)"
          :height="responsive(100)"
          radius="4px"
          :src="item.fromUser.avatar" />
        <div class="text">
          <div class="nick">{{ item.fromUser.userName }}发送了好友请求</div>
          <div class="note">{{ item.content.note }}</div>
        </div>
        <div class="btns">
          <Button type="primary" @click="agreeAddFriend(item)">同意</Button>
          <Button type="danger" @click="rejectAddFriend(item)">拒绝</Button>
        </div>
      </div>
    </div>
  </DialogComponent>
</template>

<style lang="scss" scoped>
.notice-wrapper {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
}
.notice-item {
  margin-top: 30px;
  display: flex;
  align-items: center;
  .avatar {
    flex: none;
    margin-right: 20px;
  }
  .text {
    flex: auto;
    min-width: 0;
    .nick {
      font-size: 30px;
    }
    .note {
      font-size: 26px;
      color: #999;
    }
  }
  .btns {
    flex: none;
    margin-left: 20px;
  }
}
</style>
