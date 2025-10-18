#!/bin/bash
# ========================================
# AI 鏅鸿兘闈㈣瘯绯荤粺 - 甯?Dify 宸ヤ綔娴佸惎鍔ㄨ剼鏈?(Linux/Mac)
# ========================================

echo ""
echo "========================================"
echo " AI 鏅鸿兘闈㈣瘯绯荤粺 - 鍚姩閰嶇疆"
echo "========================================"
echo ""

# ========================================
# 1. Dify 宸ヤ綔娴侀厤缃?
# ========================================
echo "[1/4] 閰嶇疆 Dify 宸ヤ綔娴?.."

# 鉁?宸查厤缃偍鐨?Dify 宸ヤ綔娴佷俊鎭?
# 鍏紑璁块棶 URL: https://udify.app/workflow/ZJIwyB7UMouf2H9V
# API 璁块棶鍑嵁: https://api.dify.ai/v1

# Dify API 绔偣 (宸ヤ綔娴佽繍琛屽湴鍧€)
export DIFY_WORKFLOW_URL="https://api.dify.ai/v1/workflows/run"

# Dify App ID / API Token
export DIFY_APP_ID="app-vZlc0w5Dio2gnrTkdlblcPXG"

echo "   Workflow URL: $DIFY_WORKFLOW_URL"
echo "   App ID: $DIFY_APP_ID"
echo ""

# ========================================
# 2. 鏁版嵁搴撻厤缃?
# ========================================
echo "[2/4] 閰嶇疆鏁版嵁搴撹繛鎺?.."

# 鏁版嵁搴撳瘑鐮侊紙榛樿锛?23456锛?
export DB_PASSWORD="123456"

# Redis 瀵嗙爜锛堝鏋滄病鏈夎缃瘑鐮侊紝淇濇寔涓虹┖锛?
export REDIS_PASSWORD=""

echo "   Database: localhost:3306/interview_system"
echo "   Redis: localhost:6379"
echo ""

# ========================================
# 3. JWT 瀵嗛挜閰嶇疆锛堝彲閫夛級
# ========================================
echo "[3/4] 閰嶇疆 JWT 瀵嗛挜..."

# JWT 瀵嗛挜锛堥粯璁や娇鐢ㄩ厤缃枃浠朵腑鐨勫€硷級
# export JWT_SECRET="your-custom-jwt-secret-key-here"

echo "   JWT Secret: (浣跨敤榛樿鍊?"
echo ""

# ========================================
# 4. 鍚姩鍚庣鏈嶅姟
# ========================================
echo "[4/4] 鍚姩鍚庣鏈嶅姟..."
echo ""

# 妫€鏌?Java 鏄惁瀹夎
if ! command -v java &> /dev/null; then
    echo "[閿欒] 鏈娴嬪埌 Java锛岃鍏堝畨瑁?JDK 17 鎴栨洿楂樼増鏈?
    echo ""
    exit 1
fi

# 妫€鏌?Maven 鏄惁瀹夎
if ! command -v mvn &> /dev/null; then
    echo "[閿欒] 鏈娴嬪埌 Maven锛岃鍏堝畨瑁?Maven"
    echo ""
    exit 1
fi

# 杩涘叆鍚庣鐩綍
cd "$(dirname "$0")/backend" || exit

echo "========================================"
echo " 姝ｅ湪鍚姩 Spring Boot 搴旂敤..."
echo "========================================"
echo ""
echo "鎻愮ず锛?
echo " - 鍚庣鏈嶅姟鍦板潃: http://localhost:8080/api"
echo " - API 鏂囨。: http://localhost:8080/api/doc.html (濡傚凡閰嶇疆)"
echo " - 鏃ュ織绾у埆: DEBUG"
echo ""
echo "鎸?Ctrl+C 鍋滄鏈嶅姟"
echo "========================================"
echo ""

# 鍚姩 Spring Boot 搴旂敤
mvn spring-boot:run

