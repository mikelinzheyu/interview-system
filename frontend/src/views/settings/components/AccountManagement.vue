<template>
  <SettingsCard>
    <div class="account-stack">
      
      <!-- Delete Account Card -->
      <div class="danger-card">
        <div class="danger-content">
          <div class="danger-icon-box">
            <AlertTriangle :size="24" />
          </div>
          <div class="danger-text">
            <h4 class="danger-title">注销账户</h4>
            <p class="danger-desc">
              注销账户是一个不可逆的操作。一旦您注销账户，您的所有个人数据、历史记录和关联信息将被永久删除，无法恢复。请谨慎操作。
            </p>
            <div class="danger-actions">
              <button class="btn-delete" @click="handleDeleteAccount">
                <Trash2 :size="16" />
                确认注销
              </button>
              <button class="btn-freeze" @click="handleFreezeAccount">
                暂时冻结账户
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Data Card -->
      <div class="export-card">
        <div class="export-content">
          <div>
            <h4 class="export-title">导出个人数据</h4>
            <p class="export-desc">下载您账户的所有关联数据副本</p>
          </div>
          <ActionButton @click="handleExportData">申请导出</ActionButton>
        </div>
      </div>

    </div>
  </SettingsCard>
</template>

<script setup>
import SettingsCard from './SettingsCard.vue';
import ActionButton from './ui/ActionButton.vue';
import { AlertTriangle, Trash2 } from 'lucide-vue-next';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { userAPI } from '@/api/user';

const userStore = useUserStore();

const handleDeleteAccount = async () => {
  try {
    await ElMessageBox.confirm('账户注销后所有数据将无法恢复，您确定要注销账户吗？', '确认注销', {
      confirmButtonText: '我确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await userAPI.deleteAccount();
    ElMessage.success('账户已成功注销');
    await userStore.logout();
    window.location.href = '/login'; // 硬跳转清空所有内存状态
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消注销操作');
    } else {
      console.error('Failed to delete account:', error);
      ElMessage.error(error.message || '账户注销失败，请稍后再试');
    }
  }
};

const handleFreezeAccount = () => {
  ElMessage.info('账户冻结功能尚未实现');
};

const handleExportData = () => {
  ElMessage.info('数据导出功能尚未实现');
};
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.account-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Danger Card */
.danger-card {
  background-color: rgba(254, 242, 242, 0.5); /* red-50/50 */
  border: 1px solid var(--color-red-100);
  border-radius: 1rem;
  padding: 1.5rem;
  @include transition-all;

  &:hover {
    box-shadow: var(--shadow-sm);
  }
}

.danger-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.danger-icon-box {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background-color: var(--color-red-100);
  color: var(--color-red-500);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.danger-text {
  flex: 1;
}

.danger-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-slate-800);
  margin: 0;
}

.danger-desc {
  font-size: 0.875rem;
  color: var(--color-slate-600);
  margin-top: 0.5rem;
  line-height: 1.625;
}

.danger-actions {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-delete {
  padding: 0.625rem 1.25rem;
  background-color: var(--color-red-500);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.75rem;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
  @include transition-all;

  &:hover {
    background-color: var(--color-red-600);
  }

  &:active {
    transform: scale(0.95);
  }
}

.btn-freeze {
  padding: 0.625rem 1.25rem;
  background-color: white;
  border: 1px solid var(--color-slate-200);
  color: var(--color-slate-600);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.75rem;
  cursor: pointer;
  @include transition-all;

  &:hover {
    background-color: var(--color-slate-50);
    color: var(--color-slate-800);
  }
}

/* Export Card */
.export-card {
  padding: 1.5rem;
  background-color: var(--color-slate-50);
  border: 1px solid var(--color-slate-100);
  border-radius: 1rem;
  @include transition-all;

  &:hover {
    border-color: var(--color-blue-200);
    box-shadow: var(--shadow-sm);
  }
}

.export-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.export-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-slate-800);
  margin: 0;
}

.export-desc {
  font-size: 0.75rem;
  color: var(--color-slate-500);
  margin-top: 0.25rem;
}
</style>
