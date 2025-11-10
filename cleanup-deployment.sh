#!/bin/bash
# 清理旧的部署目录
# 在服务器上运行此脚本来清理 /opt/interview-system 目录

set -e

echo "======================================="
echo "清理旧部署目录脚本"
echo "======================================="
echo ""

# 进入旧目录
cd /opt/interview-system 2>/dev/null || {
  echo "⚠️  /opt/interview-system 目录不存在，无需清理"
  exit 0
}

echo "📂 当前目录：$(pwd)"
echo ""

# 停止并移除所有容器
echo "🛑 停止并移除容器..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || {
  echo "⚠️  docker-compose down 执行失败或文件不存在，继续清理..."
}

echo "✅ 容器清理完成"
echo ""

# 回到上级目录
cd /opt
echo "📂 进入上级目录：$(pwd)"
echo ""

# 删除旧目录
echo "🗑️  删除旧的部署目录..."
rm -rf interview-system
echo "✅ 旧目录已删除"
echo ""

echo "======================================="
echo "✅ 清理完成！"
echo "现在可以重新运行 GitHub Actions 工作流"
echo "======================================="
