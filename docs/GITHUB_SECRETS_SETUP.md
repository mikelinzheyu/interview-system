# GitHub Secrets 和环境变量配置指南

## 📌 什么是 GitHub Secrets？

GitHub Secrets 是一个安全的存储机制，用于存储敏感信息（密码、API密钥等），这些信息：
- ✅ 在 Actions 工作流中可以访问
- ✅ 不会显示在日志中
- ✅ 不会被提交到仓库
- ❌ 不能在 PR 中被访问（除非明确允许）

---

## 🔑 必需的 GitHub Secrets

### 1. 云服务器 SSH 配置

#### `CLOUD_SERVER_IP`
- **说明**: 云服务器的公网 IP 地址
- **示例**: `203.0.113.42`
- **获取方式**:
  - 阿里云: 服务器详情 → 公网IP
  - 腾讯云: 云服务器 → 公网IP
  - AWS: EC2 → 公有IPv4 地址

#### `CLOUD_SERVER_USER`
- **说明**: SSH 登录用户名
- **示例**: `root` 或 `ubuntu` (取决于系统)
- **获取方式**: 云服务商提供，通常是 `root` 或 `ec2-user`

#### `CLOUD_SERVER_KEY`
- **说明**: SSH 私钥（用于无密码登录）
- **格式**: 完整的 RSA 私钥（包括 `-----BEGIN RSA PRIVATE KEY-----`）
- **获取方式**:
  ```bash
  # Linux/Mac - 复制私钥内容
  cat ~/.ssh/id_rsa

  # Windows - 如果使用 PuTTY
  # 使用 PuTTYgen 生成的私钥
  ```

### 2. 存储服务配置

#### `STORAGE_API_KEY`
- **说明**: 存储服务的 API 密钥
- **长度**: 最少 32 字符（强密码）
- **生成方式**:
  ```bash
  # 使用 openssl
  openssl rand -base64 32

  # 输出示例: abcdefghijklmnopqrstuvwxyz123456789
  ```
- **用途**: Dify 工作流调用存储服务时使用
  ```
  Authorization: Bearer ak_prod_your_key_here
  ```

#### `REDIS_PASSWORD`
- **说明**: Redis 数据库的访问密码
- **长度**: 最少 16 字符（强密码）
- **生成方式**:
  ```bash
  # 使用 openssl
  openssl rand -base64 16

  # 输出示例: redis_password_123456
  ```

### 3. 域名信息

#### `DOMAIN_NAME`
- **说明**: 存储服务的域名
- **格式**: `storage.interview-system.com` 或 `storage.yourdomain.com`
- **获取方式**:
  - 从域名注册商购买
  - 在 DNS 管理中添加 A 记录指向云服务器 IP

---

## 🚀 配置步骤

### 第 1 步：生成密码和密钥

```bash
# 在本地运行这些命令

# 1. 生成 Storage API Key（32字符）
openssl rand -base64 32

# 2. 生成 Redis 密码（16字符）
openssl rand -base64 16

# 3. 生成或获取 SSH 私钥
cat ~/.ssh/id_rsa
```

### 第 2 步：登录 GitHub

1. 进入你的仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**

### 第 3 步：添加 Secrets

点击 **New repository secret**，逐个添加以下内容：

#### Secret 1: CLOUD_SERVER_IP
| 字段 | 值 |
|------|-----|
| Name | `CLOUD_SERVER_IP` |
| Secret | `203.0.113.42` (替换为你的IP) |

#### Secret 2: CLOUD_SERVER_USER
| 字段 | 值 |
|------|-----|
| Name | `CLOUD_SERVER_USER` |
| Secret | `root` |

#### Secret 3: CLOUD_SERVER_KEY
| 字段 | 值 |
|------|-----|
| Name | `CLOUD_SERVER_KEY` |
| Secret | (粘贴完整的私钥，包括 -----BEGIN------- 和 -------END-------) |

#### Secret 4: STORAGE_API_KEY
| 字段 | 值 |
|------|-----|
| Name | `STORAGE_API_KEY` |
| Secret | `ak_prod_生成的32字符密钥` |

#### Secret 5: REDIS_PASSWORD
| 字段 | 值 |
|------|-----|
| Name | `REDIS_PASSWORD` |
| Secret | `生成的16字符密码` |

#### Secret 6: DOMAIN_NAME
| 字段 | 值 |
|------|-----|
| Name | `DOMAIN_NAME` |
| Secret | `storage.interview-system.com` |

### 第 4 步：验证 Secrets

```bash
# 在 GitHub 中验证（Actions 工作流会显示加密的值）
echo "✓ 所有 Secrets 已添加"
```

---

## ⚠️ 安全最佳实践

### ✅ 应该做
- ✓ 使用强密码（最少 16-32 字符）
- ✓ 定期轮换密钥
- ✓ 为不同的环境使用不同的密钥
- ✓ 只授予必要的权限

### ❌ 不应该做
- ✗ 不要将 Secret 提交到代码库
- ✗ 不要在日志中打印 Secret
- ✗ 不要在其他地方公开 Secret
- ✗ 不要为多个服务使用相同的密钥

---

## 🔄 更新 Secrets

如果需要修改 Secret（如更换密码）：

1. 在 GitHub Settings 中找到对应的 Secret
2. 点击 **Update**
3. 输入新值
4. 保存更改

**注意**：更新后，新的工作流运行将使用新的值。旧的运行不会受到影响。

---

## 🐛 排查 Secrets 相关问题

### 问题 1: "Authorization failed" 或 "Access denied"

**可能原因**:
- SSH 密钥不正确
- `CLOUD_SERVER_USER` 和 `CLOUD_SERVER_IP` 的组合不正确
- 云服务器的防火墙未开放 22 端口

**解决方案**:
```bash
# 在本地测试 SSH 连接
ssh -i /path/to/private/key root@203.0.113.42

# 如果失败，检查密钥权限
chmod 600 /path/to/private/key
```

### 问题 2: "Secret not found"

**可能原因**:
- Secret 的名字拼写错误
- Secret 未添加到仓库

**解决方案**:
- 检查 GitHub Settings 中的 Secrets 列表
- 确保名字完全匹配（大小写敏感）

### 问题 3: Docker 构建失败

**可能原因**:
- `STORAGE_API_KEY` 包含特殊字符，需要转义
- `REDIS_PASSWORD` 中有空格

**解决方案**:
- 使用 `openssl rand -base64` 生成密钥（安全且无特殊字符）
- 避免在密码中使用引号、反斜杠等特殊字符

---

## 📋 Secrets 配置清单

完成后检查：

```
GitHub Secrets 配置:
  ☐ CLOUD_SERVER_IP - 云服务器公网IP
  ☐ CLOUD_SERVER_USER - SSH用户名（通常root）
  ☐ CLOUD_SERVER_KEY - SSH私钥（完整内容）
  ☐ STORAGE_API_KEY - 存储服务API密钥（32字符以上）
  ☐ REDIS_PASSWORD - Redis密码（16字符以上）
  ☐ DOMAIN_NAME - 域名（如storage.interview-system.com）

本地测试:
  ☐ SSH 连接可用: ssh -i key root@IP
  ☐ Docker Compose 本地运行成功
  ☐ API Key 和 Redis 密码不包含特殊字符

GitHub Actions:
  ☐ 工作流文件 (.github/workflows/deploy-storage-service.yml) 存在
  ☐ Actions 标签页显示可运行的工作流
  ☐ 可以手动触发工作流 (workflow_dispatch)
```

---

## 📚 参考资源

- [GitHub Secrets 官方文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 官方文档](https://docs.docker.com/)
- [Nginx 反向代理文档](https://nginx.org/en/docs/)

---

## 🎯 下一步

1. ✅ 配置好所有 6 个 GitHub Secrets
2. ✅ 验证 SSH 连接可用
3. ✅ 推送代码到 GitHub: `git push origin main`
4. ✅ 检查 GitHub Actions 是否自动触发
5. ✅ 监控部署日志
6. ✅ 在 Dify 中更新工作流 API 地址

---

**完成这些步骤后，你就拥有了完整的 CI/CD 自动化部署流程！** 🚀
