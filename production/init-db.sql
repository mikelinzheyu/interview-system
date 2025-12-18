-- ====================================================
-- AI面试系统 - 数据库初始化脚本
-- ====================================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==================== 用户表 ====================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(加密)',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-正常',
  `oauth_provider` VARCHAR(20) DEFAULT NULL COMMENT 'OAuth提供商',
  `oauth_id` VARCHAR(100) DEFAULT NULL COMMENT 'OAuth ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_oauth` (`oauth_provider`, `oauth_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ==================== 面试会话表 ====================
CREATE TABLE IF NOT EXISTS `interview_sessions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `category_id` BIGINT DEFAULT NULL COMMENT '类别ID',
  `status` VARCHAR(20) DEFAULT 'created' COMMENT '状态: created/started/completed/cancelled',
  `started_at` TIMESTAMP NULL COMMENT '开始时间',
  `ended_at` TIMESTAMP NULL COMMENT '结束时间',
  `duration` INT DEFAULT 0 COMMENT '持续时间(秒)',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '总分',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试会话表';

-- ==================== 面试对话表 ====================
CREATE TABLE IF NOT EXISTS `interview_dialogues` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '对话ID',
  `session_id` BIGINT NOT NULL COMMENT '会话ID',
  `sequence` INT NOT NULL COMMENT '对话序号',
  `type` VARCHAR(20) NOT NULL COMMENT '类型: question/answer',
  `content` TEXT NOT NULL COMMENT '内容',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_sequence` (`sequence`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试对话表';

-- ==================== 题目库表 ====================
CREATE TABLE IF NOT EXISTS `questions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '题目ID',
  `category_id` BIGINT NOT NULL COMMENT '类别ID',
  `title` VARCHAR(500) NOT NULL COMMENT '题目标题',
  `content` TEXT NOT NULL COMMENT '题目内容',
  `difficulty` VARCHAR(20) DEFAULT 'medium' COMMENT '难度: easy/medium/hard',
  `type` VARCHAR(20) DEFAULT 'subjective' COMMENT '类型: subjective/objective',
  `answer` TEXT DEFAULT NULL COMMENT '参考答案',
  `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签(JSON数组)',
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目库表';

-- ==================== 类别表 ====================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '类别ID',
  `name` VARCHAR(100) NOT NULL COMMENT '类别名称',
  `description` TEXT DEFAULT NULL COMMENT '描述',
  `parent_id` BIGINT DEFAULT NULL COMMENT '父类别ID',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='类别表';

-- ==================== 插入默认数据 ====================

-- 插入默认类别
INSERT INTO `categories` (`name`, `description`, `parent_id`, `sort_order`) VALUES
('Java开发', 'Java后端开发相关题目', NULL, 1),
('前端开发', '前端开发相关题目', NULL, 2),
('数据库', '数据库相关题目', NULL, 3),
('算法', '算法与数据结构', NULL, 4),
('系统设计', '系统设计相关题目', NULL, 5);

-- 插入示例题目
INSERT INTO `questions` (`category_id`, `title`, `content`, `difficulty`, `answer`) VALUES
(1, 'Java中的集合框架', '请详细介绍Java中的集合框架，包括List、Set、Map的区别和使用场景。', 'medium',
'List是有序可重复的集合，常用实现有ArrayList和LinkedList。Set是无序不可重复的集合，常用实现有HashSet和TreeSet。Map是键值对映射，常用实现有HashMap和TreeMap。'),
(2, 'Vue.js响应式原理', '请解释Vue.js 3的响应式原理，与Vue 2相比有什么改进？', 'medium',
'Vue 3使用Proxy替代Vue 2的Object.defineProperty实现响应式，可以监听对象属性的添加和删除，性能更好。'),
(3, 'MySQL索引优化', '如何优化MySQL的查询性能？请从索引角度说明。', 'hard',
'合理使用索引可以显著提升查询性能。应该在经常查询的字段上建立索引，避免在低选择性字段建索引，注意索引的覆盖和联合索引的最左前缀原则。');

SET FOREIGN_KEY_CHECKS = 1;

-- 索引优化：为题库添加 FULLTEXT 索引以提升搜索性能
-- 注意：InnoDB 引擎下 MySQL 8.0 支持 FULLTEXT
-- ALTER TABLE `questions` DROP INDEX IF EXISTS idx_questions_fulltext;
CREATE FULLTEXT INDEX idx_questions_fulltext ON `questions` (`title`, `content`);

-- 规范化标签表与关联表
CREATE TABLE IF NOT EXISTS `tags` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tag_name` (`name`),
  UNIQUE KEY `uk_tag_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

CREATE TABLE IF NOT EXISTS `question_tags` (
  `question_id` BIGINT NOT NULL,
  `tag_id` BIGINT NOT NULL,
  PRIMARY KEY (`question_id`, `tag_id`),
  KEY `idx_tag` (`tag_id`),
  CONSTRAINT `fk_qt_q` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_qt_t` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目-标签 关联表';
