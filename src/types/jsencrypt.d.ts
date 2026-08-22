declare module 'jsencrypt' {
  export default class JSEncrypt {
    constructor(options?: { default_key_size?: string })
    setPublicKey(pubkey: string): void
    setPrivateKey(privkey: string): void
    encrypt(plaintext: string): string | false
    decrypt(ciphertext: string): string | false
    sign(content: string, hash: string, signatureType: string): string
    verify(content: string, signature: string, hash: string): boolean
  }
}
