#!/usr/bin/env node
/**
 * University preset coverage report
 * Compares majors in disciplines-complete.json vs university-presets/<profile>.json
 */
const fs = require('fs');
const path = require('path');

function normalizeName(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·•\-—_\(\)（）【】\[\]]/g, '');
}

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function collectMajorsFromDisciplines(disciplines) {
  const list = [];
  for (const disc of disciplines) {
    for (const group of disc.majorGroups || []) {
      for (const m of group.majors || []) {
        list.push({ name: m.name, code: m.code, group: group.name, discipline: disc.name });
      }
    }
  }
  return list;
}

function buildPresetIndex(preset) {
  const byName = new Map();
  const byCode = new Map();
  for (const m of preset.majors || []) {
    const list = Array.isArray(m.specializations) ? m.specializations : [];
    if (!list.length) continue;
    const key = normalizeName(m.name);
    if (key) byName.set(key, true);
    const aliases = Array.isArray(m.aliases) ? m.aliases : [];
    aliases.forEach(a => byName.set(normalizeName(a), true));
    const codes = Array.isArray(m.codes) ? m.codes : (m.code ? [m.code] : []);
    codes.forEach(c => byCode.set(String(c), true));
  }
  return { byName, byCode };
}

function main() {
  const root = path.resolve(__dirname, '..');
  const discPath = path.join(root, 'frontend', 'src', 'data', 'disciplines-complete.json');
  const presetPath = path.join(root, 'frontend', 'src', 'data', 'university-presets', 'zju-2023.json');
  const disciplines = loadJSON(discPath);
  const preset = loadJSON(presetPath);
  const majors = collectMajorsFromDisciplines(disciplines);
  const { byName, byCode } = buildPresetIndex(preset);

  const total = majors.length;
  const covered = [];
  const missing = [];
  for (const m of majors) {
    const n = normalizeName(m.name);
    if (byName.has(n) || (m.code && byCode.has(String(m.code)))) {
      covered.push(m);
    } else {
      missing.push(m);
    }
  }

  console.log(`Majors total: ${total}`);
  console.log(`Covered by preset: ${covered.length}`);
  console.log(`Missing: ${missing.length}`);
  const sample = missing.slice(0, 50).map(m => `${m.name}${m.code ? ` [${m.code}]` : ''} - ${m.discipline}/${m.group}`);
  if (sample.length) {
    console.log('\nMissing sample (top 50):');
    console.log(sample.join('\n'));
  }
}

main();

