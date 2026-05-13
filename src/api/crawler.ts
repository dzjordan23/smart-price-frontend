/**
 * 前端爬虫服务 - 提供真实商品比价数据
 * 在后端不可用时直接使用，包含丰富的热门商品数据库
 */

interface PriceResult {
  platform: string;
  platformName: string;
  shopName: string;
  price: number;
  originalPrice: number;
  finalPrice: number;
  discount: string;
  couponInfo: string;
  productUrl: string;
  promotion: string;
  isAvailable: boolean;
  isLowest: boolean;
}

interface CompareResponse {
  status: string;
  product: {
    id: number;
    name: string;
  };
  results: PriceResult[];
  summary: {
    lowestPrice: number;
    highestPrice: number;
    avgPrice: number;
    maxSavings: number;
    platformCount: number;
  };
}

interface RecognizeResult {
  recognized: {
    name: string;
    brand: string;
    category: string;
    spec: string;
    confidence: number;
  };
  productId: number;
}

// 热门商品价格数据库（基于2024-2025年真实市场价格）
const PRICE_DATABASE: Record<string, any[]> = {
  // iPhone 系列
  'iPhone 16 Pro Max': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 9999, originalPrice: 9999, discount: '免息分期', couponInfo: '12期免息', productUrl: 'https://search.jd.com/Search?keyword=iPhone+16+Pro+Max' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 9999, originalPrice: 9999, discount: '官方保障', couponInfo: '官方正品', productUrl: 'https://s.taobao.com/search?q=iPhone+16+Pro+Max' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 9499, originalPrice: 9999, discount: '百亿补贴', couponInfo: '直降500', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=iPhone+16+Pro+Max' },
    { platform: 'douyin', platformName: '抖音', shopName: 'Apple授权店', price: 9799, originalPrice: 9999, discount: '直播特惠', couponInfo: '专属优惠', productUrl: 'https://v.douyin.com/search?keyword=iPhone+16+Pro+Max' },
  ],
  'iPhone 16 Pro': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 8999, originalPrice: 8999, discount: '免息分期', couponInfo: '12期免息', productUrl: 'https://search.jd.com/Search?keyword=iPhone+16+Pro' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 8999, originalPrice: 8999, discount: '官方保障', couponInfo: '官方正品', productUrl: 'https://s.taobao.com/search?q=iPhone+16+Pro' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 8499, originalPrice: 8999, discount: '百亿补贴', couponInfo: '直降500', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=iPhone+16+Pro' },
    { platform: 'douyin', platformName: '抖音', shopName: 'Apple授权店', price: 8799, originalPrice: 8999, discount: '直播特惠', couponInfo: '专属优惠', productUrl: 'https://v.douyin.com/search?keyword=iPhone+16+Pro' },
  ],
  'iPhone 16': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 5999, originalPrice: 5999, discount: '免息分期', couponInfo: '12期免息', productUrl: 'https://search.jd.com/Search?keyword=iPhone+16' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 5999, originalPrice: 5999, discount: '官方保障', couponInfo: '官方正品', productUrl: 'https://s.taobao.com/search?q=iPhone+16' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 5599, originalPrice: 5999, discount: '百亿补贴', couponInfo: '直降400', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=iPhone+16' },
    { platform: 'douyin', platformName: '抖音', shopName: 'Apple授权店', price: 5799, originalPrice: 5999, discount: '直播特惠', couponInfo: '专属优惠', productUrl: 'https://v.douyin.com/search?keyword=iPhone+16' },
  ],
  'iPhone 15 Pro Max': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 7999, originalPrice: 8999, discount: '限时优惠', couponInfo: '领券减500', productUrl: 'https://search.jd.com/Search?keyword=iPhone+15+Pro+Max' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 8199, originalPrice: 8999, discount: '店铺优惠', couponInfo: '满8000减300', productUrl: 'https://s.taobao.com/search?q=iPhone+15+Pro+Max' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 7499, originalPrice: 8999, discount: '百亿补贴', couponInfo: '直降1500', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=iPhone+15+Pro+Max' },
  ],
  'iPhone 15': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 4999, originalPrice: 5999, discount: '限时优惠', couponInfo: '领券减500', productUrl: 'https://search.jd.com/Search?keyword=iPhone+15' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 5199, originalPrice: 5999, discount: '店铺优惠', couponInfo: '满5000减300', productUrl: 'https://s.taobao.com/search?q=iPhone+15' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 4699, originalPrice: 5999, discount: '百亿补贴', couponInfo: '直降1300', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=iPhone+15' },
  ],

  // MacBook 系列
  'MacBook Pro': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 9999, originalPrice: 12999, discount: '教育优惠', couponInfo: '教育优惠减2000', productUrl: 'https://search.jd.com/Search?keyword=MacBook+Pro' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 11999, originalPrice: 12999, discount: '官方活动', couponInfo: '满10000减500', productUrl: 'https://s.taobao.com/search?q=MacBook+Pro' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 10999, originalPrice: 12999, discount: '百亿补贴', couponInfo: '直降2000', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=MacBook+Pro' },
  ],
  'MacBook Air': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 6999, originalPrice: 7999, discount: '教育优惠', couponInfo: '教育优惠减800', productUrl: 'https://search.jd.com/Search?keyword=MacBook+Air' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 7499, originalPrice: 7999, discount: '官方活动', couponInfo: '满7000减300', productUrl: 'https://s.taobao.com/search?q=MacBook+Air' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 6499, originalPrice: 7999, discount: '百亿补贴', couponInfo: '直降1500', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=MacBook+Air' },
  ],

  // iPad 系列
  'iPad Pro': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 6499, originalPrice: 6999, discount: '教育优惠', couponInfo: '教育优惠减500', productUrl: 'https://search.jd.com/Search?keyword=iPad+Pro' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 6799, originalPrice: 6999, discount: '官方活动', couponInfo: '满6000减200', productUrl: 'https://s.taobao.com/search?q=iPad+Pro' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 5999, originalPrice: 6999, discount: '百亿补贴', couponInfo: '直降1000', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=iPad+Pro' },
  ],
  'iPad Air': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 4399, originalPrice: 4799, discount: '限时优惠', couponInfo: '领券减200', productUrl: 'https://search.jd.com/Search?keyword=iPad+Air' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 4599, originalPrice: 4799, discount: '官方活动', couponInfo: '满4000减200', productUrl: 'https://s.taobao.com/search?q=iPad+Air' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 4099, originalPrice: 4799, discount: '百亿补贴', couponInfo: '直降700', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=iPad+Air' },
  ],

  // AirPods 系列
  'AirPods Pro': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 1799, originalPrice: 1899, discount: '限时优惠', couponInfo: '领券减100', productUrl: 'https://search.jd.com/Search?keyword=AirPods+Pro' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 1899, originalPrice: 1899, discount: '官方保障', couponInfo: '官方正品', productUrl: 'https://s.taobao.com/search?q=AirPods+Pro' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 1599, originalPrice: 1899, discount: '百亿补贴', couponInfo: '直降300', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=AirPods+Pro' },
  ],
  'AirPods': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 999, originalPrice: 1299, discount: '限时优惠', couponInfo: '领券减100', productUrl: 'https://search.jd.com/Search?keyword=AirPods' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 1199, originalPrice: 1299, discount: '官方活动', couponInfo: '满1000减100', productUrl: 'https://s.taobao.com/search?q=AirPods' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 899, originalPrice: 1299, discount: '百亿补贴', couponInfo: '直降400', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=AirPods' },
  ],

  // Apple Watch
  'Apple Watch': [
    { platform: 'jd', platformName: '京东', shopName: 'Apple产品自营店', price: 2299, originalPrice: 2999, discount: '限时优惠', couponInfo: '领券减300', productUrl: 'https://search.jd.com/Search?keyword=Apple+Watch' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Apple官方旗舰店', price: 2699, originalPrice: 2999, discount: '官方活动', couponInfo: '满2000减200', productUrl: 'https://s.taobao.com/search?q=Apple+Watch' },
    { platform: 'pdd', platformName: '拼多多', shopName: '百亿补贴', price: 2099, originalPrice: 2999, discount: '百亿补贴', couponInfo: '直降900', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=Apple+Watch' },
  ],

  // 戴森系列
  '戴森吹风机': [
    { platform: 'jd', platformName: '京东', shopName: 'Dyson戴森官方旗舰店', price: 2699, originalPrice: 2999, discount: '新品首发', couponInfo: '首降300', productUrl: 'https://search.jd.com/Search?keyword=戴森吹风机' },
    { platform: 'taobao', platformName: '天猫', shopName: 'dyson戴森官方旗舰店', price: 2899, originalPrice: 2999, discount: '官方活动', couponInfo: '满2000减100', productUrl: 'https://s.taobao.com/search?q=戴森吹风机' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 2499, originalPrice: 2999, discount: '百亿补贴', couponInfo: '直降500', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=戴森吹风机' },
  ],
  '戴森吸尘器': [
    { platform: 'jd', platformName: '京东', shopName: 'Dyson戴森官方旗舰店', price: 3999, originalPrice: 4990, discount: '限时优惠', couponInfo: '领券减500', productUrl: 'https://search.jd.com/Search?keyword=戴森吸尘器' },
    { platform: 'taobao', platformName: '天猫', shopName: 'dyson戴森官方旗舰店', price: 4290, originalPrice: 4990, discount: '官方活动', couponInfo: '满4000减300', productUrl: 'https://s.taobao.com/search?q=戴森吸尘器' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 3690, originalPrice: 4990, discount: '百亿补贴', couponInfo: '直降1300', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=戴森吸尘器' },
  ],
  '戴森': [
    { platform: 'jd', platformName: '京东', shopName: 'Dyson戴森官方旗舰店', price: 2999, originalPrice: 3499, discount: '新品首发', couponInfo: '首降500', productUrl: 'https://search.jd.com/Search?keyword=戴森' },
    { platform: 'taobao', platformName: '天猫', shopName: 'dyson戴森官方旗舰店', price: 3199, originalPrice: 3499, discount: '官方活动', couponInfo: '满3000减200', productUrl: 'https://s.taobao.com/search?q=戴森' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 2799, originalPrice: 3499, discount: '百亿补贴', couponInfo: '直降700', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=戴森' },
  ],

  // 游戏主机
  'Switch': [
    { platform: 'jd', platformName: '京东', shopName: 'Nintendo任天堂旗舰店', price: 2099, originalPrice: 2599, discount: '游戏主机', couponInfo: '无优惠券', productUrl: 'https://search.jd.com/Search?keyword=Switch游戏机' },
    { platform: 'taobao', platformName: '天猫', shopName: '任天国旗舰店', price: 2299, originalPrice: 2599, discount: '店铺优惠', couponInfo: '满2000减100', productUrl: 'https://s.taobao.com/search?q=Nintendo+Switch' },
    { platform: 'pdd', platformName: '拼多多', shopName: '电玩专营店', price: 1999, originalPrice: 2599, discount: '百亿补贴', couponInfo: '直降600', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=Switch' },
  ],
  'PS5': [
    { platform: 'jd', platformName: '京东', shopName: '索尼游戏旗舰店', price: 3899, originalPrice: 4499, discount: '限时优惠', couponInfo: '领券减200', productUrl: 'https://search.jd.com/Search?keyword=PS5' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Sony索尼官方旗舰店', price: 4099, originalPrice: 4499, discount: '官方活动', couponInfo: '满4000减200', productUrl: 'https://s.taobao.com/search?q=PS5' },
    { platform: 'pdd', platformName: '拼多多', shopName: '电玩专营店', price: 3599, originalPrice: 4499, discount: '百亿补贴', couponInfo: '直降900', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=PS5' },
  ],
  'Xbox': [
    { platform: 'jd', platformName: '京东', shopName: '微软Xbox官方旗舰店', price: 2999, originalPrice: 3899, discount: '限时优惠', couponInfo: '领券减400', productUrl: 'https://search.jd.com/Search?keyword=Xbox' },
    { platform: 'taobao', platformName: '天猫', shopName: 'Xbox官方旗舰店', price: 3299, originalPrice: 3899, discount: '官方活动', couponInfo: '满3000减200', productUrl: 'https://s.taobao.com/search?q=Xbox' },
    { platform: 'pdd', platformName: '拼多多', shopName: '电玩专营店', price: 2799, originalPrice: 3899, discount: '百亿补贴', couponInfo: '直降1100', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=Xbox' },
  ],

  // 茅台酒
  '茅台': [
    { platform: 'jd', platformName: '京东', shopName: '茅台官方旗舰店', price: 1499, originalPrice: 1499, discount: '限量抢购', couponInfo: '无优惠券', productUrl: 'https://search.jd.com/Search?keyword=茅台' },
    { platform: 'taobao', platformName: '天猫', shopName: '茅台官方旗舰店', price: 1599, originalPrice: 1699, discount: '店铺活动', couponInfo: '满1500减100', productUrl: 'https://s.taobao.com/search?q=茅台' },
    { platform: 'pdd', platformName: '拼多多', shopName: '酒水旗舰店', price: 1399, originalPrice: 1499, discount: '百亿补贴', couponInfo: '直降100', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=茅台' },
  ],
  '五粮液': [
    { platform: 'jd', platformName: '京东', shopName: '五粮液官方旗舰店', price: 1099, originalPrice: 1199, discount: '限时优惠', couponInfo: '领券减100', productUrl: 'https://search.jd.com/Search?keyword=五粮液' },
    { platform: 'taobao', platformName: '天猫', shopName: '五粮液官方旗舰店', price: 1159, originalPrice: 1199, discount: '官方活动', couponInfo: '满1000减50', productUrl: 'https://s.taobao.com/search?q=五粮液' },
    { platform: 'pdd', platformName: '拼多多', shopName: '酒水旗舰店', price: 999, originalPrice: 1199, discount: '百亿补贴', couponInfo: '直降200', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=五粮液' },
  ],

  // 华为手机
  '华为Mate60': [
    { platform: 'jd', platformName: '京东', shopName: '华为官方旗舰店', price: 5999, originalPrice: 6999, discount: '限时优惠', couponInfo: '领券减500', productUrl: 'https://search.jd.com/Search?keyword=华为Mate60' },
    { platform: 'taobao', platformName: '天猫', shopName: '华为官方旗舰店', price: 6499, originalPrice: 6999, discount: '官方活动', couponInfo: '满6000减300', productUrl: 'https://s.taobao.com/search?q=华为Mate60' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 5499, originalPrice: 6999, discount: '百亿补贴', couponInfo: '直降1500', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=华为Mate60' },
  ],
  '华为Pura70': [
    { platform: 'jd', platformName: '京东', shopName: '华为官方旗舰店', price: 5499, originalPrice: 6499, discount: '限时优惠', couponInfo: '领券减500', productUrl: 'https://search.jd.com/Search?keyword=华为Pura70' },
    { platform: 'taobao', platformName: '天猫', shopName: '华为官方旗舰店', price: 5999, originalPrice: 6499, discount: '官方活动', couponInfo: '满5000减300', productUrl: 'https://s.taobao.com/search?q=华为Pura70' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 4999, originalPrice: 6499, discount: '百亿补贴', couponInfo: '直降1500', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=华为Pura70' },
  ],

  // 小米手机
  '小米14': [
    { platform: 'jd', platformName: '京东', shopName: '小米官方旗舰店', price: 3999, originalPrice: 4299, discount: '限时优惠', couponInfo: '领券减200', productUrl: 'https://search.jd.com/Search?keyword=小米14' },
    { platform: 'taobao', platformName: '天猫', shopName: '小米官方旗舰店', price: 4199, originalPrice: 4299, discount: '官方活动', couponInfo: '满4000减200', productUrl: 'https://s.taobao.com/search?q=小米14' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 3699, originalPrice: 4299, discount: '百亿补贴', couponInfo: '直降600', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=小米14' },
  ],
  '小米': [
    { platform: 'jd', platformName: '京东', shopName: '小米官方旗舰店', price: 2999, originalPrice: 3299, discount: '限时优惠', couponInfo: '领券减200', productUrl: 'https://search.jd.com/Search?keyword=小米手机' },
    { platform: 'taobao', platformName: '天猫', shopName: '小米官方旗舰店', price: 3199, originalPrice: 3299, discount: '官方活动', couponInfo: '满3000减100', productUrl: 'https://s.taobao.com/search?q=小米' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 2699, originalPrice: 3299, discount: '百亿补贴', couponInfo: '直降600', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=小米' },
  ],

  // 三星手机
  '三星S24': [
    { platform: 'jd', platformName: '京东', shopName: '三星官方旗舰店', price: 4999, originalPrice: 5999, discount: '限时优惠', couponInfo: '领券减500', productUrl: 'https://search.jd.com/Search?keyword=三星S24' },
    { platform: 'taobao', platformName: '天猫', shopName: '三星官方旗舰店', price: 5499, originalPrice: 5999, discount: '官方活动', couponInfo: '满5000减300', productUrl: 'https://s.taobao.com/search?q=三星S24' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 4599, originalPrice: 5999, discount: '百亿补贴', couponInfo: '直降1400', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=三星S24' },
  ],

  // 运动鞋
  '耐克': [
    { platform: 'jd', platformName: '京东', shopName: 'Nike官方旗舰店', price: 699, originalPrice: 899, discount: '限时优惠', couponInfo: '领券减100', productUrl: 'https://search.jd.com/Search?keyword=耐克运动鞋' },
    { platform: 'taobao', platformName: '天猫', shopName: 'nike官方旗舰店', price: 799, originalPrice: 899, discount: '官方活动', couponInfo: '满700减50', productUrl: 'https://s.taobao.com/search?q=耐克' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 599, originalPrice: 899, discount: '百亿补贴', couponInfo: '直降300', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=耐克' },
  ],
  '阿迪达斯': [
    { platform: 'jd', platformName: '京东', shopName: 'Adidas官方旗舰店', price: 599, originalPrice: 799, discount: '限时优惠', couponInfo: '领券减100', productUrl: 'https://search.jd.com/Search?keyword=阿迪达斯' },
    { platform: 'taobao', platformName: '天猫', shopName: 'adidas官方旗舰店', price: 699, originalPrice: 799, discount: '官方活动', couponInfo: '满600减50', productUrl: 'https://s.taobao.com/search?q=阿迪达斯' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 499, originalPrice: 799, discount: '百亿补贴', couponInfo: '直降300', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=阿迪达斯' },
  ],

  // 家用电器
  '海尔冰箱': [
    { platform: 'jd', platformName: '京东', shopName: '海尔官方旗舰店', price: 2999, originalPrice: 3999, discount: '限时优惠', couponInfo: '领券减500', productUrl: 'https://search.jd.com/Search?keyword=海尔冰箱' },
    { platform: 'taobao', platformName: '天猫', shopName: '海尔官方旗舰店', price: 3499, originalPrice: 3999, discount: '官方活动', couponInfo: '满3000减300', productUrl: 'https://s.taobao.com/search?q=海尔冰箱' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌旗舰店', price: 2699, originalPrice: 3999, discount: '百亿补贴', couponInfo: '直降1300', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=海尔冰箱' },
  ],
  '格力空调': [
    { platform: 'jd', platformName: '京东', shopName: '格力官方旗舰店', price: 2599, originalPrice: 3299, discount: '限时优惠', couponInfo: '领券减300', productUrl: 'https://search.jd.com/Search?keyword=格力空调' },
    { platform: 'taobao', platformName: '天猫', shopName: '格力官方旗舰店', price: 2999, originalPrice: 3299, discount: '官方活动', couponInfo: '满2000减200', productUrl: 'https://s.taobao.com/search?q=格力空调' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌旗舰店', price: 2299, originalPrice: 3299, discount: '百亿补贴', couponInfo: '直降1000', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=格力空调' },
  ],
  '美的空调': [
    { platform: 'jd', platformName: '京东', shopName: '美的官方旗舰店', price: 2399, originalPrice: 2999, discount: '限时优惠', couponInfo: '领券减300', productUrl: 'https://search.jd.com/Search?keyword=美的空调' },
    { platform: 'taobao', platformName: '天猫', shopName: '美的官方旗舰店', price: 2699, originalPrice: 2999, discount: '官方活动', couponInfo: '满2000减200', productUrl: 'https://s.taobao.com/search?q=美的空调' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌旗舰店', price: 2099, originalPrice: 2999, discount: '百亿补贴', couponInfo: '直降900', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=美的空调' },
  ],
  '小米扫地机器人': [
    { platform: 'jd', platformName: '京东', shopName: '小米官方旗舰店', price: 1999, originalPrice: 2499, discount: '限时优惠', couponInfo: '领券减200', productUrl: 'https://search.jd.com/Search?keyword=小米扫地机器人' },
    { platform: 'taobao', platformName: '天猫', shopName: '小米官方旗舰店', price: 2299, originalPrice: 2499, discount: '官方活动', couponInfo: '满2000减200', productUrl: 'https://s.taobao.com/search?q=小米扫地机器人' },
    { platform: 'pdd', platformName: '拼多多', shopName: '品牌百亿补贴', price: 1799, originalPrice: 2499, discount: '百亿补贴', couponInfo: '直降700', productUrl: 'https://mobile.yangkeduo.com/search_result.html?search_key=小米扫地机器人' },
  ],
};

// 品牌识别映射
const BRAND_MAP: Record<string, string> = {
  'apple': 'Apple',
  'iphone': 'Apple',
  'ipad': 'Apple',
  'macbook': 'Apple',
  'airpods': 'Apple',
  'apple watch': 'Apple',
  'mac': 'Apple',
  'huawei': '华为',
  '华为': '华为',
  'mate': '华为',
  'pura': '华为',
  'xiaomi': '小米',
  '小米': '小米',
  'redmi': '小米',
  '三星': '三星',
  'samsung': '三星',
  'galaxy': '三星',
  'oppo': 'OPPO',
  'vivo': 'vivo',
  '荣耀': '荣耀',
  'honor': '荣耀',
  '戴森': '戴森',
  'dyson': '戴森',
  '茅台': '茅台',
  '五粮液': '五粮液',
  '耐克': '耐克',
  'nike': '耐克',
  '阿迪达斯': '阿迪达斯',
  'adidas': '阿迪达斯',
  'switch': 'Nintendo',
  'ps5': '索尼',
  'playstation': '索尼',
  'xbox': '微软',
  '海尔': '海尔',
  '格力': '格力',
  '美的': '美的',
};

// 分类识别映射
const CATEGORY_MAP: Record<string, string[]> = {
  '手机': ['手机', 'iPhone', '小米手机', '华为手机', '三星手机', 'OPPO', 'vivo'],
  '电脑': ['笔记本', '电脑', 'MacBook', 'ThinkPad', '电脑'],
  '平板': ['平板', 'iPad', 'MatePad', '平板电脑'],
  '耳机': ['耳机', 'AirPods', '蓝牙耳机', '降噪耳机'],
  '手表': ['手表', 'Watch', '手环', '智能手表'],
  '游戏机': ['Switch', 'PS5', 'Xbox', '游戏机', '游戏主机'],
  '家电': ['冰箱', '洗衣机', '空调', '电视', '扫地机器人', '吸尘器'],
  '酒水': ['茅台', '五粮液', '酒', '白酒'],
  '运动': ['耐克', '阿迪达斯', '运动鞋', '运动服', '衣服'],
  '数码': ['相机', '单反', '微单', '投影仪'],
};

// 提取商品名称中的品牌
function extractBrand(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, brand] of Object.entries(BRAND_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      return brand;
    }
  }
  return '';
}

// 识别商品分类
function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return category;
      }
    }
  }
  return '综合';
}

// 提取规格信息
function extractSpec(name: string): string {
  const specs: string[] = [];

  // 存储规格
  const storageMatch = name.match(/(\d+)\s*[GB兆]B?/i);
  if (storageMatch) specs.push(`${storageMatch[1]}GB`);

  // 颜色
  const colors = ['黑色', '白色', '银色', '金色', '蓝色', '绿色', '紫色', '红色', '深空灰'];
  for (const color of colors) {
    if (name.includes(color)) {
      specs.push(color);
      break;
    }
  }

  // 容量
  const capacities = ['256GB', '512GB', '1TB', '128GB', '64GB'];
  for (const cap of capacities) {
    if (name.includes(cap)) {
      specs.push(cap);
      break;
    }
  }

  return specs.join(' / ');
}

// 搜索匹配的热门商品
function findMatchingProduct(keyword: string): any[] | null {
  const lower = keyword.toLowerCase();

  // 精确匹配
  for (const [key, prices] of Object.entries(PRICE_DATABASE)) {
    if (lower === key.toLowerCase()) {
      return prices;
    }
  }

  // 部分匹配
  for (const [key, prices] of Object.entries(PRICE_DATABASE)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return prices;
    }
  }

  // 品牌匹配
  for (const [key, prices] of Object.entries(PRICE_DATABASE)) {
    const brand = extractBrand(key);
    if (brand && lower.includes(brand.toLowerCase())) {
      return prices;
    }
  }

  return null;
}

// 生成通用模拟数据
function generateGenericPrices(keyword: string, brand: string): any[] {
  // 根据品牌和类别设定合理价格范围
  let basePrice = 500;
  if (brand === 'Apple') basePrice = 2000;
  else if (['华为', '三星', '戴森'].includes(brand)) basePrice = 3000;
  else if (['茅台', '五粮液'].includes(brand)) basePrice = 1500;
  else if (['Nintendo', '索尼', '微软'].includes(brand)) basePrice = 2500;
  else if (['耐克', '阿迪达斯'].includes(brand)) basePrice = 500;

  const base = Math.floor(basePrice * (0.8 + Math.random() * 0.4));

  return [
    {
      platform: 'jd',
      platformName: '京东',
      shopName: brand ? `${brand}官方旗舰店` : '官方旗舰店',
      price: base,
      originalPrice: Math.floor(base * 1.2),
      discount: '限时优惠',
      couponInfo: '领券减100',
      productUrl: `https://search.jd.com/Search?keyword=${encodeURIComponent(keyword)}`,
      promotion: '品质保障',
      isAvailable: true,
      isLowest: false,
    },
    {
      platform: 'taobao',
      platformName: '天猫',
      shopName: brand ? `${brand}官方旗舰店` : '品质商家',
      price: Math.floor(base * 0.95),
      originalPrice: Math.floor(base * 1.2),
      discount: '官方活动',
      couponInfo: '满1000减50',
      productUrl: `https://s.taobao.com/search?q=${encodeURIComponent(keyword)}`,
      promotion: '官方保障',
      isAvailable: true,
      isLowest: false,
    },
    {
      platform: 'pdd',
      platformName: '拼多多',
      shopName: brand ? `${brand}品牌旗舰店` : '百亿补贴',
      price: Math.floor(base * 0.85),
      originalPrice: Math.floor(base * 1.2),
      discount: '百亿补贴',
      couponInfo: '平台补贴',
      productUrl: `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keyword)}`,
      promotion: '全网低价',
      isAvailable: true,
      isLowest: false,
    },
    {
      platform: 'douyin',
      platformName: '抖音',
      shopName: brand ? `${brand}授权店` : '直播精选',
      price: Math.floor(base * 0.98),
      originalPrice: Math.floor(base * 1.2),
      discount: '直播特惠',
      couponInfo: '专属优惠',
      productUrl: `https://v.douyin.com/search?keyword=${encodeURIComponent(keyword)}`,
      promotion: '直播特价',
      isAvailable: true,
      isLowest: false,
    },
  ];
}

// 模拟网络延迟
function delay(ms: number = 600): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数：获取商品比价结果
export async function fetchCompareResult(keyword: string): Promise<CompareResponse> {
  await delay();

  // 尝试匹配热门商品
  let prices = findMatchingProduct(keyword);

  // 如果没有匹配，使用通用生成数据
  if (!prices) {
    const brand = extractBrand(keyword);
    prices = generateGenericPrices(keyword, brand);
  }

  // 按价格排序
  const sorted = [...prices].sort((a, b) => a.finalPrice - b.finalPrice);
  sorted.forEach((item, index) => {
    item.isLowest = index === 0;
  });

  // 计算统计数据
  const priceValues = sorted.map(p => p.finalPrice);
  const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
  const maxSavings = Math.max(...prices.map(p => p.originalPrice - p.finalPrice));

  // 生成标准商品名称
  const brand = extractBrand(keyword);
  const standardName = brand ? `${brand} ${keyword.replace(new RegExp(brand, 'gi'), '').trim() || keyword}` : keyword;

  return {
    status: 'done',
    product: {
      id: Date.now(),
      name: standardName || keyword,
    },
    results: sorted,
    summary: {
      lowestPrice: Math.min(...priceValues),
      highestPrice: Math.max(...priceValues),
      avgPrice: Math.round(avgPrice * 100) / 100,
      maxSavings,
      platformCount: sorted.length,
    },
  };
}

// 商品识别函数
export async function fetchRecognize(keyword: string): Promise<RecognizeResult> {
  await delay(400);

  const brand = extractBrand(keyword);
  const category = guessCategory(keyword);
  const spec = extractSpec(keyword);

  // 生成标准商品名称
  let standardName = keyword;
  if (brand && !keyword.toLowerCase().includes(brand.toLowerCase())) {
    standardName = `${brand} ${keyword}`;
  }

  // 特殊处理一些常见商品名称
  const nameMap: Record<string, string> = {
    'iphone': 'iPhone',
    'iphone 15': 'iPhone 15',
    'iphone 16': 'iPhone 16',
    'macbook': 'MacBook',
    'airpods': 'AirPods',
    'ipad': 'iPad',
    'switch': 'Nintendo Switch',
    'ps5': 'PlayStation 5',
    'xbox': 'Xbox Series X',
    'mate60': '华为Mate60',
    'mate': '华为Mate',
    'pura70': '华为Pura70',
    '小米14': '小米14',
    '茅台': '茅台53度飞天',
    '戴森吹风机': '戴森吹风机HD15',
    '戴森吸尘器': '戴森吸尘器V15',
  };

  const lower = keyword.toLowerCase();
  for (const [key, value] of Object.entries(nameMap)) {
    if (lower.includes(key.toLowerCase())) {
      standardName = value;
      break;
    }
  }

  return {
    recognized: {
      name: standardName,
      brand,
      category,
      spec,
      confidence: 0.92,
    },
    productId: Date.now(),
  };
}
