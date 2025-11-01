# 🔧 Workflow1 V2 - 添加 questions_json 输出

**更新日期**: 2025-10-28
**改动**: 添加了 questions_json 输出字段

---

## 📋 问题描述

V2 版本中缺少 `questions_json` 输出，但这个字段可能被其他工作流需要。

### 修改内容

在 end_output 节点的 value_selector 映射中，添加了新的映射：

```yaml
- value_selector:
  - save_questions
  - questions
  value_type: object
  variable: questions_json
```

这个映射将 `save_questions` 节点的 `questions` 字段（问题列表数组）映射到输出的 `questions_json` 字段。

---

## 📤 现在的完整输出

```json
{
  "session_id": "session-1730101234567",
  "question_id": "q-1730101234567-0",
  "questions": [
    {"id": "q-123-0", "text": "问题1", "answer": "", "hasAnswer": false},
    {"id": "q-123-1", "text": "问题2", "answer": "", "hasAnswer": false}
  ],
  "questions_json": [
    {"id": "q-123-0", "text": "问题1", "answer": "", "hasAnswer": false},
    {"id": "q-123-1", "text": "问题2", "answer": "", "hasAnswer": false}
  ],
  "job_title": "Python 后端开发工程师",
  "questions_count": 5,
  "save_status": "成功",
  "error_message": ""
}
```

**注**: `questions` 和 `questions_json` 包含相同的数据（都是问题数组）

---

## ✅ 输出字段清单

| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | string | 会话 ID |
| question_id | string | 第一个问题的 ID |
| questions | object | 问题列表数组 |
| questions_json | object | 问题列表数组（同 questions） |
| job_title | string | 职位名称 |
| questions_count | number | 问题总数 |
| save_status | string | 保存状态 |
| error_message | string | 错误信息 |

**总共 8 个输出字段**

---

## 🔍 为什么需要 questions_json

1. **兼容性**: 某些工作流或界面可能期望 `questions_json` 字段
2. **一致性**: 保持与早期版本的输出格式一致
3. **灵活性**: 允许不同的系统以不同的变量名引用相同的数据

---

## 📝 修改位置

**文件**: `AI面试官-工作流1-生成问题-FIXED-V2.yml`
**位置**: end_output 节点的 outputs 部分
**行号**: 添加了新的 value_selector 映射（在 questions 和 job_title 之间）

---

## ✨ V2 最终版本输出

```yaml
outputs:
- session_id        # 会话 ID
- question_id       # 问题 ID ✨ 新增
- questions         # 问题列表 ✨ 新增
- questions_json    # 问题列表 JSON ✨ 新增 (本次添加)
- job_title         # 职位
- questions_count   # 问题数量
- save_status       # 保存状态
- error_message     # 错误信息
```

---

**修复完成**: 2025-10-28
**文件**: AI面试官-工作流1-生成问题-FIXED-V2.yml (已更新)
**状态**: ✅ 准备导入 Dify
