import request from './request'

export function recognize(data: { image?: string; keyword?: string }) {
  return request.post('/products/recognize', data)
}

export function search(keyword: string, page = 1, pageSize = 20) {
  return request.get('/products/search', { params: { keyword, page, page_size: pageSize } })
}

export function createCompare(data: { productId: number; platforms?: string[] }) {
  return request.post('/products/compare', data)
}

export function getCompareResult(taskId: string) {
  return request.get(`/products/compare/${taskId}/result`)
}

export function getPriceHistory(productId: number, days = 30) {
  return request.get(`/products/${productId}/price-history`, { params: { days } })
}
