# 📦 打包部署 - 本地 + 云服务器

## 🎯 项目现在已准备好部署

你的项目已经包含了所有必需的部署文件：

```
D:\code7\interview-system\

📦 部署包文件:
  ✅ nginx-1.25.4.zip              (2.0M - 预下载)
  ✅ nginx-windows.conf             (配置文件)
  ✅ mock-storage-service.js        (存储服务)
  ✅ package.json                   (依赖)

🚀 启动脚本:
  ✅ start-local.ps1                (本地一键启动)
  ✅ deploy-cloud.sh                (云服务器部署)

📖 文档:
  📖 LOCAL-NGINX-SETUP.md
  📖 CLOUD-MIGRATION-CHECKLIST.md
  📖 README-DEPLOYMENT.md (本文件)

🧪 测试脚本:
  ✅ test-workflow1-simple.js
  ✅ test-workflow2-3.js
```

---

## 🖥️ 本地开发 (现在)

### 一键启动

```powershell
# PowerShell (管理员模式)
cd D:\code7\interview-system
.\start-local.ps1
```

脚本会自动：
1. ✅ 检查 nginx 压缩包
2. ✅ 解压到 C:\nginx
3. ✅ 复制配置文件
4. ✅ 验证 nginx
5. ✅ 启动 nginx

然后在新的 PowerShell 窗口中：

```powershell
# 窗口 2: 启动存储服务
cd D:\code7\interview-system
node mock-storage-service.js

# 窗口 3: 测试
curl http://localhost/health
node test-workflow1-simple.js
```

---

## ☁️ 云服务器部署 (将来)

### 方案 A: 完整自动化部署

```bash
# 1. SSH 连接到服务器
ssh root@your-server-ip

# 2. 下载部署脚本
wget https://raw.githubusercontent.com/your-repo/deploy-cloud.sh

# 3. 执行部署
bash deploy-cloud.sh

# 4. 验证
curl https://api.yourdomain.com/health
```

### 方案 B: 手动部署

#### 1️⃣ 上传文件

```bash
# 从本地 Windows 上传
scp -r D:\code7\interview-system/* root@server-ip:/app/

# 或使用 SFTP 工具上传:
# nginx-1.25.4.zip
# nginx-windows.conf → 重命名为 nginx.conf
# mock-storage-service.js
# package.json
```

#### 2️⃣ 服务器端配置

```bash
# SSH 连接
ssh root@your-server-ip

# 进入目录
cd /app

# 更新系统
apt-get update && apt-get upgrade -y

# 安装 nginx
apt-get install -y nginx

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 配置 nginx
cp nginx.conf /etc/nginx/sites-available/storage-api
ln -sf /etc/nginx/sites-available/storage-api /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 启动存储服务
npm install
npm install -g pm2
pm2 start mock-storage-service.js --name "storage-api"
pm2 startup
pm2 save

# 申请 SSL 证书
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

---

## 📊 文件清单

### 项目中必须有的文件

```
✅ nginx-1.25.4.zip              (2.0M)
✅ nginx-windows.conf            (配置)
✅ mock-storage-service.js       (代码)
✅ package.json                  (依赖)
✅ start-local.ps1               (本地脚本)
✅ deploy-cloud.sh               (云部署脚本)
```

### 检查清单

```bash
# 在项目目录执行
cd D:\code7\interview-system

# 验证文件存在
ls nginx-1.25.4.zip             # 应该显示 2.0M
ls nginx-windows.conf           # 应该显示配置内容
ls mock-storage-service.js      # 应该显示 Node 服务
ls package.json                 # 应该显示依赖
ls start-local.ps1              # 应该显示启动脚本
ls deploy-cloud.sh              # 应该显示部署脚本
```

---

## 🔄 部署流程

### 本地开发流程

```
项目准备
   ↓
执行 start-local.ps1
   ├─ 解压 nginx
   ├─ 配置 nginx
   └─ 启动 nginx
   ↓
启动存储服务
   ↓
测试工作流
   ↓
更新 Dify 工作流 URL
   ↓
验证功能
   ↓
开发完成 ✓
```

### 云服务器部署流程

```
购买 VPS + 域名
   ↓
配置 DNS
   ↓
上传部署文件
   ↓
执行 deploy-cloud.sh
   ├─ 安装 nginx
   ├─ 安装 Node.js
   ├─ 配置 nginx
   └─ 启动存储服务
   ↓
申请 SSL 证书
   ↓
更新 Dify 工作流 URL
   ↓
验证功能
   ↓
生产部署完成 ✓
```

---

## 🎯 配置对比

| 项 | 本地 Windows | 云服务器 Linux |
|----|------------|-------------|
| **nginx** | C:\nginx\nginx.exe | apt-get install nginx |
| **配置** | C:\nginx\conf\nginx.conf | /etc/nginx/sites-available/storage-api |
| **启动** | .\nginx.exe | systemctl start nginx |
| **Node.js** | 本地已安装 | apt-get install nodejs |
| **存储服务** | node mock-storage-service.js | pm2 start mock-storage-service.js |
| **SSL** | 无需 | Let's Encrypt (certbot) |
| **访问 URL** | http://localhost/api/sessions | https://api.yourdomain.com/api/sessions |

---

## 💡 关键点

### 代码完全一致
✅ nginx 配置 95% 相同（只改域名）
✅ Node.js 存储服务完全不变
✅ Dify 工作流逻辑完全不变
✅ 只改 API URL

### 轻松迁移
✅ 所有文件都在项目中
✅ 两个一键脚本
✅ 无需重新开发
✅ 只改配置参数

### 容易维护
✅ 版本控制
✅ 环境一致
✅ 快速回滚
✅ 文档完整

---

## 🚀 快速开始

### 立即启动本地环境

```powershell
# 1. PowerShell 管理员
cd D:\code7\interview-system

# 2. 运行启动脚本
.\start-local.ps1

# 3. 等待完成，然后在新窗口

# 窗口 2
node mock-storage-service.js

# 窗口 3
curl http://localhost/health
```

### 将来部署到云

```bash
# 1. 购买 VPS
# 阿里云/腾讯云 (39-99 CNY/年)

# 2. 上传文件
scp -r D:\code7\interview-system/* root@server-ip:/app/

# 3. 执行部署
ssh root@server-ip 'bash /app/deploy-cloud.sh'

# 4. 完成
curl https://api.yourdomain.com/health
```

---

## 📚 相关文档

- 📖 [本地 nginx 设置](LOCAL-NGINX-SETUP.md)
- 📖 [云服务器迁移清单](CLOUD-MIGRATION-CHECKLIST.md)
- 📖 [快速参考](QUICK-REFERENCE.txt)

---

## ✨ 下一步

### 今天
1. ✅ 本地运行 `start-local.ps1`
2. ✅ 启动存储服务
3. ✅ 更新 Dify 工作流 URL
4. ✅ 测试功能

### 将来
1. ☁️ 购买云服务器
2. ☁️ 配置 DNS
3. ☁️ 上传部署文件
4. ☁️ 执行 `deploy-cloud.sh`
5. ☁️ 申请 SSL 证书
6. ☁️ 生产运行

---

**你的项目已准备好，随时可以部署！** 🚀

