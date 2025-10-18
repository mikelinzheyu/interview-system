import api from './index'

export const interviewAPI = {
  // 鍒涘缓闈㈣瘯浼氳瘽
  createSession: (data) => api.post('/sessions', data),
  
  // 鑾峰彇浼氳瘽淇℃伅
  getSession: (sessionId) => api.get(`/sessions/${sessionId}`),
  
  // 寮€濮嬮潰璇?
  startInterview: (sessionId) => api.post(`/sessions/${sessionId}/start`),
  
  // 鍙戦€佹秷鎭?
  sendMessage: (sessionId, data) => api.post(`/sessions/${sessionId}/messages`, data),
  
  // 鑾峰彇瀵硅瘽鍘嗗彶
  getMessages: (sessionId) => api.get(`/sessions/${sessionId}/messages`),
  
  // 缁撴潫闈㈣瘯
  endInterview: (sessionId) => api.post(`/sessions/${sessionId}/end`),
  
  // 鑾峰彇闈㈣瘯鎶ュ憡
  getReport: (sessionId) => api.get(`/sessions/${sessionId}/report`)
}

// 妯℃嫙AI鎺ュ彛锛堝悗绔湭寮€鍙戞椂浣跨敤锛?
export const mockAI = {
  // 妯℃嫙鍙戦€佹秷鎭埌AI
  chat: async (message) => {
    if (message) { /* noop to use mock parameter */ }
    // 妯℃嫙缃戠粶寤惰繜
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const responses = [
      "杩欐槸涓€涓緢濂界殑闂銆傝鎴戞潵涓烘偍璇︾粏瑙ｇ瓟...",
      "鏍规嵁鎮ㄧ殑鍥炵瓟锛屾垜寤鸿鎮ㄥ彲浠ヤ粠浠ヤ笅鍑犱釜鏂归潰鏉ユ€濊€?..",
      "鎮ㄦ彁鍒扮殑杩欎釜姒傚康寰堥噸瑕侊紝鑳藉惁杩涗竴姝ヨ鏄庝竴涓?..",
      "璁╂垜浠崲涓搴︽潵鐪嬭繖涓棶棰?..",
      "寰堝ソ鐨勬€濊矾锛佷笉杩囨垜鎯充簡瑙ｆ偍瀵逛簬杩欎釜闂鐨勬繁灞傜悊瑙?.."
    ]
    
    return {
      code: 200,
      data: {
        content: responses[Math.floor(Math.random() * responses.length)],
        type: 'text',
        timestamp: Date.now()
      }
    }
  }
}
