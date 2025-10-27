import { createApp } from 'vue'
import './style.css'
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
