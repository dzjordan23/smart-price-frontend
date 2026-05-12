import request from './request'

// ─── 论坛帖子 ────────────────────────────────────────────────────────────

export function getForumPosts(page = 1, pageSize = 20, keyword?: string) {
  return request.get('/community/posts', { params: { page, page_size: pageSize, keyword } })
}

export function getForumPost(id: number) {
  return request.get(`/community/posts/${id}`)
}

export function createForumPost(data: { title: string; content: string; imageUrls?: string[] }) {
  return request.post('/community/posts', data)
}

export function deleteForumPost(id: number) {
  return request.delete(`/community/posts/${id}`)
}

// ─── 帖子评论 ────────────────────────────────────────────────────────────

export function getPostComments(postId: number, page = 1, pageSize = 20) {
  return request.get(`/community/posts/${postId}/comments`, { params: { page, page_size: pageSize } })
}

export function createPostComment(postId: number, data: { content: string; parentId?: number }) {
  return request.post(`/community/posts/${postId}/comments`, data)
}

export function likePost(postId: number) {
  return request.post(`/community/posts/${postId}/like`)
}

// ─── 好物推荐 ────────────────────────────────────────────────────────────

export function getRecommendations(page = 1, pageSize = 20, keyword?: string) {
  return request.get('/community/recommendations', { params: { page, page_size: pageSize, keyword } })
}

export function createRecommendation(data: {
  productName: string;
  productUrl?: string;
  imageUrl?: string;
  price?: number;
  reason: string;
}) {
  return request.post('/community/recommendations', data)
}

export function likeRecommendation(id: number) {
  return request.post(`/community/recommendations/${id}/like`)
}

// ─── 二手转售 ────────────────────────────────────────────────────────────

export function getResaleItems(page = 1, pageSize = 20, keyword?: string) {
  return request.get('/community/resale', { params: { page, page_size: pageSize, keyword } })
}

export function createResaleItem(data: {
  productName: string;
  productUrl?: string;
  imageUrls?: string[];
  originalPrice?: number;
  salePrice: number;
  condition: string;
  description?: string;
}) {
  return request.post('/community/resale', data)
}

export function updateResaleStatus(id: number, status: number) {
  return request.put(`/community/resale/${id}/status`, { status })
}

// ─── 评价晒单 ────────────────────────────────────────────────────────────

export function getReviews(page = 1, pageSize = 20, keyword?: string, platform?: string) {
  return request.get('/community/reviews', { params: { page, page_size: pageSize, keyword, platform } })
}

export function createReview(data: {
  productId?: number;
  productName: string;
  platform?: string;
  rating: number;
  content: string;
  imageUrls?: string[];
}) {
  return request.post('/community/reviews', data)
}

export function likeReview(id: number) {
  return request.post(`/community/reviews/${id}/like`)
}
