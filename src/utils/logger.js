/**
 * 日志记录工具，用于捕获和分析应用中的错误和操作
 */

export const logger = {
  /**
   * 记录操作开始
   * @param {string} operation - 操作名称
   * @param {object} params - 操作参数
   */
  start(operation, params = {}) {
    console.log(`[${new Date().toISOString()}] 开始操作: ${operation}`, { params });
  },

  /**
   * 记录操作成功
   * @param {string} operation - 操作名称
   * @param {object} result - 操作结果
   */
  success(operation, result = {}) {
    console.log(`[${new Date().toISOString()}] 操作成功: ${operation}`, { result });
  },

  /**
   * 记录操作失败
   * @param {string} operation - 操作名称
   * @param {Error} error - 错误对象
   * @param {object} context - 上下文信息
   */
  error(operation, error, context = {}) {
    console.error(`[${new Date().toISOString()}] 操作失败: ${operation}`, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    });
  },

  /**
   * 记录API调用
   * @param {string} url - API URL
   * @param {string} method - HTTP方法
   * @param {object} requestData - 请求数据
   * @param {object} responseData - 响应数据
   * @param {number} statusCode - HTTP状态码
   */
  apiCall(url, method, requestData, responseData, statusCode) {
    console.log(`[${new Date().toISOString()}] API调用: ${method} ${url}`, {
      statusCode,
      requestData,
      responseData
    });
  }
};

/**
 * 捕获并分析错误信息
 * @param {Error} error - 错误对象
 * @returns {string} 格式化的错误信息
 */
export function extractErrorMessage(error) {
  if (!error) return '未知错误';
  
  // 检查是否是Axios错误
  if (error.response) {
    // 服务器返回了错误响应
    const { status, data } = error.response;
    
    if (data && typeof data === 'object') {
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (data.msg) return data.msg;
    }
    
    return `服务器错误 (${status}): ${JSON.stringify(data)}`;
  } else if (error.request) {
    // 请求已发出但没有收到响应
    return '网络错误: 无法连接到服务器';
  } else {
    // 设置请求时发生错误
    return error.message || '请求错误';
  }
}