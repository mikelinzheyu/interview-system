# 📊 变量映射对比：当前(错误) vs 正确

## 问题关键点

在 Dify 的"保存问题列表"节点中，`questions` 变量的映射有两种可能：

---

## ❌ 当前状态（错误）

### 配置
```
questions 变量选择:
  L1: extract_skills ✓
  L2: structured_output ✓
  L3: (无) ✗ <- 问题在这里！
```

### 数据流
```
extract_skills (LLM 输出)
    ↓
    structured_output {
        "questions": [...],      ← 只有这个字段你需要
        "other_fields": ...
    }
    ↓
save_questions 节点收到的 questions 参数:
    {
        "questions": [...],
        "other_fields": ...
    }
    ↓
Python 代码中的 questions:
    {
        "questions": [...],       ← 这是一个对象，不是数组！
        "other_fields": ...
    }
    ↓
json.dumps(questions, ...) 时:
    "{\"questions\": [...], \"other_fields\": ...}"
```

### 为什么返回 []

因为 Python 代码期望 `questions` 是一个数组：
```python
questions_with_ids = []
for idx, question in enumerate(questions):  # ← 这里尝试遍历对象，不是数组
    questions_with_ids.append({...})
```

当 `questions` 是对象而不是数组时，循环会出错或返回空数组。

---

## ✅ 正确状态

### 配置
```
questions 变量选择:
  L1: extract_skills ✓
  L2: structured_output ✓
  L3: questions ✓ <- 正确！选择了嵌套字段
```

### 数据流
```
extract_skills (LLM 输出)
    ↓
    structured_output {
        "questions": [        ← 你需要的字段
            "问题1",
            "问题2",
            ...
        ]
    }
    ↓
save_questions 节点收到的 questions 参数:
    [
        "问题1",
        "问题2",
        ...
    ]
    ↓
Python 代码中的 questions:
    [
        "问题1",           ← 这是一个数组！
        "问题2",
        ...
    ]
    ↓
json.dumps(questions_with_ids, ...)
```

### 为什么正常工作

Python 代码正确地遍历数组：
```python
questions_with_ids = []
for idx, question in enumerate(questions):  # ← 现在遍历的是数组
    questions_with_ids.append({
        "id": f"{session_id}-q{idx+1}",
        "question": question,
        "hasAnswer": False,
        "answer": None
    })
```

---

## 🎯 在 Dify 界面中的样子

### ❌ 错误（当前）
```
┌─ 保存问题列表 节点 ──────────────────┐
│ 输入变量                              │
│ ┌─ questions ─────────────────────┐  │
│ │ 值选择器:                       │  │
│ │ ├─ extract_skills    ✓         │  │
│ │ └─ structured_output ✓ (完成)  │  │
│ │                                 │  │
│ │ 类型: Object                    │  │
│ └─────────────────────────────────┘  │
└─────────────────────────────────────┘
        ↑
        问题: 没有再次展开到 questions 字段
```

### ✅ 正确
```
┌─ 保存问题列表 节点 ──────────────────┐
│ 输入变量                              │
│ ┌─ questions ─────────────────────┐  │
│ │ 值选择器:                       │  │
│ │ ├─ extract_skills    ✓         │  │
│ │ ├─ structured_output ✓         │  │
│ │ └─ questions         ✓ (完成)  │  │
│ │                                 │  │
│ │ 类型: Array                     │  │
│ └─────────────────────────────────┘  │
└─────────────────────────────────────┘
        ↑
        正确: 选择到了 questions 数组字段
```

---

## 🔍 如何在 Dify 中验证

### 步骤 1: 打开"保存问题列表"节点
双击该节点，左侧会显示"输入变量"面板

### 步骤 2: 查看 questions 行
```
questions [Object type indicator]
```

### 步骤 3: 检查变量路径
- 点击 questions 行的变量选择器按钮
- 应该看到三级选择:
  - Level 1: extract_skills (选中)
  - Level 2: structured_output (选中)
  - Level 3: questions (选中) ← 如果没有这个，就是错的！

### 步骤 4: 验证类型
- 应该显示 "Array" 类型
- 不应该显示 "Object" 类型

---

## 💡 记住这个关键点

```
extract_skills 的结构化输出:
{
    "questions": [    ← 要的是这个数组！
        "问题1",
        "问题2",
        "问题3"
    ]
}

save_questions 中的 questions 参数应该收到:
[               ← 直接是数组
    "问题1",
    "问题2",
    "问题3"
]

不是:
{               ← 对象包含数组
    "questions": [...]
}
```

---

## ✨ 修复完成后的流程

```
用户输入 job_title
    ↓
search_job 搜索信息
    ↓
extract_skills LLM 生成
    {
        "questions": ["问题1", "问题2", ...]  ← 结构化输出
    }
    ↓
save_questions 节点
    questions 参数收到: ["问题1", "问题2", ...]  ← 正确的数组
    ↓
    Python 代码:
        for idx, question in enumerate(questions):  ← 遍历成功
            questions_with_ids.append(...)
    ↓
    HTTP POST 到存储服务
    ↓
返回:
{
    "session_id": "uuid-12345",
    "questions": "[{\"id\": \"uuid-q1\", \"question\": \"问题1\"}, ...]",
    "job_title": "Python后端开发工程师",
    "question_count": 5
}
```

