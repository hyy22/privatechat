import { ref } from 'vue';
import { Toast } from 'vant';
import {
  findMessageRowsByUserId,
  sendMessage,
  removeMessageById,
  buildMessage,
} from '@/utils/message';
import { imgOptimizate, readImageFile } from '@/utils';
import eventBus from '@/utils/eventBus.js';

export default function useMessage(friendId) {
  // state
  const messages = ref([]);
  const msgLoading = ref(false);
  const msgLoadAll = ref(false);
  let lastMsgId;
  // 获取历史消息
  async function getHistoryMessages(limit = 200) {
    if (msgLoading.value || msgLoadAll.value) return;
    msgLoading.value = true;
    const {
      hasMore,
      lastKeyValue,
      result = [],
    } = await findMessageRowsByUserId({
      userId: friendId,
      limit,
      fromRowId: lastMsgId,
    });
    msgLoading.value = false;
    msgLoadAll.value = !hasMore;
    const msgs = result.reverse();
    if (!lastMsgId) {
      messages.value = msgs;
    } else {
      messages.value.unshift(...msgs);
    }
    lastMsgId = lastKeyValue;
  }
  // 发送消息
  async function handleSubmitMessage({ toUser, type = 'TEXT', data }) {
    let content;
    if (type === 'TEXT') {
      content = {
        text: data,
      };
    } else if (type === 'IMAGE') {
      content = {
        data: await readImageFile(
          await imgOptimizate({ img: data, size: 750 })
        ),
      };
    }
    const message = buildMessage({
      toUser,
      type,
      content,
    });
    messages.value.push(message);
    try {
      await sendMessage(message);
    } catch (e) {
      Toast(e.message);
    }
    messages.value = [...messages.value];
  }
  // 接收消息
  async function handleReceiveMessages(msgs = []) {
    messages.value.push(...msgs);
  }
  // 删除消息
  async function handleRemoveMessage(msgId) {
    const index = messages.value.findIndex((v) => v.id === msgId);
    if (index === -1) return;
    messages.value.splice(index, 1);
    await removeMessageById(msgId);
    eventBus.emit('remove:message', { userId: friendId, messageId: msgId });
  }

  return {
    messages,
    msgLoadAll,
    getHistoryMessages,
    handleSubmitMessage,
    handleReceiveMessages,
    handleRemoveMessage,
  };
}
