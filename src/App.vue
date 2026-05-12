<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Tabbar, TabbarItem } from 'vant'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <transition name="fade-slide" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>

  <Tabbar v-if="$route.meta.requiresAuth" route class="tabbar">
    <TabbarItem to="/" icon="search" name="home">首页</TabbarItem>
    <TabbarItem to="/recognize" icon="photograph" name="recognize">识别</TabbarItem>
    <TabbarItem to="/watchlist" icon="bell" name="watchlist">提醒</TabbarItem>
    <TabbarItem to="/profile" icon="user-o" name="profile">我的</TabbarItem>
  </Tabbar>
</template>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: rgba(10, 14, 26, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid $border-color;
  padding-bottom: $safe-bottom;
  z-index: 100;
}
</style>
