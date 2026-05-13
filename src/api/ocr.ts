/**
 * 前端 OCR 服务 - 支持多种识别方式
 * 1. 后端 API（优先）- 使用腾讯云 OCR
 * 2. 前端 Tesseract.js（备用）- 离线可用
 */

// 动态导入 Tesseract.js
let Tesseract: any = null
let tesseractLoading = false

async function getTesseract() {
  if (Tesseract) return Tesseract
  if (tesseractLoading) {
    // 等待加载完成
    while (tesseractLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return Tesseract
  }
  
  tesseractLoading = true
  try {
    const module = await import('tesseract.js')
    Tesseract = module.default || module
    return Tesseract
  } finally {
    tesseractLoading = false
  }
}

// OCR 进度回调类型
type ProgressCallback = (progress: {
  status: string
  progress: number
}) => void

// OCR 识别结果
interface OcrResult {
  text: string           // 识别的完整文本
  confidence: number      // 置信度 0-100
  words: string[]        // 识别出的单词/词组
  productKeywords: string[] // 提取的商品关键词
  source: 'backend' | 'tesseract'  // 识别来源
}

/**
 * 带超时的 Promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ])
}

/**
 * 从后端 API 识别图片（优先）
 */
async function recognizeByBackend(imageBase64: string): Promise<OcrResult> {
  try {
    const response = await fetch('/api/ocr/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    })
    
    if (!response.ok) throw new Error('后端 OCR 失败')
    
    const data = await response.json()
    return {
      text: data.text || '',
      confidence: data.confidence || 50,
      words: data.words || [],
      productKeywords: extractProductKeywords(data.text || '', data.words || []),
      source: 'backend'
    }
  } catch (error) {
    console.error('后端 OCR 失败:', error)
    throw error
  }
}

/**
 * 从图片中提取文字（混合策略）
 */
export async function extractTextFromImage(
  imageUrl: string,
  onProgress?: ProgressCallback
): Promise<OcrResult> {
  // 如果是 data URL，转换为 base64
  let base64 = imageUrl
  if (imageUrl.startsWith('data:')) {
    base64 = imageUrl
  }
  
  // 1. 优先尝试后端 API（更准确、更快）
  onProgress?.({ status: '正在调用后端识别...', progress: 0.1 })
  
  try {
    const result = await withTimeout(
      recognizeByBackend(base64),
      15000, // 15秒超时
      '后端识别超时'
    )
    return result
  } catch (backendError) {
    console.warn('后端识别失败，尝试前端识别:', backendError)
  }
  
  // 2. 后端失败，使用前端 Tesseract.js
  onProgress?.({ status: '后端不可用，正在加载本地识别引擎...', progress: 0.2 })
  
  try {
    const OCR = await withTimeout(
      getTesseract(),
      20000, // 20秒加载超时
      '识别引擎加载超时'
    )
    
    onProgress?.({ status: '正在识别文字...', progress: 0.3 })
    
    const result = await withTimeout(
      OCR.recognize(
        imageUrl,
        'chi_sim+eng', // 简体中文 + 英文
        {
          logger: (m: any) => {
            if (m.status) {
              const progressMap: Record<string, number> = {
                'loading tesseract core': 0.3,
                'initializing tesseract': 0.4,
                'loading language traineddata': 0.5,
                'initializing api': 0.6,
                'recognizing text': 0.7,
              }
              onProgress?.({
                status: m.status,
                progress: progressMap[m.status] || m.progress * 0.4 + 0.3
              })
            }
          }
        }
      ),
      60000, // 60秒识别超时
      '文字识别超时'
    )
    
    const text = result.data.text.trim()
    const confidence = result.data.confidence || 0
    
    // 提取所有识别的词
    const words: string[] = []
    if (result.data.words) {
      for (const word of result.data.words) {
        if (word.text.trim()) {
          words.push(word.text.trim())
        }
      }
    }
    
    // 从识别的文本中提取商品关键词
    const productKeywords = extractProductKeywords(text, words)
    
    return {
      text,
      confidence,
      words,
      productKeywords,
      source: 'tesseract'
    }
  } catch (error: any) {
    console.error('前端 OCR 失败:', error)
    
    // 所有方式都失败
    throw new Error('图片识别失败: ' + (error.message || '未知错误'))
  }
}

// =============== 商品数据库 ===============
interface ProductPattern {
  patterns: RegExp[]
  name: string
  brand: string
  category: string
  aliases?: string[]
}

const PRODUCT_DATABASE: ProductPattern[] = [
  // ===== 手机 =====
  {
    patterns: [/(?:iphone|ｉｐｈｏｎｅ)\s*1[3456](?:\s*pro)?(?:\s*(?:max|pro\s*max))?/gi],
    name: 'iPhone',
    brand: 'Apple',
    category: '手机',
    aliases: ['苹果手机', '爱疯']
  },
  {
    patterns: [/macbook\s*(?:air|pro)/gi],
    name: 'MacBook',
    brand: 'Apple',
    category: '电脑'
  },
  {
    patterns: [/ipad\s*(?:pro|air|mini)?/gi],
    name: 'iPad',
    brand: 'Apple',
    category: '平板'
  },
  {
    patterns: [/airpods?(?:\s*(?:pro|2|3))?/gi],
    name: 'AirPods',
    brand: 'Apple',
    category: '耳机'
  },
  {
    patterns: [/apple\s*(?:watch|手表)/gi],
    name: 'Apple Watch',
    brand: 'Apple',
    category: '手表'
  },
  
  // ===== 华为 =====
  {
    patterns: [/mate\s*60/i, /mate60/i, /mate\s*50/i, /mate50/i],
    name: '华为Mate',
    brand: '华为',
    category: '手机'
  },
  {
    patterns: [/pura\s*70/i, /pura70/i, /pura\s*80/i, /pura80/i],
    name: '华为Pura',
    brand: '华为',
    category: '手机'
  },
  {
    patterns: [/华为/i, /huawei/i],
    name: '华为',
    brand: '华为',
    category: '手机'
  },
  
  // ===== 小米 =====
  {
    patterns: [/小米\s*(?:14|13|12|11)?/gi, /xiaomi\s*(?:14|13|12|11)?/gi],
    name: '小米',
    brand: '小米',
    category: '手机'
  },
  {
    patterns: [/redmi\s*(?:k\d+|note)/gi, /红米/gi],
    name: 'Redmi',
    brand: '小米',
    category: '手机'
  },
  
  // ===== 三星 =====
  {
    patterns: [/galaxy\s*(?:s\d+|z\s*(?:fold|flip))/gi, /三星/gi, /samsung/gi],
    name: '三星',
    brand: '三星',
    category: '手机'
  },
  
  // ===== OPPO/Vivo =====
  {
    patterns: [/oppo/gi, /vivo/gi, /荣耀/gi, /honor/gi],
    name: 'OPPO/Vivo',
    brand: 'OPPO',
    category: '手机'
  },
  
  // ===== 戴森 =====
  {
    patterns: [/戴森\s*(?:吹风机|卷发棒)?/gi, /dyson\s*(?:airwrap|supersonic)?/gi, /hd15|hd03/gi],
    name: '戴森吹风机',
    brand: '戴森',
    category: '个护',
    aliases: ['dyson吹风机']
  },
  {
    patterns: [/戴森\s*吸尘器/gi, /dyson\s*v(10|12|15|8)/gi],
    name: '戴森吸尘器',
    brand: '戴森',
    category: '家电'
  },
  
  // ===== 游戏机 =====
  {
    patterns: [/nintendo\s*switch|ns|任天堂/gi],
    name: 'Nintendo Switch',
    brand: 'Nintendo',
    category: '游戏机'
  },
  {
    patterns: [/ps5|playstation\s*5|ps4|playstation\s*4/gi],
    name: 'PS5',
    brand: '索尼',
    category: '游戏机'
  },
  {
    patterns: [/xbox/gi],
    name: 'Xbox',
    brand: '微软',
    category: '游戏机'
  },
  
  // ===== 酒水 =====
  {
    patterns: [/飞天\s*茅台|茅台\s*(?:53|500)/gi, /(?:贵州\s*)?茅台/gi],
    name: '茅台',
    brand: '茅台',
    category: '酒水'
  },
  {
    patterns: [/五粮液/gi],
    name: '五粮液',
    brand: '五粮液',
    category: '酒水'
  },
  {
    patterns: [/泸州老窖/gi],
    name: '泸州老窖',
    brand: '泸州老窖',
    category: '酒水'
  },
  
  // ===== 食品饮料 =====
  {
    patterns: [/农夫山泉/gi, /农夫果园/gi],
    name: '农夫山泉',
    brand: '农夫山泉',
    category: '饮料'
  },
  {
    patterns: [/可口可乐/gi, /百事可乐/gi, /可乐/gi],
    name: '可乐',
    brand: '可口可乐',
    category: '饮料'
  },
  {
    patterns: [/娃哈哈/gi],
    name: '娃哈哈',
    brand: '娃哈哈',
    category: '饮料'
  },
  {
    patterns: [/伊利/gi, /蒙牛/gi, /光明\s*牛奶/gi],
    name: '牛奶',
    brand: '伊利',
    category: '乳制品'
  },
  {
    patterns: [/旺旺/gi, /雪饼/gi, /仙贝/gi],
    name: '旺旺雪饼',
    brand: '旺旺',
    category: '零食'
  },
  {
    patterns: [/奥利奥/gi],
    name: '奥利奥',
    brand: '亿滋',
    category: '零食'
  },
  {
    patterns: [/德芙/gi, /巧克力/gi],
    name: '巧克力',
    brand: '德芙',
    category: '零食'
  },
  {
    patterns: [/薯片/gi, /乐事/gi, /可比克/gi],
    name: '薯片',
    brand: '乐事',
    category: '零食'
  },
  {
    patterns: [/康师傅/gi, /统一\s*方便面/gi, /今麦郎/gi],
    name: '方便面',
    brand: '康师傅',
    category: '食品'
  },
  
  // ===== 运动品牌 =====
  {
    patterns: [/耐克|nike/gi, /aj|air\s*jordan/gi],
    name: '耐克',
    brand: '耐克',
    category: '运动'
  },
  {
    patterns: [/阿迪达斯|adidas/gi, /三叶草/gi],
    name: '阿迪达斯',
    brand: '阿迪达斯',
    category: '运动'
  },
  {
    patterns: [/安踏/gi, /李宁/gi, /361/gi],
    name: '安踏',
    brand: '安踏',
    category: '运动'
  },
  {
    patterns: [/新百伦|new\s*balance/gi, /NB/gi],
    name: 'New Balance',
    brand: 'New Balance',
    category: '运动'
  },
  
  // ===== 化妆品/护肤品 =====
  {
    patterns: [/雅诗兰黛/gi, /兰蔻/gi, /sk-?ii/gi, /神仙水/gi],
    name: '高端护肤品',
    brand: '雅诗兰黛',
    category: '美妆'
  },
  {
    patterns: [/海蓝之谜|lamer/gi],
    name: '海蓝之谜',
    brand: '海蓝之谜',
    category: '美妆'
  },
  {
    patterns: [/迪奥\d+/gi, /dior/gi, /香奈儿|chanel/gi, /YSL/gi],
    name: '奢侈品美妆',
    brand: '迪奥',
    category: '美妆'
  },
  {
    patterns: [/mac\s*(?:子弹头|口红)/gi, /魅可/gi],
    name: 'MAC口红',
    brand: 'MAC',
    category: '美妆'
  },
  
  // ===== 家电 =====
  {
    patterns: [/小米\s*(?:空调|冰箱|洗衣机|电视)/gi],
    name: '小米家电',
    brand: '小米',
    category: '家电'
  },
  {
    patterns: [/格力|美的|海尔/gi],
    name: '空调',
    brand: '格力',
    category: '家电'
  },
  {
    patterns: [/飞利浦|飞科/gi, /吹风机/gi],
    name: '吹风机',
    brand: '飞利浦',
    category: '个护'
  },
  
  // ===== 母婴 =====
  {
    patterns: [/爱他美|美素佳儿|惠氏|雅培/gi],
    name: '婴儿奶粉',
    brand: '爱他美',
    category: '母婴'
  },
  {
    patterns: [/花王|好奇|帮宝适|大王\s*(?:天使)?/gi],
    name: '纸尿裤',
    brand: '花王',
    category: '母婴'
  },
  
  // ===== 茶叶/保健品 =====
  {
    patterns: [/小罐茶|竹叶青|龙井|碧螺春|铁观音/gi],
    name: '茶叶',
    brand: '小罐茶',
    category: '茶'
  },
  {
    patterns: [/燕窝/gi],
    name: '燕窝',
    brand: '燕窝',
    category: '保健品'
  }
]

/**
 * 从文本中提取商品关键词
 */
function extractProductKeywords(text: string, words: string[] = []): string[] {
  const keywords: string[] = []
  const lowerText = text.toLowerCase()
  const combinedWords = (words || []).join('').toLowerCase()
  
  // 1. 使用商品数据库匹配
  for (const product of PRODUCT_DATABASE) {
    for (const pattern of product.patterns) {
      if (pattern.test(text)) {
        keywords.push(product.name)
        if (product.aliases) {
          keywords.push(...product.aliases)
        }
        break
      }
      if (pattern.test(combinedWords)) {
        keywords.push(product.name)
        break
      }
    }
  }
  
  // 2. 数字+品牌组合匹配
  const numberPattern = /(\d+)\s*(?:pro|max|plus)?/gi
  const numbers = text.match(numberPattern) || []
  for (const num of numbers) {
    if (parseInt(num) >= 10 && parseInt(num) <= 20) {
      if (lowerText.includes('iphone') || combinedWords.includes('iphone')) {
        keywords.push(`iPhone ${num}`)
      }
    }
  }
  
  // 3. 价格信息
  const priceMatch = text.match(/[¥￥$]?\s*(\d+(?:\.\d{2})?)/)
  if (priceMatch) {
    const price = parseFloat(priceMatch[1])
    if (price >= 5000) keywords.push('高端商品')
    else if (price >= 1000) keywords.push('中端商品')
  }
  
  // 4. 去除空格干扰
  const cleanText = text.replace(/\s+/g, '').toLowerCase()
  const commonBrands = ['iphone', 'ipad', 'macbook', 'airpods', 'switch', 'ps5', 'dyson', 'nike', 'adidas']
  for (const brand of commonBrands) {
    if (cleanText.includes(brand) && !keywords.some(k => k.toLowerCase().includes(brand))) {
      keywords.push(brand)
    }
  }
  
  return [...new Set(keywords)]
}

/**
 * 根据 OCR 结果生成标准商品名称
 * 优化版本：提高匹配成功率，降低误识别
 */
export function generateProductNameFromOcr(ocrResult: OcrResult): {
  name: string
  brand: string
  category: string
  confidence: number
  matchedBy: string
} {
  const { text, productKeywords, confidence, words } = ocrResult

  // 清理文本：去除空格、转小写
  const cleanText = text.replace(/\s+/g, '').toLowerCase()
  const cleanWords = (words || []).map(w => w.replace(/\s+/g, '').toLowerCase()).join('')
  
  const brandMap: Record<string, string> = {
    'iphone': 'Apple', 'ipad': 'Apple', 'macbook': 'Apple', 'airpods': 'Apple',
    'huawei': '华为', '华为': '华为', 'mate': '华为', 'pura': '华为',
    'xiaomi': '小米', '小米': '小米', 'redmi': '小米',
    '三星': '三星', 'samsung': '三星',
    'oppo': 'OPPO', 'vivo': 'vivo', '荣耀': '荣耀',
    '戴森': '戴森', 'dyson': '戴森',
    '耐克': '耐克', 'nike': '耐克',
    '阿迪达斯': '阿迪达斯', 'adidas': '阿迪达斯',
    'switch': 'Nintendo', 'ps5': '索尼',
    '茅台': '茅台', '五粮液': '五粮液',
  }

  // 辅助函数：检查文本是否匹配
  const matches = (pattern: string | RegExp): boolean => {
    const flags = typeof pattern === 'string' ? '' : 'gi'
    const str = typeof pattern === 'string' ? pattern.toLowerCase() : pattern.source
    return cleanText.includes(str.toLowerCase()) || cleanWords.includes(str.toLowerCase())
  }
  
  const matchesRegex = (regex: RegExp): boolean => {
    // 重置 lastIndex
    regex.lastIndex = 0
    return regex.test(text) || regex.test(cleanText) || regex.test(cleanWords)
  }

  // 计算基础置信度：使用 OCR 置信度，但有保底值
  const baseConfidence = Math.max(confidence / 100, 0.4)

  // iPhone 系列（最高优先级，Apple 品牌）
  const iphonePatterns = [
    { regex: /iphone\s*16\s*pro\s*max/gi, name: 'iPhone 16 Pro Max' },
    { regex: /iphone\s*16\s*pro/gi, name: 'iPhone 16 Pro' },
    { regex: /iphone\s*16/gi, name: 'iPhone 16' },
    { regex: /iphone\s*15\s*pro\s*max/gi, name: 'iPhone 15 Pro Max' },
    { regex: /iphone\s*15\s*pro/gi, name: 'iPhone 15 Pro' },
    { regex: /iphone\s*15/gi, name: 'iPhone 15' },
    { regex: /iphone\s*14\s*pro\s*max/gi, name: 'iPhone 14 Pro Max' },
    { regex: /iphone\s*14\s*pro/gi, name: 'iPhone 14 Pro' },
    { regex: /iphone\s*14/gi, name: 'iPhone 14' },
    { regex: /iphone\s*13/gi, name: 'iPhone 13' },
    { regex: /iphone\s*12/gi, name: 'iPhone 12' },
    { regex: /iphone16promax/gi, name: 'iPhone 16 Pro Max' },
    { regex: /iphone16pro/gi, name: 'iPhone 16 Pro' },
    { regex: /iphone16/gi, name: 'iPhone 16' },
    { regex: /iphone/gi, name: 'iPhone' },
  ]
  for (const p of iphonePatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: 'Apple',
        category: '手机',
        confidence: Math.min(baseConfidence + 0.3, 1),
        matchedBy: 'iPhone系列'
      }
    }
  }

  // Apple 产品
  const applePatterns = [
    { regex: /macbook\s*air/gi, name: 'MacBook Air' },
    { regex: /macbook\s*pro/gi, name: 'MacBook Pro' },
    { regex: /macbook/gi, name: 'MacBook' },
    { regex: /ipad\s*pro/gi, name: 'iPad Pro' },
    { regex: /ipad\s*air/gi, name: 'iPad Air' },
    { regex: /ipad\s*mini/gi, name: 'iPad mini' },
    { regex: /ipad/gi, name: 'iPad' },
    { regex: /airpods\s*pro/gi, name: 'AirPods Pro' },
    { regex: /airpods/gi, name: 'AirPods' },
    { regex: /apple\s*watch/gi, name: 'Apple Watch' },
  ]
  for (const p of applePatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: 'Apple',
        category: p.name.includes('Watch') ? '手表' : p.name.includes('Pad') ? '平板' : '电脑',
        confidence: Math.min(baseConfidence + 0.25, 1),
        matchedBy: 'Apple产品'
      }
    }
  }

  // 华为
  const huaweiPatterns = [
    { regex: /mate\s*60\s*pro/gi, name: '华为Mate60 Pro' },
    { regex: /mate\s*60/gi, name: '华为Mate60' },
    { regex: /mate\s*50\s*pro/gi, name: '华为Mate50 Pro' },
    { regex: /mate\s*50/gi, name: '华为Mate50' },
    { regex: /pura\s*70\s*ultra/gi, name: '华为Pura70 Ultra' },
    { regex: /pura\s*70\s*pro/gi, name: '华为Pura70 Pro' },
    { regex: /pura\s*70/gi, name: '华为Pura70' },
    { regex: /mate60/gi, name: '华为Mate60' },
    { regex: /mate50/gi, name: '华为Mate50' },
    { regex: /pura70/gi, name: '华为Pura70' },
  ]
  for (const p of huaweiPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: '华为',
        category: '手机',
        confidence: Math.min(baseConfidence + 0.25, 1),
        matchedBy: '华为产品'
      }
    }
  }
  // 通用华为匹配
  if (matches(/华为/) || matches(/huawei/) || matches(/mate/) || matches(/pura/)) {
    return {
      name: '华为手机',
      brand: '华为',
      category: '手机',
      confidence: Math.min(baseConfidence + 0.2, 1),
      matchedBy: '华为品牌'
    }
  }

  // 小米
  const xiaomiPatterns = [
    { regex: /小米\s*14\s*ultra/gi, name: '小米14 Ultra' },
    { regex: /小米\s*14/gi, name: '小米14' },
    { regex: /小米\s*13\s*ultra/gi, name: '小米13 Ultra' },
    { regex: /小米\s*13/gi, name: '小米13' },
    { regex: /小米\s*12/gi, name: '小米12' },
    { regex: /redmi\s*k70/gi, name: 'Redmi K70' },
    { regex: /redmi\s*k60/gi, name: 'Redmi K60' },
    { regex: /redmi\s*note/gi, name: 'Redmi Note' },
  ]
  for (const p of xiaomiPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: '小米',
        category: '手机/数码',
        confidence: Math.min(baseConfidence + 0.25, 1),
        matchedBy: '小米产品'
      }
    }
  }
  if (matches(/小米/) || matches(/xiaomi/) || matches(/redmi/) || matches(/红米/)) {
    return {
      name: '小米手机',
      brand: '小米',
      category: '手机/数码',
      confidence: Math.min(baseConfidence + 0.2, 1),
      matchedBy: '小米品牌'
    }
  }

  // 三星
  if (matches(/三星/) || matches(/samsung/) || matches(/galaxy/)) {
    return {
      name: '三星手机',
      brand: '三星',
      category: '手机',
      confidence: Math.min(baseConfidence + 0.2, 1),
      matchedBy: '三星品牌'
    }
  }

  // 游戏机
  const gamingPatterns = [
    { regex: /nintendo\s*switch\s*oled/gi, name: 'Nintendo Switch OLED' },
    { regex: /nintendo\s*switch/gi, name: 'Nintendo Switch' },
    { regex: /switch\s*oled/gi, name: 'Nintendo Switch OLED' },
    { regex: /ns\s*oled/gi, name: 'Nintendo Switch OLED' },
    { regex: /ns/gi, name: 'Nintendo Switch' },
    { regex: /任天堂/gi, name: 'Nintendo Switch' },
    { regex: /ps5/gi, name: 'PS5' },
    { regex: /ps4/gi, name: 'PS4' },
    { regex: /playstation\s*5/gi, name: 'PS5' },
    { regex: /playstation\s*4/gi, name: 'PS4' },
    { regex: /playstation/gi, name: 'PlayStation' },
    { regex: /xbox\s*series\s*x/gi, name: 'Xbox Series X' },
    { regex: /xbox\s*series\s*s/gi, name: 'Xbox Series S' },
    { regex: /xbox/gi, name: 'Xbox' },
  ]
  for (const p of gamingPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: p.name.includes('Nintendo') ? 'Nintendo' : p.name.includes('PS') ? '索尼' : '微软',
        category: '游戏机',
        confidence: Math.min(baseConfidence + 0.25, 1),
        matchedBy: '游戏机'
      }
    }
  }

  // 戴森
  const dysonPatterns = [
    { regex: /dyson\s*airwrap/gi, name: '戴森Airwrap' },
    { regex: /戴森\s*卷发/gi, name: '戴森Airwrap' },
    { regex: /airwrap/gi, name: '戴森Airwrap' },
    { regex: /hd15/gi, name: '戴森吹风机 HD15' },
    { regex: /hd03/gi, name: '戴森吹风机 HD03' },
    { regex: /dyson\s*hd15/gi, name: '戴森吹风机 HD15' },
    { regex: /dyson\s*hd03/gi, name: '戴森吹风机 HD03' },
    { regex: /戴森\s*吹风机/gi, name: '戴森吹风机' },
    { regex: /dyson\s*吹风机/gi, name: '戴森吹风机' },
    { regex: /dyson\s*v15/gi, name: '戴森V15吸尘器' },
    { regex: /dyson\s*v12/gi, name: '戴森V12吸尘器' },
    { regex: /dyson\s*v10/gi, name: '戴森V10吸尘器' },
    { regex: /戴森\s*吸尘/gi, name: '戴森吸尘器' },
    { regex: /dyson/gi, name: '戴森' },
    { regex: /戴森/gi, name: '戴森' },
  ]
  for (const p of dysonPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: '戴森',
        category: p.name.includes('吸尘') ? '家电' : '个护',
        confidence: Math.min(baseConfidence + 0.25, 1),
        matchedBy: '戴森产品'
      }
    }
  }

  // 运动品牌
  const sportPatterns = [
    { regex: /air\s*jordan/gi, name: 'Air Jordan' },
    { regex: /airjordan/gi, name: 'Air Jordan' },
    { regex: /aj\d/gi, name: 'Air Jordan' },
    { regex: /耐克\s*运动鞋/gi, name: '耐克运动鞋' },
    { regex: /nike\s*运动鞋/gi, name: '耐克运动鞋' },
    { regex: /耐克/gi, name: '耐克' },
    { regex: /nike/gi, name: '耐克' },
    { regex: /阿迪达斯/gi, name: '阿迪达斯' },
    { regex: /adidas\s*运动鞋/gi, name: '阿迪达斯运动鞋' },
    { regex: /adidas/gi, name: '阿迪达斯' },
    { regex: /新百伦/gi, name: 'New Balance' },
    { regex: /new\s*balance/gi, name: 'New Balance' },
    { regex: /\bnb\s*运动鞋/gi, name: 'New Balance' },
    { regex: /安踏/gi, name: '安踏' },
    { regex: /李宁/gi, name: '李宁' },
  ]
  for (const p of sportPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: p.name.includes('耐克') ? '耐克' : p.name.includes('阿迪') ? '阿迪达斯' : '运动品牌',
        category: '运动',
        confidence: Math.min(baseConfidence + 0.2, 1),
        matchedBy: '运动品牌'
      }
    }
  }

  // 美妆
  const beautyPatterns = [
    { regex: /sk-?ii/gi, name: 'SK-II' },
    { regex: /skii/gi, name: 'SK-II' },
    { regex: /神仙水/gi, name: 'SK-II神仙水' },
    { regex: /海蓝之谜/gi, name: '海蓝之谜' },
    { regex: /lamer/gi, name: '海蓝之谜' },
    { regex: /兰蔻/gi, name: '兰蔻' },
    { regex: /lancome/gi, name: '兰蔻' },
    { regex: /雅诗兰黛/gi, name: '雅诗兰黛' },
    { regex: /estee\s*lauder/gi, name: '雅诗兰黛' },
    { regex: /迪奥/gi, name: '迪奥' },
    { regex: /dior/gi, name: '迪奥' },
    { regex: /香奈儿/gi, name: '香奈儿' },
    { regex: /chanel/gi, name: '香奈儿' },
    { regex: /ysl/gi, name: 'YSL' },
    { regex: /mac\s*口红/gi, name: 'MAC口红' },
    { regex: /魅可/gi, name: 'MAC' },
    { regex: /mac/gi, name: 'MAC' },
  ]
  for (const p of beautyPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: '高端美妆',
        category: '美妆',
        confidence: Math.min(baseConfidence + 0.2, 1),
        matchedBy: '美妆产品'
      }
    }
  }

  // 酒水
  const winePatterns = [
    { regex: /飞天\s*茅台/gi, name: '飞天茅台' },
    { regex: /贵州\s*茅台/gi, name: '茅台' },
    { regex: /茅台\s*(?:53|500)/gi, name: '茅台' },
    { regex: /茅台/gi, name: '茅台' },
    { regex: /五粮液/gi, name: '五粮液' },
    { regex: /泸州老窖/gi, name: '泸州老窖' },
    { regex: /汾酒/gi, name: '汾酒' },
    { regex: /洋河\s*梦之蓝/gi, name: '洋河梦之蓝' },
    { regex: /洋河\s*海之蓝/gi, name: '洋河海之蓝' },
    { regex: /洋河/gi, name: '洋河' },
  ]
  for (const p of winePatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: p.name.includes('茅台') ? '茅台' : '白酒',
        category: '酒水',
        confidence: Math.min(baseConfidence + 0.2, 1),
        matchedBy: '酒水'
      }
    }
  }

  // 母婴
  const babyPatterns = [
    { regex: /爱他美/gi, name: '爱他美奶粉' },
    { regex: /美素佳儿/gi, name: '美素佳儿' },
    { regex: /惠氏/gi, name: '惠氏' },
    { regex: /雅培/gi, name: '雅培' },
    { regex: /美赞臣/gi, name: '美赞臣' },
    { regex: /花王\s*纸尿裤/gi, name: '花王纸尿裤' },
    { regex: /花王/gi, name: '花王' },
    { regex: /好奇\s*纸尿裤/gi, name: '好奇纸尿裤' },
    { regex: /好奇/gi, name: '好奇' },
    { regex: /帮宝适/gi, name: '帮宝适' },
  ]
  for (const p of babyPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: '母婴用品',
        category: '母婴',
        confidence: Math.min(baseConfidence + 0.2, 1),
        matchedBy: '母婴用品'
      }
    }
  }

  // 食品饮料
  const foodPatterns = [
    { regex: /农夫山泉/gi, name: '农夫山泉' },
    { regex: /可口可乐/gi, name: '可口可乐' },
    { regex: /百事可乐/gi, name: '百事可乐' },
    { regex: /可乐/gi, name: '可乐' },
    { regex: /元气森林/gi, name: '元气森林' },
    { regex: /娃哈哈/gi, name: '娃哈哈' },
    { regex: /康师傅/gi, name: '康师傅' },
    { regex: /统一\s*方便面/gi, name: '统一方便面' },
    { regex: /今麦郎/gi, name: '今麦郎' },
    { regex: /奥利奥/gi, name: '奥利奥' },
    { regex: /德芙\s*巧克力/gi, name: '德芙巧克力' },
    { regex: /德芙/gi, name: '德芙' },
    { regex: /费列罗/gi, name: '费列罗' },
    { regex: /乐事\s*薯片/gi, name: '乐事薯片' },
    { regex: /乐事/gi, name: '乐事' },
    { regex: /可比克/gi, name: '可比克' },
    { regex: /伊利\s*牛奶/gi, name: '伊利牛奶' },
    { regex: /伊利/gi, name: '伊利' },
    { regex: /蒙牛/gi, name: '蒙牛' },
    { regex: /光明\s*牛奶/gi, name: '光明牛奶' },
  ]
  for (const p of foodPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: '食品饮料',
        category: '食品',
        confidence: Math.min(baseConfidence + 0.2, 1),
        matchedBy: '食品饮料'
      }
    }
  }

  // 茶叶/保健品
  const healthPatterns = [
    { regex: /小罐茶/gi, name: '小罐茶' },
    { regex: /竹叶青/gi, name: '竹叶青' },
    { regex: /龙井/gi, name: '龙井' },
    { regex: /碧螺春/gi, name: '碧螺春' },
    { regex: /铁观音/gi, name: '铁观音' },
    { regex: /燕窝/gi, name: '燕窝' },
    { regex: /冬虫夏草/gi, name: '冬虫夏草' },
    { regex: /人参/gi, name: '人参' },
  ]
  for (const p of healthPatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: '保健品',
        category: '保健品',
        confidence: Math.min(baseConfidence + 0.2, 1),
        matchedBy: '保健品'
      }
    }
  }

  // 家电
  const appliancePatterns = [
    { regex: /格力\s*空调/gi, name: '格力空调' },
    { regex: /格力/gi, name: '格力' },
    { regex: /美的\s*空调/gi, name: '美的空调' },
    { regex: /美的/gi, name: '美的' },
    { regex: /海尔\s*冰箱/gi, name: '海尔冰箱' },
    { regex: /海尔/gi, name: '海尔' },
    { regex: /飞利浦\s*吹风机/gi, name: '飞利浦吹风机' },
    { regex: /飞科\s*吹风机/gi, name: '飞科吹风机' },
    { regex: /吹风机/gi, name: '吹风机' },
    { regex: /飞利浦/gi, name: '飞利浦' },
    { regex: /飞科/gi, name: '飞科' },
  ]
  for (const p of appliancePatterns) {
    if (matchesRegex(p.regex)) {
      return {
        name: p.name,
        brand: p.name.includes('格力') ? '格力' : p.name.includes('美的') ? '美的' : p.name.includes('海尔') ? '海尔' : '家电',
        category: '家电',
        confidence: Math.min(baseConfidence + 0.2, 1),
        matchedBy: '家电'
      }
    }
  }

  // 使用提取的关键词作为备选
  if (productKeywords.length > 0) {
    // 尝试从关键词中提取品牌
    let brand = '综合'
    for (const [key, value] of Object.entries(brandMap)) {
      if (cleanText.includes(key.toLowerCase()) || cleanWords.includes(key.toLowerCase())) {
        brand = value
        break
      }
    }
    
    // 如果有关键词，至少返回第一个匹配的商品
    const keywordName = productKeywords[0]
    if (keywordName) {
      return {
        name: keywordName,
        brand: brand,
        category: '综合',
        confidence: Math.min(baseConfidence, 0.5), // 降低置信度要求
        matchedBy: '关键词匹配'
      }
    }
  }

  // 最后尝试：直接从 OCR 文本中提取品牌关键词
  // 检查是否有任何已知品牌词
  const anyBrandPatterns = [
    { pattern: /iphone|ipad|macbook|airpods|apple/gi, name: 'Apple产品' },
    { pattern: /huawei|华为|mate|pura/gi, name: '华为产品' },
    { pattern: /xiaomi|小米|redmi|红米/gi, name: '小米产品' },
    { pattern: /三星|samsung|galaxy/gi, name: '三星产品' },
    { pattern: /dyson|戴森/gi, name: '戴森产品' },
    { pattern: /nike|耐克|adidas|阿迪达斯/gi, name: '运动产品' },
    { pattern: /茅台|五粮液|泸州老窖/gi, name: '酒水' },
  ]
  
  for (const bp of anyBrandPatterns) {
    bp.pattern.lastIndex = 0
    if (bp.pattern.test(text) || bp.pattern.test(cleanText)) {
      return {
        name: bp.name,
        brand: bp.name.replace('产品', '').replace('运动', '').replace('酒水', '白酒'),
        category: '综合',
        confidence: 0.4, // 有品牌识别，给一个合理的置信度
        matchedBy: '品牌识别'
      }
    }
  }

  // 完全无法识别
  return {
    name: '未知商品',
    brand: '',
    category: '综合',
    confidence: 0.2,
    matchedBy: '未匹配'
  }
}
