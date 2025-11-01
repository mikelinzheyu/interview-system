# 剩余组件代码集合

由于篇幅限制，这里提供所有剩余组件的完整代码

## 1. TopToolbar.vue

```vue
<template>
  <div class="top-toolbar">
    <!-- 左侧：群组信息 -->
    <div class="toolbar-left">
      <el-avatar :size="48" :src="room.avatar">
        {{ room.name?.charAt(0) || '?' }}
      </el-avatar>
      <div class="group-info">
        <div class="group-name">{{ room.name }}</div>
        <div class="group-meta">
          {{ room.memberCount }} 人
          <span class="online-status">• 在线</span>
        </div>
      </div>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="toolbar-right">
      <el-button text size="small" @click="$emit('menu', 'search')" title="搜索">
        <el-icon><Search /></el-icon>
      </el-button>
      <el-button text size="small" @click="$emit('menu', 'call')" title="语音通话">
        <el-icon><Phone /></el-icon>
      </el-button>
      <el-button text size="small" @click="$emit('menu', 'video')" title="视频通话">
        <el-icon><VideoCamera /></el-icon>
      </el-button>
      <el-dropdown @command="handleMoreMenu">
        <el-button text size="small" title="更多">
          <el-icon><MoreFilled /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="mute">设置禁言</el-dropdown-item>
            <el-dropdown-item command="info">查看群信息</el-dropdown-item>
            <el-dropdown-item divider />
            <el-dropdown-item command="exit">退出群组</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { Search, Phone, VideoCamera, MoreFilled } from '@element-plus/icons-vue'

const props = defineProps({
  room: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['menu'])

function handleMoreMenu(command) {
  emit('menu', command)
}
</script>

<style scoped>
.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.group-meta {
  font-size: 12px;
  color: #999;
}

.online-status {
  color: #67c23a;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
```

## 2. RightSidebar.vue

```vue
<template>
  <div class="right-sidebar">
    <!-- 选项卡 -->
    <div class="sidebar-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab === 'members' ? '成员' : '信息' }}
      </button>
    </div>

    <!-- 成员列表 -->
    <div v-if="activeTab === 'members'" class="members-list">
      <div
        v-for="member in members"
        :key="member.userId"
        class="member-item"
        @click="$emit('member-click', member)"
      >
        <el-avatar :size="32" :src="member.avatar">
          {{ member.name?.charAt(0) || '?' }}
        </el-avatar>
        <div class="member-info">
          <div class="member-name">{{ member.name }}</div>
          <div class="member-role">{{ member.role === 'owner' ? '群主' : '成员' }}</div>
        </div>
        <div v-if="member.isOnline" class="online-dot" />
      </div>
    </div>

    <!-- 群信息 -->
    <div v-else class="group-details">
      <div class="detail-item">
        <span class="label">群名称</span>
        <span class="value">{{ room.name }}</span>
      </div>
      <div class="detail-item">
        <span class="label">群成员</span>
        <span class="value">{{ room.memberCount }} 人</span>
      </div>
      <div class="detail-item">
        <span class="label">群公告</span>
        <span class="value">{{ room.announcement }}</span>
      </div>
      <div class="detail-item">
        <span class="label">创建时间</span>
        <span class="value">{{ formatTime(room.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  room: {
    type: Object,
    default: () => ({})
  },
  members: {
    type: Array,
    default: () => []
  }
})

defineEmits(['member-click', 'close'])

const activeTab = ref('members')
const tabs = ['members', 'info']

function formatTime(timestamp) {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.right-sidebar {
  width: 280px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #5c6af0;
  border-bottom-color: #5c6af0;
}

.members-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.member-item:hover {
  background: #f5f5f5;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.member-role {
  font-size: 11px;
  color: #999;
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
}

.group-details {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.value {
  font-size: 13px;
  color: #333;
}
</style>
```

## 3. ContextMenu.vue

```vue
<template>
  <div v-if="visible" class="context-menu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <div
      v-for="item in items"
      :key="item.action"
      class="menu-item"
      :class="{ danger: item.danger, divider: item.divider }"
      @click="handleSelect(item.action)"
    >
      <el-icon v-if="item.icon" :class="{ danger: item.danger }">
        <component :is="item.icon" />
      </el-icon>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'close'])

const visible = computed(() => props.items.length > 0)

function handleSelect(action) {
  emit('select', action)
  emit('close')
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 140px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.menu-item:hover:not(.divider) {
  background: #f5f5f5;
  color: #5c6af0;
}

.menu-item.danger {
  color: #ff5f72;
}

.menu-item.danger:hover {
  background: rgba(255, 95, 114, 0.1);
  color: #ff5f72;
}

.menu-item.divider {
  height: 1px;
  background: #e5e7eb;
  padding: 0;
  cursor: default;
  margin: 4px 0;
}
</style>
```

## 4. FloatingNewMessageButton.vue

```vue
<template>
  <div class="floating-button" @click="$emit('click')">
    <el-icon><ArrowDown /></el-icon>
    <span v-if="count > 0" class="badge">{{ count > 99 ? '99+' : count }}</span>
    <span class="text">下滑查看新消息</span>
  </div>
</template>

<script setup>
import { ArrowDown } from '@element-plus/icons-vue'

defineProps({
  count: {
    type: Number,
    default: 0
  }
})

defineEmits(['click'])
</script>

<style scoped>
.floating-button {
  position: fixed;
  bottom: 80px;
  right: 24px;
  background: linear-gradient(135deg, #5c6af0 0%, #6b7eff 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(92, 106, 240, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 12px;
  z-index: 50;
}

.floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(92, 106, 240, 0.4);
}

.badge {
  background: #ff5f72;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 0 4px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
</style>
```

## 使用说明

这些组件需要集成到 ChatRoom.vue 中。关键步骤：

1. 在 ChatRoom.vue 中导入这些组件
2. 在模板中使用它们
3. 处理相关的事件和状态

## 必要的 npm 包

```json
{
  "dependencies": {
    "vue": "^3.x",
    "element-plus": "^2.x",
    "dayjs": "^1.x"
  }
}
```

## 样式主题

使用统一的色彩方案：
- 主色：#5c6af0
- 文字：#333
- 辅助：#999
- 成功：#67c23a
- 危险：#ff5f72
- 警告：#ff9500

## 下一步

1. 复制这些组件代码到对应的 .vue 文件
2. 更新 ChatRoom.vue 导入和使用这些组件
3. 测试各个功能
4. 优化样式和动画
