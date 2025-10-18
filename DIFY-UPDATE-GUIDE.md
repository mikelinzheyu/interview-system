# Dify 工作流更新指南 (从 ngrok 到 nginx)

## 概述

本指南说明如何在 Dify 中更新所有 3 个工作流的 API 配置，将其从 ngrok 隧道更改为本地 nginx 反向代理。

**变更摘要**:
- 从: `https://xxxx-xx-xxx-xx-xx.ngrok.io/api/...`
- 到: `http://localhost/api/...`

## 前置条件

- ✅ nginx 正在运行 (C:\nginx\nginx.exe)
- ✅ 存储服务正在运行 (node mock-storage-service.js)
- ✅ 本地网络可以访问 http://localhost/api/health

**验证**:
```bash
curl http://localhost/api/health
# 应该返回健康检查响应
```

## 工作流配置变更清单

### 工作流 1: 生成问题

#### 原始配置 (ngrok)
```
HTTP 请求节点:
  URL: https://xxxx-xx-xxx-xx-xx.ngrok.io/api/sessions
  方法: POST
  认证: Bearer Token (ngrok)
```

#### 新配置 (nginx)
```
HTTP 请求节点:
  URL: http://localhost/api/sessions
  方法: POST
  认证: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

#### 更新步骤

1. **打开 Dify 工作流 1 编辑界面**
   - 登录 Dify 平台
   - 找到"生成问题"工作流
   - 点击"编辑"

2. **定位 HTTP 请求节点**
   - 在工作流画布中找到调用存储服务的 HTTP 请求节点
   - 通常标记为"保存会话"或"API 调用"

3. **修改 URL 地址**
   - 删除旧的 ngrok URL
   - 输入新地址: `http://localhost/api/sessions`

4. **更新认证令牌**
   - 修改 Authorization 头
   - 新值: `Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`

5. **验证请求体参数**
   - 确保以下字段正确映射:
     ```json
     {
       "sessionId": "{{ session_id }}",
       "userId": "{{ user_id }}",
       "questions": "{{ questions }}"
     }
     ```
   - ⚠️ 注意: 从之前的诊断中，"questions" 字段的变量映射可能需要调整
     - 正确的映射: `{{ extract_skills.structured_output.questions }}`
     - 而不是: `{{ extract_skills.structured_output }}`

6. **保存变更**
   - 点击"保存"或"发布"按钮
   - 等待工作流重新部署

### 工作流 2: 生成标准答案

#### 原始配置 (ngrok)
```
HTTP 请求节点:
  URL: https://xxxx-xx-xxx-xx-xx.ngrok.io/api/sessions/{sessionId}/questions/{questionId}
  方法: PUT
```

#### 新配置 (nginx)
```
HTTP 请求节点:
  URL: http://localhost/api/sessions/{sessionId}/questions/{questionId}
  方法: PUT
```

#### 更新步骤

1. **打开工作流 2 编辑界面**
   - 找到"生成标准答案"工作流
   - 点击"编辑"

2. **修改 HTTP 请求配置**
   - 更新 URL 为: `http://localhost/api/sessions/{sessionId}/questions/{questionId}`
   - 更新认证令牌: `Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`

3. **验证参数**
   - sessionId: 应该来自上一步的会话数据
   - questionId: 应该是当前问题的 ID

4. **检查响应映射**
   - 确保返回的"standardAnswer"字段正确映射到后续步骤

5. **保存变更**

### 工作流 3: 评分答案

#### 原始配置 (ngrok)
```
HTTP 请求节点:
  URL: https://xxxx-xx-xxx-xx-xx.ngrok.io/api/sessions/{sessionId}/questions/{questionId}
  方法: GET (用于检索) / PUT (用于更新)
```

#### 新配置 (nginx)
```
HTTP 请求节点:
  URL: http://localhost/api/sessions/{sessionId}/questions/{questionId}
  方法: GET 或 PUT
```

#### 更新步骤

1. **打开工作流 3 编辑界面**
   - 找到"评分答案"工作流
   - 点击"编辑"

2. **修改所有 HTTP 请求节点**
   - 更新 URL 为: `http://localhost/api/sessions/{sessionId}/questions/{questionId}`
   - 更新认证令牌: `Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`

3. **检查请求体**
   - 确保包含评分结果字段
   - 格式应该与存储服务期望的一致

4. **验证响应处理**
   - 确保能够正确处理返回的响应

5. **保存变更**

## 常见问题排查

### 问题 1: HTTP 400 错误 - "Missing required field"

**原因**: 请求体缺少必需字段

**解决方案**:
- 检查 Dify 中的请求体构建
- 确保所有必需字段都在变量映射中
- 参考存储服务文档中的字段要求

### 问题 2: HTTP 401 错误 - "Unauthorized"

**原因**: 认证令牌不正确或缺失

**解决方案**:
```
1. 在 Dify 中检查 Authorization 头
2. 确保格式为: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
3. 确认 API Key 没有过期
```

### 问题 3: HTTP 404 错误 - "API endpoint not found"

**原因**: URL 路径不正确

**解决方案**:
```
检查 URL 格式:
- 工作流1: http://localhost/api/sessions
- 工作流2: http://localhost/api/sessions/{sessionId}/questions/{questionId}
- 工作流3: 同上
```

### 问题 4: 连接超时

**原因**: nginx 或存储服务未运行

**解决方案**:
```powershell
# 检查 nginx 是否运行
Get-Process nginx

# 检查存储服务是否运行
Get-Process node

# 测试连接
curl http://localhost/api/health
```

### 问题 5: "questions" 变量为空或格式错误

**原因**: 变量映射指向错误的 JSON 路径

**解决方案** (来自之前的诊断):
- 错误: `{{ extract_skills.structured_output }}`
- 正确: `{{ extract_skills.structured_output.questions }}`

**在 Dify UI 中修复**:
1. 找到生成问题的节点 (extract_skills)
2. 在 HTTP 请求节点的"请求体"中
3. 修改 questions 字段的变量映射
4. 从: `variables["extract_skills"]["structured_output"]`
5. 到: `variables["extract_skills"]["structured_output"]["questions"]`

## 测试工作流

### 方法 1: 使用 Dify UI 直接测试

1. 打开工作流
2. 点击"测试"按钮
3. 输入测试数据
4. 观察执行结果

### 方法 2: 使用测试脚本

```bash
cd D:\code7\interview-system
node test-workflows-via-nginx.js
```

### 方法 3: 使用 curl 手动测试

```bash
# 测试存储服务可用性
curl http://localhost/api/health

# 创建测试会话
curl -X POST http://localhost/api/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -d '{
    "sessionId": "test-001",
    "userId": "user1",
    "questions": []
  }'
```

## 部署流程

### 本地测试完成后

1. **验证所有工作流在本地正常工作**
   - 工作流 1 返回有效的问题列表
   - 工作流 2 返回生成的标准答案
   - 工作流 3 正确评分

2. **导出 Dify 工作流配置**
   - 在 Dify 中导出更新后的工作流 YAML

3. **提交到项目仓库**
   - 保存更新的工作流配置
   - 记录变更日志

4. **准备云部署**
   - 使用 deploy-cloud.sh 脚本
   - 更新云服务器的 API URL 为实际的域名

## 云部署时的变更

在云服务器上部署时，需要进行以下调整:

### nginx 配置变更

**本地**:
```nginx
upstream storage_service {
    server 127.0.0.1:8080;
}
```

**云端** (示例):
```nginx
upstream storage_service {
    server localhost:3000;  # 云端 Node.js 应用地址
}
```

### Dify 工作流 URL 变更

**本地**:
```
http://localhost/api/sessions
```

**云端** (示例):
```
https://api.yourcompany.com/api/sessions
```

## 检查清单

- [ ] nginx 已启动并运行在 localhost:80
- [ ] 存储服务已启动并运行在 localhost:8080
- [ ] curl http://localhost/api/health 返回成功
- [ ] 工作流 1 URL 已更新为 http://localhost/api/sessions
- [ ] 工作流 2 URL 已更新为 http://localhost/api/sessions/{sessionId}/questions/{questionId}
- [ ] 工作流 3 URL 已更新为 http://localhost/api/sessions/{sessionId}/questions/{questionId}
- [ ] 所有工作流的认证令牌已更新
- [ ] 工作流 1 的 "questions" 字段变量映射已修复
- [ ] 在 Dify UI 中测试所有工作流
- [ ] 所有测试通过，无 504 错误

## 参考资源

- **nginx 配置**: C:\nginx\conf\nginx.conf
- **存储服务代码**: D:\code7\interview-system\mock-storage-service.js
- **测试脚本**: D:\code7\interview-system\test-workflows-via-nginx.js
- **部署文档**: D:\code7\interview-system\README-DEPLOYMENT.md
- **本地设置指南**: D:\code7\interview-system\LOCAL-SETUP-COMPLETE.md

## 后续步骤

1. ✅ 按照本指南更新所有工作流
2. ✅ 在本地进行完整的端到端测试
3. ✅ 验证所有工作流返回正确的数据
4. ⏳ 修复工作流 2 和 3 的 504 错误 (如果还有的话)
5. ⏳ 打包项目进行云部署

---

**最后更新**: 2025-10-16
**技术支持**: 参考相关的诊断文档和部署指南
