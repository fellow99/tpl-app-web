<template>
  <AppLayout>
    <div class="profile-page">
      <h1 class="page-title">{{ $t('auth.profile.title') }}</h1>

      <!-- 用户信息展示 -->
      <section class="card section">
        <h2 class="section-title">{{ $t('auth.profile.sectionInfo') }}</h2>
        <div class="info-list">
          <div class="info-row"><span class="info-label">{{ $t('common.nickname') }}</span><span class="info-value">{{ userInfo.nickName || '-' }}</span></div>
          <div class="info-row"><span class="info-label">{{ $t('common.phone') }}</span><span class="info-value">{{ userInfo.phoneNumber || '-' }}</span></div>
          <div class="info-row"><span class="info-label">{{ $t('common.email') }}</span><span class="info-value">{{ userInfo.email || '-' }}</span></div>
          <div class="info-row"><span class="info-label">{{ $t('common.birthday') }}</span><span class="info-value">{{ userInfo.birthDate || '-' }}</span></div>
        </div>
      </section>

      <!-- 偏好设置（specs/005-theme）：「切换主题」位于「切换语言」之下，与登录页按钮共享同一主题 store -->
      <section class="card section">
        <h2 class="section-title">{{ $t('auth.profile.sectionPreferences') }}</h2>
        <div class="pref-list">
          <div class="pref-row">
            <label class="pref-label" for="pref-language">{{ $t('auth.profile.switchLanguage') }}</label>
            <select
              id="pref-language"
              class="form-input pref-select"
              :value="locale"
              @change="handleLocaleChange"
            >
              <option v-for="opt in LANG_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="pref-row">
            <label class="pref-label" for="pref-theme">{{ $t('common.theme.toggle') }}</label>
            <select
              id="pref-theme"
              class="form-input pref-select"
              :value="themeStore.theme"
              @change="handleThemeChange"
            >
              <option value="light">{{ $t('common.theme.light') }}</option>
              <option value="dark">{{ $t('common.theme.dark') }}</option>
              <option value="system">{{ $t('common.theme.system') }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 操作按钮 -->
      <section class="action-list">
        <button class="btn btn-primary btn-full" @click="openEditDialog">{{ $t('auth.profile.editInfo') }}</button>
        <button class="btn btn-ghost btn-full" @click="openPwdDialog">{{ $t('auth.profile.changePassword') }}</button>
      </section>

      <!-- 修改信息对话框 -->
      <div v-if="showEditDialog" class="modal-mask" @click.self="closeEditDialog">
        <div class="modal card">
          <h3 class="modal-title">{{ $t('auth.profile.editInfo') }}</h3>
          <form class="modal-form" @submit.prevent="handleSaveProfile">
            <div class="form-field">
              <label class="field-label">{{ $t('common.nickname') }}</label>
              <input v-model="editForm.nickName" type="text" class="form-input" :placeholder="$t('common.nickname')" />
            </div>
            <div class="form-field">
              <label class="field-label">{{ $t('common.email') }}</label>
              <input v-model="editForm.email" type="email" class="form-input" :placeholder="$t('common.email')" />
            </div>
            <div class="form-field">
              <label class="field-label">{{ $t('common.birthday') }}</label>
              <input v-model="editForm.birthDate" type="date" class="form-input" />
            </div>
            <div v-if="captchaEnabled" class="form-field captcha-row">
              <div class="captcha-input-wrapper">
                <input v-model="editForm.code" type="text" class="form-input" :placeholder="$t('common.captcha')" maxlength="4" />
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
            <p v-if="editError" class="error-msg">{{ editError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" @click="closeEditDialog">{{ $t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="editLoading">
                {{ editLoading ? $t('auth.profile.saving') : $t('auth.profile.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 修改密码对话框 -->
      <div v-if="showPwdDialog" class="modal-mask" @click.self="closePwdDialog">
        <div class="modal card">
          <h3 class="modal-title">{{ $t('auth.profile.changePassword') }}</h3>
          <form class="modal-form" @submit.prevent="handleChangePassword">
            <div v-if="!isEmptyPassword" class="form-field">
              <label class="field-label">{{ $t('common.oldPassword') }}</label>
              <input v-model="pwdForm.oldPassword" type="password" class="form-input" :placeholder="$t('common.oldPassword')" autocomplete="current-password" />
            </div>
            <div class="form-field">
              <label class="field-label">{{ $t('common.newPassword') }}</label>
              <input v-model="pwdForm.newPassword" type="password" class="form-input" :placeholder="$t('common.newPassword')" autocomplete="new-password" />
            </div>
            <div class="form-field">
              <label class="field-label">{{ $t('common.confirmPassword') }}</label>
              <input v-model="pwdForm.confirmPassword" type="password" class="form-input" :placeholder="$t('common.confirmPassword')" autocomplete="new-password" />
            </div>
            <div class="form-field sms-row">
              <div class="sms-input-wrapper">
                <input v-model="pwdForm.smsCode" type="text" class="form-input" :placeholder="$t('common.smsCode')" maxlength="6" />
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
              <div class="captcha-input-wrapper">
                <input v-model="pwdForm.code" type="text" class="form-input" :placeholder="$t('common.captcha')" maxlength="4" />
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
            <p v-if="pwdError" class="error-msg">{{ pwdError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" @click="closePwdDialog">{{ $t('common.cancel') }}</button>
              <button type="submit" class="btn btn-accent" :disabled="pwdLoading">
                {{ pwdLoading ? $t('auth.profile.submitting') : $t('auth.profile.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { updateProfileApi, changePasswordApi, isEmptyPasswordApi } from '@/api/user'
import type { UserInfo } from '@/api/user'
import { sendSmsCodeApi } from '@/api/auth'
import { setLanguage, LANG_OPTIONS, type Locale } from '@/lang'
import { useThemeStore } from '@/stores/theme'
import AppLayout from '@/components/AppLayout.vue'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { t, locale } = useI18n()

/** 切换语言：与 AppLayout 顶栏共享同一 i18n 实例与持久化键 */
function handleLocaleChange(e: Event) {
  setLanguage((e.target as HTMLSelectElement).value as Locale)
}

/** 切换主题：三态选择（浅色/深色/跟随系统），与登录页按钮共享同一主题 store */
function handleThemeChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  if (value === 'light' || value === 'dark' || value === 'system') {
    themeStore.setTheme(value)
  }
}

const showEditDialog = ref(false)
const showPwdDialog = ref(false)
const editLoading = ref(false)
const pwdLoading = ref(false)
const editError = ref('')
const pwdError = ref('')
// 是否为无密码账号（微信一键登录自动建号）
const isEmptyPassword = ref(false)

const captchaImg = ref('')
const captchaEnabled = ref(true)
const captchaUuid = ref('')

const smsSending = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const userInfo = computed<UserInfo>(
  () =>
    userStore.userInfo ?? {
      userId: 0,
      userName: '',
      nickName: '',
      phoneNumber: '',
      email: '',
      birthDate: '',
    },
)

const editForm = reactive({
  nickName: '',
  email: '',
  birthDate: '',
  code: '',
})

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  smsCode: '',
  code: '',
})

async function refreshCaptcha() {
  try {
    const result = await userStore.fetchCaptcha()
    captchaEnabled.value = result.captchaEnabled
    if (result.captchaEnabled) {
      captchaImg.value = result.img
      captchaUuid.value = result.uuid
    }
  } catch {
    // 验证码获取失败不阻断
  }
}

function openEditDialog() {
  editForm.nickName = userInfo.value.nickName
  editForm.email = userInfo.value.email
  editForm.birthDate = userInfo.value.birthDate
  editForm.code = ''
  editError.value = ''
  showEditDialog.value = true
  refreshCaptcha()
}

function closeEditDialog() {
  showEditDialog.value = false
  editError.value = ''
}

function openPwdDialog() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdForm.smsCode = ''
  pwdForm.code = ''
  pwdError.value = ''
  showPwdDialog.value = true
  refreshCaptcha()
  // 查询是否为无密码账号，决定是否隐藏「当前密码」
  isEmptyPasswordApi()
    .then((v) => { isEmptyPassword.value = v })
    .catch(() => { isEmptyPassword.value = false })
}

function closePwdDialog() {
  showPwdDialog.value = false
  pwdError.value = ''
}

async function handleSaveProfile() {
  if (!editForm.nickName) {
    editError.value = t('message.error.nicknameRequired')
    return
  }
  if (captchaEnabled.value && !editForm.code) {
    editError.value = t('message.error.captchaRequired')
    return
  }
  editLoading.value = true
  editError.value = ''
  try {
    await updateProfileApi({
      nickName: editForm.nickName,
      email: editForm.email,
      birthDate: editForm.birthDate,
      code: editForm.code,
      uuid: captchaUuid.value,
    })
    await userStore.fetchUserInfo()
    showEditDialog.value = false
  } catch (e: unknown) {
    editError.value = e instanceof Error ? e.message : t('message.error.saveFailed')
    refreshCaptcha()
  } finally {
    editLoading.value = false
  }
}

async function handleSendSms() {
  const phone = userInfo.value.phoneNumber
  if (!phone) {
    pwdError.value = t('message.error.phoneEmptyForSms')
    return
  }
  smsSending.value = true
  pwdError.value = ''
  try {
    await sendSmsCodeApi(phone)
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        if (timer) clearInterval(timer)
        timer = null
      }
    }, 1000)
  } catch (e: unknown) {
    pwdError.value = e instanceof Error ? e.message : t('message.error.sendCodeFailed')
  } finally {
    smsSending.value = false
  }
}

async function handleChangePassword() {
  if (!isEmptyPassword.value && !pwdForm.oldPassword) {
    pwdError.value = t('message.error.currentPasswordRequired')
    return
  }
  if (!pwdForm.newPassword || !pwdForm.confirmPassword) {
    pwdError.value = t('message.error.passwordIncomplete')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    pwdError.value = t('message.error.passwordMismatch')
    return
  }
  if (!pwdForm.smsCode) {
    pwdError.value = t('message.error.smsCodeRequired')
    return
  }
  if (captchaEnabled.value && !pwdForm.code) {
    pwdError.value = t('message.error.captchaRequired')
    return
  }
  pwdLoading.value = true
  pwdError.value = ''
  try {
    await changePasswordApi({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
      confirmPassword: pwdForm.confirmPassword,
      smsCode: pwdForm.smsCode,
      code: pwdForm.code,
      uuid: captchaUuid.value,
    })
    // 修改密码后强制重新登录
    await userStore.logout()
    router.push('/login')
  } catch (e: unknown) {
    pwdError.value = e instanceof Error ? e.message : t('message.error.updateFailed')
    refreshCaptcha()
  } finally {
    pwdLoading.value = false
  }
}

onMounted(() => {
  userStore.fetchUserInfo().catch(() => {})
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.profile-page {
  animation: fadeIn 200ms var(--ease-out);
  max-width: 640px;
  margin: 0 auto;
}

.page-title {
  font-size: var(--text-h1);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-xl);
}

.section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: var(--text-h3);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-lg);
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--frost);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: var(--text-body-sm);
  color: var(--inkstone);
}

.info-value {
  font-size: var(--text-body);
  color: var(--ink);
}

/* 偏好设置：切换语言 / 切换主题 */
.pref-list {
  display: flex;
  flex-direction: column;
}

.pref-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--frost);
}

.pref-row:last-child {
  border-bottom: none;
}

.pref-label {
  font-size: var(--text-body-sm);
  color: var(--inkstone);
}

.pref-select {
  width: auto;
  min-width: 140px;
  height: 36px;
  font-size: var(--text-body-sm);
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Modal */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(41, 37, 34, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 440px;
  max-height: 85vh;
  overflow-y: auto;
  padding: var(--space-2xl);
}

.modal-title {
  font-size: var(--text-h3);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-xl);
}

.modal-form {
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
  align-items: center;
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

.error-msg {
  font-size: 13px;
  color: var(--cinnabar);
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-sm);
}
</style>
