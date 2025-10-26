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

    // 工具栏配置
    const toolbars = {
      bold: true,
      italic: true,
      header: true,
      underline: true,
      strikethrough: true,
      mark: true,
      superscript: true,
      subscript: true,
      quote: true,
      ol: true,
      ul: true,
      link: true,
      imagelink: true,
      code: true,
      table: true,
      fullscreen: true,
      readmodel: true,
      htmlcode: true,
      help: true,
      /* 1.3.5 */
      undo: true,
      redo: true,
      trash: true,
      save: false,
      /* 1.4.2 */
      navigation: true,
      /* 2.1.8 */
      alignleft: true,
      aligncenter: true,
      alignright: true,
      /* 2.2.1 */
      subfield: true,
      preview: true,
      /* 数学公式 */
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