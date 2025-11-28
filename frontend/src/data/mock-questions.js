// Local mock data for question bank pages to avoid backend dependency
const now = new Date().toISOString()

// 预置的标签，用于筛选面板和统计
export const mockQuestionTags = [
  { id: 'vue', name: 'Vue.js', count: 4 },
  { id: 'javascript', name: 'JavaScript', count: 5 },
  { id: 'performance', name: '性能优化', count: 3 },
  { id: 'network', name: '网络', count: 3 },
  { id: 'algorithm', name: '算法', count: 2 },
  { id: 'database', name: '数据库', count: 2 },
  { id: 'ai-basics', name: 'AI 基础', count: 0 },
  { id: 'machine-learning', name: '机器学习', count: 0 },
  { id: 'deep-learning', name: '深度学习', count: 0 },
  { id: 'nlp', name: '自然语言处理', count: 0 },
  { id: 'cv', name: '计算机视觉', count: 0 },
  { id: 'mlops', name: '模型部署与 MLOps', count: 0 },
  { id: 'reinforcement-learning', name: '强化学习', count: 0 }
]

// 预置分类树，用于左侧分类筛选
export const mockQuestionCategories = {
  tree: [
    {
      id: 'frontend',
      name: '前端工程',
      children: [
        { id: 'frontend-frameworks', name: '框架与生态', children: [] },
        { id: 'frontend-engineering', name: '工程化与性能', children: [] }
      ]
    },
    {
      id: 'backend',
      name: '后端与数据库',
      children: [
        { id: 'backend-api', name: 'API 设计', children: [] },
        { id: 'backend-db', name: '数据库', children: [] }
      ]
    },
    {
      id: 'ai',
      name: '人工智能',
      children: [
        { id: 'ai-basics', name: 'AI 基础', children: [] },
        { id: 'ml-classic', name: '传统机器学习', children: [] },
        { id: 'dl-neural-net', name: '深度学习与神经网络', children: [] },
        { id: 'nlp', name: '自然语言处理', children: [] },
        { id: 'cv', name: '计算机视觉', children: [] },
        { id: 'ai-engineering', name: 'AI 工程与部署', children: [] }
      ]
    }
  ],
  flat: [
    { id: 'frontend', name: '前端工程', parentId: null },
    { id: 'frontend-frameworks', name: '框架与生态', parentId: 'frontend' },
    { id: 'frontend-engineering', name: '工程化与性能', parentId: 'frontend' },
    { id: 'backend', name: '后端与数据库', parentId: null },
    { id: 'backend-api', name: 'API 设计', parentId: 'backend' },
    { id: 'backend-db', name: '数据库', parentId: 'backend' },
    { id: 'ai', name: '人工智能', parentId: null },
    { id: 'ai-basics', name: 'AI 基础', parentId: 'ai' },
    { id: 'ml-classic', name: '传统机器学习', parentId: 'ai' },
    { id: 'dl-neural-net', name: '深度学习与神经网络', parentId: 'ai' },
    { id: 'nlp', name: '自然语言处理', parentId: 'ai' },
    { id: 'cv', name: '计算机视觉', parentId: 'ai' },
    { id: 'ai-engineering', name: 'AI 工程与部署', parentId: 'ai' }
  ]
}

// 题目列表（含前端/后端示例 + 人工智能 50 题）
export const mockQuestions = [
  // ===== 前端 / 后端示例题 =====
  {
    id: 101,
    title: 'Vue 3 响应式核心流程',
    brief: '解释 Proxy + effect 的依赖收集与触发更新的基本步骤。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['vue', 'javascript'],
    domainId: 'frontend',
    categoryId: 'frontend-frameworks',
    question: '简要说明在 Vue 3 中，基于 Proxy 的响应式系统是如何完成依赖收集和触发更新的？',
    answer: 'Vue 3 会在 getter 中通过 track 记录当前活跃的 effect 与被访问的属性之间的依赖关系，在 setter 中通过 trigger 找出受影响的 effect 并重新执行，实现数据变化到视图更新的链路。',
    explanation: '可以从“响应式对象 → 依赖收集表 → effect”的角度描述：读取属性时记录依赖，写入属性时根据依赖表调度更新；同时配合调度器实现批量更新与异步渲染。',
    stats: { attempts: 182, correctCount: 160 },
    createdAt: now
  },
  {
    id: 102,
    title: '实现一个简单的防抖与节流',
    brief: '描述实现思路并给出适用场景，例如搜索输入与滚动监听。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 'frontend',
    categoryId: 'frontend-engineering',
    question: '什么是函数防抖（debounce）和节流（throttle）？请分别给出实现思路并说明适用场景。',
    answer: '防抖是在事件频繁触发时，只在最后一次触发后等待一段时间再执行函数；节流是在固定时间窗口内只允许函数执行一次。前者适合输入搜索框，后者适合滚动、窗口 resize 等高频事件。',
    explanation: '防抖通常用定时器实现，在新的触发到来时清除上一次定时器；节流可以用时间戳或定时器记录上一次执行时间，在间隔未到时直接丢弃后续调用，从而控制调用频率。',
    stats: { attempts: 143, correctCount: 109 },
    createdAt: now
  },
  {
    id: 103,
    title: '前端性能指标 FCP/LCP/CLS',
    brief: '解释 FCP、LCP、CLS 的含义以及如何在埋点中采集这些指标。',
    difficulty: 'medium',
    type: 'multiple_choice',
    tags: ['javascript', 'performance'],
    domainId: 'frontend',
    categoryId: 'frontend-engineering',
    question: '下列关于 Web 性能指标的说法哪些是正确的？',
    options: [
      { id: 'A', text: 'FCP 表示首次渲染任何文本或图片的时间' },
      { id: 'B', text: 'LCP 关注视口内最大内容元素渲染完成的时间' },
      { id: 'C', text: 'CLS 反映页面布局抖动程度，越大越好' },
      { id: 'D', text: 'FCP 和 LCP 都越小越好' }
    ],
    correctOptions: ['A', 'B', 'D'],
    answer: '正确选项为 A、B、D。',
    explanation: 'FCP 是首次内容绘制时间，LCP 是最大内容绘制时间，都希望越短越好以提升首屏体验；CLS 是累计布局偏移，反映视觉稳定性，值越小越好，因此 C 错误。',
    stats: { attempts: 96, correctCount: 69 },
    createdAt: now
  },
  {
    id: 201,
    title: 'RESTful API 设计最佳实践',
    brief: '从资源建模、HTTP 动词、状态码和分页过滤几个维度说明设计要点。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['network'],
    domainId: 'backend',
    categoryId: 'backend-api',
    question: '在设计 RESTful API 时，资源路径、HTTP 方法和状态码一般如何规范使用？',
    answer: '通常使用名词复数表示资源，如 /users；使用 GET、POST、PUT、PATCH、DELETE 对应查询、新增、整体更新、部分更新和删除；状态码方面 2xx 表示成功，4xx 表示客户端错误，5xx 表示服务端错误。结合分页、过滤和排序参数可以提升接口可用性。',
    explanation: '强调以资源为中心的设计思想，而不是以动作为中心；同时建议保持幂等性，合理使用 201 和 204 等码，并在错误响应中返回结构化错误信息以便前端处理。',
    stats: { attempts: 88, correctCount: 71 },
    createdAt: now
  },
  {
    id: 202,
    title: '数据库事务的四大特性（ACID）',
    brief: '说明原子性、一致性、隔离性和持久性的含义，并举例说明隔离级别。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['database'],
    domainId: 'backend',
    categoryId: 'backend-db',
    question: '简要解释数据库事务的 ACID 四大特性，并说明常见隔离级别能解决哪些并发异常。',
    answer: '原子性指事务中的操作要么全部成功要么全部失败；一致性指事务前后数据满足所有约束；隔离性指并发事务之间互不干扰；持久性指一旦提交结果就会持久保存。隔离级别如读已提交、可重复读、串行化分别用于解决脏读、不可重复读和幻读等问题。',
    explanation: '可以结合具体业务场景说明，例如转账必须保证两个账户余额同时更新；不同数据库实现细节不同，但都围绕 ACID 特性来设计事务机制。',
    stats: { attempts: 77, correctCount: 53 },
    createdAt: now
  },
  {
    id: 203,
    title: '二叉树的层序遍历实现',
    brief: '给出迭代和递归两种写法的核心思路，通常会使用队列实现迭代版本。',
    difficulty: 'easy',
    type: 'coding',
    tags: ['algorithm', 'javascript'],
    domainId: 'backend',
    categoryId: 'backend-api',
    question: '请用伪代码描述如何实现二叉树的层序遍历（广度优先遍历），并说明时间和空间复杂度。',
    answer: '可以使用队列，从根节点入队，循环弹出队首节点并访问，再将其左右子节点入队，直到队列为空。时间复杂度 O(n)，空间复杂度最坏 O(n)。',
    explanation: '层序遍历是典型的广度优先搜索，适合按层处理节点的场景；在某些语言中也可以借助数组模拟队列以提高性能。',
    stats: { attempts: 102, correctCount: 93 },
    createdAt: now
  },

  // ===== 前端工程领域题目（domainId: 2, slug: frontend-engineering） =====
  {
    id: 2001,
    title: '前端工程化的核心目标',
    brief: '从效率、质量、协作和可维护性四个维度说明前端工程化要解决的问题。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '前端工程化的核心目标有哪些？请从开发效率、代码质量、团队协作和可维护性几个方面进行概括。',
    answer: '前端工程化的目标是用规范化的工程体系来提升开发效率、保障代码质量、降低协作成本，并让复杂前端项目在多人长期维护下依然可控。',
    explanation: '可以从“工具链 + 规范 + 流程”来展开：通过脚手架和模块化提高效率，通过 ESLint/Prettier/TypeScript 保证质量，通过 Git Flow、代码评审和 CI/CD 降低协作成本，再用监控、日志和自动化测试保证长期可维护性。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2002,
    title: 'ES Modules 与 Tree Shaking 的关系',
    brief: '说明为什么现代打包器进行 Tree Shaking 时通常要求使用 ES Module 语法。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript', 'performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '为什么现代前端打包器在做 Tree Shaking 时更偏好 ES Modules 而不是 CommonJS？需要哪些前提条件 Tree Shaking 才能有效生效？',
    answer: '因为 ES Modules 在语法层面是静态可分析的，导入导出关系在编译期就能确定，打包器可以安全删除未被引用的导出；而 CommonJS 是动态的，依赖关系往往只能在运行时确定，难以可靠消除死代码。',
    explanation: '可以提到 ESM 的静态结构（import/export 必须在顶层、不能动态改变）便于构建工具做依赖图分析和 DCE；同时需要保证库本身是“无副作用的”或正确声明 sideEffects，代码不能通过全局变量或导入顺序产生隐形副作用，否则 Tree Shaking 可能被保守处理而不删除。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2003,
    title: '代码分割与按需加载',
    brief: '描述前端项目中常见的代码分割方式及其对首屏性能的影响。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在单页应用中，常见的代码分割与按需加载方式有哪些？它们分别适合解决什么类型的性能问题？',
    answer: '常见方式包括按路由分割、按组件分割和按业务模块分割，通过动态 import 实现懒加载，可以显著降低首屏所需的 JS 体积，把不常用页面或重组件推迟到真正需要时再加载。',
    explanation: '可以结合 Vue Router 或 React Router 中的路由懒加载示例，说明首屏只下载当前路由相关的代码，其余路由拆到独立 chunk；还可以提到对第三方组件库或图表库做异步加载，避免一次性加载所有功能导致白屏时间过长。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2004,
    title: '静态资源指纹与缓存策略',
    brief: '解释为什么生产环境常用 hash 文件名结合强缓存，以及更新上线时如何避免缓存失效问题。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['performance', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '生产环境中为什么建议为 JS/CSS 等静态资源开启长时间强缓存，并配合内容哈希（如 main.[hash].js）？这对上线流程有什么影响？',
    answer: '强缓存可以让浏览器长期复用已下载的资源，显著减少重复请求；配合基于内容的哈希命名，当文件内容变化时生成新文件名，旧资源继续命中缓存，新版本自动生效，从而实现“缓存友好”的灰度升级。',
    explanation: '可以说明 Cache-Control: max-age=31536000, immutable 这类策略适合带 hash 的静态资源；而 index.html 通常只做短缓存，通过引用的新哈希文件让客户端自动加载新版本，这样既避免频繁下载，又不会遇到“缓存刷不掉”的问题。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2005,
    title: 'HTTP 缓存中的强缓存与协商缓存',
    brief: '对比强缓存和协商缓存的触发条件与典型响应头配置。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '从浏览器行为角度说明强缓存和协商缓存的区别，并分别举例说明常用的响应头配置。',
    answer: '强缓存命中时浏览器不会发起请求，而是直接使用本地缓存副本，典型通过 Cache-Control 和 Expires 控制；协商缓存命中时浏览器会带上 If-None-Match 或 If-Modified-Since 发请求，由服务器根据 ETag 或 Last-Modified 判断是否返回 304。',
    explanation: '可以结合时间线说明：强缓存更适合带内容指纹的静态资源；协商缓存可用于变更不频繁但又不能长时间强缓存的接口或页面；实际工程中经常同时配置 Cache-Control + ETag，前者控制强缓存时间，过期后再走协商缓存以降低带宽消耗。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2006,
    title: 'CSR、SSR 与 SSG 的区别',
    brief: '从首屏时间、SEO、服务端压力等维度比较几种渲染模式的适用场景。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '对比纯客户端渲染（CSR）、服务端渲染（SSR）和静态站点生成（SSG），它们在首屏性能、SEO 和工程复杂度上的主要差异是什么？',
    answer: 'CSR 首屏依赖 JS 下载和执行，结构简单但首屏可能偏慢，对 SEO 不友好；SSR 在服务端生成 HTML，可以明显提升首屏和 SEO，但增加服务端负载和部署复杂度；SSG 在构建时预先生成静态 HTML，适合内容相对静态的页面，首屏快且运行期负载低，但实效性和个性化能力有限。',
    explanation: '可以结合典型框架（如 Next.js、Nuxt、Vite SSR）说明混合模式：列表页用 SSG，动态详情页用 SSR 或 CSR；强调工程上需要在“性能 / 成本 / 复杂度”之间做权衡，而不是一味追求某种模式。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2007,
    title: 'Hydration（水合）过程的含义与常见问题',
    brief: '说明 SSR 首屏已渲染 HTML 后，客户端如何接管并继续运行，以及水合失败的典型原因。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance', 'javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在使用 SSR 的框架中，“水合（Hydration）”指的是什么过程？前端工程实践中有哪些常见的水合错误及排查思路？',
    answer: '水合指客户端 JS 在已有的服务端 HTML 结构上重新绑定事件和状态，而不是重新完整渲染 DOM；常见问题包括服务端和客户端渲染结果不一致导致 hydration mismatch、使用仅在浏览器存在的 API 直接在服务端执行等。',
    explanation: '可以举例说明在组件中直接使用 window、document 或随机数导致服务端和客户端 HTML 不一致；排查时通常需要在开发模式下开启 hydration warning，并保证与环境相关的逻辑放在 onMounted 等只在客户端执行的生命周期中。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2008,
    title: '前端性能核心指标 LCP、CLS、FID',
    brief: '解释三个 Web Vitals 指标的含义及其优化方向。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '简要说明 LCP、CLS 和 FID 分别衡量什么用户体验维度，并各举两种常见的优化手段。',
    answer: 'LCP 衡量最大内容绘制时间，一般通过减少首屏资源体积、使用 CDN、图片懒加载等方式优化；CLS 衡量布局偏移，通过为图片和广告预留占位、避免在已有内容上方插入元素来降低；FID 衡量首次输入延迟，可以通过减少主线程长任务、拆分大 JS 包、使用 Web Worker 等方式改善。',
    explanation: '可以强调这些指标都是从用户视角出发：LCP 关乎“看见主要内容有多快”，CLS 关乎“页面是否突然跳动”，FID 关乎“点击是否立即有响应”；前端工程化要把这些指标集成到监控系统中，持续收集并作为性能优化的评估标准。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2009,
    title: '使用 Chrome DevTools 定位性能瓶颈',
    brief: '从 Network、Performance 和 Lighthouse 三个面板说明常见的性能分析步骤。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在排查前端性能问题时，如何利用 Chrome DevTools 的 Network、Performance 和 Lighthouse 面板？请简要描述一个典型分析流程。',
    answer: '通常先用 Network 查看资源体积、请求耗时和缓存命中情况，再用 Performance 录制一次交互，分析主线程长任务、重排重绘等问题，最后用 Lighthouse 做整体评分与建议，验证优化前后效果。',
    explanation: '可以提到通过 Network “Disable cache”和“Throttling”模拟弱网环境，通过 Performance 的火焰图找到时间消耗最大的函数调用，通过 Lighthouse 的“Diagnostics”列表获取可落地的优化建议，如减少未使用 JS、启用文本压缩等。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2010,
    title: '减少 bundle 体积的常见手段',
    brief: '从依赖拆分、按需加载和替换实现三个角度总结实践经验。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance', 'javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在现代前端工程中，常用哪些手段来控制最终打包产物的体积？请至少列举四种并做简要说明。',
    answer: '常见手段包括：Tree Shaking 删除未引用代码；按需引入组件库和工具函数；将体积很大的第三方库拆到独立 chunk 或通过 CDN 外链；使用更轻量的替代库；移除开发时才需要的调试代码和多余 polyfill。',
    explanation: '可以结合实际例子，例如用更轻量的日期库代替大体积库，配置组件库的按需加载插件，只保留目标浏览器真正需要的 polyfill；同时在 CI 中加入 bundle 分析报告，设定体积阈值防止后续改动无意间让包持续膨胀。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },

  {
    id: 2011,
    title: '虚拟列表的适用场景',
    brief: '说明长列表渲染时 DOM 节点过多导致的问题，以及虚拟列表的基本实现思路。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['performance', 'javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '什么情况下需要使用虚拟列表（Virtual List）技术？它解决的核心问题是什么，基本实现思路如何？',
    answer: '当列表数据量很大（例如几千到几万行）时，如果一次性渲染所有 DOM，会造成内存占用高和滚动卡顿；虚拟列表只渲染可视区域附近的少量元素，通过计算偏移量模拟完整滚动条，从而显著降低 DOM 数量。',
    explanation: '可以描述典型实现：根据容器高度和单行高度计算可视区域所需的元素数量，再对数据切片渲染，使用一个占位容器撑起总高度，并通过偏移量调整可视元素的位置，从而让用户感觉列表是完整的。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2012,
    title: 'Vite 与传统打包器的核心差异',
    brief: '从开发体验和构建方式两个层面对比 Vite 与 Webpack 等工具。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: 'Vite 相比传统基于打包的开发服务器（如 Webpack Dev Server）在架构上有哪些关键不同？这对前端工程实践带来了什么影响？',
    answer: 'Vite 在开发阶段基于原生 ES Modules 和按需编译，直接让浏览器作为模块加载器，只对实际请求的模块做即时转换；生产构建则使用 Rollup 打包。相比之下传统方案在开发时也需要先整体打包，导致冷启动和 HMR 性能较差。',
    explanation: '可以提到 Vite 利用浏览器缓存未变更模块，只在需要时重新转换；同时通过插件体系统一开发与构建阶段的处理逻辑；对工程实践的影响是可以更轻量地维护大型项目，冷启动时间不会随着代码规模线性增长，提升开发体验。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2013,
    title: '多环境配置与 import.meta.env',
    brief: '说明如何在 Vite 工程中管理开发、测试和生产环境的差异配置。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在 Vite 项目中，如何使用 import.meta.env 管理多环境配置？在工程实践中应该注意哪些安全性问题？',
    answer: 'Vite 会根据不同的 .env 文件注入以 VITE_ 开头的变量到 import.meta.env 中，构建时会做静态替换；工程上应避免在前端暴露敏感信息，只放公开配置，如接口地址、开关标志等。',
    explanation: '可以提到 .env.development、.env.production 等文件的命名规则，以及通过 VITE_APP_ENV、VITE_API_BASE_URL 等变量切换配置；强调所有注入到前端的环境变量本质上都是公开的，不能放密钥或内部凭证，应配合后端配置中心和网关进行安全控制。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2014,
    title: 'ESLint 与 Prettier 在工程中的定位',
    brief: '从“语法/质量检查”和“格式化”两个角度区分职责并说明如何集成。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在前端工程化体系中，ESLint 与 Prettier 分别解决什么问题？它们如何协同工作而不是互相冲突？',
    answer: 'ESLint 主要负责语法和质量问题，例如潜在 bug、风格约定和最佳实践；Prettier 专注于代码格式化，通过固定的风格减少争论。通常会关闭 ESLint 中与格式相关的规则，让 Prettier 负责排版，ESLint 负责逻辑质量。',
    explanation: '可以说明在项目中通过 eslint-plugin-prettier 或 eslint-config-prettier 来解决冲突；配合编辑器保存自动修复和提交前的 lint-staged 钩子，让团队在不增加太多负担的情况下保持统一的代码风格和质量基线。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2015,
    title: '前端单元测试与端到端测试的区别',
    brief: '从覆盖范围、运行速度和稳定性方面比较两类测试，并说明如何在工程中组合使用。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '前端项目中单元测试（Unit Test）与端到端测试（E2E Test）分别关注什么？在一个实际的工程项目中应该如何搭配这两类测试？',
    answer: '单元测试关注组件或函数级别的行为，运行快、定位问题精准，但对集成链路覆盖有限；端到端测试从用户视角验证整个系统的关键路径，覆盖面广但维护和运行成本较高。',
    explanation: '可以建议用单元测试覆盖核心逻辑和关键边界条件，用少量高价值的端到端用例覆盖登录、下单等关键业务流程；在 CI 中单元测试可以作为每次提交的必跑项，而端到端测试可以在合并或发布前集中执行，平衡反馈速度和稳定性。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2016,
    title: '提交前自动检查：Husky 与 lint-staged',
    brief: '说明如何通过 Git 钩子在提交时执行 lint 和测试，避免问题进入主分支。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '如何在前端工程中使用 Husky 和 lint-staged 实现“提交前自动检查”？这样做对团队有什么好处？',
    answer: '可以通过 Husky 注册 Git 钩子，在 pre-commit 阶段调用 lint-staged，仅对本次改动的文件执行 ESLint、Prettier 或单元测试，从源头阻止不符合规范或显然有问题的代码进入仓库。',
    explanation: '这样既不会显著拖慢提交流程，又能把质量问题尽早暴露；相比只依赖 CI，提交前检查能减少无意义的 CI 任务和反复修复的成本，尤其适合多人协作的长期维护项目。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2017,
    title: '前端错误监控的关键指标',
    brief: '从错误率、影响用户数和上下文信息等维度说明应该采集哪些数据。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript', 'performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在建设前端错误监控系统时，除了收集错误堆栈本身，还应该关注哪些指标和上下文信息，才能帮助工程师高效定位问题？',
    answer: '除了错误类型和堆栈，还应收集发生频次、影响的独立用户数、发生页面和操作路径、浏览器与系统信息、当前版本号以及关键业务参数等，以评估优先级并还原现场。',
    explanation: '可以提到通过 window.onerror、unhandledrejection 捕获全局错误，配合 Source Map 还原到源码位置；同时结合性能指标和行为日志，如在错误发生前用户点击了哪些按钮，有没有接口报错，从而快速确定问题根因和影响范围。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2018,
    title: 'Source Map 在线上环境中的取舍',
    brief: '解释开启 Source Map 带来的排查便利与潜在风险，以及常见的折中方案。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '为什么线上环境并不总是直接暴露完整的 Source Map？有哪些折中方式既能帮助排查问题，又尽量减少源码泄露的风险？',
    answer: '完整 Source Map 可以让错误堆栈直接映射到源码，对排查非常有用，但也可能暴露项目结构和实现细节；常见折中包括只对内部监控系统开放 Source Map 下载地址、对 map 文件做访问控制，或使用经过混淆的构建产物配合私有的 Source Map 服务。',
    explanation: '很多监控平台支持上传 Source Map 到私有存储，由平台在后端完成解析，而不是对外公开 .map 文件；同时可以关闭浏览器开发者工具中自动加载 Source Map 的标志，避免被随意下载和反编译，兼顾排查效率与安全性。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2019,
    title: 'XSS 攻击与前端防御策略',
    brief: '从输入过滤、输出编码和 CSP 三个层面说明如何降低 XSS 风险。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '什么是 XSS 攻击？在前端工程中常见的防御策略有哪些？请从输入处理、输出编码和安全头配置三个角度进行说明。',
    answer: 'XSS 攻击是指在页面中注入恶意脚本并在用户浏览器执行；防御策略包括严禁将不可信数据直接插入 HTML 中，统一使用安全的输出编码函数；避免使用危险 API 如 innerHTML 拼接字符串；同时配合 CSP、HttpOnly Cookie 等手段降低攻击面。',
    explanation: '可以强调“原则上所有来自外部的数据都是不可信的”；框架层面建议使用自动转义的模板语法，只有在确认安全时才使用允许插入原始 HTML 的接口；后端可配置 Content-Security-Policy 限制脚本来源，进一步阻止大部分 XSS payload 的执行。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2020,
    title: 'CSRF 攻击及前端的配合方案',
    brief: '解释 CSRF 的原理，并说明前端在使用 Cookie 认证时需要注意什么。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '简要说明 CSRF 攻击的基本原理，在使用 Cookie 作为认证凭证的系统中，前端可以从哪些方面配合后端减轻 CSRF 风险？',
    answer: 'CSRF 借助浏览器自动携带 Cookie 的特性，在用户不知情的情况下对受信任站点发起恶意请求；前端应避免在跨站点环境中随意发起有副作用的请求，配合 SameSite Cookie、CSRF Token 机制，以及对敏感操作使用二次确认等方案。',
    explanation: '可以说明 SameSite=Lax 或 Strict 配置可以阻止第三方站点大部分跨站请求附带 Cookie；CSRF Token 机制则要求前端在请求头或请求体中携带只有当前站点能获取的随机值；前端页面在设计交互时也应避免通过 GET 请求修改重要状态，并对关键操作增加显式确认步骤。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },

  {
    id: 2021,
    title: '微前端的典型场景与挑战',
    brief: '说明什么时候值得引入微前端架构，以及需要付出的额外工程成本。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在什么情况下值得采用微前端架构？从团队组织、技术栈差异和运行时性能等角度，简要说明它带来的收益与挑战。',
    answer: '当单体前端应用过于庞大、多团队需要相对独立地开发和发布不同业务模块，或存在多技术栈共存需求时，微前端可以提供更好的隔离与自治；但同时会增加运行时开销、跨应用通信复杂度和基础设施成本。',
    explanation: '可以提到常见实现方式如 iframe、基于路由的应用聚合、Webpack Module Federation 等；强调需要统一的路由策略、样式隔离和共享依赖管理方案，否则容易出现体积膨胀、样式冲突和调试困难等问题，因此不应为“技术好看”而盲目引入。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2022,
    title: 'Webpack Module Federation 的核心思想',
    brief: '解释远程加载模块的用途，以及它与传统构建时依赖的差异。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: 'Webpack Module Federation 解决了什么问题？与传统的构建时依赖打包相比，它在模块共享和独立部署方面有什么优势？',
    answer: 'Module Federation 允许应用在运行时从远程应用加载模块，从而支持多个独立部署的前端项目共享代码，同时每个应用可以单独发布而无需统一重新构建。',
    explanation: '可以说明传统方案下共享组件库需要以 npm 包形式发布并统一升级，而 Module Federation 可以直接在浏览器中加载远程 bundle 并参与依赖去重；但是需要精心设计公共依赖的版本兼容策略和加载时机，否则容易出现依赖冲突或首屏等待时间增加的问题。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2023,
    title: 'Monorepo 在前端工程中的优势',
    brief: '从复用、版本管理和跨项目协作三个角度说明何时适合采用 Monorepo。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '相比多个独立仓库，Monorepo 在前端工程中的主要优势是什么？常见的实现工具有哪些？',
    answer: 'Monorepo 把多个相关包放在同一个仓库中，便于提取和复用公共模块、统一规范和工具链，并能更好地进行跨包重构；常见实现包括 pnpm workspace、Yarn Workspaces、Nx、Turborepo 等。',
    explanation: '可以提到 Monorepo 让一次提交就能同时修改多个包并做原子发布，避免版本错配和协同成本；同时也带来 CI 时间变长、权限粒度较粗等问题，需要通过增量构建和路径级权限控制来缓解，因此适合规模较大的团队和平台型项目。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2024,
    title: '前端日志与链路追踪',
    brief: '说明如何在浏览器侧采集关键日志，并与后端链路追踪系统打通。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['performance', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在构建端到端可观测性体系时，前端日志系统应如何设计，才能与后端的链路追踪（如 traceId）串联起来？',
    answer: '前端需要在每次请求中携带统一的 traceId 或 requestId，并把关键用户操作与请求日志关联起来；当后端也使用同一 traceId 记录链路信息时，就可以在监控平台中串联完整调用链，从用户点击到后端服务。',
    explanation: 'traceId 可以由后端下发到前端，也可以由前端生成并随请求传递；前端日志上报时需记录当前页面、用户信息、关键参数以及关联的 traceId，便于在问题排查时从任意一端“串联”到另一端；同时要控制日志量和隐私合规，避免过度上报敏感数据。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2025,
    title: '长任务与主线程阻塞',
    brief: '解释浏览器主线程长时间被 JS 占用对交互的影响，以及如何拆分任务。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance', 'javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '什么是 Long Task？当单个 JS 执行任务过长时会给用户体验带来什么问题，前端工程中有哪些缓解手段？',
    answer: 'Long Task 通常指在主线程上执行时间超过 50ms 的任务，它会阻塞渲染和用户输入处理，表现为页面卡顿、点击无响应；常见缓解手段包括拆分大计算为多个小任务、使用 requestIdleCallback 或 Web Worker 把重计算移出主线程。',
    explanation: 'Chrome Performance 面板会高亮长任务，工程实践中应避免在组件生命周期中执行大规模同步计算；对不可避免的重计算，可以采用增量渲染或分页处理，并用 Web Worker 处理纯计算逻辑，让主线程尽量保持“轻量”。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2026,
    title: '避免频繁回流与重绘',
    brief: '说明浏览器回流/重绘的触发场景，以及如何通过批量更新和样式隔离降低成本。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '什么是回流（Reflow）和重绘（Repaint）？在前端工程实践中如何减少它们对性能的影响？',
    answer: '回流指布局信息发生变化导致重新计算元素位置和大小，重绘指像素样式变化但不影响布局；减少它们的方式包括合并多次样式修改、避免逐条访问 layout 属性、使用 transform/opacity 做动画，以及对复杂节点使用独立图层。',
    explanation: '循环中频繁读取 offsetHeight 并修改样式会触发强制同步布局；工程上可以使用 class 切换或批量修改 style，在 requestAnimationFrame 中统一处理；动画推荐用 translate3d 和 opacity，并通过合成层减少对主线程的影响。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2027,
    title: 'Preload 与 Prefetch 的区别',
    brief: '从浏览器优先级和触发时机角度说明两种资源 hint 的用途。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['network', 'performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: 'HTML 中的 preload 和 prefetch 有什么区别？在前端性能优化中应该如何合理使用？',
    answer: 'preload 用于当前页面必需且需要尽早加载的资源，会在本次导航中以较高优先级获取；prefetch 用于未来可能访问的资源，通常在空闲时以较低优先级预取，为下一次导航做准备。',
    explanation: '关键字体、首屏图片或首屏脚本适合使用 preload 来减少阻塞；prefetch 更适合用户高概率将要访问的下一步页面或模块，例如首页预取详情页脚本；过度使用会造成带宽浪费或抢占关键资源，需要结合访问路径和带宽情况评估。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2028,
    title: 'HTTP/2 对前端工程的影响',
    brief: '说明多路复用、头压缩等特性如何改变打包与资源切分策略。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: 'HTTP/2 的多路复用、头部压缩等特性对前端资源打包和切分策略有什么影响？相比 HTTP/1.1，哪些传统优化手段已经不再适用？',
    answer: 'HTTP/2 支持单连接多路复用，减少了并发连接数量限制和队头阻塞，同时通过头部压缩降低开销，因此不再需要刻意合并所有资源为少数文件，也不再推荐使用雪碧图、域名分片等“为连接优化”的技巧。',
    explanation: '在 HTTP/2 场景下更关注逻辑分割和缓存命中，可以保留合理粒度的拆分以便按需加载；但对大量小文件仍需考虑压缩和请求开销；工程策略应结合实际部署环境（是否已启用 HTTP/2/3）进行调整，而不是机械沿用旧时代的优化方案。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2029,
    title: '图片优化在前端工程中的实践',
    brief: '从格式选择、尺寸裁剪和懒加载三个维度总结常见技巧。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['performance', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在真实项目中，如何通过前端工程手段系统性地优化图片资源？请从格式选择、尺寸控制和加载策略三个方面简要说明。',
    answer: '可以根据内容选择合适格式（如照片类用 JPEG/WebP，图标类用 SVG/PNG），通过构建阶段或图片服务裁剪到接近实际展示尺寸，并对非首屏图片使用懒加载或响应式图片以适配不同分辨率。',
    explanation: '可以在构建工具中集成图片压缩插件或使用专门的图片服务自动生成多种尺寸和格式；前端通过响应式图片和懒加载让浏览器自主选择最合适资源，从而兼顾清晰度和加载速度；同时在设计上避免使用“超大但缩小展示”的图片浪费带宽。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2030,
    title: '构建流水线中的质量关卡',
    brief: '概括现代前端项目在 CI/CD 流水线中的典型步骤及各自目标。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '一个典型的前端 CI/CD 流水线通常包含哪些步骤？各步骤分别解决什么问题？',
    answer: '常见步骤包括依赖安装、静态检查（lint、类型检查）、单元测试和集成测试、构建打包、构建产物扫描（如体积、漏洞）、部署到测试或生产环境，以及发布后的健康检查与回滚策略。',
    explanation: '每个步骤都对应一类风险：lint 和类型检查防止低级错误和风格不一致；测试保证业务行为不被破坏；构建阶段的体积和安全扫描避免包过大或引入已知漏洞；部署与监控配合，确保出现问题时能快速检测并回滚，形成闭环工程体系。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },

  {
    id: 2031,
    title: '前端配置中心与特性开关',
    brief: '说明如何使用配置与特性开关控制多环境行为和灰度发布。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在前端工程中如何设计“配置中心”和“特性开关（Feature Flag）”机制，以支持多环境配置和灰度发布？',
    answer: '可以把环境无关的业务配置和开关抽象成后端可下发的配置文件或接口，前端在启动时拉取并缓存；特性开关可以按用户、地域或时间维度做灰度控制，实现不重新发版就能开关某个功能。',
    explanation: '简单场景可以用环境变量管理部分开关，但更复杂的灰度和动态调整需要配置中心支持；前端实现时要考虑开关变更时的默认值和回退策略，避免远程配置异常导致白屏；同时避免在代码中散落大量条件判断，可以封装统一的开关查询工具函数。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2032,
    title: '多语言与前端工程化',
    brief: '说明在大型项目中如何组织多语言资源并减少重复构建。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '对于支持多语言的大型前端项目，如何在工程上组织文案资源，并兼顾首屏性能和维护成本？',
    answer: '常见做法是将不同语言的文案拆分为独立资源文件，按路由或模块维度懒加载，同时使用统一的 key 管理文案，避免在代码中硬编码字符串。',
    explanation: '可以结合 i18n 库说明按模块拆分语言包，并在构建阶段对语言文件做按需打包；对于首屏语言可在 HTML 或服务端渲染阶段注入当前语言标识，前端按需加载对应语言包；维护上可以导出 key 列表给翻译平台使用，保证新增文案能被及时覆盖并避免遗漏。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2033,
    title: '前端工程中的可访问性实践',
    brief: '从语义化 HTML、键盘操作和 ARIA 属性三个方面说明工程化约束。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在前端工程中如何通过工程化手段提升可访问性（A11y）？请举出至少三个方面的实践。',
    answer: '可以通过强制使用语义化标签代替 div 嵌套、确保所有交互元素都能通过键盘操作、合理使用 ARIA 属性描述动态组件状态，并在构建流水线中加入可访问性扫描工具。',
    explanation: '可以说明常见的 lint 规则可以自动发现缺少 alt 的图片、非按钮元素绑定 click 等问题；在组件库层面封装符合 A11y 规范的基础组件，让业务开发者不必过多关心细节，从工程上“默认是正确的”。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2034,
    title: '前端安全响应头配置的作用',
    brief: '概括常见 HTTP 安全响应头（CSP、X-Frame-Options 等）对前端安全的帮助。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['network', 'javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '常见的几个前端相关安全响应头（如 Content-Security-Policy、X-Frame-Options、Strict-Transport-Security）分别解决什么问题？前端工程师在设计页面时需要注意什么？',
    answer: 'CSP 用于限制脚本、样式、图片等资源的加载来源，降低 XSS 风险；X-Frame-Options 防止页面被嵌入到第三方 iframe 中，避免点击劫持；Strict-Transport-Security 强制浏览器使用 HTTPS，防止中间人攻击。',
    explanation: '前端在写代码时应避免依赖内联脚本和 style，以免与严格的 CSP 冲突；对需要被嵌入的页面要与后端一起设计允许的来源；同时在本地开发和生产环境之间保持配置的一致性，避免上线后才发现脚本被 CSP 拦截导致功能不可用。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2035,
    title: 'Service Worker 与离线能力',
    brief: '说明 Service Worker 的作用以及在工程化实践中的常见使用场景与注意事项。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['performance', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: 'Service Worker 可以为 Web 应用带来哪些能力？在工程化实践中使用它时需要特别注意什么？',
    answer: 'Service Worker 可以实现离线缓存、请求拦截和后台同步等能力，让 Web 应用在网络不稳定时依然可用；但其生命周期与页面不同步，更新机制和调试相对复杂，需要谨慎设计缓存策略和版本控制。',
    explanation: '可以提到典型的 PWA 场景：静态资源和接口数据通过 Service Worker 缓存到本地；同时强调如果缓存策略设计不当容易导致用户长时间停留在旧版本，工程上需要实现“跳过等待”和强制更新机制，并提供调试开关以便在问题发生时快速失效缓存。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2036,
    title: '前端表单的工程化校验方案',
    brief: '说明如何通过统一的校验规则和错误展示组件，降低重复工作。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在复杂表单较多的项目中，如何通过工程化方式统一管理校验规则和错误提示，避免在每个页面重复编写校验逻辑？',
    answer: '可以抽象出统一的表单校验库或工具，约定规则描述方式（如基于 JSON Schema 或自定义 DSL），并配合通用的错误展示组件，根据校验结果自动渲染提示信息。',
    explanation: '通过集中管理规则，可以结合后端配置或接口返回动态生成表单；同时可以在提交前统一做节流、防重复提交和埋点统计；这类方案既提升复用度，又能在规则变更时做到“一处修改，多处生效”。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2037,
    title: '前端埋点与数据上报策略',
    brief: '从埋点规范、上报时机和性能影响三个角度说明如何设计行为采集系统。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '如何在前端工程中设计一套可维护的埋点和数据上报方案，既满足业务分析需求，又不会显著影响性能？',
    answer: '需要先统一埋点命名规范和事件模型，再通过 SDK 封装埋点 API，避免在业务代码中散落原始上报逻辑；上报时机应优先使用 Beacon API 或批量上报，减少对关键渲染路径的影响。',
    explanation: '对关键行为（如下单、登录）使用可靠的上报方式，在页面关闭前用 navigator.sendBeacon 提交剩余数据；对高频事件采用采样或节流，避免产生大量网络请求；同时在埋点平台侧提供版本控制和可视化管理，以便随业务演进调整埋点，而不是在代码层频繁修改。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2038,
    title: '代码风格与团队协作',
    brief: '说明统一代码风格如何降低评审成本和认知负担，并通过工程化手段落实。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '为什么在前端团队中需要统一代码风格？除了“看起来整齐”，从工程协作角度还有哪些具体收益？如何用工具保证统一？',
    answer: '统一风格可以降低阅读代码时的认知负担，让评审更聚焦在业务逻辑本身，同时减少因格式问题产生的无意义 diff；通过 Prettier、ESLint 和 Git 钩子可以自动修复和校验，避免依赖人工自觉。',
    explanation: '杂乱的风格会让 diff 难以查看真实改动，评审者容易遗漏潜在问题；而自动化格式化后，每次提交都只包含必要的逻辑变化；工程上可以在 CI 里增加风格检查，确保主分支始终保持一致的代码规范。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2039,
    title: '组件库的按需引入与 Tree Shaking',
    brief: '说明大型 UI 组件库在工程中如何避免一次性打全包。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript', 'performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在使用大型 UI 组件库（如 Element Plus、Ant Design）时，如何通过按需引入和 Tree Shaking 控制最终打包体积？',
    answer: '可以通过按需导入组件而非从入口一次性引入整个库，并结合构建插件或 Babel 插件在编译时重写导入路径；同时组件库本身也需要采用基于 ES Modules 的导出方式，才能让 Tree Shaking 生效。',
    explanation: '可以提到典型的按需加载方案，通过分析使用到的组件自动引入对应的 JS 和样式；工程上还可以定期检查依赖使用情况，移除不再使用的组件库，或者拆分为内部维护的轻量组件以进一步优化体积。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2040,
    title: '前端工程中的灰度发布与回滚',
    brief: '说明如何通过版本控制和流量控制实现平滑上线与快速回退。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['network', 'performance'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在前端项目中如何实现灰度发布？一旦新版本出现严重问题，回滚机制通常如何设计才能快速生效？',
    answer: '灰度发布通常通过流量网关或配置中心把部分用户流量导向新版本静态资源，其余用户仍访问旧版本；回滚时只需切换网关配置或 CDN 回源路径，让大部分请求重新指向稳定版本。',
    explanation: '前端静态资源通常是可回溯的版本化文件，CDN 和反向代理可以同时缓存多套版本；工程上需要在构建产物中记录版本号和构建时间，监控平台中关联版本信息，一旦发现指标异常即可自动或人工触发回滚操作，相比后端服务回滚简单但仍需设计好流程与权限控制。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },

  {
    id: 2041,
    title: '前端工程与后端接口约定管理',
    brief: '说明如何通过类型定义或协议文件减少前后端联调成本。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['network', 'javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在前后端分离的项目中，如何通过工程化手段管理接口约定，减少“口头协议”和联调反复？',
    answer: '可以通过 OpenAPI/Swagger 文档、Proto 文件或 TypeScript 类型定义来描述接口契约，并自动生成前端请求代码和类型；前后端共享同一份协议文件可以减少字段变更带来的手动同步成本。',
    explanation: '可以举例说明使用 OpenAPI 生成前端 SDK、Mock 服务和接口文档，或在 Monorepo 中共享类型文件；工程上还可以在 CI 中校验接口定义与实现的一致性，确保接口变更不会在未通知前端的情况下直接上线，提升整体协作效率和稳定性。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2042,
    title: '前端打包产物结构的设计',
    brief: '说明如何规划入口文件、异步 chunk 和公共依赖，让部署和排障更清晰。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['performance', 'javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在设计前端打包产物结构时，如何规划入口 chunk、异步 chunk 和公共依赖 chunk，以便于部署和性能优化？',
    answer: '可以为每个路由或业务模块配置独立入口，公共依赖抽到单独的 vendor 或 framework chunk；异步功能模块使用动态 import 生成独立 chunk，避免首屏加载一次性拉全量代码。',
    explanation: '合理的 chunk 划分可以帮助缓存和调试，例如核心框架依赖变化频率低，可以单独成包以便长期缓存；业务代码变化频繁，可以分模块打包以减少每次发布需要更新的资源；同时避免过度切分导致请求数量过多，需要结合 HTTP/2 和实际网络情况进行权衡。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2043,
    title: '前端工程中的权限控制',
    brief: '说明路由层与组件层权限校验的职责划分，以及如何避免硬编码权限点。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['javascript', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在复杂业务系统中，前端应如何设计权限控制体系？路由守卫、组件显示控制和接口权限校验各自承担什么角色？',
    answer: '路由守卫负责拦截未授权用户访问某些页面；组件层控制用于根据权限隐藏或禁用按钮、入口等；接口权限由后端最终裁决，前端的校验主要用于优化体验而不能作为唯一防线。',
    explanation: '可以说明权限点应抽象为统一的标识和校验函数，而不是在代码中散落硬编码条件；权限数据可以由后端下发并缓存到前端状态管理中，再通过自定义指令或组件控制显示；同时要考虑权限变更后的刷新策略和缓存失效问题。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2044,
    title: '前端打点与性能指标关联分析',
    brief: '说明如何把行为埋点和性能指标结合起来找出真正影响体验的操作。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['performance', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '为什么仅仅收集 Web Vitals 等性能指标还不够？如何将行为埋点与性能数据结合起来，帮助团队找到真正影响用户体验的关键操作？',
    answer: '单纯的性能指标只能告诉你页面整体慢不慢，却很难回答哪类操作在拖慢体验；将行为埋点与性能数据关联后，可以按页面、功能、用户群体维度拆分，找到在关键业务路径中表现不佳的具体场景。',
    explanation: '可以举例说明在下单按钮点击时记录业务事件，并关联当前的 LCP、TTI 或接口耗时；通过可视化报表发现某些特定组合（如移动端 + 某运营商）下性能明显偏差，从而有针对性地优化资源加载策略或接口超时设置。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2045,
    title: '大前端一体化工程体系',
    brief: '从 Web、移动端和桌面端统一工程工具链的角度说明趋势与挑战。',
    difficulty: 'hard',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '什么是“大前端一体化工程体系”？在同时支持 Web、移动端和桌面端的团队中，统一工程工具链可以带来哪些收益，又会遇到什么挑战？',
    answer: '大前端一体化工程体系指使用统一的语言栈、构建工具和工程规范覆盖多端开发，例如以 TypeScript 为核心，通过 React/Vue + 原生 App 或跨端框架构建多终端应用；统一后可以共享组件、工具和规范，但也需要处理平台差异、性能要求与发布流程不同的问题。',
    explanation: '统一工程体系后，代码复用和团队流动性会明显提升，但也要警惕过度抽象导致各端都“将就着用”；工程上可以用 Monorepo 管理多端项目和共享包，通过约定目录结构和脚本命令保持一致体验，同时为各端保留必要的独立优化空间。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2046,
    title: '前端工程中的安全审计与依赖管理',
    brief: '说明如何通过依赖扫描和版本策略降低开源库安全风险。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript', 'network'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在前端工程中如何管理第三方依赖的安全风险？从依赖扫描、版本锁定和升级策略三个方面进行说明。',
    answer: '可以通过 npm audit、Snyk 等工具在 CI 中自动扫描已知漏洞；使用 lock 文件锁定依赖版本避免未经验证的自动升级；定期规划依赖升级窗口，集中评估和修复风险。',
    explanation: '对核心依赖应有明确的升级节奏和回滚方案，避免多年不升级或无脑跟随最新；对高风险漏洞要及时评估影响范围并在监控中加入针对性告警；同时减少不必要的依赖，引入前先评估维护活跃度和社区质量，从源头降低攻击面。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2047,
    title: '前端工程中的类型系统价值',
    brief: '说明 TypeScript 等静态类型工具如何在大型项目中提高可靠性。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '为什么越来越多的前端工程项目选择使用 TypeScript 而不是纯 JavaScript？从可维护性、重构和协作几个角度简要说明理由。',
    answer: '静态类型可以在编译阶段捕获大量低级错误，显著提升重构的信心；类型定义相当于“可执行文档”，有利于多人协作和 IDE 提示；在大型项目中可以减少因理解偏差导致的接口使用错误。',
    explanation: '可以举例说明在重构数据结构或接口返回时，类型系统会提示所有受影响的调用点；同时类型也能帮助生成文档和校验后端接口的变化；不过引入类型也会带来一定心智和配置成本，需要结合团队实际情况逐步推进而不是一刀切。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2048,
    title: '前端工程中的状态管理与模块拆分',
    brief: '说明在使用全局状态管理库时如何避免“巨型 Store”。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '在使用 Vuex/Pinia 或 Redux 等全局状态管理库时，如何通过模块拆分和边界设计避免出现难以维护的“巨型 Store”？',
    answer: '可以按照业务领域拆分模块，每个模块只负责自身的状态和逻辑，通过明确的接口进行交互；对于局部状态尽量下沉到组件内部或局部 store，避免所有状态都挤进全局。',
    explanation: '全局状态过多会导致耦合度高、调试困难，任何改动都可能影响多个页面；工程上可以结合类型定义和选择性导出限制模块间的直接访问；同时使用时间旅行调试工具观察状态变化，帮助发现设计不合理的地方并逐步重构。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2049,
    title: '前端 Bundle 分析与可视化工具',
    brief: '说明通过可视化工具分析打包结果、发现异常大的依赖或重复打包问题。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['performance', 'javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '为什么在中大型前端项目中需要定期使用 Bundle 分析工具？可以发现哪些典型问题，并如何据此制定优化计划？',
    answer: 'Bundle 分析工具可以可视化展示各个依赖在产物中的体积占比，帮助发现异常巨大的库、重复打包的依赖以及未使用却被引入的模块，从而有针对性地进行替换或拆分。',
    explanation: '可以提到常见工具如 webpack-bundle-analyzer、rollup-plugin-visualizer 或 Vite 插件；通过比较不同版本的分析结果，可以量化每次优化带来的收益，并在 CI 中设定体积阈值，防止未来改动无意间让包持续膨胀。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 2050,
    title: '前端工程化与团队实践落地',
    brief: '从“先规范后工具”的角度说明如何逐步在团队中推广工程化实践。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 2,
    categoryId: 'frontend-engineering',
    question: '如果你加入一个工程化基础薄弱的前端团队，想要系统性地提升工程质量，通常会按照怎样的步骤推进？请给出一个循序渐进的方案。',
    answer: '可以先从制定最基础的代码规范和目录结构开始，再引入 Lint/格式化和简单的单元测试；随后搭建统一的构建与发布流水线，引入监控和错误上报；最后再考虑高级能力如微前端、PWA 或复杂灰度体系，避免一开始就堆砌工具却无人使用。',
    explanation: '关键是先达成共识再引入工具，通过文档和示例项目让团队理解收益；选择自动化程度高、接入成本低的工具作为切入点，如保存自动格式化、提交前自动检查；在每次迭代中只引入有限的新工程实践，并通过度量和复盘展示改进效果，逐步形成正向反馈循环。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },

  // ===== 人工智能领域题目（domainId: 5, slug: artificial-intelligence） =====
  {
    id: 1001,
    title: '人工智能、机器学习和深度学习的关系是什么？',
    brief: '区分 AI、ML、DL 三者的层次和典型应用场景。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['ai-basics'],
    domainId: 5,
    categoryId: 'ai-basics',
    question: '简要说明人工智能（AI）、机器学习（ML）和深度学习（DL）之间的层次关系，并分别举一个典型应用。',
    answer: '人工智能是大范畴，机器学习是实现 AI 的一类方法，深度学习是以多层神经网络为代表的机器学习子领域。',
    explanation: '可以从“集合包含关系”来理解：AI 关注让机器表现出智能行为；ML 通过数据学习输入到输出的映射；DL 通过多层神经网络自动学习特征，在视觉、语音等任务上表现突出，例如图像分类和语音识别。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1002,
    title: '监督学习、无监督学习和强化学习有什么区别？',
    brief: '从是否有标签、学习目标和典型任务上比较三大范式。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['ai-basics', 'machine-learning'],
    domainId: 5,
    categoryId: 'ai-basics',
    question: '从训练数据形式、学习目标和典型应用三个角度对比监督学习、无监督学习和强化学习。',
    answer: '监督学习使用带标签数据学习输入到输出的映射；无监督学习只利用未标注数据挖掘结构；强化学习让智能体通过与环境交互、基于奖励信号学习策略。',
    explanation: '监督学习典型任务有分类和回归；无监督学习包括聚类、降维、异常检测；强化学习多用于游戏对战、广告投放、机器人控制等需要连续决策的场景。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1003,
    title: '什么是过拟合？如何缓解？',
    brief: '定义过拟合并给出常见缓解手段。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['ai-basics', 'machine-learning'],
    domainId: 5,
    categoryId: 'ai-basics',
    question: '解释过拟合现象，并列举至少三种在实际项目中常用的过拟合缓解方法。',
    answer: '过拟合指模型在训练集上表现很好，但在验证集或测试集上效果明显变差。缓解方法包括正则化、数据增强、降低模型复杂度、使用交叉验证和早停等。',
    explanation: '可以从“模型参数太多、数据太少”导致模型把噪声也学进去来理解；L2 正则减小权重、Dropout 随机失活神经元、数据增强增加样本多样性，都是常见的过拟合对策。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1004,
    title: '偏差-方差权衡描述的是什么现象？',
    brief: '从模型复杂度的角度解释偏差和方差及其与欠拟合、过拟合的关系。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['ai-basics', 'machine-learning'],
    domainId: 5,
    categoryId: 'ai-basics',
    question: '什么是偏差、什么是方差？请结合模型复杂度说明偏差-方差权衡。',
    answer: '偏差表示模型在整体上的系统性误差，方差表示模型对训练数据扰动的敏感程度。模型太简单偏差高易欠拟合，模型太复杂方差高易过拟合，实际需要在偏差和方差之间找到平衡点。',
    explanation: '可以画出随模型复杂度变化的测试误差曲线：复杂度太低时偏差占主导，太高时方差占主导。合理的模型选择和正则化就是在这两端之间取得综合误差最小的位置。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1005,
    title: '为什么要划分训练集、验证集和测试集？',
    brief: '说明三类数据集的作用及其在模型选择中的流程。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['ai-basics'],
    domainId: 5,
    categoryId: 'ai-basics',
    question: '在一个实际机器学习项目中，训练集、验证集和测试集分别承担什么角色？',
    answer: '训练集用于拟合模型参数；验证集用于调节超参数和选择模型；测试集只在最终评估时使用，用于估计模型在未见数据上的泛化能力。',
    explanation: '如果直接用测试集反复调参，测试集就会“泄漏”到训练过程中，导致线上效果与线下评估不一致。因此通常采用“训练集 + 验证集 + 一次性测试集”的分工。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1006,
    title: 'K 近邻（KNN）算法的原理是什么？',
    brief: '从“相似样本具有相似标签”的假设出发解释 KNN。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['machine-learning'],
    domainId: 5,
    categoryId: 'ml-classic',
    question: '简要说明 K 近邻算法的基本思想、预测步骤以及 K 值过大或过小可能带来的问题。',
    answer: 'KNN 假设相似样本具有相似标签，对新样本在训练集中找到距离最近的 K 个邻居，再用邻居标签投票或平均得到预测。K 太小易过拟合，K 太大易欠拟合。',
    explanation: '可以结合欧氏距离、余弦距离等度量方式来说明；K 值一般通过验证集搜索合适范围，小数据场景下更适合使用 KNN，大规模数据往往需要近似搜索或其他算法。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1007,
    title: '线性回归的目标函数和求解方法是什么？',
    brief: '给出线性回归的模型形式、最小二乘目标和常见求解方式。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['machine-learning'],
    domainId: 5,
    categoryId: 'ml-classic',
    question: '写出多元线性回归模型的形式，并说明最小二乘目标函数和常见的求解方法。',
    answer: '多元线性回归假设输出是特征的线性组合，通过最小化预测值与真实值之间的平方误差和来拟合参数。可以使用正规方程解析解，也可以使用梯度下降等迭代方法。',
    explanation: '特征数较小时可以直接计算 (XᵀX)⁻¹Xᵀy 得到闭式解，大规模或稀疏场景更常用小批量梯度下降优化，注意特征缩放有助于提高收敛速度。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1008,
    title: '逻辑回归是如何做二分类的？',
    brief: '结合 Sigmoid 函数说明逻辑回归输出的含义和训练目标。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['machine-learning'],
    domainId: 5,
    categoryId: 'ml-classic',
    question: '逻辑回归模型的形式是什么？输出值代表什么含义？训练时通常采用什么损失函数？',
    answer: '逻辑回归对线性组合结果施加 Sigmoid，将其映射到 0 到 1 之间作为正类概率估计；训练时通常使用对数似然或交叉熵损失进行最大似然估计。',
    explanation: '逻辑回归本质上仍是线性分类器，只是在输出层加了非线性映射；在预测阶段通常用 0.5 作为决策阈值，实际工程中也会根据精确率/召回率要求调整阈值。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1009,
    title: 'L1 正则化和 L2 正则化有什么区别？',
    brief: '比较 L1 与 L2 正则对参数的影响以及常见应用场景。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['machine-learning'],
    domainId: 5,
    categoryId: 'ml-classic',
    question: '从几何意义和优化结果的角度比较 L1 正则化和 L2 正则化，它们分别适合什么场景？',
    answer: 'L1 正则化使用参数绝对值之和，倾向于产生稀疏解，可做特征选择；L2 正则化使用参数平方和，倾向于让参数整体变小但不为零，更适合防止权重过大。',
    explanation: 'L1 的约束区域是菱形，角点容易与坐标轴相交从而产生大量零权重；L2 的约束区域是球形，更平滑稳定，一般对多重共线性和数值稳定性更友好，实务中也常组合使用 Elastic Net。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1010,
    title: '梯度下降有哪些常见变种？',
    brief: '说明批量、小批量和随机梯度下降的区别，以及常见自适应优化算法。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['machine-learning'],
    domainId: 5,
    categoryId: 'ml-classic',
    question: '对比批量梯度下降、小批量梯度下降和随机梯度下降的特点，并简要说明 Adam 这类自适应优化算法的核心思想。',
    answer: '批量梯度下降每次使用全部样本更新，收敛稳定但单步开销大；随机梯度下降每次只用一个样本，噪声大但有利于跳出局部最小值；小批量梯度下降介于两者之间，是深度学习中最常用的方式。自适应算法如 Adam 会根据历史梯度的一阶和二阶矩动态调整每个参数的学习率。',
    explanation: '小批量在 GPU 上更易向量化且兼顾稳定性和效率；Adam 结合了动量和 RMSProp 思想，通过指数滑动平均估计梯度均值与方差，对稀疏和非平稳目标更友好，但也需要注意学习率和权重衰减设置。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1011,
    title: '决策树划分特征时常用哪些指标？',
    brief: '说明信息增益、增益率和基尼指数的含义及差异。',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['machine-learning'],
    domainId: 5,
    categoryId: 'ml-classic',
    question: '列出决策树中特征划分常用的三种指标，并说明它们的直观含义和典型算法。',
    answer: '常用指标有信息增益、信息增益率和基尼指数。ID3 使用信息增益，C4.5 使用信息增益率缓解取值多的特征偏好，CART 使用基尼指数衡量节点纯度。',
    explanation: '信息增益度量划分前后熵的减少量；信息增益率对信息增益进行了归一化，避免总是选择取值最多的特征；基尼指数反映从节点中随机抽取两个样本标签不同的概率，值越小节点越纯。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  },
  {
    id: 1012,
    title: '随机森林相比单棵决策树有什么优势？',
    brief: '从泛化性能、稳定性和过拟合风险等方面比较。',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['machine-learning'],
    domainId: 5,
    categoryId: 'ml-classic',
    question: '为什么随机森林通常比单棵决策树泛化性能更好？它是如何通过“随机性”来提升效果的？',
    answer: '随机森林通过对样本和特征的双重随机抽样训练多棵决策树，再对结果投票或平均，从而降低方差、提高鲁棒性，通常比单棵树更不容易过拟合。',
    explanation: 'Bagging 思想让不同树看到不同的数据子集和特征子集，彼此犯错不完全相关，集成后能相互抵消噪声；虽然每棵树的偏差略高，但整体方差显著下降，因此泛化能力更强。',
    stats: { attempts: 0, correctCount: 0 },
    createdAt: now
  }
]

// Facets：难度、分类、标签统计
export const mockQuestionFacets = (() => {
  const countByDifficulty = mockQuestions.reduce((acc, q) => {
    const key = q.difficulty || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const categories = mockQuestionCategories.flat.map(cat => ({
    id: cat.id,
    name: cat.name,
    count: mockQuestions.filter(q => q.categoryId === cat.id || q.domainId === cat.id).length
  }))

  const tags = mockQuestionTags.map(tag => ({
    ...tag,
    count: mockQuestions.filter(q => (q.tags || []).includes(tag.id)).length
  }))

  return {
    difficulties: Object.keys(countByDifficulty).map(key => ({
      id: key,
      name: key,
      count: countByDifficulty[key]
    })),
    categories,
    tags
  }
})()

// 汇总信息，用于仪表盘和学习进度概览
export const mockQuestionSummary = {
  total: mockQuestions.length,
  totalPages: 1,
  page: 1,
  size: 20,
  attempts: mockQuestions.reduce((sum, q) => sum + (q.stats?.attempts || 0), 0)
}

// 简单的练习记录示例
export const mockPracticeRecords = [
  { id: 'pr-1', questionId: 101, result: 'correct', timeSpent: 58, createdAt: now },
  { id: 'pr-2', questionId: 202, result: 'wrong', timeSpent: 132, createdAt: now },
  { id: 'pr-3', questionId: 103, result: 'correct', timeSpent: 76, createdAt: now }
]

// 列表构建：支持关键字、领域、分类、标签和排序
export function buildMockQuestionList(params = {}) {
  let items = [...mockQuestions]

  const keyword = (params.keyword || params.q || '').toLowerCase().trim()
  if (keyword) {
    items = items.filter(q =>
      q.title.toLowerCase().includes(keyword) ||
      (q.brief || '').toLowerCase().includes(keyword)
    )
  }

  const domainId = params.domain_id || params.domainId
  if (domainId) {
    items = items.filter(q => q.domainId === domainId || q.categoryId === domainId)
  }

  const categoryId = params.category_id || params.categoryId
  if (categoryId) {
    items = items.filter(q => q.categoryId === categoryId)
  }

  if (params.tags) {
    const tagList = Array.isArray(params.tags)
      ? params.tags
      : String(params.tags)
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
    items = items.filter(q => tagList.every(t => (q.tags || []).includes(t)))
  }

  if (params.sort === 'popular') {
    items.sort((a, b) => (b.stats?.attempts || 0) - (a.stats?.attempts || 0))
  } else {
    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  const page = Number(params.page) || 1
  const size = Number(params.size) || 20
  const total = items.length
  const start = (page - 1) * size
  const paged = items.slice(start, start + size)

  return {
    items: paged,
    page,
    size,
    total,
    totalPages: Math.max(1, Math.ceil(total / size)),
    summary: {
      total,
      page,
      size,
      totalPages: Math.max(1, Math.ceil(total / size))
    },
    facets: mockQuestionFacets
  }
}

export function getMockQuestionById(id) {
  return mockQuestions.find(q => String(q.id) === String(id)) || null
}

export function getMockPracticeRecords(questionId) {
  return mockPracticeRecords.filter(r => String(r.questionId) === String(questionId))
}

export function getMockRecommendations(questionId, count = 3) {
  return mockQuestions
    .filter(q => String(q.id) !== String(questionId))
    .slice(0, count)
}
