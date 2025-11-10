# 部署参考 - 多域名 Nginx 路由配置

## 问题诊断

### 症状
- 访问 `https://viewself.cn` 和 `https://storage.viewself.cn` 显示相同内容
- Nginx 没有正确分流不同域名的请求

### 根本原因
Nginx 配置文件中缺少为 `storage.viewself.cn` 设置的独立 `server` 块，无法根据不同的域名将请求转发到不同的后端服务。

### 问题比喻
- 您的 Nginx = 服务器大楼的前台接待员
- `viewself.cn` = 访客想去"AI面试官办公室"
- `storage.viewself.cn` = 访客想去"存储系统机房"
- **现状**：接待员不论访客要去哪里，都只把他们带到同一个办公室

## 解决方案：独立的 Server Block

### 配置原理

```nginx
# HTTP (80) -> HTTPS (443) 全局重定向
server {
    listen 80 default_server;
    server_name _;  # 匹配所有域名
    # 所有 HTTP 流量都重定向到 HTTPS
}

# HTTPS Server Block 1: viewself.cn
server {
    listen 443 ssl http2;
    server_name viewself.cn www.viewself.cn;
    # SSL 配置
    location / {
        proxy_pass http://interview-frontend:80;  # 指向前端
    }
}

# HTTPS Server Block 2: storage.viewself.cn
server {
    listen 443 ssl http2;
    server_name storage.viewself.cn;
    # SSL 配置（同一个证书）
    location / {
        proxy_pass http://interview-storage:8081;  # 指向存储服务
    }
}
```

**关键点**：
- 两个 HTTPS server 块监听同一个 443 端口
- Nginx 根据 `Host` 请求头（server_name）区分不同域名
- 相同的端口 + 不同的 server_name = 不同的路由

## 部署步骤

### 前置条件

1. ✅ SSL 证书已申请（包含 3 个域名）：
   ```bash
   certbot certonly --standalone \
     -d viewself.cn \
     -d www.viewself.cn \
     -d storage.viewself.cn
   ```

2. ✅ 证书文件存在于：
   - `/etc/letsencrypt/live/viewself.cn/fullchain.pem`
   - `/etc/letsencrypt/live/viewself.cn/privkey.pem`

3. ✅ DNS A 记录已配置：
   - `@` → 47.76.110.106
   - `www` → 47.76.110.106
   - `storage` → 47.76.110.106

### 第一步：更新 Nginx 配置文件

在服务器上编辑 `/opt/interview-system/nginx.conf`：

```bash
vim /opt/interview-system/nginx.conf
```

使用项目中的 `nginx.conf` 文件内容（见 [nginx.conf](./nginx.conf)）。

**关键配置点**：

| 配置项 | 值 | 用途 |
|--------|-----|------|
| HTTP server_name | `_` | 匹配所有域名的 HTTP 请求 |
| viewself.cn server_name | `viewself.cn www.viewself.cn` | 前端应用域名 |
| viewself.cn proxy_pass | `http://interview-frontend:80` | 前端服务地址 |
| storage.viewself.cn server_name | `storage.viewself.cn` | 存储服务域名 |
| storage.viewself.cn proxy_pass | `http://interview-storage:8081` | 存储服务地址 |
| SSL 证书路径 | `/etc/letsencrypt/live/viewself.cn/` | 所有 HTTPS 使用同一个证书 |

### 第二步：重启 Nginx 容器

在 `/opt/interview-system` 目录下执行：

```bash
docker-compose -f docker-compose.prod.yml up -d --force-recreate interview-nginx
```

**命令解释**：
- `up -d` - 启动服务并在后台运行
- `--force-recreate` - 强制重新创建容器（重要！）
  - 删除旧的 interview-nginx 容器
  - 加载最新的 nginx.conf 配置创建新容器
- `interview-nginx` - 仅对 Nginx 服务操作，不影响其他服务

### 第三步：验证部署

等待几秒钟，容器启动完成后：

#### 验证 1：清除缓存并访问

1. 清除浏览器缓存或打开无痕模式
2. 访问 `https://viewself.cn`
   - 期望看到：AI 面试官前端应用
3. 访问 `https://storage.viewself.cn`
   - 期望看到：存储服务的响应（JSON 或其他格式，不是主项目）

#### 验证 2：测试 HTTPS 重定向

```bash
curl -I http://viewself.cn
# 期望：301 重定向到 https://viewself.cn

curl -I http://storage.viewself.cn
# 期望：301 重定向到 https://storage.viewself.cn
```

#### 验证 3：检查 Nginx 日志

```bash
docker-compose -f docker-compose.prod.yml logs nginx-proxy

# 查找类似的日志：
# [日期] 访问 /api/... 来自 viewself.cn
# [日期] 访问 / 来自 storage.viewself.cn
```

## 工作原理详解

### 请求流程示例

**场景 1：用户访问 https://viewself.cn**
```
用户请求: GET https://viewself.cn/
         ↓
Nginx 443 端口接收请求
         ↓
Nginx 查看 Host 请求头: "viewself.cn"
         ↓
匹配 server block: server_name viewself.cn www.viewself.cn;
         ↓
执行 proxy_pass http://interview-frontend:80;
         ↓
前端服务处理请求，返回 UI
         ↓
Nginx 将响应返回给用户
```

**场景 2：用户访问 https://storage.viewself.cn**
```
用户请求: GET https://storage.viewself.cn/api/sessions
         ↓
Nginx 443 端口接收请求
         ↓
Nginx 查看 Host 请求头: "storage.viewself.cn"
         ↓
匹配 server block: server_name storage.viewself.cn;
         ↓
执行 proxy_pass http://interview-storage:8081;
         ↓
存储服务处理请求，返回数据
         ↓
Nginx 将响应返回给用户
```

## 故障排查

### 1. 重启后仍然显示错误配置

**症状**：修改了 nginx.conf 但重启后仍未生效

**解决**：
```bash
# 检查配置文件语法
docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -t

# 强制重启（注意 --force-recreate）
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --force-recreate interview-nginx
```

### 2. 部分域名返回 502 Bad Gateway

**症状**：某个域名无法访问

**检查**：
1. 后端服务是否运行
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. nginx.conf 中的 proxy_pass 地址是否正确
   - interview-frontend 应该在 80 端口
   - interview-storage 应该在 8081 端口

3. 查看 Nginx 错误日志
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx-proxy | grep error
   ```

### 3. HTTPS 证书错误

**症状**：浏览器显示证书不匹配警告

**检查**：
1. 证书文件是否存在
   ```bash
   ls -la /etc/letsencrypt/live/viewself.cn/
   ```

2. nginx.conf 中的证书路径是否正确
   ```nginx
   ssl_certificate /etc/letsencrypt/live/viewself.cn/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/viewself.cn/privkey.pem;
   ```

3. 重载 SSL 配置
   ```bash
   docker-compose -f docker-compose.prod.yml restart nginx-proxy
   ```

### 4. HTTP 重定向不工作

**症状**：访问 http://viewself.cn 没有重定向到 HTTPS

**检查**：
1. 80 端口监听是否正确
   ```bash
   docker-compose -f docker-compose.prod.yml exec nginx-proxy netstat -tln | grep 80
   ```

2. firewall 是否阻止了 80 端口
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   ```

## 相关文件

| 文件 | 用途 |
|------|------|
| `nginx.conf` | Nginx 反向代理配置 |
| `docker-compose.prod.yml` | 生产环境 Docker Compose 配置 |
| `MULTI_DOMAIN_DEPLOYMENT_GUIDE.md` | 详细部署指南 |
| `DEPLOYMENT_REFERENCE.md` | 本文件，部署参考 |

## 关键配置检查清单

- [ ] nginx.conf 包含两个独立的 HTTPS server block
- [ ] viewself.cn server_name 正确
- [ ] storage.viewself.cn server_name 正确
- [ ] proxy_pass 地址正确（frontend:80, storage:8081）
- [ ] SSL 证书路径正确
- [ ] HTTP 80 端口配置了重定向
- [ ] ACME challenge 路径配置正确
- [ ] 使用了 `--force-recreate` 重启 Nginx 容器
- [ ] 浏览器缓存已清除
- [ ] 两个域名都能通过 HTTPS 访问
- [ ] SSL 证书显示为有效

## 常见问题 (FAQ)

### Q: 为什么要用两个 server block？不能用一个 if 语句吗？

A: Nginx 不推荐在 server block 中使用复杂的 if 逻辑。使用多个 server block 是官方推荐的做法，更清晰、更高效、更易维护。

### Q: 能使用不同的证书吗？

A: 可以。如果您为 storage.viewself.cn 申请了单独的证书，可以在对应的 server block 中指向不同的证书路径。

### Q: 能在一个 80 端口和一个 443 端口上处理多个域名吗？

A: 是的。Nginx 通过 `Host` 请求头来区分不同域名，所以可以在同一端口上处理多个域名。这称为"虚拟主机"（Virtual Hosts）。

### Q: 如果 interview-storage 容器不存在会怎样？

A: Nginx 会返回 502 Bad Gateway。需要确保存储服务容器正在运行。

### Q: 证书续期会影响服务吗？

A: 不会。Certbot 只更新证书文件，Nginx 下次读取时会加载新证书。不需要重启 Nginx。

## 参考资源

- [Nginx 官方文档 - Server Names](https://nginx.org/en/docs/http/server_names.html)
- [Nginx 官方文档 - Proxy Module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Let's Encrypt 证书申请](https://letsencrypt.org/getting-started/)
- [Certbot 官方文档](https://certbot.eff.org/)
