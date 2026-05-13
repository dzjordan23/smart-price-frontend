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
    const productKeywords = extractProductKeywords(text, words)

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

// =============== 商品数据库 - 支持更多常见商品 ===============
interface ProductPattern {
  patterns: RegExp[]           // 匹配模式（正则）
  name: string                 // 标准商品名称
  brand: string                // 品牌
  category: string             // 分类
  aliases?: string[]           // 别名/常见称呼
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
    patterns: [/galaxy\s*(?:s\d+|z\s*(?:fold|flip))/gi, /三星/gi, /samsumg|samsung/gi],
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
    patterns: [/戴森\s*吸尘器/gi, /dyson\s*v(10|12|15|8)/gi, /dyson\s*vacuum/gi],
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
    patterns: [/兰蔻\s*(?:小黑瓶|粉水)/gi],
    name: '兰蔻粉水',
    brand: '兰蔻',
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
  {
    patterns: [/飞利浦\s*(?:电动牙刷|剃须刀)/gi, /oral-?b/gi],
    name: '电动牙刷',
    brand: '飞利浦',
    category: '个护'
  },
  {
    patterns: [/戴森\s*(?:吹风机|卷发)/gi, /dyson/gi],
    name: '戴森吹风机',
    brand: '戴森',
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
  
  // ===== 数码配件 =====
  {
    patterns: [/小米\s*(?:充电宝|移动电源|手环|耳机)/gi],
    name: '小米配件',
    brand: '小米',
    category: '配件'
  },
  {
    patterns: [/airpods?(?:\s*pro)?/gi, /airpod/gi],
    name: 'AirPods',
    brand: 'Apple',
    category: '耳机'
  },
  {
    patterns: [/索尼\s*(?:耳机|降噪豆)/gi, /sony\s*wh/gi],
    name: '索尼耳机',
    brand: '索尼',
    category: '耳机'
  },
  {
    patterns: [/beats/gi],
    name: 'Beats耳机',
    brand: 'Beats',
    category: '耳机'
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
  },
  {
    patterns: [/冬虫夏草|人参|鹿茸/gi],
    name: '滋补品',
    brand: '滋补品',
    category: '保健品'
  }
]

/**
 * 从文本中提取商品关键词（增强版）
 */
function extractProductKeywords(text: string, words: string[] = []): string[] {
  const keywords: string[] = []
  const lowerText = text.toLowerCase()
  
  // 合并 words 数组形成连续文本，便于短语匹配
  const combinedWords = words.join('')
  const combinedLower = combinedWords.toLowerCase()
  
  // 1. 使用商品数据库精确匹配
  for (const product of PRODUCT_DATABASE) {
    for (const pattern of product.patterns) {
      // 尝试在原始文本中匹配
      if (pattern.test(text)) {
        keywords.push(product.name)
        // 添加别名
        if (product.aliases) {
          keywords.push(...product.aliases)
        }
        break
      }
      // 尝试在 words 组合文本中匹配（处理 OCR 断字问题）
      if (pattern.test(combinedWords)) {
        keywords.push(product.name)
        break
      }
    }
  }
  
  // 2. 数字+品牌组合匹配（处理 "16 Pro" 这样的 OCR 结果）
  const numberPattern = /(\d+)\s*(?:pro|max|plus)?/gi
  const numbers = text.match(numberPattern) || []
  for (const num of numbers) {
    if (parseInt(num) >= 10 && parseInt(num) <= 20) {
      // 可能是 iPhone 型号
      if (lowerText.includes('iphone') || combinedLower.includes('iphone')) {
        keywords.push(`iPhone ${num}`)
      }
    }
  }
  
  // 3. 价格信息（帮助确认商品类别）
  const priceMatch = text.match(/[¥￥$]?\s*(\d+(?:\.\d{2})?)/)
  if (priceMatch) {
    const price = parseFloat(priceMatch[1])
    if (price >= 5000) keywords.push('高端商品')
    else if (price >= 1000) keywords.push('中端商品')
  }
  
  // 4. 去除 OCR 空格干扰（如 "i P h o n e"）
  const cleanText = text.replace(/\s+/g, '')
  const cleanLower = cleanText.toLowerCase()
  
  // 检查去空格后的文本
  const commonBrands = ['iphone', 'ipad', 'macbook', 'airpods', 'switch', 'ps5', 'dyson', 'nike', 'adidas']
  for (const brand of commonBrands) {
    if (cleanLower.includes(brand) && !keywords.some(k => k.toLowerCase().includes(brand))) {
      keywords.push(brand)
    }
  }
  
  return [...new Set(keywords)]
}

/**
 * 根据 OCR 结果生成标准商品名称（增强版智能匹配）
 */
export function generateProductNameFromOcr(ocrResult: OcrResult): {
  name: string
  brand: string
  category: string
  confidence: number
  matchedBy: string  // 新增：匹配方式
} {
  const { text, productKeywords, confidence, words } = ocrResult

  // 清理 OCR 文本（去除空格干扰）
  const cleanText = text.replace(/\s+/g, '').toLowerCase()
  const cleanWords = (words || []).map(w => w.replace(/\s+/g, '').toLowerCase()).join('')
  
  // 品牌映射
  const brandMap: Record<string, string> = {
    'iphone': 'Apple', 'ipad': 'Apple', 'macbook': 'Apple', 'airpods': 'Apple',
    'huawei': '华为', '华为': '华为', 'mate': '华为', 'pura': '华为',
    'xiaomi': '小米', '小米': '小米', 'redmi': '小米', '红米': '小米',
    '三星': '三星', 'samsung': '三星',
    'oppo': 'OPPO', 'vivo': 'vivo', '荣耀': '荣耀', 'honor': '荣耀',
    '戴森': '戴森', 'dyson': '戴森',
    '耐克': '耐克', 'nike': '耐克',
    '阿迪达斯': '阿迪达斯', 'adidas': '阿迪达斯',
    'switch': 'Nintendo', 'ps5': '索尼', 'playstation': '索尼', 'xbox': '微软',
    '茅台': '茅台', '五粮液': '五粮液',
  }

  // 分类映射
  const categoryMap: Record<string, string> = {
    'Apple': '手机/电脑', '华为': '手机', '小米': '手机/数码',
    '戴森': '家电', 'Nintendo': '游戏机', '索尼': '游戏机',
    '耐克': '运动', '阿迪达斯': '运动'
  }

  // ===== 智能匹配函数 =====
  const matchProduct = (patterns: [string | RegExp, string][]): string | null => {
    for (const [pattern, name] of patterns) {
      if (typeof pattern === 'string') {
        const p = pattern.toLowerCase()
        // 原始文本匹配
        if (cleanText.includes(p) || cleanWords.includes(p)) {
          return name
        }
        // 带空格的 OCR 文本匹配
        if (text.toLowerCase().includes(p.replace(/\s+/g, ' '))) {
          return name
        }
      } else {
        // 正则匹配
        if (pattern.test(text) || pattern.test(cleanText) || pattern.test(cleanWords)) {
          return name
        }
      }
    }
    return null
  }

  // ===== 1. 精确匹配 iPhone 系列（最常见）=====
  const iphonePatterns: [string | RegExp, string][] = [
    [/iphone\s*16\s*pro\s*max/gi, 'iPhone 16 Pro Max'],
    [/iphone\s*16\s*pro/gi, 'iPhone 16 Pro'],
    [/iphone\s*16/gi, 'iPhone 16'],
    [/iphone\s*15\s*pro\s*max/gi, 'iPhone 15 Pro Max'],
    [/iphone\s*15\s*pro/gi, 'iPhone 15 Pro'],
    [/iphone\s*15/gi, 'iPhone 15'],
    [/iphone\s*14\s*pro\s*max/gi, 'iPhone 14 Pro Max'],
    [/iphone\s*14\s*pro/gi, 'iPhone 14 Pro'],
    [/iphone\s*14/gi, 'iPhone 14'],
    [/iphone\s*13/gi, 'iPhone 13'],
    [/iphone\s*12/gi, 'iPhone 12'],
    // 处理 OCR 空格问题
    [/iphone16promax|iphone\s*16\s*pro\s*max/gi, 'iPhone 16 Pro Max'],
    [/iphone16pro/gi, 'iPhone 16 Pro'],
    [/iphone16/gi, 'iPhone 16'],
  ]
  const matchedIphone = matchProduct(iphonePatterns)
  if (matchedIphone) {
    return {
      name: matchedIphone,
      brand: 'Apple',
      category: '手机',
      confidence: Math.min(confidence / 100 + 0.2, 1), // 增加置信度
      matchedBy: '精确匹配'
    }
  }

  // ===== 2. Apple 产品系列 =====
  const applePatterns: [string | RegExp, string][] = [
    [/macbook\s*air/gi, 'MacBook Air'],
    [/macbook\s*pro/gi, 'MacBook Pro'],
    [/macbook/gi, 'MacBook'],
    [/ipad\s*pro/gi, 'iPad Pro'],
    [/ipad\s*air/gi, 'iPad Air'],
    [/ipad\s*mini/gi, 'iPad mini'],
    [/ipad/gi, 'iPad'],
    [/airpods\s*pro/gi, 'AirPods Pro'],
    [/airpods(?:\s*2|\s*3)?/gi, 'AirPods'],
    [/apple\s*watch/gi, 'Apple Watch'],
    [/(?:imac|mac\s*mini|mac\s*studio)/gi, 'iMac'],
  ]
  const matchedApple = matchProduct(applePatterns)
  if (matchedApple) {
    return {
      name: matchedApple,
      brand: 'Apple',
      category: matchedApple.includes('Watch') ? '手表' : matchedApple.includes('Pad') ? '平板' : '电脑',
      confidence: Math.min(confidence / 100 + 0.15, 1),
      matchedBy: 'Apple产品'
    }
  }

  // ===== 3. 华为系列 =====
  const huaweiPatterns: [string | RegExp, string][] = [
    [/mate\s*60\s*pro/gi, '华为Mate60 Pro'],
    [/mate\s*60/gi, '华为Mate60'],
    [/mate\s*50\s*pro/gi, '华为Mate50 Pro'],
    [/mate\s*50/gi, '华为Mate50'],
    [/pura\s*70\s*ultra/gi, '华为Pura70 Ultra'],
    [/pura\s*70\s*pro/gi, '华为Pura70 Pro'],
    [/pura\s*70/gi, '华为Pura70'],
    [/(?:华为|huawei|mate|pura)/gi, '华为'],
  ]
  const matchedHuawei = matchProduct(huaweiPatterns)
  if (matchedHuawei) {
    return {
      name: matchedHuawei,
      brand: '华为',
      category: '手机',
      confidence: Math.min(confidence / 100 + 0.15, 1),
      matchedBy: '华为产品'
    }
  }

  // ===== 4. 小米系列 =====
  const xiaomiPatterns: [string | RegExp, string][] = [
    [/小米\s*(?:14|13|12|11)\s*ultra/gi, '小米14 Ultra'],
    [/小米\s*(?:14|13|12)/gi, '小米'],
    [/redmi\s*k70/gi, 'Redmi K70'],
    [/redmi\s*k60/gi, 'Redmi K60'],
    [/redmi\s*note/gi, 'Redmi Note'],
    [/小米\s*(?:空调|冰箱|洗衣机|电视)/gi, '小米家电'],
    [/小米\s*(?:手环|充电宝|耳机)/gi, '小米配件'],
    [/(?:xiaomi|小米|redmi|红米)/gi, '小米'],
  ]
  const matchedXiaomi = matchProduct(xiaomiPatterns)
  if (matchedXiaomi) {
    return {
      name: matchedXiaomi,
      brand: '小米',
      category: '手机/数码',
      confidence: Math.min(confidence / 100 + 0.15, 1),
      matchedBy: '小米产品'
    }
  }

  // ===== 5. 游戏机系列 =====
  const gamingPatterns: [string | RegExp, string][] = [
    [/(?:nintendo|ns|任天堂)\s*switch/gi, 'Nintendo Switch'],
    [/switch\s*oled/gi, 'Nintendo Switch OLED'],
    [/switch\s*(?:lite)?/gi, 'Nintendo Switch'],
    [/ps5/gi, 'PS5'],
    [/ps4/gi, 'PS4'],
    [/playstation\s*5/gi, 'PS5'],
    [/playstation\s*4/gi, 'PS4'],
    [/xbox\s*series\s*x/gi, 'Xbox Series X'],
    [/xbox\s*series\s*s/gi, 'Xbox Series S'],
    [/xbox/gi, 'Xbox'],
    [/steam\s*deck/gi, 'Steam Deck'],
  ]
  const matchedGaming = matchProduct(gamingPatterns)
  if (matchedGaming) {
    return {
      name: matchedGaming,
      brand: matchedGaming.includes('Nintendo') ? 'Nintendo' : matchedGaming.includes('PS') ? '索尼' : '微软',
      category: '游戏机',
      confidence: Math.min(confidence / 100 + 0.15, 1),
      matchedBy: '游戏机'
    }
  }

  // ===== 6. 戴森系列 =====
  const dysonPatterns: [string | RegExp, string][] = [
    [/dyson\s*airwrap/gi, '戴森Airwrap'],
    [/戴森\s*卷发/gi, '戴森Airwrap'],
    [/hd15|dyson\s*(?:supersonic\s*)?hd15/gi, '戴森吹风机 HD15'],
    [/hd03|dyson\s*hd03/gi, '戴森吹风机 HD03'],
    [/(?:dyson|戴森)\s*(?:吹风机|supersonic)/gi, '戴森吹风机'],
    [/dyson\s*v15/gi, '戴森V15吸尘器'],
    [/dyson\s*v12/gi, '戴森V12吸尘器'],
    [/dyson\s*v10/gi, '戴森V10吸尘器'],
    [/(?:dyson|戴森)\s*吸尘/gi, '戴森吸尘器'],
    [/(?:dyson|戴森)/gi, '戴森'],
  ]
  const matchedDyson = matchProduct(dysonPatterns)
  if (matchedDyson) {
    return {
      name: matchedDyson,
      brand: '戴森',
      category: matchedDyson.includes('吸尘') ? '家电' : '个护',
      confidence: Math.min(confidence / 100 + 0.15, 1),
      matchedBy: '戴森产品'
    }
  }

  // ===== 7. 运动品牌 =====
  const sportPatterns: [string | RegExp, string][] = [
    [/aj|air\s*jordan/gi, 'Air Jordan'],
    [/(?:nike|耐克)\s*(?:air\s*max|dunk|aj)/gi, 'Nike运动鞋'],
    [/(?:nike|耐克)/gi, '耐克'],
    [/adidas\s*(?:ultraboost|yeezy|originals)/gi, '阿迪达斯运动鞋'],
    [/(?:adidas|阿迪达斯)/gi, '阿迪达斯'],
    [/新百伦|new\s*balance(?:\s*5\d{2})?/gi, 'New Balance'],
    [/nb\s*5\d{2}/gi, 'New Balance 5系列'],
    [/(?:安踏|anta)/gi, '安踏'],
    [/(?:李宁|li-ning)/gi, '李宁'],
  ]
  const matchedSport = matchProduct(sportPatterns)
  if (matchedSport) {
    return {
      name: matchedSport,
      brand: matchedSport.includes('耐克') ? '耐克' : matchedSport.includes('阿迪') ? '阿迪达斯' : '运动品牌',
      category: '运动',
      confidence: Math.min(confidence / 100 + 0.15, 1),
      matchedBy: '运动品牌'
    }
  }

  // ===== 8. 高端美妆 =====
  const beautyPatterns: [string | RegExp, string][] = [
    [/sk-?ii\s*(?:神仙水)?/gi, 'SK-II神仙水'],
    [/(?:skii|sk-ii)/gi, 'SK-II'],
    [/海蓝之谜|lamer/gi, '海蓝之谜'],
    [/莱伯妮|laprairie/gi, '莱伯妮'],
    [/希思黎|sisley/gi, '希思黎'],
    [/兰蔻\s*(?:小黑瓶|粉水)/gi, '兰蔻'],
    [/(?:兰蔻|lancome)/gi, '兰蔻'],
    [/雅诗兰黛|estee\s*lauder/gi, '雅诗兰黛'],
    [/娇韵诗|clarins/gi, '娇韵诗'],
    [/(?:迪奥|dior)\s*(?:999|口红)/gi, '迪奥999口红'],
    [/(?:dior|迪奥)/gi, '迪奥'],
    [/香奈儿|chanel/gi, '香奈儿'],
    [/ysl/gi, 'YSL'],
    [/mac\s*(?:口红|子弹头)/gi, 'MAC口红'],
    [/(?:mac|魅可)/gi, 'MAC'],
    [/tf\s*(?:口红|汤姆\s*福特)/gi, 'TF口红'],
  ]
  const matchedBeauty = matchProduct(beautyPatterns)
  if (matchedBeauty) {
    return {
      name: matchedBeauty,
      brand: '高端美妆',
      category: '美妆',
      confidence: Math.min(confidence / 100 + 0.1, 1),
      matchedBy: '美妆产品'
    }
  }

  // ===== 9. 酒水系列 =====
  const winePatterns: [string | RegExp, string][] = [
    [/飞天\s*茅台/gi, '飞天茅台'],
    [/(?:贵州\s*)?茅台/gi, '茅台'],
    [/五粮液/gi, '五粮液'],
    [/泸州老窖/gi, '泸州老窖'],
    [/汾酒/gi, '汾酒'],
    [/洋河\s*(?:梦之蓝|海之蓝)/gi, '洋河'],
    [/国窖\s*1573/gi, '国窖1573'],
    [/郎酒/gi, '郎酒'],
    [/剑南春/gi, '剑南春'],
    [/水井坊/gi, '水井坊'],
  ]
  const matchedWine = matchProduct(winePatterns)
  if (matchedWine) {
    return {
      name: matchedWine,
      brand: matchedWine.includes('茅台') ? '茅台' : '白酒',
      category: '酒水',
      confidence: Math.min(confidence / 100 + 0.1, 1),
      matchedBy: '酒水'
    }
  }

  // ===== 10. 母婴用品 =====
  const babyPatterns: [string | RegExp, string][] = [
    [/爱他美/gi, '爱他美奶粉'],
    [/美素佳儿/gi, '美素佳儿'],
    [/惠氏\s*(?:启赋)?/gi, '惠氏'],
    [/雅培\s*(?:菁智)?/gi, '雅培'],
    [/美赞臣/gi, '美赞臣'],
    [/a2\s*(?:奶粉)?/gi, 'A2奶粉'],
    [/花王\s*(?:纸尿裤)?/gi, '花王纸尿裤'],
    [/好奇\s*(?:铂金)?/gi, '好奇纸尿裤'],
    [/大王\s*(?:天使)?/gi, '大王纸尿裤'],
    [/帮宝适/gi, '帮宝适'],
    [/贝亲\s*(?:奶瓶)?/gi, '贝亲'],
  ]
  const matchedBaby = matchProduct(babyPatterns)
  if (matchedBaby) {
    return {
      name: matchedBaby,
      brand: '母婴用品',
      category: '母婴',
      confidence: Math.min(confidence / 100 + 0.1, 1),
      matchedBy: '母婴用品'
    }
  }

  // ===== 11. 食品饮料 =====
  const foodPatterns: [string | RegExp, string][] = [
    [/农夫山泉(?:\s*(?:4L|5L|550ml|1.5L))?/gi, '农夫山泉'],
    [/农夫果园/gi, '农夫果园'],
    [/可口可乐/gi, '可口可乐'],
    [/百事可乐/gi, '百事可乐'],
    [/元气森林/gi, '元气森林'],
    [/娃哈哈/gi, '娃哈哈'],
    [/怡宝/gi, '怡宝'],
    [/康师傅(?:\s*方便面)?/gi, '康师傅'],
    [/统一\s*方便面/gi, '统一方便面'],
    [/今麦郎/gi, '今麦郎'],
    [/旺旺(?:\s*(?:雪饼|仙贝|小馒头))?/gi, '旺旺'],
    [/奥利奥/gi, '奥利奥'],
    [/德芙/gi, '德芙巧克力'],
    [/费列罗/gi, '费列罗'],
    [/乐事(?:\s*薯片)?/gi, '乐事薯片'],
    [/可比克/gi, '可比克'],
    [/良品铺子/gi, '良品铺子'],
    [/三只松鼠/gi, '三只松鼠'],
    [/伊利(?:\s*(?:纯牛奶|酸奶|金典|安慕希))?/gi, '伊利'],
    [/蒙牛(?:\s*(?:纯牛奶|酸奶|特仑苏))?/gi, '蒙牛'],
    [/光明(?:\s*(?:纯牛奶|酸奶))?/gi, '光明'],
  ]
  const matchedFood = matchProduct(foodPatterns)
  if (matchedFood) {
    return {
      name: matchedFood,
      brand: matchedFood.includes('可乐') ? '可口可乐' : matchedFood.includes('伊利') ? '伊利' : matchedFood.includes('蒙牛') ? '蒙牛' : '食品',
      category: matchedFood.includes('可乐') || matchedFood.includes('农夫') || matchedFood.includes('娃哈哈') || matchedFood.includes('元气') || matchedFood.includes('怡宝') ? '饮料' : '食品',
      confidence: Math.min(confidence / 100 + 0.1, 1),
      matchedBy: '食品饮料'
    }
  }

  // ===== 12. 使用关键词匹配（兜底）=====
  if (productKeywords.length > 0) {
    // 识别品牌
    let brand = ''
    for (const [key, value] of Object.entries(brandMap)) {
      if (cleanText.includes(key.toLowerCase()) || cleanWords.includes(key.toLowerCase())) {
        brand = value
        break
      }
    }
    
    // 识别分类
    let category = '综合'
    for (const [cat, keywords] of Object.entries(categoryMap)) {
      for (const kw of keywords) {
        if (cleanText.includes(kw.toLowerCase())) {
          category = cat
          break
        }
      }
    }
    
    return {
      name: productKeywords[0],
      brand: brand || '未知',
      category: category,
      confidence: Math.min(confidence / 100, 0.5), // 关键词匹配降低置信度
      matchedBy: '关键词'
    }
  }

  // ===== 13. 最终兜底：提取数字和字母尝试识别 =====
  const alphanumericMatch = text.match(/([a-zA-Z]{3,}\s*\d+[a-zA-Z]?|\d+[a-zA-Z]\s*[a-zA-Z]+)/i)
  if (alphanumericMatch) {
    return {
      name: alphanummericMatch[1].toUpperCase(),
      brand: '未知',
      category: '综合',
      confidence: 0.3,
      matchedBy: '字母数字'
    }
  }

  // 无法识别
  return {
    name: '未知商品',
    brand: '',
    category: '综合',
    confidence: confidence / 100,
    matchedBy: '未匹配'
  }
}
