<template>
  <div class="login-container">
    <!-- 数学公式背景装饰 -->
    <div class="math-decoration">
      <div class="formula" :style="{ top: '10%', left: '5%', transform: 'rotate(-15deg)' }">E=mc²</div>
      <div class="formula" :style="{ top: '80%', left: '85%', transform: 'rotate(10deg)' }">∫f(x)dx</div>
      <div class="formula" :style="{ top: '30%', left: '80%', transform: 'rotate(5deg)' }">a²+b²=c²</div>
      <div class="formula" :style="{ top: '60%', left: '15%', transform: 'rotate(-10deg)' }">πr²</div>
    </div>

    <!-- 波纹效果背景 -->
    <div class="ripple-container">
      <div class="ripple ripple-1"></div>
      <div class="ripple ripple-2"></div>
      <div class="ripple ripple-3"></div>
    </div>

    <!-- 主登录卡片 -->
    <el-card class="login-card glass-effect" shadow="hover" bordered="false" @mouseenter="cardHovered = true" @mouseleave="cardHovered = false">
      <template #header>
        <div class="login-header">
          <div class="logo-container">
            <div class="logo-icon">📝</div>
          </div>
          <h2 class="title">TinyNote</h2>
          <p class="subtitle">记录灵感 • 整理思路 • 知识管理</p>
        </div>
      </template>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="rules" 
        label-width="0px"
        class="login-form"
      >
        <!-- 用户名输入框 -->
        <el-form-item prop="username">
          <div class="input-wrapper" :class="{ 'is-focused': focus.username, 'shake': shake.username }">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              clearable
              class="animated-input"
              @focus="focus.username = true"
              @blur="focus.username = false"
            >
              <template #prefix>
                <div class="icon-wrapper">
                  <el-icon><User /></el-icon>
                </div>
              </template>
            </el-input>
          </div>
        </el-form-item>
        
        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <div class="input-wrapper" :class="{ 'is-focused': focus.password, 'shake': shake.password }">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              class="animated-input"
              @keyup.enter="handleLogin"
              @focus="focus.password = true"
              @blur="focus.password = false"
            >
              <template #prefix>
                <div class="icon-wrapper">
                  <el-icon><Lock /></el-icon>
                </div>
              </template>
            </el-input>
          </div>
        </el-form-item>
        
        <!-- 选项区域 -->
        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="rememberMe" class="remember-checkbox">
              <span class="checkbox-label">记住我</span>
            </el-checkbox>
            <el-link type="primary" :underline="false" class="register-link" @click="goToRegister">
              立即注册
            </el-link>
          </div>
        </el-form-item>
        
        <!-- 登录按钮 -->
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="handleLogin" 
            class="login-btn"
            :disabled="loading"
          >
            <el-icon><Right /></el-icon> 登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Right } from '@element-plus/icons-vue'
import { userAPI } from '../api/user.js'
import request from '../api/axios.js'

export default {
  name: 'Login',
  components: {
    User,
    Lock,
    Right
  },
  setup() {
    const router = useRouter()
    const loginFormRef = ref()
    const loading = ref(false)
    const rememberMe = ref(false)
    const cardHovered = ref(false)
    
    // 输入框聚焦状态
    const focus = reactive({
      username: false,
      password: false
    })
    
    // 抖动动画状态
    const shake = reactive({
      username: false,
      password: false
    })
    
    const loginForm = reactive({
      username: '',
      password: ''
    })
    
    // 自定义验证规则，带抖动反馈
    const rules = {
      username: [
        { 
          required: true, 
          message: '请输入用户名', 
          trigger: 'blur',
          validator: (rule, value, callback) => {
            if (!value || value.trim() === '') {
              shake.username = true
              setTimeout(() => { shake.username = false }, 600)
              callback(new Error('请输入用户名'))
            } else if (value.length < 3 || value.length > 20) {
              shake.username = true
              setTimeout(() => { shake.username = false }, 600)
              callback(new Error('长度在 3 到 20 个字符'))
            } else {
              callback()
            }
          }
        }
      ],
      password: [
        { 
          required: true, 
          message: '请输入密码', 
          trigger: 'blur',
          validator: (rule, value, callback) => {
            if (!value || value.trim() === '') {
              shake.password = true
              setTimeout(() => { shake.password = false }, 600)
              callback(new Error('请输入密码'))
            } else if (value.length < 6) {
              shake.password = true
              setTimeout(() => { shake.password = false }, 600)
              callback(new Error('密码长度至少为6位'))
            } else {
              callback()
            }
          }
        }
      ]
    }
    
    const handleLogin = async () => {
      try {
        // 表单验证
        await loginFormRef.value.validate()
        loading.value = true
        
        console.log('登录尝试:', { username: loginForm.username, password: '******' })
        
        // 调用后端API
        const response = await userAPI.login({
          username: loginForm.username,
          password: loginForm.password
        })
        
        console.log('登录响应:', response)
        
        if (response.code === 200) {
          // 保存token和用户信息到localStorage
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo))
          
          // 保存用户名和昵称
          if (rememberMe.value) {
            localStorage.setItem('username', loginForm.username)
          } else {
            localStorage.removeItem('username')
          }
          
          // 保存用户昵称到localStorage
          if (response.data.userInfo && response.data.userInfo.nickname) {
            localStorage.setItem('nickname', response.data.userInfo.nickname)
          } else {
            // 如果没有昵称，使用用户名作为昵称
            localStorage.setItem('nickname', loginForm.username)
          }
          
          // 保存头像URL到localStorage（规范为绝对URL）
          if (response.data.userInfo && response.data.userInfo.avatar) {
            const apiOrigin = new URL(request.defaults.baseURL).origin
            const avatar = response.data.userInfo.avatar
            const absolute = /^https?:\/\//i.test(avatar) ? avatar : `${apiOrigin}${avatar.startsWith('/') ? avatar : '/' + avatar}`
            localStorage.setItem('avatarUrl', absolute)
          }
          
          // 登录成功动画效果
          const loginCard = document.querySelector('.login-card')
          loginCard.classList.add('login-success')
          
          ElMessage.success('登录成功')
          
          // 延迟跳转到工作区页面
          setTimeout(() => {
            router.push('/workspace')
          }, 800)
        } else {
          ElMessage.error(response.message || '登录失败')
          // 登录失败时密码框抖动
          shake.password = true
          setTimeout(() => { shake.password = false }, 600)
        }
        loading.value = false
        
      } catch (error) {
        console.error('登录错误:', error)
        ElMessage.error('登录失败，请检查网络连接或稍后重试')
        loading.value = false
      }
    }
    
    const goToRegister = () => {
      router.push('/register')
    }
    
    // 页面加载动画效果
    onMounted(() => {
      const container = document.querySelector('.login-container')
      if (container) {
        setTimeout(() => {
          container.classList.add('page-loaded')
        }, 100)
      }
      
      // 数学公式动画效果
      setTimeout(() => {
        const formulas = document.querySelectorAll('.formula')
        formulas.forEach((formula, index) => {
          setTimeout(() => {
            formula.classList.add('formula-visible')
          }, index * 200)
        })
      }, 500)
    })
    
    // 检查是否有记住的用户名
    const savedUsername = localStorage.getItem('username')
    if (savedUsername) {
      loginForm.username = savedUsername
      rememberMe.value = true
    }
    
    return {
      loginFormRef,
      loginForm,
      rules,
      loading,
      rememberMe,
      cardHovered,
      focus,
      shake,
      handleLogin,
      goToRegister
    }
  }
}
</script>

<style scoped>
/* 全局动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(102, 126, 234, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(var(--rotation, 0deg));
  }
  50% {
    transform: translateY(-10px) rotate(calc(var(--rotation, 0deg) + 2deg));
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  20%, 60% {
    transform: translateX(-10px);
  }
  40%, 80% {
    transform: translateX(10px);
  }
}

@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.8;
  }
  100% {
    transform: scale(10);
    opacity: 0;
  }
}

@keyframes formulaAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8) rotate(var(--rotation, 0deg));
  }
  to {
    opacity: 0.15;
    transform: translate(-50%, -50%) scale(1) rotate(var(--rotation, 0deg));
  }
}

@keyframes loginSuccess {
  0% {
    transform: scale(1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  }
  100% {
    transform: scale(1) translateY(-50px);
    opacity: 0;
  }
}

/* 主容器样式 */
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1);
  opacity: 0;
  position: relative;
  overflow: hidden;
}

.login-container.page-loaded {
  opacity: 1;
}

@keyframes gradientBackground {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 数学公式背景装饰 */
.math-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.formula {
  position: absolute;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  font-size: 3rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0);
  opacity: 0;
  transition: all 0.6s ease;
  transform-origin: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.formula.formula-visible {
  animation: formulaAppear 0.8s ease forwards, float 6s ease-in-out infinite;
  opacity: 0.15;
}

/* 波纹效果背景 */
.ripple-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  transform: scale(0);
  animation: ripple 8s linear infinite;
}

.ripple-1 {
  width: 600px;
  height: 600px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.ripple-2 {
  width: 800px;
  height: 800px;
  bottom: -20%;
  right: -10%;
  animation-delay: 2s;
}

.ripple-3 {
  width: 500px;
  height: 500px;
  top: 40%;
  right: 20%;
  animation-delay: 4s;
}

/* 登录卡片样式 */
.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.97);
  transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 2;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 1);
}

.login-card.login-success {
  animation: loginSuccess 1s ease forwards;
}

/* 卡片头部样式 */
.login-header {
  text-align: center;
  padding: 30px 20px 20px;
  position: relative;
}

.logo-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  animation: pulse 3s infinite;
}

.login-card:hover .logo-container {
  transform: scale(1.1);
  box-shadow: 0 12px 25px rgba(102, 126, 234, 0.4);
}

.logo-icon {
  font-size: 32px;
  animation: float 4s ease-in-out infinite;
}

.title {
  margin: 0 0 10px;
  color: #2c3e50;
  font-weight: 700;
  font-size: 28px;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
  font-weight: 400;
  opacity: 0.8;
}

/* 表单样式 */
.login-form {
  padding: 0 30px 35px;
}

/* 输入框包装器 */
.input-wrapper {
  position: relative;
  transition: all 0.3s ease;
  margin-bottom: 5px;
}

.input-wrapper.is-focused {
  transform: translateY(-2px);
}

.input-wrapper.shake {
  animation: shake 0.6s ease-in-out;
}

/* 图标包装器 */
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
}

.input-wrapper.is-focused .icon-wrapper {
  transform: scale(1.1);
  color: #667eea;
}

/* 为表单元素添加延迟动画 */
.login-form .el-form-item:nth-child(1) {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.login-form .el-form-item:nth-child(2) {
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.login-form .el-form-item:nth-child(3) {
  animation: fadeInUp 0.6s ease-out 0.6s both;
}

.login-form .el-form-item:nth-child(4) {
  animation: fadeInUp 0.6s ease-out 0.8s both;
}

/* Element Plus 组件样式覆盖 */
.el-form-item {
  margin-bottom: 25px;
  position: relative;
}

.el-input {
  transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

.el-input__wrapper {
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.el-input__wrapper:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: rgba(102, 126, 234, 0.2);
}

.el-input__wrapper:focus-within {
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  background: rgba(255, 255, 255, 1);
}

.el-input__inner {
  height: 48px;
  font-size: 16px;
  padding: 0 16px;
  border: none;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.el-input__inner::placeholder {
  color: #bdc3c7;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-wrapper.is-focused .el-input__inner::placeholder {
  transform: translateX(5px);
  opacity: 0;
}

/* 表单选项区域 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  width: 100%;
}

.checkbox-label {
  font-size: 14px;
  color: #7f8c8d;
  transition: all 0.3s ease;
}

.remember-checkbox:hover .checkbox-label {
  color: #667eea;
}

.register-link {
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
  position: relative;
  padding: 4px 8px;
  border-radius: 6px;
}

.register-link:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.05);
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s ease;
}

.login-btn:hover:not(:disabled)::before {
  left: 100%;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn.is-loading {
  color: transparent !important;
  background: linear-gradient(135deg, #a7b1e8 0%, #b39ddb 100%);
}

/* 复选框样式增强 */
.el-checkbox__input.is-checked .el-checkbox__inner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.el-checkbox__input.is-checked + .el-checkbox__label {
  color: #667eea;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .login-card {
    max-width: 92%;
    margin: 0 auto;
    border-radius: 16px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .login-form {
    padding: 0 20px 25px;
  }
  
  .logo-container {
    width: 60px;
    height: 60px;
  }
  
  .logo-icon {
    font-size: 24px;
  }
  
  .formula {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }
  
  .login-header {
    padding: 20px 15px 15px;
  }
  
  .login-form {
    padding: 0 15px 20px;
  }
  
  .formula {
    font-size: 1.5rem;
  }
}
</style>