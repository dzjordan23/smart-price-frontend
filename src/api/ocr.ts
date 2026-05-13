/**
 * 前端 OCR 服务 - 使用 Tesseract.js 进行图片文字识别
 * 支持中英文混合识别
 */

// 动态导入 Tesseract.js 以减小初始加载体积
let Tesseract: any = null

async function getTesseract() {
  if (!Tesseract) {
    const module = await import('tesseract.js')
    Tesseract = module.default || module
  }
  return Tesseract
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
  words: string[]         // 识别出的单词/词组
  productKeywords: string[] // 提取的商品关键词
}

/**
 * 从图片中提取文字
 */
export async function extractTextFromImage(
  imageUrl: string,
  onProgress?: ProgressCallback
): Promise<OcrResult> {
  try {
    const OCR = await getTesseract()
    
    const result = await OCR.recognize(
      imageUrl,
      'chi_sim+eng', // 简体中文 + 英文
      {
        logger: (m: any) => {
          if (onProgress && m.status) {
            onProgress({
              status: m.status,
              progress: m.progress || 0
            })
          }
        }
      }
    )

    const text = result.data.text.trim()
    const confidence = result.data.confidence

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
    const productKeywords = extractProductKeywords(text)

    return {
      text,
      confidence,
      words,
      productKeywords
    }
  } catch (error) {
    console.error('OCR 识别失败:', error)
    throw new Error('图片识别失败，请重试')
  }
}

/**
 * 从文本中提取商品关键词
 * 匹配常见的商品名称、品牌、型号等
 */
function extractProductKeywords(text: string): string[] {
  const keywords: string[] = []
  const lowerText = text.toLowerCase()

  // 品牌关键词
  const brands = [
    'iphone', 'ipad', 'macbook', 'airpods', 'apple',
    'huawei', '华为', 'mate', 'pura', 'p50', 'p60',
    'xiaomi', '小米', 'redmi', '红米',
    'samsung', '三星', 'galaxy',
    'oppo', 'vivo', '荣耀', 'honor',
    'dyson', '戴森',
    'nike', '耐克', 'adidas', '阿迪达斯',
    'switch', 'ps5', 'playstation', 'xbox',
    '茅台', '五粮液'
  ]

  for (const brand of brands) {
    if (lowerText.includes(brand.toLowerCase())) {
      keywords.push(brand)
    }
  }

  // 型号关键词
  const models = [
    // iPhone
    'iphone 16', 'iphone 15', 'iphone 14', 'iphone 13',
    'iphone16', 'iphone15', 'iphone14', 'iphone13',
    'iphone 16 pro', 'iphone 16 pro max',
    'iphone 15 pro', 'iphone 15 pro max',
    // Mac
    'macbook air', 'macbook pro', 'macbook',
    // iPad
    'ipad pro', 'ipad air', 'ipad mini', 'ipad',
    // 华为
    'mate60', 'mate 60', 'mate50', 'mate 50',
    'pura70', 'pura 70', 'pura80', 'pura 80',
    // 小米
    '小米14', '小米13', '小米12',
    'redmi k70', 'redmi k60', 'redmi note',
    // 三星
    's24', 's23', 's22',
    'z fold', 'z flip', 'fold',
    // 戴森
    '戴森吹风机', 'hd15', 'hd03',
    '戴森吸尘器', 'v15', 'v12', 'v10',
    // 游戏机
    'switch', 'nintendo switch',
    'ps5', 'ps4',
    'xbox series x', 'xbox series s',
    // 酒水
    '茅台', '飞天茅台', '五粮液',
    // 运动
    '耐克', '阿迪达斯', 'aj', 'jordan'
  ]

  for (const model of models) {
    if (lowerText.includes(model.toLowerCase())) {
      // 标准化名称
      let normalized = model
      if (model === 'iphone 16' || model === 'iphone16') keywords.push('iPhone 16')
      else if (model === 'iphone 15' || model === 'iphone15') keywords.push('iPhone 15')
      else if (model === 'macbook air') keywords.push('MacBook Air')
      else if (model === 'macbook pro') keywords.push('MacBook Pro')
      else if (model === 'ipad pro') keywords.push('iPad Pro')
      else if (model === 'ipad air') keywords.push('iPad Air')
      else if (model === 'nintendo switch') keywords.push('Nintendo Switch')
      else if (model === 'switch') keywords.push('Nintendo Switch')
      else if (model === 'ps5') keywords.push('PS5')
      else if (model === '戴森吹风机') keywords.push('戴森吹风机')
      else if (model === '戴森吸尘器') keywords.push('戴森吸尘器')
      else if (model === '茅台') keywords.push('茅台')
      else if (model.includes('mate')) keywords.push('华为Mate')
      else if (model.includes('pura')) keywords.push('华为Pura')
      else if (model.includes('小米')) keywords.push(model)
      else keywords.push(model)
    }
  }

  // 数字+型号组合（如 "16 Pro Max"）
  const modelPatterns = [
    /(\d+)\s*(?:代?|pro|max|plus)?/gi,
    /(?:第?\s*)?(\d+)\s*(?:代|款|型号)/gi,
  ]

  for (const pattern of modelPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      keywords.push(...matches)
    }
  }

  // 价格信息（帮助确认商品类别）
  const priceMatch = text.match(/[¥￥]?\s*(\d{3,5})(?:\.\d{2})?/)
  if (priceMatch) {
    const price = parseInt(priceMatch[1])
    // 根据价格区间推断商品类型
    if (price >= 5000) keywords.push('高端商品')
    else if (price >= 2000) keywords.push('中端商品')
  }

  // 去重
  return [...new Set(keywords)]
}

/**
 * 根据 OCR 结果生成标准商品名称
 */
export function generateProductNameFromOcr(ocrResult: OcrResult): {
  name: string
  brand: string
  category: string
  confidence: number
} {
  const { text, productKeywords, confidence } = ocrResult

  // 品牌映射
  const brandMap: Record<string, string> = {
    'iphone': 'Apple',
    'ipad': 'Apple',
    'macbook': 'Apple',
    'airpods': 'Apple',
    'huawei': '华为',
    '华为': '华为',
    'mate': '华为',
    'pura': '华为',
    'xiaomi': '小米',
    '小米': '小米',
    'redmi': '小米',
    '三星': '三星',
    'samsung': '三星',
    'oppo': 'OPPO',
    'vivo': 'vivo',
    '荣耀': '荣耀',
    'honor': '荣耀',
    '戴森': '戴森',
    'dyson': '戴森',
    '耐克': '耐克',
    'nike': '耐克',
    '阿迪达斯': '阿迪达斯',
    'adidas': '阿迪达斯',
    'switch': 'Nintendo',
    'ps5': '索尼',
    'playstation': '索尼',
    'xbox': '微软',
    '茅台': '茅台',
    '五粮液': '五粮液',
  }

  // 分类映射
  const categoryMap: Record<string, string> = {
    'Apple': ['iPhone', 'iPad', 'MacBook', 'AirPods', 'Mac'],
    '华为': ['Mate', 'Pura', 'P系列', 'Mate系列'],
    '小米': ['小米手机', '小米笔记本', '小米生态'],
    '戴森': ['吹风机', '吸尘器', '空气净化器'],
    'Nintendo': ['Switch', '游戏机'],
    '索尼': ['PS5', 'PlayStation', '游戏机'],
  }

  // 识别品牌
  let brand = ''
  for (const [key, value] of Object.entries(brandMap)) {
    if (text.toLowerCase().includes(key.toLowerCase())) {
      brand = value
      break
    }
  }

  // 生成商品名称
  let name = '未知商品'
  const lowerText = text.toLowerCase()

  // 精确匹配
  if (lowerText.includes('iphone 16 pro max')) name = 'iPhone 16 Pro Max'
  else if (lowerText.includes('iphone 16 pro')) name = 'iPhone 16 Pro'
  else if (lowerText.includes('iphone 16')) name = 'iPhone 16'
  else if (lowerText.includes('iphone 15 pro max')) name = 'iPhone 15 Pro Max'
  else if (lowerText.includes('iphone 15 pro')) name = 'iPhone 15 Pro'
  else if (lowerText.includes('iphone 15')) name = 'iPhone 15'
  else if (lowerText.includes('macbook air')) name = 'MacBook Air'
  else if (lowerText.includes('macbook pro')) name = 'MacBook Pro'
  else if (lowerText.includes('ipad pro')) name = 'iPad Pro'
  else if (lowerText.includes('ipad air')) name = 'iPad Air'
  else if (lowerText.includes('airpods')) name = 'AirPods'
  else if (lowerText.includes('mate60') || lowerText.includes('mate 60')) name = '华为Mate60'
  else if (lowerText.includes('mate50') || lowerText.includes('mate 50')) name = '华为Mate50'
  else if (lowerText.includes('pura70') || lowerText.includes('pura 70')) name = '华为Pura70'
  else if (lowerText.includes('小米14')) name = '小米14'
  else if (lowerText.includes('小米13')) name = '小米13'
  else if (lowerText.includes('戴森吹风机')) name = '戴森吹风机'
  else if (lowerText.includes('戴森吸尘器') || lowerText.includes('dyson v')) name = '戴森吸尘器'
  else if (lowerText.includes('switch') || lowerText.includes('nintendo')) name = 'Nintendo Switch'
  else if (lowerText.includes('ps5') || lowerText.includes('playstation')) name = 'PS5'
  else if (lowerText.includes('茅台')) name = '茅台'
  else if (lowerText.includes('耐克') || lowerText.includes('nike')) name = '耐克'
  else if (lowerText.includes('阿迪达斯') || lowerText.includes('adidas')) name = '阿迪达斯'
  else if (productKeywords.length > 0) {
    name = productKeywords[0]
  }

  // 识别分类
  let category = '综合'
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        category = cat
        break
      }
    }
  }

  return {
    name,
    brand,
    category,
    confidence: confidence / 100
  }
}
