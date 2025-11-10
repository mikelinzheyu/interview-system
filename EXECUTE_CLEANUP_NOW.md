# 🚀 服务器清理执行指南

所有脚本和文档已准备就绪！选择适合你的方式立即执行清理。

---

## ⚡ 快速执行（3 个选项）

### 选项 1️⃣：Windows 用户（最简单）

**方法 A - 双击运行（无需打开任何窗口）**
```
1. 打开文件浏览器
2. 进入项目目录：D:\code7\interview-system
3. 双击：run-cleanup.bat
4. 等待完成（5-10 秒）
5. 看到成功提示后按 Enter 关闭窗口
```

**方法 B - PowerShell 运行**
```powershell
# 在 PowerShell 中执行
cd D:\code7\interview-system
.\run-cleanup.ps1
```

### 选项 2️⃣：Mac/Linux 用户

```bash
# 1. 进入项目目录
cd /path/to/interview-system

# 2. 给脚本添加执行权限
chmod +x run-cleanup.sh

# 3. 执行脚本
bash run-cleanup.sh
```

### 选项 3️⃣：任何系统（Git Bash）

```bash
# 在 Git Bash 中运行
cd D:\code7\interview-system
bash run-cleanup.sh
```

---

## 📋 执行流程

脚本运行时会自动执行以下步骤：

```
⏳ 检查 SSH 连接
   ✅ SSH 连接成功

🛑 在服务器上执行清理
   └─ 📂 进入部署目录
   └─ 🛑 停止现有容器
   └─ 🗑️  删除旧部署目录
   └─ ✅ 服务器清理完成

✅ 清理成功！

📋 后续步骤:
  1. 打开 GitHub Actions
  2. 找到最新失败的工作流
  3. 点击 'Re-run all jobs'
  4. 等待部署完成（5-10 分钟）
```

---

## ✅ 预期的成功输出

```
=======================================
🚀 开始执行服务器清理
=======================================

📍 服务器信息:
   IP: 47.76.110.106
   用户: root
   端口: 22
   清理目录: /opt/interview-system

⏳ 检查 SSH 连接...
✅ SSH 连接成功

🛑 在服务器上执行清理...

📂 进入部署目录...
📂 当前目录：/opt/interview-system

🛑 停止现有容器...
✅ 容器已停止

📂 返回上级目录...
🗑️  删除旧部署目录...
✅ 旧目录已删除

✅ 服务器清理完成！

=======================================
✅ 清理成功！
=======================================

📋 后续步骤:
  1. 打开 GitHub Actions: https://github.com/mikelinzheyu/interview-system/actions
  2. 找到最新失败的工作流
  3. 点击 'Re-run all jobs' 重新部署
  4. 等待部署完成

⏱️  部署通常需要 5-10 分钟
```

---

## ⚠️ 常见错误及解决

### 错误 1：SSH 连接失败

```
❌ SSH 连接失败！

请确保:
  1. 服务器 IP 正确（当前：47.76.110.106）
  2. SSH 密钥已配置
  3. 网络连接正常
```

**解决方案**：
```bash
# 手动测试 SSH 连接
ssh root@47.76.110.106

# 如果需要，重新生成并配置 SSH 密钥
ssh-keygen -t rsa -b 4096
ssh-copy-id -i ~/.ssh/id_rsa.pub root@47.76.110.106
```

### 错误 2：权限问题（Linux/Mac）

```
Permission denied
```

**解决方案**：
```bash
# 给脚本添加执行权限
chmod +x run-cleanup.sh
```

### 错误 3：PowerShell 脚本执行被禁止

```
run-cleanup.ps1 cannot be loaded because running scripts is disabled
```

**解决方案**：
```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后运行脚本
.\run-cleanup.ps1
```

---

## 📊 清理前后对比

| 阶段 | 状态 | 结果 |
|------|------|------|
| **清理前** | ❌ | `/opt/interview-system` 目录存在且非空 |
| **清理过程** | ⏳ | 停止容器，删除目录 |
| **清理后** | ✅ | `/opt/interview-system` 目录不存在 |
| **下次部署** | ✅ | git clone 能成功克隆仓库 |

---

## 🔄 清理后的流程

清理完成后，执行以下步骤重新部署：

### 步骤 1：打开 GitHub Actions

访问：https://github.com/mikelinzheyu/interview-system/actions

### 步骤 2：找到最新失败的工作流

- 工作流名称：`CI/CD - Build & Deploy to Aliyun`
- 状态：失败（红叉标记）
- 时间：最近的一次

### 步骤 3：重新运行工作流

1. 点击该工作流
2. 点击 "Re-run all jobs" 按钮
3. 确认运行

### 步骤 4：监控部署进度

1. 实时查看 "Deploy" job 的日志
2. 观察以下关键步骤：
   ```
   📂 从 GitHub 同步配置文件... (git clone)
   docker pull (拉取镜像)
   docker-compose up -d (启动容器)
   ```
3. 等待显示 "✅ 部署完成" 或 "✅ 部署成功"

---

## ✨ 成功标志

部署完成后，验证以下内容：

### 方法 1：SSH 验证

```bash
# 连接到服务器
ssh root@47.76.110.106

# 检查容器状态
docker-compose -f /opt/interview-system/docker-compose.prod.yml ps

# 预期输出：5 个容器都是 "Up"
```

### 方法 2：网络访问

- 前端：https://viewself.cn （应该可以访问）
- API：https://viewself.cn/api/health （返回 200）
- Nginx 日志：https://viewself.cn/health （返回 OK）

### 方法 3：GitHub Actions

- 工作流状态：✅ 通过（绿色勾号）
- 所有 job 都完成：构建、部署、验证

---

## 📞 需要帮助？

如果脚本不工作，可以手动执行清理命令：

```bash
# 1. SSH 连接到服务器
ssh root@47.76.110.106

# 2. 执行清理
cd /opt
rm -rf interview-system

# 3. 验证删除
ls -la /opt | grep interview
# (应该无任何输出)

# 4. 退出服务器
exit

# 5. 在 GitHub 重新运行工作流
```

---

## 🎯 最终检查清单

在执行清理前，确保：

- [ ] 网络连接正常
- [ ] SSH 密钥已配置（能连接到服务器）
- [ ] 项目目录是当前工作目录
- [ ] 已阅读此指南

执行清理时：

- [ ] 脚本显示 "✅ SSH 连接成功"
- [ ] 脚本显示 "✅ 容器已停止"
- [ ] 脚本显示 "✅ 旧目录已删除"
- [ ] 脚本显示 "✅ 清理成功"

清理后：

- [ ] 打开 GitHub Actions
- [ ] 重新运行工作流
- [ ] 部署成功（5-10 分钟）
- [ ] 验证应用可访问

---

## 💡 提示

- 整个清理过程只需 1-2 分钟
- 清理期间应用会暂时离线
- 这是最后一次手动操作
- 完成后所有部署都完全自动化

---

**准备好了吗？立即开始！** 🚀

选择上面的任一选项，按照步骤执行，完成最后的手动清理！
