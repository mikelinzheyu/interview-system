# 🔧 存储服务部署工作流 - 关键问题修复报告

## 📋 问题分析与解决方案

根据 test3 文件的分析，发现了存储服务工作流文件 `deploy-interview-system-service.yml` 中的 **4 个严重问题**，已全部修复。

---

## ✅ 已修复的问题

### 问题 1️⃣ : Secret 变量名不统一 🚨

**原问题**：
```
工作流文件中使用的变量名与 build-deploy.yml 不一致
- 使用：CLOUD_SERVER_IP, CLOUD_SERVER_USER, CLOUD_SERVER_KEY
- 实际 Secrets：DEPLOY_HOST, DEPLOY_USER, DEPLOY_PRIVATE_KEY
```

**后果**：
- GitHub Actions 会找不到对应的 Secret
- 部署时 SSH 连接会再次报错：`ssh: Could not resolve hostname`

**✅ 修复方案**：
```yaml
# 修改前
CLOUD_SERVER_IP: ${{ secrets.CLOUD_SERVER_IP }}
CLOUD_SERVER_USER: ${{ secrets.CLOUD_SERVER_USER }}
CLOUD_SERVER_KEY: ${{ secrets.CLOUD_SERVER_KEY }}

# 修改后（与 build-deploy.yml 保持一致）
DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
DEPLOY_PRIVATE_KEY: ${{ secrets.DEPLOY_PRIVATE_KEY }}
DEPLOY_PORT: ${{ secrets.DEPLOY_PORT }}
```

**变量映射表**：
| 旧变量名 | 新变量名 | 对应 GitHub Secret | 说明 |
|---------|---------|------------------|------|
| CLOUD_SERVER_IP | DEPLOY_HOST | DEPLOY_HOST | 服务器 IP 或域名 |
| CLOUD_SERVER_USER | DEPLOY_USER | DEPLOY_USER | SSH 用户名 |
| CLOUD_SERVER_KEY | DEPLOY_PRIVATE_KEY | DEPLOY_PRIVATE_KEY | SSH 私钥 |
| 无 | DEPLOY_PORT | DEPLOY_PORT | SSH 端口（可选，默认 22） |

---

### 问题 2️⃣ : 毁灭性的 rm -rf 命令 💣💣💣

**原问题**（第 112 行）：
```bash
rm -rf /home/interview-system  # ⚠️ 极其危险！
mkdir -p /home/interview-system
```

**为什么这是致命问题**？

假设服务器上的目录结构：
```
/home/ubuntu/interview-system/
├── frontend/          ← 前端文件
├── backend/           ← 后端文件
├── storage-service/   ← 存储服务文件
└── docker-compose.prod.yml
```

当存储服务部署时执行 `rm -rf /home/interview-system`，会：
1. 删除所有前端源代码
2. 删除所有后端源代码
3. 删除存储服务源代码
4. 删除 docker-compose 配置
5. 删除 nginx 配置
6. **导致整个网站瘫痪！**

**后果**：
- 部署存储服务时会意外删除其他服务的所有文件
- 容器启动会失败（文件全部消失）
- 网站显示 404，整个应用宕机
- 所有配置文件丢失

**✅ 修复方案**：
```bash
# 修改前（危险！）
echo "清理并重建部署目录..."
rm -rf /home/interview-system
mkdir -p /home/interview-system

# 修改后（安全！）
if [ ! -d /home/ubuntu/interview-system ]; then
  echo "首次部署，创建部署目录并克隆仓库..."
  mkdir -p /home/ubuntu/interview-system
  cd /home/ubuntu/interview-system
  git clone https://x-access-token:$GITHUB_TOKEN@github.com/${{ github.repository }}.git .
else
  echo "后续部署，拉取最新更新..."
  cd /home/ubuntu/interview-system
  git fetch origin
  git reset --hard origin/main
fi
```

**改进点**：
1. ✅ 不删除任何现有文件
2. ✅ 使用 `git pull` 获取最新代码
3. ✅ 保持所有服务的文件完整
4. ✅ 只覆盖有改动的文件

---

### 问题 3️⃣ : 重复的 Docker 镜像构建 🔄

**原问题**：
```
第 4 步（GitHub Actions）：在 GitHub 的 Ubuntu runner 上构建 Docker 镜像
  ↓ （镜像构建完成，但没有被使用！）
第 5 步（远程服务器）：SSH 到服务器，再构建一次 Docker 镜像
```

**为什么浪费时间**？

| 步骤 | 位置 | 时间 | 结果 | 使用情况 |
|------|------|------|------|---------|
| 第 4 步 | GitHub Actions 服务器 | 2-5 分钟 | Docker 镜像已构建 | ❌ 未使用 |
| 第 5 步 | 远程服务器 | 5-10 分钟 | Docker 镜像构建 | ✅ 实际使用 |

**后果**：
- 浪费 2-5 分钟的部署时间
- 消耗 GitHub Actions 的构建资源
- 服务器 CPU 构建镜像时可能卡顿

**✅ 修复方案**：
```yaml
# 修改前：包含未使用的构建步骤
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v2

- name: Build Docker image
  run: |
    cd storage-service
    docker build -f Dockerfile.prod -t storage-service:latest .

# 修改后：直接跳到部署步骤
# （删除上面两步，直接在服务器上构建）
```

**改进点**：
- ✅ 删除 GitHub Actions 中的 Docker 构建步骤
- ✅ 只在服务器上构建一次
- ✅ 快速部署，节省 2-5 分钟

---

### 问题 4️⃣ : SSH 连接端口支持

**原问题**：
```bash
ssh -i ~/.ssh/id_rsa "$DEPLOY_USER@$DEPLOY_HOST" ...
# 硬编码默认端口 22，无法支持自定义端口
```

**✅ 修复方案**：
```bash
# 修改后：支持 DEPLOY_PORT 环境变量
ssh -i ~/.ssh/id_rsa -p ${DEPLOY_PORT:-22} "$DEPLOY_USER@$DEPLOY_HOST" ...
# 如果 DEPLOY_PORT 未设置，默认使用 22
```

**改进点**：
- ✅ 支持自定义 SSH 端口
- ✅ 向后兼容（未设置时默认 22）

---

## 📊 修复对比总结

| 问题 | 严重程度 | 影响范围 | 修复状态 |
|------|--------|--------|--------|
| Secret 名称不统一 | 🔴 致命 | 部署失败 | ✅ 已修复 |
| 毁灭性 rm -rf | 🔴 极严重 | 应用宕机 | ✅ 已修复 |
| 重复构建镜像 | 🟡 中等 | 浪费 2-5 分钟 | ✅ 已修复 |
| 端口支持 | 🟢 低 | 非标准端口不支持 | ✅ 已修复 |

---

## 🔐 修复后的工作流逻辑

```
用户推送代码到 main 分支
      ↓
GitHub Actions 检测到存储服务文件变更
      ↓
┌─────────────────────────────────┐
│ Step 1: 检出代码                 │
│ Step 2: 设置 Java 环境           │
│ Step 3: Maven 构建 JAR           │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ Step 4: SSH 连接服务器           │
│ ✅ 使用正确的 Secret 变量名      │
│ ✅ 支持自定义 SSH 端口           │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ Step 5: 远程服务器部署           │
│ ✅ 安全的 git 更新（无删除）     │
│ ✅ 单次 Docker 构建              │
│ ✅ 启动存储服务                  │
│ ✅ 健康检查                      │
└────────────┬────────────────────┘
             ↓
        ✅ 部署完成
```

---

## 📋 修复前的准备检查清单

部署存储服务前，请确保已完成：

- [ ] 在 GitHub Secrets 中配置了正确的 7 个变量：
  - `DEPLOY_HOST` - 服务器 IP/域名
  - `DEPLOY_USER` - SSH 用户名
  - `DEPLOY_PRIVATE_KEY` - SSH 私钥
  - `DEPLOY_PORT` - SSH 端口（可选，默认 22）
  - `STORAGE_API_KEY` - 存储服务 API 密钥
  - `REDIS_PASSWORD` - Redis 密码
  - `DOMAIN_NAME` - 域名（用于健康检查）

- [ ] 服务器上已存在或即将创建 `/home/ubuntu/interview-system` 目录

- [ ] 服务器上已安装 Docker 和 docker-compose

- [ ] 存储服务代码在 `storage-service/` 目录中

- [ ] 存储服务 Dockerfile 位于 `storage-service/Dockerfile.prod`

- [ ] 存储服务 docker-compose 配置位于 `storage-service/docker-compose-prod.yml`

---

## 🚀 修复后的部署步骤

### 第 1 次部署

```bash
# 1. 本地代码更新并推送
git add .
git commit -m "feat: Deploy storage service"
git push origin main

# 2. GitHub Actions 自动执行：
#    - Maven 构建 JAR
#    - SSH 连接到服务器
#    - Git clone 仓库到 /home/ubuntu/interview-system
#    - 构建 Docker 镜像
#    - 启动容器
#    - 健康检查

# 3. 验证部署
# 检查 Actions 日志：https://github.com/mikelinzheyu/interview-system/actions
# 检查服务：curl https://viewself.cn/api/sessions (需要 STORAGE_API_KEY)
```

### 后续部署

```bash
# 1. 代码更新
git add .
git commit -m "fix: Update storage service"
git push origin main

# 2. GitHub Actions 自动执行：
#    - Maven 构建 JAR
#    - SSH 连接到服务器
#    - Git fetch + reset（保留其他服务文件！）
#    - 构建 Docker 镜像
#    - 停止旧容器
#    - 启动新容器
#    - 健康检查
```

---

## ⚠️ 重要提醒

1. **不要手动修改工作流中的 Secret 变量名**
   - 必须与 GitHub Secrets 中的名称完全匹配
   - 大小写敏感！

2. **不要在 SSH 脚本中使用危险的 rm -rf**
   - 只删除特定的服务目录，不要删除根目录
   - 建议使用 git pull 进行安全更新

3. **保持 Secret 同步**
   - 所有工作流文件都应使用相同的 Secret 名称
   - 参考 `GITHUB_SECRETS_CONFIGURATION.md` 获取完整列表

4. **验证目录结构**
   - 确保存储服务配置文件正确命名（注意短横线 vs 点）
   - `docker-compose-prod.yml` 而不是 `docker-compose.prod.yml`

---

## 📚 相关文档

- **GitHub Secrets 配置**: `GITHUB_SECRETS_CONFIGURATION.md`
- **部署验证清单**: `DEPLOYMENT_VERIFICATION_CHECKLIST.md`
- **部署总结**: `DEPLOYMENT_SUMMARY.md`
- **工作流文件**: `.github/workflows/build-deploy.yml` (前端/后端)
- **工作流文件**: `.github/workflows/deploy-interview-system-service.yml` (存储服务) - **已修复**

---

## ✅ 修复完成

所有 4 个问题都已修复并提交到 main 分支。

**下一步**：
1. 推送代码到 GitHub（已完成）
2. 配置所有 GitHub Secrets
3. 触发工作流进行测试
4. 监控部署日志确保成功

---

**修复时间**: 2025-11-24
**修复提交**: `ebd60b0`
**文件**: `.github/workflows/deploy-interview-system-service.yml`
