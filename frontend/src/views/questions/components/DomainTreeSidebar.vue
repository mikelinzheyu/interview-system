<template>
  <aside class="domain-tree-sidebar">
    <!-- 顶部控制 -->
    <header class="sidebar-header">
      <div class="sidebar-title">
        <h3 class="title">学科树</h3>
        <div class="control-buttons">
          <el-button
            text
            size="small"
            @click="store.expandAllNodes()"
          >
            全展开
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            text
            size="small"
            @click="store.collapseAllNodes()"
          >
            全折叠
          </el-button>
        </div>
      </div>
    </header>

    <!-- 搜索框 -->
    <div class="search-wrapper">
      <el-input
        v-model="searchQuery"
        class="sidebar-search"
        placeholder="搜索学科..."
        clearable
        size="default"
        :prefix-icon="Search"
        @input="handleSearchInput"
      />
    </div>

    <!-- 树形菜单 -->
    <section class="sidebar-body">
      <el-skeleton v-if="loading" animated :rows="8" class="sidebar-skeleton" />

      <el-tree
        v-else
        :data="treeData"
        :props="treeProps"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        :default-expand-all="false"
        node-key="id"
        :expanded-keys="Array.from(store.expandedNodes)"
        highlight-current
        :current-node-key="currentNodeId"
        @node-click="handleNodeClick"
        @node-expand="handleNodeExpand"
        @node-collapse="handleNodeCollapse"
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <span class="node-icon">{{ data.icon }}</span>
            <span class="node-name">{{ node.label }}</span>
            <el-tag
              v-if="data.level === 'discipline'"
              size="small"
              type="info"
              effect="plain"
            >
              {{ getCategoryCount(data) }}
            </el-tag>
            <el-tag
              v-else-if="data.level === 'field'"
              size="small"
              type="success"
              effect="plain"
            >
              {{ getCategoryCount(data) }}
            </el-tag>
            <el-tag
              v-else-if="data.level === 'major'"
              size="small"
              type="primary"
              effect="plain"
            >
              {{ data.questionCount || 0 }} 题
            </el-tag>
          </div>
        </template>
      </el-tree>
    </section>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useDomainStore } from '@/stores/domain'

const store = useDomainStore()
const { hierarchicalDomains, expandedNodes } = storeToRefs(store)

const props = defineProps({
  loading: { type: Boolean, default: false },
  selectedNodeId: { type: [String, Number], default: null }
})

const emit = defineEmits(['select-major'])

const searchQuery = ref('')
const treeRef = ref(null)

const treeProps = {
  children: 'children',
  label: (data) => data.name,
  isLeaf: (data) => data.level === 'major'
}

const treeData = computed(() => {
  if (searchQuery.value) {
    return filterTreeBySearch(hierarchicalDomains.value, searchQuery.value)
  }
  return hierarchicalDomains.value
})

const currentNodeId = computed(() => props.selectedNodeId)

onMounted(async () => {
  // 加载层级数据
  if (hierarchicalDomains.value.length === 0) {
    await store.loadHierarchicalDomains()
  }
  // 默认展开第一层级
  nextTick(() => {
    hierarchicalDomains.value.forEach(item => {
      store.toggleNodeExpanded(item.id)
    })
  })
})

/**
 * 获取分类数量
 */
function getCategoryCount(data) {
  if (data.children && Array.isArray(data.children)) {
    return data.children.length
  }
  return 0
}

/**
 * 过滤树节点
 */
function filterNode(value, data) {
  if (!value) return true
  return (data.name || '').toLowerCase().includes(value.toLowerCase()) ||
         (data.slug || '').toLowerCase().includes(value.toLowerCase())
}

/**
 * 通过搜索过滤树
 */
function filterTreeBySearch(nodes, query) {
  if (!query) return nodes

  const results = []
  const walk = (items) => {
    if (!Array.isArray(items)) return

    items.forEach(item => {
      const matches =
        (item.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (item.slug || '').toLowerCase().includes(query.toLowerCase())

      if (matches) {
        results.push({
          ...item,
          children: item.children ? [...item.children] : []
        })
      } else if (item.children) {
        const filtered = filterTreeBySearch(item.children, query)
        if (filtered.length > 0) {
          results.push({
            ...item,
            children: filtered
          })
        }
      }
    })
  }

  walk(nodes)
  return results
}

/**
 * 搜索输入处理
 */
function handleSearchInput(value) {
  searchQuery.value = value
  if (treeRef.value) {
    treeRef.value.filter(value)
  }
}

/**
 * 点击树节点
 */
function handleNodeClick(data) {
  // 只在点击Major级别时才触发选择事件
  if (data.level === 'major') {
    emit('select-major', data)
  }
}

/**
 * 展开节点
 */
function handleNodeExpand(data) {
  store.toggleNodeExpanded(data.id)
}

/**
 * 折叠节点
 */
function handleNodeCollapse(data) {
  store.toggleNodeExpanded(data.id)
}
</script>

<style scoped>
.domain-tree-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.75) 100%);
  color: #e2e8f0;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.28);
  height: 100%;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sidebar-title .title {
  font-weight: 700;
  color: #f8fafc;
  font-size: 16px;
  margin: 0;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.control-buttons :deep(.el-button) {
  color: rgba(226, 232, 240, 0.7);
  padding: 0 4px;
  height: auto;
}

.control-buttons :deep(.el-button:hover) {
  color: rgba(226, 232, 240, 1);
}

.control-buttons :deep(.el-divider--vertical) {
  margin: 0 4px;
  height: 14px;
  opacity: 0.3;
}

.search-wrapper {
  position: relative;
}

.sidebar-search :deep(.el-input__wrapper) {
  background: rgba(148, 163, 184, 0.12);
  box-shadow: none;
  border-radius: 10px;
  transition: all 0.25s ease;
}

.sidebar-search :deep(.el-input__wrapper:hover) {
  background: rgba(148, 163, 184, 0.18);
}

.sidebar-search :deep(.el-input__wrapper.is-focus) {
  background: rgba(148, 163, 184, 0.25);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.sidebar-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar-skeleton {
  min-height: 300px;
}

.domain-tree-sidebar :deep(.el-tree) {
  background: transparent;
  color: #e2e8f0;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

.domain-tree-sidebar :deep(.el-tree-node) {
  white-space: nowrap;
}

.domain-tree-sidebar :deep(.el-tree-node__content) {
  height: 36px;
  padding: 0 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.domain-tree-sidebar :deep(.el-tree-node__content:hover) {
  background: rgba(148, 163, 184, 0.15);
}

.domain-tree-sidebar :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: rgba(59, 130, 246, 0.25);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.4);
}

.domain-tree-sidebar :deep(.el-tree-node__expand-icon) {
  color: rgba(226, 232, 240, 0.6);
  margin-right: 4px;
}

.domain-tree-sidebar :deep(.el-tree-node__expand-icon:hover) {
  color: rgba(226, 232, 240, 1);
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  flex: 1;
}

.node-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.node-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #e2e8f0;
  font-size: 14px;
}

.domain-tree-sidebar :deep(.el-tag) {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 6px;
}

:deep(.el-tree__empty-block) {
  background: transparent;
  color: #94a3b8;
  padding: 20px;
  text-align: center;
}

@media (max-width: 1024px) {
  .domain-tree-sidebar {
    height: auto;
    min-height: auto;
    overflow: visible;
    padding: 16px;
  }
}
</style>
