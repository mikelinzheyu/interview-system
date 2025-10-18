# 🚀 从 ngrok 迁移到 nginx 的最佳实践方案

## 📋 目录
1. [架构对比](#架构对比)
2. [迁移计划](#迁移计划)
3. [nginx 配置](#nginx-配置)
4. [DNS 和域名](#dns-和域名)
5. [SSL/TLS 证书](#ssltls-证书)
6. [性能优化](#性能优化)
7. [故障排除](#故障排除)

---

## 🏗️ 架构对比

### ngrok 方案
```
┌─────────────────┐
│  Dify 工作流     │
│ (云端 udify.app)│
└────────┬────────┘
         │ HTTP 请求
         │ (隧道URL)
         ↓
┌─────────────────────┐
│   ngrok 隧道         │
│ (临时公网地址)       │
│ https://xxxx.ngrok.io
└────────┬────────────┘
         │
         ↓
┌──────────────────────┐
│ 本地存储服务         │
│ localhost:8080       │
│ (Node.js Express)    │
└──────────────────────┘
```

**优点**:
- ✅ 零配置，快速启动
- ✅ 自动HTTPS
- ✅ 调试功能强大

**缺点**:
- ❌ 地址不稳定（每次重启变更）
- ❌ 免费版有速率限制
- ❌ 生产环境不适合
- ❌ 需要依赖第三方服务

---

### nginx 方案
```
┌─────────────────┐
│  Dify 工作流     │
│ (云端 udify.app)│
└────────┬────────┘
         │ HTTP 请求
         │
         ↓
┌──────────────────────┐
│   公网域名           │
│ https://api.example.com
│ (DNS 指向)
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│   nginx 反向代理     │
│ (公网服务器/本地)    │
│ 端口: 443 (HTTPS)    │
│ 端口: 80 (HTTP)      │
└────────┬─────────────┘
         │
         ↓
┌──────────────────────┐
│ 本地存储服务         │
│ localhost:8080       │
│ (Node.js Express)    │
└──────────────────────┘
```

**优点**:
- ✅ 地址稳定
- ✅ 完全控制
- ✅ 高性能
- ✅ 支持负载均衡
- ✅ 适合生产环境

**缺点**:
- ❌ 需要自己管理服务器/域名
- ❌ 需要配置 SSL/TLS
- ❌ 需要维护

---

## 📊 迁移计划

### 第一阶段: 准备 (1-2 小时)

#### 1.1 获取/准备域名
```
选项 A: 使用公网服务器 (推荐)
  - 租赁云服务器 (AWS/阿里云/腾讯云等)
  - 购买或使用现有域名
  - 配置 DNS 指向服务器

选项 B: 使用本地 nginx (测试环境)
  - 在本地安装 nginx
  - 使用 localhost 或内网IP
  - 仅在内网或本地访问
```

#### 1.2 安装 nginx
```bash
# Windows
choco install nginx

# Linux (Ubuntu)
sudo apt-get install nginx

# macOS
brew install nginx
```

#### 1.3 准备 SSL 证书 (如果使用 HTTPS)
```
选项 A: 免费证书 (推荐)
  - Let's Encrypt (通过 Certbot)
  - 自动更新

选项 B: 自签名证书 (测试)
  - 用于开发/测试
  - 快速生成
```

### 第二阶段: 配置 nginx (1-2 小时)

#### 2.1 配置反向代理
#### 2.2 配置 HTTPS
#### 2.3 性能优化
#### 2.4 测试验证

### 第三阶段: 更新 Dify 工作流 (30 分钟)

#### 3.1 更新存储服务 URL
#### 3.2 重新发布工作流
#### 3.3 运行集成测试

---

## 🛠️ nginx 配置

### 场景 1: 本地开发 (nginx 在本地)

#### 安装 nginx
```bash
# Windows (使用 Chocolatey)
choco install nginx

# 验证安装
nginx -v
```

#### 基础配置文件
```
位置:
  Windows: C:\nginx\conf\nginx.conf
  Linux: /etc/nginx/nginx.conf
  macOS: /usr/local/etc/nginx/nginx.conf
```

#### 简单反向代理配置
```nginx
# C:\nginx\conf\nginx.conf

http {
    # 上游存储服务
    upstream storage_service {
        server 127.0.0.1:8080;
    }

    server {
        listen 80;
        server_name localhost;

        # 存储服务代理
        location /api/ {
            proxy_pass http://storage_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 健康检查
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

#### 启动 nginx
```bash
# Windows
cd C:\nginx
nginx.exe

# 验证运行
nginx -s stop    # 停止
nginx -s reload  # 重新加载
nginx -s reopen  # 重新打开日志
```

#### 测试
```bash
# 测试本地访问
curl http://localhost/api/health

# 测试具体端点
curl -X POST http://localhost/api/sessions \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

### 场景 2: 公网部署 (nginx 在云服务器)

#### 完整配置示例
```nginx
# /etc/nginx/sites-available/storage-api

upstream storage_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL 证书 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL 配置优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # 存储服务代理
    location /api/sessions {
        proxy_pass http://storage_backend;

        # 代理头部
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 缓冲配置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # 健康检查端点
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }

    # 其他 API 端点
    location / {
        proxy_pass http://storage_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 启用配置
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/storage-api \
           /etc/nginx/sites-enabled/storage-api

# 测试配置
sudo nginx -t

# 重启 nginx
sudo systemctl restart nginx
```

---

## 🌐 DNS 和域名

### 选项 1: 云服务器 + 公网域名

```bash
# 购买域名 (阿里云/腾讯云/GoDaddy等)
域名: api.yourdomain.com

# 配置 DNS A 记录
记录类型: A
主机记录: api
记录值: 你的服务器公网IP
TTL: 600 (秒)
```

### 选项 2: 本地开发环境

```bash
# 修改 hosts 文件
Windows: C:\Windows\System32\drivers\etc\hosts
Linux/Mac: /etc/hosts

添加:
127.0.0.1  api.local.dev
127.0.0.1  storage.local
```

### 选项 3: 内网访问

```
使用内网 IP 地址:
192.168.x.x:8080 (直接访问)
或
配置内网 DNS 或 hosts 映射
```

---

## 🔒 SSL/TLS 证书

### 方案 A: Let's Encrypt (推荐 - 免费)

#### 安装 Certbot
```bash
# Linux (Ubuntu)
sudo apt-get install certbot python3-certbot-nginx

# macOS
brew install certbot
```

#### 自动申请和配置
```bash
# 自动申请证书并配置 nginx
sudo certbot --nginx -d api.yourdomain.com

# 验证
certbot certificates
```

#### 自动续期
```bash
# Certbot 会自动设置续期任务
# 验证续期
sudo certbot renew --dry-run
```

### 方案 B: 自签名证书 (测试/开发)

```bash
# 生成私钥
openssl genrsa -out server.key 2048

# 生成证书
openssl req -new -x509 -key server.key -out server.crt -days 365

# 在 nginx 中配置
ssl_certificate /path/to/server.crt;
ssl_certificate_key /path/to/server.key;
```

---

## ⚡ 性能优化

### 1. 连接池优化
```nginx
upstream storage_backend {
    server 127.0.0.1:8080;
    keepalive 32;           # 连接复用
    keepalive_timeout 60s;  # 连接超时
}
```

### 2. 缓存配置
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 10m;      # 成功响应缓存10分钟
    proxy_cache_valid 404 1m;       # 404缓存1分钟
    proxy_cache_key "$scheme$request_method$host$request_uri";

    # 显示缓存状态
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 3. 压缩优化
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/javascript application/json;
gzip_comp_level 6;
```

### 4. 限流保护
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20;
    proxy_pass http://storage_backend;
}
```

### 5. 负载均衡
```nginx
upstream storage_backend {
    # 轮询 (默认)
    server 127.0.0.1:8080 weight=5;
    server 127.0.0.1:8081 weight=3;

    # 最少连接
    least_conn;

    # IP 哈希
    # ip_hash;
}
```

---

## 🔧 故障排除

### 问题 1: nginx 无法启动
```bash
# 检查配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 问题 2: 代理返回 502 Bad Gateway
```bash
# 检查上游服务是否运行
netstat -an | grep 8080

# 检查防火墙
sudo ufw allow 8080

# 查看 nginx 访问日志
tail -f /var/log/nginx/access.log
```

### 问题 3: SSL 证书错误
```bash
# 验证证书
openssl x509 -in /path/to/cert.pem -text -noout

# 检查证书有效期
openssl x509 -enddate -noout -in /path/to/cert.pem
```

### 问题 4: 跨域问题 (CORS)
```nginx
location /api/ {
    # 添加 CORS 头部
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type,Authorization" always;

    # 处理预检请求
    if ($request_method = 'OPTIONS') {
        return 204;
    }

    proxy_pass http://storage_backend;
}
```

---

## 📈 迁移检查清单

### 准备阶段
- [ ] 选择部署方案 (本地/公网)
- [ ] 获取或准备域名
- [ ] 安装 nginx
- [ ] 准备 SSL 证书 (如需要)

### 配置阶段
- [ ] 编写 nginx 配置文件
- [ ] 测试反向代理
- [ ] 配置 SSL/TLS
- [ ] 优化性能参数
- [ ] 配置安全头部

### 测试阶段
- [ ] 本地功能测试
- [ ] 端点可访问性测试
- [ ] 负载测试
- [ ] 故障转移测试

### 部署阶段
- [ ] 更新 Dify 工作流的 API URL
- [ ] 更新授权头部配置
- [ ] 重新发布工作流
- [ ] 运行集成测试

### 验证阶段
- [ ] 测试所有工作流端点
- [ ] 检查日志
- [ ] 监控性能指标
- [ ] 验证 SSL 证书有效性

---

## 📊 成本对比

| 方案 | 初始成本 | 月度成本 | 维护工作 | 适用场景 |
|------|---------|---------|---------|---------|
| ngrok | 0 | 0-10 USD (pro) | 低 | 开发测试 |
| nginx (本地) | 0 | 0 | 低 | 本地/内网 |
| nginx (VPS) | 0-50 USD | 5-30 USD | 中等 | 小规模生产 |
| nginx (云) | 0-100 USD | 20-100 USD | 中等 | 中等规模生产 |
| K8S + nginx | 100+ USD | 50+ USD | 高 | 大规模生产 |

---

## 🎯 最佳实践总结

### 开发环境
```
推荐: 本地 nginx
配置: 简单反向代理到 localhost:8080
好处: 无外部依赖，快速测试
```

### 测试环境
```
推荐: VPS + nginx + Let's Encrypt
配置: 完整 SSL/TLS + 性能优化
好处: 接近生产环境，真实测试
```

### 生产环境
```
推荐: 云服务器 + nginx + 负载均衡
配置: 多实例 + 监控 + 自动化
好处: 高可用，可扩展
```

### 安全最佳实践
```
✅ 始终使用 HTTPS
✅ 配置安全头部
✅ 启用速率限制
✅ 定期更新证书
✅ 监控日志
✅ 备份配置
```

---

## 🚀 快速开始 (选一个)

### 快速开始 1: 本地开发
```bash
# 1. 安装 nginx
choco install nginx

# 2. 编辑配置文件 (C:\nginx\conf\nginx.conf)
# 复制下面的 "简单反向代理配置"

# 3. 启动 nginx
cd C:\nginx && nginx.exe

# 4. 测试
curl http://localhost/api/health
```

### 快速开始 2: Linux VPS
```bash
# 1. 安装 nginx
sudo apt-get install nginx

# 2. 创建配置文件
sudo vi /etc/nginx/sites-available/storage-api

# 3. 启用配置
sudo ln -s /etc/nginx/sites-available/storage-api \
           /etc/nginx/sites-enabled/

# 4. 启动 nginx
sudo systemctl restart nginx

# 5. 申请证书
sudo certbot --nginx -d api.yourdomain.com
```

---

**选择方案，开始迁移！** 🚀

