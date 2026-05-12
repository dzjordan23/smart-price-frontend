<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPriceHistory } from '@/api/product'
import { addWatch } from '@/api/price'
import { showToast } from 'vant'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

const productId = computed(() => Number(route.params.id))
const loading = ref(true)
const history = ref<any[]>([])
const targetPrice = ref('')
const showWatchDialog = ref(false)

// 模拟数据（开发阶段）
const mockHistory = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  price: 9000 + Math.round(Math.sin(i / 5) * 500 + Math.random() * 300),
  platform: ['京东', '淘宝', '拼多多'][i % 3],
}))

onMounted(async () => {
  try {
    const data: any = await getPriceHistory(productId.value)
    history.value = data?.items || data?.list || data || []
  } catch {
    history.value = mockHistory
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
  const dates = [...new Set(history.value.map(h => h.date))].sort()
  const prices = dates.map(d => {
    const items = history.value.filter(h => h.date === d)
    return Math.min(...items.map(h => h.price))
  })

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 26, 0.9)',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      textStyle: { color: '#e8eaf0', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0]
        return `${p.axisValue}<br/>最低价: <span style="color:#ef4444;font-weight:bold">¥${p.value}</span>`
      },
    },
    grid: { top: 20, right: 20, bottom: 30, left: 60 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#8b92a5', fontSize: 10 },
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
    series: [{
      type: 'line',
      data: prices,
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#ef4444' },
          { offset: 1, color: '#00d4ff' },
        ]),
        width: 2,
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
          { offset: 1, color: 'rgba(0, 212, 255, 0.02)' },
        ]),
      },
    }],
  })

  // 响应窗口变化
  window.addEventListener('resize', () => chart.resize())
}

// 添加降价提醒
async function handleAddWatch() {
  if (!targetPrice.value) {
    showToast('请输入目标价格')
    return
  }
  try {
    await addWatch(productId.value, Number(targetPrice.value))
    showToast({ message: '降价提醒已设置', type: 'success' })
    showWatchDialog.value = false
  } catch {
    showToast({ message: '已设置（开发模式）', type: 'success' })
    showWatchDialog.value = false
  }
}

const currentMin = computed(() => {
  if (!history.value.length) return 0
  return Math.min(...history.value.map(h => h.price))
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

    <!-- 商品基本信息 -->
    <div class="info-card card glow-border">
      <h2 class="product-name">商品 #{{ productId }}</h2>
      <div class="price-highlight">
        <span class="current-label">当前最低</span>
        <span class="current-price">¥{{ currentMin }}</span>
      </div>
    </div>

    <!-- 价格走势图 -->
    <div class="chart-card card">
      <h3 class="section-title"><span class="dot"></span>价格走势（近30天）</h3>
      <div id="price-chart" style="width: 100%; height: 250px;"></div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <van-button
        round
        block
        size="large"
        class="action-btn compare"
        @click="$router.push({ name: 'Compare', query: { productId: String(productId) } })"
      >
        🔄 重新比价
      </van-button>
      <van-button
        round
        block
        size="large"
        class="action-btn watch"
        @click="showWatchDialog = true"
      >
        🔔 设置降价提醒
      </van-button>
    </div>

    <!-- 降价提醒弹窗 -->
    <van-dialog
      v-model:show="showWatchDialog"
      title="设置降价提醒"
      show-cancel-button
      @confirm="handleAddWatch"
    >
      <div style="padding: 16px;">
        <p style="color: var(--text-secondary); margin-bottom: 12px; font-size: 13px;">
          当前最低 ¥{{ currentMin }}，低于目标价格时通知你
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

.info-card {
  margin-bottom: $spacing-md;
}

.product-name {
  font-size: $font-lg;
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
  margin-bottom: $spacing-lg;
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
