# 004-i18n 模块规格说明（spec.md）

> 模块名称：多语言国际化模块（Internationalization / i18n）
> 所属项目：tpl-app-web（tpl-workspace 用户侧 Web 应用）
> 文档类型：As-Built 需求规格（从现有代码行为提取）
> 模块范围：vue-i18n 接入、后端 key 翻译、语言切换与持久化、界面文案国际化
> 生成日期：2026-08-18
> 父工程规格引用：需求基准见 [../../../specs/004-i18n/spec.md](../../../specs/004-i18n/spec.md)，本文档仅补充本工程（Web 前端）特有规格

## 1. 模块概述（Module Overview）

> 依据父工程宪法「文档分工治理规则」§4.5，本工程 spec.md 引用父工程对应 spec.md 作为需求规格基准，不再重复编写父工程已定义的需求（语料事实源、key 命名规范、同步管道、后端返回 key 契约等）。本节仅陈述本工程（Vue 3 + TS 前端）的特有落地规格。

本模块为 tpl-app-web 提供多语言国际化能力，核心工作分三块：

- **语料接入**：由父工程 `i18n/scripts/sync-i18n.mjs` 生成 `src/lang/{zh-CN,en-US,zh-TW}.ts` 三个语料对象（各 214 key），通过 vue-i18n 装载为应用级 i18n 实例。
- **后端 key 翻译**：后端统一响应 `R.msg` 返回 i18n key，本工程在 axios 响应拦截器统一调用 `translateApiMessage` 翻译，未命中时回退原 key 保证不白屏。
- **语言切换**：默认跟随系统语言，应用内可手动切换（zh-CN / en-US / zh-TW）并本地持久化。

## 2. 用户故事（User Stories）

- US-004-001：作为用户，我可在应用顶栏切换语言为简体中文、English 或繁體中文，界面与后端提示随之切换。
- US-004-002：作为用户，当我首次访问时，应用自动跟随我的浏览器语言显示，无需手动设置。
- US-004-003：作为用户，我切换语言后刷新页面，我的语言选择仍被保留。
- US-004-004：作为后端联调开发者，后端返回的 i18n key（如 `message.error.loginFailed`）能被前端自动翻译为当前语言文案。
- US-004-005：作为前端开发者，当语料缺失某 key 时，界面仍能显示该 key 而非白屏或崩溃。

## 3. 功能需求（Functional Requirements）

### 3.1 vue-i18n 接入

- **FR-004-001** 依赖声明：本工程 MUST 在 `package.json` 声明 `vue-i18n@^11` 依赖。
- **FR-004-002** i18n 实例：本工程 MUST 通过 `createI18n({ legacy: false, globalInjection: true })` 创建 Composition 模式 i18n 实例，并 MUST 装配 zh-CN / en-US / zh-TW 三套语料。
- **FR-004-003** 应用挂载：应用入口 `src/main.ts` MUST 通过 `app.use(i18n)` 注册 i18n 插件。
- **FR-004-004** 回退语言：i18n 实例 MUST 配置 `fallbackLocale: 'zh-CN'`，语料缺失时回退简体中文。

### 3.2 语料对象

- **FR-004-005** 语料文件：本工程 MUST 提供 `src/lang/{zh-CN,en-US,zh-TW}.ts` 三个语料模块，由父工程 sync 脚本生成（文件头标注 Auto-generated，禁止手改），三套语料 key MUST 一致（各 214 key）。
- **FR-004-006** 语料形态：语料 MUST 为扁平 key-value 对象（key 为点号分隔，如 `message.error.loginFailed`），遵循父工程 spec §3.1 的 key 命名规范。

### 3.3 语言解析与持久化

- **FR-004-007** 语言读取：`getLanguage()` MUST 优先读取 localStorage `language`（仅当为受支持 locale 时采纳），否则回退浏览器 `navigator.language`。
- **FR-004-008** 语言归一化：`normalizeSystemLocale()` MUST 将系统语言归一到受支持三语言——含 `tw/hk/mo/hant` 的 zh 归一到 `zh-TW`，其余 zh 归一到 `zh-CN`，en 归一到 `en-US`，其余归一到 `zh-CN`。
- **FR-004-009** 语言切换：`setLanguage(lang)` MUST 同时写 localStorage `language` 与更新 `i18n.global.locale.value`。
- **FR-004-010** 受支持语言集合：本工程 MUST 导出 `SUPPORTED_LOCALES = ['zh-CN', 'en-US', 'zh-TW']` 作为唯一受支持语言集合。

### 3.4 后端 key 翻译

- **FR-004-011** 翻译工具：本工程 MUST 提供 `translateApiMessage(msg, args?)`，通过 `i18n.global.t(msg)` 翻译后端返回的 key，并支持带参消息插值。
- **FR-004-012** 未命中兜底：`translateApiMessage` MUST 在语料未命中（返回 key 本身）或翻译结果为空串时回退返回原 `msg`，MUST NOT 抛异常、MUST NOT 影响主流程。
- **FR-004-013** 拦截器翻译：axios 响应拦截器 MUST 在 `data.code !== 200` 时以 `Promise.reject(new Error(translateApiMessage(data.msg, data.msgArgs)))` 抛出已翻译错误。
- **FR-004-014** 网络异常兜底：HTTP 层异常（无响应体）时 MUST 以 `translateApiMessage('message.error.network')` 兜底，保证网络错误提示也被国际化。

### 3.5 界面文案迁移

- **FR-004-015** 视图迁移：登录页、注册页、个人中心、微信回调页、应用外壳等视图的硬编码中文文案 MUST 迁移为 `$t()` / `t()` 调用。
- **FR-004-017** 语言切换入口：应用外壳（AppLayout）顶栏 MUST 提供语言切换入口，可切换 zh-CN / en-US / zh-TW。

### 3.6 登录错误保留

- **FR-004-018** 验证码刷新不抹错：登录页 `refreshCaptcha()` MUST NOT 清空 `errorMsg`，登录失败展示的错误信息 MUST 在自动刷新验证码后仍保留可见。

## 4. 关键结构（Key Structures）

- **语言标识（Locale）**：`'zh-CN' | 'en-US' | 'zh-TW'`，由 `SUPPORTED_LOCALES` 派生。
- **语料对象（Messages）**：扁平 key-value 对象，三语言 key 一致，共 214 key。
- **统一响应（ApiResponse\<T\>）**：`{ code: number; msg: string; msgArgs?: unknown[]; data: T }`，其中 `msg` 为 i18n key，`msgArgs` 为可选插值参数。

## 5. 验收场景（Acceptance Scenarios）

- **AS-001** 三语言切换：在顶栏依次切换 简体中文 → English → 繁體中文，界面文案与后端提示随之切换。
- **AS-002** 后端 key 翻译：英文语言下登录失败（后端返回 `R.msg="message.error.loginFailed"`），界面显示 "Login failed"。
- **AS-003** 未命中兜底：后端返回前端语料不存在的 key，界面显示该原 key、不白屏。
- **AS-004** 语言持久化：切换为英文后刷新页面，语言仍为英文。
- **AS-005** 系统语言跟随：清空 localStorage 后首次访问，浏览器语言为 en-US 时界面默认英文。
- **AS-006** 登录错误保留：登录失败后验证码自动刷新，错误提示仍可见、不被抹掉。

## 6. 非功能需求（Non-Functional Requirements）

- 语料 MUST UTF-8 编码；未命中兜底 MUST 不抛异常、不白屏。
- 语言切换 MUST 即时重渲染（响应式），无需整页刷新。
- `translateApiMessage` MUST 幂等、无副作用，可在拦截器中安全调用。

## 7. 依赖（Dependencies）

- 上游：父工程 `i18n/`（语料事实源 + `sync-i18n.mjs` 生成脚本），本工程语料文件由父工程生成。
- 框架：`vue-i18n@^11`（Composition 模式）。
- 后端：tpl-app-api 统一响应 `R.msg` 返回 i18n key（父工程 spec §3.3）。
- 存储：浏览器 localStorage（语言持久化）。
- 其他模块：`src/api/index.ts`（拦截器翻译）。
