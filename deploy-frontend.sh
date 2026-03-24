#!/bin/bash

# ============================================
# 前端重新部署脚本
# 用于修复网络异常问题
# ============================================

set -e

echo "=========================================="
echo "开始前端重新部署流程"
echo "=========================================="

# 1. 进入前端目录
cd "$(dirname "$0")/frontend"
echo "✓ 进入前端目录"

# 2. 清理旧的构建
echo ""
echo "清理旧的构建文件..."
rm -rf dist node_modules/.vite
echo "✓ 清理完成"

# 3. 安装依赖
echo ""
echo "安装依赖..."
npm install
echo "✓ 依赖安装完成"

# 4. 构建生产版本
echo ""
echo "构建生产版本..."
npm run build
echo "✓ 生产版本构建完成"

# 5. 验证构建
if [ -d "dist" ]; then
    echo "✓ 构建目录存在"
    echo "  文件数量: $(find dist -type f | wc -l)"
else
    echo "✗ 构建失败：dist 目录不存在"
    exit 1
fi

echo ""
echo "=========================================="
echo "前端构建完成！"
echo "=========================================="
echo ""
echo "后续步骤："
echo "1. 提交代码: git add . && git commit -m 'fix: update frontend API URLs for cloud deployment'"
echo "2. 推送代码: git push origin main"
echo "3. SSH到ECS: ssh ubuntu@iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com"
echo "4. 拉取代码: cd /home/ubuntu/interview-system && git pull origin main"
echo "5. 重新部署: docker-compose -f docker-compose.prod.yml up -d --build"
echo "6. 验证: curl http://iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com/health"
echo ""
