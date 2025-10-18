# Dify 宸ヤ綔娴侀泦鎴愭祴璇曟寚鍗?

## 馃帀 鎭枩锛丏ify 宸ヤ綔娴佸凡鎴愬姛闆嗘垚

浣犵殑 Dify 宸ヤ綔娴佸凡缁忔垚鍔熼泦鎴愬埌 `/interview/ai` 椤甸潰涓紒

---

## 鉁?宸插畬鎴愮殑宸ヤ綔

### 1. 鍚庣閰嶇疆 鉁?
- 鉁?閰嶇疆浜?Dify API 瀵嗛挜: `app-aROZ5FjseJWUtmRzzjlb6b5E`
- 鉁?鍒涘缓浜?`.env` 閰嶇疆鏂囦欢
- 鉁?瀹夎浜?`dotenv` 渚濊禆
- 鉁?鍦?`backend/mock-server.js` 涓坊鍔犱簡 Dify API 璋冪敤鍑芥暟
- 鉁?娣诲姞浜?`/api/ai/dify-workflow` 璺敱澶勭悊

### 2. 鍓嶇閰嶇疆 鉁?
- 鉁?鍦?`frontend/src/api/ai.js` 涓坊鍔犱簡 `callDifyWorkflow()` API
- 鉁?鏇存柊浜?`frontend/src/services/difyService.js` 閫氳繃鍚庣浠ｇ悊璋冪敤
- 鉁?鍓嶇椤甸潰 `AIInterviewSession.vue` 宸插疄鐜版櫤鑳戒笓涓氶鐩敓鎴愬姛鑳?

---

## 馃殌 鍚姩鏈嶅姟娴嬭瘯

### 姝ラ 1: 鍚姩鍚庣鏈嶅姟

```bash
cd D:\code7\interview-system\backend
node mock-server.js
```

**棰勬湡杈撳嚭:**
```
馃敡 Dify 閰嶇疆: {
  apiKey: 'app-vZlc0w...',
  baseURL: 'https://api.dify.ai/v1'
}
馃殌 Mock API鏈嶅姟鍣ㄥ凡鍚姩
馃搷 鍦板潃: http://localhost:3001
```

### 姝ラ 2: 鍚姩鍓嶇鏈嶅姟

鎵撳紑鏂扮殑鍛戒护琛岀獥鍙?

```bash
cd D:\code7\interview-system\frontend
npm run dev
```

**棰勬湡杈撳嚭:**
```
  VITE v5.x.x  ready in xxx ms

  鉃? Local:   http://localhost:5174/
  鉃? Network: use --host to expose
```

---

## 馃И 鍔熻兘娴嬭瘯

### 娴嬭瘯 1: 璁块棶闈㈣瘯椤甸潰

1. 鎵撳紑娴忚鍣ㄨ闂? **`http://localhost:5174/interview/ai`**
2. 浣犲簲璇ョ湅鍒?AI 鏅鸿兘闈㈣瘯绯荤粺鐣岄潰

### 娴嬭瘯 2: 鐢熸垚鏅鸿兘涓撲笟棰樼洰

1. 鍦ㄩ〉闈㈤《閮ㄦ壘鍒?**"馃幆 鏅鸿兘涓撲笟棰樼洰鐢熸垚"** 鍗＄墖
2. 鍦ㄤ笅鎷夋涓€夋嫨涓€涓笓涓氾紝渚嬪: **"Python鍚庣寮€鍙戝伐绋嬪笀"**
3. 閫夋嫨闅惧害绾у埆: **"涓骇"**
4. 鐐瑰嚮 **"鏅鸿兘鐢熸垚棰樼洰"** 鎸夐挳

**棰勬湡缁撴灉:**
- 鉁?鎸夐挳鏄剧ず "姝ｅ湪鐢熸垚棰樼洰..." 鍔犺浇鐘舵€?
- 鉁?鍚庣鎺у埗鍙拌緭鍑?Dify API 璋冪敤鏃ュ織
- 鉁?绾?10-30 绉掑悗杩斿洖鐢熸垚鐨勯鐩?
- 鉁?棰樼洰鏄剧ず鍦ㄥ彸渚ч潰璇曢棶棰樺崱鐗囦腑
- 鉁?棰樼洰鏍囪涓?"AI鏅鸿兘鐢熸垚"

**鍚庣鎺у埗鍙伴鏈熸棩蹇?**
```
馃攧 鏀跺埌 Dify 宸ヤ綔娴佽姹? { requestType: 'generate_questions', jobTitle: 'Python鍚庣寮€鍙戝伐绋嬪笀' }
馃摗 璋冪敤 Dify API: {
  url: 'https://api.dify.ai/v1/workflows/run',
  requestType: 'generate_questions',
  jobTitle: 'Python鍚庣寮€鍙戝伐绋嬪笀'
}
馃摜 Dify 鍝嶅簲鐘舵€? 200
鉁?Dify 宸ヤ綔娴佽皟鐢ㄦ垚鍔?
```

### 娴嬭瘯 3: 鍥炵瓟闂骞惰幏鍙栬瘎鍒?

1. 寮€鍚憚鍍忓ご
2. 鐐瑰嚮 "寮€濮嬪綍闊? 鎸夐挳
3. 璇煶鍥炵瓟鐢熸垚鐨勯棶棰?
4. 鐐瑰嚮 "鍋滄褰曢煶"
5. 鐐瑰嚮 "鍒嗘瀽鍥炵瓟" 鎸夐挳

**棰勬湡缁撴灉:**
- 鉁?绯荤粺璋冪敤 Dify 宸ヤ綔娴佽繘琛岃瘎鍒?
- 鉁?杩斿洖 AI 缁煎悎璇勪环鍜屽垎鏁?
- 鉁?鏄剧ず璇︾粏鐨勮瘎鍒嗙粨鏋?

---

## 馃攳 璋冭瘯鎶€宸?

### 鏌ョ湅鍚庣鏃ュ織

鍚庣浼氳緭鍑鸿缁嗙殑鏃ュ織淇℃伅:
- `馃敡` Dify 閰嶇疆鍔犺浇
- `馃攧` 鏀跺埌 Dify 宸ヤ綔娴佽姹?
- `馃摗` 璋冪敤 Dify API
- `馃摜` Dify 鍝嶅簲鐘舵€?
- `鉁卄 璋冪敤鎴愬姛
- `鉂宍 璋冪敤澶辫触(濡傛灉鏈夐敊璇?

### 鏌ョ湅娴忚鍣ㄦ帶鍒跺彴

鎵撳紑娴忚鍣ㄥ紑鍙戣€呭伐鍏?F12) -> Console 鏍囩:
- 鏌ョ湅鍓嶇 API 璋冪敤鏃ュ織
- 鏌ョ湅 Dify Service 鏃ュ織
- 鏌ョ湅閿欒淇℃伅

### 鏌ョ湅缃戠粶璇锋眰

鎵撳紑娴忚鍣ㄥ紑鍙戣€呭伐鍏?F12) -> Network 鏍囩:
- 鏌ユ壘 `/api/ai/dify-workflow` 璇锋眰
- 鏌ョ湅璇锋眰浣?Request Payload)
- 鏌ョ湅鍝嶅簲鏁版嵁(Response)

---

## 鉂?甯歌闂鎺掓煡

### 闂 1: "璋冪敤 Dify API 澶辫触"

**鍙兘鍘熷洜:**
- Dify API Key 鏃犳晥鎴栧凡杩囨湡
- 缃戠粶杩炴帴闂
- Dify 鏈嶅姟鍣ㄦ晠闅?

**瑙ｅ喅鏂规硶:**
1. 妫€鏌?`.env` 鏂囦欢涓殑 API Key 鏄惁姝ｇ‘
2. 娴嬭瘯缃戠粶杩炴帴: `ping api.dify.ai`
3. 璁块棶 Dify 骞冲彴妫€鏌?API Key 鐘舵€?

### 闂 2: "璇锋眰瓒呮椂"

**鍙兘鍘熷洜:**
- Dify 宸ヤ綔娴佹墽琛屾椂闂磋繃闀?>30绉?
- 缃戠粶涓嶇ǔ瀹?

**瑙ｅ喅鏂规硶:**
1. 澧炲姞瓒呮椂鏃堕棿 (鍦?backend/mock-server.js 绗?2312 琛?
2. 妫€鏌ョ綉缁滆川閲?
3. 绠€鍖?Dify 宸ヤ綔娴佹楠?

### 闂 3: "CORS 閿欒"

**鍙兘鍘熷洜:**
- 鍚庣鏈嶅姟鏈惎鍔?
- 鍓嶇 API 璋冪敤閿欒

**瑙ｅ喅鏂规硶:**
1. 纭繚鍚庣鏈嶅姟杩愯鍦?`http://localhost:3001`
2. 妫€鏌ュ墠绔?API 閰嶇疆涓殑 `baseURL`

### 闂 4: "棰樼洰杩斿洖涓虹┖"

**鍙兘鍘熷洜:**
- Dify 宸ヤ綔娴佽繑鍥炴暟鎹牸寮忎笉鍖归厤
- 瑙ｆ瀽鍑芥暟鍑洪敊

**瑙ｅ喅鏂规硶:**
1. 鏌ョ湅鍚庣鎺у埗鍙扮殑 Dify 鍝嶅簲鏁版嵁
2. 妫€鏌?`parseQuestions()` 鍑芥暟 (backend/mock-server.js 绗?2331 琛?
3. 鏍规嵁瀹為檯杩斿洖鏍煎紡璋冩暣瑙ｆ瀽閫昏緫

---

## 馃搳 娴嬭瘯鏁版嵁绀轰緥

### 鎴愬姛鐨?API 鍝嶅簲绀轰緥

**鐢熸垚棰樼洰:**
```json
{
  "code": 200,
  "message": "璋冪敤鎴愬姛",
  "data": {
    "session_id": "mock-session-1234567890",
    "generated_questions": [
      "璇蜂粙缁嶄竴涓嬩綘鍦≒ython鍚庣寮€鍙戞柟闈㈡渶鏈夋寫鎴樻€х殑涓€涓」鐩€?,
      "瀵逛簬Python鍚庣寮€鍙戣繖涓矖浣?浣犺涓烘渶閲嶈鐨勬妧鑳芥槸浠€涔堬紵",
      "璇锋弿杩颁綘濡備綍瑙ｅ喅Python鍚庣寮€鍙戝伐浣滀腑閬囧埌鐨勬妧鏈毦棰樸€?
    ],
    "metadata": {
      "workflowId": "wf-xxxxx",
      "processingTime": 15000
    }
  }
}
```

**璇勫垎绛旀:**
```json
{
  "code": 200,
  "message": "璋冪敤鎴愬姛",
  "data": {
    "comprehensive_evaluation": "鍊欓€変汉鐨勫洖绛斿睍鐜颁簡瀵筆ython鍚庣寮€鍙戠殑娣卞叆鐞嗚В...",
    "overall_score": 85,
    "metadata": {
      "workflowId": "wf-xxxxx",
      "processingTime": 8000
    }
  }
}
```

---

## 馃幆 涓嬩竴姝ヤ紭鍖栧缓璁?

1. **娣诲姞閿欒閲嶈瘯鏈哄埗**: 褰?Dify API 璋冪敤澶辫触鏃惰嚜鍔ㄩ噸璇?
2. **瀹炵幇 session_id 鎸佷箙鍖?*: 灏?session_id 淇濆瓨鍒?localStorage
3. **浼樺寲鍔犺浇浣撻獙**: 娣诲姞杩涘害鏉℃樉绀?Dify 宸ヤ綔娴佹墽琛岃繘搴?
4. **鎵归噺鐢熸垚**: 鏀寔涓€娆＄敓鎴愬閬撻鐩?
5. **鍘嗗彶璁板綍**: 淇濆瓨鐢熸垚鐨勯鐩拰璇勫垎鍘嗗彶

---

## 馃摎 鐩稿叧鏂囨。

- [瀹屾暣瀹炴柦鏂规](./DIFY-INTEGRATION-GUIDE.md)
- [Dify 瀹樻柟鏂囨。](https://docs.dify.ai/)
- [椤圭洰鏂囨。绱㈠紩](./DOCUMENTATION-INDEX.md)

---

## 鉁?鎬荤粨

浣犵殑 Dify 宸ヤ綔娴佸凡缁忔垚鍔熼泦鎴愶紒鐜板湪鍙互:

鉁?鍦?`/interview/ai` 椤甸潰杈撳叆涓撲笟鍚嶇О
鉁?璋冪敤 Dify 宸ヤ綔娴佹櫤鑳界敓鎴愰潰璇曢鐩?
鉁?璇煶鍥炵瓟闂
鉁?鑾峰彇 AI 鏅鸿兘璇勫垎

**绁濅綘浣跨敤鎰夊揩锛?* 馃殌

濡傛湁浠讳綍闂锛岃鏌ョ湅涓婇潰鐨勫父瑙侀棶棰樻帓鏌ラ儴鍒嗭紝鎴栬仈绯绘妧鏈敮鎸併€?

