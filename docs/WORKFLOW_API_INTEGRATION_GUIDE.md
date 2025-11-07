# Workflow API Integration Guide

## Overview
Both Workflow1 and Workflow2 have been successfully tested and verified to work with the Dify public workflow API. This guide explains how to integrate them into your backend service.

## Tested API Endpoints

### Workflow1 (Generate Questions)
- **Endpoint**: `POST https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev`
- **API Key**: `app-82F1Uk9YLgO7bDwmyOpTfZdB`
- **Status**: ✅ Working

### Workflow2 (Generate Answers)
- **Endpoint**: `POST https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R`
- **API Key**: `app-TEw1j6rBUw0ZHHlTdJvJFfPB`
- **Status**: ✅ Working (generation successful, save to backend may fail depending on backend availability)

## Request Format

### Authentication
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

### Request Body Structure
```javascript
{
  "inputs": {
    // Input parameters specific to each workflow
  },
  "response_mode": "blocking",  // Wait for completion (required)
  "user": "unique-user-identifier"  // Any unique string identifier
}
```

## Workflow1: Generate Questions

### Request
```javascript
POST https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev

{
  "inputs": {
    "job_title": "Python 后端开发工程师"
  },
  "response_mode": "blocking",
  "user": "user-" + Date.now()
}
```

### Response (Success - 200)
```javascript
{
  "data": {
    "workflow_run_id": "...",
    "task_id": "...",
    "outputs": {
      "session_id": "session-1761642289221",
      "questions": [
        {
          "id": "q-1761642289221-0",
          "text": "请描述您过去在Python后端开发中使用的最具挑战性的项目..."
        },
        // ... more questions
      ],
      "job_title": "Python 后端开发工程师",
      "questions_count": 5,
      "save_status": "成功",
      "error_message": ""
    },
    "status": "succeeded",
    "elapsed_time": 11.036091
  }
}
```

### Key Output Fields
- **session_id**: Session identifier to use in Workflow2
- **questions**: Array of question objects with `id` and `text`
- **questions_count**: Number of questions generated
- **job_title**: Echo of input job title
- **save_status**: "成功" (success) or error message
- **error_message**: Any error details

## Workflow2: Generate Answers

### Request
```javascript
POST https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R

{
  "inputs": {
    "session_id": "session-1761642289221",      // From Workflow1 output
    "question_id": "q-1761642289221-0",         // From Workflow1 questions array
    "user_answer": "User's answer text here",   // User-provided answer
    "job_title": "Python 后端开发工程师"          // From Workflow1 or input
  },
  "response_mode": "blocking",
  "user": "user-" + Date.now()
}
```

### Response (Success - 200)
```javascript
{
  "data": {
    "workflow_run_id": "...",
    "task_id": "...",
    "outputs": {
      "session_id": "session-1761642289221",
      "question_id": "q-1761642289221-0",
      "generated_answer": "**职位:** Python 后端开发工程师\n\n**核心概念**\n1. ...",
      "save_status": "失败" or "成功"
    },
    "status": "succeeded",
    "elapsed_time": 12.749179
  }
}
```

### Key Output Fields
- **session_id**: Echo of input session ID
- **question_id**: Echo of input question ID
- **generated_answer**: LLM-generated standard answer
- **save_status**: Result of saving to backend ("成功" = success, "失败" = failed)

## Important Notes

### Workflow2 Save Status Behavior
The `save_status` field in Workflow2 may show "失败" (failed) because:

1. **Root Cause**: Workflow2's code attempts to save answers back to a backend service at:
   ```
   https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions/{session_id}
   ```

2. **Why It Fails**:
   - This ngrok URL is temporary and may not be running
   - The API key `ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0` may be invalid
   - The backend service may not be accessible

3. **What This Means**:
   - ✅ Answer **generation works perfectly** - the LLM creates high-quality answers
   - ⚠️ Answer **storage to backend may fail** - but this shouldn't prevent the workflow from returning the generated answer
   - ✅ You can **capture the `generated_answer` output** regardless of save_status

### Solution for Production
When integrating into your backend:

1. **Use the `generated_answer` output directly** - this is the valuable part
2. **Save the answer yourself** in your backend service using your own API
3. **Don't rely on Workflow2's internal save mechanism** - update the workflow to use your actual backend URL and credentials

## Integration Example (Node.js)

### Workflow1 Call
```javascript
async function callWorkflow1(jobTitle) {
  const requestBody = {
    inputs: { job_title: jobTitle },
    response_mode: "blocking",
    user: "user-" + Date.now()
  };

  const response = await fetch(
    'https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer app-82F1Uk9YLgO7bDwmyOpTfZdB',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  const result = await response.json();

  return {
    sessionId: result.data.outputs.session_id,
    questions: result.data.outputs.questions,
    questionsCount: result.data.outputs.questions_count
  };
}
```

### Workflow2 Call
```javascript
async function callWorkflow2(sessionId, questionId, userAnswer, jobTitle) {
  const requestBody = {
    inputs: {
      session_id: sessionId,
      question_id: questionId,
      user_answer: userAnswer,
      job_title: jobTitle
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

  const result = await response.json();

  return {
    sessionId: result.data.outputs.session_id,
    questionId: result.data.outputs.question_id,
    generatedAnswer: result.data.outputs.generated_answer,
    saveStatus: result.data.outputs.save_status
  };
}
```

## Testing

### Test Script
Use the provided test script: `test-correct-api.js`

```bash
node test-correct-api.js
```

This script:
- Calls Workflow1 to generate questions
- Waits for response
- Uses Workflow1's outputs to call Workflow2
- Shows all request/response details
- Indicates success/failure for each workflow

## Error Handling

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | Wrong workflow ID | Use public URL IDs: `vEpTYaWI8vURb3ev`, `5X6RBtTFMCZr0r4R` |
| 401 Unauthorized | Wrong API key | Verify API keys are correct and use `Bearer {key}` format |
| 400 Bad Request | Invalid request format | Ensure `inputs`, `response_mode`, and `user` fields are present |
| Timeout | Slow LLM response | Increase timeout to 30+ seconds (workflows take 10-13 seconds) |
| Invalid input parameter | Wrong field names | Use exact field names: `job_title`, `session_id`, `question_id`, `user_answer` |

## Security Considerations

⚠️ **Important**: The API keys in this document are test credentials:
- `app-82F1Uk9YLgO7bDwmyOpTfZdB` (Workflow1)
- `app-TEw1j6rBUw0ZHHlTdJvJFfPB` (Workflow2)

### For Production
1. **Store API keys securely** - use environment variables, not hardcoded
2. **Use API gateways** - don't expose Dify endpoints directly to frontend
3. **Implement rate limiting** - control workflow execution frequency
4. **Log API calls** - track usage for debugging and monitoring
5. **Validate inputs** - sanitize job_title and user_answer before sending
6. **Handle errors gracefully** - implement retry logic for transient failures

## References

- **Test Results**: See `WORKFLOW_API_TEST_SUCCESS.md`
- **Test Script**: `test-correct-api.js`
- **Workflow1 YAML**: `AI面试官-工作流1-生成问题-FIXED.yml`
- **Workflow2 YAML**: `workflow2-fixed-latest.yml`
- **Dify API Docs**: Reference used during development (in `D:/code7/test3/7.txt`)

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Workflow1 API | ✅ Working | Question generation confirmed |
| Workflow2 API | ✅ Working | Answer generation confirmed |
| Workflow1 Questions Output | ✅ Complete | Contains session_id, questions array, questions_count |
| Workflow2 Answer Output | ✅ Complete | Contains generated_answer field |
| Backend Save (Workflow2) | ⚠️ Unknown | Depends on backend service availability |
| Integration Ready | ✅ Yes | Can be integrated into backend service immediately |

---

**Last Updated**: 2025-10-28
**Test Status**: ✅ Both workflows successfully executed and returning data
**Ready for**: Backend service integration
