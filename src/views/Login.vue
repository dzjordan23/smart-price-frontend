<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/api/auth'
import { getProfile } from '@/api/user'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const testCode = ref('')
const loading = ref(false)

// H5 模拟登录（生产环境替换为微信 OAuth）
async function handleLogin() {
  if (!testCode.value.trim()) {
    showToast('请输入测试码')
    return
  }
  loading.value = true
  try {
    // 先尝试真实 API
    const res: any = await login(testCode.value)
    authStore.setToken(res.token || res.access_token || 'test-token')
    // 获取用户信息
    try {
      const profile = await getProfile()
      authStore.setUserInfo(profile)
    } catch {
      authStore.setUserInfo({ nickname: '测试用户', avatar: '' })
    }
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    // 如果 API 失败，用本地模拟登录（开发阶段）
    authStore.setToken('dev-token-' + Date.now())
    authStore.setUserInfo({
      id: 1,
      nickname: '开发者',
      avatar: '',
      phone: '138****8888',
    })
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
    showToast({ message: '已进入开发模式', type: 'success' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
    </div>

    <div class="login-content">
      <div class="logo-area">
        <div class="logo-icon">⚡</div>
        <h1 class="gradient-text">智选比价</h1>
        <p class="subtitle">AI 驱动的智能购物比价助手</p>
      </div>

      <div class="login-form card">
        <p class="form-hint">H5 开发模式</p>
        <van-field
          v-model="testCode"
          placeholder="输入任意测试码即可登录"
          type="text"
          size="large"
          clearable
          @keyup.enter="handleLogin"
        />
        <van-button
          type="primary"
          block
          round
          size="large"
          :loading="loading"
          loading-text="登录中..."
          class="login-btn"
          @click="handleLogin"
        >
          进入智选比价
        </van-button>
      </div>

      <p class="footer-text">登录即同意《用户协议》和《隐私政策》</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: $spacing-lg;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}
.orb-1 {
  width: 300px;
  height: 300px;
  background: $color-primary;
  top: -100px;
  right: -50px;
}
.orb-2 {
  width: 250px;
  height: 250px;
  background: $color-secondary;
  bottom: -80px;
  left: -60px;
}

.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 380px;
}

.logo-area {
  text-align: center;
  margin-bottom: 48px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: $spacing-md;
  filter: drop-shadow(0 0 20px $color-primary-glow);
}

h1 {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: $spacing-sm;
}

.subtitle {
  color: $text-secondary;
  font-size: $font-md;
}

.login-form {
  margin-bottom: $spacing-lg;
}

.form-hint {
  text-align: center;
  color: $text-muted;
  font-size: $font-sm;
  margin-bottom: $spacing-md;
}

.login-btn {
  margin-top: $spacing-lg;
  height: 50px;
  font-size: $font-lg;
  font-weight: 600;
  background: linear-gradient(135deg, $color-primary, $color-secondary);
  border: none;
  box-shadow: $shadow-glow;
}

.footer-text {
  text-align: center;
  color: $text-muted;
  font-size: $font-xs;
}
</style>
