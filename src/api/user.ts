import request from './request'

export function getProfile() {
  return request.get('/user/profile')
}

export function getCommissions(page = 1, pageSize = 20) {
  return request.get('/user/commissions', { params: { page, page_size: pageSize } })
}
