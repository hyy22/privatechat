<script setup>
import { ref, onMounted } from 'vue';
import { Image, Toast } from 'vant';
import config from '../config';
import { copyText, responsive } from '../utils';
import { useUserStore } from '../stores/user';

const userInfo = ref({});

function handleUidClick(text) {
  copyText(text);
  Toast('复制成功');
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
            alt="" />
          <div class="text">
            <div class="nick">
              {{ userInfo.userName }}
            </div>
            <div class="uid" @click="handleUidClick(userInfo.id)">
              id: <span>{{ userInfo.id }}</span>
            </div>
          </div>
        </div>
        <div class="me-info--bottom">
          {{ userInfo.signature || '暂无个性签名' }}
        </div>
      </div>
    </div>
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
  margin-top: 30px;
  padding: 20px;
  border-radius: 4px;
  background-color: rgba($color: #000000, $alpha: 0.02);
  color: #999;
}
</style>
