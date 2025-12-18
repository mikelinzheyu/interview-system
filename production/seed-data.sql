-- ====================================================
-- AI面试系统 - 初始数据填充脚本
-- ====================================================

SET NAMES utf8mb4;
USE interview_system;

-- ==================== 1. 插入测试用户 ====================
INSERT INTO `users` (`username`, `email`, `password`, `nickname`, `avatar`, `status`) VALUES
('admin', 'admin@interview.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '系统管理员', 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', 1),
('zhangsan', 'zhangsan@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '张三', 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png', 1),
('lisi', 'lisi@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '李四', 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png', 1),
('wangwu', 'wangwu@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '王五', 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', 1),
('zhaoliu', 'zhaoliu@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '赵六', 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png', 1),
('sunqi', 'sunqi@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '孙七', 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png', 1),
('zhouba', 'zhouba@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '周八', 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', 1),
('wujiu', 'wujiu@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '吴九', 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png', 1),
('zhengshi', 'zhengshi@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '郑十', 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png', 1),
('frontend_dev', 'frontend@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '前端开发者', 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', 1),
('backend_dev', 'backend@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHI', '后端开发者', 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png', 1);

-- ==================== 2. 插入面试类别 ====================
INSERT INTO `categories` (`name`, `description`, `parent_id`, `sort_order`, `status`) VALUES
('计算机科学', '计算机科学与技术相关面试题', NULL, 1, 1),
('前端开发', 'HTML、CSS、JavaScript、Vue、React等前端技术', 1, 1, 1),
('后端开发', 'Java、Python、Node.js等后端技术', 1, 2, 1),
('数据库', 'MySQL、Redis、MongoDB等数据库技术', 1, 3, 1),
('算法与数据结构', '常见算法和数据结构面试题', 1, 4, 1),
('系统设计', '系统架构和设计模式', 1, 5, 1),
('DevOps', 'Docker、K8s、CI/CD等运维技术', 1, 6, 1),
('金融', '金融行业相关面试题', NULL, 2, 1),
('医学', '医学相关面试题', NULL, 3, 1),
('法律', '法律相关面试题', NULL, 4, 1);

-- ==================== 3. 插入面试题目 ====================

-- 前端开发题目
INSERT INTO `questions` (`category_id`, `title`, `content`, `difficulty`, `type`, `answer`, `tags`, `created_by`, `status`) VALUES
-- Vue相关
(2, 'Vue 3的Composition API有什么优势？', '请详细说明Vue 3 Composition API相比Options API的优势，以及适用场景。', 'medium', 'subjective',
'Composition API的主要优势包括：1. 更好的逻辑复用和代码组织；2. 更好的TypeScript支持；3. 更灵活的代码组织方式；4. 更小的打包体积。适用于大型复杂组件和需要跨组件复用逻辑的场景。',
'["Vue3", "Composition API", "前端框架"]', 2, 1),

(2, 'Vue响应式原理是什么？', '请解释Vue 2和Vue 3的响应式原理，以及它们的区别。', 'hard', 'subjective',
'Vue 2使用Object.defineProperty实现响应式，通过getter/setter劫持属性访问。Vue 3使用Proxy实现，可以监听对象属性的添加和删除，性能更好，支持数组索引和length属性的监听。',
'["Vue", "响应式", "Proxy"]', 2, 1),

(2, '什么是虚拟DOM？为什么需要虚拟DOM？', '请解释虚拟DOM的概念、工作原理，以及它带来的好处。', 'medium', 'subjective',
'虚拟DOM是用JavaScript对象描述真实DOM的抽象表示。通过diff算法比较新旧虚拟DOM，只更新变化的部分，减少直接操作DOM的次数，提高性能。同时提供了跨平台能力。',
'["虚拟DOM", "性能优化", "前端框架"]', 2, 1),

-- React相关
(2, 'React Hooks解决了什么问题？', '请说明React Hooks的设计目的和主要解决的问题。', 'medium', 'subjective',
'React Hooks主要解决：1. 组件间复用状态逻辑困难；2. 复杂组件难以理解；3. class组件的this绑定问题。Hooks让函数组件也能使用state和生命周期特性。',
'["React", "Hooks", "前端框架"]', 2, 1),

(2, 'useEffect和useLayoutEffect的区别？', '请解释useEffect和useLayoutEffect的执行时机和使用场景。', 'medium', 'subjective',
'useEffect在浏览器渲染完成后异步执行，useLayoutEffect在DOM更新后、浏览器绘制前同步执行。useLayoutEffect适合需要同步读取DOM并重新渲染的场景，避免闪烁。',
'["React", "Hooks", "useEffect"]', 2, 1),

-- CSS相关
(2, 'CSS盒模型是什么？', '请解释CSS的标准盒模型和IE盒模型的区别。', 'easy', 'subjective',
'标准盒模型：width = content width；IE盒模型（border-box）：width = content width + padding + border。通过box-sizing属性可以切换。',
'["CSS", "盒模型", "布局"]', 2, 1),

(2, 'Flexbox布局的主要特点？', '请说明Flexbox布局的核心概念和常用属性。', 'easy', 'subjective',
'Flexbox是一维布局模型，核心概念包括主轴和交叉轴。常用属性：justify-content（主轴对齐）、align-items（交叉轴对齐）、flex-direction（排列方向）、flex-wrap（换行）等。',
'["CSS", "Flexbox", "布局"]', 2, 1),

-- JavaScript相关
(2, '什么是闭包？闭包的应用场景？', '请解释JavaScript闭包的概念、原理和常见应用场景。', 'medium', 'subjective',
'闭包是指函数能够访问其词法作用域外的变量。原理是函数执行时会保存对外部作用域的引用。应用场景：数据私有化、函数柯里化、防抖节流、模块化等。',
'["JavaScript", "闭包", "作用域"]', 2, 1),

(2, 'Promise、async/await的区别？', '请对比Promise和async/await的使用方式和优缺点。', 'medium', 'subjective',
'Promise是异步编程的一种解决方案，使用then/catch链式调用。async/await是基于Promise的语法糖，让异步代码看起来像同步代码，更易读。但async/await无法并行执行多个异步任务。',
'["JavaScript", "异步编程", "Promise"]', 2, 1),

(2, '什么是事件循环（Event Loop）？', '请解释JavaScript的事件循环机制和宏任务、微任务的执行顺序。', 'hard', 'subjective',
'事件循环是JavaScript处理异步任务的机制。执行顺序：同步代码 -> 微任务（Promise.then、MutationObserver） -> 宏任务（setTimeout、setInterval）。每执行完一个宏任务，会清空所有微任务队列。',
'["JavaScript", "事件循环", "异步"]', 2, 1),

-- 后端开发题目
(3, 'Spring Boot的核心特性有哪些？', '请列举Spring Boot的主要特性和优势。', 'easy', 'subjective',
'Spring Boot核心特性：1. 自动配置；2. 起步依赖；3. 内嵌服务器；4. 生产就绪特性（健康检查、指标监控）；5. 无需XML配置。',
'["Spring Boot", "Java", "后端框架"]', 3, 1),

(3, 'RESTful API设计原则？', '请说明RESTful API的设计原则和最佳实践。', 'medium', 'subjective',
'RESTful设计原则：1. 使用名词而非动词；2. GET请求不应该改变资源状态；3. 使用HTTP状态码表示结果；4. 使用复数形式；5. 支持过滤、排序、分页；6. 版本控制。',
'["RESTful", "API设计", "Web"]', 3, 1),

(3, 'JWT认证的工作原理？', '请解释JWT（JSON Web Token）的结构和认证流程。', 'medium', 'subjective',
'JWT由三部分组成：Header（算法和令牌类型）、Payload（声明信息）、Signature（签名）。认证流程：1. 用户登录，服务器生成JWT返回；2. 客户端存储JWT；3. 后续请求携带JWT；4. 服务器验证JWT有效性。',
'["JWT", "认证", "安全"]', 3, 1),

(3, 'Node.js的事件驱动架构？', '请解释Node.js的事件驱动模型和非阻塞I/O的优势。', 'medium', 'subjective',
'Node.js采用事件驱动、非阻塞I/O模型。单线程通过事件循环处理并发请求，I/O操作交给libuv线程池处理。优势：高并发处理能力、资源占用少、适合I/O密集型应用。',
'["Node.js", "事件驱动", "异步"]', 3, 1),

-- 数据库题目
(4, 'MySQL索引的类型和使用场景？', '请说明MySQL常见的索引类型及其适用场景。', 'medium', 'subjective',
'MySQL索引类型：1. B+Tree索引（最常用，支持范围查询）；2. Hash索引（仅支持等值查询）；3. 全文索引（用于文本搜索）；4. 空间索引（GIS应用）。选择依据查询模式和数据特征。',
'["MySQL", "索引", "数据库优化"]', 3, 1),

(4, '什么是数据库事务的ACID特性？', '请解释数据库事务的ACID特性及其含义。', 'medium', 'subjective',
'ACID特性：1. 原子性（Atomicity）- 事务是不可分割的工作单元；2. 一致性（Consistency）- 事务前后数据完整性保持一致；3. 隔离性（Isolation）- 并发事务互不干扰；4. 持久性（Durability）- 事务提交后永久保存。',
'["数据库", "事务", "ACID"]', 3, 1),

(4, 'Redis的数据结构有哪些？', '请列举Redis支持的数据结构及其应用场景。', 'easy', 'subjective',
'Redis数据结构：1. String（缓存、计数器）；2. Hash（对象存储）；3. List（消息队列、最新列表）；4. Set（标签、好友关系）；5. Sorted Set（排行榜）；6. Bitmap（签到统计）；7. HyperLogLog（UV统计）。',
'["Redis", "数据结构", "缓存"]', 3, 1),

(4, 'SQL的JOIN类型及区别？', '请解释SQL中各种JOIN的区别和使用场景。', 'medium', 'subjective',
'JOIN类型：1. INNER JOIN（返回两表匹配的记录）；2. LEFT JOIN（返回左表所有记录和右表匹配记录）；3. RIGHT JOIN（返回右表所有记录和左表匹配记录）；4. FULL OUTER JOIN（返回两表所有记录）。',
'["SQL", "JOIN", "数据库查询"]', 3, 1),

-- 算法与数据结构
(5, '快速排序的原理和时间复杂度？', '请说明快速排序的算法原理、时间复杂度和空间复杂度。', 'medium', 'subjective',
'快速排序采用分治策略：1. 选择基准元素；2. 将小于基准的元素移到左边，大于基准的移到右边；3. 递归处理左右子数组。平均时间复杂度O(nlogn)，最坏O(n²)，空间复杂度O(logn)。',
'["算法", "排序", "快速排序"]', 2, 1),

(5, '二叉树的遍历方式有哪些？', '请说明二叉树的前序、中序、后序和层序遍历的特点。', 'easy', 'subjective',
'二叉树遍历：1. 前序遍历（根-左-右）；2. 中序遍历（左-根-右，BST得到有序序列）；3. 后序遍历（左-右-根）；4. 层序遍历（按层从上到下、从左到右，使用队列实现）。',
'["数据结构", "二叉树", "遍历"]', 2, 1),

(5, '动态规划的核心思想？', '请解释动态规划的基本思想和解题步骤。', 'hard', 'subjective',
'动态规划核心：将复杂问题分解为重叠子问题，存储子问题结果避免重复计算。解题步骤：1. 定义状态；2. 找出状态转移方程；3. 初始化边界条件；4. 确定计算顺序。典型应用：背包问题、最长公共子序列。',
'["算法", "动态规划", "优化"]', 2, 1),

(5, 'HashMap的实现原理？', '请解释HashMap的底层数据结构和扩容机制。', 'hard', 'subjective',
'HashMap底层是数组+链表/红黑树。通过key的hashCode计算数组索引，哈希冲突时使用链表存储。当链表长度>8且数组长度>64时转为红黑树。扩容：当元素数量>容量*负载因子时，容量扩大2倍并重新hash。',
'["数据结构", "HashMap", "Java"]', 3, 1),

-- 系统设计
(6, '如何设计一个高并发系统？', '请说明设计高并发系统需要考虑的关键因素和常用技术。', 'hard', 'subjective',
'高并发设计要点：1. 负载均衡（Nginx、LVS）；2. 缓存（Redis、CDN）；3. 消息队列（异步处理）；4. 数据库优化（读写分离、分库分表）；5. 限流降级；6. 服务化拆分；7. 监控告警。',
'["系统设计", "高并发", "架构"]', 3, 1),

(6, '微服务架构的优缺点？', '请对比微服务架构和单体架构的优缺点。', 'medium', 'subjective',
'微服务优点：1. 独立部署和扩展；2. 技术栈灵活；3. 故障隔离；4. 团队自治。缺点：1. 系统复杂度增加；2. 分布式事务处理困难；3. 服务调用延迟；4. 运维成本高。适合大型复杂系统。',
'["微服务", "架构设计", "分布式"]', 3, 1),

(6, 'CAP理论是什么？', '请解释分布式系统的CAP理论及其应用。', 'hard', 'subjective',
'CAP理论指分布式系统无法同时满足：1. 一致性（Consistency）；2. 可用性（Availability）；3. 分区容错性（Partition tolerance）。实际系统在P的前提下选择CP或AP。例如：Zookeeper选CP，Eureka选AP。',
'["分布式", "CAP理论", "系统设计"]', 3, 1),

-- DevOps
(7, 'Docker和虚拟机的区别？', '请对比Docker容器和传统虚拟机的优缺点。', 'medium', 'subjective',
'Docker vs 虚拟机：1. Docker共享宿主机内核，虚拟机包含完整OS；2. Docker启动快（秒级），虚拟机慢（分钟级）；3. Docker资源占用少；4. 虚拟机隔离性更强；5. Docker适合微服务部署。',
'["Docker", "容器", "DevOps"]', 3, 1),

(7, 'CI/CD的流程和最佳实践？', '请说明CI/CD的基本流程和实施要点。', 'medium', 'subjective',
'CI/CD流程：1. 代码提交触发构建；2. 自动化测试；3. 构建镜像；4. 部署到测试环境；5. 自动化测试；6. 部署到生产环境。最佳实践：小步快跑、自动化测试覆盖、灰度发布、快速回滚。',
'["CI/CD", "DevOps", "自动化"]', 3, 1),

(7, 'Kubernetes的核心概念？', '请列举Kubernetes的主要组件和核心概念。', 'hard', 'subjective',
'K8s核心概念：1. Pod（最小部署单元）；2. Deployment（声明式部署）；3. Service（服务发现和负载均衡）；4. Ingress（外部访问入口）；5. ConfigMap/Secret（配置管理）；6. Namespace（资源隔离）。',
'["Kubernetes", "容器编排", "云原生"]', 3, 1);

-- ==================== 4. 插入面试会话示例 ====================
INSERT INTO `interview_sessions` (`user_id`, `category_id`, `status`, `started_at`, `ended_at`, `duration`, `score`) VALUES
(2, 2, 'completed', '2025-12-15 10:00:00', '2025-12-15 11:30:00', 5400, 85.5),
(3, 3, 'completed', '2025-12-16 14:00:00', '2025-12-16 15:45:00', 6300, 78.0),
(4, 4, 'completed', '2025-12-17 09:00:00', '2025-12-17 10:20:00', 4800, 92.0),
(5, 5, 'started', '2025-12-18 10:00:00', NULL, 0, NULL),
(6, 2, 'created', NULL, NULL, 0, NULL);

-- ==================== 5. 插入对话示例 ====================
INSERT INTO `interview_dialogues` (`session_id`, `sequence`, `type`, `content`) VALUES
(1, 1, 'question', 'Vue 3的Composition API有什么优势？'),
(1, 2, 'answer', 'Composition API主要有以下优势：1. 更好的代码组织和逻辑复用 2. 更好的TypeScript支持 3. 更灵活的组合方式'),
(1, 3, 'question', '请解释一下响应式原理'),
(1, 4, 'answer', 'Vue 3使用Proxy实现响应式，相比Vue 2的Object.defineProperty，可以监听对象属性的添加删除...');

SELECT '✅ 初始数据插入完成！' AS Status;
SELECT CONCAT('插入了 ', COUNT(*), ' 个用户') AS Result FROM users;
SELECT CONCAT('插入了 ', COUNT(*), ' 个类别') AS Result FROM categories;
SELECT CONCAT('插入了 ', COUNT(*), ' 个题目') AS Result FROM questions;
SELECT CONCAT('插入了 ', COUNT(*), ' 个面试会话') AS Result FROM interview_sessions;
