import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

/** 主题三态：浅色 / 深色 / 跟随系统（默认） */
export type ThemeMode = 'light' | 'dark' | 'system'
/** 解析后的实际皮肤：浅色 / 深色 */
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system']
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && (THEME_MODES as readonly string[]).includes(value)
}

/** 读取 localStorage `theme`；缺失或非法值回退默认 `system` */
function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isThemeMode(stored) ? stored : 'system'
}

/**
 * 主题皮肤状态（父工程 specs/005-theme：三态 + 本地持久化 + 系统跟随）。
 * 与 index.html 内联防闪烁脚本共享同一持久化键 `theme` 与 `data-theme` 落点。
 */
export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>(readStoredTheme())
  const systemPrefersDark = ref(window.matchMedia(DARK_MEDIA_QUERY).matches)

  /** 三态解析：system → 读系统深浅色；light/dark → 直接生效 */
  const resolvedTheme = computed<ResolvedTheme>(() => {
    if (theme.value === 'system') return systemPrefersDark.value ? 'dark' : 'light'
    return theme.value
  })

  let mediaQuery: MediaQueryList | null = null

  /** 将解析后的皮肤写入 `documentElement.dataset.theme`（CSS 经 [data-theme] 切换变量集合） */
  function applyTheme() {
    document.documentElement.dataset.theme = resolvedTheme.value
  }

  /** 设置三态主题（light/dark/system），即时生效并持久化 */
  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }

  /** light↔dark 显式切换（登录页按钮）：基于当前解析结果取反，覆盖 system 默认 */
  function toggleTheme() {
    setTheme(resolvedTheme.value === 'dark' ? 'light' : 'dark')
  }

  /** 应用启动时调用：同步当前主题到 DOM，并开始监听系统深浅色变化（system 态实时联动） */
  function init() {
    applyTheme()
    if (mediaQuery) return
    mediaQuery = window.matchMedia(DARK_MEDIA_QUERY)
    mediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
      systemPrefersDark.value = e.matches
    })
  }

  watch(resolvedTheme, applyTheme)
  watch(theme, (mode) => {
    localStorage.setItem(STORAGE_KEY, mode)
  })

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    init,
  }
})
