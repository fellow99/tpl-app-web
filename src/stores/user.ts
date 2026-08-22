import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi, getCaptchaApi, logoutApi } from '@/api/auth'
import { getInfoApi } from '@/api/user'
import type { LoginParams, RegisterParams, CaptchaResult } from '@/api/auth'
import type { UserInfo } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function clearToken() {
    token.value = null
    localStorage.removeItem('token')
  }

  async function login(params: LoginParams): Promise<void> {
    const result = await loginApi(params)
    setToken(result.access_token)
  }

  async function register(params: RegisterParams): Promise<void> {
    const result = await registerApi(params)
    setToken(result.access_token)
  }

  async function fetchCaptcha(): Promise<CaptchaResult> {
    return getCaptchaApi()
  }

  /** 获取用户信息（后端 token 续期），失败抛出异常由调用方处理 */
  async function fetchUserInfo(): Promise<UserInfo> {
    const info = await getInfoApi()
    userInfo.value = info
    return info
  }

  async function logout(): Promise<void> {
    try {
      await logoutApi()
    } finally {
      clearToken()
      userInfo.value = null
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    register,
    fetchCaptcha,
    fetchUserInfo,
    logout,
    setToken,
    clearToken,
  }
})
