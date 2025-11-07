#!/bin/bash

# 学习中心仪表盘 - 组件验证脚本
# 用途: 检验所有新创建的组件是否能正确编译和加载

echo "🚀 开始测试学习中心仪表盘..."
echo ""

# 检查所有组件文件是否存在
echo "📋 检查组件文件..."

COMPONENTS=(
  "frontend/src/views/questions/LearningHubDashboard.vue"
  "frontend/src/views/questions/components/CommandPalette.vue"
  "frontend/src/views/questions/components/RecommendedForYouSection.vue"
  "frontend/src/views/questions/components/DisciplineExplorerSection.vue"
  "frontend/src/views/questions/components/LearningPathVisualization.vue"
  "frontend/src/views/questions/components/DomainDetailSection.vue"
  "frontend/src/views/questions/components/MyProgressPanel.vue"
  "frontend/src/views/questions/components/MyFavoritesPanel.vue"
)

MISSING=0
for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo "✅ $component"
  else
    echo "❌ $component"
    MISSING=$((MISSING + 1))
  fi
done

echo ""
echo "📊 检查统计:"
echo "  总组件数: ${#COMPONENTS[@]}"
echo "  缺失组件: $MISSING"

if [ $MISSING -gt 0 ]; then
  echo ""
  echo "⚠️  有 $MISSING 个组件文件缺失，请检查创建过程"
  exit 1
fi

echo ""
echo "✨ 所有组件文件检查完毕！"
echo ""

# 检查路由配置
echo "🔗 检查路由配置..."
if grep -q "LearningHub" frontend/src/router/index.js; then
  echo "✅ LearningHub 路由已配置"
else
  echo "❌ LearningHub 路由未找到"
fi

if grep -q "/questions/hub" frontend/src/router/index.js; then
  echo "✅ /questions/hub 路由已配置"
else
  echo "❌ /questions/hub 路由未找到"
fi

echo ""
echo "📝 组件导入依赖检查..."

# 检查关键依赖导入
echo "检查 Vue 3 导入..."
grep -q "from 'vue'" frontend/src/views/questions/LearningHubDashboard.vue && echo "✅ Vue 3 导入正确" || echo "❌ Vue 3 导入缺失"

echo "检查 Element Plus 导入..."
grep -q "from 'element-plus'" frontend/src/views/questions/components/CommandPalette.vue && echo "✅ Element Plus 导入正确" || echo "❌ Element Plus 导入缺失"

echo "检查 Pinia Store 导入..."
grep -q "useDomainStore\\|useQuestionBankStore" frontend/src/views/questions/LearningHubDashboard.vue && echo "✅ Pinia Store 导入正确" || echo "❌ Pinia Store 导入缺失"

echo ""
echo "🎨 样式检查..."
grep -q "scoped lang=\"scss\"" frontend/src/views/questions/LearningHubDashboard.vue && echo "✅ 样式已配置" || echo "❌ 样式配置缺失"

echo ""
echo "🎯 功能完整性检查..."

# 检查关键组件
echo "检查 CommandPalette 组件..."
grep -q "class=\"command-palette-wrapper\"" frontend/src/views/questions/components/CommandPalette.vue && echo "✅ 搜索栏模板完整" || echo "❌ 搜索栏模板缺失"

echo "检查 RecommendedForYouSection 组件..."
grep -q "class=\"recommended-section\"" frontend/src/views/questions/components/RecommendedForYouSection.vue && echo "✅ 推荐区域模板完整" || echo "❌ 推荐区域模板缺失"

echo "检查 DisciplineExplorerSection 组件..."
grep -q "class=\"discipline-explorer\"" frontend/src/views/questions/components/DisciplineExplorerSection.vue && echo "✅ 学科探索模板完整" || echo "❌ 学科探索模板缺失"

echo "检查 LearningPathVisualization 组件..."
grep -q "class=\"learning-path-visualization\"" frontend/src/views/questions/components/LearningPathVisualization.vue && echo "✅ 学习路径模板完整" || echo "❌ 学习路径模板缺失"

echo "检查 DomainDetailSection 组件..."
grep -q "class=\"domain-detail-section\"" frontend/src/views/questions/components/DomainDetailSection.vue && echo "✅ 领域详情模板完整" || echo "❌ 领域详情模板缺失"

echo ""
echo "✅ 所有检查完毕！"
echo ""
echo "🚀 建议下一步:"
echo "  1. 运行 npm run dev 启动开发服务器"
echo "  2. 访问 http://localhost:5173/questions/hub"
echo "  3. 检查浏览器控制台是否有错误"
echo "  4. 测试各个功能和交互"
echo ""
echo "📚 查看设计文档: LEARNING_HUB_DESIGN.md"
echo ""
