#!/bin/bash

# 自动重试推送到 GitHub 脚本
# 当网络恢复时自动推送

MAX_RETRIES=30
RETRY_INTERVAL=30  # 秒

echo "🚀 开始推送 Git 提交到 GitHub..."
echo "📊 配置: 最多尝试 $MAX_RETRIES 次，间隔 $RETRY_INTERVAL 秒"
echo ""

for ((i = 1; i <= MAX_RETRIES; i++)); do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 第 $i/$MAX_RETRIES 次尝试..."

  if git push origin main 2>/dev/null; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "📌 提交信息:"
    git log --oneline -2
    echo ""
    exit 0
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    echo "⏳ 推送失败，${RETRY_INTERVAL}秒后重试..."
    sleep $RETRY_INTERVAL
    echo ""
  fi
done

echo ""
echo "❌ 推送失败！已尝试 $MAX_RETRIES 次"
echo ""
echo "💡 建议:"
echo "1. 检查网络连接: ping github.com"
echo "2. 检查 Git 配置: git remote -v"
echo "3. 手动推送: git push origin main"
exit 1
