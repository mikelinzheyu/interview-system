# 🚀 完整启动指南

## 问题修复完成

✅ **已完成的工作**：
1. 修复了 LearningHubDashboard.vue 的路由参数错误（Missing required param "majorGroupSlug"）
2. 所有 12 个步骤的代码改动已完成
3. 生成了完整的迁移脚本和实施文档

---

## 📋 本地启动步骤（按顺序执行）

### 第1步：执行数据库迁移和数据补填

#### 1.1 打开 MySQL 命令行客户端

```bash
# 使用你的 MySQL 用户和密码连接
mysql -u root -p
```

输入密码后，执行以下 SQL 命令：

#### 1.2 添加 major_group_id 列

```sql
-- 选择数据库
USE interview_system;

-- 添加 major_group_id 列
ALTER TABLE questions
ADD COLUMN major_group_id BIGINT COMMENT '题目所属专业大类ID' AFTER category_id,
ADD INDEX idx_major_group_id (major_group_id);

-- 验证列是否添加成功
DESCRIBE questions;
-- 应该能看到 major_group_id 列
```

#### 1.3 补填现有题目的 major_group_id

**重要**：在执行下列 UPDATE 前，请确保：
- categories 表已有 major_group_id 字段
- major_groups 表存在且有数据
- 分类关系已正确建立

```sql
-- 方案A：如果 categories 表有 major_group_id 字段
UPDATE questions q
SET q.major_group_id = (
  SELECT c.major_group_id FROM categories c WHERE c.id = q.category_id
)
WHERE q.major_group_id IS NULL
  AND q.category_id IS NOT NULL;

-- 验证补填结果
SELECT COUNT(*) as total_questions,
       COUNT(CASE WHEN major_group_id IS NOT NULL THEN 1 END) as filled,
       COUNT(CASE WHEN major_group_id IS NULL THEN 1 END) as empty
FROM questions;
```

#### 1.4 为新题目设置默认 major_group_id（如果需要）

```sql
-- 如果还有未填的题目，手动指定 major_group_id
-- 示例：将未分配的题目分配到 major_group_id = 1（计算机科学）
UPDATE questions
SET major_group_id = 1
WHERE major_group_id IS NULL
  AND category_id IS NOT NULL;
```

---

### 第2步：编译后端

在项目根目录或 backend 目录打开命令行：

```bash
# 方式1：使用 Maven 编译（推荐）
cd D:\code7\interview-system\backend
mvn clean compile -DskipTests

# 方式2：使用 Maven 编译并打包为 JAR
mvn clean package -DskipTests

# 注意：如果遇到 JAVA_HOME 错误，请先设置 Java 环境变量
# Windows 示例：
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%

# 或在 PowerShell 中：
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

---

### 第3步：启动后端服务

#### 方式A：直接运行 JAR（编译后自动执行数据库迁移）

```bash
cd D:\code7\interview-system\backend
java -jar target\interview-server-1.0.jar
```

**数据库迁移将自动执行**（通过 Flyway）

#### 方式B：使用 Maven 插件直接运行

```bash
cd D:\code7\interview-system\backend
mvn spring-boot:run
```

---

### 第4步：启动前端开发服务器

在另一个命令行窗口中：

```bash
# 进入前端目录
cd D:\code7\interview-system\frontend

# 启动开发服务器
npm run dev

# 如果你使用 yarn
yarn dev

# 或者 pnpm
pnpm dev
```

**预期输出**：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5174/
  ➜  press h to show help
```

---

## 🧪 验证步骤

### 1. 验证后端 API

打开浏览器或使用 curl 测试：

```bash
# 测试基础 API
curl http://localhost:8080/api/v1/questions

# 测试带 major_group_id 的查询
curl http://localhost:8080/api/v1/questions?major_group_id=1&page=1&size=10

# 测试 facets API
curl http://localhost:8080/api/v1/questions/facets?major_group_id=1
```

### 2. 验证前端功能

在浏览器中访问：
```
http://localhost:5174
```

按照以下步骤测试：
1. ✅ 登录系统
2. ✅ 进入学习中心
3. ✅ 点击任意专业大类卡片
4. ✅ 验证 URL 变为 `/learning-hub/{majorGroupSlug}/questions`
5. ✅ 验证题目列表只显示该专业大类的题目
6. ✅ 测试筛选功能（难度、题型、标签）
7. ✅ 测试搜索功能
8. ✅ 测试分页功能

---

## 🔧 故障排查

### 问题 1：JAVA_HOME 未设置

**症状**：`The JAVA_HOME environment variable is not defined correctly`

**解决**：
```bash
# Windows CMD
set JAVA_HOME=C:\Program Files\Java\jdk-17

# Windows PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

### 问题 2：MySQL 连接失败

**症状**：`ERROR 1045 (28000): Access denied for user 'root'`

**解决**：
```sql
-- 在 MySQL 中重置密码
-- 停止 MySQL 服务后，用 --skip-grant-tables 启动
-- 然后修改 root 密码

-- 或直接查看 application.yml 中的数据库密码配置
-- 默认密码在 password: ${DB_PASSWORD:123456}
```

### 问题 3：前端无法启动

**症状**：`npm run dev` 失败

**解决**：
```bash
# 清空 node_modules 和 package-lock
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 启动
npm run dev
```

### 问题 4：迁移脚本未自动执行

**症状**：数据库中没有 major_group_id 列

**解决**：
1. 确认 Flyway 依赖已添加到 pom.xml
2. 检查 application.yml 中的 Flyway 配置
3. 手动执行迁移脚本（参考第1步）

---

## 📝 关键改动回顾

| 组件 | 改动 | 影响 |
|------|------|------|
| **后端 API** | 添加 major_group_id 参数 | 所有题目查询都必须指定 major_group_id |
| **前端路由** | 改为 `:majorGroupSlug` | URL 结构更清晰 |
| **数据库** | 添加 major_group_id 列 | 题目物理隔离 |
| **Store** | majorGroupId 隔离逻辑 | 前端数据隔离 |

---

## ✨ 预期结果

启动成功后：

1. ✅ 后端服务运行在 `http://localhost:8080`
2. ✅ 前端服务运行在 `http://localhost:5174`
3. ✅ 进入学习中心，看到各个专业大类的卡片
4. ✅ 点击卡片后，路由为 `/learning-hub/{majorGroupSlug}/questions`
5. ✅ 题库只显示该专业大类的题目
6. ✅ 用户学习进度按专业大类隔离

---

## 🔑 重要提醒

- ⚠️ **数据库迁移是必须的**，否则 API 会报错（列不存在）
- ⚠️ **major_group_id 数据补填**，否则题目无法被查询到
- ⚠️ **后端必须先启动**，否则前端无法连接 API
- ⚠️ **前端修改已全部完成**，无需再修改前端代码

---

## 💬 需要帮助？

如果遇到任何问题，请检查：
1. MySQL 是否运行且密码正确
2. Java/Maven 是否正确安装
3. Node.js 是否正确安装（前端）
4. 防火墙是否阻止了 8080 或 5174 端口

参考文档：
- REFACTOR_PLAN.md - 完整技术方案
- IMPLEMENTATION_PROGRESS.md - 实施进度清单
- IMPLEMENTATION_SUMMARY.md - 实施总结

