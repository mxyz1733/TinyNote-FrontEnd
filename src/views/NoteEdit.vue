<template>
  <div class="note-edit-container">
    <el-header class="edit-header">
      <div class="header-left">
        <el-button type="text" @click="goBack">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>
      <div class="header-center">
        <el-input
          v-model="note.title"
          placeholder="请输入笔记标题"
          clearable
          class="title-input"
          :disabled="saving"
        />
      </div>
      <div class="header-right">
        <el-button type="primary" @click="saveNote" :loading="saving">
          <el-icon><Document /></el-icon> 保存笔记
        </el-button>
      </div>
    </el-header>
    
    <el-main class="edit-content">
      <div class="content-wrapper">
        <div class="editor-wrapper">
          <el-card class="editor-card">
            <markdown-editor
              v-model="note.content"
              :read-only="saving"
              @change="contentChange"
            />
          </el-card>
        </div>
        
        <div class="ai-chat-wrapper" v-if="showAIChat">
          <el-card class="chat-card">
            <AIChatWindow 
              :visible="showAIChat"
              @update:visible="showAIChat = $event"
              @closed="handleChatClosed"
            />
          </el-card>
        </div>
      </div>
    </el-main>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Document } from '@element-plus/icons-vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import AIChatWindow from '../components/AIChatWindow.vue'
import { noteAPI } from '../api/note.js'

export default {
  name: 'NoteEdit',
  components: {
    MarkdownEditor,
    ArrowLeft,
    Document,
    AIChatWindow
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const noteId = route.params.id
    const saving = ref(false)
    const contentChanged = ref(false)
    
    const note = reactive({
      title: '',
      content: '',
      id: noteId || null
    })
    
    // AI聊天窗口显示状态
    const showAIChat = ref(false)

    // 内容变化处理
    const contentChange = () => {
      contentChanged.value = true
    }

    // 保存笔记
    const saveNote = async () => {
      if (!note.title.trim()) {
        ElMessage.warning('请输入笔记标题')
        return
      }
      
      saving.value = true
      
      try {
        // 获取当前登录用户信息
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const userId = userInfo.id
        
        if (!userId) {
          ElMessage.error('用户信息不存在，请重新登录')
          router.push('/login')
          return
        }
        
        const noteData = {
          title: note.title,
          content: note.content,
          userId: userId,
          type: 1, // 默认类型
          isMarkdown: 0 // 默认不是Markdown
        }
        
        let response
        if (note.id) {
          // 更新现有笔记
          noteData.id = note.id
          response = await noteAPI.updateNote(noteData)
        } else {
          // 创建新笔记
          response = await noteAPI.createNote(noteData)
        }
        
        if (response.code === 200) {
          contentChanged.value = false
          // 如果是新创建的笔记，保存返回的id
          if (!note.id) {
            note.id = response.data.id
          }
          ElMessage.success(noteId ? '笔记更新成功' : '笔记创建成功')
        } else {
          ElMessage.error(response.message || (noteId ? '笔记更新失败' : '笔记创建失败'))
        }
      } catch (error) {
        console.error('保存笔记失败:', error)
        ElMessage.error('保存失败，请稍后重试')
      } finally {
        saving.value = false
      }
    }

    // 返回上一页
    const goBack = () => {
      if (contentChanged.value) {
        ElMessage.confirm('有未保存的修改，确定要离开吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 尝试返回上一页，如果无法返回则默认返回首页
          if (window.history.length > 1) {
            router.back()
          } else {
            router.push('/home')
          }
        }).catch(() => {})
      } else {
        // 尝试返回上一页，如果无法返回则默认返回首页
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push('/home')
        }
      }
    }

    // 加载笔记数据
    const loadNoteData = async () => {
      // 检查登录状态
      const token = localStorage.getItem('token')
      if (!token) {
        ElMessage.warning('请先登录')
        router.push('/login')
        return
      }
      
      // 如果有id参数，则加载现有笔记
      if (noteId) {
        try {
          // 获取当前登录用户信息
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
          const userId = userInfo.id
          
          if (!userId) {
            ElMessage.error('用户信息不存在，请重新登录')
            router.push('/login')
            return
          }
          
          // 调用API获取笔记详情
          const response = await noteAPI.getNoteDetail(noteId, userId)
          
          if (response.code === 200 && response.data) {
            note.title = response.data.title || ''
            note.content = response.data.content || ''
            note.id = response.data.id
          } else {
            ElMessage.error(response.message || '未找到该笔记或无权限访问')
            router.push('/home')
          }
        } catch (error) {
          console.error('加载笔记失败:', error)
          ElMessage.error('加载失败，请稍后重试')
          router.push('/home')
        }
      }
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadNoteData()
      
      // 关键修复：数据加载完成后重置contentChanged状态
      // 使用nextTick确保DOM更新完成后再重置
      setTimeout(() => {
        contentChanged.value = false
      }, 0)
      
      // 监听浏览器关闭事件，提示保存
      window.addEventListener('beforeunload', handleBeforeUnload)
    })

    // 处理页面关闭前提示
    const handleBeforeUnload = (event) => {
      if (contentChanged.value) {
        event.preventDefault()
        event.returnValue = '有未保存的修改，确定要离开吗？'
        return event.returnValue
      }
    }

    // 处理AI聊天窗口关闭事件
    const handleChatClosed = () => {
      // 关闭聊天窗口
      showAIChat.value = false
      console.log('AI聊天窗口已关闭')
    }
    
    return {
      note,
      saving,
      contentChanged,
      showAIChat,
      saveNote,
      goBack,
      contentChange,
      handleChatClosed
    }
  }
}
</script>

<style scoped>
/* 主容器样式 - 添加渐变背景 */
.note-edit-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
}

/* 添加背景数学公式装饰 */
.note-edit-container::before {
  content: "E=mc²";
  position: absolute;
  top: 20%;
  left: 10%;
  font-size: 120px;
  font-family: 'Times New Roman', serif;
  color: rgba(64, 158, 255, 0.05);
  transform: rotate(-15deg);
  pointer-events: none;
  z-index: 0;
}

.note-edit-container::after {
  content: "∫f(x)dx";
  position: absolute;
  bottom: 10%;
  right: 15%;
  font-size: 100px;
  font-family: 'Times New Roman', serif;
  color: rgba(64, 158, 255, 0.05);
  transform: rotate(10deg);
  pointer-events: none;
  z-index: 0;
}

/* 顶部导航栏样式 */
.edit-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  border-radius: 0 0 16px 16px;
  margin-bottom: 12px;
  z-index: 100;
}

.header-left,
.header-right {
  flex: 1;
  display: flex;
}

.header-left {
  justify-content: flex-start;
}

.header-right {
  justify-content: flex-end;
}

.header-center {
  flex: 3;
  display: flex;
  justify-content: center;
}

/* 标题输入框样式 */
.title-input {
  width: 100%;
  max-width: 600px;
  transition: all 0.3s ease;
}

.title-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.title-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.title-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset, 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.title-input :deep(input) {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

/* 主内容区域样式 */
.edit-content {
  flex: 1;
  padding: 12px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* 内容包装器样式 */
.content-wrapper {
  height: 100%;
  display: flex;
  gap: 12px;
  transition: all 0.3s ease;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
  transition: flex 0.3s ease;
}

.editor-wide {
  flex: 1;
  width: 100%;
}

.ai-chat-wrapper {
  width: 400px;
  height: 100%;
  transition: all 0.3s ease;
}

/* 编辑器卡片样式 */
.editor-card,
.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
}

.editor-card:hover,
.chat-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

/* 按钮样式 */
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 20px;
  transition: all 0.3s ease;
  color: white;
  font-weight: 500;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--primary:active) {
  transform: translateY(0);
}

:deep(.el-button--info) {
  border-radius: 20px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #66a6ff 0%, #89f7fe 100%);
  border: none;
}

:deep(.el-button--warning) {
  border-radius: 20px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffd34e 0%, #f88646 100%);
  border: none;
}

:deep(.el-button--text) {
  color: #409eff;
  border-radius: 50%;
  padding: 8px;
  transition: all 0.3s ease;
}

:deep(.el-button--text:hover) {
  background-color: rgba(64, 158, 255, 0.1);
  transform: scale(1.1);
}

/* 加载动画增强 */
:deep(.el-icon-loading) {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edit-header {
    padding: 0 16px;
  }
  
  .title-input {
    max-width: 100%;
  }
  
  .edit-content {
    padding: 8px;
  }
  
  .content-wrapper {
    flex-direction: column;
  }
  
  .ai-chat-wrapper {
    width: 100%;
    height: 400px;
  }
}

/* 平滑过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>