#!/usr/bin/env node
/**
 * Build a generated university preset by merging existing zju-2023.json
 * with skeleton specializations for missing majors found in disciplines-complete.json
 */
const fs = require('fs');
const path = require('path');

function normalizeName(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·•\-—_\(\)（）【】\[\]]/g, '');
}

function loadJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')); }

function collectMajors(disc) {
  const arr = [];
  for (const d of disc) {
    for (const g of d.majorGroups || []) {
      for (const m of g.majors || []) {
        arr.push({ name: m.name, code: m.code, group: g.name, discipline: d.name });
      }
    }
  }
  return arr;
}

function makeSpec(base, suffix, desc) {
  return {
    name: `${base}·${suffix}`,
    description: desc || `${base} ${suffix}`,
    coreCourses: [],
    relatedSkills: [],
    questionCount: 12
  };
}

function skeletonForMajor(name) {
  return [
    makeSpec(name, '基础方向', '基础理论与核心概念'),
    makeSpec(name, '工程实践', '工程与项目实践'),
    makeSpec(name, '进阶专题', '前沿与专题深化'),
    makeSpec(name, '应用场景', '典型应用与案例')
  ];
}

function main() {
  const root = path.resolve(__dirname, '..');
  const discPath = path.join(root, 'frontend', 'src', 'data', 'disciplines-complete.json');
  const presetIn = path.join(root, 'frontend', 'src', 'data', 'university-presets', 'zju-2023.json');
  const presetOut = path.join(root, 'frontend', 'src', 'data', 'university-presets', 'zju-2023.generated.json');

  const disc = loadJSON(discPath);
  const majors = collectMajors(disc);
  const preset = loadJSON(presetIn);

  const byName = new Map();
  (preset.majors || []).forEach(m => {
    byName.set(normalizeName(m.name), m);
    (m.aliases || []).forEach(a => byName.set(normalizeName(a), m));
  });

  // Merge missing majors with skeleton specializations
  const merged = [...(preset.majors || [])];
  const seen = new Set(merged.map(m => normalizeName(m.name)));
  let added = 0;
  for (const m of majors) {
    const key = normalizeName(m.name);
    if (seen.has(key)) continue;
    merged.push({ name: m.name, aliases: [], specializations: skeletonForMajor(m.name) });
    seen.add(key);
    added++;
  }

  const out = {
    meta: { ...(preset.meta || {}), generatedFrom: 'disciplines-complete.json', generatedAt: new Date().toISOString() },
    majors: merged
  };

  fs.writeFileSync(presetOut, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`Wrote ${presetOut} (added ${added} majors, total ${merged.length})`);
}

main();

