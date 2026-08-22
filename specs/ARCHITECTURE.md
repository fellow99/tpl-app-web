# ARCHITECTURE.md — tpl-app-web 系统架构

> 项目：tpl-app-web（tpl-workspace网页端 / 用户端 Web SPA）
> 技术栈：Vue 3.5 + TypeScript 5.6 + Vite 6 + Pinia 2 + Vue Router 4 + Axios + lucide-vue-next
> 生成日期：2026-08-12

## 一、分层架构（Layer Diagram）

系统遵循经典的前端三层结构：**表现层（Presentation）→ 业务逻辑层（Business Logic）→ 数据/API 层（Data/API）**。

```
┌──────────────────────────────────────────────────────────────────┐
│  Presentation Layer（表现层）                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  App.vue                        —— 唯一根组件（仅 <router-view/>）│  │
│  │  Views：LoginPage / RegisterPage / ProfilePage       │  │
│  │  Components：AppLayout（sticky header + slot 内容区）         │  │
│  │  全局样式：style.css（Design Tokens + 原子类 .card/.btn/...）  │  │
│  └───────────────────────────────┬────────────────────────────┘  │
└──────────────────────────────────┼────────────────────────────────┘
                                   │ 调用 / 响应
┌──────────────────────────────────┼────────────────────────────────┐
│  Business Logic Layer（业务逻辑层）                                  │
│  ┌───────────────────────────────┴────────────────────────────┐  │
│  │  stores/user.ts（Pinia Composition API store）              │  │
│  │    - token / userInfo / isLoggedIn                          │  │
│  │    - login / register / logout / fetchCaptcha               │  │
│  │    - 与 localStorage 同步（'token' key）                     │  │
│  │  router/index.ts（全局 beforeEach 认证守卫）                  │  │
│  └───────────────────────────────┬────────────────────────────┘  │
└──────────────────────────────────┼────────────────────────────────┘
                                   │ 调用
┌──────────────────────────────────┼────────────────────────────────┐
│  Data / API Layer（数据/API 层）                                    │
│  ┌───────────────────────────────┴────────────────────────────┐  │
│  │  api/index.ts        —— Axios 实例 + 统一 R<T> 响应包装        │  │
│  │                        + request/response 拦截器             │  │
│  │  api/auth.ts         —— /auth/login|register|code|logout     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬────────────────────────────────┘
                                   │ HTTP (JSON, Authorization header)
┌──────────────────────────────────┼────────────────────────────────┐
│  Backend（tpl-app-api，Spring Boot 3.2.5，:8082）                   │
│    AuthController        —— 验证码/注册/登录/登出                   │
│    ProfileController —— 个人中心概览                         │
│    Sa-Token（JWT，Header 名 'Authorization'，30 天有效期）          │
└──────────────────────────────────────────────────────────────────┘
```

**要点**：
- View 组件**不直接调用 axios**，统一经由 store 再调用 API 模块。
- API 层通过 Axios 拦截器**统一解包** `ApiResponse<T>`（`{ code, msg, data }`），业务代码拿到的是 `data.data`。
- `AppLayout.vue` 是页面级布局容器（通过 slot 组合），个人中心等页面内嵌在 `<AppLayout>` 中渲染。

## 二、数据流描述（Data Flow）

### 2.1 登录流程

```
用户输入用户名/密码 → LoginPage.vue (form 数据)
        ↓
handleSubmit() @submit.prevent → 前端校验
        ↓
userStore.login({ username, password, code, uuid })
        ↓
loginApi() → axios POST /auth/login
        ↓
[request 拦截器] 若 localStorage 有 token，注入 Authorization header
        ↓
Vite dev proxy /auth → http://localhost:8082（生产：Nginx /auth → tpl-app-api:8082）
        ↓
后端 AuthController → AuthService → Sa-Token 签发 token
返回 { code: 200, msg: "success", data: { access_token, token_type } }
        ↓
[response 拦截器] 解包 → 返回 data.data
        ↓
userStore.login 内部：setToken(result.access_token) → token 写入 Pinia ref + localStorage
        ↓
LoginPage：读取 route.query.redirect || '/profile' → router.push()
        ↓
router.beforeEach：requiresAuth 且已登录 → 放行 → ProfilePage
```

### 2.2 数据读取流程（个人中心概览）

```
ProfilePage.onMounted → fetchData()
        ↓
        ↓
后端 ProfileController → MyBatis-Plus 查询 PostgreSQL
返回 { code: 200, msg: "success", data: { totalErrorQuestions: N } }
        ↓
[response 拦截器] code===200 → 返回 data.data
        ↓
overview ref 赋值 → 模板按状态渲染：
  loading → 骨架屏
  错误   → error-card + 重试按钮
  totalErrorQuestions === 0 → 空状态卡片
  有数据 → hero-card 大数字展示
```

### 2.3 错误 / 401 流程（统一处理）

- **业务码 401**（`data.code === 401`）：response 拦截器清除 `localStorage.token`，`window.location.href = '/login'` 强制跳转。
- **HTTP 401**（`error.response?.status === 401`）：同上处理。
- **其他错误**：取 `data.msg || error.message || '网络错误'`，`Promise.reject(new Error(...))`，由调用方捕获后显示 `errorMsg`。

### 2.4 登出流程

```
AppLayout.handleLogout → userStore.logout()
  ├─ await logoutApi()（POST /auth/logout，携带 token）
  └─ finally：clearToken()（Pinia + localStorage） + userInfo = null
→ router.push('/login')
```

## 三、组件层级树（Component Hierarchy Tree）

```
App.vue （唯一根组件：<router-view />）
└── <router-view> 按路由挂载（懒加载）：
    ├── LoginPage.vue                    （/login，guest 路由）
    │     ├── .login-card.card
    │     │     ├── .logo-area（品牌区："tpl-workspace"）
    │     │     ├── form.login-form
    │     │     │     ├── 用户名输入（User 图标）
    │     │     │     ├── 密码输入（Lock 图标）
    │     │     │     ├── 验证码（ShieldCheck 图标 + <img> 点击刷新）
    │     │     │     └── .btn.btn-primary 提交
    │     │     └── router-link → /register
    │
    ├── RegisterPage.vue                 （/register，guest 路由）
    │     ├── .register-card.card
    │     │     ├── .logo-area
    │     │     ├── form.register-form
    │     │     │     ├── 用户名 / 密码 / 确认密码
    │     │     │     ├── 验证码
    │     │     │     └── .btn.btn-accent 注册
    │     │     └── 成功 Toast（2s 后跳转 /login）
    │     └── router-link → /login
    │
    └── ProfilePage.vue           （/profile，requiresAuth）
          └── AppLayout.vue（布局容器）
                ├── header.app-header  — position: sticky; top:0
                │     ├── h1.brand「tpl-workspace」
                │     └── button.btn.btn-ghost（LogOut 图标 → 登出）
                └── main.app-content（slot，max-width: 960px）
                      └── .profile
                            ├── .profile-header（标题）
                            ├── loading → 骨架屏
                            ├── error   → 错误 + 重试
                            └── 数据    → 用户信息
```

## 四、路由架构（Routing Architecture）

配置：`src/router/index.ts`，`createWebHistory('/web/')`（HTML5 History 模式）。

| Path | Name | 组件（懒加载） | meta | 说明 |
|------|------|---------------|------|------|
| `/` | — | — | — | redirect → /profile |
| `/login` | Login | `LoginPage.vue` | `{ guest: true }` | 登录页 |
| `/register` | Register | `RegisterPage.vue` | `{ guest: true }` | 注册页 |
| `/profile` | Profile | `ProfilePage.vue` | `{ requiresAuth: true }` | 个人中心 |

**全局前置守卫**：
- `requiresAuth && !isLoggedIn` → 跳 `/login?redirect=<原路径>`
- `guest && isLoggedIn` → 跳 `/profile`
- 其余放行

## 五、部署上下文（Deployment Context）

### 5.1 形态

**静态 SPA**：`pnpm run build`（`vue-tsc -b && vite build`）产出纯静态资源至 `dist/`，由 Nginx 静态服务托管。

### 5.2 路径与端口

| 环节 | 配置 | 来源 |
|------|------|------|
| Vite base | `/web/` | vite.config.ts |
| Router history base | `/web/` | src/router/index.ts |
| 开发服务器 | `0.0.0.0:5173` | vite.config.ts |
| 开发代理 `/api`、`/auth` | → `http://localhost:8082` | vite.config.ts |
| 后端服务 | `:8082` | tpl-app-api application.yml |

### 5.3 开发环境请求链路

```
浏览器 http://localhost:5173/web/...
        ↓
Vite dev server（base /web/）
        ↓  /api/* 和 /auth/* 命中 proxy
http://localhost:8082（tpl-app-api，Spring Boot）
```

### 5.4 生产环境（Nginx 网关）

`deploy/nginx/nginx.conf`（总网关，容器内 `:80` 映射宿主 `:38088`）：

```
浏览器 → http://host:38088/
        ↓  location = / → 301 /web/
GET /web/*   → upstream tpl-app-web（rewrite 去 /web 前缀）
               try_files → index.html（SPA history fallback）
GET /api/*   → upstream tpl-app-api（tpl-app-api:8082）
GET /auth/*  → upstream tpl-app-api（tpl-app-api:8082）
```

### 5.5 容器化构建（Dockerfile.tpl-app-web）

```
Stage 1（builder）: node:24-alpine + corepack pnpm
  → pnpm install --frozen-lockfile
  → pnpm run build → dist/
Stage 2: nginx:latest
  → COPY dist → /usr/share/nginx/html
  → COPY deploy/nginx/tpl-app-web.conf → /etc/nginx/conf.d/default.conf
  → HEALTHCHECK（wget localhost:80）; EXPOSE 80
```

## 六、关键架构决策（Key Architectural Decisions）

### 6.1 不使用 UI 组件库 —— 纯 CSS Design Tokens

- **决策**：`package.json` 中没有任何 UI 库（无 Element Plus / Vant / Naive UI），仅依赖 `lucide-vue-next` 图标。
- **实现**：`src/style.css` 定义完整的 Design Token 体系：10 色色板、3 套字体栈、4px 基准间距、圆角/阴影/字号阶梯/缓动曲线。
- **依据**：工作区根目录 `DESIGN.md`（v1.0，2026-08-10）设计系统「破茧」隐喻，色彩源于中国传统文房四色，移动端优先。

### 6.2 Pinia Composition API Store

- Pinia 采用 **setup 风格（Composition API）**定义 store，使用 `ref`/`computed`。
- Token 持久化以 `localStorage.getItem('token')` 作为初始化来源，刷新后登录态自动保持。

### 6.3 Axios + Interceptor 模式

- 单例 Axios 实例，`baseURL: ''`（同源），`timeout: 15000`。
- Request 拦截器：注入 `Authorization` header（原样注入，无 `Bearer ` 前缀）。
- Response 拦截器：`code !== 200` → 拒绝（401 时清 token 并强制跳 `/login`）；`code === 200` → 解包返回 `data.data`。

### 6.4 路由懒加载

- 全部路由组件使用 `() => import(...)` 动态导入，Vite/Rollup 按路由自动 code-splitting。

### 6.5 JWT Token 存储与鉴权头

- Token 存放于 `localStorage`（key: 'token'），每次请求经 request 拦截器注入 `Authorization` 请求头。

### 6.6 Sticky Header 布局模式

- `AppLayout.vue` 采用 flex column 全高布局 + `position: sticky; top: 0` 顶栏。
- 内容区 `max-width: 960px` 居中，`@media (max-width: 640px)` 缩减内边距。

## 七、与后端及项目生态的关系

### 7.1 tpl-app-api（核心业务后端）

- **定位**：`tpl-app-web` 的唯一业务后端，Spring Boot 3.2.5 / Java 17，端口 `8082`。
- **规范文档**：[README](../tpl-app-api/README.md) / [specs 索引](../tpl-app-api/specs/README.md)（15 份，含 `002-user-auth`、`101-profile` 模块）
- **API 契约**：

| 前端模块 | 方法 | 后端 Controller |
|----------|------|-----------------|
| `getCaptchaApi` | GET `/auth/code` | AuthController |
| `registerApi` | POST `/auth/register` | AuthController |
| `loginApi` | POST `/auth/login` | AuthController |
| `logoutApi` | POST `/auth/logout` | AuthController |

### 7.2 管理后台生态

- `tpl-manage`：管理后台后端，RuoYi-Vue-Plus 6.0，端口 `8081`。
- `tpl-manage-ui`：管理后台前端，独立设计体系（Element Plus），不共用 tpl-app-web 的 Design Tokens。

### 7.3 部署生态（Docker Compose）

`deploy/docker-compose.yml` 编排 7 个服务：`postgres`、`redis`、`tpl-manage`、`tpl-manage-ui`、`tpl-app-api`、`tpl-app-web`、`nginx`（总网关，宿主 `38088:80`）。

---

## 附录 A：目录结构

```
tpl-app-web/
├── index.html                # SPA 宿主（lang=zh-CN，#app 挂载点）
├── package.json              # pnpm 管理；scripts: dev / build / preview
├── pnpm-lock.yaml
├── vite.config.ts            # base:/web/；alias @→src；dev proxy /api,/auth → :8082
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── specs/                    # 规范文档
└── src/
    ├── main.ts               # 引导：createApp + createPinia + router + mount(#app)
    ├── App.vue               # 唯一根组件：<router-view />
    ├── style.css             # Design Tokens + 全局组件类 + Reset
    ├── router/index.ts       # 路由表 + 认证守卫
    ├── stores/user.ts        # Pinia setup store（认证状态机）
    ├── api/
    │   ├── index.ts          # Axios 实例 + R<T> 解包 + 拦截器
    │   ├── auth.ts           # /auth 系列接口 + TS 类型
    ├── components/
    │   └── AppLayout.vue     # sticky header 布局容器（slot）
    └── views/
        ├── LoginPage.vue     # 登录（验证码 + redirect 回跳）
        ├── RegisterPage.vue  # 注册（成功 toast）
        └── ProfilePage.vue  # 个人中心（骨架/错误/数据三态）
```