-- ====================================================
-- 社交功能模块 - 表结构和初始数据
-- ====================================================

SET NAMES utf8mb4;
USE interview_system;

-- ==================== 1. 用户详细资料表 ====================
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL UNIQUE,
  `bio` TEXT COMMENT '个人简介',
  `company` VARCHAR(200) COMMENT '公司',
  `position` VARCHAR(100) COMMENT '职位',
  `location` VARCHAR(200) COMMENT '所在地',
  `website` VARCHAR(500) COMMENT '个人网站',
  `github` VARCHAR(200) COMMENT 'GitHub账号',
  `linkedin` VARCHAR(200) COMMENT 'LinkedIn账号',
  `skills` JSON COMMENT '技能标签',
  `education` JSON COMMENT '教育经历',
  `experience` JSON COMMENT '工作经历',
  `followers_count` INT DEFAULT 0 COMMENT '粉丝数',
  `following_count` INT DEFAULT 0 COMMENT '关注数',
  `posts_count` INT DEFAULT 0 COMMENT '帖子数',
  `questions_answered` INT DEFAULT 0 COMMENT '回答问题数',
  `total_score` INT DEFAULT 0 COMMENT '总积分',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户详细资料表';

-- ==================== 2. 关注关系表 ====================
CREATE TABLE IF NOT EXISTS `user_follows` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `follower_id` BIGINT NOT NULL COMMENT '关注者ID',
  `following_id` BIGINT NOT NULL COMMENT '被关注者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follower_following` (`follower_id`, `following_id`),
  KEY `idx_follower` (`follower_id`),
  KEY `idx_following` (`following_id`),
  FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关注关系表';

-- ==================== 3. 社区帖子表 ====================
CREATE TABLE IF NOT EXISTS `community_posts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '发布者ID',
  `title` VARCHAR(500) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `content_type` VARCHAR(20) DEFAULT 'markdown' COMMENT '内容类型',
  `category` VARCHAR(100) COMMENT '分类',
  `tags` JSON COMMENT '标签',
  `cover_image` VARCHAR(500) COMMENT '封面图',
  `view_count` INT DEFAULT 0 COMMENT '浏览数',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `comment_count` INT DEFAULT 0 COMMENT '评论数',
  `collect_count` INT DEFAULT 0 COMMENT '收藏数',
  `is_pinned` TINYINT DEFAULT 0 COMMENT '是否置顶',
  `is_featured` TINYINT DEFAULT 0 COMMENT '是否精选',
  `status` VARCHAR(20) DEFAULT 'published' COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='社区帖子表';

-- ==================== 4. 评论表 ====================
CREATE TABLE IF NOT EXISTS `comments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT NOT NULL COMMENT '帖子ID',
  `user_id` BIGINT NOT NULL COMMENT '评论者ID',
  `parent_id` BIGINT DEFAULT NULL COMMENT '父评论ID',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_id`),
  FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ==================== 5. 点赞表 ====================
CREATE TABLE IF NOT EXISTS `likes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `target_type` VARCHAR(20) NOT NULL COMMENT '目标类型: post/comment/question',
  `target_id` BIGINT NOT NULL COMMENT '目标ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target` (`user_id`, `target_type`, `target_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target` (`target_type`, `target_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- ==================== 6. 收藏表 ====================
CREATE TABLE IF NOT EXISTS `collections` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `target_type` VARCHAR(20) NOT NULL COMMENT '目标类型: post/question',
  `target_id` BIGINT NOT NULL COMMENT '目标ID',
  `folder_name` VARCHAR(100) DEFAULT '默认收藏夹' COMMENT '收藏夹名称',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target` (`user_id`, `target_type`, `target_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target` (`target_type`, `target_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ==================== 7. 用户动态表 ====================
CREATE TABLE IF NOT EXISTS `user_activities` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `activity_type` VARCHAR(50) NOT NULL COMMENT '动态类型',
  `target_type` VARCHAR(20) COMMENT '目标类型',
  `target_id` BIGINT COMMENT '目标ID',
  `content` TEXT COMMENT '动态内容',
  `metadata` JSON COMMENT '元数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户动态表';

-- ==================== 8. 成就徽章表 ====================
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '成就名称',
  `description` TEXT COMMENT '成就描述',
  `icon` VARCHAR(500) COMMENT '成就图标',
  `badge_type` VARCHAR(50) COMMENT '徽章类型',
  `requirement` JSON COMMENT '获得条件',
  `rarity` VARCHAR(20) DEFAULT 'common' COMMENT '稀有度',
  `points` INT DEFAULT 0 COMMENT '积分奖励',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就徽章表';

-- ==================== 9. 用户成就表 ====================
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `achievement_id` BIGINT NOT NULL,
  `achieved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievement` (`user_id`, `achievement_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户成就表';

-- ==================== 10. 用户贡献表 ====================
CREATE TABLE IF NOT EXISTS `contributions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `contribution_type` VARCHAR(50) NOT NULL COMMENT '贡献类型',
  `contribution_date` DATE NOT NULL COMMENT '贡献日期',
  `count` INT DEFAULT 1 COMMENT '次数',
  `points` INT DEFAULT 0 COMMENT '获得积分',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`, `contribution_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户贡献表';

-- ==================== 插入初始数据 ====================

-- 1. 用户详细资料
INSERT INTO `user_profiles` (`user_id`, `bio`, `company`, `position`, `location`, `skills`, `followers_count`, `following_count`, `posts_count`, `questions_answered`, `total_score`) VALUES
(1, '系统管理员，负责平台运营和维护', '面试系统', 'CTO', '北京', '["系统架构", "团队管理", "产品设计"]', 120, 8, 15, 50, 5000),
(2, '全栈工程师，热爱技术分享和开源贡献 💻', '字节跳动', '高级前端工程师', '北京', '["Vue", "React", "Node.js", "TypeScript"]', 85, 42, 23, 156, 3200),
(3, '后端开发，专注于分布式系统和微服务架构', '阿里巴巴', 'Java开发专家', '杭州', '["Java", "Spring", "MySQL", "Redis", "Kafka"]', 67, 35, 18, 89, 2800),
(4, '算法爱好者，ACM金牌得主 🏆', '腾讯', '算法工程师', '深圳', '["算法", "数据结构", "Python", "C++"]', 112, 28, 31, 203, 4500),
(5, 'DevOps工程师，云原生技术布道师 ☁️', '美团', 'DevOps架构师', '北京', '["Docker", "K8s", "CI/CD", "Terraform"]', 45, 38, 12, 67, 1800),
(6, '前端性能优化专家，追求极致用户体验', '京东', '前端技术专家', '北京', '["性能优化", "Webpack", "Vite"]', 53, 31, 15, 78, 2100),
(7, '数据库专家，MySQL内核贡献者', '华为', 'DBA', '深圳', '["MySQL", "PostgreSQL", "数据库优化"]', 38, 25, 9, 45, 1500),
(8, '移动端开发，Flutter布道师 📱', '小米', 'Android开发', '北京', '["Android", "Flutter", "Kotlin"]', 29, 33, 7, 34, 1200),
(9, '系统架构师，分布式系统专家', '百度', '技术总监', '北京', '["系统设计", "分布式", "微服务"]', 95, 22, 21, 112, 3800),
(10, '产品经理转全栈，懂产品的技术人', '网易', '全栈工程师', '杭州', '["产品设计", "前端", "后端"]', 41, 45, 11, 56, 1600),
(11, 'AI工程师，专注自然语言处理', '商汤科技', 'AI研究员', '上海', '["Python", "PyTorch", "NLP", "深度学习"]', 76, 29, 16, 92, 2900);

-- 2. 关注关系（构建一个有趣的社交网络）
INSERT IGNORE INTO `user_follows` (`follower_id`, `following_id`) VALUES
-- 张三关注的人
(2, 1), (2, 3), (2, 4), (2, 6), (2, 9),
-- 李四关注的人
(3, 1), (3, 2), (3, 4), (3, 5), (3, 9),
-- 王五关注的人
(4, 1), (4, 2), (4, 3), (4, 9), (4, 11),
-- 赵六关注的人
(5, 1), (5, 2), (5, 3), (5, 7), (5, 9),
-- 其他关注关系
(6, 2), (6, 4), (6, 9),
(7, 3), (7, 5), (7, 9),
(8, 2), (8, 4), (8, 6),
(9, 1), (9, 2), (9, 3), (9, 4),
(10, 2), (10, 6), (10, 9),
(11, 2), (11, 3), (11, 4), (11, 9),
-- 管理员被很多人关注
(3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1), (11, 1);

-- 3. 社区帖子
INSERT INTO `community_posts` (`user_id`, `title`, `content`, `category`, `tags`, `cover_image`, `view_count`, `like_count`, `comment_count`, `is_featured`) VALUES
(2, '2025年前端技术趋势分析', '# 2025年前端技术趋势

## 1. Web Components成为主流
原生Web Components技术逐渐成熟，越来越多的项目开始采用...

## 2. AI辅助开发
GitHub Copilot等AI工具已经深度集成到开发流程中...

## 3. 性能优化持续重要
用户体验依然是核心竞争力...', 'frontend', '["前端", "技术趋势", "2025"]', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97', 1250, 89, 23, 1),

(3, 'Spring Boot 3.0新特性深度解析', '# Spring Boot 3.0 核心变化

Spring Boot 3.0是一个重大版本更新，带来了诸多改进...

## 主要特性
1. 基于Spring Framework 6.0
2. 最低Java版本要求为17
3. 原生支持GraalVM...', 'backend', '["Spring Boot", "Java", "后端开发"]', 'https://images.unsplash.com/photo-1555099962-4199c345e5dd', 980, 67, 18, 1),

(4, 'LeetCode刷题技巧总结', '# 算法刷题经验分享

作为ACM选手，我总结了一些刷题经验：

## 数据结构选择
- 需要频繁查找：用HashMap
- 需要有序：用TreeMap
- 需要FIFO：用Queue...', 'algorithm', '["算法", "LeetCode", "面试准备"]', 'https://images.unsplash.com/photo-1516116216624-53e697fedbea', 2100, 156, 42, 1),

(5, 'Kubernetes生产环境实战经验', '# K8s生产环境避坑指南

在生产环境部署K8s集群时，我踩过不少坑...

## 资源配置
合理设置resources limits和requests非常重要...', 'devops', '["Kubernetes", "DevOps", "生产环境"]', 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9', 756, 45, 15, 0),

(2, 'Vue 3 Composition API最佳实践', '# Composition API使用心得

用了一年Vue 3，总结一些Composition API的最佳实践...

## 逻辑复用
使用composables来复用逻辑...', 'frontend', '["Vue3", "Composition API", "最佳实践"]', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee', 1420, 98, 31, 1),

(9, '微服务架构设计模式', '# 微服务架构的关键设计模式

## 1. API Gateway模式
统一入口，处理认证、限流...

## 2. Circuit Breaker
熔断器保护下游服务...', 'architecture', '["微服务", "架构设计", "设计模式"]', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', 1650, 112, 28, 1),

(3, 'MySQL索引优化实战案例', '# 一次SQL优化案例分享

最近遇到一个慢查询问题，优化后性能提升100倍...

## 问题分析
通过EXPLAIN发现没有使用索引...', 'database', '["MySQL", "索引优化", "性能调优"]', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d', 890, 67, 19, 0),

(11, 'NLP入门：从零开始的情感分析', '# 自然语言处理入门教程

今天分享一个简单的情感分析项目...

## 数据准备
使用IMDb电影评论数据集...', 'ai', '["AI", "NLP", "机器学习"]', 'https://images.unsplash.com/photo-1677442136019-21780ecad995', 1120, 78, 22, 1),

(6, 'Webpack vs Vite：构建工具对比', '# 现代前端构建工具选择

对比了Webpack和Vite的优缺点...

## 开发体验
Vite的HMR速度明显更快...', 'frontend', '["Webpack", "Vite", "构建工具"]', 'https://images.unsplash.com/photo-1618477388954-7852f32655ec', 945, 54, 16, 0),

(4, '动态规划算法详解', '# 动态规划从入门到精通

动态规划是面试中的高频考点...

## 核心思想
将问题分解为重叠子问题...', 'algorithm', '["算法", "动态规划", "面试"]', 'https://images.unsplash.com/photo-1509228468518-180dd4864904', 1780, 134, 38, 1);

-- 4. 评论数据
INSERT INTO `comments` (`post_id`, `user_id`, `parent_id`, `content`, `like_count`) VALUES
-- 第一篇帖子的评论
(1, 3, NULL, '分析得很透彻！特别是关于Web Components的部分，确实是未来趋势。', 12),
(1, 4, NULL, '期待AI辅助开发能进一步提升效率，现在已经离不开Copilot了 😄', 8),
(1, 5, 1, '同意，我们团队已经开始尝试Web Components了', 5),
(1, 6, NULL, '性能优化永远是核心竞争力，用户体验才是王道！', 15),

-- 第二篇帖子的评论
(2, 2, NULL, 'Spring Boot 3.0的原生镜像支持真的很棒，启动速度快了好几倍', 10),
(2, 4, NULL, 'Java 17的新特性也值得学习', 7),
(2, 9, NULL, '我们生产环境已经全面升级到3.0了，体验不错', 9),

-- 第三篇帖子的评论
(3, 2, NULL, '感谢分享！正在准备面试，这些技巧很实用', 18),
(3, 5, NULL, 'ACM大佬的经验果然不一样 🏆', 12),
(3, 6, NULL, '收藏了，慢慢消化', 8),
(3, 11, NULL, '数据结构的选择确实很关键，受教了', 6),

-- 更多评论
(4, 2, NULL, 'K8s确实坑很多，生产环境要特别注意', 11),
(5, 3, NULL, 'Composition API用起来确实比Options API舒服', 14),
(6, 2, NULL, '微服务架构的复杂度确实不容小觑', 9),
(7, 5, NULL, '索引优化是个技术活，需要不断实践', 7),
(8, 4, NULL, 'AI领域发展太快了，要保持学习', 10),
(9, 2, NULL, 'Vite的开发体验确实比Webpack好很多', 13),
(10, 3, NULL, '动态规划是我的弱项，多谢分享', 8);

-- 5. 点赞数据
INSERT INTO `likes` (`user_id`, `target_type`, `target_id`) VALUES
-- 用户点赞帖子
(2, 'post', 3), (2, 'post', 4), (2, 'post', 6), (2, 'post', 7),
(3, 'post', 1), (3, 'post', 2), (3, 'post', 5), (3, 'post', 10),
(4, 'post', 1), (4, 'post', 2), (4, 'post', 6), (4, 'post', 9),
(5, 'post', 1), (5, 'post', 3), (5, 'post', 4), (5, 'post', 8),
(6, 'post', 1), (6, 'post', 5), (6, 'post', 9),
(7, 'post', 2), (7, 'post', 7),
(8, 'post', 1), (8, 'post', 5), (8, 'post', 9),
(9, 'post', 2), (9, 'post', 3), (9, 'post', 6),
(10, 'post', 1), (10, 'post', 9),
(11, 'post', 3), (11, 'post', 8), (11, 'post', 10),
-- 用户点赞评论
(2, 'comment', 1), (2, 'comment', 5), (2, 'comment', 8),
(3, 'comment', 2), (3, 'comment', 6),
(4, 'comment', 1), (4, 'comment', 4), (4, 'comment', 9);

-- 6. 收藏数据
INSERT INTO `collections` (`user_id`, `target_type`, `target_id`, `folder_name`) VALUES
(2, 'post', 3, '算法学习'),
(2, 'post', 4, '运维技术'),
(2, 'post', 6, '架构设计'),
(3, 'post', 1, '前端技术'),
(3, 'post', 5, '前端技术'),
(4, 'post', 2, '后端开发'),
(4, 'post', 7, '数据库'),
(5, 'post', 4, '默认收藏夹'),
(5, 'post', 6, '架构参考'),
(6, 'post', 1, '技术趋势'),
(6, 'post', 9, '工具对比');

-- 7. 用户动态
INSERT INTO `user_activities` (`user_id`, `activity_type`, `target_type`, `target_id`, `content`) VALUES
(2, 'post_published', 'post', 1, '发布了新文章《2025年前端技术趋势分析》'),
(2, 'post_published', 'post', 5, '发布了新文章《Vue 3 Composition API最佳实践》'),
(3, 'post_published', 'post', 2, '发布了新文章《Spring Boot 3.0新特性深度解析》'),
(3, 'post_published', 'post', 7, '发布了新文章《MySQL索引优化实战案例》'),
(4, 'post_published', 'post', 3, '发布了新文章《LeetCode刷题技巧总结》'),
(4, 'post_published', 'post', 10, '发布了新文章《动态规划算法详解》'),
(2, 'followed_user', 'user', 4, '关注了用户 王五'),
(3, 'followed_user', 'user', 2, '关注了用户 张三'),
(4, 'comment_posted', 'comment', 2, '评论了文章《2025年前端技术趋势分析》'),
(5, 'post_published', 'post', 4, '发布了新文章《Kubernetes生产环境实战经验》');

-- 8. 成就徽章
INSERT INTO `achievements` (`name`, `description`, `icon`, `badge_type`, `requirement`, `rarity`, `points`) VALUES
('初来乍到', '完成个人资料设置', '🎉', 'profile', '{"profile_complete": true}', 'common', 10),
('新手上路', '发布第一篇文章', '✍️', 'content', '{"posts_count": 1}', 'common', 20),
('社交达人', '关注10个用户', '👥', 'social', '{"following_count": 10}', 'common', 30),
('人气作者', '获得100个点赞', '❤️', 'engagement', '{"total_likes": 100}', 'rare', 100),
('技术专家', '发布10篇精选文章', '🏆', 'content', '{"featured_posts": 10}', 'rare', 200),
('算法大师', '完成100道算法题', '🧠', 'learning', '{"questions_solved": 100}', 'epic', 500),
('全栈工程师', '在前端、后端、数据库分类都有贡献', '💪', 'achievement', '{"categories_mastered": 3}', 'epic', 300),
('连续打卡7天', '连续7天活跃', '📅', 'daily', '{"daily_streak": 7}', 'uncommon', 50),
('连续打卡30天', '连续30天活跃', '🔥', 'daily', '{"daily_streak": 30}', 'rare', 150),
('知识分享者', '发布50篇文章', '📚', 'content', '{"posts_count": 50}', 'epic', 400);

-- 9. 用户成就（为一些用户发放成就）
INSERT INTO `user_achievements` (`user_id`, `achievement_id`) VALUES
-- 管理员获得多个成就
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
-- 张三的成就
(2, 1), (2, 2), (2, 3), (2, 4), (2, 8),
-- 李四的成就
(3, 1), (3, 2), (3, 3), (3, 8),
-- 王五的成就（算法大师）
(4, 1), (4, 2), (4, 3), (4, 4), (4, 6), (4, 8), (4, 9),
-- 其他用户的成就
(5, 1), (5, 2), (5, 3),
(6, 1), (6, 2), (6, 8),
(9, 1), (9, 2), (9, 3), (9, 4), (9, 5);

-- 10. 用户贡献记录（最近30天的贡献热力图数据）
INSERT INTO `contributions` (`user_id`, `contribution_type`, `contribution_date`, `count`, `points`) VALUES
-- 张三的贡献（活跃用户）
(2, 'post_published', '2025-12-18', 1, 20),
(2, 'comment_posted', '2025-12-18', 3, 9),
(2, 'post_published', '2025-12-17', 1, 20),
(2, 'comment_posted', '2025-12-16', 5, 15),
(2, 'post_liked', '2025-12-15', 8, 8),
(2, 'question_answered', '2025-12-14', 2, 40),
(2, 'comment_posted', '2025-12-13', 4, 12),
(2, 'post_published', '2025-12-10', 1, 20),
-- 李四的贡献
(3, 'post_published', '2025-12-18', 1, 20),
(3, 'comment_posted', '2025-12-17', 2, 6),
(3, 'question_answered', '2025-12-16', 3, 60),
(3, 'post_published', '2025-12-12', 1, 20),
-- 王五的贡献（算法题解答）
(4, 'question_answered', '2025-12-18', 5, 100),
(4, 'post_published', '2025-12-17', 1, 20),
(4, 'question_answered', '2025-12-16', 4, 80),
(4, 'comment_posted', '2025-12-15', 3, 9),
(4, 'question_answered', '2025-12-14', 6, 120),
(4, 'post_published', '2025-12-11', 1, 20),
-- 其他用户的贡献
(5, 'post_published', '2025-12-16', 1, 20),
(5, 'comment_posted', '2025-12-15', 2, 6),
(9, 'post_published', '2025-12-15', 1, 20),
(9, 'comment_posted', '2025-12-14', 3, 9),
(11, 'post_published', '2025-12-13', 1, 20);

-- 更新用户资料中的统计数据
UPDATE user_profiles up
JOIN (
    SELECT follower_id, COUNT(*) as cnt
    FROM user_follows
    GROUP BY follower_id
) f ON up.user_id = f.follower_id
SET up.following_count = f.cnt;

UPDATE user_profiles up
JOIN (
    SELECT following_id, COUNT(*) as cnt
    FROM user_follows
    GROUP BY following_id
) f ON up.user_id = f.following_id
SET up.followers_count = f.cnt;

UPDATE user_profiles up
JOIN (
    SELECT user_id, COUNT(*) as cnt
    FROM community_posts
    GROUP BY user_id
) p ON up.user_id = p.user_id
SET up.posts_count = p.cnt;

SELECT '✅ 社交功能数据插入完成！' AS Status;
SELECT CONCAT('创建了 ', COUNT(*), ' 个用户资料') AS Result FROM user_profiles;
SELECT CONCAT('创建了 ', COUNT(*), ' 个关注关系') AS Result FROM user_follows;
SELECT CONCAT('创建了 ', COUNT(*), ' 篇社区帖子') AS Result FROM community_posts;
SELECT CONCAT('创建了 ', COUNT(*), ' 条评论') AS Result FROM comments;
SELECT CONCAT('创建了 ', COUNT(*), ' 个点赞') AS Result FROM likes;
SELECT CONCAT('创建了 ', COUNT(*), ' 个收藏') AS Result FROM collections;
SELECT CONCAT('创建了 ', COUNT(*), ' 个成就徽章') AS Result FROM achievements;
SELECT CONCAT('发放了 ', COUNT(*), ' 个用户成就') AS Result FROM user_achievements;
