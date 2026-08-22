# 001-app-shell 技术方案 — 应用外壳与基础设施

> 文档类型：As-Built（如实记录当前代码实现，非目标设计）
> 模块编号：001-app-shell
> 对应规格：`specs/001-app-shell/spec.md`（需求编号 FR-001-xxx 在本文件中交叉引用）
> 技术栈：Vue 3.5 + Vite 6 + TypeScript 5.6 + Pinia 2 + Vue Router 4 + Axios 1.7 + lucide-vue-next
> 生成日期：2026-08-12

## 1. 技术上下文 (Technical Context)

### 1.1 运行时依赖（`package.json` → dependencies）

| 依赖 | 版本 | 用途 |
|---|---|---|
| vue | ^3.5.13 | 前端框架（Composition API + `<script setup>`） |
| vue-router | ^4.5.0 | 客户端路由（History 模式） |
| pinia | ^2.3.0 | 全局状态管理 |
| axios | ^1.7.9 | HTTP 客户端 |
| lucide-vue-next | ^0.469.0 | 图标库（`LogOut` 等） |

### 1.2 构建工具链（`package.json` → devDependencies）

| 依赖 | 版本 | 用途 |
|---|---|---|
| vite | ^6.1.0 | 开发服务器与打包 |
| typescript | ~5.6.3 | 类型系统 |
| vue-tsc | ^2.2.0 | Vue SFC 类型检查 |
| @vitejs/plugin-vue | ^5.2.3 | Vite 的 Vue SFC 编译插件 |
| @types/node | ^26.2.0 | Node.js 类型定义（供 vite.config.ts 使用） |

### 1.3 工程配置

- **包管理器**：pnpm（`pnpm-lock.yaml` 存在；`package.json` 中 `"pnpm": { "onlyBuiltDependencies": ["esbuild", "vue-demi"] }`）。项目 `"type": "module"`。
- **脚本**：`dev` → `vite`；`build` → `vue-tsc -b && vite build`（类型检查前置）；`preview` → `vite preview`。
- **vite.config.ts**：`base: '/web/'`；别名 `@ → ./src`（`fileURLToPath(new URL('./src', import.meta.url))`）；dev server `host: '0.0.0.0'`、`port: 5173`；proxy：`/api` 与 `/auth` → `http://localhost:8082`（`changeOrigin: true`）。
- **tsconfig.app.json**：`target: ES2020`、`module: ESNext`、`lib: [ES2020, DOM, DOM.Iterable]`、`moduleResolution: bundler`、`isolatedModules: true`、`moduleDetection: force`、`noEmit: true`、`jsx: preserve`、`strict: true`、`noUnusedLocals: true`、`noUnusedParameters: true`、`noFallthroughCasesInSwitch: true`、`noUncheckedSideEffectImports: true`、`paths: { "@/*": ["./src/*"] }`。
- **index.html**：`<html lang="zh-CN">`，`<title>tpl-workspace</title>`，内联 SVG favicon（`data:image/svg+xml`），viewport `width=device-width, initial-scale=1.0, viewport-fit=cover`，挂载点 `<div id="app">`，入口 `<script type="module" src="/src/main.ts">`。

## 2. 宪法符合性 (Constitution Compliance)

对照 `specs/constitution.md` 逐条核对本模块：

| 宪法约定 | 结论 | 代码证据 |
|---|---|---|
| `.vue` PascalCase / `.ts` camelCase / CSS kebab-case 命名 | ✅ | `AppLayout.vue`、`main.ts`、`router/index.ts`、`api/index.ts`、`.app-layout`、`.form-input`、`.btn-primary` |
| Feature 化目录组织 | ✅ | `src/components/`、`src/router/`、`src/api/`、根级 `App.vue` / `main.ts` / `style.css` |
| 路径别名 `@/` → `src/` 双端声明 | ✅ | `vite.config.ts`（`resolve.alias`）与 `tsconfig.app.json`（`paths`）均声明；全部 import 使用别名 |
| Composition API + `<script setup lang="ts">` 三段式组件 | ✅ | `AppLayout.vue`（template → script setup → style scoped） |
| slot 组合布局 | ✅ | `AppLayout.vue` 提供 `<slot />` |
| lucide-vue-next 图标、无 UI 库 | ✅ | `AppLayout.vue` 引入 `LogOut`；`package.json` 无任何 UI 库 |
| TS 全面严格检查 + 构建前置类型检查 | ✅ | `tsconfig.app.json` `strict` + `noUnused*`；`build` 脚本 `vue-tsc -b && vite build` |
| API 显式 interface、响应统一包装 | ✅ | `api/index.ts`：`ApiResponse<T> = { code; msg; data }` |
| 纯 CSS Design Tokens 于 `:root` | ✅ | `style.css`：10 色 / 3 字体栈 / 8 级间距(4px 基准) / 4 级圆角 / 2 阴影 / 7 级字号 / 2 缓动 |
| 共享工具类 + scoped 组件样式 | ✅ | `style.css`（`.page/.card/.form-input/.btn*/.skeleton/.toast`）；组件 `<style scoped>` |
| 可访问性（`:focus-visible`、reduced-motion） | ✅ | `style.css` 末尾两段 |
| Pinia 全局状态、token 持久化于 localStorage（key `'token'`） | ✅ | `main.ts` `app.use(createPinia())`；`stores/user.ts`（本模块消费 `useUserStore`） |
| 集中式 axios 单例 + 拦截器 | ✅ | `api/index.ts` |
| 路由 History 模式 `createWebHistory('/web/')` + 懒加载 + meta 权限 + beforeEach 守卫 | ✅ | `router/index.ts` |
| 401 自动清 token 并跳登录页；logout 用 try/finally 清理 | ✅ | `api/index.ts`；`stores/user.ts`（被 `AppLayout.vue` 调用） |

全局缺口（非本模块范围，`TECH.md` / `overall-plan.md` 已记录）：无测试框架、无 lint、无日志封装、无 CI。

## 3. 数据模型 (Data Model)

本模块无业务实体，但定义以下**基础设施类型契约**：

### 3.1 统一响应包装（`src/api/index.ts`）

```ts
export interface ApiResponse<T = unknown> {
  code: number      // 业务码，200 为成功
  msg: string       // 业务消息
  data: T           // 数据载荷
}
```

### 3.2 本地存储键

- `localStorage['token']`：会话凭据原始值（As-Built 事实：**无 `Bearer ` 前缀**，直接注入 `Authorization` header）。

### 3.3 路由 meta 契约（`src/router/index.ts`）

| 字段 | 类型 | 语义 |
|---|---|---|
| `meta.guest` | `boolean` | 仅未登录可访问（Login/Register） |
| `meta.requiresAuth` | `boolean` | 需登录（Profile） |
| `query.redirect` | `string` | 守卫写入的原目标路径（`to.fullPath`），登录成功后回跳 |

### 3.4 设计令牌结构（`src/style.css` `:root`）

- **色彩（10）**：`--indigo #3B5998`（主色）、`--gold #E8923C`（CTA）、`--verdigris #4AA878`（成功）、`--cinnabar #D94E3C`（错误）、`--paper #F7F5F0`（页面背景）、`--white #FFFFFF`（卡片/输入背景）、`--ink #292522`（正文）、`--inkstone #6E6A65`（次级文字）、`--silver #D9D4CC`（边框）、`--frost #EEECE6`（禁用/骨架）。
- **字体栈（3）**：`--font-sans`（PingFang SC / HarmonyOS Sans / Microsoft YaHei / Noto Sans SC）、`--font-mono`（JetBrains Mono / Fira Code / SF Mono / Consolas）、`--font-number`（DIN Alternate / Arial Rounded MT Bold）。
- **间距（8，4px 基准）**：`--space-xs 4px`、`--space-sm 8px`、`--space-md 12px`、`--space-lg 16px`、`--space-xl 24px`、`--space-2xl 32px`、`--space-3xl 48px`、`--space-4xl 64px`。
- **圆角（4）**：`--radius-sm 6px`、`--radius-md 8px`、`--radius-lg 12px`、`--radius-pill 24px`。
- **阴影（2）**：`--shadow-card`（0 1px 3px rgba(0,0,0,.06)）、`--shadow-card-hover`（0 2px 8px rgba(0,0,0,.10)）。
- **字号（7）**：`--text-display 2rem`、`--text-h1 1.5rem`、`--text-h2 1.25rem`、`--text-h3 1.0625rem`、`--text-body 0.9375rem`、`--text-body-sm 0.8125rem`、`--text-caption 0.6875rem`。
- **缓动（2）**：`--ease-out cubic-bezier(0,0,0.2,1)`、`--ease-in-out cubic-bezier(0.4,0,0.2,1)`。

## 4. 接口契约 (Interface Contracts)

### 4.1 应用引导（`src/main.ts`）

```ts
createApp(App) → app.use(createPinia()) → app.use(router) → app.mount('#app')
```
全局样式在入口以 `import './style.css'` 引入（挂载前加载）。实现 FR-001-001 / FR-001-002。

### 4.2 根组件（`src/App.vue`）

模板仅一行：`<router-view />`。实现 FR-001-002。

### 4.3 外壳组件对外契约（`src/components/AppLayout.vue`）

- **props**：无。
- **默认 slot**：页面内容区（`<main class="app-content"><slot /></main>`）。
- **依赖**：`useRouter()`（vue-router）、`useUserStore()`（`@/stores/user`）、`LogOut`（lucide-vue-next）。
- **行为**：`handleLogout()` → `await userStore.logout()` → `router.push('/login')`。
- **样式要点**：`.app-layout` flex column + `min-height: 100vh`；`.app-header` `position: sticky; top: 0; z-index: 100`，背景 `var(--white)`、下边框 `var(--silver)`；`.app-header-inner` `max-width: 960px; height: 48px`；`.brand` 17px/600/`var(--indigo)`；`.logout-btn`（`.btn.btn-ghost`）36px 高、13px 字号、`aria-label="退出登录"`、`<LogOut :size="18">`；`.app-content` `flex: 1; max-width: 960px; margin: 0 auto`，padding `var(--space-xl) var(--space-lg)`；`@media (max-width: 640px)` 下 padding 降为 `var(--space-lg)`。实现 FR-001-003 / FR-001-004。

### 4.4 路由表与守卫（`src/router/index.ts`）

```ts
const router = createRouter({
  history: createWebHistory('/web/'),
  routes: [
    { path: '/', redirect: '/profile' },
    { path: '/login', name: 'Login', component: () => import('@/views/LoginPage.vue'), meta: { guest: true } },
    { path: '/register', name: 'Register', component: () => import('@/views/RegisterPage.vue'), meta: { guest: true } },
    { path: '/profile', name: 'Profile', component: () => import('@/views/ProfilePage.vue'), meta: { requiresAuth: true } },
  ],
})
```

全局前置守卫 `router.beforeEach`：
1. `to.meta.requiresAuth && !userStore.isLoggedIn` → `next({ name: 'Login', query: { redirect: to.fullPath } })`；
2. `to.meta.guest && userStore.isLoggedIn` → `next({ name: 'Profile' })`；
3. 其余 → `next()`。

实现 FR-001-005 / FR-001-006。守卫在 `useUserStore()` 处读取 Pinia store（`isLoggedIn` computed）。

### 4.5 HTTP 客户端（`src/api/index.ts`）

- 单例：`axios.create({ baseURL: '', timeout: 15000 })`。
- **request 拦截器**：`localStorage.getItem('token')` → 有则 `config.headers.Authorization = token`（As-Built：原始值，无 Bearer 前缀）。
- **response 拦截器（成功分支）**：
  - `data.code !== 200`：若 `code === 401` → `localStorage.removeItem('token')` + `window.location.href = '/login'`；随后 `reject(new Error(data.msg || '请求失败'))`；
  - `code === 200` → 返回 `data.data`（解包后的业务数据）。
- **response 拦截器（错误分支）**：
  - `error.response?.status === 401` → 清 token + `window.location.href = '/login'`；
  - 消息优先级：`error.response?.data?.msg || error.message || '网络错误'` → `reject(new Error(message))`。

实现 FR-001-012 / FR-001-013 / FR-001-014。

**As-Built 已知事实**：
- 401 跳转硬编码为 `/login`，未带 `/web/` 前缀（与 `createWebHistory('/web/')` 不一致），见 spec.md [NEEDS CLARIFICATION #1]。
- `Authorization` 注入裸 token，见 spec.md [NEEDS CLARIFICATION #2]。

### 4.6 全局样式层（`src/style.css`）

- **reset**：`box-sizing: border-box` + `margin/padding: 0` 全局；`html` 禁用移动端字号缩放；`body` 应用 `--paper` 背景、`--ink` 文字、`--font-sans`、15px、line-height 1.6、`min-height: 100vh`、抗锯齿；`a` 继承色去下划线；`img` 最大宽度块级；`button` 无边框无背景继承字体；`input/select/textarea` 继承字体。
- **通用类**：`.page`（960px 居中）、`.card`（白底/`--radius-md`/`--shadow-card`）、`.form-input`（40px 高、`:focus` 主色边框 + `rgba(59,89,152,.15)` 焦点环、`.error` 边框 `--cinnabar`、`select.form-input` 用内联 data-URI SVG 自定义箭头）、`.btn` 及 `.btn-primary`（indigo）/`.btn-accent`（gold + pill）/`.btn-ghost`（transparent + hover `--frost`）/`.btn-lg`（48px）/`.btn-full`（width 100%）/`:disabled`（opacity .6 + not-allowed）/`.btn:active`（scale .97）、`.skeleton`/`.skeleton-line`（`--frost`）、`.toast`/`.toast-success`/`.toast-error`（fixed top 居中、`z-index 9999`、`slideUp 250ms var(--ease-out)`）。
- **动画**：`@keyframes fadeIn`、`slideUp`（+8px 位移）、`spin`。
- **可访问性**：`:focus-visible { outline: 2px solid var(--indigo); outline-offset: 2px; }`；`@media (prefers-reduced-motion: reduce)` 将 animation/transition 时长压至 0.01ms 并禁止循环。

实现 FR-001-007 ~ FR-001-011。

### 4.7 构建与部署契约（`vite.config.ts` / `index.html` / `tsconfig.app.json`）

- `base: '/web/'` 与 `createWebHistory('/web/')` 对齐（FR-001-015）。
- dev proxy `/api`、`/auth` → `http://localhost:8082`（FR-001-016）。
- `index.html`：`lang="zh-CN"`、`<title>tpl-workspace</title>`、内联 SVG favicon、viewport 含 `viewport-fit=cover`（FR-001-017）。
- 严格类型门禁与 `vue-tsc -b && vite build`（FR-001-018）。

## 5. 实现策略 (Implementation Strategy)

本模块为 As-Built 基础设施，各文件当前实现即最终策略：

1. **引导顺序**（`main.ts`）：样式 → Pinia → Router → mount。任何业务模块不得在引导前访问 store/router（FR-001-001）。
2. **外壳组合模式**：业务页面（如 `ProfilePage.vue`）在模板中包裹 `<AppLayout>`，内容放入默认 slot；退出逻辑收敛于 `userStore.logout()`（try/finally 保证本地清理）后统一 `router.push('/login')`（FR-001-003/004）。
3. **访问控制集中化**：所有鉴权收敛于单一 `router.beforeEach`，页面自身不重复鉴权；`meta.guest` / `meta.requiresAuth` 为声明式契约；`redirect` query 实现回跳（FR-001-005/006）。
4. **令牌驱动样式**：组件样式一律取 `var(--*)` 令牌，`<style scoped>` 隔离；全局工具类仅定义一次，禁止业务组件重复造轮子（FR-001-007~011）。
5. **统一请求出口**：业务代码不得直接 `axios()`，一律经 `api/*` 模块 → 单例 `service`，由拦截器统一处理凭据/解包/401/错误（FR-001-012~014）。
6. **部署对齐**：`base`、router history base、生产代理前缀三者必须保持一致（FR-001-015~017）。

## 6. 测试考虑 (Testing Considerations)

**现状（As-Built）**：项目无测试框架（`package.json` 无 `test` 脚本，devDependencies 无 vitest/jest/cypress）。当前质量保障依赖编译期：
- `vue-tsc -b`（`strict` + `noUnusedLocals`/`noUnusedParameters`）在构建前执行。

**若未来引入测试，本模块建议覆盖点**：
- 路由守卫三分支：未登录访问 `requiresAuth` → `Login` + `redirect` query；已登录访问 `guest` → `Profile`；其余放行。
- axios 拦截器：token 注入；`code !== 200` reject `Error(msg)`；业务码 401 清 token + 跳转；HTTP 401 同样处理；`code === 200` 返回 `data.data`；兜底消息链路。
- `AppLayout` 退出：`userStore.logout()` 被调用 + `router.push('/login')`。
- 手工验收：对应 spec.md AC-001-01 ~ AC-001-10。

## 7. 文件清单 (File Inventory)

| 文件（绝对路径） | 职责 | 对应需求 |
|---|---|---|
| `D:\tpl-workspace\tpl-app-web\src\main.ts` | 应用引导（Pinia + Router + mount） | FR-001-001 |
| `D:\tpl-workspace\tpl-app-web\src\App.vue` | 根组件（`<router-view />`） | FR-001-002 |
| `D:\tpl-workspace\tpl-app-web\src\components\AppLayout.vue` | 应用外壳（sticky 顶栏 + slot + 退出） | FR-001-003 / FR-001-004 |
| `D:\tpl-workspace\tpl-app-web\src\router\index.ts` | 路由表 + 全局鉴权守卫 | FR-001-005 / FR-001-006 |
| `D:\tpl-workspace\tpl-app-web\src\style.css` | 设计令牌 + reset + 工具类 + 动画 + 可访问性 | FR-001-007 ~ FR-001-011 |
| `D:\tpl-workspace\tpl-app-web\src\api\index.ts` | axios 单例 + `ApiResponse<T>` + 双拦截器 | FR-001-012 / FR-001-013 / FR-001-014 |
| `D:\tpl-workspace\tpl-app-web\vite.config.ts` | `base /web/`、`@` 别名、dev proxy | FR-001-015 / FR-001-016 |
| `D:\tpl-workspace\tpl-app-web\index.html` | HTML 宿主（zh-CN / title / #app / favicon / viewport） | FR-001-017 |
| `D:\tpl-workspace\tpl-app-web\tsconfig.app.json` | 严格类型门禁与 `@/*` 路径映射 | FR-001-018 |
| `D:\tpl-workspace\tpl-app-web\package.json` | 依赖版本、脚本、pnpm 配置 | FR-001-018 |

**本模块直接消费的外部文件（不在本模块范围内）**：`src/stores/user.ts`（`useUserStore`，认证状态与 `logout` action，属 001-user-auth）；`src/views/LoginPage.vue`、`src/views/RegisterPage.vue`、`src/views/ProfilePage.vue`（懒加载路由目标）。

## 8. 已知缺口与注意事项 (Known Gaps / As-Built)

> 以下均为当前代码实测事实，不属于目标设计，供后续修正参考：

- **401 跳转路径**：`api/index.ts` 中 401 跳转硬编码 `window.location.href = '/login'`，未带 `/web/` 前缀，与路由 base 不一致；若生产仅以 `/web/` 暴露前端页面，该跳转会路径不匹配（对应 spec.md 澄清 #1）。
- **Authorization 头**：request 拦截器注入的是 token 原始值，无 `Bearer ` 前缀（对应 spec.md 澄清 #2）。
- **外壳复用范围**：`AppLayout.vue` 当前仅被 `ProfilePage.vue` 使用，未强制所有需登录页面复用（对应 spec.md 澄清 #3）。
- **认证态判定**：守卫仅依据 `isLoggedIn`（token 是否存在），不校验 token 有效性；刷新页面后 `userInfo` 初始为 null，不主动拉取。
- **全局缺口**（非本模块范围）：无测试框架、无 lint/prettier、无日志/错误上报、无 CI。