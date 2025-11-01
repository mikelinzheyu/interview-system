# ngrok配置更新说明

**日期**: 2025-10-23 22:40 CST
**状态**: ⚠️ ngrok隧道需要重新配置

---

## 🔍 发现

### ngrok隧道状态检查

| URL | 状态 | 说明 |
|-----|------|------|
| https://phrenologic-preprandial-jesica.ngrok-free.dev | ❌ 失效 | 返回404 - API接口不存在 |
| https://chestier-unremittently-willis.ngrok-free.dev | ❌ 失效 | 原工作流1隧道 |
| http://localhost:8090 | ✅ 正常 | 本地存储API正常运行 |

### 问题分析

**原因**: ngrok隧道有以下特点：
1. ngrok隧道会在一段时间不使用后过期
2. ngrok免费版本隧道URL会定期重置
3. 当前提供的ngrok URL已失效

---

## ✅ 解决方案

### 方案A: 使用本地存储API (推荐)

**当前状态**: ✅ 本地存储API完全可用
- 地址: `http://localhost:8090/api/sessions`
- API密钥: `ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`
- 所有5项测试已通过

**优点**:
- ✅ 无延迟
- ✅ 不依赖外部服务
- ✅ 完全可控
- ✅ 开发测试最优

**缺点**:
- 只能本地访问
- Dify只能部署在本机或同网络

**使用场景**: 开发环境、本地测试

---

### 方案B: 新建ngrok隧道

如果您需要从外部网络（如云端Dify）访问本地存储API，需要建立新的ngrok隧道：

#### 步骤1: 启动ngrok隧道

```bash
# 安装ngrok (如果未安装)
# 从 https://ngrok.com/download 下载

# 启动隧道，将本地8090端口暴露
ngrok http 8090

# 输出类似:
# Forwarding                    https://xxxxx-xxxxx-xxxxx.ngrok-free.dev -> http://localhost:8090
```

#### 步骤2: 复制新的隧道URL

```
新隧道URL: https://xxxxx-xxxxx-xxxxx.ngrok-free.dev
```

#### 步骤3: 更新配置

```javascript
// 更新到新的ngrok URL
const STORAGE_API = {
  baseUrl: 'https://xxxxx-xxxxx-xxxxx.ngrok-free.dev/api/sessions',
  apiKey: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
};
```

#### 步骤4: 在Dify中使用

在Dify工作流中更新Python代码：

```python
api_url = "https://xxxxx-xxxxx-xxxxx.ngrok-free.dev/api/sessions"
```

---

## 🔐 推荐配置

### 开发环境 (推荐)

```
存储API: http://localhost:8090
部署位置: 本地或同一网络
Dify: 本地部署或可访问localhost的环境
```

**优点**:
- 最简单
- 性能最好
- 无需维护ngrok

### 生产/云环境

```
存储API: https://your-domain.com/api/sessions
部署位置: 云服务器
Dify: 云部署
```

**步骤**:
1. 将存储API部署到云服务器
2. 配置DNS指向
3. 设置SSL证书
4. 在Dify中配置HTTPS URL

---

## 📝 Dify工作流配置

### 使用本地API (http://localhost:8090)

```python
# 工作流1 - 保存问题列表
api_url = "http://localhost:8090/api/sessions"
headers = {
    "Authorization": "Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    "Content-Type": "application/json"
}

response = requests.post(api_url, json=session_data, headers=headers, timeout=10)
```

### 使用ngrok隧道 (新建后)

```python
# 工作流1 - 保存问题列表
api_url = "https://your-ngrok-url.ngrok-free.dev/api/sessions"
headers = {
    "Authorization": "Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    "Content-Type": "application/json"
}

response = requests.post(api_url, json=session_data, headers=headers, timeout=10)
```

---

## 🎯 立即行动

### 如果您想使用本地API (推荐)

**更新所有配置为**:
```
http://localhost:8090/api/sessions
```

**在Dify工作流中**:
```python
api_url = "http://localhost:8090/api/sessions"
```

### 如果您想使用ngrok隧道

**步骤**:
1. 运行: `ngrok http 8090`
2. 获取新隧道URL
3. 更新所有配置
4. 在Dify中更新工作流

---

## ⚙️ 配置文件更新

已更新的配置文件:
- ✅ test-storage-api.js (现在指向ngrok URL)
- ⏳ 其他文件可按需更新

### 快速恢复本地API

```bash
# 编辑test-storage-api.js
# 修改 STORAGE_API 配置为:
const STORAGE_API = {
  protocol: 'http',
  host: 'localhost',
  port: 8090,
  basePath: '/api/sessions',
  apiKey: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
};

# 然后运行测试
node test-storage-api.js
```

---

## 📊 对比总结

| 特性 | 本地API | ngrok隧道 | 云部署 |
|------|---------|----------|--------|
| 设置难度 | 🟢 简单 | 🟡 中等 | 🔴 复杂 |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 安全性 | 🟡 本地仅 | 🟡 依赖ngrok | 🟢 高 |
| 外网访问 | ❌ 否 | ✅ 是 | ✅ 是 |
| 维护成本 | 🟢 低 | 🟡 中 | 🔴 高 |
| 推荐场景 | 开发测试 | 演示演讲 | 生产环境 |

---

## 💡 建议

**当前推荐方案**:
1. ✅ 保持使用本地API (`http://localhost:8090`)
2. ✅ 所有测试已通过
3. ✅ 简单可靠
4. ✅ 最佳开发体验

**如果需要外网访问**:
1. 启动新的ngrok隧道
2. 获取新URL
3. 更新所有配置

---

## 📞 常见问题

### Q: ngrok隧道为什么无法访问?
A: ngrok免费版隧道会在以下情况过期:
- 长时间不使用 (>几周)
- ngrok服务重启
- 定期清理

### Q: 怎样保持ngrok隧道不断开?
A: 保持ngrok进程运行，定期验证连接

### Q: 可以用固定的ngrok URL吗?
A: 可以，但需要ngrok Pro账户

### Q: 本地API能从外网访问吗?
A: 不能，除非使用ngrok或部署到云服务器

---

**状态**: ⚠️ 等待确认使用哪个方案
**下一步**:
- 方案A: 使用本地API (只需确认)
- 方案B: 创建新ngrok隧道 (需要10分钟)

---

*生成时间: 2025-10-23 22:40*
