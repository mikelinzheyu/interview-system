# 生产服务器修复步骤

根据部署日志分析，需要在生产服务器 (47.76.110.106) 上执行以下命令：

## 修复步骤

### 1️⃣  登录到服务器
```bash
ssh -p 22 root@47.76.110.106
```

### 2️⃣  进入应用目录
```bash
cd /opt/interview-system
```

### 3️⃣  检查目录结构
```bash
ls -lah
```

### 4️⃣  创建缺失的 ssl 目录
```bash
mkdir -p ssl
ls -lah ssl
```

### 5️⃣  验证 nginx.conf 是文件而不是目录
```bash
ls -lah nginx.conf
# 应该显示 -rw-r--r-- (文件类型)，而不是 drwxr-xr-x (目录类型)
```

### 6️⃣  停止并清理所有旧容器
```bash
docker-compose -f docker-compose.prod.yml down --remove-orphans
```

### 7️⃣  清理孤立的Docker网络和卷（可选但推荐）
```bash
docker network prune -f
docker volume prune -f
```

### 8️⃣  拉取最新的镜像
```bash
docker-compose -f docker-compose.prod.yml pull
```

### 9️⃣  启动容器
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 🔟  等待服务启动
```bash
sleep 30
```

### 1️⃣1️⃣  验证容器状态
```bash
docker-compose -f docker-compose.prod.yml ps
```

预期输出应该显示所有容器都处于 "Up" 状态：
```
NAME                COMMAND                  SERVICE            STATUS              PORTS
interview-backend   "node server.js"         backend            Up                  3001/tcp
interview-db        "docker-entrypoint.s…"   db                 Up                  5432/tcp
interview-frontend  "nginx -g daemon off…"   frontend           Up                  80/tcp
interview-nginx     "nginx -g daemon off…"   nginx-proxy        Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
interview-redis     "redis-server --maxm…"   redis              Up                  6379/tcp
```

### 1️⃣2️⃣  查看日志验证无错误
```bash
docker-compose -f docker-compose.prod.yml logs
```

## ✅ 验证部署成功

完成以上步骤后，检查应用是否正常运行：

```bash
# 检查 Nginx 反向代理
curl -i http://localhost/health

# 检查后端 API
curl -i http://localhost/api/health

# 查看应用日志
docker-compose logs frontend
docker-compose logs backend
docker-compose logs nginx-proxy
```

## 🔗 访问应用

- **HTTP:** http://47.76.110.106
- **域名（需DNS解析）:** https://viewself.cn

---

## 快速脚本版本

如果您想一次性执行所有命令，可以复制以下脚本：

```bash
#!/bin/bash
set -e

cd /opt/interview-system

echo "创建 ssl 目录..."
mkdir -p ssl

echo "停止旧容器..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

echo "清理网络..."
docker network prune -f || true

echo "拉取最新镜像..."
docker-compose -f docker-compose.prod.yml pull

echo "启动容器..."
docker-compose -f docker-compose.prod.yml up -d

echo "等待启动..."
sleep 30

echo "检查状态..."
docker-compose -f docker-compose.prod.yml ps

echo "修复完成！"
```

