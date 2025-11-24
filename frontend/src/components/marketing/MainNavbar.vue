<template>
  <header :class="['main-navbar', 'landing-sticky-nav', { 'is-condensed': isCondensed }]">
    <div class="navbar-container">
      <button class="brand" type="button" @click="goHome">
        <span class="brand-mark">ai</span>
        <span class="brand-name">面试官</span>
      </button>

      <nav class="nav-links" v-if="!isMobile">
        <button
          v-for="item in menuItems"
          :key="item.hash"
          class="nav-link"
          type="button"
          @click="scrollToSection(item.hash)"
        >
          {{ item.label }}
        </button>
      </nav>

      <div class="nav-actions" v-if="!isMobile">
        <template v-if="!isAuthenticated">
          <el-button text type="primary" @click="router.push('/login')">
            登录
          </el-button>
          <el-button type="primary" round class="landing-button-glow" @click="goToRegister">
            免费注册
          </el-button>
        </template>
        <template v-else>
          <el-button type="primary" round class="landing-button-glow" @click="router.push('/dashboard')">
            进入控制台
          </el-button>
        </template>
      </div>

      <el-button
        class="mobile-menu-button"
        circle
        :icon="showMobileMenu ? Close : Menu"
        @click="toggleMobile"
        v-if="isMobile"
      />
    </div>

    <transition name="fade">
      <div v-if="isMobile && showMobileMenu" class="mobile-menu-panel">
        <nav>
          <button
            v-for="item in menuItems"
            :key="item.hash"
            class="mobile-nav-link"
            type="button"
            @click="handleMobileNavigate(item.hash)"
          >
            {{ item.label }}
          </button>
        </nav>
        <div class="mobile-actions">
          <template v-if="!isAuthenticated">
            <el-button type="primary" @click="handleMobileAction('/register', true)">免费注册</el-button>
            <el-button text type="primary" @click="handleMobileAction('/login')">登录</el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="handleMobileAction('/dashboard')">进入控制台</el-button>
          </template>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, Close } from '@element-plus/icons-vue'

const props = defineProps({
  menuItems: {
    type: Array,
    default: () => []
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cta-click'])

const router = useRouter()
const isCondensed = ref(false)
const isMobile = ref(false)
const showMobileMenu = ref(false)

const { menuItems, isAuthenticated } = toRefs(props)

const NAV_HEIGHT = 72

const evaluateMobile = () => {
  isMobile.value = window.innerWidth <= 990
  if (!isMobile.value) {
    showMobileMenu.value = false
  }
}

const handleScroll = () => {
  isCondensed.value = window.scrollY > 24
}

const goHome = () => {
  router.push('/')
}

const scrollToSection = (hash) => {
  if (!hash) return
  const selector = hash.startsWith('#') ? hash : `#${hash}`
  const target = document.querySelector(selector)
  if (!target) return
  const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT
  window.scrollTo({ top, behavior: 'smooth' })
}

const handleMobileNavigate = (hash) => {
  scrollToSection(hash)
  showMobileMenu.value = false
}

const handleMobileAction = (path, emitCta = false) => {
  showMobileMenu.value = false
  if (emitCta) {
    emit('cta-click')
  }
  router.push(path)
}

const toggleMobile = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const goToRegister = () => {
  emit('cta-click')
  router.push('/register')
}

const handleResize = () => {
  evaluateMobile()
}

onMounted(() => {
  evaluateMobile()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.main-navbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: var(--landing-nav-height, 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 33, 94, 0.74);
  backdrop-filter: blur(18px);
}

.navbar-container {
  width: min(1200px, 94vw);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  color: #fff;
}

.brand {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  background: none;
  border: none;
  color: inherit;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}

.brand-mark {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 16px;
  text-transform: uppercase;
}

.brand-name {
  letter-spacing: 2px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav-link {
  background: none;
  border: none;
  color: inherit;
  font-size: 15px;
  cursor: pointer;
  padding-bottom: 6px;
  position: relative;
}

.nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.8);
  transform: scaleX(0);
  transition: transform 0.3s ease;
  transform-origin: center;
}

.nav-link:hover::after {
  transform: scaleX(1);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-menu-button {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.mobile-menu-panel {
  position: absolute;
  inset: var(--landing-nav-height, 72px) 0 auto;
  background: rgba(12, 28, 84, 0.95);
  backdrop-filter: blur(18px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #fff;
}

.mobile-nav-link {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
