import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeName = 'blue' | 'pink' | 'white'

export interface ThemeColors {
  primary: string
  secondary: string
  primaryGlow: string
  bgPrimary: string
  bgSecondary: string
  bgCard: string
  bgCardHover: string
  bgInput: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  textAccent: string
  border: string
  borderGlow: string
  success: string
  warning: string
  danger: string
  up: string
  down: string
}

const themes: Record<ThemeName, ThemeColors> = {
  blue: {
    primary: '#2b7de9',
    secondary: '#5b9cf6',
    primaryGlow: 'rgba(43, 125, 233, 0.15)',
    bgPrimary: '#f0f5ff',
    bgSecondary: '#ffffff',
    bgCard: 'rgba(255, 255, 255, 0.92)',
    bgCardHover: 'rgba(240, 245, 255, 0.95)',
    bgInput: 'rgba(43, 125, 233, 0.06)',
    textPrimary: '#1a2a44',
    textSecondary: '#5a6d85',
    textMuted: '#94a3b8',
    textAccent: '#2b7de9',
    border: 'rgba(43, 125, 233, 0.1)',
    borderGlow: 'rgba(43, 125, 233, 0.2)',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    up: '#ef4444',
    down: '#22c55e',
  },
  pink: {
    primary: '#e8538a',
    secondary: '#f78bb5',
    primaryGlow: 'rgba(232, 83, 138, 0.15)',
    bgPrimary: '#fff5f8',
    bgSecondary: '#ffffff',
    bgCard: 'rgba(255, 255, 255, 0.92)',
    bgCardHover: 'rgba(255, 245, 248, 0.95)',
    bgInput: 'rgba(232, 83, 138, 0.06)',
    textPrimary: '#3d1a2a',
    textSecondary: '#855a6d',
    textMuted: '#b894a3',
    textAccent: '#e8538a',
    border: 'rgba(232, 83, 138, 0.1)',
    borderGlow: 'rgba(232, 83, 138, 0.2)',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    up: '#ef4444',
    down: '#22c55e',
  },
  white: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    primaryGlow: 'rgba(59, 130, 246, 0.15)',
    bgPrimary: '#f5f7fa',
    bgSecondary: '#ffffff',
    bgCard: 'rgba(255, 255, 255, 0.9)',
    bgCardHover: 'rgba(255, 255, 255, 0.95)',
    bgInput: 'rgba(0, 0, 0, 0.04)',
    textPrimary: '#1a1a2e',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    textAccent: '#3b82f6',
    border: 'rgba(0, 0, 0, 0.06)',
    borderGlow: 'rgba(59, 130, 246, 0.2)',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    up: '#ef4444',
    down: '#10b981',
  },
}

const cssVarMap: Record<keyof ThemeColors, string> = {
  primary: '--color-primary',
  secondary: '--color-secondary',
  primaryGlow: '--color-primary-glow',
  bgPrimary: '--bg-primary',
  bgSecondary: '--bg-secondary',
  bgCard: '--bg-card',
  bgCardHover: '--bg-card-hover',
  bgInput: '--bg-input',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  textAccent: '--text-accent',
  border: '--border-color',
  borderGlow: '--border-glow',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  up: '--color-up',
  down: '--color-down',
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeName>(
    (localStorage.getItem('smart_price_theme') as ThemeName) || 'blue',
  )

  const themeConfig = computed(() => themes[currentTheme.value])

  function setTheme(name: ThemeName) {
    currentTheme.value = name
    localStorage.setItem('smart_price_theme', name)
    applyTheme()
  }

  function applyTheme() {
    const root = document.documentElement
    const colors = themes[currentTheme.value]

    // 移除旧主题 class，添加新主题 class
    root.classList.remove('theme-blue', 'theme-pink', 'theme-white')
    root.classList.add(`theme-${currentTheme.value}`)

    // 设置 CSS custom properties
    for (const [key, cssVar] of Object.entries(cssVarMap)) {
      root.style.setProperty(cssVar, colors[key as keyof ThemeColors])
    }

    // 同步 Vant 变量
    root.style.setProperty('--van-background', colors.bgPrimary)
    root.style.setProperty('--van-background-2', colors.bgSecondary)
    root.style.setProperty('--van-text-color', colors.textPrimary)
    root.style.setProperty('--van-text-color-2', colors.textSecondary)
    root.style.setProperty('--van-text-color-3', colors.textMuted)
    root.style.setProperty('--van-border-color', colors.border)
    root.style.setProperty('--van-active-color', 'rgba(128, 128, 128, 0.05)')
    root.style.setProperty('--van-tabbar-background', colors.bgSecondary)
    root.style.setProperty('--van-tabbar-item-text-color', colors.textMuted)
    root.style.setProperty('--van-tabbar-item-active-color', colors.primary)
    root.style.setProperty('--van-field-input-text-color', colors.textPrimary)
    root.style.setProperty('--van-field-label-color', colors.textSecondary)
    root.style.setProperty('--van-field-placeholder-color', colors.textMuted)
    root.style.setProperty('--van-field-background', 'transparent')
    root.style.setProperty('--van-cell-background', 'transparent')
    root.style.setProperty('--van-cell-group-background', colors.bgInput)
    root.style.setProperty('--van-nav-bar-background', 'transparent')
    root.style.setProperty('--van-nav-bar-title-text-color', colors.textPrimary)
    root.style.setProperty('--van-nav-bar-icon-color', colors.textPrimary)
    root.style.setProperty('--van-button-primary-background', colors.primary)
    root.style.setProperty('--van-button-primary-border-color', colors.primary)

    // meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', colors.bgPrimary)
    }
  }

  return { currentTheme, themeConfig, setTheme, applyTheme }
})
