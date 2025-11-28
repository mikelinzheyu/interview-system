<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="header-title">
          <el-icon><Setting /></el-icon>
          <span>个人设置</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 账户信息 -->
        <el-tab-pane label="账户信息" name="profile">
          <el-form :model="profileForm" label-width="100px" class="settings-form">
            <el-form-item label="头像">
              <div class="avatar-upload">
                <el-avatar :size="100" :src="profileForm.avatar" />
                <el-upload
                  class="upload-btn"
                  action="#"
                  :show-file-list="false"
                  :before-upload="handleAvatarUpload"
                  accept="image/*"
                >
                  <el-button type="primary" size="small">更换头像</el-button>
                </el-upload>
              </div>
            </el-form-item>

            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>

            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
            </el-form-item>

            <el-form-item label="性别">
              <el-radio-group v-model="profileForm.gender">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
                <el-radio label="other">保密</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="生日">
              <el-date-picker
                v-model="profileForm.birthday"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>

            <el-form-item label="个性签名">
              <el-input
                v-model="profileForm.signature"
                type="textarea"
                :rows="3"
                placeholder="写点什么介绍一下自己吧"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading.profile" @click="saveProfile">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 安全设置 -->
        <el-tab-pane label="安全设置" name="security">
          <el-form label-width="120px" class="settings-form">
            <!-- 修改密码 -->
            <el-form-item label="修改密码">
              <el-button @click="showPasswordDialog = true">修改密码</el-button>
            </el-form-item>

            <!-- 绑定手机 -->
            <el-form-item label="手机号">
              <div class="bind-info">
                <span v-if="securityForm.phone">{{ maskPhone(securityForm.phone) }}</span>
                <span v-else class="not-bind">未绑定</span>
                <el-button link type="primary" @click="showBindPhoneDialog">
                  {{ securityForm.phone ? '更换' : '绑定' }}
                </el-button>
              </div>
            </el-form-item>

            <!-- 绑定邮箱 -->
            <el-form-item label="邮箱">
              <div class="bind-info">
                <span v-if="securityForm.email">{{ maskEmail(securityForm.email) }}</span>
                <span v-else class="not-bind">未绑定</span>
                <el-button link type="primary" @click="showBindEmailDialog">
                  {{ securityForm.email ? '更换' : '绑定' }}
                </el-button>
              </div>
            </el-form-item>

            <!-- 两步验证 -->
            <el-form-item label="两步验证">
              <div class="bind-info">
                <el-tag :type="securityForm.twoFactorEnabled ? 'success' : 'info'">
                  {{ securityForm.twoFactorEnabled ? '已开启' : '未开启' }}
                </el-tag>
                <el-button
                  link
                  type="primary"
                  @click="toggle2FA"
                >
                  {{ securityForm.twoFactorEnabled ? '关闭' : '开启' }}
                </el-button>
              </div>
            </el-form-item>

            <!-- 登录设备 -->
            <el-form-item label="登录设备">
              <el-button @click="showDevicesDialog = true">管理登录设备</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 隐私设置 -->
        <el-tab-pane label="隐私设置" name="privacy">
          <el-form :model="privacyForm" label-width="150px" class="settings-form">
            <el-form-item label="个人资料可见性">
              <el-select v-model="privacyForm.profileVisibility">
                <el-option label="所有人可见" value="public" />
                <el-option label="仅好友可见" value="friends" />
                <el-option label="仅自己可见" value="private" />
              </el-select>
            </el-form-item>

            <el-form-item label="在线状态">
              <el-switch v-model="privacyForm.showOnlineStatus" />
              <span class="form-tip">是否显示在线状态</span>
            </el-form-item>

            <el-form-item label="允许陌生人消息">
              <el-switch v-model="privacyForm.allowStrangerMessage" />
            </el-form-item>

            <el-form-item label="位置信息共享">
              <el-switch v-model="privacyForm.shareLocation" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading.privacy" @click="savePrivacy">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notification">
          <el-form :model="notificationForm" label-width="150px" class="settings-form">
            <el-form-item label="系统通知">
              <el-switch v-model="notificationForm.systemNotification" />
            </el-form-item>

            <el-form-item label="消息通知">
              <el-switch v-model="notificationForm.messageNotification" />
            </el-form-item>

            <el-form-item label="评论通知">
              <el-switch v-model="notificationForm.commentNotification" />
            </el-form-item>

            <el-form-item label="邮件通知">
              <el-switch v-model="notificationForm.emailNotification" />
            </el-form-item>

            <el-form-item label="短信通知">
              <el-switch v-model="notificationForm.smsNotification" />
            </el-form-item>

            <el-form-item label="声音提示">
              <el-switch v-model="notificationForm.soundEnabled" />
            </el-form-item>

            <el-form-item label="震动提示">
              <el-switch v-model="notificationForm.vibrationEnabled" />
            </el-form-item>

            <el-form-item label="免打扰模式">
              <div class="dnd-setting">
                <el-switch v-model="notificationForm.dndEnabled" />
                <el-time-picker
                  v-if="notificationForm.dndEnabled"
                  v-model="notificationForm.dndStartTime"
                  placeholder="开始时间"
                  format="HH:mm"
                  value-format="HH:mm"
                />
                <span v-if="notificationForm.dndEnabled">至</span>
                <el-time-picker
                  v-if="notificationForm.dndEnabled"
                  v-model="notificationForm.dndEndTime"
                  placeholder="结束时间"
                  format="HH:mm"
                  value-format="HH:mm"
                />
              </div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading.notification" @click="saveNotification">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 界面设置 -->
        <el-tab-pane label="界面设置" name="preferences">
          <el-form :model="preferencesForm" label-width="120px" class="settings-form">
            <el-form-item label="主题模式">
              <el-radio-group v-model="preferencesForm.theme" @change="handleThemeChange">
                <el-radio label="light">浅色</el-radio>
                <el-radio label="dark">深色</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="主题色">
              <el-color-picker v-model="preferencesForm.primaryColor" />
            </el-form-item>

            <el-form-item label="字体大小">
              <el-radio-group v-model="preferencesForm.fontSize">
                <el-radio label="small">小</el-radio>
                <el-radio label="medium">中</el-radio>
                <el-radio label="large">大</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="语言">
              <el-select v-model="preferencesForm.language">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading.preferences" @click="savePreferences">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 账户管理 -->
        <el-tab-pane label="账户管理" name="account">
          <el-form label-width="120px" class="settings-form">
            <el-form-item label="注销账户">
              <div class="danger-zone">
                <p class="warning-text">
                  <el-icon><WarningFilled /></el-icon>
                  注销账户后，您的所有数据将被永久删除，且无法恢复
                </p>
                <el-button type="danger" @click="showDeleteAccountDialog = true">
                  注销账户
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="500px">
      <el-alert
        title="安全提示"
        type="info"
        description="修改密码需要验证您的身份，我们将向您绑定的手机号发送验证码"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="passwordForm.code" placeholder="请输入验证码" />
            <el-button
              :disabled="passwordCodeCountdown > 0 || !passwordForm.oldPassword"
              @click="sendPasswordCode"
            >
              {{ passwordCodeCountdown > 0 ? `${passwordCodeCountdown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
          <div v-if="securityForm.phone" style="font-size: 12px; color: #909399; margin-top: 5px;">
            验证码将发送至 {{ maskPhone(securityForm.phone) }}
          </div>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading.password" @click="changePassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 绑定手机对话框 -->
    <el-dialog v-model="showPhoneDialog" title="绑定手机号" width="500px">
      <el-form ref="phoneFormRef" :model="phoneForm" label-width="100px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="phoneForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="phoneForm.code" placeholder="请输入验证码" />
            <el-button
              :disabled="phoneCodeCountdown > 0"
              @click="sendPhoneCode"
            >
              {{ phoneCodeCountdown > 0 ? `${phoneCodeCountdown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPhoneDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading.phone" @click="bindPhone">
          确认绑定
        </el-button>
      </template>
    </el-dialog>

    <!-- 绑定邮箱对话框 -->
    <el-dialog v-model="showEmailDialog" title="绑定邮箱" width="500px">
      <el-form ref="emailFormRef" :model="emailForm" label-width="100px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="emailForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="emailForm.code" placeholder="请输入验证码" />
            <el-button
              :disabled="emailCodeCountdown > 0"
              @click="sendEmailCode"
            >
              {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEmailDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading.email" @click="bindEmail">
          确认绑定
        </el-button>
      </template>
    </el-dialog>

    <!-- 登录设备管理对话框 -->
    <el-dialog v-model="showDevicesDialog" title="登录设备管理" width="700px">
      <el-table :data="devices" style="width: 100%">
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="location" label="登录地点" />
        <el-table-column prop="lastLoginTime" label="最后登录时间" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="!row.isCurrent"
              link
              type="danger"
              @click="removeDevice(row.id)"
            >
              下线
            </el-button>
            <el-tag v-else type="success" size="small">当前设备</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 注销账户对话框 -->
    <el-dialog v-model="showDeleteAccountDialog" title="注销账户" width="500px">
      <el-alert
        title="警告"
        type="warning"
        description="注销账户是不可逆操作，您的所有数据将被永久删除"
        :closable="false"
        show-icon
      />
      <el-form :model="deleteAccountForm" style="margin-top: 20px;" label-width="100px">
        <el-form-item label="输入密码">
          <el-input
            v-model="deleteAccountForm.password"
            type="password"
            placeholder="请输入密码以确认"
          />
        </el-form-item>
        <el-form-item label="确认操作">
          <el-input
            v-model="deleteAccountForm.confirmText"
            placeholder="请输入'删除账户'以确认"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDeleteAccountDialog = false">取消</el-button>
        <el-button
          type="danger"
          :disabled="deleteAccountForm.confirmText !== '删除账户'"
          :loading="loading.delete"
          @click="deleteAccount"
        >
          确认注销
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, WarningFilled } from '@element-plus/icons-vue'
import { userAPI } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const activeTab = ref('profile')
const loading = reactive({
  profile: false,
  password: false,
  phone: false,
  email: false,
  privacy: false,
  notification: false,
  preferences: false,
  delete: false
})

// 个人资料表单
const profileForm = reactive({
  avatar: '',
  username: '',
  nickname: '',
  gender: 'other',
  birthday: '',
  signature: ''
})

// 安全设置表单
const securityForm = reactive({
  phone: '',
  email: '',
  twoFactorEnabled: false
})

// 隐私设置表单
const privacyForm = reactive({
  profileVisibility: 'public',
  showOnlineStatus: true,
  allowStrangerMessage: true,
  shareLocation: false
})

// 通知设置表单
const notificationForm = reactive({
  systemNotification: true,
  messageNotification: true,
  commentNotification: true,
  emailNotification: false,
  smsNotification: false,
  soundEnabled: true,
  vibrationEnabled: true,
  dndEnabled: false,
  dndStartTime: '22:00',
  dndEndTime: '08:00'
})

// 界面设置表单
const preferencesForm = reactive({
  theme: 'light',
  primaryColor: '#409EFF',
  fontSize: 'medium',
  language: 'zh-CN'
})

// 修改密码
const showPasswordDialog = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordCodeCountdown = ref(0)

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 绑定手机
const showPhoneDialog = ref(false)
const phoneFormRef = ref(null)
const phoneForm = reactive({
  phone: '',
  code: ''
})
const phoneCodeCountdown = ref(0)

// 绑定邮箱
const showEmailDialog = ref(false)
const emailFormRef = ref(null)
const emailForm = reactive({
  email: '',
  code: ''
})
const emailCodeCountdown = ref(0)

// 登录设备
const showDevicesDialog = ref(false)
const devices = ref([])

// 注销账户
const showDeleteAccountDialog = ref(false)
const deleteAccountForm = reactive({
  password: '',
  confirmText: ''
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const response = await userAPI.getUserInfo()
    if (response.code === 200) {
      const user = response.data
      Object.assign(profileForm, {
        avatar: user.avatar || '',
        username: user.username || '',
        nickname: user.nickname || '',
        gender: user.gender || 'other',
        birthday: user.birthday || '',
        signature: user.signature || ''
      })
      Object.assign(securityForm, {
        phone: user.phone || '',
        email: user.email || '',
        twoFactorEnabled: user.twoFactorEnabled || false
      })
      Object.assign(privacyForm, user.privacy || {})
      Object.assign(notificationForm, user.notification || {})
      Object.assign(preferencesForm, user.preferences || {})
    }
  } catch (error) {
    ElMessage.error('加载用户信息失败')
  }
}

// 头像上传
const handleAvatarUpload = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const response = await userAPI.uploadAvatar(formData)
    if (response.code === 200) {
      const url = response.data?.url || response.data?.avatar || profileForm.avatar
      profileForm.avatar = url
      await userStore.fetchUserInfo()
      ElMessage.success('头像上传成功')
    }
  } catch (error) {
    ElMessage.error('头像上传失败')
  }
  return false
}

// 保存个人资料
const saveProfile = async () => {
  loading.profile = true
  try {
    const response = await userAPI.updateProfile(profileForm)
    if (response.code === 200) {
      ElMessage.success('保存成功')
      await userStore.fetchUserInfo()
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    loading.profile = false
  }
}

// 发送修改密码验证码
const sendPasswordCode = async () => {
  if (!passwordForm.oldPassword) {
    ElMessage.warning('请先输入原密码')
    return
  }

  if (!securityForm.phone) {
    ElMessage.warning('请先绑定手机号')
    return
  }

  try {
    const response = await userAPI.sendPhoneCode(securityForm.phone)
    if (response.code === 200) {
      ElMessage.success('验证码已发送')
      passwordCodeCountdown.value = 60
      const timer = setInterval(() => {
        passwordCodeCountdown.value--
        if (passwordCodeCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('发送失败')
  }
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.password = true
    try {
      const response = await userAPI.changePassword({
        oldPassword: passwordForm.oldPassword,
        code: passwordForm.code,
        newPassword: passwordForm.newPassword
      })
      if (response.code === 200) {
        ElMessage.success('密码修改成功，请重新登录')
        showPasswordDialog.value = false
        // 重置表单
        passwordForm.oldPassword = ''
        passwordForm.code = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        setTimeout(() => {
          userStore.logout()
          router.push('/login')
        }, 1000)
      }
    } catch (error) {
      ElMessage.error(error.message || '密码修改失败')
    } finally {
      loading.password = false
    }
  })
}

// 发送手机验证码
const sendPhoneCode = async () => {
  if (!phoneForm.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  try {
    const response = await userAPI.sendPhoneCode(phoneForm.phone)
    if (response.code === 200) {
      ElMessage.success('验证码已发送')
      phoneCodeCountdown.value = 60
      const timer = setInterval(() => {
        phoneCodeCountdown.value--
        if (phoneCodeCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('发送失败')
  }
}

// 绑定手机
const bindPhone = async () => {
  loading.phone = true
  try {
    const response = await userAPI.bindPhone(phoneForm)
    if (response.code === 200) {
      ElMessage.success('绑定成功')
      securityForm.phone = phoneForm.phone
      showPhoneDialog.value = false
      phoneForm.phone = ''
      phoneForm.code = ''
    }
  } catch (error) {
    ElMessage.error('绑定失败')
  } finally {
    loading.phone = false
  }
}

// 发送邮箱验证码
const sendEmailCode = async () => {
  if (!emailForm.email) {
    ElMessage.warning('请输入邮箱')
    return
  }

  try {
    const response = await userAPI.sendEmailCode(emailForm.email)
    if (response.code === 200) {
      ElMessage.success('验证码已发送')
      emailCodeCountdown.value = 60
      const timer = setInterval(() => {
        emailCodeCountdown.value--
        if (emailCodeCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('发送失败')
  }
}

// 绑定邮箱
const bindEmail = async () => {
  loading.email = true
  try {
    const response = await userAPI.bindEmail(emailForm)
    if (response.code === 200) {
      ElMessage.success('绑定成功')
      securityForm.email = emailForm.email
      showEmailDialog.value = false
      emailForm.email = ''
      emailForm.code = ''
    }
  } catch (error) {
    ElMessage.error('绑定失败')
  } finally {
    loading.email = false
  }
}

// 显示绑定手机对话框
const showBindPhoneDialog = () => {
  phoneForm.phone = ''
  phoneForm.code = ''
  showPhoneDialog.value = true
}

// 显示绑定邮箱对话框
const showBindEmailDialog = () => {
  emailForm.email = ''
  emailForm.code = ''
  showEmailDialog.value = true
}

// 切换两步验证
const toggle2FA = async () => {
  try {
    const action = securityForm.twoFactorEnabled ? '关闭' : '开启'
    await ElMessageBox.confirm(`确定要${action}两步验证吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const api = securityForm.twoFactorEnabled
      ? userAPI.disableTwoFactor
      : userAPI.enableTwoFactor

    const response = await api({})
    if (response.code === 200) {
      securityForm.twoFactorEnabled = !securityForm.twoFactorEnabled
      ElMessage.success(`${action}成功`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 加载登录设备
const loadDevices = async () => {
  try {
    const response = await userAPI.getLoginDevices()
    if (response.code === 200) {
      devices.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载设备列表失败')
  }
}

// 移除设备
const removeDevice = async (deviceId) => {
  try {
    await ElMessageBox.confirm('确定要将该设备强制下线吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await userAPI.removeDevice(deviceId)
    if (response.code === 200) {
      ElMessage.success('设备已下线')
      await loadDevices()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 保存隐私设置
const savePrivacy = async () => {
  loading.privacy = true
  try {
    const response = await userAPI.updatePrivacy(privacyForm)
    if (response.code === 200) {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    loading.privacy = false
  }
}

// 保存通知设置
const saveNotification = async () => {
  loading.notification = true
  try {
    const response = await userAPI.updateNotification(notificationForm)
    if (response.code === 200) {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    loading.notification = false
  }
}

// 保存界面设置
const savePreferences = async () => {
  loading.preferences = true
  try {
    const response = await userAPI.updatePreferences(preferencesForm)
    if (response.code === 200) {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    loading.preferences = false
  }
}

// 主题切换
const handleThemeChange = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    // 跟随系统
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

// 注销账户
const deleteAccount = async () => {
  if (deleteAccountForm.confirmText !== '删除账户') {
    ElMessage.warning('请正确输入确认文本')
    return
  }

  loading.delete = true
  try {
    const response = await userAPI.deleteAccount({
      password: deleteAccountForm.password
    })
    if (response.code === 200) {
      ElMessage.success('账户已注销')
      showDeleteAccountDialog.value = false
      setTimeout(() => {
        userStore.logout()
        router.push('/login')
      }, 1000)
    }
  } catch (error) {
    ElMessage.error(error.message || '注销失败')
  } finally {
    loading.delete = false
  }
}

// 工具函数
const maskPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const maskEmail = (email) => {
  if (!email) return ''
  const [name, domain] = email.split('@')
  const maskedName = name.length > 2
    ? name[0] + '***' + name[name.length - 1]
    : name[0] + '***'
  return maskedName + '@' + domain
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped lang="scss">
.settings-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-card {
  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: bold;
  }
}

.settings-tabs {
  :deep(.el-tabs__content) {
    padding: 20px 0;
  }
}

.settings-form {
  max-width: 600px;

  :deep(.el-form-item__label) {
    text-align: left;
    justify-content: flex-start;
  }

  .avatar-upload {
    display: flex;
    align-items: center;
    gap: 20px;

    .upload-btn {
      margin-left: 0;
    }
  }

  .bind-info {
    display: flex;
    align-items: center;
    gap: 20px;

    .not-bind {
      color: #909399;
    }
  }

  .form-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
  }

  .dnd-setting {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .code-input {
    display: flex;
    gap: 10px;

    .el-input {
      flex: 1;
    }
  }

  .danger-zone {
    .warning-text {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #F56C6C;
      margin-bottom: 15px;

      .el-icon {
        font-size: 18px;
      }
    }
  }
}
</style>
