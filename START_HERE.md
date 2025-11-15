# ⚡ 快速启动指南 - 现在就开始

## 🎯 你现在需要做什么

### **第 1 步：重启后端**

在命令行运行：

```bash
cd D:\code7\interview-system\backend
node mock-server.js
```

**看到这个消息说明成功：**
```
✅ 状态: Dify API 已配置
   API Key: app-Bj1UccX9v9X...W5paG
   ⚡ 将使用 Dify API 进行实时对话
```

### **第 2 步：启动前端（新的终端窗口）**

```bash
cd D:\code7\interview-system\frontend
npm run dev
```

### **第 3 步：打开浏览器**

```
http://localhost:5174/community/posts/1
```

### **第 4 步：测试 AI 对话**

在右侧 AI 助手输入一个问题，例如：
```
Java 中如何处理异步操作？
```

**现在你会看到真实的 AI 回复（不是 Mock 数据）！**

---

## ✅ 对比

### **之前（Mock 模式）**
```
问：Java 异步
答：这是 AI 对你提问的一个回复。它会逐字显示在前端。
    ❌ 固定回复，不考虑实际问题
```

### **现在（Dify API）**
```
问：Java 中如何处理异步操作？
答：Java 提供了多种异步处理机制：
    1. CompletableFuture - 用于异步计算和回调
    2. FutureTask - 实现 Runnable 和 Future 接口
    3. Reactive 框架 - 异步数据流处理
    ✅ 真实的 AI 生成，理解你的问题
```

---

## 🔍 验证成功标志

打开浏览器 F12 → Console，应该看到：

```
✅ [ChatFeature] 发送消息 - URL: http://localhost:3001/api/ai/chat/stream
✅ [ChatFeature] 收到数据: {type: "chunk", content: "Java 中..."}
✅ [ChatFeature] 对话完成
```

不应该看到：
```
❌ [AI/Chat] Chat API not configured, using mock data
```

---

## 🚨 常见问题

### Q：仍然看到 "这是 AI 对你提问的一个回复"

**A：** 说明后端没有重启。按照步骤 1 重新启动后端。

### Q：后端启动失败，说端口被占用

**A：** 强制清理：
```bash
taskkill /F /IM node.exe
# 等待 3 秒，再启动
node mock-server.js
```

### Q：AI 还是没有理解我的问题

**A：**

1. 确保看到启动日志中的 "✅ Dify API 已配置"
2. 刷新浏览器
3. 再尝试提问

---

## 🎉 完成！

现在你可以享受：

- ✅ **真实 AI 对话** - 不是关键词匹配
- ✅ **多轮对话** - conversationId 会被复用
- ✅ **对话历史** - 刷新后仍能看到以前的消息
- ✅ **上下文感知** - AI 理解文章内容和你的问题

祝你使用愉快！🚀
