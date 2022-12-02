<script setup>
import { onBeforeMount, onBeforeUnmount } from 'vue';
import { Tabbar, TabbarItem } from 'vant';
import { useStatusStore } from '@/stores/status';
import eventBus from '../utils/eventBus';

const statusStore = useStatusStore();
onBeforeMount(function () {
  eventBus.on('message', (msgs) => {
    if (msgs.some((v) => v.type !== 'ADD_FRIEND')) {
      statusStore.hasUnreadChatMsg = true;
    }
  });
});
onBeforeUnmount(function () {
  eventBus.off('message');
});
</script>

<template>
  <Tabbar route fixed>
    <TabbarItem
      replace
      to="/home"
      icon="friends-o"
      :dot="statusStore.hasUnreadChatMsg"
      >好友</TabbarItem
    >
    <TabbarItem replace to="/setting" icon="setting-o">设置</TabbarItem>
  </Tabbar>
</template>
