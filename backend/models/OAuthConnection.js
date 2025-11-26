/**
 * OAuth 连接模型 - 关联用户与第三方 OAuth 账号的关系
 * 支持微信、QQ 等多个 OAuth 提供商
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const OAuthConnection = sequelize.define('oauth_connection', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: '主键'
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '关联的用户ID'
        // 暂时注释掉外键约束，允许系统启动
        // references: {
        //   model: 'users',
        //   key: 'id'
        // },
        // onDelete: 'CASCADE'
      },
      provider: {
        type: DataTypes.ENUM('wechat', 'qq'),
        allowNull: false,
        comment: 'OAuth提供商: wechat, qq',
        index: true
      },
      provider_user_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '第三方平台用户ID (openid/unionid)'
      },
      provider_username: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '第三方平台用户名'
      },
      provider_avatar: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '第三方头像URL'
      },
      provider_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '第三方邮箱'
      },
      access_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '访问令牌(加密存储)'
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '刷新令牌(加密存储)'
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Token过期时间'
      },
      raw_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '第三方返回的原始数据'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否激活'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: '创建时间'
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
        comment: '更新时间'
      }
    },
    {
      sequelize,
      modelName: 'OAuthConnection',
      tableName: 'oauth_connections',
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      comment: 'OAuth第三方账号绑定表',
      indexes: [
        {
          unique: true,
          fields: ['provider', 'provider_user_id'],
          name: 'uk_provider_openid'
        },
        {
          fields: ['user_id'],
          name: 'idx_user_id'
        },
        {
          fields: ['provider'],
          name: 'idx_provider'
        }
      ]
    }
  )

// 关联关系
OAuthConnection.associate = (models) => {
  if (models.User) {
    OAuthConnection.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'user'
    })
  }
}

module.exports = OAuthConnection
