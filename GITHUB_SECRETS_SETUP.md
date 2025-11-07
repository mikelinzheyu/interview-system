# GitHub Actions Secrets 配置快速参考

## 📋 需要配置的Secrets列表

在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中添加以下Secrets：

### 🔐 阿里云容器仓库认证（必需）

```
名称: ALIYUN_REGISTRY_USERNAME
值: your-aliyun-username@example.com
说明: 阿里云容器仓库登录用户名（邮箱或用户名）

名称: ALIYUN_REGISTRY_PASSWORD
值: your-aliyun-password-or-token
说明: 阿里云容器仓库登录密码或访问令牌
```

**获取方式:**
1. 访问 https://cr.console.aliyun.com
2. 左侧菜单 → **访问凭证**
3. 复制或创建访问密钥

### 🔑 生产服务器SSH连接信息（必需）

```
名称: DEPLOY_HOST
值: 47.76.110.106
说明: 生产服务器公网IP地址

名称: DEPLOY_USER
值: root
说明: SSH登录用户名（通常是root）

名称: DEPLOY_PORT
值: 22
说明: SSH连接端口（默认22）

名称: DEPLOY_PATH
值: /opt/interview-system
说明: 在服务器上的部署目录

名称: DEPLOY_PRIVATE_KEY
值: -----BEGIN RSA PRIVATE KEY-----
     ... (你的私钥内容) ...
     -----END RSA PRIVATE KEY-----
说明: SSH私钥（见下方生成方式）
```

---

## 🔑 生成SSH密钥对

### 步骤1: 在本地生成密钥

```bash
# 在你的本地电脑上运行
ssh-keygen -t rsa -b 4096 -f ~/.ssh/interview_deploy -N ""

# 这会生成两个文件：
# ~/.ssh/interview_deploy (私钥)
# ~/.ssh/interview_deploy.pub (公钥)
```

### 步骤2: 获取私钥内容

```bash
# 显示私钥内容（复制整个输出到DEPLOY_PRIVATE_KEY）
cat ~/.ssh/interview_deploy
```

**输出示例:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890...
...
-----END RSA PRIVATE KEY-----
```

### 步骤3: 将公钥添加到服务器

```bash
# 方式1: 使用ssh-copy-id（推荐）
ssh-copy-id -i ~/.ssh/interview_deploy.pub root@47.76.110.106

# 方式2: 手动添加
cat ~/.ssh/interview_deploy.pub | ssh root@47.76.110.106 "cat >> ~/.ssh/authorized_keys"

# 方式3: 直接编辑服务器
# 登录服务器后，编辑 ~/.ssh/authorized_keys，添加公钥内容
```

### 步骤4: 验证SSH连接

```bash
# 测试SSH连接是否正常
ssh -i ~/.ssh/interview_deploy -p 22 root@47.76.110.106 "echo 'SSH connection successful'"

# 应该输出: SSH connection successful
```

---

## ✅ Secrets配置检查清单

在GitHub仓库中验证所有Secrets都已正确添加：

```
☐ ALIYUN_REGISTRY_USERNAME     ← 阿里云用户名
☐ ALIYUN_REGISTRY_PASSWORD     ← 阿里云密码
☐ DEPLOY_HOST                   ← 服务器IP (47.76.110.106)
☐ DEPLOY_USER                   ← SSH用户名 (root)
☐ DEPLOY_PORT                   ← SSH端口 (22)
☐ DEPLOY_PATH                   ← 部署目录 (/opt/interview-system)
☐ DEPLOY_PRIVATE_KEY           ← SSH私钥
```

---

## 🚀 部署流程验证

### 第一次手动测试

```bash
# 1. 登录GitHub Actions查看工作流
# https://github.com/mikelinzheyu/interview-system/actions

# 2. 在本地提交代码触发自动部署
git add .
git commit -m "chore: 配置生产部署"
git push origin main

# 3. 观看GitHub Actions构建过程
# - 构建前端镜像 (5-10分钟)
# - 构建后端镜像 (5-10分钟)
# - 推送到阿里云 (2-5分钟)
# - 部署到生产服务器 (3-5分钟)

# 4. 验证部署
curl -I https://viewself.cn/
curl -I https://viewself.cn/api/health
```

### 监控部署日志

```bash
# 在GitHub Actions中查看详细日志
# 1. 打开 https://github.com/mikelinzheyu/interview-system/actions
# 2. 点击最新的工作流运行
# 3. 查看各个步骤的详细日志

# 或在服务器上查看
ssh root@47.76.110.106
cd /opt/interview-system
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📝 环境变量配置

### 服务器上的.env.prod配置

**关键配置项（必须修改）:**

```bash
# 数据库密码 - 使用强密码
DB_PASSWORD=YourStrongDBPassword123!@#

# Redis密码 - 使用强密码
REDIS_PASSWORD=YourStrongRedisPassword123!@#

# JWT密钥 - 最少32个字符的随机字符串
JWT_SECRET=generate-a-strong-random-string-minimum-32-chars

# Dify AI配置 - 从https://dify.ai获取
DIFY_API_KEY=your-actual-dify-api-key-here
DIFY_WORKFLOW_1_ID=workflow-id-1
DIFY_WORKFLOW_2_ID=workflow-id-2
DIFY_WORKFLOW_3_ID=workflow-id-3

# Grafana管理员密码
GRAFANA_PASSWORD=YourStrongGrafanaPassword123!@#

# 域名配置
DOMAIN=viewself.cn
API_BASE_URL=https://viewself.cn/api
```

---

## 🔄 持续集成/持续部署流程

### 自动化工作流触发时机

```
GitHub Actions 工作流：build-deploy.yml

触发事件:
✓ 每次push到main分支自动触发
✓ 可以手动触发（Actions标签页）

工作流步骤:
1. 检出代码 (checkout)
2. 设置Docker Buildx
3. 登录阿里云容器仓库
4. 构建前端镜像 + 推送
5. 构建后端镜像 + 推送
6. 构建存储服务镜像 + 推送
7. 连接到生产服务器
8. 拉取新镜像
9. 重启容器
10. 验证部署
```

---

## 🆘 常见问题

### Q: 如何重新生成SSH密钥？

```bash
# 删除旧密钥
rm ~/.ssh/interview_deploy*

# 重新生成
ssh-keygen -t rsa -b 4096 -f ~/.ssh/interview_deploy -N ""

# 添加到服务器
ssh-copy-id -i ~/.ssh/interview_deploy.pub root@47.76.110.106

# 更新GitHub Secret (DEPLOY_PRIVATE_KEY)
```

### Q: 如何测试GitHub Actions工作流？

```bash
# 方法1: 在GitHub Web界面手动运行
# 1. 打开Actions标签页
# 2. 选择工作流
# 3. 点击"Run workflow"按钮

# 方法2: 通过提交代码触发
git commit --allow-empty -m "test: trigger workflow"
git push origin main
```

### Q: 部署失败怎么办？

```bash
# 1. 查看GitHub Actions日志
# https://github.com/mikelinzheyu/interview-system/actions

# 2. 查看生产服务器日志
ssh root@47.76.110.106
cd /opt/interview-system
docker-compose -f docker-compose.prod.yml logs -f

# 3. 手动部署测试
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Q: 如何修改镜像仓库地址？

如果你的阿里云镜像仓库地址不同，更新以下文件：

```bash
# 1. 编辑docker-compose.prod.yml
# 将所有镜像地址改为你的仓库地址

# 2. 编辑.github/workflows/build-deploy.yml
# 更新REGISTRY和REGISTRY_NAMESPACE变量
```

---

## 📞 需要帮助？

1. **检查GitHub Actions日志**: https://github.com/mikelinzheyu/interview-system/actions
2. **查看部署指南**: 见 DEPLOYMENT_GUIDE.md
3. **检查服务器状态**: `ssh root@47.76.110.106`

---

**完成配置后，每次push到main分支都会自动部署！** 🚀
