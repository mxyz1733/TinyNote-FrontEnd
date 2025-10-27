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
      <el-aside width="350px" class="ai-sidebar" style="display:block !important; background-color: #f8f9fa; border-left: 2px solid #409eff;">
        <div class="ai-chat-container">
          <!-- AI助手头部 -->
          <div style="padding:15px; border-bottom:1px solid #e9ecef; background-color:#fff;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:32px; height:32px; background-color:#409eff; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px;">
                  🤖
                </div>
                <h3 style="color:#303133; margin:0; font-size:16px;">智能助手</h3>
              </div>
              <el-button type="text" size="small" style="color:#909399;">
                <el-icon><Setting /></el-icon>
              </el-button>
            </div>
          </div>
          
          <!-- 对话内容区域 -->
          <div style="flex:1; padding:20px; overflow-y:auto; height:calc(100% - 130px);">
            <!-- 欢迎消息 -->
            <div style="display:flex; margin-bottom:20px;">
              <div style="width:32px; height:32px; background-color:#409eff; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; margin-right:10px; flex-shrink:0;">
                🤖
              </div>
              <div style="background-color:white; padding:10px 15px; border-radius:18px; max-width:80%; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <p style="margin:0; color:#303133;">你好！我是TinyNote的智能助手，有什么可以帮助你的吗？</p>
              </div>
            </div>
            
            <!-- 快捷功能 -->
            <div style="margin-bottom:20px;">
              <p style="color:#909399; font-size:13px; margin-bottom:10px;">💡 常用功能</p>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                <el-button type="info" plain size="small" style="border-radius:16px;">优化笔记内容</el-button>
                <el-button type="info" plain size="small" style="border-radius:16px;">生成摘要</el-button>
                <el-button type="info" plain size="small" style="border-radius:16px;">润色文字</el-button>
                <el-button type="info" plain size="small" style="border-radius:16px;">查找信息</el-button>
              </div>
            </div>
            
            <!-- 示例问题 -->
            <div>
              <p style="color:#909399; font-size:13px; margin-bottom:10px;">❓ 示例问题</p>
              <div style="background-color:white; border-radius:8px; padding:12px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <div style="padding:8px; border-radius:4px; cursor:pointer; font-size:14px; color:#606266;" @mouseenter="$event.target.style.backgroundColor='#f5f7fa'" @mouseleave="$event.target.style.backgroundColor='transparent'">
                  • 帮我总结这篇笔记的要点
                </div>
                <div style="padding:8px; border-radius:4px; cursor:pointer; font-size:14px; color:#606266;" @mouseenter="$event.target.style.backgroundColor='#f5f7fa'" @mouseleave="$event.target.style.backgroundColor='transparent'">
                  • 如何更好地组织这些内容？
                </div>
                <div style="padding:8px; border-radius:4px; cursor:pointer; font-size:14px; color:#606266;" @mouseenter="$event.target.style.backgroundColor='#f5f7fa'" @mouseleave="$event.target.style.backgroundColor='transparent'">
                  • 给这段文字提供一些改进建议
                </div>
              </div>
            </div>
          </div>
          
          <!-- 输入区域 -->
          <div style="padding:15px; border-top:1px solid #e9ecef; background-color:#fff;">
            <el-input
              type="textarea"
              :rows="2"
              placeholder="输入你的问题或需求..."
              resize="none"
              style="margin-bottom:10px; border-radius:8px;"
            />
            <div style="display:flex; justify-content:flex-end;">
              <el-button type="primary" size="small" style="border-radius:16px;">
                <el-icon><CirclePlus /></el-icon> 发送
              </el-button>
            </div>
          </div>
        </div>
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
  Search as SearchIcon, Menu, Document, CirclePlus 
} from '@element-plus/icons-vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import AIChatWindow from '../components/AIChatWindow.vue'
import { noteAPI } from '../api/note.js'

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
    
    // 跳转到设置页面
    const goToProfile = () => {
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
      await loadNotes()
      
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
  overflow: hidden;
}

/* 确保主容器三栏布局正确 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 确保AI侧边栏始终显示（除非在移动端） */
@media (min-width: 769px) {
  .ai-sidebar {
    display: block !important;
    width: 350px !important;
    transform: none !important;
    position: static !important;
  }
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
  min-width: 350px; /* 确保有最小宽度 */
}

.ai-chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #f8f9fa;
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
  }
  
  .ai-sidebar.show {
    transform: translateX(0);
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