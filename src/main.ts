import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 全局注册 Vant 组件
import Vant from 'vant'
import 'vant/lib/index.css'

import './styles/global.scss'
import './styles/transitions.scss'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(Vant)

// 初始化主题（在 mount 之前）
import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
themeStore.applyTheme()

app.mount('#app')
