import service from './index'

export interface LoginParams {
  grantType: 'password' | 'sms'
  phoneNumber: string
  password?: string
  smsCode?: string
  code: string
  uuid: string
}

export interface LoginResult {
  access_token: string
}

export interface RegisterParams {
  phoneNumber: string
  password: string
  smsCode: string
  code: string
  uuid: string
}

export interface CaptchaResult {
  captchaEnabled: boolean
  uuid: string
  img: string
}

/** POST /auth/login（密码 / 短信登录，加密） */
export function loginApi(data: LoginParams): Promise<LoginResult> {
  return service.post('/auth/login', data, { isEncrypt: true })
}

/** POST /auth/register（手机注册 + 自动登录，加密） */
export function registerApi(data: RegisterParams): Promise<LoginResult> {
  return service.post('/auth/register', data, { isEncrypt: true })
}

/** GET /auth/code（图形验证码） */
export function getCaptchaApi(): Promise<CaptchaResult> {
  return service.get('/auth/code')
}

/** GET /resource/sms/code（发送短信验证码） */
export function sendSmsCodeApi(phoneNumber: string): Promise<void> {
  return service.get('/resource/sms/code', { params: { phoneNumber } })
}

/** POST /auth/logout */
export function logoutApi(): Promise<void> {
  return service.post('/auth/logout')
}
