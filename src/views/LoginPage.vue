<template>
  <div class="login-page">
    <!-- 主题切换按钮（specs/005-theme）：亮色显示 🌙，暗色显示 ☀️，点击 light↔dark 显式切换 -->
    <button
      type="button"
      class="theme-toggle"
      :aria-label="$t('common.theme.toggle')"
      :title="$t('common.theme.toggle')"
      @click="themeStore.toggleTheme()"
    >
      <span aria-hidden="true">{{ themeStore.resolvedTheme === 'dark' ? '☀️' : '🌙' }}</span>
    </button>

    <div class="lang-switch">
      <LangSwitcher />
    </div>

    <div class="login-card card">
      <div class="logo-area">
        <h1 class="logo-text">{{ $t('app.name') }}</h1>
        <p class="logo-subtitle">{{ $t('app.slogan') }}</p>
      </div>

      <!-- Tab switch -->
      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: mode === 'password' }"
          @click="switchMode('password')"
        >
          {{ $t('auth.login.tab.password') }}
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: mode === 'sms' }"
          @click="switchMode('sms')"
        >
          {{ $t('auth.login.tab.sms') }}
        </button>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <div class="input-wrapper">
            <Smartphone :size="18" class="input-icon" />
            <input
              v-model="form.phoneNumber"
              type="tel"
              class="form-input has-icon"
              :placeholder="$t('common.phone')"
              maxlength="11"
              autocomplete="tel"
            />
          </div>
        </div>

        <div v-if="mode === 'password'" class="form-field">
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input
              v-model="form.password"
              type="password"
              class="form-input has-icon"
              :placeholder="$t('common.password')"
              autocomplete="current-password"
            />
          </div>
        </div>

        <div v-else class="form-field sms-row">
          <div class="input-wrapper sms-input-wrapper">
            <MessageSquare :size="18" class="input-icon" />
            <input
              v-model="form.smsCode"
              type="text"
              class="form-input has-icon"
              :placeholder="$t('auth.login.smsCodePlaceholder')"
              maxlength="6"
            />
          </div>
          <button
            type="button"
            class="btn btn-ghost sms-btn"
            :disabled="countdown > 0 || smsSending"
            @click="handleSendSms"
          >
            {{ countdown > 0 ? $t('common.resendCountdown', { countdown }) : $t('common.getCode') }}
          </button>
        </div>

        <div v-if="captchaEnabled" class="form-field captcha-row">
          <div class="input-wrapper captcha-input-wrapper">
            <ShieldCheck :size="18" class="input-icon" />
            <input
              v-model="form.code"
              type="text"
              class="form-input has-icon"
              :placeholder="$t('common.captcha')"
              maxlength="4"
            />
          </div>
          <img
            v-if="captchaImg"
            :src="captchaImg"
            :alt="$t('common.captcha.alt')"
            class="captcha-img"
            @click="refreshCaptcha"
            :title="$t('common.captcha.refreshTitle')"
          />
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary btn-full btn-lg" :disabled="loading">
          {{ loading ? $t('auth.login.submitting') : $t('auth.login.submit') }}
        </button>
      </form>

      <div v-if="wechatLoginEnabled" class="social-login">
        <div class="divider"><span>{{ $t('auth.login.otherMethods') }}</span></div>
        <button
          type="button"
          class="btn-wechat"
          :disabled="wechatLoading"
          @click="handleWechatLogin"
        >
          {{ wechatLoading ? $t('auth.wechat.loggingIn') : $t('auth.wechat.login') }}
        </button>
      </div>

      <p class="bottom-link">
        {{ $t('auth.login.noAccount') }}<router-link to="/register" class="link">{{ $t('auth.login.goRegister') }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { sendSmsCodeApi } from '@/api/auth'
import { authRouterUrl } from '@/api/social'
import { Smartphone, Lock, ShieldCheck, MessageSquare } from 'lucide-vue-next'
import LangSwitcher from '@/components/LangSwitcher.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { t } = useI18n()

const mode = ref<'password' | 'sms'>('password')

// 微信登录编译开关（默认启用，`VITE_APP_WECHAT_LOGIN_ENABLED=false` 时关闭）
const wechatLoginEnabled = import.meta.env.VITE_APP_WECHAT_LOGIN_ENABLED !== 'false'
const wechatLoading = ref(false)

const form = reactive({
  phoneNumber: '',
  password: '',
  smsCode: '',
  code: '',
  uuid: '',
})

const captchaImg = ref('')
const captchaEnabled = ref(true)
const errorMsg = ref('')
const loading = ref(false)
const smsSending = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

async function refreshCaptcha() {
  try {
    const result = await userStore.fetchCaptcha()
    captchaEnabled.value = result.captchaEnabled
    if (result.captchaEnabled) {
      captchaImg.value = result.img
      form.uuid = result.uuid
    }
    form.code = ''
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : t('message.error.getCodeFailed')
  }
}

function switchMode(m: 'password' | 'sms') {
  mode.value = m
  errorMsg.value = ''
}

/** 微信扫码登录：获取授权 URL 后整页跳转（source 固定 wechat_open） */
async function handleWechatLogin() {
  if (wechatLoading.value) return
  wechatLoading.value = true
  errorMsg.value = ''
  try {
    const url = await authRouterUrl('wechat_open')
    window.location.href = url
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : t('message.error.wechatLoginFailed')
    wechatLoading.value = false
  }
}

async function handleSendSms() {
  if (!form.phoneNumber) {
    errorMsg.value = t('message.error.phoneRequired')
    return
  }
  if (!/^1\d{10}$/.test(form.phoneNumber)) {
    errorMsg.value = t('message.error.phoneInvalid')
    return
  }
  smsSending.value = true
  errorMsg.value = ''
  try {
    await sendSmsCodeApi(form.phoneNumber)
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        if (timer) clearInterval(timer)
        timer = null
      }
    }, 1000)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : t('message.error.sendCodeFailed')
  } finally {
    smsSending.value = false
  }
}

async function handleSubmit() {
  if (!form.phoneNumber) {
    errorMsg.value = t('message.error.phoneRequired')
    return
  }
  if (mode.value === 'password' && !form.password) {
    errorMsg.value = t('message.error.passwordRequired')
    return
  }
  if (mode.value === 'sms' && !form.smsCode) {
    errorMsg.value = t('message.error.smsCodeRequired')
    return
  }
  if (captchaEnabled.value && !form.code) {
    errorMsg.value = t('message.error.captchaRequired')
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await userStore.login({
      grantType: mode.value,
      phoneNumber: form.phoneNumber,
      password: mode.value === 'password' ? form.password : undefined,
      smsCode: mode.value === 'sms' ? form.smsCode : undefined,
      code: form.code,
      uuid: form.uuid,
    })
    const redirect = (route.query.redirect as string) || '/profile'
    router.push(redirect)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : t('message.error.loginFailed')
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-lg);
  background: var(--paper);
}

/* 主题切换按钮：右上角圆形 emoji 按钮，44×44 最小点击区域，不遮挡表单 */
.theme-toggle {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: 10;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  background: var(--white);
  border: 1px solid var(--silver);
  box-shadow: var(--shadow-card);
  transition: border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out), transform 100ms var(--ease-in-out);
}

.theme-toggle:hover {
  border-color: var(--indigo);
  box-shadow: var(--shadow-card-hover);
}

.theme-toggle:active {
  transform: scale(0.94);
}

.lang-switch {
  position: absolute;
  top: var(--space-lg);
  right: calc(var(--space-lg) + 36px + var(--space-sm));
  z-index: 10;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: var(--space-2xl);
}

.logo-area {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.logo-text {
  font-size: var(--text-h1);
  font-weight: 600;
  color: var(--indigo);
  margin-bottom: var(--space-xs);
}

.logo-subtitle {
  font-size: 14px;
  color: var(--inkstone);
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--silver);
  margin-bottom: var(--space-xl);
}

.tab {
  flex: 1;
  height: 40px;
  font-size: 15px;
  color: var(--inkstone);
  border-bottom: 2px solid transparent;
  transition: color 150ms var(--ease-out), border-color 150ms var(--ease-out);
}

.tab.active {
  color: var(--indigo);
  font-weight: 600;
  border-bottom-color: var(--indigo);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-field {
  width: 100%;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--inkstone);
  pointer-events: none;
  flex-shrink: 0;
}

.has-icon {
  padding-left: 38px;
}

.sms-row {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.sms-input-wrapper {
  flex: 1;
}

.sms-btn {
  height: 40px;
  font-size: 13px;
  padding: 0 var(--space-md);
  border: 1px solid var(--silver);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  white-space: nowrap;
}

.sms-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.captcha-row {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}

.captcha-input-wrapper {
  flex: 1;
}

.captcha-img {
  height: 40px;
  width: auto;
  min-width: 90px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--silver);
  cursor: pointer;
  flex-shrink: 0;
}

.captcha-img:hover {
  border-color: var(--indigo);
}

.error-msg {
  font-size: 13px;
  color: var(--cinnabar);
  text-align: center;
}

.bottom-link {
  text-align: center;
  font-size: 13px;
  color: var(--inkstone);
  margin-top: var(--space-xl);
}

.social-login {
  margin-top: var(--space-xl);
}

.divider {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  color: var(--inkstone);
  font-size: 13px;
  margin-bottom: var(--space-lg);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--silver);
}

.btn-wechat {
  width: 100%;
  height: 44px;
  font-size: 15px;
  color: var(--color-wechat);
  border: 1px solid var(--color-wechat);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  transition: background-color 150ms var(--ease-out);
}

.btn-wechat:hover {
  background: color-mix(in srgb, var(--color-wechat) 6%, transparent);
}

.btn-wechat:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link {
  color: var(--indigo);
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}
</style>
