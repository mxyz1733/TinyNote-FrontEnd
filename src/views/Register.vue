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
            prefix-icon="el-icon-user"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            prefix-icon="el-icon-message"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            prefix-icon="el-icon-lock"
            show-password
          />
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
import { userAPI } from '../api/user.js'

export default {
  name: 'Register',
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
        
        // 调用真实的注册API
        const response = await userAPI.register({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })
        
        // 注册成功后跳转到登录页
        ElMessage.success('注册成功，请登录')
        router.push('/login')
        loading.value = false
        
      } catch (error) {
        console.error('注册失败', error)
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
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
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
  height: 40px;
  font-size: 16px;
}

.login-redirect {
  text-align: center;
  margin-top: 10px;
}

.login-redirect span {
  color: #606266;
}
</style>