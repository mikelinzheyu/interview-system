# Dify 宸ヤ綔娴侀泦鎴愭寚鍗?

## 闂鍘熷洜

AI 鐢熸垚棰樼洰鍔熻兘鏃犳硶宸ヤ綔鐨勬牴鏈師鍥犳槸锛?

### 1. 鍚庣閰嶇疆缂哄け
`backend/main/resources/application.yml` 涓己灏?Dify 宸ヤ綔娴佺殑閰嶇疆椤广€?

### 2. API 璺緞涓嶅尮閰?
- **鍓嶇璇锋眰璺緞**锛歚/api/ai/dify-workflow`
- **鍚庣鏈熸湜璺緞**锛歚/api/v1/ai/dify-workflow`锛堟棫閰嶇疆锛?
- **瀹為檯璁块棶鍦板潃**锛氬墠绔€氳繃 axios baseURL `/api` 鍙戦€佽姹?

## 宸蹭慨澶嶇殑閰嶇疆

### 1. 鍚庣閰嶇疆 (application.yml)

宸叉坊鍔?Dify 宸ヤ綔娴侀厤缃細

```yaml
# AI鎺ュ彛閰嶇疆
ai:
  openai:
    api-key: ${OPENAI_API_KEY:}
    base-url: ${OPENAI_BASE_URL:https://api.openai.com}
    model: gpt-3.5-turbo
    timeout: 30000

  # Dify 宸ヤ綔娴侀厤缃?
  dify:
    workflow-url: ${DIFY_WORKFLOW_URL:https://udify.app/workflow/ZJIwyB7UMouf2H9V}
    app-id: ${DIFY_APP_ID:app-vZlc0w5Dio2gnrTkdlblcPXG}
```

### 2. 鏈嶅姟鍣ㄤ笂涓嬫枃璺緞淇敼

宸插皢 context-path 浠?`/api/v1` 淇敼涓?`/api`锛?

```yaml
# 鏈嶅姟鍣ㄩ厤缃?
server:
  port: 8080
  servlet:
    context-path: /api
```

## 濡備綍閰嶇疆鎮ㄧ殑 Dify 宸ヤ綔娴?

### 鏂瑰紡1锛氫娇鐢ㄧ幆澧冨彉閲忥紙鎺ㄨ崘锛?

鍦ㄥ惎鍔ㄥ悗绔湇鍔″墠锛岃缃幆澧冨彉閲忥細

**Windows (CMD):**
```cmd
set DIFY_WORKFLOW_URL=https://your-dify-instance.com/workflow/your-workflow-id
set DIFY_APP_ID=your-app-id
```

**Windows (PowerShell):**
```powershell
$env:DIFY_WORKFLOW_URL="https://your-dify-instance.com/workflow/your-workflow-id"
$env:DIFY_APP_ID="your-app-id"
```

**Linux/Mac:**
```bash
export DIFY_WORKFLOW_URL=https://your-dify-instance.com/workflow/your-workflow-id
export DIFY_APP_ID=your-app-id
```

### 鏂瑰紡2锛氱洿鎺ヤ慨鏀归厤缃枃浠?

濡傛灉鎮ㄤ笉鎯充娇鐢ㄧ幆澧冨彉閲忥紝鍙互鐩存帴淇敼 `application.yml` 涓殑榛樿鍊硷細

```yaml
dify:
  workflow-url: https://your-dify-instance.com/workflow/your-workflow-id
  app-id: your-app-id
```

## 瀹屾暣鐨勮姹傛祦绋?

1. **鐢ㄦ埛鎿嶄綔**锛氬湪鍓嶇椤甸潰 `http://localhost/interview/ai` 杈撳叆涓撲笟鍚嶇О锛岀偣鍑?鏅鸿兘鐢熸垚棰樼洰"

2. **鍓嶇璇锋眰**锛?
   ```javascript
   // frontend/src/views/ai/SmartQuestionGenerator.vue:383
   const response = await aiApi.callDifyWorkflow({
     requestType: 'generate_questions',
     jobTitle: form.jobTitle
   })
   ```

3. **API 璋冪敤**锛?
   ```javascript
   // frontend/src/api/ai.js:155
   export function callDifyWorkflow(data) {
     return api({
       url: '/ai/dify-workflow',
       method: 'post',
       data
     })
   }
   ```

4. **Axios 璇锋眰**锛?
   - baseURL: `/api` (frontend/src/api/index.js:6)
   - 瀹屾暣璺緞: `/api/ai/dify-workflow`

5. **Vite 浠ｇ悊杞彂**锛?
   - 浠ｇ悊閰嶇疆: `frontend/vite.config.js:62`
   - 鐩爣鍦板潃: `http://localhost:8080` (鎴栦粠鐜鍙橀噺璇诲彇)
   - 杞彂鍒? `http://localhost:8080/api/ai/dify-workflow`

6. **鍚庣鎺ユ敹**锛?
   - Context Path: `/api` (application.yml:61)
   - Controller 鏄犲皠: `/ai/dify-workflow` (AiController.java:17)
   - 瀹屾暣璺緞: `http://localhost:8080/api/ai/dify-workflow` 鉁?

7. **璋冪敤 Dify 宸ヤ綔娴?*锛?
   - AiServiceImpl.java:150 鐨?`callDifyWorkflow` 鏂规硶
   - 浣跨敤閰嶇疆鐨?`difyWorkflowUrl` 鍜?`difyAppId`
   - 鍙戦€?POST 璇锋眰鍒?Dify API

8. **杩斿洖缁撴灉**锛?
   - Dify 杩斿洖 session_id 鍜岀敓鎴愮殑闂鍒楄〃
   - 鍚庣瑙ｆ瀽骞舵牸寮忓寲鏁版嵁
   - 杩斿洖缁欏墠绔睍绀?

## 濡備綍鑾峰彇 Dify 宸ヤ綔娴佷俊鎭?

### 1. Workflow URL
鐧诲綍鎮ㄧ殑 Dify 鎺у埗鍙帮紝鎵惧埌瀵瑰簲鐨勫伐浣滄祦锛屽伐浣滄祦 URL 鏍煎紡閫氬父鏄細
```
https://[your-dify-instance]/workflow/[workflow-id]
```

### 2. App ID (API Key)
鍦?Dify 宸ヤ綔娴佺殑璁剧疆椤甸潰锛屾壘鍒?API 璁块棶閮ㄥ垎锛屽鍒?App ID 鎴?API Token銆?

## 娴嬭瘯姝ラ

### 1. 閲嶅惎鍚庣鏈嶅姟

纭繚淇敼鍚庣殑閰嶇疆鐢熸晥锛岄渶瑕侀噸鍚?Spring Boot 搴旂敤銆?

### 2. 鎵撳紑娴忚鍣ㄥ紑鍙戣€呭伐鍏?

璁块棶 `http://localhost/interview/ai`锛屾墦寮€娴忚鍣ㄧ殑寮€鍙戣€呭伐鍏凤紙F12锛夈€?

### 3. 娴嬭瘯璇锋眰

1. 杈撳叆浠绘剰涓撲笟鍚嶇О锛堝锛氬墠绔紑鍙戝伐绋嬪笀锛?
2. 鐐瑰嚮"鏅鸿兘鐢熸垚棰樼洰"
3. 鍦?Network 閫夐」鍗′腑鏌ョ湅璇锋眰锛?
   - 璇锋眰 URL: `http://localhost/api/ai/dify-workflow`
   - 璇锋眰鏂规硶: POST
   - 璇锋眰浣? `{"requestType": "generate_questions", "jobTitle": "鍓嶇寮€鍙戝伐绋嬪笀"}`

### 4. 妫€鏌ュ搷搴?

鎴愬姛鐨勫搷搴旀牸寮忥細
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "session_id": "uuid-string",
    "questions": [...],
    "questions_json": "[...]"
  }
}
```

## 甯歌闂鎺掓煡

### 1. 404 Not Found
- 妫€鏌ュ悗绔湇鍔℃槸鍚﹀惎鍔?
- 妫€鏌?context-path 鏄惁涓?`/api`
- 妫€鏌ュ墠绔?Vite 浠ｇ悊閰嶇疆

### 2. 401 Unauthorized / 403 Forbidden
- 妫€鏌?Dify App ID 鏄惁姝ｇ‘
- 妫€鏌ユ槸鍚︽湁璁块棶鏉冮檺

### 3. 500 Internal Server Error
- 鏌ョ湅鍚庣鏃ュ織
- 妫€鏌?Dify Workflow URL 鏄惁姝ｇ‘
- 妫€鏌ョ綉缁滄槸鍚﹁兘璁块棶 Dify 鏈嶅姟

### 4. 瓒呮椂閿欒
- 妫€鏌ョ綉缁滆繛鎺?
- Dify 宸ヤ綔娴佹墽琛屾椂闂村彲鑳借緝闀匡紝鍓嶇宸茶缃?90 绉掕秴鏃?
- 鍚庣璁剧疆 60 绉掕秴鏃讹紝鍙牴鎹渶瑕佽皟鏁?

### 5. CORS 閿欒
- 纭繚 Vite 浠ｇ悊姝ｇ‘閰嶇疆
- 寮€鍙戠幆澧冧笅鎵€鏈?`/api` 璇锋眰閮戒細琚唬鐞嗗埌鍚庣

## 鐜閰嶇疆娓呭崟

鉁?鍚庣閰嶇疆鏂囦欢宸叉坊鍔?Dify 閰嶇疆椤?
鉁?鍚庣 context-path 宸蹭慨鏀逛负 `/api`
鉁?鍓嶇 API baseURL 閰嶇疆姝ｇ‘ (`/api`)
鉁?鍓嶇 Vite 浠ｇ悊閰嶇疆姝ｇ‘

鐜板湪鍙渶瑕侊細
1. **閰嶇疆鎮ㄧ殑 Dify 宸ヤ綔娴?URL 鍜?App ID**锛堥€氳繃鐜鍙橀噺鎴栭厤缃枃浠讹級
2. **閲嶅惎鍚庣鏈嶅姟**
3. **璁块棶鍓嶇椤甸潰娴嬭瘯**

## 鍙傝€冩枃妗?

- Test3 璇存槑鏂囨。: `D:\code7\test3\7.txt`
- 鍓嶇缁勪欢: `frontend/src/views/ai/SmartQuestionGenerator.vue`
- 鍚庣 Controller: `backend/main/java/com/interview/interview-server/controller/AiController.java`
- 鍚庣 Service: `backend/main/java/com/interview/interview-server/service/impl/AiServiceImpl.java`
- 閰嶇疆鏂囦欢: `backend/main/resources/application.yml`

