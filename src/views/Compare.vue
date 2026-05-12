<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCompareResult, getPriceHistory, createCompare } from '@/api/product'
import { confirmPurchase } from '@/api/price'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const taskId = ref('')
const result = ref<any>(null)
const priceHistory = ref<any[]>([])
const platforms = ref<any[]>([])
const polling = ref<any>(null)

// 模拟比价数据（开发阶段备用）
const mockResult = {
  taskId: 'dev-001',
  status: 'completed',
  product: {
    id: Number(route.query.productId) || 1,
    name: route.query.keyword || 'iPhone 16 Pro Max 256GB',
    image: '',
  },
  prices: [
    { id: 1, platform: '京东', platformCode: 'jd', price: 8999, originalPrice: 9999, discount: '满减优惠', finalPrice: 8649, couponInfo: '领券减350', productUrl: '' },
    { id: 2, platform: '淘宝', platformCode: 'taobao', price: 9159, originalPrice: 9999, discount: '跨店满减', finalPrice: 8859, couponInfo: '88VIP再减300', productUrl: '' },
    { id: 3, platform: '拼多多', platformCode: 'pdd', price: 8799, originalPrice: 9999, discount: '百亿补贴', finalPrice: 8599, couponInfo: '直降1400', productUrl: '' },
  ],
}

onMounted(async () => {
  // 优先使用 taskId 查询比价结果（异步任务轮询模式）
  const taskIdParam = route.query.taskId
  const productIdParam = route.query.productId
  const keywordParam = route.query.keyword

  try {
    if (taskIdParam) {
      // 模式1: 使用 taskId 轮询比价结果
      taskId.value = String(taskIdParam)
      await pollCompareResult(taskId.value)
    } else if (productIdParam) {
      // 模式2: 使用 productId 查询已有比价结果
      const data: any = await getCompareResult(String(productIdParam))
      if (data?.status === 'processing') {
        // 任务处理中，轮询
        taskId.value = data.taskId || String(productIdParam)
        await pollCompareResult(taskId.value)
      } else if (data?.status === 'done') {
        // 任务完成，直接显示结果
        result.value = data
      }
    } else if (keywordParam) {
      // 模式3: 新建比价任务（关键词模式）
      await startNewCompareTask(String(keywordParam))
    } else {
      // 无参数，使用 mock 数据
      result.value = mockResult
    }
  } catch (err: any) {
    console.warn('API 调用失败，使用 mock 数据:', err.message)
    result.value = mockResult
  }
  loading.value = false
})

// 轮询比价结果
async function pollCompareResult(tid: string) {
  return new Promise<void>((resolve) => {
    polling.value = setInterval(async () => {
      try {
        const data: any = await getCompareResult(tid)
        if (data?.status === 'done') {
          result.value = transformBackendResult(data)
          clearInterval(polling.value)
          loading.value = false
          resolve()
        } else if (data?.status === 'failed') {
          clearInterval(polling.value)
          loading.value = false
          showToast('比价失败，请重试')
          resolve()
        }
        // processing 状态继续轮询
      } catch {
        clearInterval(polling.value)
        loading.value = false
        resolve()
      }
    }, 3000)
  })
}

// 创建新的比价任务
async function startNewCompareTask(keyword: string) {
  try {
    const data: any = await createCompare({
      keyword: keyword,
      platforms: ['jd', 'pdd', 'taobao', 'douyin'],
    })
    if (data?.taskId) {
      taskId.value = data.taskId
      await pollCompareResult(data.taskId)
    } else if (data?.productId) {
      // 如果后端直接返回了结果
      const resultData: any = await getCompareResult(String(data.productId))
      if (resultData?.status === 'done') {
        result.value = transformBackendResult(resultData)
      } else {
        result.value = transformBackendResult(data)
      }
    } else {
      showToast('比价任务创建失败')
    }
  } catch (error: any) {
    console.error('比价任务创建失败:', error)
    showToast('比价任务创建失败，请重试')
  }
}

// 转换后端数据格式为前端期望格式
function transformBackendResult(data: any) {
  if (!data) return mockResult
  return {
    taskId: data.taskId || '',
    status: 'completed',
    product: data.product || { name: route.query.keyword || '商品', id: 0 },
    prices: (data.results || []).map((r: any, idx: number) => ({
      id: idx + 1,
      platform: r.platformName || r.platform || '',
      platformCode: r.platform || '',
      price: r.finalPrice || r.salePrice || 0,
      originalPrice: r.originalPrice || 0,
      discount: r.promotion || '',
      finalPrice: r.finalPrice || 0,
      couponInfo: r.couponInfo?.type ? `${r.couponInfo.type}: ${r.couponInfo.amount}` : '',
      productUrl: r.productUrl || '',
      shopName: r.shopName || '',
      isLowest: r.isLowest || false,
    })),
  }
}

onUnmounted(() => {
  if (polling.value) clearInterval(polling.value)
})

// 排序价格
const sortedPrices = computed(() => {
  const prices = result.value?.prices || []
  return [...prices].sort((a, b) => (a.finalPrice || a.price) - (b.finalPrice || b.price))
})

// 确认购买
async function handleBuy(item: any) {
  try {
    await confirmPurchase(
      result.value.product.id,
      item.id,
      item.platform,
    )
    showToast({ message: '购买记录已提交', type: 'success' })
  } catch {
    showToast({ message: '已记录（开发模式）', type: 'success' })
  }
}

function getPlatformColor(platform: string) {
  if (platform.includes('京东')) return '#e4393c'
  if (platform.includes('淘宝') || platform.includes('天猫')) return '#ff5722'
  return '#e02e24'
}

// 计算省钱金额
function savedAmount(item: any) {
  const orig = item.originalPrice || item.price
  const final = item.finalPrice || item.price
  return Math.max(0, orig - final)
}

// 跳转购买
function goToBuy(item: any) {
  if (item.productUrl) {
    window.location.href = item.productUrl
  } else {
    // 构造平台搜索链接
    const keyword = encodeURIComponent(result.value?.product?.name || '')
    const platformUrls: Record<string, string> = {
      jd: `https://search.jd.com/Search?keyword=${keyword}`,
      taobao: `https://s.taobao.com/search?q=${keyword}`,
      pdd: `https://mobile.yangkeduo.com/search_result.html?search_key=${keyword}`,
      douyin: `https://v.douyin.com/search?keyword=${keyword}`,
    }
    window.location.href = platformUrls[item.platformCode] || platformUrls.jd
  }
}

// 最低价高亮
const lowestPrice = computed(() => {
  if (!sortedPrices.value.length) return 0
  return Math.min(...sortedPrices.value.map((p: any) => p.finalPrice || p.price))
})
</script>

<template>
  <div class="page compare-page">
    <van-nav-bar title="全网比价" left-arrow :border="false" class="nav-bar" @click-left="$router.back()" />

    <!-- 商品信息 -->
    <div v-if="result?.product" class="product-header card glow-border">
      <div class="product-name">{{ result.product.name }}</div>
      <div class="compare-status">
        <van-tag v-if="result.status === 'completed'" type="success" round>比价完成</van-tag>
        <van-tag v-else type="warning" round>比价中...</van-tag>
      </div>
    </div>

    <!-- 比价结果 -->
    <van-loading v-if="loading" class="center-loading" />

    <div v-else class="price-list">
      <h3 class="section-title"><span class="dot"></span>全网比价结果</h3>

      <div
        v-for="(item, index) in sortedPrices"
        :key="item.id"
        class="price-card card"
        :class="{ lowest: (item.finalPrice || item.price) === lowestPrice }"
      >
        <!-- 排名 -->
        <div class="rank" :class="`rank-${index + 1}`">
          #{{ index + 1 }}
        </div>

        <div class="price-info">
          <div class="platform-row">
            <span class="platform-name" :style="{ color: getPlatformColor(item.platform) }">
              {{ item.platform }}
            </span>
            <van-tag v-if="item.discount" type="primary" plain size="small">
              {{ item.discount }}
            </van-tag>
          </div>

          <div class="price-row">
            <span class="final-price">¥{{ item.finalPrice || item.price }}</span>
            <span v-if="item.originalPrice" class="original-price">
              ¥{{ item.originalPrice }}
            </span>
            <span v-if="savedAmount(item) > 0" class="saved-tag">
              省¥{{ savedAmount(item) }}
            </span>
          </div>

          <div v-if="item.couponInfo" class="coupon-info">
            🎫 {{ item.couponInfo }}
          </div>
        </div>

        <van-button
          size="small"
          round
          type="primary"
          class="buy-btn"
          @click="goToBuy(item)"
        >
          去购买
        </van-button>
      </div>

      <!-- 空状态 -->
      <van-empty v-if="!loading && sortedPrices.length === 0" description="暂无比价结果" />
    </div>

    <!-- 降价提醒入口 -->
    <div v-if="result?.product" class="watch-entry card" @click="$router.push('/watchlist')">
      <span>📊 查看价格历史走势</span>
      <van-icon name="arrow" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nav-bar {
  margin: (-$spacing-md) (-$spacing-md) $spacing-md;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.product-name {
  font-size: $font-lg;
  font-weight: 600;
  flex: 1;
}

.price-list {
  margin-bottom: $spacing-lg;
}

.section-title {
  font-size: $font-lg;
  font-weight: 600;
  margin-bottom: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .dot {
    width: 4px;
    height: 18px;
    background: var(--color-primary);
    border-radius: 2px;
  }
}

.price-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  transition: all $transition-normal;

  &.lowest {
    border-color: var(--color-primary);
    box-shadow: 0 0 20px var(--color-primary-glow);
  }

  &:active { transform: scale(0.98); }
}

.rank {
  font-size: $font-xl;
  font-weight: 800;
  width: 40px;
  text-align: center;
  flex-shrink: 0;

  &.rank-1 { color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
  &.rank-2 { color: #c0c0c0; }
  &.rank-3 { color: #cd7f32; }
}

.price-info {
  flex: 1;
  min-width: 0;
}

.platform-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.platform-name {
  font-weight: 600;
  font-size: $font-md;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
}

.final-price {
  font-size: $font-xxl;
  font-weight: 800;
  color: var(--color-up);
}

.original-price {
  font-size: $font-sm;
  color: var(--text-muted);
  text-decoration: line-through;
}

.saved-tag {
  font-size: $font-xs;
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.coupon-info {
  font-size: $font-xs;
  color: var(--color-warning);
}

.buy-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
}

.center-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.watch-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  color: var(--text-secondary);
}
</style>
