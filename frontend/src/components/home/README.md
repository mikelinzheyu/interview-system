# Home 组件库

## 概述

首页美化设计方案的核心组件集合。

## 组件清单

### 1. HeroSection.vue - 英雄欢迎区
**文件**: `HeroSection.vue`
**作用**: 展示欢迎信息和主要 CTA 按钮
**特性**:
- ✅ 紫蓝渐变背景
- ✅ 装饰几何图形
- ✅ 居中文案布局
- ✅ 3 个快捷按钮
- ✅ 完全响应式
- ✅ 平滑加载动画

**用法**:
```vue
<HeroSection />
```

**Props**: 无（自动读取用户名）

---

### 2. StatsCard.vue - 统计卡片
**文件**: `StatsCard.vue`
**作用**: 展示单个统计数据的玻璃态卡片
**特性**:
- ✅ 玻璃态背景 (rgba + blur)
- ✅ 图标 + 数字 + 单位
- ✅ 趋势箭头和百分比
- ✅ 可点击链接到详情页
- ✅ 悬停升起效果

**用法**:
```vue
<StatsCard
  label="面试次数"
  :value="88"
  unit="次"
  :icon="VideoCamera"
  icon-color="#409eff"
  :trend="{ direction: 'up', percent: 12, period: '月' }"
  route="/interview/history"
  clickable
/>
```

**Props**:
| 属性 | 类型 | 说明 |
|------|------|------|
| label | String | 统计项标签 |
| value | String/Number | 主数值 |
| unit | String | 单位 |
| icon | Object | 图标组件 |
| iconColor | String | 图标颜色 |
| trend | Object | 趋势数据 {direction, percent, period} |
| subtitle | String | 副标题 |
| clickable | Boolean | 是否可点击 |
| route | String | 点击跳转的路由 |

---

### 3. FeatureCard.vue - 功能卡片
**文件**: `FeatureCard.vue`
**作用**: 展示功能入口的玻璃态卡片
**特性**:
- ✅ 玻璃态背景
- ✅ 图标 + 标题 + 描述 + 按钮
- ✅ 悬停升起和阴影加深
- ✅ 可点击按钮导航

**用法**:
```vue
<FeatureCard
  title="AI 模拟面试"
  description="与 AI 进行真实的面试对话，提升面试技能"
  button-text="开始面试"
  :icon="VideoCamera"
  icon-color="#409eff"
  route="/interview/new"
/>
```

**Props**:
| 属性 | 类型 | 说明 |
|------|------|------|
| title | String | 卡片标题 |
| description | String | 卡片描述 |
| buttonText | String | 按钮文字 |
| icon | Object | 图标组件 |
| iconColor | String | 图标颜色 |
| route | String | 点击按钮跳转的路由 |

---

## 样式规范

### 玻璃态效果 (Glass Morphism)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}
```

### 悬停效果
```css
.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
}
```

### 渐变背景
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 响应式断点
- **Desktop**: ≥ 1200px - 完整显示
- **Tablet**: 768-1199px - 优化布局
- **Mobile**: < 768px - 单列布局

---

## 集成示例 (Home.vue)

```vue
<template>
  <div class="home">
    <!-- Hero Section -->
    <HeroSection />

    <!-- Stats Grid -->
    <div class="stats-grid">
      <StatsCard
        v-for="stat in stats"
        :key="stat.key"
        v-bind="stat"
      />
    </div>

    <!-- Features Grid -->
    <div class="feature-section">
      <div class="feature-grid">
        <FeatureCard
          v-for="feature in features"
          :key="feature.key"
          v-bind="feature"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.feature-section {
  margin-bottom: 40px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .stats-grid,
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

---

## 性能优化

### 动画优化
- ✅ 使用 `cubic-bezier(0.4, 0, 0.2, 1)` 缓动函数
- ✅ 过渡时间 0.3s
- ✅ 只变换 `transform` 和 `box-shadow` 属性
- ✅ 避免重排 (reflow)

### 响应式优化
- ✅ 使用 `grid-template-columns: repeat(auto-fit, ...)`
- ✅ 弹性布局适应不同屏幕
- ✅ 移动端 flex-wrap 堆叠

---

## 浏览器兼容性

| 浏览器 | 支持 | 备注 |
|--------|------|------|
| Chrome | ✅ | 完全支持 |
| Firefox | ✅ | 完全支持 |
| Safari | ✅ | 需要 -webkit- 前缀 |
| Edge | ✅ | 完全支持 |
| IE11 | ❌ | 不支持 backdrop-filter |

**注**: backdrop-filter 需要浏览器支持，在不支持的浏览器中会优雅降级显示白色背景。

---

## 常见问题

### Q: 如何更改渐变背景色？
**A**: 修改 HeroSection.vue 中的：
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Q: 如何禁用悬停效果？
**A**: 移除样式中的 `:hover` 规则，或添加 `pointer-events: none`

### Q: 如何改变卡片宽度？
**A**: 在父容器的 grid 中修改 `minmax(250px, 1fr)` 的第一个参数

---

## 更新日志

### v1.0 (2024-10-21)
- ✅ 新增 HeroSection 组件
- ✅ 新增 StatsCard 组件
- ✅ 新增 FeatureCard 组件
- ✅ 实现玻璃态效果
- ✅ 完成响应式设计
- ✅ 添加动画效果

---

## 相关文档

- 设计方案: `HOMEPAGE_BEST_PRACTICES_FINAL.md`
- 快速开始: `HOMEPAGE_QUICK_START.md`
- 完整指南: `HOMEPAGE_DESIGN_GUIDE.md`
