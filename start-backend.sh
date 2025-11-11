#!/bin/bash

# 后端服务启动脚本
export JAVA_HOME="/d/code/Java/jdk-17"
export DB_PASSWORD="123456"
export REDIS_PASSWORD=""

echo "========================================="
echo "启动 AI面试系统 - Java后端服务"
echo "========================================="
echo ""
echo "环境配置："
echo "  Java: $JAVA_HOME"
echo "  Database: localhost:3306"
echo "  Redis: localhost:6379"
echo "  Port: 8080"
echo ""

cd "D:/code7/interview-system/backend-java"

echo "启动中..."
echo ""

java -Xms512m -Xmx1024m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -Dfile.encoding=UTF-8 \
  -Dspring.datasource.url="jdbc:mysql://localhost:3306/interview_system?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true" \
  -Dspring.datasource.username="root" \
  -Dspring.datasource.password="123456" \
  -jar target/interview-server.jar

