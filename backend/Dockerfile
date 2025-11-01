# Node.js Mock API 服务器 Dockerfile
# 使用 Node.js 官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache curl tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# 复制应用文件
COPY package.json ./
COPY mock-server.js ./
COPY websocket-server.js ./
COPY redis-client.js ./

# 安装依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --only=production || npm install || true && \
    npm cache clean --force || true

# 创建日志目录
RUN mkdir -p /app/logs && \
    chown -R nodeuser:nodejs /app

# 切换到非root用户
USER nodeuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=30s \
    CMD curl -f http://localhost:3001/api/health || exit 1

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "mock-server.js"]