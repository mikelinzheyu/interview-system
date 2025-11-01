<template>
  <aside class="academic-sidebar">
    <header class="sidebar-header">
      <div class="sidebar-title">
        <span class="title">探索领域</span>
      </div>
      <el-input
        v-model="localQuery"
        class="sidebar-search"
        placeholder="搜索学科/专业/别名（支持拼音/缩写）"
        clearable
        size="small"
        :prefix-icon="Search"
      />
      <ul v-if="localQuery && typeahead.length" class="typeahead-list">
        <li v-for="s in typeahead" :key="s.key" class="typeahead-item" @click="emitSelect(s.slug)">
          <span class="typeahead-major" v-html="highlight(s.name)" />
          <span class="typeahead-meta">{{ s.fieldName }} · {{ s.disciplineName }}</span>
        </li>
      </ul>
    </header>

    <section class="sidebar-body">
      <el-skeleton v-if="loading" animated :rows="8" class="sidebar-skeleton" />

      <el-scrollbar v-else class="sidebar-scroll">
        <template v-if="filtered.length">
          <ul v-if="!localQuery" class="discipline-list">
            <li v-for="d in tree.disciplines" :key="d.id" class="discipline-item">
              <details :open="true">
                <summary>
                  <span class="discipline-name">{{ d.name }}</span>
                </summary>
                <ul class="field-list">
                  <li v-for="f in d.fields" :key="f.id" class="field-item">
                    <details :open="false">
                      <summary>
                        <span class="field-name">{{ f.name }}</span>
                      </summary>
                      <ul class="major-list">
                        <li
                          v-for="m in f.majors"
                          :key="m.slug"
                          class="major-item"
                          :class="{ active: m.slug === selectedSlug }"
                          role="button"
                          tabindex="0"
                          @click="emitSelect(m.slug)"
                          @keyup.enter="emitSelect(m.slug)"
                        >
                          <span class="major-name">{{ majorDisplayName(m.slug) }}</span>
                          <el-tag v-if="aliasPreview(m).length" size="small" effect="plain">{{ aliasPreview(m) }}</el-tag>
                        </li>
                      </ul>
                    </details>
                  </li>
                </ul>
              </details>
            </li>
          </ul>

          <ul v-else class="search-result-list">
            <li
              v-for="row in filtered"
              :key="row.slug"
              class="search-result-item"
              :class="{ active: row.slug === selectedSlug }"
              @click="emitSelect(row.slug)"
            >
              <div class="result-title">
                <span class="major-name" v-html="highlight(majorDisplayName(row.slug))" />
                <el-tag size="small" effect="plain">{{ row.fieldName }}</el-tag>
                <el-tag size="small" effect="dark">{{ row.disciplineName }}</el-tag>
              </div>
              <div v-if="row.aliases?.length" class="result-alias">别名：{{ row.aliases.join(' / ') }}</div>
            </li>
          </ul>
        </template>
        <div v-else class="empty-result">
          <el-empty description="未找到匹配的结果" :image-size="120" />
        </div>
      </el-scrollbar>
    </section>
  </aside>
  
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useAcademicStore } from '@/stores/academic'
import { useDomainStore } from '@/stores/domain'

const props = defineProps({
  loading: { type: Boolean, default: false },
  selectedSlug: { type: String, default: '' }
})

const emit = defineEmits(['select'])

const academic = useAcademicStore()
const domain = useDomainStore()
const { tree } = storeToRefs(academic)

const localQuery = ref('')
watch(localQuery, (v) => { academic.query = v })

const filtered = computed(() => academic.searchMajors(localQuery.value))

const typeahead = computed(() => {
  const rows = academic.searchMajors(localQuery.value)
  return rows.slice(0, 8).map(r => ({
    key: r.slug,
    slug: r.slug,
    name: majorDisplayName(r.slug),
    fieldName: r.fieldName,
    disciplineName: r.disciplineName
  }))
})

function emitSelect(slug) {
  emit('select', slug)
}

function majorDisplayName(slug) {
  const match = domain.findDomainBySlug(slug)
  return match?.name || slug
}

function aliasPreview(m) {
  if (!Array.isArray(m.aliases) || !m.aliases.length) return ''
  return m.aliases.slice(0, 2).join(' / ')
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function highlight(text) {
  const q = String(localQuery.value || '').trim()
  if (!q) return escapeHtml(text)
  const safe = escapeHtml(text)
  try {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')
    return safe.replace(re, m => `<mark>${m}</mark>`)
  } catch {
    return safe
  }
}
</script>

<style scoped>
.academic-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.75) 100%);
  color: #e2e8f0;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.28);
}

.sidebar-header { display: flex; flex-direction: column; gap: 10px; }
.sidebar-title .title { font-weight: 700; color: #f8fafc; }
.sidebar-search :deep(.el-input__wrapper) { background: rgba(148,163,184,0.12); box-shadow: none; }
.typeahead-list { list-style: none; margin: 6px 0 0; padding: 0; border-radius: 10px; background: rgba(148,163,184,0.12); }
.typeahead-item { padding: 8px 10px; display: flex; flex-direction: column; cursor: pointer; }
.typeahead-item:hover { background: rgba(148,163,184,0.22); }
.typeahead-major { font-weight: 600; color: #f8fafc; }
.typeahead-meta { font-size: 12px; color: rgba(226,232,240,.75); }

.sidebar-body { flex: 1; min-height: 0; overflow: hidden; }
.sidebar-scroll { height: 100%; max-height: 100%; padding-right: 4px; }

.discipline-list, .field-list, .major-list, .search-result-list {
  list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px;
}
.discipline-item details > summary, .field-item details > summary {
  cursor: pointer; padding: 8px 10px; border-radius: 10px; background: rgba(148,163,184,0.12);
}
.discipline-name { font-size: 14px; font-weight: 700; }
.field-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
.major-item, .search-result-item {
  padding: 10px 12px; border-radius: 12px; background: rgba(148,163,184,0.12); cursor: pointer; transition: all .2s ease;
}
.major-item:hover, .search-result-item:hover { background: rgba(148,163,184,0.22); }
.major-item.active, .search-result-item.active { background: rgba(14,165,233,0.22); box-shadow: 0 12px 30px rgba(14,165,233,0.32); }
.major-name { font-weight: 600; color: #f8fafc; }
.result-title { display: flex; gap: 8px; align-items: center; }
.result-alias { margin-top: 4px; font-size: 12px; color: rgba(226,232,240,.75); }

.empty-result { display: flex; align-items: center; justify-content: center; min-height: 320px; }

@media (max-width: 1024px) {
  .academic-sidebar { padding: 16px; }
}
</style>
