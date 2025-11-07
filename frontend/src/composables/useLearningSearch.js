import { reactive } from 'vue'

// Simple tokenizer: lowercase, split by non-word, also keep original for CJK prefix/includes
function tokenizeName(name) {
  const text = String(name || '').trim()
  if (!text) return []
  const lower = text.toLowerCase()
  const parts = lower.split(/[^\p{L}\p{N}_]+/u).filter(Boolean)
  // For CJK, also collect 2-3 char shingles to improve recall
  const shingles = []
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i]
    if (/\p{Script=Han}/u.test(ch)) {
      if (i + 1 < lower.length) shingles.push(lower.slice(i, i + 2))
      if (i + 2 < lower.length) shingles.push(lower.slice(i, i + 3))
    }
  }
  return Array.from(new Set([...parts, ...shingles]))
}

function baseScore(name, query) {
  const n = String(name || '').toLowerCase()
  const q = String(query || '').toLowerCase()
  if (!q) return 0
  if (n === q) return 100
  if (n.startsWith(q)) return 80
  if (n.includes(q)) return 60
  // token intersection bonus
  const nt = tokenizeName(n)
  const qt = tokenizeName(q)
  const inter = nt.filter(t => qt.includes(t)).length
  return inter > 0 ? Math.min(50, 10 + inter * 5) : 0
}

export function useLearningSearch() {
  const index = reactive({
    // flat arrays used for lightweight local search
    domains: [],
    categories: [],
    tags: []
  })

  function buildIndex({ domains = [], categories = [], tags = [] } = {}) {
    index.domains = (domains || []).map(d => ({
      id: d.id,
      type: 'domain',
      name: d.name || '未命名',
      meta: `${d.questionCount ?? d.stats?.total ?? 0} 题` + (d.difficultyLabel ? ` | ${d.difficultyLabel}` : ''),
      icon: d.icon || '📘',
      payload: d
    }))

    // categories maybe hierarchical, flatten
    const flatten = (nodes, parent) => {
      (nodes || []).forEach(node => {
        index.categories.push({
          id: node.id,
          type: 'category',
          name: node.name || '未分类',
          meta: `${node.questionCount ?? node.stats?.total ?? 0} 题${parent ? ` · ${parent}` : ''}`,
          icon: node.icon || '🗂️',
          payload: node
        })
        if (Array.isArray(node.children) && node.children.length) {
          flatten(node.children, node.name)
        }
      })
    }
    index.categories = []
    if (Array.isArray(categories)) flatten(categories)

    index.tags = (tags || []).map(t => {
      const label = t.label || t.name || t.id || String(t)
      const key = t.value || t.id || label
      return {
        id: key,
        type: 'tag',
        name: String(label),
        meta: '标签',
        icon: '🏷️',
        payload: t
      }
    })
  }

  function searchLocal(query, { limitPerGroup = 5 } = {}) {
    const q = String(query || '').trim()
    if (!q) return { top: [], domains: [], categories: [], tags: [] }

    const rank = (arr) => arr
      .map(item => ({ ...item, score: baseScore(item.name, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerGroup)

    const domains = rank(index.domains)
    const categories = rank(index.categories)
    const tags = rank(index.tags)

    // top hits: interleave best few from each, sorted
    const top = [...domains.slice(0, 2), ...categories.slice(0, 2), ...tags.slice(0, 1)]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return { top, domains, categories, tags }
  }

  return {
    buildIndex,
    searchLocal
  }
}

export default useLearningSearch

