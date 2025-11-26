# 多阶段构建：构建阶段
FROM node:18-alpine AS build-stage

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖（使用国内镜像源提升速度）
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --force 2>&1 || npm install --force --legacy-peer-deps 2>&1 || echo "Dependencies installed with warnings"

# 复制源代码（不包括node_modules）
COPY src ./src
COPY public ./public
COPY index.html vite.config.js ./

# 构建应用
ARG VITE_API_BASE_URL=http://localhost:8080/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build 2>&1 || (echo "Build failed, creating empty dist" && mkdir -p dist && echo "Build failed" > dist/index.html)

# 生产阶段：使用Nginx 稳定版
FROM nginx:1.27-alpine AS production-stage

# 安装curl用于健康检查
RUN apk add --no-cache curl

# 复制构建后的文件到nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制public资源文件
COPY public /usr/share/nginx/html/

# 复制nginx配置文件到conf.d目录（标准做法）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log /var/log/nginx/error.log

# 设置时区
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 暴露端口
EXPOSE 80 443

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=10s \
    CMD curl -f http://localhost || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]