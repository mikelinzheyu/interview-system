# 🚀 评论功能优化 - 快速入门指南

## Phase 1: 核心功能（已完成 ✅）

### 1️⃣ 草稿自动保存

**自动工作，无需配置！**

- 当用户在评论框输入时，内容会在 **30 秒后自动保存**
- 刷新页面会自动恢复未提交的评论
- 提交成功后自动清空草稿

```
用户体验流程：
1. 用户输入评论 → 2. 30秒后自动保存 → 3. 页面显示"草稿已保存" 
→ 4. 刷新页面 → 5. 评论内容自动恢复
```

### 2️⃣ 快捷键提交

**提升输入效率的绝招！**

- **Windows/Linux**: 按 `Ctrl + Enter` 快速提交
- **Mac**: 按 `Cmd + Enter` 快速提交

这是现代编辑器的标准操作，用户无需学习，会自然使用。

### 3️⃣ 网络状态监测

**自动化的网络管理！**

**用户离线时**：
- 页面顶部显示黄色通知："网络已断开"
- 发表按钮显示为 "网络已断开" 并禁用

**用户恢复在线时**：
- 页面顶部显示绿色通知："网络已连接"
- 发表按钮恢复可用

### 4️⃣ 错误处理与重试

**智能化的错误恢复！**

提交评论失败时，系统会：

1. **判断错误类型**
   - 网络超时? → 自动重试
   - 内容过长? → 提示用户修改
   - 操作频繁? → 建议稍后再试

2. **自动重试** (仅限网络错误)
   - 第一次重试: 等待 2 秒
   - 第二次重试: 等待 4 秒
   - 失败后显示重试按钮

3. **错误提示示例**
   ```
   ❌ 网络连接超时，系统已自动重试，请稍候
   ❌ 评论内容过长，请压缩后重试
   ❌ 您的操作过于频繁，请稍后再试
   ```

### 5️⃣ XSS 防护

**强化的安全保护！**

系统会自动清理用户输入中的恶意代码：

✅ **允许**:
- 文本格式: 粗体、斜体、下划线、删除线
- 结构: 链接、图片、代码块、列表、引用
- Markdown: 所有标准 Markdown 格式

❌ **拦截**:
- `<script>` 标签
- `javascript:` 协议链接
- `onclick`/`onload` 事件
- 其他恶意标签和属性

---

## 📋 代码调用示例

### useDraft 使用

```javascript
import { useDraft } from '@/composables/useDraft'

const { content, lastSaveTime, clearDraft } = useDraft(`comment-draft-post-${postId}`)

// content - 评论内容（自动响应式，会自动保存）
// lastSaveTime - 最后保存时间
// clearDraft() - 手动清空草稿

// 模板中显示保存时间
<span v-if="lastSaveTime">
  最后保存于 {{ lastSaveTime.toLocaleTimeString() }}
</span>
```

### useNetworkStatus 使用

```javascript
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline, waitForOnline } = useNetworkStatus()

// isOnline - 当前是否在线（响应式）
// 监听网络变化
watch(() => isOnline.value, (online) => {
  if (online) {
    console.log('网络已恢复，可以重试')
  }
})

// 等待网络恢复
await waitForOnline()
console.log('网络现在可用')
```

### useComments 增强

```javascript
const { submitComment, getErrorMessage } = useComments(postId)

// submitComment 现在支持自动重试
const success = await submitComment(content, mentions)

if (!success) {
  // 显示分类过的错误信息
  console.error(error.value)
}
```

---

## 🧪 测试场景

### 场景 1: 测试草稿保存

1. 打开评论页面
2. 在评论框输入文字
3. 等待 30 秒
4. 刷新页面
5. ✅ 验证: 内容应该被恢复

### 场景 2: 测试快捷键

1. 在评论框输入文字
2. 按 Ctrl+Enter (或 Cmd+Enter)
3. ✅ 验证: 评论应该立即提交

### 场景 3: 测试网络监测

1. 打开开发者工具 (F12)
2. Network 标签 → 勾选 "Offline"
3. 尝试提交评论
4. ✅ 验证: 显示 "网络已断开" 提示
5. 取消勾选 "Offline"
6. ✅ 验证: 显示 "网络已连接" 通知

### 场景 4: 测试错误重试

1. 打开网络限流工具 (如 Chrome DevTools 中的 Slow 3G)
2. 尝试提交较长的评论
3. 如果超时，应该看到:
   - 自动重试通知 (2秒后)
   - 再次重试通知 (4秒后)
   - 如果最终失败，显示重试按钮

### 场景 5: 测试 XSS 防护

1. 复制以下恶意代码到评论框:
   ```
   <img src=x onerror="alert('XSS')">
   javascript:alert('XSS')
   ```
2. 提交或预览
3. ✅ 验证: 恶意代码被清理，不会执行

---

## 📚 相关文件位置

### Composables (业务逻辑)
- `frontend/src/composables/useDraft.js` - 草稿管理
- `frontend/src/composables/useNetworkStatus.js` - 网络监测
- `frontend/src/composables/useComments.js` - 评论业务逻辑

### 组件 (UI)
- `frontend/src/views/community/PostDetail/MainContent/CommentsSection/CommentForm.vue` - 评论表单
- `frontend/src/views/community/PostDetail/MainContent/CommentsSection.vue` - 评论容器
- `frontend/src/views/community/PostDetail/MainContent/CommentsSection/MarkdownPreview.vue` - Markdown 预览

### 文档
- `IMPLEMENTATION_SUMMARY.md` - 完整实施总结
- `COMMENT_OPTIMIZATION_PLAN.md` - 三阶段优化方案
- `COMMENT_SYSTEM_GUIDE.md` - 评论系统详细指南

---

## ⚙️ 配置调整

### 修改草稿保存间隔

文件: `frontend/src/composables/useDraft.js`

```javascript
// 将 useDraft 的第二个参数修改为毫秒数
const { content } = useDraft(key, 20000) // 改为 20 秒保存一次
```

### 修改最大重试次数

文件: `frontend/src/composables/useComments.js`

```javascript
// 在 submitComment 调用时传入第三个参数
await submitComment(content, mentions, 3) // 改为最多重试 3 次
```

---

## 🐛 故障排查

### 问题: 草稿没有自动保存

**解决方案**:
1. 检查浏览器是否启用了 localStorage
2. 打开开发者工具 → Application → Local Storage
3. 查找 `comment-draft-post-{postId}` 键
4. 如果不存在，检查浏览器控制台是否有错误

### 问题: 快捷键提交不工作

**解决方案**:
1. 确保焦点在评论框内（textarea 已激活）
2. 检查快捷键是否被浏览器或其他应用拦截
3. 尝试使用鼠标点击提交按钮

### 问题: 网络监测不起作用

**解决方案**:
1. 检查 Network 标签中是否真的断网
2. 打开浏览器控制台查看 navigator.onLine 值
3. 重新加载页面

### 问题: 看不到 XSS 防护的效果

**解决方案**:
1. 在评论框中粘贴: `<img src=x onerror="console.log('XSS')">`
2. 切换到预览标签
3. 打开浏览器控制台
4. ✅ 如果控制台没有输出日志，说明 XSS 防护生效

---

## Phase 2: 交互增强（已完成 ✅）

### 1️⃣ 实时 Markdown 预览

**分栏同屏编辑！**

- **桌面端**: 左右两列布局，编辑和预览并排显示
- **平板端**: 上下堆叠，全宽显示
- **手机端**: 只显示编辑区，预览隐藏（节省空间）

```
编辑区                    预览区
**粗体** 文本    →      粗体 文本
[链接](url)      →      链接
```

### 2️⃣ @ 提及用户

**智能用户补全！**

- 在评论框输入 `@` 可触发用户建议
- 自动显示匹配的用户列表（头像、用户名、职位）
- **键盘导航**: ↑↓ 选择，Enter 确认，Esc 关闭
- **搜索过滤**: 继续输入可过滤用户列表

```
用户输入: @张三
↓
系统显示: [👤 张三] [前端开发]
↓
按 Enter 确认
↓
替换为: @张三 [继续输入]
```

### 3️⃣ 现代化表情选择器

**分类搜索 + 最近使用！**

- **7大分类**: 笑脸、动物、食物、旅行、活动、物品、符号
- **快速搜索**: 按表情名称实时搜索
- **最近使用**: 自动记录最近 12 个使用的表情
- **皮肤色调**: 支持表情皮肤色调变体

```
功能演示:
1. 点击"😀 表情"按钮
2. 选择分类或搜索"笑"
3. 点击一个表情 → 自动插入
4. 下次打开时，"最近使用"会显示刚才的表情
```

---

## 📚 Phase 2 测试场景

### 场景 1: 测试分栏预览

1. 打开评论页面（桌面浏览器）
2. 在编辑框输入: `**粗体** 和 *斜体*`
3. ✅ 验证: 右侧预览区应该实时显示格式化文本
4. 调整窗口宽度到 900px (平板模式)
5. ✅ 验证: 编辑和预览应该垂直堆叠

### 场景 2: 测试 @mention 功能

1. 在评论框输入: `你好 @`
2. ✅ 验证: 应该显示用户建议下拉菜单
3. 继续输入: `@张` (搜索)
4. ✅ 验证: 应该过滤显示名字包含"张"的用户
5. 按 Enter 键确认选择
6. ✅ 验证: 应该自动补全为 `@张三 `
7. 再次输入 `@` 可以提及另一个用户

### 场景 3: 测试现代表情选择器

1. 点击"😀 表情"按钮
2. ✅ 验证: 应该显示现代表情选择器
3. 点击不同分类标签
4. ✅ 验证: 应该切换显示对应分类表情
5. 在搜索框输入 `笑`
6. ✅ 验证: 应该过滤显示相关表情
7. 点击一个表情
8. ✅ 验证: 表情应该插入到评论框
9. 刷新页面，重新打开表情选择器
10. ✅ 验证: "最近使用"应该显示刚才使用的表情

### 场景 4: 综合功能测试

1. 使用分栏预览编辑一条 Markdown 评论
2. 使用 @mention 提及用户
3. 使用表情选择器插入表情
4. 检查整个流程是否流畅
5. 按 Ctrl+Enter 提交评论
6. ✅ 验证: 评论应该成功发表
7. 刷新页面
8. ✅ 验证: 应该无草稿恢复（已提交）

---

## 🎯 使用建议

### Phase 1 + Phase 2 最佳实践

1. **编辑流程**:
   - 打开评论框（分栏预览自动显示）
   - 使用 @ 提及相关用户
   - 用 Markdown 格式化内容
   - 插入表情增加语气
   - Ctrl+Enter 快速提交

2. **提及用户的技巧**:
   - 输入 @ 后继续输入首字可快速过滤
   - 使用键盘导航比鼠标点击更快
   - 一条评论可以提及多个用户

3. **选择表情的技巧**:
   - 常用表情会自动出现在"最近使用"
   - 按分类查找比逐个翻页更快
   - 搜索表情名称是最直接的方式

---

### 给用户的建议 (Phase 1)
1. ✅ 经常使用 Ctrl/Cmd+Enter 快速提交
2. ✅ 信任自动保存功能，不用担心内容丢失
3. ✅ 网络超时时让系统自动重试，不用频繁刷新

### 给开发者的建议
1. ✅ 监听 `error` 状态，显示友好的错误提示
2. ✅ 定期清理过期的 localStorage 数据
3. ✅ 在生产环境监控网络错误率
4. ✅ 收集用户反馈并调整参数

---

## 📞 获取帮助

如有问题，请检查:
1. 浏览器控制台是否有错误 (F12 → Console)
2. Application 标签中的 localStorage 数据
3. Network 标签中的网络请求状态
4. 本指南的故障排查部分

---

**最后更新**: 2024年11月15日
**适用版本**: v2.0.0+
**完成进度**: Phase 1 ✅ Phase 2 ✅ Phase 3 ⏳
