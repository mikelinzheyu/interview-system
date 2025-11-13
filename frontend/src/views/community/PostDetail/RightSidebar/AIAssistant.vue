<template>
  <div class="ai-assistant-panel">
    <!-- 标题区 -->
    <div class="panel-header">
      <h4>🤖 AI 助手</h4>
      <span class="powered-by">Powered by Dify</span>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="ai-tabs">
      <!-- 摘要功能 -->
      <el-tab-pane label="摘要" name="summary">
        <SummaryFeature :article-content="articleContent" :post-id="postId" />
      </el-tab-pane>

      <!-- 关键点功能 -->
      <el-tab-pane label="关键点" name="keypoints">
        <KeypointsFeature :article-content="articleContent" :post-id="postId" />
      </el-tab-pane>

      <!-- 问答功能 -->
      <el-tab-pane label="AI 问答" name="chat">
        <ChatFeature :article-content="articleContent" :post-id="postId" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import SummaryFeature from './AIAssistant/SummaryFeature.vue'
import KeypointsFeature from './AIAssistant/KeypointsFeature.vue'
import ChatFeature from './AIAssistant/ChatFeature.vue'

const props = defineProps({
  articleContent: {
    type: String,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
})

const activeTab = ref('summary')
</script>

<style scoped lang="scss">
.ai-assistant-panel {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .powered-by {
      font-size: 12px;
      color: #909399;
      background: rgba(255, 255, 255, 0.5);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }

  :deep(.ai-tabs) {
    --el-tabs-header-height: 40px;

    .el-tabs__nav {
      border-bottom: 1px solid #e0e0e0;
    }

    .el-tabs__item {
      font-size: 13px;
      padding: 0 12px;
    }

    .el-tabs__content {
      padding: 12px 0;
    }
  }
}
</style>
