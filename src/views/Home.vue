<template>
  <div class="home-container">
    <el-header class="main-header">
      <div class="header-left">
        <h1 class="logo">TinyNote</h1>
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
    
    <el-main class="main-content">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索笔记标题或内容"
          prefix-icon="Search"
          clearable
          @input="handleSearch"
          class="search-input"
        />
        <el-dropdown @command="handleSortChange" class="sort-dropdown">
          <el-button type="default" size="small">
            {{ sortType === 'time' ? '时间排序' : '标题排序' }}
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="time">时间排序</el-dropdown-item>
              <el-dropdown-item command="title">标题排序</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <!-- 笔记列表 -->
      <div class="notes-container" v-if="filteredNotes.length > 0">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="note in filteredNotes" :key="note.id">
            <el-card class="note-card" shadow="hover" @click="editNote(note.id)">
              <template #header class="note-header">
                <div class="note-title">{{ note.title }}</div>
                <el-button type="text" @click.stop="deleteNote(note.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
              
              <div class="note-preview" v-html="getPreview(note.content)"></div>
              
              <div class="note-footer">
                <span>{{ formatDate(note.updatedAt) }}</span>
                <el-button type="text" size="small" @click.stop="viewNote(note)">
                  查看详情
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <el-empty description="暂无笔记" :image-size="100">
          <el-button type="primary" @click="createNote">创建第一篇笔记</el-button>
        </el-empty>
      </div>
      
      <!-- 笔记预览弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        :title="previewNote.title"
        width="60%"
        :before-close="handleClose"
        custom-class="note-detail-dialog"
        destroy-on-close
      >
        <!-- 笔记元信息 -->
        <div class="note-meta">
          <div class="meta-left">
            <el-tag size="small" effect="light" class="note-time-tag">
              <el-icon><Clock /></el-icon> {{ formatDate(previewNote.updatedAt) }}
            </el-tag>
          </div>
          <div class="meta-right">
            <el-button type="text" size="small" @click.stop="copyContent">
              <el-icon><DocumentCopy /></el-icon> 复制内容
            </el-button>
          </div>
        </div>
        
        <!-- 笔记内容 -->
        <div class="preview-content-wrapper">
          <div class="preview-content" v-html="renderedContent"></div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="handleClose">关闭</el-button>
            <el-button type="primary" @click="editNote(previewNote.id)">编辑笔记</el-button>
          </div>
        </template>
      </el-dialog>
    </el-main>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { noteAPI } from '../api/note.js'
import { User, ArrowDown, Plus, Refresh, Setting, SwitchButton, Delete, Search, Clock, DocumentCopy } from '@element-plus/icons-vue'
import { marked } from 'marked'

export default {
  name: 'Home',
  components: {
    Plus,
    User,
    ArrowDown,
    Refresh,
    Setting,
    SwitchButton,
    Search,
    Delete,
    Clock,
    DocumentCopy
  },
  setup() {
    const router = useRouter()
    const username = ref('')
    const notes = ref([])
    const searchKeyword = ref('')
    const sortType = ref('time')
    const dialogVisible = ref(false)
    const previewNote = ref({ title: '', content: '', id: null })
    const renderedContent = ref('')
    
    // 从API加载笔记列表
    const loading = ref(false)
    const loadNotes = async () => {
      loading.value = true
      
      try {
        // 获取当前登录用户信息
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const userId = userInfo.id
        
        if (!userId) {
          ElMessage.error('用户信息不存在，请重新登录')
          router.push('/login')
          return
        }
        
        // 调用API获取用户的笔记列表
        const response = await noteAPI.getUserNotesByType(userId, 1) // 根据类型获取笔记
        
        if (response.code === 200) {
          // 处理API返回的数据
          notes.value = response.data || []
        } else {
          ElMessage.error(response.message || '获取笔记列表失败')
          notes.value = []
        }
      } catch (error) {
        console.error('加载笔记列表失败:', error)
        ElMessage.error('加载失败，请稍后重试')
        notes.value = []
      } finally {
        loading.value = false
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
      router.push('/note/edit')
    }
    
    // 编辑笔记
    const editNote = (id) => {
      router.push(`/note/edit/${id}`)
    }
    
    // 查看笔记详情
    const viewNote = (note) => {
      previewNote.value = { ...note }
      renderedContent.value = marked(note.content)
      dialogVisible.value = true
    }
    
    // 关闭预览弹窗
    const handleClose = () => {
      dialogVisible.value = false
    }
    
    // 复制笔记内容
    const copyContent = () => {
      // 创建临时元素来获取纯文本内容
      const tempElement = document.createElement('div')
      tempElement.innerHTML = renderedContent.value
      const textToCopy = tempElement.textContent || tempElement.innerText || ''
      
      // 复制到剪贴板
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          ElMessage.success('内容已复制到剪贴板')
        })
        .catch(err => {
          console.error('复制失败:', err)
          ElMessage.error('复制失败，请手动复制')
        })
    }
    
    // 删除笔记
    const deleteNote = (id) => {
      ElMessageBox.confirm('确定要删除这篇笔记吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 获取用户信息
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
          const userId = userInfo.id
          
          // 调用API删除笔记
          const response = await noteAPI.deleteNote(id, userId)
          
          if (response.code === 200) {
            notes.value = notes.value.filter(note => note.id !== id)
            ElMessage.success('笔记已删除')
          } else {
            ElMessage.error(response.message || '删除笔记失败')
          }
        } catch (error) {
          console.error('删除笔记失败:', error)
          ElMessage.error('删除失败，请稍后重试')
        }
      }).catch(() => {})
    }
    
    // 刷新笔记
    const refreshNotes = () => {
      loadNotes()
      ElMessage.success('笔记已刷新')
    }
    
    // 处理搜索
    const handleSearch = () => {
      // 搜索逻辑已包含在computed中
    }
    
    // 排序
    const sortNotes = (type) => {
      sortType.value = type
    }
    
    // 选项卡变化处理
     const handleSortChange = (command) => {
       sortNotes(command)
     }
    
    // 获取笔记预览
    const getPreview = (content) => {
      // 去除Markdown标记，截取前100个字符作为预览
      const plainText = content.replace(/#+ |[*_`~]|\[.*?\]\(.*?\)|\n/g, '')
      return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
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
    
    const handleLogout = () => {
      // 清除token
      localStorage.removeItem('token')
      ElMessage.success('退出登录成功')
      // 跳转到登录页
      router.push('/login')
    }
    
    const goToProfile = () => {
      router.push('/settings')
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
      } else {
        // 加载笔记数据
        loadNotes()
      }
    })
    
    return {
      username,
      notes,
      filteredNotes,
      searchKeyword,
      sortType,
      dialogVisible,
      previewNote,
      renderedContent,
      loading,
      createNote,
      editNote,
      viewNote,
      deleteNote,
      refreshNotes,
      handleSearch,
      sortNotes,
      handleSortChange,
      handleClose,
      copyContent,
      getPreview,
      formatDate,
      handleLogout,
      goToProfile
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
  gap: 10px;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-btn {
  margin-right: 10px;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  flex: 1;
  max-width: 600px;
}

.sort-dropdown {
  margin-left: 10px;
}

.notes-container {
  margin-top: 20px;
}

.note-card {
  margin-bottom: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 10px;
  overflow: hidden;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.note-card .el-card__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.note-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 10px;
  color: #303133;
}

.note-preview {
  flex: 1;
  color: #606266;
  font-size: 14px;
  line-height: 1.7;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  margin-bottom: 16px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #909399;
}

.note-footer .el-button--text {
  color: #606266;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.note-footer .el-button--text:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.empty-state {
  margin-top: 60px;
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.empty-state .el-empty {
  margin: 0;
}

.empty-state .el-empty__image {
  width: 200px;
  height: 200px;
}

.empty-state .el-empty__description {
  font-size: 16px;
  color: #909399;
}

.empty-state .el-button {
  margin-top: 20px;
  background-color: #409eff;
  color: white;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.empty-state .el-button:hover {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.note-detail-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.note-detail-dialog .el-dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
  border-radius: 12px 12px 0 0;
}

.note-detail-dialog .el-dialog__title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.note-detail-dialog .el-dialog__body {
  padding: 24px;
  max-height: calc(90vh - 180px);
}

.note-detail-dialog .el-dialog__footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
  border-radius: 0 0 12px 12px;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.meta-left .note-time-tag {
  background-color: #f5f7fa;
  color: #606266;
  border-color: #dcdfe6;
}

.preview-content-wrapper {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.preview-content {
  max-height: 50vh;
  min-height: 250px; /* 添加最小高度，避免内容太少时显得空洞 */
  overflow-y: auto;
  line-height: 1.8;
  background-color: #ffffff;
  border-radius: 6px;
  padding: 28px;
  margin: 0;
  transition: all 0.3s ease;
}

/* 优化笔记为空或内容很少时的显示 */
.preview-content:empty::before {
  content: "暂无笔记内容";
  color: #909399;
  font-style: italic;
  display: block;
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
}

/* 为预览对话框添加更好的动画效果 */
.el-dialog__wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 预览内容样式 */
.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3) {
  margin-top: 20px;
  margin-bottom: 10px;
}

.preview-content :deep(p) {
  margin-bottom: 16px;
}

.preview-content :deep(code) {
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.preview-content :deep(pre) {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  color: #6a737d;
  margin-bottom: 16px;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.preview-content :deep(table th),
.preview-content :deep(table td) {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
}

.preview-content :deep(table th) {
  background-color: #f6f8fa;
}
</style>