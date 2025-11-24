# Phase 2: 组件转换详细计划

**目标**: 将 test11 的 React 组件转换为 Vue 3 组件

---

## 组件转换优先级和工作清单

### 优先级 1: 核心布局组件 (关键路径)
```
├─ [ ] 1.1 创建 views/HomeV2/ 目录结构
├─ [ ] 1.2 Dashboard.vue (主容器) - 200 行
├─ [ ] 1.3 HeroSectionV2.vue (欢迎区) - 120 行
└─ [ ] 1.4 Sidebar.vue (导航栏) - 150 行
```

### 优先级 2: 数据展示组件
```
├─ [ ] 2.1 StatCardV2.vue (统计卡片) - 80 行
├─ [ ] 2.2 ProgressChart.vue (进度图表) - 100 行
├─ [ ] 2.3 SkillDistributionChart.vue (能力分布) - 100 行
├─ [ ] 2.4 InterviewHistory.vue (面试历史表) - 150 行
└─ [ ] 2.5 ActivityTimeline.vue (活动时间线) - 120 行
```

### 优先级 3: 增强/可选组件
```
├─ [ ] 3.1 HeaderV2.vue (改造现有 Header) - 200 行
├─ [ ] 3.2 GeminiModal.vue (AI 对话框) - 150 行
├─ [ ] 3.3 WrongAnswersPreview.vue (复用或改造) - 100 行
└─ [ ] 3.4 SearchSuggestions.vue (搜索建议) - 100 行
```

### 优先级 4: 状态和服务层
```
├─ [ ] 4.1 stores/dashboard.ts - 150 行
└─ [ ] 4.2 services/dashboard.ts - 100 行
```

---

## 转换规则和对应关系

### JavaScript to Vue 3 转换规则

#### Rule 1: 组件定义
```javascript
// React
const Dashboard: React.FC<DashboardProps> = (props) => {
  return <div>...</div>
}

// Vue 3
<template>
  <div>...</div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
// props 定义
</script>
```

#### Rule 2: Props
```javascript
// React
interface DashboardProps {
  toggleTheme: () => void
  currentTheme: 'light' | 'dark'
}

// Vue 3
defineProps<{
  toggleTheme: () => void
  currentTheme: 'light' | 'dark'
}>()
```

#### Rule 3: State (useState → ref)
```javascript
// React
const [isOpen, setIsOpen] = useState(false)

// Vue 3
const isOpen = ref(false)
// 访问: isOpen.value
// 模板中: 自动解包 {{ isOpen }}
```

#### Rule 4: 计算属性 (计算值 → computed)
```javascript
// React
const isPositive = stat.trend >= 0

// Vue 3
const isPositive = computed(() => stat.trend >= 0)
```

#### Rule 5: 副作用 (useEffect → onMounted/watch)
```javascript
// React
useEffect(() => {
  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)
}, [])

// Vue 3
onMounted(() => {
  document.addEventListener('mousedown', handler)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handler)
})
```

#### Rule 6: 条件渲染
```javascript
// React
{showNotification && <NotificationCenter />}

// Vue 3
<NotificationCenter v-if="showNotification" />
```

#### Rule 7: 列表渲染
```javascript
// React
{items.map(item => <Card key={item.id} item={item} />)}

// Vue 3
<Card v-for="item in items" :key="item.id" :item="item" />
```

#### Rule 8: 事件处理
```javascript
// React
onClick={() => setIsOpen(!isOpen)}

// Vue 3
@click="isOpen = !isOpen"
```

#### Rule 9: 样式绑定
```javascript
// React
className={`flex ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}

// Vue 3
:class="['flex', isOpen ? 'translate-x-0' : '-translate-x-full']"
```

#### Rule 10: 动态图标
```javascript
// React
<item.icon size={20} />

// Vue 3
<component :is="item.icon" size="20" />
```

---

## 转换模板

### 通用 Vue 3 组件模板

```vue
<template>
  <div class="component-name">
    <!-- 内容 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 图标 } from '@element-plus/icons-vue'
// import other components

// Props
defineProps<{
  // prop 定义
}>()

// Emits (如需要)
defineEmits<{
  (e: 'eventName', payload: Type): void
}>()

// Refs and States
const state = ref(initialValue)

// Computed
const computedValue = computed(() => {
  return calculation
})

// Methods
const handleAction = () => {
  // do something
}

// Lifecycle
onMounted(() => {
  // initialization
})

onUnmounted(() => {
  // cleanup
})
</script>

<style scoped>
.component-name {
  /* styles */
}

/* Tailwind 与 Element Plus 混合使用 */
.card {
  @apply rounded-xl p-6 shadow-sm transition-colors;
}
</style>
```

---

## 第一个组件详细示例: StatCardV2.vue

### 源代码分析 (React 版)

```typescript
// test11/components/StatCard.tsx
const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const isPositive = stat.trend >= 0  // 计算属性

  return (
    <div className="group ...">
      <div className="flex items-start justify-between">
        {/* 左侧: 标签和数值 */}
        <div>
          <p className="text-sm font-medium text-gray-500">{stat.label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <h3 className="text-3xl font-bold">{stat.value}</h3>
            {stat.unit && <span className="text-sm">{stat.unit}</span>}
          </div>
        </div>

        {/* 右侧: 图标 */}
        <div className={`rounded-2xl p-3 ${stat.color} bg-opacity-10`}>
          <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
        </div>
      </div>

      {/* 趋势 */}
      <div className="mt-4 flex items-center gap-2">
        <span className={`flex items-center gap-1 text-xs font-semibold
          ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(stat.trend)}%
        </span>
        <span className="text-xs text-gray-400">较上月</span>
      </div>
    </div>
  )
}
```

### Vue 3 版转换

```vue
<template>
  <div class="stat-card-v2">
    <div class="stat-content">
      <!-- 左侧: 标签和数值 -->
      <div>
        <p class="stat-label">{{ stat.label }}</p>
        <div class="stat-value-group">
          <h3 class="stat-value">{{ stat.value }}</h3>
          <span v-if="stat.unit" class="stat-unit">{{ stat.unit }}</span>
        </div>
      </div>

      <!-- 右侧: 图标 -->
      <div class="stat-icon-box" :class="[stat.color + '-bg']">
        <component
          :is="stat.icon"
          size="24"
          :class="stat.color + '-text'"
        />
      </div>
    </div>

    <!-- 趋势 -->
    <div class="stat-trend">
      <span class="trend-badge" :class="isPositive ? 'trend-positive' : 'trend-negative'">
        <component
          :is="isPositive ? ArrowUpRight : ArrowDownRight"
          size="12"
        />
        {{ Math.abs(stat.trend) }}%
      </span>
      <span class="trend-label">较上月</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, ArrowDownRight } from '@element-plus/icons-vue'
import type { PropType } from 'vue'

interface StatMetric {
  id: string
  label: string
  value: string | number
  unit?: string
  trend: number
  icon: any
  color: string
}

defineProps<{
  stat: StatMetric
}>()

const isPositive = computed(() => {
  return props.stat.trend >= 0
})
</script>

<style scoped>
.stat-card-v2 {
  @apply relative overflow-hidden rounded-[24px] bg-white dark:bg-gray-800 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:bg-gray-750 border border-transparent dark:border-gray-700/50;
}

.stat-content {
  @apply flex items-start justify-between;
}

.stat-label {
  @apply text-sm font-medium text-gray-500 dark:text-gray-400;
}

.stat-value-group {
  @apply mt-2 flex items-baseline gap-1;
}

.stat-value {
  @apply text-3xl font-bold tracking-tight text-gray-900 dark:text-white;
}

.stat-unit {
  @apply text-sm font-medium text-gray-400;
}

.stat-icon-box {
  @apply rounded-2xl p-3 bg-opacity-10 dark:bg-opacity-20;
}

.stat-trend {
  @apply mt-4 flex items-center gap-2;
}

.trend-badge {
  @apply flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full;
}

.trend-positive {
  @apply text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30;
}

.trend-negative {
  @apply text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30;
}

.trend-label {
  @apply text-xs text-gray-400;
}

/* 颜色类映射 */
.bg-blue-500-bg { @apply bg-blue-500; }
.bg-green-500-bg { @apply bg-green-500; }
.bg-yellow-500-bg { @apply bg-yellow-500; }
.bg-purple-500-bg { @apply bg-purple-500; }

.bg-blue-500-text { @apply text-blue-500; }
.bg-green-500-text { @apply text-green-500; }
.bg-yellow-500-text { @apply text-yellow-500; }
.bg-purple-500-text { @apply text-purple-500; }
</style>
```

---

## 关键注意事项

### 1. Tailwind CSS 与 Element Plus 的混合使用
```vue
<!-- ✅ 推荐 -->
<div class="flex items-center gap-2 rounded-lg p-4">
  <el-button type="primary">按钮</el-button>
</div>

<!-- ❌ 避免冲突 -->
<!-- 不要同时使用相同的样式类名 -->
```

### 2. 动态组件和图标
```vue
<!-- ✅ 正确做法 -->
<component :is="iconComponent" />

<!-- ❌ 错误做法 -->
<!-- <icon.component /> 不适用于 Vue -->
```

### 3. 样式类的动态绑定
```vue
<!-- ✅ 推荐 -->
:class="[isPositive ? 'text-green-600' : 'text-red-500']"

<!-- ✅ 也可以用对象形式 -->
:class="{ 'text-green-600': isPositive, 'text-red-500': !isPositive }"

<!-- ❌ 避免字符串拼接 -->
:class="`text-${color}-600`"  <!-- 这不能正确编译 -->
```

### 4. Props 类型定义
```typescript
// ✅ 使用 TypeScript interface
interface Props {
  stat: StatMetric
  disabled?: boolean
}

defineProps<Props>()

// ✅ 或直接定义
defineProps<{
  stat: StatMetric
  disabled?: boolean
}>()
```

---

## 预计工作量

| 组件 | 复杂度 | 代码行 | 预计时间 |
|------|------|------|---------|
| Dashboard.vue | ⭐⭐⭐ | 300-400 | 1.5-2h |
| HeroSectionV2.vue | ⭐⭐ | 120 | 30min |
| Sidebar.vue | ⭐⭐ | 150 | 45min |
| StatCardV2.vue | ⭐ | 80 | 20min |
| ProgressChart.vue | ⭐⭐⭐ | 100 | 45min |
| SkillDistributionChart.vue | ⭐⭐⭐ | 100 | 45min |
| InterviewHistory.vue | ⭐⭐ | 150 | 45min |
| ActivityTimeline.vue | ⭐⭐ | 120 | 40min |
| HeaderV2.vue | ⭐⭐⭐ | 200 | 1.5h |
| 其他小组件 | ⭐ | 250 | 1h |
| **总计** | | **1570** | **约 7-8 小时** |

---

## 下一步

1. ✅ 完成本计划
2. → 创建目录结构
3. → 开始组件转换 (从 StatCardV2 开始)
4. → 集成到 Dashboard
5. → 测试

---

*准备开始 Phase 2 第一步: 创建目录结构和第一个组件*
