<template>
  <section class="kg-card">
    <header class="kg-header">
      <h3>知识图谱</h3>
      <p v-if="!graph || !graph.nodes?.length">暂无数据</p>
      <p v-else>主题-能力-课程/题库关系图，可点击跳转</p>
    </header>
    <div ref="chartEl" class="kg-graph" />
  </section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { fetchDomainGraph } from '@/api/knowledge'

const props = defineProps({ slug: { type: String, required: true } })
const router = useRouter()

const chartEl = ref(null)
let chart
const graph = ref({ nodes: [], edges: [] })

function toCategory(type) {
  return ({ topic: 0, capability: 1, course: 2, question: 3 }[type] ?? 1)
}

function render() {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  const categories = [
    { name: '主题' },
    { name: '能力' },
    { name: '课程' },
    { name: '题库' }
  ]
  const data = (graph.value.nodes||[]).map(n => ({
    id: String(n.id), name: n.label || n.name || n.id, category: toCategory(n.type), value: n.link || '', symbolSize: n.type === 'topic' ? 50 : (n.type==='capability'? 36 : 28)
  }))
  const links = (graph.value.edges||[]).map(e => ({ source: String(e.source), target: String(e.target) }))
  chart.setOption({
    tooltip: { show: true },
    legend: [{ data: categories.map(c => c.name) }],
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      label: { show: true, position: 'inside', fontSize: 10 },
      force: { repulsion: 180, edgeLength: 80 },
      data,
      links,
      categories
    }]
  })
  chart.off('click')
  chart.on('click', params => {
    const node = (graph.value.nodes||[]).find(n => String(n.id) === String(params.data?.id))
    if (node?.link) {
      router.push(node.link)
    } else if (node?.type === 'question' && props.slug) {
      router.push({ name: 'QuestionBankPage', params: { domainSlug: props.slug } })
    }
  })
}

async function load() {
  try {
    const { data } = await fetchDomainGraph(props.slug)
    graph.value = data || { nodes: [], edges: [] }
  } catch { graph.value = { nodes: [], edges: [] } }
  render()
}

onMounted(load)
watch(() => props.slug, load)
onBeforeUnmount(() => { if (chart) { chart.dispose(); chart = null } })
</script>

<style scoped>
.kg-card { background: rgba(15,23,42,.03); border-radius: 18px; padding: 18px 22px; margin-top: 16px; }
.kg-header h3 { margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #0f172a; }
.kg-header p { margin: 0; color: #475569; font-size: 13px; }
.kg-graph { position: relative; height: 320px; background: linear-gradient(180deg, rgba(59,130,246,.08), rgba(16,185,129,.06)); border-radius: 14px; margin-top: 12px; }
</style>
