# Cloudflare Tunnel 快速开始指南

**最后更新**: 2025-10-27

这是一个精简的快速开始指南。详细信息请参考 [完整迁移指南](CLOUDFLARE_TUNNEL_MIGRATION_GUIDE.md)。

---

## ⚡ 5分钟快速设置

### 步骤 1: 安装 cloudflared (2分钟)

```powershell
# Windows (使用 Winget)
winget install --id Cloudflare.cloudflared

# 验证安装
cloudflared --version
```

### 步骤 2: 创建隧道 (2分钟)

```powershell
# 登录 Cloudflare (会打开浏览器)
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create interview-system

# 保存输出中的隧道 ID (类似 abc123-def456-ghi789)
```

### 步骤 3: 配置隧道 (1分钟)

```powershell
# 复制凭证文件
Copy-Item "C:\Users\$env:USERNAME\.cloudflared\<TUNNEL-ID>.json" `
          "D:\code7\interview-system\cloudflare-tunnel\credentials.json"

# 编辑配置文件
notepad "D:\code7\interview-system\cloudflare-tunnel\config.yml"
```

在 `config.yml` 中:
1. 将 `<TUNNEL-ID>` 替换为你的实际隧道 ID
2. 将 `storage-api.yourdomain.com` 替换为你的域名

### 步骤 4: 配置 DNS (可选)

**如果有域名**:
```powershell
cloudflared tunnel route dns interview-system storage-api.yourdomain.com
```

**如果没有域名**: Cloudflare 会自动分配 `<TUNNEL-ID>.cfargotunnel.com`

### 步骤 5: 启动服务

```powershell
# 启动 Docker 服务 (包括 Cloudflare Tunnel)
cd D:\code7\interview-system
docker-compose up -d

# 查看 Cloudflare Tunnel 日志
docker logs -f interview-cloudflare-tunnel
```

预期输出:
```
2024-10-27T10:00:00Z INF Starting tunnel tunnelID=<TUNNEL-ID>
2024-10-27T10:00:00Z INF Connection registered connIndex=0
```

### 步骤 6: 测试连接

```powershell
# 测试 API 连接
Invoke-WebRequest -Uri "https://storage-api.yourdomain.com/api/sessions" `
                   -Headers @{"Authorization" = "Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"}
```

预期: HTTP 200

### 步骤 7: 更新 Dify 工作流

```powershell
# 自动替换 URL
.\scripts\update-workflow-urls.ps1 -NewURL "https://storage-api.yourdomain.com"

# 验证替换
Select-String -Path "workflow2-fixed-latest.yml" -Pattern "ngrok"
# 应该没有输出
```

### 步骤 8: 在 Dify 中导入

1. 登录 https://cloud.dify.ai
2. 打开 **AI面试官-工作流2-生成答案**
3. 导入更新后的 `workflow2-fixed-latest.yml`
4. 测试工作流

---

## ✅ 验证清单

- [ ] cloudflared 已安装 (`cloudflared --version`)
- [ ] 隧道已创建 (`cloudflared tunnel list`)
- [ ] 凭证文件已复制到 `cloudflare-tunnel/credentials.json`
- [ ] `config.yml` 中的隧道 ID 已更新
- [ ] DNS 已配置 (如果使用自定义域名)
- [ ] Docker 服务已启动 (`docker ps | grep cloudflare`)
- [ ] API 连接测试通过 (HTTP 200)
- [ ] workflow YAML 文件已更新
- [ ] Dify 工作流已导入并测试

---

## 🆘 常见问题

### Q: 隧道启动失败

**检查**:
```powershell
# 查看日志
docker logs interview-cloudflare-tunnel

# 检查配置
docker exec interview-cloudflare-tunnel cat /etc/cloudflared/config.yml
```

**常见原因**:
- 隧道 ID 错误
- 凭证文件不存在
- Docker 服务名称错误

### Q: DNS 解析失败

**检查**:
```powershell
# 验证 DNS 配置
nslookup storage-api.yourdomain.com

# 查看 DNS 路由
cloudflared tunnel route dns list
```

**解决**:
- 等待 DNS 传播 (最多5分钟)
- 如果没有域名,使用 Cloudflare 分配的 URL

### Q: API 连接超时

**检查**:
```powershell
# 验证本地服务
docker ps | grep storage

# 测试本地连接
Invoke-WebRequest -Uri "http://localhost:8081/api/sessions"
```

**解决**:
- 确保 storage-service 运行正常
- 检查 Docker 网络配置
- 增加 `config.yml` 中的 `connectTimeout`

---

## 📚 相关资源

- [完整迁移指南](CLOUDFLARE_TUNNEL_MIGRATION_GUIDE.md) - 详细步骤和配置说明
- [性能测试脚本](test-cloudflare-tunnel-performance.js) - 测试延迟和吞吐量
- [监控脚本](scripts/monitor-cloudflare-tunnel.ps1) - 健康检查和告警
- [Cloudflare 官方文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

---

## 🎯 下一步

**完成迁移后**:

1. ✅ 停止 ngrok 进程
2. ✅ 删除 ngrok 相关配置
3. ✅ 设置监控脚本后台运行
4. ✅ 通知团队成员 URL 已变更

**性能优化**:

```powershell
# 运行性能测试
node test-cloudflare-tunnel-performance.js

# 启动监控
.\scripts\monitor-cloudflare-tunnel.ps1 -TunnelURL "https://storage-api.yourdomain.com"
```

---

**🎉 恭喜! 你已成功设置 Cloudflare Tunnel，现在可以享受更稳定、更快速的生产环境了!**
