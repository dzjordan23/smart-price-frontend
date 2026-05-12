<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getProfile, getCommissions } from '@/api/user'

const router = useRouter()
const authStore = useAuthStore()

const profile = ref<any>(null)
const commissions = ref<any[]>([])
const loading = ref(true)

// 功能菜单
const menuItems = [
  { icon: '📋', label: '返利记录', route: '' },
  { icon: '🔔', label: '降价提醒', route: '/watchlist' },
  { icon: '⚙️', label: '设置', route: '' },
  { icon: '❓', label: '帮助与反馈', route: '' },
]

onMounted(async () => {
  try {
    const p = await getProfile()
    profile.value = p
    authStore.setUserInfo(p)
  } catch {
    profile.value = authStore.userInfo || { nickname: '开发者', avatar: '' }
  }

  try {
    const data: any = await getCommissions()
    commissions.value = data?.items || data?.list || data || []
  } catch {
    commissions.value = [
      { id: 1, productName: 'iPhone 16 Pro', amount: 45.00, status: 'pending', createdAt: '2026-05-10' },
      { id: 2, productName: 'AirPods Pro', amount: 12.50, status: 'completed', createdAt: '2026-05-08' },
    ]
  }
  loading.value = false
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="page profile-page">
    <!-- 用户信息卡片 -->
    <div class="profile-header card glow-border">
      <div class="avatar">
        <template v-if="profile?.avatar">
          <img :src="profile.avatar" />
        </template>
        <template v-else>
          <van-icon name="user-o" size="36" color="var(--text-secondary)" />
        </template>
      </div>
      <div class="user-info">
        <h3 class="nickname">{{ profile?.nickname || '未登录' }}</h3>
        <p class="phone">{{ profile?.phone || '点击完善信息' }}</p>
      </div>
      <van-button
        size="mini"
        round
        plain
        type="danger"
        @click="handleLogout"
      >
        退出
      </van-button>
    </div>

    <!-- 数据概览 -->
    <div class="stats-row">
      <div class="stat-item card">
        <div class="stat-value">¥{{ commissions.reduce((s, c) => s + (c.amount || 0), 0).toFixed(2) }}</div>
        <div class="stat-label">累计返利</div>
      </div>
      <div class="stat-item card">
        <div class="stat-value">{{ commissions.filter(c => c.status === 'pending').length }}</div>
        <div class="stat-label">待结算</div>
      </div>
      <div class="stat-item card">
        <div class="stat-value">{{ commissions.length }}</div>
        <div class="stat-label">总订单</div>
      </div>
    </div>

    <!-- 返利记录 -->
    <div class="section">
      <h3 class="section-title"><span class="dot"></span>最近返利</h3>
      <div v-for="item in commissions" :key="item.id" class="commission-item card">
        <div class="comm-info">
          <div class="comm-name">{{ item.productName }}</div>
          <div class="comm-date">{{ item.createdAt }}</div>
        </div>
        <div class="comm-amount">
          +¥{{ item.amount?.toFixed(2) }}
          <van-tag
            :type="item.status === 'completed' ? 'success' : 'warning'"
            size="small"
            round
            style="margin-left: 8px;"
          >
            {{ item.status === 'completed' ? '已到账' : '待结算' }}
          </van-tag>
        </div>
      </div>
      <van-empty v-if="commissions.length === 0" description="暂无返利记录" />
    </div>

    <!-- 功能菜单 -->
    <div class="section">
      <h3 class="section-title"><span class="dot"></span>更多功能</h3>
      <van-cell-group inset class="menu-group">
        <van-cell
          v-for="item in menuItems"
          :key="item.label"
          :title="item.label"
          is-link
          :icon="item.icon"
          @click="item.route ? $router.push(item.route) : null"
        />
      </van-cell-group>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  padding-top: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: $bg-card;
  border: 2px solid $border-glow;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: $font-lg;
  font-weight: 600;
  margin-bottom: 2px;
}

.phone {
  color: $text-secondary;
  font-size: $font-sm;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
  margin-bottom: $spacing-xl;
}

.stat-item {
  text-align: center;
  padding: $spacing-md $spacing-sm;
}

.stat-value {
  font-size: $font-xl;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: $spacing-xs;
}

.stat-label {
  font-size: $font-xs;
  color: $text-secondary;
}

.section {
  margin-bottom: $spacing-xl;
}

.section-title {
  font-size: $font-lg;
  font-weight: 600;
  margin-bottom: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .dot {
    width: 4px;
    height: 18px;
    background: $color-primary;
    border-radius: 2px;
  }
}

.commission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comm-name {
  font-size: $font-md;
  font-weight: 500;
}

.comm-date {
  font-size: $font-xs;
  color: $text-muted;
  margin-top: 2px;
}

.comm-amount {
  font-size: $font-lg;
  font-weight: 700;
  color: $color-success;
  display: flex;
  align-items: center;
}

.menu-group {
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  border: 1px solid $border-color;

  :deep(.van-cell) {
    background: transparent;
    color: $text-primary;

    &::after {
      border-color: $border-color;
    }
  }
}
</style>
