# Dify 工作流修复快速指南

## 问题总结

测试发现工作流可以调用成功，但有两个需要修复的问题：

1. **工作流1的变量映射错误** - 导致 session_id 为空，questions 数据不正确
2. **存储服务离线** - ngrok 端点已过期

## 🚀 快速修复步骤

### 步骤1: 修复工作流1的变量映射（必须）

1. **登录 Dify**
   - 访问: https://dify.ai
   - 使用你的账号登录

2. **打开工作流1**
   - 访问: https://udify.app/workflow/ZJIwyB7UMouf2H9V
   - 或在工作流列表中找到 "AI面试官-工作流1-生成问题"

3. **编辑 `保存问题列表` 代码节点**
   - 在工作流画布中找到 "保存问题列表" 节点
   - 点击该节点打开配置面板
   - 找到 "变量" 或 "输入变量" 部分

4. **修改变量映射**

   **questions 变量**:
   ```
   当前: extract_skills / structured_output
   修改为: extract_skills / structured_output / questions
   ```

   **job_title 变量**:
   ```
   当前: extract_skills / text
   修改为: start / job_title
   ```

5. **保存并发布**
   - 点击 "保存" 按钮
   - 点击 "发布" 按钮使修改生效

### 步骤2: 配置工作流2和3的环境变量（必须）

工作流2和3的代码中使用了 `BASE_URL` 和 `API_KEY`，需要在 Dify 中配置这些环境变量。

#### 方法A: 使用环境变量（推荐）

1. **打开工作流2**
   - 访问: https://udify.app/workflow/rBRtFrkEqD9QuvcW

2. **配置环境变量**
   - 在工作流设置中找到 "环境变量" 部分
   - 添加以下变量:
     - 变量名: `BASE_URL`
     - 值: `https://your-ngrok-url.ngrok-free.dev`（见步骤3）
     - 变量名: `API_KEY`
     - 值: `ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`

3. **对工作流3重复相同操作**
   - 访问: https://udify.app/workflow/6BP4LRMhhWAJErur
   - 添加相同的环境变量

#### 方法B: 硬编码到代码节点（临时方案）

如果 Dify 不支持环境变量，可以直接在代码中硬编码：

**工作流2 - 修改两个代码节点**:

1. "加载问题信息" 节点 - 在代码开头添加:
```python
BASE_URL = "https://your-ngrok-url.ngrok-free.dev"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
```

2. "保存标准答案" 节点 - 在代码开头添加相同的两行

**工作流3 - 修改一个代码节点**:

"加载标准答案" 节点 - 在代码开头添加:
```python
BASE_URL = "https://your-ngrok-url.ngrok-free.dev"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
```

### 步骤3: 启动存储服务（必须）

#### 选项A: 使用 Docker Compose（推荐）

```bash
cd D:\code7\interview-system\storage-service
docker-compose up -d
```

#### 选项B: 本地运行

```bash
cd D:\code7\interview-system\storage-service
mvn spring-boot:run
```

#### 启动 ngrok（如需公网访问）

```bash
ngrok http 8080
```

ngrok 会显示一个公网 URL，例如:
```
Forwarding https://abc123.ngrok-free.dev -> http://localhost:8080
```

将这个 URL（`https://abc123.ngrok-free.dev`）更新到：
1. 工作流1的代码节点第251行
2. 工作流2和3的环境变量 `BASE_URL`

### 步骤4: 测试验证

```bash
cd D:\code7\interview-system
node test-dify-workflows.js
```

## ✅ 修复验证清单

- [ ] 工作流1的 `save_questions` 节点变量已修改
  - [ ] questions: `extract_skills / structured_output / questions`
  - [ ] job_title: `start / job_title`
- [ ] 工作流2的环境变量已配置或代码已修改
  - [ ] BASE_URL 已设置
  - [ ] API_KEY 已设置
- [ ] 工作流3的环境变量已配置或代码已修改
  - [ ] BASE_URL 已设置
  - [ ] API_KEY 已设置
- [ ] 存储服务已启动
  - [ ] 服务在端口8080运行
  - [ ] ngrok 已启动（如需要）
  - [ ] ngrok URL 已更新到工作流配置
- [ ] 测试脚本运行成功
  - [ ] 工作流1返回有效的 session_id
  - [ ] 工作流2成功生成答案
  - [ ] 工作流3成功评分

## 📝 预期的正确输出

### 工作流1
```json
{
  "session_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "questions": "[{\"id\":\"xxx-q1\",\"question\":\"...\",\"hasAnswer\":false,\"answer\":null}, ...]",
  "job_title": "Python后端开发工程师",
  "question_count": 5
}
```

### 工作流2
```json
{
  "session_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "question_id": "xxx-q1",
  "generated_answer": "详细的标准答案...",
  "save_status": "成功"
}
```

### 工作流3
```json
{
  "comprehensive_evaluation": "综合评价内容...",
  "overall_score": 85,
  "question": "问题文本",
  "session_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

## 🆘 故障排除

### 问题1: 工作流1仍然返回空的 session_id

**可能原因**:
- 存储服务未启动或不可访问
- 存储服务 URL 配置错误

**解决方案**:
1. 检查存储服务是否在运行: `curl http://localhost:8080/actuator/health`
2. 检查工作流1代码节点第251行的 URL 是否正确
3. 查看存储服务日志: `docker-compose logs -f` 或查看 Spring Boot 控制台

### 问题2: 工作流2/3报错 "NameError: name 'BASE_URL' is not defined"

**可能原因**:
- 环境变量未配置
- 环境变量名称拼写错误

**解决方案**:
- 使用方法B（硬编码）替代环境变量
- 或在 Dify 工作流设置中正确配置环境变量

### 问题3: ngrok 端点仍然显示离线

**可能原因**:
- ngrok 未启动
- ngrok 会话已过期

**解决方案**:
```bash
# 停止旧的 ngrok
pkill ngrok  # Linux/Mac
taskkill /F /IM ngrok.exe  # Windows

# 重新启动
ngrok http 8080

# 获取新的 URL 并更新到工作流配置
```

### 问题4: 测试脚本超时

**可能原因**:
- LLM 调用需要较长时间
- 网络连接问题

**解决方案**:
- 增加测试脚本的超时时间（已设置为120秒）
- 检查网络连接
- 检查 Dify API 密钥是否有效

## 📞 需要帮助？

如果按照以上步骤仍然无法解决问题：

1. 查看详细测试报告: `DIFY-WORKFLOW-TEST-REPORT.md`
2. 检查存储服务日志
3. 在 Dify 工作流界面查看执行日志
4. 使用 Postman 或 curl 手动测试各个 API 端点

## 🎯 成功标志

修复完成后，运行测试脚本应该看到：

```
🚀 开始Dify工作流完整测试
================================================================================
✅ 工作流1: 成功生成 5 个问题
✅ 工作流2: 成功生成标准答案
✅ 工作流3: 成功评分 XX/100
✅ 存储服务: 数据正确保存和读取
🎉 测试完成总结
```
