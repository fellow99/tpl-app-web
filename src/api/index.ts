import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { generateAesKey, encryptWithAes, encryptBase64 } from '@/utils/crypto'
import { rsaEncrypt } from '@/utils/jsencrypt'
import { translateApiMessage } from '@/utils/i18n'

/** Standard API response wrapper R<T> */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  msgArgs?: unknown[]
  data: T
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 标记该请求需 AES+RSA 混合加密（请求体） */
    isEncrypt?: boolean
  }
}

const service = axios.create({
  baseURL: '',
  timeout: 15000,
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      // 裸 token，无 "Bearer " 前缀（后端 Sa-Token 未配 token-prefix）
      config.headers.Authorization = token
    }
    if (config.isEncrypt && (config.method === 'post' || config.method === 'put') && config.data !== undefined) {
      const aesKey = generateAesKey()
      config.headers['encrypt-key'] = rsaEncrypt(encryptBase64(aesKey))
      // 加密后 body 为 Base64 字符串，以 text/plain 原样发送（避免 axios 按 application/json 二次包裹）
      config.headers['Content-Type'] = 'text/plain'
      config.data = encryptWithAes(JSON.stringify(config.data), aesKey)
    }
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    if (data.code !== 200) {
      if (data.code === 401) {
        localStorage.removeItem('token')
        window.location.href = '/web/login'
      }
      return Promise.reject(new Error(translateApiMessage(data.msg, data.msgArgs)))
    }
    return data.data as unknown as AxiosResponse
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/web/login'
    }
    const msg = error.response?.data?.msg
    const message = msg
      ? translateApiMessage(msg, error.response?.data?.msgArgs)
      : error.message || translateApiMessage('message.error.network')
    return Promise.reject(new Error(message))
  },
)

export default service
