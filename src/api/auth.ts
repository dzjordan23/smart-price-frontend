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

export function silentAuth(redirectUri?: string) {
  return request.get('/auth/wx/silent-authorize', {
    params: { redirect_uri: redirectUri }
  })
}

export function refreshToken(refreshToken: string) {
  return request.post('/auth/refresh', { refreshToken })
}
