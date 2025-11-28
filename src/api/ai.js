import request from './axios'

/**
 * AI相关的API服务
 */
export default {
  /**
   * 与AI聊天 - 普通请求
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
  },
  
  /**
   * 与AI聊天 - SSE流式输出
   * @param {Object} data - 请求参数
   * @param {String} data.message - 提示词
   * @param {Function} onMessage - 接收消息的回调函数
   * @param {Function} onComplete - 完成的回调函数
   * @param {Function} onError - 错误的回调函数
   * @returns {EventSource} - 返回EventSource实例，用于后续可以关闭连接
   */
  chatWithAIStream(data, onMessage, onComplete, onError) {
    // 使用原生fetch API实现SSE
    const url = 'http://localhost:8080/api/ai/chat';
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || ''
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      
      function readStream() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            onComplete && onComplete();
            return;
          }
          
          // 解码新数据
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // 处理SSE格式的消息
          const messages = buffer.split(/\r?\n/);
          buffer = messages.pop(); // 保留不完整的最后一条消息
          
          messages.forEach(message => {
            if (message.startsWith('data:')) {
              const data = message.slice(5).trim();
              if (data) {
                try {
                  // 尝试解析JSON，如果失败则作为普通文本处理
                  const parsed = JSON.parse(data);
                  onMessage && onMessage(parsed);
                } catch (e) {
                  // 直接将文本作为消息内容
                  onMessage && onMessage({ content: data });
                }
              }
            }
          });
          
          return readStream();
        });
      }
      
      return readStream();
    })
    .catch(error => {
      console.error('SSE连接错误:', error);
      onError && onError(error);
    });
  }
}