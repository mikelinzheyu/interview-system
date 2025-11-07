# ☁️ 从本地到云服务器迁移检查清单

## 📌 概述

当你完成本地开发，准备迁移到云服务器时，使用这个检查清单。

**关键点**: 大部分 nginx 配置保持不变，只需修改几个参数！

---

## 🎯 迁移前准备 (本地)

### 备份现有配置
```bash
# 备份本地 nginx 配置
copy C:\nginx\conf\nginx.conf nginx-backup.conf

# 备份存储服务代码
copy mock-storage-service.js mock-storage-service-backup.js
```

### 编辑 nginx 配置为通用版本

修改 `C:\nginx\conf\nginx.conf`:

**原本地配置**:
```nginx
server {
    listen 80;
    server_name localhost;
    ...
}
```

**改为通用配置** (同时支持本地和云):
```nginx
server {
    listen 80;
    server_name localhost api.yourdomain.com;  # 添加域名
    ...
}
```

这样本地和云都能用同一个配置！

---

## 💰 云服务器选择

### 推荐选项

| 提供商 | 配置 | 价格 | 推荐指数 |
|--------|------|------|--------|
| **阿里云** | 1核2G | 39 CNY/月 | ⭐⭐⭐⭐⭐ |
| **腾讯云** | 1核2G | 99 CNY/年 | ⭐⭐⭐⭐⭐ |
| **DigitalOcean** | 1GB | $5/月 | ⭐⭐⭐⭐ |
| **AWS** | 1核1G | 免费1年 | ⭐⭐⭐ |
| **Azure** | 1核1G | 免费1年 | ⭐⭐⭐ |

**建议**: 先选最便宜的 (阿里云/腾讯云)，完全满足需求。

---

## ✅ 迁移清单

### 第 1 步: 准备云服务器 (30 分钟)

#### 购买服务器
- [ ] 选择云服务提供商
- [ ] 购买 VPS (推荐配置: 1核2G, Ubuntu 20.04+)
- [ ] 获取服务器 IP 地址
- [ ] 配置安全组/防火墙 (开放 80 和 443 端口)

#### 购买域名
- [ ] 购买域名 (或使用现有域名)
- [ ] 确保可以编辑 DNS 记录

#### 获取 SSH 访问权限
- [ ] 获取 root 密码 或 SSH 密钥
- [ ] 本地测试 SSH 连接

```bash
# 测试连接
ssh root@your-server-ip
# 或
ssh -i your-key.pem ubuntu@your-server-ip
```

---

### 第 2 步: 配置 DNS (10 分钟)

#### DNS 记录配置

登录域名管理面板，添加 A 记录：

```
记录类型: A
主机记录: api  (或 @, 或其他子域)
记录值: 你的服务器 IP (例: 123.45.67.89)
TTL: 600 秒
```

例如:
- `api.yourdomain.com` → `123.45.67.89`
- `yourdomain.com` → `123.45.67.89`

#### 验证 DNS 生效
```bash
# 等待 5-15 分钟后测试
ping api.yourdomain.com
nslookup api.yourdomain.com
```

---

### 第 3 步: 安装基础软件 (10 分钟)

#### SSH 连接到服务器
```bash
ssh root@your-server-ip
```

#### 更新系统
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### 安装必要软件
```bash
# 安装 nginx
sudo apt-get install -y nginx

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
nginx -v
node -v
npm -v
```

#### 启动 nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

### 第 4 步: 配置 nginx (15 分钟)

#### 删除默认配置
```bash
sudo rm /etc/nginx/sites-enabled/default
```

#### 创建新配置文件
```bash
sudo nano /etc/nginx/sites-available/storage-api
```

粘贴以下内容 (修改域名):

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

    access_log /var/log/nginx/storage-access.log;
    error_log /var/log/nginx/storage-error.log warn;
}
```

保存: `Ctrl+O`, `Enter`, `Ctrl+X`

#### 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/storage-api \
           /etc/nginx/sites-enabled/storage-api

# 测试配置
sudo nginx -t

# 重启 nginx
sudo systemctl restart nginx
```

---

### 第 5 步: 申请 SSL 证书 (10 分钟)

#### 安装 Certbot
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

#### 申请证书
```bash
sudo certbot --nginx -d api.yourdomain.com

# 按提示操作:
# 1. 输入邮箱
# 2. 同意条款 (Y)
# 3. 选择重定向选项 (2 - 重定向 HTTP 到 HTTPS)
```

#### 验证证书
```bash
sudo certbot certificates

# 应该看到:
# Found the following certs:
#   Certificate Name: api.yourdomain.com
#     Domains: api.yourdomain.com
#     Expiry Date: YYYY-MM-DD
```

#### 自动续期测试
```bash
sudo certbot renew --dry-run
```

---

### 第 6 步: 部署存储服务 (15 分钟)

#### 创建应用目录
```bash
mkdir -p /home/app
cd /home/app
```

#### 上传存储服务代码
```bash
# 在本地执行 (PowerShell):
scp mock-storage-service.js root@your-server-ip:/home/app/

# 或从服务器下载:
# ssh root@your-server-ip
# cd /home/app
# wget https://raw.githubusercontent.com/your-repo/mock-storage-service.js
```

#### 安装依赖
```bash
cd /home/app
npm install express
```

#### 启动存储服务
```bash
# 临时启动 (测试)
node mock-storage-service.js

# 或后台启动
nohup node mock-storage-service.js > storage.log 2>&1 &

# 或使用 PM2 (推荐)
npm install -g pm2
pm2 start mock-storage-service.js --name "storage-api"
pm2 startup
pm2 save
```

#### 验证服务
```bash
curl http://127.0.0.1:8080/health
# 应该返回: OK
```

---

### 第 7 步: 测试整个流程 (10 分钟)

#### 本地测试
```bash
# 测试健康检查
curl https://api.yourdomain.com/health

# 测试 API
curl -X POST https://api.yourdomain.com/api/sessions \
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"test-1\", \"jobTitle\": \"Python开发\"}"
```

#### 从不同地点测试
```bash
# 从手机访问
https://api.yourdomain.com/health

# 确保可以从任何地方访问
```

#### 检查日志
```bash
# nginx 日志
sudo tail -f /var/log/nginx/storage-access.log
sudo tail -f /var/log/nginx/storage-error.log

# 存储服务日志
tail -f /home/app/storage.log  # 如果使用 nohup
pm2 logs  # 如果使用 PM2
```

---

### 第 8 步: 更新 Dify 工作流 (15 分钟)

#### 更新工作流 1

打开: https://udify.app/workflow/sNkeofwLHukS3sC2

编辑 Python 代码:

**原代码**:
```python
api_url = "http://localhost/api/sessions"
```

**改为**:
```python
api_url = "https://api.yourdomain.com/api/sessions"
```

保存 → 发布

#### 更新工作流 2 和 3
重复相同步骤

---

### 第 9 步: 完整功能测试 (20 分钟)

#### 测试工作流 1
```bash
node test-workflow1-simple.js

# 应该看到:
# ✅ HTTP 状态: 200
# ✅ session_id: uuid-xxxxx
# ✅ questions: [...]
# ✅ job_title: 正确
```

#### 测试工作流 2 和 3
```bash
node test-workflow2-3.js
```

#### 端到端集成测试
1. 生成问题 (工作流 1)
2. 生成答案 (工作流 2)
3. 评分答案 (工作流 3)

---

### 第 10 步: 监控和维护 (持续)

#### 日志监控
```bash
# 定期检查错误日志
sudo tail -f /var/log/nginx/storage-error.log

# 检查请求日志
sudo tail -f /var/log/nginx/storage-access.log
```

#### 证书监控
```bash
# 检查证书有效期
sudo certbot certificates

# 设置续期提醒 (Certbot 会自动续期)
```

#### 性能监控
```bash
# 检查 nginx 状态
sudo systemctl status nginx

# 检查存储服务状态
pm2 status  # 如果使用 PM2
ps aux | grep node  # 如果直接运行
```

#### 备份配置
```bash
# 定期备份 nginx 配置
sudo cp -r /etc/nginx/sites-available /backup/nginx-config-$(date +%Y%m%d).tar.gz
```

---

## 📊 本地 vs 云服务器配置清单

### 需要改动的
- [ ] nginx 配置中的 `server_name` (本地: localhost → 云: api.yourdomain.com)
- [ ] Dify 工作流中的 API URL (http://localhost → https://api.yourdomain.com)

### 保持不变的
- [x] nginx 反向代理配置 (完全相同)
- [x] 存储服务代码 (完全相同)
- [x] 工作流逻辑 (完全相同)
- [x] 测试脚本 (完全相同)

---

## 🚨 常见问题

### Q1: DNS 改动后多久生效?
**答**: 通常 5-15 分钟，某些情况可能需要 24 小时。

### Q2: SSL 证书需要付费吗?
**答**: 不需要，Let's Encrypt 提供免费证书，Certbot 会自动续期。

### Q3: 如何处理存储服务重启?
**答**: 使用 PM2:
```bash
pm2 start mock-storage-service.js --name "storage-api"
pm2 startup  # 系统启动时自动启动
pm2 save     # 保存配置
```

### Q4: 需要备份数据吗?
**答**: 是的，定期备份:
```bash
# 备份 nginx 配置
sudo tar -czf nginx-backup-$(date +%Y%m%d).tar.gz /etc/nginx

# 备份应用代码
tar -czf app-backup-$(date +%Y%m%d).tar.gz /home/app
```

### Q5: 如何监控性能?
**答**: 查看 nginx 日志中的响应时间和错误率。

---

## ⏱️ 总耗时预估

| 步骤 | 时间 | 说明 |
|------|------|------|
| 准备云服务器 | 30 分钟 | 购买、DNS 配置等 |
| 安装基础软件 | 10 分钟 | nginx, Node.js |
| 配置 nginx | 15 分钟 | 可复用本地配置 |
| 申请 SSL 证书 | 10 分钟 | 自动完成 |
| 部署存储服务 | 15 分钟 | 上传代码、启动 |
| 测试验证 | 10 分钟 | 功能测试 |
| 更新 Dify | 15 分钟 | 修改 URL、发布 |
| **总计** | **2 小时** | 完整迁移 |

---

## 🎯 最佳实践

1. **保持配置一致性**
   - 本地和云使用相同的 nginx 配置
   - 只改必要的参数 (server_name, SSL)

2. **版本控制**
   - 把所有配置文件上传到 Git
   - 便于回滚和审计

3. **自动化部署**
   - 使用 CI/CD (GitHub Actions/GitLab CI)
   - 减少手动步骤和错误

4. **监控告警**
   - 设置日志告警
   - 监控 SSL 证书过期提醒

5. **定期备份**
   - 每周备份配置和数据
   - 以防万一

---

## ✅ 完整检查清单

### 迁移前
- [ ] 本地 nginx 配置修改为通用版本
- [ ] 存储服务代码测试完毕
- [ ] Dify 工作流功能验证通过
- [ ] 备份本地配置

### 迁移中
- [ ] 云服务器购买和 SSH 访问
- [ ] DNS 记录配置完成
- [ ] nginx 安装和配置
- [ ] SSL 证书申请成功
- [ ] 存储服务部署和运行
- [ ] 功能测试完成

### 迁移后
- [ ] Dify 工作流 URL 更新
- [ ] 完整功能验证
- [ ] 日志监控启用
- [ ] 备份流程建立
- [ ] 文档更新

---

**准备好了吗? 现在就可以迁移到云服务器！** ☁️

