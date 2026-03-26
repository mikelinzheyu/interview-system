# 错题复盘系统 - 完整测试指南

## 测试概览

本文档提供了错题复盘系统（Phase 1 & 2）的完整测试指南，包括：
- 后端API测试
- 前端功能测试
- 集成测试
- 用户流程测试

---

## Part 1: 环境准备

### 1.1 启动后端服务

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动后端服务（开发模式）
npm start
# 或使用 nodemon
npm run dev
```

**预期结果**: 后端服务在 `http://localhost:3001` 或 `http://localhost:8080` 启动

### 1.2 启动前端服务

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动前端开发服务器
npm run dev
```

**预期结果**: 前端服务在 `http://localhost:5173` 或 `http://localhost:3000` 启动

### 1.3 数据库准备

确保数据库已初始化：
```bash
# 后端会自动创建表（通过Sequelize）
# 如果需要手动初始化，运行：
cd backend
npm run db:migrate
```

---

## Part 2: 后端API测试

### 2.1 测试 POST /api/interview/save-report

**目的**: 验证面试报告保存功能

**请求**:
```bash
curl -X POST http://localhost:8080/api/interview/save-report \
  -H "Authorization: Bearer 1" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "jobTitle": "前端工程师",
    "difficulty": "中级",
    "duration": 1200,
    "answers": [
      {
        "questionId": "q_1",
        "question": "什么是React Hooks?",
        "answer": "React Hooks是一种在函数组件中使用状态和其他React特性的方式",
        "score": 85
      },
      {
        "questionId": "q_2",
        "question": "解释useEffect的依赖数组",
        "answer": "依赖数组用于控制effect何时运行",
        "score": 60
      }
    ],
    "overallScore": 78,
    "technicalScore": 80,
    "communicationScore": 75,
    "logicalScore": 78,
    "summary": "本次面试表现良好",
    "suggestions": ["深入学习React Hooks"]
  }'
```

**预期响应**:
```json
{
  "code": 201,
  "message": "面试报告已保存",
  "data": {
    "recordId": "uuid-string",
    "record": {
      "id": "uuid-string",
      "userId": 1,
      "jobTitle": "前端工程师",
      ...
    }
  }
}
```

**验证点**:
- ✓ HTTP状态码为201
- ✓ 返回recordId
- ✓ 数据库中创建了InterviewRecord记录
- ✓ 为score < 100的答题创建了WrongAnswerReview记录

---

### 2.2 测试 GET /api/interview/wrong-answers

**目的**: 验证错题列表查询功能

**请求**:
```bash
curl -X GET "http://localhost:8080/api/interview/wrong-answers?recordId=<RECORD_ID>" \
  -H "Authorization: Bearer 1"
```

**预期响应**:
```json
{
  "code": 200,
  "message": "错题复盘列表获取成功",
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": 1,
        "recordId": "uuid",
        "question": "解释useEffect的依赖数组",
        "originalAnswer": "依赖数组用于控制effect何时运行",
        "originalScore": 60,
        "masterLevel": 0,
        "reviewCount": 0,
        "retryAnswers": [],
        "learningNotes": "",
        "lastReviewAt": null
      }
    ],
    "total": 1
  }
}
```

**验证点**:
- ✓ 只返回score < 100的答题
- ✓ 返回正确的错题数量
- ✓ 包含所有必要字段

---

### 2.3 测试 GET /api/interview/wrong-answers/:id

**目的**: 验证错题详情查询功能

**请求**:
```bash
curl -X GET "http://localhost:8080/api/interview/wrong-answers/<WRONG_ANSWER_ID>" \
  -H "Authorization: Bearer 1"
```

**预期响应**:
```json
{
  "code": 200,
  "message": "错题复盘详情获取成功",
  "data": {
    "id": "uuid",
    "userId": 1,
    "recordId": "uuid",
    "question": "解释useEffect的依赖数组",
    "originalAnswer": "依赖数组用于控制effect何时运行",
    "originalScore": 60,
    "masterLevel": 0,
    "reviewCount": 0,
    "retryAnswers": [],
    "learningNotes": "",
    "lastReviewAt": null
  }
}
```

**验证点**:
- ✓ 返回正确的错题详情
- ✓ 包含完整的重试历史

---

### 2.4 测试 POST /api/interview/wrong-answers/:id/retry

**目的**: 验证重试答案提交功能

**请求**:
```bash
curl -X POST "http://localhost:8080/api/interview/wrong-answers/<WRONG_ANSWER_ID>/retry" \
  -H "Authorization: Bearer 1" \
  -H "Content-Type: application/json" \
  -d '{
    "userAnswer": "依赖数组是一个数组，包含effect依赖的所有值。当依赖数组中的任何值改变时，effect会重新运行。",
    "notes": "这次答案更加详细"
  }'
```

**预期响应**:
```json
{
  "code": 200,
  "message": "重试答案已提交",
  "data": {
    "id": "uuid",
    "reviewCount": 1,
    "retryAnswers": [
      {
        "attempt": 1,
        "userAnswer": "依赖数组是一个数组...",
        "notes": "这次答案更加详细",
        "timestamp": "2026-03-26T..."
      }
    ]
  }
}
```

**验证点**:
- ✓ reviewCount增加
- ✓ retryAnswers数组中添加新记录
- ✓ 包含attempt编号和timestamp

---

### 2.5 测试 PUT /api/interview/wrong-answers/:id/notes

**目的**: 验证学习笔记更新功能

**请求**:
```bash
curl -X PUT "http://localhost:8080/api/interview/wrong-answers/<WRONG_ANSWER_ID>/notes" \
  -H "Authorization: Bearer 1" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "需要深入理解React Hooks的工作原理，特别是useEffect的依赖数组机制。"
  }'
```

**预期响应**:
```json
{
  "code": 200,
  "message": "学习笔记已更新",
  "data": {
    "id": "uuid",
    "learningNotes": "需要深入理解React Hooks的工作原理..."
  }
}
```

**验证点**:
- ✓ learningNotes字段更新
- ✓ updatedAt时间戳更新

---

### 2.6 测试 PATCH /api/interview/wrong-answers/:id/mastery

**目的**: 验证掌握度更新功能

**请求**:
```bash
curl -X PATCH "http://localhost:8080/api/interview/wrong-answers/<WRONG_ANSWER_ID>/mastery" \
  -H "Authorization: Bearer 1" \
  -H "Content-Type: application/json" \
  -d '{
    "masterLevel": 75
  }'
```

**预期响应**:
```json
{
  "code": 200,
  "message": "掌握度已更新",
  "data": {
    "id": "uuid",
    "masterLevel": 75
  }
}
```

**验证点**:
- ✓ masterLevel在0-100范围内
- ✓ 值正确保存到数据库

---

### 2.7 测试 GET /api/interview/records

**目的**: 验证面试记录列表查询功能

**请求**:
```bash
curl -X GET "http://localhost:8080/api/interview/records?limit=20&offset=0" \
  -H "Authorization: Bearer 1"
```

**预期响应**:
```json
{
  "code": 200,
  "message": "面试记录列表获取成功",
  "data": {
    "items": [...],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

**验证点**:
- ✓ 返回分页数据
- ✓ 按createdAt降序排列

---

### 2.8 测试 GET /api/interview/records/:id

**目的**: 验证单个面试记录查询功能

**请求**:
```bash
curl -X GET "http://localhost:8080/api/interview/records/<RECORD_ID>" \
  -H "Authorization: Bearer 1"
```

**预期响应**:
```json
{
  "code": 200,
  "message": "面试记录详情获取成功",
  "data": {
    "id": "uuid",
    "userId": 1,
    "jobTitle": "前端工程师",
    "difficulty": "中级",
    "duration": 1200,
    "answers": [...],
    "overallScore": 78,
    "technicalScore": 80,
    "communicationScore": 75,
    "logicalScore": 78,
    "summary": "本次面试表现良好",
    "suggestions": ["深入学习React Hooks"]
  }
}
```

**验证点**:
- ✓ 返回完整的面试记录
- ✓ 包含所有评分和建议

---

## Part 3: 前端功能测试

### 3.1 测试面试报告自动保存

**步骤**:
1. 完成一次模拟面试
2. 进入 `/interview/report-v2` 页面
3. 打开浏览器开发者工具 (F12)
4. 查看 Network 标签

**预期结果**:
- ✓ 页面加载时自动调用 `POST /api/interview/save-report`
- ✓ 响应状态为201
- ✓ recordId保存到sessionStorage
- ✓ 控制台显示 `[InterviewReportV2] ✅ 报告已保存，recordId = ...`

**验证代码**:
```javascript
// 在浏览器控制台运行
console.log('recordId:', sessionStorage.getItem('interview_record_id'))
```

---

### 3.2 测试"错题复盘"按钮

**步骤**:
1. 在报告页面找到"错题复盘"按钮
2. 点击按钮

**预期结果**:
- ✓ 导航到 `/interview/replay?recordId=<RECORD_ID>`
- ✓ 页面加载错题列表

---

### 3.3 测试InterviewReplayView页面

**步骤**:
1. 访问 `/interview/replay?recordId=<RECORD_ID>`
2. 等待页面加载

**预期结果**:
- ✓ 显示错题复盘标题和统计信息
- ✓ 显示错题列表
- ✓ 每个错题卡片可展开/收起

---

### 3.4 测试参考模式

**步骤**:
1. 展开一个错题卡片
2. 确保在"参考模式"标签页
3. 查看原始答案和得分

**预期结果**:
- ✓ 显示原始答案
- ✓ 显示原始得分
- ✓ 显示学习笔记（如果有）
- ✓ 显示重试历史（如果有）

---

### 3.5 测试编辑学习笔记

**步骤**:
1. 在参考模式下，点击"编辑笔记"按钮
2. 输入笔记内容
3. 点击"保存"

**预期结果**:
- ✓ 调用 `PUT /api/interview/wrong-answers/:id/notes`
- ✓ 笔记保存成功
- ✓ 页面显示更新后的笔记

---

### 3.6 测试练习模式

**步骤**:
1. 展开一个错题卡片
2. 切换到"练习模式"标签页
3. 输入新答案
4. 点击"提交答案"

**预期结果**:
- ✓ 调用 `POST /api/interview/wrong-answers/:id/retry`
- ✓ 答案提交成功
- ✓ 显示成功提示
- ✓ 重试历史更新

---

### 3.7 测试掌握度调整

**步骤**:
1. 在练习模式下，调整掌握度滑块
2. 点击"更新掌握度"

**预期结果**:
- ✓ 调用 `PATCH /api/interview/wrong-answers/:id/mastery`
- ✓ 掌握度更新成功
- ✓ 卡片上的掌握度徽章更新

---

## Part 4: 集成测试

### 4.1 完整用户流程测试

**场景**: 用户完成面试 → 查看报告 → 进行错题复盘

**步骤**:
1. 启动前端和后端
2. 完成一次模拟面试
3. 查看面试报告
4. 点击"错题复盘"
5. 在参考模式查看错题
6. 切换到练习模式提交重试答案
7. 编辑学习笔记
8. 调整掌握度

**验证点**:
- ✓ 所有API调用成功
- ✓ 数据正确保存到数据库
- ✓ 前端UI正确更新
- ✓ 没有控制台错误

---

### 4.2 数据一致性测试

**步骤**:
1. 完成上述完整流程
2. 刷新页面
3. 重新进入错题复盘页面

**预期结果**:
- ✓ 所有数据正确加载
- ✓ 学习笔记、掌握度、重试历史都保留
- ✓ 没有数据丢失

---

### 4.3 多用户隔离测试

**步骤**:
1. 用userId=1完成面试和复盘
2. 用userId=2完成面试和复盘
3. 用userId=1查看自己的错题
4. 用userId=2查看自己的错题

**预期结果**:
- ✓ 每个用户只能看到自己的数据
- ✓ 没有数据混淆

---

## Part 5: 错误处理测试

### 5.1 缺少必需字段

**请求**:
```bash
curl -X POST http://localhost:8080/api/interview/save-report \
  -H "Authorization: Bearer 1" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

**预期响应**:
```json
{
  "code": 400,
  "message": "岗位名称不能为空"
}
```

---

### 5.2 无效的recordId

**请求**:
```bash
curl -X GET "http://localhost:8080/api/interview/wrong-answers?recordId=invalid-id" \
  -H "Authorization: Bearer 1"
```

**预期响应**:
```json
{
  "code": 200,
  "message": "错题复盘列表获取成功",
  "data": {
    "items": [],
    "total": 0
  }
}
```

---

### 5.3 无效的掌握度值

**请求**:
```bash
curl -X PATCH "http://localhost:8080/api/interview/wrong-answers/<ID>/mastery" \
  -H "Authorization: Bearer 1" \
  -H "Content-Type: application/json" \
  -d '{"masterLevel": 150}'
```

**预期响应**:
```json
{
  "code": 200,
  "message": "掌握度已更新",
  "data": {
    "masterLevel": 100  // 被限制在0-100范围内
  }
}
```

---

## Part 6: 性能测试

### 6.1 大量错题查询

**步骤**:
1. 创建包含50个答题的面试报告
2. 查询错题列表
3. 测量响应时间

**预期结果**:
- ✓ 响应时间 < 500ms
- ✓ 没有超时错误

---

### 6.2 大量重试记录

**步骤**:
1. 为同一个错题提交10次重试答案
2. 查询错题详情
3. 测量响应时间

**预期结果**:
- ✓ 响应时间 < 300ms
- ✓ 所有重试记录都返回

---

## 测试检查清单

- [ ] 后端API所有8个端点都能正常工作
- [ ] 前端能正确调用所有API
- [ ] 数据正确保存到数据库
- [ ] 用户隔离正确实现
- [ ] 错误处理正确
- [ ] 性能满足要求
- [ ] 没有控制台错误
- [ ] 没有内存泄漏
- [ ] 响应时间满足要求

---

## 常见问题排查

### Q: 后端无法连接到数据库
**A**: 检查 `.env` 文件中的数据库配置，确保数据库服务正在运行

### Q: 前端无法调用API
**A**: 检查CORS配置，确保后端允许来自前端的跨域请求

### Q: 数据没有保存到数据库
**A**: 检查Sequelize模型是否正确定义，运行 `npm run db:migrate`

### Q: 页面加载缓慢
**A**: 检查网络请求，使用浏览器开发者工具的Performance标签分析

---

## 测试报告模板

```
测试日期: 2026-03-26
测试人员: [名字]
系统版本: Phase 1 & 2

后端API测试:
- POST /api/interview/save-report: ✓ PASS
- GET /api/interview/wrong-answers: ✓ PASS
- GET /api/interview/wrong-answers/:id: ✓ PASS
- POST /api/interview/wrong-answers/:id/retry: ✓ PASS
- PUT /api/interview/wrong-answers/:id/notes: ✓ PASS
- PATCH /api/interview/wrong-answers/:id/mastery: ✓ PASS
- GET /api/interview/records: ✓ PASS
- GET /api/interview/records/:id: ✓ PASS

前端功能测试:
- 报告自动保存: ✓ PASS
- 错题复盘按钮: ✓ PASS
- 参考模式: ✓ PASS
- 练习模式: ✓ PASS
- 学习笔记编辑: ✓ PASS
- 掌握度调整: ✓ PASS

集成测试:
- 完整用户流程: ✓ PASS
- 数据一致性: ✓ PASS
- 多用户隔离: ✓ PASS

总体结果: ✓ ALL TESTS PASSED
```

---

## 下一步

1. 根据测试结果修复任何问题
2. 进行性能优化
3. 部署到测试环境
4. 进行用户验收测试（UAT）
5. 部署到生产环境
