<template>
  <nav class="breadcrumb-nav" aria-label="面包屑导航" v-if="items.length > 0">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">
        <el-icon><HomeFilled /></el-icon>
        首页
      </el-breadcrumb-item>

      <el-breadcrumb-item
        v-for="(item, index) in items"
        :key="index"
        :to="item.to"
      >
        {{ item.label }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { HomeFilled } from '@element-plus/icons-vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
    // 格式: [{ label: '社区', to: '/community' }, { label: '技术分享', to: null }]
  }
})
</script>

<style scoped lang="scss">
.breadcrumb-nav {
  padding: 12px 0;
  background: transparent;

  :deep(.el-breadcrumb) {
    font-size: 14px;
    line-height: 1.5;

    .el-breadcrumb__item {
      .el-breadcrumb__inner {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #606266;
        font-weight: 400;
        transition: color 0.2s;

        &.is-link:hover {
          color: #409eff;
        }

        .el-icon {
          font-size: 14px;
        }
      }

      &:last-child .el-breadcrumb__inner {
        color: #303133;
        font-weight: 500;
      }
    }

    .el-breadcrumb__separator {
      color: #c0c4cc;
      margin: 0 8px;
    }
  }
}

@media (max-width: 768px) {
  .breadcrumb-nav {
    padding: 8px 0;

    :deep(.el-breadcrumb) {
      font-size: 12px;

      .el-breadcrumb__separator {
        margin: 0 4px;
      }
    }
  }
}
</style>
