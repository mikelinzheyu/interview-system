/**
 * 简易拼音转换与匹配工具（轻量版）
 * 说明：仅内置少量常见汉字到拼音的映射；
 * 其余字符按原字符的小写返回（仅对英文有效）。
 */

// 极简映射：可按需补充
const pinyinMap = {
  '中': 'zhong',
  '国': 'guo',
  '学': 'xue',
  '习': 'xi',
  '数': 'shu',
  '据': 'ju',
  '结': 'jie',
  '构': 'gou',
  '前': 'qian',
  '端': 'duan',
  '后': 'hou',
  '全': 'quan',
  '站': 'zhan',
  '基': 'ji',
  '础': 'chu',
  '进': 'jin',
  '阶': 'jie',
  '挑': 'tiao',
  '战': 'zhan',
  '难': 'nan',
  '度': 'du',
}

function getCharPinyin(char) {
  // 英文、数字直接小写返回
  if (/^[a-zA-Z0-9]$/.test(char)) return char.toLowerCase()
  return pinyinMap[char] || ''
}

// 文本转拼音首字母，如“数据结构” -> “sjjg”
export function getPinyinInitials(text) {
  if (!text) return ''
  return String(text)
    .split('')
    .map((ch) => {
      const py = getCharPinyin(ch)
      return py ? py[0] : (/[a-zA-Z]/.test(ch) ? ch.toLowerCase() : '')
    })
    .join('')
}

// 文本转完整拼音，如“数据结构” -> “shujujiegou”
export function getFullPinyin(text) {
  if (!text) return ''
  return String(text)
    .split('')
    .map((ch) => getCharPinyin(ch) || (/[a-zA-Z0-9]/.test(ch) ? ch.toLowerCase() : ''))
    .join('')
}

// 粗略相似度（0-1），用于容错
export function getSimilarity(str1, str2) {
  if (!str1 || !str2) return 0
  const s1 = String(str1).toLowerCase()
  const s2 = String(str2).toLowerCase()
  if (s1 === s2) return 1
  if (!s1.length || !s2.length) return 0

  // 前缀与字符交集的简单度量
  let commonPrefix = 0
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) commonPrefix++
    else break
  }
  const inter = s1.split('').filter((c) => s2.includes(c)).length
  return (commonPrefix + inter) / Math.max(s1.length, s2.length)
}

// 文本匹配：精确/前缀/包含/拼音首字母/全拼音
export function fuzzyMatch(input, text) {
  if (!input || !text) return false
  const q = String(input).toLowerCase()
  const t = String(text).toLowerCase()

  if (t === q) return true
  if (t.startsWith(q)) return true
  if (t.includes(q)) return true

  const initials = getPinyinInitials(text)
  if (initials && (initials.includes(q) || q.split('').every((c) => initials.includes(c)))) return true

  const full = getFullPinyin(text)
  if (full && (full.startsWith(q) || full.includes(q))) return true

  return false
}

// 排序分数：粗略权重
export function getMatchScore(query, text) {
  if (!query || !text) return 0
  const q = String(query).toLowerCase()
  const t = String(text).toLowerCase()
  let score = 0

  if (t === q) score += 10
  if (t.startsWith(q)) score += 8
  if (t.includes(q)) score += 5

  const initials = getPinyinInitials(text)
  if (initials.startsWith(q)) score += 6

  const full = getFullPinyin(text)
  if (full.startsWith(q)) score += 5
  if (full.includes(q)) score += 3

  if (Math.abs(q.length - t.length) <= 2) score += 1
  return score
}

// 简单的拼写纠错
const typoCorrections = {
  javascrpt: 'javascript',
  jvascript: 'javascript',
  reacg: 'react',
  veu: 'vue',
  algorthm: 'algorithm',
  structer: 'structure',
  databse: 'database',
  netwrok: 'network',
}

export function correctTypo(input) {
  if (!input) return ''
  const lower = String(input).toLowerCase()
  if (typoCorrections[lower]) return typoCorrections[lower]

  let best = lower
  let bestScore = 0
  for (const [typo, correct] of Object.entries(typoCorrections)) {
    const s = getSimilarity(lower, typo)
    if (s > bestScore && s > 0.6) {
      bestScore = s
      best = correct
    }
  }
  return best
}

export default {
  getPinyinInitials,
  getFullPinyin,
  getSimilarity,
  fuzzyMatch,
  getMatchScore,
  correctTypo,
}

