<template>
  <SettingsCard>
    <div class="privacy-container">
      
      <!-- Visibility Group -->
      <div class="privacy-grid-row header-row">
        <div class="label-col">
          <SectionLabel 
            :icon="Eye" 
            title="个人资料可见性" 
            subtitle="设置谁可以查看您的详细资料页" 
          />
        </div>
        <div class="control-col">
          <div class="select-wrapper">
            <select class="custom-select" v-model="form.profileVisibility">
              <option value="public">所有人可见</option>
              <option value="friends">仅好友可见</option>
              <option value="private">仅自己可见</option>
            </select>
            <div class="select-arrow">
              <ChevronRight :size="16" class="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <!-- Toggles Group -->
      <div class="privacy-grid-row toggles-row">
        <div class="label-col">
          <SectionLabel :icon="MapPin" title="互动隐私" />
        </div>
        <div class="control-col stack-toggles">
          
          <div class="toggle-item">
            <span class="toggle-text">显示在线状态</span>
            <CustomToggle v-model="form.onlineStatus" />
          </div>

          <div class="toggle-item">
            <span class="toggle-text">允许陌生人私信</span>
            <CustomToggle v-model="form.allowMessages" />
          </div>

          <div class="toggle-item">
            <span class="toggle-text">分享地理位置信息</span>
            <CustomToggle v-model="form.shareLocation" />
          </div>

        </div>
      </div>

      <div class="footer-row">
        <button class="save-btn" :disabled="!isDirty || isSaving" @click="savePrivacy">
          {{ isSaving ? '保存中...' : '保存隐私设置' }}
        </button>
      </div>

    </div>
  </SettingsCard>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import SettingsCard from './SettingsCard.vue';
import SectionLabel from './ui/SectionLabel.vue';
import CustomToggle from './ui/CustomToggle.vue';
import { Eye, MapPin, ChevronRight } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';

const store = useSettingsStore();
const { privacy } = storeToRefs(store);

const form = reactive({
  profileVisibility: 'public',
  onlineStatus: true,
  allowMessages: true,
  shareLocation: false
});

const original = ref('');
const isSaving = ref(false);

const syncFromStore = (data) => {
  if (!data) return;
  form.profileVisibility = data.profileVisibility ?? 'public';
  form.onlineStatus = data.onlineStatus ?? true;
  form.allowMessages = data.allowMessages ?? true;
  form.shareLocation = data.shareLocation ?? false;
  original.value = JSON.stringify(form);
};

onMounted(async () => {
  await store.loadPrivacy();
  syncFromStore(privacy.value);
});

watch(privacy, (val) => syncFromStore(val));

const isDirty = computed(() => JSON.stringify(form) !== original.value);

const savePrivacy = async () => {
  if (isSaving.value || !isDirty.value) return;
  isSaving.value = true;
  try {
    await store.updatePrivacy({
      profileVisibility: form.profileVisibility,
      onlineStatus: form.onlineStatus,
      allowMessages: form.allowMessages,
      shareLocation: form.shareLocation
    });
    original.value = JSON.stringify(form);
    ElMessage.success('隐私设置已保存');
  } catch (error) {
    ElMessage.error(error?.message || '保存失败');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.privacy-container {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* space-y-8 */
}

.privacy-grid-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(12, 1fr);
  }
}

.label-col {
  @media (min-width: 768px) {
    grid-column: span 4;
  }
}

.control-col {
  @media (min-width: 768px) {
    grid-column: span 8;
  }
}

.header-row {
  padding-top: 0.5rem;
}

.toggles-row {
  padding-top: 2rem;
  border-top: 1px solid var(--color-slate-100);
}

/* Custom Select */
.select-wrapper {
  position: relative;
  max-width: 24rem; /* max-w-sm */
}

.custom-select {
  width: 100%;
  background-color: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.75rem; /* rounded-xl */
  padding: 0.75rem 1rem;
  font-size: 0.875rem; /* text-sm */
  color: var(--color-slate-700);
  outline: none;
  cursor: pointer;
  appearance: none;
  @include transition-all;

  &:hover {
    border-color: var(--color-blue-300);
    background-color: white;
    box-shadow: var(--shadow-sm);
  }

  &:focus {
    border-color: var(--color-blue-500);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
}

.select-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-slate-500);
  
  .rotate-90 {
    transform: rotate(90deg);
  }
}

/* Stack Toggles */
.stack-toggles {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* space-y-6 */
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 0.75rem;
  background-color: rgba(248, 250, 252, 0.3);
  border: 1px solid var(--color-slate-100);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--color-blue-200);
  }
}

.toggle-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-700);
}

/* Save Button */
.footer-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 2rem;
}

.save-btn {
  padding: 0.75rem 2rem;
  background-color: var(--color-blue-600);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.75rem;
  border: none;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.25);
  cursor: pointer;
  @include transition-all;

  &:hover {
    background-color: var(--color-blue-700);
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
