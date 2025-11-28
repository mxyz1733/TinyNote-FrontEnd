<template>
  <div class="three-column-container">
    <!-- AI助手控制按钮 - 仅在workspace界面显示 -->
    <div 
      v-if="showAIButton" 
      class="ai-control-button"
      :class="{ 'active': aiSidebarVisible }"
      @mousedown="startDragging"
      @click="toggleAISidebar"
      :style="{
        left: buttonPosition.x + 'px',
        top: buttonPosition.y + 'px'
      }"
    >
      <el-icon class="ai-icon"><AiOutline /></el-icon>
      <span class="ai-button-text">{{ aiSidebarVisible ? '关闭AI' : '打开AI' }}</span>
    </div>
    
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
        <el-button type="default" @click="triggerImportMd" class="create-btn">
          <el-icon><CirclePlus /></el-icon> 导入Markdown
        </el-button>
        <input ref="mdInputRef" type="file" accept=".md,text/markdown" style="display:none" @change="handleImportMd" />
        <el-dropdown trigger="click">
          <span class="user-btn" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <!-- 显示用户头像 -->
            <el-avatar :size="32" :src="avatarUrl && avatarUrl.trim() ? avatarUrl : undefined" class="header-avatar">
              {{ getAvatarText }}
            </el-avatar>
            <span>{{ username || '用户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click.stop="refreshNotes">
                <el-icon><Refresh /></el-icon> 刷新笔记
              </el-dropdown-item>
              <el-dropdown-item @click.stop="goToProfile">
                <el-icon><Setting /></el-icon> 个人中心
              </el-dropdown-item>
              <el-dropdown-item divided @click.stop="handleLogout">
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
      <el-aside :width="sidebarCollapsed ? '50px' : leftSidebarWidth" class="file-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
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
      
      <!-- 左侧拖动条 -->
      <div 
        v-if="!sidebarCollapsed" 
        class="resizer left-resizer"
        @mousedown="(event) => startResizing('left', event)"
      ></div>
      
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
      
      <!-- 右侧拖动条 -->
      <div v-if="aiSidebarVisible" class="resizer right-resizer" @mousedown="(event) => startResizing('right', event)"></div>
      
      <!-- 右侧AI对话窗口 -->
      <el-aside 
        v-if="aiSidebarVisible"
        :width="rightSidebarWidth" 
        class="ai-sidebar"
        :style="{ width: rightSidebarWidth }"
      >
        <!-- 使用AIChatWindow组件 -->
        <AIChatWindow 
          :current-note-content="currentNote?.content || ''" 
          :visible="aiSidebarVisible"
          @update:visible="aiSidebarVisible = $event"
          @ai-response="handleAIResponse"
        />
      </el-aside>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, ArrowDown, Plus, Refresh, Setting, SwitchButton, Delete, 
  Search as SearchIcon, Menu, Document, CirclePlus, Message 
} from '@element-plus/icons-vue'

// 为了使用Message图标作为AI图标的替代
const AiOutline = Message
import MarkdownEditor from '../components/MarkdownEditor.vue'
import AIChatWindow from '../components/AIChatWindow.vue'
import { noteAPI } from '../api/note.js'
import { userAPI } from '../api/user.js'
import request from '../api/axios.js'

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
    Document,
    AiOutline
  },
  setup() {
    // 工具：将后端可能返回的相对路径统一转换为绝对URL
    const apiOrigin = new URL(request.defaults.baseURL).origin
    const toAbsoluteUrl = (url) => {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      return `${apiOrigin}${url.startsWith('/') ? url : '/' + url}`
    }
    const router = useRouter()
    const username = ref('')
    const avatarUrl = ref('')
    
    // 侧边栏宽度
    const leftSidebarWidth = ref('300px')
    const rightSidebarWidth = ref('350px')
    const isResizing = ref(false)
    const resizingType = ref('')
    const startX = ref(0)
    const startWidth = ref(0)
    
    // AI助手控制按钮相关变量
    const showAIButton = ref(true) // 仅在workspace界面显示
    const aiSidebarVisible = ref(true) // AI助手侧边栏显示状态
    const buttonPosition = ref({ x: 20, y: 100 }) // 按钮初始位置
    const isDragging = ref(false) // 是否正在拖动
    const dragOffset = ref({ x: 0, y: 0 }) // 拖动偏移量
    
    // 开始调整大小
    const startResizing = (type, event) => {
      isResizing.value = true
      resizingType.value = type
      startX.value = event.clientX
      document.body.classList.add('resizing')
      
      if (type === 'left') {
        startWidth.value = parseInt(leftSidebarWidth.value)
      } else {
        startWidth.value = parseInt(rightSidebarWidth.value)
      }
      
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', stopResizing)
    }
    
    // 处理调整大小
    const handleResize = (event) => {
      if (!isResizing.value) return
      
      const containerWidth = document.querySelector('.main-container').offsetWidth
      
      if (resizingType.value === 'left') {
        // 左侧拖动：鼠标向右移动增加宽度，向左移动减少宽度
        const delta = event.clientX - startX.value
        const newWidth = startWidth.value + delta
        // 设置最小宽度和最大宽度限制
        if (newWidth >= 200 && newWidth <= containerWidth * 0.4) {
          leftSidebarWidth.value = `${newWidth}px`
        }
      } else if (resizingType.value === 'right') {
        // 右侧拖动：鼠标向左移动增加宽度，向右移动减少宽度
        const delta = startX.value - event.clientX
        const newWidth = startWidth.value + delta
        // 设置最小宽度和最大宽度限制
        if (newWidth >= 300 && newWidth <= containerWidth * 0.4) {
          console.log('Right sidebar resizing:', { newWidth, startWidth: startWidth.value, delta })
          
          // 更新响应式变量
          rightSidebarWidth.value = `${newWidth}px`
          
          // 直接操作DOM元素，确保宽度变化立即生效
          const aiSidebar = document.querySelector('.ai-sidebar')
          if (aiSidebar) {
            // 移除可能存在的inline !important样式
            aiSidebar.style.width = ''
            // 然后设置新宽度
            aiSidebar.style.width = `${newWidth}px`
            console.log('AI sidebar width set to:', aiSidebar.style.width)
          }
          
          // 确保.el-aside元素也被更新
          const asideElement = document.querySelector('.el-aside.ai-sidebar')
          if (asideElement) {
            asideElement.style.width = `${newWidth}px`
            console.log('EL aside width set to:', asideElement.style.width)
          }
        }
      }
    }
    
    // 停止调整大小
    const stopResizing = () => {
      isResizing.value = false
      document.body.classList.remove('resizing')
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResizing)
    }
    
    // AI助手控制按钮拖动相关函数
    const startDragging = (event) => {
      // 防止点击事件触发
      event.stopPropagation()
      
      // 计算鼠标相对于按钮左上角的偏移量
      const buttonRect = event.currentTarget.getBoundingClientRect()
      dragOffset.value = {
        x: event.clientX - buttonRect.left,
        y: event.clientY - buttonRect.top
      }
      
      isDragging.value = true
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', stopDragging)
      
      // 防止拖动时选中文本
      document.body.style.userSelect = 'none'
    }
    
    const handleDrag = (event) => {
      if (!isDragging.value) return
      
      // 计算新位置，确保按钮不会移出视口
      const containerRect = document.querySelector('.main-container').getBoundingClientRect()
      const newX = event.clientX - dragOffset.value.x
      const newY = event.clientY - dragOffset.value.y
      
      // 设置边界约束
      const minX = 10
      const minY = 10
      const maxX = containerRect.width - 120 // 按钮宽度约100px，留20px余量
      const maxY = containerRect.height - 50 // 按钮高度约30px，留20px余量
      
      buttonPosition.value = {
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY))
      }
    }
    
    const stopDragging = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', stopDragging)
      document.body.style.userSelect = ''
    }
    
    // 切换AI助手侧边栏显示状态
    const toggleAISidebar = () => {
      if (isDragging.value) return
      
      aiSidebarVisible.value = !aiSidebarVisible.value
      
      // 可以在这里添加额外的逻辑，比如保存状态到localStorage
      localStorage.setItem('aiSidebarVisible', aiSidebarVisible.value.toString())
      
      // 调试信息：输出切换状态
      console.log('AI sidebar toggled:', aiSidebarVisible.value)
    }
    const notes = ref([])
    const searchKeyword = ref('')
    const sortType = ref('time')
    const currentNote = ref(null)
    const contentChanged = ref(false)
    const saving = ref(false)
    const sidebarCollapsed = ref(false)
    const mdInputRef = ref(null)
    
    // 返回页面时或窗口聚焦时，同步最新头像
    const refreshAvatarFromLocal = () => {
      const saved = localStorage.getItem('avatarUrl') || ''
      if (saved && saved !== avatarUrl.value) {
        avatarUrl.value = saved
      }
    }
    
    // 获取头像文本（用户名首字母）
    const getAvatarText = computed(() => {
      if (!username.value) return '用'
      return username.value.charAt(0).toUpperCase()
    })
    
    // 从后端API加载笔记数据
    const loadNotes = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const userId = userInfo.id
        
        if (!userId) {
          ElMessage.warning('请先登录')
          router.push('/login')
          return
        }
        
        console.log('开始加载用户笔记，用户ID:', userId)
        const response = await noteAPI.getUserNotes(userId, 1, 100)
        
        console.log('笔记加载响应:', response)
        
        // 处理不同格式的响应
        if (response.code === 200 || response.success === true || response.ok === true) {
          // 尝试多种可能的数据结构
          let notesData = []
          if (response.data?.records && Array.isArray(response.data.records)) {
            notesData = response.data.records
          } else if (Array.isArray(response.data)) {
            notesData = response.data
          } else if (Array.isArray(response)) {
            notesData = response
          }
          
          // 将后端数据转换为前端格式
          notes.value = notesData.map(note => ({
            id: note.id || note.noteId,
            title: note.title || '无标题',
            content: note.content || '',
            updatedAt: note.updateTime || note.updatedAt || new Date().toISOString(),
            createdAt: note.createTime || note.createdAt || new Date().toISOString(),
            userId: note.userId || userId
          }))
          
          console.log('笔记加载成功，共加载:', notes.value.length, '条笔记')
        } else {
          const errorMsg = response.message || response.msg || '加载笔记失败'
          console.error('加载笔记失败:', errorMsg)
          ElMessage.error(errorMsg)
          notes.value = []
        }
      } catch (error) {
        console.error('加载笔记异常:', error)
        ElMessage.error('加载失败，请检查网络连接或后端服务')
        notes.value = []
      }
    }

    // 触发选择Markdown文件
    const triggerImportMd = () => {
      mdInputRef.value && mdInputRef.value.click()
    }

    // 处理Markdown文件导入
    const handleImportMd = async (e) => {
      try {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const userId = userInfo.id
        if (!userId) {
          ElMessage.error('用户信息不存在，请重新登录')
          router.push('/login')
          return
        }
        let ok = 0
        for (const file of files) {
          if (!/\.md$/i.test(file.name) && file.type !== 'text/markdown') {
            continue
          }
          const text = await file.text()
          const title = (file.name.replace(/\.[^/.]+$/, '') || '导入的笔记').slice(0, 100)
          const noteData = { title, content: text, userId, type: 1, isMarkdown: 1 }
          const res = await noteAPI.createNote(noteData)
          if (res && res.code === 200) ok++
        }
        if (mdInputRef.value) mdInputRef.value.value = ''
        if (ok > 0) {
          ElMessage.success(`成功导入 ${ok} 个Markdown文件`)
          await loadNotes()
          if (notes.value.length > 0) {
            currentNote.value = { ...notes.value[0] }
          }
        } else {
          ElMessage.error('未导入任何Markdown文件')
        }
      } catch (err) {
        console.error('导入Markdown失败:', err)
        ElMessage.error('导入失败')
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
    
    // 创建新笔记 - 立即保存到数据库
    const createNote = async () => {
      // 创建基础笔记对象（不设置临时ID）
      const newNote = {
        title: '新笔记',
        content: '',
        createdAt: new Date().toISOString(),
        createTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      
      // 设置为当前笔记
      currentNote.value = { ...newNote }
      contentChanged.value = true
      
      // 立即调用保存方法写入数据库
      try {
        await saveCurrentNote()
      } catch (error) {
        console.error('创建笔记失败:', error)
        ElMessage.error('创建笔记失败，请重试')
        // 如果保存失败，添加到本地列表以便用户可以继续编辑
        if (!currentNote.value.id) {
          currentNote.value.id = Date.now().toString()
          notes.value.unshift({ ...currentNote.value })
        }
      }
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
    
    // 保存笔记
    const saveCurrentNote = async () => {
      if (!currentNote.value || !currentNote.value.title.trim()) {
        ElMessage.warning('请输入笔记标题')
        return
      }

      saving.value = true
      contentChanged.value = false
      
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
          title: currentNote.value.title,
          content: currentNote.value.content,
          userId: userId,
          type: 1, // 默认类型
          isMarkdown: 0 // 默认不是Markdown
        }
        
        console.log('===== 笔记保存开始 =====')
        console.log('操作类型:', currentNote.value.id ? '更新笔记' : '创建笔记')
        console.log('用户ID:', userId)
        console.log('笔记ID:', currentNote.value.id || '无')
        console.log('笔记标题:', noteData.title)
        console.log('笔记内容长度:', noteData.content.length)
        
        let response
        if (currentNote.value.id) {
          // 更新现有笔记
          noteData.id = currentNote.value.id
          console.log('===== 调用updateNote API =====')
          console.log('完整请求参数:', JSON.stringify(noteData, null, 2))
          
          try {
            // 添加网络请求超时处理
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('API调用超时')), 10000)
            );
            
            response = await Promise.race([
              noteAPI.updateNote(noteData),
              timeoutPromise
            ]);
            
            console.log('===== updateNote API响应 =====')
            console.log('响应状态:', response.code || response.status || '未知')
            console.log('响应数据类型:', typeof response)
            console.log('响应数据:', JSON.stringify(response, null, 2))
          } catch (apiError) {
            console.error('===== updateNote API调用失败详情 =====')
            console.error('错误对象类型:', typeof apiError)
            console.error('错误消息:', apiError.message)
            console.error('错误堆栈:', apiError.stack)
            
            // 提取详细错误信息
                    if (apiError.response) {
                        console.error('HTTP状态:', apiError.response.status)
                        console.error('响应头:', apiError.response.headers)
                        console.error('响应数据:', JSON.stringify(apiError.response.data, null, 2))
                        throw new Error(`更新失败: HTTP ${apiError.response.status} - ${apiError.response.data?.message || apiError.response.data?.error || '服务器错误'}`)
                    } else if (apiError.responseData) {
                        // 处理从axios拦截器传递的包含完整响应数据的错误
                        console.error('业务响应数据:', JSON.stringify(apiError.responseData, null, 2))
                        throw new Error(`更新失败: ${apiError.message}`)
                    } else if (apiError.request) {
                        console.error('请求信息:', apiError.request)
                        throw new Error(`更新失败: 网络请求失败 - ${apiError.message}`)
                    } else {
                        throw new Error(`更新失败: ${apiError.message || '未知错误'}`)
                    }
          }
        } else {
          // 创建新笔记
          console.log('===== 调用createNote API =====')
          console.log('完整请求参数:', JSON.stringify(noteData, null, 2))
          
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('API调用超时')), 10000)
            );
            
            response = await Promise.race([
              noteAPI.createNote(noteData),
              timeoutPromise
            ]);
            
            console.log('===== createNote API响应 =====')
            console.log('响应状态:', response.code || response.status || '未知')
            console.log('响应数据类型:', typeof response)
            console.log('响应数据:', JSON.stringify(response, null, 2))
          } catch (apiError) {
            console.error('===== createNote API调用失败详情 =====')
            console.error('错误对象类型:', typeof apiError)
            console.error('错误消息:', apiError.message)
            console.error('错误堆栈:', apiError.stack)
            
            if (apiError.response) {
              console.error('HTTP状态:', apiError.response.status)
              console.error('响应头:', apiError.response.headers)
              console.error('响应数据:', JSON.stringify(apiError.response.data, null, 2))
              throw new Error(`创建失败: HTTP ${apiError.response.status} - ${apiError.response.data?.message || apiError.response.data?.error || '服务器错误'}`)
            } else if (apiError.responseData) {
              // 处理从axios拦截器传递的包含完整响应数据的错误
              console.error('业务响应数据:', JSON.stringify(apiError.responseData, null, 2))
              throw new Error(`创建失败: ${apiError.message}`)
            } else if (apiError.request) {
              console.error('请求信息:', apiError.request)
              throw new Error(`创建失败: 网络请求失败 - ${apiError.message}`)
            } else {
              throw new Error(`创建失败: ${apiError.message || '未知错误'}`)
            }
          }
        }
        
        // 处理不同格式的响应
        console.log('===== 处理响应 =====')
        const isSuccess = response.code === 200 || response.success === true || response.ok === true
        console.log('响应是否成功:', isSuccess)
        
        // 检查响应是否是Result格式对象（包含code, message, data三个字段）
        const isResultFormat = response && typeof response === 'object' && 
                             'code' in response && 'message' in response && 'data' in response
        
        if (isResultFormat) {
          // Result格式响应处理
          console.log('===== Result格式响应处理 =====')
          console.log('响应code:', response.code)
          console.log('响应message:', response.message)
          
          if (response.code === 200) {
            // 刷新笔记列表
            console.log('===== 刷新笔记列表 =====')
            await loadNotes()
            
            // 如果是新创建的笔记，更新当前笔记的ID
            if (!currentNote.value.id && response.data && (response.data.id || response.data.id === 0)) {
              currentNote.value.id = response.data.id
              console.log('新笔记ID:', currentNote.value.id)
            }
            
            ElMessage.success(currentNote.value.id ? '笔记更新成功' : '笔记创建成功')
          } else {
            const errorMsg = response.message || '保存失败'
            console.error('保存失败:', errorMsg)
            ElMessage.error(errorMsg)
            contentChanged.value = true
          }
        } else {
          // 兼容其他响应格式
          console.log('===== 兼容模式响应处理 =====')
          
          const isSuccess = response.code === 200 || response.success === true || response.ok === true
          
          if (isSuccess) {
            // 刷新笔记列表
            console.log('===== 刷新笔记列表 =====')
            await loadNotes()
            
            // 如果是新创建的笔记，更新当前笔记的ID
            if (!currentNote.value.id && (response.data?.id || response.id || response.data?.id === 0)) {
              currentNote.value.id = response.data?.id || response.id
              console.log('新笔记ID:', currentNote.value.id)
            }
            
            ElMessage.success(currentNote.value.id ? '笔记更新成功' : '笔记创建成功')
          } else {
            const errorMsg = response.message || response.msg || '保存失败'
            console.error('保存失败:', errorMsg)
            ElMessage.error(errorMsg)
            contentChanged.value = true
          }
        }
      } catch (error) {
        console.error('===== 保存笔记异常（详细）=====')
        console.error('错误消息:', error.message)
        console.error('错误堆栈:', error.stack)
        ElMessage.error(error.message || '保存失败，请稍后重试')
        contentChanged.value = true
        saving.value = false
      } finally {
        saving.value = false
      }
    }
    
    // 删除笔记
    const deleteNote = (id) => {
      ElMessageBox.confirm('确定要删除这篇笔记吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
          const userId = userInfo.id
          
          if (!userId) {
            ElMessage.error('用户信息不存在，请重新登录')
            router.push('/login')
            return
          }
          
          console.log('准备删除笔记，笔记ID:', id, '用户ID:', userId)
          
          // 调用API删除笔记
          const response = await noteAPI.deleteNote(id, userId)
          
          console.log('笔记删除响应:', response)
          
          // 处理不同格式的响应
          if (response.code === 200 || response.success === true || response.ok === true) {
            // 刷新笔记列表
            await loadNotes()
            
            // 如果删除的是当前笔记，清空当前笔记
            if (currentNote.value && currentNote.value.id === id) {
              currentNote.value = null
              contentChanged.value = false
            }
            
            ElMessage.success('笔记已删除')
          } else {
            const errorMsg = response.message || response.msg || '删除笔记失败'
            console.error('删除笔记失败:', errorMsg)
            ElMessage.error(errorMsg)
          }
        } catch (error) {
          console.error('删除笔记异常:', error)
          ElMessage.error('删除失败，请检查网络连接或后端服务')
        }
      }).catch(() => {})
    }
    
    // 处理内容变化
    const handleContentChange = () => {
      contentChanged.value = true
    }
    
    // 处理AI响应
    const handleAIResponse = (response) => {
      console.log('收到AI响应:', response)
      // 这里可以根据需要对AI响应进行处理
      // 例如：显示通知、更新UI状态等
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
      // 清除token和用户相关信息
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('username')
      localStorage.removeItem('avatarUrl')
      localStorage.removeItem('nickname')
      ElMessage.success('退出登录成功')
      // 跳转到登录页
      router.push('/login')
    }
    
    // 跳转到设置页面
    const goToProfile = () => {
      console.log('跳转到个人中心');
      router.push('/settings')
    }
    
    // 页面离开前提示保存
    const handleBeforeUnload = (event) => {
      if (contentChanged.value) {
        event.preventDefault()
        event.returnValue = '有未保存的修改，确定要离开吗？'
        return event.returnValue
      }
    }
    
    onMounted(async () => {
      // 获取用户信息
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const userId = userInfo.id
      
      // 从localStorage恢复AI侧边栏状态
      const savedAIState = localStorage.getItem('aiSidebarVisible')
      if (savedAIState !== null) {
        aiSidebarVisible.value = savedAIState === 'true'
      }
      
      // 从localStorage恢复按钮位置
      const savedPosition = localStorage.getItem('aiButtonPosition')
      if (savedPosition) {
        try {
          const position = JSON.parse(savedPosition)
          buttonPosition.value = position
        } catch (e) {
          console.error('恢复按钮位置失败:', e)
        }
      }
      
      // 立即从localStorage加载头像URL（与Settings.vue保持一致的键名）
      avatarUrl.value = localStorage.getItem('avatarUrl') || ''
      
      // 首先尝试从后端获取最新的用户信息
      if (userId) {
        try {
          const response = await userAPI.getUserInfo(userId)
          
          // 处理不同格式的响应
          if (response.code === 200 || response.success === true || response.ok === true) {
            // 获取响应中的用户数据
            const userData = response.data || response
            
            // 优先使用后端返回的昵称，如果没有昵称则使用用户名
            if (userData.nickname && userData.nickname.trim()) {
              username.value = userData.nickname
            } else if (userData.username || userData.name) {
              username.value = userData.username || userData.name
            }
            
            // 更新头像URL
            if (userData.avatar && userData.avatar.trim()) {
              const absolute = toAbsoluteUrl(userData.avatar)
              avatarUrl.value = absolute
              localStorage.setItem('avatarUrl', absolute)
            }
            
            // 更新localStorage中的用户信息
            const updatedUserInfo = {
              ...userInfo,
              nickname: userData.nickname,
              username: userData.username,
              name: userData.name,
              avatar: userData.avatar
            }
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
          // 如果后端获取失败，从localStorage获取
          if (userInfo && (userInfo.username || userInfo.name)) {
            username.value = userInfo.username || userInfo.name
          } else {
            // 优先获取保存的昵称
            const savedNickname = localStorage.getItem('nickname')
            if (savedNickname) {
              username.value = savedNickname
            } else {
              // 如果没有昵称，获取用户名
              const savedUsername = localStorage.getItem('username')
              if (savedUsername) {
                username.value = savedUsername
              }
            }
          }
        }
      } else {
        // 如果没有userId，从localStorage获取
        if (userInfo && (userInfo.username || userInfo.name)) {
          username.value = userInfo.username || userInfo.name
        } else {
          // 优先获取保存的昵称
          const savedNickname = localStorage.getItem('nickname')
          if (savedNickname) {
            username.value = savedNickname
          } else {
            // 如果没有昵称，获取用户名
            const savedUsername = localStorage.getItem('username')
            if (savedUsername) {
              username.value = savedUsername
            }
          }
        }
      }
      
      // 如果本地有保存的头像URL，使用它
      const savedAvatar = localStorage.getItem('avatarUrl')
      if (savedAvatar) {
        avatarUrl.value = savedAvatar
      } else if (userInfo && userInfo.avatar) {
        // 如果本地没有，才使用localStorage中userInfo的头像
        avatarUrl.value = toAbsoluteUrl(userInfo.avatar)
      }
      
      // 检查是否已登录
      const token = localStorage.getItem('token')
      if (!token) {
        ElMessage.warning('请先登录')
        router.push('/login')
        return
      }
      
      // 加载笔记数据
      await loadNotes()
      
      // 默认选中第一篇笔记
      if (notes.value.length > 0) {
        currentNote.value = { ...notes.value[0] }
      }
      
      // 监听浏览器关闭事件
      window.addEventListener('beforeunload', handleBeforeUnload)
      // 在窗口聚焦或页面变为可见时刷新头像
      window.addEventListener('focus', refreshAvatarFromLocal)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          refreshAvatarFromLocal()
        }
      })
    })
    
    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('focus', refreshAvatarFromLocal)
      
      // 保存按钮位置
      localStorage.setItem('aiButtonPosition', JSON.stringify(buttonPosition.value))
    })
    
    return {
      username,
      avatarUrl,
      getAvatarText,
      notes,
      filteredNotes,
      searchKeyword,
      sortType,
      currentNote,
      contentChanged,
      saving,
      sidebarCollapsed,
      mdInputRef,
      leftSidebarWidth,
      rightSidebarWidth,
      isResizing,
      resizingType,
      startX,
      startWidth,
      startResizing,
      handleResize,
      stopResizing,
      triggerImportMd,
      handleImportMd,
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
      goToProfile,
      // AI助手控制按钮相关
      showAIButton,
      aiSidebarVisible,
      buttonPosition,
      startDragging,
      handleDrag,
      stopDragging,
      toggleAISidebar
    }
  }
}
</script>

<style scoped>
/* 主容器样式 - 添加渐变背景和数学公式装饰 */
.three-column-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
}

/* AI助手控制按钮样式 */
.ai-control-button {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  cursor: move;
  transition: all 0.3s ease;
  z-index: 500;
  font-size: 14px;
  font-weight: 500;
  user-select: none;
  backdrop-filter: blur(10px);
}

.ai-control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.ai-control-button.active {
  background: linear-gradient(135deg, #7c8ceb 0%, #667eea 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  border-color: rgba(255, 255, 255, 0.3);
}

.ai-icon {
  font-size: 18px;
}

.ai-button-text {
  white-space: nowrap;
}

/* 拖动过程中的样式 */
.ai-control-button:active {
  transform: scale(0.98);
}

/* 数学公式装饰背景 */
.three-column-container::before {
  content: '';
  position: absolute;
  top: -10%;
  right: -10%;
  width: 60%;
  height: 60%;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><text y="25" font-family="Arial" font-size="20">\\sum_{i=1}^n i = \\frac{n(n+1)}{2}</text><text y="55" font-family="Arial" font-size="20">e^{i\\pi} + 1 = 0</text><text y="85" font-family="Arial" font-size="20">\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u</text></svg>');
  background-repeat: no-repeat;
  background-size: contain;
  opacity: 0.05;
  pointer-events: none;
  z-index: 0;
}

/* 确保主容器三栏布局正确 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 0 12px 12px 12px;
  gap: 12px;
  position: relative;
  z-index: 1;
}

/* 确保AI侧边栏始终显示（除非在移动端） */
@media (min-width: 769px) {
  .ai-sidebar {
    display: block;
    transform: none;
    position: static;
    /* 移除固定宽度的!important，让Vue绑定的width属性起作用 */
  }
}

/* 顶部导航栏样式 */
.main-header {
  height: 60px;
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 300;
  border-radius: 0 0 16px 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  position: relative;
}

/* 顶部导航栏头像样式 */
.header-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.header-avatar:hover {
  transform: scale(1.05);
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
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.header-center {
  flex: 1;
  max-width: 600px;
  margin: 0 20px;
}

.search-input {
  width: 100%;
  transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 2px rgba(102, 126, 234, 0.1);
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
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid transparent;
}

.user-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(102, 126, 234, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.file-sidebar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(233, 236, 239, 0.5);
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

/* 笔记列表样式 */
.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.note-item {
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  border: 1px solid transparent;
}

.note-item:hover {
  background-color: rgba(245, 247, 250, 0.8);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.note-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%);
  border-left: 3px solid var(--el-color-primary);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.editor-container:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.editor-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(233, 236, 239, 0.5);
}

.title-input {
  font-size: 22px;
  font-weight: 600;
}

.title-input :deep(.el-input__wrapper) {
  box-shadow: none;
  background: transparent;
}

.title-input :deep(.el-input__wrapper:hover) {
  box-shadow: none;
  background: rgba(245, 247, 250, 0.5);
}

.title-input :deep(input) {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.editor-content {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.editor-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(233, 236, 239, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 0 0 16px 16px;
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
  padding: 4px 8px;
  background-color: #fef0f0;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.empty-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.create-note-btn {
  margin-top: 20px;
}

.ai-sidebar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-width: 300px; /* 设置最小宽度为300px，与JavaScript中的限制一致 */
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 150;
  position: relative;
  /* 不设置固定宽度，由Vue组件的:width属性动态控制 */
}

.ai-chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: rgba(248, 249, 250, 0.8);
}

.sidebar-collapse-trigger {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #606266;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.sidebar-collapse-trigger:hover {
  background: rgba(255, 255, 255, 1);
  color: var(--el-color-primary);
  transform: scale(1.05);
}

/* 主容器样式 */
.main-container {
  display: flex;
  height: calc(100vh - 60px);
  overflow: hidden;
}

/* 编辑器主区域样式 */
.editor-main {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
  overflow: auto;
}

/* 调整大小的拖动条基础样式 */
.resizer {
  background-color: #409eff;
  transition: background-color 0.2s;
  cursor: col-resize;
  user-select: none;
  -webkit-user-select: none;
  z-index: 10;
  height: 100%;
  flex-shrink: 0;
}

.left-resizer {
  width: 4px;
  margin-left: -2px;
}

.right-resizer {
  width: 4px;
  margin-left: -2px; /* 使用margin-left而不是margin-right */
}

.left-resizer:hover, .left-resizer:active {
  background-color: #66b1ff;
  width: 6px;
  margin-left: -3px;
}

.right-resizer:hover, .right-resizer:active {
  background-color: #66b1ff;
  width: 6px;
  margin-left: -3px;
}

/* 拖动时的鼠标样式 */
body.resizing {
  cursor: col-resize;
  user-select: none;
  -webkit-user-select: none;
}

/* 修改创建笔记按钮样式 */
.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 20px;
  transition: all 0.3s ease;
  color: white;
  font-weight: 500;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.create-btn:active {
  transform: translateY(0);
}

.create-note-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 20px;
  padding: 10px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.create-note-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 修改切换按钮样式 */
.sidebar-toggle {
  transition: all 0.3s ease;
  color: #409eff;
  border-radius: 50%;
  padding: 8px;
}

.sidebar-toggle:hover {
  transform: scale(1.1);
  background-color: rgba(64, 158, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  
  .file-sidebar,
  .ai-sidebar {
    width: 100% !important;
    max-height: 30vh;
    min-width: unset;
  }
  
  .editor-main {
    flex: 1;
    min-width: 0; /* 防止内容溢出 */
  }
  
  /* 在移动端隐藏拖动条 */
  .resizer {
    display: none;
  }
}

/* 平滑过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from, .slide-leave-to {
  transform: translateX(-20px);
}

.sidebar-collapse-trigger:hover {
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  /* 保持默认宽度为300px，但允许用户拖动调整 */
  .ai-sidebar {
    /* 移除固定宽度，让Vue绑定的width属性起作用 */
  }
  
  :deep(.el-aside.ai-sidebar) {
    /* 不设置固定宽度，让Vue绑定的width属性起作用 */
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
  
  /* 在移动端可以通过JS控制显示/隐藏AI窗口 */
  .ai-sidebar {
    /* 保留位置但默认隐藏，可通过JS控制显示 */
    transform: translateX(100%);
    transition: transform 0.3s ease;
    position: fixed;
    right: 0;
    top: 60px;
    bottom: 0;
    z-index: 1000;
    width: 300px !important;
  }
  
  .ai-sidebar.show {
    transform: translateX(0);
  }
  
  /* 在移动端隐藏拖动条 */
  .resizer {
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
  
  /* 移动端AI控制按钮样式调整 */
  .ai-control-button {
    font-size: 12px;
    padding: 6px 12px;
    min-width: 80px;
    justify-content: center;
  }
  
  .ai-button-text {
    font-size: 11px;
  }
}
</style>