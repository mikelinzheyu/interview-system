<template>
  <SettingsCard>
    <div class="security-stack">
      
      <!-- Password -->
      <div class="security-row">
        <SectionLabel 
          :icon="Lock" 
          title="登录密码" 
          subtitle="定期修改密码可以保护账号安全，建议每3个月修改一次" 
        />
        <div class="action-wrapper">
          <ActionButton @click="handleChangePassword">修改密码</ActionButton>
        </div>
      </div>

      <!-- Phone -->
      <div class="security-row">
        <SectionLabel 
          :icon="Smartphone" 
          title="手机绑定" 
          :subtitle="securityInfo.phoneVerified ? `已绑定：${securityInfo.phoneNumber}` : '未绑定手机'" 
        />
        <div class="action-wrapper">
          <ActionButton @click="handleBindPhone">
            {{ securityInfo.phoneVerified ? '更换手机' : '立即绑定' }}
          </ActionButton>
        </div>
      </div>

      <!-- Email -->
      <div class="security-row">
        <SectionLabel 
          :icon="Mail" 
          title="验证邮箱" 
          :subtitle="securityInfo.emailVerified ? `已绑定：${securityInfo.email}` : '未绑定邮箱'" 
        />
        <div class="action-wrapper">
          <ActionButton variant="primary" @click="handleBindEmail">
            {{ securityInfo.emailVerified ? '更换邮箱' : '立即绑定' }}
          </ActionButton>
        </div>
      </div>

      <!-- 2FA -->
      <div class="security-row">
        <SectionLabel 
          :icon="Shield" 
          title="两步验证" 
          subtitle="在登录时要求输入额外的验证码，提高账号安全性" 
        />
        <div class="action-wrapper">
          <CustomToggle 
            v-model="twoFactorEnabled" 
            :label="twoFactorEnabled ? '已开启' : '未开启'" 
          />
        </div>
      </div>

      <!-- Devices -->
      <div class="security-row">
        <SectionLabel 
          :icon="Smartphone" 
          title="登录设备管理" 
          subtitle="查看和管理最近登录过您账户的设备" 
        />
        <div class="action-wrapper">
          <ActionButton @click="handleManageDevices">管理设备</ActionButton>
        </div>
      </div>

    </div>
  </SettingsCard>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import SettingsCard from './SettingsCard.vue';
import SectionLabel from './ui/SectionLabel.vue';
import ActionButton from './ui/ActionButton.vue';
import CustomToggle from './ui/CustomToggle.vue';
import { Lock, Smartphone, Mail, Shield } from 'lucide-vue-next';
import { useUserStore } from '@/stores/user';
import { userAPI } from '@/api/user';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const { security } = storeToRefs(settingsStore);

const securityInfo = reactive({
  phoneNumber: '',
  phoneVerified: false,
  email: '',
  emailVerified: false,
  isTwoFactorEnabled: false,
  lastPasswordChange: null,
  loginDevices: []
});

const twoFactorEnabled = ref(false);

const syncSecurity = (data) => {
  if (!data) return;
  Object.assign(securityInfo, {
    phoneNumber: data.phoneNumber || '',
    phoneVerified: !!data.phoneVerified,
    email: data.email || '',
    emailVerified: !!data.emailVerified,
    isTwoFactorEnabled: !!data.isTwoFactorEnabled,
    lastPasswordChange: data.lastPasswordChange || null,
    loginDevices: data.loginDevices || []
  });
  twoFactorEnabled.value = securityInfo.isTwoFactorEnabled;
};

const fetchSecurityInfo = async () => {
  try {
    await settingsStore.loadSecurity();
    syncSecurity(security.value);
  } catch (error) {
    console.error('Failed to fetch security info:', error);
    ElMessage.error('获取安全信息失败');
  }
};

onMounted(() => {
  fetchSecurityInfo();
});

// 移除自动同步的watch，避免循环触发
// watch(security, (val) => syncSecurity(val));

watch(twoFactorEnabled, async (newVal, oldVal) => {
  // 当当前状态相同时不发请求
  if (newVal === securityInfo.isTwoFactorEnabled) return;

  try {
    await settingsStore.toggleTwoFactor(newVal);
    // 保持全局/本地状态一致
    syncSecurity(security.value);
    ElMessage.success(newVal ? '两步验证已开启' : '两步验证已关闭');
  } catch (error) {
    console.error('Failed to toggle 2FA:', error);
    ElMessage.error('操作失败，请稍后再试');
    // 失败回退
    twoFactorEnabled.value = oldVal;
  }
});

const handleChangePassword = async () => {
  try {
    const { value: oldPassword } = await ElMessageBox.prompt('请输入旧密码', '修改密码', {
      confirmButtonText: '下一步',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPattern: /.+/,
      inputErrorMessage: '旧密码不能为空'
    });
    if (oldPassword === null) return;

    const { value: newPassword } = await ElMessageBox.prompt('请输入新密码', '修改密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,}$/,
      inputErrorMessage: '密码需至少8位，包含大小写字母和数字'
    });
    if (newPassword === null) return;

    if (oldPassword === newPassword) {
      ElMessage.warning('新旧密码不能相同');
      return;
    }

    await userAPI.changePassword({ oldPassword, newPassword });
    ElMessage.success('密码修改成功');
  } catch (error) {
    if (error === 'cancel') return;
    console.error('Failed to change password:', error);
    ElMessage.error(error.message || '密码修改失败');
  }
};

const handleBindPhone = async () => {
  try {
    const { value: phone } = await ElMessageBox.prompt('请输入手机号', '绑定手机', {
      confirmButtonText: '发送验证码',
      cancelButtonText: '取消',
      inputPattern: /^1[3-9]\d{9}$/,
      inputErrorMessage: '请输入有效的手机号'
    });
    if (phone === null) return;

    await userAPI.sendPhoneCode(phone);
    ElMessage.success('验证码已发送');

    const { value: code } = await ElMessageBox.prompt('请输入验证码', '绑定手机', {
      confirmButtonText: '绑定',
      cancelButtonText: '取消',
      inputPattern: /^\d{6}$/,
      inputErrorMessage: '请输入6位数字验证码'
    });
    if (code === null) return;

    await userAPI.bindPhone({ phone, code });
    ElMessage.success('手机绑定成功');
    fetchSecurityInfo();
  } catch (error) {
    if (error === 'cancel') return;
    console.error('Failed to bind phone:', error);
    ElMessage.error(error.message || '手机绑定失败');
  }
};

const handleBindEmail = async () => {
  try {
    const { value: email } = await ElMessageBox.prompt('请输入邮箱地址', '绑定邮箱', {
      confirmButtonText: '发送验证码',
      cancelButtonText: '取消',
      inputPattern: /^\w+([-+.]*\w+)*@\w+([-.]*\w+)*\.\w+([-.]*\w+)*$/, 
      inputErrorMessage: '请输入有效的邮箱地址'
    });
    if (email === null) return;

    await userAPI.sendEmailCode(email);
    ElMessage.success('验证码已发送');

    const { value: code } = await ElMessageBox.prompt('请输入验证码', '绑定邮箱', {
      confirmButtonText: '绑定',
      cancelButtonText: '取消',
      inputPattern: /^\d{6}$/,
      inputErrorMessage: '请输入6位数字验证码'
    });
    if (code === null) return;

    await userAPI.bindEmail({ email, code });
    ElMessage.success('邮箱绑定成功');
    fetchSecurityInfo();
  } catch (error) {
    if (error === 'cancel') return;
    console.error('Failed to bind email:', error);
    ElMessage.error(error.message || '邮箱绑定失败');
  }
};

const handleManageDevices = async () => {
  ElMessage.info('设备管理功能待完善，当前仅为演示');
  try {
    const response = await userAPI.getLoginDevices();
    if (response.code === 200 && response.data) {
      ElMessageBox.alert(
        `您已登录的设备：<br>${response.data.map(d => `- ${d.deviceName} (${d.os})`).join('<br>')}`,
        '登录设备管理',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定'
        }
      );
    }
  } catch (error) {
    console.error('Failed to get login devices:', error);
    ElMessage.error('获取登录设备失败');
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.security-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* space-y-6 */
}

.security-row {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid var(--color-slate-100);
  background-color: rgba(248, 250, 252, 0.3); /* slate-50/30 */
  @include transition-all;

  &:hover {
    border-color: var(--color-blue-200);
    box-shadow: var(--shadow-sm);
  }

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.action-wrapper {
  margin-top: 1rem;
  padding-left: 3.5rem; /* pl-14 to align with text */
  
  @media (min-width: 640px) {
    margin-top: 0;
    padding-left: 0;
  }
}
</style>
