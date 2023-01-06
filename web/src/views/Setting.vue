<script setup>
import { ref, onMounted, reactive } from 'vue';
import { Image, Toast, ActionSheet, Icon, Dialog, Field, Button } from 'vant';
import { useRouter } from 'vue-router';
import config from '../config';
import {
  copyText,
  responsive,
  imgOptimizate,
  saveFile,
  readFileData,
} from '../utils';
import uploadFile, { buildFileInput } from '../utils/upload';
import { useUserStore } from '../stores/user';
import { useDbStore } from '../stores/db';
import request from '../utils/request';
import { exportDBDataAsJSON, importDBData } from '../utils/indexdb';

// 弹窗组件
const DialogComponent = Dialog.Component;
const userInfo = ref({});
const router = useRouter();

function handleUidClick(text) {
  copyText(text);
  Toast('复制成功');
}
/**
 * 更改信息
 */
// 头像
const CHANGE_AVATAR = '更换头像';
const actionSheetBar = reactive({
  visible: false,
  actions: [{ name: CHANGE_AVATAR }],
});
async function submitUpdateInfo(info) {
  const result = await request({
    url: '/update_user_info',
    data: info,
    loading: true,
  });
  if (result.code !== 0) {
    return Toast(result.message);
  }
  return true;
}
async function handleActionSheetSelect({ name }) {
  if (name === CHANGE_AVATAR) {
    try {
      // 上传头像
      const avatar = await uploadFile({
        accept: 'image/*',
        beforeUpload: async (file) => {
          await imgOptimizate({ img: file, size: 300 });
          return true;
        },
      });
      // 更新信息
      const success = await submitUpdateInfo({ ...userInfo.value, avatar });
      if (success) {
        userInfo.value.avatar = avatar;
        actionSheetBar.visible = false;
      }
    } catch (e) {
      Toast(e.message);
    }
  }
}
// 签名
const signatureModal = reactive({
  visible: false,
  text: '',
});
function showSignatureModal() {
  signatureModal.visible = true;
  signatureModal.text = userInfo.value.signature;
}
async function handleSubmitSignatureModal() {
  const signature = signatureModal.text.trim();
  if (!signatureModal) return;
  const pass = await submitUpdateInfo({ ...userInfo.value, signature });
  if (pass) {
    userInfo.value.signature = signature;
    signatureModal.visible = false;
  }
}

// 跳转
function handleJumpUrl(url) {
  router.push(url);
}
// 导出数据
async function exportDB() {
  Toast.loading({
    duration: 0,
    forbidClick: true,
    message: '导出中...请勿刷新页面',
  });
  const db = useDbStore().db;
  const result = await exportDBDataAsJSON(db);
  const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
  Toast.clear();
  saveFile(blob, `chat_backup_${Date.now()}.json`);
}
// 导入数据
async function importDB() {
  buildFileInput({
    accept: 'application/json',
    onChange: async function (e) {
      const [file] = [...e.target.files];
      if (!file) return;
      Toast.loading({
        duration: 0,
        forbidClick: true,
        message: '数据导入中...请勿刷新页面',
      });
      const data = await readFileData(file, 'readAsText');
      const db = useDbStore().db;
      try {
        const jsonObject = JSON.parse(data);
        await importDBData(db, jsonObject);
        Toast.clear();
        Toast('导入成功！');
      } catch (e) {
        Toast.clear();
        Toast('数据导入失败！');
      }
    },
  });
}
// 开发中
// eslint-disable-next-line no-unused-vars
function building() {
  Toast('功能开发中...');
}

onMounted(function () {
  const userStore = useUserStore();
  userInfo.value = userStore.userInfo;
});
</script>

<template>
  <div class="me">
    <div class="me-wrapper">
      <div class="me-info">
        <div class="me-info--top">
          <Image
            class="avatar"
            :width="responsive(140)"
            :height="responsive(140)"
            radius="5px"
            :src="userInfo.avatar || config.DEFAULT_AVATAR_URL"
            alt=""
            @click="actionSheetBar.visible = true" />
          <div class="text">
            <div class="nick">
              {{ userInfo.userName }}
            </div>
            <div class="uid" @click="handleUidClick(userInfo.id)">
              id: <span>{{ userInfo.id }}</span>
            </div>
          </div>
        </div>
        <div class="me-info--bottom" @click="showSignatureModal">
          <span>{{ userInfo.signature || '暂无个性签名' }}</span>
          <Icon name="edit" color="var(--primary-color)" />
        </div>
      </div>
      <!-- 九宫格 -->
      <div class="settings">
        <div class="setting-item" @click="handleJumpUrl('/reset')">
          <div class="setting-item__title">修改密码</div>
          <div class="setting-item__desc">修改登录密码</div>
        </div>
        <div class="setting-item" @click="exportDB">
          <div class="setting-item__title">消息导出</div>
          <div class="setting-item__desc">导出聊天记录</div>
        </div>
        <div class="setting-item" @click="importDB">
          <div class="setting-item__title">消息导入</div>
          <div class="setting-item__desc">导入聊天记录</div>
        </div>
        <div class="setting-item" @click="handleJumpUrl('/channel')">
          <div class="setting-item__title">钉钉提醒</div>
          <div class="setting-item__desc">关联钉钉机器人</div>
        </div>
      </div>
    </div>
    <teleport to="body">
      <ActionSheet
        v-model:show="actionSheetBar.visible"
        :actions="actionSheetBar.actions"
        cancel-text="取消"
        @select="handleActionSheetSelect"></ActionSheet>
      <DialogComponent
        v-model:show="signatureModal.visible"
        title="修改签名"
        :show-confirm-button="false"
        close-on-click-overlay>
        <Field
          v-model.trim="signatureModal.text"
          type="textarea"
          :rows="2"
          autosize
          maxlength="200"
          show-word-limit></Field>
        <Button type="primary" size="large" @click="handleSubmitSignatureModal"
          >确认</Button
        >
      </DialogComponent>
    </teleport>
  </div>
</template>

<style lang="scss" scoped>
.me-wrapper {
  margin-bottom: 130px;
}
.me-info {
  padding: 30px;
}
.me-info--top {
  display: flex;
  align-items: center;
  .avatar {
    flex: none;
    margin-right: 30px;
  }
  .text {
    flex: auto;
    min-width: 0;
  }
  .nick {
    font-size: 30px;
    margin-bottom: 20px;
  }
  .uid {
    span {
      color: var(--van-primary-color);
    }
  }
}
.me-info--bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding: 20px;
  border-radius: 4px;
  background-color: rgba($color: #000000, $alpha: 0.02);
  color: #999;
  span {
    margin-right: 20px;
  }
}
.settings {
  padding: 30px;
  display: flex;
  flex-wrap: wrap;
}
.setting-item {
  flex: none;
  width: 210px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  box-sizing: border-box;
  box-shadow: 0px 0px 8px 0px rgba($color: #000000, $alpha: 0.1);
  margin: 0 30px 30px 0;
  .setting-item__title {
    font-size: 26px;
  }
  .setting-item__desc {
    margin-top: 10px;
    color: #999;
  }
  &:nth-child(3n) {
    margin-right: 0;
  }
}
</style>
