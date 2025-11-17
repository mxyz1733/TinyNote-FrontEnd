<template>
  <div class="app-container">
    <!-- 路由出口 -->
    <router-view />
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden;
}

#app {
  height: 100%;
}

.app-container {
  min-height: 100vh;
  padding: 20px;
  transition: all 0.3s ease;
}
</style>
