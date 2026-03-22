#!/bin/bash

# 推送到 GitHub 的脚本（网络恢复后运行）
set -e

echo "🚀 尝试推送到 GitHub..."
echo ""

# 检查待推送的提交
echo "📋 待推送提交："
git log origin/main..HEAD --oneline
echo ""

# 尝试直接推送
echo "📤 方式1: 直接推送..."
if git push origin main; then
    echo "✅ 推送成功！"
    echo ""
    echo "🎉 GitHub Actions 正在运行部署..."
    echo "📍 查看: https://github.com/mikelinzheyu/interview-system/actions"
    exit 0
fi

# 如果失败，使用代理
echo ""
echo "⚠️  直接推送失败，尝试使用代理..."
git remote set-url origin https://ghproxy.cn/https://github.com/mikelinzheyu/interview-system.git

if git push origin main; then
    echo "✅ 代理推送成功！"
    git remote set-url origin https://github.com/mikelinzheyu/interview-system.git
    echo ""
    echo "🎉 GitHub Actions 正在运行部署..."
    echo "📍 查看: https://github.com/mikelinzheyu/interview-system/actions"
    exit 0
fi

echo ""
echo "❌ 推送失败，请检查网络连接"
git remote set-url origin https://github.com/mikelinzheyu/interview-system.git
exit 1
