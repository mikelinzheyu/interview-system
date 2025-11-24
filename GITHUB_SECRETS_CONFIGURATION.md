# GitHub Secrets 完整配置指南

本文档列出了部署Interview System所需的所有GitHub Secrets。

## 📋 Secrets 配置清单

### 1️⃣ SSH 连接相关 Secrets

#### SECRET: `SSH_PRIVATE_KEY`
**说明**: SSH私钥，用于连接生产服务器
**必填**: ✅ 是
**类型**: 私密文本
**获取方式**:
```bash
# 如果已有SSH密钥
cat ~/.ssh/id_rsa

# 如果没有SSH密钥，先生成
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
cat ~/.ssh/id_rsa
```
**格式示例**:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2Z...
[中间省略很多行]
...6z9KQ0gB
-----END RSA PRIVATE KEY-----
```
**配置方式**: 复制整个私钥内容（包括BEGIN和END行）粘贴到Secret中

---

#### SECRET: `SERVER_HOST`
**说明**: 生产服务器的IP地址或域名
**必填**: ✅ 是
**类型**: 明文
**示例**:
```
123.45.67.89
```
或
```
prod.example.com
```
**注意**: ⚠️ 不能为空，必须是有效的IP或域名

---

#### SECRET: `SSH_USER`
**说明**: SSH登录用户名
**必填**: ✅ 是
**类型**: 明文
**常见值**:
```
ubuntu        (AWS、阿里云ECS常用)
root          (如果有root权限)
ec2-user      (Amazon Linux)
admin         (其他系统)
```
**示例**: `ubuntu`

---

#### SECRET: `SSH_PORT` (可选)
**说明**: SSH连接端口
**必填**: ❌ 否（默认22）
**类型**: 明文
**默认值**: `22`
**示例**:
```
22            (默认)
2222          (自定义端口)
```

---

### 2️⃣ 阿里云容器仓库相关 Secrets

#### SECRET: `ALIYUN_REGISTRY_USERNAME`
**说明**: 阿里云容器仓库的登录用户名
**必填**: ✅ 是
**类型**: 明文
**获取方式**:
1. 登录 https://cr.console.aliyun.com
2. 进入 "个人实例" 或 "企业实例"
3. 左侧 "访问凭证"
4. 查看 "用户名"（通常是账户ID或邮箱）

**示例**:
```
123456789
```
或
```
user@example.com
```

---

#### SECRET: `ALIYUN_REGISTRY_PASSWORD`
**说明**: 阿里云容器仓库的登录密码
**必填**: ✅ 是
**类型**: 密码（Secret）
**获取方式**:
1. 登录 https://cr.console.aliyun.com
2. 进入 "个人实例" 或 "企业实例"
3. 左侧 "访问凭证"
4. 如果没有密码，点击 "设置新密码"
5. 复制生成的密码

**注意**: ⚠️ 密码只显示一次，请妥善保管

---

#### SECRET: `ALIYUN_REGISTRY_URL` (可选)
**说明**: 阿里云容器仓库的地址
**必填**: ❌ 否（如需自定义）
**类型**: 明文
**默认值**: `crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com`
**获取方式**:
1. 登录 https://cr.console.aliyun.com
2. 进入 "个人实例" 或 "企业实例"
3. 左侧 "镜像仓库"
4. 查看仓库详情中的"仓库地址"

**示例**:
```
crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com
```

---

### 3️⃣ 应用配置相关 Secrets (可选)

#### SECRET: `MONGODB_URI`
**说明**: MongoDB数据库连接字符串
**必填**: ❌ 否（如果使用MongoDB）
**类型**: 密码（Secret）
**格式**:
```
mongodb://username:password@host:port/database
```
或
```
mongodb+srv://username:password@cluster.mongodb.net/database
```
**示例**:
```
mongodb://admin:password123@db.example.com:27017/interview_system
```

---

#### SECRET: `JWT_SECRET`
**说明**: JWT签名密钥
**必填**: ❌ 否（但建议配置）
**类型**: 密码（Secret）
**生成方式**:
```bash
# 生成随机JWT密钥
openssl rand -base64 32
```
**示例**:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

#### SECRET: `REDIS_PASSWORD`
**说明**: Redis数据库密码
**必填**: ❌ 否（如果Redis设置了密码）
**类型**: 密码（Secret）
**示例**:
```
myredispassword123
```

---

## 🔧 如何在GitHub配置Secrets

### 步骤1：访问仓库Settings
1. 进入 https://github.com/mikelinzheyu/interview-system
2. 点击 **Settings** 标签
3. 左侧菜单选择 **Secrets and variables** → **Actions**

### 步骤2：添加新Secret
1. 点击 **New repository secret** 按钮
2. 在 **Name** 字段填入Secret名称（如 `SSH_PRIVATE_KEY`）
3. 在 **Secret** 字段填入对应的值
4. 点击 **Add secret** 保存

### 步骤3：重复添加所有Secrets
按照下面的必需Secrets清单，逐个添加

---

## ✅ 必需 Secrets 总结表

| # | Secret名称 | 必填 | 类型 | 用途 |
|---|-----------|------|------|------|
| 1 | `SSH_PRIVATE_KEY` | ✅ | Secret | SSH连接服务器 |
| 2 | `SERVER_HOST` | ✅ | 明文 | 服务器IP/域名 |
| 3 | `SSH_USER` | ✅ | 明文 | SSH用户名 |
| 4 | `ALIYUN_REGISTRY_USERNAME` | ✅ | 明文 | 阿里云用户名 |
| 5 | `ALIYUN_REGISTRY_PASSWORD` | ✅ | Secret | 阿里云密码 |
| 6 | `SSH_PORT` | ❌ | 明文 | SSH端口（默认22） |
| 7 | `ALIYUN_REGISTRY_URL` | ❌ | 明文 | 阿里云仓库地址 |
| 8 | `MONGODB_URI` | ❌ | Secret | MongoDB连接 |
| 9 | `JWT_SECRET` | ❌ | Secret | JWT密钥 |
| 10 | `REDIS_PASSWORD` | ❌ | Secret | Redis密码 |

---

## 📝 配置示例

### 最小配置（必需Secrets）
```
SSH_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
SERVER_HOST=123.45.67.89
SSH_USER=ubuntu
ALIYUN_REGISTRY_USERNAME=123456789
ALIYUN_REGISTRY_PASSWORD=myaliyunpassword
```

### 完整配置（所有Secrets）
```
SSH_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
SERVER_HOST=123.45.67.89
SSH_USER=ubuntu
SSH_PORT=22
ALIYUN_REGISTRY_USERNAME=123456789
ALIYUN_REGISTRY_PASSWORD=myaliyunpassword
ALIYUN_REGISTRY_URL=crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com
MONGODB_URI=mongodb://admin:password@db.example.com:27017/interview_system
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
REDIS_PASSWORD=myredispassword
```

---

## 🚀 验证Secrets配置

### 检查清单
- [ ] `SSH_PRIVATE_KEY` 已填入完整的私钥（包括BEGIN/END行）
- [ ] `SERVER_HOST` 不为空，是有效的IP或域名
- [ ] `SSH_USER` 已填入正确的用户名
- [ ] `ALIYUN_REGISTRY_USERNAME` 已填入
- [ ] `ALIYUN_REGISTRY_PASSWORD` 已填入
- [ ] 所有Secret都已保存（不显示"Add secret"按钮）

### 测试部署
1. 在本地进行一个代码修改
2. 推送到GitHub的main分支
3. 访问 https://github.com/mikelinzheyu/interview-system/actions
4. 查看工作流运行状态

---

## ⚠️ 常见问题

### Q: "ssh: Could not resolve hostname" 错误
**A**: `SERVER_HOST` Secret为空或无效。请确保填入了正确的服务器IP或域名。

### Q: "Permission denied (publickey)" 错误
**A**: SSH_PRIVATE_KEY格式错误或权限不匹配。请确保：
- 私钥包含完整的BEGIN/END行
- 服务器上已添加对应的公钥到 `~/.ssh/authorized_keys`

### Q: "unauthorized: authentication required" 错误（阿里云）
**A**: 阿里云凭证错误。请确保：
- `ALIYUN_REGISTRY_USERNAME` 正确
- `ALIYUN_REGISTRY_PASSWORD` 正确且未过期

---

## 🔒 安全建议

1. ✅ 使用专用的部署用户（不要用root）
2. ✅ SSH密钥只有部署用户有权限访问
3. ✅ 定期轮换SSH密钥和阿里云凭证
4. ✅ 不要在代码中硬编码任何敏感信息
5. ✅ 定期检查GitHub Actions运行日志

---

**现在就配置这些Secrets，然后推送代码到main分支自动部署！** 🚀
