  80:           </div>
  81:         </div>
  82:       </div>
  83:     </transition>
  84:   </div>
  85: </template>
  86: 
  87: <script setup>
  88: import { ref, computed } from 'vue'
  89: import { useRouter } from 'vue-router'
  90: import { Search, Loading } from '@element-plus/icons-vue'
  91: import { fuzzyMatch, getMatchScore } from '@/utils/pinyin'
  92: 
  93: const router = useRouter()
  94: 
  95: const props = defineProps({
  96:   domains: {
  97:     type: Array,
  98:     default: () => []
  99:   },
 100:   categories: {
 101:     type: Array,
 102:     default: () => []
 103:   },
 104:   questions: {
 105:     type: Array,
 106:     default: () => []
 107:   },
 108:   loading: {
 109:     type: Boolean,
 110:     default: false
 111:   }
 112: })
 113: 
 114: const emit = defineEmits(['search', 'navigate', 'select'])
 115: 
 116: const query = ref('')
 117: const isFocused = ref(false)
 118: const activeTab = ref('all')
 119: 
 120: const tabs = [
 121:   { key: 'all', label: '全部' },
 122:   { key: 'question', label: '题目' },
 123:   { key: 'domain', label: '领域' },
 124:   { key: 'category', label: '分类' }
 125: ]
 126: 
 127: const quickCommands = [
 128:   { id: 'hot', name: '🔥 热门领域', description: '查看最受欢迎的学科' },
 129:   { id: 'favorites', name: '⭐ 我的收藏', description: '查看已收藏的领域' },
 130:   { id: 'progress', name: '📈 学习进度', description: '打开我的学习统计' }
 131: ]
 132: 
 133: const showDropdown = computed(() => isFocused.value)
 134: const isSearching = computed(() => props.loading)
 135: 
 136: // 规范化数据
 137: const normalizedDomains = computed(() =>
 138:   props.domains.map(domain => ({
 139:     id: domain.id,
 140:     type: 'domain',
 141:     name: domain.name,
 142:     meta: `${domain.questionCount || 0} 道题`,
 143:     icon: domain.icon || '📘',
 144:     payload: domain
 145:   }))
 146: )
 147: 
 148: const normalizedQuestions = computed(() =>
 149:   props.questions.map(question => ({
 150:     id: question.id,
 151:     type: 'question',
 152:     name: question.title || question.name || '未命名',
 153:     meta: `${question.difficulty || '未知'} | ${question.stats?.attempts || 0} 人做过`,
 154:     icon: '❓',
 155:     payload: question
 156:   }))
 157: )
 158: 
 159: const normalizedCategories = computed(() =>
 160:   props.categories.flatMap(category => {
 161:     const children = category.items || category.children || []
 162:     return children.map(item => ({
 163:       id: item.id,
 164:       type: 'category',
 165:       name: `${item.name || '未命名'}`,
 166:       meta: `${category.name}`,
 167:       icon: item.icon || '🧭',
 168:       payload: item
 169:     }))
 170:   })
 171: )
 172: 
 173: // 搜索结果
 174: const searchResults = computed(() => {
 175:   if (!query.value) return []
 176: 
 177:   const candidates = [
 178:     ...normalizedDomains.value,
 179:     ...normalizedQuestions.value,
 180:     ...normalizedCategories.value
 181:   ]
 182: 
 183:   return candidates
 184:     .map(item => {
 185:       if (!fuzzyMatch(query.value, item.name)) return null
 186:       const score = getMatchScore(query.value, item.name)
 187:       return { ...item, score }
 188:     })
 189:     .filter(Boolean)
 190:     .sort((a, b) => b.score - a.score)
 191:     .slice(0, 10)
 192: })
 193: 
 194: function getCount(tabKey) {
 195:   if (tabKey === 'all') return searchResults.value.length
 196:   return searchResults.value.filter(r => r.type === tabKey).length
 197: }
 198: 
 199: function getFilteredResults() {
 200:   if (activeTab.value === 'all') return searchResults.value
 201:   return searchResults.value.filter(r => r.type === activeTab.value)
 202: }
 203: 
 204: function highlightKeyword(text) {
 205:   if (!query.value || !text) return text
 206:   const regex = new RegExp(`(${query.value})`, 'gi')
 207:   return text.replace(regex, '<mark>$1</mark>')
 208: }
 209: 
 210: function handleInput() {
 211:   activeTab.value = 'all'
 212: }
 213: 
 214: function handleSearch() {
 215:   const q = (query.value || '').trim()
 216:   if (q) {
 217:     emit('search', q)
 218:     isFocused.value = false
 219:   }
 220: }
 221: 
 222: function handleClear() {
 223:   query.value = ''
 224:   emit('search', '')
 225: }
 226: 
 227: function handleFocus() {
 228:   isFocused.value = true
 229:   // 点击搜索框时导航到搜索引擎页面
 230:   router.push({ name: 'SearchHub' })
 231: }
 232: 
 233: function handleBlur() {
 234:   setTimeout(() => {
 235:     isFocused.value = false
 236:   }, 150)
 237: }
 238: 
 239: function selectResult(result) {
 240:   emit('select', result)
