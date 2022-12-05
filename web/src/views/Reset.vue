<script setup>
import { reactive } from 'vue';
import { Form, CellGroup, Field, Button, Toast } from 'vant';
import { useRouter } from 'vue-router';
import md5 from 'md5';
import SubLayout from '@/components/SubLayout.vue';
import request from '@/utils/request';

const router = useRouter();
const form = reactive({
  password: '',
  newPassword: '',
  repeatNewPassword: '',
});
async function handleSubmit() {
  const result = await request({
    url: '/reset_password',
    data: {
      password: md5(form.password),
      newPassword: md5(form.newPassword),
    },
  });
  if (result.code === 0) {
    Toast('密码修改成功');
    setTimeout(() => router.back(), 1000);
    return;
  }
  Toast(result.message);
}
</script>

<template>
  <SubLayout title="修改密码">
    <div class="reset-page">
      <Form @submit="handleSubmit">
        <CellGroup inset>
          <Field
            v-model.trim="form.password"
            type="password"
            placeholder="原密码"
            label="原密码"
            :rules="[{ required: true, message: '请填写密码' }]" />
          <Field
            v-model.trim="form.newPassword"
            type="password"
            placeholder="新密码"
            label="新密码"
            :rules="[{ required: true, message: '请填写密码' }]" />
          <Field
            v-model.trim="form.repeatNewPassword"
            type="password"
            placeholder="再次输入新密码"
            label="确认新密码"
            :rules="[
              {
                validator: (val) => val === form.newPassword,
                message: '两次密码不一致',
              },
            ]" />
        </CellGroup>
        <div style="margin: 16px">
          <Button round block type="primary" native-type="submit">提交</Button>
        </div>
      </Form>
    </div>
  </SubLayout>
</template>
