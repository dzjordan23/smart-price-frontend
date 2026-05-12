import axios from 'axios'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const API_BASE = import.meta.env.VITE_API_BASE || '/v1'

const request = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：注入 JWT
request.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => {
    const data = response.data
    // 后端统一响应格式: { code, message, data, timestamp }
    if (data.code !== 0 && data.code !== 200) {
      showToast({
        message: data.message || '请求失败',
        type: 'fail',
      })
      return Promise.reject(new Error(data.message))
    }
    return data.data !== undefined ? data.data : data
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        // Token 过期，清除登录态
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/login')
        showToast({ message: '登录已过期，请重新登录', type: 'fail' })
      } else {
        showToast({ message: error.response.data?.message || `请求失败(${status})`, type: 'fail' })
      }
    } else {
      showToast({ message: '网络连接失败', type: 'fail' })
    }
    return Promise.reject(error)
  },
)

export default request
