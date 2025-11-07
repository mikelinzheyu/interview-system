# 馃帀 绔嬪嵆鍚姩 - Dify 宸ヤ綔娴佸凡閰嶇疆

## 鉁?閰嶇疆宸插畬鎴愶紒

鎵€鏈?Dify 宸ヤ綔娴侀厤缃凡缁忓畬鎴愶紝鐜板湪鍙渶鍚姩鏈嶅姟鍗冲彲锛?

### 馃搵 宸查厤缃殑淇℃伅

| 閰嶇疆椤?| 鍊?|
|-------|---|
| **鍏紑璁块棶 URL** | https://udify.app/workflow/ZJIwyB7UMouf2H9V |
| **API 绔偣** | https://api.dify.ai/v1/workflows/run |
| **App ID** | app-vZlc0w5Dio2gnrTkdlblcPXG |

---

## 馃殌 蹇€熷惎鍔紙2 姝ワ級

### 绗?1 姝ワ細鍚姩鍚庣鏈嶅姟

**Windows PowerShell锛堟帹鑽愶級锛?*
```powershell
.\start-with-dify.ps1
```

**Windows CMD锛?*
```cmd
start-with-dify.bat
```

**Linux/Mac锛?*
```bash
chmod +x start-with-dify.sh
./start-with-dify.sh
```

### 绗?2 姝ワ細鍚姩鍓嶇鏈嶅姟

**鏂板紑涓€涓粓绔獥鍙ｏ細**
```bash
cd frontend
npm run dev
```

---

## 馃幆 娴嬭瘯鍔熻兘

### 1. 鎵撳紑娴忚鍣?

璁块棶锛歚http://localhost:5174/interview/ai`

### 2. 杈撳叆涓撲笟

绀轰緥涓撲笟锛?
- Python鍚庣寮€鍙戝伐绋嬪笀
- 鍓嶇寮€鍙戝伐绋嬪笀
- Java寮€鍙戝伐绋嬪笀
- UI/UX璁捐甯?
- 鏁版嵁鍒嗘瀽甯?

### 3. 鐐瑰嚮鐢熸垚

鐐瑰嚮"鏅鸿兘鐢熸垚棰樼洰"鎸夐挳

### 4. 鏌ョ湅缁撴灉

- 鉁?鏄剧ず鐢熸垚杩涘害
- 鉁?鐢熸垚 5 閬撻潰璇曢
- 鉁?姣忛閮芥湁鏍囧噯绛旀
- 鉁?鏄剧ず session ID

---

## 鉁?楠岃瘉鏄惁鎴愬姛

###鍚庣鍚姩鎴愬姛鏍囧織锛?

```
========================================
 姝ｅ湪鍚姩 Spring Boot 搴旂敤...
========================================

鎻愮ず锛?
 - 鍚庣鏈嶅姟鍦板潃: http://localhost:8080/api
 - 鏃ュ織绾у埆: DEBUG

[INFO] --- spring-boot:3.x.x:run ---
...
Started InterviewSystemApplication in X.xxx seconds
```

### API 璋冪敤鎴愬姛鏍囧織锛?

鍦ㄥ悗绔棩蹇椾腑鎼滅储锛?
```
Calling Dify workflow with params
Dify workflow response status: 200
```

### 鍓嶇鐢熸垚鎴愬姛鏍囧織锛?

娴忚鍣ㄩ〉闈㈡樉绀猴細
- 鉁?鐢熸垚杩涘害鏉★紙10% 鈫?50% 鈫?70% 鈫?100%锛?
- 鉁?5 閬撻潰璇曢鐩?
- 鉁?姣忛亾棰橀兘鏈夋爣鍑嗙瓟妗?
- 鉁?Session ID锛堝彲灞曞紑鏌ョ湅锛?

---

## 馃攳 濡傛灉閬囧埌闂

### 闂 1锛?04 Not Found

**妫€鏌ワ細**
- 鍚庣鏈嶅姟鏄惁宸插惎鍔紵
- 鏌ョ湅鎺у埗鍙版槸鍚︽湁閿欒淇℃伅

**瑙ｅ喅锛?*
```bash
# 閲嶅惎鍚庣鏈嶅姟
.\start-with-dify.ps1
```

### 闂 2锛?01 Unauthorized

**鍘熷洜锛?* App ID 涓嶆纭?

**瑙ｅ喅锛?*
閰嶇疆宸茬粡姝ｇ‘璁剧疆锛屽鏋滀粛鏈夐棶棰橈紝璇锋鏌?Dify 鎺у埗鍙颁腑鐨?App ID 鏄惁鏈夊彉鍖栥€?

### 闂 3锛氳秴鏃堕敊璇?

**妫€鏌ワ細**
- 缃戠粶杩炴帴鏄惁姝ｅ父锛?
- 鑳藉惁璁块棶 https://api.dify.ai/v1锛?

**瑙ｅ喅锛?*
```bash
# 娴嬭瘯缃戠粶杩炴帴
curl https://api.dify.ai/v1
```

### 闂 4锛欽ava 鎴?Maven 鏈畨瑁?

**瑙ｅ喅锛?*
1. 瀹夎 JDK 17 鎴栨洿楂樼増鏈?
2. 瀹夎 Apache Maven
3. 閰嶇疆鐜鍙橀噺
4. 閲嶆柊杩愯鍚姩鑴氭湰

---

## 馃摑 瀹屾暣鐨勮姹傛祦绋?

```
鐢ㄦ埛杈撳叆锛歅ython鍚庣寮€鍙戝伐绋嬪笀
    鈫?
鍓嶇鍙戦€侊細POST /api/ai/dify-workflow
    {
      "requestType": "generate_questions",
      "jobTitle": "Python鍚庣寮€鍙戝伐绋嬪笀"
    }
    鈫?
Vite 浠ｇ悊锛歨ttp://localhost:8080/api/ai/dify-workflow
    鈫?
鍚庣鎺ユ敹锛欰iController (@RequestMapping("/ai"))
    鈫?
璋冪敤鏈嶅姟锛欰iServiceImpl.callDifyWorkflow()
    鈫?
HTTP 璇锋眰锛歅OST https://api.dify.ai/v1/workflows/run
    Headers:
      - Authorization: Bearer app-vZlc0w5Dio2gnrTkdlblcPXG
      - Content-Type: application/json
    Body:
      {
        "inputs": {
          "job_title": "Python鍚庣寮€鍙戝伐绋嬪笀"
        },
        "response_mode": "blocking",
        "user": "user-xxxxx"
      }
    鈫?
Dify 澶勭悊锛?
  1. 鎼滅储鑱屼綅瑕佹眰
  2. 鐢熸垚 5 閬撻潰璇曢
  3. 涓烘瘡棰樼敓鎴愭爣鍑嗙瓟妗堬紙RAG锛?
    鈫?
Dify 杩斿洖锛?
    {
      "data": {
        "outputs": {
          "session_id": "uuid-string",
          "questions": [...],
          "questions_json": "[...]"
        }
      }
    }
    鈫?
鍚庣瑙ｆ瀽骞惰繑鍥炵粰鍓嶇
    鈫?
鍓嶇灞曠ず缁撴灉 鉁?
```

---

## 馃摎 鐩稿叧鏂囨。

| 鏂囨。 | 璇存槑 |
|-----|------|
| **START_NOW.md** | 馃憟 褰撳墠鏂囨。锛堝揩閫熷惎鍔級 |
| **QUICK_START_DIFY.md** | 3姝ュ揩閫熷惎鍔ㄦ寚鍗?|
| **DIFY_CONFIG.md** | 璇︾粏閰嶇疆璇存槑 |
| **DIFY_INTEGRATION_GUIDE.md** | 瀹屾暣鎶€鏈泦鎴愭寚鍗?|

---

## 馃幆 宸蹭慨澶嶇殑闂

### 1. 鉁?鍚庣閰嶇疆瀹屾垚
- 宸叉坊鍔?Dify workflow-url 鍜?app-id
- 榛樿鍊煎凡璁剧疆涓烘偍鐨勫疄闄呴厤缃?

### 2. 鉁?API 璺緞宸茬粺涓€
- Context-path 浠?`/api/v1` 淇敼涓?`/api`
- 鍓嶇鍜屽悗绔矾寰勫畬鍏ㄥ尮閰?

### 3. 鉁?鍚姩鑴氭湰宸查厤缃?
- 3 涓惎鍔ㄨ剼鏈紙.bat / .ps1 / .sh锛?
- 鑷姩鍔犺浇 Dify 鐜鍙橀噺
- 鑷姩妫€娴?Java 鍜?Maven

### 4. 鉁?鐜鍙橀噺宸茶缃?
- DIFY_WORKFLOW_URL=https://api.dify.ai/v1/workflows/run
- DIFY_APP_ID=app-vZlc0w5Dio2gnrTkdlblcPXG

---

## 馃挕 鎻愮ず

1. **棣栨鍚姩**锛氬悗绔涓€娆″惎鍔ㄥ彲鑳介渶瑕佷笅杞戒緷璧栵紝璇疯€愬績绛夊緟
2. **绔彛鍗犵敤**锛氱‘淇?8080 鍜?5174 绔彛鏈鍗犵敤
3. **鏁版嵁搴?*锛氱‘淇?MySQL 鍜?Redis 鏈嶅姟宸插惎鍔?
4. **缃戠粶**锛氱‘淇濊兘璁块棶 api.dify.ai

---

## 馃帄 鍑嗗灏辩华锛?

**鐜板湪鍙渶杩愯鍚姩鑴氭湰锛屼竴鍒囬兘宸查厤缃畬鎴愶紒**

```powershell
# Windows PowerShell
.\start-with-dify.ps1
```

```bash
# 鏂扮粓绔獥鍙?
cd frontend && npm run dev
```

**鐒跺悗璁块棶锛?* `http://localhost:5174/interview/ai`

**寮€濮嬬敓鎴愭偍鐨勭涓€涓?AI 闈㈣瘯棰橈紒** 馃帀

