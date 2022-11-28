<script setup>
import { Tabbar, TabbarItem } from 'vant';

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
});
</script>

<template>
  <Tabbar :value="props.value" route fixed>
    <TabbarItem to="/" icon="home-o">首页</TabbarItem>
    <TabbarItem to="/me" icon="friends-o">我的</TabbarItem>
  </Tabbar>
</template>
