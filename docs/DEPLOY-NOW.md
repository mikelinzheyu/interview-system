# 🚀 立即开始部署 - 执行指南

**状态**: 所有文件已准备完毕 ✅
**下一步**: 启动Docker并执行部署脚本
**预计时间**: 5-10分钟

---

## ⚠️ 重要第一步: 启动Docker Desktop

部署前，**必须先启动Docker Desktop**！

### Windows用户

#### 方式1: 从开始菜单启动（最简单）

1. 点击 **Windows开始按钮** (左下角)
2. 输入: `docker desktop`
3. 点击 **Docker Desktop** 打开
4. 等待Docker启动完成 (通常30秒-2分钟)
5. 查看右下角任务栏，看到Docker图标表示启动成功

#### 方式2: 从应用文件夹启动

1. 打开文件管理器
2. 进入: `C:\Program Files\Docker\Docker`
3. 双击 `Docker Desktop.exe`
4. 等待启动完成

#### 方式3: PowerShell启动

```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker.exe"
```

#### 检查Docker是否启动

打开PowerShell或CMD，运行:
```bash
docker ps
```

**成功标志**: 显示容器列表（即使为空也是成功）
**失败标志**: 显示 "error during connect" 表示Docker未启动

### macOS用户

1. 打开启动台 (Launchpad)
2. 搜索 "Docker"
3. 点击 Docker 图标
4. 等待启动完成 (菜单栏会显示Docker图标)

### Linux用户

```bash
# 启动Docker守护程序
sudo systemctl start docker

# 检查状态
sudo systemctl status docker
```

---

## 📝 部署完整步骤

### 步骤1: 打开终端/命令行

**Windows PowerShell**:
- 按 `Win + X`
- 选择 "Windows PowerShell (管理员)" 或 "终端"

**Windows CMD**:
- 搜索 "cmd" 或 "命令提示符"
- 点击打开

**macOS/Linux**:
- 打开终端应用

### 步骤2: 进入项目目录

```bash
cd D:\code7\interview-system
```

如果您的项目在其他位置，请改为相应的路径。

### 步骤3: 复制环境配置

```bash
# Windows PowerShell
Copy-Item .env.docker -Destination .env

# Windows CMD
copy .env.docker .env

# macOS/Linux
cp .env.docker .env
```

### 步骤4: 执行部署脚本

选择您的平台对应的命令：

#### **Windows PowerShell** (推荐)

```powershell
# 第1行: 允许脚本运行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 第2行: 执行部署
.\docker-deploy-prod.ps1 -Action start
```

如果第1行出现提示，输入 `Y` 后回车即可。

#### **Windows CMD**

```batch
docker-deploy-prod.bat start
```

#### **macOS/Linux**

```bash
chmod +x docker-deploy-prod.sh
./docker-deploy-prod.sh start
```

### 步骤5: 等待部署完成

部署过程会显示以下阶段:

```
第1阶段: 环境检查 ✓
  - 检查Docker安装
  - 检查Docker Compose
  - 验证配置文件
  - 创建目录结构

第2阶段: 部署准备 ✓
  - 生成SSL证书
  - 验证配置

第3阶段: 镜像构建 (可能需要2-3分钟)
  - 构建后端镜像
  - 构建前端镜像
  - 下载Redis镜像

第4阶段: 启动服务 (30-60秒)
  - 启动后端容器
  - 启动前端容器
  - 启动Redis容器
  - 等待健康检查

第5阶段: 验证部署 ✓
  - 检查后端API
  - 检查前端
  - 检查Redis
```

### 步骤6: 访问应用

部署成功后，您会看到:

```
========================================
部署成功
========================================
前端地址: http://localhost
后端API: http://localhost:8080/api
Redis: localhost:6379
```

打开浏览器访问:
```
http://localhost
```

---

## ✅ 部署成功的标志

当您看到以下情况时，部署成功了！

- [x] 部署脚本显示 "部署成功"
- [x] 浏览器可以访问 http://localhost
- [x] 看到 AI 面试系统的前端界面

---

## 🆘 如果部署失败

### 问题1: "Docker 不是内部命令"

**原因**: Docker不在系统路径中

**解决**:
1. 重启计算机
2. 重新安装Docker Desktop
3. 确保选择了 "Add Docker to PATH"

### 问题2: "无法连接到Docker守护程序"

**原因**: Docker Desktop没有启动

**解决**:
1. 按照上面的步骤启动Docker Desktop
2. 等待30秒-2分钟让Docker完全启动
3. 检查右下角任务栏是否看到Docker图标
4. 再次执行部署命令

### 问题3: "端口80/8080已被占用"

**原因**: 其他程序占用了这些端口

**解决方案A** (修改配置):
1. 打开 `.env.docker` 文件
2. 修改端口:
   ```
   FRONTEND_PORT=8080
   BACKEND_PORT=8081
   REDIS_PORT=6380
   ```
3. 保存并重新运行部署

**解决方案B** (停止占用程序):
```bash
# Windows: 查找占用80端口的程序
netstat -ano | findstr :80

# 停止程序 (替换<PID>为实际ID)
taskkill /PID <PID> /F
```

### 问题4: "内存不足"

**解决**:
1. 关闭其他大型应用 (浏览器、IDE等)
2. 重启计算机
3. 检查Docker Desktop内存设置

### 问题5: 部署很慢

**原因**: 首次部署需要下载镜像

**解决**: 耐心等待，通常:
- 首次部署: 2-5分钟
- 后续部署: 30-60秒

---

## 📊 部署后检查

### 检查1: 查看服务状态

```bash
# 所有平台通用
docker-compose --env-file .env.docker ps

# 或使用脚本
./docker-deploy-prod.sh status  # Linux/macOS
.\docker-deploy-prod.ps1 -Action status  # PowerShell
docker-deploy-prod.bat status  # CMD
```

**预期输出** (所有服务显示 "Up"):
```
NAME                    STATUS          PORTS
interview-backend       Up (healthy)    0.0.0.0:8080->3001/tcp
interview-frontend      Up (healthy)    0.0.0.0:80->80/tcp
interview-redis         Up (healthy)    0.0.0.0:6379->6379/tcp
```

### 检查2: 访问前端

在浏览器中打开:
```
http://localhost
```

### 检查3: 测试后端API

在浏览器中打开:
```
http://localhost:8080/api/health
```

应该返回健康检查状态。

### 检查4: 查看日志

```bash
# 所有日志
./docker-deploy-prod.sh logs

# 特定服务日志
./docker-deploy-prod.sh logs backend
./docker-deploy-prod.sh logs frontend
./docker-deploy-prod.sh logs redis
```

---

## 📞 常用命令 (部署后使用)

```bash
# 查看状态
./docker-deploy-prod.sh status

# 查看日志
./docker-deploy-prod.sh logs

# 重启服务
./docker-deploy-prod.sh restart

# 停止服务
./docker-deploy-prod.sh stop

# 启动已停止的服务
./docker-deploy-prod.sh start

# 获取帮助
./docker-deploy-prod.sh help
```

---

## 🎯 快速参考

| 操作 | Windows PowerShell | Windows CMD | Linux/macOS |
|------|------------------|-----------|-----------|
| 启动部署 | `.\docker-deploy-prod.ps1 -Action start` | `docker-deploy-prod.bat start` | `./docker-deploy-prod.sh start` |
| 查看状态 | `.\docker-deploy-prod.ps1 -Action status` | `docker-deploy-prod.bat status` | `./docker-deploy-prod.sh status` |
| 查看日志 | `.\docker-deploy-prod.ps1 -Action logs` | `docker-deploy-prod.bat logs` | `./docker-deploy-prod.sh logs` |
| 停止服务 | `.\docker-deploy-prod.ps1 -Action stop` | `docker-deploy-prod.bat stop` | `./docker-deploy-prod.sh stop` |

---

## 💡 重要提示

### 首次部署

- ✅ 需要构建镜像 (耗时2-3分钟)
- ✅ 需要下载基础镜像
- ✅ 需要生成SSL证书

### 后续部署

- ✅ 无需重新构建 (仅30-60秒)
- ✅ 只需启动已有容器

### 生产部署前

- ⚠️ 修改 `.env.docker` 中的 JWT_SECRET
- ⚠️ 配置真实的DIFY_API_KEY
- ⚠️ 配置真实SSL证书
- ⚠️ 配置真实域名

---

## 📚 需要帮助?

- **快速入门**: 查看 `START-HERE.md`
- **完整指南**: 查看 `DOCKER-DEPLOYMENT-GUIDE.md`
- **故障排查**: 查看 `DOCKER-TROUBLESHOOTING.md`
- **常用命令**: 查看 `QUICK-REFERENCE.md`

---

## 🚀 现在就开始！

您已经准备好了！

### 三步快速部署:

1. **启动Docker Desktop**
2. **打开终端进入项目目录**
3. **运行部署命令**

然后访问: http://localhost

**预计完成时间**: 5-10分钟 (首次)

---

**准备好了吗? 现在就部署吧！** 🎉

如有问题，查看 `DOCKER-TROUBLESHOOTING.md` 或 `QUICK-REFERENCE.md`
