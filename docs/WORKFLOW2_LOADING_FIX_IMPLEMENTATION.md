# Workflow2 加载问题 - 完整修复实现指南

## 🎯 问题概述

**症状**: Workflow2的load_question_info节点返回：
```
错误: "问题 q-1761642705888-1 未找到"
```

**根本原因**:
1. Python代码尝试从ngrok临时URL查询后端
2. ngrok URL已下线，无法访问
3. 应该直接使用Workflow1返回的问题数据，而不是重新查询

## ✅ 完整修复步骤

### 第1步：理解Workflow1输出格式

Workflow1返回的questions_json格式：
```json
[
  {
    "id": "q-1761642289221-0",
    "text": "请描述您过去在Python后端开发中使用的最具挑战性的项目...",
    "job_title": "Python 后端开发工程师"
  },
  {
    "id": "q-1761642289221-1",
    "text": "在处理大数据量时...",
    "job_title": "Python 后端开发工程师"
  }
]
```

### 第2步：在Dify中修改Workflow2

#### 2.1 添加start节点输入变量

1. 打开Dify中的Workflow2
2. 在start节点中，点击"+"添加新变量
3. 创建new变量：
   - **变量名**: `questions_json`
   - **标签**: `问题数据JSON`
   - **类型**: 文本输入 (text-input)
   - **必需**: 否 (false)
   - **提示**: "JSON格式的问题列表"

结果应该是：
```yaml
variables:
  - variable: session_id
    label: 会话ID
    required: true
  - variable: question_id
    label: 问题ID
    required: true
  - variable: questions_json      # ← 新增
    label: 问题数据JSON
    type: text-input
    required: false
    hint: "JSON格式的问题列表"
```

#### 2.2 修改load_question_info节点的Python代码

1. 双击或编辑`load_question_info`代码节点
2. 完全替换代码为以下内容：

```python
import json

def main(session_id: str, question_id: str, questions_json: str = "") -> dict:
    """
    从Workflow1传入的问题JSON数据中查找对应问题

    Args:
        session_id: 会话ID
        question_id: 问题ID
        questions_json: JSON字符串格式的问题数据

    Returns:
        {
            "job_title": "职位名称",
            "question_text": "问题文本",
            "error": "错误信息（成功时为空）"
        }
    """

    try:
        # 检查是否收到了问题数据
        if not questions_json or questions_json.strip() == "":
            return {
                "job_title": "",
                "question_text": "",
                "error": "未提供问题数据"
            }

        # 解析JSON数据
        if isinstance(questions_json, str):
            questions = json.loads(questions_json)
        else:
            questions = questions_json

        # 确保是列表
        if not isinstance(questions, list):
            return {
                "job_title": "",
                "question_text": "",
                "error": "问题数据格式错误（应为数组）"
            }

        # 查找匹配的问题
        job_title = ""
        for q in questions:
            if q.get("id") == question_id:
                # 提取job_title和question_text
                job_title = q.get("job_title", "")
                question_text = q.get("text", "")

                return {
                    "job_title": job_title,
                    "question_text": question_text,
                    "error": ""
                }

        # 问题未找到
        return {
            "job_title": job_title if job_title else "",
            "question_text": "",
            "error": f"问题 {question_id} 未找到"
        }

    except json.JSONDecodeError as e:
        return {
            "job_title": "",
            "question_text": "",
            "error": f"JSON解析错误: {str(e)}"
        }
    except Exception as e:
        return {
            "job_title": "",
            "question_text": "",
            "error": f"错误: {str(e)}"
        }
```

3. 点击保存

#### 2.3 连接变量

确保variables连接正确：
- `session_id` ← start.session_id
- `question_id` ← start.question_id
- `questions_json` ← start.questions_json (新增)

### 第3步：更新调用Workflow2的代码

#### 3.1 Node.js/JavaScript调用

```javascript
async function callWorkflow2WithFix(
  sessionId,
  questionId,
  userAnswer,
  jobTitle,
  questionsList  // ← 从Workflow1接收的问题列表
) {
  const requestBody = {
    inputs: {
      session_id: sessionId,
      question_id: questionId,
      user_answer: userAnswer,
      job_title: jobTitle,
      questions_json: JSON.stringify(questionsList)  // ← 新增：序列化为JSON字符串
    },
    response_mode: "blocking",
    user: "user-" + Date.now()
  };

  const response = await fetch(
    'https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer app-TEw1j6rBUw0ZHHlTdJvJFfPB',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  return await response.json();
}
```

#### 3.2 完整流程示例

```javascript
// 1. 首先调用Workflow1
const workflow1Result = await callWorkflow1(jobTitle);

if (!workflow1Result.success) {
  console.error('Workflow1 failed');
  return;
}

// 2. 延迟后调用Workflow2，传入问题列表
setTimeout(() => {
  const workflow2Result = await callWorkflow2WithFix(
    workflow1Result.sessionId,
    selectedQuestionId,           // 用户选择的问题
    userAnswer,                   // 用户输入的答案
    jobTitle,
    workflow1Result.questions     // ← 传入问题列表
  );

  if (workflow2Result.success) {
    console.log('Generated Answer:', workflow2Result.generatedAnswer);
  } else {
    console.error('Workflow2 failed:', workflow2Result.error);
  }
}, 2000);
```

#### 3.3 Java/Spring Boot调用

```java
@Service
public class DifyWorkflowService {

    public Map<String, Object> callWorkflow2(
        String sessionId,
        String questionId,
        String userAnswer,
        String jobTitle,
        List<Map<String, Object>> questions  // ← 新增：接收问题列表
    ) {
        Map<String, Object> requestBody = new HashMap<>();

        // 序列化问题列表为JSON字符串
        String questionsJson = objectMapper.writeValueAsString(questions);

        requestBody.put("inputs", Map.of(
            "session_id", sessionId,
            "question_id", questionId,
            "user_answer", userAnswer,
            "job_title", jobTitle,
            "questions_json", questionsJson  // ← 新增：JSON字符串格式
        ));
        requestBody.put("response_mode", "blocking");
        requestBody.put("user", "user-" + System.currentTimeMillis());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer app-TEw1j6rBUw0ZHHlTdJvJFfPB");
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R",
                entity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                Map<String, Object> outputs = (Map<String, Object>) data.get("outputs");

                return Map.of(
                    "success", true,
                    "sessionId", outputs.get("session_id"),
                    "questionId", outputs.get("question_id"),
                    "generatedAnswer", outputs.get("generated_answer"),
                    "saveStatus", outputs.get("save_status")
                );
            }
        } catch (Exception e) {
            return Map.of("success", false, "error", e.getMessage());
        }

        return Map.of("success", false, "error", "Unknown error");
    }
}
```

### 第4步：测试修复

#### 4.1 使用修复后的脚本测试

创建`test-workflow2-fixed.js`:

```javascript
const https = require('https');

// 模拟Workflow1返回的问题数据
const mockQuestions = [
  {
    "id": "q-test-0",
    "text": "请描述您过去在Python后端开发中使用的最具挑战性的项目...",
    "job_title": "Python 后端开发工程师"
  },
  {
    "id": "q-test-1",
    "text": "在处理大数据量时...",
    "job_title": "Python 后端开发工程师"
  }
];

const requestBody = {
  inputs: {
    session_id: "test-session-123",
    question_id: "q-test-1",
    user_answer: "这是用户的答案",
    job_title: "Python 后端开发工程师",
    questions_json: JSON.stringify(mockQuestions)  // ← 关键：传入序列化的JSON
  },
  response_mode: "blocking",
  user: "test-user-" + Date.now()
};

const data = JSON.stringify(requestBody);

const options = {
  hostname: 'api.dify.ai',
  path: '/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);

    try {
      const parsed = JSON.parse(responseData);

      if (res.statusCode === 200 && parsed.data && parsed.data.outputs) {
        console.log('\nSuccess! Workflow2 outputs:');
        const outputs = parsed.data.outputs;
        console.log('- job_title:', outputs.job_title);
        console.log('- question_text:', outputs.question_text.substring(0, 100) + '...');
        console.log('- error:', outputs.error || '(none)');

        if (outputs.error === "") {
          console.log('\n✅ Question loading succeeded!');
        } else {
          console.log('\n❌ Question loading failed:', outputs.error);
        }
      } else {
        console.log('\n❌ Error:', parsed);
      }
    } catch (e) {
      console.log('\n❌ Parse error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Network error:', e);
});

req.write(data);
req.end();
```

运行测试：
```bash
node test-workflow2-fixed.js
```

期望输出：
```
Status: 200

Success! Workflow2 outputs:
- job_title: Python 后端开发工程师
- question_text: 在处理大数据量时...
- error: (none)

✅ Question loading succeeded!
```

### 第5步：部署修复

1. **更新Dify Workflow2**: 将修改后的代码上传到Dify
2. **更新后端代码**: 修改调用Workflow2的代码，添加questions_json参数
3. **测试端到端**: 验证Workflow1→Workflow2的完整流程
4. **部署到生产**: 确认所有测试通过后部署

## 📋 修复检查清单

在部署前，确认以下事项：

- [ ] 在Dify中添加了start节点的questions_json变量
- [ ] 更新了load_question_info节点的Python代码
- [ ] 变量连接正确（questions_json从start传入main函数）
- [ ] 后端代码已更新，调用时传入questions_json参数
- [ ] questions_json已正确序列化为JSON字符串
- [ ] 测试脚本运行成功
- [ ] 端到端测试（Workflow1→Workflow2）通过
- [ ] 错误消息不再显示"问题未找到"

## 🆘 故障排查

### 问题1: 仍显示"问题未找到"

**检查清单**:
1. 确认questions_json参数被传入了
2. 检查question_id是否与questions列表中的id匹配
3. 运行测试脚本验证

### 问题2: JSON解析错误

**解决方案**:
1. 确保questions_json是有效的JSON字符串
2. 检查序列化时是否使用了JSON.stringify()
3. 验证问题对象的字段名称（应该是"text"而不是"question"）

### 问题3: 字段缺失

**检查**:
1. 确认Workflow1返回的问题包含"text"和"id"字段
2. 确认"job_title"字段存在
3. 查看Workflow1的输出定义

## 📊 性能提升

修复后的优势：
- ✅ 不再依赖ngrok后端URL
- ✅ 加载速度更快（使用本地数据而非网络请求）
- ✅ 更可靠（不依赖外部服务）
- ✅ 更灵活（可离线测试）

---

**修复状态**: ✅ 诊断完成，详细步骤已提供
**难度等级**: 中等 - 需要在Dify UI中修改代码
**预计时间**: 30-45分钟完成和测试
**风险**: 低 - 改进现有代码，不会破坏其他功能

---

## 相关文件

- 诊断报告: `WORKFLOW2_LOADING_ISSUE_FIX.md`
- 修复后的YAML: `workflow2-loading-issue-FIXED.yml`
- 测试脚本模板: `test-workflow2-fixed.js`
