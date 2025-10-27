<template>
  <div class="markdown-editor-wrapper">
    <mavon-editor
      v-model="content"
      :toolbars="toolbars"
      :ishljs="true"
      :math="true"
      :toolbars-flag="toolbarsFlag"
      @change="handleChange"
      class="markdown-editor"
      placeholder="请输入Markdown内容..."
      style="height: 100%;"
    />
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { mavonEditor } from 'mavon-editor'
import 'mavon-editor/dist/css/index.css'

export default {
  name: 'MarkdownEditor',
  components: {
    mavonEditor
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const content = ref(props.modelValue)
    
    // 启用工具栏
    const toolbarsFlag = {
      left: true,
      center: true,
      right: true,
      noIcon: false
    }

    // 工具栏配置 - 简化版，保留常用功能
    const toolbars = {
      // 基础文本格式化
      bold: true,
      italic: true,
      header: true,
      underline: true,
      strikethrough: true,
      // 高级格式
      mark: false,
      subscript: false,
      // 列表和引用
      quote: true,
      ol: true,
      ul: true,
      // 链接和图像
      link: true,
      imagelink: true,
      // 代码和表格
      code: true,
      table: true,
      // 视图模式
      fullscreen: true,
      readmodel: true,
      htmlcode: false,
      help: false,
      // 编辑操作
      undo: true,
      redo: true,
      trash: true,
      save: false,
      // 其他
      navigation: false,
      alignleft: false,
      aligncenter: false,
      alignright: false,
      subfield: true,
      preview: true,
      mathjax: true
    }

    // 监听内容变化
    watch(() => props.modelValue, (newValue) => {
      if (newValue !== content.value) {
        content.value = newValue
        // 更新内部内容，但不触发change事件，避免标记为未保存
      }
    })

    // 处理内容变化
    const handleChange = (value, render) => {
      // 只有当值真正变化时才触发事件
      if (value !== props.modelValue) {
        content.value = value
        emit('update:modelValue', value)
        emit('change', value, render)
      }
      
      // 触发MathJax重新渲染数学公式
      setTimeout(() => {
        if (window.MathJax) {
          window.MathJax.typeset()
        }
      }, 100)
    }

    // 组件挂载后触发MathJax初始化渲染
    // 编辑器内容由父组件通过v-model传入，与后端API集成
    onMounted(() => {
      setTimeout(() => {
        if (window.MathJax) {
          window.MathJax.typeset()
        }
      }, 100)
    })
    
    return {
      content,
      toolbars,
      toolbarsFlag,
      handleChange
    }
  }
}
</script>

<style scoped>
.markdown-editor-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.markdown-editor {
  height: 100%;
  border-radius: 8px;
}

/* 美化mavon-editor的工具栏 */
:deep(.v-note-wrapper) {
  border-radius: 8px;
  border: 1px solid rgba(220, 223, 230, 0.5);
  transition: all 0.3s ease;
}

:deep(.v-note-wrapper:hover) {
  border-color: rgba(64, 158, 255, 0.3);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 美化工具栏按钮 */
:deep(.v-note-toolbar) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.8) 100%);
  border-bottom: 1px solid rgba(220, 223, 230, 0.5);
}

:deep(.v-note-toolbar .v-left-item button),
:deep(.v-note-toolbar .v-right-item button) {
  transition: all 0.2s ease;
  border-radius: 4px;
  margin: 0 2px;
}

:deep(.v-note-toolbar .v-left-item button:hover),
:deep(.v-note-toolbar .v-right-item button:hover) {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
  transform: translateY(-1px);
}

/* 美化编辑区域 */
:deep(.v-edit-area) {
  background-color: rgba(255, 255, 255, 0.95);
}

:deep(.v-note-edit) {
  font-size: 14px;
  line-height: 1.6;
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.95);
}

/* 美化预览区域 */
:deep(.v-note-preview) {
  background-color: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-left: 1px solid rgba(220, 223, 230, 0.5);
}

/* 美化代码块 */
:deep(.markdown-body pre) {
  background-color: #f6f8fa !important;
  border-radius: 8px !important;
  padding: 16px !important;
  border: 1px solid rgba(220, 223, 230, 0.5);
  transition: all 0.3s ease;
}

:deep(.markdown-body pre:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 美化表格 */
:deep(.markdown-body table) {
  border-radius: 8px !important;
  overflow: hidden !important;
  transition: all 0.3s ease;
}

:deep(.markdown-body table:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 美化公式渲染区域 */
:deep(.katex-display) {
  margin: 16px 0;
  transition: all 0.3s ease;
}

/* 美化滚动条 */
:deep(.v-edit-area::-webkit-scrollbar),
:deep(.v-note-preview::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(.v-edit-area::-webkit-scrollbar-track),
:deep(.v-note-preview::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 3px;
}

:deep(.v-edit-area::-webkit-scrollbar-thumb),
:deep(.v-note-preview::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background 0.3s ease;
}

:deep(.v-edit-area::-webkit-scrollbar-thumb:hover),
:deep(.v-note-preview::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.v-note-preview) {
    border-left: none;
    border-top: 1px solid rgba(220, 223, 230, 0.5);
  }
}
</style>