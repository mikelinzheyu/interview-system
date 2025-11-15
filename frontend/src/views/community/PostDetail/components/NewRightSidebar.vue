<template>
  <div class="new-right-sidebar">
    <!-- AI 助手 -->
    <NewAIAssistant
      :post-id="currentArticleId"
      :post-content="postContent"
    />

    <!-- 专栏目录 -->
    <ArticleCollection
      v-if="collection && !collectionLoading"
      :collection="collection"
      :current-article-id="currentArticleId"
    />
    <div v-else-if="collectionLoading" class="sidebar-skeleton">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 热门文章已移动到左侧区域，这里隐藏 -->

    <!-- 文章归档 -->
    <MonthlyArchive v-if="!archivesLoading" :archives="archives" />
    <div v-else class="sidebar-skeleton">
      <el-skeleton :rows="3" animated />
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import communityAPI from '@/api/communityAPI'
import NewAIAssistant from './NewAIAssistant.vue'
import ArticleCollection from './ArticleCollection.vue'
import HotArticles from './HotArticles.vue'
import MonthlyArchive from './MonthlyArchive.vue'

const props = defineProps({
  currentArticleId: {
    type: String,
    default: '',
  },
  postContent: {
    type: String,
    default: '',
  },
})

// 加载状态
const collectionLoading = ref(false)
const hotArticlesLoading = ref(false)
const archivesLoading = ref(false)

// 数据
const collection = ref(null)
const hotArticles = ref([])
const archives = ref([])

// 加载专栏数据
const loadCollection = async () => {
  collectionLoading.value = true
  try {
    const data = await communityAPI.getArticleCollection(props.currentArticleId)
    collection.value = data
  } catch (error) {
    console.error('Failed to load collection:', error)
    ElMessage.warning('专栏目录加载失败，显示默认数据')
    collection.value = communityAPI._getMockCollection()
  } finally {
    collectionLoading.value = false
  }
}

// 加载热门文章
const loadHotArticles = async () => {
  hotArticlesLoading.value = true
  try {
    const data = await communityAPI.getHotArticles(5)
    hotArticles.value = Array.isArray(data) ? data : data.articles || []
  } catch (error) {
    console.error('Failed to load hot articles:', error)
    ElMessage.warning('热门文章加载失败，显示默认数据')
    hotArticles.value = communityAPI._getMockHotArticles()
  } finally {
    hotArticlesLoading.value = false
  }
}

// 加载归档数据
const loadArchives = async () => {
  archivesLoading.value = true
  try {
    const data = await communityAPI.getArticleArchives()
    archives.value = Array.isArray(data) ? data : data.archives || []
  } catch (error) {
    console.error('Failed to load archives:', error)
    ElMessage.warning('归档数据加载失败，显示默认数据')
    archives.value = communityAPI._getMockArchives()
  } finally {
    archivesLoading.value = false
  }
}

// 初始化加载
onMounted(() => {
  loadCollection()
  loadHotArticles()
  loadArchives()
})
</script>

<style scoped lang="scss">
.new-right-sidebar {
  display: flex;
  flex-direction: column;
}
</style>
