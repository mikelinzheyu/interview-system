<template>
  <div class="landing-page">
    <TopNoticeBar
      :message="noticeBar.message"
      :emphasis="noticeBar.emphasis"
      :cta="noticeBar.cta"
    />

    <MainNavbar
      :menu-items="navItems"
      :is-authenticated="isAuthenticated"
      @cta-click="handlePrimaryCta"
    />

    <main>
      <HeroSection
        id="hero"
        :content="heroContent"
        :is-authenticated="isAuthenticated"
      />

      <FeatureStrip id="product" :section="featureSection" />
      <ProcessShowcase id="solutions" :flow="processFlow" />
      <PricingSection id="pricing" :section="pricingSection" />
      <PartnerSection id="partners" :section="partnerSection" />
      <TestimonialBanner id="about" :content="testimonialBanner" />
      <FooterCTA id="cta" :content="footerCta" />
    </main>

    <ContactRail :options="contactOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TopNoticeBar from '@/components/marketing/TopNoticeBar.vue'
import MainNavbar from '@/components/marketing/MainNavbar.vue'
import HeroSection from '@/components/marketing/HeroSection.vue'
import FeatureStrip from '@/components/marketing/FeatureStrip.vue'
import ProcessShowcase from '@/components/marketing/ProcessShowcase.vue'
import PricingSection from '@/components/marketing/PricingSection.vue'
import PartnerSection from '@/components/marketing/PartnerSection.vue'
import TestimonialBanner from '@/components/marketing/TestimonialBanner.vue'
import FooterCTA from '@/components/marketing/FooterCTA.vue'
import ContactRail from '@/components/marketing/ContactRail.vue'
import {
  noticeBar,
  navItems,
  heroContent,
  featureSection,
  processFlow,
  pricingSection,
  partnerSection,
  testimonialBanner,
  footerCta,
  contactOptions
} from '@/data/marketingContent'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isAuthenticated = computed(() => userStore.isAuthenticated)

const handlePrimaryCta = () => {
  if (isAuthenticated.value) {
    window?.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<style scoped>
.landing-page {
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--chat-text-primary);
  background: #f2f6ff;
}

main {
  display: flex;
  flex-direction: column;
  gap: 120px;
}

@media (max-width: 1024px) {
  main {
    gap: 72px;
  }
}
</style>

<style>
@import "@/styles/modules/marketing.css";
</style>

