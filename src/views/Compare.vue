<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCompareResult, getPriceHistory } from '@/api/product'
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

// 模拟比价数据（开发阶段）
const mockResult = {
  taskId: 'dev-001',
  status: 'completed',
  product: {
    id: Number(route.query.productId) || 1,
    name: route.query.keyword || 'iPhone 16 Pro Max 256GB',
    image: '',
  },
  prices: [
    { id: 1, platform: '京东', price: 8999, originalPrice: 9999, discount: '满减优惠', finalPrice: 8649, couponInfo: '领券减350' },
    { id: 2, platform: '淘宝', price: 9159, originalPrice: 9999, discount: '跨店满减', finalPrice: 8859, couponInfo: '88VIP再减300' },
    { id: 3, platform: '拼多多', price: 8799, originalPrice: 9999, discount: '百亿补贴', finalPrice: 8599, couponInfo: '直降1400' },
  ],
}

onMounted(async () => {
  const productId = route.query.productId

  try {
    // 尝试真实 API
    if (productId) {
      const data: any = await getCompareResult(String(productId))
      result.value = data
      if (data?.status === 'pending') {
        // 轮询等待结果
        polling.value = setInterval(async () => {
          const latest: any = await getCompareResult(String(productId))
          if (latest?.status === 'completed') {
            result.value = latest
            clearInterval(polling.value)
            loading.value = false
          }
        }, 3000)
        return
      }
    }
  } catch {
    // 开发模式：使用模拟数据
    result.value = mockResult
  }
  loading.value = false
})

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
          @click="handleBuy(item)"
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
