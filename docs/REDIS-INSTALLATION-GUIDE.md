# Redis 安装和配置指南

## 📋 概述

本指南提供了在 Windows 系统上安装和配置 Redis 的多种方法，以启用持久化会话存储。

---

## 🎯 当前状态

您的系统：
- ✅ Docker 已安装（版本 28.3.3）
- ⚠️ Docker Desktop 未运行
- ✅ 后端服务器正在运行（内存存储模式）

---

## 🚀 方法 1: 使用 Docker（推荐）

### 优点
- ✅ 最简单、最快速
- ✅ 易于管理和卸载
- ✅ 不污染系统环境
- ✅ 跨平台一致

### 步骤

#### 1. 启动 Docker Desktop

**方法A - 通过开始菜单**:
1. 按 `Win` 键
2. 搜索 "Docker Desktop"
3. 点击启动

**方法B - 直接运行**:
```
C:\Program Files\Docker\Docker\Docker Desktop.exe
```

**等待**: Docker Desktop 启动需要 30-60 秒，等待右下角图标显示正常。

#### 2. 拉取并启动 Redis 容器

打开命令提示符或 PowerShell，运行：

```bash
# 拉取 Redis 镜像
docker pull redis:latest

# 启动 Redis 容器
docker run -d \
  --name interview-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  --restart unless-stopped \
  redis:latest redis-server --appendonly yes
```

**参数说明**:
- `-d`: 后台运行
- `--name interview-redis`: 容器名称
- `-p 6379:6379`: 端口映射（主机:容器）
- `-v redis-data:/data`: 数据持久化卷
- `--restart unless-stopped`: 自动重启
- `--appendonly yes`: 启用 AOF 持久化

#### 3. 验证 Redis 运行

```bash
# 检查容器状态
docker ps | findstr redis

# 测试 Redis 连接
docker exec -it interview-redis redis-cli ping
# 应该返回: PONG
```

#### 4. 管理 Redis 容器

**停止 Redis**:
```bash
docker stop interview-redis
```

**启动 Redis**:
```bash
docker start interview-redis
```

**查看日志**:
```bash
docker logs interview-redis
```

**删除容器（保留数据）**:
```bash
docker stop interview-redis
docker rm interview-redis
# 数据仍保存在 redis-data 卷中
```

---

## 🔧 方法 2: 使用 WSL2 + Redis（适合开发）

### 优点
- ✅ 原生 Linux Redis
- ✅ 性能好
- ✅ 适合开发环境

### 步骤

#### 1. 安装 WSL2

```powershell
# 以管理员身份运行 PowerShell
wsl --install
# 重启计算机
```

#### 2. 安装 Redis

进入 WSL2 终端：

```bash
# 更新包列表
sudo apt update

# 安装 Redis
sudo apt install redis-server -y

# 启动 Redis
sudo service redis-server start

# 验证运行
redis-cli ping
# 应该返回: PONG
```

#### 3. 配置 Redis

编辑配置文件：

```bash
sudo nano /etc/redis/redis.conf
```

修改以下内容：
```conf
# 允许外部连接（可选，仅开发环境）
bind 0.0.0.0

# 启用持久化
appendonly yes

# 设置密码（可选）
requirepass your_password_here
```

重启 Redis：
```bash
sudo service redis-server restart
```

#### 4. 开机自启动

```bash
# 添加到 .bashrc
echo 'sudo service redis-server start' >> ~/.bashrc
```

---

## 📦 方法 3: Windows 原生安装（不推荐）

### 注意
Microsoft 不再维护 Windows 版 Redis，不推荐用于生产环境。

### 下载

访问：https://github.com/tporadowski/redis/releases

下载最新的 `Redis-x64-*.zip`

### 安装步骤

1. 解压到 `C:\Redis`
2. 打开命令提示符（管理员）
3. 运行：
   ```cmd
   cd C:\Redis
   redis-server.exe redis.windows.conf
   ```

### 注册为服务（可选）

```cmd
cd C:\Redis
redis-server --service-install redis.windows.conf
redis-server --service-start
```

---

## ✅ 验证 Redis 连接（所有方法通用）

### 1. 使用 redis-cli

```bash
# 连接 Redis
redis-cli

# 测试命令
127.0.0.1:6379> ping
PONG

127.0.0.1:6379> set test "hello"
OK

127.0.0.1:6379> get test
"hello"

127.0.0.1:6379> exit
```

### 2. 使用 Node.js 测试脚本

创建 `test-redis-connection.js`:

```javascript
const redis = require('redis')

async function testRedis() {
  const client = redis.createClient({
    socket: {
      host: 'localhost',
      port: 6379
    }
  })

  client.on('error', (err) => {
    console.error('❌ Redis 连接错误:', err.message)
    process.exit(1)
  })

  try {
    await client.connect()
    console.log('✅ Redis 连接成功!')

    // 测试写入
    await client.set('test-key', 'Hello Redis')
    console.log('✅ 写入测试数据成功')

    // 测试读取
    const value = await client.get('test-key')
    console.log('✅ 读取测试数据:', value)

    // 清理
    await client.del('test-key')
    console.log('✅ 清理测试数据完成')

    await client.quit()
    console.log('\n🎉 Redis 测试全部通过!')
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

testRedis()
```

运行测试：
```bash
"C:\Program Files\nodejs\node.exe" test-redis-connection.js
```

---

## 🔄 重启后端服务器以使用 Redis

### 1. 停止当前后端服务器

如果后端正在运行，需要先停止。

### 2. 启动后端

```bash
"C:\Program Files\nodejs\node.exe" "D:\code7\interview-system\backend\mock-server.js"
```

### 3. 检查日志

应该看到：
```
🔄 正在初始化 Redis 客户端...
✅ Redis 连接成功
🟢 Redis 客户端就绪
🔧 Redis 配置: {
  host: 'localhost',
  port: 6379,
  db: 0,
  sessionTTL: '604800秒 (7天)'
}
```

而不是：
```
❌ Redis 初始化失败
⚠️  将使用内存存储作为降级方案
```

---

## 🧪 测试会话存储（Redis 模式）

运行集成测试：

```bash
"C:\Program Files\nodejs\node.exe" "D:\code7\interview-system\test-redis-session.js"
```

**预期输出变化**:

**之前（内存模式）**:
```
💾 会话已保存到内存: session-xxx (Redis不可用)
📂 从内存加载会话: session-xxx (Redis不可用)
```

**现在（Redis 模式）**:
```
💾 会话已保存到 Redis: session-xxx
📂 从 Redis 加载会话: session-xxx
```

---

## 🔐 可选：配置 Redis 密码

### 1. 设置密码

**Docker 方式**:
```bash
docker run -d \
  --name interview-redis \
  -p 6379:6379 \
  redis:latest redis-server --requirepass your_password
```

**WSL/Linux 方式**:
编辑 `/etc/redis/redis.conf`:
```conf
requirepass your_password
```

### 2. 更新环境变量

创建 `backend/.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_SESSION_TTL=604800
```

### 3. 重启后端

系统会自动读取密码并连接。

---

## 📊 Redis 数据管理

### 查看所有会话

```bash
redis-cli

# 查看所有会话键
127.0.0.1:6379> KEYS interview:session:*

# 查看特定会话
127.0.0.1:6379> GET interview:session:session-xxx

# 查看会话剩余TTL（秒）
127.0.0.1:6379> TTL interview:session:session-xxx

# 删除所有会话（慎用）
127.0.0.1:6379> DEL interview:session:*
```

### 使用 Redis GUI 工具（可选）

推荐工具：
- **RedisInsight** (官方): https://redis.com/redis-enterprise/redis-insight/
- **Another Redis Desktop Manager**: https://github.com/qishibo/AnotherRedisDesktopManager

---

## 🐛 故障排除

### 问题 1: Docker Desktop 启动失败

**解决方案**:
1. 确保 Hyper-V 和 WSL2 已启用
2. 以管理员身份运行 PowerShell:
   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   wsl --set-default-version 2
   ```
3. 重启计算机

### 问题 2: Redis 端口 6379 被占用

**检查**:
```bash
netstat -ano | findstr :6379
```

**解决方案**:
```bash
# 方案A: 停止占用进程
taskkill /PID <进程ID> /F

# 方案B: 使用其他端口
docker run -d --name interview-redis -p 6380:6379 redis:latest

# 更新 .env
REDIS_PORT=6380
```

### 问题 3: 连接被拒绝

**检查 Redis 是否运行**:
```bash
docker ps | findstr redis
# 或
redis-cli ping
```

**检查防火墙**:
确保端口 6379 未被防火墙阻止。

### 问题 4: 数据丢失

**原因**: AOF 未启用

**解决方案**:
```bash
# Docker 启动时加上 --appendonly yes
docker run -d \
  --name interview-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:latest redis-server --appendonly yes
```

---

## 📈 性能监控

### 查看 Redis 信息

```bash
redis-cli info

# 查看内存使用
redis-cli info memory

# 查看连接数
redis-cli info clients

# 查看持久化状态
redis-cli info persistence
```

### 监控实时命令

```bash
redis-cli monitor
```

---

## 🎯 快速命令参考

### Docker 命令

```bash
# 启动 Redis
docker start interview-redis

# 停止 Redis
docker stop interview-redis

# 重启 Redis
docker restart interview-redis

# 查看日志
docker logs -f interview-redis

# 进入 Redis CLI
docker exec -it interview-redis redis-cli

# 查看资源使用
docker stats interview-redis

# 删除容器
docker rm -f interview-redis

# 删除数据卷（会丢失所有数据）
docker volume rm redis-data
```

### Redis CLI 命令

```bash
# 连接
redis-cli

# 测试连接
ping

# 查看所有键
keys *

# 查看会话
keys interview:session:*

# 获取值
get interview:session:xxx

# 删除键
del interview:session:xxx

# 清空数据库（慎用）
flushdb

# 退出
exit
```

---

## 🚀 推荐配置

### 开发环境

```bash
docker run -d \
  --name interview-redis \
  -p 6379:6379 \
  redis:latest
```

### 生产环境

```bash
docker run -d \
  --name interview-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  --restart unless-stopped \
  --memory 512m \
  --cpus 1 \
  redis:latest redis-server \
    --appendonly yes \
    --requirepass your_strong_password \
    --maxmemory 256mb \
    --maxmemory-policy allkeys-lru
```

**参数说明**:
- `--memory 512m`: 限制内存使用
- `--cpus 1`: 限制 CPU 使用
- `--maxmemory 256mb`: Redis 最大内存
- `--maxmemory-policy allkeys-lru`: 内存满时的驱逐策略

---

## 📚 相关资源

- **Redis 官方文档**: https://redis.io/docs/
- **Docker Hub Redis**: https://hub.docker.com/_/redis
- **Redis 命令参考**: https://redis.io/commands/
- **本项目 Redis 客户端代码**: `backend/redis-client.js`

---

## ✅ 完成检查清单

安装完成后，确保：

- [ ] Redis 服务器运行中（`redis-cli ping` 返回 PONG）
- [ ] 后端服务器已重启
- [ ] 后端日志显示 "Redis 连接成功"
- [ ] 测试脚本通过（`test-redis-session.js`）
- [ ] 会话数据保存到 Redis（日志显示 "保存到 Redis"）

---

## 🆘 需要帮助？

如果遇到问题：

1. 检查 Redis 是否运行: `redis-cli ping`
2. 检查端口是否被占用: `netstat -ano | findstr :6379`
3. 查看 Redis 日志: `docker logs interview-redis`
4. 查看后端日志: 控制台输出
5. 运行测试: `node test-redis-connection.js`

---

**创建时间**: 2025-10-10
**适用系统**: Windows 10/11
**Redis 版本**: 7.x+
**Docker 版本**: 20.x+
