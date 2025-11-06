#!/bin/bash

echo "🔍 诊断学习中心仪表盘..."
echo ""

# 检查组件文件
echo "📋 检查关键文件..."
ERRORS=0

# 检查主文件
if [ -f "frontend/src/views/questions/LearningHubDashboard.vue" ]; then
  echo "✅ LearningHubDashboard.vue"
  
  # 检查是否有基本的Vue结构
  if grep -q "<template>" "frontend/src/views/questions/LearningHubDashboard.vue" && \
     grep -q "<script setup>" "frontend/src/views/questions/LearningHubDashboard.vue" && \
     grep -q "<style scoped" "frontend/src/views/questions/LearningHubDashboard.vue"; then
    echo "  ✓ Vue 结构完整"
  else
    echo "  ✗ Vue 结构不完整"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ LearningHubDashboard.vue 不存在"
  ERRORS=$((ERRORS + 1))
fi

# 检查路由
echo ""
echo "🔗 检查路由配置..."
if grep -q "LearningHub" "frontend/src/router/index.js"; then
  echo "✅ LearningHub 路由已配置"
  
  if grep -q "/questions/hub" "frontend/src/router/index.js"; then
    echo "  ✓ /questions/hub 路由存在"
  else
    echo "  ✗ /questions/hub 路由缺失"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ LearningHub 路由未找到"
  ERRORS=$((ERRORS + 1))
fi

# 检查 Store 导入
echo ""
echo "📦 检查依赖导入..."
if grep -q "useDomainStore\|useQuestionBankStore" "frontend/src/views/questions/LearningHubDashboard.vue"; then
  echo "✅ Pinia Store 导入存在"
else
  echo "❌ Pinia Store 导入缺失"
  ERRORS=$((ERRORS + 1))
fi

# 检查子组件
echo ""
echo "🧩 检查子组件..."
COMPONENTS=(
  "CommandPalette.vue"
  "RecommendedForYouSection.vue"
  "DisciplineExplorerSection.vue"
  "LearningPathVisualization.vue"
  "DomainDetailSection.vue"
  "MyProgressPanel.vue"
  "MyFavoritesPanel.vue"
)

for comp in "${COMPONENTS[@]}"; do
  if [ -f "frontend/src/views/questions/components/$comp" ]; then
    echo "✅ $comp"
  else
    echo "❌ $comp 不存在"
    ERRORS=$((ERRORS + 1))
  fi
done

# 检查后端
echo ""
echo "🔌 检查后端连接..."
if curl -s http://localhost:3001/api/health | grep -q "UP"; then
  echo "✅ 后端服务正常"
else
  echo "⚠️ 后端服务不可用"
fi

# 检查前端
echo ""
echo "🌐 检查前端服务..."
if curl -s http://localhost:5175/ | grep -q "app"; then
  echo "✅ 前端服务正常"
else
  echo "⚠️ 前端服务不可用"
fi

echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
  echo "✨ 诊断完成！所有检查通过"
  echo ""
  echo "🎉 新UI已准备就绪！"
  echo "访问: http://localhost:5175/questions/hub"
else
  echo "⚠️ 发现 $ERRORS 个问题，请检查上述输出"
fi
echo "========================================="
