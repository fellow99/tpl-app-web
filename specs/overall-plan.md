# tpl-workspace网页端（tpl-app-web）总体技术方案

> 文档类型：As-Built（如实记录当前代码状态，非目标设计）
> 对应文档：`overall-spec.md`（需求侧）
> 最后核对：以当前工作区代码为准

## 1. 技术上下文（Technical Context）

- 运行环境：浏览器端 SPA（Single Page Application），以 `/web/` 为 base path（context path）提供服务
- 路由模式：HTML5 History 模式，`createWebHistory('/web/')`
- 包管理器：pnpm（存在 `pnpm-lock.yaml`；`package.json` 中 `pnpm.onlyBuiltDependencies` 声明 esbuild、vue-demi）
- Node 模块类型：`"type": "module"`

### 1.1 运行时依赖（dependencies）

| 依赖 | 版本 | 用途 |
|---|---|---|
| vue | ^3.5.13 | 前端框架（Composition API + `<script setup>`） |
| vue-router | ^4.5.0 | 客户端路由 |
| pinia | ^2.3.0 | 全局状态管理 |
| axios | ^1.7.9 | HTTP 客户端 |
| lucide-vue-next | ^0.469.0 | 图标库 |

### 1.2 构建工具链（devDependencies）

| 依赖 | 版本 | 用途 |
|---|---|---|
| vite | ^6.1.0 | 开发服务器与打包 |
| typescript | ~5.6.3 | 类型系统 |
| vue-tsc | ^2.2.0 | Vue 单文件组件类型检查 |
| @vitejs/plugin-vue | ^5.2.3 | Vite 的 Vue 插件 |
| @types/node | ^26.2.0 | Node.js 类型定义 |

### 1.3 脚本

| 脚本 | 命令 | 说明 |
|---|---|---|
| dev | vite | 启动开发服务器 |
| build | vue-tsc -b && vite build | 类型检查（增量，基于 tsconfig project references）+ 构建 |
| preview | vite preview | 预览构建产物 |

## 2. 宪法符合性检查（Constitution Compliance Check）

> **重要说明（As-Built）**：本仓库中**未找到** `specs/constitution.md`。`specs/` 目录下仅存在空的 feature 目录（`001-user-auth/`、`002-profile/`、`003-app-shell/`），仓库内唯一的 markdown 为 `README.md`。因此无法逐条对照宪法原则，以下依据请求文档中约定的架构原则进行核对；待宪法文件补齐后需逐条复检。

| 约定原则 | 结论 | 依据（代码证据） |
|---|---|---|
| SPA 架构 + Vue 3 Composition API | ✅ 符合 | `main.ts`、`App.vue`、各 view 均使用 `<script setup>` |
| Feature 化目录结构 | ✅ 符合 | `src/` 下按 `api/`、`router/`、`stores/`、`views/`、`components/` 分层；`specs/` 按 feature 编号组织 |
| 集中式 API 层 + 拦截器 | ✅ 符合 | `src/api/index.ts` 统一 axios 实例、请求/响应拦截器 |
| Pinia 管理全局状态 | ✅ 符合 | `src/stores/user.ts`（setup 风格 defineStore） |
| 路由导航守卫 | ✅ 符合 | `src/router/index.ts` 的 `router.beforeEach` |
| 纯 CSS 设计系统 + 设计令牌 | ✅ 符合 | `src/style.css` 以 `:root` CSS Custom Properties 定义 design tokens |
| 类型安全（strict） | ✅ 符合 | `tsconfig.app.json` 开启 `strict`；构建前置 `vue-tsc -b` |
| 测试覆盖 | ❌ 缺失 | 无任何测试框架与 test script |
| 日志 / 可观测性 | ❌ 缺失 | 全仓库无 `console.*` 调用 |
| 代码规范（lint / format） | ❌ 缺失 | 无 eslint / prettier 配置 |

## 3. 实现策略总览（Implementation Strategy Overview）

### 3.1 SPA 架构与启动流程

- 入口 `src/main.ts`：`createApp(App)` → `app.use(createPinia())` → `app.use(router)` → `app.mount('#app')`
- `App.vue` 仅渲染 `<router-view />`，所有页面由路由驱动
- `index.html`：`lang="zh-CN"`，`<title>tpl-workspace</title>`，内联 SVG favicon，挂载点 `#app`

### 3.2 目录结构（As-Built）

```
src/
├── api/
│   ├── index.ts          # axios 实例 + 拦截器 + ApiResponse 统一响应类型
│   ├── auth.ts           # /auth/* 认证接口封装
│   └── profile.ts # /api/profile/* 接口封装
├── components/
│   └── AppLayout.vue     # 应用外壳（顶栏 + 退出登录）
├── router/
│   └── index.ts          # 路由表 + 全局导航守卫
├── stores/
│   └── user.ts           # 用户全局状态（token / userInfo）
├── views/
│   ├── LoginPage.vue     # 登录页
│   ├── RegisterPage.vue  # 注册页
│   └── ProfilePage.vue # 个人中心页
├── App.vue               # 根组件（仅 router-view）
├── main.ts               # 应用入口
├── style.css             # 设计令牌 + 全局样式 + 通用组件类
└── vite-env.d.ts
```

### 3.3 集中式 API 层（`src/api/index.ts`）

- 统一 axios 实例：`baseURL: ''`（同源相对路径），`timeout: 15000`
- 统一响应包装类型：`ApiResponse<T> = { code, msg, data }`
- **请求拦截器**：从 `localStorage.getItem('token')` 读取 token，注入 `config.headers.Authorization`
  - As-Built 事实：注入的是 token **原始值，未加 `Bearer ` 前缀**
- **响应拦截器**（成功分支）：
  - 业务码 `data.code !== 200` 时 reject `Error(msg)`
  - `data.code === 401` 时清除 token 并整页跳转 `/login`
  - 否则返回 `data.data`（解包后的业务数据）
- **响应拦截器**（错误分支）：HTTP 401 同样清 token 并跳转 `/login`；其余错误取 `error.response.data.msg || error.message || '网络错误'` 并 reject `Error`
  - As-Built 事实：跳转路径**硬编码为 `/login`**，未带 `/web/` 前缀，与路由 base 不一致

接口清单（`src/api/auth.ts`、`src/api/profile.ts`）：

| 方法 | 路径 | 说明 | 返回 |
|---|---|---|---|
| POST | /auth/login | 登录 | `{ access_token, token_type }` |
| POST | /auth/register | 注册（username/password + 验证码） | - |
| GET | /auth/code | 图形验证码 | `{ captchaEnabled, uuid, img }` |
| POST | /auth/logout | 退出登录 | - |

### 3.4 Pinia 全局状态（`src/stores/user.ts`）

- 采用 setup 风格 `defineStore('user', ...)`
- **state**：`token`（初始化自 localStorage）、`userInfo`（`{ userId, userName, nickName, phoneNumber, email, birthDate }`，默认 null）
- **getter**：`isLoggedIn = computed(() => !!token.value)`
- **actions**：
  - `login(params)`：调用 `loginApi`，将 `access_token` 写入 state 与 localStorage
  - `register(params)`：调用 `registerApi`
  - `fetchCaptcha()`：调用 `getCaptchaApi`
  - `logout()`：`try { await logoutApi() } finally { clearToken(); userInfo = null }`（无论后端是否成功均本地清理）
  - `setUserInfo` / `setToken` / `clearToken` / `restoreFromStorage`（token 持久化辅助）

### 3.5 路由与导航守卫（`src/router/index.ts`）

路由表（全部 view 使用动态 `import()` 懒加载）：

| path | name | 组件 | meta |
|---|---|---|---|
| / | - | redirect → /profile | - |
| /login | Login | LoginPage.vue | `guest: true` |
| /register | Register | RegisterPage.vue | `guest: true` |
| /profile | Profile | ProfilePage.vue | `requiresAuth: true` |

全局前置守卫 `router.beforeEach` 逻辑：
- `requiresAuth && !isLoggedIn` → 跳转 Login，并以 `query.redirect` 携带原目标路径（登录后回跳）
- `guest && isLoggedIn` → 跳转 `/profile`
- 其余放行

### 3.6 纯 CSS 设计系统（`src/style.css`）

- 在 `:root` 中以 CSS Custom Properties 定义设计令牌（design tokens）：
  - **色彩**：`--indigo #3B5998`（主色）、`--gold #E8923C`（CTA 强调）、`--verdigris #4AA878`（成功/Mastered）、`--cinnabar #D94E3C`（错误）、`--paper #F7F5F0`（页面背景）、`--white`、`--ink #292522`（正文）、`--inkstone #6E6A65`（次级文本）、`--silver #D9D4CC`（边框）、`--frost #EEECE6`（禁用/骨架屏）
  - **字体**：`--font-sans`（PingFang SC / HarmonyOS Sans / Microsoft YaHei / Noto Sans SC）、`--font-mono`、`--font-number`
  - **间距**：4px 基准，`--space-xs`(4) ~ `--space-4xl`(64)
  - **圆角**：`--radius-sm/md/lg/pill`
  - **阴影**：`--shadow-card`、`--shadow-card-hover`
  - **字号**：`--text-display`(2rem) ~ `--text-caption`(0.6875rem)
  - **过渡**：`--ease-out`、`--ease-in-out`
- 全局样式：reset、`.page` 容器、`.card`、`.form-input`（focus / error 态）、`.btn`（primary / accent / ghost / lg / full / disabled）、`:focus-visible` 焦点样式、动画 `fadeIn` / `slideUp` / `spin`、`.skeleton` 骨架屏、`.toast`（success / error）、`prefers-reduced-motion` 降级
- 图标：视图层使用 `lucide-vue-next`（如 `LogOut`、`User`、`Lock`、`ShieldCheck`）
- 组件级样式使用 `<style scoped>`，全局令牌通过变量继承

## 4. 横切关注点（Cross-Cutting Concerns）

### 4.1 错误处理（Error Handling）

- **API 层**：axios 响应拦截器统一将非 200 业务码与网络/HTTP 错误包装为 `Error`；401（业务码或 HTTP 状态）全局处理——清除 token 并整页跳转登录页
- **组件层**：`LoginPage.vue`、`RegisterPage.vue`、`ProfilePage.vue` 中以 `try/catch` 捕获异步错误，将 `Error.message` 展示到页面（如 `errorMsg`），并配合 `loading` 状态防重复提交（如登录失败后自动刷新验证码）
- **Store 层**：`logout()` 使用 `try/finally`，确保后端调用失败时本地登录态仍被清理

### 4.2 认证（Authentication）

- 登录成功后 JWT（`access_token`）写入 `localStorage`（key：`token`）
- 请求拦截器自动注入 `Authorization` header（**无 `Bearer ` 前缀，As-Built 事实**）
- 路由守卫基于 Pinia `isLoggedIn`（即 token 是否存在）控制页面访问；`redirect` query 实现登录后回跳
- 401（业务码或 HTTP 状态）触发清 token + 整页跳转 `/login`（**硬编码路径，未带 `/web/` 前缀，As-Built 事实**）
- 退出登录：`AppLayout.vue` 顶部退出按钮 → `userStore.logout()` → `router.push('/login')`

### 4.3 日志（Logging）

- **尚未实现**：全仓库无 `console.*` 调用、无日志封装、无错误上报服务

## 5. 测试方案（Testing Approach）

- **无测试框架**：未配置 vitest / jest / cypress 等，`package.json` 无 `test` 脚本
- 当前质量保障手段为 **TypeScript strict 模式**（`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`、`noUncheckedSideEffectImports`）与构建前置 `vue-tsc -b` 类型检查，提供编译期安全保障

## 6. 部署策略（Deployment Strategy）

### 6.1 构建

- 命令：`pnpm build`（即 `vue-tsc -b && vite build`），产物输出至 `dist/`
- TypeScript 采用 project references 拆分：`tsconfig.app.json`（src，target ES2020）+ `tsconfig.node.json`（vite.config.ts，target ES2022）
- `vite.config.ts`：`base: '/web/'`，`@` 别名指向 `./src`，插件 `@vitejs/plugin-vue`

### 6.2 开发环境

- `pnpm dev` 启动 Vite 开发服务器：`host: 0.0.0.0`、`port: 5173`
- 开发代理：`/api` 与 `/auth` 代理到 `http://localhost:8082`（`changeOrigin: true`），即 tpl-app-api 后端
- 无环境变量文件（无 `.env`），代理目标在 `vite.config.ts` 中硬编码

### 6.3 生产环境

- 静态资源以 `/web/` 为上下文路径提供服务，所有资源 URL 带 `/web/` 前缀
- 前端 API 全部走同源相对路径（`/api/*`、`/auth/*`），预期由后端统一托管/反向代理 `/web/` 与接口路径
- **注意事项（As-Built）**：API 层 401 跳转硬编码为 `/login`，若后端仅以 `/web/` 暴露前端页面，则该跳转会路径不匹配，需在后续修正

## 7. 已知缺口与后续建议（Gap / 非 As-Built）

> 以下为现状缺口记录，不属于本文档的目标设计，仅供后续工作参考：
- 缺少 `constitution.md` 与 `overall-spec.md`，宪法符合性检查无法逐条完成
- 无测试、无 lint、无日志、无 CI/CD、无 Dockerfile
- `Authorization` header 无 `Bearer ` 前缀；401 跳转路径未带 `/web/` 前缀
- 认证态仅以 token 存在与否判断（`isLoggedIn`），不校验有效性，刷新页面后不主动拉取用户信息（`userInfo` 初始为 null）