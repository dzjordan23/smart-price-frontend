import request from './request'

// 商品识别
export function recognize(data: { type?: string; image?: string; keyword?: string }) {
  return request.post('/products/recognize', data)
}

// 搜索商品
export function search(keyword: string, page = 1, pageSize = 20) {
  return request.get('/products/search', { params: { keyword, page, page_size: pageSize } })
}

// 创建比价任务
export function createCompare(data: { productId?: number; keyword?: string; brand?: string; platforms?: string[] }) {
  return request.post('/products/compare', data)
}

// 查询比价结果（支持 taskId 或 productId）
export function getCompareResult(taskIdOrProductId: string) {
  return request.get(`/products/compare/${taskIdOrProductId}/result`)
}

// 获取商品价格历史
export function getPriceHistory(productId: number, days = 30) {
  return request.get(`/products/${productId}/price-history`, { params: { days } })
}

// 获取商品详情
export function getProductDetail(productId: number) {
  return request.get(`/products/${productId}`)
}
