# 快速实施指南 - 3步完成部署

## 🎯 当前状态
✅ **代码修改**: 100% 完成
⏳ **环境配置**: 需要手动执行

---

## 🚀 3步快速部署

### ✅ 步骤 1: 数据库迁移（5分钟）

打开 MySQL 命令行：
```bash
mysql -u root -p
```

输入密码：`123456`

然后执行：
```sql
USE interview_system;

ALTER TABLE questions
ADD COLUMN major_group_id BIGINT COMMENT '题目所属专业大类ID' AFTER category_id,
ADD INDEX idx_major_group_id (major_group_id);

-- 验证
DESCRIBE questions;
```

验证成功后，执行数据回填：
```sql
UPDATE questions q
SET q.major_group_id = (
  SELECT c.major_group_id FROM categories c WHERE c.id = q.category_id
)
WHERE q.major_group_id IS NULL AND q.category_id IS NOT NULL;

-- 验证补填
SELECT COUNT(*) as total,
       COUNT(CASE WHEN major_group_id IS NOT NULL THEN 1 END) as filled
FROM questions;
```

---

### ⚙️ 步骤 2: 编译后端（10分钟）

在 PowerShell 中执行：

```powershell
# 设置 Java 环境
$env:JAVA_HOME = "C:\Users\mike\.jdks\corretto-1.8.0_442"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

# 进入后端目录
cd D:\code7\interview-system\backend

# 编译
mvn clean package -DskipTests
```

如果出现 Maven 仓库错误，执行：
```powershell
# 使用公共仓库
mvn clean package -DskipTests -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true
```

---

### 🖥️ 步骤 3: 启动服务（5分钟）

**终端 1 - 启动后端**:
```bash
cd D:\code7\interview-system\backend
java -jar target/interview-system-*.jar
```

等待看到：
```
Started Application in X.XXX seconds
```

**终端 2 - 启动前端**:
```bash
cd D:\code7\interview-system\frontend
npm run dev
```

等待看到：
```
Local:   http://localhost:5174/
```

---

## ✅ 验证清单

- [ ] MySQL 连接成功，major_group_id 列已添加
- [ ] 数据回填成功，COUNT 结果显示 filled > 0
- [ ] 后端启动成功，监听 8080 端口
- [ ] 前端启动成功，监听 5174 端口
- [ ] 浏览器访问 http://localhost:5174/ 显示学习中心
- [ ] 点击专业大类卡片，URL 为 `/learning-hub/{slug}/questions`
- [ ] 题目列表正确显示（非空）

---

## 🔧 常见问题快速解决

| 问题 | 解决方案 |
|------|--------|
| MySQL 密码错误 | 检查 application.yml，默认密码为 123456 |
| Maven 仓库超时 | 使用 `-Dmaven.wagon.http.ssl.insecure=true` 跳过 SSL 验证 |
| Node 命令不找到 | 在 PowerShell 中执行 npm 命令而不是 CMD |
| 前端显示空白 | 确认后端已启动，查看浏览器控制台错误 |

---

## 📁 关键文件位置

- 迁移脚本: `D:\code7\interview-system\migration.sql`
- 后端源码: `D:\code7\interview-system\backend\`
- 前端源码: `D:\code7\interview-system\frontend\`
- 修改文档: `D:\code7\interview-system\IMPLEMENTATION_STATUS.md`

---

**预计总耗时**: 20-30 分钟
**难度等级**: 中等（主要是环境配置）
**成功标志**: 两个服务都启动成功，前端可以正常访问
