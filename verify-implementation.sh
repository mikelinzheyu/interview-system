#!/bin/bash

# 代码验证脚本 - 检查实现的正确性

echo "=========================================="
echo "错题复盘系统 - 代码验证"
echo "=========================================="
echo ""

PASS=0
FAIL=0

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_file() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $description - 文件不存在: $file"
    FAIL=$((FAIL + 1))
  fi
}

check_content() {
  local file=$1
  local pattern=$2
  local description=$3

  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $description"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $description"
    FAIL=$((FAIL + 1))
  fi
}

echo -e "${YELLOW}Phase 1: 后端文件检查${NC}"
echo "=========================================="

check_file "backend/models/InterviewRecord.js" "InterviewRecord 模型"
check_file "backend/models/WrongAnswerReview.js" "WrongAnswerReview 模型"
check_file "backend/services/interviewService.js" "Interview 服务层"
check_file "backend/routes/interview.js" "Interview 路由"

echo ""
echo -e "${YELLOW}Phase 2: 前端文件检查${NC}"
echo "=========================================="

check_file "frontend/src/views/wrong-answers/InterviewReplayView.vue" "InterviewReplayView 组件"
check_file "frontend/src/router/index.js" "路由配置"

echo ""
echo -e "${YELLOW}Phase 1: 后端代码内容检查${NC}"
echo "=========================================="

check_content "backend/models/InterviewRecord.js" "interview_records" "InterviewRecord 表名"
check_content "backend/models/WrongAnswerReview.js" "wrong_answer_reviews" "WrongAnswerReview 表名"
check_content "backend/services/interviewService.js" "saveInterviewReport" "saveInterviewReport 函数"
check_content "backend/services/interviewService.js" "getWrongAnswers" "getWrongAnswers 函数"
check_content "backend/services/interviewService.js" "submitRetry" "submitRetry 函数"
check_content "backend/services/interviewService.js" "updateMasteryLevel" "updateMasteryLevel 函数"
check_content "backend/routes/interview.js" "POST.*save-report" "save-report 路由"
check_content "backend/routes/interview.js" "GET.*wrong-answers" "wrong-answers 查询路由"
check_content "backend/routes/interview.js" "POST.*retry" "retry 提交路由"
check_content "backend/routes/interview.js" "PATCH.*mastery" "mastery 更新路由"

echo ""
echo -e "${YELLOW}Phase 2: 前端代码内容检查${NC}"
echo "=========================================="

check_content "frontend/src/views/interview/InterviewReportV2.vue" "saveReportToDatabase" "报告保存函数"
check_content "frontend/src/views/interview/InterviewReportV2.vue" "goToReplay" "跳转到复盘函数"
check_content "frontend/src/views/interview/InterviewReportV2.vue" "错题复盘" "复盘按钮"
check_content "frontend/src/views/wrong-answers/InterviewReplayView.vue" "Reference Mode" "参考模式"
check_content "frontend/src/views/wrong-answers/InterviewReplayView.vue" "Practice Mode" "练习模式"
check_content "frontend/src/views/wrong-answers/InterviewReplayView.vue" "submitPractice" "提交练习函数"
check_content "frontend/src/views/wrong-answers/InterviewReplayView.vue" "updateMastery" "更新掌握度函数"
check_content "frontend/src/router/index.js" "/interview/replay" "复盘路由"

echo ""
echo -e "${YELLOW}API 端点检查${NC}"
echo "=========================================="

check_content "backend/routes/interview.js" "POST.*save-report" "POST /api/interview/save-report"
check_content "backend/routes/interview.js" "GET.*wrong-answers" "GET /api/interview/wrong-answers"
check_content "backend/routes/interview.js" "GET.*wrong-answers.*:id" "GET /api/interview/wrong-answers/:id"
check_content "backend/routes/interview.js" "POST.*wrong-answers.*retry" "POST /api/interview/wrong-answers/:id/retry"
check_content "backend/routes/interview.js" "PUT.*wrong-answers.*notes" "PUT /api/interview/wrong-answers/:id/notes"
check_content "backend/routes/interview.js" "PATCH.*wrong-answers.*mastery" "PATCH /api/interview/wrong-answers/:id/mastery"
check_content "backend/routes/interview.js" "GET.*records" "GET /api/interview/records"
check_content "backend/routes/interview.js" "GET.*records.*:id" "GET /api/interview/records/:id"

echo ""
echo -e "${YELLOW}数据库模型字段检查${NC}"
echo "=========================================="

check_content "backend/models/InterviewRecord.js" "userId" "InterviewRecord: userId"
check_content "backend/models/InterviewRecord.js" "jobTitle" "InterviewRecord: jobTitle"
check_content "backend/models/InterviewRecord.js" "answers.*JSONB" "InterviewRecord: answers (JSONB)"
check_content "backend/models/InterviewRecord.js" "overallScore" "InterviewRecord: overallScore"

check_content "backend/models/WrongAnswerReview.js" "userId" "WrongAnswerReview: userId"
check_content "backend/models/WrongAnswerReview.js" "recordId" "WrongAnswerReview: recordId"
check_content "backend/models/WrongAnswerReview.js" "masterLevel" "WrongAnswerReview: masterLevel"
check_content "backend/models/WrongAnswerReview.js" "retryAnswers.*JSONB" "WrongAnswerReview: retryAnswers (JSONB)"
check_content "backend/models/WrongAnswerReview.js" "learningNotes" "WrongAnswerReview: learningNotes"

echo ""
echo -e "${YELLOW}路由挂载检查${NC}"
echo "=========================================="

check_content "backend/routes/api.js" "interviewRouter" "导入 interviewRouter"
check_content "backend/routes/api.js" "router.use.*interview.*interviewRouter" "挂载 interviewRouter"

echo ""
echo "=========================================="
echo -e "${YELLOW}验证总结${NC}"
echo "=========================================="
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ 所有代码验证通过！${NC}"
  echo ""
  echo "下一步:"
  echo "1. 启动后端: cd backend && npm start"
  echo "2. 启动前端: cd frontend && npm run dev"
  echo "3. 按照 TESTING_GUIDE.md 进行测试"
  exit 0
else
  echo -e "${RED}✗ 有验证失败，请检查代码${NC}"
  exit 1
fi
