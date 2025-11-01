# 工作流诊断报告

**日期**: 2025-10-28
**状态**: 🔴 发现问题

---

## 诊断结果

### Workflow1 (生成问题)
- **URL**: https://api.dify.ai/v1/workflows/560EB9DDSwOFc8As/run
- **API Key**: app-WhLg4w9QxdY7vUqbWbYWBWYi
- **测试结果**: ❌ 失败 - 400 Bad Request

### Workflow2 (生成答案)
- **URL**: https://api.dify.ai/v1/workflows/5X6RBtTFMCZr0r4R/run
- **API Key**: app-TEw1j6rBUw0ZHHlTdJvJFfPB
- **测试结果**: ❌ 失败 - 400 Bad Request

---

## 问题分析

### 问题 1: API 请求 400 Bad Request

两个工作流都返回 400 错误：
```
"code": "bad_request",
"message": "The browser (or proxy) sent a request that this server could not understand."
```

**可能原因**:
1. ❓ **输入字段名称不匹配** - Workflow 期望的输入字段名与我们发送的不同
2. ❓ **API Key 无效或不适配** - 提供的 API Key 可能没有正确的权限
3. ❓ **Workflow ID 不正确** - 公开共享的 URL 和实际 API 使用的 ID 不匹配
4. ❓ **请求格式不对** - 虽然 JSON 格式看起来正确，但可能需要额外字段

---

## 修改方案

### 方案 A: 检查并修复输入字段 ⭐ 优先

**步骤 1**: 在 Dify 界面中验证输入字段

1. 打开 Workflow1: https://udify.app/workflow/560EB9DDSwOFc8As
2. 点击 "开始" 节点
3. 记录**确切的** `variable` 名称（不是 label）
4. 比对我们的输入：
   ```javascript
   inputs: {
     job_title: "Python 后端开发工程师"
   }
   ```

**预期发现**: 字段名可能是 `job_title`, `jobTitle`, 或 `job-title`

**修复**: 更新 test 脚本中的输入字段名

---

### 方案 B: 验证 API 凭据 ⭐ 紧急

**步骤 1**: 检查 API Key 是否有效

1. 登录 https://cloud.dify.ai
2. 进入应用设置 → 访问 API
3. 验证 API Key 是否与我们使用的相同
4. 检查 API Key 的权限范围

**可能问题**:
- API Key 已过期
- API Key 的权限不足
- API Key 与 Workflow ID 不匹配

**修复**:
- 重新生成 API Key
- 复制新的 API Key 到配置中

---

### 方案 C: 使用公开 URL 替代 API

如果 API 方式有问题，可以改用公开访问 URL：

**Workflow1**:
```
https://udify.app/workflow/560EB9DDSwOFc8As
```

**Workflow2**:
```
https://udify.app/workflow/5X6RBtTFMCZr0r4R
```

这些 URL 需要在浏览器中手动填充和提交，不能用于自动化测试。

---

### 方案 D: 从头重新配置工作流 ⭐ 最可靠

如果以上都不行，建议：

1. **删除现有工作流** (可选)
2. **重新创建 Workflow1**:
   - 输入: `job_title` (string)
   - 输出: `session_id`, `questions_json`, `job_title`, `questions_count`, `error`

3. **重新创建 Workflow2**:
   - 输入: `session_id`, `question_id`, `user_answer`, `job_title`
   - 输出: `standard_answer`, `error`

4. **获取新的 API Key** (会自动生成)

5. **更新配置** 使用新的 API Key 和 Workflow ID

---

## 立即检查清单

- [ ] 登录 Dify Dashboard
- [ ] 打开 Workflow1，检查 **开始** 节点的输入字段名
- [ ] 打开 Workflow2，检查 **开始** 节点的输入字段名
- [ ] 验证两个 API Key 在 "访问 API" 页面中
- [ ] 测试 API Key 是否还有效
- [ ] 检查 Workflow ID 是否正确

---

## 修复后的测试命令

一旦修复，运行:

```bash
# 基础诊断
node test-workflows-v2.js

# 详细测试
node test-workflows-diagnosis.js
```

---

## 预期的正确输出

### Workflow1 成功应该返回:
```json
{
  "data": {
    "outputs": {
      "session_id": "...",
      "questions_json": "[...]",
      "job_title": "Python 后端开发工程师",
      "questions_count": 5,
      "error": ""
    }
  }
}
```

### Workflow2 成功应该返回:
```json
{
  "data": {
    "outputs": {
      "standard_answer": "...",
      "error": ""
    }
  }
}
```

---

## 需要用户手动完成的任务

由于我无法在 Dify 界面中直接操作，需要你:

1. **验证 Workflow1 的输入字段**: 在 Dify 中打开，记录确切的字段名
2. **验证 Workflow2 的输入字段**: 同上
3. **确认 API Key 有效**: 测试一次 API 调用
4. **检查是否需要额外参数**: 某些工作流可能需要 `user` 或 `conversation_id` 等

### 你可以这样快速检查:

在 Dify 工作流页面中：
- 找到 "开始" 节点
- 查看每个输入字段的 `variable` 值（不是显示的标签名）
- 告诉我确切的字段名

然后我会相应地更新测试脚本。

---

## 优先级行动计划

### 立即 (5 分钟)
- [ ] 打开 Dify，检查 Workflow1 的输入字段名
- [ ] 打开 Dify，检查 Workflow2 的输入字段名
- [ ] 告诉我确切的字段名

### 短期 (15 分钟)
- [ ] 我会更新测试脚本
- [ ] 重新运行测试

### 中期 (如果还是失败)
- [ ] 验证 API Key 是否仍然有效
- [ ] 在 Dify 中手动测试工作流
- [ ] 比对错误日志

---

**下一步**: 请告诉我 Workflow1 和 Workflow2 的 **开始** 节点中的确切输入字段名（variable 名）。
