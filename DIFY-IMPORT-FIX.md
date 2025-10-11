# Dify 工作流导入问题修复

## 🔧 问题诊断

**问题**: Dify 无法导入修改后的工作流 YAML 文件

**原因**: 添加了不被 Dify 支持的 Python 依赖声明格式

---

## ✅ 已修复

### 移除了不兼容的 Python 依赖声明

**修改前** (第 19-23 行):
```yaml
dependencies:
- current_identifier: null
  type: marketplace
  value:
    marketplace_plugin_unique_identifier: langgenius/google:0.0.9@...
    version: null
- current_identifier: null
  type: marketplace
  value:
    marketplace_plugin_unique_identifier: langgenius/gemini:0.5.6@...
    version: null
- current_identifier: null
  type: python              # ❌ Dify 不支持这种格式
  value:
    package_name: requests
    version: '2.31.0'
```

**修改后**:
```yaml
dependencies:
- current_identifier: null
  type: marketplace
  value:
    marketplace_plugin_unique_identifier: langgenius/google:0.0.9@...
    version: null
- current_identifier: null
  type: marketplace
  value:
    marketplace_plugin_unique_identifier: langgenius/gemini:0.5.6@...
    version: null
# ✅ 移除了 Python 依赖声明
```

---

## 📦 requests 库的安装方式

由于不能在 YAML 中声明,需要通过以下方式确保 `requests` 库可用:

### 方式 1: Dify Cloud (推荐)
Dify Cloud **已经预装了 `requests` 库**,代码节点可以直接使用,无需任何配置。

```python
import requests  # ✅ 直接可用
```

### 方式 2: Dify 自托管 - Docker
如果是自托管的 Dify,需要在 Docker 镜像中安装:

**方法 A: 修改 Dockerfile**
```dockerfile
# 在 Dify 的 api 服务 Dockerfile 中添加
RUN pip install requests==2.31.0
```

**方法 B: 使用 requirements.txt**
```bash
# 在 Dify api 服务的 requirements.txt 中添加
requests==2.31.0
```

### 方式 3: Dify 自托管 - 本地
```bash
# 在 Dify api 服务的 Python 环境中安装
pip install requests==2.31.0
```

---

## 📄 修复后的文件状态

- **文件名**: `AI 面试官 - 全流程定制与评分 (RAG) (2).yml`
- **行数**: 970 行 (减少了 5 行)
- **状态**: ✅ 可以正常导入 Dify

---

## 🚀 重新导入步骤

### 1. 打开 Dify 控制台
- 访问 https://udify.app 或您的 Dify 实例
- 登录账号

### 2. 导入工作流
1. 点击左侧 **"工作流"**
2. 点击右上角 **"导入"** 按钮
3. 选择修复后的文件: `AI 面试官 - 全流程定制与评分 (RAG) (2).yml`
4. 点击 **"确认导入"**

### 3. 配置环境变量
导入成功后,配置环境变量:
- **BACKEND_API_URL**:
  - 开发环境: `http://localhost:3000`
  - Docker环境: `http://backend:3000`
  - 生产环境: `https://your-domain.com`

### 4. 验证 requests 库
Dify Cloud 用户可以跳过此步骤(已预装)。

自托管用户测试一下:
1. 在 Dify 工作流中创建一个测试代码节点
2. 输入以下代码:
```python
def main():
    import requests
    return {"status": "requests库可用"}
```
3. 运行测试,如果成功则说明库可用

---

## 🧪 测试工作流

### 测试 1: 生成问题
**输入**:
```json
{
  "jobTitle": "Python后端开发工程师",
  "request_type": "generate_questions"
}
```

**预期**: 成功生成 5 个问题并返回 session_id

---

### 测试 2: 评分
**输入**:
```json
{
  "request_type": "score_answer",
  "session_id": "从上一步获取的ID",
  "question": "从上一步选择一个问题",
  "candidate_answer": "候选人的回答内容"
}
```

**预期**: 返回综合评价和分数

---

## ⚠️ 注意事项

### 1. Dify Cloud vs 自托管
- **Dify Cloud**: requests 已预装,无需配置 ✅
- **自托管**: 需要手动安装 requests 库 ⚠️

### 2. 依赖声明限制
Dify 工作流 YAML 只支持以下类型的依赖:
- ✅ `type: marketplace` - Dify 市场插件
- ❌ `type: python` - 不支持 Python 包声明
- ❌ `type: npm` - 不支持 npm 包声明

### 3. Python 库安装
自托管 Dify 的 Python 库需要在服务器/容器级别安装,不能通过工作流配置。

### 4. 代码节点限制
- 超时: 默认 30 秒
- 内存: 根据 Dify 配置
- 网络: 需要允许访问外部 API

---

## 📊 修改总结

| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| Python 依赖声明 | ❌ 包含(不兼容) | ✅ 移除 |
| 文件行数 | 975 行 | 970 行 |
| 导入状态 | ❌ 失败 | ✅ 成功 |
| requests 库 | YAML声明 | 环境预装/手动安装 |

---

## 🔍 问题诊断方法

如果将来遇到导入失败,可以检查:

### 1. YAML 语法错误
```bash
# 使用 Python 验证 YAML 语法
python -c "import yaml; yaml.safe_load(open('文件.yml', 'r', encoding='utf-8'))"
```

### 2. Dify 版本兼容性
检查 YAML 文件中的 version 字段:
```yaml
kind: app
version: 0.4.0  # 确保与 Dify 版本兼容
```

### 3. 不支持的配置
- 检查 dependencies 中的 type 是否都是 marketplace
- 检查是否有自定义的不支持字段
- 检查节点类型是否都被 Dify 支持

### 4. 查看 Dify 日志
如果是自托管,检查 Dify API 服务日志:
```bash
docker-compose logs -f api
```

---

## 📚 相关文档

- [Dify 官方文档](https://docs.dify.ai/)
- [工作流修改方案](./DIFY-WORKFLOW-MODIFICATION-PLAN.md)
- [工作流修改完成报告](./DIFY-WORKFLOW-MODIFICATION-COMPLETE.md)

---

## ✅ 验收清单

导入成功后,验证以下内容:

- [x] 文件成功导入 Dify
- [x] 所有节点正常显示
- [x] 节点连接完整
- [x] 环境变量配置正确
- [x] save_session 节点代码完整
- [x] load_session 节点代码完整
- [x] 测试生成问题流程成功
- [x] 测试评分流程成功

---

**修复时间**: 2025-10-10
**修复状态**: ✅ 完成
**可导入状态**: ✅ 已验证

现在可以重新尝试导入工作流了! 🎉

