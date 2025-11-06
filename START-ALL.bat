@echo off
chcp 65001 > nul
REM AI闈㈣瘯绯荤粺 - 鍓嶅悗绔畬鏁村惎鍔ㄨ剼鏈
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo 鈺斺晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晽
echo 鈺  AI闈㈣瘯绯荤粺 - 鏈湴鍓嶅悗绔仈璋冨畬鏁村惎鍔             鈺echo 鈺                                                   鈺echo 鈺  鍚庣: localhost:3001 (Mock Server)              鈺echo 鈺  鍓嶇: localhost:5174 (Vite)                     鈺echo 鈺氣晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨暆
echo.

REM 妫€鏌ode.js
where node.exe >nul 2>nul
if errorlevel 1 (
    echo [ERROR] 鎵句笉鍒Node.js锛佽鍏堝畨瑁    pause
    exit /b 1
)

echo [鉁揮 Node.js 宸插畨瑁node --version
echo.

REM 鍚姩鍚庣
echo [姝ラ1] 鍚姩鍚庣 Mock Server (绔彛3001)...
start "AI-Interview-Backend" cmd /k "cd /d "%cd%\backend" && node mock-server.js"
timeout /t 3 /nobreak >nul

REM 鍚姩鍓嶇
echo [姝ラ2] 鍚姩鍓嶇 Vite (绔彛5174)...
start "AI-Interview-Frontend" cmd /k "cd /d "%cd%\frontend" && "C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5174"
timeout /t 4 /nobreak >nul

echo.
echo 鈺斺晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晽
echo 鈺  鉁鎵€鏈夋湇鍔″凡鍚姩!                              鈺echo 鈺氣晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨暆
echo.

echo 馃寪 璁块棶鍦板潃:
echo   鍓嶇: http://localhost:5174
echo   鍚庣: http://localhost:3001/api/health
echo.

echo 馃摑 鎻愮ず:
echo   鈥涓や釜鏂扮獥鍙ｅ凡鎵撳紑锛屽垎鍒繍琛屽悗绔拰鍓嶇
echo   鈥浠ｇ爜淇敼浼氳嚜鍔ㄧ儹鏇存柊
echo   鈥鎸Ctrl+C 鍙仠姝㈡湇鍔echo   鈥鏌ョ湅璇︾粏璇存槑: QUICK_START_LOCAL.md
echo.

echo 馃殌 绔嬪嵆鎵撳紑娴忚鍣 http://localhost:5174
echo.

pause
