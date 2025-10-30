# 🔍 存储服务监控和维护指南

完成部署后，需要定期监控和维护。本指南提供了常见的维护命令和最佳实践。

---

## 📊 日常监控

### 1. 容器状态检查

```bash
# 进入云服务器
ssh root@YOUR_CLOUD_SERVER_IP
cd /home/interview-system/storage-service

# 检查容器运行状态
docker-compose ps

# 预期输出：
# NAME                    STATUS
# interview-redis         Up X minutes
# interview-storage-service   Up X minutes
```

### 2. 查看实时日志

```bash
# 存储服务日志
docker-compose logs -f interview-storage-service

# Redis 日志
docker-compose logs -f interview-redis

# 最后 N 行日志
docker-compose logs --tail=50 interview-storage-service

# 特定时间范围的日志
docker-compose logs --since 2025-10-29 interview-storage-service
```

### 3. 检查容器资源使用

```bash
# 实时资源监控
docker stats interview-storage-service interview-redis

# 查看 CPU、内存、网络使用情况
# 容器名称              CPU %   内存 %   网络 I/O
# interview-redis       0.5%    50MB
# interview-storage...  1.2%    300MB
```

### 4. 健康检查

```bash
# 本地检查（在云服务器上）
curl -f -H "Authorization: Bearer $STORAGE_API_KEY" \
  http://localhost:8081/api/sessions

# 远程检查（从本地）
curl -f -H "Authorization: Bearer $STORAGE_API_KEY" \
  https://storage.interview-system.com/api/sessions

# 返回 200 表示健康，否则检查日志
```

---

## 🔧 常见维护任务

### 任务 1: 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart interview-storage-service
docker-compose restart interview-redis

# 预期行为：服务停止 → 重新启动 → 健康检查通过
```

### 任务 2: 查看 Redis 连接

```bash
# 进入 Redis CLI
docker-compose exec interview-redis redis-cli -a $REDIS_PASSWORD

# 在 Redis CLI 中执行命令：
ping                  # 测试连接
keys *                # 查看所有 key
dbsize                # 数据库大小
info keyspace         # key 统计信息
info stats            # 连接统计
FLUSHDB               # 清空当前数据库（谨慎！）
exit                  # 退出
```

### 任务 3: 备份数据

```bash
# 使用备份脚本（推荐）
cd /home/interview-system
chmod +x scripts/redis-backup.sh
./scripts/redis-backup.sh backup

# 手动备份
docker-compose exec interview-redis redis-cli -a $REDIS_PASSWORD BGSAVE
docker cp interview-redis:/data/dump.rdb ~/redis-backup-$(date +%Y%m%d).rdb

# 下载到本地
scp root@YOUR_IP:~/redis-backup-*.rdb ./backups/
```

### 任务 4: 恢复数据

```bash
# 使用备份脚本（推荐）
./scripts/redis-backup.sh restore ./backups/redis-dump-20250101_120000.rdb

# 手动恢复
docker-compose stop interview-storage-service interview-redis
docker cp ./redis-backup-20250101.rdb interview-redis:/data/dump.rdb
docker-compose up -d
```

### 任务 5: 检查 API 端点

```bash
# 创建会话
curl -X POST https://storage.interview-system.com/api/sessions \
  -H "Authorization: Bearer $STORAGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123","jobTitle":"test","questions":[]}'

# 查询会话
curl -H "Authorization: Bearer $STORAGE_API_KEY" \
  https://storage.interview-system.com/api/sessions/test-123

# 删除会话
curl -X DELETE -H "Authorization: Bearer $STORAGE_API_KEY" \
  https://storage.interview-system.com/api/sessions/test-123
```

---

## 📈 性能优化

### 1. JVM 内存调优

生产环境流量大时，在 `.env.prod` 中调整：

```bash
# 当前配置（中等流量）
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC

# 高流量配置
JAVA_OPTS=-Xms2048m -Xmx4096m -XX:+UseG1GC

# 低内存配置
JAVA_OPTS=-Xms256m -Xmx512m -XX:+UseSerialGC

# 修改后重启服务
docker-compose restart interview-storage-service
```

### 2. Redis 性能调优

```bash
# 在 Redis CLI 中查看性能指标
docker-compose exec interview-redis redis-cli -a $REDIS_PASSWORD

# 查看慢查询
slowlog get 10
slowlog len

# 配置慢查询阈值（微秒）
config set slowlog-max-len 128
config set slowlog-log-slower-than 10000
```

### 3. 连接池调优

在 `.env.prod` 中调整：

```bash
SPRING_REDIS_LETTUCE_POOL_MAX_ACTIVE=8    # 最大活跃连接
SPRING_REDIS_LETTUCE_POOL_MAX_IDLE=8      # 最大空闲连接
```

---

## ⚠️ 故障排查

### 问题 1: 容器无法启动

```bash
# 查看错误日志
docker-compose logs interview-storage-service

# 检查配置文件
cat .env.prod

# 检查磁盘空间
df -h

# 解决方案
docker-compose down
docker-compose up -d
```

### 问题 2: Redis 连接失败

```bash
# 检查 Redis 状态
docker-compose ps interview-redis

# 查看 Redis 日志
docker-compose logs interview-redis

# 检查密码配置
docker-compose exec interview-redis redis-cli -a your_password ping

# 如果密码错误，重启 Redis
docker-compose restart interview-redis
```

### 问题 3: API 响应缓慢

```bash
# 1. 检查容器资源
docker stats

# 2. 查看 Redis 性能
docker-compose exec interview-redis redis-cli -a $REDIS_PASSWORD info stats

# 3. 查看应用日志
docker-compose logs --tail=100 interview-storage-service

# 4. 检查网络连接
curl -v https://storage.interview-system.com/api/sessions

# 5. 扩容（如果 CPU/内存不足）
# 修改 docker-compose-prod.yml 中的 JAVA_OPTS
```

### 问题 4: 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 清理 Docker（谨慎操作）
docker system prune -a --volumes

# 查看日志大小
du -sh /var/log/nginx/
du -sh /var/lib/docker/

# 配置日志轮转（自动清理）
# 见下面的"日志管理"部分
```

---

## 📝 日志管理

### 配置日志轮转（自动清理老日志）

```bash
# 创建日志轮转配置
sudo tee /etc/logrotate.d/interview-storage > /dev/null << EOF
/var/log/nginx/storage-service-*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}

/home/interview-system/storage-service/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
}
EOF

# 测试日志轮转
sudo logrotate -f /etc/logrotate.d/interview-storage

# 查看轮转历史
ls -la /var/log/nginx/storage-service-*
```

### 查看 Nginx 访问日志

```bash
# 实时日志
tail -f /var/log/nginx/storage-service-access.log

# 查看特定时间的请求
grep "2025-10-29" /var/log/nginx/storage-service-access.log

# 统计 API 调用
grep "/api/sessions" /var/log/nginx/storage-service-access.log | wc -l

# 查看错误
tail -f /var/log/nginx/storage-service-error.log
```

---

## 🔐 安全维护

### 定期更新密钥

```bash
# 生成新的 API Key
openssl rand -base64 32

# 更新 GitHub Secrets
# Settings → Secrets and variables → Actions → Update STORAGE_API_KEY

# 更新云服务器环境变量
nano /home/interview-system/storage-service/.env.prod
# 修改 SESSION_STORAGE_API_KEY

# 重启服务
docker-compose restart interview-storage-service
```

### SSL 证书续期检查

```bash
# 查看证书有效期
sudo openssl x509 -in /etc/letsencrypt/live/storage.interview-system.com/fullchain.pem -noout -dates

# Let's Encrypt 自动续期（通常每 60 天）
sudo certbot renew

# 手动续期
sudo certbot renew --force-renewal

# 查看续期日志
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## 📅 维护计划

### 每日
- ✓ 检查容器运行状态：`docker-compose ps`
- ✓ 监控错误日志：`docker-compose logs`
- ✓ 健康检查：`curl -f https://...`

### 每周
- ✓ 备份 Redis：`./scripts/redis-backup.sh backup`
- ✓ 检查磁盘空间：`df -h`
- ✓ 查看性能指标：`docker stats`

### 每月
- ✓ 更新依赖（如有新版本）
- ✓ 审查和优化性能参数
- ✓ 验证备份可恢复性

### 每季度
- ✓ 更新 SSL 证书
- ✓ 安全审计（密钥轮换）
- ✓ 容量规划（是否需要扩容）

---

## 📞 获取帮助

如果遇到问题：

1. 查看日志：`docker-compose logs`
2. 检查状态：`docker-compose ps`
3. 运行本地测试：`./scripts/test-storage-service-local.sh`
4. 查看 GitHub Issues
5. 参考部署文档

---

**现在你已经拥有了完整的监控和维护工具！** 🎉
