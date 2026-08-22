/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_RSA_PUBLIC_KEY: string
  readonly VITE_APP_WECHAT_LOGIN_ENABLED: string
  readonly VITE_APP_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
