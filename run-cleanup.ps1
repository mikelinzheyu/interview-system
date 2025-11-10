# 一键清理部署目录脚本 (PowerShell 版本)
# 在本地机器上运行，自动连接到服务器并清理

$ErrorActionPreference = "Stop"

# 配置
$SERVER_IP = "47.76.110.106"
$SERVER_USER = "root"
$SERVER_PORT = 22
$DEPLOY_PATH = "/opt/interview-system"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "🚀 开始执行服务器清理" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 服务器信息:" -ForegroundColor Yellow
Write-Host "   IP: $SERVER_IP"
Write-Host "   用户: $SERVER_USER"
Write-Host "   端口: $SERVER_PORT"
Write-Host "   清理目录: $DEPLOY_PATH"
Write-Host ""

# 检查 SSH 连接
Write-Host "⏳ 检查 SSH 连接..." -ForegroundColor Yellow
try {
  ssh -p $SERVER_PORT "$SERVER_USER@$SERVER_IP" "echo 'SSH 连接成功'" | Out-Null 2>&1
  Write-Host "✅ SSH 连接成功" -ForegroundColor Green
} catch {
  Write-Host "❌ SSH 连接失败！" -ForegroundColor Red
  Write-Host ""
  Write-Host "请确保:" -ForegroundColor Yellow
  Write-Host "  1. 服务器 IP 正确（当前：$SERVER_IP）"
  Write-Host "  2. SSH 密钥已配置"
  Write-Host "  3. 网络连接正常"
  Write-Host ""
  exit 1
}
Write-Host ""

# 远程执行清理命令
Write-Host "🛑 在服务器上执行清理..." -ForegroundColor Yellow
Write-Host ""

$cleanup_commands = @"
set -e

echo "📂 进入部署目录..."
cd /opt/interview-system 2>/dev/null || {
  echo "⚠️  /opt/interview-system 目录不存在，无需清理"
  exit 0
}

echo "📂 当前目录：\$(pwd)"
echo ""

echo "🛑 停止现有容器..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || {
  echo "⚠️  docker-compose down 失败，继续清理文件..."
}

echo "✅ 容器已停止"
echo ""

echo "📂 返回上级目录..."
cd /opt

echo "🗑️  删除旧部署目录..."
rm -rf interview-system

echo "✅ 旧目录已删除"
echo ""

echo "✅ 服务器清理完成！"
"@

try {
  ssh -p $SERVER_PORT "$SERVER_USER@$SERVER_IP" $cleanup_commands
  Write-Host ""
  Write-Host "=======================================" -ForegroundColor Green
  Write-Host "✅ 清理成功！" -ForegroundColor Green
  Write-Host "=======================================" -ForegroundColor Green
} catch {
  Write-Host ""
  Write-Host "❌ 清理失败！" -ForegroundColor Red
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "📋 后续步骤:" -ForegroundColor Cyan
Write-Host "  1. 打开 GitHub Actions: https://github.com/mikelinzheyu/interview-system/actions"
Write-Host "  2. 找到最新失败的工作流"
Write-Host "  3. 点击 'Re-run all jobs' 重新部署"
Write-Host "  4. 等待部署完成"
Write-Host ""
Write-Host "⏱️  部署通常需要 5-10 分钟" -ForegroundColor Yellow
Write-Host ""
