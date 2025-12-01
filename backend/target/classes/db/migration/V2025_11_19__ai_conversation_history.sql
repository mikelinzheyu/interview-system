-- Migration: Add AI conversation history tables
-- Purpose: Store and manage AI chat conversation history for multi-turn conversations
-- Created: 2025-11-19

-- Up: Create tables

-- AI 对话表 - 存储对话会话信息
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(36) PRIMARY KEY COMMENT 'Dify conversationId',
    post_id VARCHAR(50) NOT NULL COMMENT '文章ID',
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
    title VARCHAR(255) COMMENT '对话标题（首条消息摘要）',
    message_count INT DEFAULT 0 COMMENT '对话消息数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    is_active BOOLEAN DEFAULT true COMMENT '是否活跃',
    INDEX idx_post_user (post_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at),
    UNIQUE KEY uk_conv_post_user (post_id, user_id, id)
) COMMENT='AI对话会话表' COLLATE utf8mb4_unicode_ci;

-- AI 对话消息表 - 存储对话中的每条消息
CREATE TABLE IF NOT EXISTS ai_conversation_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
    conversation_id VARCHAR(36) NOT NULL COMMENT '对话ID',
    role ENUM('user', 'assistant') NOT NULL COMMENT '消息角色：user=用户，assistant=AI',
    content LONGTEXT NOT NULL COMMENT '消息内容',
    tokens_used INT DEFAULT 0 COMMENT '使用的token数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_role_created (role, created_at),
    INDEX idx_created_at (created_at)
) COMMENT='AI对话消息表' COLLATE utf8mb4_unicode_ci;

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_ai_conv_post_user_active
ON ai_conversations(post_id, user_id, is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_msg_conv_created
ON ai_conversation_messages(conversation_id, created_at ASC);

-- Down: Drop tables (for rollback)
-- DROP TABLE IF EXISTS ai_conversation_messages;
-- DROP TABLE IF EXISTS ai_conversations;
