<template>
  <div class="my-favorites-container">
    <div class="page-header">
      <h1>
        <el-icon><Star /></el-icon>
        我的收藏
      </h1>
      <p>{{ total }} 个收藏的题目</p>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card">
      <div class="filter-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索收藏的题目..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="filterCategory" placeholder="分类" clearable>
          <el-option label="全部" value="" />
          <el-option label="算法" value="algorithm" />
          <el-option label="数据结构" value="data-structure" />
          <el-option label="系统设计" value="system-design" />
          <el-option label="前端" value="frontend" />
          <el-option label="后端" value="backend" />
        </el-select>

        <el-select v-model="sortBy" placeholder="排序">
          <el-option label="最近收藏" value="recent" />
          <el-option label="最热门" value="popular" />
          <el-option label="难度升序" value="difficulty-asc" />
          <el-option label="难度降序" value="difficulty-desc" />
        </el-select>
      </div>
    </el-card>

    <!-- 收藏列表 -->
    <div v-loading="loading" class="favorites-list">
      <el-empty v-if="favorites.length === 0 && !loading" description="暂无收藏" />

      <el-card
        v-for="item in favorites"
        :key="item.id"
        class="favorite-item"
        @click="viewDetail(item.id)"
      >
        <div class="item-header">
          <h3>{{ item.title }}</h3>
          <el-button
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click.stop="removeFavorite(item.id)"
          />
        </div>

        <p class="item-desc">{{ item.description }}</p>

        <div class="item-footer">
          <div class="tags">
            <el-tag :type="getDifficultyType(item.difficulty)" size="small">
              {{ item.difficulty }}
            </el-tag>
            <el-tag v-if="item.category" type="info" size="small">
              {{ item.category }}
            </el-tag>
          </div>

          <div class="meta">
            <span><el-icon><View /></el-icon> {{ item.views }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ item.discussions }}</span>
            <span class="favorite-time">收藏于 {{ item.favoritedAt }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="total > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
      @current-change="loadFavorites"
      @size-change="loadFavorites"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Search, Delete, View, ChatDotRound } from '@element-plus/icons-vue'
import { getMyFavorites, unfavoriteQuestion } from '@/api/contributions'

const router = useRouter()

const loading = ref(false)
const favorites = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const filterCategory = ref('')
const sortBy = ref('recent')

// 加载收藏列表
const loadFavorites = async () => {
  loading.value = true
  try {
    const response = await getMyFavorites({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      category: filterCategory.value,
      sortBy: sortBy.value
    })

    if (response.code === 200) {
      favorites.value = response.data.items
      total.value = response.data.total
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/contributions/question/${id}`)
}

// 取消收藏
const removeFavorite = async (id) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await unfavoriteQuestion(id)
    if (response.code === 200) {
      ElMessage.success('已取消收藏')
      loadFavorites()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 获取难度类型
const getDifficultyType = (difficulty) => {
  const map = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return map[difficulty] || 'info'
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.my-favorites-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 28px;
  color: #303133;
  margin: 0 0 10px 0;
}

.page-header p {
  color: #909399;
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  gap: 15px;
}

.search-input {
  flex: 1;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 400px;
}

.favorite-item {
  cursor: pointer;
  transition: all 0.3s;
}

.favorite-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.item-desc {
  color: #606266;
  font-size: 14px;
  margin: 10px 0;
  line-height: 1.6;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.tags {
  display: flex;
  gap: 10px;
}

.meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #909399;
  align-items: center;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.favorite-time {
  color: #c0c4cc;
  font-size: 12px;
}

.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
  }

  .item-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
