import JSEncrypt from 'jsencrypt'
import { translateApiMessage } from '@/utils/i18n'

const PUBLIC_KEY_BASE64 = import.meta.env.VITE_APP_RSA_PUBLIC_KEY || ''

/** 将 .env 中的单行 base64 公钥（X.509 DER）拼装为 PEM */
function buildPublicKey(): string {
  if (!PUBLIC_KEY_BASE64) {
    return ''
  }
  return `-----BEGIN PUBLIC KEY-----\n${PUBLIC_KEY_BASE64}\n-----END PUBLIC KEY-----`
}

/**
 * RSA 公钥加密（PKCS#1 v1.5），返回 Base64 密文。
 */
export function rsaEncrypt(plaintext: string): string {
  const publicKey = buildPublicKey()
  if (!publicKey) {
    throw new Error(translateApiMessage('message.error.rsaKeyMissing'))
  }
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  const result = encryptor.encrypt(plaintext)
  if (result === false) {
    throw new Error(translateApiMessage('message.error.rsaEncryptFailed'))
  }
  return result
}
