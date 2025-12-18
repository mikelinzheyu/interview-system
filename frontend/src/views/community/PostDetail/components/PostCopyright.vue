<template>
  <div class="copyright-section">
    <!-- 版权声明 -->
    <div class="copyright-notice">
      <div class="notice-icon">📄</div>
      <div class="notice-content">
        <h4 class="notice-title">版权声明</h4>
        <div class="notice-text">
          <p>
            <strong>作者：</strong>{{ author?.name || '未知作者' }}
          </p>
          <p>
            <strong>原文链接：</strong
            ><a :href="articleUrl" target="_blank">{{ articleUrl }}</a>
          </p>
          <p>
            <strong>版权说明：</strong>本文遵循
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              >CC BY-NC-SA 4.0</a
            >
            协议，转载请注明出处。
          </p>
        </div>
      </div>
    </div>

    <!-- AI 质量评分 -->
    <div v-if="aiScore !== null" class="ai-score-card">
      <div class="score-header">
        <div class="score-icon">🤖</div>
        <h4 class="score-title">AI 质量评估</h4>
      </div>

      <div class="score-content">
        <!-- 总分 -->
        <div class="overall-score">
          <div class="score-value">{{ aiScore.overall || 0 }}</div>
          <div class="score-label">综合得分</div>
        </div>

        <!-- 详细评分 -->
        <div class="score-details">
          <div class="score-item">
            <span class="item-label">内容质量</span>
            <el-progress
              :percentage="(aiScore.contentQuality || 0) * 10"
              :color="getScoreColor(aiScore.contentQuality)"
            />
            <span class="item-value">{{ aiScore.contentQuality || 0 }}/10</span>
          </div>

          <div class="score-item">
            <span class="item-label">技术深度</span>
            <el-progress
              :percentage="(aiScore.technicalDepth || 0) * 10"
              :color="getScoreColor(aiScore.technicalDepth)"
            />
            <span class="item-value">{{ aiScore.technicalDepth || 0 }}/10</span>
          </div>

          <div class="score-item">
            <span class="item-label">可读性</span>
            <el-progress
              :percentage="(aiScore.readability || 0) * 10"
              :color="getScoreColor(aiScore.readability)"
            />
            <span class="item-value">{{ aiScore.readability || 0 }}/10</span>
          </div>

          <div class="score-item">
            <span class="item-label">实用性</span>
            <el-progress
              :percentage="(aiScore.practicality || 0) * 10"
              :color="getScoreColor(aiScore.practicality)"
            />
            <span class="item-value">{{ aiScore.practicality || 0 }}/10</span>
          </div>
        </div>

        <!-- AI 评语 -->
        <div v-if="aiScore.comment" class="ai-comment">
          <p class="comment-title">AI 评语：</p>
          <p class="comment-text">{{ aiScore.comment }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  author: {
    type: Object,
    default: () => ({})
  },
  postId: {
    type: [String, Number],
    required: true
  },
  aiScore: {
    type: Object,
    default: null
    // 示例数据结构：
    // {
    //   overall: 8.5,
    //   contentQuality: 9,
    //   technicalDepth: 8,
    //   readability: 9,
    //   practicality: 8,
    //   comment: '这是一篇高质量的技术文章...'
    // }
  }
})

const articleUrl = computed(() => {
  return `${window.location.origin}/community/posts/${props.postId}`
})

const getScoreColor = (score) => {
  if (score >= 8) return '#67C23A' // 绿色 - 优秀
  if (score >= 6) return '#409EFF' // 蓝色 - 良好
  if (score >= 4) return '#E6A23C' // 橙色 - 一般
  return '#F56C6C' // 红色 - 较差
}
</script>

<style scoped lang="scss">
.copyright-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 2px dashed var(--el-border-color-lighter);

  /* 版权声明 */
  .copyright-notice {
    display: flex;
    gap: 16px;
    padding: 24px;
    background: linear-gradient(
      135deg,
      rgba(64, 158, 255, 0.05) 0%,
      rgba(103, 194, 58, 0.05) 100%
    );
    border-left: 4px solid var(--el-color-primary);
    border-radius: 8px;
    margin-bottom: 24px;

    .notice-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .notice-content {
      flex: 1;

      .notice-title {
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .notice-text {
        font-size: 14px;
        line-height: 1.8;
        color: var(--el-text-color-regular);

        p {
          margin: 8px 0;

          strong {
            color: var(--el-text-color-primary);
            font-weight: 600;
          }
        }

        a {
          color: var(--el-color-primary);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.3s;

          &:hover {
            border-color: var(--el-color-primary);
          }
        }
      }
    }
  }

  /* AI 评分卡片 */
  .ai-score-card {
    padding: 24px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    .score-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;

      .score-icon {
        font-size: 28px;
      }

      .score-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .score-content {
      .overall-score {
        text-align: center;
        padding: 20px;
        background: linear-gradient(
          135deg,
          rgba(64, 158, 255, 0.1) 0%,
          rgba(103, 194, 58, 0.1) 100%
        );
        border-radius: 8px;
        margin-bottom: 24px;

        .score-value {
          font-size: 48px;
          font-weight: 700;
          background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .score-label {
          margin-top: 8px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
        }
      }

      .score-details {
        display: grid;
        gap: 16px;
        margin-bottom: 20px;

        .score-item {
          display: grid;
          grid-template-columns: 100px 1fr 60px;
          align-items: center;
          gap: 12px;

          .item-label {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-regular);
          }

          .item-value {
            text-align: right;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }
      }

      .ai-comment {
        padding: 16px;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        border-left: 3px solid var(--el-color-primary);

        .comment-title {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .comment-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.8;
          color: var(--el-text-color-regular);
          font-style: italic;
        }
      }
    }
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .copyright-section {
    .copyright-notice {
      flex-direction: column;
      padding: 16px;

      .notice-icon {
        font-size: 24px;
      }
    }

    .ai-score-card {
      padding: 16px;

      .score-content {
        .score-details {
          .score-item {
            grid-template-columns: 80px 1fr 50px;
            gap: 8px;
          }
        }
      }
    }
  }
}
</style>
