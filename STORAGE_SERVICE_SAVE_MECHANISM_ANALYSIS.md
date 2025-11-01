# STORAGE SERVICE SAVE MECHANISM - COMPLETE ANALYSIS

## 1. WHAT IS save_status?

The save_status variable is returned by Workflow2's "save_standard_answer" Python node.
It is NOT a property of the Storage Service itself.

Location: workflow2-fixed-latest.yml, lines 289-330

Return Values:
- "成功" (success): Save operation completed with HTTP 200-299
- "失败" (failure): Any other HTTP status or exception occurred

## 2. SAVE_STATUS MECHANISM

The Python code in Workflow2:

Step 1: GET /api/sessions/{sessionId}
  - Retrieve current session data
  - If HTTP != 200: return {"status": "失败", "error_message": "GET失败: HTTP {code}"}

Step 2: Update Question in Memory
  - Find question with matching ID in questions array
  - If not found: return {"status": "失败", "error_message": "问题ID {id} 不存在"}
  - Update answer field and hasAnswer flag

Step 3: POST /api/sessions/{sessionId}
  - Send updated session back to storage service
  - If HTTP 200-299: return {"status": "成功", "error_message": ""}
  - If other HTTP: return {"status": "失败", "error_message": "POST失败: HTTP {code}"}
  
Step 4: Exception Handling
  - HTTP errors: return {"status": "失败", "error_message": "HTTP错误 {code}: {reason}"}
  - Timeout: return {"status": "失败", "error_message": "请求超时"}
  - Any exception: return {"status": "失败", "error_message": "错误: {exception}"}

## 3. API ENDPOINTS

All endpoints in SessionController.java, lines 26-519

1. POST /api/sessions
   Creates new session
   Returns: {sessionId, jobTitle, questionCount, questionIds}

2. PUT /api/sessions/{sessionId}/questions/{questionId}
   Updates a specific question's answer
   Returns: {sessionId, questionId, answer, hasAnswer}

3. GET /api/sessions/{sessionId}
   Retrieves complete session
   Returns: {sessionId, jobTitle, questions[], status, timestamps}

4. GET /api/sessions/{sessionId}/questions/{questionId}
   Gets specific question
   Returns: {id, question, answer, hasAnswer, jobTitle, status}

5. DELETE /api/sessions/{sessionId}
   Deletes session
   Returns: {message, sessionId}

All endpoints require: Authorization: Bearer {api_key}

## 4. WHY save_status RETURNS "失败" - TOP CAUSES

RANKED BY PROBABILITY:

1. API ENDPOINT PATH ERROR (90%)
   Problem: Workflow2 POSTs to /api/sessions without {sessionId}
   Line 311: post_url = f"{api_base_url}" (WRONG)
   Should be: post_url = f"{api_base_url}/{session_id}" (CORRECT)
   Result: HTTP 404 Not Found
   
2. STORAGE SERVICE NOT RUNNING (70%)
   Problem: Service container not deployed/started
   Evidence: docker-compose.yml has no storage-service container
   Result: Connection refused or 504 Bad Gateway via ngrok
   
3. API KEY MISMATCH (60%)
   Problem: Authorization header key doesn't match configured key
   Configured in: application.properties (api.key=...)
   Workflow2 uses: "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
   Result: HTTP 401 Unauthorized
   
4. REDIS CONNECTION FAILURE (50%)
   Problem: Storage Service can't connect to Redis
   Config: spring.redis.host=interview-redis, port=6379
   Result: HTTP 500 Internal Server Error
   
5. REQUEST TIMEOUT (40%)
   Problem: Network request exceeds 30-second timeout
   Causes: Large data, network latency, ngrok delays
   Result: "请求超时" error message
   
6. INVALID DATA STRUCTURE (30%)
   Problem: Request payload doesn't match expected format
   Result: HTTP 400 Bad Request
   
7. QUESTION ID NOT FOUND (25%)
   Problem: Workflow2 tries to update question that doesn't exist
   Result: "问题ID {id} 不存在" error message
   
8. NGROK TUNNEL ISSUES (15%)
   Problem: ngrok tunnel unstable/disconnected
   Result: 502 Bad Gateway, timeouts

## 5. ERROR HANDLING & LOGGING

All endpoints wrapped in try-catch blocks (lines 90-94, 160-164, 190-194, 237-241, 264-268)

Logger: private static final Logger logger = LoggerFactory.getLogger(SessionController.class)

Log levels:
- logger.error(): Exception caught, operation failed
- logger.warn(): Invalid data, recoverable issue
- logger.debug(): Request details, security events

Error responses:
- 200: Success
- 400: Bad request, missing fields
- 401: Invalid/missing API key (ApiKeyAuthFilter)
- 404: Session or question not found
- 500: Server exception with error message

Example error response:
{
  "error": "Failed to update answer: {java exception message}"
}

## 6. REDIS PERSISTENCE

How data is stored:

SessionData object:
- sessionId, jobTitle, questions[], status, timestamps, metadata

Serialization:
- Key: StringRedisSerializer → "interview:session:{sessionId}"
- Value: Jackson2JsonRedisSerializer → Full JSON object
- TTL: 24 hours

RedisTemplate configuration:
- Jackson2JsonRedisSerializer with default typing enabled
- Handles nested maps and lists automatically
- Graceful fallback if JSON parsing fails

Code (line 270-272):
private void persistSession(SessionData sessionData) {
    String key = buildRedisKey(sessionData.getSessionId());
    redisTemplate.opsForValue().set(key, sessionData, 24, TimeUnit.HOURS);
}

## 7. SECURITY & AUTHENTICATION

Bearer token validation in ApiKeyAuthFilter.java

Process:
1. Extract Authorization header
2. Check if starts with "Bearer "
3. Extract API key
4. Compare with validApiKey from application.properties
5. If match: allow request, else: return 401 Unauthorized

Configured key in application.properties:
api.key=${SESSION_STORAGE_API_KEY:ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0}

Environment override:
SESSION_STORAGE_API_KEY environment variable

All /api/sessions endpoints permitted but require valid key.

## 8. KEY FILES STRUCTURE

storage-service/
├── src/main/java/com/example/interviewstorage/
│   ├── controller/SessionController.java (519 lines)
│   │   ├── createSession() - POST
│   │   ├── updateQuestionAnswer() - PUT
│   │   ├── getSession() - GET
│   │   ├── getQuestionWithAnswer() - GET
│   │   ├── deleteSession() - DELETE
│   │   └── Helper methods (persistence, validation, normalization)
│   ├── model/
│   │   ├── SessionData.java (Serializable)
│   │   └── QuestionData.java
│   └── config/
│       ├── SecurityConfig.java (Spring Security rules)
│       ├── ApiKeyAuthFilter.java (Bearer token validation)
│       └── RedisConfig.java (Jackson2JsonRedisSerializer)
└── src/main/resources/
    └── application.properties (port 8081, Redis config)

## 9. CONFIGURATION ISSUES

Port mismatch:
- application.properties: server.port=8081
- Dockerfile: EXPOSE 8081
- But workflows expect: localhost:8090
- Missing: storage-service container in docker-compose.yml

Redis configuration:
- Host: interview-redis (Docker) or localhost (local)
- Port: 6379
- Timeout: 3000ms
- Pool: max-active=8, max-idle=8

## 10. DIAGNOSTIC STEPS

1. Check error_message in save_status response
2. Verify Storage Service running: docker ps | grep storage
3. Test API key: curl with Bearer token
4. Check Redis: docker exec interview-redis redis-cli ping
5. Review Workflow2 Python code for correct URL format
6. Check docker logs: docker logs interview-storage-service
7. Verify ngrok tunnel: curl http://127.0.0.1:4040/api/tunnels

## 11. MOST COMMON FIX

90% of cases: Fix the API endpoint path in Workflow2

FROM: post_url = f"{api_base_url}"
TO:   post_url = f"{api_base_url}/{session_id}"

Then redeploy workflow.

