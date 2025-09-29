# 面试系统生产环境部署指南

## 概述

本目录包含面试系统的生产环境部署配置，使用 Docker Compose 进行容器化部署。

## 目录结构

```
production/
├── docker-compose.yml     # Docker Compose 配置文件
├── .env                   # 环境变量配置（开发/测试）
├── .env.production       # 生产环境配置模板
├── deploy.sh             # 部署脚本
├── nginx/                # Nginx 配置
│   ├── nginx.conf        # 前端 Nginx 配置
│   └── proxy.conf        # 反向代理配置
├── mysql/                # MySQL 配置
│   └── conf.d/
│       └── my.cnf        # MySQL 配置文件
├── redis/                # Redis 配置
│   └── redis.conf        # Redis 配置文件
└── logs/                 # 日志目录
    ├── nginx/            # Nginx 日志
    └── proxy/            # 代理日志
```

## 服务架构

系统包含以下服务：

- **frontend**: Vue.js 前端应用 (Nginx)
- **backend**: Spring Boot 后端服务
- **mysql**: MySQL 8.0 数据库
- **redis**: Redis 缓存 (可选)
- **nginx-proxy**: Nginx 反向代理 (可选)

## 快速开始

### 1. 环境准备

确保已安装：
- Docker (>= 20.0)
- Docker Compose (>= 2.0)

### 2. 配置环境变量

复制并修改环境配置：

```bash
# 开发/测试环境
cp .env.example .env

# 生产环境
cp .env.production .env.production
# 编辑生产环境配置，修改敏感信息
```

### 3. 部署

使用部署脚本：

```bash
# 完整部署
./deploy.sh

# 或者分步执行
./deploy.sh build    # 构建镜像
./deploy.sh start    # 启动服务
./deploy.sh check    # 检查状态
```

使用 Docker Compose：

```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d mysql backend frontend

# 使用生产环境配置
docker-compose --env-file .env.production up -d
```

### 4. 访问服务

- 前端应用: http://localhost
- 后端API: http://localhost:8080
- 数据库: localhost:3306
- Redis: localhost:6379

## 管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart [service_name]

# 停止服务
docker-compose down

# 停止并清理数据
docker-compose down -v

# 进入容器
docker-compose exec [service_name] bash
```

## 环境配置说明

### 数据库配置

```env
MYSQL_ROOT_PASSWORD=root123456      # MySQL root 密码
MYSQL_DATABASE=interview_system     # 数据库名
MYSQL_USER=interview               # 用户名
MYSQL_PASSWORD=interview123        # 用户密码
```

### 后端配置

```env
SPRING_PROFILES_ACTIVE=prod        # Spring 配置文件
JWT_SECRET=your-secret-key         # JWT 密钥
JWT_EXPIRATION=86400000           # JWT 过期时间
LOG_LEVEL=INFO                    # 日志级别
```

### 前端配置

```env
VITE_API_BASE_URL=http://localhost:8080/api  # API 基础URL
FRONTEND_PORT=80                            # 前端端口
```

## 生产环境注意事项

### 1. 安全配置

- 修改所有默认密码
- 使用强密码和随机密钥
- 配置 HTTPS（需要 SSL 证书）
- 限制数据库访问权限

### 2. 性能优化

- 调整数据库连接池大小
- 配置适当的内存限制
- 启用 Nginx Gzip 压缩
- 配置缓存策略

### 3. 监控和日志

- 设置日志轮转
- 配置监控告警
- 定期备份数据库
- 监控资源使用情况

### 4. 域名和 SSL

编辑 `nginx/proxy.conf`，取消注释 HTTPS 配置：

```nginx
# 放置 SSL 证书
production/nginx/ssl/cert.pem
production/nginx/ssl/key.pem

# 启用 HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ...
}
```

## 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   docker-compose logs [service_name]
   ```

2. **数据库连接失败**
   - 检查数据库容器状态
   - 验证连接配置
   - 检查网络连接

3. **前端无法访问后端**
   - 检查代理配置
   - 验证后端服务状态
   - 检查防火墙设置

4. **性能问题**
   - 检查资源使用情况
   - 调整容器资源限制
   - 优化数据库查询

### 健康检查

所有服务都配置了健康检查：

```bash
# 检查服务健康状态
docker-compose ps

# 手动健康检查
curl http://localhost/health          # 前端
curl http://localhost:8080/api/actuator/health  # 后端
```

## 备份和恢复

### 数据库备份

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p interview_system > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u root -p interview_system < backup.sql
```

### 完整备份

```bash
# 备份所有数据卷
docker run --rm -v interview-system_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz -C /data .
docker run --rm -v interview-system_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz -C /data .
```

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建和部署
./deploy.sh

# 或者分步更新
docker-compose build
docker-compose up -d --no-deps [service_name]
```

## 扩展配置

### 使用反向代理

启用 nginx-proxy 服务：

```bash
docker-compose --profile proxy up -d
```

### 添加监控

可以添加以下服务到 docker-compose.yml：

- Prometheus (监控)
- Grafana (可视化)
- ELK Stack (日志分析)

## 支持

如有问题，请检查：

1. Docker 和 Docker Compose 版本
2. 系统资源使用情况
3. 网络连接状态
4. 服务日志输出

更多信息请参考项目文档。