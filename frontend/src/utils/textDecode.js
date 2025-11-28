export function decodeUtf8Garbage(text) {
  if (typeof text !== 'string') return text

  try {
    // Fix strings that were UTF-8 but decoded as Latin-1, e.g. "è§£é”" -> "解锁"
    const decoded = decodeURIComponent(escape(text))

    // If decoding produced replacement characters, keep original
    if (decoded.includes('\uFFFD')) return text

    return decoded
  } catch {
    return text
  }
}

export function deepDecode(value) {
  if (Array.isArray(value)) {
    return value.map(deepDecode)
  }

  if (value && typeof value === 'object') {
    const result = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = deepDecode(val)
    }
    return result
  }

  return decodeUtf8Garbage(value)
}

