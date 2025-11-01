# 🚀 部署配置 - 立即开始

**生成日期**: 2025-10-30
**状态**: 已收集用户信息，准备部署

---

## 📋 用户信息确认

```
域名：viewself.cn
公网 IP：47.76.110.106
主私网 IP：172.18.220.29
GitHub 仓库：https://github.com/mikelinzheyu/storage.git
```

---

## 🔑 生成的部署密钥

### 已自动生成的 Secrets

| Secret 名称 | 值 | 说明 |
|-----------|-----|------|
| `STORAGE_API_KEY` | `ak_prod_24641e8b8e94387132b17989e6a611dfb6bdca6e18982aad` | 存储服务 API 密钥 |
| `REDIS_PASSWORD` | `608c442cb3c66a6215a39f17d8d08ae3` | Redis 数据库密码 |

### 需要用户提供的 Secrets

| Secret 名称 | 值 | 获取方式 |
|-----------|-----|--------|
| `CLOUD_SERVER_IP` | `47.76.110.106` | ✅ 已有 |
| `CLOUD_SERVER_USER` | `root` | 通常是 root，如果不同请告诉我 |
| `CLOUD_SERVER_KEY` | `<SSH 私钥>` | 见下面的步骤 1 |
| `DOMAIN_NAME` | `storage.viewself.cn` | 建议使用此子域名 |

---

## 📝 完整的 6 个 GitHub Secrets 配置

### 配置步骤

1. 进入 GitHub 仓库：https://github.com/mikelinzheyu/storage
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 逐个添加以下 6 个 Secrets

### Secret 1: CLOUD_SERVER_IP
```
名称: CLOUD_SERVER_IP
值: 47.76.110.106
```

### Secret 2: CLOUD_SERVER_USER
```
名称: CLOUD_SERVER_USER
值: root
```
⚠️ **如果云服务器的 SSH 用户不是 root，请告诉我正确的用户名**

### Secret 3: CLOUD_SERVER_KEY (SSH 私钥)

**获取 SSH 私钥步骤**：

如果你已经有 SSH 密钥对（通常在 Windows 上）：
```powershell
# Windows PowerShell - 查看 SSH 私钥
Get-Content $env:USERPROFILE\.ssh\id_rsa

# 或者如果是 Ed25519 格式
Get-Content $env:USERPROFILE\.ssh\id_ed25519
```

如果你没有 SSH 密钥，需要先生成：
```powershell
# Windows PowerShell - 生成新的 SSH 密钥
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\id_ed25519 -N ""
# 然后查看公钥
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

然后：
1. 复制私钥内容（从 `-----BEGIN ...` 到 `-----END ...`）
2. 在 GitHub 中粘贴：
```
名称: CLOUD_SERVER_KEY
值: <粘贴你的 SSH 私钥内容>
```

### Secret 4: STORAGE_API_KEY
```
名称: STORAGE_API_KEY
值: ak_prod_24641e8b8e94387132b17989e6a611dfb6bdca6e18982aad
```

### Secret 5: REDIS_PASSWORD
```
名称: REDIS_PASSWORD
值: 608c442cb3c66a6215a39f17d8d08ae3
```

### Secret 6: DOMAIN_NAME
```
名称: DOMAIN_NAME
值: storage.viewself.cn
```

---

## 🌐 DNS 配置（重要！）

你需要将你的域名 `viewself.cn` 的 DNS A 记录指向云服务器 IP。

### 配置步骤

1. 登录你的域名注册商管理后台（如阿里云、腾讯云等）
2. 找到 **DNS 管理** 或 **解析管理**
3. 添加或修改 DNS 记录：

| 记录类型 | 主机记录 | 记录值 | 说明 |
|--------|--------|-------|------|
| A | storage | 47.76.110.106 | 指向云服务器 |

4. 等待 DNS 生效（通常 5-30 分钟）

### 验证 DNS 是否生效

```bash
# Windows PowerShell
nslookup storage.viewself.cn
# 应该返回 Address: 47.76.110.106

# 或使用 ping
ping storage.viewself.cn
```

---

## 📦 代码部署步骤

### 第 1 步：更新本地代码仓库

```bash
cd D:\code7\interview-system

# 添加远程仓库（如果还没有）
git remote add origin https://github.com/mikelinzheyu/storage.git

# 或如果已有，更新远程地址
git remote set-url origin https://github.com/mikelinzheyu/storage.git

# 验证远程仓库
git remote -v
```

### 第 2 步：提交所有更改

```bash
# 查看当前状态
git status

# 如果有新文件，添加到暂存区
git add .

# 提交更改
git commit -m "feat: Add storage service with Nginx deployment ready"

# 推送到 GitHub
git push -u origin main
```

⚠️ **注意**：如果推送时出现错误，可能需要：
- 设置 GitHub Personal Access Token
- 或使用 SSH 认证

---

## ✅ 部署清单

### 准备阶段 (现在)
- [ ] 收集 SSH 私钥（见 Secret 3 部分）
- [ ] 确认 SSH 用户名（通常是 root）
- [ ] 添加 6 个 GitHub Secrets
- [ ] 配置 DNS A 记录
- [ ] 推送代码到 GitHub

### 部署阶段 (自动)
- [ ] GitHub Actions 自动触发部署
- [ ] 云服务器自动安装 Docker 和依赖
- [ ] 自动构建和启动容器
- [ ] 自动配置 Nginx 和 SSL 证书

### 验证阶段 (手动检查)
- [ ] SSH 登录云服务器
- [ ] 检查容器运行状态
- [ ] 测试 HTTPS 端点
- [ ] 验证 API 密钥认证

---

## 🎯 现在就开始！

### 立即需要做的事（15 分钟）

1. **收集 SSH 私钥**（5 分钟）
   ```powershell
   # 查看你的 SSH 私钥
   Get-Content $env:USERPROFILE\.ssh\id_rsa
   # 或
   Get-Content $env:USERPROFILE\.ssh\id_ed25519
   ```

2. **确认 SSH 用户名**（1 分钟）
   - 通常是 `root`
   - 如果不确定，请告诉我你的云服务商

3. **配置 GitHub Secrets**（5 分钟）
   - 打开 GitHub → Settings → Secrets
   - 粘贴上面的 6 个 Secrets

4. **配置 DNS A 记录**（3 分钟）
   - 在域名管理后台添加 A 记录
   - 指向 47.76.110.106

5. **推送代码到 GitHub**（1 分钟）
   ```bash
   git push -u origin main
   ```

---

## 📞 如果遇到问题

### SSH 密钥问题
- 如果没有 SSH 密钥，使用 ssh-keygen 生成
- 确保 SSH 公钥已添加到云服务器的 ~/.ssh/authorized_keys

### DNS 未生效
- 等待 5-30 分钟后再次验证
- 尝试清空本地 DNS 缓存

### 代码推送失败
- 检查 GitHub 认证（Token 或 SSH）
- 确认仓库地址正确

---

## 📚 参考文档

- **完整部署指南**: DEPLOYMENT_HANDOVER.md
- **快速启动**: QUICK_START_DEPLOYMENT.md
- **GitHub Secrets 详解**: GITHUB_SECRETS_SETUP.md
- **监控和维护**: MONITORING_AND_MAINTENANCE.md

---

**准备好了吗？现在就开始吧！** 🚀

请告诉我：
1. 你的 SSH 私钥内容（或确认你没有）
2. SSH 用户名是否为 root
3. 完整的域名应该是什么（storage.viewself.cn 还是其他）
