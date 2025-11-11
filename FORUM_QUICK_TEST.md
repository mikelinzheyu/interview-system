# 论坛功能快速测试指南

## 🎯 测试目标

验证论坛页面能否正确显示帖子列表（使用 Mock 数据）

## 📋 测试步骤

### 1. 启动应用
```bash
# 在 frontend 目录
npm run dev

# 输出应该显示：
# VITE v5.x ready in xxx ms
# ➜  Local:   http://localhost:5174/
```

### 2. 访问论坛首页
```
地址: http://localhost:5174/community/forums
```

预期结果：
- ✅ 页面加载成功
- ✅ 显示论坛板块列表
- ✅ 显示统计信息（总帖子数、活跃板块等）
- ✅ 显示热门标签

### 3. 访问帖子列表
```
地址: http://localhost:5174/community/posts
```

预期结果：
- ✅ 页面加载成功
- ✅ **显示 5 条示例帖子**（这是关键！）
  - "如何深入理解 Vue 3 的响应式系统？"
  - "React Hooks 最佳实践总结"
  - "前端性能优化从入门到精通"
  - "TypeScript 高级特性详解"
  - "Node.js 服务器最佳实践"
- ✅ 显示分页器（共 5 篇）
- ✅ 显示搜索和排序功能

### 4. 测试搜索功能
```
操作: 在搜索框输入 "Vue"
```

预期结果：
- ✅ 过滤结果显示仅包含 "Vue" 的帖子（1 条）
- ✅ 统计信息更新为 "共 1 篇"

### 5. 测试排序功能
```
操作: 选择 "最热" 排序
```

预期结果：
- ✅ 帖子按点赞数排序
- ✅ "前端性能优化从入门到精通"（42 个赞）显示在最前

### 6. 测试点赞功能
```
操作: 点击任意帖子的"❤️"图标
```

预期结果：
- ✅ 图标变红
- ✅ 点赞数 +1
- ✅ 页面无刷新，即时反馈

### 7. 查看浏览器控制台
```
F12 → Console 标签
```

预期日志：
```
[Socket] 正在连接 WebSocket 服务... ws://localhost:3001
[Socket] WebSocket 已连接
Community posts API not available, using mock data
```

✅ 看到 "using mock data" 说明 Mock 数据正常工作

## 🐛 故障排除

### 问题 1: 看不到帖子列表
**原因**: API 响应格式不正确或超时

**解决**:
1. 打开浏览器开发者工具 (F12)
2. Network 标签 → 搜索 "posts"
3. 查看请求是否返回 404 或其他错误
4. 检查控制台是否显示 "using mock data"

### 问题 2: 图标显示错误
**原因**: Element Plus 版本问题

**解决**:
```bash
npm install @element-plus/icons-vue@latest
npm run dev
```

### 问题 3: 数据加载缓慢
**原因**: 缓存或网络问题

**解决**:
1. 清除浏览器缓存
2. 按 Ctrl+Shift+R 硬刷新
3. 打开浏览器开发者工具，Disable cache

## ✅ 测试检查表

- [ ] 论坛首页加载成功
- [ ] 帖子列表显示 5 条数据
- [ ] 搜索功能正常
- [ ] 排序功能正常
- [ ] 点赞功能有即时反馈
- [ ] 控制台无错误（仅 Mock 数据警告）
- [ ] 分页功能正常
- [ ] 标签过滤功能正常

## 📊 预期的 Mock 数据

```json
{
  "data": [
    {
      "id": "1",
      "title": "如何深入理解 Vue 3 的响应式系统？",
      "author": { "name": "张三" },
      "likes": 15,
      "tags": ["Vue3", "响应式"]
    },
    {
      "id": "2",
      "title": "React Hooks 最佳实践总结",
      "author": { "name": "李四" },
      "likes": 28,
      "tags": ["React", "Hooks"],
      "pinned": true
    },
    ...
  ],
  "total": 5
}
```

## 🎉 成功标志

- ✅ 显示 5 条帖子
- ✅ 所有交互功能正常
- ✅ 控制台显示 "using mock data"
- ✅ 页面响应迅速（缓存生效）

---

## 后续步骤

当后端实现 API 后，以上测试将自动使用真实数据：
1. 后端部署 `/community/posts` API
2. 刷新前端页面
3. 自动切换为真实数据（无需代码修改）

**无缝切换，无需重新开发！** 🚀
