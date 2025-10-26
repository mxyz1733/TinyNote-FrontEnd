<template>
  <div class="login-container">
    <!-- 装饰性背景元素 -->
    <div class="decoration-circle decoration-circle-1"></div>
    <div class="decoration-circle decoration-circle-2"></div>
    <div class="decoration-circle decoration-circle-3"></div>
    <el-card class="login-card" shadow="hover" bordered="false">
      <template #header>
        <div class="login-header">
          <h2>TinyNote 登录</h2>
        </div>
      </template>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="rules" 
        label-width="0px"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            clearable
            class="animated-input"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            class="animated-input"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-link type="primary" :underline="false" class="register-link" @click="goToRegister">立即注册</el-link>
          </div>
        </el-form-item>
        
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Right } from '@element-plus/icons-vue'
import { userAPI } from '../api/user.js'

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
    
    const loginForm = reactive({
      username: '',
      password: ''
    })
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      try {
        // 表单验证
        const valid = await loginFormRef.value.validate()
        console.log('表单验证结果:', valid)
        loading.value = true
        
        console.log('登录尝试:', { username: loginForm.username, password: '******' })
        
        // 调用真实的后端API
        const response = await userAPI.login({
          username: loginForm.username,
          password: loginForm.password
        })
        
        console.log('登录响应:', response)
        
        if (response.code === 200) {
          // 保存token和用户信息到localStorage
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo))
          
          if (rememberMe.value) {
            localStorage.setItem('username', loginForm.username)
          } else {
            localStorage.removeItem('username')
          }
          
          ElMessage.success('登录成功')
          // 登录成功后跳转到工作区页面
          router.push('/workspace')
        } else {
          ElMessage.error(response.message || '登录失败')
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
    
    // 添加页面加载动画效果
    onMounted(() => {
      const container = document.querySelector('.login-container')
      if (container) {
        container.classList.add('page-loaded')
      }
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
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
  }
}

.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 200% 200%;
  padding: 20px;
  transition: all 0.8s cubic-bezier(0.19, 1, 0.22, 1);
  opacity: 0;
}

.login-container.page-loaded {
  opacity: 1;
}

.login-container:hover {
  background-position: 100% 100%;
}

.login-container:hover .login-card {
  animation: pulse 2s infinite;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1;
  position: relative;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  background-color: rgba(255, 255, 255, 1);
}

/* 输入框动画样式 */
.animated-input {
  animation: fadeInUp 0.5s ease-out;
}

/* 为表单元素添加延迟动画 */
.login-form .el-form-item:nth-child(1) {
  animation: fadeInUp 0.5s ease-out 0.1s both;
}

.login-form .el-form-item:nth-child(2) {
  animation: fadeInUp 0.5s ease-out 0.2s both;
}

.login-form .el-form-item:nth-child(3) {
  animation: fadeInUp 0.5s ease-out 0.3s both;
}

.login-form .el-form-item:nth-child(4) {
  animation: fadeInUp 0.5s ease-out 0.4s both;
}

.login-header {
  text-align: center;
  margin-bottom: 15px;
  padding: 15px 0;
  border-bottom: none;
}

.login-header h2 {
  margin: 0;
  color: #303133;
  font-weight: 600;
  font-size: 24px;
}

.login-form {
  padding: 0 30px 25px;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input {
  transition: all 0.3s ease;
}

.el-input:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  width: 100%;
}

.form-options .el-checkbox {
  margin-right: auto;
}

.form-options .register-link {
  margin-left: auto;
}

.register-link {
  transition: all 0.3s ease;
}

.register-link:hover {
  text-decoration: underline;
  transform: scale(1.05);
}

.login-btn {
  width: 100%;
  height: 42px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

/* 输入框聚焦时的动画效果 */
.el-input__wrapper:focus-within {
  box-shadow: 0 0 0 1px #409eff inset, 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 按钮加载状态的动画 */
.login-btn.is-loading {
  color: transparent !important;
}

/* 输入框内容变化时的平滑过渡 */
.el-input__inner {
  transition: all 0.2s ease;
}

/* 鼠标悬停在卡片上时，标题颜色变化 */
.login-card:hover .login-header h2 {
  color: #409eff;
  transition: color 0.3s ease;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .login-card {
    max-width: 90%;
    margin: 0 auto;
  }
  
  .login-header h2 {
    font-size: 20px;
  }
  
  .login-form {
    padding: 0 20px 20px;
  }
}

/* 复选框样式增强 */
.el-checkbox__label:hover {
  color: #409eff;
  transition: color 0.3s ease;
}

.el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #409eff;
  border-color: #409eff;
}

/* 装饰性背景元素 */
.decoration-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(50px);
  opacity: 0.3;
  z-index: 0;
  transition: all 1s ease;
}

.decoration-circle-1 {
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.3);
  top: 10%;
  left: 10%;
}

.decoration-circle-2 {
  width: 200px;
  height: 200px;
  background: rgba(102, 126, 234, 0.2);
  bottom: 15%;
  right: 15%;
}

.decoration-circle-3 {
  width: 150px;
  height: 150px;
  background: rgba(118, 75, 162, 0.2);
  top: 50%;
  right: 10%;
}

.login-container:hover .decoration-circle-1 {
  transform: scale(1.2) translateX(20px);
  opacity: 0.2;
}

.login-container:hover .decoration-circle-2 {
  transform: scale(1.1) translateY(-20px);
  opacity: 0.2;
}

.login-container:hover .decoration-circle-3 {
  transform: scale(1.3) translateX(-10px);
  opacity: 0.15;
}
</style>