import CryptoJS from 'crypto-js'

/**
 * 生成 32 字符随机 hex 字符串（16 字节随机数 hex 编码）。
 * 该字符串的 UTF-8 字节即 AES 密钥（32 字节），按原始字节使用，与后端 Hutool 对齐。
 */
export function generateAesKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * AES-256-ECB-PKCS7 加密，返回 Base64(AES(plaintext))。
 */
export function encryptWithAes(plaintext: string, aesKeyHex: string): string {
  const key = CryptoJS.enc.Utf8.parse(aesKeyHex)
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

/**
 * 对 AES 密钥做 Base64 编码（供 RSA 公钥加密）。
 * 返回 Base64(aesKey_utf8_bytes)。
 */
export function encryptBase64(aesKeyHex: string): string {
  const key = CryptoJS.enc.Utf8.parse(aesKeyHex)
  return CryptoJS.enc.Base64.stringify(key)
}
