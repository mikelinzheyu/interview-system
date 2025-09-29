/*
 Navicat Premium Dump SQL

 Source Server         : lmy
 Source Server Type    : MySQL
 Source Server Version : 80043 (8.0.43)
 Source Host           : localhost:3306
 Source Schema         : interview_system

 Target Server Type    : MySQL
 Target Server Version : 80043 (8.0.43)
 File Encoding         : 65001

 Date: 20/09/2025 21:36:31
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL COMMENT '用户ID',
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型',
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模块',
  `target_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '目标类型',
  `target_id` bigint NULL DEFAULT NULL COMMENT '目标ID',
  `old_data` json NULL COMMENT '原数据',
  `new_data` json NULL COMMENT '新数据',
  `result` enum('success','failed','partial') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'success' COMMENT '结果',
  `error_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '错误信息',
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '用户代理',
  `request_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '请求ID',
  `duration_ms` int NULL DEFAULT NULL COMMENT '耗时毫秒',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_action`(`user_id` ASC, `action` ASC) USING BTREE,
  INDEX `idx_module`(`module` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE,
  INDEX `idx_target`(`target_type` ASC, `target_id` ASC) USING BTREE,
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '操作日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int NULL DEFAULT NULL COMMENT '父分类ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `desc_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '描述',
  `type` enum('language','framework','domain') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型',
  `icon` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图标URL',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_parent`(`parent_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_sort`(`sort_order` ASC) USING BTREE,
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for configs
-- ----------------------------
DROP TABLE IF EXISTS `configs`;
CREATE TABLE `configs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键',
  `value` json NOT NULL COMMENT '配置值',
  `desc_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '描述',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类',
  `is_public` tinyint(1) NULL DEFAULT 0 COMMENT '公开',
  `updated_by` bigint NULL DEFAULT NULL COMMENT '更新者',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `key_name`(`key_name` ASC) USING BTREE,
  INDEX `updated_by`(`updated_by` ASC) USING BTREE,
  INDEX `idx_key`(`key_name` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  CONSTRAINT `configs_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for contexts
-- ----------------------------
DROP TABLE IF EXISTS `contexts`;
CREATE TABLE `contexts`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` bigint NOT NULL COMMENT '会话ID',
  `ctx_data` json NOT NULL COMMENT '上下文数据',
  `ctx_type` enum('conv','eval','bg') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型',
  `sys_prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '系统提示',
  `history` json NULL COMMENT '历史摘要',
  `user_profile` json NULL COMMENT '用户画像',
  `metrics` json NULL COMMENT '指标',
  `token_count` int NULL DEFAULT NULL COMMENT 'Token数',
  `max_tokens` int NULL DEFAULT NULL COMMENT '最大Token',
  `temperature` decimal(3, 2) NULL DEFAULT 0.70 COMMENT '温度',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_session`(`session_id` ASC) USING BTREE,
  INDEX `idx_type`(`ctx_type` ASC) USING BTREE,
  CONSTRAINT `contexts_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI上下文表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for dialogues
-- ----------------------------
DROP TABLE IF EXISTS `dialogues`;
CREATE TABLE `dialogues`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` bigint NOT NULL COMMENT '会话ID',
  `seq` int NOT NULL COMMENT '序号',
  `role` enum('ai','user','sys') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色',
  `msg_type` enum('text','code','image','audio') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'text' COMMENT '消息类型',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '提示词',
  `tokens` json NULL COMMENT 'Token统计',
  `response_time` int NULL DEFAULT NULL COMMENT '响应时间ms',
  `confidence` decimal(3, 2) NULL DEFAULT NULL COMMENT '置信度',
  `ext` json NULL COMMENT '扩展字段',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_session`(`session_id` ASC) USING BTREE,
  INDEX `idx_seq`(`seq` ASC) USING BTREE,
  INDEX `idx_role`(`role` ASC) USING BTREE,
  INDEX `idx_dialogues_session_seq`(`session_id` ASC, `seq` ASC) USING BTREE,
  CONSTRAINT `dialogues_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '对话记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for favorites
-- ----------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `folder` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'default' COMMENT '收藏夹',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `priority` tinyint NULL DEFAULT 0 COMMENT '优先级0-5',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_question`(`user_id` ASC, `question_id` ASC) USING BTREE,
  INDEX `question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_folder`(`folder` ASC) USING BTREE,
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '收藏表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for files
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL COMMENT '上传者ID',
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件名',
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '原始文件名',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件路径',
  `file_size` bigint NULL DEFAULT NULL COMMENT '文件大小',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'MIME类型',
  `file_hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '文件哈希',
  `usage_type` enum('avatar','question_image','attachment','audio','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用途',
  `ref_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '关联类型',
  `ref_id` bigint NULL DEFAULT NULL COMMENT '关联ID',
  `is_public` tinyint(1) NULL DEFAULT 0 COMMENT '是否公开',
  `download_count` int NULL DEFAULT 0 COMMENT '下载次数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_hash`(`file_hash` ASC) USING BTREE,
  INDEX `idx_usage`(`usage_type` ASC) USING BTREE,
  INDEX `idx_ref`(`ref_type` ASC, `ref_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '文件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `type` enum('system','study','interview') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '内容',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读',
  `action_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作链接',
  `priority` tinyint NULL DEFAULT 1 COMMENT '优先级1-5',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_read`(`user_id` ASC, `is_read` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_expires`(`expires_at` ASC) USING BTREE,
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for progress
-- ----------------------------
DROP TABLE IF EXISTS `progress`;
CREATE TABLE `progress`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `category_id` int NOT NULL COMMENT '分类ID',
  `total` int NULL DEFAULT 0 COMMENT '总数',
  `completed` int NULL DEFAULT 0 COMMENT '完成数',
  `correct` int NULL DEFAULT 0 COMMENT '正确数',
  `accuracy` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '正确率',
  `study_time` int NULL DEFAULT 0 COMMENT '学习时长(分钟)',
  `last_study` timestamp NULL DEFAULT NULL COMMENT '最后学习',
  `target_date` date NULL DEFAULT NULL COMMENT '目标日期',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_category`(`user_id` ASC, `category_id` ASC) USING BTREE,
  INDEX `category_id`(`category_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_accuracy`(`accuracy` ASC) USING BTREE,
  CONSTRAINT `progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `progress_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '学习进度表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for prompts
-- ----------------------------
DROP TABLE IF EXISTS `prompts`;
CREATE TABLE `prompts`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '名称',
  `desc_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '描述',
  `type` enum('sys','interview','eval','followup') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型',
  `category_id` int NULL DEFAULT NULL COMMENT '分类',
  `difficulty` enum('junior','mid','senior') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '难度',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `vars` json NULL COMMENT '变量定义',
  `usage_count` int NULL DEFAULT 0 COMMENT '使用次数',
  `score` decimal(3, 2) NULL DEFAULT NULL COMMENT '效果评分',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '启用',
  `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '1.0' COMMENT '版本',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建者',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `category_id`(`category_id` ASC) USING BTREE,
  INDEX `created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_active`(`is_active` ASC) USING BTREE,
  CONSTRAINT `prompts_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `prompts_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '提示词模板表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for question_feedback
-- ----------------------------
DROP TABLE IF EXISTS `question_feedback`;
CREATE TABLE `question_feedback`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `type` enum('error','unclear','suggestion','praise','difficulty') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '反馈类型',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '反馈内容',
  `difficulty_vote` tinyint NULL DEFAULT NULL COMMENT '难度投票1-5',
  `quality_vote` tinyint NULL DEFAULT NULL COMMENT '质量投票1-5',
  `status` enum('pending','reviewing','resolved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '状态',
  `admin_reply` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '管理员回复',
  `resolved_by` bigint NULL DEFAULT NULL COMMENT '处理人',
  `resolved_at` timestamp NULL DEFAULT NULL COMMENT '处理时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `resolved_by`(`resolved_by` ASC) USING BTREE,
  INDEX `idx_question`(`question_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_type_status`(`type` ASC, `status` ASC) USING BTREE,
  CONSTRAINT `question_feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `question_feedback_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `question_feedback_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '题目反馈表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for question_tags
-- ----------------------------
DROP TABLE IF EXISTS `question_tags`;
CREATE TABLE `question_tags`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `tag_id` int NOT NULL COMMENT '标签ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_question_tag`(`question_id` ASC, `tag_id` ASC) USING BTREE,
  INDEX `idx_question`(`question_id` ASC) USING BTREE,
  INDEX `idx_tag`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `question_tags_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `question_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '题目标签关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for question_versions
-- ----------------------------
DROP TABLE IF EXISTS `question_versions`;
CREATE TABLE `question_versions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '版本号',
  `title` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '内容',
  `answer` json NULL COMMENT '答案',
  `change_type` enum('create','update','fix','optimize') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '变更类型',
  `change_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '变更原因',
  `diff_data` json NULL COMMENT '差异数据',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建者',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_question`(`question_id` ASC) USING BTREE,
  INDEX `idx_version`(`version` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE,
  CONSTRAINT `question_versions_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `question_versions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '题目版本表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL COMMENT '分类ID',
  `title` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `answer` json NOT NULL COMMENT '答案(多格式支持)',
  `difficulty` enum('easy','medium','hard') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '难度',
  `type` enum('choice','coding','essay','practical') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '题型',
  `tags` json NULL COMMENT '标签',
  `view_count` int NULL DEFAULT 0 COMMENT '浏览数',
  `like_count` int NULL DEFAULT 0 COMMENT '点赞数',
  `difficulty_score` decimal(3, 1) NULL DEFAULT NULL COMMENT '难度评分1-10',
  `time_estimate` int NULL DEFAULT NULL COMMENT '预估时间(分钟)',
  `is_public` tinyint(1) NULL DEFAULT 1 COMMENT '是否公开',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建者',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ext` json NULL COMMENT '扩展字段',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_difficulty`(`difficulty` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE,
  INDEX `idx_questions_cat_diff`(`category_id` ASC, `difficulty` ASC) USING BTREE,
  FULLTEXT INDEX `idx_search`(`title`, `content`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `questions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '题目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for records
-- ----------------------------
DROP TABLE IF EXISTS `records`;
CREATE TABLE `records`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `answer` json NOT NULL COMMENT '用户答案',
  `is_correct` tinyint(1) NULL DEFAULT NULL COMMENT '是否正确',
  `score` decimal(5, 2) NULL DEFAULT NULL COMMENT '得分',
  `time_spent` int NULL DEFAULT NULL COMMENT '耗时(秒)',
  `attempts` int NULL DEFAULT 1 COMMENT '尝试次数',
  `is_first` tinyint(1) NULL DEFAULT 1 COMMENT '是否首次',
  `status` enum('pending','reviewed','disputed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '状态',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_question`(`question_id` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE,
  INDEX `idx_correct`(`is_correct` ASC) USING BTREE,
  INDEX `idx_user_time`(`user_id` ASC, `created_at` DESC) USING BTREE,
  INDEX `idx_records_user_time`(`user_id` ASC, `created_at` DESC) USING BTREE,
  CONSTRAINT `records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `records_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '答题记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for reports
-- ----------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` bigint NOT NULL COMMENT '会话ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `overall_score` decimal(5, 2) NULL DEFAULT NULL COMMENT '总分',
  `tech_score` decimal(5, 2) NULL DEFAULT NULL COMMENT '技术分',
  `comm_score` decimal(5, 2) NULL DEFAULT NULL COMMENT '沟通分',
  `solve_score` decimal(5, 2) NULL DEFAULT NULL COMMENT '解决问题分',
  `confidence` decimal(3, 2) NULL DEFAULT NULL COMMENT '自信度',
  `speed_score` decimal(5, 2) NULL DEFAULT NULL COMMENT '速度分',
  `strengths` json NULL COMMENT '优势',
  `weaknesses` json NULL COMMENT '不足',
  `suggestions` json NULL COMMENT '建议',
  `analysis` json NULL COMMENT '详细分析',
  `ai_feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT 'AI反馈',
  `plan` json NULL COMMENT '提升计划',
  `next_steps` json NULL COMMENT '下步建议',
  `data` json NULL COMMENT '报告数据',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '生成模型',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_session`(`session_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_score`(`overall_score` ASC) USING BTREE,
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '分析报告表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `desc_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '描述',
  `permissions` json NULL COMMENT '权限列表',
  `level` tinyint NULL DEFAULT 1 COMMENT '权限级别',
  `is_system` tinyint(1) NULL DEFAULT 0 COMMENT '系统角色',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE,
  INDEX `idx_active`(`is_active` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '角色表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sessions
-- ----------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `category_id` int NULL DEFAULT NULL COMMENT '分类ID',
  `config` json NOT NULL COMMENT '配置',
  `difficulty` enum('junior','mid','senior') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '难度',
  `ai_model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'AI模型',
  `type` enum('tech','behavior','mixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型',
  `status` enum('init','running','done','stop') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'init' COMMENT '状态',
  `total_q` int NULL DEFAULT 0 COMMENT '总问题数',
  `current_q` int NULL DEFAULT 0 COMMENT '当前问题',
  `duration` int NULL DEFAULT NULL COMMENT '时长(分钟)',
  `started_at` timestamp NULL DEFAULT NULL COMMENT '开始时间',
  `ended_at` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `category_id`(`category_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_difficulty`(`difficulty` ASC) USING BTREE,
  INDEX `idx_sessions_user_status`(`user_id` ASC, `status` ASC, `created_at` DESC) USING BTREE,
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `sessions_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '面试会话表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for stats
-- ----------------------------
DROP TABLE IF EXISTS `stats`;
CREATE TABLE `stats`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `attempts` int NULL DEFAULT 0 COMMENT '总尝试',
  `correct_attempts` int NULL DEFAULT 0 COMMENT '正确次数',
  `accuracy` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '正确率',
  `avg_time` decimal(8, 2) NULL DEFAULT 0.00 COMMENT '平均用时',
  `difficulty_fb` decimal(3, 2) NULL DEFAULT 0.00 COMMENT '难度反馈',
  `quality` decimal(3, 2) NULL DEFAULT 0.00 COMMENT '质量评分',
  `last_attempt` timestamp NULL DEFAULT NULL COMMENT '最后答题',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_question`(`question_id` ASC) USING BTREE,
  INDEX `idx_accuracy`(`accuracy` ASC) USING BTREE,
  CONSTRAINT `stats_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '题目统计表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签名',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '标签分类',
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '颜色',
  `use_count` int NULL DEFAULT 0 COMMENT '使用次数',
  `is_official` tinyint(1) NULL DEFAULT 0 COMMENT '官方标签',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_use_count`(`use_count` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '标签表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_logs
-- ----------------------------
DROP TABLE IF EXISTS `user_logs`;
CREATE TABLE `user_logs`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL COMMENT '用户ID',
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '会话令牌',
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT 'UA',
  `login_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `logout_at` timestamp NULL DEFAULT NULL COMMENT '登出时间',
  `duration` int NULL DEFAULT NULL COMMENT '时长(分钟)',
  `activity` json NULL COMMENT '活动数据',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_login`(`login_at` ASC) USING BTREE,
  INDEX `idx_ip`(`ip` ASC) USING BTREE,
  CONSTRAINT `user_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  `assigned_by` bigint NULL DEFAULT NULL COMMENT '分配者',
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否激活',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_role`(`user_id` ASC, `role_id` ASC) USING BTREE,
  INDEX `role_id`(`role_id` ASC) USING BTREE,
  INDEX `assigned_by`(`assigned_by` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_expires`(`expires_at` ASC) USING BTREE,
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_roles_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户角色表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮箱',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码哈希',
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '头像URL',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '真实姓名',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '个人简介',
  `status` enum('active','inactive','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active' COMMENT '状态',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ext` json NULL COMMENT '扩展字段',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  INDEX `idx_username`(`username` ASC) USING BTREE,
  INDEX `idx_email`(`email` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for wrong_questions
-- ----------------------------
DROP TABLE IF EXISTS `wrong_questions`;
CREATE TABLE `wrong_questions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `wrong_answer` json NULL COMMENT '错误答案',
  `correct_answer` json NULL COMMENT '正确答案',
  `error_type` enum('knowledge','careless','time','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '错误类型',
  `error_detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '错误详情',
  `mastery` int NULL DEFAULT 0 COMMENT '掌握度0-5',
  `review_count` int NULL DEFAULT 0 COMMENT '复习次数',
  `last_review` timestamp NULL DEFAULT NULL COMMENT '最后复习',
  `is_mastered` tinyint(1) NULL DEFAULT 0 COMMENT '已掌握',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_question`(`user_id` ASC, `question_id` ASC) USING BTREE,
  INDEX `question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_mastery`(`mastery` ASC) USING BTREE,
  CONSTRAINT `wrong_questions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `wrong_questions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '错题本表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- View structure for v_question_analysis
-- ----------------------------
DROP VIEW IF EXISTS `v_question_analysis`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_question_analysis` AS select `q`.`id` AS `id`,`q`.`title` AS `title`,`q`.`difficulty` AS `difficulty`,`st`.`accuracy` AS `accuracy`,`st`.`avg_time` AS `avg_time`,`st`.`attempts` AS `attempts`,(case when (`st`.`accuracy` > 80) then 'easy' when (`st`.`accuracy` > 50) then 'medium' else 'hard' end) AS `real_difficulty` from (`questions` `q` left join `stats` `st` on((`q`.`id` = `st`.`question_id`)));

-- ----------------------------
-- View structure for v_question_complete_analysis
-- ----------------------------
DROP VIEW IF EXISTS `v_question_complete_analysis`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_question_complete_analysis` AS select `q`.`id` AS `id`,`q`.`title` AS `title`,`q`.`difficulty` AS `difficulty`,`c`.`name` AS `category_name`,`st`.`attempts` AS `attempts`,`st`.`accuracy` AS `accuracy`,`st`.`avg_time` AS `avg_time`,`q`.`view_count` AS `view_count`,`q`.`like_count` AS `like_count`,count(distinct `qf`.`id`) AS `feedback_count`,avg(`qf`.`difficulty_vote`) AS `avg_difficulty_vote`,avg(`qf`.`quality_vote`) AS `avg_quality_vote`,group_concat(distinct `t`.`name` separator ',') AS `tag_names` from (((((`questions` `q` left join `categories` `c` on((`q`.`category_id` = `c`.`id`))) left join `stats` `st` on((`q`.`id` = `st`.`question_id`))) left join `question_feedback` `qf` on((`q`.`id` = `qf`.`question_id`))) left join `question_tags` `qt` on((`q`.`id` = `qt`.`question_id`))) left join `tags` `t` on((`qt`.`tag_id` = `t`.`id`))) group by `q`.`id`,`q`.`title`,`q`.`difficulty`,`c`.`name`,`st`.`attempts`,`st`.`accuracy`,`st`.`avg_time`,`q`.`view_count`,`q`.`like_count`;

-- ----------------------------
-- View structure for v_user_detail_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_user_detail_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_user_detail_stats` AS select `u`.`id` AS `id`,`u`.`username` AS `username`,count(distinct `r`.`question_id`) AS `total_answered`,count(distinct (case when (`r`.`is_correct` = 1) then `r`.`question_id` end)) AS `correct_answered`,round(((count(distinct (case when (`r`.`is_correct` = 1) then `r`.`question_id` end)) * 100.0) / nullif(count(distinct `r`.`question_id`),0)),2) AS `accuracy_rate`,sum(`r`.`time_spent`) AS `total_study_time`,count(distinct `f`.`question_id`) AS `favorite_count`,count(distinct `s`.`id`) AS `interview_count` from (((`users` `u` left join `records` `r` on((`u`.`id` = `r`.`user_id`))) left join `favorites` `f` on((`u`.`id` = `f`.`user_id`))) left join `sessions` `s` on((`u`.`id` = `s`.`user_id`))) group by `u`.`id`,`u`.`username`;

-- ----------------------------
-- View structure for v_user_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_user_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_user_stats` AS select `u`.`id` AS `id`,`u`.`username` AS `username`,count(distinct `r`.`question_id`) AS `answered`,sum((case when (`r`.`is_correct` = 1) then 1 else 0 end)) AS `correct`,round(avg((case when (`r`.`is_correct` = 1) then 100 else 0 end)),2) AS `accuracy`,sum(`r`.`time_spent`) AS `study_time`,count(distinct `f`.`question_id`) AS `favorites`,count(distinct `s`.`id`) AS `interviews` from (((`users` `u` left join `records` `r` on((`u`.`id` = `r`.`user_id`))) left join `favorites` `f` on((`u`.`id` = `f`.`user_id`))) left join `sessions` `s` on((`u`.`id` = `s`.`user_id`))) group by `u`.`id`,`u`.`username`;

-- ----------------------------
-- Procedure structure for sp_update_stats
-- ----------------------------
DROP PROCEDURE IF EXISTS `sp_update_stats`;
delimiter ;;
CREATE PROCEDURE `sp_update_stats`(IN p_question_id BIGINT)
BEGIN
    DECLARE v_attempts INT DEFAULT 0;
    DECLARE v_correct INT DEFAULT 0;
    DECLARE v_accuracy DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_avg_time DECIMAL(8,2) DEFAULT 0.00;
    
    SELECT 
        COUNT(*),
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END),
        AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END),
        AVG(time_spent)
    INTO v_attempts, v_correct, v_accuracy, v_avg_time
    FROM records 
    WHERE question_id = p_question_id;
    
    INSERT INTO stats (question_id, attempts, correct_attempts, accuracy, avg_time)
    VALUES (p_question_id, v_attempts, v_correct, v_accuracy, v_avg_time)
    ON DUPLICATE KEY UPDATE
        attempts = v_attempts,
        correct_attempts = v_correct,
        accuracy = v_accuracy,
        avg_time = v_avg_time,
        last_attempt = NOW();
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table records
-- ----------------------------
DROP TRIGGER IF EXISTS `tr_after_record`;
delimiter ;;
CREATE TRIGGER `tr_after_record` AFTER INSERT ON `records` FOR EACH ROW BEGIN
    CALL sp_update_stats(NEW.question_id);
    
    -- 更新进度
    INSERT INTO progress (user_id, category_id, completed, last_study)
    SELECT NEW.user_id, q.category_id, 1, NOW()
    FROM questions q WHERE q.id = NEW.question_id
    ON DUPLICATE KEY UPDATE
        completed = completed + 1,
        correct = correct + CASE WHEN NEW.is_correct = 1 THEN 1 ELSE 0 END,
        accuracy = (correct * 100.0) / completed,
        study_time = study_time + COALESCE(NEW.time_spent, 0) / 60,
        last_study = NOW();
        
    -- 错题本
    IF NEW.is_correct = 0 THEN
        INSERT INTO wrong_questions (user_id, question_id, wrong_answer)
        VALUES (NEW.user_id, NEW.question_id, NEW.answer)
        ON DUPLICATE KEY UPDATE
            review_count = review_count + 1,
            last_review = NOW();
    END IF;
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
