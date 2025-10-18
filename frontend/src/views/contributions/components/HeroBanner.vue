<template>
  <div class="hero-banner">
    <el-carousel
      :interval="5000"
      arrow="always"
      indicator-position="outside"
      height="320px"
      class="banner-carousel"
    >
      <el-carousel-item v-for="item in bannerItems" :key="item.id">
        <div class="banner-item" :style="{ background: item.background }" @click="navigate(item.link)">
          <div class="banner-overlay"></div>
          <div class="banner-content">
            <div class="banner-left">
              <div class="banner-tag">
                <el-tag :type="item.tagType" effect="dark" size="large">
                  {{ item.tag }}
                </el-tag>
              </div>
              <h2 class="banner-title">{{ item.title }}</h2>
              <p class="banner-description">{{ item.description }}</p>
              <div class="banner-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ item.author }}
                </span>
                <span class="meta-item">
                  <el-icon><View /></el-icon>
                  {{ formatNumber(item.views) }}
                </span>
                <span class="meta-item">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ item.comments }}
                </span>
                <span class="meta-item">
                  <el-icon><Star /></el-icon>
                  {{ item.likes }}
                </span>
              </div>
              <el-button type="primary" size="large" class="banner-btn">
                立即查看
                <el-icon class="ml-2"><ArrowRight /></el-icon>
              </el-button>
            </div>
            <div class="banner-right">
              <div class="banner-image">
                <el-icon :size="120" class="banner-icon">
                  <component :is="item.icon" />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup>
import { ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import {
  User, View, ChatDotRound, Star, ArrowRight,
  Trophy, Promotion, Lightning, MagicStick, Medal
} from '@element-plus/icons-vue'

const router = useRouter()

const bannerItems = ref([
  {
    id: 1,
    title: '手写实现 Promise.all 和 Promise.race',
    description: '深入理解 Promise 并发控制机制，掌握异步编程核心技能，提升前端开发能力',
    author: '算法大师',
    views: 15234,
    comments: 189,
    likes: 567,
    tag: '热门推荐',
    tagType: 'danger',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: markRaw(Trophy),
    link: '/contributions/question/1'
  },
  {
    id: 2,
    title: 'Vue3 Composition API 实战指南',
    description: '从零到一掌握 Vue3 新特性，学习响应式原理和最佳实践，打造高性能应用',
    author: 'Vue专家',
    views: 12890,
    comments: 156,
    likes: 489,
    tag: '精选课程',
    tagType: 'warning',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: markRaw(Promotion),
    link: '/contributions/question/2'
  },
  {
    id: 3,
    title: '前端性能优化终极指南 2024',
    description: '全方位性能优化策略，包含打包优化、渲染优化、网络优化等核心技术点',
    author: '性能优化专家',
    views: 18765,
    comments: 234,
    likes: 678,
    tag: '新品上线',
    tagType: 'success',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: markRaw(Lightning),
    link: '/contributions/question/3'
  },
  {
    id: 4,
    title: 'React Hooks 深度解析与实践',
    description: '深入剖析 Hooks 原理和使用场景，学习自定义 Hooks 开发，提升 React 技能',
    author: 'React狂热者',
    views: 14567,
    comments: 178,
    likes: 534,
    tag: '编辑推荐',
    tagType: 'primary',
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    icon: markRaw(MagicStick),
    link: '/contributions/question/4'
  },
  {
    id: 5,
    title: '算法面试高频题精讲',
    description: 'BAT 大厂算法面试真题详解，涵盖数组、链表、树、图等核心数据结构',
    author: '面试官',
    views: 23456,
    comments: 312,
    likes: 891,
    tag: '限时优惠',
    tagType: 'danger',
    background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    icon: markRaw(Medal),
    link: '/contributions/question/5'
  }
])

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num
}

const navigate = (link) => {
  router.push(link)
}
</script>

<style scoped>
.hero-banner {
  margin-bottom: 30px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.banner-carousel {
  border-radius: 12px;
}

.banner-item {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}

.banner-item:hover {
  transform: scale(1.02);
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.banner-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 60px;
  color: white;
}

.banner-left {
  flex: 1;
  max-width: 60%;
}

.banner-tag {
  margin-bottom: 20px;
  animation: fadeInDown 0.8s ease-out;
}

.banner-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 15px 0;
  line-height: 1.3;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  animation: fadeInLeft 0.8s ease-out 0.2s backwards;
}

.banner-description {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 20px 0;
  opacity: 0.95;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  animation: fadeInLeft 0.8s ease-out 0.4s backwards;
}

.banner-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  font-size: 14px;
  animation: fadeInLeft 0.8s ease-out 0.6s backwards;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.9;
}

.banner-btn {
  border-radius: 24px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
  animation: fadeInUp 0.8s ease-out 0.8s backwards;
}

.banner-btn:hover {
  background: white;
  color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
}

.banner-right {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeInRight 0.8s ease-out 0.4s backwards;
}

.banner-image {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.3);
  animation: float 3s ease-in-out infinite;
}

.banner-icon {
  color: white;
  opacity: 0.9;
}

.ml-2 {
  margin-left: 8px;
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 轮播指示器样式 */
.banner-carousel :deep(.el-carousel__indicator) {
  .el-carousel__button {
    width: 30px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.5);
  }
}

.banner-carousel :deep(.el-carousel__indicator.is-active) {
  .el-carousel__button {
    background: white;
    width: 40px;
  }
}

/* 响应式 */
@media (max-width: 1024px) {
  .banner-content {
    padding: 30px 40px;
  }

  .banner-title {
    font-size: 26px;
  }

  .banner-description {
    font-size: 14px;
  }

  .banner-right {
    display: none;
  }

  .banner-left {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .hero-banner {
    margin-bottom: 20px;
  }

  .banner-carousel {
    height: 280px !important;
  }

  .banner-content {
    padding: 20px 30px;
  }

  .banner-title {
    font-size: 22px;
  }

  .banner-description {
    font-size: 13px;
    margin-bottom: 15px;
  }

  .banner-meta {
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
  }

  .banner-btn {
    padding: 10px 24px;
    font-size: 14px;
  }
}
</style>


