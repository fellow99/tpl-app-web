import service from './index'

export interface UserInfo {
  userId: number
  userName: string
  nickName: string
  phoneNumber: string
  email: string
  birthDate: string
}

export interface UpdateProfileParams {
  nickName: string
  email: string
  birthDate: string
  code: string
  uuid: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
  confirmPassword: string
  smsCode: string
  code: string
  uuid: string
}

/** GET /system/user/getInfo（token 续期） */
export function getInfoApi(): Promise<UserInfo> {
  return service.get('/system/user/getInfo')
}

/** GET /system/user/isEmptyPassword（当前账号是否无密码，微信一键登录自动建号） */
export function isEmptyPasswordApi(): Promise<boolean> {
  return service.get('/system/user/isEmptyPassword')
}

/** PUT /system/user/profile（修改用户信息，加密） */
export function updateProfileApi(data: UpdateProfileParams): Promise<void> {
  return service.put('/system/user/profile', data, { isEncrypt: true })
}

/** PUT /system/user/password（修改密码，加密） */
export function changePasswordApi(data: ChangePasswordParams): Promise<void> {
  return service.put('/system/user/password', data, { isEncrypt: true })
}
