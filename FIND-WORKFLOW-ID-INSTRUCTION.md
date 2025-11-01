# 找到真正的 Workflow ID

## 问题

我们用 App ID (`882eab7a-f717-435c-987c-bb0a69c2c60d`) 返回了 404 错误：
```
"Workflow not found with id: 882eab7a-f717-435c-987c-bb0a69c2c60d"
```

这说明 **App ID ≠ Workflow ID**。

## 需要找的是什么

Dify API 需要的是 **Workflow Identifier**，不是 App ID。

这个 ID 应该在：
- Dify 工作流设置
- API 文档
- 或工作流的内部标识

## 方法 1: 在 Dify 的 API 文档中查看（推荐）

1. 打开工作流编辑页面
2. 在右上角找 "发布" 或 "设置" 按钮
3. 找 "API 访问" 或 "访问 API" 部分
4. 应该显示完整的 API 端点，格式如：
   ```
   POST https://api.dify.ai/v1/workflows/{workflow_id}/run
   ```
5. 复制 `{workflow_id}` 的值

## 方法 2: 从 HTML 页面源代码查看

1. 打开工作流编辑页面
2. 按 `F12` 打开开发者工具
3. 进入 Console 标签
4. 输入命令查看：
   ```javascript
   // 查看当前 URL 的所有参数
   console.log(window.location.href)

   // 查看 localStorage 中的工作流信息
   console.log(localStorage)

   // 查看页面中的元数据
   console.log(document.title)
   ```

5. 寻找类似 `workflow_id` 或 `workflow-id` 的值

## 方法 3: 从网络请求查看

1. 打开工作流编辑页面
2. 按 `F12` 打开开发者工具
3. 进入 Network 标签
4. 刷新页面
5. 查看请求列表，找到对 API 的调用
6. 查看请求 URL，应该包含真实的 Workflow ID

## 方法 4: 直接问 Dify 支持或文档

查看 Dify 官方文档：
- https://docs.dify.ai/
- 搜索 "workflow_id" 或 "API"

## 目标

我们需要找到的 ID 格式：
- 可能是 UUID (长格式，带 - 的)
- 可能是字符串标识符
- 通常不同于 App ID

## 优先级

1. **首选**: 在 Dify 工作流的 "API 访问" 或 "发布" 设置中找
2. **其次**: 在开发者工具 Network 标签中查看真实请求
3. **备选**: 检查浏览器 localStorage

## 你需要告诉我

一旦找到，告诉我：

```
Workflow1 ID (来自 API 文档或网络请求): ___________________
Workflow2 ID (来自 API 文档或网络请求): ___________________
```

## 提示

如果你看到 API 端点显示为：
```
POST https://api.dify.ai/v1/workflows/some-id-here/run
```

那么 `some-id-here` 就是我们需要的 Workflow ID！

---

**下一步**: 按照上面的方法找到真实的 Workflow ID，然后告诉我。
