<template>
  <div class="register-container">
    <el-card class="register-card" shadow="hover">
      <template #header>
        <div class="register-header">
          <h2>TinyNote 注册</h2>
        </div>
      </template>
      
      <el-form 
        ref="registerFormRef" 
        :model="registerForm" 
        :rules="rules" 
        label-width="0px"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            clearable
          >
            <template #prefix>
              <div class="icon-wrapper">
                <el-icon><User /></el-icon>
              </div>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            clearable
          >
            <template #prefix>
              <div class="icon-wrapper">
                <el-icon><Message /></el-icon>
              </div>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <div class="icon-wrapper">
                <el-icon><Lock /></el-icon>
              </div>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            show-password
          >
            <template #prefix>
              <div class="icon-wrapper">
                <el-icon><Lock /></el-icon>
              </div>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="agreed">我已阅读并同意<a href="#" @click.prevent>用户协议</a>和<a href="#" @click.prevent>隐私政策</a></el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            @click="handleRegister" 
            class="register-btn"
            :disabled="loading || !agreed"
          >
            注册
          </el-button>
        </el-form-item>
        
        <el-form-item class="login-redirect">
          <span>已有账号？</span>
          <el-link type="primary" :underline="false" @click="goToLogin">去登录</el-link>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Message, Lock } from '@element-plus/icons-vue'
import { userAPI } from '../api/user.js'

export default {
  name: 'Register',
  components: {
    User,
    Message,
    Lock
  },
  setup() {
    const router = useRouter()
    const registerFormRef = ref()
    const loading = ref(false)
    const agreed = ref(false)
    
    const registerForm = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== registerForm.password) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }
    
    const handleRegister = async () => {
      if (!agreed.value) {
        ElMessage.warning('请阅读并同意用户协议和隐私政策')
        return
      }
      
      try {
        await registerFormRef.value.validate()
        loading.value = true
        
        // 调用注册API
        const registerResponse = await userAPI.register({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
        
        // 注册成功后立即调用登录API获取token和用户信息
        const loginResponse = await userAPI.login({
          username: registerForm.username,
          password: registerForm.password
        })
        
        if (loginResponse.code === 200) {
          // 保存token和用户信息到localStorage
          localStorage.setItem('token', loginResponse.data.token)
          localStorage.setItem('userInfo', JSON.stringify(loginResponse.data.userInfo))
          
          // 保存用户昵称到localStorage
          if (loginResponse.data.userInfo && loginResponse.data.userInfo.nickname) {
            localStorage.setItem('nickname', loginResponse.data.userInfo.nickname)
          } else {
            // 如果没有昵称，使用用户名作为昵称
            localStorage.setItem('nickname', registerForm.username)
          }
          
          // 保存头像URL到localStorage
          if (loginResponse.data.userInfo && loginResponse.data.userInfo.avatar) {
            localStorage.setItem('avatarUrl', loginResponse.data.userInfo.avatar)
          }
          
          // 注册成功提示
          ElMessage.success('注册成功，正在跳转到工作区...')
          
          // 延迟跳转到工作区页面
          setTimeout(() => {
            router.push('/workspace')
          }, 1000)
        }
        loading.value = false
        
      } catch (error) {
        console.error('注册失败', error)
        ElMessage.error('注册失败，请稍后重试')
        loading.value = false
      }
    }
    
    const goToLogin = () => {
      router.push('/login')
    }
    
    return {
      registerFormRef,
      registerForm,
      rules,
      loading,
      agreed,
      handleRegister,
      goToLogin
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* 图标容器样式 */
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

/* 输入框聚焦时图标颜色变化 */
:deep(.el-input__wrapper.is-focus) .icon-wrapper {
  color: #409eff;
}

.register-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
  overflow: hidden;
}

.register-header {
  text-align: center;
  margin-bottom: 20px;
}

.register-header h2 {
  margin: 0;
  color: #303133;
}

.register-form {
  padding: 0 20px 20px;
}

.register-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  margin-top: 20px;
  transition: all 0.3s;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  font-size: 16px;
}

.login-redirect {
  text-align: center;
  margin-top: 10px;
}

.login-redirect span {
  color: #606266;
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.login-redirect a {
  color: #667eea;
  text-decoration: none;
  transition: all 0.3s;
}

.login-redirect a:hover {
  color: #5a67d8;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.el-checkbox__input.is-checked .el-checkbox__inner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.el-checkbox__input.is-checked + .el-checkbox__label {
  color: #667eea;
}
</style>