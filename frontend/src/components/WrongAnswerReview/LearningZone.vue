<template>
  <div class="learning-zone module">
    <div class="module-header">
      <h2 class="module-title">
        <el-icon><CollectionTag /></el-icon>
        学习与提升
      </h2>
      <p class="module-subtitle">通过学习资源和优秀答案改进</p>
    </div>

    <div class="module-content">
      <!-- Reference Points -->
      <div class="learning-section">
        <div class="section-title">
          <el-icon><Memo /></el-icon>
          参考要点
        </div>
        <p class="section-description">该题答案应该包含的关键知识点</p>
        <div class="reference-points">
          <div
            v-for="(point, index) in wrongAnswer.learningResources?.referencePoints || []"
            :key="index"
            class="reference-item"
          >
            <el-icon class="check-icon"><SuccessFilled /></el-icon>
            {{ point }}
          </div>
        </div>
      </div>

      <!-- Excellent Answers -->
      <div class="learning-section">
        <div class="section-title">
          <el-icon><StarFilled /></el-icon>
          优秀回答示例
        </div>
        <p class="section-description">参考高分答案的结构和表达方式</p>
        <div class="excellent-answers">
          <div
            v-for="(answer, index) in wrongAnswer.learningResources?.excellentAnswers || []"
            :key="index"
            class="answer-item"
          >
            <div class="answer-header">
              <div class="answer-title">
                <el-icon><CircleCheckFilled /></el-icon>
                {{ answer.title }}
              </div>
              <el-button
                v-if="answer.voiceUrl"
                type="primary"
                size="small"
                text
                @click="playVoice(answer.voiceUrl)"
              >
                <el-icon><VideoPlay /></el-icon>
                播放示范音频
              </el-button>
            </div>
            <div class="answer-content">{{ answer.content }}</div>
          </div>
        </div>
      </div>

      <!-- Related Topics -->
      <div class="learning-section">
        <div class="section-title">
          <el-icon><Link /></el-icon>
          关联知识点和题目
        </div>
        <p class="section-description">通过举一反三加深理解</p>
        <div class="related-topics">
          <div
            v-for="(topic, index) in wrongAnswer.learningResources?.relatedTopics || []"
            :key="index"
            class="topic-item"
            :class="topic.type"
          >
            <el-icon v-if="topic.type === 'topic'"><CollectionTag /></el-icon>
            <el-icon v-else><Document /></el-icon>
            <span class="topic-name">{{ topic.title }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- Learning Tips -->
      <div class="learning-tips">
        <el-icon><InfoFilled /></el-icon>
        <div>
          <div class="tips-title">💡 学习建议</div>
          <ul class="tips-list">
            <li>首先理解题目的核心考点，而不是直接背答案</li>
            <li>对比你的回答和优秀答案，找出差距在哪</li>
            <li>通过关联题目练习，巩固相同知识点</li>
            <li>定期回顾复习，逐步提高掌握度</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Audio Player (hidden) -->
    <audio ref="audioPlayer" @ended="onAudioEnded"></audio>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  CollectionTag,
  Memo,
  StarFilled,
  CircleCheckFilled,
  VideoPlay,
  Link,
  Document,
  ArrowRight,
  InfoFilled,
  SuccessFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  wrongAnswer: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const audioPlayer = ref(null)

const playVoice = (voiceUrl) => {
  if (audioPlayer.value) {
    audioPlayer.value.src = voiceUrl
    audioPlayer.value.play()
  }
}

const onAudioEnded = () => {
  // Audio playback finished
}
</script>

<style scoped lang="scss">
.module {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.module-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.module-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2a44;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-subtitle {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.module-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ========== Learning Section ========== */
.learning-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2a44;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-description {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

/* ========== Reference Points ========== */
.reference-points {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reference-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f0f9ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.reference-item .check-icon {
  color: #409eff;
  font-size: 16px;
  flex-shrink: 0;
}

/* ========== Excellent Answers ========== */
.excellent-answers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.answer-item {
  padding: 12px;
  background: #fef8f0;
  border: 1px solid #f0e6d2;
  border-radius: 6px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 12px;
}

.answer-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
  display: flex;
  align-items: center;
  gap: 6px;
}

.answer-title :deep(.el-icon) {
  color: #67c23a;
}

.answer-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ========== Related Topics ========== */
.related-topics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  color: #606266;

  &:hover {
    background: #eef5ff;
    border-color: #409eff;
    color: #409eff;
  }

  &.topic {
    :deep(.el-icon) {
      color: #409eff;
    }

    &:hover {
      :deep(.el-icon) {
        color: #409eff;
      }
    }
  }

  &.question {
    :deep(.el-icon) {
      color: #67c23a;
    }

    &:hover {
      :deep(.el-icon) {
        color: #67c23a;
      }
    }
  }
}

.topic-name {
  flex: 1;
}

.arrow-icon {
  font-size: 14px;
}

/* ========== Learning Tips ========== */
.learning-tips {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fdf6ec;
  border-left: 4px solid #e6a23c;
  border-radius: 6px;
}

.learning-tips :deep(.el-icon) {
  font-size: 20px;
  color: #e6a23c;
  flex-shrink: 0;
}

.tips-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
  margin-bottom: 8px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;

  li {
    margin-bottom: 4px;
  }
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .module {
    padding: 16px;
  }

  .module-title {
    font-size: 16px;
  }

  .section-title {
    font-size: 14px;
  }

  .answer-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .learning-tips {
    flex-direction: column;
  }
}
</style>
