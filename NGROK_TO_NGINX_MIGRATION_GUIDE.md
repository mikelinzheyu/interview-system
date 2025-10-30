# 🚀 Ngrok 替换方案 + GitHub 云服务器部署指南

**目标**：将临时的 ngrok 方案替换为生产级的 Nginx + 云服务器部署

**时间**：预计 2-3 小时完成全部步骤

---

## 第一步：架构变更

### Before (当前方案)
```
本地开发
  ├─ 前端 (5174)
  ├─ 后端 (3001)
  └─ 存储服务 (8000)
       ↓ ngrok tunnel
       ↓ 临时公网 URL (不稳定)
Dify 工作流 ←→ ngrok URL
```

### After (新方案)
```
GitHub Repository
  ↓
GitHub Actions (自动部署)
  ↓
云服务器 (持久稳定)
  ├─ Nginx (反向代理 + SSL)
  ├─ Redis (缓存)
  └─ Storage Service (Java Spring Boot)

前端 (本地 5174) ←→ 后端 (本地 3001)
                ↓
         通过代理访问云存储服务

Dify 工作流 ←→ https://storage.your-domain.com (稳定)
```

---

## 第二步：准备工作

### 2.1 购买云服务器
- 推荐：阿里云/腾讯云/AWS (最少配置：2核2GB内存)
- 操作系统：Ubuntu 20.04 LTS
- 开放端口：80, 443, 22 (SSH)

### 2.2 购买域名并配置DNS
```
域名 → DNS 管理 → 添加 A 记录
记录值：云服务器公网IP
例如：storage.interview-system.com → 1.2.3.4
```

### 2.3 生成 SSL 证书
```bash
# 在云服务器上运行
sudo apt update && sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d storage.interview-system.com
```

---

## 第三步：修改存储服务配置

### 3.1 新增生产环境配置文件
```bash
storage-service/
├─ .env.prod (已存在)
├─ application-prod.yml (新建)
├─ .env.github (新建 - GitHub Secrets)
└─ docker-compose-prod.yml (修改)
```

### 3.2 关键配置变更

**之前**（ngrok方式）：
```
DIFY_CALLBACK_URL = https://xxxx-xx.ngrok-free.dev/api/sessions
```

**现在**（Nginx方式）：
```
DIFY_CALLBACK_URL = https://storage.interview-system.com/api/sessions
STORAGE_API_DOMAIN = https://storage.interview-system.com
STORAGE_API_KEY = ak_prod_xxxxx (强密码)
REDIS_PASSWORD = redis-prod-password (强密码)
```

---

## 第四步：配置 GitHub 自动部署

### 4.1 GitHub Secrets 配置
```
Settings → Secrets and variables → Actions

需要添加的Secrets:
- CLOUD_SERVER_IP (云服务器IP)
- CLOUD_SERVER_USER (SSH用户名，通常是root)
- CLOUD_SERVER_KEY (SSH私钥)
- STORAGE_API_KEY (API密钥)
- REDIS_PASSWORD (Redis密码)
- DOMAIN_NAME (域名)
```

### 4.2 创建 GitHub Actions 工作流
```
.github/workflows/
├─ deploy-storage-service.yml (自动构建+部署)
└─ health-check.yml (定期健康检查)
```

---

## 第五步：本地推送到 GitHub

```bash
# 1. 在GitHub创建Repository
# https://github.com/new
# 仓库名：interview-system

# 2. 本地初始化
cd D:\code7\interview-system
git init
git remote add origin https://github.com/YOUR_USERNAME/interview-system.git

# 3. 推送代码
git add .
git commit -m "Initial commit: Add storage service with production deployment"
git push -u origin main
```

---

## 第六步：云服务器部署

### 6.1 一键部署脚本
```bash
# 在云服务器上运行
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/interview-system/main/scripts/deploy-storage.sh | bash
```

### 6.2 手动部署（如果一键脚本失败）
```bash
ssh root@你的云服务器IP

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 克隆仓库
git clone https://github.com/YOUR_USERNAME/interview-system.git
cd interview-system/storage-service

# 配置环境变量
cat > .env.prod << EOF
REDIS_PASSWORD=your-secure-redis-password
STORAGE_API_KEY=ak_prod_your_secure_key
SPRING_PROFILES_ACTIVE=prod
TZ=Asia/Shanghai
EOF

# 启动服务
docker-compose -f docker-compose-prod.yml up -d

# 验证
docker-compose ps
curl -H "Authorization: Bearer ak_prod_your_secure_key" https://storage.interview-system.com/api/sessions
```

---

## 第七步：更新 Workflow 配置

### 7.1 Dify 中修改 API 地址

**旧地址**（需要替换）：
```
https://xxxx-xxxx.ngrok-free.dev/api/sessions
```

**新地址**（替换为）：
```
https://storage.interview-system.com/api/sessions
```

### 7.2 在所有工作流中更新
- Workflow1：保存问题时的 API 地址
- Workflow2：保存答案时的 API 地址
- Workflow3：加载答案时的 API 地址

---

## 检查清单

```
部署前:
  ☐ GitHub 账号已创建
  ☐ 云服务器已购买并获得公网IP
  ☐ 域名已购买并指向服务器IP
  ☐ SSH密钥已配置
  ☐ 本地代码已提交到GitHub

部署中:
  ☐ GitHub Actions 工作流配置完成
  ☐ Cloud Secrets 已设置
  ☐ 云服务器 Docker 已安装
  ☐ SSL 证书已获取
  ☐ Nginx 配置已生效

部署后:
  ☐ 存储服务 Docker 容器运行正常
  ☐ Redis 连接成功
  ☐ HTTPS 访问正常 (curl https://...)
  ☐ API Key 认证生效
  ☐ Dify 工作流 API 地址已更新
  ☐ 工作流1/2/3 测试成功
  ☐ 数据成功保存到 Redis
```

---

## 成本对比

| 方案 | 稳定性 | 成本 | 维护 |
|------|--------|------|------|
| **Ngrok** | ⚠️ 低 (易断线) | 免费/¥99/月 | 低 |
| **Nginx + 云服务器** | ✅ 高 (99.9%) | ¥10-50/月 | 中 |
| **Nginx + CDN** | ✅ 极高 | ¥50-200/月 | 高 |

推荐选择：**Nginx + 云服务器** (最佳成本效益)

---

## 常见问题

**Q: 如何回滚到 ngrok？**
A: Git 切换到之前的分支即可，但不推荐

**Q: 如何更新存储服务代码？**
A:
```bash
git push origin main
# GitHub Actions 自动触发，自动构建和部署
```

**Q: 云服务器域名更换了怎么办？**
A:
```bash
# 更新 GitHub Secrets
# 重新运行 GitHub Actions 工作流
```

**Q: 如何监控存储服务状态？**
A:
```bash
# 方案1：使用 GitHub Actions 定期健康检查
# 方案2：使用云服务商的监控面板
# 方案3：配置 Nginx 访问日志告警
```

---

**预计完成时间**: 2-3 小时

**需要帮助**: 遇到问题请查看对应的详细文档或日志

