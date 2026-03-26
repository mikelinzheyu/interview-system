#!/bin/bash

# 错题复盘系统测试脚本
# 测试后端API和前端集成

set -e

echo "=========================================="
echo "错题复盘系统 - 完整测试套件"
echo "=========================================="
echo ""

# 配置
API_BASE="http://localhost:8080/api"
USER_ID=1
BEARER_TOKEN="$USER_ID"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
TESTS_PASSED=0
TESTS_FAILED=0

# 辅助函数
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_code=$5

  echo -n "测试: $name ... "

  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Authorization: Bearer $BEARER_TOKEN" \
      -H "Content-Type: application/json" \
      "$API_BASE$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Authorization: Bearer $BEARER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_BASE$endpoint")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" = "$expected_code" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    return 1
  fi
}

# ==================== Phase 1: 后端API测试 ====================
echo -e "${YELLOW}Phase 1: 后端API测试${NC}"
echo "=========================================="
echo ""

# Test 1: 保存面试报告
echo "Test 1: 保存面试报告"
REPORT_DATA='{
  "userId": 1,
  "jobTitle": "前端工程师",
  "difficulty": "中级",
  "duration": 1200,
  "answers": [
    {
      "questionId": "q_1",
      "question": "什么是React Hooks?",
      "answer": "React Hooks是一种在函数组件中使用状态和其他React特性的方式",
      "score": 85
    },
    {
      "questionId": "q_2",
      "question": "解释useEffect的依赖数组",
      "answer": "依赖数组用于控制effect何时运行",
      "score": 60
    },
    {
      "questionId": "q_3",
      "question": "什么是虚拟DOM?",
      "answer": "虚拟DOM是React内存中的一个表示",
      "score": 90
    }
  ],
  "overallScore": 78,
  "technicalScore": 80,
  "communicationScore": 75,
  "logicalScore": 78,
  "summary": "本次面试表现良好，需要加强对Hooks的理解",
  "suggestions": ["深入学习React Hooks", "提高代码表达能力"]
}'

test_endpoint "保存面试报告" "POST" "/interview/save-report" "$REPORT_DATA" "201"

# 从响应中提取recordId
RECORD_ID=$(curl -s -X POST \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$REPORT_DATA" \
  "$API_BASE/interview/save-report" | jq -r '.data.recordId')

echo "获取到 recordId: $RECORD_ID"
echo ""

# Test 2: 查询错题列表
echo "Test 2: 查询错题列表"
test_endpoint "查询错题列表" "GET" "/interview/wrong-answers?recordId=$RECORD_ID" "" "200"
echo ""

# Test 3: 获取错题详情
echo "Test 3: 获取错题详情"
# 先获取一个错题ID
WRONG_ANSWER_ID=$(curl -s -X GET \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  "$API_BASE/interview/wrong-answers?recordId=$RECORD_ID" | jq -r '.data.items[0].id')

if [ ! -z "$WRONG_ANSWER_ID" ] && [ "$WRONG_ANSWER_ID" != "null" ]; then
  test_endpoint "获取错题详情" "GET" "/interview/wrong-answers/$WRONG_ANSWER_ID" "" "200"
else
  echo -e "${YELLOW}⚠ 跳过: 没有找到错题ID${NC}"
fi
echo ""

# Test 4: 提交重试答案
echo "Test 4: 提交重试答案"
if [ ! -z "$WRONG_ANSWER_ID" ] && [ "$WRONG_ANSWER_ID" != "null" ]; then
  RETRY_DATA='{
    "userAnswer": "依赖数组是一个数组，包含effect依赖的所有值。当依赖数组中的任何值改变时，effect会重新运行。如果依赖数组为空，effect只在组件挂载时运行一次。",
    "notes": "这次答案更加详细和准确"
  }'
  test_endpoint "提交重试答案" "POST" "/interview/wrong-answers/$WRONG_ANSWER_ID/retry" "$RETRY_DATA" "200"
else
  echo -e "${YELLOW}⚠ 跳过: 没有找到错题ID${NC}"
fi
echo ""

# Test 5: 更新学习笔记
echo "Test 5: 更新学习笔记"
if [ ! -z "$WRONG_ANSWER_ID" ] && [ "$WRONG_ANSWER_ID" != "null" ]; then
  NOTES_DATA='{
    "notes": "需要深入理解React Hooks的工作原理，特别是useEffect的依赖数组机制。建议阅读官方文档和相关博客文章。"
  }'
  test_endpoint "更新学习笔记" "PUT" "/interview/wrong-answers/$WRONG_ANSWER_ID/notes" "$NOTES_DATA" "200"
else
  echo -e "${YELLOW}⚠ 跳过: 没有找到错题ID${NC}"
fi
echo ""

# Test 6: 更新掌握度
echo "Test 6: 更新掌握度"
if [ ! -z "$WRONG_ANSWER_ID" ] && [ "$WRONG_ANSWER_ID" != "null" ]; then
  MASTERY_DATA='{
    "masterLevel": 75
  }'
  test_endpoint "更新掌握度" "PATCH" "/interview/wrong-answers/$WRONG_ANSWER_ID/mastery" "$MASTERY_DATA" "200"
else
  echo -e "${YELLOW}⚠ 跳过: 没有找到错题ID${NC}"
fi
echo ""

# Test 7: 获取面试记录列表
echo "Test 7: 获取面试记录列表"
test_endpoint "获取面试记录列表" "GET" "/interview/records" "" "200"
echo ""

# Test 8: 获取单个面试记录
echo "Test 8: 获取单个面试记录"
if [ ! -z "$RECORD_ID" ] && [ "$RECORD_ID" != "null" ]; then
  test_endpoint "获取单个面试记录" "GET" "/interview/records/$RECORD_ID" "" "200"
else
  echo -e "${YELLOW}⚠ 跳过: 没有找到recordId${NC}"
fi
echo ""

# ==================== 测试总结 ====================
echo "=========================================="
echo -e "${YELLOW}测试总结${NC}"
echo "=========================================="
echo -e "通过: ${GREEN}$TESTS_PASSED${NC}"
echo -e "失败: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}✗ 有测试失败${NC}"
  exit 1
fi
