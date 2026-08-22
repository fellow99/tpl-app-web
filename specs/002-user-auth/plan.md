# 002-user-auth 模块技术方案（plan.md）

> 模块名称：用户认证模块（User Authentication）
> 所属项目：tpl-app-web（tpl-workspace网页端）
> 文档类型：As-Built 实现方案（如实记录当前代码实现）
> 对应文档：spec.md（功能规格）
> 生成日期：2026-08-12

## 1. 技术上下文（Technical Context）

| 依赖 | 版本 | 用途 |
|---|---|---|
| vue | ^3.5.13 | 前端框架（Composition API + `<script setup>`） |
| vue-router | ^4.5.0 | 路由（`createWebHistory('/web/')`） |
| pinia | ^2.3.0 | 状态管理（setup store） |
| axios | ^1.7.9 | HTTP 客户端 |
| lucide-vue-next | ^0.469.0 | 图标（User, Lock, ShieldCheck, LogOut） |
| vite | ^6.1.0 | 构建与开发服务器（base `/web/`，proxy `/auth` → `:8082`） |
| typescript | ~5.6.3 | 类型系统（strict） |
| vue-tsc | ^2.2.0 | 构建前置类型检查 |

模块文件：
- `src/views/LoginPage.vue` — 登录页（251 行）
- `src/views/RegisterPage.vue` — 注册页（344 行）
- `src/stores/user.ts` — Pinia 认证状态（75 行）
- `src/api/auth.ts` — /auth 接口封装（47 行）
- `src/api/index.ts` — axios 实例 + 拦截器（本模块基础依赖）
- `src/router/index.ts` — 路由表 + 认证守卫
- `src/components/AppLayout.vue` — 退出登录入口（跨模块）

## 2. 宪法符合性检查（Constitution Compliance）

| 宪法约定 | 结论 | 代码证据 |
|---|---|---|
| 1.1 命名 PascalCase / camelCase / xxxApi | ✅ | LoginPage.vue, RegisterPage.vue；auth.ts 的 loginApi/registerApi/getCaptchaApi/logoutApi |
| 1.2 Feature 化目录分层 | ✅ | api/auth.ts, stores/user.ts, views/LoginPage.vue, views/RegisterPage.vue |
| 1.3 @/ 别名 | ✅ | 所有 import 使用 `@/stores/user`、`@/api/auth` |
| 1.4 Composition API + `<script setup lang="ts">` | ✅ | 两个 view 组件均符合 |
| 1.5 lucide-vue-next 图标 | ✅ | User, Lock, ShieldCheck（LoginPage/RegisterPage）；LogOut（AppLayout） |
| 2 TypeScript strict + 显式 interface | ✅ | LoginParams/LoginResult/RegisterParams/CaptchaResult；`catch (e: unknown)` 模式 |
| 3 纯 CSS + scoped + Design Tokens | ✅ | 两个页面 `<style scoped>` 引用 `--indigo`、`--cinnabar` 等令牌 |
| 4 Pinia composition store + localStorage 持久化 | ✅ | `defineStore('user', () => {...})`；token 读写 localStorage key `'token'` |
| 5 集中式 axios + 拦截器注入/解包 | ✅ | api/index.ts 拦截器 |
| 6 路由懒加载 + meta guest/requiresAuth + beforeEach | ✅ | router/index.ts |
| 7 安全：token 存 localStorage、验证码、客户端校验、logout 清理、401 自动登出 | ✅ | 本模块全部文件 |

## 3. 数据模型（Data Model）

来源：`src/api/auth.ts`、`src/stores/user.ts`、`src/api/index.ts`

```ts
// src/api/auth.ts
interface LoginParams { username: string; password: string; code: string; uuid: string }
interface LoginResult { access_token: string; token_type: string }
interface RegisterParams { username: string; password: string; code: string; uuid: string }
interface CaptchaResult { captchaEnabled: boolean; uuid: string; img: string }

// src/api/index.ts
interface ApiResponse<T = unknown> { code: number; msg: string; data: T }

// src/stores/user.ts
interface UserInfo { userId: number; userName: string; nickName: string; phoneNumber: string; email: string; birthDate: string }
```

**Pinia Store 状态（`useUserStore`）**：

| 状态 | 类型 | 初始值 | 说明 |
|---|---|---|---|
| `token` | `ref<string \| null>` | `localStorage.getItem('token')` | JWT token |
| `userInfo` | `ref<UserInfo \| null>` | `null` | 用户资料 |
| `isLoggedIn` | `computed<boolean>` | `!!token.value` | 派生登录态 |

**Actions**：`login` → `loginApi` + `setToken`；`register` → `registerApi`；`fetchCaptcha` → `getCaptchaApi`；`logout` → `logoutApi`（`try/finally` 保证本地清理）

## 4. 接口契约（Interface Contracts）

后端：tpl-app-api（Spring Boot 3.2.5 / Java 17，:8082）

| 前端函数 | Method | Path | 入参 | 出参 | 实现 FR |
|---|---|---|---|---|---|
| `getCaptchaApi` | GET | /auth/code | — | CaptchaResult | FR-002-018/020 |
| `registerApi` | POST | /auth/register | RegisterParams | void | FR-002-001~009 |
| `loginApi` | POST | /auth/login | LoginParams | LoginResult | FR-002-011~017 |
| `logoutApi` | POST | /auth/logout | — | void | FR-002-026 |

响应包装：`ApiResponse<T>`；`code===200` 时拦截器返回解包 `data.data`；`code!==200` 时 reject Error；`code===401` 或 HTTP 401 时清除 token 并 `window.location.href = '/login'`。

请求拦截器：从 `localStorage.getItem('token')` 注入 `Authorization` header（As-Built：原始 token 直传，无 Bearer 前缀）。

## 5. 实现策略（Implementation Strategy）

**调用链**：`views/*.vue` → `stores/user.ts` → `api/auth.ts` → `api/index.ts`（axios）→ 后端

### 5.1 登录流程（LoginPage.vue，251 行）

1. `onMounted` → `refreshCaptcha()` → `userStore.fetchCaptcha()` → 设置 `captchaEnabled`、`captchaImg`、`form.uuid`，清空 `form.code` 与 `errorMsg`
2. 提交 `handleSubmit()`：校验 `username`/`password` 非空（"请填写完整信息"）→ 校验 captcha（"请输入验证码"）→ `loading=true`
3. `userStore.login({...})` → `loginApi()` → `setToken(result.access_token)`
4. 成功：`router.push(route.query.redirect || '/profile')`；失败：`errorMsg` + `refreshCaptcha()` → `finally: loading=false`

### 5.2 注册流程（RegisterPage.vue，344 行）

1. `onMounted` → `refreshCaptcha()`
2. 校验顺序：完整信息（username/password）→ 验证码 → 密码一致性（`passwordMismatch` computed）
3. `userStore.register({...})` → `registerApi()`：成功 → `showSuccess=true`（toast），`setTimeout(2000)` 后 `router.push('/login')`；失败 → `errorMsg` + `refreshCaptcha()`

### 5.3 会话持久化（stores/user.ts，75 行）

- token 初始化自 localStorage；`setToken`/`clearToken` 同步读写 localStorage（key `'token'`）
- `logout()`：`try { await logoutApi() } finally { clearToken(); userInfo = null }` — 服务端失败也保证本地清理

### 5.4 路由守卫（router/index.ts）

- `/login`、`/register` → `meta: { guest: true }`；`/profile` → `meta: { requiresAuth: true }`
- `beforeEach`：`requiresAuth && !isLoggedIn` → `Login?redirect=to.fullPath`；`guest && isLoggedIn` → `Profile`

### 5.5 401 自动失效（api/index.ts）

- 业务码 401 或 HTTP 401：`localStorage.removeItem('token')` + `window.location.href = '/login'`（As-Built：硬编码路径，未带 `/web/` 前缀）

## 6. 测试考虑（Testing Considerations）

- As-Built：项目无测试框架（无 vitest/jest，无 test script），类型检查 `vue-tsc -b` 为唯一编译期保障
- 建议手工回归场景：AS-001~AS-010（对应 spec.md 验收场景）
- 关键覆盖点：正常注册/登录、密码不一致、必填缺失、captcha 刷新、路由守卫双向重定向、退出登录（含后端不可用）、401 自动登出、captchaEnabled=false 隐藏验证码

## 7. 文件清单（File Inventory）

| 文件 | 职责 | 关联需求 |
|---|---|---|
| `src/views/LoginPage.vue` | 登录页 | FR-002-011~017, FR-002-018~022 |
| `src/views/RegisterPage.vue` | 注册页 | FR-002-001~010 |
| `src/stores/user.ts` | Pinia 认证状态 | FR-002-016, FR-002-023/024/026 |
| `src/api/auth.ts` | /auth 接口封装 | FR-002-021, FR-002-029 |
| `src/api/index.ts` | axios 实例、拦截器 | FR-002-029/030 |
| `src/router/index.ts` | 路由表与守卫 | FR-002-027/028 |
| `src/components/AppLayout.vue` | 退出按钮 | FR-002-025/026 |
| `src/main.ts` | 应用入口（Pinia + router 注入） | — |

## 8. 已知缺口（Known Gaps）

- 登录后 `userInfo` 从未被填充（仅 `setUserInfo` 预留与 logout 清空）—— 见 spec.md [NEEDS CLARIFICATION #1]
- `token_type` 被忽略，Authorization 头无 Bearer 前缀 —— 见 spec.md [NEEDS CLARIFICATION #2]
- 401 跳转硬编码 `/login` 未带 `/web/` 前缀 —— 见 spec.md [NEEDS CLARIFICATION #3]
- 无测试框架、无 lint、无日志

---

## 9. 微信登录实现（微信扫一扫登录）

> 详见父工程 [../../specs/002-user-auth/plan.md](../../specs/002-user-auth/plan.md) §9 与 `docs/002-用户注册及登录设计-微信登录集成.md`（§8.3），完全参考 RuoYi-Vue-Plus-UI。

- 新增：`src/api/social.ts`（`authRouterUrl`/`socialLogin`/`socialCallback`）、`src/views/SocialCallback.vue`。
- 路由：`/social-callback`（**无 meta**，登录/未登录均可达）。
- 入口：`LoginPage.vue` 微信按钮（`source='wechat_open'`，`VITE_APP_WECHAT_LOGIN_ENABLED` 门控）。
- 回调：读 `code/state/source` → 无 token `socialLogin` / 有 token `socialCallback` → `setToken` → `/profile`。