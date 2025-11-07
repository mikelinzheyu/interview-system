# 🚨 工作流1 快速修复 (立即执行)

## 问题症状

```json
{
  "session_id": "",           // ❌ 应该是 UUID
  "questions": "[]",          // ❌ 应该包含 5 个问题
  "job_title": "教师",        // ✅ 正确
  "question_count": 0         // ❌ 应该是 5
}
```

---

## 🎯 根本原因

**Questions 变量映射错误** - 在 Dify 工作流的"保存问题列表"节点中：

```
❌ 错误: extract_skills → structured_output
✅ 应该: extract_skills → structured_output → questions
```

---

## ⚡ 立即修复 (3步, 5分钟)

### 步骤1️⃣: 打开工作流编辑器

1. 访问: https://udify.app/workflow/gBlbo69soxLoTRSO
2. 点击 "编辑" 按钮
3. 工作流进入编辑模式

### 步骤2️⃣: 修改变量映射

1. 在工作流画布中找到 **"保存问题列表"** 节点 (Python 代码节点)
2. 点击该节点打开配置面板
3. 在右侧面板中找到 **"输入变量"** 或 **"变量"** 部分
4. 找到名称为 **`questions`** 的变量

**修改步骤**:
- 点击 questions 变量的值选择器
- 看到当前路径显示 `extract_skills / structured_output`
- **清除** 当前选择，重新选择:
  - 第1步: 选择 `extract_skills` 节点
  - 第2步: 选择 `structured_output` 字段
  - 第3步: **选择 `questions` 字段** ← 这是关键！
- 确认值类型为 `array`
- 点击 "确定" 或 "保存"

### 步骤3️⃣: 发布工作流

1. 点击 "保存" 按钮
2. 点击 "发布" 按钮 (或 "更新")
3. 等待工作流重新加载 (2-5秒)

---

## ✅ 修复后验证

运行测试:
```bash
node test-workflow1-simple.js
```

**预期看到**:
```json
{
  "session_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "questions": "[{\"id\":\"...\", \"question\":\"...\", ...}]",
  "job_title": "教师",
  "question_count": 5
}
```

---

## 📸 参考图示

### 错误的配置 ❌
```
保存问题列表 节点
└─ 输入变量
   ├─ job_title: [start → job_title] ✅
   └─ questions: [extract_skills → structured_output] ❌
      应该在这里再多选一层: questions
```

### 正确的配置 ✅
```
保存问题列表 节点
└─ 输入变量
   ├─ job_title: [start → job_title] ✅
   └─ questions: [extract_skills → structured_output → questions] ✅
      └─ 类型: array
```

---

## 🆘 如果找不到选择器

有些 Dify 版本的 UI 可能不同。如果找不到值选择器:

1. **尝试其他方法**:
   - 点击变量旁的 "配置" 或 "设置" 按钮
   - 在弹出的对话框中修改

2. **或者直接编辑代码**:
   - 在代码节点中修改 Python 代码
   - 添加注释说明变量来源

3. **或者重新导入工作流**:
   - 使用我们修复好的 YAML 文件: `AI面试官-工作流1-生成问题-最终版.yml`
   - 这个文件已经包含了正确的变量映射

---

## 🔍 故障排除

### 如果修复后仍不工作

**检查清单**:
- [ ] 确认已点击"发布"按钮
- [ ] 确认工作流状态显示为 "Published"
- [ ] 等待 5 秒后再次测试
- [ ] 刷新浏览器后重新运行测试

### 如果仍然失败

**可能的其他原因**:
1. Google 搜索未返回结果 → 尝试另一个职位
2. LLM 模型未配置 → 检查 Gemini API 密钥
3. 存储服务未运行 → 运行: `node mock-storage-service.js`

---

## 📝 变量映射详解

### 什么是 structured_output？

Dify 的 LLM 节点返回结果时，结构化输出的格式是:
```python
{
  "structured_output": {
    "questions": [
      "问题1",
      "问题2",
      ...
    ]
  }
}
```

### 为什么需要多选一层 `questions`?

- ❌ 如果只选到 `structured_output`，Python 代码接收到的是: `{"questions": [...]}`
- ✅ 如果再选一层 `questions`，Python 代码接收到的是: `[...]`

Python 代码期望的是数组，所以必须多选一层。

---

## ⏱️ 修复预计时间

- 打开工作流: 30秒
- 编辑变量映射: 2分钟
- 发布工作流: 1分钟
- 测试验证: 2分钟
- **总计: 5-6分钟**

---

## 🎯 成功标志

修复完成后，你应该看到:

✅ session_id 返回有效的 UUID
✅ questions 包含 5 个问题
✅ question_count 为 5
✅ 数据保存到存储服务

---

## 📞 需要帮助？

查看详细诊断报告: `DIAGNOSIS-WORKFLOW1-ISSUE.md`

---

**现在就去修复吧！** 🚀

访问: https://udify.app/workflow/gBlbo69soxLoTRSO
