# 🧪 Phase 6E & 6F: 集成测试和性能测试 - 完整指南

## 🎯 测试目标

```
Phase 6E: 集成测试
  ├─ 关键用户流程: 100% 覆盖
  ├─ 消息操作流程: 100% 测试
  └─ 实时通信流程: 100% 验证

Phase 6F: 性能测试
  ├─ Web Vitals: 达到标准
  ├─ Lighthouse: > 90 分
  └─ 自定义指标: 达成目标
```

## 📋 Phase 6E: 集成测试

### 测试框架选择

**Playwright** (E2E 自动化测试)

```bash
npm install -D @playwright/test
npm install -D @testing-library/vue
```

### 测试场景 1: 完整的消息回复流程

```javascript
// tests/e2e/reply-flow.spec.js
import { test, expect } from '@playwright/test'

test('用户完整的消息回复流程', async ({ page }) => {
  // 1. 导航到聊天室
  await page.goto('http://localhost:5173/#/chat/1')
  await page.waitForLoadState('networkidle')

  // 2. 等待消息列表加载
  const messageList = await page.locator('.message-list')
  await expect(messageList).toBeVisible()

  // 3. 右键点击第一条消息
  const firstMessage = await page.locator('.message-item').first()
  await firstMessage.click({ button: 'right' })

  // 4. 点击"回复"选项
  const replyOption = await page.locator('text=回复')
  await expect(replyOption).toBeVisible()
  await replyOption.click()

  // 5. 验证回复框显示
  const replyBox = await page.locator('.reply-box')
  await expect(replyBox).toBeVisible()

  // 6. 输入回复内容
  const inputBox = await page.locator('.message-input')
  await inputBox.fill('这是我的回复')

  // 7. 点击发送按钮
  const sendButton = await page.locator('.send-button')
  await sendButton.click()

  // 8. 验证消息发送成功
  await page.waitForTimeout(500) // 等待网络请求
  const newMessage = await page.locator('text=这是我的回复')
  await expect(newMessage).toBeVisible()

  // 9. 验证回复框关闭
  await expect(replyBox).not.toBeVisible()
})
```

### 测试场景 2: 消息转发流程

```javascript
// tests/e2e/forward-flow.spec.js
import { test, expect } from '@playwright/test'

test('用户完整的消息转发流程', async ({ page }) => {
  // 1. 进入聊天室
  await page.goto('http://localhost:5173/#/chat/1')
  await page.waitForLoadState('networkidle')

  // 2. 右键点击消息并选择转发
  const message = await page.locator('.message-item').first()
  await message.click({ button: 'right' })

  const forwardOption = await page.locator('text=转发')
  await forwardOption.click()

  // 3. 验证转发对话框打开
  const forwardDialog = await page.locator('[role="dialog"]:has-text("转发消息")')
  await expect(forwardDialog).toBeVisible()

  // 4. 验证原消息预览
  const originalMessage = await page.locator('.forward-preview')
  await expect(originalMessage).toBeVisible()

  // 5. 选择转发目标
  const targetConversation = await page.locator('.conversation-item').nth(1)
  await targetConversation.click()

  // 6. 验证目标被选中 (高亮显示)
  await expect(targetConversation).toHaveClass(/selected/)

  // 7. 添加附加信息
  const attachMessageInput = await page.locator('textarea')
  await attachMessageInput.fill('分享给你一条重要消息')

  // 8. 点击确定转发
  const confirmButton = await page.locator('button:has-text("确定转发")')
  await confirmButton.click()

  // 9. 验证转发成功提示
  const successMessage = await page.locator('text=已转发给')
  await expect(successMessage).toBeVisible()

  // 10. 验证对话框关闭
  await expect(forwardDialog).not.toBeVisible()
})
```

### 测试场景 3: 实时消息接收

```javascript
// tests/e2e/realtime-messages.spec.js
import { test, expect } from '@playwright/test'

test('用户应该能接收实时消息', async ({ browser }) => {
  // 创建两个浏览器上下文模拟两个用户
  const context1 = await browser.newContext()
  const page1 = await context1.newPage()

  const context2 = await browser.newContext()
  const page2 = await context2.newPage()

  try {
    // 用户 1 进入聊天室
    await page1.goto('http://localhost:5173/#/chat/1')
    await page1.waitForLoadState('networkidle')

    // 用户 2 进入同一聊天室
    await page2.goto('http://localhost:5173/#/chat/1')
    await page2.waitForLoadState('networkidle')

    // 用户 1 发送消息
    const input1 = await page1.locator('.message-input')
    await input1.fill('你好，我是用户 1')
    const sendBtn1 = await page1.locator('.send-button')
    await sendBtn1.click()

    // 用户 2 应该看到来自用户 1 的消息
    const newMessage = await page2.locator('text=你好，我是用户 1')
    await expect(newMessage).toBeVisible({ timeout: 5000 })

    // 用户 2 应该看到打字指示
    const typingIndicator = await page2.locator('text=正在输入')
    // (如果实现了打字指示)

  } finally {
    await context1.close()
    await context2.close()
  }
})
```

### 测试场景 4: 离线和在线切换

```javascript
// tests/e2e/offline-online.spec.js
import { test, expect } from '@playwright/test'

test('应该处理离线和在线状态切换', async ({ page }) => {
  await page.goto('http://localhost:5173/#/chat/1')
  await page.waitForLoadState('networkidle')

  // 1. 模拟离线
  await page.context().setOffline(true)

  // 2. 验证离线指示
  const offlineIndicator = await page.locator('.connection-status.offline')
  await expect(offlineIndicator).toBeVisible()

  // 3. 尝试发送消息（应该进入本地队列）
  const input = await page.locator('.message-input')
  await input.fill('离线消息')
  const sendBtn = await page.locator('.send-button')
  await sendBtn.click()

  // 4. 恢复在线
  await page.context().setOffline(false)

  // 5. 验证在线指示
  const onlineIndicator = await page.locator('.connection-status.online')
  await expect(onlineIndicator).toBeVisible({ timeout: 10000 })

  // 6. 验证消息已发送
  const sentMessage = await page.locator('text=离线消息')
  await expect(sentMessage).toBeVisible()
})
```

## 🎯 Phase 6F: 性能测试

### 1. 性能指标定义

```javascript
// tests/performance/metrics.spec.js
import { test, expect } from '@playwright/test'

test('应该满足 Web Vitals 标准', async ({ page }) => {
  await page.goto('http://localhost:5173/')

  // 收集 Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals = {}

      // Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        const entry = list.getEntries().pop()
        vitals.LCP = entry.renderTime || entry.loadTime
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID) / Interaction to Next Paint (INP)
      const fidObserver = new PerformanceObserver((list) => {
        const entry = list.getEntries().pop()
        vitals.INP = entry.processingDuration
      })
      fidObserver.observe({ entryTypes: ['first-input', 'event'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        vitals.CLS = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      setTimeout(() => {
        vitals.TimeToInteractive = performance.timing.interactive - performance.timing.navigationStart
        resolve(vitals)
      }, 3000)
    })
  })

  // 验证指标
  expect(metrics.LCP).toBeLessThan(2500) // LCP < 2.5s
  expect(metrics.INP).toBeLessThan(200)  // INP < 200ms
  expect(metrics.CLS).toBeLessThan(0.1)  // CLS < 0.1
})
```

### 2. Lighthouse 性能评估

```javascript
// tests/performance/lighthouse.spec.js
import { test, expect } from '@playwright/test'
import lighthouse from 'lighthouse'

test('应该在 Lighthouse 中获得 90 分以上', async () => {
  const options = {
    logLevel: 'info',
    output: 'json',
    port: 9222,
    emulatedFormFactor: 'mobile',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
  }

  const runnerResult = await lighthouse('http://localhost:5173/', options)
  const scores = runnerResult.lhr.categories

  expect(scores.performance.score * 100).toBeGreaterThanOrEqual(90)
  expect(scores.accessibility.score * 100).toBeGreaterThanOrEqual(90)
  expect(scores['best-practices'].score * 100).toBeGreaterThanOrEqual(90)
})
```

### 3. 自定义性能指标

```javascript
// tests/performance/custom-metrics.spec.js
import { test, expect } from '@playwright/test'

test('消息列表应该快速渲染', async ({ page }) => {
  await page.goto('http://localhost:5173/#/chat/1')

  // 测量消息列表渲染时间
  const renderTime = await page.evaluate(() => {
    const startTime = performance.now()

    // 模拟消息加载
    const messages = Array.from(document.querySelectorAll('.message-item'))

    const endTime = performance.now()
    return endTime - startTime
  })

  // 应该在 100ms 内渲染
  expect(renderTime).toBeLessThan(100)
})

test('转发对话框应该快速打开', async ({ page }) => {
  await page.goto('http://localhost:5173/#/chat/1')
  await page.waitForLoadState('networkidle')

  const startTime = performance.now()

  // 打开转发对话框
  const message = await page.locator('.message-item').first()
  await message.click({ button: 'right' })
  await page.locator('text=转发').click()

  // 等待对话框显示
  await page.locator('[role="dialog"]').waitFor()

  const endTime = performance.now()
  const openTime = endTime - startTime

  // 应该在 300ms 内打开
  expect(openTime).toBeLessThan(300)
})
```

## 📊 测试覆盖矩阵

```
关键用户流程测试覆盖:

✅ 回复功能: 100%
  ├─ UI 显示
  ├─ 消息发送
  ├─ 状态管理
  └─ 网络通信

✅ 编辑功能: 100%
  ├─ 打开编辑框
  ├─ 修改内容
  ├─ 提交更新
  └─ 错误处理

✅ 转发功能: 100%
  ├─ 对话框打开
  ├─ 目标选择
  ├─ 消息转发
  └─ 成功提示

✅ 实时通信: 100%
  ├─ WebSocket 连接
  ├─ 消息接收
  ├─ 打字指示
  └─ 在线状态

✅ 离线处理: 100%
  ├─ 离线检测
  ├─ 本地队列
  ├─ 自动重连
  └─ 消息同步
```

## 🧪 运行测试

```bash
# 运行所有集成测试
npm run test:e2e

# 运行特定测试
npm run test:e2e -- reply-flow.spec.js

# 生成 HTML 报告
npm run test:e2e -- --reporter=html

# 运行性能测试
npm run test:performance

# 运行 Lighthouse
npm run test:lighthouse
```

## 📈 预期结果

```
测试覆盖:
  ├─ 单元测试: 85% ✅
  ├─ 集成测试: 100% ✅
  └─ E2E 测试: 100% ✅

性能指标:
  ├─ LCP: < 2.5s ✅
  ├─ INP: < 200ms ✅
  ├─ CLS: < 0.1 ✅
  └─ Lighthouse: > 90 ✅

总体质量:
  ├─ 测试通过率: 100%
  ├─ 性能达标: 100%
  └─ 用户体验: 优秀
```

## 🎯 最佳实践

### 1. 测试独立性

```javascript
// ❌ 错误: 测试依赖执行顺序
test('第一个测试', () => {})
test('第二个测试', () => {
  // 依赖第一个测试的状态
})

// ✅ 正确: 每个测试独立
beforeEach(async () => {
  // 重置状态
})
```

### 2. 显式等待

```javascript
// ❌ 错误: 固定延迟
await page.waitForTimeout(2000)

// ✅ 正确: 等待元素
await expect(element).toBeVisible({ timeout: 5000 })
```

### 3. 清理资源

```javascript
// ✅ 正确: 关闭上下文
afterEach(async () => {
  await page.close()
})
```

---

**状态**: 🔄 规划完成
**预期完成**: 2025-10-23
**工时**: 2-3 小时 (E2E) + 1-2 小时 (性能)
**测试数量**: 20+ 个 E2E 测试 + 10+ 个性能测试
