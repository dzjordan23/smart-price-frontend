import request from './request'

export function login(code: string) {
  return request.post('/auth/login', { code })
}

// 微信 OAuth 相关接口
export function getWxAuthorizeUrl(redirectUri?: string) {
  return request.get('/auth/wx/authorize-url', {
    params: { redirect_uri: redirectUri }
  })
}

export function handleWxCallback(code: string, state?: string) {
  return request.get('/auth/wx/callback', {
    params: { code, state }
  })
}

// 获取静默授权 URL（微信内网页授权）
export function silentAuth(redirectUri?: string) {
  return request.get('/auth/wx/silent-authorize', {
    params: { redirect_uri: redirectUri }
  })
}

// 处理静默授权回调（前端使用此方法处理授权后跳转）
export async function handleSilentAuthCallback(code: string, state?: string) {
  try {
    const result = await handleWxCallback(code, state)
    return result
  } catch (error) {
    console.error('静默授权回调处理失败:', error)
    throw error
  }
}

// 检查是否在微信浏览器中
export function isWxBrowser() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

// 获取当前页面 URL（去掉查询参数）
export function getCurrentPageUrl() {
  return window.location.href.split('?')[0]
}

export function refreshToken(refreshToken: string) {
  return request.post('/auth/refresh', { refreshToken })
}
