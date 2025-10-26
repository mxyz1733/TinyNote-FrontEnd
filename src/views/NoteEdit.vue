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
      <el-card class="editor-card">
        <markdown-editor
          v-model="note.content"
          :read-only="saving"
          @change="contentChange"
        />
      </el-card>
    </el-main>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Document } from '@element-plus/icons-vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import { noteAPI } from '../api/note.js'

export default {
  name: 'NoteEdit',
  components: {
    MarkdownEditor,
    ArrowLeft,
    Document
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

    return {
      note,
      saving,
      saveNote,
      goBack,
      contentChange
    }
  }
}
</script>

<style scoped>
.note-edit-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-header {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
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

.title-input {
  width: 100%;
  max-width: 600px;
}

.edit-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
  overflow: hidden;
}

.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>