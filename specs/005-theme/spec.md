# 005-theme 模块规格说明（spec.md）

> 模块名称：主题皮肤切换模块（Theme / Skin Switching）
> 所属项目：tpl-app-web（tpl-workspace 用户侧 Web 应用）
> 文档类型：需求规格（与实现同步编写，落地实现见 plan.md）
> 模块范围：CSS 变量双皮肤（default/dark）、三态主题状态与持久化、首屏防闪烁、登录页切换按钮、个人中心「切换主题」入口
> 生成日期：2026-08-18
> 父工程规格引用：需求基准见 [../../../specs/005-theme/spec.md](../../../specs/005-theme/spec.md)（FR-005-001~019），样式变量事实源见 [../../../specs/005-theme/var.md](../../../specs/005-theme/var.md)，本文档仅补充本工程（Web 前端）特有规格

## 1. 模块概述（Module Overview）

> 依据父工程宪法「文档分工治理规则」，本工程 spec.md 引用父工程对应 spec.md 作为需求规格基准，不再重复编写父工程已定义的需求（var.md 事实源建立、变量命名规范、各端映射规则、tpl-manage-ui/后端排除等）。本节仅陈述本工程（Vue 3 + TS + 纯 CSS）的特有落地规格。

本模块为 tpl-app-web 提供「亮 + 暗」两套固定皮肤与三态切换能力，核心工作分四块：

- **样式变量双皮肤**：`src/style.css` 按父工程 `var.md` 落地角色变量（`--color-*`）与 DESIGN.md 色彩名别名（`--indigo` 等 10 色），`:root` 挂 default（亮色）值、`[data-theme="dark"]` 挂 dark（护眼暗色）值，现有页面经别名平滑迁移、零视觉回归。
- **三态主题状态**：`src/stores/theme.ts`（Pinia）维护 `light / dark / system` 三态（默认 `system`），localStorage `theme` 持久化，`system` 态经 `matchMedia('(prefers-color-scheme: dark)')` 解析并实时跟随系统。
- **首屏防闪烁**：`index.html` 内联脚本在 body 渲染前解析三态并设置 `data-theme`，避免暗色用户刷新时闪过亮色。
- **两个切换入口**：登录页右上角圆形 emoji 按钮（light↔dark 显式切换）；个人中心「偏好设置」区在「切换语言」下提供「切换主题」三态选择，两处共享同一 store 状态与持久化键。

### 1.1 需求编号映射（父工程 → 本工程）

父工程 FR-005-001~019 为产品线级需求；本工程细化需求自 FR-005-020 续编，映射关系如下：

| 父工程需求 | 本工程细化需求 |
|---|---|
| FR-005-001~006（var.md 变量体系） | FR-005-020~024（style.css 落地） |
| FR-005-007~010（三态机制） | FR-005-025~029（theme store） |
| 非功能（首屏防闪烁） | FR-005-030~031（index.html 内联脚本） |
| FR-005-011~014（登录页按钮） | FR-005-032~035 |
| FR-005-015~017（个人中心入口） | FR-005-036~038 |
| FR-005-018~019（范围约束） | FR-005-039~040 |
| 004-i18n 语料治理（语料单一事实源） | FR-005-041 |

## 2. 用户故事（User Stories）

- US-005-001：作为用户，我可在登录页右上角点击圆形按钮，一键切换亮色/暗色主题（亮色见 🌙、暗色见 ☀️），全程无整页刷新。
- US-005-002：作为用户，登录后我可在个人中心「偏好设置」的「切换语言」下找到「切换主题」，选择浅色 / 深色 / 跟随系统。
- US-005-003：作为用户，我切换主题后刷新页面或重新打开浏览器，主题选择仍被保留。
- US-005-004：作为用户，首次使用未手动选择时，主题默认跟随系统深浅色；系统深浅色变化时应用实时联动。
- US-005-005：作为用户，暗色主题下我仍能清晰辨识靛青/金曦品牌色，界面护眼不刺眼。
- US-005-006：作为前端开发者，我只需参考父工程 `var.md` 即可理解本工程全部颜色取值；既有 DESIGN.md 色彩名（`--indigo` 等）继续可用，无需改动现有组件。

## 3. 功能需求（Functional Requirements）

### 3.1 样式变量与双皮肤（src/style.css）

- **FR-005-021** 色彩名别名保留：既有 10 个 DESIGN.md 色彩名变量 MUST 保留为指向角色变量的别名（`--indigo: var(--color-primary)`、`--gold: var(--color-accent)`、`--verdigris`、`--cinnabar`、`--paper`、`--white`、`--ink`、`--inkstone`、`--silver`、`--frost`），MUST NOT 删除或改变其语义，现有页面 MUST 无视觉回归。
- **FR-005-022** 双皮肤挂载：`:root` MUST 挂 default（亮色）值，`[data-theme="dark"]` MUST 挂 dark（护眼暗色）值且 MUST 位于 `:root` 块之后；dark 值 MUST 与父工程 `var.md` §7 完全一致（`--color-primary: #5B7DB1`、`--color-bg: #1A1C1E`、`--color-surface: #26282B`、`--color-text: #E8E4DE` 等 10 项）。
- **FR-005-023** 品牌主色：default 皮肤品牌主色 MUST 为靛青 `#3B5998`；dark 皮肤 MUST 为提亮靛青 `#5B7DB1`（保证深底对比度），金曦 `#E8923C` 两套皮肤保持一致以保留品牌识别度。
- **FR-005-024** 别名联动：色彩名别名 MUST 仅在 `:root` 定义一次（经 `var()` 引用角色变量），dark 块 MUST NOT 重复定义别名；皮肤切换时别名取值 MUST 自动联动。

### 3.2 主题状态与持久化（src/stores/theme.ts）

- **FR-005-025** 三态状态：本工程 MUST 提供 Pinia composition store `useThemeStore`，状态 `theme` 取值 `'light' | 'dark' | 'system'`，默认 `'system'`；MUST 提供解析结果 `resolvedTheme: 'light' | 'dark'`。
- **FR-005-026** 本地持久化：主题选择 MUST 持久化于 localStorage `theme` 键，不涉及后端；读取时缺失或非法值 MUST 回退 `'system'`。
- **FR-005-027** 系统跟随：`system` 态 MUST 经 `window.matchMedia('(prefers-color-scheme: dark)')` 解析为实际皮肤，且 MUST 监听其 `change` 事件实时联动。
- **FR-005-028** 即时生效：主题切换 MUST 通过写 `document.documentElement.dataset.theme`（`'light' | 'dark'`）即时生效，MUST NOT 整页刷新。
- **FR-005-029** 显式切换：store MUST 提供 `toggleTheme()`，基于当前解析结果在 light↔dark 之间取反（显式选择，覆盖 `system` 默认）。

### 3.3 首屏防闪烁（index.html）

- **FR-005-030** 内联脚本：`index.html` `<head>` MUST 包含内联脚本，在 body 渲染前读取 localStorage `theme`、解析三态并设置 `document.documentElement.dataset.theme`。
- **FR-005-031** 规则一致：内联脚本 MUST 与 theme store 共享同一持久化键（`theme`）、同一白名单（`light/dark/system`）与同一解析规则（`system` → `matchMedia`），非法/缺失值同样回退 `system`。

### 3.4 登录页切换按钮（LoginPage.vue）

- **FR-005-032** 按钮形态：登录页 MUST 在页面右上角提供圆形图标按钮（emoji），绝对定位、不随表单滚动。
- **FR-005-033** 显式切换：点击 MUST 调用 `toggleTheme()`，在 light↔dark 之间显式切换并持久化。
- **FR-005-034** 状态反映：按钮 MUST 反映当前生效主题：亮色显示 `🌙`（点击切暗），暗色显示 `☀️`（点击切亮）。
- **FR-005-035** 点击区域与布局：按钮点击区域 MUST ≥ 44×44px，MUST 具备可访问名称（aria-label），MUST NOT 遮挡登录表单控件、MUST NOT 影响登录主流程。

### 3.5 个人中心「切换主题」（ProfilePage.vue）

- **FR-005-036** 入口位置：个人中心 MUST 提供「偏好设置」区块，其中「切换语言」入口之下 MUST 紧邻「切换主题」入口；「切换语言」MUST 与 AppLayout 顶栏语言下拉共享同一 i18n 实例、选项集与持久化键 `language`。
- **FR-005-037** 三态选择：「切换主题」MUST 提供三态选择（浅色 / 深色 / 跟随系统），选中值 MUST 直接写回 theme store。
- **FR-005-038** 状态同步：「切换主题」与登录页按钮 MUST 共享同一 theme store 状态与持久化键 `theme`；任一入口切换后，另一入口显示 MUST 同步一致。

### 3.6 范围约束

- **FR-005-039** 工程边界：本模块 MUST NOT 改动 tpl-manage-ui（沿用 RVP 体系）与后端（tpl-manage / tpl-app-api）。
- **FR-005-040** 技术约束：本模块 MUST NOT 引入 UI 组件库，保持纯 CSS + Design Tokens；MUST NOT 使用 `as any`、`@ts-ignore`、空 catch。

### 3.7 文案国际化

- **FR-005-041** 新增文案语料化：本模块新增界面文案 MUST 以 i18n key 表达（不得硬编码中文），key MUST 录入父工程 i18n 语料（`common.theme`、`common.theme.light/dark/system/toggle`、`auth.profile.sectionPreferences`、`auth.profile.switchLanguage`）并保持三语言（zh-CN / en-US / zh-TW）一致。

## 4. 关键结构（Key Structures）

- **主题三态（ThemeMode）**：`'light' | 'dark' | 'system'`，默认 `'system'`；持久化键 localStorage `theme`。
- **解析皮肤（ResolvedTheme）**：`'light' | 'dark'`；`system` → `matchMedia('(prefers-color-scheme: dark)')` 动态解析。
- **DOM 契约**：`document.documentElement.dataset.theme ∈ {'light','dark'}`；CSS 经 `:root`（default）与 `[data-theme="dark"]`（dark）切换变量集合。
- **CSS 变量体系**：角色变量 `--color-*`（29 项，var.md §3~§5）+ DESIGN.md 色彩名别名（10 项，var.md §7）；字体/间距/圆角/阴影/字号等非颜色令牌不随皮肤变化。

## 5. 验收场景（Acceptance Scenarios）

- **AS-001** 登录页一键切换：Given 登录页（亮色），When 点击右上角按钮，Then 主题切换为暗色、按钮由 🌙 变 ☀️，全程无刷新。
- **AS-002** 个人中心三态选择：Given 已登录进入个人中心，When 在「切换主题」选择「深色」，Then 界面即时切换暗色且下拉保持「深色」。
- **AS-003** 两入口同步：Given 登录页切为暗色，When 登录进入个人中心，Then 「切换主题」显示「深色」；改选「浅色」后返回登录页，按钮显示 🌙。
- **AS-004** 持久化：Given 已切换为暗色，When 刷新页面或重新打开浏览器，Then 仍为暗色（localStorage `theme=dark`）。
- **AS-005** 系统跟随：Given 未手动选择（`system`），When 系统切换为深色，Then 应用实时切换为暗色；再切回浅色，应用实时恢复亮色。
- **AS-006** 首屏防闪烁：Given `theme=dark`，When 刷新页面，Then 首屏直接呈现暗色，无亮色闪烁。
- **AS-007** 品牌色一致：Given 任一皮肤，Then 主色为 `--color-primary`（default `#3B5998` / dark `#5B7DB1`），金曦强调色保持 `#E8923C`。
- **AS-008** 既有页面兼容：Given default 皮肤，When 浏览登录/注册/个人中心/个人中心，Then 既有 10 色彩名别名取值与改造前一致，无视觉回归。

## 6. 非功能需求（Non-Functional Requirements）

- 主题切换 MUST 即时生效、无白屏、无闪烁（首屏由内联脚本保障）。
- 暗色皮肤 MUST 遵循 DESIGN.md §2.7「反色但保留靛青/金曦品牌识别度」原则。
- 颜色定义 MUST 单一来源（父工程 `var.md` 一处维护），本工程 MUST NOT 自造色值（hover/焦点圈等衍生色 MUST 由基础色经 `color-mix` 派生）。
- 切换按钮 MUST 满足最小点击区域（≥44px）与键盘可达（`:focus-visible` 焦点圈）。
- 主题偏好为纯本地数据，MUST NOT 上传后端。

## 7. 依赖（Dependencies）

- 上游：父工程 `specs/005-theme/{spec,var,plan}.md`（需求基准与颜色事实源）、`DESIGN.md` §2.7（暗色原则）、父工程 `i18n/` 语料（新增 7 key）。
- 框架：`pinia@^2.3.0`（主题状态）、`vue-i18n@^11`（切换文案三语言）。
- 浏览器 API：`localStorage`（持久化）、`window.matchMedia('(prefers-color-scheme: dark)')`（系统跟随）。
- 其他模块：001-app-shell（`src/style.css` Design Tokens 宿主）、004-i18n（`src/lang` 语言切换机制与 `LANG_OPTIONS` 复用）。
