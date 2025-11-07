# 🚀 生产部署快速开始

## 📦 已完成的配置文件

我已经为你创建了完整的Docker生产部署和GitHub CI/CD自动化。以下是关键文件：

### ✅ 已创建的文件

1. **`.github/workflows/build-deploy.yml`**
   - GitHub Actions自动化工作流
   - 自动构建→推送到阿里云→部署到服务器
   - 每次push到main分支自动触发

2. **`.env.prod`** (已更新)
   - 生产环境完整配置
   - 包含域名、Dify配置、数据库密码等

3. **`DEPLOYMENT_GUIDE.md`** (详细指南)
   - 完整的部署步骤说明
   - 包括服务器准备、配置、验证

4. **`GITHUB_SECRETS_SETUP.md`** (快速参考)
   - GitHub Secrets配置说明
   - SSH密钥生成方式

---

## ⚡ 5分钟快速部署步骤

### 步骤1: 生成SSH密钥（5分钟）

```bash
# 在你的本地电脑上运行
ssh-keygen -t rsa -b 4096 -f ~/.ssh/interview_deploy -N ""

# 查看私钥（复制全部到GitHub Secret）
cat ~/.ssh/interview_deploy

# 添加公钥到服务器
ssh-copy-id -i ~/.ssh/interview_deploy.pub root@47.76.110.106
```

### 步骤2: 添加GitHub Secrets（5分钟）

打开 https://github.com/mikelinzheyu/interview-system/settings/secrets/actions

添加以下7个Secrets：

| Secret名称 | 值 |
|-----------|-----|
| `ALIYUN_REGISTRY_USERNAME` | 你的阿里云用户名 |
| `ALIYUN_REGISTRY_PASSWORD` | 你的阿里云密码 |
| `DEPLOY_HOST` | 47.76.110.106 |
| `DEPLOY_USER` | root |
| `DEPLOY_PORT` | 22 |
| `DEPLOY_PATH` | /opt/interview-system |
| `DEPLOY_PRIVATE_KEY` | 上面生成的私钥内容 |

### 步骤3: 在服务器上准备环境（10分钟）

```bash
# 连接到服务器
ssh root@47.76.110.106

# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建部署目录
mkdir -p /opt/interview-system
cd /opt/interview-system

# 克隆项目
git clone https://github.com/mikelinzheyu/interview-system.git .

# 创建数据目录
mkdir -p data/{db,redis,uploads,backups}
mkdir -p logs/{backend,frontend,db,redis,nginx}

# 编辑.env.prod，修改关键配置
vi .env.prod
```

### 步骤4: 获取SSL证书（5分钟）

```bash
# 在服务器上运行
apt-get install certbot python3-certbot-nginx -y
certbot certonly --standalone -d viewself.cn

# 证书位置: /etc/letsencrypt/live/viewself.cn/
```

### 步骤5: 手动测试部署（10分钟）

```bash
cd /opt/interview-system

# 登录阿里云
docker login -u your-username -p your-password \
  crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 检查状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 步骤6: 触发自动部署（自动）

```bash
# 在本地推送代码到main分支
git add .
git commit -m "feat: 完成生产部署配置"
git push origin main

# 自动触发GitHub Actions工作流
# 监控地址: https://github.com/mikelinzheyu/interview-system/actions
```

---

## 📊 部署完成后访问

部署成功后，你可以访问：

| 应用 | URL |
|-----|-----|
| 应用主页 | https://viewself.cn |
| API | https://viewself.cn/api |
| Grafana监控 | https://viewself.cn:3000 |
| Prometheus | https://viewself.cn:9090 |

---

## 🔑 关键配置项检查清单

在开始部署前，确保你有以下信息：

### 服务器信息
- ✅ IP: 47.76.110.106
- ✅ 用户: root
- ✅ SSH端口: 22
- ✅ 已安装Docker & Docker Compose

### 阿里云配置
- ✅ 镜像仓库: crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com
- ✅ 命名空间: ai_interview
- ✅ 用户名和密码获取

### GitHub配置
- ✅ 仓库地址: https://github.com/mikelinzheyu/interview-system
- ✅ SSH密钥已生成
- ✅ GitHub Secrets已配置

### 应用配置
- ✅ 域名: viewself.cn
- ✅ SSL证书已获取
- ✅ .env.prod已更新关键配置
- ✅ Dify API密钥已获取

---

## 🎯 自动化部署工作流

```
┌─────────────────────┐
│  Push to main分支   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ GitHub Actions      │
│ 自动构建镜像        │
│ (Build Job)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 推送到阿里云        │
│ 容器仓库            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ SSH登录生产服务器   │
│ (Deploy Job)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 拉取新镜像          │
│ 重启容器            │
│ 验证健康检查        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ✅ 部署完成         │
│ 应用已上线          │
└─────────────────────┘
```

---

## 📝 可能需要修改的文件

在.env.prod中修改以下关键配置：

```bash
# 1. 数据库密码（必须修改）
DB_PASSWORD=your-strong-password

# 2. Redis密码（必须修改）
REDIS_PASSWORD=your-strong-password

# 3. JWT密钥（必须修改，最少32个字符）
JWT_SECRET=your-strong-random-string-32-chars

# 4. Dify API配置（必须配置）
DIFY_API_KEY=your-actual-key
DIFY_WORKFLOW_1_ID=your-workflow-id-1
DIFY_WORKFLOW_2_ID=your-workflow-id-2
DIFY_WORKFLOW_3_ID=your-workflow-id-3

# 5. Grafana密码（可选但建议修改）
GRAFANA_PASSWORD=your-strong-password
```

---

## ❓ 常见问题快速解答

### Q: 如何查看部署日志？
```bash
# GitHub Actions日志
https://github.com/mikelinzheyu/interview-system/actions

# 服务器日志
ssh root@47.76.110.106
cd /opt/interview-system
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Q: 部署失败怎么办？
1. 检查GitHub Actions日志找出错误
2. 验证SSH密钥和Secrets配置是否正确
3. 检查服务器是否正确安装了Docker
4. 查看.env.prod配置是否有错误

### Q: 如何手动更新应用？
```bash
ssh root@47.76.110.106
cd /opt/interview-system
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Q: 如何查看容器状态？
```bash
ssh root@47.76.110.106
cd /opt/interview-system
docker-compose -f docker-compose.prod.yml ps
```

---

## 📚 详细文档

- **完整部署步骤**: 见 `DEPLOYMENT_GUIDE.md`
- **Secrets配置详解**: 见 `GITHUB_SECRETS_SETUP.md`
- **工作流配置**: 见 `.github/workflows/build-deploy.yml`

---

## ✨ 部署完成后建议

1. **设置监控告警** - 在Grafana中配置告警规则
2. **定期备份** - 每周备份MySQL数据库
3. **查看日志** - 定期查看应用日志发现问题
4. **更新依赖** - 定期更新Docker镜像
5. **性能优化** - 根据Prometheus指标优化配置

---

## 🎉 下一步行动

1. ✅ 生成SSH密钥（使用上面的命令）
2. ✅ 添加GitHub Secrets（7个配置）
3. ✅ 准备生产服务器（安装Docker）
4. ✅ 修改.env.prod中的关键配置
5. ✅ 手动测试部署流程
6. ✅ 推送main分支触发自动部署
7. ✅ 验证https://viewself.cn是否可访问

---

**准备好了吗？让我们开始部署吧！** 🚀

如有任何问题，请查看详细文档或联系我！
