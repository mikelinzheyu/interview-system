#!/bin/bash
# ==============================================
# AI面试系统 - 一键生产部署脚本
# 用法: bash deploy.sh
# ==============================================

set -e

REGISTRY="crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com/ai_interview"
BACKEND_IMAGE="$REGISTRY/ai_interview_backend:latest"
FRONTEND_IMAGE="$REGISTRY/ai_interview_frontend:latest"
SERVER="ubuntu@47.76.110.106"
REMOTE_DIR="/home/ubuntu/interview-system"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()   { echo -e "${GREEN}✅${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️ ${NC} $1"; }
fail() { echo -e "${RED}❌${NC} $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║         AI面试系统 - 生产环境部署                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: 登录阿里云镜像仓库 ──────────────────────────
log "Step 1/5  登录阿里云镜像仓库..."
docker login crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com || fail "登录失败，请检查凭证"
ok "登录成功"

# ── Step 2: 构建镜像 ─────────────────────────────────────
log "Step 2/5  构建后端镜像..."
docker build -t "$BACKEND_IMAGE" -f backend/Dockerfile.prod backend/ || fail "后端镜像构建失败"
ok "后端镜像构建完成"

log "         构建前端镜像..."
docker build -t "$FRONTEND_IMAGE" -f frontend/Dockerfile.prod frontend/ || fail "前端镜像构建失败"
ok "前端镜像构建完成"

# ── Step 3: 推送镜像 ─────────────────────────────────────
log "Step 3/5  推送后端镜像..."
docker push "$BACKEND_IMAGE" || fail "后端镜像推送失败"
ok "后端镜像推送完成"

log "         推送前端镜像..."
docker push "$FRONTEND_IMAGE" || fail "前端镜像推送失败"
ok "前端镜像推送完成"

# ── Step 4: 同步配置文件到服务器 ─────────────────────────
log "Step 4/5  同步配置文件到服务器..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR/nginx/ssl $REMOTE_DIR/logs"
scp docker-compose.prod.yml "$SERVER:$REMOTE_DIR/"
scp .env.prod "$SERVER:$REMOTE_DIR/.env"
scp -r nginx/ "$SERVER:$REMOTE_DIR/"
ok "配置文件同步完成"

# ── Step 5: 服务器拉取并重启 ─────────────────────────────
log "Step 5/5  服务器拉取镜像并重启服务..."
ssh "$SERVER" bash << REMOTE
  set -e
  cd $REMOTE_DIR

  echo "拉取最新镜像..."
  docker login crpi-ez54q3vldx3th6xj.cn-hongkong.personal.cr.aliyuncs.com

  docker compose -f docker-compose.prod.yml pull backend frontend

  echo "重启服务..."
  docker compose -f docker-compose.prod.yml up -d --remove-orphans

  echo "等待服务启动 (30s)..."
  sleep 30

  echo "检查容器状态..."
  docker compose -f docker-compose.prod.yml ps

  echo "检查后端健康..."
  curl -sf http://localhost:3001/health && echo " ✅ 后端正常" || echo " ❌ 后端异常"
REMOTE

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  🎉 部署完成！访问 https://viewself.cn 验证      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
