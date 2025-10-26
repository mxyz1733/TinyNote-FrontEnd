<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
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
            prefix-icon="el-icon-user"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <el-link type="primary" :underline="false" class="register-link" @click="goToRegister">立即注册</el-link>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="handleLogin" 
            class="login-btn"
            :disabled="loading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
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
        await loginFormRef.value.validate()
        loading.value = true
        
        // 模拟登录请求
        setTimeout(() => {
          // 这里应该是真实的API调用，现在使用模拟数据
          if (loginForm.username && loginForm.password) {
            // 保存token到localStorage
            localStorage.setItem('token', 'mock-token-' + Date.now())
            
            if (rememberMe.value) {
              localStorage.setItem('username', loginForm.username)
            } else {
              localStorage.removeItem('username')
            }
            
            ElMessage.success('登录成功')
            router.push('/home')
          } else {
            ElMessage.error('登录失败，请检查用户名和密码')
          }
          loading.value = false
        }, 1000)
        
      } catch (error) {
        console.log('表单验证失败', error)
        loading.value = false
      }
    }
    
    const goToRegister = () => {
      router.push('/register')
    }
    
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
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-header h2 {
  margin: 0;
  color: #303133;
}

.login-form {
  padding: 0 20px 20px;
}

.register-link {
  float: right;
}

.login-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style>