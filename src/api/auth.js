import { userAPI } from './user.js'
import request from './axios.js'
import { ElMessage } from 'element-plus'
import { utils } from '../utils/utils.js'

/**
 * 认证API服务 - 集中管理登录、登出等认证相关功能
 */
export const authAPI = {
  /**
   * 用户登录
   * @param {Object} loginInfo - 登录信息
   * @param {string} loginInfo.username - 用户名
   * @param {string} loginInfo.password - 密码
   * @param {boolean} rememberMe - 是否记住密码
   * @returns {Promise<Object>} - 返回登录结果
   */
  async login(loginInfo, rememberMe = false) {
    try {
      const response = await userAPI.login(loginInfo)
      
      if (response.code === 200) {
        // 保存token和用户信息到localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo))
        
        // 保存用户名和密码
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', loginInfo.username)
          localStorage.setItem('rememberedPassword', loginInfo.password)
        } else {
          localStorage.removeItem('rememberedUsername')
          localStorage.removeItem('rememberedPassword')
        }
        
        // 保存用户昵称到localStorage
        if (response.data.userInfo && response.data.userInfo.nickname) {
          localStorage.setItem('nickname', response.data.userInfo.nickname)
        } else {
          // 如果没有昵称，使用用户名作为昵称
          localStorage.setItem('nickname', loginInfo.username)
        }
        
        // 保存头像URL到localStorage（规范为绝对URL）
        if (response.data.userInfo && response.data.userInfo.avatar) {
          const apiOrigin = new URL(request.defaults.baseURL).origin
          const avatar = response.data.userInfo.avatar
          const absolute = /^https?:\/\//i.test(avatar) ? avatar : `${apiOrigin}${avatar.startsWith('/') ? avatar : '/' + avatar}`
          localStorage.setItem('avatarUrl', absolute)
        }
        
        ElMessage.success('登录成功')
        return response
      } else {
        ElMessage.error(response.message || '登录失败')
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      ElMessage.error('登录失败，请检查网络连接或稍后重试')
      throw error
    }
  },
  
  /**
   * 用户登出
   * @returns {void}
   */
  logout() {
    // 清除token和用户相关信息
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('username')
    localStorage.removeItem('avatarUrl')
    localStorage.removeItem('nickname')
    
    // 保留记住我的用户名和密码
    // localStorage.removeItem('rememberedUsername')
    // localStorage.removeItem('rememberedPassword')
    
    ElMessage.success('退出登录成功')
  },
  
  /**
   * 获取当前登录用户信息
   * @returns {Object|null} - 返回用户信息或null
   */
  getCurrentUser() {
    return utils.getCurrentUser()
  },
  
  /**
   * 检查用户是否已登录
   * @returns {boolean} - 是否已登录
   */
  isLoggedIn() {
    return utils.isLoggedIn()
  },
  
  /**
   * 获取记住的用户名和密码
   * @returns {Object} - 包含用户名和密码的对象
   */
  getRememberedCredentials() {
    return {
      username: localStorage.getItem('rememberedUsername') || '',
      password: localStorage.getItem('rememberedPassword') || ''
    }
  },
  
  /**
   * 更新用户头像URL
   * @param {string} avatarUrl - 头像URL
   * @returns {void}
   */
  updateAvatarUrl(avatarUrl) {
    utils.saveAvatarUrl(avatarUrl)
  },
  
  /**
   * 更新用户昵称
   * @param {string} nickname - 昵称
   * @returns {void}
   */
  updateNickname(nickname) {
    utils.saveNickname(nickname)
  }
}