import { i18n } from '@/lang'

/**
 * 翻译后端返回的 i18n key（R.msg）。
 * 命中语料则翻译并插值，未命中回退原 msg（保证不白屏）。
 */
export function translateApiMessage(
  msg: string,
  args?: Record<string, unknown> | unknown[],
): string {
  if (!msg) return msg
  const translated =
    args && args.length
      ? i18n.global.t(msg, args as Record<string, unknown>)
      : i18n.global.t(msg)
  // vue-i18n 未命中时返回 key 本身；返回空串时兜底回 key（保证不白屏）
  return translated || msg
}
