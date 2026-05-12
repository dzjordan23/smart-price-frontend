<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { showToast } from 'vant'

const router = useRouter()
const authStore = useAuthStore()

// 平台绑定状态（mock）
const platforms = ref([
  { id: 'jd', name: '京东', icon: '#e4393c', bound: true, account: '138****8888', bindTime: '2026-04-15' },
  { id: 'tb', name: '淘宝/天猫', icon: '#ff5722', bound: false, account: '', bindTime: '' },
  { id: 'pdd', name: '拼多多', icon: '#e02e24', bound: false, account: '', bindTime: '' },
])

function handleBind(platform: any) {
  if (platform.bound) {
    showToast({ message: '已解除绑定（开发模式）', type: 'success' })
    platform.bound = false
    platform.account = ''
    platform.bindTime = ''
  } else {
    showToast({ message: '绑定成功（开发模式）', type: 'success' })
    platform.bound = true
    platform.account = '138****8888'
    platform.bindTime = new Date().toISOString().slice(0, 10)
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="page settings-page">
    <van-nav-bar title="账号设置" left-arrow :border="false" class="nav-bar" @click-left="$router.back()" />

    <div class="section">
      <h3 class="section-title"><span class="dot"></span>电商平台绑定</h3>
      <p class="section-desc">绑定平台账号后，可同步收藏夹、优惠券和订单信息</p>
    </div>

    <div v-for="platform in platforms" :key="platform.id" class="platform-card card">
      <div class="platform-header">
        <div class="platform-icon" :style="{ background: platform.icon }">
          {{ platform.name.charAt(0) }}
        </div>
        <div class="platform-info">
          <h4 class="platform-name">{{ platform.name }}</h4>
          <span v-if="platform.bound" class="platform-account">
            已绑定：{{ platform.account }}
          </span>
          <span v-else class="platform-account muted">未绑定</span>
        </div>
        <van-tag :type="platform.bound ? 'success' : 'default'" round size="small">
          {{ platform.bound ? '已绑定' : '去绑定' }}
        </van-tag>
      </div>
      <div v-if="platform.bound" class="platform-detail">
        <span>绑定时间：{{ platform.bindTime }}</span>
      </div>
      <van-button
        size="small"
        round
        plain
        :type="platform.bound ? 'danger' : 'primary'"
        class="bind-btn"
        @click="handleBind(platform)"
      >
        {{ platform.bound ? '解除绑定' : '立即绑定' }}
      </van-button>
    </div>

    <div class="section" style="margin-top: 32px;">
      <van-button
        block
        round
        plain
        type="danger"
        size="large"
        @click="handleLogout"
      >
        退出登录
      </van-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-page {
  padding-top: 8px;
}

.nav-bar {
  margin: (-$spacing-md) (-$spacing-md) $spacing-md;
}

.section {
  margin-bottom: $spacing-lg;
}

.section-title {
  font-size: $font-lg;
  font-weight: 600;
  margin-bottom: $spacing-xs;
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .dot {
    width: 4px;
    height: 18px;
    background: var(--color-primary);
    border-radius: 2px;
  }
}

.section-desc {
  font-size: $font-sm;
  color: var(--text-muted);
}

.platform-card {
  padding: $spacing-md;
  position: relative;
}

.platform-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-sm;
}

.platform-icon {
  width: 40px;
  height: 40px;
  border-radius: $radius-md;
  color: white;
  font-size: $font-lg;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.platform-info {
  flex: 1;
}

.platform-name {
  font-size: $font-md;
  font-weight: 600;
  margin-bottom: 2px;
}

.platform-account {
  font-size: $font-xs;
  color: var(--text-secondary);
  &.muted { color: var(--text-muted); }
}

.platform-detail {
  font-size: $font-xs;
  color: var(--text-muted);
  margin-bottom: $spacing-sm;
  padding-left: 56px;
}

.bind-btn {
  margin-left: auto;
  display: block;
}
</style>
