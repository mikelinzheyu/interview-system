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
  const envWsValue = import.meta?.env?.VITE_WS_BASE_URL?.trim()
  if (envWsValue) {
    return stripTrailingSlash(envWsValue)
  }

  const { origin } = API_BASE_COMPONENTS

  if (origin) {
    const url = new URL(origin)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}`
  }

  // Always use the backend URL from API_BASE_COMPONENTS or default
  return 'ws://localhost:3001'
}
