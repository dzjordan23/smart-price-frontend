import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '智选比价', requiresAuth: true },
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/views/Community.vue'),
    meta: { title: '社群互动', requiresAuth: true },
  },
  {
    path: '/commission',
    name: 'Commission',
    component: () => import('@/views/Commission.vue'),
    meta: { title: '返利中心', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '我的', requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '账号设置', requiresAuth: true },
  },
  {
    path: '/recognize',
    name: 'Recognize',
    component: () => import('@/views/Recognize.vue'),
    meta: { title: '商品识别', requiresAuth: true },
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('@/views/Compare.vue'),
    meta: { title: '比价结果', requiresAuth: true },
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue'),
    meta: { title: '商品详情', requiresAuth: true },
  },
  {
    path: '/watchlist',
    name: 'WatchList',
    component: () => import('@/views/WatchList.vue'),
    meta: { title: '降价提醒', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && authStore.isLoggedIn) {
    next({ name: 'Home' })
  } else {
    next()
  }
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} | 智选比价`
  }
})

export default router
