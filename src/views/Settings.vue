<template>
  <div class="settings-container">
    <div class="settings-content">
      <!-- 头部信息和返回按钮 -->
      <div class="settings-header">
        <el-button type="text" @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2>设置</h2>
      </div>
      
      <!-- 用户信息卡片 -->
      <el-card class="user-info-card">
        <div class="user-profile">
          <div class="avatar-upload-wrapper">
            <el-avatar :size="80" class="user-avatar" :src="avatarUrl && avatarUrl.trim() ? avatarUrl : undefined">
              {{ getAvatarText }}
            </el-avatar>
            <div class="avatar-upload-btn">
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="handleAvatarUpload"
                accept="image/*"
              >
                <el-button type="text" class="upload-btn">
                  <el-icon><Camera /></el-icon>
                </el-button>
              </el-upload>
            </div>
          </div>
          <div class="user-details">
            <h3 class="user-name">{{ nickname || username }}</h3>
            <p class="user-id">ID: {{ userId }}</p>
          </div>
        </div>
      </el-card>
      
      <!-- 设置标签页 -->
      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane label="账户" name="account">
          <template #label>
            <el-icon><User /></el-icon>
            <span>账户</span>
          </template>
          
          <div class="settings-section">
            <h3>账户详情</h3>
            <el-descriptions :column="1" border class="info-descriptions">
              <el-descriptions-item label="用户名" class="info-item">
                <span class="info-value">{{ username }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="邮箱" class="info-item">
                <span class="info-value">{{ email || '未设置' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="昵称" class="info-item">
                <span class="info-value">{{ nickname || '未设置' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="注册时间" class="info-item">
                <span class="info-value">{{ formatDate(createTime) || '未知' }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <!-- 更新个人信息 -->
          <div class="settings-section">
            <h3>更新个人信息</h3>
            <el-form :model="updateForm" :rules="updateRules" ref="updateFormRef" label-width="120px" class="update-form">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="updateForm.email" placeholder="请输入邮箱"></el-input>
              </el-form-item>
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="updateForm.nickname" placeholder="请输入昵称" :prefix-icon="UserFilled"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleUpdateInfo" :loading="updateLoading" class="submit-btn">
                  <el-icon><Check /></el-icon> 保存修改
                </el-button>
                <el-button @click="resetUpdateForm" class="reset-btn">
                  <el-icon><Refresh /></el-icon> 重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 安全设置 -->
        <el-tab-pane label="安全" name="security">
          <template #label>
            <el-icon><Lock /></el-icon>
            <span>安全</span>
          </template>
          
          <div class="settings-section">
            <h3>修改密码</h3>
            <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="120px" class="password-form">
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" :prefix-icon="Key"></el-input>
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" :prefix-icon="Lock"></el-input>
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" :prefix-icon="Lock"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleChangePassword" :loading="passwordLoading" class="submit-btn">
                  <el-icon><Check /></el-icon> 修改密码
                </el-button>
                <el-button @click="resetPasswordForm" class="reset-btn">
                  <el-icon><Refresh /></el-icon> 重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 通知设置 -->
        <el-tab-pane label="通知" name="notification">
          <template #label>
            <el-icon><Bell /></el-icon>
            <span>通知</span>
          </template>
          
          <div class="settings-section">
            <h3>通知偏好</h3>
            <el-form :model="notificationForm" label-width="120px" class="notification-form">
              <el-form-item label="邮件通知" class="switch-item">
                <el-switch v-model="notificationForm.emailEnabled" active-text="开启" inactive-text="关闭" active-color="#409eff" class="custom-switch"></el-switch>
              </el-form-item>
              <el-form-item label="笔记提醒" class="switch-item">
                <el-switch v-model="notificationForm.noteReminder" active-text="开启" inactive-text="关闭" active-color="#409eff" class="custom-switch"></el-switch>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveNotificationSettings" class="submit-btn">
                  <el-icon><Check /></el-icon> 保存设置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 关于 -->
        <el-tab-pane label="关于" name="about">
          <template #label>
            <el-icon><InfoFilled /></el-icon>
            <span>关于</span>
          </template>
          
          <div class="settings-section">
            <h3>应用信息</h3>
            <el-card class="about-card">
              <div class="app-logo">
                <el-icon class="app-icon"><Document /></el-icon>
              </div>
              <h4 class="app-name">TinyNote</h4>
              <p class="app-version">版本: 1.0.0</p>
              <p class="app-description">简单易用的在线笔记应用</p>
              <div class="app-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ noteCount || '0' }}</span>
                  <span class="stat-label">我的笔记</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-number">{{ formatDate(createTime, 'days') || '0' }}</span>
                  <span class="stat-label">使用天数</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, User, UserFilled, Lock, Key, Bell, InfoFilled, 
  Document, Check, Refresh, Camera 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userAPI } from '../api/user.js'
import request from '../api/axios.js'

const router = useRouter()
const username = ref('')
const userId = ref('')
const email = ref('')
const nickname = ref('')
const createTime = ref('')
const updateLoading = ref(false)
const passwordLoading = ref(false)
const updateFormRef = ref()
const passwordFormRef = ref()
const activeTab = ref('account')
const noteCount = ref('')
// 头像URL状态 - 直接从localStorage初始化，这是最关键的一步
const avatarUrl = ref(localStorage.getItem('avatarUrl') || '')
// 将后端可能返回的相对路径统一转换为带域名的绝对URL
const apiOrigin = new URL(request.defaults.baseURL).origin
const toAbsoluteUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiOrigin}${url.startsWith('/') ? url : '/' + url}`
}

// 更新信息表单
const updateForm = reactive({
  email: '',
  nickname: ''
})

// 修改密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 通知设置表单
const notificationForm = reactive({
  emailEnabled: true,
  noteReminder: true
})

// 更新表单验证规则
const updateRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  nickname: [
    { required: false, trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应为2-20个字符', trigger: 'blur' }
  ]
}

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性：获取头像文字
const getAvatarText = computed(() => {
  const displayName = nickname.value || username.value
  if (!displayName) return '用'
  return displayName.charAt(0).toUpperCase()
})

// 头像上传前的检查
const beforeAvatarUpload = (file) => {
  const isValidFormat = file.type.startsWith('image/')
  if (!isValidFormat) {
    ElMessage.error('请上传图片文件!')
    return false
  }
  
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理头像上传 - 最终修复版本
const handleAvatarUpload = async (uploadConfig) => {
  console.log('===== 开始上传头像 =====', uploadConfig)
  
  // 先清空旧的头像URL
  avatarUrl.value = ''
  localStorage.setItem('avatarUrl', '')
  
  // Element Plus上传组件的参数结构处理
  const file = uploadConfig.file // Element Plus上传组件会直接传递file对象在config.file中
  console.log('获取到的文件对象:', file)
  console.log('文件类型:', file.type)
  console.log('文件大小:', file.size)
  console.log('用户ID:', userId.value)
  
  if (!file) {
    const errorMsg = '文件对象为空，无法上传'
    console.error(errorMsg)
    ElMessage.error(errorMsg)
    return
  }
  
  // 使用Promise封装FileReader
  const getPreviewUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  try {
    // 获取并设置预览URL
    const localPreviewUrl = await getPreviewUrl(file)
    avatarUrl.value = localPreviewUrl
    localStorage.setItem('avatarUrl', localPreviewUrl)
    ElMessage.info('头像预览已更新')
    
    // 检查userId是否有效
    if (!userId.value || userId.value === '未知') {
      ElMessage.error('用户信息无效，无法上传头像')
      console.error('userId无效:', userId.value)
      return
    }
    
    // 直接创建FormData对象进行上传
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId.value)
    
    console.log('准备发送FormData:', formData.get('userId'), formData.get('file').name)
    
    // 直接使用axios发送请求，绕过可能有问题的API封装
    const response = await request({
      url: `/user/uploadAvatar/${userId.value}`,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 增加超时时间
    })
    
    console.log('上传API返回结果:', response)
    if (response && response.code === 200) {
      const absolute = toAbsoluteUrl(response.data)
      // 以服务端地址为准，覆盖预览地址，确保返回后其它页面能正确加载
      avatarUrl.value = absolute
      localStorage.setItem('avatarUrl', absolute)
      localStorage.setItem('avatarUrlBackend', absolute)
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(`头像上传失败: ${response?.msg || response?.message || '未知错误'}`)
    }
  } catch (error) {
    console.error('===== 头像上传错误详情 =====')
    console.error('错误类型:', error.name)
    console.error('错误消息:', error.message)
    if (error.response) {
      console.error('HTTP状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
    ElMessage.error(`头像上传失败: ${error.message || '未知错误'}`)
  }
}

// 简化的loadAvatar函数 - 直接从localStorage获取
const loadAvatar = () => {
  const savedAvatar = localStorage.getItem('avatarUrl')
  if (savedAvatar) {
    avatarUrl.value = savedAvatar
  }
}

// 日期格式化函数
const formatDate = (dateString, type = 'full') => {
  if (!dateString) return ''
  
  try {
    // 确保日期字符串有效
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.error('无效的日期字符串:', dateString)
      return ''
    }
    
    if (type === 'days') {
      // 计算使用天数 - 优化计算逻辑
      const now = new Date()
      // 将时间部分设置为0，只比较日期
      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // 计算时间差（毫秒）
      const diffTime = Math.abs(endDate - startDate)
      // 转换为天数，使用Math.ceil确保今天注册也算1天
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      console.log('计算使用天数:', { startDate, endDate, diffDays })
      return diffDays
    } else {
      // 完整日期格式
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}/${month}/${day} ${hours}:${minutes}`
    }
  } catch (error) {
    console.error('日期格式化错误:', error)
    return ''
  }
}

// 页面加载时执行
onMounted(async () => {
  // 先加载本地头像
  loadAvatar()
  
  // 加载本地保存的昵称
  const savedNickname = localStorage.getItem('nickname')
  if (savedNickname) {
    nickname.value = savedNickname
  }
  
  // 然后加载用户信息，但不覆盖已有头像和昵称
  await loadUserInfo()
  // 加载笔记数量
  loadNoteCount()
  loadNotificationSettings()
})

// 加载用户信息 - 注意：绝对不修改头像URL
const loadUserInfo = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    userId.value = userInfo.id || ''
    
    if (userId.value) {
      const response = await userAPI.getUserInfo(userId.value)
      if (response.code === 200) {
        const userData = response.data
        username.value = userData.username || '用户'
        email.value = userData.email || ''
        nickname.value = userData.nickname || ''
        createTime.value = userData.createTime || ''
        
        // 填充表单数据
        updateForm.email = email.value
        updateForm.nickname = nickname.value
        
        // 重要：只有当本地没有头像URL时，才考虑使用后端的头像URL
        if (!avatarUrl.value && userData.avatar && userData.avatar.trim()) {
          const absolute = toAbsoluteUrl(userData.avatar)
          avatarUrl.value = absolute
          localStorage.setItem('avatarUrl', absolute)
        }
      }
    } else {
      // 从localStorage获取用户名
      username.value = localStorage.getItem('username') || '用户'
      userId.value = '未知'
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    ElMessage.error('加载用户信息失败')
  }
}

// 加载通知设置
const loadNotificationSettings = () => {
  try {
    const savedSettings = localStorage.getItem('notificationSettings')
    if (savedSettings) {
      Object.assign(notificationForm, JSON.parse(savedSettings))
    }
  } catch (error) {
    console.error('加载通知设置失败:', error)
  }
}

// 保存通知设置
const saveNotificationSettings = () => {
  try {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationForm))
    ElMessage.success('通知设置已保存')
  } catch (error) {
    console.error('保存通知设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

// 更新个人信息
const handleUpdateInfo = async () => {
  await updateFormRef.value.validate(async (valid) => {
    if (valid) {
      updateLoading.value = true
      try {
        const response = await userAPI.updateUserInfo({
          id: userId.value,
          email: updateForm.email,
          nickname: updateForm.nickname
        })
        
        if (response.code === 200) {
          ElMessage.success('个人信息更新成功')
          // 更新本地缓存
          email.value = updateForm.email
          nickname.value = updateForm.nickname
          
          // 同步更新localStorage中的昵称
          localStorage.setItem('nickname', updateForm.nickname)
        } else {
          ElMessage.error(response.msg || '更新失败')
        }
      } catch (error) {
        console.error('更新个人信息失败:', error)
        ElMessage.error('网络错误，请稍后重试')
      } finally {
        updateLoading.value = false
      }
    }
  })
}

// 修改密码
const handleChangePassword = async () => {
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordLoading.value = true
      try {
        const response = await userAPI.changePassword({
          userId: userId.value,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        
        if (response.code === 200) {
          ElMessage.success('密码修改成功，请重新登录')
          resetPasswordForm()
          // 跳转到登录页
          setTimeout(() => {
            router.push('/login')
            localStorage.removeItem('userInfo')
            localStorage.removeItem('username')
          }, 1500)
        } else {
          ElMessage.error(response.msg || '密码修改失败')
        }
      } catch (error) {
        console.error('修改密码失败:', error)
        ElMessage.error('网络错误，请稍后重试')
      } finally {
        passwordLoading.value = false
      }
    }
  })
}

// 重置更新表单
const resetUpdateForm = () => {
  updateFormRef.value.resetFields()
  updateForm.email = email.value
  updateForm.nickname = nickname.value
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordFormRef.value.resetFields()
}

// 加载笔记数量
const loadNoteCount = async () => {
  try {
    // 重置为0
    noteCount.value = 0
    
    // 如果用户已登录，使用正确的API端点获取真实的笔记数量
    if (userId.value && userId.value !== '未知') {
      try {
        // 使用正确的API端点获取笔记数量
        const response = await userAPI.getNoteCount(userId.value)
        if (response.code === 200) {
          // 从后端API响应中提取数量
          if (typeof response.data === 'number') {
            // 如果是直接的数字
            noteCount.value = response.data
          } else if (response.data && typeof response.data === 'object') {
            // 如果是包含count字段的对象
            noteCount.value = response.data.count || 0
          } else if (typeof response.data === 'string') {
            // 如果是字符串消息，尝试解析数字
            const countMatch = response.data.match(/\d+/)
            if (countMatch) {
              noteCount.value = parseInt(countMatch[0])
            }
          }
          console.log('从后端API获取的笔记数量:', noteCount.value)
        }
      } catch (apiError) {
        console.error('API调用失败:', apiError.message)
        // 失败时尝试从笔记列表API获取数量
        try {
          const notesResponse = await userAPI.getUserNotes(userId.value)
          if (notesResponse.code === 200 && notesResponse.data) {
            if (notesResponse.data.records && Array.isArray(notesResponse.data.records)) {
              noteCount.value = notesResponse.data.records.length
            } else if (Array.isArray(notesResponse.data)) {
              noteCount.value = notesResponse.data.length
            }
          }
        } catch (notesError) {
          console.error('获取笔记列表失败:', notesError.message)
        }
      }
    } else {
      // 用户未登录时尝试从本地存储获取
      try {
        const mainNotes = JSON.parse(localStorage.getItem('notes') || '[]')
        noteCount.value = mainNotes.length
        console.log('用户未登录，使用本地存储的笔记数量:', noteCount.value)
      } catch (error) {
        console.error('从本地存储获取笔记数量失败:', error)
      }
    }
  } catch (error) {
    console.error('加载笔记数量发生未预期错误:', error)
    noteCount.value = 0
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<style scoped>
/* 设置页面容器 */
.settings-container {
  min-height: 100vh;
  width: 100%;
  padding: 20px;
  margin: 0;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

/* 设置内容区域 */
.settings-content {
  width: 100%;
  max-width: 800px;
  min-height: 100vh;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 0 32px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin: 20px auto;
  overflow-y: auto;
}

/* 头部样式 */
.settings-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.settings-header h2 {
  margin: 0;
  margin-left: 16px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.back-btn {
  font-size: 16px;
  color: #666;
  transition: color 0.3s ease;
}

.back-btn:hover {
  color: #409eff;
}

/* 用户信息卡片 */
.user-info-card {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.user-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.user-profile {
  display: flex;
  align-items: center;
  padding: 20px;
}

.avatar-upload-wrapper {
  position: relative;
  margin-right: 20px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 32px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.avatar-upload-btn {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.avatar-upload-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #409eff;
  font-size: 16px;
  padding: 0;
  border-radius: 50%;
  transition: color 0.3s ease;
}

.upload-btn:hover {
  color: #667eea;
  background: #f0f7ff;
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.user-id {
  margin: 8px 0 0 0;
  color: #999;
  font-size: 14px;
}

/* 标签页样式 */
.settings-tabs {
  --el-tabs-header-height: 50px;
}

:deep(.el-tabs__header) {
  margin-bottom: 24px;
}

:deep(.el-tabs__nav) {
  padding-left: 0;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #666;
  padding: 0 20px;
  transition: all 0.3s ease;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  background: linear-gradient(90deg, #409eff, #667eea);
}

/* 设置区块 */
.settings-section {
  margin-bottom: 32px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.settings-section:hover {
  background: #f0f2f5;
  transform: translateY(-1px);
}

.settings-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-left: 4px solid #409eff;
  padding-left: 12px;
}

/* 信息描述样式 */
.info-descriptions {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.info-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item :deep(.el-descriptions__label) {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.info-value {
  font-size: 14px;
  color: #333;
}

/* 表单样式 */
.update-form,
.password-form,
.notification-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #666;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

:deep(.el-input__icon) {
  color: #909399;
}

/* 按钮样式 */
.submit-btn,
.reset-btn {
  font-size: 14px;
  padding: 8px 20px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.submit-btn {
  background: linear-gradient(135deg, #409eff, #667eea);
  border: none;
  color: white;
  margin-right: 12px;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea, #409eff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.reset-btn {
  color: #606266;
}

.reset-btn:hover {
  color: #409eff;
}

/* 开关样式 */
.switch-item :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
}

.custom-switch :deep(.el-switch__core) {
  border-radius: 20px;
  transition: all 0.3s ease;
}

/* 关于卡片样式 */
.about-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  text-align: center;
  padding: 32px 20px;
  transition: all 0.3s ease;
}

.about-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.app-logo {
  margin-bottom: 20px;
}

.app-icon {
  font-size: 48px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 20px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.app-icon:hover {
  transform: rotate(5deg) scale(1.1);
}

.app-name {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.app-version,
.app-description {
  margin: 8px 0;
  color: #666;
}

/* 统计信息 */
.app-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
  padding: 0 32px;
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #e0e0e0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-container {
    padding: 10px;
  }
  
  .settings-content {
    padding: 16px;
    margin-top: 10px;
  }
  
  .user-profile {
    flex-direction: column;
    text-align: center;
  }
  
  .user-avatar {
    margin-right: 0;
    margin-bottom: 16px;
  }
  
  .app-stats {
    flex-direction: column;
  }
  
  .stat-divider {
    width: 40px;
    height: 1px;
    margin: 16px 0;
  }
  
  .stat-item {
    padding: 0;
  }
  
  .settings-section {
    padding: 16px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 13px;
  }
}

/* 动画效果 */
.settings-content {
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>