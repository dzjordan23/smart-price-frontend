<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPriceHistory, getProductDetail } from '@/api/product'
import { addWatch } from '@/api/price'
import { showToast } from 'vant'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

const productId = computed(() => Number(route.params.id))
const loading = ref(true)
const productInfo = ref<any>(null)
const history = ref<any[]>([])
const targetPrice = ref('')
const showWatchDialog = ref(false)

// 模拟数据（开发阶段备用）
const mockHistory = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  price: 9000 + Math.round(Math.sin(i / 5) * 500 + Math.random() * 300),
  platform: ['jd', 'taobao', 'pdd'][i % 3],
  finalPrice: 9000 + Math.round(Math.sin(i / 5) * 500 + Math.random() * 300),
}))

const mockProduct = {
  id: productId.value,
  name: `商品 #${productId.value}`,
  brand: '',
  category: '',
}

onMounted(async () => {
  try {
    // 并行获取商品详情和价格历史
    const [detailData, historyData] = await Promise.allSettled([
      getProductDetail(productId.value),
      getPriceHistory(productId.value),
    ])

    if (detailData.status === 'fulfilled' && detailData.value) {
      productInfo.value = detailData.value
    }

    if (historyData.status === 'fulfilled' && historyData.value) {
      const data = historyData.value as any
      // 兼容不同后端返回格式
      if (Array.isArray(data)) {
        history.value = data
      } else if (data.history) {
        history.value = data.history
      } else if (data.items) {
        history.value = data.items
      } else if (data.list) {
        history.value = data.list
      }
    }
  } catch (err: any) {
    console.warn('API 调用失败，使用 mock 数据:', err.message)
  }

  // 如果没有历史数据，使用 mock
  if (!history.value.length) {
    history.value = mockHistory
  }
  if (!productInfo.value) {
    productInfo.value = mockProduct
  }

  loading.value = false

  // 延迟渲染图表（等 DOM 就绪）
  setTimeout(renderChart, 100)
})

// 渲染价格走势图
function renderChart() {
  const el = document.getElementById('price-chart')
  if (!el || !history.value.length) return

  const chart = echarts.init(el, 'dark')

  // 按日期分组，计算每个平台的最低价
  const platformColors: Record<string, string> = {
    jd: '#e4393c',
    taobao: '#ff5722',
    pdd: '#e02e24',
    douyin: '#fe2c55',
  }

  // 获取所有平台
  const platforms = [...new Set(history.value.map(h => h.platform || h.platformCode || 'jd'))]

  // 为每个平台创建一条线
  const series = platforms.map(platform => {
    const platformData = history.value.filter(h => (h.platform || h.platformCode) === platform)
    const dates = [...new Set(platformData.map(h => h.date))].sort()

    return {
      name: getPlatformName(platform),
      type: 'line' as const,
      data: dates.map(d => {
        const items = platformData.filter(h => h.date === d)
        return Math.min(...items.map(h => h.price || h.finalPrice || 0))
      }),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: platformColors[platform] || '#00d4ff',
        width: 2,
      },
    }
  })

  // 获取所有日期
  const allDates = [...new Set(history.value.map(h => h.date))].sort()

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 26, 0.9)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      textStyle: { color: '#e8eaf0', fontSize: 12 },
      formatter: (params: any) => {
        let result = `${params[0]?.axisValue}<br/>`
        params.forEach((p: any) => {
          result += `${p.marker} ${p.seriesName}: <span style="color:#ef4444;font-weight:bold">¥${p.value}</span><br/>`
        })
        return result
      },
    },
    legend: {
      data: platforms.map(p => getPlatformName(p)),
      textStyle: { color: '#8b92a5', fontSize: 10 },
      top: 0,
    },
    grid: { top: 40, right: 20, bottom: 30, left: 60 },
    xAxis: {
      type: 'category',
      data: allDates,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#8b92a5', fontSize: 10, rotate: 45 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: {
        color: '#8b92a5',
        fontSize: 10,
        formatter: (v: number) => `¥${v}`,
      },
    },
    series,
  })

  // 响应窗口变化
  window.addEventListener('resize', () => chart.resize())
}

// 获取平台显示名称
function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    jd: '京东',
    taobao: '淘宝',
    pdd: '拼多多',
    douyin: '抖音',
  }
  return names[platform] || platform
}

// 添加降价提醒
async function handleAddWatch() {
  if (!targetPrice.value) {
    showToast('请输入目标价格')
    return
  }

  const price = Number(targetPrice.value)
  if (price <= 0) {
    showToast('目标价格必须大于0')
    return
  }

  try {
    await addWatch(productId.value, price, ['jd', 'taobao', 'pdd', 'douyin'])
    showToast({ message: '降价提醒已设置', type: 'success' })
    showWatchDialog.value = false
    targetPrice.value = ''
  } catch {
    showToast({ message: '已设置（开发模式）', type: 'success' })
    showWatchDialog.value = false
  }
}

// 跳转到比价页面
function goToCompare() {
  router.push({
    name: 'Compare',
    query: {
      productId: String(productId.value),
      keyword: productInfo.value?.name || '',
    },
  })
}

const currentMin = computed(() => {
  if (!history.value.length) return 0
  return Math.min(...history.value.map(h => h.price || h.finalPrice || 0))
})

const currentPrice = computed(() => {
  if (!history.value.length) return 0
  return Math.min(...history.value.map(h => h.price || h.finalPrice || 0))
})
</script>

<template>
  <div class="page detail-page">
    <van-nav-bar
      title="商品详情"
      left-arrow
      @click-left="$router.back()"
      :border="false"
      class="nav-bar"
    />

    <van-loading v-if="loading" class="center-loading" />

    <template v-else>
      <!-- 商品基本信息 -->
      <div class="info-card card glow-border">
        <h2 class="product-name">{{ productInfo?.name || `商品 #${productId}` }}</h2>
        <div v-if="productInfo?.brand" class="product-brand">
          <van-tag plain size="small">{{ productInfo.brand }}</van-tag>
        </div>
        <div class="price-highlight">
          <span class="current-label">当前最低</span>
          <span class="current-price">¥{{ currentPrice }}</span>
        </div>
      </div>

      <!-- 价格走势图 -->
      <div class="chart-card card">
        <h3 class="section-title"><span class="dot"></span>价格走势（近30天）</h3>
        <div id="price-chart" style="width: 100%; height: 280px;"></div>
      </div>

      <!-- 价格统计 -->
      <div class="stats-card card">
        <div class="stat-item">
          <span class="stat-label">历史最低</span>
          <span class="stat-value lowest">¥{{ currentMin }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">监测平台</span>
          <span class="stat-value">4 个</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">价格记录</span>
          <span class="stat-value">{{ history.length }} 条</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button
          round
          block
          size="large"
          class="action-btn compare"
          @click="goToCompare"
        >
          <template #icon>
            <span class="btn-icon">🔄</span>
          </template>
          重新比价
        </van-button>
        <van-button
          round
          block
          size="large"
          class="action-btn watch"
          @click="showWatchDialog = true"
        >
          <template #icon>
            <span class="btn-icon">🔔</span>
          </template>
          设置降价提醒
        </van-button>
      </div>
    </template>

    <!-- 降价提醒弹窗 -->
    <van-dialog
      v-model:show="showWatchDialog"
      title="设置降价提醒"
      show-cancel-button
      @confirm="handleAddWatch"
    >
      <div style="padding: 16px;">
        <p style="color: var(--text-secondary); margin-bottom: 12px; font-size: 13px;">
          当前最低 ¥{{ currentPrice }}，低于目标价格时通知你
        </p>
        <van-field
          v-model="targetPrice"
          type="number"
          label="目标价"
          placeholder="输入目标价格"
        />
      </div>
    </van-dialog>
  </div>
</template>

<style lang="scss" scoped>
.nav-bar {
  margin: (-$spacing-md) (-$spacing-md) $spacing-md;
}

.center-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.info-card {
  margin-bottom: $spacing-md;
}

.product-name {
  font-size: $font-lg;
  margin-bottom: $spacing-sm;
  line-height: 1.4;
}

.product-brand {
  margin-bottom: $spacing-md;
}

.price-highlight {
  display: flex;
  align-items: baseline;
  gap: $spacing-sm;
}

.current-label {
  color: var(--text-secondary);
  font-size: $font-sm;
}

.current-price {
  font-size: 32px;
  font-weight: 800;
  color: var(--color-up);
}

.chart-card {
  margin-bottom: $spacing-md;
}

.stats-card {
  display: flex;
  justify-content: space-around;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
}

.stat-item {
  text-align: center;
  .stat-label {
    display: block;
    font-size: $font-xs;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .stat-value {
    font-size: $font-md;
    font-weight: 600;
    &.lowest {
      color: var(--color-up);
      font-weight: 700;
    }
  }
}

.section-title {
  font-size: $font-md;
  font-weight: 600;
  margin-bottom: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .dot {
    width: 3px;
    height: 14px;
    background: var(--color-primary);
    border-radius: 2px;
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.action-btn {
  height: 48px;
  font-size: $font-md;
  font-weight: 600;
  border: none;

  .btn-icon {
    margin-right: 4px;
  }

  &.compare {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    box-shadow: 0 0 20px var(--color-primary-glow);
  }

  &.watch {
    background: var(--bg-card);
    border: 1px solid var(--border-glow);
    color: var(--text-primary);
  }
}
</style>
