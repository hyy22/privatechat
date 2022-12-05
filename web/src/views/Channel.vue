<script setup>
import { reactive, onMounted } from 'vue';
import { Form, Field, Button, Checkbox, CellGroup, Toast } from 'vant';
import request from '@/utils/request';

/**
 * 表单
 */
const form = reactive({
  id: 0,
  open: false,
  url: '',
});
// 获取钉钉绑定信息
async function getDingTalkChannelInfo() {
  const result = await request({
    url: '/get_channel_list',
    data: {},
  });
  if (result.code === 0) {
    const channelInfo = result.data.find((v) => v.type === 'DINGTALK');
    if (channelInfo) {
      form.id = channelInfo.id;
      form.open = channelInfo.open;
      try {
        const { url } = JSON.parse(channelInfo.content);
        form.url = url;
      } catch (e) {
        form.url = '';
      }
    }
    return;
  }
  Toast(result.message);
}
// 提交绑定
async function handleSubmit() {
  const result = await request({
    url: '/create_or_update_channel',
    data: {
      id: form.id,
      open: form.open,
      type: 'DINGTALK',
      content: JSON.stringify({ url: form.url }),
    },
  });
  if (result.code === 0) {
    Toast('操作成功');
    return;
  }
  Toast(result.message);
}
// 解绑
async function submitUnbind() {
  if (!form.id) return;
  const result = await request({
    url: '/remove_channel',
    data: {
      id: form.id,
    },
  });
  if (result.code === 0) {
    form.id = 0;
    form.open = false;
    form.url = '';
    Toast('解绑成功');
    return;
  }
  Toast(result.message);
}

onMounted(function () {
  // 获取钉钉渠道信息
  getDingTalkChannelInfo();
});
</script>

<template>
  <div class="channel-page">
    <div class="title">绑定钉钉机器人</div>
    <Form @submit="handleSubmit">
      <CellGroup inset>
        <Field label="是否开启">
          <template #input>
            <Checkbox v-model="form.open" shape="square" />
          </template>
        </Field>
        <Field
          v-model="form.url"
          label="webhook"
          placeholder="钉钉的webhook"
          :rules="[{ required: true, message: '请填写webhook url' }]" />
      </CellGroup>
      <div style="margin: 16px">
        <Button round block type="primary" native-type="submit"> 提交 </Button>
      </div>
    </Form>
    <div style="margin: 16px" v-if="form.id">
      <Button round block type="danger" @click="submitUnbind">解绑</Button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.channel-page {
  .title {
    font-size: 28px;
    color: #999;
    padding: 30px;
  }
}
</style>
