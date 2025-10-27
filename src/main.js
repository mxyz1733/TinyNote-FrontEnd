import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 引入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 引入路由
import router from './router'

// 应用初始化前检查保存的主题设置
const savedTheme = localStorage.getItem('theme')
let theme = 'light'

if (savedTheme === 'auto') {
  // 检查系统主题偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark'
  }
} else if (savedTheme) {
  theme = savedTheme
}

// 应用初始主题
if (theme === 'dark') {
  document.documentElement.classList.add('dark')
  document.documentElement.setAttribute('data-theme', 'dark')
}

const app = createApp(App)

// 使用插件
app.use(ElementPlus, { 
  locale: zhCn,
  // Element Plus的深色模式支持
  dark: theme === 'dark'
})
app.use(router)

app.mount('#app')
