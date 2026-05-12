import request from './request'

export function addWatch(productId: number, targetPrice: number, platforms: string[] = []) {
  return request.post(`/products/${productId}/watch`, { productId, targetPrice, platforms })
}

export function getWatchList(page = 1, pageSize = 20) {
  return request.get('/user/watchlist', { params: { page, page_size: pageSize } })
}

export function deleteWatch(id: number) {
  return request.delete(`/products/watch/${id}`)
}

export function updateWatch(id: number, targetPrice: number) {
  return request.put(`/products/watch/${id}`, { targetPrice })
}

export function confirmPurchase(productId: number, priceId: number, platform: string) {
  return request.post('/orders/confirm', { productId, priceId, platform })
}
