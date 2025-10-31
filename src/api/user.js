import request from './axios'

/**
 * 用户API服务
 */
export const userAPI = {
  /**
   * 用户注册
   * @param {Object} userInfo - 用户注册信息
   * @param {string} userInfo.username - 用户名
   * @param {string} userInfo.email - 邮箱
   * @param {string} userInfo.password - 密码
   */
  register(userInfo) {
    return request({
      url: '/user/register',
      method: 'post',
      data: userInfo
    })
  },
  
  /**
   * 用户登录
   * @param {Object} loginInfo - 登录信息
   * @param {string} loginInfo.username - 用户名
   * @param {string} loginInfo.password - 密码
   */
  login(loginInfo) {
    return request({
      url: '/user/login',
      method: 'post',
      data: loginInfo
    })
  },
  
  /**
   * 获取用户信息
   * @param {number} userId - 用户ID
   */
  getUserInfo(userId) {
    return request({
      url: `/user/info/${userId}`,
      method: 'get'
    })
  },
  
  /**
   * 更新用户信息
   * @param {Object} userInfo - 用户信息
   */
  updateUserInfo(userInfo) {
    return request({
      url: '/user/update',
      method: 'put',
      data: userInfo
    })
  },
  
  /**
   * 修改密码
   * @param {Object} passwordInfo - 密码信息
   * @param {number} passwordInfo.userId - 用户ID
   * @param {string} passwordInfo.oldPassword - 旧密码
   * @param {string} passwordInfo.newPassword - 新密码
   */
  /**
   * 修改密码
   * @param {Object} passwordInfo - 密码信息
   * @param {number} passwordInfo.userId - 用户ID
   * @param {string} passwordInfo.oldPassword - 旧密码
   * @param {string} passwordInfo.newPassword - 新密码
   */
  changePassword(passwordInfo) {
    return request({
      url: '/user/changePassword',
      method: 'post',
      data: passwordInfo
    })
  },

  /**
   * 获取用户笔记数量
   * @param {number} userId - 用户ID
   */
  getNoteCount(userId) {
    return request({
      url: '/note/count', // 移除多余的/api前缀，因为baseURL中已经包含
      method: 'get',
      params: { userId } // 使用query参数传递userId
    })
  },

  /**
   * 上传用户头像
   * @param {Object} params - 上传参数
   * @param {number} params.userId - 用户ID
   * @param {File} params.file - 头像文件
   */
  uploadAvatar(params) {
    const formData = new FormData()
    formData.append('userId', params.userId)
    formData.append('file', params.file)
    
    return request({
      url: '/user/avatar',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 更新用户头像URL
   * @param {Object} params - 更新参数
   * @param {number} params.userId - 用户ID
   * @param {string} params.avatarUrl - 头像URL
   */
  updateAvatarUrl(params) {
    return request({
      url: '/user/avatar/update',
      method: 'put',
      data: params
    })
  }
}