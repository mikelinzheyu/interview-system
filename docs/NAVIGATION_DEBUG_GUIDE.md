# 🔍 学科导航问题诊断指南

## 问题描述
在 http://localhost:5174/questions/hub 页面，点击学科卡片（如"哲学"）进入专业类选择界面时，出现无反应的情况。

---

## 📊 调试信息面板

### 位置
页面顶部，橙黄色的调试面板（标签为"当前层级"等）

### 显示信息
```
当前层级: [root/majorGroup/major/specialization]
当前学科: [学科名称或 "无"]
当前专业类: [专业类名称或 "无"]
已加载专业类数: [数字]
```

### 期望的状态变化

**点击学科前:**
```
当前层级: root
当前学科: 无
当前专业类: 无
已加载专业类数: 0
```

**点击学科后（正常）:**
```
当前层级: majorGroup
当前学科: 哲学
当前专业类: 无
已加载专业类数: 3 (或其他数字)
```

---

## 🔧 浏览器控制台日志诊断

### 打开开发者工具
1. 按 `F12` 或右键 → 检查
2. 切换到 **Console** 标签页
3. 在过滤框输入 `Disciplines` 或 `DisciplineExplorer` 筛选日志

### 关键日志信息

#### 1️⃣ 点击卡片后的预期日志序列

```
[DisciplineExplorer] 选择学科点击事件: 哲学
[DisciplineExplorer] 调用 selectDiscipline
[Disciplines] 选择学科: {id: "...", name: "哲学", ...}
[Disciplines] 当前状态 - currentDiscipline: {id: "...", name: "哲学", ...}
[Disciplines] 开始加载专业类，学科ID: xxx-xxx-xxx
[DisciplineExplorer] 加载专业类...
[Disciplines] 发送API请求: /disciplines/xxx-xxx-xxx/major-groups
[Disciplines] API 响应: {...}
[Disciplines] 解析后的专业类列表: [...]
[Disciplines] 专业类加载成功，共 3 个
[DisciplineExplorer] 专业类加载完成，当前状态: {...}
[DisciplineExplorer] currentLevel 计算结果: {level: "majorGroup", ...}
```

---

## 🚨 故障诊断

### 情况 1: 日志中没有看到任何 [DisciplineExplorer] 日志

**问题**: 点击事件未被触发

**检查清单**:
- [ ] 学科卡片是否可见？
- [ ] 尝试点击其他卡片
- [ ] 检查是否有 JavaScript 错误（红色叹号）
- [ ] 尝试刷新页面

**解决方法**:
```javascript
// 在浏览器控制台执行
document.querySelector('.discipline-card')?.click()
```

---

### 情况 2: 有 [DisciplineExplorer] 日志，但没有 [Disciplines] 日志

**问题**: selectDisciplineHandler 调用了，但 selectDiscipline 没有被执行

**检查清单**:
- [ ] 检查是否有红色 JavaScript 错误
- [ ] 检查 Pinia store 是否正确初始化

---

### 情况 3: 有 API 请求日志，但没有 API 响应日志

**问题**: API 调用发出了，但没有收到响应

**检查清单**:
- [ ] 打开浏览器 Network 标签页
- [ ] 查找 `major-groups` 请求
- [ ] 检查响应状态码（应该是 200）
- [ ] 检查响应数据格式

**检查 Network 标签页**:
1. 点击学科
2. 在 Network 标签页找到 `major-groups` 请求
3. 检查：
   - **Status**: 应该是 200
   - **Response**: 应该是 JSON 数组或对象
   - **Size**: 不应该是 0 bytes

---

### 情况 4: API 返回成功，但界面没有更新

**问题**: 数据加载了，但组件没有重新渲染

**检查清单**:
- [ ] 检查"已加载专业类数"是否大于 0
- [ ] 检查 currentLevel 是否变为 "majorGroup"
- [ ] 如果"已加载专业类数"仍是 0，说明 API 返回了空数据

**如果返回空数据**:
- API 端点可能返回了错误格式的数据
- 后端的 /disciplines/{id}/major-groups 可能没有正确实现
- 检查数据库中是否有该学科的专业类数据

---

## 📋 完整的故障排除流程

### 步骤 1: 清除浏览器缓存
```
Ctrl + Shift + Delete → 清除缓存 → 确定
然后刷新页面 (F5 或 Ctrl + R)
```

### 步骤 2: 打开调试工具
```
按 F12 → 切换到 Console 标签页
```

### 步骤 3: 清空日志
```
点击 Console 左上角的清空按钮（或输入 clear()）
```

### 步骤 4: 点击学科卡片
```
在主界面点击"哲学"卡片
观察 Console 中的日志输出
```

### 步骤 5: 分析日志

**如果看到预期的完整日志序列**:
- ✅ 问题可能是临时的（可以尝试重新加载）
- ✅ 可能与缓存有关

**如果日志在某一步停止**:
- 对照上面的"情况 1-4"进行诊断
- 记下最后一条日志，帮助开发人员定位问题

---

## 🔌 API 端点验证

### 手动测试 API

打开浏览器控制台，执行：

```javascript
// 1. 获取所有学科
fetch('/api/disciplines')
  .then(r => r.json())
  .then(data => {
    console.log('学科列表:', data)
    const philosophyId = data.find(d => d.name === '哲学')?.id
    return philosophyId
  })
  .then(id => {
    // 2. 获取哲学的专业类
    console.log('学科 ID:', id)
    return fetch(`/api/disciplines/${id}/major-groups`)
      .then(r => r.json())
      .then(data => {
        console.log('专业类列表:', data)
      })
  })
```

**预期输出**:
```
学科列表: [{id: "xxx", name: "哲学", ...}, ...]
学科 ID: xxx
专业类列表: [{id: "yyy", name: "哲学类", ...}, ...]
```

---

## 📝 收集调试信息

如果问题依然存在，请收集以下信息：

1. **浏览器版本**: 
   - F12 → Console → 右上角菜单 → 关于

2. **完整的控制台日志**:
   - F12 → Console → 右键 → Save as...

3. **Network 请求信息**:
   - F12 → Network → 刷新页面 → 点击学科 → 找到 major-groups 请求 → 右键 Copy as cURL

4. **页面 URL**:
   - 当前完整 URL

---

## 🎯 快速检查清单

使用此清单快速诊断问题：

- [ ] 浏览器是否显示任何红色错误？
- [ ] 调试面板中"当前层级"是否在点击后变为 "majorGroup"？
- [ ] 调试面板中"已加载专业类数"是否大于 0？
- [ ] Console 中是否有完整的日志链？
- [ ] Network 标签中 API 请求是否返回 200 状态码？
- [ ] API 响应中是否包含专业类数据？

如果上述都是 ✅，但界面仍未更新，这可能是 Vue 响应式系统的问题。

---

## 联系开发人员

提供以下信息以帮助快速解决问题：

```
问题: 点击学科卡片无反应

浏览器: [Chrome/Firefox/Safari/Edge] 版本号
操作系统: [Windows/Mac/Linux]

观察到的现象:
- 点击卡片后，调试面板显示: [复制调试面板内容]
- Console 日志显示: [复制相关日志]
- Network 请求: [是否显示 major-groups 请求]

已尝试的操作:
- [ ] 刷新页面
- [ ] 清除浏览器缓存
- [ ] 在 Incognito/隐身模式打开
- [ ] 尝试另一个浏览器
```

---

**最后更新**: 2024-11-06
**调试工具版本**: v1.0

