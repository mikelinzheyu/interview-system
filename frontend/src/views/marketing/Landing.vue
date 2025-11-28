<template>
  <div class="landing-page">
    <TopNoticeBar
      :message="noticeBarData.message"
      :emphasis="noticeBarData.emphasis"
      :cta="noticeBarData.cta"
    />

    <MainNavbar
      :menu-items="navItemsData"
      :is-authenticated="isAuthenticated"
      @cta-click="handlePrimaryCta"
    />

    <main>
      <HeroSection
        id="hero"
        :content="heroContentData"
        :is-authenticated="isAuthenticated"
      />

      <FeatureStrip id="product" :section="featureSectionData" />
      <PricingSection id="pricing" :section="pricingSectionData" />
      <TestimonialBanner id="stats" :content="testimonialBannerData" />
      <PartnerSection id="partners" :section="partnerSectionData" />
      <FooterCTA id="about" :content="footerCtaData" />
    </main>

    <ContactRail :options="contactOptionsData" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TopNoticeBar from '@/components/marketing/TopNoticeBar.vue'
import MainNavbar from '@/components/marketing/MainNavbar.vue'
import HeroSection from '@/components/marketing/HeroSection.vue'
import FeatureStrip from '@/components/marketing/FeatureStrip.vue'
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
  pricingSection,
  partnerSection,
  testimonialBanner,
  footerCta,
  contactOptions
} from '@/data/marketingContent'
import { useUserStore } from '@/stores/user'
import { deepDecode } from '@/utils/textDecode'

const noticeBarData = deepDecode(noticeBar)
const navItemsData = deepDecode(navItems)
const heroContentData = deepDecode(heroContent)
const featureSectionData = deepDecode(featureSection)
const pricingSectionData = deepDecode(pricingSection)
const partnerSectionData = deepDecode(partnerSection)
const testimonialBannerData = deepDecode(testimonialBanner)
const footerCtaData = deepDecode(footerCta)
const contactOptionsData = deepDecode(contactOptions)

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
