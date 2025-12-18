-- ====================================================
-- 补充缺失的数据表和数据
-- ====================================================

SET NAMES utf8mb4;
USE interview_system;

-- ==================== 1. 错题集系统 ====================
CREATE TABLE IF NOT EXISTS `wrong_answer_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `question_id` BIGINT NOT NULL COMMENT '题目ID',
  `session_id` BIGINT DEFAULT NULL COMMENT '会话ID',
  `source` VARCHAR(50) DEFAULT 'question_bank' COMMENT '来源: question_bank/interview/practice',
  `is_correct` TINYINT DEFAULT 0 COMMENT '是否正确',
  `user_answer` TEXT COMMENT '用户答案',
  `correct_answer` TEXT COMMENT '正确答案',
  `review_status` VARCHAR(20) DEFAULT 'unreviewed' COMMENT '复习状态: unreviewed/reviewing/mastered',
  `error_type` VARCHAR(50) COMMENT '错误类型',
  `notes` TEXT COMMENT '笔记',
  `tags` JSON COMMENT '标签',
  `metadata` JSON COMMENT '元数据',
  `review_count` INT DEFAULT 0 COMMENT '复习次数',
  `last_reviewed_at` TIMESTAMP NULL COMMENT '最后复习时间',
  `mastered_at` TIMESTAMP NULL COMMENT '掌握时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_question_id` (`question_id`),
  KEY `idx_review_status` (`review_status`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错题记录表';

-- ==================== 2. 私信系统 ====================
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `participant_ids` JSON NOT NULL COMMENT '参与者ID数组',
  `last_message` TEXT COMMENT '最后一条消息',
  `last_message_time` TIMESTAMP NULL COMMENT '最后消息时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话表';

CREATE TABLE IF NOT EXISTS `private_messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT NOT NULL COMMENT '对话ID',
  `sender_id` BIGINT NOT NULL COMMENT '发送者ID',
  `receiver_id` BIGINT NOT NULL COMMENT '接收者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `message_type` VARCHAR(20) DEFAULT 'text' COMMENT '消息类型: text/image/file',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读',
  `read_at` TIMESTAMP NULL COMMENT '阅读时间',
  `is_deleted_by_sender` TINYINT DEFAULT 0 COMMENT '发送者是否删除',
  `is_deleted_by_receiver` TINYINT DEFAULT 0 COMMENT '接收者是否删除',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='私信消息表';

-- ==================== 3. 通知系统 ====================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `type` VARCHAR(50) NOT NULL COMMENT '通知类型: like/comment/follow/system',
  `title` VARCHAR(500) NOT NULL COMMENT '通知标题',
  `content` TEXT COMMENT '通知内容',
  `related_type` VARCHAR(50) COMMENT '关联类型: post/comment/user',
  `related_id` BIGINT COMMENT '关联ID',
  `action_url` VARCHAR(500) COMMENT '操作链接',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读',
  `read_at` TIMESTAMP NULL COMMENT '阅读时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ==================== 4. 学习路径系统 ====================
CREATE TABLE IF NOT EXISTS `learning_paths` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL COMMENT '路径名称',
  `description` TEXT COMMENT '路径描述',
  `icon` VARCHAR(500) COMMENT '图标',
  `cover_image` VARCHAR(500) COMMENT '封面图',
  `difficulty` VARCHAR(20) DEFAULT 'medium' COMMENT '难度',
  `estimated_hours` INT DEFAULT 0 COMMENT '预估学习时长(小时)',
  `category` VARCHAR(100) COMMENT '分类',
  `tags` JSON COMMENT '标签',
  `is_featured` TINYINT DEFAULT 0 COMMENT '是否精选',
  `enrollment_count` INT DEFAULT 0 COMMENT '报名人数',
  `completion_count` INT DEFAULT 0 COMMENT '完成人数',
  `rating` DECIMAL(3,2) DEFAULT 0.00 COMMENT '评分',
  `status` VARCHAR(20) DEFAULT 'published' COMMENT '状态',
  `created_by` BIGINT COMMENT '创建者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_is_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习路径表';

CREATE TABLE IF NOT EXISTS `learning_path_steps` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `path_id` BIGINT NOT NULL COMMENT '路径ID',
  `step_order` INT NOT NULL COMMENT '步骤顺序',
  `title` VARCHAR(200) NOT NULL COMMENT '步骤标题',
  `description` TEXT COMMENT '步骤描述',
  `content_type` VARCHAR(50) COMMENT '内容类型: question/article/video/quiz',
  `content_id` BIGINT COMMENT '内容ID',
  `estimated_minutes` INT DEFAULT 0 COMMENT '预估时长(分钟)',
  `is_required` TINYINT DEFAULT 1 COMMENT '是否必修',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_path_id` (`path_id`),
  KEY `idx_step_order` (`step_order`),
  FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习路径步骤表';

CREATE TABLE IF NOT EXISTS `user_learning_paths` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `path_id` BIGINT NOT NULL,
  `status` VARCHAR(20) DEFAULT 'in_progress' COMMENT '状态: enrolled/in_progress/completed',
  `progress` DECIMAL(5,2) DEFAULT 0.00 COMMENT '进度百分比',
  `current_step_id` BIGINT COMMENT '当前步骤ID',
  `completed_steps` JSON COMMENT '已完成步骤ID数组',
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  `last_accessed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_path` (`user_id`, `path_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_path_id` (`path_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户学习路径表';

-- ==================== 5. 领域/学科系统 ====================
CREATE TABLE IF NOT EXISTS `domains` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '领域名称',
  `slug` VARCHAR(120) UNIQUE NOT NULL COMMENT 'URL标识',
  `icon` VARCHAR(100) COMMENT '图标emoji',
  `description` TEXT COMMENT '描述',
  `parent_id` BIGINT DEFAULT NULL COMMENT '父领域ID',
  `level` INT DEFAULT 1 COMMENT '层级',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `question_count` INT DEFAULT 0 COMMENT '题目数量',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否激活',
  `metadata` JSON COMMENT '元数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习领域表';

CREATE TABLE IF NOT EXISTS `user_domain_progress` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `domain_id` BIGINT NOT NULL,
  `total_questions` INT DEFAULT 0 COMMENT '总题目数',
  `attempted_questions` INT DEFAULT 0 COMMENT '已尝试题目数',
  `correct_questions` INT DEFAULT 0 COMMENT '答对题目数',
  `completion_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT '完成率',
  `accuracy_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT '正确率',
  `total_time_spent` INT DEFAULT 0 COMMENT '总学习时长(秒)',
  `last_practiced_at` TIMESTAMP NULL COMMENT '最后练习时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_domain` (`user_id`, `domain_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_domain_id` (`domain_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户领域学习进度表';

-- ==================== 6. 论坛系统 ====================
CREATE TABLE IF NOT EXISTS `forums` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL COMMENT '论坛名称',
  `slug` VARCHAR(220) UNIQUE NOT NULL COMMENT 'URL标识',
  `description` TEXT COMMENT '论坛描述',
  `icon` VARCHAR(100) COMMENT '图标',
  `category` VARCHAR(100) COMMENT '分类',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `post_count` INT DEFAULT 0 COMMENT '帖子数',
  `member_count` INT DEFAULT 0 COMMENT '成员数',
  `is_private` TINYINT DEFAULT 0 COMMENT '是否私有',
  `moderator_ids` JSON COMMENT '版主ID数组',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛表';

-- ==================== 7. 用户设置表 ====================
CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL UNIQUE,
  `theme` VARCHAR(20) DEFAULT 'light' COMMENT '主题: light/dark/auto',
  `language` VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言',
  `email_notifications` TINYINT DEFAULT 1 COMMENT '邮件通知',
  `push_notifications` TINYINT DEFAULT 1 COMMENT '推送通知',
  `notification_preferences` JSON COMMENT '通知偏好设置',
  `privacy_settings` JSON COMMENT '隐私设置',
  `display_preferences` JSON COMMENT '显示偏好',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- ==================== 8. 登录日志表 ====================
CREATE TABLE IF NOT EXISTS `login_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `ip_address` VARCHAR(50) COMMENT 'IP地址',
  `user_agent` TEXT COMMENT '用户代理',
  `login_method` VARCHAR(50) COMMENT '登录方式: password/oauth/sms',
  `device_type` VARCHAR(50) COMMENT '设备类型',
  `location` VARCHAR(200) COMMENT '地理位置',
  `is_successful` TINYINT DEFAULT 1 COMMENT '是否成功',
  `failure_reason` VARCHAR(200) COMMENT '失败原因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- ==================== 9. 系统配置表 ====================
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `value_type` VARCHAR(20) DEFAULT 'string' COMMENT '值类型: string/number/boolean/json',
  `category` VARCHAR(50) COMMENT '配置分类',
  `description` TEXT COMMENT '配置描述',
  `is_public` TINYINT DEFAULT 0 COMMENT '是否公开',
  `updated_by` BIGINT COMMENT '更新者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ==================== 10. 问答系统扩展表 ====================
CREATE TABLE IF NOT EXISTS `question_attempts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `question_id` BIGINT NOT NULL,
  `session_id` BIGINT DEFAULT NULL,
  `user_answer` TEXT COMMENT '用户答案',
  `is_correct` TINYINT DEFAULT 0 COMMENT '是否正确',
  `score` DECIMAL(5,2) DEFAULT 0.00 COMMENT '得分',
  `time_spent` INT DEFAULT 0 COMMENT '用时(秒)',
  `attempt_number` INT DEFAULT 1 COMMENT '尝试次数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_question_id` (`question_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目尝试记录表';

-- ==================== 插入初始数据 ====================

-- 1. 插入错题记录示例
INSERT INTO `wrong_answer_records` (`user_id`, `question_id`, `source`, `is_correct`, `review_status`, `error_type`, `notes`, `review_count`) VALUES
(2, 1, 'question_bank', 0, 'reviewing', '概念理解错误', '需要加强Vue响应式原理的理解', 2),
(2, 5, 'interview', 0, 'unreviewed', '知识盲区', '不熟悉动态规划算法', 0),
(3, 2, 'question_bank', 0, 'mastered', '粗心大意', '已掌握Spring Boot相关知识', 3),
(4, 3, 'practice', 0, 'reviewing', '思路错误', '算法思路不够清晰', 1),
(5, 7, 'question_bank', 0, 'unreviewed', '知识遗忘', 'K8s配置容易遗忘', 0);

-- 2. 插入对话和私信示例
INSERT INTO `conversations` (`participant_ids`, `last_message`, `last_message_time`) VALUES
('[2, 3]', '好的，谢谢！', '2025-12-18 14:30:00'),
('[2, 4]', '周末有空一起刷题吗？', '2025-12-18 10:20:00'),
('[3, 5]', '那个Spring Boot的问题解决了吗？', '2025-12-17 16:45:00'),
('[4, 9]', '分享一下你的算法学习方法吧', '2025-12-17 09:15:00');

INSERT INTO `private_messages` (`conversation_id`, `sender_id`, `receiver_id`, `content`, `is_read`) VALUES
(1, 2, 3, '你好，请问Spring Boot 3.0的配置有什么变化？', 1),
(1, 3, 2, '主要是最低Java版本要求17了，还有一些自动配置的改进。', 1),
(1, 2, 3, '好的，谢谢！', 0),
(2, 2, 4, '周末有空一起刷题吗？', 0),
(3, 3, 5, '那个Spring Boot的问题解决了吗？', 1),
(3, 5, 3, '解决了，原来是配置文件路径的问题', 1),
(4, 4, 9, '分享一下你的算法学习方法吧', 1),
(4, 9, 4, '我主要是先理解核心思想，然后通过大量练习巩固', 0);

-- 3. 插入通知示例
INSERT INTO `notifications` (`user_id`, `type`, `title`, `content`, `related_type`, `related_id`, `is_read`) VALUES
(2, 'like', '你的文章获得了点赞', '王五 点赞了你的文章《2025年前端技术趋势分析》', 'post', 1, 0),
(2, 'comment', '新评论', '李四 评论了你的文章《Vue 3 Composition API最佳实践》', 'post', 5, 0),
(2, 'follow', '新关注者', '赵六 关注了你', 'user', 5, 1),
(3, 'like', '你的文章获得了点赞', '张三 点赞了你的文章《Spring Boot 3.0新特性深度解析》', 'post', 2, 1),
(4, 'comment', '新评论', '张三 评论了你的文章《LeetCode刷题技巧总结》', 'post', 3, 0),
(2, 'system', '系统通知', '你的账号在新设备登录，如非本人操作请及时修改密码', NULL, NULL, 1);

-- 4. 插入学习路径
INSERT INTO `learning_paths` (`name`, `description`, `difficulty`, `estimated_hours`, `category`, `tags`, `is_featured`, `enrollment_count`, `completion_count`, `rating`, `created_by`) VALUES
('前端工程师成长之路', '从零基础到高级前端工程师的完整学习路径，涵盖HTML、CSS、JavaScript、Vue、React等核心技术栈', 'medium', 120, '前端开发', '["前端", "Vue", "React", "工程化"]', 1, 156, 23, 4.8, 2),
('Java后端开发进阶', 'Spring Boot、微服务、分布式系统完整学习路径', 'hard', 150, '后端开发', '["Java", "Spring", "微服务"]', 1, 134, 18, 4.7, 3),
('算法与数据结构精通', '系统学习常见算法和数据结构，掌握解题技巧', 'hard', 100, '算法', '["算法", "数据结构", "LeetCode"]', 1, 289, 45, 4.9, 4),
('DevOps工程师养成计划', 'Docker、Kubernetes、CI/CD完整实践', 'medium', 80, 'DevOps', '["Docker", "K8s", "CI/CD"]', 1, 98, 15, 4.6, 5),
('全栈工程师进阶路线', '前端+后端+数据库全栈技能培养', 'hard', 200, '全栈', '["全栈", "前端", "后端", "数据库"]', 1, 201, 28, 4.8, 9);

-- 5. 插入学习路径步骤
INSERT INTO `learning_path_steps` (`path_id`, `step_order`, `title`, `description`, `content_type`, `estimated_minutes`) VALUES
(1, 1, 'HTML基础', '学习HTML5的基本标签和语义化', 'article', 120),
(1, 2, 'CSS布局', '掌握Flexbox和Grid布局', 'article', 180),
(1, 3, 'JavaScript核心', '学习ES6+语法和核心概念', 'article', 240),
(1, 4, 'Vue 3入门', '学习Vue 3 Composition API', 'article', 300),
(1, 5, '前端工程化', '学习Webpack、Vite等构建工具', 'article', 200),
(2, 1, 'Java基础语法', '掌握Java核心语法', 'article', 180),
(2, 2, 'Spring Boot入门', '学习Spring Boot框架', 'article', 240),
(2, 3, '微服务架构', '理解微服务设计模式', 'article', 300),
(3, 1, '数组与字符串', '掌握基础数据结构', 'question', 120),
(3, 2, '链表与树', '学习链表和树的操作', 'question', 180),
(3, 3, '动态规划', '掌握动态规划算法', 'question', 240);

-- 6. 插入用户学习路径
INSERT INTO `user_learning_paths` (`user_id`, `path_id`, `status`, `progress`, `current_step_id`, `completed_steps`) VALUES
(2, 1, 'in_progress', 60.00, 4, '[1, 2, 3]'),
(3, 2, 'in_progress', 45.00, 2, '[1]'),
(4, 3, 'completed', 100.00, NULL, '[9, 10, 11]'),
(5, 4, 'in_progress', 30.00, 1, '[]'),
(6, 1, 'in_progress', 25.00, 2, '[1]');

-- 7. 插入领域数据
INSERT INTO `domains` (`name`, `slug`, `icon`, `description`, `parent_id`, `level`, `question_count`, `is_active`) VALUES
('计算机科学', 'computer-science', '💻', '软件工程、算法、系统设计等计算机相关技术', NULL, 1, 500, 1),
('前端开发', 'frontend', '🎨', 'HTML、CSS、JavaScript、Vue、React等前端技术', 1, 2, 150, 1),
('后端开发', 'backend', '⚙️', 'Java、Python、Node.js等后端技术', 1, 2, 200, 1),
('数据库', 'database', '🗄️', 'MySQL、Redis、MongoDB等数据库技术', 1, 2, 80, 1),
('算法与数据结构', 'algorithm', '🧮', '常见算法和数据结构', 1, 2, 100, 1),
('金融学', 'finance', '💰', '投资分析、风险管理、金融工程', NULL, 1, 120, 1),
('医学', 'medicine', '⚕️', '临床医学、诊断学、药理学', NULL, 1, 90, 1),
('法律', 'law', '⚖️', '民法、刑法、商法', NULL, 1, 75, 1);

-- 8. 插入用户学习进度
INSERT INTO `user_domain_progress` (`user_id`, `domain_id`, `total_questions`, `attempted_questions`, `correct_questions`, `completion_rate`, `accuracy_rate`, `total_time_spent`) VALUES
(2, 2, 150, 85, 72, 56.67, 84.71, 15600),
(2, 5, 100, 45, 38, 45.00, 84.44, 8900),
(3, 3, 200, 120, 105, 60.00, 87.50, 22000),
(4, 5, 100, 100, 95, 100.00, 95.00, 18000),
(5, 4, 80, 50, 42, 62.50, 84.00, 9500);

-- 9. 插入论坛
INSERT INTO `forums` (`name`, `slug`, `description`, `category`, `post_count`, `member_count`) VALUES
('前端技术讨论区', 'frontend-tech', '讨论Vue、React、Angular等前端框架和技术', '前端开发', 234, 1256),
('后端架构设计', 'backend-architecture', '分享后端架构设计经验和最佳实践', '后端开发', 189, 987),
('算法题解分享', 'algorithm-solutions', '分享算法题目的解题思路和技巧', '算法', 456, 2134),
('职场经验交流', 'career-experience', '分享求职、面试、职场发展经验', '职场', 312, 1543),
('开源项目推荐', 'open-source', '推荐优秀的开源项目', '开源', 178, 892);

-- 10. 插入用户设置
INSERT INTO `user_settings` (`user_id`, `theme`, `language`, `email_notifications`, `push_notifications`) VALUES
(1, 'light', 'zh-CN', 1, 1),
(2, 'dark', 'zh-CN', 1, 1),
(3, 'light', 'zh-CN', 1, 0),
(4, 'dark', 'zh-CN', 0, 1),
(5, 'auto', 'zh-CN', 1, 1);

-- 11. 插入登录日志
INSERT INTO `login_logs` (`user_id`, `ip_address`, `user_agent`, `login_method`, `device_type`, `is_successful`) VALUES
(2, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'password', 'desktop', 1),
(3, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'password', 'desktop', 1),
(4, '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'oauth', 'mobile', 1),
(2, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'password', 'desktop', 1);

-- 12. 插入系统配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `value_type`, `category`, `description`, `is_public`) VALUES
('site_name', '智能面试系统', 'string', 'general', '网站名称', 1),
('site_description', '专业的面试准备和技能提升平台', 'string', 'general', '网站描述', 1),
('max_upload_size', '10485760', 'number', 'upload', '最大上传文件大小(字节)', 0),
('enable_ai_features', 'true', 'boolean', 'features', '是否启用AI功能', 0),
('default_theme', 'light', 'string', 'ui', '默认主题', 1);

-- 13. 插入题目尝试记录
INSERT INTO `question_attempts` (`user_id`, `question_id`, `is_correct`, `score`, `time_spent`, `attempt_number`) VALUES
(2, 1, 1, 100.00, 180, 1),
(2, 2, 0, 0.00, 240, 1),
(2, 3, 1, 100.00, 320, 1),
(3, 1, 1, 100.00, 150, 1),
(3, 2, 1, 100.00, 200, 1),
(4, 5, 1, 100.00, 420, 1),
(4, 6, 1, 100.00, 380, 1);

SELECT '✅ 补充表创建完成！' AS Status;
SELECT CONCAT('创建了 ', COUNT(*), ' 条错题记录') AS Result FROM wrong_answer_records;
SELECT CONCAT('创建了 ', COUNT(*), ' 个对话') AS Result FROM conversations;
SELECT CONCAT('创建了 ', COUNT(*), ' 条私信') AS Result FROM private_messages;
SELECT CONCAT('创建了 ', COUNT(*), ' 条通知') AS Result FROM notifications;
SELECT CONCAT('创建了 ', COUNT(*), ' 个学习路径') AS Result FROM learning_paths;
SELECT CONCAT('创建了 ', COUNT(*), ' 个学习领域') AS Result FROM domains;
SELECT CONCAT('创建了 ', COUNT(*), ' 个论坛') AS Result FROM forums;
SELECT CONCAT('创建了 ', COUNT(*), ' 条题目尝试记录') AS Result FROM question_attempts;
