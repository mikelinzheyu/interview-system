<template>
  <SettingsCard>
    <div class="profile-container">
      
      <!-- Avatar Section -->
      <div class="avatar-section">
        <div class="avatar-group" @click="$refs.avatarInput.click()">
          <div class="avatar-wrapper">
            <img v-if="form.avatarUrl" :src="form.avatarUrl" alt="Avatar" class="avatar-img" />
            <div v-else class="avatar-placeholder">
              <User :size="40" />
            </div>
            
            <!-- Hover Overlay -->
            <div class="avatar-overlay">
              <Camera :size="24" />
            </div>
          </div>
          <div class="avatar-info">
            <h3 class="section-title">个人头像</h3>
            <p class="section-desc">支持 JPG, GIF 或 PNG 格式，建议尺寸 200x200 像素。</p>
            <div class="upload-controls">
              <button class="upload-btn">更换头像</button>
              <input 
                type="file" 
                ref="avatarInput" 
                @change="handleAvatarUpload" 
                accept="image/*" 
                class="hidden-input" 
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Form Fields -->
      <form class="form-stack" @submit.prevent="saveProfile">
        
        <!-- Username -->
        <div class="form-row">
          <label class="form-label">用户名</label>
          <div class="form-content">
            <input 
              type="text" 
              v-model="form.username" 
              placeholder="请输入用户名"
              class="form-input" 
            />
            <p class="input-tip">用户名是您的唯一标识符，支持字母和数字</p>
          </div>
        </div>

        <!-- Nickname -->
        <div class="form-row">
          <label class="form-label">昵称</label>
          <div class="form-content">
            <input 
              type="text" 
              v-model="form.nickname" 
              placeholder="请输入您的昵称" 
              class="form-input" 
            />
          </div>
        </div>

        <!-- Gender -->
        <div class="form-row">
          <label class="form-label">性别</label>
          <div class="form-content">
            <div class="gender-group">
              <label 
                v-for="g in genders" 
                :key="g.value"
                class="gender-label"
              >
                <div class="radio-custom">
                  <input 
                    type="radio" 
                    v-model="form.gender" 
                    :value="g.value" 
                    class="sr-only peer"
                  >
                  <div class="radio-ring"></div>
                  <div class="radio-dot"></div>
                </div>
                <span :class="['gender-text', { 'active': form.gender === g.value }]">
                  {{ g.label }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Birthday -->
        <div class="form-row">
          <label class="form-label">生日</label>
          <div class="form-content relative">
            <input 
              type="date" 
              v-model="form.birthday" 
              class="form-input" 
            />
          </div>
        </div>

        <!-- Bio -->
        <div class="form-row items-start">
          <div class="form-label-col">
            <label class="form-label">个性签名</label>
            <!-- AI Button (Desktop) -->
            <button 
              type="button"
              @click="generateBio" 
              :disabled="isGenerating"
              class="ai-btn-desktop"
            >
              <Sparkles :size="12" />
              <span>AI 生成</span>
            </button>
          </div>
          <div class="form-content relative">
            <textarea 
              v-model="form.bio" 
              rows="4" 
              maxlength="100"
              placeholder="介绍一下自己，或者写一句喜欢的格言..." 
              class="form-textarea"
            ></textarea>
            <div class="char-count" :class="{ 'limit-near': form.bio.length > 90 }">
              {{ form.bio.length }} / 100
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-footer">
          <div class="spacer"></div>
          <div class="footer-content">
            <button type="submit" class="save-btn" :disabled="isSaving">
              <span v-if="isSaving" class="flex items-center gap-2">
                <Loader2 :size="16" class="animate-spin" /> 保存中...
              </span>
              <span v-else class="flex items-center gap-2">
                <Save :size="16" /> 保存修改
              </span>
            </button>
          </div>
        </div>

      </form>
    </div>
  </SettingsCard>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue';
import SettingsCard from './SettingsCard.vue';
import { User, Camera, Sparkles, Loader2, Save } from 'lucide-vue-next';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { userAPI } from '@/api/user';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const isSaving = ref(false);
const isGenerating = ref(false);

const form = reactive({
  avatarUrl: '',
  username: '',
  nickname: '',
  gender: 'secret',
  birthday: '',
  bio: ''
});

const genders = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'secret' }
];

onMounted(async () => {
  if (!user.value) {
    await userStore.fetchUserInfo();
  }
  if (user.value) {
    syncForm(user.value);
  }
});

watch(user, (newVal) => {
  if (newVal) syncForm(newVal);
}, { immediate: true });

function syncForm(data) {
  form.avatarUrl = data.avatar || '';
  form.username = data.username || '';
  form.nickname = data.nickname || '';
  form.gender = data.gender || 'secret';
  form.birthday = data.birthday ? data.birthday.split('T')[0] : '';
  form.bio = data.bio || '';
}

const saveProfile = async () => {
  isSaving.value = true;
  try {
    await userStore.updateUserInfo({
      nickname: form.nickname,
      gender: form.gender,
      birthday: form.birthday,
      bio: form.bio,
      avatar: form.avatarUrl
    });
    ElMessage.success('个人资料更新成功');
  } catch (error) {
    ElMessage.error('保存失败，请稍后再试');
  } finally {
    isSaving.value = false;
  }
};

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过 2MB');
    return;
  }

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await userAPI.uploadAvatar(formData);
    if (response.code === 200 && response.data.url) {
      form.avatarUrl = response.data.url;
      await userStore.fetchUserInfo(); 
      ElMessage.success('头像上传成功');
    }
  } catch (error) {
    ElMessage.error('头像上传失败');
  }
};

const generateBio = () => {
  if (!form.nickname) {
    ElMessage.warning('请输入昵称以便生成个性签名');
    return;
  }
  isGenerating.value = true;
  // Mock AI generation
  setTimeout(() => {
    const bios = [
      "热爱生活，拥抱未来。",
      "代码如诗，人生如歌。",
      "探索未知的世界，记录美好的瞬间。",
      "保持好奇，保持热爱。"
    ];
    form.bio = bios[Math.floor(Math.random() * bios.length)];
    isGenerating.value = false;
    ElMessage.success('个性签名生成成功');
  }, 1500);
};
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* Avatar Section */
.avatar-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-slate-100);
}

.avatar-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
}

.avatar-wrapper {
  position: relative;
  width: 7rem; /* w-28 */
  height: 7rem;
  border-radius: 9999px;
  background-color: var(--color-slate-100);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  border: 4px solid white;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.05);
    .avatar-overlay {
      opacity: 1;
    }
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-slate-300);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(1px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-info {
  flex: 1;
}

.section-title {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600;
  color: var(--color-slate-800);
  margin: 0;
}

.section-desc {
  color: var(--color-slate-500);
  font-size: 0.875rem;
  margin-top: 0.25rem;
  margin-bottom: 1rem;
}

.upload-btn {
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid var(--color-slate-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-700);
  cursor: pointer;
  @include transition-all;

  &:hover {
    border-color: var(--color-blue-500);
    color: var(--color-blue-600);
  }
}

.hidden-input {
  display: none;
}

/* Form Styles */
.form-stack {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* space-y-8 */
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    align-items: center;
  }
}

.form-label-col {
  grid-column: span 3 / span 3;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.form-label {
  grid-column: span 3 / span 3;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-600);
}

.form-content {
  grid-column: span 9 / span 9;
}

.form-input {
  width: 100%;
  background-color: white;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.75rem; /* rounded-xl */
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: var(--color-slate-800);
  outline: none;
  @include transition-all;

  &::placeholder {
    color: var(--color-slate-400);
  }

  &:focus {
    border-color: var(--color-blue-500);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
}

.input-tip {
  font-size: 0.75rem;
  color: var(--color-slate-400);
  margin-top: 0.375rem;
  margin-left: 0.25rem;
}

/* Gender Radio */
.gender-group {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.gender-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.radio-custom {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
}

.radio-ring {
  width: 100%;
  height: 100%;
  border: 2px solid var(--color-slate-300);
  border-radius: 9999px;
  transition: all 0.2s;

  input:checked ~ & {
    border-color: var(--color-blue-500);
    background-color: var(--color-blue-500);
  }
}

.radio-dot {
  position: absolute;
  width: 0.5rem;
  height: 0.5rem;
  background-color: white;
  border-radius: 9999px;
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s;

  input:checked ~ & {
    opacity: 1;
    transform: scale(1);
  }
}

.gender-text {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-600);
  transition: color 0.2s;
  
  &.active {
    color: var(--color-blue-600);
  }
}

/* Bio */
.ai-btn-desktop {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-blue-600);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: fit-content;
  transition: color 0.2s;
  
  &:hover {
    color: var(--color-blue-700);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.form-textarea {
  @extend .form-input;
  resize: none;
  line-height: 1.6;
  height: 8rem;
}

.char-count {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-slate-400);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  
  &.limit-near {
    color: #f97316; /* orange-500 */
  }
}

/* Footer */
.form-footer {
  display: flex;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-slate-100);
  margin-top: 0.5rem;
}

.spacer {
  display: none;
  @media (min-width: 768px) {
    display: block;
    width: 25%; /* Matches 3 columns out of 12 approx */
  }
}

.footer-content {
  flex: 1;
}

.save-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(to right, var(--color-blue-600), var(--color-blue-700));
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.75rem; /* rounded-xl */
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.25);
  min-width: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  @include transition-all;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
}
</style>