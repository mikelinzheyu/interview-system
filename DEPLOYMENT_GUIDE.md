# AI 面试系统 - 全Docker生产环境部署指南

## 📋 部署概览

本指南将帮助你在阿里云服务器上部署完整的AI面试系统。整个流程包括：

1. ✅ GitHub Actions自动化CI/CD（构建→推送→部署）
2. ✅ 阿里云容器镜像仓库集成
3. ✅ 生产服务器部署（使用Docker Compose）
4. ✅ 监控系统（Prometheus + Grafana）
5. ✅ 日志系统（Loki）
6. ✅ SSL/HTTPS支持

---

## 🔑 前置要求

### 服务器信息
```
生产环境: 阿里云服务器
域名: viewself.cn
公网IP: 47.76.110.106
私网IP: 172.18.220.29
操作系统: Linux (建议 Ubuntu 20.04 LTS或以上)
Docker: v20.10+
Docker Compose: v2.0+
```

### 软件依赖
- Git
- Docker & Docker Compose
- OpenSSH Server
- curl (用于健康检查)

---

## 📝 步骤1: 在GitHub仓库中配置Secrets

GitHub Actions工作流需要以下敏感信息。请在GitHub仓库中配置这些Secrets：

### 1.1 进入GitHub仓库设置

1. 打开 https://github.com/mikelinzheyu/interview-system
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**

### 1.2 添加以下Secrets

#### 🔐 阿里云容器仓库认证

| Secret名称 | 说明 | 示例值 |
|-----------|------|------|
| `ALIYUN_REGISTRY_USERNAME` | 阿里云账户（邮箱或用户名） | your-aliyun-email@example.com |
| `ALIYUN_REGISTRY_PASSWORD` | 阿里云密码或访问令牌 | your-aliyun-password |

**获取方式:**
- 登录 https://cr.console.aliyun.com
- 点击左侧 **访问凭证**
- 复制用户名和密码（或生成新的访问令牌）

#### 🔑 生产服务器SSH认证

| Secret名称 | 说明 | 获取方式 |
|-----------|------|--------|
| `DEPLOY_HOST` | 生产服务器IP | 47.76.110.106 |
| `DEPLOY_USER` | SSH用户名 | root 或其他用户 |
| `DEPLOY_PORT` | SSH端口 | 22 (默认) |
| `DEPLOY_PATH` | 部署目录 | /opt/interview-system |
| `DEPLOY_PRIVATE_KEY` | SSH私钥 | 见下方 |

**生成SSH密钥对:**

```bash
# 1. 在本地生成SSH密钥
ssh-keygen -t rsa -b 4096 -f ~/.ssh/aliyun_deploy -N ""

# 2. 查看私钥（用于DEPLOY_PRIVATE_KEY）
cat ~/.ssh/aliyun_deploy

# 3. 在服务器上添加公钥
cat ~/.ssh/aliyun_deploy.pub | ssh root@47.76.110.106 "cat >> ~/.ssh/authorized_keys"
```

### 1.3 确保所有Secrets都已添加

检查列表：
- ✅ ALIYUN_REGISTRY_USERNAME
- ✅ ALIYUN_REGISTRY_PASSWORD
- ✅ DEPLOY_HOST
- ✅ DEPLOY_USER
- ✅ DEPLOY_PORT
- ✅ DEPLOY_PATH
- ✅ DEPLOY_PRIVATE_KEY

---

## 🚀 步骤2: 在生产服务器上准备环境

### 2.1 连接到生产服务器

```bash
ssh root@47.76.110.106
```

### 2.2 更新系统

```bash
apt update && apt upgrade -y
```

### 2.3 安装Docker和Docker Compose

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 2.4 创建部署目录

```bash
mkdir -p /opt/interview-system
cd /opt/interview-system
```

### 2.5 克隆项目代码

```bash
git clone https://github.com/mikelinzheyu/interview-system.git .
```

### 2.6 复制项目文件到部署目录

```bash
# 从本地复制必要文件到服务器
scp -r docker-compose.prod.yml root@47.76.110.106:/opt/interview-system/
scp -r nginx/ root@47.76.110.106:/opt/interview-system/
scp -r monitoring/ root@47.76.110.106:/opt/interview-system/
scp .env.prod root@47.76.110.106:/opt/interview-system/
```

### 2.7 创建数据目录

```bash
mkdir -p /opt/interview-system/data/{db,redis,uploads,backups}
mkdir -p /opt/interview-system/logs/{backend,frontend,db,redis,nginx}
chmod -R 755 /opt/interview-system/data
chmod -R 755 /opt/interview-system/logs
```

### 2.8 配置.env.prod文件

编辑生产环境配置：

```bash
vi /opt/interview-system/.env.prod
```

**必须修改的关键配置:**

```bash
# 数据库密码（强密码）
DB_PASSWORD=Your_Strong_DB_Password_123!

# Redis密码（强密码）
REDIS_PASSWORD=Your_Strong_Redis_Password_123!

# JWT密钥（强密钥）
JWT_SECRET=your-super-strong-jwt-secret-minimum-32-chars

# Dify API配置（从Dify.ai获取）
DIFY_API_KEY=your-actual-dify-api-key
DIFY_WORKFLOW_1_ID=your-workflow-1-id
DIFY_WORKFLOW_2_ID=your-workflow-2-id
DIFY_WORKFLOW_3_ID=your-workflow-3-id

# Grafana密码
GRAFANA_PASSWORD=Your_Strong_Grafana_Password_123!
```

### 2.9 获取和配置SSL证书

使用Let's Encrypt获取免费SSL证书：

```bash
# 安装Certbot
apt-get install certbot python3-certbot-nginx -y

# 获取证书
certbot certonly --standalone -d viewself.cn

# 证书位置
ls /etc/letsencrypt/live/viewself.cn/
```

### 2.10 配置Nginx SSL

将证书路径配置到Nginx配置文件中。编辑 `/opt/interview-system/nginx/prod.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name viewself.cn;

    ssl_certificate /etc/letsencrypt/live/viewself.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/viewself.cn/privkey.pem;

    # ... 其他配置
}
```

---

## 🐳 步骤3: 首次手动部署（测试）

在首次使用GitHub Actions自动部署之前，建议先手动测试：

```bash
cd /opt/interview-system

# 登录阿里云容器仓库
docker login -u your-username -p your-password crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 验证服务

```bash
# 检查前端
curl -I https://viewself.cn/

# 检查API
curl -I https://viewself.cn/api/health

# 检查Grafana
curl -I https://viewself.cn:3000

# 进入容器检查
docker-compose -f docker-compose.prod.yml exec backend /bin/sh
```

---

## 🤖 步骤4: 启用GitHub Actions自动部署

### 4.1 配置docker-compose.prod.yml

确保docker-compose.prod.yml使用正确的镜像仓库地址。编辑文件中的镜像标签：

```yaml
frontend:
  image: crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_frontend:latest

backend:
  image: crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_backend:latest

storage-service:
  image: crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_storage:latest
```

### 4.2 测试自动部署流程

```bash
# 提交代码到main分支以触发GitHub Actions
git add .
git commit -m "feat: 配置生产部署"
git push origin main
```

### 4.3 监控部署过程

1. 打开 https://github.com/mikelinzheyu/interview-system/actions
2. 查看最新的CI/CD工作流运行情况
3. 查看构建日志和部署日志

---

## 📊 步骤5: 访问应用和监控系统

部署完成后，你可以访问：

| 应用 | URL | 用户名 | 密码 |
|-----|-----|--------|------|
| 应用主页 | https://viewself.cn | - | - |
| API文档 | https://viewself.cn/api | - | - |
| Grafana监控 | https://viewself.cn:3000 | admin | 见.env.prod |
| Prometheus | https://viewself.cn:9090 | - | - |

---

## 🔄 后续操作和维护

### 6.1 定期备份

```bash
# 手动备份数据库
docker-compose -f docker-compose.prod.yml exec db mysqldump -u interview_user -p interview_system > backup_$(date +%Y%m%d).sql

# 备份应用数据
tar -czf backup_data_$(date +%Y%m%d).tar.gz /opt/interview-system/data
```

### 6.2 查看日志

```bash
# 查看所有容器日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### 6.3 更新应用

当有新代码推送到main分支时，GitHub Actions会自动：
1. 构建新镜像
2. 推送到阿里云
3. 部署到生产服务器

你只需要等待部署完成！

### 6.4 手动更新（如果需要）

```bash
cd /opt/interview-system
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🐛 故障排查

### 问题1: 镜像推送失败

```bash
# 检查阿里云认证
docker login -u your-username -p your-password crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com

# 查看镜像
docker images

# 手动推送测试
docker push crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_backend:latest
```

### 问题2: 容器启动失败

```bash
# 查看容器日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 检查容器状态
docker ps -a

# 重启容器
docker-compose -f docker-compose.prod.yml restart backend
```

### 问题3: SSL证书问题

```bash
# 检查证书
openssl x509 -in /etc/letsencrypt/live/viewself.cn/fullchain.pem -text -noout

# 更新证书
certbot renew --dry-run

# 重启Nginx
docker-compose -f docker-compose.prod.yml restart nginx-proxy
```

### 问题4: 数据库连接问题

```bash
# 检查数据库状态
docker-compose -f docker-compose.prod.yml exec db mysql -u interview_user -p interview_system -e "SELECT 1;"

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs db
```

---

## 📞 获取帮助

如有问题，请：

1. 查看GitHub Actions日志：https://github.com/mikelinzheyu/interview-system/actions
2. 查看生产服务器日志：`docker-compose -f docker-compose.prod.yml logs`
3. 检查网络连接：`curl -I https://viewself.cn`
4. 检查DNS配置：`nslookup viewself.cn`

---

## 📚 相关文档

- [Docker Compose官方文档](https://docs.docker.com/compose/)
- [GitHub Actions文档](https://docs.github.com/en/actions)
- [阿里云容器镜像服务](https://cr.console.aliyun.com)
- [Grafana文档](https://grafana.com/docs/)

---

**祝你部署顺利！** 🚀
