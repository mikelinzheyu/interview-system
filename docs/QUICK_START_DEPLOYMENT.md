# 🚀 快速启动指南 - Ngrok 到 Nginx 迁移

**目标**: 在 2-3 小时内完成从 ngrok 到生产级 Nginx 的迁移

---

## 📂 新增/修改的文件清单

```
interview-system/
│
├─ .github/workflows/
│  └─ deploy-storage-service.yml          ✨ 新增：GitHub Actions 自动部署
│
├─ scripts/
│  ├─ deploy-storage-to-cloud.sh          ✨ 新增：Linux/Mac 部署脚本
│  └─ deploy-storage-to-cloud.bat         ✨ 新增：Windows 部署脚本
│
├─ storage-service/
│  ├─ .env.example                        ✨ 新增：本地开发配置示例
│  └─ .env.prod                           ✏️  已存在：生产环境配置
│
├─ NGROK_TO_NGINX_MIGRATION_GUIDE.md      ✨ 新增：完整迁移概述
├─ GITHUB_SECRETS_SETUP.md                ✨ 新增：GitHub Secrets 配置指南
├─ IMPLEMENTATION_STEPS.md                ✨ 新增：逐步实施指南
└─ QUICK_START.md                         ✨ 新增：快速启动（本文件）
```

---

## ⏱️ 时间分配（总计 2-3 小时）

| 步骤 | 时间 | 描述 |
|------|------|------|
| 1️⃣  本地测试 | 30 分钟 | 在本地验证存储服务工作正常 |
| 2️⃣  GitHub 准备 | 20 分钟 | 创建仓库并推送代码 |
| 3️⃣  GitHub Secrets | 20 分钟 | 配置自动部署所需的密钥 |
| 4️⃣  云服务器准备 | 1 小时 | 购买和配置服务器、域名 |
| 5️⃣  自动部署 | 15 分钟 | 推送代码自动部署 |
| 6️⃣  验证 | 15 分钟 | 测试云端服务 |
| 7️⃣  更新 Dify | 15 分钟 | 修改工作流配置 |

---

## 🎯 三步快速开始

### 步骤 1️⃣：本地测试（30 分钟）

```bash
# 1. 进入存储服务目录
cd D:\code7\interview-system\storage-service

# 2. 创建本地 .env 文件
cp .env.example .env

# 3. 启动本地 Docker
docker-compose up -d

# 4. 等待 15 秒，检查状态
docker-compose ps

# 5. 测试 API（在新的 Terminal/PowerShell 中）
curl -X POST http://localhost:8081/api/sessions \
  -H "Authorization: Bearer ak_dev_test_key_12345678901234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-001",
    "jobTitle": "Python开发",
    "questions": [{"id": "q1", "question": "test question", "answer": "test answer"}]
  }'

# 6. 看到 200 响应后，停止容器
docker-compose down
```

✅ **检查点**: API 返回 200 OK

---

### 步骤 2️⃣：GitHub 准备（20 分钟）

```bash
# 1. 创建 GitHub 仓库
# 访问 https://github.com/new
# 仓库名: interview-system
# 可见性: Private
# 创建后会得到 https://github.com/YOUR_USERNAME/interview-system.git

# 2. 本地配置 Git
cd D:\code7\interview-system

git init
git remote add origin https://github.com/YOUR_USERNAME/interview-system.git
git branch -M main

# 3. 检查 .gitignore（确保包含敏感文件）
cat .gitignore | grep -E "\.env|\.env\.prod|dump.rdb"

# 如果没有，添加：
cat >> .gitignore << 'EOF'
.env
.env.prod
.env.local
dump.rdb
EOF

# 4. 推送代码
git add .
git commit -m "Initial commit: Storage service with cloud deployment"
git push -u origin main

# 5. 验证：访问 https://github.com/YOUR_USERNAME/interview-system
# 应该能看到代码已上传
```

✅ **检查点**: 代码在 GitHub 上可见

---

### 步骤 3️⃣：GitHub Secrets（20 分钟）

**准备数据**（在本地运行）：

```bash
# 获取或生成需要的信息

# 1. 云服务器 IP（从云服务商获取）
# 例如: 203.0.113.42

# 2. SSH 用户名（通常是）
# 例如: root

# 3. SSH 私钥（从本地获取）
# Linux/Mac:
cat ~/.ssh/id_rsa

# Windows:
Get-Content $env:USERPROFILE\.ssh\id_rsa

# 4. 生成 Storage API Key (32字符)
openssl rand -base64 32
# 输出: ABCDefghijklmnopqrstuvwxyz123456=

# 5. 生成 Redis 密码 (16字符)
openssl rand -base64 16
# 输出: RedisPassword1234=

# 6. 你的域名
# 例如: storage.interview-system.com
```

**在 GitHub 中添加 Secrets**：

1. 进入 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**

2. 点击 **New repository secret**，逐个添加：

| Secret 名称 | 值 | 示例 |
|-----------|-----|------|
| `CLOUD_SERVER_IP` | 云服务器 IP | `203.0.113.42` |
| `CLOUD_SERVER_USER` | SSH 用户 | `root` |
| `CLOUD_SERVER_KEY` | SSH 私钥（完整） | `-----BEGIN RSA...-----END RSA...` |
| `STORAGE_API_KEY` | 32 字符密钥 | `ak_prod_ABCDef...` |
| `REDIS_PASSWORD` | 16 字符密码 | `RedisPassword...` |
| `DOMAIN_NAME` | 你的域名 | `storage.interview-system.com` |

✅ **检查点**: GitHub 上能看到 6 个加密的 Secrets

---

### 步骤 4️⃣：云服务器和域名（1 小时）

**云服务器**：
```bash
# 从以下选择一个（按推荐度）：
# 1. 阿里云 ECS (¥10/月, 2核2GB)
# 2. 腾讯云 CVM (¥15/月, 2核2GB)
# 3. DigitalOcean (¥40/月, 2GB)

# 获取公网 IP 和 SSH 访问凭证
# 复制到 GitHub Secrets 中
```

**域名**：
```bash
# 从 GoDaddy、Namecheap、阿里云等购买域名
# 在 DNS 管理中添加 A 记录：

# 主机记录: storage
# 记录值: 你的云服务器 IP (203.0.113.42)
# 完整域名: storage.interview-system.com

# 等待 DNS 生效（5-30 分钟）
nslookup storage.interview-system.com
# 应该返回你的 IP
```

✅ **检查点**: `nslookup` 能解析你的域名到正确的 IP

---

### 步骤 5️⃣：自动部署（15 分钟）

```bash
# 1. 做一个小改动触发部署
cd D:\code7\interview-system
echo "# Deployment test" >> storage-service/README.md

# 2. 推送（这会自动触发 GitHub Actions）
git add storage-service/README.md
git commit -m "Trigger cloud deployment"
git push origin main

# 3. 监控部署
# 进入 GitHub → Actions → 看到 "Deploy Storage Service to Cloud" 正在运行

# 4. 等待完成（通常 5-10 分钟）
# 日志应该显示：
# ✓ Build with Maven
# ✓ Build Docker image
# ✓ Deploy to cloud server
# ✓ Health check passed
```

✅ **检查点**: GitHub Actions 工作流成功完成

---

### 步骤 6️⃣：验证云端（15 分钟）

```bash
# 1. SSH 连接到云服务器
ssh root@YOUR_CLOUD_SERVER_IP

# 2. 检查 Docker 容器
docker-compose -f /home/interview-system/storage-service/docker-compose-prod.yml ps

# 应该看到：
# interview-redis        Up 5 minutes
# interview-storage-service   Up 5 minutes

# 3. 测试 HTTPS API（在本地运行）
curl -H "Authorization: Bearer ak_prod_YOUR_KEY" \
  https://storage.interview-system.com/api/sessions

# 应该返回 200 OK

# 4. 查看日志（在云服务器上）
docker-compose logs -f interview-storage-service
```

✅ **检查点**: HTTPS 能访问 API，容器正常运行

---

### 步骤 7️⃣：更新 Dify 工作流（15 分钟）

**对每个工作流（1, 2, 3）**：

1. 打开 Dify 工作流编辑器
2. 找到代码节点中的 ngrok URL
3. 替换为你的新域名：

```python
# 旧
api_url = "https://xxxx-xxxx.ngrok-free.dev/api/sessions"

# 新
api_url = "https://storage.interview-system.com/api/sessions"
```

4. 找到 API Key，替换为新的：

```python
# 旧
api_key = "ak_live_a1b2c3d4e5f6..."

# 新
api_key = "ak_prod_YOUR_NEW_KEY"
```

5. 保存并发布工作流

6. 在 Dify 中测试工作流（生成问题 → 保存 → 加载）

✅ **检查点**: Dify 工作流能成功保存和加载数据

---

## 📋 完整清单

```
✅ 本地测试完成
✅ 代码推送到 GitHub
✅ GitHub Secrets 配置完成
✅ 云服务器购买并配置
✅ 域名购买并配置 DNS
✅ GitHub Actions 自动部署成功
✅ 云端 Docker 容器运行正常
✅ HTTPS API 可访问
✅ Dify 工作流已更新
✅ 工作流测试通过
```

---

## 📚 详细文档

如果需要更多细节，参考：

- **完整迁移方案**: [NGROK_TO_NGINX_MIGRATION_GUIDE.md](./NGROK_TO_NGINX_MIGRATION_GUIDE.md)
- **逐步实施指南**: [IMPLEMENTATION_STEPS.md](./IMPLEMENTATION_STEPS.md)
- **GitHub Secrets 配置**: [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

---

## 🆘 常见问题

### Q: 部署失败了怎么办？
A:
1. 检查 GitHub Actions 日志
2. 查看错误信息（通常是 SSH 密钥或 Secrets 配置有误）
3. 参考 `IMPLEMENTATION_STEPS.md` 中的故障排查部分

### Q: DNS 没有生效怎么办？
A:
```bash
# 1. 等待 5-30 分钟
# 2. 使用 nslookup 检查
nslookup storage.interview-system.com
# 3. 如果还是不行，检查域名 DNS 设置
```

### Q: 我想本地开发测试怎么办？
A:
```bash
# 使用 .env.example 作为 .env
cp storage-service/.env.example storage-service/.env
docker-compose -f storage-service/docker-compose.yml up
# 本地开发地址: http://localhost:8081
```

### Q: 如何回滚到上一个版本？
A:
```bash
git log --oneline
git revert <commit-hash>
git push origin main
# GitHub Actions 会自动重新部署
```

---

## 🎉 下一步

完成以上步骤后，你就有了：

✅ **生产级的存储服务**
- Spring Boot + Redis
- Docker 容器化
- Nginx 反向代理
- HTTPS 加密

✅ **自动化 CI/CD 流程**
- GitHub Actions 自动构建
- 自动推送到云服务器
- 自动健康检查

✅ **稳定的域名服务**
- 替代了不稳定的 ngrok
- 99.9% 可用性
- SSL/TLS 加密

✅ **完整的微服务架构**
- 前端独立开发部署
- 后端独立运行
- 存储服务独立扩展

---

## 📞 需要帮助？

如果遇到问题：

1. 查看相关文档（上面列出的）
2. 检查 GitHub Actions 日志
3. 查看云服务器日志
4. 参考故障排查部分

---

**🚀 祝部署成功！**

有任何问题，随时查看详细文档。

