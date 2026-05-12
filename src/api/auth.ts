import request from './request'

export function login(code: string) {
  return request.post('/auth/login', { code })
}
