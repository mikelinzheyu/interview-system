#!/usr/bin/env node
/**
 * Generate graph JSON skeletons from academic-tree.json for each major slug.
 * Skips files that already exist.
 */
const fs = require('fs')
const path = require('path')

const TREE = path.resolve(__dirname, '../src/data/academic-tree.json')
const OUT_DIR = path.resolve(__dirname, '../src/data/graphs')

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }

function bestLabel(major){
  const aliases = Array.isArray(major.aliases) ? major.aliases : []
  return aliases[0] || major.slug
}

function buildGraph(slug, label){
  return {
    nodes: [
      { id: slug, label, type: 'topic', link: `/questions/${slug}` },
      { id: `cap:${slug}:core`, label: '核心能力', type: 'capability' },
      { id: `cap:${slug}:adv`, label: '进阶能力', type: 'capability' },
      { id: `course:${slug}:101`, label: `${label} 入门`, type: 'course', link: `/learning-paths/${slug}-101` },
      { id: `q:${slug}:bank`, label: '题库练习', type: 'question', link: `/questions/${slug}` }
    ],
    edges: [
      { source: slug, target: `cap:${slug}:core`, relation: 'covers' },
      { source: slug, target: `cap:${slug}:adv`, relation: 'covers' },
      { source: `cap:${slug}:core`, target: `course:${slug}:101`, relation: 'teaches' },
      { source: `cap:${slug}:core`, target: `q:${slug}:bank`, relation: 'practice' }
    ]
  }
}

function main(){
  ensureDir(OUT_DIR)
  const tree = JSON.parse(fs.readFileSync(TREE, 'utf8'))
  let created = 0, skipped = 0
  for(const d of (tree.disciplines||[])){
    for(const f of (d.fields||[])){
      for(const m of (f.majors||[])){
        const slug = m.slug
        const file = path.join(OUT_DIR, `${slug}.json`)
        if (fs.existsSync(file)) { skipped++; continue }
        const g = buildGraph(slug, bestLabel(m))
        fs.writeFileSync(file, JSON.stringify(g, null, 2), 'utf8')
        created++
      }
    }
  }
  console.log(`✅ Graphs generated. created=${created}, skipped=${skipped}`)
}

if(require.main===module) main()

