# tpl-app-web

> tpl-workspace — 用户端 Web 应用  

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](./tsconfig.json)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite)](./vite.config.ts)
[![Pinia](https://img.shields.io/badge/Pinia-2.3-FFD859?logo=vuedotjs)](./package.json)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm)](./package.json)

---

## 项目简介

**tpl-app-web** 是「tpl-workspace」产品体系的用户端 Web 前端工程，基于 **Vue 3 + Vite + TypeScript** 构建的单页应用（SPA）。


### tpl-workspace产品体系

```
tpl-workspace/
├── tpl-app-web/          # 用户端 Web 应用 ★ 本仓库
├── tpl-app-api/          # 核心业务后端 (Spring Boot 3.x)
├── tpl-manage/           # 管理后台后端 (RuoYi-Vue-Plus)
├── tpl-manage-ui/        # 管理后台前端
├── tpl-app-android/      # Android 客户端
├── tpl-app-harmony/      # 鸿蒙客户端
├── tpl-app-mini/         # 微信小程序
└── docs/                # 产品文档与设计稿
```

**本工程定位**：为用户提供用户注册 / 登录、个人中心仪表盘等核心前端功能，对接 `tpl-app-api` 后端服务。

---

## 工程特点

### 纯 CSS 设计体系，无 UI 框架依赖

本工程**不引入**任何 UI 组件库（无 Element Plus / Vant / Naive UI），所有界面通过**纯 CSS + Design Tokens** 实现。全局样式集中在 `src/style.css`，定义完整的 10 色色板、3 套字体栈、4px 基准间距、圆角、阴影、字号阶梯与缓动曲线。页面组件使用 `<style scoped>` 实现样式隔离。

> 设计依据：`../DESIGN.md` —「破茧」设计系统，色彩源于中国传统文房四色。

### 模块化的分层架构

```
src/
├── api/          # HTTP 请求层（axios 实例 + 拦截器 + 接口封装）
├── stores/       # Pinia 状态管理
├── router/       # Vue Router 路由与导航守卫
├── components/   # 可复用组件（AppLayout 应用外壳）
├── views/        # 页面级组件
└── style.css     # Design Tokens + 全局样式 + 工具类
```

### 开发代理

开发环境下 `/api` 和 `/auth` 请求自动代理到本地后端服务（`localhost:8082`），前后端并行开发无需关注跨域。

---

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器（需要 tpl-app-api 后端运行在 localhost:8082）
pnpm dev                     # 访问 http://localhost:5173/web/

# 3. 构建生产环境
pnpm build                   # vue-tsc -b && vite build，产物输出到 dist/

# 4. 预览构建产物
pnpm preview
```

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 (Composition API + `<script setup>`) | ^3.5.13 |
| 类型系统 | TypeScript（strict 模式） | ~5.6.3 |
| 构建工具 | Vite | ^6.1.0 |
| 路由 | Vue Router（History 模式，base `/web/`） | ^4.5.0 |
| 状态管理 | Pinia（Composition API store） | ^2.3.0 |
| HTTP 客户端 | Axios（拦截器模式） | ^1.7.9 |
| 图标 | lucide-vue-next | ^0.469.0 |
| 样式方案 | 纯 CSS + Design Tokens（scoped） | — |
| 包管理器 | pnpm | — |
| 代码质量 | vue-tsc 类型检查 | ^2.2.0 |

> 完整技术栈说明见 [specs/TECH.md](./specs/TECH.md)。

---

## 项目结构

```
tpl-app-web/
├── src/
│   ├── api/
│   │   ├── index.ts              # axios 实例 + 拦截器（统一响应处理 / 401）
│   │   ├── auth.ts               # 认证 API（登录 / 注册 / 验证码 / 登出）
│   ├── components/
│   │   └── AppLayout.vue         # 登录后应用布局（sticky 顶栏 + 退出登录）
│   ├── router/
│   │   └── index.ts              # vue-router 配置 + 全局路由守卫
│   ├── stores/
│   │   └── user.ts               # Pinia 用户状态（token / userInfo）
│   ├── views/
│   │   ├── LoginPage.vue         # 登录页
│   │   ├── RegisterPage.vue      # 注册页
│   │   └── ProfilePage.vue # 个人中心页
│   ├── App.vue                   # 根组件（仅挂载 <router-view />）
│   ├── main.ts                   # 应用入口（挂载 Pinia + Router）
│   ├── style.css                 # 全局样式 / Design Tokens
│   └── vite-env.d.ts             # Vite 类型声明
├── specs/                        # 📋 规范文档（18 份）
│   ├── README.md                 #   文档索引
│   ├── ARCHITECTURE.md           #   系统架构设计
│   ├── STRUCTURE.md              #   目录结构与路由清单
│   ├── TECH.md                   #   技术选型
│   ├── constitution.md           #   宪法原则
│   ├── overall-spec.md           #   整体功能规格
│   ├── overall-plan.md           #   整体技术方案
│   ├── overall-data-model.md     #   数据模型
│   ├── overall-api.md            #   API 接口模型
│   ├── overall-test-cases.md     #   测试用例索引
│   ├── 001-app-shell/            #   应用外壳模块（spec + plan）
│   ├── 002-user-auth/            #   用户认证模块（spec + plan + test-cases）
│   └── 101-profile/      #   个人中心模块（spec + plan + test-cases）
├── index.html                    # HTML 入口
├── package.json                  # 依赖与脚本
├── pnpm-lock.yaml                # pnpm 锁文件
├── vite.config.ts                # Vite 配置（base / alias / proxy）
├── tsconfig.json                 # TS 工程引用入口
├── tsconfig.app.json             # 应用侧 TS 配置（strict）
└── tsconfig.node.json            # 构建工具侧 TS 配置
```

---

## 功能模块

| 模块 | 编号 | 路由 | 说明 |
|------|------|------|------|
| **应用外壳** | 001 | — | 应用引导、sticky 顶栏、退出登录、路由守卫、HTTP 客户端、全局 Design Tokens |

> 产品设计文档详见 `../docs/` 目录。当前实现范围为 MVP 阶段。

---

## 开发指南

### 本地开发环境

1. 确保 `tpl-app-api` 后端运行在 `localhost:8082`
2. 开发服务器监听 `0.0.0.0:5173`，`/api` 和 `/auth` 请求自动代理到后端
3. 应用挂载于 `/web/` 子路径（`base: '/web/'`）

### 样式开发

所有视觉属性使用 Design Tokens（CSS 自定义属性）：
- 颜色：`var(--indigo)`、`var(--gold)`、`var(--cinnabar)` 等
- 间距：`var(--space-sm)`、`var(--space-xl)` 等（4px 基准）
- 通用类：`.card`、`.btn-primary`、`.form-input`、`.skeleton` 等

### 后端 API 对接

- 所有接口封装在 `src/api/` 下，统一使用 axios 实例（`src/api/index.ts`）
- 请求拦截器自动注入 `Authorization` header
- 响应拦截器统一处理 401 登出
- 详见 [specs/overall-api.md](./specs/overall-api.md)

---

## 相关文档

### 本工程规范文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 规范文档索引 | [specs/README.md](./specs/README.md) | 全部 18 份规范文档导航 |
| 架构设计 | [specs/ARCHITECTURE.md](./specs/ARCHITECTURE.md) | 系统分层架构、数据流、部署上下文 |
| 技术选型 | [specs/TECH.md](./specs/TECH.md) | 完整技术栈与版本说明 |
| 宪法原则 | [specs/constitution.md](./specs/constitution.md) | 代码库遵循的 7 类原则 |
| 整体规格 | [specs/overall-spec.md](./specs/overall-spec.md) | 系统级功能需求 |
| API 接口模型 | [specs/overall-api.md](./specs/overall-api.md) | 后端 API 契约与代理配置 |
| 用户认证模块 | [specs/002-user-auth/](./specs/002-user-auth/) | 注册/登录/验证码/登出（spec + plan + 测试用例） |
| 应用外壳模块 | [specs/001-app-shell/](./specs/001-app-shell/) | 基础设施（spec + plan） |

### 后端工程文档（tpl-app-api）

| 文档 | 路径 | 说明 |
|------|------|------|
| tpl-app-api README | [../tpl-app-api/README.md](../tpl-app-api/README.md) | 后端项目说明（Spring Boot 3.2.5 / Java 17） |
| tpl-app-api specs | [../tpl-app-api/specs/](../tpl-app-api/specs/) | 后端规范文档 |

### 产品与设计文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 产品概念设计 | [../docs/产品概念设计.md](../docs/产品概念设计.md) | tpl-workspace产品整体设计 |
| 用户模块设计 | [../docs/002-用户注册及登录设计.md](../docs/002-用户注册及登录设计.md) | 用户注册/登录/绑定设计 |
| 个人中心设计 | [../docs/101-个人中心.md](../docs/101-个人中心.md) | 个人中心仪表盘设计 |
| 数据模型设计 | [../docs/数据模型设计.md](../docs/数据模型设计.md) | 数据库表结构与字典设计 |
| 技术选型 | [../docs/技术选型.md](../docs/技术选型.md) | 全局技术栈选型说明 |

---

## License

MIT
