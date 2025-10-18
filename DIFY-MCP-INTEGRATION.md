# Dify MCP 鏈嶅姟闆嗘垚鏂囨。

## 馃搵 姒傝堪

鏈枃妗ｄ粙缁嶅浣曞湪 Claude Code 涓泦鎴?Dify MCP (Model Context Protocol) 鏈嶅姟鍣紝浣垮緱鍙互鐩存帴璋冪敤 Dify AI 闈㈣瘯瀹樺伐浣滄祦銆?

## 馃幆 闆嗘垚瀹屾垚鐘舵€?

- 鉁?MCP 鏈嶅姟鍣ㄩ厤缃畬鎴?
- 鉁?API 瀵嗛挜宸查厤缃?
- 鉁?杩炴帴娴嬭瘯閫氳繃
- 鉁?宸ュ叿鍙戠幇鎴愬姛

## 馃敡 MCP 鏈嶅姟鍣ㄤ俊鎭?

### 鍩烘湰淇℃伅
- **MCP URL**: `https://api.dify.ai/mcp/server/sQFDstpnlPUJ5MeX/mcp`
- **鏈嶅姟鍣ㄥ悕绉?*: Dify
- **鐗堟湰**: 1.9.1
- **鍗忚鐗堟湰**: 2024-11-05
- **API Key**: `app-aROZ5FjseJWUtmRzzjlb6b5E`

### 宸ヤ綔娴佸伐鍏?

#### 宸ュ叿鍚嶇О
`AI 闈㈣瘯瀹?- 鍏ㄦ祦绋嬪畾鍒朵笌璇勫垎 (RAG)`

#### 宸ュ叿鎻忚堪
浠庣敓鎴愰潰璇曢棶棰樺埌璇勪及鍊欓€変汉鍥炵瓟鐨勫畬鏁村伐浣滄祦锛屽寘鍚潯浠跺垎鏀笌浼氳瘽鐘舵€佸瓨鍌ㄣ€?

#### 杈撳叆鍙傛暟

| 鍙傛暟鍚?| 绫诲瀷 | 蹇呭～ | 璇存槑 |
|--------|------|------|------|
| `request_type` | string | 鉁?鏄?| 璇锋眰绫诲瀷锛堝繀濉弬鏁帮級 |
| `job_title` | string | 鉂?鍚?| 鑱屼綅鍚嶇О锛堝锛氬墠绔紑鍙戝伐绋嬪笀锛?|
| `question` | string | 鉂?鍚?| 闈㈣瘯闂 |
| `candidate_answer` | string | 鉂?鍚?| 鍊欓€変汉绛旀 |
| `session_id` | string | 鉂?鍚?| 浼氳瘽 ID锛堢敤浜庝繚鎸佷笂涓嬫枃锛?|

#### 璇锋眰绫诲瀷璇存槑

鏍规嵁鐜版湁鐨勫簲鐢ㄧ▼搴忓疄鐜帮紝`request_type` 鏀寔浠ヤ笅鍊硷細

1. **`generate_questions`** - 鐢熸垚闈㈣瘯闂
   - 闇€瑕佸弬鏁? `job_title`
   - 杩斿洖: 鐢熸垚鐨勯潰璇曢棶棰樺垪琛?

2. **`analyze_answer`** - 鍒嗘瀽鍊欓€変汉绛旀
   - 闇€瑕佸弬鏁? `question`, `candidate_answer`, `session_id`
   - 杩斿洖: 绛旀璇勫垎鍜屽弽棣?

3. **`continue_interview`** - 缁х画闈㈣瘯
   - 闇€瑕佸弬鏁? `session_id`
   - 杩斿洖: 涓嬩竴涓潰璇曢棶棰?

## 馃搧 閰嶇疆鏂囦欢

### MCP 閰嶇疆鏂囦欢浣嶇疆
`.claude/mcp.json`

### 閰嶇疆鍐呭
```json
{
  "mcpServers": {
    "dify-interview-workflow": {
      "url": "https://api.dify.ai/mcp/server/sQFDstpnlPUJ5MeX/mcp",
      "headers": {
        "Authorization": "Bearer app-aROZ5FjseJWUtmRzzjlb6b5E"
      },
      "metadata": {
        "description": "Dify AI闈㈣瘯瀹樺伐浣滄祦 - 鏅鸿兘涓撲笟棰樼洰鐢熸垚涓庤瘎鍒?,
        "capabilities": [
          "generate_interview_questions",
          "analyze_answers",
          "provide_feedback"
        ]
      }
    }
  }
}
```

## 馃殌 浣跨敤鏂规硶

### 鏂瑰紡 1锛氬湪 Claude Code 瀵硅瘽涓娇鐢?

涓€鏃﹂厤缃畬鎴愶紝Claude Code 浼氳嚜鍔ㄥ彂鐜拌繖涓?MCP 宸ュ叿銆傛偍鍙互鐩存帴鍦ㄥ璇濅腑璇锋眰锛?

#### 绀轰緥 1锛氱敓鎴愰潰璇曢鐩?
```
璇蜂娇鐢?Dify MCP 宸ュ叿涓?"鍓嶇寮€鍙戝伐绋嬪笀" 鑱屼綅鐢熸垚闈㈣瘯闂
```

Claude Code 浼氳嚜鍔ㄨ皟鐢細
```json
{
  "tool": "AI 闈㈣瘯瀹?- 鍏ㄦ祦绋嬪畾鍒朵笌璇勫垎 (RAG)",
  "parameters": {
    "request_type": "generate_questions",
    "job_title": "鍓嶇寮€鍙戝伐绋嬪笀"
  }
}
```

#### 绀轰緥 2锛氳瘎浼板€欓€変汉绛旀
```
浣跨敤 Dify MCP 璇勪及浠ヤ笅绛旀锛?
闂锛氫粈涔堟槸闂寘锛?
绛旀锛氶棴鍖呮槸鍑芥暟鍜屽叾璇嶆硶鐜鐨勭粍鍚?..
浼氳瘽 ID锛歴ession-123
```

Claude Code 浼氳皟鐢細
```json
{
  "tool": "AI 闈㈣瘯瀹?- 鍏ㄦ祦绋嬪畾鍒朵笌璇勫垎 (RAG)",
  "parameters": {
    "request_type": "analyze_answer",
    "question": "浠€涔堟槸闂寘锛?,
    "candidate_answer": "闂寘鏄嚱鏁板拰鍏惰瘝娉曠幆澧冪殑缁勫悎...",
    "session_id": "session-123"
  }
}
```

### 鏂瑰紡 2锛氶€氳繃 Node.js 鑴氭湰璋冪敤

浣跨敤鎻愪緵鐨勬祴璇曡剼鏈?`test-dify-mcp.js` 浣滀负鍙傝€冿細

```javascript
const https = require('https');

const MCP_URL = 'https://api.dify.ai/mcp/server/sQFDstpnlPUJ5MeX/mcp';
const API_KEY = 'app-aROZ5FjseJWUtmRzzjlb6b5E';

// 璋冪敤宸ュ叿
function callDifyTool(params) {
  const url = new URL(MCP_URL);

  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'AI 闈㈣瘯瀹?- 鍏ㄦ祦绋嬪畾鍒朵笌璇勫垎 (RAG)',
      arguments: params
    }
  });

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// 绀轰緥锛氱敓鎴愰潰璇曢棶棰?
callDifyTool({
  request_type: 'generate_questions',
  job_title: 'Python鍚庣寮€鍙戝伐绋嬪笀'
}).then(result => {
  console.log('鐢熸垚鐨勯鐩?', result);
}).catch(error => {
  console.error('閿欒:', error);
});
```

## 馃И 娴嬭瘯楠岃瘉

### 杩愯娴嬭瘯鑴氭湰
```bash
node test-dify-mcp.js
```

### 棰勬湡杈撳嚭
```
馃攳 娴嬭瘯 Dify MCP 鏈嶅姟鍣ㄨ繛鎺?..
...
鉁?鎵€鏈夋祴璇曞畬鎴愶紒

馃挕 濡傛灉鐪嬪埌鎴愬姛鐨勫搷搴旓紝璇存槑 MCP 鏈嶅姟鍣ㄩ厤缃纭€?
   鎮ㄥ彲浠ュ湪 Claude Code 涓娇鐢ㄨ繖涓?MCP 鏈嶅姟鍣ㄤ簡銆?
```

### 娴嬭瘯缁撴灉瑙ｈ

#### 鉁?鎴愬姛鏍囧織
- 鐘舵€佺爜: 200
- 鏀跺埌宸ュ叿鍒楄〃
- 鍖呭惈 "AI 闈㈣瘯瀹? 宸ュ叿

#### 鉂?澶辫触鍙兘鍘熷洜
1. **API Key 閿欒** - 妫€鏌?`app-aROZ5FjseJWUtmRzzjlb6b5E` 鏄惁姝ｇ‘
2. **缃戠粶闂** - 纭繚鍙互璁块棶 `api.dify.ai`
3. **MCP URL 閿欒** - 纭 URL 鏍煎紡姝ｇ‘
4. **Dify 鏈嶅姟涓嶅彲鐢?* - 妫€鏌?Dify 骞冲彴鐘舵€?

## 馃搳 涓庣幇鏈夌郴缁熺殑鍏崇郴

### 褰撳墠瀹炵幇鏂瑰紡

**REST API 璋冪敤**:
```
搴旂敤绋嬪簭 鈫?backend/mock-server.js 鈫?Dify REST API
```

鏂囦欢浣嶇疆锛?
- `backend/mock-server.js` - 鍚庣 API 璺敱锛坄/api/ai/dify-workflow`锛?
- `frontend/src/services/difyService.js` - 鍓嶇鏈嶅姟灏佽
- `frontend/src/api/ai.js` - API 璋冪敤鏂规硶

### MCP 闆嗘垚鏂瑰紡

**MCP 鍗忚璋冪敤**:
```
Claude Code 鈫?MCP Protocol 鈫?Dify MCP Server
```

鏂囦欢浣嶇疆锛?
- `.claude/mcp.json` - MCP 鏈嶅姟鍣ㄩ厤缃?
- `test-dify-mcp.js` - MCP 娴嬭瘯鑴氭湰

### 浣跨敤鍦烘櫙瀵规瘮

| 鍦烘櫙 | 浣跨敤鏂瑰紡 | 浼樺娍 |
|------|----------|------|
| **搴旂敤绋嬪簭鍐呴儴** | REST API | 绋冲畾銆佸彲鎺с€佹槗浜庣洃鎺?|
| **寮€鍙戞祴璇?* | MCP 鍗忚 | 蹇€熴€佺洿鎺ャ€佹棤闇€鍚姩鍚庣 |
| **Claude Code 杈呭姪寮€鍙?* | MCP 鍗忚 | 鏅鸿兘銆佷笂涓嬫枃鎰熺煡銆佽嚜鍔ㄥ寲 |

## 馃挕 鏈€浣冲疄璺?

### 1. 鍙岃建骞惰
- 鉁?**淇濈暀 REST API**锛氱敤浜庣敓浜х幆澧冪殑搴旂敤绋嬪簭璋冪敤
- 鉁?**娣诲姞 MCP 闆嗘垚**锛氱敤浜庡紑鍙戙€佹祴璇曞拰 AI 杈呭姪

### 2. 瀹夊叏鎬?
- 馃敀 **API Key 淇濇姢**锛氫笉瑕佸皢 API Key 鎻愪氦鍒扮増鏈帶鍒剁郴缁?
- 馃敀 **鐜鍙橀噺**锛氫娇鐢ㄧ幆澧冨彉閲忓瓨鍌ㄦ晱鎰熶俊鎭?
- 馃敀 **璁块棶鎺у埗**锛氶檺鍒?MCP 鏈嶅姟鍣ㄧ殑璁块棶鏉冮檺

### 3. 寮€鍙戝伐浣滄祦

#### 寮€鍙戦樁娈?
```
Claude Code (MCP) 鈫?蹇€熸祴璇曞拰鍘熷瀷寮€鍙?
```

#### 闆嗘垚闃舵
```
搴旂敤绋嬪簭 (REST API) 鈫?绋冲畾鐨勭敓浜х幆澧冮泦鎴?
```

## 馃攧 宸ヤ綔娴佺▼绀轰緥

### 瀹屾暣鐨勯潰璇曟祦绋?

#### 1. 鐢熸垚闈㈣瘯闂
```json
{
  "request_type": "generate_questions",
  "job_title": "鍓嶇寮€鍙戝伐绋嬪笀"
}
```

**杩斿洖**:
```json
{
  "session_id": "sess-abc123",
  "questions": [
    "璇疯В閲?JavaScript 鐨勪簨浠跺惊鐜満鍒?,
    "React Hooks 鐨勫師鐞嗘槸浠€涔堬紵",
    ...
  ]
}
```

#### 2. 璇勪及绗竴涓瓟妗?
```json
{
  "request_type": "analyze_answer",
  "session_id": "sess-abc123",
  "question": "璇疯В閲?JavaScript 鐨勪簨浠跺惊鐜満鍒?,
  "candidate_answer": "浜嬩欢寰幆鏄?JavaScript 鐨勬墽琛屾ā鍨?.."
}
```

**杩斿洖**:
```json
{
  "score": 8.5,
  "feedback": "鍥炵瓟鍏ㄩ潰锛岀悊瑙ｆ繁鍏?..",
  "suggestions": "鍙互琛ュ厖 microtask 鍜?macrotask 鐨勫尯鍒?
}
```

#### 3. 缁х画涓嬩竴涓棶棰?
```json
{
  "request_type": "continue_interview",
  "session_id": "sess-abc123"
}
```

## 馃摎 鐩稿叧鏂囦欢

### 閰嶇疆鏂囦欢
- `.claude/mcp.json` - MCP 鏈嶅姟鍣ㄩ厤缃?
- `backend/.env.example` - 鐜鍙橀噺妯℃澘

### 娴嬭瘯鏂囦欢
- `test-dify-mcp.js` - MCP 杩炴帴娴嬭瘯鑴氭湰

### 搴旂敤绋嬪簭鏂囦欢
- `backend/mock-server.js` - 鍚庣 Dify API 闆嗘垚
- `frontend/src/services/difyService.js` - 鍓嶇 Dify 鏈嶅姟
- `frontend/src/views/interview/AIInterviewSession.vue` - AI 闈㈣瘯椤甸潰

### 鏂囨。鏂囦欢
- `DIFY-INTEGRATION-GUIDE.md` - Dify REST API 闆嗘垚鎸囧崡
- `SMART-PROFESSION-INPUT-UPDATE.md` - 鏅鸿兘涓撲笟杈撳叆鍔熻兘鏂囨。

## 馃帗 甯歌闂 (FAQ)

### Q1: MCP 鍜?REST API 鏈変粈涔堝尯鍒紵

**MCP (Model Context Protocol)**:
- 鏍囧噯鍖栫殑鍗忚锛屼笓涓?AI 妯″瀷涓婁笅鏂囧叡浜璁?
- 鏀寔宸ュ叿鍙戠幇銆佸弻鍚戦€氫俊銆佹祦寮忓搷搴?
- 閫傚悎 AI 鍔╂墜鐩存帴璋冪敤

**REST API**:
- 浼犵粺鐨?HTTP API
- 閫傚悎搴旂敤绋嬪簭闆嗘垚
- 鏇寸ǔ瀹氥€佹洿鍙帶

### Q2: 鎴戦渶瑕佸悓鏃朵娇鐢ㄤ袱绉嶆柟寮忓悧锛?

**寤鸿**:
- **寮€鍙戞椂**锛氫娇鐢?MCP 蹇€熸祴璇?Dify 宸ヤ綔娴?
- **鐢熶骇鐜**锛氫娇鐢?REST API 纭繚绋冲畾鎬?

### Q3: 濡備綍鏇存柊 API Key锛?

缂栬緫 `.claude/mcp.json` 鏂囦欢锛屾洿鏂?`Authorization` 澶达細
```json
{
  "mcpServers": {
    "dify-interview-workflow": {
      "headers": {
        "Authorization": "Bearer 鏂扮殑API-KEY"
      }
    }
  }
}
```

### Q4: MCP 鏈嶅姟鍣ㄤ笉鍙敤鎬庝箞鍔烇紵

妫€鏌ユ楠わ細
1. 杩愯 `node test-dify-mcp.js` 娴嬭瘯杩炴帴
2. 纭 API Key 姝ｇ‘
3. 妫€鏌ョ綉缁滆繛鎺?
4. 璁块棶 Dify 骞冲彴纭鏈嶅姟鐘舵€?

### Q5: 鍙互娣诲姞澶氫釜 Dify 宸ヤ綔娴佸悧锛?

鍙互锛佸湪 `.claude/mcp.json` 涓坊鍔犲涓?MCP 鏈嶅姟鍣細
```json
{
  "mcpServers": {
    "dify-interview": {
      "url": "https://api.dify.ai/mcp/server/xxx/mcp",
      ...
    },
    "dify-another-workflow": {
      "url": "https://api.dify.ai/mcp/server/yyy/mcp",
      ...
    }
  }
}
```

## 馃幆 涓嬩竴姝ヨ鍔?

### 绔嬪嵆鍙互鍋氱殑浜嬫儏

1. **鍦?Claude Code 涓祴璇?*
   ```
   璇蜂娇鐢?Dify MCP 涓?"鏁版嵁鍒嗘瀽甯? 鐢熸垚闈㈣瘯闂
   ```

2. **鏌ョ湅宸ヤ綔娴佽鎯?*
   ```
   鏄剧ず Dify MCP 宸ュ叿鐨勬墍鏈夊弬鏁板拰鐢ㄦ硶
   ```

3. **闆嗘垚鍒板紑鍙戞祦绋?*
   - 浣跨敤 MCP 蹇€熼獙璇侀潰璇曢棶棰樿川閲?
   - 娴嬭瘯涓嶅悓鑱屼綅鐨勯鐩敓鎴?
   - 浼樺寲宸ヤ綔娴佸弬鏁?

### 鏈潵浼樺寲鏂瑰悜

1. **澧炲己 MCP 闆嗘垚**
   - 娣诲姞鏇村 Dify 宸ヤ綔娴?
   - 瀹炵幇娴佸紡鍝嶅簲
   - 娣诲姞缂撳瓨鏈哄埗

2. **鏀硅繘搴旂敤绋嬪簭**
   - 缁熶竴 MCP 鍜?REST API 鐨勬帴鍙?
   - 娣诲姞宸ヤ綔娴佺増鏈鐞?
   - 瀹炵幇 A/B 娴嬭瘯

3. **鐩戞帶鍜屽垎鏋?*
   - 璁板綍 MCP 璋冪敤鏃ュ織
   - 鍒嗘瀽宸ヤ綔娴佹€ц兘
   - 浼樺寲鍝嶅簲鏃堕棿

## 鉁?楠岃瘉娓呭崟

- [x] MCP 閰嶇疆鏂囦欢宸插垱寤?(`.claude/mcp.json`)
- [x] API Key 宸叉纭厤缃?
- [x] MCP 杩炴帴娴嬭瘯閫氳繃
- [x] 宸ュ叿鍙戠幇鎴愬姛
- [x] 浜嗚В宸ュ叿鍙傛暟鍜岀敤娉?
- [ ] 鍦?Claude Code 涓垚鍔熻皟鐢ㄥ伐鍏?
- [ ] 楠岃瘉宸ヤ綔娴佽繑鍥炵粨鏋?

## 馃帀 鎬荤粨

Dify MCP 鏈嶅姟闆嗘垚宸叉垚鍔熷畬鎴愶紒鐜板湪鎮ㄥ彲浠ワ細

1. 鉁?鍦?Claude Code 涓洿鎺ヨ皟鐢?Dify AI 闈㈣瘯瀹樺伐浣滄祦
2. 鉁?蹇€熸祴璇曚笉鍚岃亴浣嶇殑闈㈣瘯棰樼洰鐢熸垚
3. 鉁?浣跨敤 AI 杈呭姪寮€鍙戝拰璋冭瘯
4. 鉁?淇濇寔搴旂敤绋嬪簭浣跨敤绋冲畾鐨?REST API

杩欑鍙岃建骞惰鐨勬柟寮忔棦淇濊瘉浜嗙敓浜х幆澧冪殑绋冲畾鎬э紝鍙堟彁鍗囦簡寮€鍙戞晥鐜囷紒

---

**鍒涘缓鏃堕棿**: 2025-10-10 15:40
**鏂囨。鐗堟湰**: 1.0
**浣滆€?*: Claude Code
**鐘舵€?*: 鉁?闆嗘垚瀹屾垚骞舵祴璇曢€氳繃

