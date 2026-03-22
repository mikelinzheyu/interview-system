#!/bin/bash

# 推送修改到 GitHub 的脚本
# 如果直接推送失败，可以使用此脚本进行重试

echo "🚀 开始推送代码到 GitHub..."

# 方式1：尝试使用 ghproxy 代理推送（国内服务器推荐）
echo "⏳ 尝试方式1：使用 GitHub 加速镜像代理..."
git remote set-url origin https://ghproxy.cn/https://github.com/mikelinzheyu/interview-system.git
if git push origin main; then
  echo "✅ 通过代理推送成功！"
  git remote set-url origin https://github.com/mikelinzheyu/interview-system.git
  exit 0
fi

# 方式2：尝试直接推送
echo ""
echo "⏳ 尝试方式2：直接推送到 GitHub..."
git remote set-url origin https://github.com/mikelinzheyu/interview-system.git
if git push origin main; then
  echo "✅ 直接推送成功！"
  exit 0
fi

# 方式3：查看本地提交状态
echo ""
echo "⏳ 推送失败，显示本地提交信息..."
git log --oneline -5
echo ""
echo "本地已提交但未推送的更改："
git status
echo ""
echo "💡 建议：稍后网络恢复时，再次运行此脚本或手动执行："
echo "   git push origin main"
