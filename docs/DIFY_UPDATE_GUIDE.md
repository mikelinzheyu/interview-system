# Dify工作流更新指南

## 🎯 目标
将三个Dify工作流中的存储API URL更新为新的ngrok隧道地址

## ⚙️ 配置信息

```
ngrok隧道URL: https://phrenologic-preprandial-jesica.ngrok-free.dev
存储API密钥: ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

## 📋 工作流1 - 生成问题 (Python节点: 保存问题列表)

### 位置
https://cloud.dify.ai → 选择"工作流1" → 编辑模式 → 找到"保存问题列表" Python节点

### 操作步骤
1. 打开Python节点编辑框
2. 清空现有代码
3. 复制 `dify-workflow1-code.py` 中的全部代码
4. 粘贴到Python节点
5. 保存并发布工作流

### 关键配置
```python
STORAGE_API_URL = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
```

---

## 📋 工作流2 - 生成答案 (Python节点: 保存标准答案)

### 位置
https://cloud.dify.ai → 选择"工作流2" → 编辑模式 → 找到"保存标准答案" Python节点

### 操作步骤
1. 打开Python节点编辑框
2. 清空现有代码
3. 复制 `dify-workflow2-code.py` 中的全部代码
4. 粘贴到Python节点
5. 保存并发布工作流

### 关键配置
同工作流1（使用相同的ngrok URL和API密钥）

---

## 📋 工作流3 - 评分 (Python节点: 评分)

### 位置
https://cloud.dify.ai → 选择"工作流3" → 编辑模式 → 找到"评分" Python节点

### 操作步骤
1. 打开Python节点编辑框
2. 清空现有代码
3. 复制 `dify-workflow3-code.py` 中的全部代码
4. 粘贴到Python节点
5. 保存并发布工作流

### 关键配置
同工作流1（使用相同的ngrok URL和API密钥）

---

## ✅ 验证更新

更新完成后，运行以下命令验证所有工作流都能正常工作：

```bash
node test-workflows-complete.js
```

### 预期输出
```
✅ 工作流1: 成功生成 N 个问题
✅ 工作流2: 成功生成标准答案
✅ 工作流3: 成功评分 XX/100
✅ 存储服务: 数据正确保存和读取
```

---

## 🔧 故障排除

### 问题1: SSL证书错误
**原因**: ngrok使用自签名证书

**解决**: Python代码中已包含 `verify=False` 参数

### 问题2: 存储API返回404
**原因**: ngrok隧道地址错误或隧道已断开

**检查**:
```bash
curl http://localhost:4040/api/tunnels
```

### 问题3: API密钥认证失败
**原因**: API密钥不匹配

**检查**: 确保使用的密钥是 `ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`

---

## 📞 技术细节

### 工作流1的输出格式
```json
{
  "session_id": "abc123def456-1729000000",
  "questions": "[{\"id\":\"..\",\"question\":\"...\"}]",
  "job_title": "Python后端开发工程师",
  "question_count": 5,
  "success": true
}
```

### 工作流2的输出格式
```json
{
  "save_status": "成功",
  "generated_answer": "长答案文本...",
  "success": true
}
```

### 工作流3的输出格式
```json
{
  "overall_score": 75,
  "comprehensive_evaluation": "评价文本...",
  "success": true
}
```

---

**更新时间**: 2025-10-24T00:28:05.071Z
