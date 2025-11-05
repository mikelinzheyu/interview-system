# ====================================================
# AI面试系统 - Java后端服务 Dockerfile
# 支持Spring Boot应用的多阶段构建
# ====================================================

# ==================== 构建阶段 ====================
FROM node:18-alpine AS build

WORKDIR /build

# Install JDK and Maven on Alpine
RUN apk add --no-cache openjdk17 maven bash curl git

# 首先复制pom.xml以利用Docker缓存
COPY pom.xml /build/

# 使用国内Maven镜像加速构建
RUN mkdir -p /root/.m2 && \
    printf '<?xml version="1.0" encoding="UTF-8"?>\n<settings>\n  <mirrors>\n    <mirror>\n      <id>aliyun</id>\n      <mirrorOf>central</mirrorOf>\n      <name>Aliyun Maven</name>\n      <url>https://maven.aliyun.com/repository/public</url>\n    </mirror>\n  </mirrors>\n</settings>' > /root/.m2/settings.xml

# 下载依赖（利用Docker层缓存）
RUN mvn -v && mvn dependency:go-offline -B || true

# 复制源代码
COPY src /build/src

# 构建应用
RUN mvn clean package -DskipTests -Dmaven.test.skip=true

# ==================== 运行阶段 ====================
FROM node:18-alpine

# 安装必要工具
RUN apk add --no-cache openjdk17-jre curl

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用目录和用户
RUN addgroup -g 1001 -S appuser && adduser -S appuser -u 1001 -G appuser
WORKDIR /app

# 从构建阶段复制JAR文件
COPY --from=build /build/target/*.jar /app/app.jar

# 创建日志目录
RUN mkdir -p /app/logs /app/uploads && \
    chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# JVM优化参数
ENV JAVA_OPTS="-Xms512m -Xmx1024m \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+HeapDumpOnOutOfMemoryError \
    -XX:HeapDumpPath=/app/logs/heap_dump.hprof \
    -Djava.security.egd=file:/dev/./urandom \
    -Dfile.encoding=UTF-8"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=60s \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
