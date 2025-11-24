# 部署验证清单 - GitHub Actions 自动化部署

本文档提供完整的部署验证流程，确保所有必要条件都已满足。

---

## 📋 Part 1: GitHub Secrets 配置验证

### 必须配置的 5 个 Secrets

根据 `.github/workflows/build-deploy.yml` 的要求，以下 Secrets 必须在 GitHub 仓库中配置：

| Secret 名称 | 用途 | 类型 | 示例 | 检查清单 |
|-----------|------|------|------|---------|
| `DEPLOY_PRIVATE_KEY` | SSH 私钥，用于连接生产服务器 | Secret（密文） | `-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----` | [ ] |
| `DEPLOY_HOST` | **生产服务器 IP 地址或域名** | 明文 | `123.45.67.89` 或 `prod.example.com` | [ ] |
| `DEPLOY_USER` | SSH 登录用户名 | 明文 | `ubuntu` | [ ] |
| `DEPLOY_PORT` | SSH 连接端口（默认 22） | 明文 | `22` | [ ] |
| `DEPLOY_PATH` | 服务器上的部署目录 | 明文 | `/home/ubuntu/interview-system` | [ ] |
| `ALIYUN_REGISTRY_USERNAME` | 阿里云容器仓库用户名 | 明文 | `1234567890` | [ ] |
| `ALIYUN_REGISTRY_PASSWORD` | 阿里云容器仓库密码 | Secret（密文） | `mypassword123` | [ ] |

### 关键提醒 ⚠️

**上一次部署失败的原因**：`DEPLOY_HOST` Secret 为空

```
错误信息：ssh: Could not resolve hostname : Name or service not known
```

这说明在 SSH 连接时，服务器地址（hostname）为空。请确保：
- `DEPLOY_HOST` 不为空
- `DEPLOY_HOST` 是有效的 IP 地址或域名
- 该服务器可从互联网访问（不在防火墙后）

---

## ✅ Part 2: 前置条件验证

### 本地代码库检查

确保以下文件都已正确提交到 Git：

```bash
# 检查关键文件是否被追踪
git ls-files | grep -E "(docker-compose.prod.yml|nginx.conf|Dockerfile)"
```

**必须存在的文件**：

- [ ] `.github/workflows/build-deploy.yml` - 主工作流文件
- [ ] `.github/workflows/deploy-interview-system-service.yml` - 存储服务工作流
- [ ] `frontend/Dockerfile` - 前端容器配置
- [ ] `backend/Dockerfile` - 后端容器配置
- [ ] `backend-java/Dockerfile` - 存储服务容器配置
- [ ] `docker-compose.prod.yml` - 生产环境编排文件
- [ ] `nginx.conf` - Nginx 反向代理配置
- [ ] `.gitignore` - Git 忽略配置（已修复，不再排除前端源文件）
- [ ] `GITHUB_SECRETS_CONFIGURATION.md` - Secrets 配置指南
- [ ] `DEPLOYMENT_VERIFICATION_CHECKLIST.md` - 本文件

### 检查 Git 状态

```bash
# 确保所有关键文件都已提交
git status

# 如果有未追踪的文件，执行：
git add GITHUB_SECRETS_CONFIGURATION.md DEPLOYMENT_VERIFICATION_CHECKLIST.md
git commit -m "docs: Add deployment verification guides"
git push origin main
```

---

## 🔄 Part 3: 工作流程流程图

### GitHub Actions 自动化流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Push 代码到 main 分支 (git push origin main)            │
│    或手动触发: Actions → build-deploy.yml → Run workflow   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Build & Push Job (ubuntu-latest 上运行)                 │
│    - 检出代码 (Checkout)                                    │
│    - 设置 Docker Buildx                                     │
│    - 登录阿里云容器仓库 (使用 ALIYUN_REGISTRY_USERNAME)     │
│    - 构建前端镜像 (frontend/Dockerfile)                     │
│    - 推送前端镜像到阿里云 (ai_interview_frontend:latest)    │
│    - 构建后端镜像 (backend/Dockerfile)                      │
│    - 推送后端镜像到阿里云 (ai_interview_backend:latest)     │
│    - 构建存储镜像 (backend-java/Dockerfile)                 │
│    - 推送存储镜像到阿里云 (ai_interview_storage:latest)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Deploy Job (依赖 build-and-push 成功)                    │
│    - 设置 SSH 连接 (使用 DEPLOY_PRIVATE_KEY)               │
│    - 连接到服务器 (DEPLOY_USER@DEPLOY_HOST:DEPLOY_PORT)    │
│    - 克隆/更新代码仓库                                      │
│    - 登录阿里云容器仓库                                     │
│    - 拉取最新镜像                                           │
│    - 停止旧容器 (docker-compose down)                       │
│    - 启动新容器 (docker-compose up -d)                      │
│    - 验证部署 (检查应用可访问性)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │ ✅ 部署成功或❌ 失败   │
           │ 查看日志诊断问题       │
           └───────────────────────┘
```

---

## 🚀 Part 4: 手动部署步骤（调试用）

如果自动化部署失败，可以手动执行以下步骤：

### 步骤 1: 验证本地代码

```bash
cd /path/to/interview-system

# 检查 Git 状态
git status

# 如果有未提交的改动，提交并推送
git add .
git commit -m "fix: Prepare for deployment"
git push origin main
```

### 步骤 2: 手动触发 GitHub Actions

1. 访问：https://github.com/mikelinzheyu/interview-system/actions
2. 选择 "CI/CD - Build & Deploy to Aliyun" 工作流
3. 点击 "Run workflow" 按钮
4. 选择 "main" 分支
5. 点击 "Run workflow"

### 步骤 3: 监控工作流执行

在 Actions 标签页：
1. 观察 "build-and-push" job 的进度
   - 应该看到三个镜像的构建和推送日志
   - 镜像推送到：`crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/*:latest`

2. 观察 "deploy" job 的进度（等待 build-and-push 完成）
   - 应该看到 SSH 连接日志
   - 应该看到容器启动日志

### 步骤 4: 验证部署成功

```bash
# SSH 连接到服务器并检查容器状态
ssh -i ~/.ssh/deploy_key ubuntu@your.server.ip

# 在服务器上执行
docker-compose -f /home/ubuntu/interview-system/docker-compose.prod.yml ps

# 应该看到 5 个容器都在运行：
# - interview-db (PostgreSQL)
# - interview-redis (Redis)
# - interview-backend (Node.js API)
# - interview-frontend (Vue.js)
# - interview-nginx (Nginx 反向代理)
```

---

## 🔍 Part 5: 常见问题诊断

### 问题 1: SSH 连接失败

**错误信息**：
```
ssh: Could not resolve hostname : Name or service not known
```

**原因**：`DEPLOY_HOST` Secret 为空或无效

**解决方案**：
1. 访问 https://github.com/mikelinzheyu/interview-system/settings/secrets/actions
2. 检查 `DEPLOY_HOST` Secret 是否存在且不为空
3. 确保值是有效的 IP 地址（如 `123.45.67.89`）或域名（如 `prod.example.com`）
4. 重新手动触发工作流

### 问题 2: SSH 认证失败

**错误信息**：
```
Permission denied (publickey)
```

**原因**：`DEPLOY_PRIVATE_KEY` 格式错误或服务器上的公钥不匹配

**解决方案**：
1. 验证本地 SSH 密钥：
   ```bash
   cat ~/.ssh/id_rsa
   ```
2. 确保密钥包含 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`
3. 验证服务器上的公钥：
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@your.server.ip
   cat ~/.ssh/authorized_keys
   ```
4. 如果公钥不在列表中，添加它：
   ```bash
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   ```

### 问题 3: Docker 镜像构建失败

**错误信息**：
```
docker build failed
```

**常见原因**：
- 前端源文件缺失（已通过修复 `.gitignore` 解决）
- Node.js 依赖安装失败
- 后端配置文件缺失

**解决方案**：
1. 检查 GitHub Actions 日志中的具体错误信息
2. 本地测试构建：
   ```bash
   # 测试前端构建
   cd frontend && npm install && npm run build

   # 测试后端构建
   cd backend && npm install
   ```

### 问题 4: 阿里云认证失败

**错误信息**：
```
unauthorized: authentication required
```

**原因**：`ALIYUN_REGISTRY_USERNAME` 或 `ALIYUN_REGISTRY_PASSWORD` 错误

**解决方案**：
1. 访问 https://cr.console.aliyun.com（需要登录阿里云账号）
2. 进入 "个人实例" 或 "企业实例"
3. 点击左侧 "访问凭证"
4. 验证用户名和密码
5. 如果忘记密码，点击 "设置新密码" 生成新密码
6. 更新 GitHub Secrets 中的 `ALIYUN_REGISTRY_PASSWORD`

### 问题 5: 容器启动失败

**症状**：容器在 docker-compose up 后几秒内停止运行

**诊断步骤**：
```bash
# SSH 连接到服务器
ssh ubuntu@your.server.ip

# 查看容器日志
docker logs interview-backend
docker logs interview-frontend
docker logs interview-nginx

# 查看容器启动详情
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

---

## 🔐 Part 6: 安全检查清单

在部署到生产环境前，确保：

- [ ] `DEPLOY_PRIVATE_KEY` 不包含多余的空格或换行符
- [ ] `DEPLOY_USER` 不是 root（推荐使用 ubuntu 或其他非 root 用户）
- [ ] `DEPLOY_HOST` 不是内网 IP（GitHub Actions 无法访问内网）
- [ ] `ALIYUN_REGISTRY_PASSWORD` 已被 GitHub 加密存储
- [ ] SSH 密钥文件的权限正确（chmod 600）
- [ ] 所有 Secrets 都是最新的，没有过期凭证

---

## 📝 Part 7: 部署记录

### 部署历史

| 日期 | 触发方式 | 构建结果 | 部署结果 | 备注 |
|------|--------|--------|--------|------|
| 2025-11-24 | 自动（push） | ❌ 失败 | ❌ 跳过 | SSH 连接失败，DEPLOY_HOST 为空 |
| | | | | |
| | | | | |

### 故障排查记录

| 时间 | 问题 | 原因 | 解决方案 | 状态 |
|------|------|------|---------|------|
| 2025-11-24 | Docker 镜像构建失败 | .gitignore 过度排除前端源文件 | 删除 .gitignore 中的前端源目录排除规则，重新提交 30 个文件 | ✅ 已解决 |
| 2025-11-24 | SSH 连接失败 | DEPLOY_HOST Secret 为空 | 需要在 GitHub UI 中配置所有 7 个 Secrets | ⏳ 待完成 |

---

## 🎯 最后一步：开始部署

完成以下步骤即可启动自动化部署：

1. **完成 Secrets 配置**
   - 访问：https://github.com/mikelinzheyu/interview-system/settings/secrets/actions
   - 按照 `GITHUB_SECRETS_CONFIGURATION.md` 配置所有 7 个 Secrets

2. **提交本检查清单**
   ```bash
   git add DEPLOYMENT_VERIFICATION_CHECKLIST.md
   git commit -m "docs: Add deployment verification checklist"
   git push origin main
   ```

3. **手动触发部署**
   - 访问：https://github.com/mikelinzheyu/interview-system/actions
   - 选择 "CI/CD - Build & Deploy to Aliyun"
   - 点击 "Run workflow"
   - 选择 "main" 分支并运行

4. **监控部署进度**
   - 观察 GitHub Actions 日志
   - 等待约 10-15 分钟完成

5. **验证应用是否上线**
   - 访问：https://viewself.cn
   - 检查后端 API：https://viewself.cn/api/health

---

**祝部署顺利！** 🚀

如有任何问题，请查阅本文档的问题诊断部分，或检查 GitHub Actions 日志获取详细错误信息。
