<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="settings-header">
          <el-button type="text" @click="goBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
          <h2>设置</h2>
        </div>
      </template>
      
      <el-tabs>
        <!-- 主题设置 -->
        <el-tab-pane label="外观">
          <div class="settings-section">
            <h3>主题设置</h3>
            <div class="theme-options">
              <el-radio-group v-model="currentTheme" @change="changeTheme">
                <el-radio-button label="light">浅色</el-radio-button>
                <el-radio-button label="dark">深色</el-radio-button>
                <el-radio-button label="auto">跟随系统</el-radio-button>
              </el-radio-group>
              <p class="setting-description">选择应用的显示主题</p>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 其他设置标签可以在这里添加 -->
        <el-tab-pane label="账户">
          <div class="settings-section">
            <h3>账户信息</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">
                {{ username }}
              </el-descriptions-item>
              <el-descriptions-item label="用户ID">
                {{ userId }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'Settings',
  components: {
    ArrowLeft
  },
  setup() {
    const router = useRouter()
    const currentTheme = ref('light')
    const username = ref('')
    const userId = ref('')
    
    // 初始化设置
    onMounted(() => {
      // 加载用户信息
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      username.value = userInfo.username || '用户'
      userId.value = userInfo.id || ''
      
      // 加载保存的主题设置，如果没有则默认浅色
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        currentTheme.value = savedTheme
      } else {
        // 检查系统主题偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          currentTheme.value = 'auto'
        }
      }
      
      // 应用主题
      applyTheme(currentTheme.value)
      
      // 监听系统主题变化（当选择自动模式时）
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (currentTheme.value === 'auto') {
          applyTheme('auto')
        }
      })
    })
    
    // 应用主题
    const applyTheme = (theme) => {
      let actualTheme = theme
      
      if (theme === 'auto') {
        // 跟随系统主题
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          actualTheme = 'dark'
        } else {
          actualTheme = 'light'
        }
      }
      
      // 应用Element Plus主题
      document.documentElement.setAttribute('data-theme', actualTheme)
      
      // 添加/移除dark类
      if (actualTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    // 改变主题
    const changeTheme = (theme) => {
      applyTheme(theme)
      // 保存到localStorage
      localStorage.setItem('theme', theme)
      ElMessage.success('主题设置已保存')
    }
    
    // 返回上一页
    const goBack = () => {
      router.back()
    }
    
    return {
      currentTheme,
      username,
      userId,
      changeTheme,
      goBack
    }
  }
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--el-bg-color);
  transition: background-color 0.3s ease;
}

.settings-card {
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.settings-header {
  display: flex;
  align-items: center;
}

.back-btn {
  margin-right: 15px;
}

.settings-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h3 {
  margin-bottom: 15px;
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.theme-options {
  margin-bottom: 20px;
}

.setting-description {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-top: 8px;
}
</style>