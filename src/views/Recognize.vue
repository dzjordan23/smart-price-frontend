<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { extractTextFromImage, generateProductNameFromOcr } from '@/api/ocr'
import { fetchRecognize, fetchCompareResult } from '@/api/crawler'

const route = useRoute()
const router = useRouter()

const keyword = ref((route.query.keyword as string) || '')
const imageUrl = ref('')
const recognizing = ref(false)
const ocrProgress = ref(0)
const ocrStatus = ref('')
const recognizeResult = ref<any>(null)
const rawOcrText = ref('')

// 拍照/选择图片（H5 用 input 模拟）
function handleChooseImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment' // 优先使用后置摄像头
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        imageUrl.value = ev.target?.result as string
        // 选择图片后自动开始识别
        setTimeout(() => handleRecognize(), 300)
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// 识别商品
async function handleRecognize() {
  // 检查是否有输入
  if (!keyword.value.trim() && !imageUrl.value) {
    showToast('请输入商品名称或拍照')
    return
  }

  recognizing.value = true
  ocrProgress.value = 0
  ocrStatus.value = '准备识别...'

  try {
    let productName = keyword.value.trim()

    // 如果有图片，先进行 OCR 识别
    if (imageUrl.value) {
      const loadingToast = showLoadingToast({
        message: '正在识别图片...',
        forbidClick: true,
        loadingType: 'spinner',
        duration: 0
      })

      try {
        // 调用 OCR 识别图片中的文字
        const ocrResult = await extractTextFromImage(imageUrl.value, (progress) => {
          ocrProgress.value = Math.round(progress.progress * 100)
          ocrStatus.value = progress.status === 'recognizing text'
            ? '识别文字中...'
            : '加载模型中...'
        })

        rawOcrText.value = ocrResult.text
        console.log('OCR 识别结果:', ocrResult)

        // 根据 OCR 结果生成商品名称
        const generated = generateProductNameFromOcr(ocrResult)
        console.log('解析的商品信息:', generated)

        // 如果有识别结果且置信度足够，使用识别结果
        if (generated.name !== '未知商品' && generated.confidence > 0.5) {
          productName = generated.name
          recognizeResult.value = {
            name: generated.name,
            brand: generated.brand,
            category: generated.category,
            spec: '',
            confidence: generated.confidence,
            rawText: ocrResult.text,
            productKeywords: ocrResult.productKeywords
          }
        } else if (keyword.value.trim()) {
          // 如果 OCR 结果不理想但有输入关键词，使用关键词
          const keywordResult = await fetchRecognize(keyword.value)
          recognizeResult.value = keywordResult.recognized || keywordResult
        } else {
          // OCR 无法识别，显示原始文本让用户确认
          showToast({ message: '未能识别商品，请手动输入', type: 'warning' })
          recognizeResult.value = {
            name: '未能识别',
            brand: '',
            category: '综合',
            spec: '',
            confidence: 0.1,
            rawText: ocrResult.text,
            suggestion: '请手动输入商品名称'
          }
        }
      } catch (ocrError: any) {
        console.error('OCR 失败:', ocrError)
        // OCR 失败时，如果有关键词则使用关键词识别
        if (keyword.value.trim()) {
          const result = await fetchRecognize(keyword.value)
          recognizeResult.value = result.recognized || result
        } else {
          showToast({ message: '图片识别失败，请手动输入商品名称', type: 'fail' })
          recognizeResult.value = {
            name: '识别失败',
            brand: '',
            category: '综合',
            spec: '',
            confidence: 0,
            error: ocrError.message
          }
        }
      } finally {
        closeToast()
      }
    } else if (keyword.value.trim()) {
      // 只有关键词，没有图片
      const result = await fetchRecognize(keyword.value)
      recognizeResult.value = result.recognized || result
    }

    // 如果识别成功，自动跳转到比价
    if (recognizeResult.value?.name && recognizeResult.value.name !== '识别失败' && recognizeResult.value.name !== '未能识别') {
      showToast({ message: `识别成功：${recognizeResult.value.name}`, type: 'success' })
      setTimeout(() => {
        router.push({
          name: 'Compare',
          query: { keyword: recognizeResult.value.name }
        })
      }, 800)
    }
  } catch (error: any) {
    console.error('识别失败:', error)
    showToast({ message: '识别失败，请重试', type: 'fail' })
  } finally {
    recognizing.value = false
    ocrProgress.value = 0
    ocrStatus.value = ''
  }
}

// 手动开始比价
function startCompare() {
  if (!recognizeResult.value?.name || recognizeResult.value.name === '识别失败') {
    showToast('请先识别商品或手动输入商品名称')
    return
  }

  router.push({
    name: 'Compare',
    query: { keyword: recognizeResult.value.name }
  })
}

// 热门商品快捷识别
function quickRecognize(item: string) {
  keyword.value = item
  imageUrl.value = ''
  handleRecognize()
}
</script>

<template>
  <div class="page recognize-page">
    <van-nav-bar title="商品识别" left-arrow :border="false" class="nav-bar" @click-left="$router.back()" />

    <h2 class="page-title gradient-text">商品识别</h2>
    <p class="page-desc">拍照或输入商品名称，AI 智能识别并全网比价</p>

    <!-- 图片上传区 -->
    <div class="upload-area card" :class="{ 'has-image': imageUrl }" @click="handleChooseImage">
      <template v-if="imageUrl">
        <img :src="imageUrl" class="preview-img" />
        <div class="image-overlay">
          <van-icon name="photograph" size="24" />
          <span>点击重新拍照</span>
        </div>
      </template>
      <template v-else>
        <div class="upload-content">
          <van-icon name="photograph" size="64" color="var(--color-primary)" />
          <p class="upload-hint">点击拍照 / 从相册选择</p>
          <p class="upload-sub-hint">支持商品图片、价格标签等</p>
        </div>
      </template>
    </div>

    <!-- OCR 进度 -->
    <div v-if="recognizing && imageUrl" class="ocr-progress card">
      <van-loading size="20px" />
      <span>{{ ocrStatus || '识别中...' }}</span>
      <van-progress
        v-if="ocrProgress > 0"
        :percentage="ocrProgress"
        :show-pivot="false"
        stroke-width="4"
        color="var(--color-primary)"
      />
    </div>

    <!-- 关键词输入 -->
    <div class="keyword-input card">
      <van-field
        v-model="keyword"
        placeholder="输入商品名称，如: iPhone 16、小米14"
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
      :loading-text="imageUrl ? 'AI 识别中...' : '识别中...'"
      class="recognize-btn"
      @click="handleRecognize"
    >
      {{ imageUrl ? '识别图片' : '开始识别' }}
    </van-button>

    <!-- 识别结果 -->
    <div v-if="recognizeResult" class="result-area card glow-border">
      <h4>
        <van-icon name="checked" color="var(--color-success)" />
        识别结果
      </h4>

      <div class="result-info">
        <!-- 商品名称 -->
        <div class="result-row highlight">
          <span class="label">商品名称</span>
          <span class="value product-name">{{ recognizeResult.name }}</span>
        </div>

        <!-- 品牌 -->
        <div v-if="recognizeResult.brand" class="result-row">
          <span class="label">品牌</span>
          <span class="value brand-tag">{{ recognizeResult.brand }}</span>
        </div>

        <!-- 分类 -->
        <div v-if="recognizeResult.category" class="result-row">
          <span class="label">分类</span>
          <span class="value">{{ recognizeResult.category }}</span>
        </div>

        <!-- 识别置信度 -->
        <div class="result-row">
          <span class="label">识别置信度</span>
          <span class="value confidence" :class="{
            high: recognizeResult.confidence > 0.8,
            medium: recognizeResult.confidence > 0.5 && recognizeResult.confidence <= 0.8,
            low: recognizeResult.confidence <= 0.5
          }">
            {{ (recognizeResult.confidence * 100).toFixed(0) }}%
          </span>
        </div>

        <!-- 原始 OCR 文本（如果有） -->
        <div v-if="rawOcrText && rawOcrText !== recognizeResult.name" class="result-row ocr-text">
          <span class="label">图片文字</span>
          <span class="value raw-text">{{ rawOcrText.slice(0, 100) }}{{ rawOcrText.length > 100 ? '...' : '' }}</span>
        </div>

        <!-- 商品关键词（如果有） -->
        <div v-if="recognizeResult.productKeywords?.length" class="result-row">
          <span class="label">识别的关键词</span>
          <div class="keywords-wrap">
            <van-tag
              v-for="kw in recognizeResult.productKeywords.slice(0, 5)"
              :key="kw"
              type="primary"
              plain
              size="small"
            >
              {{ kw }}
            </van-tag>
          </div>
        </div>
      </div>

      <van-button
        v-if="recognizeResult.name && recognizeResult.name !== '识别失败' && recognizeResult.name !== '未能识别'"
        type="primary"
        round
        block
        size="small"
        class="compare-btn"
        @click="startCompare"
      >
        全网比价 →
      </van-button>

      <!-- 手动输入提示 -->
      <div v-else class="manual-input-tip">
        <van-icon name="warning-o" color="var(--color-warning)" />
        <span>{{ recognizeResult.suggestion || '未能自动识别，请手动输入商品名称' }}</span>
      </div>
    </div>

    <!-- 热门商品快捷入口 -->
    <div class="quick-entry card">
      <h4>热门商品</h4>
      <div class="quick-tags">
        <van-tag
          v-for="item in quickItems"
          :key="item.name"
          size="large"
          round
          class="quick-tag"
          :style="{ background: item.color }"
          @click="quickRecognize(item.name)"
        >
          <span class="tag-icon">{{ item.icon }}</span>
          {{ item.name }}
        </van-tag>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="tips card">
      <h4>识别技巧</h4>
      <ul>
        <li>📷 拍摄商品包装或标签，效果更好</li>
        <li>💡 确保图片清晰，光线充足</li>
        <li>📝 支持中英文商品名称识别</li>
        <li>⌨️ 也可直接输入商品名称进行搜索</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
// 热门商品配置
const quickItems = [
  { name: 'iPhone 16', icon: '📱', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { name: 'MacBook Air', icon: '💻', color: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { name: '华为Mate60', icon: '📱', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { name: '戴森吹风机', icon: '💨', color: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { name: 'Switch', icon: '🎮', color: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  { name: '茅台', icon: '🍶', color: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
]
export default {
  data() {
    return { quickItems }
  }
}
</script>

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
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: $spacing-md;
  overflow: hidden;
  position: relative;
  border: 2px dashed var(--border-color);
  transition: all 0.3s ease;

  &:hover, &.has-image {
    border-color: var(--color-primary);
  }

  .preview-img {
    max-width: 100%;
    max-height: 280px;
    object-fit: contain;
  }

  .image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: $spacing-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    font-size: $font-sm;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .image-overlay {
    opacity: 1;
  }
}

.upload-content {
  text-align: center;
}

.upload-hint {
  color: var(--text-secondary);
  font-size: $font-md;
  margin-top: $spacing-md;
}

.upload-sub-hint {
  color: var(--text-muted);
  font-size: $font-sm;
  margin-top: $spacing-xs;
}

.ocr-progress {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  margin-bottom: $spacing-md;

  span {
    font-size: $font-sm;
    color: var(--text-secondary);
  }

  :deep(.van-progress) {
    flex: 1;
  }
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
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
}

.result-info {
  margin-bottom: $spacing-md;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-sm 0;
  border-bottom: 1px solid var(--border-color);

  &.highlight {
    background: rgba(var(--color-primary-rgb), 0.05);
    margin: 0 (-$spacing-md);
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-sm;
  }

  .label {
    color: var(--text-secondary);
    font-size: $font-sm;
    flex-shrink: 0;
  }

  .value {
    color: var(--text-primary);
    font-weight: 500;
    text-align: right;
  }

  .product-name {
    font-size: $font-md;
    font-weight: 600;
    color: var(--color-primary);
  }

  .brand-tag {
    background: var(--color-primary);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: $font-xs;
  }

  .confidence {
    &.high { color: var(--color-success); }
    &.medium { color: var(--color-warning); }
    &.low { color: var(--color-danger); }
  }

  .raw-text {
    font-size: $font-xs;
    color: var(--text-muted);
    max-width: 200px;
  }

  .keywords-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-end;
  }
}

.compare-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
}

.manual-input-tip {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: rgba(var(--color-warning-rgb), 0.1);
  border-radius: $radius-sm;
  color: var(--color-warning);
  font-size: $font-sm;
}

.quick-entry {
  margin-top: $spacing-lg;

  h4 {
    font-size: $font-md;
    margin-bottom: $spacing-md;
    color: var(--text-secondary);
  }
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.quick-tag {
  cursor: pointer;
  color: white;
  border: none;
  padding: $spacing-sm $spacing-md;
  transition: all 0.3s ease;

  .tag-icon {
    margin-right: 4px;
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.tips {
  margin-top: $spacing-lg;
  margin-bottom: $spacing-xl;

  h4 {
    font-size: $font-md;
    margin-bottom: $spacing-md;
    color: var(--text-secondary);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: $spacing-xs 0;
    color: var(--text-muted);
    font-size: $font-sm;
  }
}
</style>
