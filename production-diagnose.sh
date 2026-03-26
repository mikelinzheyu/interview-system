#!/bin/bash

# 生产环境快速诊断脚本
# 用法: bash production-diagnose.sh

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║           🔍 生产环境诊断 - 错题复盘功能问题                              ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查函数
check_container() {
  local container=$1
  local name=$2

  if docker ps | grep -q "$container"; then
    echo -e "${GREEN}✅${NC} $name 容器正在运行"
    return 0
  else
    echo -e "${RED}❌${NC} $name 容器未运行"
    return 1
  fi
}

# ==================== 容器状态检查 ====================
echo "📊 Docker 容器状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_container "interview-db" "PostgreSQL 数据库"
check_container "interview-redis" "Redis 缓存"
check_container "interview-backend" "Node.js 后端"
check_container "interview-frontend" "Vue 前端"
check_container "interview-nginx" "Nginx 反向代理"

echo ""

# ==================== 后端日志检查 ====================
echo "📋 后端服务日志 (最后 20 行)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q "interview-backend"; then
  docker logs --tail 20 interview-backend 2>&1 | head -20
  echo ""

  # 检查错误
  if docker logs interview-backend 2>&1 | grep -i "error" > /dev/null; then
    echo -e "${RED}⚠️  检测到错误信息${NC}"
    docker logs interview-backend 2>&1 | grep -i "error" | tail -5
  fi
else
  echo -e "${RED}❌ 后端容器未运行${NC}"
fi

echo ""

# ==================== 数据库连接检查 ====================
echo "🗄️  数据库连接测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q "interview-db"; then
  if docker exec interview-db pg_isready -U admin > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} PostgreSQL 数据库连接正常"

    # 检查表是否存在
    if docker exec interview-db psql -U admin -d interview_system -c "\dt" 2>/dev/null | grep -q "interview_records"; then
      echo -e "${GREEN}✅${NC} interview_records 表存在"
    else
      echo -e "${RED}❌${NC} interview_records 表不存在"
    fi

    if docker exec interview-db psql -U admin -d interview_system -c "\dt" 2>/dev/null | grep -q "wrong_answer_reviews"; then
      echo -e "${GREEN}✅${NC} wrong_answer_reviews 表存在"
    else
      echo -e "${RED}❌${NC} wrong_answer_reviews 表不存在"
    fi
  else
    echo -e "${RED}❌${NC} PostgreSQL 数据库连接失败"
  fi
else
  echo -e "${RED}❌${NC} 数据库容器未运行${NC}"
fi

echo ""

# ==================== API 端点检查 ====================
echo "🔗 API 端点测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 测试本地后端
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} 后端 /health 端点可访问"
else
  echo -e "${RED}❌${NC} 后端 /health 端点无法访问"
fi

# 测试 API 端点
if curl -s -X GET http://localhost:3001/api/interview/records \
  -H "Authorization: Bearer 1" > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} 后端 /api/interview/records 端点可访问"
else
  echo -e "${RED}❌${NC} 后端 /api/interview/records 端点无法访问"
fi

echo ""

# ==================== Nginx 配置检查 ====================
echo "🌐 Nginx 反向代理检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q "interview-nginx"; then
  if docker exec interview-nginx grep -q "proxy_pass.*interview-backend" /etc/nginx/conf.d/default.conf 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Nginx 代理配置正确"
  else
    echo -e "${RED}❌${NC} Nginx 代理配置可能有问题"
  fi

  # 查看最后的 Nginx 日志
  echo ""
  echo "Nginx 日志 (最后 10 行):"
  docker logs --tail 10 interview-nginx 2>&1
else
  echo -e "${RED}❌${NC} Nginx 容器未运行${NC}"
fi

echo ""

# ==================== 文件检查 ====================
echo "📁 后端文件检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q "interview-backend"; then
  if docker exec interview-backend test -f /app/backend/routes/interview.js; then
    echo -e "${GREEN}✅${NC} interview.js 路由文件存在"
  else
    echo -e "${RED}❌${NC} interview.js 路由文件不存在"
  fi

  if docker exec interview-backend grep -q "interviewRouter" /app/backend/routes/api.js 2>/dev/null; then
    echo -e "${GREEN}✅${NC} interviewRouter 已挂载"
  else
    echo -e "${RED}❌${NC} interviewRouter 未挂载"
  fi
else
  echo -e "${RED}❌${NC} 后端容器未运行，无法检查文件${NC}"
fi

echo ""

# ==================== 总结 ====================
echo "📊 诊断总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "如果所有检查都通过 (✅)，问题可能是:"
echo "  1. 前端 API 调用配置错误"
echo "  2. 浏览器缓存问题"
echo "  3. 用户认证问题"
echo ""
echo "如果有检查失败 (❌)，请:"
echo "  1. 查看详细的诊断文档: PRODUCTION_ISSUE_DIAGNOSIS.md"
echo "  2. 检查容器日志获取更多信息"
echo "  3. 根据错误信息进行相应的修复"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "诊断完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
