@echo off
REM ========================================
REM AI 鏅鸿兘闈㈣瘯绯荤粺 - 甯?Dify 宸ヤ綔娴佸惎鍔ㄨ剼鏈?
REM ========================================

echo.
echo ========================================
echo  AI 鏅鸿兘闈㈣瘯绯荤粺 - 鍚姩閰嶇疆
echo ========================================
echo.

REM ========================================
REM 1. Dify 宸ヤ綔娴侀厤缃?
REM ========================================
echo [1/4] 閰嶇疆 Dify 宸ヤ綔娴?..

REM 鉁?宸查厤缃偍鐨?Dify 宸ヤ綔娴佷俊鎭?
REM 鍏紑璁块棶 URL: https://udify.app/workflow/ZJIwyB7UMouf2H9V
REM API 璁块棶鍑嵁: https://api.dify.ai/v1

REM Dify API 绔偣 (宸ヤ綔娴佽繍琛屽湴鍧€)
set DIFY_WORKFLOW_URL=https://api.dify.ai/v1/workflows/run

REM Dify App ID / API Token
set DIFY_APP_ID=app-vZlc0w5Dio2gnrTkdlblcPXG

echo    Workflow URL: %DIFY_WORKFLOW_URL%
echo    App ID: %DIFY_APP_ID%
echo.

REM ========================================
REM 2. 鏁版嵁搴撻厤缃?
REM ========================================
echo [2/4] 閰嶇疆鏁版嵁搴撹繛鎺?..

REM 鏁版嵁搴撳瘑鐮侊紙榛樿锛?23456锛?
set DB_PASSWORD=123456

REM Redis 瀵嗙爜锛堝鏋滄病鏈夎缃瘑鐮侊紝淇濇寔涓虹┖锛?
set REDIS_PASSWORD=

echo    Database: localhost:3306/interview_system
echo    Redis: localhost:6379
echo.

REM ========================================
REM 3. JWT 瀵嗛挜閰嶇疆锛堝彲閫夛級
REM ========================================
echo [3/4] 閰嶇疆 JWT 瀵嗛挜...

REM JWT 瀵嗛挜锛堥粯璁や娇鐢ㄩ厤缃枃浠朵腑鐨勫€硷級
REM set JWT_SECRET=your-custom-jwt-secret-key-here

echo    JWT Secret: (浣跨敤榛樿鍊?
echo.

REM ========================================
REM 4. 鍚姩鍚庣鏈嶅姟
REM ========================================
echo [4/4] 鍚姩鍚庣鏈嶅姟...
echo.

REM 妫€鏌?Java 鏄惁瀹夎
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [閿欒] 鏈娴嬪埌 Java锛岃鍏堝畨瑁?JDK 17 鎴栨洿楂樼増鏈?
    echo.
    pause
    exit /b 1
)

REM 妫€鏌?Maven 鏄惁瀹夎
call mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [閿欒] 鏈娴嬪埌 Maven锛岃鍏堝畨瑁?Maven
    echo.
    pause
    exit /b 1
)

REM 杩涘叆鍚庣鐩綍
cd /d "%~dp0backend"

echo ========================================
echo  姝ｅ湪鍚姩 Spring Boot 搴旂敤...
echo ========================================
echo.
echo 鎻愮ず锛?
echo  - 鍚庣鏈嶅姟鍦板潃: http://localhost:8080/api
echo  - API 鏂囨。: http://localhost:8080/api/doc.html (濡傚凡閰嶇疆)
echo  - 鏃ュ織绾у埆: DEBUG
echo.
echo 鎸?Ctrl+C 鍋滄鏈嶅姟
echo ========================================
echo.

REM 鍚姩 Spring Boot 搴旂敤
call mvn spring-boot:run

pause

