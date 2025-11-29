<template>
  <div class="ai-chat-window" v-if="visible">
    <div class="chat-header">
      <h3>AI助手</h3>
      <div class="header-actions">
        <el-button type="text" size="small" @click="clearChat" :disabled="isTyping">
          <el-icon><Delete /></el-icon> 清空
        </el-button>
      </div>
    </div>

    <div class="chat-content">
      <div class="chat-messages" ref="chatContainer">
        <div v-if="messages.length === 0" class="empty-chat">
          <el-empty description="开始与AI助手对话吧" :image-size="80" />
          <p class="tips">你可以请AI帮你撰写、修改或优化笔记内容</p>
        </div>

        <div v-for="(message, index) in messages" :key="index"
             :class="['chat-message', message.role === 'user' ? 'user-message' : 'ai-message']">
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div v-if="message.isStreaming" class="streaming-indicator">
              <el-icon class="is-loading"><Loading /></el-icon>
            </div>
            <div class="message-text" v-html="formatMessage(message.content)"></div>
            <div v-if="message.timestamp" class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="2"
            placeholder="输入你的问题或需求..."
            resize="none"
            @keyup.enter.ctrl="sendMessage"
            :disabled="isTyping"
        />
        <div class="chat-actions">
          <div class="shortcuts">
            <el-tooltip content="使用Ctrl+Enter快速发送">
              <el-button size="small" type="text" plain>快捷提示</el-button>
            </el-tooltip>
          </div>
          <el-button type="primary" @click="sendMessage" :disabled="!inputMessage.trim() || isTyping">
            <el-icon><CirclePlus /></el-icon> 发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Loading, CirclePlus, Minus, ChatDotRound } from '@element-plus/icons-vue'
import { marked } from 'marked'
import aiService from '../api/ai'

// 定义组件属性
const props = defineProps({
  // 可以传入当前编辑的笔记内容，让AI了解上下文
  currentNoteContent: {
    type: String,
    default: ''
  },
  // 是否显示在侧边栏
  sidebar: {
    type: Boolean,
    default: false
  },
  // 控制窗口是否显示的props，与父组件通信
  visible: {
    type: Boolean,
    default: true
  },
  userId: {
    type: String,
    default: ''
  },
  defaultModel: {
    type: String,
    default: 'gpt-3.5-turbo'
  }
})

// 定义事件
const emit = defineEmits(['ai-response', 'close', 'toggle-minimize', 'update:visible', 'closed'])

// 响应式数据
const messages = ref([])
const inputMessage = ref('')
const isTyping = ref(false)
const chatContainer = ref(null)
const minimized = ref(false)
const unreadCount = ref(0)
let currentStreamMessageIndex = -1
let currentAbortController = null
let scrollTimeout = null

// 监听最小化状态变化
watch(minimized, (newVal) => {
  emit('toggle-minimize', newVal)
})

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isTyping.value) return

  const userMessage = inputMessage.value.trim()
  messages.value.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  })

  inputMessage.value = ''
  isTyping.value = true

  // 添加AI消息占位符
  currentStreamMessageIndex = messages.value.push({
    role: 'assistant',
    content: '',
    isStreaming: true,
    timestamp: new Date()
  }) - 1

  // 滚动到底部
  await optimizedScrollToBottom()

  try {
    // 构建请求参数
    let messageText = userMessage

    // 如果有当前笔记内容，可以在prompt中加入，提供上下文
    if (props.currentNoteContent) {
      messageText = `上下文信息：${props.currentNoteContent}\n\n用户问题：${userMessage}`
    }

    const requestData = {
      message: messageText
    }

    // 创建AbortController用于可能的取消操作
    currentAbortController = new AbortController()

    // 调用SSE流式API
    aiService.chatWithAIStream(
        requestData,
        // 接收消息的回调
        (chunk) => {
          if (currentStreamMessageIndex >= 0 && currentStreamMessageIndex < messages.value.length) {
            // 处理接收到的数据块
            let contentChunk = ''
            if (typeof chunk === 'string') {
              contentChunk = chunk
            } else if (chunk.content) {
              contentChunk = chunk.content
            } else if (typeof chunk === 'object') {
              // 尝试提取可能的文本内容
              contentChunk = JSON.stringify(chunk)
            }

            // 确保中文显示正常，移除可能的控制字符
            const controlCharRegex = /[\u0000-\u001F\u007F-\u009F]/g;
            contentChunk = contentChunk.replace(controlCharRegex, '')

            // 追加到当前AI消息
            messages.value[currentStreamMessageIndex].content += contentChunk

            // 滚动到底部
            optimizedScrollToBottom()
          }
        },
        // 完成回调
        () => {
          if (currentStreamMessageIndex >= 0 && currentStreamMessageIndex < messages.value.length) {
            messages.value[currentStreamMessageIndex].isStreaming = false

            // 发送ai-response事件
            emit('ai-response', messages.value[currentStreamMessageIndex].content)

            // 如果窗口最小化，增加未读计数
            if (minimized.value) {
              unreadCount.value++
            }
          }

          isTyping.value = false
          currentStreamMessageIndex = -1
          currentAbortController = null

          // 滚动到底部
          nextTick(() => optimizedScrollToBottom())
        },
        // 错误回调
        (error) => {
          console.error('AI请求失败:', error)
          ElMessage.error('AI请求失败，请稍后重试')

          if (currentStreamMessageIndex >= 0 && currentStreamMessageIndex < messages.value.length) {
            messages.value[currentStreamMessageIndex] = {
              role: 'assistant',
              content: '抱歉，我暂时无法响应你的请求。请稍后再试或检查网络连接。',
              isStreaming: false,
              timestamp: new Date(),
              isError: true
            }
          }

          isTyping.value = false
          currentStreamMessageIndex = -1
          currentAbortController = null

          // 滚动到底部
          nextTick(() => optimizedScrollToBottom())
        }
    )
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')

    isTyping.value = false
    currentStreamMessageIndex = -1
    currentAbortController = null

    if (currentStreamMessageIndex >= 0 && currentStreamMessageIndex < messages.value.length) {
      messages.value.splice(currentStreamMessageIndex, 1)
    }
  }
}

// 清空聊天
const clearChat = () => {
  messages.value = []
}



// 完全关闭窗口
const closeWindow = () => {
  // 清理资源，如关闭当前的SSE连接
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }

  // 向父组件发送关闭事件
  emit('update:visible', false)
  emit('closed')
}

// 格式化消息内容
const formatMessage = (content) => {
  if (!content) return ''

  // 使用marked库渲染Markdown
  return marked(content)
}

// 优化滚动行为，避免频繁滚动
const optimizedScrollToBottom = () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = setTimeout(() => {
    if (chatContainer.value) {
      // 平滑滚动到底部
      chatContainer.value.scrollTo({
        top: chatContainer.value.scrollHeight,
        behavior: 'smooth'
      })
    }
    scrollTimeout = null
  }, 50) // 防抖延迟，减少滚动频率
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()

  // 同一天显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    // 不同天显示日期和时间
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 组件挂载时的初始化
onMounted(() => {
  // 初始化时加载用户信息
  if (!props.userId) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo.id) {
      // 如果没有传入userId，尝试从localStorage获取
      // 注意：这只是一个临时解决方案，实际项目中应该通过props传入
    }
  }
})

// 监听visible变化
watch(
    () => props.visible,
    (newVal) => {
      if (newVal && !minimized.value) {
        // 当窗口从隐藏状态变为显示时，滚动到底部
        nextTick(() => optimizedScrollToBottom())
      }
    }
)
</script>

<style scoped>
.ai-chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  max-height: 100%;
  height: 100%;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
  transition: background-color 0.3s;
}

.chat-header:hover {
  background-color: #fafafa;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.chat-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* 确保flex子元素可以正确收缩 */
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.tips {
  margin-top: 16px;
  font-size: 14px;
  text-align: center;
}

.chat-message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeInUp 0.3s ease;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background-color: var(--el-color-primary-light-5);
  color: white;
}

.ai-message .message-avatar {
  background-color: var(--el-color-primary);
  color: white;
}

.message-content {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  line-height: 1.6;
  position: relative;
}

.user-message .message-content {
  background-color: rgba(102, 126, 234, 0.1);
  color: #303133;
  border-bottom-right-radius: 4px;
}

.ai-message .message-content {
  border-bottom-left-radius: 4px;
}

.streaming-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #909399;
}

.message-text {
  min-height: 20px;
  white-space: pre-wrap;
}

.message-time {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.chat-input-container {
  border-top: 1px solid #e9ecef;
  padding: 16px;
  background-color: white;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
}

.chat-input-container .el-input {
  flex: 0 0 auto;
  min-height: 60px;
}

.chat-input-container .el-input__wrapper {
  overflow: hidden;
  flex-shrink: 0;
}

.chat-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-top: 8px;
}

.shortcuts {
  font-size: 12px;
  color: #909399;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* Markdown 样式支持 */
:deep(.md-heading) {
  margin: 8px 0;
  font-weight: 600;
  color: inherit;
}

:deep(h1.md-heading) {
  font-size: 1.4em;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

:deep(h2.md-heading) {
  font-size: 1.2em;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 2px;
}

:deep(h3.md-heading) {
  font-size: 1.1em;
}

:deep(.md-list), :deep(.md-ordered-list) {
  margin: 8px 0;
  padding-left: 24px;
}

:deep(.md-list li), :deep(.md-ordered-list li) {
  margin: 4px 0;
  line-height: 1.6;
}

:deep(.code-block) {
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.code-block code) {
  background: none;
  padding: 0;
  color: #24292e;
}

:deep(.inline-code) {
  background-color: #f1f3f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: #d63384;
}

:deep(.md-quote) {
  border-left: 3px solid #409eff;
  padding-left: 10px;
  margin: 8px 0;
  color: #666;
  font-style: italic;
}

:deep(.md-hr) {
  border: none;
  border-top: 1px solid #eee;
  margin: 16px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-chat-window {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .chat-header h3 {
    font-size: 14px;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .message-content {
    padding: 10px 12px;
  }

  .chat-messages {
    padding: 12px;
    gap: 12px;
  }
}
</style>