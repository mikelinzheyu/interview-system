# 🚀 实时部署执行指南

## 📋 部署前检查清单

### Step 1: 验证GitHub Secrets已正确添加 ✅

访问: https://github.com/mikelinzheyu/interview-system/settings/secrets/actions

**检查以下7个Secrets都存在：**

```
✓ ALIYUN_REGISTRY_USERNAME
✓ ALIYUN_REGISTRY_PASSWORD
✓ DEPLOY_HOST
✓ DEPLOY_USER
✓ DEPLOY_PORT
✓ DEPLOY_PATH
✓ DEPLOY_PRIVATE_KEY
```

如果都显示✓，说明Secrets已正确配置！

---

## 🔧 Step 2: 准备生产服务器（15-20分钟）

### 2.1 连接到生产服务器

```bash
# 使用SSH密钥连接
ssh -i ~/.ssh/interview_deploy root@47.76.110.106

# 如果第一次连接，输入yes确认
# 如果提示密钥权限问题，运行:
# chmod 600 ~/.ssh/interview_deploy
```

### 2.2 检查服务器基本信息

```bash
# 检查系统信息
uname -a
cat /etc/os-release

# 检查IP地址
ip addr show

# 检查可用磁盘空间
df -h

# 检查内存
free -h
```

### 2.3 更新系统包

```bash
apt update && apt upgrade -y
apt install -y curl wget git
```

### 2.4 安装Docker

```bash
# 一键安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 验证Docker安装
docker --version
docker run hello-world
```

### 2.5 安装Docker Compose

```bash
# 下载最新版本
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 2.6 创建部署目录

```bash
# 创建主目录
mkdir -p /opt/interview-system
cd /opt/interview-system

# 创建数据和日志目录
mkdir -p data/{db,redis,uploads,backups}
mkdir -p logs/{backend,frontend,db,redis,nginx,proxy}

# 设置权限
chmod -R 755 data logs
```

### 2.7 克隆项目代码

```bash
cd /opt/interview-system

# 从GitHub克隆项目
git clone https://github.com/mikelinzheyu/interview-system.git .

# 验证克隆成功
ls -la

# 应该看到: docker-compose.prod.yml, frontend/, backend/ 等
```

### 2.8 在本地上传关键文件（可选，如果Git还没同步）

```bash
# 在你的本地电脑上运行
scp -i ~/.ssh/interview_deploy docker-compose.prod.yml root@47.76.110.106:/opt/interview-system/
scp -i ~/.ssh/interview_deploy .env.prod root@47.76.110.106:/opt/interview-system/
scp -i ~/.ssh/interview_deploy -r nginx/ root@47.76.110.106:/opt/interview-system/
scp -i ~/.ssh/interview_deploy -r monitoring/ root@47.76.110.106:/opt/interview-system/
```

---

## 🔐 Step 3: 获取SSL证书（5-10分钟）

### 3.1 安装Certbot

```bash
# 连接到服务器
ssh -i ~/.ssh/interview_deploy root@47.76.110.106

# 安装Certbot
apt-get install -y certbot python3-certbot-nginx

# 验证安装
certbot --version
```

### 3.2 获取Let's Encrypt证书

```bash
# 获取证书（使用standalone模式）
certbot certonly --standalone -d viewself.cn --agree-tos --register-unsafely-without-email

# 或者使用邮箱
certbot certonly --standalone -d viewself.cn -m your-email@example.com --agree-tos

# 证书位置
ls -la /etc/letsencrypt/live/viewself.cn/
```

**证书位置:**
- 完整证书: `/etc/letsencrypt/live/viewself.cn/fullchain.pem`
- 私钥: `/etc/letsencrypt/live/viewself.cn/privkey.pem`

### 3.3 配置Nginx SSL（如果需要）

Nginx配置已在docker-compose.prod.yml中定义，证书路径会自动映射。

---

## ⚙️ Step 4: 配置.env.prod文件

### 4.1 编辑.env.prod

```bash
ssh -i ~/.ssh/interview_deploy root@47.76.110.106
cd /opt/interview-system

# 编辑配置文件
nano .env.prod
# 或使用vi
vi .env.prod
```

### 4.2 必须修改的关键配置

在.env.prod中修改以下配置（必须！）：

```bash
# ===== 数据库密码 (必须修改!) =====
DB_PASSWORD=YourStrongPassword_123!@#

# ===== Redis密码 (必须修改!) =====
REDIS_PASSWORD=YourStrongRedis_Password_123!@#

# ===== JWT密钥 (必须修改!) =====
# 使用强密钥，最少32个字符
JWT_SECRET=your-super-strong-jwt-secret-minimum-32-characters

# ===== Dify AI配置 (必须配置!) =====
# 从 https://dify.ai 获取你的API密钥
DIFY_API_KEY=your-actual-dify-api-key-here

# 你的三个工作流ID
DIFY_WORKFLOW_1_ID=your-workflow-id-1
DIFY_WORKFLOW_1_API_KEY=your-api-key-1

DIFY_WORKFLOW_2_ID=your-workflow-id-2
DIFY_WORKFLOW_2_API_KEY=your-api-key-2

DIFY_WORKFLOW_3_ID=your-workflow-id-3
DIFY_WORKFLOW_3_API_KEY=your-api-key-3

# ===== Grafana密码 =====
GRAFANA_PASSWORD=YourStrongGrafana_Password_123!@#

# ===== 域名配置 =====
DOMAIN=viewself.cn
API_BASE_URL=https://viewself.cn/api
STORAGE_API_BASE_URL=https://viewself.cn/storage
```

### 4.3 保存文件

```bash
# 使用nano: 按 Ctrl+O, Enter, Ctrl+X
# 使用vi: 按 Esc, 输入 :wq, 按 Enter
```

### 4.4 验证配置

```bash
# 检查配置文件
cat /opt/interview-system/.env.prod | grep -E "DB_PASSWORD|REDIS_PASSWORD|DIFY_API_KEY"

# 应该看到你修改的值（不是 your-* 占位符）
```

---

## 🐳 Step 5: 手动测试部署

### 5.1 登录阿里云容器仓库

```bash
ssh -i ~/.ssh/interview_deploy root@47.76.110.106
cd /opt/interview-system

# 登录阿里云容器仓库
docker login -u your-aliyun-username -p your-aliyun-password \
  crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com

# 登录成功会显示: Login Succeeded
```

### 5.2 构建镜像（可选，如果GitHub Actions还没构建）

```bash
# 构建前端镜像
docker build -t interview-frontend:latest ./frontend

# 构建后端镜像
docker build -t interview-backend:latest ./backend

# 构建存储服务镜像
docker build -t interview-storage:latest ./backend-java
```

### 5.3 启动所有服务

```bash
cd /opt/interview-system

# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 启动所有服务（包括监控）
docker-compose -f docker-compose.prod.yml up -d

# 或者只启动核心服务（不包括ELK）
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

### 5.4 检查容器状态

```bash
# 查看所有容器
docker-compose -f docker-compose.prod.yml ps

# 应该看到:
# NAME                 STATUS
# interview-frontend   Up (healthy)
# interview-backend    Up (healthy)
# interview-storage    Up (healthy)
# interview-db         Up (healthy)
# interview-redis      Up (healthy)
# interview-proxy      Up (healthy)
```

### 5.5 查看详细日志

```bash
# 查看所有日志（实时）
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db

# 查看最后100行日志
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 5.6 验证服务是否正常

```bash
# 检查前端是否可访问
curl -I https://viewself.cn/

# 检查API是否可访问
curl -I https://viewself.cn/api/health

# 检查Grafana是否可访问
curl -I https://viewself.cn:3000

# 查看容器网络
docker network inspect interview-network
```

### 5.7 进入容器调试（如有问题）

```bash
# 进入后端容器
docker-compose -f docker-compose.prod.yml exec backend /bin/sh

# 进入数据库容器
docker-compose -f docker-compose.prod.yml exec db mysql -u interview_user -p

# 进入Redis容器
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a your-redis-password
```

---

## 🚀 Step 6: 触发GitHub Actions自动部署

### 6.1 提交代码到main分支

```bash
# 在你的本地电脑上运行

cd /path/to/interview-system

# 查看有哪些改动
git status

# 添加所有改动（包括.env.prod）
git add .

# 提交代码
git commit -m "feat: 配置阿里云生产部署

- 配置GitHub Actions自动化工作流
- 添加.env.prod生产环境配置
- 创建部署文档和指南
- 配置Prometheus和Grafana监控
- 配置Loki日志系统
"

# 推送到GitHub main分支
git push origin main
```

### 6.2 监控GitHub Actions执行

访问: https://github.com/mikelinzheyu/interview-system/actions

**观察工作流执行过程：**

```
1. Actions页面会显示最新的工作流运行
2. 点击进入查看详细日志

工作流步骤（按顺序）:
├─ Checkout code              (1分钟)
├─ Set up Docker Buildx       (1分钟)
├─ Login to Aliyun           (30秒)
├─ Build Frontend image      (5-10分钟)
├─ Build Backend image       (5-10分钟)
├─ Build Storage image       (5-10分钟)
├─ Deploy to Production      (2-5分钟)
├─ Verify Deployment         (1分钟)
└─ Send Notification         (30秒)

总耗时: 约20-40分钟
```

### 6.3 实时查看部署日志

```bash
# 在GitHub Actions界面中：
1. 打开 https://github.com/mikelinzheyu/interview-system/actions
2. 点击最新的工作流运行
3. 点击 "build-and-push" 或 "deploy" job
4. 查看详细的日志输出

关键日志信息:
✓ "Login to Aliyun Container Registry" - 登录成功
✓ "Build and push XXX image" - 镜像构建成功
✓ "Deploy to Production Server" - 部署到服务器
✓ "Deployment completed successfully!" - 部署完成
```

---

## ✅ Step 7: 验证部署成功

### 7.1 检查应用是否在线

```bash
# 访问应用主页
curl -I https://viewself.cn

# 预期响应: HTTP/2 200 或 HTTP/1.1 200

# 检查API健康状态
curl https://viewself.cn/api/health

# 预期响应: {"status":"ok"} 或类似
```

### 7.2 检查监控系统

```bash
# 访问Grafana（用户名: admin，密码见.env.prod）
curl -I https://viewself.cn:3000

# 访问Prometheus
curl -I https://viewself.cn:9090

# 在浏览器中访问:
# - https://viewself.cn:3000 (Grafana)
# - https://viewself.cn:9090 (Prometheus)
```

### 7.3 检查容器和网络

```bash
# SSH到服务器
ssh -i ~/.ssh/interview_deploy root@47.76.110.106
cd /opt/interview-system

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看容器资源使用
docker stats

# 查看网络连接
docker network inspect interview-network

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f --tail=50
```

### 7.4 检查数据库连接

```bash
# 进入数据库容器
docker-compose -f docker-compose.prod.yml exec db mysql -u interview_user -p interview_system

# 在MySQL shell中执行
mysql> SHOW DATABASES;
mysql> SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'interview_system';
mysql> EXIT;
```

### 7.5 检查Redis连接

```bash
# 进入Redis容器
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a your-redis-password

# 在Redis cli中执行
redis> PING
redis> INFO
redis> QUIT
```

---

## 🔄 Step 8: 部署后的维护

### 8.1 查看实时日志

```bash
# 查看最后的日志
docker-compose -f docker-compose.prod.yml logs --tail=100

# 持续查看日志（实时）
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 8.2 重启服务（如需要）

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

### 8.3 更新应用

```bash
# 当有新代码推送时（GitHub Actions自动部署）
# 或者手动更新：

git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### 8.4 查看监控数据

在浏览器中访问:
- **Grafana**: https://viewself.cn:3000
  - 用户名: admin
  - 密码: 见.env.prod中的GRAFANA_PASSWORD
  - 默认仪表板显示CPU、内存、网络等

- **Prometheus**: https://viewself.cn:9090
  - 查询指标数据
  - 测试PromQL查询

---

## 🆘 常见问题排查

### 问题1: 镜像拉取失败

```bash
# 检查Docker登录
docker login -u your-username -p your-password crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com

# 手动拉取镜像
docker pull crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_backend:latest

# 查看镜像列表
docker images
```

### 问题2: 容器启动失败

```bash
# 查看容器日志
docker logs interview-backend

# 查看容器详细信息
docker inspect interview-backend

# 查看compose日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 问题3: 端口冲突

```bash
# 检查哪个进程占用了端口
lsof -i :80
lsof -i :443
lsof -i :3001

# 关闭占用端口的进程
kill -9 <PID>
```

### 问题4: 磁盘空间不足

```bash
# 检查磁盘使用
df -h

# 清理Docker镜像
docker image prune -a

# 清理Docker容器
docker container prune

# 清理Docker卷
docker volume prune
```

### 问题5: 数据库连接问题

```bash
# 检查数据库容器日志
docker-compose -f docker-compose.prod.yml logs db

# 测试数据库连接
docker-compose -f docker-compose.prod.yml exec db mysql -u interview_user -p interview_system -e "SELECT 1;"

# 检查环境变量是否正确
docker-compose -f docker-compose.prod.yml exec backend env | grep DB_
```

---

## 📊 部署成功的标志

✅ 以下条件都满足表示部署成功：

- [ ] `docker-compose ps` 显示所有容器都是 `Up (healthy)`
- [ ] `curl https://viewself.cn` 返回200
- [ ] `curl https://viewself.cn/api/health` 返回成功
- [ ] Grafana可以访问 (https://viewself.cn:3000)
- [ ] Prometheus可以访问 (https://viewself.cn:9090)
- [ ] 没有容器频繁重启的现象
- [ ] 日志中没有ERROR级别的错误

---

## 📞 需要帮助？

如果遇到问题：

1. **查看GitHub Actions日志**
   https://github.com/mikelinzheyu/interview-system/actions

2. **查看服务器日志**
   ```bash
   ssh root@47.76.110.106
   cd /opt/interview-system
   docker-compose -f docker-compose.prod.yml logs
   ```

3. **检查网络连接**
   ```bash
   ping viewself.cn
   curl -v https://viewself.cn
   ```

4. **检查防火墙**
   ```bash
   # 检查开放的端口
   sudo ufw status
   sudo ss -tlnp
   ```

---

**准备好了吗？按照上面的步骤一步步执行！** 🚀

祝部署顺利！
