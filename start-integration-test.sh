#!/bin/bash

# 前后端集成测试启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║   前后端联调测试启动脚本                 ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}\n"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. 启动后端
echo -e "${BLUE}[1/3] 启动后端服务...${NC}"
cd "$SCRIPT_DIR/backend"
npm install > /dev/null 2>&1
echo "后端依赖安装完成"

# 启动后端（后台运行）
node mock-server.js > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "后端进程 ID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查后端是否已启动
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${RED}✗ 后端启动失败${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✓ 后端已启动${NC}\n"

# 2. 启动前端（可选）
echo -e "${BLUE}[2/3] 启动前端服务...${NC}"
cd "$SCRIPT_DIR/frontend"
npm install > /dev/null 2>&1
echo "前端依赖安装完成"

# 启动前端（后台运行）
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "前端进程 ID: $FRONTEND_PID"

# 等待前端启动
sleep 5

# 检查前端是否已启动
if ! curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 前端可能未完全启动，但将继续${NC}"
else
    echo -e "${GREEN}✓ 前端已启动${NC}"
fi
echo ""

# 3. 运行集成测试
echo -e "${BLUE}[3/3] 运行集成测试...${NC}"
cd "$SCRIPT_DIR"

# 等待后端完全就绪
sleep 2

# 运行测试
if node test-integration.js; then
    echo -e "${GREEN}✓ 集成测试全部通过${NC}"
    TEST_RESULT=0
else
    echo -e "${RED}✗ 集成测试有失败${NC}"
    TEST_RESULT=1
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}服务信息：${NC}"
echo -e "  后端: ${GREEN}http://localhost:3001${NC}"
echo -e "  前端: ${GREEN}http://localhost:5174${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}\n"

echo -e "${CYAN}日志位置：${NC}"
echo "  后端日志: $SCRIPT_DIR/backend.log"
echo "  前端日志: $SCRIPT_DIR/frontend.log\n"

echo -e "${CYAN}停止服务：${NC}"
echo -e "  ${YELLOW}kill $BACKEND_PID  # 停止后端${NC}"
echo -e "  ${YELLOW}kill $FRONTEND_PID  # 停止前端${NC}\n"

exit $TEST_RESULT
