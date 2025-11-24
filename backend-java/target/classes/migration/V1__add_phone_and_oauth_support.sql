-- =====================================================
-- 短信登录和第三方登录支持 - 数据库迁移脚本
-- Version: 1.0
-- Date: 2025-09-30
-- =====================================================

-- 1. 给users表添加手机号字段
ALTER TABLE users
ADD COLUMN phone VARCHAR(20) UNIQUE COMMENT '手机号' AFTER email,
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE COMMENT '手机号是否已验证' AFTER phone,
ADD INDEX idx_phone (phone);

-- 2. 创建第三方账号绑定表
CREATE TABLE IF NOT EXISTS user_oauth_bindings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    provider VARCHAR(20) NOT NULL COMMENT '第三方提供商: wechat/qq/github等',
    open_id VARCHAR(100) NOT NULL COMMENT '第三方OpenID',
    union_id VARCHAR(100) DEFAULT NULL COMMENT '第三方UnionID（微信专用）',
    access_token TEXT COMMENT '访问令牌（加密存储）',
    refresh_token TEXT COMMENT '刷新令牌',
    expires_at TIMESTAMP NULL DEFAULT NULL COMMENT '令牌过期时间',
    avatar_url VARCHAR(500) DEFAULT NULL COMMENT '第三方头像URL',
    nickname VARCHAR(100) DEFAULT NULL COMMENT '第三方昵称',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY uk_provider_openid (provider, open_id) COMMENT '同一平台同一用户唯一',
    INDEX idx_user_id (user_id) COMMENT '用户ID索引',
    INDEX idx_union_id (union_id) COMMENT 'UnionID索引',

    CONSTRAINT fk_oauth_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户第三方账号绑定表';

-- 3. 创建短信验证码日志表（用于审计和防刷）
CREATE TABLE IF NOT EXISTS sms_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    code VARCHAR(10) NOT NULL COMMENT '验证码（加密存储）',
    type VARCHAR(20) NOT NULL COMMENT '短信类型: login/register/reset_password',
    ip_address VARCHAR(50) DEFAULT NULL COMMENT '请求IP地址',
    status VARCHAR(20) NOT NULL COMMENT '发送状态: pending/success/failed',
    provider_response TEXT COMMENT '服务商返回信息',
    send_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    verified_at TIMESTAMP NULL DEFAULT NULL COMMENT '验证时间',
    expired_at TIMESTAMP NOT NULL COMMENT '过期时间',

    INDEX idx_phone (phone) COMMENT '手机号索引',
    INDEX idx_send_at (send_at) COMMENT '发送时间索引',
    INDEX idx_status (status) COMMENT '状态索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短信验证码发送日志表';

-- 4. 创建登录日志表（安全审计）
CREATE TABLE IF NOT EXISTS login_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT DEFAULT NULL COMMENT '用户ID（登录失败时可能为空）',
    login_type VARCHAR(20) NOT NULL COMMENT '登录方式: password/sms/wechat/qq',
    login_identifier VARCHAR(100) NOT NULL COMMENT '登录标识（用户名/手机号/OpenID）',
    ip_address VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    location VARCHAR(100) DEFAULT NULL COMMENT '登录地点（根据IP解析）',
    status VARCHAR(20) NOT NULL COMMENT '登录状态: success/failed',
    failure_reason VARCHAR(200) DEFAULT NULL COMMENT '失败原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',

    INDEX idx_user_id (user_id) COMMENT '用户ID索引',
    INDEX idx_login_type (login_type) COMMENT '登录方式索引',
    INDEX idx_created_at (created_at) COMMENT '登录时间索引',
    INDEX idx_ip_address (ip_address) COMMENT 'IP地址索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户登录日志表';