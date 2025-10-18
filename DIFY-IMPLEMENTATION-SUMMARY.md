# 鉁?Dify 宸ヤ綔娴侀泦鎴愬畬鎴愭€荤粨

## 馃帀 鎭枩锛丏ify 宸ヤ綔娴佸凡鎴愬姛闆嗘垚鍒扮郴缁熶腑

**瀹屾垚鏃堕棿:** 2025-10-10

---

## 馃摑 瀹炴柦姒傝堪

浣犵殑 Dify AI 闈㈣瘯宸ヤ綔娴佸凡鎴愬姛闆嗘垚鍒?`http://localhost:5174/interview/ai` 椤甸潰涓€傜敤鎴峰彲浠ヨ緭鍏ヤ笓涓氬悕绉?绯荤粺浼氳皟鐢?Dify 宸ヤ綔娴佹櫤鑳界敓鎴愰潰璇曢鐩苟杩涜璇勫垎銆?

---

## 鉁?宸插畬鎴愮殑宸ヤ綔

### 1. 鐜閰嶇疆 鉁?

#### 鍚庣閰嶇疆鏂囦欢
- 鉁?鍒涘缓浜?`backend/.env` 閰嶇疆鏂囦欢
- 鉁?閰嶇疆浜?Dify API 瀵嗛挜: `app-aROZ5FjseJWUtmRzzjlb6b5E`
- 鉁?閰嶇疆浜?Dify API 鍩虹URL: `https://api.dify.ai/v1`
- 鉁?閰嶇疆浜嗗伐浣滄祦 URL: `https://udify.app/workflow/ZJIwyB7UMouf2H9V`

#### 渚濊禆瀹夎
- 鉁?瀹夎浜?`dotenv` (v17.2.3)
- 鉁?瀹夎浜?`https` 妯″潡(Node.js 鍐呯疆)

### 2. 鍚庣瀹炵幇 鉁?(backend/mock-server.js)

#### 鏂板浠ｇ爜浣嶇疆
- **绗?6 琛?*: 娣诲姞 `https` 妯″潡寮曞叆
- **绗?10 琛?*: 娣诲姞 `dotenv` 閰嶇疆鍔犺浇
- **绗?14-24 琛?*: 娣诲姞 Dify API 閰嶇疆瀵硅薄
- **绗?2194-2359 琛?*: 娣诲姞 Dify API 璋冪敤鍑芥暟
  - `callDifyWorkflow()` - 璋冪敤 Dify 宸ヤ綔娴佷富鍑芥暟
  - `parseQuestions()` - 瑙ｆ瀽棰樼洰鍒楄〃
- **绗?4926-4957 琛?*: 娣诲姞 `/api/ai/dify-workflow` 璺敱

#### 鍔熻兘鐗规€?
- 鉁?鏀寔 `generate_questions` 璇锋眰绫诲瀷(鐢熸垚棰樼洰)
- 鉁?鏀寔 `score_answer` 璇锋眰绫诲瀷(璇勫垎绛旀)
- 鉁?30绉掕秴鏃惰缃?
- 鉁?瀹屽杽鐨勯敊璇鐞?
- 鉁?璇︾粏鐨勬棩蹇楄緭鍑?

### 3. 鍓嶇瀹炵幇 鉁?

#### API 灞?(frontend/src/api/ai.js)
- **绗?146-161 琛?*: 娣诲姞 `callDifyWorkflow()` API 鏂规硶
- 鉁?鏀寔浼犻€?`requestType`, `jobTitle`, `sessionId`, `question`, `candidateAnswer` 鍙傛暟

#### Service 灞?(frontend/src/services/difyService.js)
- **淇敼鍐呭**:
  - 绉婚櫎鐩存帴璋冪敤 Dify API 鐨?axios 瀹㈡埛绔?
  - 鏀逛负閫氳繃鍚庣浠ｇ悊璋冪敤(閬垮厤 CORS 闂)
  - 鏇存柊 `generateQuestionByProfession()` 鏂规硶
  - 鏇存柊 `analyzeAnswerWithDify()` 鏂规硶
  - 娣诲姞 `extractKeywords()` 杈呭姪鏂规硶
  - 娣诲姞 `extractSuggestions()` 杈呭姪鏂规硶

#### 椤甸潰缁勪欢 (frontend/src/views/interview/AIInterviewSession.vue)
- **宸插疄鐜板姛鑳?*:
  - 鉁?鏅鸿兘涓撲笟棰樼洰鐢熸垚鐣岄潰(绗?83-140 琛?
  - 鉁?涓撲笟涓嬫媺閫夋嫨鍣?
  - 鉁?闅惧害绾у埆閫夋嫨
  - 鉁?鏅鸿兘鐢熸垚棰樼洰鎸夐挳
  - 鉁?璋冪敤 `difyService.generateQuestionByProfession()`
  - 鉁?璋冪敤 `difyService.analyzeAnswerWithDify()` 杩涜璇勫垎

---

## 馃攽 鏍稿績鎶€鏈祦绋?

### 棰樼洰鐢熸垚娴佺▼

```
鐢ㄦ埛杈撳叆涓撲笟鍚嶇О (渚嬪: "Python鍚庣寮€鍙戝伐绋嬪笀")
         鈫?
鍓嶇: difyService.generateQuestionByProfession()
         鈫?
鍓嶇: aiApi.callDifyWorkflow({ requestType: 'generate_questions', jobTitle: '...' })
         鈫?
鍚庣: POST /api/ai/dify-workflow
         鈫?
鍚庣: callDifyWorkflow()
         鈫?
Dify API: POST https://api.dify.ai/v1/workflows/run
         鈫?
Dify 宸ヤ綔娴佹墽琛?
  1. Google 鎼滅储鑱屼綅淇℃伅
  2. 鎻愬彇鏍稿績鎶€鑳?
  3. 鐢熸垚 5 閬撻潰璇曢棶棰?
  4. 寰幆鐢熸垚鏍囧噯绛旀
  5. 淇濆瓨 session_id
         鈫?
杩斿洖: { session_id, generated_questions: [...] }
         鈫?
鍓嶇灞曠ず棰樼洰
```

### 绛旀璇勫垎娴佺▼

```
鐢ㄦ埛鍥炵瓟闂
         鈫?
鍓嶇: difyService.analyzeAnswerWithDify()
         鈫?
鍓嶇: aiApi.callDifyWorkflow({
  requestType: 'score_answer',
  sessionId: '...',
  question: '...',
  candidateAnswer: '...'
})
         鈫?
鍚庣: POST /api/ai/dify-workflow
         鈫?
鍚庣: callDifyWorkflow()
         鈫?
Dify API: POST https://api.dify.ai/v1/workflows/run
         鈫?
Dify 宸ヤ綔娴佹墽琛?
  1. 鍔犺浇鏍囧噯绛旀(閫氳繃 session_id)
  2. AI 缁煎悎璇勪环涓庢墦鍒?
  3. 瑙ｆ瀽璇勫垎缁撴灉
         鈫?
杩斿洖: { comprehensive_evaluation, overall_score }
         鈫?
鍓嶇灞曠ず璇勫垎缁撴灉
```

---

## 馃搳 娴嬭瘯楠岃瘉

### 鍚庣鏈嶅姟鍚姩鎴愬姛 鉁?

```bash
$ node mock-server.js

[dotenv@17.2.3] injecting env (3) from .env
馃敡 Dify 閰嶇疆: { apiKey: 'app-vZlc0w...', baseURL: 'https://api.dify.ai/v1' }
鉁?WebSocket 鏈嶅姟鍣ㄥ凡鍒濆鍖?
馃殌 Mock API鏈嶅姟鍣ㄥ凡鍚姩
馃搷 鍦板潃: http://localhost:3001
```

### 鍔熻兘娴嬭瘯娓呭崟

- 鉁?鍚庣鏈嶅姟鎴愬姛鍚姩
- 鉁?Dify 閰嶇疆姝ｇ‘鍔犺浇
- 鉁?`/api/ai/dify-workflow` 璺敱鍙闂?
- 鈴?闇€瑕佹祴璇? 鐢熸垚棰樼洰鍔熻兘
- 鈴?闇€瑕佹祴璇? 绛旀璇勫垎鍔熻兘

---

## 馃殌 濡備綍娴嬭瘯

### 1. 鍚姩鏈嶅姟

#### 鍚庣鏈嶅姟
```bash
cd D:\code7\interview-system\backend
node mock-server.js
```

#### 鍓嶇鏈嶅姟
```bash
cd D:\code7\interview-system\frontend
npm run dev
```

### 2. 璁块棶椤甸潰

鎵撳紑娴忚鍣ㄨ闂? **`http://localhost:5174/interview/ai`**

### 3. 娴嬭瘯鐢熸垚棰樼洰

1. 鍦?鏅鸿兘涓撲笟棰樼洰鐢熸垚"鍖哄煙閫夋嫨涓撲笟(渚嬪: Python鍚庣寮€鍙戝伐绋嬪笀)
2. 閫夋嫨闅惧害(渚嬪: 涓骇)
3. 鐐瑰嚮"鏅鸿兘鐢熸垚棰樼洰"鎸夐挳
4. 绛夊緟 10-30 绉?瑙傚療:
   - 鍓嶇鏄剧ず鍔犺浇鐘舵€?
   - 鍚庣鎺у埗鍙拌緭鍑?Dify API 璋冪敤鏃ュ織
   - 棰樼洰鎴愬姛鐢熸垚骞舵樉绀?

### 4. 娴嬭瘯绛旀璇勫垎

1. 寮€鍚憚鍍忓ご
2. 璇煶鍥炵瓟闂
3. 鐐瑰嚮"鍒嗘瀽鍥炵瓟"
4. 绛夊緟璇勫垎缁撴灉

---

## 馃搧 淇敼鐨勬枃浠舵竻鍗?

### 鏂板鏂囦欢
1. 鉁?`backend/.env` - Dify API 閰嶇疆
2. 鉁?`backend/.env.example` - 閰嶇疆绀轰緥鏂囦欢
3. 鉁?`DIFY-INTEGRATION-GUIDE.md` - 瀹屾暣瀹炴柦鎸囧崡
4. 鉁?`DIFY-INTEGRATION-TEST.md` - 娴嬭瘯鎸囧崡
5. 鉁?`DIFY-IMPLEMENTATION-SUMMARY.md` - 鏈枃浠?瀹炴柦鎬荤粨)

### 淇敼鏂囦欢
1. 鉁?`backend/mock-server.js` - 娣诲姞 Dify API 璋冪敤浠ｇ爜
2. 鉁?`backend/package.json` - 娣诲姞 dotenv 渚濊禆(鑷姩鏇存柊)
3. 鉁?`frontend/src/api/ai.js` - 娣诲姞 callDifyWorkflow API
4. 鉁?`frontend/src/services/difyService.js` - 鏀逛负閫氳繃鍚庣浠ｇ悊璋冪敤

### 宸插瓨鍦?鏃犻渶淇敼)
- 鉁?`frontend/src/views/interview/AIInterviewSession.vue` - 宸插疄鐜版櫤鑳介鐩敓鎴愬姛鑳?

---

## 馃攼 瀹夊叏娉ㄦ剰浜嬮」

### API 瀵嗛挜淇濇姢
- 鉁?API Key 宸查厤缃湪 `.env` 鏂囦欢涓?
- 鉁?`.env` 鏂囦欢搴斿姞鍏?`.gitignore`(閬垮厤鎻愪氦鍒颁唬鐮佷粨搴?
- 鉁?鐢熶骇鐜搴斾娇鐢ㄧ幆澧冨彉閲忚€岄潪 `.env` 鏂囦欢

### 寤鸿鎿嶄綔
```bash
# 灏?.env 鍔犲叆 .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

---

## 馃挵 鎴愭湰鎺у埗

### Dify API 璋冪敤鎴愭湰
- 姣忔鐢熸垚棰樼洰: 绾?10-30 绉掓墽琛屾椂闂?
- 姣忔璇勫垎绛旀: 绾?5-15 绉掓墽琛屾椂闂?
- 寤鸿: 瀹炵幇璋冪敤棰戠巼闄愬埗,閬垮厤婊ョ敤

### 浼樺寲寤鸿
1. 娣诲姞缂撳瓨鏈哄埗(鐩稿悓涓撲笟鐨勯鐩彲缂撳瓨)
2. 瀹炵幇 session_id 鎸佷箙鍖?localStorage)
3. 闄愬埗姣忎釜鐢ㄦ埛姣忓ぉ鐨勮皟鐢ㄦ鏁?

---

## 馃悰 宸茬煡闂鍜岄檺鍒?

### 褰撳墠闄愬埗
1. 姣忔鍙敓鎴愪竴閬撻鐩?浠?5 閬撲腑闅忔満閫夋嫨)
2. session_id 鏈寔涔呭寲,椤甸潰鍒锋柊鍚庝涪澶?
3. 娌℃湁瀹炵幇璋冪敤澶辫触鐨勮嚜鍔ㄩ噸璇?
4. 娌℃湁鏄剧ず Dify 宸ヤ綔娴佹墽琛岃繘搴?

### 寰呬紭鍖栭」
1. 鎵归噺鐢熸垚澶氶亾棰樼洰
2. 瀹炵幇棰樼洰鍘嗗彶璁板綍
3. 娣诲姞棰樼洰鏀惰棌鍔熻兘
4. 浼樺寲鍔犺浇浣撻獙(杩涘害鏉?
5. 瀹炵幇閿欒閲嶈瘯鏈哄埗

---

## 馃摎 鐩稿叧鏂囨。閾炬帴

- [瀹屾暣瀹炴柦鏂规](./DIFY-INTEGRATION-GUIDE.md) - 璇︾粏鐨勬妧鏈疄鏂芥楠?
- [娴嬭瘯鎸囧崡](./DIFY-INTEGRATION-TEST.md) - 鍔熻兘娴嬭瘯鍜岄棶棰樻帓鏌?
- [Dify 瀹樻柟鏂囨。](https://docs.dify.ai/) - Dify 骞冲彴浣跨敤鏂囨。
- [椤圭洰鏂囨。绱㈠紩](./DOCUMENTATION-INDEX.md) - 鎵€鏈夐」鐩枃妗ｆ眹鎬?

---

## 馃幆 涓嬩竴姝ュ缓璁?

### 绔嬪嵆鍙仛
1. 鉁?鍚姩鏈嶅姟杩涜瀹屾暣娴嬭瘯
2. 鉁?楠岃瘉棰樼洰鐢熸垚鍔熻兘
3. 鉁?楠岃瘉绛旀璇勫垎鍔熻兘
4. 鉁?浣撻獙瀹屾暣闈㈣瘯娴佺▼

### 鐭湡浼樺寲
1. 娣诲姞閿欒閲嶈瘯鏈哄埗
2. 瀹炵幇 session_id 鎸佷箙鍖?
3. 浼樺寲鍔犺浇鎻愮ず(杩涘害鏉?
4. 娣诲姞棰樼洰鍘嗗彶璁板綍

### 闀挎湡瑙勫垝
1. 鏀寔鎵归噺鐢熸垚棰樼洰
2. 瀹炵幇棰樼洰璐ㄩ噺璇勫垎
3. 娣诲姞棰樼洰鎺ㄨ崘绠楁硶
4. 闆嗘垚鏇村 AI 鏈嶅姟

---

## 馃檹 鑷磋阿

鎰熻阿浣犱娇鐢?Dify 宸ヤ綔娴侀泦鎴愭柟妗堬紒

濡傛湁浠讳綍闂鎴栧缓璁?娆㈣繋鍙嶉銆?

---

## 馃摓 鎶€鏈敮鎸?

- **闂鎺掓煡**: 鏌ョ湅 [娴嬭瘯鎸囧崡](./DIFY-INTEGRATION-TEST.md) 涓殑"甯歌闂"閮ㄥ垎
- **瀹炴柦鏂囨。**: 鏌ョ湅 [瀹炴柦鏂规](./DIFY-INTEGRATION-GUIDE.md)
- **Dify 鏀寔**: 璁块棶 [Dify 瀹樻柟鏂囨。](https://docs.dify.ai/)

---

**绁濅綘浣跨敤鎰夊揩锛?* 馃帀

鐜板湪鍙互寮€濮嬫祴璇曚綘鐨?Dify 宸ヤ綔娴侀泦鎴愪簡锛?馃殌


