<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant'
import { extractTextFromImage, generateProductNameFromOcr } from '@/api/ocr'

const route = useRoute()
const router = useRouter()

const keyword = ref((route.query.keyword as string) || '')
const imageUrl = ref('')
const recognizing = ref(false)
const ocrProgress = ref(0)
const ocrStatus = ref('')
const recognizeResult = ref<any>(null)
const rawOcrText = ref('')

// 检查是否可以从 URL 参数直接识别
onMounted(() => {
  if (route.query.keyword) {
    keyword.value = route.query.keyword as string
    // 如果有关键词参数，自动识别
    setTimeout(() => handleRecognize(), 100)
  }
})

// 拍照/选择图片
function handleChooseImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        imageUrl.value = ev.target?.result as string
        console.log('📷 图片已选择，开始识别...')
        setTimeout(() => handleRecognize(), 300)
      }
      reader.onerror = () => {
        showToast('图片加载失败，请重试')
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// 更新进度显示
function updateProgress(progress: { status: string; progress: number }) {
  ocrProgress.value = Math.round(progress.progress * 100)
  ocrStatus.value = progress.status
}

// 识别商品
async function handleRecognize() {
  // 如果有关键词且无图片，直接用关键词搜索
  if (keyword.value.trim() && !imageUrl.value) {
    router.push({
      name: 'Compare',
      query: { keyword: keyword.value.trim() }
    })
    return
  }

    // 如果既没有图片也没有关键词
    if (!keyword.value.trim() && !imageUrl.value) {
      showToast('请输入商品名称或拍照')
      return
    }

  recognizing.value = true
  ocrProgress.value = 0
  ocrStatus.value = '准备识别...'

  const loadingToast = showLoadingToast({
    message: '正在识别...',
    forbidClick: true,
    loadingType: 'spinner',
    duration: 0
  })

  try {
    let productName = keyword.value.trim()
    let useBackendFallback = false
    let rawOcrTextContent = ''

    // 如果有图片，进行 OCR 识别
    if (imageUrl.value) {
      console.log('🔍 开始 OCR 识别...')
      
      try {
        const ocrResult = await extractTextFromImage(imageUrl.value, updateProgress)
        
        rawOcrText.value = ocrResult.text
        rawOcrTextContent = ocrResult.text
        console.log('📝 OCR 识别结果:', ocrResult)
        console.log('🎯 识别的文字:', ocrResult.text)
        console.log('🏷️ 提取的关键词:', ocrResult.productKeywords)
        console.log('📊 识别来源:', ocrResult.source)

        // 解析商品信息
        const generated = generateProductNameFromOcr(ocrResult)
        console.log('🤖 AI 解析结果:', generated)

        // 如果识别成功（放宽条件：只要不是"未知商品"就算成功）
        if (generated.name !== '未知商品') {
          productName = generated.name
          recognizeResult.value = {
            name: generated.name,
            brand: generated.brand,
            category: generated.category,
            confidence: generated.confidence,
            rawText: ocrResult.text,
            productKeywords: ocrResult.productKeywords,
            matchedBy: generated.matchedBy,
            ocrConfidence: ocrResult.confidence,
            source: ocrResult.source
          }
          
          // 延迟跳转到比价页面
          showToast({ message: `识别成功：${generated.name}`, type: 'success' })
          setTimeout(() => {
            router.push({
              name: 'Compare',
              query: { keyword: productName }
            })
          }, 1000)
        } else {
          // 识别为未知商品，尝试使用 OCR 原始文字作为搜索关键词
          console.log('🔄 商品未匹配，尝试使用原始 OCR 文字')
          
          // 从 OCR 文字中提取可能有用的关键词
          const ocrText = ocrResult.text.trim()
          if (ocrText && ocrText.length > 1 && ocrText.length < 100) {
            // OCR 识别出了文字，尝试用它作为搜索词
            productName = ocrText
            showToast({ message: `使用图片文字搜索：${ocrText.slice(0, 20)}...`, type: 'info' })
            setTimeout(() => {
              router.push({
                name: 'Compare',
                query: { keyword: ocrText }
              })
            }, 1000)
            return // 直接返回，不再继续
          }
          
          // 如果 OCR 文字无效，使用输入的关键词
          useBackendFallback = true
        }
      } catch (ocrError: any) {
        console.error('OCR 识别失败:', ocrError)
        useBackendFallback = true
      }
    }

    // 如果 OCR 失败或置信度不够，使用输入的关键词
    if (useBackendFallback && keyword.value.trim()) {
      console.log('🔄 使用输入的关键词:', keyword.value)
      showToast({ message: '使用您输入的关键词搜索', type: 'info' })
      setTimeout(() => {
        router.push({
          name: 'Compare',
          query: { keyword: keyword.value.trim() }
        })
      }, 500)
    } else if (!recognizeResult.value) {
      // 完全无法识别
      showToast({ message: '未能识别商品，请输入商品名称', type: 'warning' })
      recognizeResult.value = {
        name: '未能识别',
        brand: '',
        category: '综合',
        confidence: 0.1,
        suggestion: '请输入商品名称后点击搜索'
      }
    }
  } catch (error: any) {
    console.error('识别失败:', error)
    showToast({ message: '识别失败，请重试', type: 'fail' })
  } finally {
    recognizing.value = false
    ocrProgress.value = 0
    ocrStatus.value = ''
    closeToast()
  }
}

// 手动确认商品名称
function confirmProduct() {
  if (!keyword.value.trim()) {
    showToast('请输入商品名称')
    return
  }
  
  router.push({
    name: 'Compare',
    query: { keyword: keyword.value.trim() }
  })
}

// 手动开始比价
function startCompare() {
  if (!recognizeResult.value?.name || recognizeResult.value.name === '识别失败' || recognizeResult.value.name === '未能识别') {
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
  router.push({
    name: 'Compare',
    query: { keyword: item }
  })
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
        <van-icon v-if="recognizeResult.name !== '未知商品' && recognizeResult.name !== '未能识别'" name="checked" color="var(--color-success)" />
        <van-icon v-else name="warning-o" color="var(--color-warning)" />
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

        <!-- 识别方式 -->
        <div v-if="recognizeResult.matchedBy" class="result-row">
          <span class="label">匹配方式</span>
          <span class="value match-method">{{ recognizeResult.matchedBy }}</span>
        </div>

        <!-- OCR 置信度 -->
        <div v-if="recognizeResult.ocrConfidence" class="result-row">
          <span class="label">图片清晰度</span>
          <span class="value confidence" :class="{
            high: recognizeResult.ocrConfidence > 80,
            medium: recognizeResult.ocrConfidence > 50 && recognizeResult.ocrConfidence <= 80,
            low: recognizeResult.ocrConfidence <= 50
          }">
            {{ recognizeResult.ocrConfidence.toFixed(0) }}%
          </span>
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

        <!-- 建议 -->
        <div v-if="recognizeResult.suggestion" class="result-row suggestion">
          <span class="label">建议</span>
          <span class="value suggestion-text">{{ recognizeResult.suggestion }}</span>
        </div>
      </div>

      <!-- 识别成功：直接比价 -->
      <van-button
        v-if="recognizeResult.name && recognizeResult.name !== '识别失败' && recognizeResult.name !== '未能识别' && recognizeResult.name !== '未知商品'"
        type="primary"
        round
        block
        size="small"
        class="compare-btn"
        @click="startCompare"
      >
        全网比价 →
      </van-button>

      <!-- 识别不成功：手动输入确认 -->
      <div v-else class="manual-input-tip">
        <van-icon name="warning-o" color="var(--color-warning)" />
        <span>{{ recognizeResult.suggestion || '未能自动识别，请手动输入商品名称' }}</span>
      </div>

      <!-- 手动确认按钮 -->
      <van-button
        v-if="recognizeResult.name === '未知商品' || recognizeResult.name === '未能识别'"
        plain
        round
        block
        size="small"
        class="confirm-btn"
        @click="confirmProduct"
      >
        使用输入框的名称搜索
      </van-button>
    </div>

    <!-- 调试信息（开发时可见） -->
    <div v-if="showDebug && rawOcrText" class="debug-info card">
      <h4>调试信息</h4>
      <pre>{{ JSON.stringify({ rawText: rawOcrText, keywords: recognizeResult?.productKeywords }, null, 2) }}</pre>
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
  // 手机
  { name: 'iPhone 16', icon: '📱', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { name: 'iPhone 15', icon: '📱', color: 'linear-gradient(135deg, #5b86e5, #36d1dc)' },
  { name: '华为Mate60', icon: '📱', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { name: '小米14', icon: '📱', color: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  // 电脑
  { name: 'MacBook Air', icon: '💻', color: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { name: 'MacBook Pro', icon: '💻', color: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  // 个护
  { name: '戴森吹风机', icon: '💨', color: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { name: 'AirPods Pro', icon: '🎧', color: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  // 游戏
  { name: 'Switch', icon: '🎮', color: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  { name: 'PS5', icon: '🎮', color: 'linear-gradient(135deg, #667eea, #764ba2)' },
  // 酒水
  { name: '茅台', icon: '🍶', color: 'linear-gradient(135deg, #f5af19, #f12711)' },
  { name: '五粮液', icon: '🍶', color: 'linear-gradient(135deg, #c471f5, #fa71cd)' },
  // 运动
  { name: '耐克运动鞋', icon: '👟', color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { name: '阿迪达斯', icon: '👟', color: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  // 美妆
  { name: 'SK-II神仙水', icon: '💄', color: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { name: '雅诗兰黛', icon: '💄', color: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
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

.confirm-btn {
  margin-top: $spacing-sm;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.match-method {
  font-size: $font-xs;
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.suggestion {
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-xs;
  
  .suggestion-text {
    font-size: $font-xs;
    color: var(--text-muted);
  }
}

.debug-info {
  margin-top: $spacing-md;
  
  h4 {
    font-size: $font-sm;
    color: var(--color-danger);
    margin-bottom: $spacing-sm;
  }
  
  pre {
    font-size: $font-xs;
    background: var(--bg-secondary);
    padding: $spacing-sm;
    border-radius: $radius-sm;
    overflow-x: auto;
    color: var(--text-muted);
  }
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
