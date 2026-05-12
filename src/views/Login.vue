<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const testCode = ref('')
const loading = ref(false)

// 检查是否在微信浏览器中
function isWxBrowser() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

// 处理微信 OAuth 回调
async function handleWxCallback() {
  const code = route.query.code as string
  const state = route.query.state as string

  if (code) {
    showLoadingToast({ message: '微信授权中...', duration: 0 })
    try {
      const success = await authStore.wxLogin(code)
      closeToast()
      if (success) {
        showToast({ message: '登录成功', type: 'success' })
        const redirect = (route.query.redirect as string) || '/'
        router.replace(redirect)
      } else {
        showToast({ message: '授权失败，请重试', type: 'fail' })
      }
    } catch (error) {
      closeToast()
      showToast({ message: '授权失败，请重试', type: 'fail' })
    }
  }
}

// 微信环境下发起静默授权
async function initWxAuth() {
  if (!isWxBrowser()) return

  const code = route.query.code as string
  if (code) {
    // 已经有 code，处理回调
    await handleWxCallback()
  } else {
    // 没有 code，发起静默授权
    showLoadingToast({ message: '正在跳转微信授权...', duration: 0 })
    try {
      const res: any = await import('@/api/auth').then(m => m.silentAuth(window.location.href.split('?')[0]))
      closeToast()
      if (res?.authorizeUrl) {
        window.location.href = res.authorizeUrl
      }
    } catch (error) {
      closeToast()
      console.warn('微信授权跳转失败，使用开发模式')
    }
  }
}

// 开发模式登录
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
      await authStore.fetchUserInfo()
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

onMounted(() => {
  // 检测微信环境
  if (isWxBrowser()) {
    initWxAuth()
  }
})
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

      <!-- 微信浏览器中显示授权提示 -->
      <div v-if="isWxBrowser()" class="wx-tip card">
        <van-icon name="wechat" size="32" color="#07c160" />
        <p>正在使用微信授权登录...</p>
      </div>

      <!-- 开发模式登录表单 -->
      <div v-else class="login-form card">
        <p class="form-hint">H5 开发模式</p>
        <van-field
          v-model="testCode"
          placeholder="输入任意测试码即可登录"
          type="text"
          size="large"
          clearable
          class="login-field"
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
  background: var(--color-primary);
  top: -100px;
  right: -50px;
}
.orb-2 {
  width: 250px;
  height: 250px;
  background: var(--color-secondary);
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
  filter: drop-shadow(0 0 20px var(--color-primary-glow));
}

h1 {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: $spacing-sm;
}

.subtitle {
  color: var(--text-secondary);
  font-size: $font-md;
}

.wx-tip {
  text-align: center;
  padding: $spacing-xl;

  p {
    margin-top: $spacing-md;
    color: var(--text-secondary);
    font-size: $font-md;
  }
}

.login-form {
  margin-bottom: $spacing-lg;
}

.login-field {
  background: var(--bg-input) !important;
  border: 1px solid var(--border-color);
  border-radius: $radius-md;
  margin-bottom: $spacing-md;
  padding: 4px $spacing-md;

  :deep(.van-field__control) {
    color: var(--text-primary) !important;
    font-size: $font-lg;
    caret-color: var(--color-primary);

    &::placeholder {
      color: var(--text-muted) !important;
    }
  }
}

.form-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: $font-sm;
  margin-bottom: $spacing-md;
}

.login-btn {
  margin-top: $spacing-lg;
  height: 50px;
  font-size: $font-lg;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
  box-shadow: 0 0 20px var(--color-primary-glow);
}

.footer-text {
  text-align: center;
  color: var(--text-muted);
  font-size: $font-xs;
}
</style>
