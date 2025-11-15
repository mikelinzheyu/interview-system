const DEFAULT_API_PREFIX = '/api'

const ensureLeadingSlash = (value) => {
  if (!value) {
    return ''
  }
  return value.startsWith('/') ? value : `/${value}`
}

const stripTrailingSlash = (value) => {
  if (!value) {
    return ''
  }
  if (value === '/') {
    return ''
  }
  return value.replace(/\/+$/, '')
}

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value)

const resolveApiBaseComponents = () => {
  const envValue = import.meta?.env?.VITE_API_BASE_URL?.trim()

  if (!envValue) {
    return { origin: '', basePath: DEFAULT_API_PREFIX }
  }

  if (isAbsoluteUrl(envValue)) {
    const url = new URL(envValue)
    const pathname = stripTrailingSlash(url.pathname)
    return {
      origin: url.origin,
      basePath: pathname ? ensureLeadingSlash(pathname) : ''
    }
  }

  const sanitizedPath = stripTrailingSlash(envValue)
  return {
    origin: '',
    basePath: ensureLeadingSlash(sanitizedPath)
  }
}

const API_BASE_COMPONENTS = resolveApiBaseComponents()

export const getApiBaseUrl = () => {
  const { origin, basePath } = API_BASE_COMPONENTS
  if (origin) {
    return `${origin}${basePath || ''}`
  }
  return basePath || ''
}

export const buildApiUrl = (path = '') => {
  if (!path) {
    return getApiBaseUrl()
  }

  if (isAbsoluteUrl(path)) {
    return path
  }

  const normalizedPath = ensureLeadingSlash(path)
  const { origin, basePath } = API_BASE_COMPONENTS

  let finalPath = normalizedPath
  if (basePath) {
    const normalizedBase = ensureLeadingSlash(basePath)
    if (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`)) {
      finalPath = normalizedPath
    } else {
      finalPath = `${normalizedBase}${normalizedPath}`
    }
  }

  if (origin) {
    return `${origin}${finalPath}`
  }

  return finalPath
}

export const getWebSocketBaseUrl = () => {
  const env = import.meta?.env

  // 1) 如果显式配置了 WebSocket 地址且不为 auto，则优先使用
  const rawWsEnv = env?.VITE_WS_BASE_URL
  const envWsValue = rawWsEnv && rawWsEnv.trim()
  if (envWsValue && envWsValue !== 'auto') {
    return stripTrailingSlash(envWsValue)
  }

  // 2) 本地开发场景：优先使用当前前端页面所在的 host
  //    这样 WebSocket 走 Vite 的 /socket.io 代理，避免直接连 3001 端口被防火墙/安全软件拦截
  const mode = env?.MODE || env?.VITE_APP_ENV
  if (typeof window !== 'undefined' && (mode === 'development' || mode === 'dev')) {
    const isSecure = window.location.protocol === 'https:'
    const protocol = isSecure ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }

  // 3) 其他环境：从 API_BASE_COMPONENTS 推导后端地址
  const { origin } = API_BASE_COMPONENTS

  if (origin) {
    const url = new URL(origin)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}`
  }

  // 4) 最后兜底
  return 'ws://localhost:3001'
}
