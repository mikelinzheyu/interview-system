import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import academicTree from '@/data/academic-tree.json'

function normalizeAliases(arr) {
  if (!Array.isArray(arr)) return []
  return arr
    .map(v => String(v || '').trim())
    .filter(Boolean)
}

export const useAcademicStore = defineStore('academic', () => {
  const loading = ref(false)
  const error = ref(null)
  const tree = ref({ disciplines: [] })
  const query = ref('')

  // 简易同义词/缩写映射（可扩展为后端词典）
  const synonyms = Object.freeze({
    cs: ['计算机', '计算机科学', 'computer', 'computer science', 'jisuanji'],
    ai: ['人工智能', 'artificial intelligence', 'ml', '机器学习'],
    se: ['软件工程', 'software engineering', 'ruanjian'],
    fin: ['金融', 'finance', 'quant', '量化', 'jinrong'],
    law: ['法学', '法律', 'law', 'faxue'],
    med: ['医学', '医疗', 'medicine', '临床', 'yixue', 'linchuang'],
    econ: ['经济学', 'economics', 'jingji'],
    ee: ['电子信息', '电子工程', '电气', '电子', 'EE', 'dianzi'],
    auto: ['自动化', 'control', 'zidonghua'],
    math: ['数学', 'math', 'shuxue'],
    stat: ['统计', '统计学', 'statistics', 'tongji'],
    acct: ['会计', '会计学', 'accounting', 'kuaiji']
  })

  async function load() {
    if (tree.value.disciplines.length) return
    loading.value = true
    error.value = null
    try {
      // static import already loaded via Vite
      tree.value = academicTree
    } catch (e) {
      error.value = e?.message || '加载学科树失败'
    } finally {
      loading.value = false
    }
  }

  const majorsFlat = computed(() => {
    const items = []
    for (const d of tree.value.disciplines || []) {
      for (const f of d.fields || []) {
        for (const m of f.majors || []) {
          const meta = m.meta || {}
          const pinyin = Array.isArray(meta.pinyin) ? meta.pinyin : (meta.pinyin ? String(meta.pinyin).split(/[;|,\s]+/) : [])
          const abbr = meta.abbr ? [String(meta.abbr)] : []
          const alt = meta.alt_en ? [String(meta.alt_en)] : []
          const popularity = Number(meta.popularity || 0)
          items.push({
            disciplineId: d.id,
            disciplineName: d.name,
            fieldId: f.id,
            fieldName: f.name,
            slug: m.slug,
            aliases: normalizeAliases(m.aliases),
            pinyin,
            abbr,
            alt,
            popularity
          })
        }
      }
    }
    return items
  })

  function normalizeKeyword(raw) {
    const k = String(raw || '').trim().toLowerCase()
    if (!k) return ''
    // 同义词展开：若命中 key 或 value，统一扩展为包含各别名的匹配
    for (const [key, al] of Object.entries(synonyms)) {
      if (key === k || al.some(v => String(v).toLowerCase() === k)) {
        return al.concat([key]).join(' ')
      }
    }
    return k
  }

  function scoreRow(m, k) {
    const hay = [m.slug, m.fieldName, m.disciplineName, ...m.aliases, ...(m.pinyin||[]), ...(m.abbr||[]), ...(m.alt||[])]
      .filter(Boolean).map(String).join(' ').toLowerCase()
    let s = 0
    // exact signals
    if ((m.aliases||[]).map(a=>String(a).toLowerCase()).includes(k)) s += 60
    if ((m.pinyin||[]).map(a=>String(a).toLowerCase()).includes(k)) s += 40
    if ((m.abbr||[]).map(a=>String(a).toLowerCase()).includes(k)) s += 40
    if (m.slug === k) s += 100
    if (hay.includes(k)) s += 20
    s += Math.min(100, m.popularity || 0) * 0.5 // weight by popularity
    return s
  }

  function searchMajors(keyword) {
    const kraw = normalizeKeyword(keyword || query.value)
    if (!kraw) return majorsFlat.value
    // pick the first token for scoring
    const k = kraw.split(/[\s]+/)[0]
    const rows = majorsFlat.value
      .map(m => ({ m, score: scoreRow(m, k) }))
      .filter(x => x.score > 0)
      .sort((a,b) => b.score - a.score)
      .map(x => x.m)
    return rows
  }

  function findPathBySlug(slug) {
    for (const d of tree.value.disciplines || []) {
      for (const f of d.fields || []) {
        for (const m of f.majors || []) {
          if (m.slug === slug) {
            return { discipline: d, field: f, major: m }
          }
        }
      }
    }
    return null
  }

  return {
    loading,
    error,
    tree,
    query,
    load,
    majorsFlat,
    searchMajors,
    findPathBySlug
  }
})
