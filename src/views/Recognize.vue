<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { recognize, createCompare } from '@/api/product'
import { fetchRecognize } from '@/api/crawler'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()

const keyword = ref((route.query.keyword as string) || '')
const imageUrl = ref('')
const recognizing = ref(false)
const recognizeResult = ref<any>(null)

// 拍照/选择图片（H5 用 input 模拟）
function handleChooseImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        imageUrl.value = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// 识别商品
async function handleRecognize() {
  if (!keyword.value.trim() && !imageUrl.value) {
    showToast('请输入商品名称或拍照')
    return
  }
  recognizing.value = true
  try {
    // 优先调用后端 API
    const data: any = await recognize({
      keyword: keyword.value || undefined,
      image: imageUrl.value || undefined,
    })
    recognizeResult.value = data

    if (data?.recognized?.productId || data?.productId) {
      startCompare(data.recognized?.productId || data.productId)
    }
  } catch (error: any) {
    console.warn('后端 API 不可用，使用前端识别:', error.message)
    // 后端不可用时，使用前端识别服务
    const result = await fetchRecognize(keyword.value || '未知商品')
    recognizeResult.value = result.recognized || result
    showToast({ message: '识别成功！', type: 'success' })
  } finally {
    recognizing.value = false
  }
}

// 开始比价
async function startCompare(productId: number) {
  router.push({ name: 'Compare', query: { productId: String(productId) } })
}
</script>

<template>
  <div class="page recognize-page">
    <van-nav-bar title="商品识别" left-arrow :border="false" class="nav-bar" @click-left="$router.back()" />

    <h2 class="page-title gradient-text">商品识别</h2>
    <p class="page-desc">拍照或输入商品名称，AI 智能识别并全网比价</p>

    <!-- 图片上传区 -->
    <div class="upload-area card" @click="handleChooseImage">
      <template v-if="imageUrl">
        <img :src="imageUrl" class="preview-img" />
      </template>
      <template v-else>
        <van-icon name="photograph" size="48" color="var(--color-primary)" />
        <p class="upload-hint">点击拍照 / 从相册选择</p>
      </template>
    </div>

    <!-- 关键词输入 -->
    <div class="keyword-input card">
      <van-field
        v-model="keyword"
        placeholder="或直接输入商品名称"
        size="large"
        clearable
        left-icon="search"
        @keyup.enter="handleRecognize"
      />
    </div>

    <!-- 识别按钮 -->
    <van-button
      type="primary"
      block
      round
      size="large"
      :loading="recognizing"
      loading-text="AI 识别中..."
      class="recognize-btn"
      @click="handleRecognize"
    >
      开始识别比价
    </van-button>

    <!-- 识别结果 -->
    <div v-if="recognizeResult" class="result-area card glow-border">
      <h4>识别结果</h4>
      <div class="result-info">
        <div class="result-row">
          <span class="label">商品名称</span>
          <span class="value">{{ recognizeResult.name }}</span>
        </div>
        <div v-if="recognizeResult.category" class="result-row">
          <span class="label">分类</span>
          <span class="value">{{ recognizeResult.category }}</span>
        </div>
      </div>
      <van-button
        v-if="recognizeResult.productId"
        type="primary"
        round
        block
        size="small"
        class="compare-btn"
        @click="startCompare(recognizeResult.productId)"
      >
        全网比价 →
      </van-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.recognize-page {
  padding-top: 8px;
}

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
  margin-bottom: $spacing-xl;
}

.upload-area {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: $spacing-md;
  overflow: hidden;

  .preview-img {
    max-width: 100%;
    max-height: 240px;
    object-fit: contain;
    border-radius: $radius-md;
  }
}

.upload-hint {
  color: var(--text-secondary);
  font-size: $font-sm;
  margin-top: $spacing-md;
}

.keyword-input {
  margin-bottom: $spacing-lg;

  :deep(.van-field) {
    background: transparent;
  }
}

.recognize-btn {
  height: 50px;
  font-size: $font-lg;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
  box-shadow: 0 0 20px var(--color-primary-glow);
  margin-bottom: $spacing-xl;
}

.result-area {
  h4 {
    font-size: $font-lg;
    margin-bottom: $spacing-md;
    color: var(--color-primary);
  }
}

.result-info {
  margin-bottom: $spacing-md;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm 0;
  border-bottom: 1px solid var(--border-color);

  .label { color: var(--text-secondary); }
  .value { color: var(--text-primary); font-weight: 500; }
}

.compare-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
}
</style>
