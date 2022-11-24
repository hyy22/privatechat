<script setup>
import { reactive, ref } from 'vue';
import { Form, Field, CellGroup, Button, Uploader, Toast, Dialog } from 'vant';
import { imgOptimizate, deepCopy, saveFile } from '@/utils';
import request from '@/utils/request';
import md5 from 'md5';
import { useRouter } from 'vue-router';
import { useRsaStore } from '@/stores/rsa';
import config from '@/config';

const router = useRouter();
const rsaStore = useRsaStore();
const form = reactive({
  userName: '',
  password: '',
  repeatPassword: '',
  avatar: '',
  signature: '',
});
// 头像预览列表
const avatarList = ref([]);

function handleUploadBeforeRead(file) {
  if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) {
    Toast('请上传 jpg 格式图片');
    return false;
  }
  if (file.size > 500 * 1024) {
    Toast('图片不能大于500kb');
    return false;
  }
  return true;
}

async function handleUploadAfterRead({ file }) {
  // 压缩图片
  const transfile = await imgOptimizate({ img: file, size: 300 });
  // 上传
  const formData = new FormData();
  formData.append('avatar', transfile);
  const result = await request({
    url: '/upload',
    data: formData,
    loading: true,
  });
  const avatarUrl = `${config.BASE_URL}/${result.data.files[0]}`;
  avatarList.value = [{ url: avatarUrl }];
  form.avatar = avatarUrl;
}

async function handleRsaKeys() {
  await Dialog.confirm({
    title: '说明',
    message:
      '请生成秘钥，私钥不会存储到服务器，丢失将无法解密消息，请自行保存不要泄漏',
    confirmButtonText: '生成并下载私钥',
  });
  rsaStore.updateRsaKeys();
  // 下载私钥文件
  const privateFile = new Blob([rsaStore.privateKey], {
    type: 'text/plain',
  });
  saveFile(privateFile, 'private_key.txt');
}

async function onSubmit() {
  if (!rsaStore.publicKey || !rsaStore.privateKey) {
    handleRsaKeys();
    return;
  }
  const data = deepCopy(form);
  delete data.repeatPassword;
  data.password = md5(form.password);
  data.publicKey = rsaStore.publicKey;
  const result = await request({
    url: '/register',
    data,
    loading: true,
  });
  if (result.code === 0) {
    Toast('注册成功，即将跳转登录页');
    setTimeout(() => {
      router.push('/login');
    }, 1000);
    return;
  }
  Toast(result.message);
}
</script>

<template>
  <Form @submit="onSubmit" class="register">
    <CellGroup inset>
      <Field
        v-model="form.userName"
        label="用户名"
        placeholder="用户名"
        :rules="[{ required: true, message: '请填写用户名' }]" />
      <Field
        v-model="form.password"
        type="password"
        label="密码"
        placeholder="密码"
        :rules="[{ required: true, message: '请填写密码' }]" />
      <Field
        v-model="form.repeatPassword"
        type="password"
        label="确认密码"
        placeholder="请再次输入密码"
        :rules="[
          {
            validator: (val) => val === form.password,
            message: '两次密码不一致',
          },
        ]" />
      <Field label="头像">
        <template #input>
          <Uploader
            v-model="avatarList"
            accept=".jpg,.jpeg,.png,.gif"
            :before-read="handleUploadBeforeRead"
            :after-read="handleUploadAfterRead"></Uploader>
        </template>
      </Field>
      <Field
        v-model="form.signature"
        autosize
        maxlength="200"
        show-word-limit
        type="textarea"
        label="个人签名"
        placeholder="请输入个人签名" />
    </CellGroup>
    <div style="margin: 16px">
      <Button round block type="primary" native-type="submit">注册</Button>
    </div>
    <p class="tip">已有账号？<a href="/login">点此登录</a></p>
  </Form>
</template>

<style lang="scss">
.register {
  .tip {
    text-align: center;
    a {
      color: inherit;
    }
  }
}
</style>
