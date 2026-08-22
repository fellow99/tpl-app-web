import service from './index'
import type { LoginResult } from './auth'

/** 第三方登录请求体（grantType=social，网站扫码 / 移动拉起） */
export interface SocialLoginParams {
  clientId: string
  grantType: 'social'
  source: string
  socialCode: string
  socialState: string
}

/** GET /auth/binding/{source}（返回第三方授权跳转 URL，拦截器已 unwrap 到 data） */
export function authRouterUrl(source: string): Promise<string> {
  return service.get(`/auth/binding/${source}`)
}

/** POST /auth/login（grantType=social，微信扫码/拉起登录，加密） */
export function socialLogin(data: SocialLoginParams): Promise<LoginResult> {
  return service.post('/auth/login', data, { isEncrypt: true })
}

/** POST /auth/social/callback（已登录用户绑定第三方，加密） */
export function socialCallback(data: SocialLoginParams): Promise<void> {
  return service.post('/auth/social/callback', data, { isEncrypt: true })
}
