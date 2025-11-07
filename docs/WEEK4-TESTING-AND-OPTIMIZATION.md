# 第4周 - 集成测试与性能优化指南

**计划日期**: Week 4
**总体目标**: 测试覆盖 + 性能优化 + 可靠性保证
**预计工作量**: 40小时

---

## 📋 Week 4 任务分解

### 任务4.1: 单元测试套件 (8小时)
- [x] 服务层测试 (userStatusEnhancedService)
- [x] API层测试 (chat API)
- [ ] 组件单元测试 (UserStatusIndicator, UserStatusBadge)
- [ ] 存储层测试 (localStorage, 数据持久化)

### 任务4.2: 集成测试 (10小时)
- [ ] 端对端工作流测试
- [ ] 前后端交互测试
- [ ] 错误恢复测试
- [ ] 并发操作测试

### 任务4.3: 性能基准测试 (8小时)
- [ ] 加载时间测试
- [ ] 内存使用测试
- [ ] API响应时间测试
- [ ] 虚拟列表性能测试

### 任务4.4: 性能优化 (14小时)
- [ ] 组件优化
- [ ] API调用优化
- [ ] 缓存策略优化
- [ ] 包大小优化

---

## ✅ 已完成的测试文件

### 1. 单元测试: userStatusEnhancedService
**位置**: `frontend/src/__tests__/services/userStatusEnhancedService.test.js`
**覆盖范围**:
- 基础状态管理 (4个测试)
- 自定义消息 (5个测试)
- 状态历史 (4个测试)
- 格式化显示 (3个测试)
- 数据持久化 (3个测试)
- 配置和可用状态 (3个测试)
- 事件回调系统 (3个测试)
- 边界值和错误处理 (4个测试)
- 整合测试 (2个测试)

**总计**: 31个单元测试用例

### 2. API测试: chat API
**位置**: `frontend/src/__tests__/api/chat.test.js`
**覆盖范围**:
- 用户状态API (6个测试)
- 会话管理API (4个测试)
- 文件上传API (1个测试)
- 消息编辑API (2个测试)
- 错误处理 (3个测试)

**总计**: 16个API测试用例

---

## 🔧 测试框架配置

### 安装依赖

```bash
# 安装 vitest (推荐用于 Vue 3)
npm install -D vitest @vue/test-utils happy-dom

# 或使用 Jest
npm install -D @vue/vue3-jest jest @babel/preset-env
```

### vitest.config.js 配置

```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'frontend/src/__tests__/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src')
    }
  }
})
```

### package.json 测试脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## 🚀 运行测试

### 基础测试运行

```bash
# 运行所有测试
npm run test

# 监听模式 (开发中实时测试)
npm run test:watch

# 生成覆盖报告
npm run test:coverage

# UI 界面运行
npm run test:ui
```

### 运行特定测试文件

```bash
# 只运行用户状态服务测试
npm run test userStatusEnhancedService.test.js

# 只运行API测试
npm run test chat.test.js

# 匹配模式
npm run test --grep="状态管理"
```

---

## 📊 性能优化指南

### 1. 虚拟列表优化

**问题**: 大量消息导致DOM节点过多

**解决方案**:
```javascript
// 在 VirtualList.vue 中优化
const ITEM_HEIGHT = 60 // 固定高度
const BUFFER_SIZE = 5  // 缓冲区大小
const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE

// 只渲染可见范围内的项目
const visibleItems = computed(() => {
  return items.value.slice(startIndex.value, endIndex.value)
})
```

### 2. 缓存策略优化

**当前实现**:
- 消息搜索缓存 (5秒)
- 用户状态缓存 (30秒)

**优化建议**:
```javascript
// 实现智能缓存
class SmartCache {
  constructor(ttl = 5000) {
    this.cache = new Map()
    this.ttl = ttl
  }

  set(key, value, ttl = this.ttl) {
    if (this.cache.has(key)) {
      clearTimeout(this.cache.get(key).timer)
    }
    const timer = setTimeout(() => this.cache.delete(key), ttl)
    this.cache.set(key, { value, timer })
  }

  get(key) {
    return this.cache.get(key)?.value
  }

  clear() {
    this.cache.forEach(item => clearTimeout(item.timer))
    this.cache.clear()
  }
}
```

### 3. API调用优化

**问题**: 频繁的状态同步导致API压力

**解决方案**:
```javascript
// 请求合并 (Debounce)
import { debounce } from 'lodash-es'

const syncStatus = debounce(async (status) => {
  await updateUserStatus(status)
}, 1000) // 1秒内只发送一次请求

// 批量查询优化
const getBatchStatuses = async (userIds) => {
  const batchSize = 20
  const results = []

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize)
    const result = await getUserStatuses(batch)
    results.push(...result.data.statuses)
  }

  return results
}
```

### 4. 组件性能优化

**优化 UserStatusIndicator.vue**:
```javascript
// 使用计算属性缓存
const statusInfo = computed(() => {
  const config = getStatusConfig()
  return config.STATUS_TYPES[currentStatus.value]
})

// 避免频繁的DOM更新
const showStatusPanel = ref(false)

// 使用 v-show 替代 v-if (如果频繁切换)
// <template v-show="..."> 而不是 <template v-if="...">
```

### 5. 包大小优化

**分析工具**:
```bash
# 分析包大小
npm install -D webpack-bundle-analyzer

# 生成分析报告
npx webpack-bundle-analyzer dist/stats.json
```

**优化方案**:
- 树摇 (Tree Shaking): 移除未使用的代码
- 代码分割 (Code Splitting): 按路由分割
- 懒加载 (Lazy Loading): 延迟加载组件

---

## 📈 性能基准测试

### 1. 加载时间测试

```javascript
// 在浏览器控制台运行
performance.mark('start')
// ... 执行操作
performance.mark('end')
performance.measure('operation', 'start', 'end')
const measure = performance.getEntriesByName('operation')[0]
console.log(`耗时: ${measure.duration}ms`)
```

**目标基准**:
- 首屏加载: < 2秒
- 状态切换: < 100ms
- API响应: < 500ms

### 2. 内存使用测试

```javascript
// 获取内存使用
if (performance.memory) {
  console.log(`已用内存: ${performance.memory.usedJSHeapSize / 1048576}MB`)
  console.log(`总堆内存: ${performance.memory.totalJSHeapSize / 1048576}MB`)
}
```

**目标基准**:
- 初始加载: < 50MB
- 长期运行: < 100MB

### 3. API性能测试

```javascript
// 测试 API 响应时间
async function testAPIPerformance() {
  const iterations = 100
  const times = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await getCurrentUserStatus()
    const end = performance.now()
    times.push(end - start)
  }

  const avg = times.reduce((a, b) => a + b) / times.length
  const max = Math.max(...times)
  const min = Math.min(...times)

  console.log(`平均: ${avg.toFixed(2)}ms, 最大: ${max.toFixed(2)}ms, 最小: ${min.toFixed(2)}ms`)
}
```

---

## 🧪 集成测试场景

### 场景1: 完整用户状态流程

```javascript
describe('完整用户状态工作流', () => {
  it('应该处理完整的状态变化周期', async () => {
    // 1. 初始化
    let status = await getCurrentUserStatus()
    expect(status.status).toBe('online')

    // 2. 设置离开状态
    await updateUserStatus({ status: 'away', customStatus: '午休中' })
    status = await getCurrentUserStatus()
    expect(status.status).toBe('away')

    // 3. 更新消息
    await setStatusMessage('即将回来')
    status = await getCurrentUserStatus()
    expect(status.customStatus).toBe('即将回来')

    // 4. 返回在线
    await updateUserStatus({ status: 'online' })
    status = await getCurrentUserStatus()
    expect(status.status).toBe('online')

    // 5. 验证历史
    const history = await getStatusHistory({ limit: 10 })
    expect(history.length).toBeGreaterThan(0)
  })
})
```

### 场景2: 并发操作测试

```javascript
describe('并发操作处理', () => {
  it('应该正确处理并发状态更新', async () => {
    const promises = [
      updateUserStatus({ status: 'away' }),
      updateUserStatus({ status: 'busy' }),
      updateUserStatus({ status: 'online' })
    ]

    await Promise.all(promises)

    const status = await getCurrentUserStatus()
    expect(status.status).toBeDefined()
    expect(['away', 'busy', 'online']).toContain(status.status)
  })
})
```

### 场景3: 错误恢复测试

```javascript
describe('错误恢复', () => {
  it('网络错误后应该恢复', async () => {
    // 模拟网络错误
    vi.mocked(api).mockRejectedValueOnce(new Error('Network error'))

    try {
      await updateUserStatus({ status: 'away' })
    } catch (error) {
      expect(error.message).toBe('Network error')
    }

    // 恢复
    vi.mocked(api).mockResolvedValueOnce({ success: true })
    const result = await updateUserStatus({ status: 'online' })
    expect(result.success).toBe(true)
  })
})
```

---

## 📋 优化检查清单

### 代码优化
- [ ] 移除未使用的导入
- [ ] 优化渲染列表
- [ ] 使用计算属性缓存
- [ ] 避免深层对象响应
- [ ] 使用 v-show 替代 v-if

### API优化
- [ ] 实现请求缓存
- [ ] 使用请求合并
- [ ] 批量查询API
- [ ] 减少不必要的API调用
- [ ] 实现退避策略

### 性能优化
- [ ] 代码分割
- [ ] 树摇
- [ ] 图片优化
- [ ] CSS压缩
- [ ] JavaScript压缩

### 监控和告警
- [ ] 性能监控
- [ ] 错误监控
- [ ] 用户体验监控
- [ ] 业务指标追踪

---

## 🎯 Success Criteria

### 单元测试
- [ ] 测试覆盖率 > 80%
- [ ] 所有测试通过
- [ ] 平均测试执行时间 < 5秒

### 集成测试
- [ ] 端对端工作流通过
- [ ] 并发操作正确处理
- [ ] 错误场景正确恢复

### 性能基准
- [ ] 首屏加载 < 2秒
- [ ] 状态切换 < 100ms
- [ ] API响应 < 500ms
- [ ] 内存占用 < 100MB

### 优化目标
- [ ] 包大小减少 20%
- [ ] API调用减少 30%
- [ ] 首屏加载时间减少 40%

---

## 📚 参考资源

### 测试框架文档
- [Vitest](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)

### 性能优化资源
- [Web Vitals](https://web.dev/vitals/)
- [Vue Performance](https://vuejs.org/guide/best-practices/performance.html)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### 性能监控工具
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Bundle Analyzer](https://github.com/webpack-bundle-analyzer/webpack-bundle-analyzer)

---

## 📞 后续工作

### 立即开始
1. 运行现有测试套件 (`npm run test`)
2. 查看测试覆盖报告 (`npm run test:coverage`)
3. 修复任何失败的测试

### 本周完成
1. 完成组件单元测试
2. 实现集成测试套件
3. 运行性能基准测试
4. 执行性能优化

### 下一步 (Week 5)
1. WebSocket实时更新集成
2. 离线模式支持
3. 高级缓存策略
4. 用户体验优化

---

**Week 4 目标**: 确保系统的可靠性、性能和可维护性
**预期收益**: 更稳定的系统、更快的响应、更好的用户体验

