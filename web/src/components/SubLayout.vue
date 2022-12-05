<script setup>
import { useRouter } from 'vue-router';
import { NavBar } from 'vant';

const props = defineProps({
  title: String,
});
const router = useRouter();
</script>

<template>
  <div class="sub-layout">
    <NavBar
      class="nav-bar"
      :title="props.title"
      left-text="返回"
      left-arrow
      @click-left="router.back()" />
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.sub-layout {
  .nav-bar {
    position: sticky;
    top: 0;
    left: 0;
  }
}
</style>
