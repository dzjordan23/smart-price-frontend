<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore, type ThemeName } from '@/stores/theme'
import { getProfile } from '@/api/user'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const profile = ref<any>(null)
const loading = ref(true)

// 主题配置
const themeOptions: { name: ThemeName; label: string; colors: string[] }[] = [
  { name: 'blue', label: '天空蓝', colors: ['#f0f5ff', '#2b7de9', '#5b9cf6'] },
  { name: 'pink', label: '樱花粉', colors: ['#fff5f8', '#e8538a', '#f78bb5'] },
  { name: 'white', label: '简约白', colors: ['#f5f7fa', '#3b82f6', '#6366f1'] },
]

function handleThemeChange(name: ThemeName) {
  themeStore.setTheme(name)
}

// 功能菜单
const menuItems = [
  { icon: '🔗', label: '账号绑定', route: '/settings' },
  { icon: '🔔', label: '降价提醒', route: '/watchlist' },
  { icon: '⚙️', label: '系统设置', route: '' },
  { icon: '❓', label: '帮助与反馈', route: '' },
]

onMounted(async () => {
  try {
    const p = await getProfile()
    profile.value = p
    authStore.setUserInfo(p)
  } catch {
    profile.value = authStore.userInfo || { nickname: '未登录', avatar: '' }
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
    <div class="profile-header card">
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

    <!-- 主题选择 -->
    <div class="section">
      <h3 class="section-title"><span class="dot"></span>主题风格</h3>
      <div class="theme-list">
        <div
          v-for="theme in themeOptions"
          :key="theme.name"
          class="theme-item card"
          :class="{ active: themeStore.currentTheme === theme.name }"
          @click="handleThemeChange(theme.name)"
        >
          <div class="theme-preview">
            <span
              v-for="(color, i) in theme.colors"
              :key="i"
              class="color-dot"
              :style="{ background: color }"
            />
          </div>
          <span class="theme-label">{{ theme.label }}</span>
          <van-icon v-if="themeStore.currentTheme === theme.name" name="success" class="check-icon" />
        </div>
      </div>
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
  background: var(--bg-input);
  border: 2px solid var(--border-glow);
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
  color: var(--text-secondary);
  font-size: $font-sm;
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
    background: var(--color-primary);
    border-radius: 2px;
  }
}

// 主题选择
.theme-list {
  display: flex;
  gap: $spacing-md;
}

.theme-item {
  flex: 1;
  padding: $spacing-md;
  cursor: pointer;
  text-align: center;
  position: relative;
  border: 2px solid transparent;
  transition: all $transition-normal;

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 20px var(--color-primary-glow);
  }

  &:active {
    transform: scale(0.95);
  }
}

.theme-preview {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-bottom: $spacing-sm;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(128, 128, 128, 0.2);
}

.theme-label {
  font-size: $font-sm;
  color: var(--text-secondary);
  font-weight: 500;
}

.check-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  color: var(--color-primary);
  font-size: 16px;
}

// 菜单
.menu-group {
  border-radius: $radius-lg;
  overflow: hidden;
  border: 1px solid var(--border-color);

  :deep(.van-cell) {
    background: transparent;
    color: var(--text-primary);

    &::after {
      border-color: var(--border-color);
    }
  }
}
</style>
