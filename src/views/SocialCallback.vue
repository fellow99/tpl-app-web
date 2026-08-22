<template>
  <div class="social-callback-page">
    <div class="lang-switch">
      <LangSwitcher />
    </div>
    <div class="callback-card card">
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      <p v-else class="status-msg">{{ $t('auth.wechat.processing') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { socialLogin, socialCallback } from '@/api/social'
import type { SocialLoginParams } from '@/api/social'
import LangSwitcher from '@/components/LangSwitcher.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const errorMsg = ref('')

onMounted(async () => {
  const code = route.query.code
  const state = route.query.state
  const source = route.query.source

  if (!code || !source) {
    errorMsg.value = t('message.error.wechatParamsMissing')
    redirectTo('/login')
    return
  }

  const params: SocialLoginParams = {
    clientId: import.meta.env.VITE_APP_CLIENT_ID,
    grantType: 'social',
    source: String(source),
    socialCode: String(code),
    socialState: state ? String(state) : '',
  }

  try {
    if (userStore.isLoggedIn) {
      // 已登录：绑定第三方账号（个人中心「绑定微信」场景）
      await socialCallback(params)
    } else {
      // 未登录：微信扫码登录
      const result = await socialLogin(params)
      userStore.setToken(result.access_token)
    }
    router.replace('/profile')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : t('message.error.wechatLoginFailed')
    // 登录失败回登录页；绑定失败（已登录）回个人中心
    redirectTo(userStore.isLoggedIn ? '/profile' : '/login')
  }
})

function redirectTo(path: string) {
  setTimeout(() => router.replace(path), 1500)
}
</script>

<style scoped>
.social-callback-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-lg);
  background: var(--paper);
}

.lang-switch {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: 10;
}

.callback-card {
  width: 100%;
  max-width: 400px;
  padding: var(--space-2xl);
  text-align: center;
}

.status-msg {
  font-size: 15px;
  color: var(--inkstone);
}

.error-msg {
  font-size: 14px;
  color: var(--cinnabar);
}
</style>
