# 贡献者个人资料页优化方案 (Contributor Profile Optimization)

## 1. 现状分析 (Current Status Analysis)

当前页面 (`/contributions/profile/:userId`) 功能较为基础，存在以下问题：
- **视觉设计简单**：主要以简单的卡片和列表堆叠，缺乏层次感和现代感。
- **信息展示不足**：用户信息仅有头像和ID，缺少昵称、等级、简介等。
- **交互性弱**：数据展示主要为静态文本，缺乏图表和可视化互动。
- **数据映射Bug**：
    - 前端期望 `activityLog` (action/description)，后端返回 `recentActivity` (type/title)。
    - 前端期望 `submissionCount`，后端返回 `contributionCount`。
    - 导致部分区域显示为空。

## 2. 优化目标 (Optimization Goals)

1.  **提升视觉体验**：采用现代化的布局（侧边栏+多标签页），使用 ECharts 进行数据可视化。
2.  **丰富信息维度**：增加用户等级、雷达图、贡献热力图等。
3.  **修复现有缺陷**：修正前后端字段不匹配的问题。
4.  **增强互动感**：通过标签页减少页面滚动，提升信息获取效率。

## 3. 详细设计方案 (Detailed Design)

### 3.1 布局重构 (Layout Redesign)

采用 **左右分栏** 布局：
- **左侧 (300px)**: 个人信息概览卡片。
- **右侧 (自适应)**: 主要内容区域（包含 Tabs）。

### 3.2 左侧：个人信息卡片 (Profile Sidebar)

包含元素：
- **大头像**：居中展示。
- **用户昵称 & ID**：清晰展示。
- **当前等级/头衔**：例如 "高级贡献者" (根据积分计算)。
- **积分概览**：醒目的总积分展示。
- **个人简介**：(新增) "这个人很懒，什么都没写~" (支持编辑入口)。
- **社交链接**：(新增) GitHub, 个人网站等图标。
- **加入时间**：展示注册或首次贡献时间。

### 3.3 右侧：主要内容区域 (Main Content)

使用 `el-tabs` 划分为四个板块：

#### Tab 1: 概览 (Overview)
- **核心指标卡片**：保留现有的 提交数、通过数、通过率、总积分，但优化样式（添加渐变背景、更精致的图标）。
- **能力雷达图 (Ability Radar)**：使用 ECharts 展示 `expertise` 数据，直观呈现用户在 "计算机"、"金融" 等不同领域的专业度。
- **贡献热力图 (Contribution Heatmap)**：仿 GitHub 风格，展示过去一年的贡献活跃度（需模拟数据或聚合日志）。

#### Tab 2: 徽章墙 (Badges)
- **分类展示**：将徽章分为 "已获得" 和 "未获得" (激励用户)。
- **详细提示**：Hover 显示获取条件和获取时间。
- **稀有度特效**：为高级徽章添加光效边框。

#### Tab 3: 贡献记录 (Submissions)
- **列表展示**：展示最近的提交记录列表。
- **状态标签**：使用不同颜色的 Tag (`已通过`, `审核中`, `被拒绝`)。
- **快捷跳转**：点击可查看题目详情。

#### Tab 4: 动态 (Activity)
- **富文本时间轴**：修复数据映射 bug。
- **图标区分**：不同类型的动态（提交、审核、修订、获得徽章）使用不同的 Timeline 图标和颜色。

## 4. 数据结构修正 (Data Structure Fixes)

需要修改后端 Mock 数据或前端适配层，统一字段命名：

| 字段含义 | 前端期望 (Frontend) | 后端现状 (Backend) | 修正方案 |
| :--- | :--- | :--- | :--- |
| **动态列表** | `activityLog` | `recentActivity` | 统一为 `activityLog` |
| **动态类型** | `action` | `type` | 统一为 `action` |
| **动态描述** | `description` | `title` | 统一为 `description` |
| **领域贡献数** | `submissionCount` | `contributionCount` | 统一为 `submissionCount` |

## 5. 实施步骤 (Implementation Steps)

1.  **Phase 1: 数据修复**
    - 修改 `backend/mock-server.js` 中的 `contributorProfiles` 数据结构，匹配前端或修改前端适配。
    - 确保当前页面不报错且能显示数据。

2.  **Phase 2: UI 框架重构**
    - 创建新的布局结构 (Grid / Flex)。
    - 引入 `v-chart` 或直接使用 `echarts` 组件。

3.  **Phase 3: 组件细节开发**
    - 开发 `RadarChart` 组件。
    - 开发 `ContributionHeatmap` 组件 (简易版)。
    - 美化 Badge 和 Timeline 样式。

4.  **Phase 4: 整合与测试**
    - 验证所有数据展示正确。
    - 检查响应式表现。

## 6. 预览效果 (Visual Preview Description)

> 页面左侧是一个悬浮的卡片，展示着用户的头像和 "Lv.5 专家" 的金色标签。
> 右侧首先映入眼帘的是一个五维雷达图，显示该用户在 "前端" 和 "算法" 方面极强。
> 下方是绿色的格子热力图，记录着他连续 30 天的打卡记录。
> 切换到 "徽章" 标签，一枚闪闪发光的 "十全十美" 勋章正静静躺在那里。
