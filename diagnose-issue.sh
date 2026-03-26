#!/bin/bash

# 错题复盘系统 - 问题诊断脚本

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║           🔍 错题复盘系统 - 问题诊断                                       ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# 检查后端是否运行
echo "📊 检查后端服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 尝试连接到后端
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
  echo "✅ 后端服务运行中 (http://localhost:8080)"
elif curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "✅ 后端服务运行中 (http://localhost:3001)"
else
  echo "❌ 后端服务未运行"
  echo ""
  echo "💡 解决方案:"
  echo "   1. 打开新终端"
  echo "   2. 进入后端目录: cd backend"
  echo "   3. 启动后端: npm start"
  echo ""
fi

# 检查前端是否运行
echo ""
echo "📊 检查前端服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "✅ 前端服务运行中 (http://localhost:5173)"
elif curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ 前端服务运行中 (http://localhost:3000)"
else
  echo "❌ 前端服务未运行"
  echo ""
  echo "💡 解决方案:"
  echo "   1. 打开新终端"
  echo "   2. 进入前端目录: cd frontend"
  echo "   3. 启动前端: npm run dev"
  echo ""
fi

# 检查数据库连接
echo ""
echo "📊 检查数据库连接"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查 .env 文件
if [ -f "backend/.env" ]; then
  echo "✅ 后端 .env 文件存在"

  # 检查数据库配置
  if grep -q "DB_HOST" backend/.env; then
    DB_HOST=$(grep "DB_HOST" backend/.env | cut -d'=' -f2)
    DB_PORT=$(grep "DB_PORT" backend/.env | cut -d'=' -f2)
    echo "   数据库主机: $DB_HOST"
    echo "   数据库端口: $DB_PORT"
  fi
else
  echo "❌ 后端 .env 文件不存在"
fi

echo ""
echo "📋 问题排查清单"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "问题: 点击'错题复盘'时显示'未找到面试记录'"
echo ""
echo "可能原因和解决方案:"
echo ""
echo "1️⃣  后端服务未启动"
echo "   ❌ 症状: 无法保存面试报告到数据库"
echo "   ✅ 解决: 启动后端服务"
echo "      cd backend && npm start"
echo ""
echo "2️⃣  数据库连接失败"
echo "   ❌ 症状: 后端运行但无法保存数据"
echo "   ✅ 解决: 检查数据库配置和连接"
echo "      • 检查 backend/.env 中的数据库配置"
echo "      • 确保数据库服务正在运行"
echo "      • 检查数据库凭证是否正确"
echo ""
echo "3️⃣  API 端点错误"
echo "   ❌ 症状: 浏览器控制台显示 404 或 500 错误"
echo "   ✅ 解决: 检查 API 端点是否正确"
echo "      • 打开浏览器开发者工具 (F12)"
echo "      • 查看 Network 标签中的 POST /api/interview/save-report 请求"
echo "      • 检查响应状态码和错误信息"
echo ""
echo "4️⃣  sessionStorage 未保存 recordId"
echo "   ❌ 症状: 报告保存成功但 recordId 未保存"
echo "   ✅ 解决: 检查浏览器控制台"
echo "      • 打开浏览器开发者工具 (F12)"
echo "      • 在控制台运行: sessionStorage.getItem('interview_record_id')"
echo "      • 如果返回 null，说明 recordId 未保存"
echo ""
echo "5️⃣  面试报告数据不完整"
echo "   ❌ 症状: report.overallScore 为 0 或 report.answers 为空"
echo "   ✅ 解决: 确保完成了完整的面试"
echo "      • 检查面试报告页面是否显示了答题内容"
echo "      • 检查浏览器控制台中的日志"
echo ""

echo ""
echo "🔧 调试步骤"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Step 1: 打开浏览器开发者工具"
echo "   按 F12 或右键 → 检查"
echo ""
echo "Step 2: 查看 Console 标签"
echo "   查找 '[InterviewReportV2]' 开头的日志"
echo "   • 如果看到 '✅ 报告已保存'，说明保存成功"
echo "   • 如果看到错误信息，复制错误信息"
echo ""
echo "Step 3: 查看 Network 标签"
echo "   • 刷新页面"
echo "   • 完成面试"
echo "   • 查看 POST /api/interview/save-report 请求"
echo "   • 检查响应状态码和响应体"
echo ""
echo "Step 4: 检查 Application 标签"
echo "   • 展开 Storage → Session Storage"
echo "   • 查找 'interview_record_id' 键"
echo "   • 检查是否有值"
echo ""

echo ""
echo "📝 常见错误和解决方案"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "错误 1: POST /api/interview/save-report 404"
echo "原因: 后端服务未启动或路由未正确挂载"
echo "解决:"
echo "  1. 确保后端已启动: cd backend && npm start"
echo "  2. 检查 backend/routes/api.js 中是否挂载了 interviewRouter"
echo ""

echo "错误 2: POST /api/interview/save-report 500"
echo "原因: 后端处理请求时出错，通常是数据库连接问题"
echo "解决:"
echo "  1. 检查后端日志中的错误信息"
echo "  2. 确保数据库已启动"
echo "  3. 检查 backend/.env 中的数据库配置"
echo ""

echo "错误 3: 网络错误或超时"
echo "原因: 后端服务未响应"
echo "解决:"
echo "  1. 检查后端是否正在运行"
echo "  2. 检查防火墙设置"
echo "  3. 尝试访问 http://localhost:8080/health"
echo ""

echo ""
echo "✅ 完整的启动流程"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "终端 1 - 启动后端:"
echo "  cd backend"
echo "  npm install"
echo "  npm start"
echo ""
echo "终端 2 - 启动前端:"
echo "  cd frontend"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "然后:"
echo "  1. 打开浏览器访问前端地址"
echo "  2. 完成一次面试"
echo "  3. 查看面试报告"
echo "  4. 点击'错题复盘'按钮"
echo ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "如果问题仍未解决，请检查:"
echo "  1. 浏览器控制台中的完整错误信息"
echo "  2. 后端服务的日志输出"
echo "  3. 数据库连接状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
