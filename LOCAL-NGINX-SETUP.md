# 🖥️ Windows 本地 nginx 快速设置指南

## 📌 目标
在 Windows 本地用 nginx 替代 ngrok，保留未来云服务器迁移的可能性。

---

## ⚡ 5 分钟快速启动

### 步骤 1: 安装 nginx (2 分钟)

```bash
# 打开 PowerShell (管理员模式)

# 方法 A: 使用 Chocolatey (推荐)
choco install nginx

# 方法 B: 手动安装
# 下载: http://nginx.org/en/download.html
# 解压到: C:\nginx
```

### 步骤 2: 配置文件 (1 分钟)

复制以下内容到 `C:\nginx\conf\nginx.conf`:

```nginx
worker_processes auto;
error_log logs/error.log;
pid logs/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log logs/access.log main;
    sendfile on;
    keepalive_timeout 65;

    # 上游存储服务
    upstream storage_service {
        server 127.0.0.1:8080;
    }

    # HTTP 服务器
    server {
        listen 80;
        server_name localhost;

        # API 代理
        location /api/ {
            proxy_pass http://storage_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 健康检查
        location /health {
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # 日志
        access_log logs/access.log main;
        error_log logs/error.log warn;
    }
}
```

### 步骤 3: 启动 (1 分钟)

```bash
# 进入 nginx 目录
cd C:\nginx

# 启动 nginx
nginx.exe

# 验证
curl http://localhost/health
# 应该返回: OK
```

### 步骤 4: 验证功能 (1 分钟)

```bash
# 在另一个终端启动存储服务
cd D:\code7\interview-system
node mock-storage-service.js

# 测试 API
curl -X POST http://localhost/api/sessions \
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"test-1\", \"jobTitle\": \"Python开发\"}"
```

✅ **完成！** 现在使用 `http://localhost/api/sessions`

---

## 🔧 常用命令

```bash
# 启动 nginx
nginx.exe

# 重新加载配置 (修改配置后使用)
nginx.exe -s reload

# 停止 nginx
nginx.exe -s stop

# 优雅退出
nginx.exe -s quit

# 验证配置
nginx.exe -t

# 重新打开日志文件
nginx.exe -s reopen
```

---

## 📝 在 Dify 中更新配置

### 工作流 1, 2, 3 都需要更新

打开每个工作流，找到 Python 代码节点，修改：

**原代码**:
```python
api_url = "http://localhost:8080/api/sessions"
```

**改为**:
```python
api_url = "http://localhost/api/sessions"
```

然后：
1. 点击"保存"
2. 点击"发布"
3. 等待 30 秒

---

## 🌐 本地开发工作流

```
┌─────────────────┐
│   Dify 工作流    │
│ (云端或本地)     │
└────────┬────────┘
         │ HTTP 请求
         ↓
┌──────────────────────┐
│  localhost:80        │
│  (nginx 反向代理)     │
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│  localhost:8080      │
│  (存储服务)          │
│  Node.js Express     │
└──────────────────────┘
```

---

## 🚀 未来云服务器迁移 (保留方案)

当你要部署到云服务器时，只需要：

### 1. 修改 nginx 配置

将 `server_name localhost;` 改为：
```nginx
server_name api.yourdomain.com;
```

### 2. 添加 SSL 证书

```nginx
listen 443 ssl http2;
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
```

### 3. HTTP 重定向到 HTTPS

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. 更新 Dify URL

```python
api_url = "https://api.yourdomain.com/api/sessions"
```

**就这么简单！** 大部分配置可以直接复用。

---

## ⚙️ nginx 配置结构 (便于理解迁移)

```nginx
# 这部分在本地和云服务器都一样
upstream storage_service {
    server 127.0.0.1:8080;  # 云服务器也是同一地址
}

# 这部分主要改变
server {
    listen 80;                    # 本地: 80
                                  # 云服务器: 80 + 443

    server_name localhost;        # 本地: localhost
                                  # 云服务器: api.yourdomain.com

    # 这部分完全相同
    location /api/ {
        proxy_pass http://storage_service;
        # ... 所有代理设置保持不变
    }
}
```

---

## 📊 本地 vs 云服务器配置对比

| 项目 | 本地 | 云服务器 |
|------|------|---------|
| nginx 配置 | ✅ 相同 | ✅ 相同 |
| 上游服务器 | ✅ 相同 (127.0.0.1:8080) | ✅ 相同 |
| 监听地址 | localhost:80 | 0.0.0.0:80 + 443 |
| 域名 | localhost | api.yourdomain.com |
| SSL 证书 | 无需 | Let's Encrypt |
| 改动点 | 最少 | 最少 |

---

## 🔍 故障排除

### nginx 无法启动

```bash
# 检查配置
nginx.exe -t

# 查看错误日志
type C:\nginx\logs\error.log

# 常见问题:
# 1. 80 端口被占用
#    改 listen 8888; 然后访问 http://localhost:8888
#
# 2. 配置文件有问题
#    用 nginx.exe -t 检查
```

### 无法访问 API

```bash
# 1. 检查存储服务是否运行
netstat -ano | findstr :8080

# 2. 检查 nginx 是否运行
tasklist | findstr nginx

# 3. 测试健康检查
curl http://localhost/health

# 4. 查看 nginx 日志
type C:\nginx\logs\error.log
type C:\nginx\logs\access.log
```

---

## 📈 性能监控 (本地开发)

查看 nginx 日志了解性能：

```bash
# 查看最近的请求
tail -f C:\nginx\logs\access.log

# 查看错误
tail -f C:\nginx\logs\error.log

# 统计响应时间
# (在日志分析工具中检查 $upstream_response_time)
```

---

## ✅ 完整检查清单

### 安装和启动
- [ ] 安装 nginx (`choco install nginx`)
- [ ] 复制配置文件到 `C:\nginx\conf\nginx.conf`
- [ ] 启动 nginx (`cd C:\nginx && nginx.exe`)
- [ ] 验证运行 (`curl http://localhost/health`)

### 存储服务
- [ ] 启动存储服务 (`node mock-storage-service.js`)
- [ ] 测试 API (`curl -X POST http://localhost/api/sessions ...`)
- [ ] 查看存储服务日志

### Dify 工作流
- [ ] 修改工作流 1 的 URL
- [ ] 修改工作流 2 的 URL
- [ ] 修改工作流 3 的 URL
- [ ] 发布所有工作流
- [ ] 测试工作流 1 (`node test-workflow1-simple.js`)

### 日志和监控
- [ ] 检查 nginx access.log
- [ ] 检查 nginx error.log
- [ ] 检查存储服务日志
- [ ] 所有请求都能成功

---

## 🎯 使用 nginx 后的优势

✅ **稳定性**: 地址永不变更
✅ **性能**: 反向代理更快
✅ **灵活性**: 可随时升级到 HTTPS
✅ **可维护性**: 配置清晰易懂
✅ **可扩展性**: 支持负载均衡
✅ **未来就绪**: 云服务器迁移只需改几个参数

---

## 🚀 下一步

### 现在 (今天)
1. ✅ 安装 nginx
2. ✅ 测试本地连接
3. ✅ 更新 Dify 配置
4. ✅ 验证工作流功能

### 将来 (当需要云部署时)
1. 租赁 VPS
2. 复制 nginx 配置
3. 修改 `server_name` 和 SSL 配置
4. 上传代码
5. 启动服务
6. 更新 Dify URL

**就这么简单！** 迁移时代码和核心配置保持不变，只改几个参数。

---

## 📞 相关文件

- `nginx-windows.conf` - 完整的 Windows 配置文件
- `mock-storage-service.js` - 存储服务实现
- `test-workflow1-simple.js` - 工作流测试脚本

---

**现在就启动 nginx，开始开发吧！** 🚀

