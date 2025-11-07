# ⚡ nginx 快速设置指南 (5 分钟启动)

## 📌 选择您的场景

### 场景 A: Windows 本地开发 (最快)
**时间**: 5 分钟
**难度**: ⭐ 简单
**推荐指数**: ★★★★★

### 场景 B: Linux VPS 部署
**时间**: 20 分钟
**难度**: ⭐⭐ 中等
**推荐指数**: ★★★★☆

### 场景 C: Docker 部署
**时间**: 10 分钟
**难度**: ⭐⭐ 中等
**推荐指数**: ★★★☆☆

---

## 🎯 场景 A: Windows 本地开发 (5 分钟)

### 步骤 1: 安装 nginx (2 分钟)

```bash
# 使用 Chocolatey 安装
choco install nginx

# 或者手动安装
# 下载: http://nginx.org/en/download.html
# 解压到 C:\nginx
```

### 步骤 2: 创建配置文件 (2 分钟)

创建文件: `C:\nginx\conf\nginx.conf`

```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
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

            # 超时设置
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
        access_log logs/access.log;
        error_log logs/error.log warn;
    }
}
```

### 步骤 3: 启动 nginx (1 分钟)

```bash
# 打开命令行，进入 nginx 目录
cd C:\nginx

# 启动
nginx.exe

# 验证 (打开浏览器或使用 curl)
curl http://localhost/health
# 应该返回: OK

# 其他命令
nginx.exe -s stop     # 停止
nginx.exe -s reload   # 重新加载配置
nginx.exe -s quit     # 优雅关闭
```

### 步骤 4: 测试存储服务 (1 分钟)

```bash
# 首先确保存储服务在运行
# (在另一个终端启动)
cd D:\code7\interview-system
node mock-storage-service.js

# 然后测试 API
curl -X POST http://localhost/api/sessions \
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -H "Content-Type: application/json" \
  -d "{\"test\": \"data\"}"

# 应该返回存储服务的响应
```

### ✅ 完成！

现在你可以在 Dify 工作流中使用：
```
http://localhost/api/sessions
```

而不是：
```
http://localhost:8080/api/sessions
```

---

## 🐧 场景 B: Linux VPS 部署 (20 分钟)

### 前置要求
- Linux VPS (Ubuntu 20.04+)
- 已配置的域名 DNS
- sudo 权限

### 步骤 1: 安装 nginx (3 分钟)

```bash
# 更新包列表
sudo apt-get update

# 安装 nginx
sudo apt-get install -y nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证
sudo systemctl status nginx
# 应该显示 active (running)
```

### 步骤 2: 配置反向代理 (5 分钟)

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/storage-api
```

粘贴以下内容：

```nginx
upstream storage_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name api.yourdomain.com;  # ← 改为你的域名

    location / {
        proxy_pass http://storage_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    access_log /var/log/nginx/storage-api-access.log;
    error_log /var/log/nginx/storage-api-error.log warn;
}
```

保存: `Ctrl+O`, `Enter`, `Ctrl+X`

### 步骤 3: 启用配置 (3 分钟)

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/storage-api \
           /etc/nginx/sites-enabled/storage-api

# 禁用默认配置 (可选)
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t
# 应该输出: nginx: the configuration file is ok

# 重启 nginx
sudo systemctl restart nginx
```

### 步骤 4: 申请 SSL 证书 (5 分钟)

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 自动申请并配置
sudo certbot --nginx -d api.yourdomain.com

# 按提示选择:
# - 输入邮箱
# - 同意条款 (A)
# - 选择重定向 (2 - 重定向所有流量到 HTTPS)

# 验证证书
sudo certbot certificates

# 测试自动续期
sudo certbot renew --dry-run
```

### 步骤 5: 测试 (4 分钟)

```bash
# 启动本地存储服务 (在服务器上)
cd /home/your-user/interview-system  # 改为你的路径
node mock-storage-service.js &

# 测试健康检查
curl https://api.yourdomain.com/health

# 测试 API
curl -X POST https://api.yourdomain.com/api/sessions \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d "{\"test\": \"data\"}"
```

### ✅ 完成！

现在在 Dify 工作流中使用：
```
https://api.yourdomain.com/api/sessions
```

---

## 🐳 场景 C: Docker 部署 (10 分钟)

### 创建 Docker Compose 文件

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  storage-service:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./mock-storage-service.js:/app/mock-storage-service.js
    expose:
      - "8080"
    command: node mock-storage-service.js
    networks:
      - interview_network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - storage-service
    networks:
      - interview_network

networks:
  interview_network:
    driver: bridge

volumes:
  nginx_logs:
```

### 创建 nginx 配置

创建 `nginx.conf`：

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    upstream storage_backend {
        server storage-service:8080;
    }

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://storage_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /health {
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 启动 Docker

```bash
# 启动所有服务
docker-compose up -d

# 验证
docker-compose ps

# 测试
curl http://localhost/health

# 查看日志
docker-compose logs -f nginx
docker-compose logs -f storage-service

# 停止
docker-compose down
```

### ✅ 完成！

现在使用：
```
http://localhost/api/sessions    (本地)
http://your-server:80/api/sessions  (远程)
```

---

## 📊 三个方案对比

| 方面 | Windows 本地 | Linux VPS | Docker |
|------|------------|---------|--------|
| 安装时间 | 5 分钟 | 20 分钟 | 10 分钟 |
| 配置难度 | ⭐ 简单 | ⭐⭐ 中等 | ⭐ 简单 |
| 成本 | 0 | 5-30 USD/月 | 变动 |
| SSL/TLS | 需手动 | 自动 (Let's Encrypt) | 需手动 |
| 推荐用途 | 开发测试 | 生产部署 | 快速部署 |
| 易用性 | ★★★★☆ | ★★★☆☆ | ★★★★☆ |

---

## 🔧 常见问题

### Q1: nginx 无法启动
```bash
# 检查配置
nginx -t  (Windows)
sudo nginx -t  (Linux)

# 查看错误
cat error.log  (Windows: logs/error.log)
sudo tail -f /var/log/nginx/error.log  (Linux)
```

### Q2: 返回 502 Bad Gateway
```bash
# 检查上游服务
netstat -an | grep 8080  (Windows)
sudo netstat -an | grep 8080  (Linux)

# 检查防火墙
sudo ufw allow 8080  (Linux)
```

### Q3: 无法访问
```bash
# 本地测试
curl http://localhost/health

# 检查端口
netstat -an | grep 80  (Windows)
sudo netstat -an | grep 80  (Linux)
```

### Q4: 修改配置后无效
```bash
# 重新加载配置
nginx -s reload  (Windows)
sudo systemctl reload nginx  (Linux)
sudo systemctl restart nginx  (如果需要完全重启)
```

---

## 📈 更新 Dify 工作流

修改存储服务 URL 后，需要更新 Python 代码：

### 原代码 (ngrok)
```python
api_url = "https://xxxx-xxxx-xxxx.ngrok.io/api/sessions"
```

### 新代码 (nginx)
```python
# 本地开发
api_url = "http://localhost/api/sessions"

# VPS 部署
api_url = "https://api.yourdomain.com/api/sessions"

# Docker
api_url = "http://nginx:80/api/sessions"
```

然后在 Dify 中：
1. 编辑工作流
2. 打开 "保存问题列表" 节点
3. 修改 Python 代码中的 URL
4. 保存并发布

---

## ✅ 验证检查清单

### Windows 本地
- [ ] nginx 已安装
- [ ] nginx.conf 已创建
- [ ] nginx 已启动 (`nginx.exe`)
- [ ] 存储服务在运行 (`node mock-storage-service.js`)
- [ ] `curl http://localhost/health` 返回 OK
- [ ] `curl http://localhost/api/sessions` 能访问

### Linux VPS
- [ ] nginx 已安装
- [ ] 配置文件已创建
- [ ] 配置已启用和测试
- [ ] SSL 证书已申请
- [ ] 防火墙已配置
- [ ] 存储服务在运行
- [ ] `curl https://api.yourdomain.com/health` 返回 OK

### Docker
- [ ] Docker 和 Docker Compose 已安装
- [ ] 配置文件已创建
- [ ] `docker-compose up -d` 已执行
- [ ] 容器状态正常
- [ ] `curl http://localhost/health` 返回 OK

---

## 🚀 立即开始

### 选项 1: 我要快速测试 (Windows)
```bash
# 1. 安装 nginx
choco install nginx

# 2. 复制上面的 nginx.conf 到 C:\nginx\conf\nginx.conf

# 3. 启动
cd C:\nginx && nginx.exe

# 4. 测试
curl http://localhost/health
```

### 选项 2: 我要部署到生产 (Linux)
按照"场景 B"的 5 个步骤操作

### 选项 3: 我要快速部署 (Docker)
按照"场景 C"的步骤操作

---

**现在就开始！选择你的场景并按步骤操作。** 🚀

