# 错题本 UI/UX 深度重构方案 (V2)

## 1. 现状分析与差距
目前的实现 (`http://localhost:5174/wrong-answers`) 虽然功能逻辑已打通，但在视觉和交互细腻度上与目标 (`test12`) 存在本质差距：

| 维度 | 当前实现 (Element Plus) | 目标效果 (Test12 / Tailwind) | 差距原因 |
| :--- | :--- | :--- | :--- |
| **组件质感** | 较厚重，默认 Padding 大 | 轻量、高密度、精致 | Element 组件自带样式难以覆盖 |
| **图标系统** | Element Icons (粗线条) | **Lucide Icons** (细线条、现代) | 图标库风格不同 |
| **排版细节** | 默认 14px/16px | 大量使用 **10px/12px** 微型字体 | 缺乏 Tailwind 的 `text-xs`, `text-[10px]` 工具类 |
| **交互反馈** | 基础 Hover | **精细的 Group Hover** (悬停显示操作栏、上浮阴影) | CSS 状态控制不足 |
| **色彩体系** | Element 默认蓝 | **Indigo (靛蓝) + Slate (岩灰)** | 缺少 Tailwind 色板变量 |

## 2. 重构核心策略： "去 Element 化"

为了达到 `test12` 的像素级还原，必须**抛弃 Element Plus 的展示型组件** (`el-card`, `el-tag`, `el-button` 用于列表页)，转而使用**原生 HTML + CSS Utility Classes** 进行重写。

### 2.1 技术栈调整
-   **图标库**: 引入 `lucide-vue-next` (替代 `@element-plus/icons-vue`)，这是 `test12` 使用的图标库的 Vue 版本。
-   **样式引擎**: 扩充 `wrong-answers-refactor.scss`，手动实现 `test12` 用到的 Tailwind 工具类 (如 `text-[10px]`, `ring-1`, `backdrop-blur-md`)。

## 3. 详细执行步骤

### 第一阶段：基础设施 (Infrastructure)
1.  **安装依赖**: `npm install lucide-vue-next`
2.  **样式原子化**: 在 SCSS 中定义核心 Utility Classes，直接复刻 Tailwind 的命名规范，方便从 React 代码 copy 结构。
    *   *Colors*: `bg-indigo-50`, `text-slate-500`, `border-rose-200`
    *   *Typography*: `text-xs`, `font-bold`, `tracking-wider`
    *   *Effects*: `shadow-sm`, `hover:shadow-md`, `transition-all`

### 第二阶段：核心组件重写 (MistakeCard)
**目标**: 100% 还原 `test12/components/MistakeCard.tsx`。
-   **结构**: 移除 `<el-card>`, 使用 `<div class="group relative bg-white ...">`。
-   **标签**: 移除 `<el-tag>`, 使用 `<span class="px-2 py-0.5 rounded ...">`。
-   **操作栏**: 实现 `opacity-0 group-hover:opacity-100` 效果。
-   **选中态**: 实现点击卡片任意位置选中，点击文字进入详情的逻辑。

### 第三阶段：布局重写 (Page Layout)
-   **侧边栏**: 移除 Element Menu/Tabs，使用 `flex col` + `button` 实现自定义侧边栏，还原 "Badge 计数" 和 "选中高亮" 样式。
-   **顶部栏**: 自定义 Header，包含 "排序下拉" (自定义样式) 和 "视图切换"。
-   **批量操作栏**: 悬浮在底部的白色圆角 Bar，完全复刻 `test12` 的阴影和布局。

### 第四阶段：详情页适配
-   **练习模式**: 仿照 `test12` 的大输入框设计。
-   **复盘模式**: 引入 SVG 环形进度条 (不使用 `el-progress`)，还原 "AI 诊断卡片" 的红/黄/蓝边框设计。

## 4. 预期效果
执行本方案后，页面将不再有 "管理后台" 的既视感，而是呈现出 "现代 SaaS 产品" 的视觉风格，完全匹配您提供的参考截图和代码。

---

**请确认是否开始执行此 V2 方案？(需安装 lucide-vue-next)**
