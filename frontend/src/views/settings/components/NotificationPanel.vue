<template>
  <SettingsCard>
    <div class="notification-grid">
      
      <!-- Column 1: Content -->
      <div>
        <div class="column-header">
          <MessageCircle :size="16" />
          <span>推送内容</span>
        </div>
        <div class="settings-group">
          <div v-for="(item, index) in contentItems" :key="item.id">
            <div class="notification-item">
              <div>
              <p class="item-label">{{ item.label }}</p>
              <p class="item-desc">{{ item.desc }}</p>
            </div>
            <CustomToggle 
                :modelValue="displaySettings[item.id]"
                @update:modelValue="val => updateSetting(item.id, val)"
              />
            </div>
            <div v-if="index < contentItems.length - 1" class="divider"></div>
          </div>
        </div>
      </div>

      <!-- Column 2: Method -->
      <div>
        <div class="column-header">
          <Bell :size="16" />
          <span>通知方式</span>
        </div>
        <div class="settings-group">
          <div v-for="(item, index) in methodItems" :key="item.id">
            <div class="notification-item">
              <div>
              <p class="item-label">{{ item.label }}</p>
              <p class="item-desc">{{ item.desc }}</p>
            </div>
            <CustomToggle 
                :modelValue="displaySettings[item.id]"
                @update:modelValue="val => updateSetting(item.id, val)"
              />
            </div>
            <div v-if="index < methodItems.length - 1" class="divider"></div>
          </div>
        </div>
      </div>

    </div>

    <div class="footer-row">
      <button class="reset-btn" @click="resetSettings">重置为默认</button>
    </div>
  </SettingsCard>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import SettingsCard from './SettingsCard.vue';
import CustomToggle from './ui/CustomToggle.vue';
import { MessageCircle, Bell } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';

const store = useSettingsStore();
const { notifications } = storeToRefs(store);

const defaults = {
  emailNotifications: false,
  smsNotifications: false,
  pushNotifications: true,
  commentNotifications: true,
  messageNotifications: true,
  systemNotifications: true,
  soundEnabled: true
};

const settings = computed(() => notifications.value || defaults);
const displaySettings = computed(() => ({
  system: settings.value.systemNotifications,
  message: settings.value.messageNotifications,
  comment: settings.value.commentNotifications,
  email: settings.value.emailNotifications,
  sms: settings.value.smsNotifications,
  sound: settings.value.soundEnabled
}));

onMounted(() => {
  store.loadNotifications();
});

const keyMap = {
  system: 'systemNotifications',
  message: 'messageNotifications',
  comment: 'commentNotifications',
  email: 'emailNotifications',
  sms: 'smsNotifications',
  sound: 'soundEnabled'
};

const updateSetting = (id, val) => {
  const key = keyMap[id];
  if (!key) return;
  store.updateNotifications({ [key]: val });
};

const resetSettings = () => {
  store.resetNotifications();
};

const contentItems = [
  { id: 'system', label: '系统通知', desc: '账户安全、版本更新等重要信息' },
  { id: 'message', label: '消息通知', desc: '好友发来的私信消息' },
  { id: 'comment', label: '评论通知', desc: '他人对您内容的评论和回复' }
];

const methodItems = [
  { id: 'email', label: '邮件通知', desc: '将重要通知发送至绑定邮箱' },
  { id: 'sms', label: '短信通知', desc: '将安全验证码发送至手机' },
  { id: 'sound', label: '声音提示', desc: '应用内消息提示音' }
];
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.notification-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem; /* gap-x-12 gap-y-8 */

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    column-gap: 3rem;
  }
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--color-blue-600);
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-group {
  background-color: rgba(248, 250, 252, 0.5);
  border-radius: 1rem; /* rounded-2xl */
  padding: 1.25rem;
  border: 1px solid var(--color-slate-100);
  @include transition-all;

  &:hover {
    border-color: var(--color-blue-100);
    box-shadow: var(--shadow-sm);
  }
}

.notification-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  
  /* group hover effect simulated on item label */
  &:hover .item-label {
    color: var(--color-blue-700);
  }
}

.item-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-800);
  margin: 0;
  transition: color 0.2s;
}

.item-desc {
  font-size: 0.75rem;
  color: var(--color-slate-500);
  margin-top: 0.125rem;
}

.divider {
  height: 1px;
  background-color: rgba(226, 232, 240, 0.6);
}

.footer-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
}

.reset-btn {
  padding: 0.75rem 2rem;
  background-color: white;
  border: 1px solid var(--color-slate-200);
  color: var(--color-slate-700);
  font-weight: 500;
  border-radius: 0.75rem;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  @include transition-all;

  &:hover {
    color: var(--color-blue-600);
    border-color: var(--color-blue-300);
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
