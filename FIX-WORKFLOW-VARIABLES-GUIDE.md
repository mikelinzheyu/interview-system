# 🔧 工作流1 变量映射修复指南 (CRITICAL)

## 📋 问题诊断

**当前状态:**
- ✅ job_title: 正确返回 "Python后端开发工程师"
- ❌ questions: 返回 "[]" (空数组)
- ❌ session_id: 返回 "" (空字符串)
- ❌ question_count: 返回 0

**根本原因:**
在 Dify 工作流的"保存问题列表"节点中，`questions` 变量的映射错误。
- **当前(错误):** 映射到整个 `structured_output` 对象
- **应该(正确):** 映射到 `structured_output.questions` 数组

---

## ✅ 正确的变量映射配置

根据 YAML 文件验证，正确的配置应该是：

### 节点：保存问题列表 (save_questions)

#### 输入变量 - questions

```
value_selector: [extract_skills, structured_output, questions]
value_type: array
variable: questions
```

**这意味着:**
1. 从 `extract_skills` 节点
2. 选择 `structured_output` 对象
3. 再选择其中的 `questions` 字段
4. 该字段的类型是 `array`

---

## 🎯 实时修复步骤 (在 Dify 界面中)

### 步骤 1: 打开工作流
访问: **https://udify.app/workflow/sNkeofwLHukS3sC2**

### 步骤 2: 进入编辑模式
1. 点击右上角的 **"编辑"** 按钮
2. 界面会切换到可编辑状态

### 步骤 3: 找到"保存问题列表"节点
1. 在工作流画布上找到 "保存问题列表" (save_questions) 节点
2. 双击或点击该节点打开配置面板

### 步骤 4: 修复 questions 变量

**在左侧的"输入变量"面板中:**

1. 找到 `questions` 行
2. 点击该行右侧的变量选择器 (目前显示的应该是某个选择)
3. **打开变量选择器菜单**

**在变量选择器中:**

1. 第一级: 选择 **extract_skills** (LLM 节点)
2. 第二级: 选择 **structured_output** (LLM 的结构化输出)
3. 第三级: 选择 **questions** (structured_output 中的字段)
4. 确认类型是 **Array**

**期望看到:**
- 变量路径显示为: `extract_skills → structured_output → questions`
- 类型显示为: `Array`

### 步骤 5: 保存并发布

1. 点击左下角 **"保存"** 按钮
2. 等待保存完成
3. 点击 **"发布"** 按钮
4. 确认发布成功

---

## 🧪 验证修复

修改后，运行测试:

```bash
cd D:\code7\interview-system
node test-workflow1-simple.js
```

**预期输出:**
```json
{
  "session_id": "uuid-string-here",
  "questions": "[{\"id\": \"...\", \"question\": \"...\"}]",
  "job_title": "Python后端开发工程师",
  "question_count": 5
}
```

---

## 🚨 常见问题

### 问题 1: 变量选择器中找不到 structured_output
**解决:**
- 确保已经点击了 `extract_skills` 节点
- 如果没有 `structured_output`，点击"选择字段"或展开选项

### 问题 2: questions 字段显示为 String 而非 Array
**解决:**
- 确保选择到了 `questions` 字段
- 检查是否选择正确的层级
- 可能需要刷新页面重试

### 问题 3: 修复后仍然返回 []
**解决:**
- 确保点击了"发布"按钮
- 等待 30 秒后重新测试
- 检查浏览器是否真的保存成功（看右上角的提示）

### 问题 4: 出现 503 Service Unavailable
**原因:** 存储服务不可达
**解决:**
- 确保存储服务正在运行: `node mock-storage-service.js`
- 检查存储服务是否监听在 localhost:8080
- 在 Dify 中的 Python 代码中可能需要使用公网 URL（使用 ngrok）

---

## 📊 YAML 验证

已验证 YAML 文件配置正确，关键部分 (第 267-271 行):

```yaml
- value_selector:
  - extract_skills
  - structured_output
  - questions
  value_type: array
  variable: questions
```

这说明**导入时配置应该是正确的**，但在 Dify 界面中**没有被正确应用**。

---

## ⏱️ 预计时间

- 打开工作流并进入编辑模式: 1 分钟
- 找到节点并修复变量: 2 分钟
- 保存并发布: 1 分钟
- 测试验证: 1 分钟

**总计: 5 分钟**

---

## 📞 技术支持

如果按照以上步骤操作后仍然失败，请检查:

1. ✅ Dify 工作流 ID 是否正确: `sNkeofwLHukS3sC2`
2. ✅ 变量选择器的三个层级是否都选择正确
3. ✅ 是否点击了"发布"按钮
4. ✅ 存储服务是否正在运行
5. ✅ 是否收到存储服务的响应 (查看测试输出)

