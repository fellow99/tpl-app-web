# tpl-app-web API 端点清单（As-Built）

> 本文档描述前端 tpl-app-web（tpl-workspace网页端）实际消费的全部后端 API。
> 对应后端服务：`tpl-app-api`（`..\tpl-app-api\`），默认端口 **8082**。

## 1. API 基础配置

| 配置项 | 值 | 说明 |
|---|---|---|
| baseURL | `''`（空字符串） | 所有请求路径为相对路径，dev 环境依赖 Vite proxy 转发 |
| timeout | `15000` ms | 请求超时时间 |
| 请求库 | axios | 统一封装实例 `service`（`src/api/index.ts`） |
| Vite dev server | `0.0.0.0:5173` | 开发服务器地址 |
| Vite base | `/web/` | 前端部署路径前缀 |

统一响应包装结构（`ApiResponse<T>`，定义于 `src/api/index.ts`）：

```ts
interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}
```

## 2. 请求拦截器（Request Interceptor）

定义于 `src/api/index.ts`：

- 从 `localStorage.getItem('token')` 读取 token
- 若存在，则设置 `config.headers.Authorization = token`（**原样注入，无 `Bearer ` 前缀**）
- 业务代码统一将登录返回的 `access_token` 存入 localStorage key `token`

## 3. 响应拦截器（Response Interceptor）

定义于 `src/api/index.ts`，两层错误处理：

**业务层（HTTP 200，按 `code` 字段判断）**
- `data.code === 200`：返回解包后的 `data.data`
- `data.code === 401`：清除 `localStorage` 中的 `token`，跳转 `window.location.href = '/login'`，并 reject `Error(data.msg)`
- 其他非 200 code：reject `Error(data.msg || '请求失败')`

**HTTP 层（非 2xx 状态码）**
- `error.response?.status === 401`：清除 token，跳转 `/login`
- 错误消息取 `error.response?.data?.msg || error.message || '网络错误'`

## 4. API 端点表（Endpoint Inventory）

| # | Path | Method | 用途 | Entry File |
|---|---|---|---|---|
| 1 | `/auth/login` | POST | 用户登录；参数 `{ username, password, code, uuid }`；返回 `{ access_token, token_type }` | `src/api/auth.ts` |
| 2 | `/auth/register` | POST | 用户注册；参数 `{ username, password, code, uuid }` | `src/api/auth.ts` |
| 3 | `/auth/code` | GET | 获取图形验证码；返回 `{ captchaEnabled, uuid, img }` | `src/api/auth.ts` |
| 4 | `/auth/logout` | POST | 退出登录 | `src/api/auth.ts` |
| 5 | `/system/user/getInfo` | GET | 查询用户信息 | `src/api/profile.ts` |

## 5. 前端函数 ↔ 端点映射

| 函数名 | 端点 | 文件 |
|---|---|---|
| `loginApi(data)` | POST /auth/login | src/api/auth.ts |
| `registerApi(data)` | POST /auth/register | src/api/auth.ts |
| `getCaptchaApi()` | GET /auth/code | src/api/auth.ts |
| `logoutApi()` | POST /auth/logout | src/api/auth.ts |

## 6. 调用方（消费入口）

- `/auth/*` 四个端点 → `src/stores/user.ts`（Pinia `useUserStore`）

## 7. Vite Proxy 映射（vite.config.ts）

| Proxy 路径 | Target | changeOrigin | 后端服务 |
|---|---|---|---|
| `/api` | `http://localhost:8082` | `true` | tpl-app-api |
| `/auth` | `http://localhost:8082` | `true` | tpl-app-api |

## 8. 认证流程说明

1. 页面加载验证码：`GET /auth/code` → 获取 `uuid` + `img`
2. 用户登录：`POST /auth/login`（携带 username/password/code/uuid）→ 成功后将 `access_token` 存入 localStorage key `token`
3. 后续请求由请求拦截器自动附加 `Authorization` header
4. 退出：`POST /auth/logout`（或 token 失效触发 401）→ 清除 token 并跳转 `/login`

## 9. 后端部署信息

| 项 | 值 |
|---|---|
| 服务名 | tpl-app-api（`..\tpl-app-api\`） |
| 技术栈 | Spring Boot 3.2.5 / Java 17 / Sa-Token 1.38.0 |
| 默认端口 | 8082 |
| 配置来源 | `tpl-app-api/src/main/resources/application.yml` |
| 规范文档 | [README](../tpl-app-api/README.md) / [specs](../tpl-app-api/specs/README.md)（含 `002-user-auth`、`101-profile` 模块） |