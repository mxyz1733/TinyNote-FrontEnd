<template>
  <div class="markdown-editor-wrapper">
    <mavon-editor
      v-model="content"
      :toolbars="toolbars"
      :ishljs="true"
      :math="true"
      :value="content"
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
      }
    })

    // 处理内容变化
    const handleChange = (value, render) => {
      content.value = value
      emit('update:modelValue', value)
      emit('change', value, render)
      
      // 触发MathJax重新渲染数学公式
      setTimeout(() => {
        if (window.MathJax) {
          window.MathJax.typeset()
        }
      }, 100)
    }

    // 组件挂载后触发MathJax初始化渲染
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
}

.markdown-editor {
  height: 100%;
}
</style>