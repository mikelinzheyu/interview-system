# 多域名部署指南

本指南说明如何配置 AI 面试系统支持多个域名：
- **viewself.cn** 和 **www.viewself.cn** → 前端 UI 应用
- **storage.viewself.cn** → 分离式存储服务

## 系统架构概述

```
用户请求
  ↓
Nginx 反向代理 (443 端口)
  ├─ viewself.cn → interview-frontend:80
  ├─ www.viewself.cn → interview-frontend:80
  └─ storage.viewself.cn → interview-storage:8081

HTTP (80) 自动重定向到 HTTPS (443)
```

## 第一步：DNS 配置

在阿里云【云解析DNS】中为域名 `viewself.cn` 添加以下 A 记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 47.76.110.106 | 10分钟 |
| A | www | 47.76.110.106 | 10分钟 |
| A | storage | 47.76.110.106 | 10分钟 |

这确保所有三个域名都指向同一服务器 IP。

## 第二步：申请 SSL 证书

在服务器上执行以下命令为所有三个域名申请一个统一的 SSL 证书：

```bash
# 停止现有的 Nginx 服务（让出 80 端口给 Certbot）
cd /opt/interview-system
docker-compose -f docker-compose.prod.yml down

# 申请包含所有三个域名的证书
certbot certonly --standalone \
  -d viewself.cn \
  -d www.viewself.cn \
  -d storage.viewself.cn
```

**Certbot 会询问是否扩展现有证书**：
- 如果已有旧证书，选择选项 `1` (Keep the existing certificate) 或选择 `2` (Expand) 来添加新域名
- 证书将被保存到 `/etc/letsencrypt/live/viewself.cn/`

**证书生成后的文件**：
- `fullchain.pem` - 完整证书链
- `privkey.pem` - 私钥
- `options-ssl-nginx.conf` - SSL 配置（Certbot 自动生成）
- `ssl-dhparams.pem` - DH 参数（首次生成时会提示）

## 第三步：Nginx 配置

项目已包含最终的 `nginx.conf` 配置文件（见 `nginx.conf`）。此文件已优化为：

**HTTP 服务器 (80)：**
```nginx
server {
    listen 80 default_server;
    server_name _;  # 匹配所有域名

    location /.well-known/acme-challenge/ { ... }  # ACME 验证
    location / { return 301 https://$host$request_uri; }  # 重定向到 HTTPS
}
```

**HTTPS 服务器 - viewself.cn (443)：**
```nginx
server {
    listen 443 ssl http2;
    server_name viewself.cn www.viewself.cn;
    ssl_certificate /etc/letsencrypt/live/viewself.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/viewself.cn/privkey.pem;

    location / { proxy_pass http://interview-frontend:80; }
    location /api/ { proxy_pass http://interview-backend:3001; }
}
```

**HTTPS 服务器 - storage.viewself.cn (443)：**
```nginx
server {
    listen 443 ssl http2;
    server_name storage.viewself.cn;
    ssl_certificate /etc/letsencrypt/live/viewself.cn/fullchain.pem;  # 使用同一证书
    ssl_certificate_key /etc/letsencrypt/live/viewself.cn/privkey.pem;

    location / { proxy_pass http://interview-storage:8081; }
}
```

**关键特点**：
- 所有 HTTPS 流量在 443 端口
- 两个 HTTPS 服务器共享同一个证书（都指向 `/etc/letsencrypt/live/viewself.cn/`）
- 根据 `Host` 请求头区分不同域名
- 自动 HTTP→HTTPS 重定向
- Let's Encrypt ACME 验证支持

## 第四步：Docker Compose 配置

`docker-compose.prod.yml` 已更新，包含以下关键配置：

```yaml
nginx-proxy:
  image: nginx:1.27-alpine
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - /var/www/certbot:/var/www/certbot:ro
    - nginx_cache:/var/cache/nginx
  ports:
    - "80:80"
    - "443:443"
```

**重要：** `/var/www/certbot` 卷是必须的，用于 Let's Encrypt 自动化验证和证书续期。

## 第五步：启动服务

```bash
# 启动所有容器
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# 验证 Nginx 配置正确
docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -t

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f nginx-proxy
```

## 验证部署

部署完成后，验证所有域名工作正常：

```bash
# 测试 HTTP 重定向
curl -I http://viewself.cn
# 期望看到 301 重定向到 https://viewself.cn

# 测试 HTTPS 证书
curl -I https://viewself.cn
# 期望看到 200 OK

# 测试存储服务子域名
curl -I https://storage.viewself.cn
# 期望看到 200 OK

# 测试 API 路由
curl -I https://viewself.cn/api/health
# 期望看到后端服务的响应
```

在浏览器中访问：
- **https://viewself.cn** - 应显示前端 UI
- **https://www.viewself.cn** - 同样显示前端 UI
- **https://storage.viewself.cn** - 应显示存储服务

所有域名都应显示绿色的安全锁 🔒 图标，无证书警告。

## 证书续期

Let's Encrypt 证书有效期为 90 天。Certbot 会自动处理续期（通过 ACME 验证）。

续期触发条件：
- 每天 Certbot 会检查是否有证书需要续期
- 如果证书距离过期 30 天以内，会自动续期
- 续期使用 `/.well-known/acme-challenge/` 路径验证（需要 HTTP 访问）

因此，确保以下条件始终满足：
- Nginx 的 80 端口监听正常
- `/.well-known/acme-challenge/` 可访问
- `/var/www/certbot` 目录存在且可写

## 常见问题

### 1. 证书申请失败

**症状**：Certbot 提示 DNS 未生效或连接失败

**解决**：
- 等待 DNS 更新（通常 10-15 分钟）
- 检查 A 记录是否正确指向服务器 IP
- 确保服务器可被外网访问

### 2. HTTPS 连接拒绝

**症状**：浏览器显示 `NET::ERR_CERT_AUTHORITY_INVALID`

**解决**：
- 检查证书文件是否存在：
  ```bash
  ls -la /etc/letsencrypt/live/viewself.cn/
  ```
- 重启 Nginx：
  ```bash
  docker-compose -f docker-compose.prod.yml restart nginx-proxy
  ```

### 3. 某个域名返回 502 Bad Gateway

**症状**：访问某个域名时返回 502 错误

**解决**：
- 检查后端服务是否运行：
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
- 检查 Nginx 配置中的 `proxy_pass` 地址是否正确
- 查看 Nginx 错误日志：
  ```bash
  docker-compose -f docker-compose.prod.yml logs nginx-proxy | grep error
  ```

### 4. 证书续期失败

**症状**：Certbot 续期提示失败

**解决**：
- 检查 `/var/www/certbot` 是否可访问
- 手动续期：
  ```bash
  certbot renew --force-renewal
  ```
- 重启 Nginx 以加载新证书：
  ```bash
  docker-compose -f docker-compose.prod.yml restart nginx-proxy
  ```

## 生产检查清单

- [ ] DNS A 记录已配置（@ / www / storage）
- [ ] SSL 证书已申请，包含三个域名
- [ ] `nginx.conf` 已复制到服务器
- [ ] `docker-compose.prod.yml` 已配置
- [ ] `/var/www/certbot` 目录存在
- [ ] 所有容器启动成功
- [ ] HTTP 自动重定向到 HTTPS 工作正常
- [ ] 三个域名都可通过 HTTPS 访问
- [ ] SSL 证书有效期检查（不应接近 90 天）

## 相关文件

- `nginx.conf` - Nginx 反向代理配置
- `docker-compose.prod.yml` - Docker Compose 生产配置
- `.env.prod` - 生产环境变量

## 参考资源

- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)
- [Certbot 官方文档](https://certbot.eff.org/docs/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
