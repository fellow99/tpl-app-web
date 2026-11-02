# AGENTS.md — tpl-app-web（用户端 Web 应用）

> 本文件为本子工程（`tpl-app-web/`）的 AI Agent 工作规范，是父工程 `tpl-workspace/AGENTS.md` 在本工程的具体化。
> 所有规范均基于本工程实际存在的技能、README 与 specs 编写。

---

## 一、项目简介

tpl-app-web 是「tpl-workspace」产品体系的**用户端 Web 前端工程**，基于 **Vue 3 + Vite + TypeScript** 的 SPA，
对接 `tpl-app-api` 后端服务，实现用户注册/登录、个人中心仪表盘等核心功能。

**本工程不使用任何 UI 组件库**，界面通过纯 CSS + Design Tokens 实现（设计依据 `../DESIGN.md`）。

## 二、技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript |
| 构建 | Vite 6 + pnpm 10 |
| 状态 | Pinia |
| 路由 | Vue Router |
| 网络 | Axios（拦截器封装） |
| 样式 | 纯 CSS + Design Tokens（无 UI 框架） |

## 三、代码结构

```
src/
├── api/          # HTTP 请求层（axios 实例 + 拦截器 + 接口封装）
├── stores/       # Pinia 状态管理
├── router/       # Vue Router 路由与导航守卫
├── components/   # 可复用组件（AppLayout 应用外壳）
├── views/        # 页面级组件
└── style.css     # Design Tokens + 全局样式 + 工具类
```

## 四、规格文档（specs）

`specs/` 下存放规格：`001-app-shell`、`002-user-auth`、`004-i18n`、`005-theme` 及系统文档
（`API.md`、`ARCHITECTURE.md`、`STRUCTURE.md`、`TECH.md`）。

## 五、常用开发命令

```bash
pnpm install
pnpm dev          # 开发
pnpm build        # 构建
```

## 六、代码库探索规范（codegraph）

本工程已配置 codegraph 代码地图（`.codegraph/` 索引），并在 git `post-commit` 钩子中
自动增量更新（`codegraph sync`）。

- **提交后**无需手动操作，索引自动与 HEAD 保持同步。
- **探索代码**优先使用 codegraph，而非 grep/Read 循环：
  - `codegraph status` — 检查索引状态
  - `codegraph context "<任务>"` — 生成任务相关代码简报
  - `codegraph query <符号>` — 查找符号定义
  - `codegraph callers <符号>` / `codegraph callees <符号>` — 调用关系
  - `codegraph impact <符号>` — 变更影响范围
  - `codegraph files --filter <目录>` — 索引文件树
- 索引过期（切换分支/外部 pull）时手动 `codegraph sync` 增量更新。
- `codegraph` 查询不到时先 `sync` 再重查；确属 codegraph 不支持的语法（如 SFC `<script setup>` 细节）才回退 grep。

> 索引目录 `.codegraph/` 已在 `.gitignore` 排除，不入库。

## 七、Git 提交规范

遵循父工程 `tpl-workspace/AGENTS.md` 的 Conventional Commits 规范，提交前加载 `git-commit` 技能。

## 八、开发流程与技能

- Vue 前端开发遵循父工程开发流程（`specs-based-devflow`、`frontend-design`、`requesting-code-review`、`receiving-code-review`、`systematic-debugging`）。
- 界面设计须保持纯 CSS Design Tokens 风格，维持跨端视觉一致（参考 `DESIGN.md`）。
- 代码库探索一律走 **codegraph**（见第六节）。

---

> 维护者：fellow99 · 属「tpl-workspace 多端业务应用框架」
