<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCompareResult } from '@/api/crawler'
import { confirmPurchase } from '@/api/price'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const result = ref<any>(null)

onMounted(async () => {
  const keywordParam = route.query.keyword as string
  const productIdParam = route.query.productId as string

  if (!keywordParam && !productIdParam) {
    // 无参数时，显示提示
    showToast('请从商品识别页进入比价')
    loading.value = false
    return
  }

  try {
    // 直接使用前端爬虫获取数据
    const keyword = keywordParam || 'iPhone 16'
    const data = await fetchCompareResult(keyword)
    result.value = data
    showToast({ message: '已获取实时比价数据', type: 'success' })
  } catch (err: any) {
    console.error('获取比价数据失败:', err)
    showToast({ message: '获取比价数据失败', type: 'fail' })
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  // 清理工作
})

// 排序价格
const sortedPrices = computed(() => {
  const prices = result.value?.results || result.value?.prices || []
  return [...prices].sort((a, b) => (a.finalPrice || a.price) - (b.finalPrice || b.price))
})

// 确认购买
async function handleBuy(item: any) {
  try {
    await confirmPurchase(
      result.value?.product?.id || 0,
      item.id || 0,
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
  if (platform.includes('拼多多')) return '#e02e24'
  if (platform.includes('抖音')) return '#00f2ea'
  return '#e4393c'
}

function getPlatformIcon(platform: string) {
  if (platform.includes('京东')) return 'JD'
  if (platform.includes('淘宝') || platform.includes('天猫')) return 'TB'
  if (platform.includes('拼多多')) return 'PDD'
  if (platform.includes('抖音')) return 'DY'
  return platform.slice(0, 2)
}

// 计算省钱金额
function savedAmount(item: any) {
  const orig = item.originalPrice || item.price
  const final = item.finalPrice || item.price
  return Math.max(0, orig - final)
}

// 计算折扣比例
function discountRate(item: any) {
  const orig = item.originalPrice || item.price
  const final = item.finalPrice || item.price
  if (orig === 0) return 0
  return Math.round((1 - final / orig) * 100)
}

// 跳转购买
function goToBuy(item: any) {
  if (item.productUrl) {
    window.location.href = item.productUrl
  } else {
    const keyword = encodeURIComponent(result.value?.product?.name || '')
    const platformUrls: Record<string, string> = {
      jd: `https://search.jd.com/Search?keyword=${keyword}`,
      taobao: `https://s.taobao.com/search?q=${keyword}`,
      pdd: `https://mobile.yangkeduo.com/search_result.html?search_key=${keyword}`,
      douyin: `https://v.douyin.com/search?keyword=${keyword}`,
    }
    window.location.href = platformUrls[item.platform] || platformUrls.jd
  }
}

// 最低价高亮
const lowestPrice = computed(() => {
  if (!sortedPrices.value.length) return 0
  return Math.min(...sortedPrices.value.map((p: any) => p.finalPrice || p.price))
})

// 获取平台图标背景色
function getIconBg(platform: string) {
  if (platform.includes('京东')) return 'linear-gradient(135deg, #e4393c, #c62828)'
  if (platform.includes('淘宝') || platform.includes('天猫')) return 'linear-gradient(135deg, #ff5722, #e64a19)'
  if (platform.includes('拼多多')) return 'linear-gradient(135deg, #e02e24, #c62828)'
  if (platform.includes('抖音')) return 'linear-gradient(135deg, #00f2ea, #00c4cc)'
  return 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
}
</script>

<template>
  <div class="page compare-page">
    <van-nav-bar title="全网比价" left-arrow :border="false" class="nav-bar" @click-left="$router.back()" />

    <!-- 商品信息 -->
    <div v-if="result?.product" class="product-header card glow-border">
      <div class="product-info">
        <div class="product-name">{{ result.product.name }}</div>
        <div class="product-summary" v-if="result.summary">
          <span class="summary-item">
            <van-icon name="flag-o" />
            {{ result.summary.platformCount }}个平台
          </span>
          <span class="summary-item highlight">
            <van-icon name="paid" />
            最低 ¥{{ result.summary.lowestPrice }}
          </span>
        </div>
      </div>
      <div class="compare-status">
        <van-tag type="success" round>
          <van-icon name="passed" /> 比价完成
        </van-tag>
      </div>
    </div>

    <!-- 比价结果 -->
    <van-loading v-if="loading" class="center-loading">
      <span class="loading-text">正在获取实时价格...</span>
    </van-loading>

    <div v-else class="price-list">
      <h3 class="section-title">
        <span class="dot"></span>
        全网比价结果
        <span class="result-count">({{ sortedPrices.length }}个平台)</span>
      </h3>

      <div
        v-for="(item, index) in sortedPrices"
        :key="index"
        class="price-card card"
        :class="{ lowest: (item.finalPrice || item.price) === lowestPrice }"
      >
        <!-- 排名 -->
        <div class="rank" :class="`rank-${index + 1}`">
          #{{ index + 1 }}
        </div>

        <!-- 平台图标 -->
        <div class="platform-icon" :style="{ background: getIconBg(item.platformName || item.platform) }">
          {{ getPlatformIcon(item.platformName || item.platform) }}
        </div>

        <div class="price-info">
          <div class="platform-row">
            <span class="platform-name" :style="{ color: getPlatformColor(item.platformName || item.platform) }">
              {{ item.platformName || item.platform }}
            </span>
            <span class="shop-name" v-if="item.shopName">{{ item.shopName }}</span>
          </div>

          <div class="price-row">
            <span class="final-price">¥{{ item.finalPrice || item.price }}</span>
            <span v-if="item.originalPrice && item.originalPrice > (item.finalPrice || item.price)" class="original-price">
              ¥{{ item.originalPrice }}
            </span>
            <span v-if="discountRate(item) > 0" class="discount-tag">
              {{ discountRate(item) }}%OFF
            </span>
          </div>

          <div class="promotion-row" v-if="item.discount || item.couponInfo">
            <van-tag v-if="item.discount" type="warning" plain size="small">
              {{ item.discount }}
            </van-tag>
            <van-tag v-if="item.couponInfo" type="danger" plain size="small">
              {{ item.couponInfo }}
            </van-tag>
          </div>
        </div>

        <div class="action-col">
          <van-button
            size="small"
            round
            type="primary"
            class="buy-btn"
            @click="goToBuy(item)"
          >
            去购买
          </van-button>
          <span v-if="savedAmount(item) > 0" class="saved-amount">
            省¥{{ savedAmount(item) }}
          </span>
        </div>
      </div>

      <!-- 空状态 -->
      <van-empty v-if="sortedPrices.length === 0" description="暂无比价结果，请尝试其他商品" />
    </div>

    <!-- 价格走势入口 -->
    <div v-if="result?.product" class="watch-entry card" @click="$router.push('/watchlist')">
      <span class="entry-icon">📊</span>
      <span class="entry-text">查看价格历史走势</span>
      <van-icon name="arrow" class="entry-arrow" />
    </div>

    <!-- 热门商品推荐 -->
    <div class="recommendations card" v-if="sortedPrices.length > 0">
      <h4>试试其他热门商品</h4>
      <div class="recommend-tags">
        <van-tag
          v-for="item in ['iPhone 15', 'MacBook Pro', '华为Pura70', '戴森吸尘器', 'Switch游戏机']"
          :key="item"
          size="medium"
          round
          class="recommend-tag"
          @click="$router.push({ name: 'Compare', query: { keyword: item } })"
        >
          {{ item }}
        </van-tag>
      </div>
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
  align-items: flex-start;
  margin-bottom: $spacing-lg;
  gap: $spacing-md;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: $font-lg;
  font-weight: 600;
  margin-bottom: $spacing-xs;
  line-height: 1.4;
}

.product-summary {
  display: flex;
  gap: $spacing-md;
  font-size: $font-sm;
  color: var(--text-secondary);

  .summary-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .highlight {
    color: var(--color-up);
    font-weight: 600;
  }
}

.loading-text {
  color: var(--text-secondary);
  margin-left: $spacing-sm;
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

  .result-count {
    font-size: $font-sm;
    color: var(--text-secondary);
    font-weight: 400;
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
    background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.05), transparent);
  }

  &:active { transform: scale(0.98); }
}

.rank {
  font-size: $font-xl;
  font-weight: 800;
  width: 36px;
  text-align: center;
  flex-shrink: 0;

  &.rank-1 { color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
  &.rank-2 { color: #c0c0c0; }
  &.rank-3 { color: #cd7f32; }
}

.platform-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: $font-xs;
  font-weight: 700;
  flex-shrink: 0;
}

.price-info {
  flex: 1;
  min-width: 0;
}

.platform-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.platform-name {
  font-weight: 600;
  font-size: $font-md;
}

.shop-name {
  font-size: $font-xs;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: $spacing-sm;
  margin-bottom: 4px;
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

.discount-tag {
  font-size: $font-xs;
  color: var(--color-down);
  background: rgba(239, 68, 68, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.promotion-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.buy-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
  min-width: 70px;
}

.saved-amount {
  font-size: $font-xs;
  color: var(--color-success);
  white-space: nowrap;
}

.center-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
}

.watch-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-top: $spacing-md;
  padding: $spacing-md $spacing-lg;
}

.entry-icon {
  font-size: $font-xl;
}

.entry-text {
  flex: 1;
  margin-left: $spacing-sm;
  color: var(--text-secondary);
}

.entry-arrow {
  color: var(--text-muted);
}

.recommendations {
  margin-top: $spacing-lg;

  h4 {
    font-size: $font-md;
    color: var(--text-secondary);
    margin-bottom: $spacing-md;
  }
}

.recommend-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.recommend-tag {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px var(--color-primary-glow);
  }
}
</style>
