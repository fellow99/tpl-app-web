import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'
import zhTW from './zh-TW'

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US', 'zh-TW'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = 'language'
export const DEFAULT_LOCALE: Locale = 'zh-CN'

/** 语言切换选项（label 为各语言自称，不随当前语言翻译，遵循语言选择器惯例） */
export const LANG_OPTIONS: readonly { value: Locale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
]

/** 归一化系统语言为受支持 locale。 */
function normalizeSystemLocale(lang: string): Locale {
  const l = lang.toLowerCase()
  if (l.startsWith('zh') && (l.includes('tw') || l.includes('hk') || l.includes('mo') || l.includes('hant'))) return 'zh-TW'
  if (l.startsWith('zh')) return 'zh-CN'
  if (l.startsWith('en')) return 'en-US'
  return 'zh-CN'
}

/** 读取当前语言：localStorage `language` 优先，否则跟随浏览器语言，最后默认 zh-CN */
export function getLanguage(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as Locale
  }
  return normalizeSystemLocale(navigator.language || DEFAULT_LOCALE)
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getLanguage(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'zh-TW': zhTW,
  },
})

/** 切换语言：写 localStorage + 更新 i18n 实例 locale */
export function setLanguage(lang: Locale) {
  localStorage.setItem(STORAGE_KEY, lang)
  i18n.global.locale.value = lang
}
