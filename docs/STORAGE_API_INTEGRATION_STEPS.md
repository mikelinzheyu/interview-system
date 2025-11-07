# 存储API集成 - 完整步骤指南

## 📋 概述

您的外部存储系统已在项目中实现，现在需要更新Dify工作流配置以连接到您的本地存储API。

## 🔍 您的存储API信息

```
服务名称: interview-storage-api
Docker镜像: production-storage-api:latest
端口映射: 8090:8080

基础URL: http://localhost:8090
API路径: /api/sessions
```

## ✅ 第一步: 验证存储服务正在运行

### 1.1 启动存储服务

```bash
# 进入存储服务目录
cd D:\code7\interview-system\storage-service

# 使用Docker Compose启动
docker-compose up -d

# 验证服务是否运行
docker-compose ps
```

### 1.2 测试API连接

运行测试脚本来验证API是否正常工作：

```bash
cd D:\code7\interview-system
node test-storage-api.js
```

**预期输出:**
```
✅ 服务器连接成功！ (HTTP 200/201)
✅ 会话创建成功！
✅ 会话获取成功！
✅ 会话更新成功！
✅ 答案验证成功！

📊 测试总结
通过: 5/5 (100%)
✅ 太棒了！存储API完全正常！
```

## 🔧 第二步: 更新Dify工作流配置

### 2.1 了解需要更新的内容

您需要在三个Dify工作流中更新Python代码节点：

| 工作流 | 节点名称 | 操作 |
|--------|---------|------|
| 工作流1 | 保存问题列表 | 更新POST保存逻辑 |
| 工作流2 | 加载问题信息 | 更新GET查询逻辑 |
| 工作流2 | 保存标准答案 | 更新POST更新逻辑 |
| 工作流3 | 加载标准答案 | 更新GET查询逻辑 |

### 2.2 访问Dify工作流

对于每个工作流，访问编辑页面：

**工作流1 - 生成问题**
- URL: https://cloud.dify.ai/app/55a6e3e9-ead2-43c9-af1b-6b0d6a3643f1/workflow

**工作流2 - 生成答案**
- 在Dify控制台找到工作流ID: `5X6RBtTFMCZr0r4R`

**工作流3 - 评分**
- 在Dify控制台找到工作流ID: `7C4guOpDk2GfmIFy`

### 2.3 更新Python代码

详细的Python代码已在 `DIFY_STORAGE_API_UPDATE.md` 中提供。

**对于每个节点:**

1. 点击节点进入编辑模式
2. 选中现有的Python代码全部删除
3. 复制 `DIFY_STORAGE_API_UPDATE.md` 中对应节点的代码
4. 粘贴到节点中
5. 点击"保存"
6. 测试节点是否正常工作

### 2.4 关键更改总结

**工作流1 - 保存问题列表节点:**
```python
# 旧URL (ngrok隧道)
api_url = "https://chestier-unremittently-willis.ngrok-free.dev/api/sessions"

# 新URL (本地存储)
api_url = "http://localhost:8090/api/sessions"

# HTTP方法: POST
# 认证: 不需要（本地）
```

**工作流2 - 加载问题信息节点:**
```python
# 旧URL (ngrok隧道)
api_url = f"https://chestier-unremittently-willis.ngrok-free.dev/api/sessions/{session_id}"

# 新URL (本地存储)
api_url = f"http://localhost:8090/api/sessions/{session_id}"

# HTTP方法: GET
```

**工作流2 - 保存标准答案节点:**
```python
# 改为GET-修改-POST的模式
# 1. 获取完整session数据
# 2. 找到要更新的问题并修改答案
# 3. 重新POST整个session数据
```

**工作流3 - 加载标准答案节点:**
```python
# 新URL (本地存储)
api_url = f"http://localhost:8090/api/sessions/{session_id}"

# HTTP方法: GET
# 从questions数组中查找对应的question_id
```

## 🧪 第三步: 测试工作流

### 3.1 手动测试每个工作流

在Dify界面中测试每个工作流：

**工作流1测试:**
```
输入: job_title = "Java后端开发工程师"
预期输出:
- session_id: (UUID格式)
- questions: (JSON数组，5个问题)
- question_count: 5
- job_title: "Java后端开发工程师"
```

**工作流2测试:**
```
输入:
- session_id: (从工作流1获取)
- question_id: (例如: xxx-q1)

预期输出:
- generated_answer: (标准答案文本)
- save_status: "成功"
```

**工作流3测试:**
```
输入:
- session_id: (从工作流1获取)
- question_id: (例如: xxx-q1)
- candidate_answer: "用户的回答..."

预期输出:
- overall_score: (0-100的数字)
- comprehensive_evaluation: (评价文本)
```

### 3.2 运行完整的自动化测试

```bash
cd D:\code7\interview-system
node test-workflows-complete.js
```

这个脚本将自动测试所有三个工作流的完整流程。

**预期输出:**
```
✅ 工作流1: 成功生成 5 个问题
✅ 工作流2: 成功生成标准答案
✅ 工作流3: 成功评分 XX/100
✅ 存储服务: 数据正确保存和读取
```

## 🔐 第四步: 验证数据持久化

### 4.1 在Redis中验证数据

```bash
# 进入Redis容器
docker-compose -f D:\code7\interview-system\storage-service\docker-compose.yml exec redis redis-cli

# 查看所有session键
KEYS "interview:session:*"

# 获取特定session的数据
GET "interview:session:xxx-xxx-xxx"

# 查看数据过期时间
TTL "interview:session:xxx-xxx-xxx"
```

### 4.2 通过API验证数据

```bash
# 使用curl测试GET请求
curl http://localhost:8090/api/sessions/xxx-xxx-xxx

# 应该返回完整的session数据，包括questions和答案
```

## 🐛 故障排除

### 问题1: HTTP 405 Method Not Allowed

**原因**: 发送了不支持的HTTP方法

**解决方案**:
- 检查您的代码是否使用了正确的HTTP方法
- 工作流1: 必须使用 **POST**
- 工作流2/3: 必须使用 **GET** 获取，**POST** 保存
- 查看 `DIFY_STORAGE_API_UPDATE.md` 中的正确代码

### 问题2: Connection Refused

**原因**: 存储服务未运行

**解决方案**:
```bash
# 启动服务
docker-compose -f D:\code7\interview-system\storage-service\docker-compose.yml up -d

# 验证服务
docker-compose -f D:\code7\interview-system\storage-service\docker-compose.yml ps

# 查看日志
docker-compose -f D:\code7\interview-system\storage-service\docker-compose.yml logs -f
```

### 问题3: JSON Parse Error

**原因**: 返回的数据格式不正确

**解决方案**:
- 检查API返回的JSON格式
- 验证 `SessionData` 和 `QuestionData` 模型
- 运行 `test-storage-api.js` 查看实际响应格式

### 问题4: Session Not Found (404)

**原因**: session_id不存在或格式错误

**解决方案**:
- 确保session_id是从工作流1返回的有效UUID
- 检查数据是否正确保存
- 运行 `test-storage-api.js` 创建测试数据

### 问题5: Answer Not Saved

**原因**: 工作流2使用了GET-修改-POST的模式

**解决方案**:
- 这是正确的实现（因为您的API没有单独的UPDATE端点）
- 代码已处理此问题，会获取完整session、修改问题的答案、然后重新POST
- 如果答案仍未保存，检查Redis是否正常运行

## 📊 数据流验证

### 完整的数据流:

```
用户输入职位名称
    ↓
工作流1调用API: POST /api/sessions
    ↓
存储服务保存到Redis (TTL: 7天)
    ↓
返回session_id和questions列表
    ↓
工作流2调用API: GET /api/sessions/{sessionId}
    ↓
修改questions数组中的答案
    ↓
工作流2调用API: POST /api/sessions (更新整个session)
    ↓
存储服务更新Redis数据
    ↓
工作流3调用API: GET /api/sessions/{sessionId}
    ↓
获取标准答案，进行评分
    ↓
返回评分结果
```

## ✨ 更新检查清单

完成以下所有步骤:

- [ ] **第一步: 验证存储服务**
  - [ ] Docker Compose启动成功
  - [ ] `docker-compose ps` 显示所有容器运行中
  - [ ] `test-storage-api.js` 所有测试通过

- [ ] **第二步: 更新Dify工作流**
  - [ ] 工作流1的"保存问题列表"节点已更新
  - [ ] 工作流2的"加载问题信息"节点已更新
  - [ ] 工作流2的"保存标准答案"节点已更新
  - [ ] 工作流3的"加载标准答案"节点已更新
  - [ ] 所有工作流已保存并发布

- [ ] **第三步: 测试工作流**
  - [ ] 在Dify界面中手动测试每个工作流
  - [ ] 运行 `test-workflows-complete.js` 全部通过
  - [ ] 没有404或405错误

- [ ] **第四步: 验证数据**
  - [ ] Redis中有session数据
  - [ ] API GET请求返回正确数据
  - [ ] 答案已正确保存
  - [ ] 评分正常工作

## 🎯 后续步骤

完成以上所有步骤后：

1. **集成到项目后端**
   - 创建 `difyService.js` 服务
   - 添加API路由
   - 实现错误处理

2. **前端集成**
   - 在Vue组件中调用API
   - 添加加载状态和错误提示
   - 显示评分结果

3. **部署**
   - 测试完整的用户流程
   - 进行性能测试
   - 部署到生产环境

## 📞 需要帮助?

- **API文档**: 查看 `DIFY_STORAGE_API_UPDATE.md`
- **测试脚本**: 运行 `test-storage-api.js` 和 `test-workflows-complete.js`
- **存储服务日志**: `docker-compose logs -f`
- **Dify工作流日志**: 在Dify控制台查看工作流执行日志

---

**祝您集成顺利！🚀**
