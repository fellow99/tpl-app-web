import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { useThemeStore } from './stores/theme'
import { i18n } from './lang'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)

// 主题皮肤：同步当前三态到 DOM，并监听系统深浅色变化（system 态实时联动）
const themeStore = useThemeStore()
themeStore.init()

// 进入主页：用存储的 token 获取用户信息（后端 token 续期）
const userStore = useUserStore()
if (userStore.isLoggedIn) {
  userStore.fetchUserInfo().catch(() => {
    // 获取失败视为登录失效：清理 token，跳转登录页
    userStore.clearToken()
  })
}

app.mount('#app')
