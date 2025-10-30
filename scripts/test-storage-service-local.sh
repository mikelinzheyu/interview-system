#!/bin/bash
# 本地快速测试脚本 - 验证存储服务是否正常工作
# 使用方法: chmod +x test-storage-service-local.sh && ./test-storage-service-local.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        📦 存储服务本地快速测试脚本                            ║"
echo "║        Storage Service Local Quick Test                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API 密钥和基础 URL
API_KEY="ak_dev_test_key_12345678901234567890"
BASE_URL="http://localhost:8081"

# 测试计数器
TESTS_PASSED=0
TESTS_FAILED=0

# 辅助函数：打印测试结果
print_result() {
    local test_name=$1
    local status=$2
    local details=$3

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        if [ ! -z "$details" ]; then
            echo "        $details"
        fi
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        if [ ! -z "$details" ]; then
            echo "        $details"
        fi
        ((TESTS_FAILED++))
    fi
    echo ""
}

echo "步骤 1️⃣ : 检查 Docker 容器状态"
echo "════════════════════════════════════════════════════════════════"
cd storage-service

# 检查容器是否运行
if docker-compose ps | grep -q "interview-redis"; then
    print_result "Redis 容器运行中" "PASS" "interview-redis is running"
else
    print_result "Redis 容器未运行" "FAIL" "Please run: docker-compose up -d"
    exit 1
fi

if docker-compose ps | grep -q "interview-storage-service"; then
    print_result "存储服务容器运行中" "PASS" "interview-storage-service is running"
else
    print_result "存储服务容器未运行" "FAIL" "Please run: docker-compose up -d"
    exit 1
fi

echo ""
echo "步骤 2️⃣ : 等待服务完全启动"
echo "════════════════════════════════════════════════════════════════"

# 等待服务响应
MAX_ATTEMPTS=10
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s -f -H "Authorization: Bearer $API_KEY" "$BASE_URL/api/sessions" > /dev/null 2>&1; then
        print_result "服务可访问" "PASS" "Service is responding"
        break
    fi
    echo -e "${YELLOW}⏳ 尝试 $((ATTEMPT+1))/$MAX_ATTEMPTS，等待服务启动...${NC}"
    ((ATTEMPT++))
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    print_result "服务启动超时" "FAIL" "Service did not respond within 20 seconds"
    exit 1
fi

echo ""
echo "步骤 3️⃣ : 测试 API 接口"
echo "════════════════════════════════════════════════════════════════"

# 测试 1: 创建会话
echo -e "${BLUE}测试 1: POST /api/sessions - 创建会话${NC}"

SESSION_ID="test-session-$(date +%s)"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "jobTitle": "Python 开发工程师",
    "questions": [
      {
        "id": "q1",
        "question": "请描述一个你参与过的最具挑战性的项目",
        "answer": "在一个电商平台的后端开发中，我负责设计和实现了一个高并发的订单处理系统..."
      },
      {
        "id": "q2",
        "question": "你如何处理生产环境中的性能问题？",
        "answer": "首先通过 APM 工具（如 Datadog）识别瓶颈，然后进行代码优化和缓存策略..."
      }
    ]
  }')

if echo "$RESPONSE" | grep -q "$SESSION_ID"; then
    print_result "创建会话成功" "PASS" "Session ID: $SESSION_ID"
else
    print_result "创建会话失败" "FAIL" "Response: $RESPONSE"
    ((TESTS_FAILED++))
fi

echo ""

# 测试 2: 查询完整会话
echo -e "${BLUE}测试 2: GET /api/sessions/{sessionId} - 查询完整会话${NC}"

RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/sessions/$SESSION_ID")

if echo "$RESPONSE" | grep -q "Python 开发工程师"; then
    print_result "查询会话成功" "PASS" "Retrieved session with job title"
else
    print_result "查询会话失败" "FAIL" "Response: $RESPONSE"
    ((TESTS_FAILED++))
fi

echo ""

# 测试 3: 查询特定问题答案
echo -e "${BLUE}测试 3: GET /api/sessions/{sessionId}?questionId=q1 - 查询问题答案${NC}"

RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/sessions/$SESSION_ID?questionId=q1")

if echo "$RESPONSE" | grep -q "电商平台"; then
    print_result "查询问题成功" "PASS" "Retrieved question with answer"
else
    print_result "查询问题失败" "FAIL" "Response: $RESPONSE"
    ((TESTS_FAILED++))
fi

echo ""

# 测试 4: 更新答案
echo -e "${BLUE}测试 4: PUT /api/sessions/{sessionId}/questions/q1 - 更新答案${NC}"

RESPONSE=$(curl -s -X PUT "$BASE_URL/api/sessions/$SESSION_ID/questions/q1" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "更新后的答案：在云计算平台项目中，我独立开发了负载均衡模块...",
    "hasAnswer": true
  }')

if echo "$RESPONSE" | grep -q "Answer updated"; then
    print_result "更新答案成功" "PASS" "Answer updated successfully"
else
    print_result "更新答案失败" "FAIL" "Response: $RESPONSE"
    ((TESTS_FAILED++))
fi

echo ""

# 测试 5: 验证答案已更新
echo -e "${BLUE}测试 5: GET /api/sessions/{sessionId}/questions/q1 - 验证更新${NC}"

RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/sessions/$SESSION_ID/questions/q1")

if echo "$RESPONSE" | grep -q "云计算平台"; then
    print_result "验证更新成功" "PASS" "Updated answer is persisted"
else
    print_result "验证更新失败" "FAIL" "Answer was not updated"
    ((TESTS_FAILED++))
fi

echo ""

# 测试 6: 删除会话
echo -e "${BLUE}测试 6: DELETE /api/sessions/{sessionId} - 删除会话${NC}"

RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $API_KEY")

if echo "$RESPONSE" | grep -q "deleted"; then
    print_result "删除会话成功" "PASS" "Session deleted successfully"
else
    print_result "删除会话失败" "FAIL" "Response: $RESPONSE"
    ((TESTS_FAILED++))
fi

echo ""

# 测试 7: 验证会话已删除
echo -e "${BLUE}测试 7: 验证会话已删除${NC}"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/sessions/$SESSION_ID")

if [ "$HTTP_CODE" = "404" ]; then
    print_result "验证删除成功" "PASS" "Session not found (HTTP 404)"
else
    print_result "验证删除失败" "FAIL" "HTTP Code: $HTTP_CODE (expected 404)"
    ((TESTS_FAILED++))
fi

echo ""

# 测试 8: 检查认证
echo -e "${BLUE}测试 8: 测试 API Key 认证${NC}"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/sessions")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    print_result "认证检查成功" "PASS" "Missing API key returns HTTP $HTTP_CODE"
else
    print_result "认证检查失败" "FAIL" "Expected 401/403 but got HTTP $HTTP_CODE"
    ((TESTS_FAILED++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "步骤 4️⃣ : 检查日志"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo -e "${BLUE}Redis 容器日志（最后 5 行）:${NC}"
docker-compose logs --tail=5 interview-redis
echo ""

echo -e "${BLUE}存储服务日志（最后 5 行）:${NC}"
docker-compose logs --tail=5 interview-storage-service
echo ""

# 最终总结
echo "════════════════════════════════════════════════════════════════"
echo "测试总结"
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ 通过: $TESTS_PASSED${NC}"
echo -e "${RED}✗ 失败: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✅ 所有测试通过！存储服务运行正常               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "下一步："
    echo "  1. 推送代码到 GitHub: git push origin main"
    echo "  2. 创建 GitHub Secrets（参考 GITHUB_SECRETS_SETUP.md）"
    echo "  3. 购买云服务器和域名"
    echo "  4. GitHub Actions 将自动部署到生产环境"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ❌ 有测试失败，请检查日志                      ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "故障排查："
    echo "  1. 检查容器是否正在运行: docker-compose ps"
    echo "  2. 查看详细日志: docker-compose logs"
    echo "  3. 重启容器: docker-compose restart"
    echo "  4. 查看 IMPLEMENTATION_STEPS.md 中的故障排查部分"
    echo ""
    exit 1
fi
