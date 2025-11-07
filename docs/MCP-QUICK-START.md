# Dify MCP 蹇€熷紑濮嬫寚鍗?

## 馃殌 5鍒嗛挓蹇€熶笂鎵?

### 姝ラ 1: 楠岃瘉 MCP 閰嶇疆

MCP 閰嶇疆鏂囦欢宸茬粡鍒涘缓鍦細`.claude/mcp.json`

```json
{
  "mcpServers": {
    "dify-interview-workflow": {
      "url": "https://api.dify.ai/mcp/server/sQFDstpnlPUJ5MeX/mcp",
      "headers": {
        "Authorization": "Bearer app-aROZ5FjseJWUtmRzzjlb6b5E"
      }
    }
  }
}
```

### 姝ラ 2: 娴嬭瘯 MCP 杩炴帴

杩愯娴嬭瘯鑴氭湰楠岃瘉杩炴帴锛?

```bash
node test-dify-mcp.js
```

鉁?**棰勬湡杈撳嚭**: 搴旇鐪嬪埌 "鉁?鎵€鏈夋祴璇曞畬鎴愶紒"

### 姝ラ 3: 杩愯婕旂ず

閫夋嫨涓€涓紨绀鸿繍琛岋細

```bash
# 婕旂ず 1: 涓?Python 鍚庣鐢熸垚棰樼洰锛堥渶瑕?30-60 绉掞級
node demo-dify-mcp.js 1

# 婕旂ず 2: 涓哄墠绔紑鍙戠敓鎴愰鐩?
node demo-dify-mcp.js 2

# 婕旂ず 3: 鏌ョ湅鍙傛暟鏍煎紡锛堜笉璋冪敤 API锛?
node demo-dify-mcp.js 3

# 婕旂ず 4: 涓哄尯鍧楅摼宸ョ▼甯堢敓鎴愰鐩?
node demo-dify-mcp.js 4
```

### 姝ラ 4: 鍦?Claude Code 涓娇鐢?

鍦?Claude Code 瀵硅瘽涓洿鎺ヨ姹傦細

```
璇蜂娇鐢?Dify MCP 宸ュ叿涓?"鏁版嵁鍒嗘瀽甯? 鑱屼綅鐢熸垚闈㈣瘯闂
```

Claude Code 浼氳嚜鍔ㄨ皟鐢?MCP 宸ュ叿锛?

## 馃搵 鍙敤鐨?MCP 宸ュ叿

### 宸ュ叿鍚嶇О
`AI 闈㈣瘯瀹?- 鍏ㄦ祦绋嬪畾鍒朵笌璇勫垎 (RAG)`

### 杈撳叆鍙傛暟

| 鍙傛暟 | 绫诲瀷 | 蹇呭～ | 璇存槑 |
|------|------|------|------|
| `request_type` | string | 鉁?| 璇锋眰绫诲瀷 |
| `job_title` | string | 鉂?| 鑱屼綅鍚嶇О |
| `question` | string | 鉂?| 闈㈣瘯闂 |
| `candidate_answer` | string | 鉂?| 鍊欓€変汉绛旀 |
| `session_id` | string | 鉂?| 浼氳瘽 ID |

### 璇锋眰绫诲瀷

1. **`generate_questions`** - 鐢熸垚闈㈣瘯闂
   ```json
   {
     "request_type": "generate_questions",
     "job_title": "鍓嶇寮€鍙戝伐绋嬪笀"
   }
   ```

2. **`analyze_answer`** - 鍒嗘瀽绛旀
   ```json
   {
     "request_type": "analyze_answer",
     "session_id": "sess-xxx",
     "question": "浠€涔堟槸闂寘锛?,
     "candidate_answer": "闂寘鏄?.."
   }
   ```

3. **`continue_interview`** - 缁х画闈㈣瘯
   ```json
   {
     "request_type": "continue_interview",
     "session_id": "sess-xxx"
   }
   ```

## 馃挕 浣跨敤鍦烘櫙

### 鍦烘櫙 1: 蹇€熺敓鎴愰潰璇曢鐩?

**鍦?Claude Code 涓?*锛?
```
浣跨敤 Dify MCP 涓?"鏈哄櫒瀛︿範宸ョ▼甯? 鐢熸垚 5 涓潰璇曢棶棰?
```

**鎴栦娇鐢?Node.js**锛?
```bash
node demo-dify-mcp.js 1
```

### 鍦烘櫙 2: 娴嬭瘯涓嶅悓鑱屼綅

```
渚濇涓轰互涓嬭亴浣嶇敓鎴愰鐩細
1. 鍓嶇寮€鍙戝伐绋嬪笀
2. Python 鍚庣宸ョ▼甯?
3. DevOps 宸ョ▼甯?
```

### 鍦烘櫙 3: 楠岃瘉绛旀璇勪及

```
浣跨敤 Dify MCP 璇勪及杩欎釜绛旀锛?
闂锛氫粈涔堟槸 Docker锛?
绛旀锛欴ocker 鏄竴涓鍣ㄥ寲骞冲彴...
```

## 馃敡 鏁呴殰鎺掗櫎

### 闂 1: 杩炴帴澶辫触

**鐥囩姸**: `node test-dify-mcp.js` 鏄剧ず杩炴帴閿欒

**瑙ｅ喅鏂规**:
1. 妫€鏌ョ綉缁滆繛鎺?
2. 纭 API Key 姝ｇ‘
3. 楠岃瘉 MCP URL 鍙闂?

### 闂 2: 瓒呮椂閿欒

**鐥囩姸**: 璋冪敤瓒呮椂锛坱imeout锛?

**鍘熷洜**: Dify 宸ヤ綔娴侀渶瑕佹悳绱㈠紩鎿庢煡璇紝閫氬父闇€瑕?30-60 绉?

**瑙ｅ喅鏂规**: 澧炲姞瓒呮椂鏃堕棿鎴栬€愬績绛夊緟

### 闂 3: Claude Code 鎵句笉鍒板伐鍏?

**鐥囩姸**: Claude Code 璇存壘涓嶅埌 MCP 宸ュ叿

**瑙ｅ喅鏂规**:
1. 纭 `.claude/mcp.json` 鏂囦欢瀛樺湪
2. 閲嶅惎 Claude Code
3. 妫€鏌ラ厤缃枃浠舵牸寮?

## 馃摎 鐩稿叧鏂囨。

- **瀹屾暣鏂囨。**: `DIFY-MCP-INTEGRATION.md`
- **鑷敱杈撳叆鍔熻兘**: `SMART-PROFESSION-INPUT-UPDATE.md`
- **Dify 闆嗘垚鎸囧崡**: `DIFY-INTEGRATION-GUIDE.md`

## 鉁?楂樼骇鐢ㄦ硶

### 鍦ㄤ唬鐮佷腑璋冪敤 MCP

```javascript
const https = require('https');

async function callDifyMCP(params) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'AI 闈㈣瘯瀹?- 鍏ㄦ祦绋嬪畾鍒朵笌璇勫垎 (RAG)',
      arguments: params
    }
  });

  // ... (鍙傝€?demo-dify-mcp.js 瀹屾暣瀹炵幇)
}

// 浣跨敤
const result = await callDifyMCP({
  request_type: 'generate_questions',
  job_title: '鍏ㄦ爤寮€鍙戝伐绋嬪笀'
});
```

### 鎵归噺鐢熸垚棰樼洰

```javascript
const professions = [
  '鍓嶇寮€鍙戝伐绋嬪笀',
  'Python鍚庣寮€鍙戝伐绋嬪笀',
  '鏁版嵁鍒嗘瀽甯?,
  '浜у搧缁忕悊'
];

for (const prof of professions) {
  const result = await callDifyMCP({
    request_type: 'generate_questions',
    job_title: prof
  });
  console.log(`${prof}: 宸茬敓鎴?${result.questions.length} 閬撻鐩甡);
}
```

## 馃幆 涓嬩竴姝?

1. 鉁?杩愯 `node test-dify-mcp.js` 楠岃瘉杩炴帴
2. 鉁?杩愯 `node demo-dify-mcp.js 1` 鐢熸垚绗竴涓鐩?
3. 鉁?鍦?Claude Code 涓皾璇曡皟鐢?MCP 宸ュ叿
4. 鉁?灏?MCP 闆嗘垚鍒版偍鐨勫紑鍙戞祦绋?

## 馃挰 闇€瑕佸府鍔╋紵

鍦?Claude Code 瀵硅瘽涓闂細

```
鎴戞兂浜嗚В濡備綍浣跨敤 Dify MCP 宸ュ叿
```

鎴栬€呮煡鐪嬪畬鏁存枃妗ｏ細

```
璇锋墦寮€骞惰В閲?DIFY-MCP-INTEGRATION.md 鏂囦欢
```

---

**鏇存柊鏃堕棿**: 2025-10-10
**鐗堟湰**: 1.0
**鐘舵€?*: 鉁?鍙敤

