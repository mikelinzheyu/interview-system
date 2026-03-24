<template>
  <section class="faq-section">
    <div class="faq-container">
      <h2>常见问题</h2>
      <p class="faq-intro">了解更多关于 AI面试官的信息</p>

      <div class="faq-items">
        <div class="faq-item">
          <h3>AI面试官是什么？</h3>
          <p>AI面试官是一款基于大模型的模拟面试与求职面试训练平台。通过AI面试官，你可以进行真实场景化的模拟面试，获得专业的答案点评和面试复盘。</p>
        </div>

        <div class="faq-item">
          <h3>AI面试官能做什么？</h3>
          <p>AI面试官支持岗位定制模拟面试、多轮追问互动、答案点评与优化、面试复盘报告、能力评估与提升建议。帮助求职者高效准备真实面试。</p>
        </div>

        <div class="faq-item">
          <h3>AI面试官适合哪些人？</h3>
          <p>AI面试官适合校招求职者、社招候选人、转岗用户，以及想要提升面试表现和表达能力的人。无论是应届毕业生还是有经验的职场人士，都可以通过AI面试官进行模拟面试训练。</p>
        </div>

        <div class="faq-item">
          <h3>模拟面试和真实面试有什么区别？</h3>
          <p>AI面试官的模拟面试基于大模型技术，提供接近真实面试官的问答体验。通过多轮追问和答案点评，你可以在安全的环境中发现问题、优化表达，为真实面试做充分准备。</p>
        </div>

        <div class="faq-item">
          <h3>如何开始模拟面试？</h3>
          <p>注册后，选择目标岗位和行业，AI面试官会根据你的选择生成定制化的面试题目。开始回答问题，获得实时反馈和点评。</p>
        </div>

        <div class="faq-item">
          <h3>面试复盘报告包含哪些内容？</h3>
          <p>面试复盘报告包括答案评分、优势与不足分析、改进建议、表达清晰度评估、结构化程度分析等维度的详细反馈。</p>
        </div>

        <div class="faq-item">
          <h3>Pro 计划有什么优势？</h3>
          <p>Pro 计划提供无限模拟面试次数、更深度的能力分析、优先级支持、全真题库解锁等专属权益，帮助你更系统地进行求职训练。</p>
        </div>

        <div class="faq-item">
          <h3>能否取消或退款？</h3>
          <p>是的，Pro 计划支持随时取消或续费，灵活适应你的求职进度。详细的退款和取消政策请查看我们的帮助中心。</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// FAQ Section 组件无需额外脚本
</script>

<style scoped lang="scss">
.faq-section {
  padding: 80px 24px;
  background: linear-gradient(135deg, #f2f6ff 0%, #f8fbff 100%);
  max-width: 1200px;
  margin: 0 auto;
}

.faq-container {
  h2 {
    font-size: 40px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 16px;
    color: #0071e3;
  }

  .faq-intro {
    text-align: center;
    font-size: 16px;
    color: #666;
    margin-bottom: 48px;
  }
}

.faq-items {
  display: grid;
  gap: 32px;
}

.faq-item {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #0071e3;
  }

  p {
    font-size: 15px;
    line-height: 1.8;
    color: #333;
  }
}

@media (max-width: 768px) {
  .faq-section {
    padding: 60px 16px;
  }

  .faq-container h2 {
    font-size: 28px;
  }

  .faq-item {
    padding: 20px;

    h3 {
      font-size: 16px;
    }

    p {
      font-size: 14px;
    }
  }
}
</style>
