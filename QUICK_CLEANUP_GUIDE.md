# 一键清理快速参考指南

## 🚀 快速执行清理

选择适合你系统的命令：

### 方案 A：Windows 用户（推荐）
直接双击运行（无需打开终端）：
```
双击：run-cleanup.bat
```

或在 PowerShell 中执行：
```powershell
.\run-cleanup.ps1
```

### 方案 B：Mac/Linux 用户
在终端执行：
```bash
bash run-cleanup.sh
```

### 方案 C：Git Bash（Windows）
在 Git Bash 中执行：
```bash
bash run-cleanup.sh
```

---

## ⚠️ 前置条件

执行清理前，确保：

1. **SSH 密钥已配置**
   - 你能通过 `ssh root@47.76.110.106` 连接到服务器（无需输入密码）

2. **网络连接正常**
   - 能访问互联网
   - 服务器 IP 正确

3. **脚本有执行权限（Linux/Mac）**
   ```bash
   chmod +x run-cleanup.sh
   chmod +x cleanup-deployment.sh
   ```

---

## 📋 执行流程

当你运行脚本时，它会：

1. ✅ 验证 SSH 连接
2. ✅ 登录到服务器
3. ✅ 停止现有 Docker 容器
4. ✅ 删除旧的 `/opt/interview-system` 目录
5. ✅ 返回本地机器
6. ✅ 提示下一步操作

---

## ✅ 清理成功的标志

脚本完成后，你会看到：

```
✅ 清理成功！

📋 后续步骤:
  1. 打开 GitHub Actions: https://github.com/mikelinzheyu/interview-system/actions
  2. 找到最新失败的工作流
  3. 点击 'Re-run all jobs' 重新部署
  4. 等待部署完成

⏱️  部署通常需要 5-10 分钟
```

---

## 🔄 后续步骤

清理完成后：

1. **打开 GitHub Actions**
   - 访问：https://github.com/mikelinzheyu/interview-system/actions

2. **找到最新失败的工作流**
   - 通常是 "CI/CD - Build & Deploy to Aliyun"

3. **重新运行工作流**
   - 点击工作流
   - 点击 "Re-run all jobs" 按钮

4. **监控部署进度**
   - 查看实时日志
   - 等待 5-10 分钟

---

## 🛠️ 故障排查

### 错误：SSH 连接失败

**症状**：`SSH 连接失败`

**解决方案**：
```bash
# 手动测试 SSH 连接
ssh root@47.76.110.106

# 如果失败，检查 SSH 密钥
ls ~/.ssh/id_rsa

# 如果密钥不存在，生成新密钥
ssh-keygen -t rsa -b 4096
```

### 错误：Permission denied

**症状**：`Permission denied (publickey)`

**解决方案**：
```bash
# 确保私钥权限正确
chmod 600 ~/.ssh/id_rsa

# 确保公钥已添加到服务器
ssh-copy-id -i ~/.ssh/id_rsa.pub root@47.76.110.106
```

### 错误：docker-compose 未找到

**症状**：`docker-compose: command not found`

**解决方案**：
这个错误可以忽略，脚本会继续执行清理。

---

## 📞 需要帮助？

如果脚本执行失败，手动执行以下命令：

```bash
# 1. 登录服务器
ssh root@47.76.110.106

# 2. 进入部署目录
cd /opt

# 3. 删除旧目录
rm -rf interview-system

# 4. 验证删除成功
ls -la /opt | grep interview

# 5. 退出服务器
exit
```

---

## 确认清理完成

执行以下命令验证：

```bash
ssh root@47.76.110.106 "ls -la /opt | grep interview"
```

**预期输出**：无任何输出（没有 interview-system 目录）

---

## 📌 重要提醒

- ✅ 这是最后一次手动操作
- ✅ 完成后所有部署都将完全自动化
- ✅ 整个过程约 5-10 分钟
- ✅ 执行期间应用会短暂离线
