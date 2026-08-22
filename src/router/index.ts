import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory('/web/'),
  routes: [
    {
      path: '/',
      redirect: '/profile',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/ProfilePage.vue'),
      meta: { requiresAuth: true },
    },
    {
      // 微信登录回调页：无 meta（不加 guest / requiresAuth），
      // 需在「未登录」（扫码登录）与「已登录」（绑定第三方）两种状态下均可访问。
      path: '/social-callback',
      name: 'SocialCallback',
      component: () => import('@/views/SocialCallback.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && userStore.isLoggedIn) {
    next({ name: 'Profile' })
  } else {
    next()
  }
})

export default router
