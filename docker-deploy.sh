#!/bin/bash
# AI面试系统 Docker 生产环境部署脚本

echo "🚀 AI面试系统 Docker 生产环境部署"
echo "=================================="

# 检查Docker是否可用
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未找到Docker，请先安装Docker"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ 错误: Docker守护进程未运行，请启动Docker Desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: 未找到docker-compose，请先安装"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs/{frontend,backend,redis,proxy}
mkdir -p data/redis
mkdir -p nginx/ssl

# 检查环境文件
if [[ ! -f .env.production ]]; then
    echo "❌ 错误: 未找到 .env.production 文件"
    echo "请复制 .env.example 为 .env.production 并配置必要的参数"
    exit 1
fi

# 停止已存在的容器
echo "🛑 停止现有容器..."
docker-compose --env-file .env.production down --remove-orphans

# 构建镜像
echo "🔨 构建Docker镜像..."
echo "  构建后端镜像..."
docker-compose --env-file .env.production build --no-cache backend

echo "  构建前端镜像..."
docker-compose --env-file .env.production build --no-cache frontend

# 启动服务
echo "🚀 启动服务..."
docker-compose --env-file .env.production up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 进行健康检查..."

# 检查后端
echo "  检查后端服务..."
if curl -f http://localhost:8080/api/health &> /dev/null; then
    echo "  ✅ 后端服务正常"
else
    echo "  ❌ 后端服务异常"
fi

# 检查前端
echo "  检查前端服务..."
if curl -f http://localhost:80/health &> /dev/null; then
    echo "  ✅ 前端服务正常"
else
    echo "  ❌ 前端服务异常"
fi

# 显示状态
echo ""
echo "📊 服务状态:"
docker-compose --env-file .env.production ps

echo ""
echo "🎉 部署完成！"
echo ""
echo "📱 访问地址:"
echo "  前端应用: http://localhost"
echo "  API服务: http://localhost:8080"
echo "  健康检查: http://localhost/health"
echo ""
echo "📝 常用命令:"
echo "  查看日志: docker-compose --env-file .env.production logs -f"
echo "  停止服务: docker-compose --env-file .env.production down"
echo "  重启服务: docker-compose --env-file .env.production restart"
echo ""
echo "🔧 如果遇到问题，请检查日志或联系技术支持"