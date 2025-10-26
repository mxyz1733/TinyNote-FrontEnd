<template>
  <div class="three-column-container">
    <!-- 顶部导航栏 -->
    <el-header class="main-header">
      <div class="header-left">
        <el-button type="text" @click="toggleSidebar" class="sidebar-toggle">
          <el-icon><Menu /></el-icon>
        </el-button>
        <h1 class="logo">TinyNote</h1>
      </div>
      <div class="header-center">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索笔记标题或内容"
          :prefix-icon="Search"
          clearable
          class="search-input"
          :disabled="sidebarCollapsed"
        />
      </div>
      <div class="header-right">
        <el-button type="primary" @click="createNote" class="create-btn">
          <el-icon><Plus /></el-icon> 新建笔记
        </el-button>
        <el-dropdown>
          <el-button type="text" class="user-btn">
            <el-icon><User /></el-icon>
            <span>{{ username || '用户' }}</span>
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="refreshNotes">
                <el-icon><Refresh /></el-icon> 刷新笔记
              </el-dropdown-item>
              <el-dropdown-item @click="goToProfile">
                <el-icon><Setting /></el-icon> 个人中心
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    
    <!-- 主内容区域 -->
    <div class="main-container">
      <!-- 左侧文件列表 -->
      <el-aside :width="sidebarCollapsed ? '50px' : '300px'" class="file-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
        <div v-if="!sidebarCollapsed" class="sidebar-content">
          <div class="sidebar-header">
            <h3>我的笔记</h3>
            <div class="sort-options">
              <el-dropdown @command="handleSortChange" trigger="click">
                <el-button size="small" type="text">
                  {{ sortType === 'time' ? '时间' : '标题' }}
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="time">按时间排序</el-dropdown-item>
                    <el-dropdown-item command="title">按标题排序</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <div class="note-list" v-if="filteredNotes.length > 0">
            <el-scrollbar height="calc(100% - 60px)">
              <div 
                v-for="note in filteredNotes" 
                :key="note.id"
                :class="['note-item', { 'active': currentNote?.id === note.id }]"
                @click="selectNote(note)"
              >
                <div class="note-item-header">
                  <div class="note-item-title" :title="note.title">{{ note.title || '无标题' }}</div>
                  <el-button type="text" size="small" @click.stop="deleteNote(note.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <div class="note-item-preview" :title="getPreview(note.content)">{{ getPreview(note.content) }}</div>
                <div class="note-item-time">{{ formatDate(note.updatedAt) }}</div>
              </div>
            </el-scrollbar>
          </div>
          
          <div v-else class="empty-notes">
            <el-empty description="暂无笔记" :image-size="60" />
            <el-button size="small" type="primary" @click="createNote">创建第一篇笔记</el-button>
          </div>
        </div>
        
        <div v-else class="sidebar-collapse-trigger" @click="toggleSidebar">
          <el-icon><Menu /></el-icon>
        </div>
      </el-aside>
      
      <!-- 中间编辑区域 -->
      <el-main class="editor-main">
        <div v-if="currentNote" class="editor-container">
          <div class="editor-header">
            <el-input
              v-model="currentNote.title"
              placeholder="请输入笔记标题"
              clearable
              class="title-input"
              @change="contentChanged = true"
            />
          </div>
          
          <div class="editor-content">
            <markdown-editor
              v-model="currentNote.content"
              @change="handleContentChange"
            />
          </div>
          
          <div class="editor-footer">
            <div class="editor-status">
              <span v-if="contentChanged" class="unsaved-indicator">未保存</span>
              <span>{{ formatDate(currentNote.updatedAt) }}</span>
            </div>
            <el-button type="primary" @click="saveCurrentNote" :loading="saving">
              <el-icon><Document /></el-icon> 保存笔记
            </el-button>
          </div>
        </div>
        
        <div v-else class="empty-editor">
          <el-empty description="选择或创建一个笔记开始编辑" :image-size="120" />
          <el-button type="primary" @click="createNote" class="create-note-btn">创建新笔记</el-button>
        </div>
      </el-main>
      
      <!-- 右侧AI对话窗口 -->
      <el-aside width="350px" class="ai-sidebar">
        <ai-chat-window 
          :current-note-content="currentNote?.content || ''" 
          @ai-response="handleAIResponse"
        />
      </el-aside>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, ArrowDown, Plus, Refresh, Setting, SwitchButton, Delete, 
  Search as SearchIcon, Menu, Document 
} from '@element-plus/icons-vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import AIChatWindow from '../components/AIChatWindow.vue'

export default {
  name: 'ThreeColumnLayout',
  components: {
    MarkdownEditor,
    AIChatWindow,
    User,
    ArrowDown,
    Plus,
    Refresh,
    Setting,
    SwitchButton,
    Delete,
    Search: SearchIcon,
    Menu,
    Document
  },
  setup() {
    const router = useRouter()
    const username = ref('')
    const notes = ref([])
    const searchKeyword = ref('')
    const sortType = ref('time')
    const currentNote = ref(null)
    const contentChanged = ref(false)
    const saving = ref(false)
    const sidebarCollapsed = ref(false)
    
    // 从localStorage加载笔记数据
    const loadNotes = () => {
      try {
        const savedNotes = localStorage.getItem('notes')
        if (savedNotes) {
          notes.value = JSON.parse(savedNotes)
        } else {
          notes.value = []
        }
      } catch (error) {
        console.error('加载笔记失败:', error)
        notes.value = []
      }
    }
    
    // 过滤后的笔记列表
    const filteredNotes = computed(() => {
      let result = [...notes.value]
      
      // 搜索过滤
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        result = result.filter(note => 
          note.title.toLowerCase().includes(keyword) || 
          note.content.toLowerCase().includes(keyword)
        )
      }
      
      // 排序
      if (sortType.value === 'time') {
        result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      } else if (sortType.value === 'title') {
        result.sort((a, b) => a.title.localeCompare(b.title))
      }
      
      return result
    })
    
    // 创建新笔记
    const createNote = () => {
      const newNote = {
        id: Date.now().toString(),
        title: '新笔记',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      notes.value.unshift(newNote)
      currentNote.value = { ...newNote }
      contentChanged.value = true
    }
    
    // 选择笔记
    const selectNote = async (note) => {
      if (currentNote.value && contentChanged.value) {
        const confirmed = await ElMessageBox.confirm(
          '当前笔记有未保存的修改，确定要切换到其他笔记吗？', 
          '提示', 
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).catch(() => false)
        
        if (!confirmed) return
      }
      
      currentNote.value = { ...note }
      contentChanged.value = false
    }
    
    // 保存当前笔记
    const saveCurrentNote = () => {
      if (!currentNote.value) return
      
      if (!currentNote.value.title.trim()) {
        ElMessage.warning('请输入笔记标题')
        return
      }
      
      saving.value = true
      
      // 模拟API请求
      setTimeout(() => {
        try {
          // 更新笔记
          const index = notes.value.findIndex(item => item.id === currentNote.value.id)
          if (index !== -1) {
            currentNote.value.updatedAt = new Date().toISOString()
            notes.value[index] = { ...currentNote.value }
          } else {
            // 如果笔记不存在，添加到列表
            currentNote.value.updatedAt = new Date().toISOString()
            currentNote.value.createdAt = new Date().toISOString()
            notes.value.unshift({ ...currentNote.value })
          }
          
          // 保存到localStorage
          localStorage.setItem('notes', JSON.stringify(notes.value))
          
          contentChanged.value = false
          ElMessage.success('笔记保存成功')
        } catch (error) {
          console.error('保存笔记失败:', error)
          ElMessage.error('保存失败，请重试')
        } finally {
          saving.value = false
        }
      }, 500)
    }
    
    // 删除笔记
    const deleteNote = (id) => {
      ElMessageBox.confirm('确定要删除这篇笔记吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        notes.value = notes.value.filter(note => note.id !== id)
        localStorage.setItem('notes', JSON.stringify(notes.value))
        
        // 如果删除的是当前笔记，清空当前笔记
        if (currentNote.value && currentNote.value.id === id) {
          currentNote.value = null
          contentChanged.value = false
        }
        
        ElMessage.success('笔记已删除')
      }).catch(() => {})
    }
    
    // 处理内容变化
    const handleContentChange = () => {
      contentChanged.value = true
    }
    
    // 处理AI响应
    const handleAIResponse = (response) => {
      // 可以在这里处理AI响应，比如提供插入到编辑器的选项
      ElMessage.info('AI助手已回复，请查看右侧对话窗口')
    }
    
    // 刷新笔记
    const refreshNotes = () => {
      loadNotes()
      // 如果当前有选中的笔记，更新它
      if (currentNote.value) {
        const updatedNote = notes.value.find(note => note.id === currentNote.value.id)
        if (updatedNote && !contentChanged.value) {
          currentNote.value = { ...updatedNote }
        }
      }
      ElMessage.success('笔记已刷新')
    }
    
    // 排序处理
    const handleSortChange = (command) => {
      sortType.value = command
    }
    
    // 获取笔记预览
    const getPreview = (content) => {
      // 去除Markdown标记，截取前50个字符作为预览
      const plainText = content.replace(/#+ |[*_`~]|\\[.*?\\]\\(.*?\\)|\n/g, '')
      return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      
      // 小于1分钟
      if (diff < 60000) {
        return '刚刚'
      }
      // 小于1小时
      if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前'
      }
      // 小于1天
      if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前'
      }
      // 小于30天
      if (diff < 2592000000) {
        return Math.floor(diff / 86400000) + '天前'
      }
      // 大于30天
      return date.toLocaleDateString()
    }
    
    // 切换侧边栏展开/折叠
    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }
    
    // 退出登录
    const handleLogout = () => {
      // 清除token
      localStorage.removeItem('token')
      ElMessage.success('退出登录成功')
      // 跳转到登录页
      router.push('/login')
    }
    
    // 个人中心
    const goToProfile = () => {
      ElMessage.info('个人中心功能开发中...')
    }
    
    // 页面离开前提示保存
    const handleBeforeUnload = (event) => {
      if (contentChanged.value) {
        event.preventDefault()
        event.returnValue = '有未保存的修改，确定要离开吗？'
        return event.returnValue
      }
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
        return
      }
      
      // 加载笔记数据
      loadNotes()
      
      // 默认选中第一篇笔记
      if (notes.value.length > 0) {
        currentNote.value = { ...notes.value[0] }
      }
      
      // 监听浏览器关闭事件
      window.addEventListener('beforeunload', handleBeforeUnload)
    })
    
    return {
      username,
      notes,
      filteredNotes,
      searchKeyword,
      sortType,
      currentNote,
      contentChanged,
      saving,
      sidebarCollapsed,
      createNote,
      selectNote,
      saveCurrentNote,
      deleteNote,
      refreshNotes,
      handleContentChange,
      handleAIResponse,
      handleSortChange,
      getPreview,
      formatDate,
      toggleSidebar,
      handleLogout,
      goToProfile
    }
  }
}
</script>

<style scoped>
.three-column-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.main-header {
  height: 60px;
  padding: 0 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  font-size: 20px;
}

.logo {
  margin: 0;
  font-size: 24px;
  color: #409eff;
}

.header-center {
  flex: 1;
  max-width: 600px;
  margin: 0 20px;
}

.search-input {
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.file-sidebar {
  background-color: #ffffff;
  border-right: 1px solid #e9ecef;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.note-list {
  flex: 1;
  overflow: hidden;
}

.note-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.note-item:hover {
  background-color: #f5f7fa;
}

.note-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.note-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.note-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.note-item-preview {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.note-item-time {
  font-size: 11px;
  color: #909399;
}

.empty-notes {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.editor-main {
  flex: 1;
  padding: 0;
  display: flex;
  overflow: hidden;
}

.editor-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.editor-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
}

.title-input {
  font-size: 20px;
  font-weight: 500;
}

.title-input :deep(.el-input__wrapper) {
  box-shadow: none;
}

.title-input :deep(input) {
  font-size: 20px;
  font-weight: 500;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

.editor-footer {
  padding: 12px 24px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
}

.editor-status {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #909399;
}

.unsaved-indicator {
  color: #f56c6c;
  padding: 2px 6px;
  background-color: #fef0f0;
  border-radius: 4px;
  font-size: 12px;
}

.empty-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}

.create-note-btn {
  margin-top: 20px;
}

.ai-sidebar {
  background-color: #ffffff;
  border-left: 1px solid #e9ecef;
  overflow: hidden;
}

.sidebar-collapse-trigger {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #606266;
}

.sidebar-collapse-trigger:hover {
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .ai-sidebar {
    width: 300px !important;
  }
}

@media (max-width: 768px) {
  .main-header {
    padding: 0 10px;
  }
  
  .logo {
    font-size: 20px;
  }
  
  .header-center {
    display: none;
  }
  
  .ai-sidebar {
    display: none;
  }
  
  .file-sidebar {
    width: 80px !important;
  }
  
  .sidebar-content {
    display: none;
  }
  
  .sidebar-collapse-trigger {
    display: flex !important;
  }
}
</style>