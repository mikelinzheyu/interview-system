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
const isAbsoluteWebSocketUrl = (value) => /^wss?:\/\//i.test(value)

const isLoopbackHost = (hostname = '') => {
  const normalized = hostname.trim().toLowerCase()
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1'
}

const isDevelopmentMode = () => {
  const env = import.meta?.env
  const mode = env?.MODE || env?.VITE_APP_ENV
  return mode === 'development' || mode === 'dev'
}

const getCurrentOrigin = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.location.origin
}

const getCurrentWebSocketOrigin = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
}

const resolveApiBaseComponents = () => {
  const envValue = import.meta?.env?.VITE_API_BASE_URL?.trim()

  if (!envValue) {
    return { origin: '', basePath: DEFAULT_API_PREFIX }
  }

  if (isAbsoluteUrl(envValue)) {
    const url = new URL(envValue)
    if (!isDevelopmentMode() && isLoopbackHost(url.hostname)) {
      return { origin: '', basePath: DEFAULT_API_PREFIX }
    }

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
  const rawWsEnv = env?.VITE_WS_BASE_URL
  const envWsValue = rawWsEnv && rawWsEnv.trim()

  if (envWsValue && envWsValue !== 'auto') {
    const explicitValue = stripTrailingSlash(envWsValue)

    if (isAbsoluteWebSocketUrl(explicitValue)) {
      const url = new URL(explicitValue)
      if (!isDevelopmentMode() && isLoopbackHost(url.hostname)) {
        return getCurrentWebSocketOrigin() || explicitValue
      }
      return explicitValue
    }

    if (isAbsoluteUrl(explicitValue)) {
      const url = new URL(explicitValue)
      if (!isDevelopmentMode() && isLoopbackHost(url.hostname)) {
        return getCurrentWebSocketOrigin() || getCurrentOrigin() || 'ws://localhost:3001'
      }
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${url.host}`
    }

    return explicitValue
  }

  if (typeof window !== 'undefined') {
    return getCurrentWebSocketOrigin()
  }

  const { origin } = API_BASE_COMPONENTS
  if (origin) {
    const url = new URL(origin)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}`
  }

  return 'ws://localhost:3001'
}
