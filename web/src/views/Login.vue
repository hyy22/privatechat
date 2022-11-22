<script setup>
import { Form, Field, CellGroup, Button, Toast } from 'vant';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import request from '@/utils/request';
import md5 from 'md5';

const router = useRouter();
const form = reactive({
  userName: '',
  password: '',
});

async function onSubmit() {
  const result = await request({
    url: '/login',
    data: {
      userName: form.userName,
      password: md5(form.password),
    },
    loading: true,
  });
  if (result.code === 0) {
    Toast('登录成功');
    useUserStore().setToken(result.data);
    setTimeout(() => router.push({ path: '/' }), 1000);
    return;
  }
  Toast(result.message);
}
</script>

<template>
  <Form @submit="onSubmit" class="login">
    <CellGroup inset>
      <Field
        v-model="form.userName"
        name="用户名"
        label="用户名"
        placeholder="用户名"
        :rules="[{ required: true, message: '请填写用户名' }]" />
      <Field
        v-model="form.password"
        type="password"
        name="密码"
        label="密码"
        placeholder="密码"
        :rules="[{ required: true, message: '请填写密码' }]" />
    </CellGroup>
    <div style="margin: 16px">
      <Button round block type="primary" native-type="submit"> 登录 </Button>
    </div>
    <p class="tip">还没账号？<a href="/register">点此注册</a></p>
  </Form>
</template>

<style lang="scss">
.login {
  .tip {
    text-align: center;
    a {
      color: inherit;
    }
  }
}
</style>
