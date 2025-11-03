import { createApp } from 'vue'
import './style.css'
// 导入Element Plus主题变量（必须在Element Plus样式之前导入）
import './theme/element-variables.css'
import App from './App.vue'

// 引入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 引入路由
import router from './router'

const app = createApp(App)

// 使用插件
app.use(ElementPlus, { 
  locale: zhCn
})
app.use(router)

app.mount('#app')
