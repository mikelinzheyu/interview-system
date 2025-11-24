# GitHub Secrets 配置指南 - 精简版

针对你的项目（**无 Java 存储服务**）的简化配置

---

## ✅ 必需的 7 个 Secrets

你的项目只需要配置这 **7 个 Secrets**（不需要 STORAGE_API_KEY）：

### 1. DEPLOY_HOST ⭐ 最重要
- **说明**：生产服务器 IP 地址或域名
- **类型**：明文
- **示例**：`123.45.67.89` 或 `viewself.cn`
- **必填**：✅ 是

### 2. DEPLOY_USER
- **说明**：SSH 登录用户名
- **类型**：明文
- **常见值**：`ubuntu` / `root` / `ec2-user`
- **必填**：✅ 是

### 3. DEPLOY_PRIVATE_KEY
- **说明**：SSH 私钥（用于连接服务器）
- **类型**：Secret（密文）
- **获取方式**：
  ```bash
  cat ~/.ssh/id_rsa
  ```
- **必填**：✅ 是

### 4. DEPLOY_PORT
- **说明**：SSH 连接端口
- **类型**：明文
- **默认值**：`22`
- **必填**：❌ 否（如使用标准端口 22，可不填）

### 5. DEPLOY_PATH
- **说明**：服务器上的部署目录
- **类型**：明文
- **示例**：`/home/ubuntu/interview-system`
- **必填**：✅ 是

### 6. ALIYUN_REGISTRY_USERNAME
- **说明**：阿里云容器仓库用户名
- **类型**：明文
- **获取**：https://cr.console.aliyun.com → 访问凭证
- **必填**：✅ 是

### 7. ALIYUN_REGISTRY_PASSWORD
- **说明**：阿里云容器仓库密码
- **类型**：Secret（密文）
- **获取**：https://cr.console.aliyun.com → 访问凭证 → 设置新密码
- **必填**：✅ 是

---

## ❌ 不需要的 Secrets

以下 Secrets 可以**删除或忽略**：

| Secret | 原因 |
|--------|------|
| ~~STORAGE_API_KEY~~ | 项目中没有 Java 存储服务 |
| ~~REDIS_PASSWORD~~ | Redis 在 docker-compose.prod.yml 中有默认值 |
| ~~DOMAIN_NAME~~ | 不需要用于主应用部署 |
| ~~STORAGE_SERVICE_*~~ | 存储服务相关，不适用 |

---

## 🚀 配置步骤

### Step 1: 访问 GitHub
访问你的仓库的 Secrets 设置：
```
https://github.com/mikelinzheyu/interview-system/settings/secrets/actions
```

### Step 2: 依次添加 7 个 Secrets

**按照以下顺序添加**：

```
1. DEPLOY_HOST              → 你的服务器 IP 或域名
2. DEPLOY_USER              → ubuntu
3. DEPLOY_PRIVATE_KEY       → 粘贴 ~/.ssh/id_rsa 内容
4. DEPLOY_PORT              → 22 (或你的自定义端口)
5. DEPLOY_PATH              → /home/ubuntu/interview-system
6. ALIYUN_REGISTRY_USERNAME → 你的阿里云用户名
7. ALIYUN_REGISTRY_PASSWORD → 你的阿里云密码
```

### Step 3: 验证配置
点击 "New repository secret" 按钮，所有 7 个都应该显示在列表中。

---

## 📋 配置检查清单

部署前，确保已完成：

- [ ] DEPLOY_HOST 已填写（服务器 IP 或域名）
- [ ] DEPLOY_USER 已填写（如 ubuntu）
- [ ] DEPLOY_PRIVATE_KEY 已粘贴完整的 SSH 私钥
- [ ] DEPLOY_PORT 已填写（默认 22）
- [ ] DEPLOY_PATH 已填写（如 /home/ubuntu/interview-system）
- [ ] ALIYUN_REGISTRY_USERNAME 已填写
- [ ] ALIYUN_REGISTRY_PASSWORD 已填写
- [ ] 所有 7 个 Secrets 在列表中显示

---

## 🧹 清理不必要的 Secrets

如果你之前配置了以下 Secrets，可以**删除**：

```
❌ CLOUD_SERVER_*         (已弃用，改用 DEPLOY_*)
❌ STORAGE_API_KEY         (没有 Java 存储服务)
❌ STORAGE_SERVICE_*       (不需要)
❌ DOMAIN_NAME             (不需要)
```

---

## 💡 快速参考

| 场景 | Secret | 值 |
|------|--------|-----|
| 个人服务器 | DEPLOY_HOST | 你的服务器 IP |
| 云服务器 | DEPLOY_HOST | 云服务器 IP 或域名 |
| 非 root 用户 | DEPLOY_USER | ubuntu |
| Root 用户 | DEPLOY_USER | root |
| 自定义 SSH 端口 | DEPLOY_PORT | 你的端口号 |
| 标准 SSH 端口 | DEPLOY_PORT | (不填，默认 22) |

---

**总结**：只需配置 **7 个 Secrets**，部署完全自动化！🚀
