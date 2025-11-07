import { ref, readonly } from 'vue'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

const locale = ref('zh-CN')

function resolve(path, obj, fallback) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj) ?? fallback
}

function t(key, params = {}) {
  const pack = messages[locale.value] || enUS
  let value = resolve(key, pack, undefined)
  if (value == null) value = resolve(key, enUS, key)
  if (typeof value !== 'string') return key
  return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '')
}

function setLocale(next) {
  if (messages[next]) locale.value = next
}

export function useI18n() {
  return { t, locale: readonly(locale), setLocale }
}

export default { useI18n, t, setLocale, locale: readonly(locale) }

