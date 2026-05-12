<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { search } from '@/api/product'
import { showToast } from 'vant'

const router = useRouter()
const keyword = ref('')
const hotKeywords = ['iPhone 16', 'MacBook Air', '戴森吸尘器', '海蓝之谜', '茅台', 'Switch']
const searchResults = ref<any[]>([])
const searching = ref(false)

function goSearch() {
  if (!keyword.value.trim()) {
    showToast('请输入商品名称')
    return
  }
  // 直接在当前页面搜索，而不是跳转
  handleHotSearch(keyword.value)
}

function goRecognize() {
  router.push('/recognize')
}

async function handleHotSearch(kw: string) {
  keyword.value = kw
  searching.value = true
  try {
    const res: any = await search(kw)
    searchResults.value = res?.items || res?.list || res || []
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}
</script>

<template>
  <div class="page home-page">
    <!-- 顶部 Hero -->
    <div class="hero">
      <div class="hero-bg"></div>
      <h1 class="gradient-text hero-title">智选比价</h1>
      <p class="hero-sub">拍照识别 · 全网比价 · 降价提醒</p>

      <div class="search-bar card glow-border">
        <van-search
          v-model="keyword"
          placeholder="搜索商品名称或拍一拍"
          shape="round"
          :show-action="true"
          @search="goSearch"
          @click-left-icon="goRecognize"
        >
          <template #left-icon>
            <van-icon name="photograph" size="20" color="var(--color-primary)" />
          </template>
          <template #action>
            <van-button type="primary" size="small" @click="goSearch">搜索</van-button>
          </template>
        </van-search>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-actions">
      <div class="action-item" @click="goRecognize">
        <div class="action-icon">📸</div>
        <span>拍照比价</span>
      </div>
      <div class="action-item" @click="$router.push('/watchlist')">
        <div class="action-icon">🔔</div>
        <span>降价提醒</span>
      </div>
      <div class="action-item">
        <div class="action-icon">🏆</div>
        <span>热门排行</span>
      </div>
      <div class="action-item">
        <div class="action-icon">📊</div>
        <span>价格趋势</span>
      </div>
    </div>

    <!-- 热门搜索 -->
    <div class="section">
      <h3 class="section-title">
        <span class="dot"></span>热门搜索
      </h3>
      <div class="tag-list">
        <van-tag
          v-for="kw in hotKeywords"
          :key="kw"
          type="primary"
          plain
          round
          size="medium"
          class="tag"
          @click="handleHotSearch(kw)"
        >
          {{ kw }}
        </van-tag>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="section">
      <h3 class="section-title"><span class="dot"></span>搜索结果</h3>
      <div
        v-for="item in searchResults"
        :key="item.id"
        class="card result-item"
        @click="$router.push(`/product/${item.id}`)"
      >
        <div class="result-name">{{ item.name }}</div>
        <div class="result-price">¥{{ item.minPrice || '--' }}</div>
      </div>
    </div>

    <van-loading v-if="searching" class="center-loading" />
  </div>
</template>

<style lang="scss" scoped>
.hero {
  position: relative;
  text-align: center;
  padding: 48px 0 32px;
  margin-bottom: $spacing-lg;
}

.hero-bg {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--color-primary-glow), transparent 70%);
  pointer-events: none;
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: $spacing-sm;
}

.hero-sub {
  color: var(--text-secondary);
  font-size: $font-md;
  margin-bottom: $spacing-xl;
}

.search-bar {
  position: relative;
  margin: 0 $spacing-md;
  padding: 4px;

  :deep(.van-search) {
    background: transparent;
    padding: 0;
  }
  :deep(.van-search__content) {
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    padding-left: 4px;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;

  .action-icon {
    width: 52px;
    height: 52px;
    border-radius: $radius-md;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    transition: all $transition-normal;

    &:active {
      transform: scale(0.92);
      box-shadow: 0 0 20px var(--color-primary-glow);
    }
  }

  span {
    font-size: $font-sm;
    color: var(--text-secondary);
  }
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
    box-shadow: 0 0 8px var(--color-primary-glow);
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  .tag {
    cursor: pointer;
    border-color: var(--border-glow);
    color: var(--text-accent);
    transition: all $transition-fast;

    &:active {
      background: var(--color-primary);
      color: var(--bg-primary);
    }
  }
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-name {
  font-size: $font-md;
  flex: 1;
  margin-right: $spacing-md;
}

.result-price {
  font-size: $font-lg;
  font-weight: 700;
  color: var(--color-up);
}

.center-loading {
  display: flex;
  justify-content: center;
  padding: $spacing-xl;
}
</style>
