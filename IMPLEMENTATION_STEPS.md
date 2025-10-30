# 🚀 完整迁移实施指南（逐步执行）

本指南将帮助你从 ngrok 迁移到 Nginx + 云服务器部署。预计需要 2-3 小时。

---

## 📋 前置条件检查

```bash
# 1. 检查 Git
git --version
# 输出示例: git version 2.40.0

# 2. 检查 Docker
docker --version
# 输出示例: Docker version 24.0.0

# 3. 检查 Docker Compose
docker-compose --version
# 输出示例: Docker Compose version 2.20.0
```

如果有任何命令失败，请先安装对应的软件。

---

## 第 1 步：本地测试（30 分钟）

### 1.1 准备本地环境

```bash
# 进入存储服务目录
cd D:\code7\interview-system\storage-service

# 复制环境变量文件（不包含.prod）
cp .env.example .env

# 或在 Windows 上：
copy .env.example .env
```

### 1.2 启动本地 Docker 容器

```bash
# 方式1：使用本地 docker-compose
docker-compose up -d

# 等待 15 秒让服务启动
# 然后检查状态
docker-compose ps

# 输出应该显示：
# interview-redis        running
# interview-storage-service   running
```

### 1.3 测试本地 API

```bash
# 测试 1: 创建会话
curl -X POST http://localhost:8081/api/sessions \
  -H "Authorization: Bearer ak_dev_test_key_12345678901234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-001",
    "jobTitle": "Python开发工程师",
    "questions": [
      {
        "id": "q1",
        "question": "请描述一个复杂的Python项目",
        "answer": "在一个电商平台的后端开发中..."
      }
    ]
  }'

# 预期输出:
# {"sessionId":"test-session-001","message":"Session created successfully","questionCount":1}

# 测试 2: 查询会话
curl -H "Authorization: Bearer ak_dev_test_key_12345678901234567890" \
  http://localhost:8081/api/sessions/test-session-001

# 预期输出:
# {"sessionId":"test-session-001","jobTitle":"Python开发工程师",...}

# 测试 3: 停止本地容器
docker-compose down
```

---

## 第 2 步：GitHub 准备（20 分钟）

### 2.1 创建 GitHub 仓库

1. 访问 [github.com/new](https://github.com/new)
2. **Repository name**: `interview-system`
3. **Description**: `AI Interview System with Storage Service`
4. **Visibility**: Private（推荐）或 Public
5. **不要** 初始化 README（我们已有）
6. 点击 **Create repository**

### 2.2 配置本地 Git

```bash
# 进入项目根目录
cd D:\code7\interview-system

# 初始化 Git（如果还没有）
git init

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/interview-system.git

# 设置默认分支为 main
git branch -M main

# 配置 Git 用户（如果还没有）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2.3 添加敏感文件到 .gitignore

```bash
# 编辑 .gitignore 文件，确保包含
cat >> .gitignore << EOF

# 环境变量（包含敏感信息）
.env
.env.prod
.env.local

# Docker 相关
.dockerignore

# IDE
.idea/
.vscode/
*.swp

# 日志
*.log
logs/

# Redis 快照
dump.rdb

# Maven
target/
!.mvn/wrapper/maven-wrapper.jar
EOF
```

### 2.4 首次推送

```bash
# 添加所有文件（除了 .gitignore 中的）
git add .

# 提交
git commit -m "Initial commit: Add storage service with cloud deployment support

- Add Spring Boot storage service with Redis backend
- Add Docker and Docker Compose configuration
- Add GitHub Actions CI/CD workflow
- Add cloud deployment scripts
- Add Nginx reverse proxy configuration
- Add complete migration guide from ngrok to Nginx"

# 推送到 GitHub
git push -u origin main

# 输出示例：
# Enumerating objects: 125, done.
# Counting objects: 100% (125/125), done.
# Compressing objects: 100% (89/89), done.
# Writing objects: 100% (125/125), ...
# To github.com:YOUR_USERNAME/interview-system.git
#  * [new branch]      main -> main
```

---

## 第 3 步：GitHub Secrets 配置（20 分钟）

### 3.1 生成密钥和密码

```bash
# 在本地 bash/PowerShell 中运行

# 1. 生成 Storage API Key (32字符)
openssl rand -base64 32
# 输出示例: ABCDEFGHIJKLMNOPQRSTUVWXYZabcd1234=

# 2. 生成 Redis 密码 (16字符)
openssl rand -base64 16
# 输出示例: RedisPassword12345=

# 3. 获取 SSH 私钥（Linux/Mac）
cat ~/.ssh/id_rsa

# 4. 获取 SSH 私钥（Windows PowerShell）
Get-Content $env:USERPROFILE\.ssh\id_rsa
```

### 3.2 在 GitHub 中添加 Secrets

1. 进入你的仓库 → **Settings** → **Secrets and variables** → **Actions**

2. 逐个添加以下 6 个 Secrets：

| Secret Name | Value | 备注 |
|------------|-------|------|
| `CLOUD_SERVER_IP` | `203.0.113.42` | 云服务器公网 IP |
| `CLOUD_SERVER_USER` | `root` | SSH 用户名 |
| `CLOUD_SERVER_KEY` | `-----BEGIN RSA PRIVATE KEY-----...` | SSH 私钥（完整） |
| `STORAGE_API_KEY` | `ak_prod_AbCdEf...` | 32 字符密钥 |
| `REDIS_PASSWORD` | `RedisPassword123...` | 16 字符密码 |
| `DOMAIN_NAME` | `storage.interview-system.com` | 你的域名 |

### 3.3 验证 Secrets

```bash
# 检查 GitHub 中的 Secrets 列表
# Settings → Secrets and variables → Actions
# 应该能看到 6 个 secret（显示为加密）

# 在 GitHub Actions 日志中，secret 会显示为 ***
```

---

## 第 4 步：云服务器准备（1 小时）

### 4.1 购买云服务器

选择以下之一：
- **阿里云**: ECS, 2核2GB, 按量付费 (~¥10/月)
- **腾讯云**: CVM, 2核2GB, 按量付费 (~¥15/月)
- **AWS**: EC2 t2.small, 免费额度或按需 (~¥30/月)
- **DigitalOcean**: Droplet, 2GB, ~$6/月

### 4.2 配置云服务器

```bash
# 通过 SSH 连接到云服务器
ssh root@YOUR_CLOUD_SERVER_IP

# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y git curl wget

# 登出
exit
```

### 4.3 购买和配置域名

1. 购买域名（如果还没有）
   - GoDaddy, Namecheap, 阿里云等

2. 配置 DNS
   - 域名管理后台 → DNS 设置
   - 添加 A 记录:
     - 主机记录: `storage`（或其他前缀）
     - 记录值: 你的云服务器公网 IP
     - 例如: `storage.interview-system.com` → `203.0.113.42`

3. 等待 DNS 生效（通常 5-30 分钟）

```bash
# 验证 DNS 是否生效
nslookup storage.interview-system.com
# 或
dig storage.interview-system.com

# 应该显示你的云服务器 IP
```

---

## 第 5 步：自动部署（15 分钟）

### 5.1 推送代码触发自动部署

```bash
# 在本地项目目录中
cd D:\code7\interview-system

# 修改某个文件（如 storage-service 中的任何文件）
echo "# Updated" >> storage-service/README.md

# 提交并推送
git add storage-service/README.md
git commit -m "Trigger deployment to cloud"
git push origin main
```

### 5.2 监控 GitHub Actions

1. 进入你的仓库 → **Actions** 标签
2. 看到 **Deploy Storage Service to Cloud** 工作流运行
3. 点击进去查看详细日志

日志应该显示：
```
✓ Build with Maven
✓ Build Docker image
✓ Deploy to cloud server
✓ Health check
```

### 5.3 等待部署完成

- 首次部署通常需要 5-10 分钟
- Docker 构建、推送、启动都需要时间
- 监控日志的最后一条消息应该是 "✅ 云服务器存储服务健康检查通过"

---

## 第 6 步：验证云服务器部署（15 分钟）

### 6.1 检查容器状态

```bash
# SSH 连接到云服务器
ssh root@YOUR_CLOUD_SERVER_IP

# 检查 Docker 容器
docker-compose -f /home/interview-system/storage-service/docker-compose-prod.yml ps

# 预期输出：
# CONTAINER ID  IMAGE                           STATUS
# ...          interview-storage-service        Up 2 minutes
# ...          interview-redis                  Up 2 minutes
```

### 6.2 测试 HTTPS 连接

```bash
# 在本地运行
curl -H "Authorization: Bearer YOUR_STORAGE_API_KEY" \
  https://storage.interview-system.com/api/sessions

# 预期输出（200 OK）：
# {"sessionId":"...","questions":[]}

# 或者在浏览器中访问
# https://storage.interview-system.com/api/sessions
# (会返回 401 因为没有 API Key，这是正常的)
```

### 6.3 检查 Nginx 日志

```bash
# SSH 连接到云服务器
ssh root@YOUR_CLOUD_SERVER_IP

# 查看 Nginx 日志
tail -f /var/log/nginx/storage-service-access.log

# 应该看到你的 API 请求
```

---

## 第 7 步：更新 Dify 工作流（15 分钟）

### 7.1 在 Dify 中修改工作流

对于每个工作流（Workflow1, Workflow2, Workflow3）：

1. 登录 Dify
2. 找到工作流的代码节点（通常是 Python 代码块）
3. 查找 `ngrok` 的 URL 地址，替换为你的新域名：

```python
# 旧地址（删除）
api_url = "https://xxxx-xxxx.ngrok-free.dev/api/sessions"

# 新地址（替换为）
api_url = "https://storage.interview-system.com/api/sessions"

# 或者使用环境变量
api_url = os.environ.get('STORAGE_API_URL', 'https://storage.interview-system.com/api/sessions')
```

### 7.2 更新 API Key

工作流中的 API Key 也需要更新为你新设置的 key：

```python
# 旧 Key（删除）
api_key = "ak_live_a1b2c3d4e5f6..."

# 新 Key（替换为）
api_key = "ak_prod_your_new_key_here"

# 或者使用环境变量
api_key = os.environ.get('STORAGE_API_KEY')
```

### 7.3 测试工作流

1. 在 Dify 中手动运行工作流
2. 检查是否能成功保存和加载数据

---

## 第 8 步：持续集成和监控（持续）

### 8.1 设置自动化健康检查

```bash
# GitHub Actions 会自动检查，但你也可以手动检查
curl -H "Authorization: Bearer $STORAGE_API_KEY" \
  https://storage.interview-system.com/api/sessions

# 或在云服务器上
ssh root@YOUR_CLOUD_SERVER_IP
docker-compose -f docker-service/docker-compose-prod.yml logs -f
```

### 8.2 定期备份 Redis

```bash
# 在云服务器上创建备份
ssh root@YOUR_CLOUD_SERVER_IP

# 备份 Redis
docker-compose exec interview-redis redis-cli -a $REDIS_PASSWORD bgsave

# 复制备份文件
docker cp interview-redis:/data/dump.rdb ~/redis-backup-$(date +%Y%m%d).rdb

# 下载到本地
scp root@YOUR_CLOUD_SERVER_IP:~/redis-backup-*.rdb ./backups/
```

### 8.3 监控日志

```bash
# 查看存储服务日志
ssh root@YOUR_CLOUD_SERVER_IP
docker-compose logs -f interview-storage-service

# 查看 Redis 日志
docker-compose logs -f interview-redis

# 查看 Nginx 日志
tail -f /var/log/nginx/storage-service-*.log
```

---

## ✅ 完成检查清单

```
第 1 步 - 本地测试:
  ☐ Docker 本地容器运行成功
  ☐ API 能成功创建和查询会话
  ☐ 本地容器已停止

第 2 步 - GitHub 准备:
  ☐ GitHub 仓库已创建
  ☐ 本地代码已初始化 Git
  ☐ 代码已推送到 GitHub main 分支
  ☐ .gitignore 包含 .env 和 .env.prod

第 3 步 - Secrets 配置:
  ☐ 6 个 GitHub Secrets 已添加
  ☐ CLOUD_SERVER_IP, USER, KEY 已验证可用
  ☐ API Key 和 Redis 密码已生成
  ☐ DOMAIN_NAME 已设置

第 4 步 - 云服务器:
  ☐ 云服务器已购买和开通
  ☐ SSH 密钥已配置
  ☐ 域名已购买
  ☐ DNS A 记录已指向服务器 IP
  ☐ 服务器防火墙已开放 80, 443, 22 端口

第 5 步 - 自动部署:
  ☐ GitHub Actions 工作流文件存在
  ☐ 首次推送触发了部署
  ☐ 部署日志显示成功完成
  ☐ 云服务器 Docker 容器已启动

第 6 步 - 验证部署:
  ☐ curl 访问 HTTPS API 返回 200
  ☐ Nginx 日志显示请求
  ☐ Docker 容器都在运行状态
  ☐ Redis 连接正常

第 7 步 - Dify 更新:
  ☐ Workflow1 API 地址已更新
  ☐ Workflow2 API 地址已更新
  ☐ Workflow3 API 地址已更新
  ☐ API Key 已更新为新的生产 key
  ☐ 工作流测试成功

第 8 步 - 监控:
  ☐ 日志监控设置完成
  ☐ 备份脚本已创建
  ☐ 定期检查工作流运行状态
```

---

## 🆘 故障排查

### 问题：GitHub Actions 失败

**日志**: `Failed to connect to cloud server`

**解决**:
```bash
# 1. 检查 SSH 密钥是否正确
# 2. 检查 Cloud Server IP 是否正确
# 3. 尝试本地 SSH 连接
ssh -i /path/to/private/key root@YOUR_IP
```

### 问题：Docker 容器启动失败

**日志**: `Container exited with code 1`

**解决**:
```bash
# SSH 连接到云服务器
ssh root@YOUR_IP

# 查看日志
docker-compose logs interview-storage-service

# 检查配置文件
cat .env.prod

# 重启容器
docker-compose restart
```

### 问题：HTTPS 连接失败

**症状**: `curl: (51) unable to get local issuer certificate`

**解决**:
```bash
# 等待 SSL 证书生效（通常 5-10 分钟）
# 检查证书
ssh root@YOUR_IP
ls -la /etc/letsencrypt/live/

# 查看 Nginx 配置
nginx -t
```

### 问题：Dify 工作流返回 401

**症状**: `Authorization failed` 或 `Invalid API key`

**解决**:
```bash
# 1. 检查 API Key 是否正确
# 2. 验证格式: Authorization: Bearer YOUR_KEY
# 3. 确认 Dify 中的 URL 和 Key 已更新

# 测试
curl -H "Authorization: Bearer YOUR_KEY" \
  https://storage.interview-system.com/api/sessions
```

---

## 📞 更多帮助

- **GitHub Actions 文档**: https://docs.github.com/actions
- **Docker 文档**: https://docs.docker.com/
- **Nginx 文档**: https://nginx.org/en/docs/
- **阿里云 ECS**: https://help.aliyun.com/product/25365.html
- **腾讯云 CVM**: https://cloud.tencent.com/document/product/213

---

## 🎉 恭喜！

你已经成功地：
1. ✅ 将存储服务容器化
2. ✅ 设置了完整的 CI/CD 流程
3. ✅ 从临时的 ngrok 迁移到生产级的 Nginx
4. ✅ 实现了自动化部署

现在你的系统已经准备好进行生产环境的规模化使用！

