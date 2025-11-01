#!/usr/bin/env node
/**
 * Import MOE majors CSV and build academic-tree.json
 * Usage: node scripts/import-academic-csv.js --input src/data/import/majors.csv [--output src/data/academic-tree.json]
 */
const fs = require('fs')
const path = require('path')

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = {}
  for (let i=0; i<args.length; i+=2) {
    const k = args[i]
    const v = args[i+1]
    if (!k) continue
    if (k === '--input') opts.input = v
    else if (k === '--output') opts.output = v
  }
  return opts
}

function ensureArray(x) { return Array.isArray(x) ? x : (x ? [String(x)] : []) }

function parseCSV(text) {
  // simple CSV parser with quotes support
  const rows = []
  let i=0, field='', row=[], inQuotes=false
  const pushField = () => { row.push(field); field='' }
  const pushRow = () => { if (row.length) rows.push(row); row=[] }
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { field += '"'; i+=2; continue } // escaped quote
        inQuotes = false; i++; continue
      } else { field += ch; i++; continue }
    }
    if (ch === '"') { inQuotes = true; i++; continue }
    if (ch === ',') { pushField(); i++; continue }
    if (ch === '\n') { pushField(); pushRow(); i++; continue }
    if (ch === '\r') { i++; continue }
    field += ch; i++
  }
  // last field
  if (field.length || row.length) { pushField(); pushRow() }
  return rows
}

function loadExisting(output) {
  try {
    const raw = fs.readFileSync(output, 'utf8')
    return JSON.parse(raw)
  } catch { return { disciplines: [] } }
}

function toSlug(s) {
  return String(s||'').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || Math.random().toString(36).slice(2,8)
}

function addAlias(arr, value) {
  const s = String(value||'').trim()
  if (!s) return
  if (!arr.includes(s)) arr.push(s)
}

function main() {
  const { input, output } = Object.assign({ input: path.resolve(__dirname, '../src/data/import/majors-template.csv'), output: path.resolve(__dirname, '../src/data/academic-tree.json') }, parseArgs())
  if (!fs.existsSync(input)) {
    console.error('Input CSV not found:', input)
    process.exit(1)
  }
  const csv = fs.readFileSync(input, 'utf8')
  const rows = parseCSV(csv)
  if (!rows.length) { console.error('Empty CSV'); process.exit(1) }
  const header = rows[0].map(h => h.trim())
  const idx = (name) => header.indexOf(name)
  const req = ['discipline_name','field_name','major_slug','major_name']
  for (const k of req) if (idx(k) === -1) { console.error('Missing column:', k); process.exit(1) }

  const existing = loadExisting(output)
  const discMap = new Map(existing.disciplines.map(d => [d.name, d]))

  // minimal pinyin dictionary for common tokens
  const dict = new Map([
    ['计算机','jisuanji'], ['科学','kexue'], ['技术','jishu'], ['软件','ruanjian'], ['工程','gongcheng'],
    ['电子','dianzi'], ['信息','xinxi'], ['通信','tongxin'], ['自动化','zidonghua'], ['数据','shuju'], ['结构','jiegou'],
    ['数学','shuxue'], ['统计','tongji'], ['物理','wuli'], ['化学','huaxue'],
    ['医学','yixue'], ['临床','linchuang'], ['药学','yaoxue'], ['公共卫生','gonggong weisheng'],
    ['法学','faxue'], ['法律','falv'], ['政治','zhengzhi'],
    ['金融','jinrong'], ['经济','jingji'], ['会计','kuaiji'], ['工商','gongshang'], ['管理','guanli'],
    ['教育','jiaoyu'], ['汉语言','hanyu'], ['英语','yingyu'], ['历史','lishi'], ['哲学','zhexue'],
    ['园艺','yuanyi'], ['动物','dongwu'], ['兽医','shouyi'], ['水产','shuichan'],
    ['工业','gongye'], ['设计','sheji'], ['军事','junshi'], ['指挥','zhihui']
  ])

  function derivePinyin(text) {
    const s = String(text||'')
    const set = new Set()
    for (const [k,v] of dict.entries()) {
      if (s.includes(k)) set.add(v)
    }
    return Array.from(set)
  }

  for (let r=1; r<rows.length; r++) {
    const row = rows[r]; if (!row || !row.length) continue
    const dName = row[idx('discipline_name')].trim()
    const fName = row[idx('field_name')].trim()
    const mSlug = (row[idx('major_slug')].trim()) || toSlug(row[idx('major_name')])
    const mName = row[idx('major_name')].trim()
    const aliasRaw = idx('aliases')>=0 ? row[idx('aliases')].trim() : ''
    const pinyinRaw = idx('pinyin')>=0 ? row[idx('pinyin')].trim() : ''
    const abbr = idx('abbr')>=0 ? row[idx('abbr')].trim() : ''
    const altEn = idx('alt_en')>=0 ? row[idx('alt_en')].trim() : ''
    const popularity = idx('popularity')>=0 ? Number(row[idx('popularity')]) || 0 : 0
    const aliasList = aliasRaw ? aliasRaw.split(/[;|\/，,\s]+/).map(s=>s.trim()).filter(Boolean) : []
    let pinyinList = pinyinRaw ? pinyinRaw.split(/[;|\/，,\s]+/).map(s=>s.trim()).filter(Boolean) : []
    if (!pinyinList.length) {
      pinyinList = derivePinyin(mName).concat(derivePinyin(dName), derivePinyin(fName))
    }

    if (!dName || !fName || !mSlug) continue

    let disc = discMap.get(dName)
    if (!disc) { disc = { id: toSlug(dName), name: dName, fields: [] }; discMap.set(dName, disc) }
    let field = disc.fields.find(f => f.name === fName)
    if (!field) { field = { id: toSlug(fName), name: fName, majors: [] }; disc.fields.push(field) }
    let major = field.majors.find(m => m.slug === mSlug)
    if (!major) { major = { slug: mSlug, aliases: [], meta: {} }; field.majors.push(major) }
    // merge aliases & meta
    addAlias(major.aliases, mName)
    aliasList.forEach(a => addAlias(major.aliases, a))
    if (abbr) addAlias(major.aliases, abbr)
    if (altEn) addAlias(major.aliases, altEn)
    major.meta = major.meta || {}
    if (pinyinList.length) major.meta.pinyin = Array.from(new Set([...(major.meta.pinyin||[]), ...pinyinList]))
    if (abbr) major.meta.abbr = abbr
    if (altEn) major.meta.alt_en = altEn
    if (popularity) major.meta.popularity = Math.max(popularity, major.meta.popularity||0)
  }

  // write
  const out = { disciplines: Array.from(discMap.values()) }
  fs.writeFileSync(output, JSON.stringify(out, null, 2), 'utf8')
  console.log('✅ Saved academic tree:', output)
}

if (require.main === module) main()
