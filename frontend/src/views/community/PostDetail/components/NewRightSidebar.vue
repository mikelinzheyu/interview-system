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
const archivesLoading = ref(false)
const collectionLoaded = ref(false)  // 标记 collection 是否已加载
const archivesLoaded = ref(false)    // 标记 archives 是否已加载
const lastLoadedCollectionArticleId = ref(null)  // 追踪已加载的 articleId

// 数据
const collection = ref(null)
const archives = ref([])

// 加载专栏数据
const loadCollection = async () => {
  // 防止重复加载：如果已经加载过同一个文章的专栏，不重新加载
  if (!props.currentArticleId || (collectionLoaded.value && lastLoadedCollectionArticleId.value === props.currentArticleId)) return

  collectionLoading.value = true
  try {
    const data = await communityAPI.getArticleCollection(props.currentArticleId)
    collection.value = data
    collectionLoaded.value = true
    lastLoadedCollectionArticleId.value = props.currentArticleId
  } catch (error) {
    console.error('Failed to load collection:', error)
    ElMessage.warning('专栏目录加载失败，显示默认数据')
    collection.value = communityAPI._getMockCollection()
    collectionLoaded.value = true
    lastLoadedCollectionArticleId.value = props.currentArticleId
  } finally {
    collectionLoading.value = false
  }
}

// 加载归档数据（延迟加载以提高初始页面加载速度）
const loadArchives = async () => {
  if (archivesLoaded.value) return
  archivesLoading.value = true
  try {
    const data = await communityAPI.getArticleArchives()
    archives.value = Array.isArray(data) ? data : data.archives || []
    archivesLoaded.value = true
  } catch (error) {
    console.error('Failed to load archives:', error)
    ElMessage.warning('归档数据加载失败，显示默认数据')
    archives.value = communityAPI._getMockArchives()
    archivesLoaded.value = true
  } finally {
    archivesLoading.value = false
  }
}

onMounted(() => {
  // 延迟 500ms 加载数据，让主内容先渲染
  setTimeout(() => {
    loadCollection()
    loadArchives()
  }, 500)
})
</script>

<style scoped lang="scss">
.new-right-sidebar {
  display: flex;
  flex-direction: column;
}

.sidebar-skeleton {
  padding: 12px;
}
</style>
