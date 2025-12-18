<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useWrongAnswersStore } from '@/stores/wrongAnswers';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  LayoutGrid, List, PlayCircle, Search, Filter, X 
} from 'lucide-vue-next';

// Components
import MistakeCard from './components/MistakeCard.vue';
import FilterSidebar from './components/FilterSidebar.vue';
import BulkActionBar from './components/BulkActionBar.vue';
import BatchManagerModal from './components/BatchManagerModal.vue';

const router = useRouter();
const store = useWrongAnswersStore();

// --- State ---
const viewMode = ref('grid');
const loading = ref(false);

const filters = reactive({
    search: '',
    selectedSources: [],
    selectedTypes: [],
    selectedTags: [],
    showFavorites: false
});

const selectedIds = ref(new Set());
const batchModalVisible = ref(false);

// --- Fetch Data ---
onMounted(async () => {
  loading.value = true;
  await store.fetchWrongAnswers();
  loading.value = false;
});

// --- Computed: Filtered Data ---
const filteredData = computed(() => {
    return store.wrongAnswers.filter(item => {
        // Search
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const matchTitle = item.questionTitle?.toLowerCase().includes(q);
            const matchContent = item.questionContent?.toLowerCase().includes(q);
            const matchTag = item.knowledgePoints?.some(t => t.toLowerCase().includes(q));
            if (!matchTitle && !matchContent && !matchTag) return false;
        }

        // Sources
        if (filters.selectedSources.length > 0 && !filters.selectedSources.includes(item.source)) return false;

        // Types
        if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(item.errorType)) return false;

        // Tags
        if (filters.selectedTags.length > 0) {
            if (!item.knowledgePoints || !filters.selectedTags.every(t => item.knowledgePoints.includes(t))) return false;
        }
        
        // Favorites
        if (filters.showFavorites && !item.isFavorited) return false;

        return true;
    });
});

// --- Computed: Counts for Sidebar ---
const counts = computed(() => {
    const c = { sources: {}, types: {}, tags: {} };
    
    // Base set for counts
    const baseItems = store.wrongAnswers; 

    baseItems.forEach(item => {
        // Source
        c.sources[item.source] = (c.sources[item.source] || 0) + 1;
        
        // Type
        if (item.errorType) {
            c.types[item.errorType] = (c.types[item.errorType] || 0) + 1;
        }

        // Tags
        if (item.knowledgePoints) {
            item.knowledgePoints.forEach(tag => {
                c.tags[tag] = (c.tags[tag] || 0) + 1;
            });
        }
    });
    return c;
});

const allTags = computed(() => Object.keys(counts.value.tags).sort((a,b) => counts.value.tags[b] - counts.value.tags[a]));

const selectionModeActive = computed(() => selectedIds.value.size > 0);

// --- Actions ---

const toggleSelection = (id) => {
    if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id);
    } else {
        selectedIds.value.add(id);
    }
};

const clearSelection = () => {
    selectedIds.value.clear();
};

const clearFilters = () => {
    filters.search = '';
    filters.selectedSources = [];
    filters.selectedTypes = [];
    filters.selectedTags = [];
    filters.showFavorites = false;
};

// Item Actions
const handleOpenDetail = (id) => {
    if (selectionModeActive.value) {
        toggleSelection(id);
    } else {
        router.push(`/wrong-answers/${id}`);
    }
};

const handleEditItem = (id) => {
    router.push(`/wrong-answers/${id}`); 
};

const handleToggleFav = async (id) => {
    const item = store.wrongAnswers.find(i => i.id === id);
    if (item) {
        ElMessage.info('Toggle Favorite not implemented in backend yet');
    }
};

const handleDeleteItem = async (id) => {
    try {
        await ElMessageBox.confirm('确定要删除这条错题记录吗？', '提示', { type: 'warning' });
        await store.deleteWrongAnswer(id);
        if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    } catch(e) { /* cancel */ }
};

// Bulk Actions
const handleBulkDelete = async () => {
    try {
        await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.size} 条错题吗？`, '批量删除', { type: 'warning' });
        for (const id of selectedIds.value) {
            await store.deleteWrongAnswer(id);
        }
        clearSelection();
        ElMessage.success('批量删除成功');
    } catch(e) {}
};

const handleBulkMaster = async () => {
     try {
        await ElMessageBox.confirm(`确定将选中的 ${selectedIds.value.size} 条错题标记为已掌握？`, '批量掌握', { type: 'info' });
        for (const id of selectedIds.value) {
            await store.markAsMastered(id);
        }
        clearSelection();
        ElMessage.success('批量标记成功');
    } catch(e) {}
};

const handleOpenBatchModal = () => {
    batchModalVisible.value = true;
};

const handleBatchSuccess = () => {
    clearSelection();
};

const startReview = () => {
    store.generateReviewPlan();
    ElMessage.success('复习计划生成中...');
};

</script>

<template>
  <div class="wrong-answers-page wa-bg-gray-50 wa-min-h-screen wa-text-gray-900 wa-font-sans">
    
    <!-- Sticky Header -->
    <header class="wa-sticky wa-top-0 wa-z-20 wa-bg-white/80 wa-backdrop-blur-md wa-border-b wa-border-gray-200">
        <div class="wa-max-w-7xl wa-mx-auto wa-px-4 sm:wa-px-6 wa-h-16 wa-flex wa-items-center wa-justify-between">
            <!-- Brand -->
            <div class="wa-flex wa-items-center wa-gap-3">
                <div class="wa-w-9 wa-h-9 wa-bg-indigo-600 wa-rounded-xl wa-flex wa-items-center wa-justify-center wa-text-white wa-shadow-lg wa-shadow-indigo-500/20">
                     <span class="wa-font-bold wa-text-lg">错</span>
                </div>
                <div>
                    <h1 class="wa-text-base wa-font-bold wa-leading-none">错题本</h1>
                    <p class="wa-text-xs wa-text-gray-500 wa-mt-0.5">智能诊断与复习平台</p>
                </div>
            </div>

            <!-- Actions -->
            <div class="wa-flex wa-items-center wa-gap-4">
                <!-- Search -->
                <div class="wa-relative wa-hidden md:wa-block wa-w-64">
                    <div class="wa-absolute wa-inset-y-0 wa-left-0 wa-pl-3 wa-flex wa-items-center wa-pointer-events-none">
                        <Search class="wa-text-gray-400" :size="16" />
                    </div>
                    <input 
                        v-model="filters.search"
                        type="text" 
                        placeholder="搜索题目、标签..." 
                        class="wa-block wa-w-full wa-pl-9 wa-pr-4 wa-py-2 wa-border wa-border-gray-200 wa-rounded-lg wa-text-sm wa-bg-gray-50 focus:wa-bg-white focus:wa-outline-none focus:wa-ring-2 focus:wa-ring-indigo-500/20 wa-transition-all"
                    >
                </div>

                <div class="wa-h-6 wa-w-px wa-bg-gray-200 wa-hidden sm:wa-block"></div>

                <!-- View Toggle -->
                <div class="wa-flex wa-bg-gray-100 wa-p-1 wa-rounded-lg">
                    <button 
                        @click="viewMode = 'grid'"
                        class="wa-p-1.5 wa-rounded-md wa-transition-all"
                        :class="viewMode === 'grid' ? 'wa-bg-white wa-text-indigo-600 wa-shadow-sm' : 'wa-text-gray-400 hover:wa-text-gray-600'"
                    >
                        <LayoutGrid :size="16" />
                    </button>
                     <button 
                        @click="viewMode = 'list'"
                        class="wa-p-1.5 wa-rounded-md wa-transition-all"
                        :class="viewMode === 'list' ? 'wa-bg-white wa-text-indigo-600 wa-shadow-sm' : 'wa-text-gray-400 hover:wa-text-gray-600'"
                    >
                        <List :size="16" />
                    </button>
                </div>

                <button 
                    @click="startReview"
                    class="wa-flex wa-items-center wa-gap-2 wa-px-4 wa-py-2 wa-bg-indigo-600 wa-hover-bg-indigo-700 wa-text-white wa-rounded-lg wa-text-sm wa-font-medium wa-shadow-md wa-shadow-indigo-500/20 wa-transition-all hover:wa--translate-y-0.5"
                >
                    <PlayCircle :size="16" />
                    <span class="wa-hidden sm:wa-inline">开始复习</span>
                </button>
            </div>
        </div>
    </header>

    <div class="wa-max-w-7xl wa-mx-auto wa-px-4 sm:wa-px-6 wa-py-8 wa-flex wa-gap-8">
        
        <!-- Sidebar -->
        <FilterSidebar 
            :filters="filters" 
            :counts="counts"
            :allTags="allTags"
            @update:filters="Object.assign(filters, $event)"
        />

        <!-- Main Content -->
        <main class="wa-flex-1 wa-min-w-0">
            
            <!-- Filters Summary / Clear -->
            <div v-if="filters.search || filters.selectedSources.length || filters.selectedTypes.length || filters.selectedTags.length" class="wa-mb-6 wa-flex wa-items-center wa-justify-between wa-bg-white wa-p-3 wa-rounded-xl wa-border wa-border-gray-200 wa-shadow-sm">
                <div class="wa-flex wa-items-center wa-gap-2 wa-text-sm wa-text-gray-500">
                    <Filter class="wa-text-indigo-500" :size="16" />
                    <span>筛选结果: <strong>{{ filteredData.length }}</strong> 条记录</span>
                </div>
                <button 
                    @click="clearFilters"
                    class="wa-text-xs wa-text-rose-500 wa-font-medium wa-bg-rose-50 wa-px-3 wa-py-1.5 wa-rounded-lg hover:wa-bg-rose-100 wa-transition-colors wa-flex wa-items-center wa-gap-1"
                >
                    <X :size="14" /> 清除筛选
                </button>
            </div>

            <!-- Empty State -->
            <div v-if="filteredData.length === 0 && !loading" class="wa-text-center wa-py-20 wa-bg-white wa-rounded-2xl wa-border wa-border-dashed wa-border-gray-200">
                <div class="wa-w-16 wa-h-16 wa-bg-gray-50 wa-rounded-2xl wa-flex wa-items-center wa-justify-center wa-mx-auto wa-mb-4 wa-text-gray-300">
                    <Search :size="32" />
                </div>
                <h3 class="wa-text-lg wa-font-bold wa-text-gray-900">未找到相关错题</h3>
                <p class="wa-text-gray-500 wa-mt-1 wa-mb-6">尝试调整筛选条件或搜索关键词</p>
                <button @click="clearFilters" class="wa-text-indigo-600 wa-font-medium hover:wa-underline">清除所有筛选</button>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="wa-py-20 wa-text-center">
                 <div class="wa-animate-pulse wa-flex wa-flex-col wa-items-center wa-gap-4">
                     <div class="wa-h-4 wa-bg-gray-200 wa-rounded wa-w-1/3"></div>
                     <div class="wa-h-4 wa-bg-gray-200 wa-rounded wa-w-1/2"></div>
                 </div>
            </div>

            <!-- Grid/List -->
            <div 
                v-else
                class="wa-grid wa-gap-4 wa-pb-24"
                :class="{ 'is-list-view': viewMode === 'list' }"
            >
                <MistakeCard
                    v-for="item in filteredData"
                    :key="item.id"
                    :item="item"
                    :is-selected="selectedIds.has(item.id)"
                    :selection-mode="selectionModeActive"
                    @toggle-select="toggleSelection"
                    @open-detail="handleOpenDetail"
                    @edit-item="handleEditItem"
                    @toggle-fav="handleToggleFav"
                    @delete-item="handleDeleteItem"
                />
            </div>
        </main>
    </div>

    <!-- Floating Bulk Actions -->
    <BulkActionBar 
        :selected-count="selectedIds.size"
        @add-to-batch="handleOpenBatchModal"
        @mark-mastered="handleBulkMaster"
        @delete-selected="handleBulkDelete"
        @clear-selection="clearSelection"
    />

    <!-- Batch Manager Modal -->
    <BatchManagerModal
        v-model="batchModalVisible"
        :selected-ids="selectedIds"
        @success="handleBatchSuccess"
    />

  </div>
</template>

<style scoped lang="scss">
@import "@/styles/wrong-answers.scss";

// Responsive Grid Layout
.wa-grid {
    display: grid;
    grid-template-columns: 1fr;
    
    // Grid View Responsiveness
    &:not(.is-list-view) {
        @media (min-width: 768px) {
            grid-template-columns: repeat(2, 1fr);
        }
        
        @media (min-width: 1024px) {
             grid-template-columns: repeat(3, 1fr);
        }

        @media (min-width: 1280px) {
             grid-template-columns: repeat(3, 1fr);
        }
    }

    // List View Override
    &.is-list-view {
        grid-template-columns: 1fr !important;
    }
}
</style>