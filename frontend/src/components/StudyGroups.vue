<template>
  <div class="study-groups">
    <!-- Header -->\n    <div class="groups-header">
      <h3 class="groups-title">
        <span class="groups-icon">👥</span> 学习小组
      </h3>
      <el-button type="primary" @click="showCreateGroupDialog">
        创建小组
      </el-button>
    </div>

    <!-- Search and Filter -->\n    <div class="search-filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索小组名称或描述..."
        prefix-icon="Search"
        @input="handleSearch"
        clearable
      />

      <el-select v-model="selectedDomain" placeholder="按领域筛选" clearable @change="handleDomainFilter">
        <el-option
          v-for="domain in domains"
          :key="domain"
          :label="domain"
          :value="domain"
        />
      </el-select>

      <el-select v-model="selectedStatus" placeholder="按状态筛选" clearable @change="handleStatusFilter">
        <el-option label="活跃" value="active" />
        <el-option label="已归档" value="archived" />
      </el-select>
    </div>

    <!-- Groups Grid -->\n    <div class="groups-grid">
      <div
        v-for="group in filteredGroups"
        :key="group.id"
        class="group-card"
        :class="{ archived: group.status === 'archived' }"
        @click="selectGroup(group)"
      >
        <div class="card-header">
          <div class="group-image\">
            <img :src="group.image" :alt="group.name" />
          </div>
          <div class="group-status\">
            <el-tag :type="group.status === 'active' ? 'success' : 'info'\" effect=\"light\">
              {{ group.status === 'active' ? '活跃' : '已归档' }}
            </el-tag>
          </div>
        </div>

        <div class="card-content\">
          <h4 class=\"group-name\">{{ group.name }}</h4>
          <p class=\"group-description\">{{ group.description }}</p>

          <div class=\"group-meta\">
            <div class=\"meta-item\">
              <span class=\"meta-icon\">👤</span>
              <span class=\"meta-label\">{{ group.members }}/{{ group.maxMembers }}</span>
            </div>
            <div class=\"meta-item\">
              <span class=\"meta-icon\">🏷️</span>
              <span class=\"meta-label\">{{ group.topics }} 个话题</span>
            </div>
            <div class=\"meta-item\">
              <span class=\"meta-icon\">⏱️</span>
              <span class=\"meta-label\">{{ getRelativeTime(group.lastActivity) }}</span>
            </div>
          </div>

          <div class=\"group-domain\">
            <el-tag type=\"info\" effect=\"light\">{{ group.domain }}</el-tag>
          </div>
        </div>

        <div class=\"card-footer\">
          <div class=\"leader-info\">
            <img :src=\"group.leader.avatar\" :alt=\"group.leader.userName\" class=\"avatar\" />
            <div class=\"leader-details\">
              <div class=\"leader-name\">{{ group.leader.userName }}</div>
              <div class=\"leader-role\">组长</div>
            </div>
          </div>

          <el-button
            v-if=\"!isMemberOf(group.id)\"
            type=\"primary\"
            size=\"small\"
            @click.stop=\"joinGroup(group)\"
          >
            加入
          </el-button>
          <el-button
            v-else
            type=\"info\"
            size=\"small\"
            @click.stop=\"leaveGroup(group)\"
          >
            已加入
          </el-button>
        </div>
      </div>

      <div v-if=\"filteredGroups.length === 0\" class=\"empty-state\">
        <div class=\"empty-icon\">📭</div>
        <div class=\"empty-text\">还没有找到符合条件的小组</div>
        <el-button type=\"primary\" @click=\"showCreateGroupDialog\" style=\"margin-top: 16px\">
          创建第一个小组
        </el-button>
      </div>
    </div>

    <!-- Create Group Dialog -->\n    <el-dialog v-model=\"createGroupVisible\" title=\"创建新小组\" width=\"600px\" center>
      <div class=\"create-form\">
        <el-form :model=\"newGroup\" label-width=\"80px\">
          <el-form-item label=\"小组名称\">
            <el-input v-model=\"newGroup.name\" placeholder=\"输入小组名称\" />
          </el-form-item>

          <el-form-item label=\"描述\">
            <el-input
              v-model=\"newGroup.description\"
              type=\"textarea\"
              rows=\"3\"
              placeholder=\"输入小组描述\"
            />
          </el-form-item>

          <el-form-item label=\"领域\">
            <el-select v-model=\"newGroup.domain\" placeholder=\"选择学习领域\">
              <el-option
                v-for=\"domain in domains\"
                :key=\"domain\"
                :label=\"domain\"
                :value=\"domain\"
              />
            </el-select>
          </el-form-item>

          <el-form-item label=\"成员上限\">
            <el-input-number v-model=\"newGroup.maxMembers\" :min=\"5\" :max=\"200\" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click=\"createGroupVisible = false\">取消</el-button>
        <el-button type=\"primary\" @click=\"submitCreateGroup\">创建小组</el-button>
      </template>
    </el-dialog>

    <!-- Group Detail Dialog -->\n    <el-dialog
      v-model=\"groupDetailVisible\"
      :title=\"selectedGroup?.name\"
      width=\"700px\"
      center
    >
      <div v-if=\"selectedGroup\" class=\"group-detail\">
        <!-- Group Info -->\n        <div class=\"detail-header\">
          <img :src=\"selectedGroup.image\" :alt=\"selectedGroup.name\" class=\"detail-image\" />
          <div class=\"detail-info\">
            <h4>{{ selectedGroup.name }}</h4>
            <p>{{ selectedGroup.description }}</p>
            <div class=\"detail-stats\">
              <span>👤 {{ selectedGroup.members }}/{{ selectedGroup.maxMembers }} 成员</span>
              <span>🏷️ {{ selectedGroup.topics }} 个话题</span>
              <span>📅 创建于 {{ formatDate(selectedGroup.createdAt) }}</span>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- Group Members -->\n        <div class=\"members-section\">
          <h5>小组成员</h5>
          <div class=\"members-grid\">
            <div v-for=\"member in groupMembers\" :key=\"member.id\" class=\"member-card\">
              <img :src=\"member.avatar\" :alt=\"member.userName\" class=\"member-avatar\" />
              <div class=\"member-info\">
                <div class=\"member-name\">{{ member.userName }}</div>
                <div v-if=\"member.userId === selectedGroup.leader.userId\" class=\"member-role\">
                  组长
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- Group Discussions -->\n        <div class=\"discussions-section\">
          <h5>最近讨论</h5>
          <div class=\"discussions-list\">
            <div v-for=\"discussion in groupDiscussions\" :key=\"discussion.id\" class=\"discussion-item\">
              <div class=\"discussion-header\">
                <h6>{{ discussion.title }}</h6>
                <span class=\"discussion-time\">{{ getRelativeTime(discussion.createdAt) }}</span>
              </div>
              <p class=\"discussion-content\">{{ discussion.content }}</p>
              <div class=\"discussion-meta\">
                <span>👁️ {{ discussion.views }}</span>
                <span>💬 {{ discussion.replies }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import communityService from '@/services/communityService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const studyGroups = ref([])
const selectedGroup = ref(null)
const groupMembers = ref([])
const groupDiscussions = ref([])
const createGroupVisible = ref(false)
const groupDetailVisible = ref(false)
const myGroups = ref([])
const searchQuery = ref('')
const selectedDomain = ref('')
const selectedStatus = ref('')

const newGroup = ref({
  name: '',
  description: '',
  domain: 'JavaScript',
  maxMembers: 100
})

const domains = ['JavaScript', 'Python', 'React', 'Vue.js', 'TypeScript', 'Node.js']

// Computed
const filteredGroups = computed(() => {
  return studyGroups.value.filter((group) => {
    let matches = true

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      matches = matches && (
        group.name.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query)
      )
    }

    if (selectedDomain.value) {
      matches = matches && group.domain === selectedDomain.value
    }

    if (selectedStatus.value) {
      matches = matches && group.status === selectedStatus.value
    }

    return matches
  })
})

// Methods
const loadStudyGroups = () => {
  studyGroups.value = communityService.getStudyGroups(selectedDomain.value || null)
}

const loadMyGroups = () => {
  myGroups.value = studyGroups.value.filter(g =>
    g.members > 0 && Math.random() > 0.5 // Simulate user membership
  )
}

const showCreateGroupDialog = () => {
  newGroup.value = {
    name: '',
    description: '',
    domain: 'JavaScript',
    maxMembers: 100
  }
  createGroupVisible.value = true
}

const submitCreateGroup = () => {
  if (!newGroup.value.name || !newGroup.value.description) {
    ElMessage.warning('请填写小组名称和描述')
    return
  }

  const group = communityService.createStudyGroup(
    props.userId,
    newGroup.value.name,
    newGroup.value.description,
    newGroup.value.domain
  )

  // Update maxMembers
  group.maxMembers = newGroup.value.maxMembers

  studyGroups.value.push(group)
  myGroups.value.push(group)
  createGroupVisible.value = false
  ElMessage.success('小组创建成功！')
}

const selectGroup = (group) => {
  selectedGroup.value = group
  groupDiscussions.value = communityService.getGroupDiscussions(group.id)

  // Generate group members
  groupMembers.value = [{
    id: group.leader.userId,
    userId: group.leader.userId,
    userName: group.leader.userName,
    avatar: group.leader.avatar
  }]

  for (let i = 1; i < Math.min(group.members, 8); i++) {
    groupMembers.value.push({
      id: `member_${i}`,
      userId: `user_${i}`,
      userName: `Member ${i}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=member${i}`
    })
  }

  groupDetailVisible.value = true
}

const joinGroup = (group) => {
  const success = communityService.joinStudyGroup(group.id, props.userId)
  if (success) {
    group.members++
    myGroups.value.push(group)
    ElMessage.success('成功加入小组！')
  } else {
    ElMessage.warning('小组人数已满')
  }
}

const leaveGroup = (group) => {
  const idx = myGroups.value.findIndex(g => g.id === group.id)
  if (idx > -1) {
    myGroups.value.splice(idx, 1)
    group.members--
    ElMessage.success('已离开小组')
  }
}

const isMemberOf = (groupId) => {
  return myGroups.value.some(g => g.id === groupId)
}

const handleSearch = () => {
  // Filter is automatic through computed property
}

const handleDomainFilter = () => {
  // Filter is automatic through computed property
}

const handleStatusFilter = () => {
  // Filter is automatic through computed property
}

const getRelativeTime = (date) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000 / 60)

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  return `${Math.floor(diff / 1440)}天前`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadStudyGroups()
  loadMyGroups()
})
</script>

<style scoped>
.study-groups {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.groups-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.groups-icon {
  font-size: 24px;
}

/* Search Filter Section */
.search-filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-filter-section :deep(.el-input) {
  flex: 1;
  min-width: 200px;
}

.search-filter-section :deep(.el-select) {
  min-width: 160px;
}

/* Groups Grid */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.group-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.group-card:hover {
  border-color: rgba(94, 124, 224, 0.3);
  box-shadow: 0 4px 12px rgba(94, 124, 224, 0.1);
  transform: translateY(-2px);
}

.group-card.archived {
  opacity: 0.7;
}

.card-header {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.group-image {
  width: 100%;
  height: 100%;
}

.group-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-status {
  position: absolute;
  top: 8px;
  right: 8px;
}

.card-content {
  flex: 1;
  padding: 16px;
}

.group-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.group-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 11px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
}

.meta-icon {
  font-size: 12px;
}

.group-domain {
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid rgba(229, 230, 235, 0.3);
}

.leader-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.leader-details {
  display: flex;
  flex-direction: column;
}

.leader-name {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
}

.leader-role {
  font-size: 9px;
  color: #6b7280;
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

/* Create Form */
.create-form {
  padding: 12px 0;
}

/* Group Detail */
.group-detail {
  padding: 12px 0;
}

.detail-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

.detail-info {
  flex: 1;
}

.detail-info h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.detail-info p {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.detail-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}

/* Members Section */
.members-section h5 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.member-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  flex: 1;
  text-align: center;
}

.member-name {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.member-role {
  font-size: 9px;
  color: #5e7ce0;
  font-weight: 600;
}

/* Discussions Section */
.discussions-section h5 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.discussions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.discussion-item {
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.discussion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.discussion-header h6 {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.discussion-time {
  font-size: 10px;
  color: #9ca3af;
}

.discussion-content {
  font-size: 11px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.discussion-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }

  .search-filter-section {
    flex-direction: column;
  }

  .search-filter-section :deep(.el-input),
  .search-filter-section :deep(.el-select) {
    width: 100%;
  }

  .detail-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .detail-stats {
    flex-direction: column;
    gap: 8px;
  }

  .members-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .study-groups {
    padding: 16px;
  }

  .groups-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .members-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
