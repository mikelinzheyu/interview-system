# Storage Service Integration Issue Analysis

**Date:** 2025-10-24
**Status:** 🔴 **CRITICAL ISSUE IDENTIFIED**

---

## Problem Summary

The `storage-service` (Java Spring Boot service) has been added to the project but there are **critical configuration and deployment issues** preventing Workflow2 from saving answers correctly.

---

## Root Cause Analysis

### Issue 1: Port Mismatch ❌

**In docker-compose.yml:**
```yaml
# Line 28: Backend service listens on port 8080
ports:
  - "${BACKEND_PORT:-8080}:3001"
```

**In storage-service/src/main/resources/application.properties:**
```properties
# Line 2: Storage service configured for port 8080
server.port=8080
```

**Problem:** Both services trying to use the same port!
- Backend (Node.js mock server) → port 8080
- Storage Service (Java) → port 8080
- **Result:** Port conflict, service won't start

---

### Issue 2: Storage Service Not in Docker Compose ❌

**Evidence:**
- `docker-compose.yml` has no `storage-service` container definition
- Only has: backend, frontend, redis, nginx-proxy
- Storage service exists but is **NOT deployed**

**Current Architecture:**
```
Workflows (Dify Cloud)
    ↓
ngrok tunnel (phrenologic-preprandial-jesica.ngrok-free.dev)
    ↓
localhost:8090/api/sessions  ← Direct to localhost, no service listening!
```

**Expected Architecture:**
```
Workflows (Dify Cloud)
    ↓
ngrok tunnel
    ↓
Docker: storage-service (Spring Boot)
    ↓
Redis (Docker)
```

---

### Issue 3: API Endpoint Inconsistency ❌

**In SessionController.java (line 19):**
```java
@RequestMapping("/api/sessions")
public class SessionController { ... }
```

**In workflow2 Python code:**
```python
api_url = f"https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions/{session_id}"
```

**Problem:**
- Endpoint exists but service isn't deployed
- Workflows are calling ngrok tunnel to `localhost:8090`
- No Java storage service is actually running on port 8090

---

### Issue 4: Security Filter Configuration ⚠️

**In SecurityConfig.java (line 31):**
```java
.requestMatchers("/auth/**").permitAll()
.requestMatchers("/configs").permitAll()
.anyRequest().authenticated()  // ← ALL OTHER REQUESTS REQUIRE AUTH
```

**Problem:**
- `/api/sessions` endpoint is NOT explicitly allowed
- Requests without proper Bearer token will be rejected
- Storage service would require authentication

---

### Issue 5: Missing Storage Service Container ❌

**What's missing from docker-compose.yml:**
```yaml
storage-service:
  build:
    context: ./storage-service
    dockerfile: Dockerfile
  image: interview-system/storage-service:latest
  container_name: interview-storage-service
  restart: unless-stopped
  environment:
    SERVER_PORT: 8090  # Different from backend port 8080
    SPRING_DATA_REDIS_HOST: interview-redis
    SPRING_DATA_REDIS_PORT: 6379
    API_KEY: ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
  expose:
    - "8090"
  ports:
    - "8090:8090"
  networks:
    - interview-network
  depends_on:
    redis:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8090/api/sessions"]
    interval: 30s
    timeout: 10s
    retries: 5
```

---

## Current Workflow Problem

### What Happens Now:

```
Workflow2 executes:
  1. Generates answer ✅
  2. Tries to save to: https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions
  3. ngrok tunnel forwards to: localhost:8090/api/sessions
  4. ❌ NOTHING LISTENING on localhost:8090!
  5. Returns: 504 Gateway Timeout / Connection Refused
```

### Test Output (from your recent test):
```
❌ 工作流2 - 生成答案 调用失败 (状态码: 504)
❌ 工作流2测试失败
```

**Why 504?**
- ngrok tries to connect to localhost:8090
- No service listening on that port
- After timeout, returns: **504 Bad Gateway**

---

## Current Working Setup (The Earlier Test)

Earlier test **worked** because:
```
Dify Workflow2
  ↓
Generated answer + save_status: "成功"
  ↓
But answer was NOT actually saved to storage!
  ↓
Later verification query only showed hasAnswer: false
```

**Previous "Success" Was Misleading:**
- Workflow2 node returned success message
- But the actual Python code couldn't connect to storage
- Answer wasn't persisted to Redis
- Only appeared to work because the node has default return values

---

## Solution Options

### Option A: Use Existing ngrok Setup (Current) ✅ SIMPLEST
Remove storage-service, keep using ngrok tunnel to mock backend

**Steps:**
1. Delete `storage-service` folder (not needed)
2. Keep `docker-compose.yml` as is (backend on 8080)
3. Ensure ngrok tunnel running: `localhost:8090`
4. Update workflows to call ngrok URL ✅ Already configured

**Pros:** Simple, uses existing setup
**Cons:** Not a proper microservice architecture

---

### Option B: Deploy Storage Service in Docker ⭐ RECOMMENDED
Add storage-service container to docker-compose.yml

**Steps:**
1. Fix docker-compose.yml - add storage-service container
2. Change storage-service port from 8080 to 8090
3. Update SecurityConfig to allow `/api/sessions` endpoints
4. Deploy with `docker-compose up`
5. Remove ngrok tunnel dependency

**Configuration Changes:**

**a) storage-service/src/main/resources/application.properties:**
```properties
server.port=8090  # Change from 8080

spring.data.redis.host=interview-redis  # Docker network host
spring.data.redis.port=6379
spring.data.redis.password=

# Security
api.key=${API_KEY:ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0}
```

**b) storage-service/src/main/java/.../SecurityConfig.java:**
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf().disable()
        .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        .and()
        .authorizeHttpRequests(authz -> authz
            .requestMatchers("/api/sessions/**").permitAll()  // ← ADD THIS
            .requestMatchers("/auth/**").permitAll()
            .requestMatchers("/configs").permitAll()
            .anyRequest().authenticated()
        );

    return http.build();
}
```

**c) docker-compose.yml:**
```yaml
storage-service:
  build:
    context: ./storage-service
    dockerfile: Dockerfile
  image: interview-system/storage-service:latest
  container_name: interview-storage-service
  restart: unless-stopped
  environment:
    SERVER_PORT: 8090
    SPRING_DATA_REDIS_HOST: interview-redis
    SPRING_DATA_REDIS_PORT: 6379
    API_KEY: ${API_KEY:-ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0}
  expose:
    - "8090"
  ports:
    - "8090:8090"
  networks:
    - interview-network
  depends_on:
    redis:
      condition: service_healthy
```

**d) Update workflow2 to use direct URL (no ngrok):**
```python
# Instead of ngrok URL:
api_url = "http://interview-storage-service:8090/api/sessions"

# Or from outside Docker:
api_url = "http://localhost:8090/api/sessions"
```

**Pros:** Proper microservice, Docker deployment ready
**Cons:** Requires Java/Maven compilation

---

## Recommended Fix: Option A (Keep Current Setup)

Since ngrok tunnel is already working, **simplest solution**:

### 1. Delete Storage Service (Not Used)
```bash
rm -rf D:\code7\interview-system\storage-service
```

### 2. Keep ngrok tunnel running
```bash
ngrok http 8090
```

### 3. Keep current workflow setup
- Workflows call `https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions`
- ngrok forwards to `localhost:8090/api/sessions`
- Mock backend handles storage (or Redis directly)

### 4. Verify test passes
```bash
node test-workflows-complete.js
```

---

## Why Test Failed This Time

**Symptom:** `❌ 工作流2 - 生成答案 调用失败 (状态码: 504)`

**Likely Cause:**
1. Storage service not deployed/running
2. ngrok tunnel not properly forwarding to port 8090
3. Or: Recent changes tried to enable storage-service but configs incomplete

**Verification:**
```bash
# Check if port 8090 is listening
netstat -an | findstr :8090

# Check ngrok status
curl http://127.0.0.1:4040/api/tunnels

# Try direct API call
curl -X POST "http://localhost:8090/api/sessions" \
  -H "Authorization: Bearer ak_live_..." \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test"}'
```

---

## Architecture Comparison

### Current (Working with ngrok)
```
Dify Cloud (api.dify.ai)
    ↓ HTTPS
ngrok tunnel (phrenologic-preprandial-jesica.ngrok-free.dev)
    ↓ HTTPS/TLS
localhost:8090
    ↓
[Whatever service handles /api/sessions]
    ↓
Redis Database
```

### If Storage Service Was Running
```
Dify Cloud (api.dify.ai)
    ↓ HTTPS
ngrok tunnel (phrenologic-preprandial-jesica.ngrok-free.dev)
    ↓ HTTPS/TLS
Docker Network: interview-storage-service:8090
    ↓ Spring Boot
SessionController
    ↓
Redis (Docker: interview-redis:6379)
```

---

## Summary Table

| Component | Status | Port | Issue |
|-----------|--------|------|-------|
| **Workflow1** | ✅ Working | - | None |
| **Workflow2** | ❌ Failing | - | No storage service |
| **ngrok tunnel** | ✅ Running | 8090 | Forwards to nowhere |
| **storage-service** | ❌ Exists but not deployed | 8080 (config) → 8090 (needed) | Port conflict + not in docker-compose |
| **backend mock** | ✅ Running | 8080 | Listening but not handling /api/sessions |
| **Redis** | ✅ Running | 6379 | Healthy but not being used for storage |

---

## Immediate Action Required

Choose one:

**Option A - RECOMMENDED (Keep Simple):**
1. ✅ Keep ngrok tunnel running on port 8090
2. ✅ Keep workflows as configured
3. ❌ Delete/ignore storage-service folder
4. ✅ Run test to verify

**Option B - (Proper Microservice):**
1. ✅ Fix storage-service configs (port 8090, security)
2. ✅ Add to docker-compose.yml
3. ✅ Update workflow URLs to `http://interview-storage-service:8090/api/sessions`
4. ✅ Run: `docker-compose up`
5. ✅ Run test to verify

---

## Next Steps

1. **Diagnose Current State**
   ```bash
   # Check what's running
   docker ps
   netstat -an | findstr :8090
   curl http://127.0.0.1:4040/api/tunnels
   ```

2. **Implement Option A (Simplest)**
   - Ensure ngrok tunnel is running
   - Remove storage-service from project
   - Run test

3. **Or Implement Option B (Proper)**
   - Update storage-service configs
   - Update docker-compose.yml
   - Deploy and test

---

**Recommended:** Go with **Option A** for now (keep existing working setup), then later migrate to **Option B** (proper Docker microservice) if needed.

