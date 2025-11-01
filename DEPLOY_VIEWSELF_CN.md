# 🚀 viewself.cn 部署配置 - 个性化指南

**用户**: mikelinzheyu
**仓库**: https://github.com/mikelinzheyu/storage.git
**域名**: viewself.cn
**服务器 IP**: 47.76.110.106
**生成日期**: 2025-10-30

---

## ✅ 已准备的信息

### 1. SSH 密钥已生成

**SSH 私钥位置**: `D:\code7\interview-system\.ssh\id_ed25519`

**SSH 私钥内容**（用于 GitHub Secret `CLOUD_SERVER_KEY`）:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACD86FEsl60G5Z+g5+uERavUAR/DtnYVFhwsknGEFfyrOQAAAJgxYQjZMWEI
2QAAAAtzc2gtZWQyNTUxOQAAACD86FEsl60G5Z+g5+uERavUAR/DtnYVFhwsknGEFfyrOQ
AAAEDGgLTsceXLW0eEYkFk25D9stqiWBmIsYKQeHd0gY5EjvzoUSyXrQbln6Dn64RFq9QB
H8O2dhUWHCyScYQV/Ks5AAAAFG1pa2VATEFQVE9QLUpRRVZSTjhLAQ==
-----END OPENSSH PRIVATE KEY-----
```

**SSH 公钥**（需要添加到云服务器）:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPzoUSyXrQbln6Dn64RFq9QBH8O2dhUWHCyScYQV/Ks5 mike@LAPTOP-JQEVRN8K
```

### 2. API 密钥已生成

**STORAGE_API_KEY**: `ak_prod_24641e8b8e94387132b17989e6a611dfb6bdca6e18982aad`

### 3. Redis 密码已生成

**REDIS_PASSWORD**: `608c442cb3c66a6215a39f17d8d08ae3`

---

## 📋 需要用户提供的信息

### ⚠️ SSH 用户名是什么？

你在前面选了"其他"。请告诉我你的云服务器 SSH 用户名：

**常见选项**:
- `root` - 大多数云服务器（阿里云、腾讯云 ECS）
- `ubuntu` - Ubuntu 18.04+ 镜像的默认用户
- `admin` - Debian 镜像的默认用户
- `ec2-user` - AWS EC2 的默认用户

**请告诉我你的云服务商和操作系统，我帮你确认用户名。**

---

## 📊 6 个 GitHub Secrets 完整清单

一旦你确认了 SSH 用户名，这是完整的 6 个 Secrets 配置：

| # | Secret 名称 | 值 |
|---|-----------|-----|
| 1 | `CLOUD_SERVER_IP` | `47.76.110.106` |
| 2 | `CLOUD_SERVER_USER` | `<待确认>` (root / ubuntu / admin 等) |
| 3 | `CLOUD_SERVER_KEY` | 见上面的 SSH 私钥内容 |
| 4 | `STORAGE_API_KEY` | `ak_prod_24641e8b8e94387132b17989e6a611dfb6bdca6e18982aad` |
| 5 | `REDIS_PASSWORD` | `608c442cb3c66a6215a39f17d8d08ae3` |
| 6 | `DOMAIN_NAME` | `viewself.cn` |

---

## 🔧 接下来的步骤

### 第 1 步：确认 SSH 用户名 ⏳

**请告诉我**:
- 你的云服务商是什么？(阿里云、腾讯云、AWS 等)
- 操作系统是什么？(Ubuntu 20.04, CentOS 7 等)
- 或者直接告诉我 SSH 用户名

### 第 2 步：配置 DNS A 记录（立即可做）

在你的域名管理后台（如阿里云、腾讯云等）添加：

**记录类型**: A
**主机记录**: @ (表示根域名)
**记录值**: 47.76.110.106
**TTL**: 600 (或自动)

完成后验证：
```bash
nslookup viewself.cn
# 应该返回 Address: 47.76.110.106
```

### 第 3 步：SSH 公钥配置（需要云服务器访问权限）

如果你已经能 SSH 到云服务器，执行：

```bash
# SSH 进入云服务器
ssh root@47.76.110.106  # 使用你的 SSH 用户名替换 root

# 创建 .ssh 目录（如果不存在）
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 添加公钥（将下面的公钥内容粘贴进去）
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPzoUSyXrQbln6Dn64RFq9QBH8O2dhUWHCyScYQV/Ks5 mike@LAPTOP-JQEVRN8K' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 验证 SSH 密钥登录
exit
```

然后在本地测试：
```bash
ssh -i D:\code7\interview-system\.ssh\id_ed25519 root@47.76.110.106
# 应该能成功连接，不需要输入密码
```

### 第 4 步：添加 GitHub Secrets（确认 SSH 用户名后）

1. 打开 https://github.com/mikelinzheyu/storage
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 逐个点击 **New repository secret** 添加 6 个 Secrets

### 第 5 步：推送代码到 GitHub

```bash
cd D:\code7\interview-system

# 配置 Git（如果还没配置）
git config --global user.name "Mike Lin"
git config --global user.email "your.email@gmail.com"

# 添加所有更改
git add .

# 提交
git commit -m "feat: Deploy storage service with Nginx to production"

# 推送到 GitHub（触发 GitHub Actions）
git push -u origin main
```

### 第 6 步：监控 GitHub Actions 部署

1. 打开 https://github.com/mikelinzheyu/storage/actions
2. 查看 **Deploy Storage Service to Cloud** 工作流
3. 等待部署完成（约 5-10 分钟）

### 第 7 步：验证云端部署

```bash
# SSH 到云服务器
ssh -i D:\code7\interview-system\.ssh\id_ed25519 root@47.76.110.106

# 检查容器状态
cd /home/interview-system/storage-service
docker-compose ps

# 测试 HTTPS 端点（在本地运行）
curl -H "Authorization: Bearer ak_prod_24641e8b8e94387132b17989e6a611dfb6bdca6e18982aad" \
  https://viewself.cn/api/sessions
```

---

## 📝 快速检查清单

- [ ] 确认 SSH 用户名（见第 1 步）
- [ ] 配置 DNS A 记录（见第 2 步）
- [ ] SSH 公钥已添加到云服务器（见第 3 步）
- [ ] 6 个 GitHub Secrets 已添加（见第 4 步）
- [ ] 代码已推送到 GitHub（见第 5 步）
- [ ] GitHub Actions 部署已完成（见第 6 步）
- [ ] HTTPS 端点验证成功（见第 7 步）

---

## 📞 故障排查

### SSH 连接失败
```bash
# 检查 SSH 密钥权限
icacls D:\code7\interview-system\.ssh\id_ed25519

# 可能需要修改权限（Windows）
# 右键属性 → 安全 → 编辑 → 只保留你的用户，其他删除
```

### DNS 未生效
- 等待 5-30 分钟
- 清空 DNS 缓存：`ipconfig /flushdns`
- 或使用 8.8.8.8 DNS 测试：`nslookup viewself.cn 8.8.8.8`

### GitHub Actions 失败
- 检查 Secrets 是否正确添加（看不到值是正常的）
- 查看 Actions 日志查找错误信息
- 常见错误：SSH 连接失败（用户名或密钥错误）

---

## 🎯 现在就开始！

**立即需要做的**（5 分钟）:

1. 告诉我你的云服务器 **SSH 用户名**
2. 在域名管理后台配置 **DNS A 记录**
3. （可选）验证 SSH 密钥可以登录云服务器

然后我会帮你完成剩余部分！

---

**准备好了吗？**

👉 请告诉我：
1. SSH 用户名是什么？
2. DNS A 记录是否已配置？
3. 是否需要帮助 SSH 到云服务器？
