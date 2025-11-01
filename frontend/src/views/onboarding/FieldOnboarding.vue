<template>
  <div class="onboarding-page">
    <div class="background-blur" aria-hidden="true" />
    <header class="page-header">
      <span class="page-eyebrow">Smart Onboarding</span>
      <h1>智能引导选领域</h1>
      <p>用 3 个问题快速定位你的学习方向</p>
    </header>

    <el-card class="onboarding-card" shadow="hover">
      <el-form label-position="top" :model="form" class="onboarding-form">
        <el-form-item label="你更偏好哪类学科？">
          <el-radio-group v-model="form.category">
            <el-radio-button label="理工">理工</el-radio-button>
            <el-radio-button label="商科">商科</el-radio-button>
            <el-radio-button label="医学">医学</el-radio-button>
            <el-radio-button label="法学">法学</el-radio-button>
            <el-radio-button label="农学">农学</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="你目前的目标更倾向于？">
          <el-select v-model="form.goal" placeholder="请选择">
            <el-option label="求职/实习" value="job" />
            <el-option label="考研/升学" value="grad" />
            <el-option label="转型/拓展" value="switch" />
          </el-select>
        </el-form-item>

        <el-form-item label="你更喜欢哪种学习方式？">
          <el-checkbox-group v-model="form.style">
            <el-checkbox label="动手实践" />
            <el-checkbox label="系统理论" />
            <el-checkbox label="项目驱动" />
          </el-checkbox-group>
        </el-form-item>

        <div class="actions">
          <el-button type="primary" size="large" @click="handleStart">生成推荐</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAcademicStore } from '@/stores/academic'

const router = useRouter()
const academic = useAcademicStore()

const form = reactive({ category: '', goal: '', style: [] })

function handleStart() {
  // simple heuristic to prime search query
  const map = {
    理工: '计算机',
    商科: '金融',
    医学: '医学',
    法学: '法学',
    农学: '农学'
  }
  academic.query = map[form.category] || ''
  router.push({ name: 'DomainExplorer' })
}
</script>

<style scoped>
.onboarding-page { position: relative; padding: 48px 24px 72px; }
.background-blur { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 20% 15%, rgba(59, 130, 246, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.12), transparent 60%); filter: blur(40px); opacity: .7; z-index: 0; }
.page-header { position: relative; z-index: 1; text-align: center; margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
.page-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: .32em; text-transform: uppercase; color: #3b82f6; }
.page-header h1 { margin: 0; font-size: clamp(28px, 5vw, 40px); font-weight: 800; color: #0f172a; }
.page-header p { margin: 0; color: #475569; font-size: 16px; }
.onboarding-card { position: relative; z-index: 1; max-width: 880px; margin: 0 auto; border-radius: 18px; }
.onboarding-form { display: flex; flex-direction: column; gap: 16px; }
.actions { display: flex; justify-content: center; margin-top: 8px; }
@media (max-width: 768px) { .onboarding-page { padding: 32px 16px 48px; } }
</style>

