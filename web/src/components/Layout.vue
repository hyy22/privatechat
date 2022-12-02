<script setup>
import Header from './Header.vue';
import FootBar from './FootBar.vue';
</script>

<template>
  <div class="layout-page">
    <Header />
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.path"></component>
      </transition>
    </router-view>
    <FootBar />
  </div>
</template>
