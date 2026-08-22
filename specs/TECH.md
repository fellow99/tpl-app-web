# TECH.md — 技术栈说明

> 项目名称：tpl-app-web（tpl-workspace网页端）
> 文档类型：as-built 技术规格（记录项目实际使用的技术栈，非目标态）
> 生成时间：2026-08-12

## 1. 项目概述

tpl-app-web 是"tpl-workspace"平台的 Web 前端，基于 **Vue 3 + Vite 6 + TypeScript** 构建的单页应用（SPA）。
项目采用 pnpm 作为包管理器，未引入任何 UI 组件库，样式通过原生 CSS 设计令牌（CSS Custom Properties）实现。

## 2. 技术清单

### 2.1 技术总览表

| 分类 | 技术 | 版本 | 用途 |
| --- | --- | --- | --- |
| Framework | Vue | ^3.5.13 | 前端框架（Composition API + `<script setup>`） |
| Build Tool | Vite | ^6.1.0 | 构建工具、开发服务器（HMR） |
| Language | TypeScript | ~5.6.3 | 静态类型语言及类型检查 |
| Routing | vue-router | ^4.5.0 | 前端路由管理 |
| State Management | pinia | ^2.3.0 | 状态管理（Store） |
| HTTP Client | axios | ^1.7.9 | HTTP 请求封装（配合 Vite 代理） |
| Icons | lucide-vue-next | ^0.469.0 | 图标组件库 |
| Dev Tools | vue-tsc | ^2.2.0 | Vue SFC 类型检查（构建阶段执行） |
| Dev Tools | @vitejs/plugin-vue | ^5.2.3 | Vite 的 Vue 单文件组件（SFC）编译插件 |
| Dev Tools | @types/node | ^26.2.0 | Node.js 类型定义（供 Vite 配置等使用） |

### 2.2 完整依赖清单

**dependencies（生产依赖）**

| 包名 | 声明版本 | 说明 |
| --- | --- | --- |
| vue | ^3.5.13 | 核心框架 |
| vue-router | ^4.5.0 | 路由 |
| pinia | ^2.3.0 | 状态管理 |
| axios | ^1.7.9 | HTTP 客户端 |
| lucide-vue-next | ^0.469.0 | 图标 |

**devDependencies（开发依赖）**

| 包名 | 声明版本 | 说明 |
| --- | --- | --- |
| vite | ^6.1.0 | 构建工具 |
| typescript | ~5.6.3 | TypeScript 编译器 |
| vue-tsc | ^2.2.0 | Vue 类型检查 |
| @vitejs/plugin-vue | ^5.2.3 | Vue SFC 插件 |
| @types/node | ^26.2.0 | Node 类型定义 |

## 3. 工程化配置

### 3.1 包管理器

- **pnpm**（存在 `pnpm-lock.yaml` 锁文件）。
- `package.json` 中配置 `pnpm.onlyBuiltDependencies`：`esbuild`、`vue-demi`。

### 3.2 构建与脚本

| 脚本 | 命令 | 说明 |
| --- | --- | --- |
| dev | `vite` | 启动开发服务器 |
| build | `vue-tsc -b && vite build` | 先执行类型检查，再构建 |
| preview | `vite preview` | 预览生产构建产物 |

### 3.3 Vite 配置（vite.config.ts）

- **context path（基础路径）**：`base: '/web/'` —— 所有静态资源均以 `/web/` 为前缀。
- **路径别名**：`@` → `./src`。
- **开发服务器**：`host: 0.0.0.0`，`port: 5173`。
- **代理（proxy）**：
  - `/api` → `http://localhost:8082`（`changeOrigin: true`）
  - `/auth` → `http://localhost:8082`（`changeOrigin: true`）
  - 即前端请求统一由 Vite 代理转发至后端 8082 端口。

### 3.4 TypeScript 配置（tsconfig.app.json）

- `target: ES2020`，`module: ESNext`，`lib: [ES2020, DOM, DOM.Iterable]`。
- `moduleResolution: bundler`，`isolatedModules: true`，`noEmit: true`，`jsx: preserve`。
- `strict: true`，并启用 `noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`、`noUncheckedSideEffectImports`。
- **路径映射**：`@/*` → `./src/*`（与 Vite alias 一致）。
- 编译范围：`src/**/*.ts`、`src/**/*.tsx`、`src/**/*.vue`、`src/vite-env.d.ts`。

## 4. 样式方案

- **无 UI 组件库**：未引入 element-plus 或其他组件库（如 ant-design、vant、naive-ui 等），所有界面均由项目自有组件实现。
- **纯 CSS + 设计令牌**：全局样式集中在 `src/style.css`，通过 CSS 自定义属性（`--indigo`、`--gold`、`--radius-*` 等）定义设计令牌，实现主题与样式统一。

## 5. 未引入的工具

以下工具在当前代码库中**未被引入**（确认于 2026-08-12）：

| 工具类别 | 状态 | 备注 |
| --- | --- | --- |
| 测试框架（vitest/jest） | ❌ 未引入 | 无 test script，devDependencies 中无测试依赖 |
| 代码规范（eslint/prettier） | ❌ 未引入 | 无 lint/format 配置文件 |
| 环境变量（.env） | ❌ 未引入 | 无环境变量文件，开发代理直接硬编码于 vite.config |
| 日志 / 错误上报 | ❌ 未引入 | 全仓无 console.* 调用，无 logger 封装 |
| CI/CD | ❌ 未引入 | 无 CI 配置文件 |