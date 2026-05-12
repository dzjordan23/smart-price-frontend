/**
 * 微信 JS-SDK 工具函数
 * 用于 H5 页面在微信浏览器中的高级功能
 */

// 微信 JS-SDK 配置
export function initWxJsSdk(config: {
  appId: string
  timestamp: string
  nonceStr: string
  signature: string
  jsApiList?: string[]
}) {
  return new Promise<void>((resolve, reject) => {
    if (!window.wx) {
      reject(new Error('微信 JS-SDK 未加载'))
      return
    }

    window.wx.config({
      debug: import.meta.env.DEV,
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: config.jsApiList || [
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'onMenuShareTimeline',
        'onMenuShareAppMessage',
      ],
    })

    window.wx.ready(() => {
      resolve()
    })

    window.wx.error((err: any) => {
      reject(err)
    })
  })
}

// 更新微信分享内容
export function updateWxShare(shareData: {
  title: string
  desc: string
  link: string
  imgUrl: string
}) {
  if (!window.wx) return

  // 分享给朋友
  window.wx.updateAppMessageShareData({
    title: shareData.title,
    desc: shareData.desc,
    link: shareData.link,
    imgUrl: shareData.imgUrl,
  })

  // 分享到朋友圈
  window.wx.updateTimelineShareData({
    title: shareData.title,
    link: shareData.link,
    imgUrl: shareData.imgUrl,
  })
}

// 判断是否在微信浏览器中
export function isWxBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /MicroMessenger/i.test(navigator.userAgent)
}

// 获取微信版本号
export function getWxVersion(): string {
  if (!isWxBrowser()) return ''
  const match = navigator.userAgent.match(/MicroMessenger\/([\d.]+)/i)
  return match ? match[1] : ''
}

declare global {
  interface Window {
    wx: any
  }
}

export default {
  initWxJsSdk,
  updateWxShare,
  isWxBrowser,
  getWxVersion,
}
