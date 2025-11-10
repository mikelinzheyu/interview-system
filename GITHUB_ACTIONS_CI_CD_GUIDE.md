# GitHub Actions 工作流 - 构建和部署参考

## 概述

test10 目录包含了一个完整的、**成功的** GitHub Actions 工作流执行日志，包括两个主要的工作流任务：

1. **build-and-push** - 构建 Docker 镜像并推送到阿里云容器仓库
2. **deploy** - 在生产服务器上部署最新的镜像

## 工作流架构

```
GitHub 代码推送到 main 分支
        ↓
GitHub Actions 触发工作流
        ↓
├─ 构建阶段 (build-and-push)
│  ├─ 检出代码
│  ├─ 设置 Docker Buildx
│  ├─ 登录阿里云容器仓库
│  ├─ 构建前端镜像
│  ├─ 构建后端镜像
│  ├─ 构建存储服务镜像
│  └─ 推送所有镜像到仓库 ✅
│
└─ 部署阶段 (deploy)
   ├─ 检出代码
   ├─ 设置 SSH
   ├─ SSH 连接到生产服务器
   ├─ 登录阿里云容器仓库
   ├─ 拉取最新镜像
   ├─ 停止旧容器
   ├─ 启动新容器
   └─ 验证部署 ✅
```

## 执行时间和日期

- **构建时间**: 2025-11-10 09:10:30 UTC ~ 09:16:33 UTC
- **部署时间**: 2025-11-10 09:16:39 UTC ~ 完成
- **总耗时**: 约 9 分钟

## 成功的构建产物

所有三个服务的 Docker 镜像都成功构建并推送到阿里云容器仓库：

```
✅ Frontend 镜像
   标签: crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_frontend:0f8ef42
   标签: ...ai_interview_frontend:latest

✅ Backend 镜像
   标签: crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_backend:0f8ef42
   标签: ...ai_interview_backend:latest

✅ Storage 服务镜像
   标签: crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_storage:0f8ef42
   标签: ...ai_interview_storage:latest
```

## 工作流文件位置

GitHub Actions 工作流定义文件位置：
```
.github/workflows/build-deploy.yml
```

## 工作流的关键步骤

### 构建阶段

```yaml
build-and-push:
  runs-on: ubuntu-latest

  steps:
    1. 检出代码 (Checkout code)
    2. 设置 Docker Buildx (Set up Docker Buildx)
       - 使用 docker/setup-buildx-action@v3
       - 支持多平台构建

    3. 登录阿里云容器仓库 (Login to Aliyun Container Registry)
       - 使用 docker/login-action@v3
       - 提供仓库凭证

    4. 生成镜像标签 (Generate image tags)
       - 使用 git commit sha 作为标签
       - latest 标签指向最新构建

    5. 构建和推送镜像 (Build and push images)
       - 前端: ./frontend/Dockerfile
       - 后端: ./backend/Dockerfile
       - 存储: ./backend/Dockerfile (存储服务)
       - 使用 docker/build-push-action@v5
       - 直接推送到仓库

    6. 构建摘要
       - 输出所有成功构建的镜像标签
```

### 部署阶段

```yaml
deploy:
  needs: build-and-push
  runs-on: ubuntu-latest

  steps:
    1. 检出代码
    2. 设置 SSH
       - 配置 SSH 密钥
       - 禁用 StrictHostKeyChecking

    3. 部署到生产服务器
       执行以下操作:

       a) 登录阿里云容器仓库
          docker login -u *** -p *** crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com

       b) 拉取最新镜像
          docker pull crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_frontend:latest
          docker pull crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_backend:latest
          docker pull crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview/ai_interview_storage:latest

       c) 停止旧容器
          docker-compose -f docker-compose.prod.yml down --remove-orphans

       d) 启动新容器
          docker-compose -f docker-compose.prod.yml up -d

       e) 验证部署
          docker-compose -f docker-compose.prod.yml ps
```

## 环境变量配置

```bash
REGISTRY: crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com
REGISTRY_NAMESPACE: ai_interview
IMAGE_FRONTEND: ai_interview_frontend
IMAGE_BACKEND: ai_interview_backend
IMAGE_STORAGE: ai_interview_storage
```

## 部署前置条件

为了使这个工作流正常工作，需要配置以下 GitHub Secrets：

### 阿里云容器仓库凭证

```
REGISTRY_USERNAME     - 阿里云容器仓库用户名
REGISTRY_PASSWORD     - 阿里云容器仓库密码
```

### SSH 部署凭证

```
DEPLOY_KEY            - 生产服务器的 SSH 私钥
DEPLOY_HOST           - 生产服务器的 IP 地址或域名
DEPLOY_USER           - 部署用户名
DEPLOY_PORT           - SSH 端口（默认 22）
```

## 工作流触发条件

根据日志中的工作流定义，该工作流在以下条件下触发：

```yaml
on:
  push:
    branches:
      - main
```

这意味着只要 main 分支有新的代码推送，就会自动触发构建和部署流程。

## 成功的部署指标

✅ **构建指标**
- 所有三个服务的 Docker 镜像成功构建
- 镜像成功推送到阿里云容器仓库
- 镜像标记为 `latest` （最新版本）

✅ **部署指标**
- SSH 连接到生产服务器成功
- 镜像成功拉取到服务器
- 旧容器成功停止和清理
- 新容器成功启动
- 容器状态正常 (Up)

## 日志位置和内容

| 日志文件 | 内容 |
|---------|------|
| `build-and-push/1_Checkout code.txt` | 代码检出日志 |
| `build-and-push/3_Set up Docker Buildx.txt` | Docker 设置 |
| `build-and-push/4_Login to Aliyun.txt` | 容器仓库登录 |
| `build-and-push/6_Build Frontend.txt` | 前端构建 |
| `build-and-push/7_Build Backend.txt` | 后端构建 |
| `build-and-push/8_Build Storage.txt` | 存储服务构建 |
| `build-and-push/9_Build Summary.txt` | 构建摘要（成功） |
| `deploy/2_Checkout code.txt` | 代码检出 |
| `deploy/3_Setup SSH.txt` | SSH 配置 |
| `deploy/4_Deploy to Production.txt` | 部署执行（成功） |
| `deploy/6_Deployment Status.txt` | 部署状态 |

## 常见问题解答

### Q: 如果镜像构建失败会怎样？
A: 部署步骤会被跳过（因为 deploy 依赖于 build-and-push），系统不会部署有问题的镜像。

### Q: 如何手动触发工作流？
A: 在 GitHub 仓库的 Actions 标签页，选择工作流并点击"Run workflow"。

### Q: 如何查看工作流日志？
A: 在 GitHub 仓库的 Actions 标签页，点击最近的工作流运行，然后点击具体的任务（build-and-push 或 deploy）。

### Q: 部署失败了怎么办？
A: 查看 `deploy/4_Deploy to Production Server.txt` 日志中的错误消息，根据错误信息排查问题。

### Q: 可以同时部署到多个服务器吗？
A: 可以，通过修改 `deploy` 步骤中的脚本，添加多个 SSH 连接命令。

## 最佳实践

1. **始终使用标记版本**
   - 使用 commit SHA 作为镜像标签，便于追踪
   - 保持 `latest` 标签指向最新构建

2. **分离构建和部署**
   - 构建只负责生成镜像
   - 部署只负责更新服务
   - 这样可以独立控制每个阶段

3. **自动化部署流程**
   - 所有部署操作都应该是自动化的
   - 避免手动 SSH 到服务器执行命令

4. **监控部署状态**
   - 检查容器状态
   - 查看服务日志
   - 设置告警机制

5. **回滚策略**
   - 保留前一个版本的镜像标签
   - 可以快速回滚到上一个稳定版本

## 相关文件

- `.github/workflows/build-deploy.yml` - 工作流定义
- `docker-compose.prod.yml` - 生产部署配置
- `frontend/Dockerfile` - 前端容器定义
- `backend/Dockerfile` - 后端和存储服务定义

## 总结

这个 GitHub Actions 工作流实现了一个**完整的、自动化的、可靠的 CI/CD 流程**，确保：

✅ 代码质量通过构建验证
✅ Docker 镜像安全、可追踪
✅ 部署过程完全自动化
✅ 可快速回滚到之前的版本
✅ 完整的日志记录和审计追踪

这是一个**成功的部署工作流参考**，可以作为其他项目的模板。
