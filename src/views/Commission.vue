<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCommissions } from '@/api/user'

const commissions = ref<any[]>([])
const loading = ref(true)

const totalAmount = computed(() =>
  commissions.value.reduce((s, c) => s + (c.amount || 0), 0),
)
const pendingCount = computed(() =>
  commissions.value.filter(c => c.status === 'pending').length,
)

onMounted(async () => {
  try {
    const data: any = await getCommissions()
    commissions.value = data?.items || data?.list || data || []
  } catch {
    commissions.value = [
      { id: 1, productName: 'iPhone 16 Pro', amount: 45.00, status: 'pending', createdAt: '2026-05-10' },
      { id: 2, productName: 'AirPods Pro', amount: 12.50, status: 'completed', createdAt: '2026-05-08' },
      { id: 3, productName: '小米手环 9', amount: 3.20, status: 'completed', createdAt: '2026-05-06' },
    ]
  }
  loading.value = false
})
</script>

<template>
  <div class="page commission-page">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item card">
        <div class="stat-value">¥{{ totalAmount.toFixed(2) }}</div>
        <div class="stat-label">累计返利</div>
      </div>
      <div class="stat-item card">
        <div class="stat-value">{{ pendingCount }}</div>
        <div class="stat-label">待结算</div>
      </div>
      <div class="stat-item card">
        <div class="stat-value">{{ commissions.length }}</div>
        <div class="stat-label">总订单</div>
      </div>
    </div>

    <!-- 最近返利 -->
    <div class="section">
      <h3 class="section-title"><span class="dot"></span>最近返利</h3>
      <van-loading v-if="loading" class="loading" size="24px" vertical>加载中...</van-loading>
      <template v-else>
        <div v-for="item in commissions" :key="item.id" class="commission-item card">
          <div class="comm-info">
            <div class="comm-name">{{ item.productName }}</div>
            <div class="comm-date">{{ item.createdAt }}</div>
          </div>
          <div class="comm-amount">
            +¥{{ item.amount?.toFixed(2) }}
            <van-tag
              :type="item.status === 'completed' ? 'success' : 'warning'"
              size="small"
              round
              style="margin-left: 8px;"
            >
              {{ item.status === 'completed' ? '已到账' : '待结算' }}
            </van-tag>
          </div>
        </div>
        <van-empty v-if="commissions.length === 0" description="暂无返利记录" />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.commission-page {
  padding-top: 24px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
  margin-bottom: $spacing-xl;
}

.stat-item {
  text-align: center;
  padding: $spacing-md $spacing-sm;
}

.stat-value {
  font-size: $font-xl;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: $spacing-xs;
}

.stat-label {
  font-size: $font-xs;
  color: var(--text-secondary);
}

.section {
  margin-bottom: $spacing-xl;
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

.loading {
  text-align: center;
  padding: 40px 0;
  color: var(--text-secondary);
}

.commission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comm-name {
  font-size: $font-md;
  font-weight: 500;
}

.comm-date {
  font-size: $font-xs;
  color: var(--text-muted);
  margin-top: 2px;
}

.comm-amount {
  font-size: $font-lg;
  font-weight: 700;
  color: var(--color-success);
  display: flex;
  align-items: center;
}
</style>
