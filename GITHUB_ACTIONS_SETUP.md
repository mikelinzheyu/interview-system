# GitHub Actions 自动部署配置指南

## 📋 概述

本项目已配置两个GitHub Actions工作流用于自动部署：

1. **deploy.yml** - 简单部署：直接部署到服务器
2. **build-deploy.yml** - 完整CI/CD：构建镜像 → 推送仓库 → 部署到服务器

---

## 🚀 快速开始（选择一个）

### 选项 A：简单部署（推荐新手）

**工作流文件**: `.github/workflows/deploy.yml`

**功能**:
- 检出代码
- 通过SSH连接服务器
- 克隆/更新仓库
- 构建并启动Docker容器
- 验证部署状态

**需要的Secrets**:
```
SERVER_SSH_KEY      → SSH私钥
SERVER_HOST         → 服务器IP/域名
SERVER_USER         → SSH用户名
DEPLOY_PATH         → 部署目录路径 (如: /home/ubuntu/interview-system)
```

---

### 选项 B：完整CI/CD流程（推荐生产）

**工作流文件**: `.github/workflows/build-deploy.yml`

**功能**:
- 构建前端、后端、存储服务的Docker镜像
- 推送镜像到阿里云容器仓库
- 部署到服务器并拉取最新镜像
- 验证应用状态
- 自动清理旧镜像

**需要的Secrets**:
```
# 阿里云仓库配置
ALIYUN_REGISTRY_USERNAME    → 阿里云用户名
ALIYUN_REGISTRY_PASSWORD    → 阿里云密码

# 服务器配置
DEPLOY_PRIVATE_KEY          → SSH私钥
DEPLOY_HOST                 → 服务器IP/域名
DEPLOY_USER                 → SSH用户名
DEPLOY_PORT                 → SSH端口 (默认22)
DEPLOY_PATH                 → 部署目录
```

---

## 🔑 配置步骤

### 第1步：生成SSH密钥（如果还没有）

```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "github-actions"

# 显示私钥内容（复制这个）
cat ~/.ssh/github_deploy

# 显示公钥内容（添加到服务器）
cat ~/.ssh/github_deploy.pub
```

### 第2步：在生产服务器上配置公钥

```bash
# 在服务器上（如果还没有.ssh目录）
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 将公钥添加到authorized_keys
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 测试SSH连接
ssh -i ~/.ssh/github_deploy ubuntu@YOUR_SERVER_IP
```

### 第3步：在GitHub添加Secrets

访问：https://github.com/mikelinzheyu/interview-system/settings/secrets/actions

**对于简单部署（选项A）**:

1. **SERVER_SSH_KEY**
   - 值：SSH私钥内容（`~/.ssh/github_deploy`全部内容）
   - 格式：
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   ...
   -----END OPENSSH PRIVATE KEY-----
   ```

2. **SERVER_HOST**
   - 值：服务器IP或域名
   - 示例：`1.2.3.4` 或 `your-domain.com`

3. **SERVER_USER**
   - 值：SSH登录用户名
   - 示例：`ubuntu` 或 `root`

4. **DEPLOY_PATH**
   - 值：服务器上的部署目录
   - 示例：`/home/ubuntu/interview-system`

**对于完整CI/CD（选项B）**，另外还需要：

5. **ALIYUN_REGISTRY_USERNAME**
   - 值：阿里云容器仓库用户名

6. **ALIYUN_REGISTRY_PASSWORD**
   - 值：阿里云容器仓库密码

---

## 📝 Secrets配置示例

### 简单部署示例

| Secret名 | 示例值 | 说明 |
|---------|--------|------|
| SERVER_SSH_KEY | `-----BEGIN OPENSSH...` | SSH私钥完整内容 |
| SERVER_HOST | `123.45.67.89` | 阿里云ECS实例IP |
| SERVER_USER | `ubuntu` | 登录用户 |
| DEPLOY_PATH | `/home/ubuntu/apps/interview` | 部署目录 |

### 完整CI/CD示例

| Secret名 | 示例值 | 说明 |
|---------|--------|------|
| ALIYUN_REGISTRY_USERNAME | `your-username` | 阿里云账户用户名 |
| ALIYUN_REGISTRY_PASSWORD | `your-password` | 阿里云账户密码 |
| DEPLOY_PRIVATE_KEY | `-----BEGIN OPENSSH...` | SSH私钥 |
| DEPLOY_HOST | `123.45.67.89` | 服务器IP |
| DEPLOY_USER | `ubuntu` | 登录用户 |
| DEPLOY_PORT | `22` | SSH端口 |
| DEPLOY_PATH | `/home/ubuntu/apps/interview` | 部署目录 |

---

## 🔄 工作流程

### 简单部署流程（deploy.yml）

```
代码推送到main
    ↓
检出代码
    ↓
设置SSH
    ↓
添加服务器到known_hosts
    ↓
部署到服务器
  ├─ 克隆或更新仓库
  ├─ 停止旧容器
  └─ 构建并启动新容器
    ↓
验证部署状态
    ↓
发送通知
```

### 完整CI/CD流程（build-deploy.yml）

```
代码推送到main
    ↓
Job 1: 构建并推送镜像
  ├─ 构建前端镜像 → 推送阿里云
  ├─ 构建后端镜像 → 推送阿里云
  └─ 构建存储服务 → 推送阿里云
    ↓
Job 2: 部署到服务器
  ├─ 同步最新配置
  ├─ 登录阿里云
  ├─ 拉取最新镜像
  ├─ 停止旧容器
  └─ 启动新容器
    ↓
验证应用状态
    ↓
发送部署结果
```

---

## ✅ 验证部署

### 查看工作流运行状态

1. 访问：https://github.com/mikelinzheyu/interview-system/actions
2. 查看最近的工作流运行
3. 检查各个步骤的输出日志

### 手动触发部署

在GitHub Actions页面中选择工作流，点击"Run workflow"按钮。

### 检查服务器部署结果

```bash
# SSH连接到服务器
ssh ubuntu@YOUR_SERVER_IP

# 查看Docker容器状态
docker-compose ps

# 查看容器日志
docker-compose logs -f

# 检查API健康
curl http://localhost:8080/api/health
```

---

## 🐛 常见问题

### Q1: 部署失败"ssh-private-key is empty"

**原因**: `SERVER_SSH_KEY` Secret没有正确配置

**解决**:
1. 确认已添加Secret
2. 检查私钥内容是否完整
3. 私钥需要包括`-----BEGIN OPENSSH PRIVATE KEY-----`和`-----END OPENSSH PRIVATE KEY-----`

### Q2: SSH连接超时

**原因**: 服务器防火墙或网络问题

**解决**:
1. 确认服务器SSH端口开放（默认22）
2. 检查安全组规则（允许GitHub IP）
3. 验证服务器IP正确

### Q3: Docker命令找不到

**原因**: 部署用户没有Docker权限

**解决**:
```bash
# 在服务器上执行
sudo usermod -aG docker $USER
# 然后重新登录
```

### Q4: 镜像推送失败（阿里云）

**原因**: 阿里云凭证错误或仓库不存在

**解决**:
1. 验证阿里云用户名和密码
2. 确认仓库已创建
3. 检查仓库地址在build-deploy.yml中是否正确

---

## 📚 参考资源

### 工作流文件位置
- 简单部署: `.github/workflows/deploy.yml`
- 完整CI/CD: `.github/workflows/build-deploy.yml`

### GitHub Actions文档
- https://docs.github.com/en/actions
- https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions

### Docker相关
- https://docs.docker.com/compose/

---

## 🎯 下一步

1. ✅ 生成SSH密钥
2. ✅ 配置服务器公钥
3. ✅ 在GitHub添加Secrets
4. ✅ 推送代码到main分支
5. ✅ 在GitHub Actions中查看部署进度
6. ✅ 验证应用在服务器上正常运行

---

## 📞 支持

如有问题，请查看：
- GitHub Actions日志：https://github.com/mikelinzheyu/interview-system/actions
- 工作流文件：`.github/workflows/`

---

**最后更新**: 2025-11-23
**状态**: ✅ 生产就绪
