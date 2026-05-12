import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, handleWxCallback, silentAuth, refreshToken } from '@/api/auth'
import { getProfile } from '@/api/user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('smart_price_token') || '')
  const refreshTokenValue = ref(localStorage.getItem('smart_price_refresh_token') || '')
  const userInfo = ref<any>(null)
  const isWxBrowser = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  // 检测是否在微信浏览器中
  function checkWxBrowser() {
    const ua = navigator.userAgent.toLowerCase()
    isWxBrowser.value = ua.includes('micromessenger')
    return isWxBrowser.value
  }

  // 设置 token
  function setToken(t: string, refresh?: string) {
    token.value = t
    localStorage.setItem('smart_price_token', t)
    if (refresh) {
      refreshTokenValue.value = refresh
      localStorage.setItem('smart_price_refresh_token', refresh)
    }
  }

  // 设置用户信息
  function setUserInfo(info: any) {
    userInfo.value = info
  }

  // 微信 OAuth 登录
  async function wxLogin(code: string) {
    try {
      const res: any = await handleWxCallback(code)
      if (res.token) {
        setToken(res.token, res.refreshToken)
        await fetchUserInfo()
        return true
      }
      return false
    } catch (error) {
      console.error('微信登录失败:', error)
      return false
    }
  }

  // 静默授权（获取 openid）
  async function wxSilentAuth(redirectUri?: string) {
    try {
      const res: any = await silentAuth(redirectUri)
      if (res.authorizeUrl) {
        // 跳转到微信授权页面
        window.location.href = res.authorizeUrl
        return true
      }
      return false
    } catch (error) {
      console.error('静默授权失败:', error)
      return false
    }
  }

  // 获取用户信息
  async function fetchUserInfo() {
    try {
      const profile = await getProfile()
      setUserInfo(profile)
    } catch (error) {
      console.warn('获取用户信息失败:', error)
    }
  }

  // 刷新 token
  async function handleRefreshToken() {
    if (!refreshTokenValue.value) return false
    try {
      const res: any = await refreshToken(refreshTokenValue.value)
      if (res.token) {
        setToken(res.token, res.refreshToken)
        return true
      }
      return false
    } catch (error) {
      console.error('刷新 token 失败:', error)
      logout()
      return false
    }
  }

  // 退出登录
  function logout() {
    token.value = ''
    refreshTokenValue.value = ''
    userInfo.value = null
    localStorage.removeItem('smart_price_token')
    localStorage.removeItem('smart_price_refresh_token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isWxBrowser,
    checkWxBrowser,
    setToken,
    setUserInfo,
    wxLogin,
    wxSilentAuth,
    fetchUserInfo,
    handleRefreshToken,
    logout,
  }
})
