<template>
  <div class="home-container">
    <el-header class="main-header">
      <div class="header-left">
        <h1 class="logo">TinyNote</h1>
      </div>
      <div class="header-right">
        <el-dropdown>
          <el-button type="text" class="user-btn">
            <el-icon><User /></el-icon>
            <span>{{ username || '用户' }}</span>
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToProfile">个人中心</el-dropdown-item>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    
    <el-main class="main-content">
      <el-card class="welcome-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>欢迎使用 TinyNote</span>
          </div>
        </template>
        <div class="welcome-content">
          <el-empty description="暂无笔记" :image-size="100">
            <el-button type="primary" @click="createNote">创建第一篇笔记</el-button>
          </el-empty>
        </div>
      </el-card>
    </el-main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, ArrowDown } from '@element-plus/icons-vue'

export default {
  name: 'Home',
  components: {
    User,
    ArrowDown
  },
  setup() {
    const router = useRouter()
    const username = ref('')
    
    const handleLogout = () => {
      // 清除token
      localStorage.removeItem('token')
      ElMessage.success('退出登录成功')
      // 跳转到登录页
      router.push('/login')
    }
    
    const goToProfile = () => {
      ElMessage.info('个人中心功能开发中...')
    }
    
    const createNote = () => {
      ElMessage.info('笔记创建功能开发中...')
    }
    
    onMounted(() => {
      // 获取保存的用户名，如果没有则显示默认值
      const savedUsername = localStorage.getItem('username')
      if (savedUsername) {
        username.value = savedUsername
      }
      
      // 检查是否已登录
      const token = localStorage.getItem('token')
      if (!token) {
        ElMessage.warning('请先登录')
        router.push('/login')
      }
    })
    
    return {
      username,
      handleLogout,
      goToProfile,
      createNote
    }
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-header {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo {
  margin: 0;
  color: #409eff;
  font-size: 24px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
}

.welcome-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content {
  text-align: center;
  padding: 40px 0;
}
</style>