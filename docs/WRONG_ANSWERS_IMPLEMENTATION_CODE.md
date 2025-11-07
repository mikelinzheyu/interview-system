# WrongAnswersPage 重设计 - 具体实施代码方案

## 核心改造代码示例

### Step 1: 页面头部重构

```vue
<!-- 新的header结构 -->
<section class="page-header" style="background: white; padding: 24px; margin-bottom: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  <div class="header-content">
    <!-- 标题部分 -->
    <div class="header-title-group">
      <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 600;">错题诊断和复习</h1>
      <p class="subtitle" style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
        系统化复习你的错误答案，针对性提升薄弱知识点
      </p>

      <!-- 替换原来的button-group -->
      <el-tabs v-model="activeTab" @change="applyFilters" style="margin-top: 12px;">
        <el-tab-pane label="面试错题" name="ai">
          <el-icon><Mic /></el-icon> 面试错题
        </el-tab-pane>
        <el-tab-pane label="题库错题" name="bank">
          <el-icon><DocumentCopy /></el-icon> 题库错题
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <!-- 右侧操作按钮 -->
  <div class="header-actions" style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
    <el-button-group>
      <el-button
        :type="viewMode==='card' ? 'primary' : 'default'"
        @click="viewMode='card'"
        :icon="Grid"
      >卡片</el-button>
      <el-button
        :type="viewMode==='table' ? 'primary' : 'default'"
        @click="viewMode='table'"
        :icon="List"
      >列表</el-button>
    </el-button-group>
    <el-button type="primary" @click="generateReviewPlan" :loading="loadingPlan">
      <el-icon><SchoolBag /></el-icon>开始复习
    </el-button>
  </div>
</section>
```

---

### Step 2: 主布局改为Grid (删除原来的wa-layout)

```vue
<!-- 替换原来的 <div class="wa-layout"> -->
<div class="wrong-answers-container">
  <el-row :gutter="24">
    <!-- 左侧过滤面板 (md=6, lg=5, xs=24) -->
    <el-col :xs="24" :md="6" :lg="5">
      <div class="filter-panel">
        <!-- 所有过滤组放在这里 -->
      </div>
    </el-col>

    <!-- 右侧主内容区 (md=18, lg=19, xs=24) -->
    <el-col :xs="24" :md="18" :lg="19">
      <div class="list-panel">
        <!-- 搜索工具栏 + 内容 -->
      </div>
    </el-col>
  </el-row>
</div>
```

---

### Step 3: 侧边栏过滤条件统一样式

```vue
<div class="filter-panel">
  <!-- 过滤组1: 错题来源 -->
  <div class="filter-section">
    <div class="filter-header">
      <h4>错题来源</h4>
      <div class="filter-ops">
        <el-link type="primary" size="small" @click="selectAllSessions">全选</el-link>
        <span class="op-divider">·</span>
        <el-link type="info" size="small" @click="clearSessions">清空</el-link>
      </div>
    </div>
    <div class="filter-body">
      <!-- AI 会话列表，增加搜索框 -->
      <template v-if="activeTab === 'ai'">
        <el-input
          v-model="sessionsSearch"
          placeholder="搜索会话"
          size="small"
          clearable
          style="margin-bottom: 12px;"
        />
        <el-checkbox-group v-model="selectedSessions" class="checkbox-list">
          <div v-for="s in shownSessions" :key="s.sessionId" class="checkbox-item">
            <el-badge :value="sessionCounts[s.sessionId] || 0">
              <el-checkbox :label="s.sessionId">
                {{ s.jobTitle || s.sessionId }}
              </el-checkbox>
            </el-badge>
          </div>
        </el-checkbox-group>
        <!-- 显示更多 -->
        <div v-if="filteredSessions.length > sessionShowLimit" style="text-align: center; margin-top: 8px;">
          <el-button link type="primary" size="small" @click="sessionsCollapsed = !sessionsCollapsed">
            {{ sessionsCollapsed ? '展开更多' : '收起' }}
          </el-button>
        </div>
      </template>

      <!-- 题库来源 -->
      <template v-else>
        <el-checkbox-group v-model="selectedSources" class="checkbox-list">
          <div class="checkbox-item">
            <el-badge :value="sourceCounts.question_bank || 0">
              <el-checkbox label="question_bank">题库</el-checkbox>
            </el-badge>
          </div>
          <div class="checkbox-item">
            <el-badge :value="sourceCounts.mock_exam || 0">
              <el-checkbox label="mock_exam">模拟考试</el-checkbox>
            </el-badge>
          </div>
        </el-checkbox-group>
      </template>
    </div>
  </div>

  <!-- 过滤组2: 错误诊断 -->
  <div class="filter-section">
    <div class="filter-header">
      <h4>错误诊断</h4>
      <el-badge :value="selectedErrorTypes.length || 0" />
    </div>
    <div class="filter-body">
      <el-checkbox-group v-model="selectedErrorTypes" class="checkbox-list">
        <div class="checkbox-item">
          <el-checkbox label="knowledge">知识点错误</el-checkbox>
        </div>
        <div class="checkbox-item">
          <el-checkbox label="logic">逻辑混乱</el-checkbox>
        </div>
        <div class="checkbox-item">
          <el-checkbox label="incomplete">回答不完整</el-checkbox>
        </div>
        <div class="checkbox-item">
          <el-checkbox label="expression">表达不流畅</el-checkbox>
        </div>
      </el-checkbox-group>
    </div>
  </div>

  <!-- 过滤组3: 知识点标签 -->
  <div class="filter-section">
    <div class="filter-header">
      <h4>知识点标签</h4>
      <div class="filter-ops">
        <el-link type="primary" size="small" @click="selectAllKnowledge">全选</el-link>
        <span class="op-divider">·</span>
        <el-link type="info" size="small" @click="clearKnowledge">清空</el-link>
      </div>
    </div>
    <div class="filter-body">
      <!-- 知识点搜索 -->
      <el-input
        v-model="knowledgeSearch"
        placeholder="搜索知识点"
        size="small"
        clearable
        style="margin-bottom: 12px;"
      />
      <!-- 知识点标签 -->
      <div class="tag-group">
        <el-check-tag
          v-for="tag in filteredKnowledgeTags"
          :key="tag"
          :checked="selectedKnowledge.has(tag)"
          @change="() => toggleKnowledge(tag)"
          style="margin-bottom: 6px;"
        >
          {{ tag }}
        </el-check-tag>
      </div>
    </div>
  </div>

  <!-- 过滤组4: 排序方式 -->
  <div class="filter-section">
    <div class="filter-header">
      <h4>排序方式</h4>
    </div>
    <div class="filter-body">
      <el-radio-group v-model="sortBy" @change="applyFilters" style="width: 100%;">
        <el-radio-button label="recent">最近时间</el-radio-button>
        <el-radio-button label="reviewed">答题次数</el-radio-button>
        <el-radio-button label="nextReview">下次复习</el-radio-button>
        <el-radio-button label="priority">优先级</el-radio-button>
      </el-radio-group>
    </div>
  </div>
</div>
```

---

### Step 4: 主内容区域 - 工具栏和活跃筛选

```vue
<div class="list-panel">
  <!-- 搜索工具栏 -->
  <div class="list-toolbar" style="display: flex; gap: 12px; margin-bottom: 16px;">
    <el-input
      v-model="keyword"
      placeholder="搜索错题描述、知识点等..."
      clearable
      style="flex: 1;"
      @keyup.enter="applyFilters"
    >
      <template #prefix><el-icon><Search /></el-icon></template>
    </el-input>
  </div>

  <!-- 活跃筛选条件显示 (新增,这是关键!) -->
  <div v-if="hasActiveFilters" class="active-filters">
    <span class="label">已选条件：</span>

    <!-- 来源标签 -->
    <template v-if="activeTab === 'ai'">
      <el-tag
        v-for="sessionId in selectedSessions"
        :key="`session-${sessionId}`"
        closable
        @close="removeSessions(sessionId)"
      >
        {{ getSessionLabel(sessionId) }}
      </el-tag>
    </template>
    <template v-else>
      <el-tag
        v-for="source in selectedSources"
        :key="`source-${source}`"
        closable
        @close="removeSources(source)"
      >
        {{ getSourceLabel(source) }}
      </el-tag>
    </template>

    <!-- 错误类型标签 -->
    <el-tag
      v-for="errorType in selectedErrorTypes"
      :key="`error-${errorType}`"
      closable
      @close="removeErrorType(errorType)"
    >
      {{ getErrorTypeLabel(errorType) }}
    </el-tag>

    <!-- 知识点标签 -->
    <el-tag
      v-for="tag of selectedKnowledge"
      :key="`knowledge-${tag}`"
      closable
      @close="removeKnowledge(tag)"
    >
      {{ tag }}
    </el-tag>

    <!-- 清除所有按钮 -->
    <el-button text size="small" @click="clearAllFilters">清除所有</el-button>
  </div>

  <!-- 内容区域 (保持原来的逻辑,只是容器改了) -->
  <div v-if="viewMode === 'card'" class="content-area">
    <!-- 卡片视图 -->
  </div>
  <div v-else class="content-area">
    <!-- 表格视图 -->
  </div>

  <!-- 分页 -->
  <div v-if="total > pageSize" class="pagination-area" style="text-align: center; margin-top: 24px;">
    <el-pagination
      :total="total"
      v-model:page-size="pageSize"
      v-model:current-page="currentPage"
      @current-change="applyFilters"
    />
  </div>
</div>
```

---

### Step 5: 必需的样式文件 (新建或更新)

```scss
// frontend/src/styles/modules/wrong-answers-redesign.scss

.wrong-answers-page {
  padding: 24px;
  background: #f5f7fa;

  // ========== 页面头部 ==========
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }

    h1 {
      font-size: 28px;
      font-weight: 600;
      margin: 0;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
      margin: 0;
    }

    .header-actions {
      flex-shrink: 0;

      @media (max-width: 768px) {
        width: 100%;

        button {
          width: 100%;
        }
      }
    }
  }

  // ========== 主容器 ==========
  .wrong-answers-container {
    // 使用ElRow/ElCol的gutter spacing
  }

  // ========== 过滤面板 ==========
  .filter-panel {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: fit-content;
    position: sticky;
    top: 24px;

    @media (max-width: 768px) {
      position: static;
      margin-bottom: 16px;
    }
  }

  // 单个过滤组
  .filter-section {
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }

      .filter-ops {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;

        .op-divider {
          color: #d1d5db;
          margin: 0 4px;
        }
      }
    }

    .filter-body {
      .checkbox-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .checkbox-item {
          display: flex;
          align-items: center;

          :deep(.el-badge) {
            display: 100%;

            .el-badge__content {
              transform: translate(0, -8px);
            }
          }
        }
      }

      .tag-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .el-check-tag {
          font-size: 12px;
          padding: 6px 12px;
        }
      }

      .el-input {
        margin-bottom: 12px;
      }

      :deep(.el-radio-group) {
        width: 100%;
        display: flex;
        flex-direction: column;

        .el-radio-button {
          flex: 1;
          margin-bottom: 6px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  // ========== 主内容面板 ==========
  .list-panel {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .list-toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      align-items: center;

      @media (max-width: 768px) {
        flex-direction: column;

        .el-input {
          width: 100%;
        }
      }
    }
  }

  // ========== 活跃筛选条件 (新增,这是关键!) ==========
  .active-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background-color: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;

    .label {
      color: #666;
      font-weight: 500;
      margin-right: 4px;
    }

    .el-tag {
      margin-right: 0;
      margin-bottom: 4px;
    }

    .el-button {
      margin-left: 8px;
    }
  }

  // ========== 内容区域 ==========
  .content-area {
    min-height: 400px;
    padding: 16px 0;
  }

  // ========== 分页 ==========
  .pagination-area {
    padding: 16px 0;
    border-top: 1px solid #f0f0f0;
  }
}
```

---

### Step 6: Script部分需要添加的函数

```javascript
// 新增的computed和方法

const hasActiveFilters = computed(() => {
  return selectedSessions.value.length > 0 ||
         selectedSources.value.length > 0 ||
         selectedErrorTypes.value.length > 0 ||
         selectedKnowledge.value.size > 0 ||
         keyword.value.trim() !== ''
})

const getSessionLabel = (sessionId) => {
  const session = sessions.value.find(s => s.sessionId === sessionId)
  return session?.jobTitle || sessionId
}

const getSourceLabel = (source) => {
  const labels = {
    'question_bank': '题库',
    'mock_exam': '模拟考试'
  }
  return labels[source] || source
}

const getErrorTypeLabel = (type) => {
  const labels = {
    'knowledge': '知识点错误',
    'logic': '逻辑混乱',
    'incomplete': '回答不完整',
    'expression': '表达不流畅'
  }
  return labels[type] || type
}

const removeSessions = (sessionId) => {
  selectedSessions.value = selectedSessions.value.filter(s => s !== sessionId)
  applyFilters()
}

const removeSources = (source) => {
  selectedSources.value = selectedSources.value.filter(s => s !== source)
  applyFilters()
}

const removeErrorType = (type) => {
  selectedErrorTypes.value = selectedErrorTypes.value.filter(t => t !== type)
  applyFilters()
}

const clearAllFilters = () => {
  selectedSessions.value = []
  selectedSources.value = []
  selectedErrorTypes.value = []
  selectedKnowledge.value.clear()
  keyword.value = ''
  applyFilters()
}
```

---

## 📋 改造清单

- [ ] 替换页面头部结构 (button-group → tabs)
- [ ] 改造主布局为el-row/el-col
- [ ] 统一所有filter-section的样式
- [ ] 添加活跃筛选条件显示区
- [ ] 添加新的scss样式
- [ ] 添加辅助函数(getLabel等)
- [ ] 测试所有过滤功能
- [ ] 测试响应式布局
- [ ] 移动端drawer适配 (可选)

---

## 🚀 快速开始

1. **最小改造** (30分钟)
   - 替换header结构
   - 改造主layout为grid
   - 添加active-filters显示

2. **完整改造** (2-3小时)
   - 统一所有样式
   - 添加所有辅助函数
   - 完整响应式适配

3. **优化改造** (1-2小时)
   - 添加动画过渡
   - 移动端Drawer适配
   - 性能优化

---

## 💡 小贴士

1. **逐步改造** - 不要一次全改，先改header，再改layout，最后改样式
2. **保留功能** - 重点是排版重构,逻辑不变
3. **参考QuestionBankPage** - 很多样式可以直接复用
4. **测试过滤** - 确保所有过滤条件仍然正常工作
5. **移动端** - 使用`@media`检查每个断点
