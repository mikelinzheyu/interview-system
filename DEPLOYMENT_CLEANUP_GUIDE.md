# 服务器部署目录清理指南

根据 test3 的分析，当前部署失败的原因是：
- GitHub Actions 工作流试图用 `git clone` 克隆仓库到服务器
- 但服务器上的 `/opt/interview-system` 目录已经存在且非空
- Git 拒绝向非空目录克隆

## 解决方案

需要手动清理服务器上的旧部署目录，为全自动化部署创造"第一次运行"的完美环境。

---

## 步骤 1：登录服务器并清理旧目录

在你的本地机器上执行以下命令：

### 方式 A：使用清理脚本（推荐）

```bash
# 1. 上传清理脚本到服务器
scp -P 22 cleanup-deployment.sh root@47.76.110.106:/tmp/

# 2. 登录服务器
ssh root@47.76.110.106

# 3. 在服务器上运行清理脚本
bash /tmp/cleanup-deployment.sh

# 4. 退出服务器
exit
```

### 方式 B：手动执行清理命令

如果脚本有问题，可以直接在服务器上手动执行：

```bash
# 1. 登录服务器
ssh root@47.76.110.106

# 2. 进入部署目录
cd /opt/interview-system

# 3. 停止容器（可能失败，没关系）
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# 4. 回到上级目录
cd /opt

# 5. 彻底删除旧目录
rm -rf interview-system

# 6. 确认删除成功
ls -la /opt | grep interview

# 7. 退出服务器
exit
```

---

## 步骤 2：重新触发 GitHub Actions 工作流

完成服务器清理后：

1. 打开 GitHub 仓库：https://github.com/mikelinzheyu/interview-system
2. 点击 "Actions" 标签
3. 找到最新的失败工作流
4. 点击 "Re-run all jobs" 按钮
5. 静候部署完成

---

## 预期的部署流程

清理完成后，下次部署将：

1. ✅ GitHub Actions 连接到服务器
2. ✅ 创建空的 `/opt/interview-system` 目录
3. ✅ 执行 `git clone` 克隆整个仓库（包括 nginx.conf、docker-compose.prod.yml）
4. ✅ 生成 `.env.prod` 文件
5. ✅ 登录阿里云容器仓库
6. ✅ 拉取最新的 Docker 镜像
7. ✅ 执行 `docker-compose up -d` 启动所有服务
8. ✅ 部署成功！

---

## 故障排查

如果清理后仍然出现问题，检查以下内容：

### 1. 确认目录已删除
```bash
ssh root@47.76.110.106 "ls -la /opt"
```
输出中不应该看到 `interview-system` 目录

### 2. 检查 GitHub 秘密是否正确配置
访问：https://github.com/mikelinzheyu/interview-system/settings/secrets/actions

确保以下秘密已设置：
- `DEPLOY_HOST` - 你的服务器 IP (47.76.110.106)
- `DEPLOY_USER` - SSH 用户名 (root)
- `DEPLOY_PORT` - SSH 端口 (22)
- `DEPLOY_PATH` - 部署目录 (/opt/interview-system)
- `DEPLOY_PRIVATE_KEY` - SSH 私钥

### 3. 查看 GitHub Actions 日志
https://github.com/mikelinzheyu/interview-system/actions

点击最新工作流，查看详细日志，查找错误信息。

---

## 完成标志

部署成功的标志：
- ✅ 容器都在运行：`docker ps` 显示 5 个正在运行的容器
- ✅ 前端可访问：https://viewself.cn
- ✅ 健康检查通过：https://viewself.cn/health 返回 "OK"

---

## 注意事项

1. **只需做一次**：这是最后一次手动清理，之后所有部署都将完全自动化
2. **备份数据**：如果 `/opt/interview-system` 中有重要数据，请先备份
3. **停机时间**：清理和部署过程大约需要 5-10 分钟
4. **网络稳定**：确保网络连接稳定，避免部署中断

---

## 成功案例

完成清理并重新部署后，你将拥有：
- ✅ 完全自动化的 CI/CD 流程
- ✅ 每次 push 到 main 都自动部署
- ✅ 配置文件由 Git 版本控制管理
- ✅ 无需手动干预的部署流程
