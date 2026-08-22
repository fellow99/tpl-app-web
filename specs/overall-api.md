# overall-api.md — tpl-app-web 接口总览（Interface Contracts）

> 项目：tpl-app-web（tpl-workspace网页端）
> 类型：as-built 接口契约文档
> 范围：外部 API 契约（与 tpl-app-api 的对接）、请求/响应格式、内部模块边界、开发代理、路由契约、后端参考
> 说明：内容以当前源码为准（as-built），与初始需求清单中不一致之处已在文中标注

---

## 1. External API Contracts（外部接口契约）

后端工程：`..\tpl-app-api\`（Spring Boot 3.2.5，Java 17，Sa-Token 1.38.0，MyBatis-Plus 3.5.5，PostgreSQL + Redis）
> 注：as-built 实际为 **Java 17**（`pom.xml` 中 `java.version=17`），非 Java 21。
> 后端接口文档可参照 `..\tpl-app-api\specs\`（overall-spec.md 等）。

### 1.1 Authentication API（`/auth/*`）

| Path | Method | Description | Request Body | Response |
|------|--------|-------------|-------------|----------|
| `/auth/login` | POST | 用户登录 | `{username, password, code, uuid}` | `{access_token, token_type}` |
| `/auth/register` | POST | 用户注册 | `{username, password, code, uuid}` | void |
| `/auth/code` | GET | 获取图形验证码 | - | `{captchaEnabled, uuid, img}` |
| `/auth/logout` | POST | 用户登出 | - | void |

字段说明与细节：

- **登录/注册/验证码**：后端 `@SaIgnore` 免登录放行；`/auth/logout` 需携带有效 Token（Sa-Token 校验）。
- **`/auth/login`**：入参 `LoginRequest{username, password, code, uuid}`；出参 `LoginResponse{access_token, token_type}`，其中 `token_type` 默认值为 `"Bearer"`。前端仅使用 `access_token`，存入 `localStorage('token')`。
- **`/auth/register`**：入参 `RegisterRequest{username, password, code, uuid}`；后端另接收可选字段 `phoneNumber`（前端当前不发送）。注册成功返回 `R.ok()`，`data` 为 null。
- **`/auth/code`**：出参 `{captchaEnabled: boolean, uuid: string, img: string}`；`captchaEnabled=false` 时 `uuid`/`img` 可为空（验证码全局关闭，见后端配置 `captcha.enable`）。`img` 为 Base64 图片，可点击刷新。

### 1.2 User Profile API（`/api/*`）

| Path | Method | Description | Response |
|------|--------|-------------|----------|
| `/system/user/getInfo` | GET | 获取当前登录用户信息 | `UserInfoVO` |

- 入参：无（用户身份由 Token 决定，后端 `StpUtil.getLoginIdAsLong()` 解析）。

---

## 2. API Request/Response Format（请求/响应格式）

- **标准响应包装（后端 `R<T>`）**：`{code: number, msg: string, data: T}`
- **成功 code**：`200`（`msg: "success"`）
- **业务失败 code**：`500`（`data` 为 null，`msg` 为中文错误描述）→ 前端拦截器抛出 `Error(msg)`
- **认证失败**：HTTP 状态码 `401`（Sa-Token 拦截）→ 前端响应拦截器清除 token 并 `window.location.href = '/login'`
- **Authorization header**：直接携带 token 字符串（`config.headers.Authorization = token`，即**非** `"Bearer <token>"` 格式），来源为 `localStorage.getItem('token')`。
- **axios 实例**（`src/api/index.ts`）：`baseURL: ''`，`timeout: 15000`。
- **响应解包**：响应拦截器在 `code === 200` 时直接返回 `data` 字段，调用方拿到的即为 `ApiResponse.data` 的类型化数据。

---

## 3. Internal Module Boundaries（内部模块边界）

依赖方向：`views/*.vue` → `stores/user.ts` → `api/auth.ts` → `api/index.ts`（axios）

| 模块 | 文件 | 职责 | 依赖 |
|------|------|------|------|
| 请求实例层 | `src/api/index.ts` | 创建 axios service 实例；定义 `ApiResponse<T>` 类型；请求拦截器附加 Authorization；响应拦截器统一解包、401 处理 | axios |
| Auth API 层 | `src/api/auth.ts` | 导出 `loginApi` / `registerApi` / `getCaptchaApi` / `logoutApi`；导出 `LoginParams` / `RegisterParams` / `LoginResult` / `CaptchaResult` | `api/index.ts` |
| Learning Center API 层 | `src/api/profile.ts` | 导出 `getOverviewApi`；导出 `OverviewResult` | `api/index.ts` |
| 状态管理层 | `src/stores/user.ts` | Pinia `useUserStore`：`token` / `userInfo` / `isLoggedIn`；actions `login` / `register` / `fetchCaptcha` / `logout` / `setUserInfo` / `setToken` / `clearToken` / `restoreFromStorage` | `api/auth.ts` |
| 页面层 | `src/views/LoginPage.vue`、`RegisterPage.vue`、`ProfilePage.vue` | 调用 store actions 与 API 函数，渲染表单/数据 | `stores/user.ts`、`api/profile.ts` |
| 布局壳 | `src/components/AppLayout.vue` | 登录后布局；退出按钮调用 `userStore.logout()` 后跳转 `/login` | `stores/user.ts` |

关键调用链：
- 登录：`LoginPage.vue` → `userStore.login()` → `loginApi()` → `POST /auth/login` → 存 token → 跳转 `redirect` 或 `/profile`
- 验证码：`LoginPage.vue` / `RegisterPage.vue` → `userStore.fetchCaptcha()` → `getCaptchaApi()` → `GET /auth/code`
- 登出：`AppLayout.vue` → `userStore.logout()` → `logoutApi()` → `POST /auth/logout`（无论成败均清除本地 token）

---

## 4. Proxy Configuration（开发环境代理）

`vite.config.ts` → `server.proxy`：

| 前缀 | 目标 | 说明 |
|------|------|------|
| `/api` | `http://localhost:8082` | `changeOrigin: true` |
| `/auth` | `http://localhost:8082` | `changeOrigin: true` |

其他 dev server 配置：
- `server.host: '0.0.0.0'`，`server.port: 5173`
- `base: '/web/'`（部署于 `/web/` 子路径；路由 history 亦为 `createWebHistory('/web/')`）
- alias：`@` → `./src`

---

## 5. Router Internal Contracts（路由内部契约）

| 路由 | name | 页面 | meta | 访问规则 |
|------|------|------|------|----------|
| `/` | — | 重定向 → `/profile` | - | 无 |
| `/login` | `Login` | `views/LoginPage.vue` | `{ guest: true }` | 仅未登录可访问 |
| `/register` | `Register` | `views/RegisterPage.vue` | `{ guest: true }` | 仅未登录可访问 |
| `/profile` | `Profile` | `views/ProfilePage.vue` | `{ requiresAuth: true }` | 仅登录可访问 |

- **`meta.guest`** → 仅当**未登录**（`userStore.isLoggedIn === false`）时允许访问。
- **`meta.requiresAuth`** → 仅当**已登录**（`userStore.isLoggedIn === true`）时允许访问。
- **导航守卫（`router.beforeEach`）**：
  1. `to.meta.requiresAuth && !isLoggedIn` → `next({ name: 'Login', query: { redirect: to.fullPath } })`（未登录访问受保护页，跳登录并带 redirect 参数）
  2. `to.meta.guest && isLoggedIn` → `next({ name: 'Profile' })`（已登录访问 guest 页，强制回个人中心）
  3. 其余 → `next()`
- 登录成功后跳转 `route.query.redirect` 或默认 `/profile`。

---

## 6. Backend Reference（后端参考）

| 项 | 值 |
|----|-----|
| 工程路径 | `..\tpl-app-api\` |
| 技术栈 | Spring Boot **3.2.5** / **Java 17** / Sa-Token 1.38.0 / MyBatis-Plus 3.5.5 / PostgreSQL / Redis / Hutool |
| 服务端口 | `8082` |
| Sa-Token | `token-name: Authorization`；`timeout: 2592000` 秒（30 天）；`token-style: tik`；JWT 密钥当前为硬编码（后端 spec 标记待改进） |
| 验证码 | `captcha.enable: true`；`char-length: 4`（4 位图形验证码，Redis 存储，有效期 5 分钟，一次性消费，不区分大小写） |
| 响应规范 | 统一 `{code, msg, data}`；成功 `code=200`；业务异常 `code=500`；未登录/鉴权失败 HTTP `401` |
| 鉴权放行 | `/auth/login`、`/auth/register`、`/auth/code` 为 `@SaIgnore`；其余接口均需 Token |
| 后端 spec 文档 | `..\tpl-app-api\specs\`（[README](../tpl-app-api/specs/README.md) / [ARCHITECTURE](../tpl-app-api/specs/ARCHITECTURE.md) / [TECH](../tpl-app-api/specs/TECH.md) / [overall-api](../tpl-app-api/specs/overall-api.md) / [constitution](../tpl-app-api/specs/constitution.md)；模块：[002-user-auth](../tpl-app-api/specs/002-user-auth/) / [101-profile](../tpl-app-api/specs/101-profile/)） |

---

## 附：与初始需求清单的差异（as-built 校正）

1. 后端 Java 版本为 **17**（需求描述为 Java 21）。
2. 认证失败返回 HTTP **401**（Sa-Token 默认拦截），由前端响应拦截器统一处理；业务失败为 `code=500`。
3. `Authorization` header 为 **原始 token**（前端未加 `Bearer ` 前缀；后端 `token-name: Authorization` 且未配置前缀）。
4. `/auth/register` 后端另有可选字段 `phoneNumber`（前端未发送，前端契约不含该字段）。
5. 后端 `/auth/code` 返回字段为 `{captchaEnabled, uuid, img}`，与前端 `CaptchaResult` 一致。