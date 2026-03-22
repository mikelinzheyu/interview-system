#!/bin/bash

# 全Docker生产环境快速启动脚本
# 用法: bash quick-docker-test.sh

set -e

echo "================================"
echo "AI 面试系统 - Docker 集成测试"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Phase 1: 清理旧容器
echo -e "${BLUE}[Phase 1] 清理旧容器和卷...${NC}"
docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
sleep 2

# Phase 2: 启动全栈
echo -e "${BLUE}[Phase 2] 启动 Docker Compose 全栈...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Phase 3: 等待服务就绪
echo -e "${BLUE}[Phase 3] 等待所有服务启动 (30秒)...${NC}"
sleep 30

# Phase 4: 检查容器状态
echo -e "${BLUE}[Phase 4] 检查容器运行状态...${NC}"
echo ""

# 定义容器列表
CONTAINERS=(
  "interview-db:PostgreSQL"
  "interview-redis:Redis"
  "interview-backend:Backend API"
  "interview-frontend:Frontend"
  "interview-nginx:Nginx"
)

ALL_HEALTHY=true

for CONTAINER_INFO in "${CONTAINERS[@]}"; do
  CONTAINER="${CONTAINER_INFO%:*}"
  SERVICE="${CONTAINER_INFO#*:}"

  STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")

  if [ "$STATUS" = "running" ]; then
    echo -e "${GREEN}✓${NC} $SERVICE: 运行中 ($CONTAINER)"
  else
    echo -e "${RED}✗${NC} $SERVICE: $STATUS ($CONTAINER)"
    ALL_HEALTHY=false
  fi
done

echo ""

# Phase 5: 检查日志
echo -e "${BLUE}[Phase 5] 检查关键日志...${NC}"
echo ""

echo -e "${YELLOW}后端日志 (最后20行):${NC}"
docker logs interview-backend 2>&1 | tail -20
echo ""

echo -e "${YELLOW}Nginx 日志 (最后10行):${NC}"
docker logs interview-nginx 2>&1 | tail -10
echo ""

# Phase 6: 网络测试
echo -e "${BLUE}[Phase 6] 网络连通性测试...${NC}"
echo ""

# 测试 API 健康检查
echo "测试后端健康检查 (http://localhost:3001/api/health)..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "error\n000")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)

if [ "$HEALTH_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} 后端健康检查通过 (HTTP $HEALTH_CODE)"
else
  echo -e "${RED}✗${NC} 后端健康检查失败 (HTTP $HEALTH_CODE)"
  ALL_HEALTHY=false
fi

echo ""

# 测试 Nginx 转发
echo "测试 Nginx API 转发 (http://localhost/api/health)..."
NGINX_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost/api/health 2>/dev/null || echo "error\n000")
NGINX_CODE=$(echo "$NGINX_RESPONSE" | tail -1)

if [ "$NGINX_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} Nginx API 代理通过 (HTTP $NGINX_CODE)"
else
  echo -e "${RED}✗${NC} Nginx API 代理失败 (HTTP $NGINX_CODE)"
  ALL_HEALTHY=false
fi

echo ""

# 测试前端
echo "测试前端页面加载 (http://localhost/)..."
FE_RESPONSE=$(curl -s -w "\n%{http_code}" -o /dev/null http://localhost/ 2>/dev/null || echo "000")

if [ "$FE_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓${NC} 前端页面加载成功 (HTTP $FE_RESPONSE)"
else
  echo -e "${RED}✗${NC} 前端页面加载失败 (HTTP $FE_RESPONSE)"
  ALL_HEALTHY=false
fi

echo ""

# Phase 7: 总结
echo -e "${BLUE}[Phase 7] 测试总结${NC}"
echo ""

if [ "$ALL_HEALTHY" = true ]; then
  echo -e "${GREEN}✅ 所有服务正常运行！${NC}"
  echo ""
  echo "🎯 接下来可以做什么:"
  echo "  1. 访问前端: http://localhost"
  echo "  2. 查看后端日志: docker logs -f interview-backend"
  echo "  3. 查看 Nginx 日志: docker logs -f interview-nginx"
  echo "  4. 进入后端容器: docker exec -it interview-backend sh"
  echo "  5. 进入数据库: docker exec -it interview-db psql -U admin -d interview_system"
  echo ""
  echo "📝 完整测试指南: cat FULL_DOCKER_INTEGRATION_TEST.md"
else
  echo -e "${RED}❌ 部分服务出现问题，请检查日志${NC}"
  echo ""
  echo "常见问题:"
  echo "  • MODULE_NOT_FOUND: 检查后端是否正确包含了 abilityProfiles.js"
  echo "  • DIFY_INTERVIEW_INIT_KEY 未配置: 检查 .env.prod 和 docker-compose.prod.yml"
  echo "  • Connection refused: 检查容器是否正确启动"
fi

echo ""
echo "================================"
echo "测试完成！"
echo "================================"
