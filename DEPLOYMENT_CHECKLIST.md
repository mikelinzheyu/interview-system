# 🎯 部署检查清单 - 实时跟踪

## 你现在的进度

**已完成:**
- ✅ 添加GitHub Secrets (7个配置)

**下一步需要做:**

---

## 📋 部署步骤检查清单

### 🔧 Step 1: 准备生产服务器 (15-20分钟)

- [ ] **连接到服务器**
  ```bash
  ssh -i ~/.ssh/interview_deploy root@47.76.110.106
  ```

- [ ] **安装Docker**
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  docker --version  # 验证
  ```

- [ ] **安装Docker Compose**
  ```bash
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  docker-compose --version  # 验证
  ```

- [ ] **创建部署目录**
  ```bash
  mkdir -p /opt/interview-system
  cd /opt/interview-system
  mkdir -p data/{db,redis,uploads,backups}
  mkdir -p logs/{backend,frontend,db,redis,nginx}
  ```

- [ ] **克隆项目代码**
  ```bash
  git clone https://github.com/mikelinzheyu/interview-system.git .
  ls -la  # 验证
  ```

### 🔐 Step 2: 获取SSL证书 (5-10分钟)

- [ ] **安装Certbot**
  ```bash
  apt-get install -y certbot python3-certbot-nginx
  certbot --version  # 验证
  ```

- [ ] **获取Let's Encrypt证书**
  ```bash
  certbot certonly --standalone -d viewself.cn --agree-tos --register-unsafely-without-email
  ls /etc/letsencrypt/live/viewself.cn/  # 验证
  ```

### ⚙️ Step 3: 配置.env.prod (10分钟)

- [ ] **编辑配置文件**
  ```bash
  cd /opt/interview-system
  vi .env.prod
  ```

- [ ] **修改必要的配置**
  - [ ] `DB_PASSWORD` - 强密码
  - [ ] `REDIS_PASSWORD` - 强密码
  - [ ] `JWT_SECRET` - 强密钥（最少32字符）
  - [ ] `DIFY_API_KEY` - 实际的Dify API密钥
  - [ ] `DIFY_WORKFLOW_1_ID` - 工作流1 ID
  - [ ] `DIFY_WORKFLOW_2_ID` - 工作流2 ID
  - [ ] `DIFY_WORKFLOW_3_ID` - 工作流3 ID
  - [ ] `GRAFANA_PASSWORD` - Grafana密码

- [ ] **验证配置**
  ```bash
  cat .env.prod | grep -E "DB_PASSWORD|DIFY_API_KEY"
  # 不应该看到 "your-*" 占位符
  ```

### 🐳 Step 4: 手动测试部署 (20-30分钟)

- [ ] **登录阿里云容器仓库**
  ```bash
  docker login -u your-aliyun-username -p your-aliyun-password \
    crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com
  ```

- [ ] **启动所有服务**
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  sleep 30  # 等待容器启动
  ```

- [ ] **检查容器状态**
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  # 所有容器应该显示 "Up (healthy)"
  ```

- [ ] **检查应用是否可访问**
  ```bash
  curl -I https://viewself.cn
  curl -I https://viewself.cn/api/health
  # 应该返回 200
  ```

- [ ] **查看日志确保无错误**
  ```bash
  docker-compose -f docker-compose.prod.yml logs --tail=50
  # 检查是否有ERROR信息
  ```

### 🚀 Step 5: 触发GitHub Actions自动部署 (5分钟)

- [ ] **在本地推送代码**
  ```bash
  git add .
  git commit -m "feat: 完成生产部署配置"
  git push origin main
  ```

- [ ] **监控GitHub Actions**
  访问: https://github.com/mikelinzheyu/interview-system/actions

  - [ ] 工作流开始运行
  - [ ] 前端镜像构建完成 (~10分钟)
  - [ ] 后端镜像构建完成 (~10分钟)
  - [ ] 推送到阿里云完成 (~5分钟)
  - [ ] 部署到服务器完成 (~5分钟)

### ✅ Step 6: 验证最终部署 (5分钟)

- [ ] **应用主页可访问**
  访问: https://viewself.cn
  ```bash
  curl -I https://viewself.cn
  # HTTP/2 200 或 HTTP/1.1 200
  ```

- [ ] **API健康检查通过**
  ```bash
  curl https://viewself.cn/api/health
  ```

- [ ] **Grafana监控可访问**
  访问: https://viewself.cn:3000
  用户名: admin
  密码: 见.env.prod

- [ ] **Prometheus可访问**
  访问: https://viewself.cn:9090

- [ ] **所有容器保持运行**
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  # 无容器重启，都显示 "Up"
  ```

---

## 🎯 进度总结

| 步骤 | 项目 | 状态 | 耗时 |
|------|------|------|------|
| 1 | 准备服务器 | ⏳ 待做 | 15-20min |
| 2 | 获取SSL证书 | ⏳ 待做 | 5-10min |
| 3 | 配置.env.prod | ⏳ 待做 | 10min |
| 4 | 手动测试 | ⏳ 待做 | 20-30min |
| 5 | 触发自动部署 | ⏳ 待做 | 30-40min |
| 6 | 验证部署 | ⏳ 待做 | 5min |
| **总耗时** | | | **约2小时** |

---

## 💡 关键提示

### ⚠️ 重要注意事项

1. **不要跳过.env.prod配置**
   - 必须修改所有 `your-*` 占位符
   - 使用强密码和密钥
   - Dify API密钥是必需的

2. **第一次部署需要时间**
   - 镜像构建: 20-30分钟
   - GitHub Actions运行: 30-40分钟
   - 总共: 1-2小时
   - 请耐心等待，不要中途中断

3. **监控日志很重要**
   - GitHub Actions: 查看构建日志
   - 服务器: 查看容器日志
   - 问题出现时检查日志找根因

4. **防火墙配置**
   - 确保80和443端口开放
   - 如果无法访问，检查安全组规则

### ✨ 快速命令参考

```bash
# 连接到服务器
ssh -i ~/.ssh/interview_deploy root@47.76.110.106

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看实时日志
docker-compose -f docker-compose.prod.yml logs -f

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# 手动更新应用
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml restart
```

---

## 📞 实时问题排查

如果遇到问题，请提供：

1. **问题描述** - 什么步骤出了问题？
2. **错误信息** - 完整的错误输出
3. **日志输出** - GitHub Actions或容器日志
4. **你的环境** - 服务器配置、OS版本等

---

## 🎉 预期结果

部署成功后你将拥有：

✅ **完整的在线应用** - https://viewself.cn
✅ **实时监控系统** - Grafana仪表板
✅ **性能指标收集** - Prometheus
✅ **集中日志管理** - Loki
✅ **自动化部署** - push即部署
✅ **高可用架构** - 容器自动重启
✅ **SSL/HTTPS** - 安全加密
✅ **监控告警** - 发现问题

---

**现在就开始部署吧！按照检查清单一步步进行。** 🚀

**我会在这里等你的进度报告！** 👋
