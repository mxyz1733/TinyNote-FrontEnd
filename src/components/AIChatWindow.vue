<template>
  <div class="ai-chat-window">
    <div class="chat-header">
      <h3>AI助手</h3>
      <el-button type="text" size="small" @click="clearChat">
        <el-icon><Delete /></el-icon> 清空
      </el-button>
    </div>
    
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
          {{ message.content }}
        </div>
      </div>
      
      <div v-if="isTyping" class="chat-message ai-message">
        <div class="message-avatar">🤖</div>
        <div class="message-content typing">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>AI正在思考中...</span>
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
</template>

<script>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Loading, CirclePlus } from '@element-plus/icons-vue'
import aiService from '../api/ai'

export default {
  name: 'AIChatWindow',
  components: {
    Delete,
    Loading,
    CirclePlus
  },
  props: {
    // 可以传入当前编辑的笔记内容，让AI了解上下文
    currentNoteContent: {
      type: String,
      default: ''
    }
  },
  emits: ['ai-response'],
  setup(props, { emit }) {
    const messages = ref([])
    const inputMessage = ref('')
    const isTyping = ref(false)
    const chatContainer = ref(null)
    
    // 发送消息
    const sendMessage = async () => {
      if (!inputMessage.value.trim() || isTyping.value) return
      
      const userMessage = inputMessage.value.trim()
      messages.value.push({
        role: 'user',
        content: userMessage
      })
      
      inputMessage.value = ''
      isTyping.value = true
      
      // 滚动到底部
      await scrollToBottom()
      
      try {
        // 调用真实的AI API
        // 构建请求参数
        const requestData = {
          userId: 1, // 实际项目中应该从登录用户信息中获取
          prompt: userMessage
        }
        
        // 如果有当前笔记内容，可以在prompt中加入，提供上下文
        if (props.currentNoteContent) {
          requestData.prompt = `上下文信息：${props.currentNoteContent}\n\n用户问题：${userMessage}`
        }
        
        const response = await aiService.chatWithAI(requestData)
        
        // 根据后端返回格式处理响应
        let aiResponse = ''
        if (typeof response === 'string') {
          // 如果后端直接返回字符串
          aiResponse = response
        } else if (response.data) {
          // 如果是Result格式，获取data字段
          if (typeof response.data === 'string') {
            aiResponse = response.data
          } else if (response.data.textContent) {
            // 处理包含textContent的复杂对象
            aiResponse = response.data.textContent
          } else if (response.data.message || response.data.msg) {
            aiResponse = response.data.message || response.data.msg
          } else {
            aiResponse = JSON.stringify(response.data)
          }
        } else if (response.textContent) {
          // 如果响应对象直接包含textContent
          aiResponse = response.textContent
        } else if (response.message || response.msg) {
          // 如果有message字段，使用它
          aiResponse = response.message || response.msg
        } else {
          // 尝试将整个响应转为字符串
          aiResponse = JSON.stringify(response)
        }

        // 移除思考标记及其之间的内容
        // aiResponse = aiResponse.replace(/(?:^|[\s])[<\[][\s]*think[\s]*[>\]]/gi, '').trim()
        // aiResponse = aiResponse.replace(/(?:^|[\s])[<\[][\s]*\/think[\s]*[>\]]/gi, '').trim()
        // // 使用字符串替换而不是正则表达式处理特殊字符
        // if (aiResponse.includes('</think>')) {
        //   const start = aiResponse.indexOf('</think>')
        //   const end = aiResponse.indexOf('</think>', start + 3)
        //   if (start !== -1 && end !== -1) {
        //     aiResponse = aiResponse.substring(0, start) + aiResponse.substring(end + 3)
        //   }
        // }
        aiResponse = aiResponse.trim()
        aiResponse = aiResponse.substring(aiResponse.indexOf('</think>') + 10, aiResponse.length + 1)
        
        // 移除可能的AssistantMessage元数据部分
        const assistantMsgRegex = /AssistantMessage\s*\[.*?\]/gi;
        aiResponse = aiResponse.replace(assistantMsgRegex, '').trim();
        
        // 移除metadata信息
        const metadataRegex = /metadata\s*=\s*\{[^}]*\}/gi;
        aiResponse = aiResponse.replace(metadataRegex, '').trim();
        
        // 移除textContent标签
        const textContentRegex = /,\s*textContent\s*=\s*/gi;
        aiResponse = aiResponse.replace(textContentRegex, '').trim();
        
        // 移除末尾的逗号和括号
        const endCommaRegex = /,\s*\]$/gi;
        aiResponse = aiResponse.replace(endCommaRegex, '').trim();
        
        // 移除其他可能的格式标记
        const assistantTagRegex = /<\/?assistant>/gi;
        aiResponse = aiResponse.replace(assistantTagRegex, '').trim();
        
        const systemTagRegex = /<\/?system>/gi;
        aiResponse = aiResponse.replace(systemTagRegex, '').trim();
        
        const userTagRegex = /<\/?user>/gi;
        aiResponse = aiResponse.replace(userTagRegex, '').trim();
        
        // 清理多余的空白字符和换行
        aiResponse = aiResponse.split('\n').map(line => line.trim()).filter(line => line !== '').join('\n\n').trim();
        
        // 确保中文显示正常，移除可能的控制字符
        const controlCharRegex = /[\u0000-\u001F\u007F-\u009F]/g;
        aiResponse = aiResponse.replace(controlCharRegex, '')
        
        messages.value.push({
          role: 'assistant',
          content: aiResponse
        })
        
        emit('ai-response', aiResponse)
      } catch (error) {
        console.error('AI请求失败:', error)
        ElMessage.error('AI请求失败，请稍后重试')
        
        // 添加错误消息到聊天记录
        messages.value.push({
          role: 'assistant',
          content: '抱歉，我暂时无法响应你的请求。请稍后再试或检查网络连接。'
        })
      } finally {
        isTyping.value = false
        
        // 滚动到底部
        nextTick(() => scrollToBottom())
      }
    }
    
    // 清空聊天
    const clearChat = () => {
      messages.value = []
    }
    
    // 滚动到底部
    const scrollToBottom = () => {
      nextTick(() => {
        if (chatContainer.value) {
          chatContainer.value.scrollTop = chatContainer.value.scrollHeight
        }
      })
    }
    
    return {
      messages,
      inputMessage,
      isTyping,
      chatContainer,
      sendMessage,
      clearChat,
      scrollToBottom
    }
  }
}
</script>

<style scoped>
.ai-chat-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e9ecef;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f8f9fa;
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
  background-color: #409eff;
  color: white;
}

.ai-message .message-avatar {
  background-color: #67c23a;
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
}

.user-message .message-content {
  background-color: #ecf5ff;
  color: #303133;
}

.typing {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
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
  background: #ccc;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>