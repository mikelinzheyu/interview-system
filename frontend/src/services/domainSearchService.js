/**
 * 域名搜索服务 - 支持拼音、别名、模糊搜索
 */

// 中文字符到拼音的映射（常见字符）
const pinyinMap = {
  '计': 'ji', '算': 'suan', '机': 'ji', '科': 'ke', '学': 'xue', '技': 'ji', '术': 'shu',
  '工': 'gong', '程': 'cheng', '金': 'jin', '融': 'rong', '财': 'cai', '会': 'hui',
  '经': 'jing', '济': 'ji', '法': 'fa', '律': 'lü', '管': 'guan', '理': 'li',
  '医': 'yi', '药': 'yao', '护': 'hu', '理': 'li', '教': 'jiao', '育': 'yu',
  '文': 'wen', '学': 'xue', '历': 'li', '史': 'shi', '哲': 'zhe', '学': 'xue',
  '艺': 'yi', '术': 'shu', '音': 'yin', '乐': 'le', '美': 'mei', '术': 'shu',
  '农': 'nong', '学': 'xue', '林': 'lin', '学': 'xue', '水': 'shui', '利': 'li',
  '电': 'dian', '子': 'zi', '信': 'xin', '息': 'xi', '软': 'ruan', '件': 'jian',
  '网': 'wang', '络': 'luo', '数': 'shu', '据': 'ju', '库': 'ku', '大': 'da',
  '安': 'an', '全': 'quan', '系': 'xi', '统': 'tong', '设': 'she', '计': 'ji',
  '物': 'wu', '理': 'li', '化': 'hua', '学': 'xue', '生': 'sheng', '物': 'wu'
}

/**
 * 将中文转换为拼音首字母缩写
 * @param {string} text 中文文本
 * @returns {string} 拼音首字母缩写
 */
function getInitials(text) {
  if (!text) return ''

  return text
    .split('')
    .map(char => {
      // 如果是英文，直接返回
      if (/^[a-zA-Z]$/.test(char)) return char.toLowerCase()
      // 如果在拼音映射中，返回首字母
      if (pinyinMap[char]) return pinyinMap[char][0]
      return ''
    })
    .join('')
}

/**
 * 将中文转换为完整拼音
 * @param {string} text 中文文本
 * @returns {string} 拼音
 */
function getPinyin(text) {
  if (!text) return ''

  return text
    .split('')
    .map(char => {
      if (/^[a-zA-Z0-9]$/.test(char)) return char.toLowerCase()
      return pinyinMap[char] || ''
    })
    .join('')
}

/**
 * 检查字符串是否包含搜索关键词
 * @param {string} source 源字符串
 * @param {string} keyword 搜索关键词
 * @returns {boolean} 是否包含
 */
function matchKeyword(source, keyword) {
  if (!source || !keyword) return false

  const lowerSource = source.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()

  // 直接字符串匹配
  if (lowerSource.includes(lowerKeyword)) return true

  // 拼音匹配
  const pinyin = getPinyin(source)
  if (pinyin.includes(lowerKeyword)) return true

  // 拼音首字母匹配
  const initials = getInitials(source)
  if (initials.includes(lowerKeyword)) return true

  return false
}

/**
 * 搜索域
 * @param {Array} domains 域列表
 * @param {string} keyword 搜索关键词
 * @returns {Array} 搜索结果
 */
export function searchDomains(domains, keyword) {
  if (!keyword || !keyword.trim()) {
    return domains
  }

  const trimmedKeyword = keyword.trim()

  return domains.filter(domain => {
    const name = domain.name || ''
    const description = domain.description || ''
    const shortDescription = domain.shortDescription || ''
    const tags = Array.isArray(domain.tags) ? domain.tags.join(' ') : ''
    const aliases = Array.isArray(domain.aliases) ? domain.aliases.join(' ') : ''

    const searchText = `${name} ${description} ${shortDescription} ${tags} ${aliases}`

    return matchKeyword(searchText, trimmedKeyword)
  })
}

/**
 * 按类别分组域
 * @param {Array} domains 域列表
 * @returns {Array} 分组后的域列表 [{category, domains: []}, ...]
 */
export function groupDomainsByCategory(domains) {
  const groups = {}

  domains.forEach(domain => {
    const category = domain.category || domain.type || '其他'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(domain)
  })

  return Object.entries(groups).map(([category, items]) => ({
    category,
    domains: items,
    count: items.length
  }))
}

/**
 * 获取搜索建议
 * @param {Array} domains 域列表
 * @param {string} keyword 输入的关键词
 * @returns {Array} 建议列表
 */
export function getSuggestions(domains, keyword) {
  if (!keyword || keyword.length < 1) {
    return []
  }

  const suggestions = new Set()
  const results = searchDomains(domains, keyword)

  results.slice(0, 5).forEach(domain => {
    suggestions.add(domain.name)
  })

  // 添加常见别名建议
  const commonAliases = ['CS', 'AI', 'ML', 'PM', 'HR', 'Finance']
  commonAliases.forEach(alias => {
    if (alias.toLowerCase().includes(keyword.toLowerCase())) {
      suggestions.add(alias)
    }
  })

  return Array.from(suggestions)
}

/**
 * 计算搜索匹配度（用于排序）
 * @param {string} source 源字符串
 * @param {string} keyword 搜索关键词
 * @returns {number} 匹配度分数（越高越匹配）
 */
function getMatchScore(source, keyword) {
  if (!source || !keyword) return 0

  const lowerSource = source.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()

  let score = 0

  // 完全匹配得分最高
  if (lowerSource === lowerKeyword) return 1000

  // 前缀匹配
  if (lowerSource.startsWith(lowerKeyword)) score += 100

  // 包含匹配
  if (lowerSource.includes(lowerKeyword)) score += 50

  // 拼音匹配
  const pinyin = getPinyin(source)
  if (pinyin.includes(lowerKeyword)) score += 30

  // 拼音首字母匹配
  const initials = getInitials(source)
  if (initials.includes(lowerKeyword)) score += 20

  return score
}

/**
 * 搜索并排序域
 * @param {Array} domains 域列表
 * @param {string} keyword 搜索关键词
 * @returns {Array} 排序后的搜索结果
 */
export function searchDomainsWithRanking(domains, keyword) {
  if (!keyword || !keyword.trim()) {
    return domains
  }

  const trimmedKeyword = keyword.trim()

  const results = domains
    .map(domain => ({
      domain,
      score: Math.max(
        getMatchScore(domain.name, trimmedKeyword),
        getMatchScore(domain.slug, trimmedKeyword),
        getMatchScore(domain.description || '', trimmedKeyword)
      )
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.domain)

  return results
}

/**
 * 获取热搜关键词
 * @param {Array} domains 域列表
 * @returns {Array} 热搜词列表
 */
export function getHotSearchTerms(domains) {
  return domains
    .slice(0, 8)
    .map(d => d.name)
}
