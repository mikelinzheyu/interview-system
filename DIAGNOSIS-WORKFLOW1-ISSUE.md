# 工作流1 问题诊断报告

## 🔍 问题分析

### 测试输入
```
职位名称: "教师"
```

### 测试输出
```json
{
  "session_id": "",
  "questions": "[]",
  "job_title": "教师",
  "question_count": 0
}
```

---

## ❌ 确认的问题

### 问题1: Questions 为空数组

**现象**: `"questions": "[]"`

**原因分析**:
1. **可能原因A**: LLM 节点没有生成问题
   - Google 搜索可能未返回结果
   - LLM 提示词可能有问题
   - LLM 模型可能未正确配置

2. **可能原因B**: 变量映射仍然错误 ⚠️ **最有可能**
   - Python 代码接收的仍然是整个 `structured_output` 对象，而不是 `questions` 数组
   - 导致 `for idx, question in enumerate(questions)` 失败
   - 返回默认的空数组

### 问题2: Session ID 为空

**现象**: `"session_id": ""`

**根本原因**: 由于 questions 为空，Python 代码执行失败
- 无法生成 UUID
- 无法调用存储服务
- 返回空字符串

---

## 🔧 根本原因判断

### **最可能的原因: 变量映射错误仍未修复**

在 Dify 工作流的"保存问题列表"节点中：

```
❌ 错误配置:
- questions 变量指向: extract_skills → structured_output (获取整个对象)
- job_title 变量指向: extract_skills → text (获取完整输出)

✅ 应该配置为:
- questions 变量指向: extract_skills → structured_output → questions (获取数组)
- job_title 变量指向: start → job_title (获取用户输入)
```

### 为什么 job_title 正确了？

观察结果中 `"job_title": "教师"` 是正确的，说明可能：
1. job_title 变量映射已经修复
2. 或者 Python 代码中 `job_title` 参数是直接从输入获取的

---

## 🎯 解决方案

### 立即需要做的事

访问工作流: https://udify.app/workflow/gBlbo69soxLoTRSO

**步骤1**: 编辑工作流
- 点击工作流画布上的"保存问题列表"节点

**步骤2**: 修改 questions 变量映射
```
当前配置:
[
  - extract_skills
  - structured_output
]

修改为:
[
  - extract_skills
  - structured_output
  - questions
]
```

详细操作:
1. 在"保存问题列表"节点中找到"variables"部分
2. 找到名称为 `questions` 的变量
3. 点击变量选择器
4. 依次选择:
   - 第1步: `extract_skills` 节点
   - 第2步: `structured_output` 字段
   - 第3步: `questions` 字段
5. 确认类型为 `array`

**步骤3**: 保存并发布
- 点击"保存"按钮
- 点击"发布"或"更新"按钮

---

## ✅ 验证修复

修复后，再次运行测试：

```bash
node test-workflow1-simple.js
```

**预期结果**:
```json
{
  "session_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "questions": "[{\"id\":\"xxx-q1\",\"question\":\"...\",\"hasAnswer\":false,\"answer\":null}, ...]",
  "job_title": "教师",
  "question_count": 5
}
```

---

## 📋 工作流配置检查清单

在 Dify 中验证以下配置:

### "保存问题列表"节点检查

- [ ] **questions 变量**
  - 值选择器路径: `extract_skills → structured_output → questions`
  - 数据类型: `array`
  - 变量名: `questions`

- [ ] **job_title 变量**
  - 值选择器路径: `start → job_title`
  - 数据类型: `string`
  - 变量名: `job_title`

### Python 代码检查

```python
def main(questions: list, job_title: str) -> dict:
    # questions 应该是一个列表，包含问题字符串
    for idx, question in enumerate(questions):
        # 这个循环应该能正常执行
        ...
```

- [ ] `questions` 参数类型为 `list`
- [ ] `job_title` 参数类型为 `string`
- [ ] 代码中没有其他问题

---

## 🔄 其他可能的原因（按优先级）

如果修改变量映射后仍未解决：

### 优先级1: Google 搜索未返回结果
- [ ] 检查搜索查询是否正确
- [ ] 验证 Google 搜索工具是否启用
- [ ] 尝试手动搜索看是否有结果

### 优先级2: LLM 模型配置问题
- [ ] 验证 Gemini API 密钥是否有效
- [ ] 检查 LLM 模型是否正确设置为 Gemini
- [ ] 查看 LLM 节点的结构化输出配置

### 优先级3: 提示词问题
- [ ] 检查提示词是否正确
- [ ] 验证模板变量是否正确替换
- [ ] 查看 LLM 是否收到了搜索结果

---

## 📊 数据流分析

### 预期的数据流

```
用户输入: "教师"
    ↓
Google 搜索: 搜索 "教师 面试问题,岗位要求..." → 返回搜索结果
    ↓
LLM (Gemini):
  输入: 搜索结果 + 提示词
  处理: 生成5个问题
  输出: structured_output { questions: ["问题1", "问题2", ...] }
    ↓
Python 代码:
  输入:
    - questions: ["问题1", "问题2", ...] (从 structured_output.questions 获取)
    - job_title: "教师" (从 start.job_title 获取)
  处理: 为每个问题分配 ID，构建会话数据，保存到存储服务
  输出:
    - session_id: UUID
    - questions_json: JSON 字符串
    - job_title: "教师"
    - question_count: 5
    ↓
返回结果给用户
```

### 当前的问题数据流

```
用户输入: "教师" ✓
    ↓
Google 搜索: ? (需要验证)
    ↓
LLM (Gemini): ? (需要验证)
    ↓
Python 代码:
  输入:
    - questions: 整个 structured_output 对象 ❌ (应该只是数组)
    - job_title: "教师" ✓
  处理: 无法遍历 questions，异常处理返回空值
  输出: session_id: "", questions: "[]"
```

---

## 🎯 关键修复项

### 必须修复
- [ ] **工作流 UI 中的变量映射** - questions 变量必须指向 `extract_skills → structured_output → questions`

### 应该验证
- [ ] Google 搜索是否有结果
- [ ] LLM 模型是否正确配置
- [ ] 存储服务是否可达

### 可选优化
- [ ] 添加错误日志
- [ ] 增加超时配置
- [ ] 添加重试机制

---

## 📝 修复清单

在 Dify 中完成以下操作:

1. [ ] 打开工作流: https://udify.app/workflow/gBlbo69soxLoTRSO
2. [ ] 进入编辑模式
3. [ ] 打开"保存问题列表"节点
4. [ ] 找到 questions 变量的值选择器
5. [ ] 修改路径为: `extract_skills → structured_output → questions`
6. [ ] 确认类型为 `array`
7. [ ] 保存工作流
8. [ ] 发布工作流
9. [ ] 等待5秒钟让工作流重新加载
10. [ ] 运行测试: `node test-workflow1-simple.js`

---

## 💡 预期修复后的结果

修复完成后，应该能看到：

✅ session_id: 有效的 UUID (不为空)
✅ questions: 包含5个问题的 JSON 数组
✅ job_title: 输入的职位名称
✅ question_count: 5

---

**状态**: 🔴 等待在 Dify 中进行变量映射修复

**优先级**: 🔴 高 - 这是阻塞问题

**下一步**: 按照上述步骤在 Dify 工作流界面修改变量映射配置
