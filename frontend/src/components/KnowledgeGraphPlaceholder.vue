<template>
  <section class="kg-card">
    <header class="kg-header">
      <h3>知识图谱（预览）</h3>
      <p>展示领域核心概念与关联主题，后续将支持交互</p>
    </header>
    <div class="kg-graph">
      <div class="node center">核心</div>
      <div class="node n1">概念A</div>
      <div class="node n2">概念B</div>
      <div class="node n3">概念C</div>
      <svg class="links" viewBox="0 0 200 200" preserveAspectRatio="none">
        <line x1="100" y1="100" x2="50" y2="40" />
        <line x1="100" y1="100" x2="150" y2="60" />
        <line x1="100" y1="100" x2="70" y2="160" />
      </svg>
    </div>
  </section>
</template>

<script setup>
// 占位图，后续可替换为实际图谱组件（ECharts/vis-network）
</script>

<style scoped>
.kg-card { background: rgba(15,23,42,.03); border-radius: 18px; padding: 18px 22px; margin-top: 16px; }
.kg-header h3 { margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #0f172a; }
.kg-header p { margin: 0; color: #475569; font-size: 13px; }
.kg-graph { position: relative; height: 220px; background: linear-gradient(180deg, rgba(59,130,246,.08), rgba(16,185,129,.06)); border-radius: 14px; margin-top: 12px; }
.node { position: absolute; padding: 8px 12px; background: white; border-radius: 999px; box-shadow: 0 8px 18px rgba(30,58,138,.18); font-weight: 600; color: #0f172a; }
.center { left: calc(50% - 24px); top: calc(50% - 16px); }
.n1 { left: 24px; top: 24px; }
.n2 { right: 18px; top: 38px; }
.n3 { left: 38px; bottom: 28px; }
.links { position: absolute; inset: 0; pointer-events: none; stroke: rgba(15,23,42,.35); }
.links line { stroke-width: 1.5; }
</style>

