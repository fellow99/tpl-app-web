# 005-theme 模块技术方案（plan.md）

> 模块名称：主题皮肤切换模块（Theme / Skin Switching）
> 所属项目：tpl-app-web（tpl-workspace网页端）
> 文档类型：落地实现方案（对齐父工程 plan.md §4.2 实现策略，如实记录本工程实现）
> 对应文档：spec.md（功能规格）
> 生成日期：2026-08-18

## 1. 技术上下文（Technical Context）

| 依赖 | 版本 | 用途 |
|---|---|---|
| vue | ^3.5.13 | 前端框架（Composition API + `<script setup>`） |
| pinia | ^2.3.0 | 主题状态管理（composition store） |
| vue-i18n | ^11.0.0 | 切换入口文案三语言 |
| vite | ^6.1.0 | 构建与开发服务器 |
| typescript | ~5.6.3 | 类型系统（strict） |

模块文件：
- `src/style.css` — 角色变量 + 色彩名别名 + `[data-theme="dark"]` 暗色皮肤
- `src/stores/theme.ts` — 三态主题 store（状态/持久化/系统跟随/DOM 落点，85 行）
- `index.html` — `<head>` 内联防闪烁脚本
- `src/main.ts` — `useThemeStore().init()` 挂载
- `src/views/LoginPage.vue` — 右上角圆形 emoji 切换按钮
- `src/views/ProfilePage.vue` — 「偏好设置」区（切换语言 + 切换主题）
- `src/lang/index.ts` — 导出 `LANG_OPTIONS`（供 AppLayout 与 ProfilePage 复用）
- `src/components/AppLayout.vue` — 改为从 `@/lang` 导入 `LANG_OPTIONS`（消除重复定义）
- `src/lang/{zh-CN,en-US,zh-TW}.ts` — 语料新增 7 key（父工程语料同步）

## 2. 宪法符合性检查（Constitution Compliance）

| 宪法约定 | 结论 | 代码证据 |
|---|---|---|
| 1.1 命名 PascalCase / camelCase | ✅ | `useThemeStore`、`toggleTheme`、`resolvedTheme`、`ThemeMode` |
| 1.3 @/ 别名 | ✅ | `import { useThemeStore } from '@/stores/theme'`、`from '@/lang'` |
| 1.4 Composition API + `<script setup lang="ts">` | ✅ | LoginPage / ProfilePage / AppLayout 均为 `<script setup lang="ts">` |
| 2 TypeScript strict + 显式类型 | ✅ | `ThemeMode` / `ResolvedTheme` 联合类型；`isThemeMode` 类型守卫收窄，无 `as any` |
| 3 纯 CSS + scoped + Design Tokens | ✅ | 无 UI 框架；新增样式全部走 `--space-*` / `--radius-*` / `--shadow-*` / `--ease-*` 令牌 |
| 4 Pinia composition store | ✅ | `defineStore('theme', () => {...})`，与 `stores/user.ts` 风格一致 |
| 7 安全 | ✅ | 主题为纯本地偏好，无敏感配置；localStorage 值经白名单校验后采纳 |
| 8 设计系统统一（父工程宪法原则 8） | ✅ | 色值 100% 取自父工程 var.md；品牌主色统一靛青 `#3B5998` |

## 3. 关键数据结构（Key Data Structures）

```ts
// src/stores/theme.ts
export type ThemeMode = 'light' | 'dark' | 'system'      // 用户选择的三态
export type ResolvedTheme = 'light' | 'dark'             // 解析后的实际皮肤

const STORAGE_KEY = 'theme'                              // 与 index.html 内联脚本共享
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

// store 对外暴露：
// - theme: Ref<ThemeMode>            当前三态选择（默认 'system'）
// - resolvedTheme: ComputedRef<ResolvedTheme>  三态解析结果
// - setTheme(mode) / toggleTheme() / init()
```

```css
/* src/style.css（结构示意） */
:root {
  /* 角色变量 29 项（var.md §3~§6，default 值） */
  --color-primary: #3B5998; /* ... */
  /* DESIGN.md 色彩名别名 10 项（var.md §8） */
  --indigo: var(--color-primary); /* ... */
}
[data-theme='dark'] {
  /* 仅覆盖 10 项核心角色变量（var.md §7），别名经 var() 自动联动 */
  --color-primary: #5B7DB1; /* ... */
}
```

## 4. 接口契约（Interface Contracts）

### 4.1 theme store 契约

| 成员 | 签名 | 行为 |
|---|---|---|
| `theme` | `Ref<ThemeMode>` | 初始值读 localStorage `theme`（白名单外回退 `system`）；变更时 watch 写回 localStorage |
| `resolvedTheme` | `ComputedRef<ResolvedTheme>` | `system` → `systemPrefersDark`（matchMedia 实时值）；`light/dark` → 原值 |
| `setTheme(mode)` | `(mode: ThemeMode) => void` | 设置三态；watch(resolvedTheme) 随即写 `documentElement.dataset.theme` |
| `toggleTheme()` | `() => void` | `resolvedTheme === 'dark' ? setTheme('light') : setTheme('dark')`（显式覆盖 system） |
| `init()` | `() => void` | 幂等：同步当前解析结果到 DOM + 注册 matchMedia `change` 监听（更新 `systemPrefersDark`） |

### 4.2 首屏防闪烁脚本契约（index.html）

- 位置：`<head>` 内联脚本，先于 `/src/main.ts` 模块执行、先于 body 渲染。
- 逻辑：读 localStorage `theme` → 白名单校验（`light/dark/system`，否则 `system`）→ `system` 时取 `matchMedia('(prefers-color-scheme: dark)').matches` → 写 `documentElement.dataset.theme = 'dark' | 'light'`。
- 异常：localStorage 读取抛错（隐私模式等）时 catch 回退 `system`，不阻断首屏。

### 4.3 CSS 变量契约（default / dark）

色值单一来源为父工程 `var.md`；本工程 `src/style.css` 手工映射（var.md §9：CSS 原样 `--color-*`）。

| 角色变量 | default（破茧亮色） | dark（护眼暗色） |
|---|---|---|
| `--color-primary` | `#3B5998` | `#5B7DB1` |
| `--color-accent` | `#E8923C` | `#E8923C` |
| `--color-success` | `#4AA878` | `#7BC49A` |
| `--color-danger` | `#D94E3C` | `#E0705F` |
| `--color-bg` | `#F7F5F0` | `#1A1C1E` |
| `--color-surface` | `#FFFFFF` | `#26282B` |
| `--color-text` | `#292522` | `#E8E4DE` |
| `--color-text-secondary` | `#6E6A65` | `#A8A29A` |
| `--color-border` | `#D9D4CC` | `#3A3A38` |
| `--color-disabled` | `#EEECE6` | `#2E3033` |


## 5. 实现策略（Implementation Strategy）

### 5.1 样式变量与暗色皮肤（src/style.css）

- 原 10 色彩名变量改写为别名：`--indigo: var(--color-primary)` … `--frost: var(--color-disabled)`，变量名与引用方（各页面 `var(--indigo)` 等）零改动。
- `:root` 块之后新增 `[data-theme='dark']` 块，仅覆盖 10 项核心角色变量（var.md §7）；同特异性（0,1,0）下依赖源码顺序后置生效。
- 原硬编码衍生色改为经 `color-mix` 从角色变量派生，保证两套皮肤行为一致：`.btn-primary:hover` / `.btn-accent:hover`（基础色 85% + 黑 15%）、`.form-input:focus` / `.form-input.error:focus` 焦点圈（基础色 15% + 透明）、`.btn-wechat` 改用 `var(--color-wechat)`（值不变，收敛为角色变量）。

### 5.2 三态主题 store（src/stores/theme.ts）

- Pinia composition store，风格对齐 `stores/user.ts`（ref + 显式函数 + 返回暴露）。
- 持久化：手动 `localStorage.getItem/setItem`（键 `theme`），与 user store 的 token 持久化方式一致；未引入 `@vueuse/core` 的 `useStorage`（见 §8 已知缺口）。
- 响应式联动：`watch(resolvedTheme, applyTheme)` 保证三态变化、系统深浅色变化均即时写 DOM；`watch(theme, persist)` 保证每次选择都落盘。
- 系统跟随：`init()` 注册 `matchMedia` 的 `change` 监听，仅更新 `systemPrefersDark`；是否生效由 `resolvedTheme` 按当前三态自然决定（`light/dark` 显式选择下系统变化不打扰用户）。

### 5.3 首屏防闪烁（index.html）

- `<head>` 内联 IIFE（不依赖任何模块），在 `<div id="app">` 渲染前设置 `data-theme`；与 store 共享持久化键、白名单与解析规则（spec FR-005-031）。

### 5.4 应用挂载（src/main.ts）

- `app.use(createPinia())` 之后调用 `useThemeStore().init()`：同步当前主题到 DOM（与内联脚本结果一致，幂等），并启动系统跟随监听。

### 5.5 登录页切换按钮（src/views/LoginPage.vue）

- 模板：`.login-page` 内首个子元素插入 `<button class="theme-toggle">`，emoji 以 `aria-hidden` span 包裹，可访问名称取 i18n key `common.theme.toggle`。
- 行为：`@click="themeStore.toggleTheme()"`；图标按 `resolvedTheme` 渲染（dark → ☀️，light → 🌙）。
- 样式：绝对定位 `top/right: var(--space-lg)`，44×44px 圆形，`var(--white)` 底 + `var(--silver)` 描边 + `var(--shadow-card)`，hover 描边转靛青、active 轻微缩放；`.login-page` 补 `position: relative`。按钮位于卡片外右上角，不遮挡表单控件。

### 5.6 个人中心「切换主题」（src/views/ProfilePage.vue）

- 「个人信息」区下新增「偏好设置」卡片（i18n key `auth.profile.sectionPreferences`），两行：
  1. 「切换语言」行：`<select>` 绑定 `useI18n().locale`，选项来自 `@/lang` 导出的 `LANG_OPTIONS`，`@change` 调 `setLanguage()`——与 AppLayout 顶栏共享同一 i18n 实例与持久化键 `language`。
  2. 「切换主题」行（紧邻其下）：`<select>` 绑定 `themeStore.theme`，三选项取 i18n key `common.theme.light/dark/system`，`@change` 经白名单收窄后调 `themeStore.setTheme()`。
- `LANG_OPTIONS` 由 `src/lang/index.ts` 统一导出，AppLayout 改为导入复用（消除原组件内重复定义）。
- 样式复用 `.info-row` 行分隔模式（`.pref-row`），下拉宽度自适应（`.pref-select`），label 以 `for` 关联控件。

### 5.7 文案语料（父工程 i18n/ + src/lang/）

- 新增 7 key 录入父工程语料单一事实源：`i18n/common/{zh-CN,en-US,zh-TW}.json`（`common.theme`、`common.theme.light/dark/system/toggle`）与 `i18n/app/{zh-CN,en-US,zh-TW}.json`（`auth.profile.sectionPreferences`、`auth.profile.switchLanguage`）。
- `verify-i18n.mjs` 校验通过后，按 `sync-i18n.mjs` 的 `writeWebVue` 逻辑重生成 `src/lang/{zh-CN,en-US,zh-TW}.ts`（各 221 key）；本轮未执行全量 sync，避免连带重写 tpl-app-harmony / tpl-app-mini 产物（见 §8）。

## 6. 测试考虑（Testing Considerations）

- As-Built：项目无测试框架（无 vitest/jest），`vue-tsc -b` + `vite build` 为编译期保障（本轮均通过，exit 0）。
- 手工回归场景：AS-001~AS-008（对应 spec.md 验收场景）与 test-cases.md TC-005-001~022。
- 关键覆盖点：登录页按钮两态切换与图标映射、个人中心三态选择、两入口状态同步、localStorage 持久化与非法值回退、system 态 matchMedia 实时联动、首屏防闪烁、暗色视觉（品牌识别度/对比度）、既有页面亮色零回归。

## 7. 文件清单（File Inventory）

| 文件 | 职责 | 关联需求 |
|---|---|---|
| `src/style.css` | 角色变量 + 别名 + dark 皮肤 + 衍生色 color-mix 化 | FR-005-020~024 |
| `src/stores/theme.ts` | 三态状态、持久化、系统跟随、DOM 落点 | FR-005-025~029 |
| `index.html` | 首屏防闪烁内联脚本 | FR-005-030/031 |
| `src/main.ts` | `useThemeStore().init()` 挂载 | FR-005-027/028 |
| `src/views/LoginPage.vue` | 右上角圆形 emoji 切换按钮 | FR-005-032~035 |
| `src/views/ProfilePage.vue` | 「偏好设置」区：切换语言 + 切换主题 | FR-005-036~038 |
| `src/lang/index.ts` | `LANG_OPTIONS` 统一导出 | FR-005-036 |
| `src/components/AppLayout.vue` | 改为导入 `LANG_OPTIONS`（去重） | FR-005-036 |
| `src/lang/{zh-CN,en-US,zh-TW}.ts` | 语料新增 7 key（各 221 key） | FR-005-041 |
| `../i18n/common/*.json`、`../i18n/app/*.json`（父工程） | 新增 7 key 事实源 | FR-005-041 |

## 8. 已知缺口（Known Gaps）

- **useStorage 等价实现**：父工程 plan.md §4.2 提及 `useStorage('theme', 'system')`（@vueuse/core）；本工程未引入该依赖，以「手动 localStorage 读写 + watch」等价实现（与 `stores/user.ts` 既有风格一致），行为契约不变。
- **全量语料 sync 未执行**：7 个新 key 已录入父工程语料并手工同步到本工程 `src/lang/`（与 sync 产物格式一致）；未运行 `sync-i18n.mjs` 全量同步，避免连带重写 tpl-app-harmony / tpl-app-mini 产物，下次全端同步时自然对齐。
- **遗留可访问性项**：`document.documentElement.lang` 未随语言切换同步（004-i18n 遗留缺口，本模块未扩大处理）。
- **遮罩颜色**：ProfilePage `.modal-mask` 遮罩为固定半透明深色，两套皮肤下均适用，未令牌化。
- 无测试框架、无 lint（沿用工程现状）。
