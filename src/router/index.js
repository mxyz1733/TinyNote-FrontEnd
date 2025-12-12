import { createRouter, createWebHistory } from 'vue-router'

// 懒加载路由组件
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const Home = () => import('../views/Home.vue')
const NoteEdit = () => import('../views/NoteEdit.vue')
const ThreeColumnLayout = () => import('../views/ThreeColumnLayout.vue')
const Settings = () => import('../views/Settings.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录 - TinyNote'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册 - TinyNote'
    }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页 - TinyNote',
      requiresAuth: true
    }
  },
  {
    path: '/workspace',
    name: 'ThreeColumnLayout',
    component: ThreeColumnLayout,
    meta: {
      title: '工作区 - TinyNote',
      requiresAuth: true
    }
  },
  {
    path: '/note/edit/:id?',
    name: 'NoteEdit',
    component: NoteEdit,
    meta: {
      title: '编辑笔记 - TinyNote',
      requiresAuth: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: '设置 - TinyNote',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，检查是否需要登录并设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  const isAuthenticated = localStorage.getItem('token')
  
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    // 需要登录但未登录，重定向到登录页
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router