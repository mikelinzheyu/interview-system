# ⚡ 快速修复检查清单 (2 分钟指南)

## 🎯 您需要做的 (仅 3 步)

### ✅ Step 1: 打开工作流 (30 秒)
```
访问: https://udify.app/workflow/sNkeofwLHukS3sC2
点击: 右上角 "编辑" 按钮
```

### ✅ Step 2: 修复变量映射 (1 分钟)

**打开节点:**
- 在工作流画布上找到 "保存问题列表" 节点
- 双击打开配置面板

**修改 questions 变量:**
```
在左侧"输入变量"面板找到 questions 行

当前显示: [某个值或选择器]
修改为:   extract_skills → structured_output → questions

步骤:
1. 点击 questions 行的变量选择器按钮
2. 第一级: 选择 extract_skills (LLM 节点)
3. 第二级: 选择 structured_output (LLM 结构化输出)
4. 第三级: 选择 questions (这是关键！)
5. 确认类型显示为 "Array"
6. 点击确认
```

### ✅ Step 3: 发布修改 (30 秒)
```
1. 点击左下角 "保存" 按钮
2. 等待保存完成
3. 点击 "发布" 按钮
4. 等待发布完成 (~30 秒)
```

---

## 🧪 验证修复成功

```bash
cd D:\code7\interview-system
node test-workflow1-simple.js
```

### 期望看到:
```
✅ HTTP 状态: 200

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",  ← UUID，不为空！
  "questions": "[{\"id\": \"...\", \"question\": \"问题1\"}...]",  ← 有内容！
  "job_title": "Python后端开发工程师",  ← 正确
  "question_count": 5  ← 大于 0！
}

✅ 变量映射正确！
```

---

## 🚨 如果仍然失败？

### 可能原因 1: 没有保存
- ❌ 问题: 修改了但没点保存
- ✅ 解决: 点击 "保存" 然后 "发布"

### 可能原因 2: 没有发布
- ❌ 问题: 保存了但没点发布
- ✅ 解决: 必须点击 "发布" 按钮
- ✅ 等待 30 秒后再测试

### 可能原因 3: 选择错了层级
- ❌ 问题: 选了错的字段或少选了一层
- ✅ 解决: 再次检查:
  - L1: extract_skills ✓
  - L2: structured_output ✓
  - L3: questions ✓
  - 类型: Array ✓

### 可能原因 4: 浏览器缓存
- ❌ 问题: 修改没有生效
- ✅ 解决:
  1. 硬刷新页面: Ctrl + Shift + R (或 Cmd + Shift + R)
  2. 重新进入编辑模式
  3. 重新修改并发布

### 可能原因 5: 选择器不展开
- ❌ 问题: 在变量选择器中找不到下一级
- ✅ 解决:
  1. 点击 extract_skills 后看是否展开
  2. 如果没有展开，尝试点击 ">" 箭头
  3. 查找 structured_output 选项

---

## 📱 视觉参考

### ❌ 错误的样子
```
问题             值选择器                  类型
────────────────────────────────────────────
questions   extract_skills              Object ✗
               → (完成)
```

### ✅ 正确的样子
```
问题             值选择器                  类型
────────────────────────────────────────────
questions   extract_skills              Array ✓
               → structured_output
               → questions
```

---

## ⏱️ 总时间

- 打开工作流: 30 秒
- 修改变量: 1 分钟
- 发布修改: 30 秒
- 测试验证: 30 秒

**总计: 约 3 分钟**

---

## 📞 需要帮助？

如果完成以上步骤后仍然不工作:

1. ✅ 检查是否真的点了 "发布"
2. ✅ 检查变量选择器是否选到了所有 3 层
3. ✅ 检查类型是否是 "Array" 而不是 "Object"
4. ✅ 清理浏览器缓存后重试
5. ✅ 查看 VARIABLE-MAPPING-COMPARISON.md 了解原理

---

## 🎓 为什么这样修改？

简单解释:

Dify LLM 节点返回:
```
{
    "questions": ["问题1", "问题2", ...]
}
```

您的 Python 代码需要数组 `["问题1", "问题2", ...]`

所以必须选到 `questions` 字段来提取其中的数组。

如果只选 `structured_output`，Python 代码会收到整个对象，然后出错。

