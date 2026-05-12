<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <transition name="fade-slide" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>

  <van-tabbar v-if="$route.meta.requiresAuth" route class="app-tabbar">
    <van-tabbar-item to="/" icon="search" name="home">智选比价</van-tabbar-item>
    <van-tabbar-item to="/community" icon="chat-o" name="community">社群互动</van-tabbar-item>
    <van-tabbar-item to="/commission" icon="balance-o" name="commission">返利中心</van-tabbar-item>
    <van-tabbar-item to="/profile" icon="user-o" name="profile">我的</van-tabbar-item>
  </van-tabbar>
</template>

<style lang="scss" scoped>
.app-tabbar {
  max-width: 480px;
  left: 50% !important;
  transform: translateX(-50%);
  border-top: 1px solid var(--border-color);
  padding-bottom: $safe-bottom !important;
}
</style>
