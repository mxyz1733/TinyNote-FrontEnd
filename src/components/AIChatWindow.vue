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
      
      // 模拟AI响应（实际项目中这里应该调用真实的AI API）
      setTimeout(() => {
        // 模拟不同的AI响应内容
        const responses = [
          "根据你的需求，我可以帮助你优化这篇笔记的结构。建议添加清晰的标题层级，使用列表组织要点，并适当加入代码示例来增强可读性。",
          "你的笔记内容很有价值。我建议你增加一些具体的例子或案例研究，这样可以让读者更容易理解你的观点。",
          "我注意到你的笔记包含一些技术概念，考虑添加一些图表或示意图来帮助解释复杂的想法，这样会使内容更加直观。",
          "这是一个很好的开始。你可以考虑扩展第二部分的内容，并添加一些相关资源的链接，方便读者进一步学习。",
          "你写的这段内容逻辑性很强。建议在结尾部分添加一个总结段落，概括主要观点，并提出一些可能的下一步思考方向。"
        ]
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        
        messages.value.push({
          role: 'assistant',
          content: randomResponse
        })
        
        isTyping.value = false
        emit('ai-response', randomResponse)
        
        // 滚动到底部
        nextTick(() => scrollToBottom())
      }, 2000)
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
      clearChat
    }
  }
}
</script>

<style scoped>
.ai-chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8f9fa;
  border-radius: 8px;
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
}

.chat-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
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