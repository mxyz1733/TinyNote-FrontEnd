import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  // 后端API基础URL
  baseURL: 'http://localhost:8080/api',
  // 请求超时时间
  timeout: 100000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    // 添加token认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const res = response.data

    // 检查是否是Result对象格式（包含code, message, data三个标准字段）
    const isResultFormat = res && typeof res === 'object' && 
                          'code' in res && 'message' in res && 'data' in res
    
    if (isResultFormat) {
      // 是Result格式，按照Result格式处理
      if (res.code === 200) {
        // 成功响应，返回完整res对象
        return res
      } else if (res.code === 401) {
        // 401未授权，清除token并跳转到登录页
        console.error('===== 401未授权 =====')
        console.error('完整响应数据:', JSON.stringify(res, null, 2))
        
        // 清除本地token和用户信息
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('username')
        localStorage.removeItem('avatarUrl')
        localStorage.removeItem('nickname')
        
        // 跳转到登录页
        window.location.href = '/login'
        
        const errorMsg = res.message || '登录已过期，请重新登录'
        ElMessage.error(errorMsg)
        return Promise.reject(new Error(errorMsg))
      } else {
        // 其他业务错误，抛出异常
        console.error('===== 业务错误响应详情 =====')
        console.error('完整响应数据:', JSON.stringify(res, null, 2))
        console.error('响应码:', res.code)
        console.error('错误消息:', res.message)
        
        const errorMsg = res.message || `请求失败(code=${res.code})`
        ElMessage.error(errorMsg)
        // 创建包含完整响应信息的错误对象
        const error = new Error(errorMsg)
        error.responseData = res
        return Promise.reject(error)
      }
    } else {
      // 不是Result格式，使用兼容模式处理
      // 检查是否是成功响应 (code=200 或 success=true 或 ok=true)
      const isSuccessResponse = res.code === 200 || res.success === true || res.ok === true
      
      if (!isSuccessResponse && res.code !== undefined) {
        // 如果有code字段但不是200，且不是成功响应，则认为是业务错误
        console.error('===== 兼容模式 - 业务错误响应详情 =====')
        console.error('完整响应数据:', JSON.stringify(res, null, 2))
        console.error('响应码:', res.code)
        console.error('错误消息:', res.message || res.msg || '无错误消息')
        
        if (res.code === 401) {
          // 401未授权，清除token并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          localStorage.removeItem('username')
          localStorage.removeItem('avatarUrl')
          localStorage.removeItem('nickname')
          
          window.location.href = '/login'
          const errorMsg = res.message || '登录已过期，请重新登录'
          ElMessage.error(errorMsg)
          return Promise.reject(new Error(errorMsg))
        }
        
        const errorMsg = res.message || res.msg || `请求失败(code=${res.code})`
        ElMessage.error(errorMsg)
        // 创建包含完整响应信息的错误对象
        const error = new Error(errorMsg)
        error.responseData = res
        return Promise.reject(error)
      }
      
      // 不是错误响应，直接返回原始响应
      return res
    }
  },
  error => {
    // 对响应错误做点什么
    console.error('===== HTTP响应错误详情 =====')
    console.error('错误消息:', error.message)
    console.error('错误堆栈:', error.stack)
    
    if (error.response) {
      // 服务器返回错误状态码
      console.error('HTTP状态:', error.response.status)
      console.error('响应头:', error.response.headers)
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2))
      
      if (error.response.status === 401) {
        // 401未授权，清除token并跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('username')
        localStorage.removeItem('avatarUrl')
        localStorage.removeItem('nickname')
        
        window.location.href = '/login'
        const errorMsg = '登录已过期，请重新登录'
        ElMessage.error(errorMsg)
        return Promise.reject(new Error(errorMsg))
      }
      
      const errorMsg = error.response.data?.message || 
                      error.response.data?.msg || 
                      `服务器错误(${error.response.status})`
      ElMessage.error(errorMsg)
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('请求已发出，但没有收到响应')
      ElMessage.error('网络错误，请检查服务器连接')
    } else {
      // 请求配置出错
      ElMessage.error(error.message || '请求错误')
    }
    return Promise.reject(error)
  }
)

// 定期检查token有效性，每5分钟检查一次
setInterval(async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      // 调用后端token验证接口
      const response = await request({
        url: '/auth/checkToken',
        method: 'post',
        data: { token }
      })
      
      if (response.code !== 200 || response.data !== true) {
        // token无效，清除token并跳转到登录页
        console.error('token无效，清除token并跳转到登录页')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('username')
        localStorage.removeItem('avatarUrl')
        localStorage.removeItem('nickname')
        
        window.location.href = '/login'
        ElMessage.error('登录已过期，请重新登录')
      }
    } catch (error) {
      console.error('检查token有效性失败，可能是网络问题或服务器错误:', error)
      // 不处理网络错误，避免误判
    }
  }
}, 5 * 60 * 1000) // 每5分钟检查一次

export default request