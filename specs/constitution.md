# tpl-app-web 项目规范 (Constitution)

> 项目：tpl-app-web（tpl-workspace网页端）
> 技术栈：Vue 3 + Vite + TypeScript 前端工程
> 文档性质：As-Built 描述性文档 — 本文档从现有代码中提取约定，记录代码库实际遵循的原则
> 生成日期：2026-08-12

## 1. 编码规范 (Coding Conventions)

### 1.1 命名 (Naming)

代码库遵循以下命名约定：
- **`.vue` 文件使用 PascalCase**：`LoginPage.vue`、`RegisterPage.vue`、`ProfilePage.vue`、`AppLayout.vue`、`App.vue`
- **`.ts` 文件使用 camelCase / 小写**：`main.ts`、`vite.config.ts`、`api/index.ts`、`api/auth.ts`、`api/profile.ts`、`router/index.ts`、`stores/user.ts`
- **CSS 类名使用 kebab-case**：`.form-input`、`.btn-primary`、`.app-layout`、`.hero-card`、`.captcha-row`
- **API 函数命名**：`xxxApi` 后缀（`loginApi`、`registerApi`、`getCaptchaApi`、`logoutApi`、`getOverviewApi`）
- **类型接口命名**：`XxxParams`（请求参数）、`XxxResult`（返回结果）：`LoginParams`、`LoginResult`、`RegisterParams`、`CaptchaResult`、`OverviewResult`
- **Pinia store 命名**：`useXxxStore`（`useUserStore`），导出接口如 `UserInfo`

### 1.2 文件组织 (File Organization)

代码库按功能划分目录（feature-based grouping）：
- `src/api/` — HTTP 请求层（`index.ts` 为 axios 实例，`auth.ts`、`profile.ts` 为业务模块）
- `src/views/` — 路由页面级组件
- `src/components/` — 可复用组件（`AppLayout.vue`）
- `src/stores/` — Pinia store（`user.ts`）
- `src/router/` — 路由配置（`index.ts`）
- 根级：`src/App.vue`（仅 `<router-view />`）、`src/main.ts`（应用入口）、`src/style.css`（全局样式与设计令牌）

### 1.3 路径别名 (Path Alias)

- `@/` 映射到 `src/`。在 `tsconfig.app.json`（`"paths": { "@/*": ["./src/*"] }`）与 `vite.config.ts`（`resolve.alias`）中重复声明。
- 所有源码 import 均使用别名，如 `import { useUserStore } from '@/stores/user'`。

### 1.4 组件风格 (Component Style)

- 所有组件使用 **Composition API + `<script setup lang="ts">`**。
- 组件结构固定为三段式：`<template>` → `<script setup lang="ts">` → `<style scoped>`。
- 页面级组件通过组合 `useRouter` / `useRoute` / `useUserStore` 管理逻辑。
- 布局通过 slot 组合：`AppLayout.vue` 提供 `<slot />`，页面组件作为其子内容包裹。

### 1.5 图标 (Icons)

- 使用 `lucide-vue-next` 图标库（`User`、`Lock`、`ShieldCheck`、`BookOpen`、`LogOut`），无其他 UI 框架。

## 2. TypeScript 严格性 (TypeScript Strictness)

代码库在 `tsconfig.app.json` 中开启全面严格检查：
- `"strict": true`
- `"noUnusedLocals": true`、`"noUnusedParameters": true`
- 另有 `noFallthroughCasesInSwitch`、`noUncheckedSideEffectImports`、`isolatedModules`、`moduleDetection: force`
- 构建命令为 `vue-tsc -b && vite build`，即 **构建前先执行完整类型检查**。

类型使用约定：
- **API 参数与返回结果使用显式 interface**：请求参数（`LoginParams`、`RegisterParams`）与返回结果（`LoginResult`、`CaptchaResult`、`OverviewResult`、`ApiResponse<T>`）均有显式类型定义。
- **响应统一包装**：全局响应类型 `ApiResponse<T> = { code: number; msg: string; data: T }`。
- **reactive 状态显式泛型**：`ref<string | null>`、`ref<UserInfo | null>`、`ref<OverviewResult | null>`；表单用 `reactive({ ... })` 字面量推断。
- **store 导出具名接口**：`UserInfo` 定义于 `src/stores/user.ts` 并导出，供页面消费。
- **错误捕获统一为 `catch (e: unknown)` + `e instanceof Error ? e.message : '...'` 模式**。

## 3. 样式方案 (Styling Approach)

代码库使用**纯 CSS + scoped 样式**，不引入任何 CSS 框架：
- 全局样式集中在 `src/style.css`（reset + 令牌 + 工具类），组件内一律 `<style scoped>`。
- **设计令牌 (Design Tokens)**：全部 CSS 自定义属性定义在 `:root`：
  - 色板：`--indigo`（主色 `#3B5998`）、`--gold`（CTA `#E8923C`）、`--verdigris`（成功）、`--cinnabar`（错误）、`--paper`（页面背景）、`--ink`/`--inkstone`（文字）、`--silver`/`--frost`（边框/禁用）
  - 字体栈：`--font-sans`（PingFang SC, HarmonyOS Sans, Microsoft YaHei）、`--font-mono`、`--font-number`
  - 间距（4px 基数）：`--space-xs` 至 `--space-4xl`
  - 圆角：`--radius-sm/md/lg/pill`；阴影：`--shadow-card`、`--shadow-card-hover`
  - 字号阶梯：`--text-display` 至 `--text-caption`
  - 过渡曲线：`--ease-out`、`--ease-in-out`
- **共享工具类**：`.page`、`.card`、`.form-input`（含 `:focus`、`.error`、`select` 变体）、`.btn` / `.btn-primary` / `.btn-accent` / `.btn-ghost` / `.btn-lg` / `.btn-full`、`.skeleton` / `.skeleton-line`、`.toast` / `.toast-success` / `.toast-error`
- **可访问性**：`:focus-visible` 全局焦点环；`@media (prefers-reduced-motion: reduce)` 关闭动画
- **响应式**：`@media (max-width: 640px)` 断点；动画使用 `@keyframes fadeIn` / `slideUp` / `spin`

## 4. 状态管理 (State Management)

- 全局状态使用 **Pinia**（`src/main.ts` 中 `app.use(createPinia())`）。
- Store 使用 **composition 风格**：`defineStore('user', () => { ... })`（setup 函数形式）。
- **Token 持久化在 `localStorage`**：键名为 `'token'`。初始化时从 `localStorage.getItem('token')` 恢复；`setToken`/`clearToken` 同步读写 localStorage。
- **Store actions 封装 API 调用**：`login` → `loginApi`，`register` → `registerApi`，`fetchCaptcha` → `getCaptchaApi`，`logout` → `logoutApi`（且 `logout` 用 `try/finally` 保证无论成败都清理 token 与用户信息）。
- 派生状态使用 `computed`：`isLoggedIn = computed(() => !!token.value)`。

## 5. API 层 (API Layer)

- **集中式 axios 实例**：`src/api/index.ts` 通过 `axios.create({ baseURL: '', timeout: 15000 })` 创建单例 `service`。
- **请求拦截器注入 token**：从 `localStorage` 直接读取 `token`，设置 `config.headers.Authorization = token`（注意：原始 token 直传，未加 `Bearer` 前缀）。
- **响应拦截器统一解包与错误处理**：
  - 业务码 `code !== 200` 时 reject `new Error(data.msg || '请求失败')`；
  - 业务码 `code === 401` 或 HTTP 状态 401 时：清除 localStorage token 并 `window.location.href = '/login'`（自动跳转登录）；
  - 成功时直接返回解包后的 `data.data`（业务数据）。
- **错误以 `Error` 实例向上抛**，由调用方（view/store）捕获展示 message。

## 6. 路由 (Routing)

- 使用 `createWebHistory('/web/')`，与 `vite.config.ts` 的 `base: '/web/'` 一致。
- **全部路由懒加载**：`component: () => import('@/views/XxxPage.vue')`。
- **meta 权限标记**：`meta: { guest: true }`（仅未登录可访问）、`meta: { requiresAuth: true }`（需登录）。
- **全局守卫 `beforeEach`**：
  - 访问 `requiresAuth` 页面但未登录 → 跳 `/login` 并携带 `query.redirect` 回跳参数；
  - 已登录用户访问 `guest` 页面 → 跳 `/profile`；
  - `/` 重定向到 `/profile`。

## 7. 安全实践 (Security)

- **JWT token 存储于 localStorage**，并通过请求拦截器附加到 `Authorization` 头。
- **登录/注册均带图形验证码**：`CaptchaResult { captchaEnabled, uuid, img }` 由 `GET /auth/code` 提供；`captchaEnabled` 为 false 时隐藏验证码输入；点击验证码图片可刷新；提交时携带 `code` + `uuid`。
- **客户端密码确认校验**：注册页 `passwordMismatch` computed 实时校验两次密码一致。
- **客户端必填校验**：登录/注册提交前校验必填字段与验证码，缺失时提示中文错误信息。
- **登出清理**：`logout` 调后端后 `finally` 中清空 token 与本地用户信息。
- **自动会话失效**：任意请求返回 401 时自动清理 token 并重定向登录页。

---

## 8. 文档分工治理规则（与父工程对齐）

> 本节遵循父工程宪法 `../../specs/constitution.md` 第四章「文档分工治理规则」定义的文档分工契约。本工程 MUST 遵守以下规则：

1. **模块编号对齐**：本工程模块编号 MUST 与父工程模块编号对齐（同一产品功能跨工程使用一致编号，如 002-user-auth、101-profile）。
2. **父工程侧重需求规格**：产品功能需求的权威定义在父工程 `spec.md`，本工程 `spec.md` 不重复编写需求。
3. **父工程 plan 侧重实现逻辑**：父工程 `plan.md` 描述跨工程实现逻辑，本工程 `plan.md` 不重复。
4. **本工程侧重落地实现**：本工程规范文档 MUST 重点描述功能在本工程的落地实现，核心文档是 `plan.md` 与 `test-cases.md`。
5. **本工程 spec 引用父工程**：本工程 `spec.md` SHOULD 引用父工程对应 `spec.md`，再补充本工程必要的特有规格。