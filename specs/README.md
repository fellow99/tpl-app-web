# 规格文档索引

**项目名称：** tpl-app-web（tpl-workspace网页端）
**版本：** 1.0.0
**技术栈：** Vue 3.5 + Vite 6 + TypeScript 5.6 + Pinia 2 + Vue Router 4
**文档生成时间：** 2026-08-12
**最后更新：** 2026-08-12

---

## 一、文档总览

| 层级 | 分类 | 文档数量 | 说明 |
|---|---|---|---|
| 整体 | 项目级顶层文档 | 6 | 目录结构、API 清单、技术选型、架构、宪法、检查清单 |
| 整体 | 整体规格文档 | 5 | overall-* 系列文档 |
| 模块 | 用户认证（002） | 3 | spec + plan + test-cases |
| 模块 | 个人中心（101） | 3 | spec + plan + test-cases |
| 模块 | 应用外壳（001） | 2 | spec + plan |
| 索引 | README | 1 | 本文档 |
| **合计** | **4 目录 / 20 文件** | | |

---

## 二、项目级顶层文档

全局性的架构、技术、宪法等文档，定义项目基线和开发准则。

| 文档 | 路径 | 说明 |
|---|---|---|
| **方案总纲** | [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统整体架构设计、分层架构、数据流、部署上下文 |
| **技术选型** | [TECH.md](./TECH.md) | 核心技术栈选型、版本、依赖说明 |
| **宪法原则** | [constitution.md](./constitution.md) | 项目开发原则、编码规范（编码/TS/样式/状态/API/路由/安全 7 章） |
| **项目结构** | [STRUCTURE.md](./STRUCTURE.md) | 源码目录结构、路由清单、组件清单、启动流 |
| **API 清单** | [API.md](./API.md) | 全量 API 接口清单、拦截器、代理映射、认证流程 |
| **检查清单** | [SPECS_CHECKLIST.md](./SPECS_CHECKLIST.md) | 规格文档完成度追踪（全部 18 份已完成） |

---

## 三、整体规格文档

描述跨模块的全局规格、方案和数据模型。

| 文档 | 路径 | 说明 |
|---|---|---|
| **整体规格** | [overall-spec.md](./overall-spec.md) | 系统级功能规格：用户故事、功能需求、非功能需求、系统边界 |
| **整体方案** | [overall-plan.md](./overall-plan.md) | 系统级技术方案：实现策略、横切关注点、部署策略 |
| **数据模型** | [overall-data-model.md](./overall-data-model.md) | 全局数据实体定义、状态形态、状态转换、校验规则 |
| **接口模型** | [overall-api.md](./overall-api.md) | 全局 API 规范：外部契约、请求响应格式、模块边界、代理、路由契约 |
| **测试用例索引** | [overall-test-cases.md](./overall-test-cases.md) | 全模块测试用例索引总览 |

---

## 四、功能模块文档

### 001 — 应用外壳与基础设施（App Shell & Infrastructure）

> 应用引导、页面外壳、导航守卫、HTTP 客户端、全局 Design Tokens 与通用样式类。

| 文档 | 链接 | 说明 |
|---|---|---|
| 功能规格 | [001-app-shell/spec.md](./001-app-shell/spec.md) | 18 条功能需求（FR-001-xxx）、7 条用户故事（面向开发者）、10 条验收场景 |
| 技术方案 | [001-app-shell/plan.md](./001-app-shell/plan.md) | 技术上下文、宪法符合性、数据模型、接口契约、实现策略 |

### 002 — 用户认证模块（User Authentication）

> 提供用户注册、登录、图形验证码、退出登录、会话鉴权与自动失效能力。

| 文档 | 链接 | 说明 |
|---|---|---|
| 功能规格 | [002-user-auth/spec.md](./002-user-auth/spec.md) | 30 条功能需求（FR-002-xxx）、8 条用户故事、10 条验收场景 |
| 技术方案 | [002-user-auth/plan.md](./002-user-auth/plan.md) | 技术上下文、宪法符合性、数据模型、实现策略、已知缺口 |
| 测试用例 | [002-user-auth/test-cases.md](./002-user-auth/test-cases.md) | 登录 12 + 注册 9 + 会话 5 + 响应式 2 + 可访问性 3 = 31 条 |

---

## 五、模块编号一览

| 编号 | 模块名 | 英文名 | 分类 |
|---|---|---|---|
| 001 | 应用外壳与基础设施 | app-shell | 基础设施 |
| 002 | 用户认证 | user-auth | 业务模块 |

---

## 六、模块文档结构规范

每个模块目录 `NNN-name/` 下包含以下标准文档：

| 文件 | 命名 | 说明 |
|---|---|---|
| 功能规格 | `spec.md` | 定义功能需求（FR-NNN-xxx）、用户故事、验收标准（RFC 2119） |
| 技术方案 | `plan.md` | 技术实现方案、架构决策、组件设计、文件清单 |
| 测试用例 | `test-cases.md` | UI 功能测试用例（仅前端界面模块，001 模块除外） |

---

## 七、快速导航

| 目标读者 | 推荐阅读顺序 |
|---|---|
| **新加入开发者** | constitution.md → STRUCTURE.md → overall-spec.md → 具体模块 spec.md |
| **架构师 / Tech Lead** | ARCHITECTURE.md → TECH.md → overall-plan.md → overall-api.md |
| **前端开发** | STRUCTURE.md → 对应模块的 spec.md + plan.md |
| **后端开发** | overall-api.md → overall-data-model.md → 对应模块的 spec.md |
| **测试 / QA** | overall-test-cases.md → SPECS_CHECKLIST.md → 各模块 test-cases.md |
| **产品经理** | overall-spec.md → 对应模块 spec.md |

---

## 八、配套后端工程

本工程对应的后端服务为 **tpl-app-api**。以下为后端工程文档索引，前后端模块编号保持一致。

### tpl-app-api（用户侧 API 后端）

| 项目 | 路径 | 技术栈 | 端口 |
|------|------|--------|------|
| tpl-app-api | `..\tpl-app-api\` | Spring Boot 3.2.5 / Java 17 / Sa-Token 1.38.0 / MyBatis-Plus 3.5.5 / PostgreSQL / Redis | 8082 |

**tpl-app-api 规范文档**（15 份）：

| 文档 | 链接 | 说明 |
|------|------|------|
| 工程 README | [../tpl-app-api/README.md](../tpl-app-api/README.md) | 后端工程说明、快速开始、技术栈 |
| 规范文档索引 | [../tpl-app-api/specs/README.md](../tpl-app-api/specs/README.md) | 全部 15 份后端规范文档导航 |
| 系统架构 | [../tpl-app-api/specs/ARCHITECTURE.md](../tpl-app-api/specs/ARCHITECTURE.md) | 后端分层架构、数据流、部署拓扑 |
| 技术选型 | [../tpl-app-api/specs/TECH.md](../tpl-app-api/specs/TECH.md) | 12 项核心技术栈、版本、依赖关系 |
| 宪法原则 | [../tpl-app-api/specs/constitution.md](../tpl-app-api/specs/constitution.md) | 10 条后端编码规范与架构约束 |
| API 接口清单 | [../tpl-app-api/specs/overall-api.md](../tpl-app-api/specs/overall-api.md) | 5 个 REST API 端点完整契约 |
| 数据模型 | [../tpl-app-api/specs/overall-data-model.md](../tpl-app-api/specs/overall-data-model.md) | 实体定义、ER 关系图、DTO、验证规则 |

**tpl-app-api 模块文档**（与本工程模块对应）：

| 后端模块 | 链接 | 前端对应模块 |
|---------|------|-------------|
| 002-user-auth（用户认证） | [spec](../tpl-app-api/specs/002-user-auth/spec.md) / [plan](../tpl-app-api/specs/002-user-auth/plan.md) | [002-user-auth](./002-user-auth/)（登录/注册前端） |
| 101-profile（个人中心） | [spec](../tpl-app-api/specs/101-profile/spec.md) / [plan](../tpl-app-api/specs/101-profile/plan.md) | [101-profile](./101-profile/)（个人中心前端） |

### 管理后台工程

| 工程 | 路径 | 关系 | 规格文档 |
|------|------|------|---------|
| tpl-manage | `..\tpl-manage\` | 管理后台后端（RuoYi-Vue-Plus），共享 PostgreSQL 数据库 | `..\tpl-manage\specs\` |
| tpl-manage-ui | `..\tpl-manage-ui\` | 管理后台前端（Vue 3 + Element Plus），独立设计体系 | `..\tpl-manage-ui\specs\` |

---

## 九、父工程规范文档（tpl-workspace 产品线）

tpl-workspace产品线级规范文档位于父工程 `../../specs/`，用于理解本工程在整体产品中的定位与约束。

| 文档 | 链接 | 说明 |
|------|------|------|
| 父工程规范索引 | [../../specs/README.md](../../specs/README.md) | 产品线级规范文档索引（22 份） |
| 整体架构 | [../../specs/ARCHITECTURE.md](../../specs/ARCHITECTURE.md) | 产品线整体架构、子工程依赖关系、部署拓扑 |
| 宪法原则 | [../../specs/constitution.md](../../specs/constitution.md) | 产品线级开发原则（10 条） |
| 整体规格 | [../../specs/overall-spec.md](../../specs/overall-spec.md) | 系统级功能规格（6 大产品模块） |

---

**文档维护者：** tpl-app-web 开发团队
