#!/bin/bash

# 推送修复到 GitHub 的自动脚本
# 当网络恢复时运行此脚本

set -e

echo "🚀 开始推送到 GitHub..."
echo ""

# 检查本地提交
echo "📋 本地提交信息："
git log --oneline -3
echo ""

# 检查网络连接
echo "🔍 检查网络连接到 GitHub..."
if timeout 5 curl -I https://github.com 2>/dev/null | head -1; then
    echo "✅ 网络连接正常"
else
    echo "⚠️  网络可能有问题，继续尝试..."
fi

echo ""
echo "📤 正在推送..."

# 尝试推送
if git push origin main; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "🎉 GitHub Actions 现在会自动运行部署流程"
    echo "📍 查看运行状态：https://github.com/mikelinzheyu/interview-system/actions"
    exit 0
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "🔧 故障排查："
    echo "  1. 检查网络连接：ping github.com"
    echo "  2. 查看git状态：git status"
    echo "  3. 检查提交：git log --oneline -1"
    echo "  4. 尝试其他代理："
    echo "     git remote set-url origin https://ghproxy.cn/https://github.com/mikelinzheyu/interview-system.git"
    echo "     git push origin main"
    exit 1
fi
