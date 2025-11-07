# Backend Workflow Integration - Implementation Guide

## Current Status

✅ Both Workflow1 and Workflow2 have been tested and confirmed working via Dify API.

The workflows are ready to be integrated into the backend service. This document provides the exact implementation details.

## Workflow1 Integration (Generate Questions)

### Where to Add This

**File**: `backend/main/java/com/interview/interview-server/controller/` (create or update)

Create a new controller method or endpoint that handles question generation:

```java
@PostMapping("/api/questions/generate")
public ResponseEntity<Map<String, Object>> generateQuestions(@RequestParam String jobTitle) {
    // Call Dify Workflow1
    Map<String, Object> result = difyWorkflowService.callWorkflow1(jobTitle);
    return ResponseEntity.ok(result);
}
```

### Service Implementation

**File**: `backend/main/java/com/interview/interview-server/service/DifyWorkflowService.java` (create new)

```java
@Service
public class DifyWorkflowService {

    private static final String WORKFLOW1_URL = "https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev";
    private static final String WORKFLOW1_API_KEY = "app-82F1Uk9YLgO7bDwmyOpTfZdB";

    private static final String WORKFLOW2_URL = "https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R";
    private static final String WORKFLOW2_API_KEY = "app-TEw1j6rBUw0ZHHlTdJvJFfPB";

    private final RestTemplate restTemplate;

    public Map<String, Object> callWorkflow1(String jobTitle) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("inputs", Map.of("job_title", jobTitle));
        requestBody.put("response_mode", "blocking");
        requestBody.put("user", "user-" + System.currentTimeMillis());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + WORKFLOW1_API_KEY);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                WORKFLOW1_URL,
                entity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                Map<String, Object> outputs = (Map<String, Object>) data.get("outputs");

                return Map.of(
                    "success", true,
                    "sessionId", outputs.get("session_id"),
                    "questions", outputs.get("questions"),
                    "questionsCount", outputs.get("questions_count"),
                    "jobTitle", outputs.get("job_title")
                );
            }
        } catch (Exception e) {
            // Log error
            return Map.of("success", false, "error", e.getMessage());
        }

        return Map.of("success", false, "error", "Unknown error");
    }

    public Map<String, Object> callWorkflow2(
        String sessionId,
        String questionId,
        String userAnswer,
        String jobTitle
    ) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("inputs", Map.of(
            "session_id", sessionId,
            "question_id", questionId,
            "user_answer", userAnswer,
            "job_title", jobTitle
        ));
        requestBody.put("response_mode", "blocking");
        requestBody.put("user", "user-" + System.currentTimeMillis());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + WORKFLOW2_API_KEY);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                WORKFLOW2_URL,
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
            // Log error
            return Map.of("success", false, "error", e.getMessage());
        }

        return Map.of("success", false, "error", "Unknown error");
    }
}
```

### Bean Configuration

Add RestTemplate bean to your Spring configuration:

```java
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

## Frontend Integration

### Where to Add This

**File**: `frontend/src/services/difyService.js` (create or update existing)

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';

export const difyService = {
  /**
   * Generate interview questions for a given job title
   * @param {string} jobTitle - The job title
   * @returns {Promise} Response with session_id, questions, and questions_count
   */
  async generateQuestions(jobTitle) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/questions/generate`,
        {},
        {
          params: { jobTitle }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          sessionId: response.data.sessionId,
          questions: response.data.questions,
          questionsCount: response.data.questionsCount,
          jobTitle: response.data.jobTitle
        };
      } else {
        throw new Error(response.data.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  },

  /**
   * Generate a standard answer for a question
   * @param {string} sessionId - Session ID from Workflow1
   * @param {string} questionId - Question ID to answer
   * @param {string} userAnswer - User's answer text
   * @param {string} jobTitle - Job title context
   * @returns {Promise} Response with generated_answer and save_status
   */
  async generateAnswer(sessionId, questionId, userAnswer, jobTitle) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/answers/generate`,
        {},
        {
          params: {
            sessionId,
            questionId,
            userAnswer,
            jobTitle
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          sessionId: response.data.sessionId,
          questionId: response.data.questionId,
          generatedAnswer: response.data.generatedAnswer,
          saveStatus: response.data.saveStatus
        };
      } else {
        throw new Error(response.data.error || 'Failed to generate answer');
      }
    } catch (error) {
      console.error('Error generating answer:', error);
      throw error;
    }
  }
};
```

### Using in Vue Components

Example in `AIInterviewSession.vue` or similar:

```vue
<script>
import { difyService } from '@/services/difyService';

export default {
  data() {
    return {
      jobTitle: '',
      sessionId: null,
      questions: [],
      currentQuestionIndex: 0,
      userAnswer: '',
      generatedAnswer: null,
      isGeneratingQuestions: false,
      isGeneratingAnswer: false
    };
  },

  methods: {
    async startInterview() {
      this.isGeneratingQuestions = true;
      try {
        const result = await difyService.generateQuestions(this.jobTitle);

        this.sessionId = result.sessionId;
        this.questions = result.questions;
        this.currentQuestionIndex = 0;

        console.log(`Generated ${result.questionsCount} questions`);
      } catch (error) {
        this.$message.error('Failed to generate questions: ' + error.message);
      } finally {
        this.isGeneratingQuestions = false;
      }
    },

    async submitAnswer() {
      const currentQuestion = this.questions[this.currentQuestionIndex];

      this.isGeneratingAnswer = true;
      try {
        const result = await difyService.generateAnswer(
          this.sessionId,
          currentQuestion.id,
          this.userAnswer,
          this.jobTitle
        );

        this.generatedAnswer = result.generatedAnswer;

        if (result.saveStatus === '成功') {
          this.$message.success('Answer saved successfully');
        } else {
          this.$message.warning('Answer generated but save failed');
        }
      } catch (error) {
        this.$message.error('Failed to generate answer: ' + error.message);
      } finally {
        this.isGeneratingAnswer = false;
      }
    }
  }
};
</script>
```

## Configuration

### Environment Variables

Add to `.env.local` (frontend):
```
VUE_APP_API_BASE_URL=http://localhost:8080
```

Add to `application.yml` (backend):
```yaml
dify:
  workflow1:
    url: https://api.dify.ai/v1/workflows/run?workflow_id=vEpTYaWI8vURb3ev
    apiKey: app-82F1Uk9YLgO7bDwmyOpTfZdB
  workflow2:
    url: https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R
    apiKey: app-TEw1j6rBUw0ZHHlTdJvJFfPB
```

Then update service to use configuration:

```java
@Service
public class DifyWorkflowService {

    @Value("${dify.workflow1.url}")
    private String workflow1Url;

    @Value("${dify.workflow1.apiKey}")
    private String workflow1ApiKey;

    @Value("${dify.workflow2.url}")
    private String workflow2Url;

    @Value("${dify.workflow2.apiKey}")
    private String workflow2ApiKey;

    // ... rest of implementation
}
```

## Error Handling

### Timeout Handling

Since workflows take 10-15 seconds to complete:

```java
@Bean
public RestTemplate restTemplate() {
    HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
    factory.setConnectTimeout(5000);        // 5 seconds
    factory.setReadTimeout(30000);          // 30 seconds - IMPORTANT!
    return new RestTemplate(factory);
}
```

### Retry Logic

For transient failures:

```java
public Map<String, Object> callWorkflow1WithRetry(String jobTitle, int maxRetries) {
    for (int attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return callWorkflow1(jobTitle);
        } catch (SocketTimeoutException e) {
            if (attempt < maxRetries - 1) {
                try {
                    Thread.sleep(1000 * (attempt + 1)); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }
    return Map.of("success", false, "error", "Max retries exceeded");
}
```

## Testing

### Unit Test Example

```java
@SpringBootTest
@ExtendWith(MockitoExtension.class)
public class DifyWorkflowServiceTest {

    @InjectMocks
    private DifyWorkflowService difyWorkflowService;

    @Mock
    private RestTemplate restTemplate;

    @Test
    public void testCallWorkflow1() {
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("data", Map.of(
            "outputs", Map.of(
                "session_id", "session-123",
                "questions", List.of(),
                "questions_count", 5
            )
        ));

        ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            any()
        )).thenReturn(response);

        Map<String, Object> result = difyWorkflowService.callWorkflow1("Python Developer");

        assertEquals(true, result.get("success"));
        assertEquals("session-123", result.get("sessionId"));
    }
}
```

### Integration Test

```bash
# Run the test script
node test-correct-api.js

# Expected output:
# ✅ Workflow1: 成功
# ✅ Workflow2: 成功
```

## Performance Considerations

### Execution Times (from test results)
- **Workflow1**: ~11 seconds (question generation)
- **Workflow2**: ~12.7 seconds (answer generation + save attempt)

### Recommendations
1. **Async Execution**: Use async/await or CompletableFuture for long-running workflows
2. **Progress Feedback**: Show loading spinners/progress bars to users
3. **Timeout**: Set HTTP timeout to at least 30 seconds
4. **Caching**: Consider caching common questions (e.g., by job title)

### Example: Async Execution

```java
@PostMapping("/api/questions/generate-async")
public ResponseEntity<Map<String, Object>> generateQuestionsAsync(
    @RequestParam String jobTitle
) {
    CompletableFuture<Map<String, Object>> future =
        CompletableFuture.supplyAsync(() ->
            difyWorkflowService.callWorkflow1(jobTitle)
        );

    // Return immediately with job ID
    String jobId = UUID.randomUUID().toString();
    jobCache.put(jobId, future);

    return ResponseEntity.accepted().body(Map.of(
        "jobId", jobId,
        "status", "processing"
    ));
}
```

## Monitoring and Logging

### Log All Workflow Calls

```java
private static final Logger logger = LoggerFactory.getLogger(DifyWorkflowService.class);

public Map<String, Object> callWorkflow1(String jobTitle) {
    long startTime = System.currentTimeMillis();

    logger.info("Starting Workflow1 call with jobTitle: {}", jobTitle);

    try {
        Map<String, Object> result = callWorkflowInternal();

        long duration = System.currentTimeMillis() - startTime;
        logger.info("Workflow1 completed successfully in {}ms", duration);

        return result;
    } catch (Exception e) {
        long duration = System.currentTimeMillis() - startTime;
        logger.error("Workflow1 failed after {}ms: {}", duration, e.getMessage(), e);
        throw e;
    }
}
```

## Security Notes

⚠️ **Important**: Do not expose API keys in frontend code or logs.

### Best Practices
1. Store API keys in environment variables on the backend
2. Never commit API keys to version control
3. Use HTTPS for all API calls
4. Implement rate limiting to prevent abuse
5. Validate and sanitize all user inputs before sending to workflows
6. Log API calls without including sensitive data

## Status

✅ Ready for implementation
✅ All workflows tested and working
✅ Backend service integration planned
⏳ Frontend integration can proceed after backend is ready

---

**Last Updated**: 2025-10-28
**Next Step**: Implement DifyWorkflowService in your backend
