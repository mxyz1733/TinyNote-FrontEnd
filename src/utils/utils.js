import request from '../api/axios.js'

/**
 * 工具函数集合 - 集中管理通用的工具函数
 */
export const utils = {
  /**
   * 将后端可能返回的相对路径统一转换为绝对URL
   * @param {string} url - 要转换的URL
   * @returns {string} - 转换后的绝对URL
   */
  toAbsoluteUrl(url) {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    const apiOrigin = new URL(request.defaults.baseURL).origin
    return `${apiOrigin}${url.startsWith('/') ? url : '/' + url}`
  },
  
  /**
   * 格式化日期时间
   * @param {string} dateString - 日期字符串
   * @returns {string} - 格式化后的日期字符串
   */
  formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚'
    }
    // 小于1小时
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前'
    }
    // 小于1天
    if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前'
    }
    // 小于30天
    if (diff < 2592000000) {
      return Math.floor(diff / 86400000) + '天前'
    }
    // 大于30天
    return date.toLocaleDateString()
  },
  
  /**
   * 从localStorage刷新头像URL
   * @param {Ref} avatarUrl - 头像URL的响应式引用
   */
  refreshAvatarFromLocal(avatarUrl) {
    const saved = localStorage.getItem('avatarUrl') || ''
    if (saved && saved !== avatarUrl.value) {
      avatarUrl.value = saved
    }
  },
  
  /**
   * 从localStorage获取当前登录用户信息
   * @returns {Object} - 用户信息对象
   */
  getCurrentUser() {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      return userInfo && userInfo.id ? userInfo : null
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  },
  
  /**
   * 检查用户是否已登录
   * @returns {boolean} - 是否已登录
   */
  isLoggedIn() {
    const token = localStorage.getItem('token')
    const userInfo = this.getCurrentUser()
    return !!token && !!userInfo
  },
  
  /**
   * 从localStorage获取用户昵称
   * @returns {string} - 用户昵称
   */
  getNickname() {
    return localStorage.getItem('nickname') || ''
  },
  
  /**
   * 从localStorage获取头像URL
   * @returns {string} - 头像URL
   */
  getAvatarUrl() {
    return localStorage.getItem('avatarUrl') || ''
  },
  
  /**
   * 保存用户昵称到localStorage
   * @param {string} nickname - 用户昵称
   */
  saveNickname(nickname) {
    localStorage.setItem('nickname', nickname)
  },
  
  /**
   * 保存头像URL到localStorage
   * @param {string} avatarUrl - 头像URL
   */
  saveAvatarUrl(avatarUrl) {
    localStorage.setItem('avatarUrl', avatarUrl)
  }
}