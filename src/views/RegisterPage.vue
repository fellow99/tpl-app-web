<template>
  <div class="register-page">
    <div class="lang-switch">
      <LangSwitcher />
    </div>
    <div class="register-card card">
      <div class="logo-area">
        <h1 class="logo-text">{{ $t('auth.register.title') }}</h1>
        <p class="logo-subtitle">{{ $t('app.tagline') }}</p>
      </div>

      <form class="register-form" @submit.prevent="handleSubmit">
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

        <div class="form-field">
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input
              v-model="form.password"
              type="password"
              class="form-input has-icon"
              :placeholder="$t('common.password')"
              autocomplete="new-password"
            />
          </div>
        </div>

        <div class="form-field">
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input
              v-model="form.confirmPassword"
              type="password"
              class="form-input has-icon"
              :class="{ error: passwordMismatch }"
              :placeholder="$t('common.confirmPassword')"
              autocomplete="new-password"
            />
          </div>
          <p v-if="passwordMismatch" class="field-error">{{ $t('message.error.passwordMismatch') }}</p>
        </div>

        <div class="form-field sms-row">
          <div class="input-wrapper sms-input-wrapper">
            <MessageSquare :size="18" class="input-icon" />
            <input
              v-model="form.smsCode"
              type="text"
              class="form-input has-icon"
              :placeholder="$t('common.smsCode')"
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

        <button type="submit" class="btn btn-accent btn-full btn-lg" :disabled="loading">
          {{ loading ? $t('auth.register.submitting') : $t('auth.register.submit') }}
        </button>
      </form>

      <p class="bottom-link">
        {{ $t('auth.register.hasAccount') }}<router-link to="/login" class="link">{{ $t('auth.register.goLogin') }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { sendSmsCodeApi } from '@/api/auth'
import { Smartphone, Lock, ShieldCheck, MessageSquare } from 'lucide-vue-next'
import LangSwitcher from '@/components/LangSwitcher.vue'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const form = reactive({
  phoneNumber: '',
  password: '',
  confirmPassword: '',
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

const passwordMismatch = computed(
  () => form.confirmPassword.length > 0 && form.password !== form.confirmPassword,
)

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
  if (!/^1\d{10}$/.test(form.phoneNumber)) {
    errorMsg.value = t('message.error.phoneInvalid')
    return
  }
  if (!form.password) {
    errorMsg.value = t('message.error.passwordRequired')
    return
  }
  if (!form.smsCode) {
    errorMsg.value = t('message.error.smsCodeRequired')
    return
  }
  if (captchaEnabled.value && !form.code) {
    errorMsg.value = t('message.error.captchaRequired')
    return
  }
  if (passwordMismatch.value) {
    errorMsg.value = t('message.error.passwordMismatch')
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await userStore.register({
      phoneNumber: form.phoneNumber,
      password: form.password,
      smsCode: form.smsCode,
      code: form.code,
      uuid: form.uuid,
    })
    // 注册即登录成功，跳转个人中心
    router.push('/profile')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : t('message.error.registerFailed')
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
.register-page {
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

.register-card {
  width: 100%;
  max-width: 420px;
  padding: var(--space-2xl);
}

.logo-area {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.logo-text {
  font-size: var(--text-h1);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-xs);
}

.logo-subtitle {
  font-size: 14px;
  color: var(--inkstone);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-field {
  width: 100%;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--inkstone);
  margin-bottom: var(--space-xs);
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

.field-error {
  font-size: 12px;
  color: var(--cinnabar);
  margin-top: var(--space-xs);
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

.link {
  color: var(--indigo);
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}
</style>
