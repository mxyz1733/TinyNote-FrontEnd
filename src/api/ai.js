import request from './axios'

/**
 * AI相关的API服务
 */
export default {
  /**
   * 与AI聊天
   * @param {Object} data - 请求参数
   * @param {Number} data.userId - 用户ID
   * @param {String} data.prompt - 提示词
   * @param {String} [data.model] - 可选，指定使用的模型
   * @returns {Promise} - 返回AI的响应
   */
  chatWithAI(data) {
    return request({
      url: '/ai/chat',
      method: 'post',
      data
    })
  }
}