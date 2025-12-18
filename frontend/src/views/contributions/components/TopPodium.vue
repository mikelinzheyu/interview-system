<template>
  <div class="podium-container">
    <!-- 2nd Place -->
    <div 
      class="podium-item silver" 
      v-if="users[1]" 
      @click="$emit('view-profile', users[1].userId)"
    >
      <div class="medal-icon">🥈</div>
      <div class="avatar-wrapper">
        <el-avatar :size="80" :src="users[1].avatar" class="avatar" />
        <div class="level-badge">Lv.{{ users[1].level || 1 }}</div>
      </div>
      <div class="user-info">
        <div class="user-name">{{ users[1].username }}</div>
        <div class="user-score">{{ users[1].totalPoints }} pts</div>
      </div>
      <div class="podium-step">2</div>
    </div>

    <!-- 1st Place -->
    <div 
      class="podium-item gold" 
      v-if="users[0]"
      @click="$emit('view-profile', users[0].userId)"
    >
      <div class="crown-icon">👑</div>
      <div class="avatar-wrapper">
        <el-avatar :size="100" :src="users[0].avatar" class="avatar" />
        <div class="level-badge">Lv.{{ users[0].level || 1 }}</div>
      </div>
      <div class="user-info">
        <div class="user-name">{{ users[0].username }}</div>
        <div class="user-score">{{ users[0].totalPoints }} pts</div>
      </div>
      <div class="podium-step">1</div>
    </div>

    <!-- 3rd Place -->
    <div 
      class="podium-item bronze" 
      v-if="users[2]"
      @click="$emit('view-profile', users[2].userId)"
    >
      <div class="medal-icon">🥉</div>
      <div class="avatar-wrapper">
        <el-avatar :size="80" :src="users[2].avatar" class="avatar" />
        <div class="level-badge">Lv.{{ users[2].level || 1 }}</div>
      </div>
      <div class="user-info">
        <div class="user-name">{{ users[2].username }}</div>
        <div class="user-score">{{ users[2].totalPoints }} pts</div>
      </div>
      <div class="podium-step">3</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  users: {
    type: Array,
    default: () => []
  }
})

defineEmits(['view-profile'])
</script>

<style scoped>
.podium-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 380px;
  padding-bottom: 20px;
  gap: 20px;
  margin-bottom: 40px;
  background: radial-gradient(circle at 50% 100%, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 1;
}

.podium-item:hover {
  transform: translateY(-10px);
  z-index: 2;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 15px;
  padding: 4px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.level-badge {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  background: #303133;
  color: #fff;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  border: 2px solid white;
}

.medal-icon, .crown-icon {
  font-size: 32px;
  margin-bottom: 10px;
  animation: float 3s ease-in-out infinite;
}

.crown-icon {
  font-size: 40px;
  color: #FFD700;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
}

.user-info {
  text-align: center;
  margin-bottom: 15px;
}

.user-name {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  margin-bottom: 4px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-score {
  font-size: 14px;
  color: #606266;
  font-weight: 600;
}

.podium-step {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-size: 40px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.6);
  padding-top: 10px;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* Gold (1st) */
.gold {
  order: 2;
  margin-bottom: 0;
}
.gold .avatar-wrapper {
  border: 4px solid #FFD700;
}
.gold .podium-step {
  height: 160px;
  width: 160px;
  background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%);
}

/* Silver (2nd) */
.silver {
  order: 1;
}
.silver .avatar-wrapper {
  border: 4px solid #C0C0C0;
}
.silver .podium-step {
  height: 120px;
  width: 140px;
  background: linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%);
}

/* Bronze (3rd) */
.bronze {
  order: 3;
}
.bronze .avatar-wrapper {
  border: 4px solid #CD7F32;
}
.bronze .podium-step {
  height: 90px;
  width: 140px;
  background: linear-gradient(135deg, #CD7F32 0%, #A0522D 100%);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .podium-container {
    height: auto;
    align-items: flex-end;
    gap: 10px;
  }
  
  .gold .podium-step { width: 100px; height: 120px; }
  .silver .podium-step { width: 90px; height: 90px; }
  .bronze .podium-step { width: 90px; height: 70px; }
  
  .gold .avatar { width: 70px !important; height: 70px !important; }
  .silver .avatar, .bronze .avatar { width: 50px !important; height: 50px !important; }
}
</style>
