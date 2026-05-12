<script setup lang="ts">
import { ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { getWatchList, deleteWatch } from '@/api/price'

const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)

const mockWatchList = [
  { id: 1, productId: 1, productName: 'iPhone 16 Pro Max', targetPrice: 8500, currentPrice: 8649, status: 'monitoring', platform: '京东' },
  { id: 2, productId: 2, productName: 'MacBook Air M3', targetPrice: 7000, currentPrice: 6999, status: 'triggered', platform: '拼多多' },
  { id: 3, productId: 3, productName: '戴森 V15', targetPrice: 3500, currentPrice: 4290, status: 'monitoring', platform: '淘宝' },
]

async function onLoad() {
  try {
    const data: any = await getWatchList(page.value)
    const items = data?.items || data?.list || data || []
    if (refreshing.value) {
      list.value = items
    } else {
      list.value.push(...items)
    }
    if (items.length < 20) finished.value = true
    page.value++
  } catch {
    // 开发模式
    if (page.value === 1) list.value = mockWatchList
    finished.value = true
  }
  loading.value = false
  refreshing.value = false
}

async function onRefresh() {
  refreshing.value = true
  page.value = 1
  finished.value = false
  list.value = []
  loading.value = true
  await onLoad()
}

async function handleDelete(item: any) {
  try {
    await showConfirmDialog({
      title: '删除提醒',
      message: `确定要删除「${item.productName}」的降价提醒吗？`,
    })
    await deleteWatch(item.id)
    list.value = list.value.filter(i => i.id !== item.id)
    showToast({ message: '已删除', type: 'success' })
  } catch {
    // 开发模式：直接移除
    list.value = list.value.filter(i => i.id !== item.id)
    showToast({ message: '已删除（开发模式）', type: 'success' })
  }
}

function getStatusTag(status: string) {
  if (status === 'triggered') return { text: '已触发', type: 'success' as const }
  return { text: '监控中', type: 'primary' as const }
}

function priceDiff(item: any) {
  return (item.currentPrice || 0) - (item.targetPrice || 0)
}
</script>

<template>
  <div class="page watchlist-page">
    <van-nav-bar title="降价提醒" left-arrow :border="false" class="nav-bar" @click-left="$router.back()" />

    <h2 class="page-title gradient-text">降价提醒</h2>
    <p class="page-desc">实时监控商品价格，达到目标价自动通知</p>

    <van-pull-refresh v-model:refreshing="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <van-swipe-cell v-for="item in list" :key="item.id">
          <div
            class="watch-item card"
            @click="$router.push(`/product/${item.productId}`)"
          >
            <div class="watch-header">
              <span class="product-name">{{ item.productName }}</span>
              <van-tag v-bind="getStatusTag(item.status)" round size="small">
                {{ getStatusTag(item.status).text }}
              </van-tag>
            </div>

            <div class="watch-prices">
              <div class="price-block">
                <span class="label">当前价</span>
                <span class="price" :class="{ up: priceDiff(item) <= 0 }">
                  ¥{{ item.currentPrice }}
                </span>
              </div>
              <div class="price-arrow">→</div>
              <div class="price-block">
                <span class="label">目标价</span>
                <span class="price target">¥{{ item.targetPrice }}</span>
              </div>
            </div>

            <div class="watch-footer">
              <span class="platform">📍 {{ item.platform }}</span>
              <span v-if="priceDiff(item) <= 0" class="triggered-msg">
                🎉 已达到目标价！
              </span>
              <span v-else class="diff-msg">
                还差 ¥{{ priceDiff(item) }}
              </span>
            </div>
          </div>
          <template #right>
            <van-button
              square
              type="danger"
              text="删除"
              class="delete-btn"
              @click="handleDelete(item)"
            />
          </template>
        </van-swipe-cell>

        <van-empty v-if="!loading && list.length === 0" description="暂无降价提醒" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<style lang="scss" scoped>
.nav-bar {
  margin: (-$spacing-md) (-$spacing-md) $spacing-md;
}

.page-title {
  font-size: $font-xxl;
  font-weight: 700;
  margin-bottom: $spacing-xs;
}

.page-desc {
  color: var(--text-secondary);
  font-size: $font-md;
  margin-bottom: $spacing-lg;
}

.watch-item {
  margin-bottom: $spacing-md;
}

.delete-btn {
  height: 100%;
  border-radius: $radius-md;
}

.watch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.product-name {
  font-size: $font-md;
  font-weight: 600;
  flex: 1;
}

.watch-prices {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
}

.price-block {
  display: flex;
  flex-direction: column;
  align-items: center;

  .label {
    font-size: $font-xs;
    color: var(--text-muted);
    margin-bottom: $spacing-xs;
  }

  .price {
    font-size: $font-xl;
    font-weight: 700;
    color: var(--text-primary);

    &.up { color: var(--color-up); }
    &.target { color: var(--color-success); }
  }
}

.price-arrow {
  color: var(--text-muted);
  font-size: $font-lg;
}

.watch-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $spacing-sm;
  border-top: 1px solid var(--border-color);
  font-size: $font-sm;

  .platform { color: var(--text-muted); }
  .triggered-msg { color: var(--color-warning); font-weight: 600; }
  .diff-msg { color: var(--text-secondary); }
}
</style>
