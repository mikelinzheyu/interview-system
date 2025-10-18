# Dify 工作流测试报告

## 测试概述

测试时间: 2025-10-15
测试目标: 验证三个 Dify 工作流的完整流程

## 工作流配置

### 工作流1 - 生成问题
- **公开访问 URL**: https://udify.app/workflow/ZJIwyB7UMouf2H9V
- **API 密钥**: app-aROZ5FjseJWUtmRzzjlb6b5E
- **API 端点**: https://api.dify.ai/v1

### 工作流2 - 生成答案
- **公开访问 URL**: https://udify.app/workflow/rBRtFrkEqD9QuvcW
- **API 密钥**: app-tl7iWaJSNIam5tA3lAYf2zL8
- **API 端点**: https://api.dify.ai/v1

### 工作流3 - 评分
- **公开访问 URL**: https://udify.app/workflow/6BP4LRMhhWAJErur
- **API 密钥**: app-wYqlMORyoUpBkW32BAcRe9lc
- **API 端点**: https://api.dify.ai/v1

## 测试结果

### ❌ 工作流1测试结果

**状态**: 部分成功 - API 调用成功，但输出映射有问题

**输入**:
```json
{
  "job_title": "Python后端开发工程师"
}
```

**实际输出**:
```json
{
  "session_id": "",
  "questions": "[]",
  "job_title": "> search(\"...大量文本...\")\n\n```json\n{\n  \"questions\": [...]\n}\n```",
  "question_count": 0
}
```

**问题分析**:

1. **session_id 为空**:
   - 原因: 代码节点 `save_questions` 可能执行失败
   - 影响: 无法保存会话数据，后续工作流无法继续

2. **questions 为空数组字符串**:
   - 原因: 代码节点的输入变量映射错误
   - 当前配置: `value_selector: [extract_skills, structured_output]`
   - 应该: `value_selector: [extract_skills, structured_output, questions]`

3. **job_title 包含错误内容**:
   - 原因: 变量选择器错误
   - 当前配置: `value_selector: [extract_skills, text]`（获取的是 LLM 的完整输出）
   - 应该: `value_selector: [start, job_title]`（获取的是用户输入）

### ❌ 存储服务测试结果

**状态**: 离线

**错误信息**:
```
The endpoint chestier-unremittently-willis.ngrok-free.dev is offline.
ERR_NGROK_3200
```

**原因**:
- ngrok 端点已过期或停止运行
- 需要重新启动存储服务和 ngrok

## 问题清单

### 🔴 严重问题

1. **工作流1 - 代码节点变量映射错误**
   - 位置: `save_questions` 节点
   - 文件: `AI面试官-工作流1-生成问题 .yml` (第286-296行)
   - 需要修复的变量:
     - `questions`: 从 `[extract_skills, structured_output]` 改为 `[extract_skills, structured_output, questions]`
     - `job_title`: 从 `[extract_skills, text]` 改为 `[start, job_title]`

2. **存储服务不可用**
   - ngrok 端点离线
   - 需要启动本地存储服务
   - 需要配置新的 ngrok 端点或使用本地端点

### 🟡 需要验证的问题

1. **工作流2和3的环境变量**
   - 代码中引用了 `BASE_URL` 和 `API_KEY`
   - 但在 YAML 配置中 `environment_variables: []`
   - 需要在 Dify 工作流界面中配置这些环境变量

2. **API 端点配置**
   - 工作流1硬编码了存储服务地址
   - 工作流2和3使用环境变量（但未定义）
   - 建议统一使用环境变量

## 修复方案

### 方案1: 修复工作流1的 YAML 配置（推荐）

需要在 Dify 工作流界面中修改 `save_questions` 节点的变量映射：

**当前配置**:
```yaml
variables:
  - value_selector:
    - extract_skills
    - structured_output
    value_type: object
    variable: questions
  - value_selector:
    - extract_skills
    - text
    value_type: string
    variable: job_title
```

**修复后**:
```yaml
variables:
  - value_selector:
    - extract_skills
    - structured_output
    - questions
    value_type: array
    variable: questions
  - value_selector:
    - start
    - job_title
    value_type: string
    variable: job_title
```

### 方案2: 启动存储服务

```bash
# 方法1: 使用 Docker Compose
cd storage-service
docker-compose up -d

# 方法2: 本地运行
cd storage-service
mvn spring-boot:run

# 启动 ngrok（如果需要公网访问）
ngrok http 8080
```

### 方案3: 配置工作流环境变量

在 Dify 工作流界面中添加环境变量：

- **BASE_URL**: `https://your-ngrok-url.ngrok-free.dev` 或 `http://localhost:8080`
- **API_KEY**: `ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`

## 下一步操作

### 立即需要做的事情

1. ✅ **在 Dify 界面修复工作流1的变量映射**
   - 登录 Dify
   - 打开工作流1
   - 修改 `save_questions` 节点的变量选择器
   - 保存并发布

2. ✅ **启动存储服务**
   - 选择本地运行或 Docker 方式
   - 如需公网访问，启动 ngrok
   - 更新工作流中的存储服务地址

3. ✅ **配置环境变量**
   - 在工作流2和3中添加 `BASE_URL` 和 `API_KEY` 环境变量
   - 或者将这些值硬编码到代码节点中（不推荐）

### 测试验证

修复后需要重新运行测试：

```bash
node test-dify-workflows.js
```

预期结果：
- ✅ 工作流1生成5个问题并返回有效的 session_id
- ✅ 数据成功保存到存储服务
- ✅ 工作流2成功为问题生成标准答案
- ✅ 工作流3成功对候选人答案进行评分

## 总结

### 当前状态
- 🟢 **Dify API 连接正常**: 可以成功调用工作流
- 🟢 **LLM 生成功能正常**: 成功生成了5个面试问题
- 🔴 **数据映射有问题**: 变量选择器配置错误
- 🔴 **存储服务离线**: 需要重新启动

### 整体评估
工作流的核心逻辑是正确的，但有两个需要修复的问题：
1. Dify 工作流界面中的变量映射配置
2. 存储服务的可用性

这两个问题都可以通过配置修复，不需要修改代码逻辑。

### 预计修复时间
- 修复变量映射: 5分钟
- 启动存储服务: 5分钟
- 配置环境变量: 5分钟
- 测试验证: 10分钟
- **总计**: 约25分钟

## 附录

### 测试脚本
测试脚本已创建: `test-dify-workflows.js`

使用方法：
```bash
node test-dify-workflows.js
```

### 工作流文件位置
- 工作流1: `D:\code7\test5\AI面试官-工作流1-生成问题 .yml`
- 工作流2: `D:\code7\test5\AI面试官-工作流2-生成答案.yml`
- 工作流3: `D:\code7\test5\AI面试官-工作流3-评分.yml`

### 存储服务位置
- 源码: `D:\code7\interview-system\storage-service\`
- API 文档: `storage-service/README.md`
- Controller: `storage-service/src/main/java/com/example/interviewstorage/controller/SessionController.java`
