# ====================================================
# 存储服务 Dockerfile (Node.js)
# ====================================================

FROM node:18-alpine

# 安装所需工具
RUN apk add --no-cache curl

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --only=production

# 复制应用代码
COPY app.js ./

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=30s \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# 启动应用
CMD ["node", "app.js"]
