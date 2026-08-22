# STRUCTURE.md — tpl-app-web 项目结构说明

> tpl-workspace网页端（tpl-app-web）基于 **Vue 3 + Vite + TypeScript + Pinia + Vue Router** 构建。
> 本文档为 as-built 结构快照，描述当前源码目录、页面路由与关键配置文件。

## 1. 目录结构（Directory Tree）

（2~3 层，已排除 `node_modules` / `dist` / `.git` / `.codegraph` / `.omo`）

```
tpl-app-web/
├── src/
│   ├── api/
│   │   ├── index.ts           # axios 实例与拦截器（统一响应解包 / 401 处理）
│   │   ├── auth.ts            # 认证相关 API（登录 / 注册 / 验证码 / 登出）
│   │   └── profile.ts  # 个人中心 API（用户信息）
│   ├── components/
│   │   └── AppLayout.vue      # 登录后应用布局壳（sticky 顶栏 + 退出登录）
│   ├── router/
│   │   └── index.ts           # vue-router 配置与全局路由守卫
│   ├── stores/
│   │   └── user.ts            # Pinia 用户状态（token / userInfo / isLoggedIn）
│   ├── views/
│   │   ├── LoginPage.vue            # 登录页
│   │   ├── RegisterPage.vue         # 注册页
│   │   └── ProfilePage.vue   # 个人中心页
│   ├── App.vue               # 根组件（仅渲染 <router-view />）
│   ├── main.ts               # 应用入口（挂载 Pinia + Router）
│   ├── style.css             # 全局样式 / CSS 变量
│   └── vite-env.d.ts         # Vite 客户端类型声明
├── specs/                    # 规格文档目录
│   ├── 001-user-auth/        # 用户认证 spec（当前为空占位）
│   ├── 002-profile/  # 个人中心 spec（当前为空占位）
│   └── 003-app-shell/        # 应用壳 spec（当前为空占位）
├── index.html                # HTML 入口（lang=zh-CN，title tpl-workspace）
├── package.json              # 依赖与脚本
├── pnpm-lock.yaml            # pnpm 锁文件
├── README.md                 # 项目说明
├── tsconfig.json             # TS 工程引用入口（references）
├── tsconfig.app.json         # 应用侧 TS 配置
├── tsconfig.node.json        # 构建工具侧 TS 配置
├── vite.config.ts            # Vite 配置（base / alias / proxy）
└── .gitignore                # Git 忽略规则
```

## 2. 页面 / 路由清单（Route Inventory）

路由基地址：`createWebHistory('/web/')`，应用部署于 `/web/` 子路径下。
页面组件均为懒加载（`() => import('@/views/xxx.vue')`）。

| Path | Route Name | Component | 鉴权 | 说明 |
|------|-----------|-----------|------|------|
| `/` | —（无 name） | 重定向 → `/profile` | 需登录（经重定向目标生效） | 根路径重定向 |
| `/login` | `Login` | `src/views/LoginPage.vue` | guest（仅未登录可访问） | 登录页：用户名/密码/验证码，成功后跳转 `redirect` 参数或 `/profile` |
| `/register` | `Register` | `src/views/RegisterPage.vue` | guest（仅未登录可访问） | 注册页：用户名/密码/确认密码/验证码，成功后 2 秒跳转 `/login` |
| `/profile` | `Profile` | `src/views/ProfilePage.vue` | requiresAuth（需登录） | 个人中心页：展示用户信息（loading / error 三态） |

### 全局路由守卫（`src/router/index.ts` 中 `router.beforeEach`）

1. `to.meta.requiresAuth` 且未登录 → `next({ name: 'Login', query: { redirect: to.fullPath } })`
2. `to.meta.guest` 且已登录 → `next({ name: 'Profile' })`
3. 其余 → `next()`

## 3. 关键配置文件（Key Config Files）

| 文件 | 作用 | 关键点 |
|------|------|--------|
| `vite.config.ts` | Vite 构建 / dev server 配置 | `base: '/web/'`；alias `@ → ./src`（fileURLToPath）；server host `0.0.0.0` 端口 `5173`；proxy：`/api` 与 `/auth` → `http://localhost:8082`（changeOrigin） |
| `tsconfig.json` | TS 工程引用入口 | `files: []`，references 指向 `tsconfig.app.json` 与 `tsconfig.node.json` |
| `tsconfig.app.json` | 应用侧 TS 配置 | `strict: true`、`target: ES2020`、`moduleResolution: bundler`、`noEmit: true`；`paths: { "@/*": ["./src/*"] }`；include `src/**` |
| `tsconfig.node.json` | 构建工具侧 TS 配置 | 仅 include `vite.config.ts`，`target: ES2022` |
| `package.json` | 依赖与脚本 | scripts：`dev` / `build`（`vue-tsc -b && vite build`）/ `preview`；dependencies：vue ^3.5、vue-router ^4.5、pinia ^2.3、axios ^1.7、lucide-vue-next ^0.469；devDependencies：vite ^6.1、typescript ~5.6、vue-tsc ^2.2、@vitejs/plugin-vue ^5.2、@types/node |
| `index.html` | HTML 入口 | `lang="zh-CN"`，title「tpl-workspace」，挂载点 `#app`，脚本入口 `/src/main.ts` |
| `.gitignore` | Git 忽略规则 | 排除 `node_modules` / `dist` / `*.log` / `.vscode` / `.omo` / `.codegraph` / `.playwright-mcp` 等 |

## 4. 源码模块说明（Source Modules）

### `src/api/` — 接口层

| 文件 | 内容 |
|------|------|
| `index.ts` | 创建 axios 实例（`baseURL: ''`，timeout 15000）。请求拦截器自动附加 `Authorization`（从 localStorage 读取 token）；响应拦截器统一解包 `ApiResponse<T> { code, msg, data }`：`code !== 200` 报错，`401` 时清除 token 并 `window.location.href = '/login'` |
| `auth.ts` | 类型 `LoginParams` / `RegisterParams` / `CaptchaResult` / `LoginResult`；接口：`POST /auth/login`、`POST /auth/register`、`GET /auth/code`、`POST /auth/logout` |

### `src/components/` — 通用组件

| 文件 | 内容 |
|------|------|
| `AppLayout.vue` | 登录后布局壳：sticky 顶栏（品牌「tpl-workspace」+ 退出按钮），`<slot />` 承载页面内容；退出调用 `userStore.logout()` 后跳转 `/login` |

### `src/router/` — 路由

| 文件 | 内容 |
|------|------|
| `index.ts` | 创建 router（history：`createWebHistory('/web/')`），注册 4 条路由（含 1 条重定向），定义全局 `beforeEach` 鉴权守卫 |

### `src/stores/` — 状态管理（Pinia）

| 文件 | 内容 |
|------|------|
| `user.ts` | setup 风格 store（`defineStore('user', ...)`）：`token`（初始化自并持久化到 localStorage）、`userInfo`（userId/userName/nickName/phoneNumber/email/birthDate）、`isLoggedIn` computed；actions：`login` / `register` / `fetchCaptcha` / `logout` / `setUserInfo` / `setToken` / `clearToken` / `restoreFromStorage` |

### `src/views/` — 页面

| 文件 | 内容 |
|------|------|
| `LoginPage.vue` | 登录表单（用户名 / 密码 / 验证码），点击验证码图片刷新；登录成功后跳转 `redirect` 参数或 `/profile` |
| `RegisterPage.vue` | 注册表单（用户名 / 密码 / 确认密码（校验一致性）/ 验证码），成功 toast 后 2 秒跳转 `/login` |
| `ProfilePage.vue` | 个人中心：`onMounted` 请求用户信息接口，含 loading skeleton / error（可重试）三种状态；通过 `<AppLayout>` 包裹，展示用户信息 |

### 入口 / 根文件

- `src/main.ts` — 应用入口：`createApp(App)` + `createPinia()` + `router`，mount 到 `#app`，引入 `./style.css`
- `src/App.vue` — 根组件，仅渲染 `<router-view />`
- `src/style.css` — 全局样式与设计 token（CSS 变量如 `--indigo`、`--ink`、`--space-*`、`--radius-*`、`--text-h1` 等）

## 5. 应用启动流（Bootstrap Flow）

```
index.html
  → src/main.ts（创建 Vue app，注册 Pinia + Router）
  → src/App.vue（<router-view />）
  → router 匹配（/web/ 前缀 + beforeEach 鉴权守卫）
  → 懒加载对应 src/views/*.vue 页面
  → 页面经 src/api/* 调用后端接口（/api、/auth，dev 下代理至 :8082）
```