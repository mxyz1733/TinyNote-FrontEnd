import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // server: {
  //   host: '0.0.0.0'  // 允许所有网络接口访问
  // },
  css: {
    preprocessorOptions: {
      css: {
        additionalData: '@import "@/theme/element-variables.css";'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
