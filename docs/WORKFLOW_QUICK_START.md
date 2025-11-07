# Workflow Integration - Quick Start Reference

## ✅ Status: Ready for Integration

Both workflows tested and working. Use this card during implementation.

---

## Copy-Paste: API Endpoints

### Workflow1
```
URL: https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev
KEY: app-82F1Uk9YLgO7bDwmyOpTfZdB
```

### Workflow2
```
URL: https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R
KEY: app-TEw1j6rBUw0ZHHlTdJvJFfPB
```

---

## Copy-Paste: Headers

```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

---

## Copy-Paste: Workflow1 Request

```json
{
  "inputs": {
    "job_title": "Python 后端开发工程师"
  },
  "response_mode": "blocking",
  "user": "user-" + Date.now()
}
```

---

## Copy-Paste: Workflow2 Request

```json
{
  "inputs": {
    "session_id": "session-1761642289221",
    "question_id": "q-1761642289221-0",
    "user_answer": "User's answer text",
    "job_title": "Python 后端开发工程师"
  },
  "response_mode": "blocking",
  "user": "user-" + Date.now()
}
```

---

## Copy-Paste: curl Tests

### Test Workflow1
```bash
curl -X POST "https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev" \
  -H "Authorization: Bearer app-82F1Uk9YLgO7bDwmyOpTfZdB" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {"job_title": "Python 后端开发工程师"},
    "response_mode": "blocking",
    "user": "test-user"
  }'
```

### Test Workflow2
```bash
curl -X POST "https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R" \
  -H "Authorization: Bearer app-TEw1j6rBUw0ZHHlTdJvJFfPB" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "session_id": "session-123",
      "question_id": "q-123",
      "user_answer": "answer text",
      "job_title": "Python 后端开发工程师"
    },
    "response_mode": "blocking",
    "user": "test-user"
  }'
```

---

## Copy-Paste: JavaScript/Node.js

```javascript
const https = require('https');

function callWorkflow(workflowId, apiKey, inputs) {
  const url = `https://api.dify.ai/v1/workflows/run?workflow_id=${workflowId}`;

  const requestBody = {
    inputs,
    response_mode: "blocking",
    user: "user-" + Date.now()
  };

  const options = {
    hostname: 'api.dify.ai',
    path: `/v1/workflows/run?workflow_id=${workflowId}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(requestBody).length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

// Usage:
// const result = await callWorkflow('vEpTYaWI8vURb3ev', 'app-82F1Uk9YLgO7bDwmyOpTfZdB',
//   { job_title: 'Python Developer' });
```

---

## Copy-Paste: Python

```python
import requests
import json

def call_workflow(workflow_id, api_key, inputs):
    url = f"https://api.dify.ai/v1/workflows/run?workflow_id={workflow_id}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": inputs,
        "response_mode": "blocking",
        "user": f"user-{int(time.time() * 1000)}"
    }

    response = requests.post(url, json=payload, headers=headers, timeout=30)
    return response.json()

# Usage:
# result = call_workflow(
#     'vEpTYaWI8vURb3ev',
#     'app-82F1Uk9YLgO7bDwmyOpTfZdB',
#     {'job_title': 'Python Developer'}
# )
```

---

## Copy-Paste: Java/Spring Boot

```java
@Service
public class DifyService {

    private final RestTemplate restTemplate;
    private static final String WORKFLOW1_URL = "https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev";
    private static final String WORKFLOW1_KEY = "app-82F1Uk9YLgO7bDwmyOpTfZdB";

    @Autowired
    public DifyService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> callWorkflow1(String jobTitle) {
        Map<String, Object> body = new HashMap<>();
        body.put("inputs", Map.of("job_title", jobTitle));
        body.put("response_mode", "blocking");
        body.put("user", "user-" + System.currentTimeMillis());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + WORKFLOW1_KEY);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                WORKFLOW1_URL,
                entity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                return (Map<String, Object>) data.get("outputs");
            }
        } catch (Exception e) {
            // Handle error
        }

        return Collections.emptyMap();
    }
}
```

---

## Copy-Paste: Configuration (Spring Boot)

Add to `application.yml`:
```yaml
dify:
  workflow1:
    url: https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev
    api-key: app-82F1Uk9YLgO7bDwmyOpTfZdB
  workflow2:
    url: https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R
    api-key: app-TEw1j6rBUw0ZHHlTdJvJFfPB

rest:
  timeout: 30000
```

---

## Response Format

All responses have this structure:

```json
{
  "data": {
    "workflow_run_id": "...",
    "task_id": "...",
    "outputs": {
      // Your workflow outputs here
    },
    "status": "succeeded",
    "elapsed_time": 11.5
  }
}
```

Access outputs with: `response.data.outputs`

---

## Workflow1 Outputs

```javascript
{
  "session_id": "session-1761642289221",
  "questions": [...array...],
  "questions_count": 5,
  "job_title": "...",
  "save_status": "成功",
  "error_message": ""
}
```

---

## Workflow2 Outputs

```javascript
{
  "session_id": "...",
  "question_id": "...",
  "generated_answer": "...full answer text...",
  "save_status": "失败" or "成功"
}
```

---

## Important Timings

| Item | Value |
|------|-------|
| Workflow1 Execution | ~11 seconds |
| Workflow2 Execution | ~12.7 seconds |
| **HTTP Timeout Required** | **30+ seconds** |
| Rate Limit | No known limit |

---

## Error Codes

| Code | Problem | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API key format: `Bearer {key}` |
| 404 | Workflow not found | Use correct ID: `vEpTYaWI8vURb3ev` or `5X6RBtTFMCZr0r4R` |
| 400 | Bad request | Include all required fields: inputs, response_mode, user |
| 500 | Server error | Try again, may be temporary |
| Timeout | Request took >30s | Increase timeout, workflows take 10-15 seconds |

---

## Quick Test

Run this to verify everything works:

```bash
node test-correct-api.js
```

Expected:
```
✅ Workflow1: 成功
✅ Workflow2: 成功
```

---

## Files to Read

| Task | File |
|------|------|
| **Full Details** | WORKFLOWS_COMPLETE_SUMMARY.md |
| **API Reference** | WORKFLOW_API_INTEGRATION_GUIDE.md |
| **Backend Code** | BACKEND_WORKFLOW_INTEGRATION.md |
| **Test Results** | WORKFLOW_API_TEST_SUCCESS.md |

---

## Common Mistakes

❌ Using App ID instead of public ID
❌ Missing `response_mode: "blocking"`
❌ Not setting 30+ second timeout
❌ Hardcoding API keys in code
❌ Not including `user` field
❌ Using wrong endpoint format

---

## Environment Variables

Create `.env` or set system variables:

```
DIFY_WORKFLOW1_ID=vEpTYaWI8vURb3ev
DIFY_WORKFLOW1_KEY=app-82F1Uk9YLgO7bDwmyOpTfZdB

DIFY_WORKFLOW2_ID=5X6RBtTFMCZr0r4R
DIFY_WORKFLOW2_KEY=app-TEw1j6rBUw0ZHHlTdJvJFfPB

DIFY_API_BASE=https://api.dify.ai/v1
DIFY_TIMEOUT=30000
```

---

## Production Checklist

- [ ] Use environment variables for API keys
- [ ] Set timeout to 30 seconds
- [ ] Implement error handling
- [ ] Add request logging
- [ ] Implement retry logic
- [ ] Add monitoring/alerts
- [ ] Test end-to-end
- [ ] Security review

---

**Last Updated**: 2025-10-28
**Status**: ✅ Ready to Use
**Test Script**: `test-correct-api.js`
