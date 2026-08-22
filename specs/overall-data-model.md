# 整体数据模型 (Overall Data Model)

> 本文档为 **as-built** 数据模型说明，基于当前代码实现编写，所有类型定义均与源码保持一致。
> 生成日期：2026-08-22

## 1. 核心实体与关系 (Key Entities & Relationships)

```
┌─────────────┐   owns     ┌──────────────────┐
│    User     │──────────▶ │  Auth Session    │
│  (用户身份)  │ (token)    │ (token 会话)     │
└──────┬──────┘            └──────────────────┘
       │
       │
       ▼
┌──────────────────┐   verifies   ┌──────────────────┐
│   User Profile    │              │     Captcha      │
│  (个人中心)        │              │   (图形验证码)    │
└──────────────────┘              └──────────────────┘
```

- **User（用户身份）**：描述登录用户的基础身份信息（userId、userName、nickName、phoneNumber、email、birthDate），由 `UserInfo` 类型定义，存储在 Pinia `userStore.userInfo` 中。
- **Auth Session（认证会话）**：基于 JWT token 的会话管理。token 持久化到 `localStorage`（key: `'token'`），由 `userStore.token` 持有；请求时由 axios 拦截器注入 `Authorization` 请求头。
- **Captcha（图形验证码）**：登录/注册前的图片验证。`CaptchaResult` 携带 `captchaEnabled` 开关、`uuid`（会话 ID）与 base64 图片。

### 关系要点

1. `User` 与 `Auth Session`：登录成功后将 `LoginResult.access_token` 存入 store 并持久化，token 即会话凭证；登出或 401 时清除。
2. `Captcha` 与登录/注册：登录与注册表单共用同一验证码流程，`CaptchaResult.uuid` 必须在提交时原样回传。

## 2. 实体定义 (Entity Definitions)

### 2.1 ApiResponse\<T\> — API 响应包装器

来源：`src/api/index.ts`

```ts
export interface ApiResponse<T = unknown> {
  code: number   // 业务状态码：200 = 成功，401 = 未认证
  msg: string    // 服务端消息
  data: T        // 业务数据负载
}
```

**约定**：
- `code === 200` 时响应拦截器直接返回 `data.data`，即调用方拿到的类型为 `T`。
- `code !== 200` 时抛出 `new Error(data.msg || '请求失败')`。
- `code === 401` 时：清除 `localStorage` 中的 `token` 并跳转 `/login`。
- HTTP 状态码 401 同样触发清除 token + 跳转 `/login`。
- 请求拦截器将 token 以**原始值**（无 `Bearer ` 前缀）写入 `Authorization` 请求头。

### 2.2 LoginParams — 登录请求参数

来源：`src/api/auth.ts`

```ts
export interface LoginParams {
  username: string   // 用户名
  password: string   // 密码
  code: string       // 验证码内容
  uuid: string       // 验证码会话 ID
}
```

### 2.3 LoginResult — 登录响应结果

来源：`src/api/auth.ts`

```ts
export interface LoginResult {
  access_token: string   // JWT token
  token_type: string     // token 类型
}
```

### 2.4 RegisterParams — 注册请求参数

来源：`src/api/auth.ts`

```ts
export interface RegisterParams {
  username: string   // 用户名
  password: string   // 密码
  code: string       // 验证码内容
  uuid: string       // 验证码会话 ID
}
```

### 2.5 CaptchaResult — 验证码响应结果

来源：`src/api/auth.ts`

```ts
export interface CaptchaResult {
  captchaEnabled: boolean   // 是否启用验证码
  uuid: string              // 验证码会话 ID
  img: string               // 验证码图片（base64）
}
```

### 2.6 UserInfo — 用户资料

来源：`src/stores/user.ts`

```ts
export interface UserInfo {
  userId: number    // 用户 ID
  userName: string  // 登录用户名
  nickName: string  // 昵称
  phoneNumber: string  // 手机号
  email: string     // 邮箱
  birthDate: string // 生日
}
```

## 3. 状态形态 (State Shapes)

### 3.1 User Store (Pinia) — `src/stores/user.ts`

| 状态 | 类型 | 初始值 | 说明 |
|---|---|---|---|
| `token` | `string \| null` | `localStorage.getItem('token')` | JWT token；set/clear 同步读写 localStorage（key: `'token'`） |
| `userInfo` | `UserInfo \| null` | `null` | 当前用户资料 |
| `isLoggedIn` | `boolean`（computed） | `!!token` | 由 `token` 派生：`computed(() => !!token.value)` |

**Actions**：
- `login(params)` → 调 `loginApi`，成功后 `setToken(result.access_token)`
- `register(params)` → 调 `registerApi`，不设置 token（注册后需回登录页）
- `fetchCaptcha()` → 调 `getCaptchaApi`
- `logout()` → 调 `logoutApi`，**无论 API 成功与否**（`finally` 块）均 `clearToken()` 并置空 `userInfo`
- `setToken(newToken)` / `clearToken()` — token 写入/清除（含 localStorage）
- `setUserInfo(info)` — 设置用户资料
- `restoreFromStorage()` — 从 localStorage 恢复 token

### 3.2 登录页状态（Login Page State）— `src/views/LoginPage.vue`

```ts
const form = reactive({ username: '', password: '', code: '', uuid: '' })
const captchaImg = ref('')        // 验证码图片（base64）
const captchaEnabled = ref(true)  // 验证码开关
const errorMsg = ref('')          // 表单错误提示
const loading = ref(false)        // 提交中标识
```

### 3.3 注册页状态（Register Page State）— `src/views/RegisterPage.vue`

```ts
const form = reactive({
  username: '', password: '', confirmPassword: '', code: '', uuid: '',
})
const captchaImg = ref('')
const captchaEnabled = ref(true)
const errorMsg = ref('')
const loading = ref(false)
const showSuccess = ref(false)                  // 注册成功 toast 显示开关
const successMsg = ref('注册成功，请登录')
const passwordMismatch = computed(               // 派生状态：两次密码不一致
  () => form.confirmPassword.length > 0 && form.password !== form.confirmPassword,
)
```

### 3.4 个人中心页状态 — `src/views/ProfilePage.vue`

```ts
const userInfo = ref<UserInfo | null>(null)
const loading = ref(true)
const errorMsg = ref('')
```

## 4. 状态转换 (State Transitions)

### 4.1 认证会话 (Auth Session)

```
Logged Out ── login success ──▶ Logged In (token set)
     ▲                              │
     │        401 or logout         │
     └──────────────────────────────┘
         (token cleared + redirect)
```

- **登录成功**：`login()` → 后端返回 `LoginResult` → `setToken(access_token)` → 跳转 `/profile`
- **登出**：`logout()` → 调 `POST /auth/logout` → `finally` 中 `clearToken()` + 置空 `userInfo`
- **自动登出（401）**：响应拦截器中 `data.code === 401` 或 HTTP 状态 401 → 清除 token 并跳转 `/login`
- **登录失败**：抛出 `Error(msg)`，页面捕获后展示 `errorMsg` 并 `refreshCaptcha()`

### 4.2 验证码生命周期 (Captcha Lifecycle)

```
page mount → fetchCaptcha() → captchaEnabled?
  ├─ false → 隐藏验证码输入框
  └─ true  → 渲染图片，uuid 存入 form
               ├─ 提交登录/注册 → code + uuid 回传
               └─ 失败/点击图片 → 重新 fetchCaptcha()
```

### 4.3 注册流程 (Register Flow)

```
填写表单 → 前端校验 → POST /auth/register
  ├─ 成功 → showSuccess=true → 2s 后跳转 /login
  └─ 失败 → errorMsg + refreshCaptcha()
```

## 5. 校验规则 (Validation Rules)

### 5.1 登录校验

| 字段 | 规则 | 错误提示 |
|---|---|---|
| `username` | 必填 | `请填写完整信息` |
| `password` | 必填 | `请填写完整信息` |
| `code` | `captchaEnabled` 为 true 时必填 | `请输入验证码` |
| `code` | 输入框 `maxlength="4"` | — |

### 5.2 注册校验

| 字段 | 规则 | 错误提示 |
|---|---|---|
| `username` | 必填 | `请填写完整信息` |
| `password` | 必填 | `请填写完整信息` |
| `confirmPassword` | 与 `password` 一致 | `两次输入的密码不一致` |
| `code` | `captchaEnabled` 为 true 时必填 | `请输入验证码` |

校验顺序：完整信息 → 验证码 → 密码一致性。
