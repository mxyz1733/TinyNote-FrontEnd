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
  },
  
  /**
   * 检查token是否有效
   * @returns {Promise<boolean>} - token是否有效
   */
  async checkTokenValidity() {
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }
    
    try {
      // 调用后端token验证接口
      const response = await request({
        url: '/auth/checkToken',
        method: 'post',
        data: { token }
      })
      
      return response.code === 200 && response.data === true
    } catch (error) {
      console.error('检查token有效性失败:', error)
      return false
    }
  },
  
  /**
   * 解析JWT token，获取payload信息
   * @param {string} token - JWT token
   * @returns {Object|null} - 解析后的payload信息
   */
  parseJwt(token) {
    if (!token) return null
    
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('解析JWT失败:', error)
      return null
    }
  },
  
  /**
   * 检查token是否即将过期
   * @param {string} token - JWT token
   * @param {number} minutes - 提前多少分钟检查
   * @returns {boolean} - token是否即将过期
   */
  isTokenExpiringSoon(token, minutes = 5) {
    const payload = this.parseJwt(token)
    if (!payload || !payload.exp) {
      return true
    }
    
    const now = Math.floor(Date.now() / 1000)
    const exp = payload.exp
    const diffMinutes = (exp - now) / 60
    
    return diffMinutes < minutes
  },
  
  /**
   * 清除所有用户相关数据
   */
  clearUserInfo() {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('username')
    localStorage.removeItem('avatarUrl')
    localStorage.removeItem('nickname')
  }
}