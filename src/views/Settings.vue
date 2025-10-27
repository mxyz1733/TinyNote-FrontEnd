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
        <!-- 账户设置 -->
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

export default {
  name: 'Settings',
  components: {
    ArrowLeft
  },
  setup() {
    const router = useRouter()
    const username = ref('')
    const userId = ref('')
    
    // 初始化设置
    onMounted(() => {
      // 加载用户信息
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      username.value = userInfo.username || '用户'
      userId.value = userInfo.id || ''
    })
    
    // 返回上一页
    const goBack = () => {
      router.back()
    }
    
    return {
      username,
      userId,
      goBack
    }
  }
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
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
  color: #303133;
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h3 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
}
</style>