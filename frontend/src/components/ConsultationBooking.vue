<template>
  <div class="consultation-booking">
    <!-- Header -->
    <div class="header">
      <h2 class="title">📞 在线咨询预约</h2>
      <p class="desc">与行业专家和职业导师进行一对一咨询</p>
    </div>

    <!-- Booking Tabs -->
    <div class="booking-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Tab 1: Consultant Selection -->
    <section v-show="activeTab === 'consultants'" class="tab-section">
      <div class="section-header">
        <h3>选择咨询专家</h3>
        <div class="filter-controls">
          <select v-model="filterExpertise" class="filter-select">
            <option value="">全部专业</option>
            <option value="职业规划">职业规划</option>
            <option value="简历优化">简历优化</option>
            <option value="面试辅导">面试辅导</option>
            <option value="创业指导">创业指导</option>
            <option value="技能培养">技能培养</option>
          </select>
          <select v-model="filterPrice" class="filter-select">
            <option value="">全部价格</option>
            <option value="免费">免费咨询</option>
            <option value="99">99元/小时</option>
            <option value="199">199元/小时</option>
            <option value="299">299元/小时</option>
          </select>
        </div>
      </div>

      <div class="consultants-grid">
        <div
          v-for="consultant in filteredConsultants"
          :key="consultant.id"
          class="consultant-card"
          @click="selectConsultant(consultant)"
          :class="{ selected: selectedConsultant?.id === consultant.id }"
        >
          <!-- Avatar -->
          <div class="avatar">{{ consultant.initials }}</div>

          <!-- Basic Info -->
          <h4 class="consultant-name">{{ consultant.name }}</h4>
          <p class="consultant-title">{{ consultant.title }}</p>
          <p class="consultant-company">{{ consultant.company }}</p>

          <!-- Expertise Tags -->
          <div class="expertise-tags">
            <span v-for="exp in consultant.expertise" :key="exp" class="tag">
              {{ exp }}
            </span>
          </div>

          <!-- Stats -->
          <div class="consultant-stats">
            <div class="stat">
              <span class="label">咨询人数</span>
              <span class="value">{{ consultant.consultations }}</span>
            </div>
            <div class="stat">
              <span class="label">满意度</span>
              <span class="value">{{ consultant.rating }}</span>
            </div>
          </div>

          <!-- Price -->
          <div class="price-section">
            <span class="price-label">咨询费用</span>
            <span class="price-value">{{ consultant.price }}</span>
          </div>

          <!-- Select Button -->
          <button
            class="select-btn"
            :class="{ selected: selectedConsultant?.id === consultant.id }"
          >
            {{ selectedConsultant?.id === consultant.id ? '✓ 已选择' : '选择' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Tab 2: Schedule Booking -->
    <section v-show="activeTab === 'schedule'" class="tab-section">
      <div v-if="!selectedConsultant" class="empty-state">
        <p>请先选择咨询专家</p>
      </div>

      <div v-else>
        <div class="section-header">
          <h3>选择咨询时间 - {{ selectedConsultant.name }}</h3>
        </div>

        <!-- Consultation Type -->
        <div class="form-section">
          <label class="form-label">咨询类型</label>
          <div class="consultation-types">
            <button
              v-for="type in consultationTypes"
              :key="type.id"
              class="type-btn"
              :class="{ active: newBooking.type === type.id }"
              @click="newBooking.type = type.id"
            >
              <span class="type-icon">{{ type.icon }}</span>
              <span class="type-name">{{ type.name }}</span>
              <span class="type-duration">{{ type.duration }}</span>
            </button>
          </div>
        </div>

        <!-- Date Selection -->
        <div class="form-section">
          <label class="form-label">选择日期</label>
          <div class="date-picker">
            <div class="date-list">
              <button
                v-for="date in availableDates"
                :key="date"
                class="date-btn"
                :class="{ active: newBooking.date === date }"
                @click="newBooking.date = date"
              >
                <span class="date-day">{{ formatDateShort(date) }}</span>
                <span class="date-weekday">{{ formatWeekday(date) }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Time Selection -->
        <div v-if="newBooking.date" class="form-section">
          <label class="form-label">选择时间</label>
          <div class="time-grid">
            <button
              v-for="time in availableTimes"
              :key="time"
              class="time-btn"
              :class="{ active: newBooking.time === time }"
              @click="newBooking.time = time"
            >
              {{ time }}
            </button>
          </div>
        </div>

        <!-- Consultation Topic -->
        <div class="form-section">
          <label class="form-label">咨询主题</label>
          <textarea
            v-model="newBooking.topic"
            placeholder="请描述您想讨论的主题..."
            rows="4"
            class="form-textarea"
          ></textarea>
        </div>

        <!-- Booking Summary -->
        <div v-if="newBooking.date && newBooking.time" class="booking-summary">
          <h4>预约摘要</h4>
          <div class="summary-item">
            <span class="summary-label">咨询专家</span>
            <span class="summary-value">{{ selectedConsultant.name }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">咨询类型</span>
            <span class="summary-value">{{ getConsultationTypeName(newBooking.type) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">预约时间</span>
            <span class="summary-value"
              >{{ formatDateFull(newBooking.date) }} {{ newBooking.time }}</span
            >
          </div>
          <div class="summary-item">
            <span class="summary-label">咨询费用</span>
            <span class="summary-value">{{ selectedConsultant.price }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Tab 3: Confirm & Payment -->
    <section v-show="activeTab === 'confirm'" class="tab-section">
      <div v-if="!selectedConsultant" class="empty-state">
        <p>请先完成咨询安排</p>
      </div>

      <div v-else class="confirmation-section">
        <div class="section-header">
          <h3>确认预约信息</h3>
        </div>

        <!-- Confirmation Details -->
        <div class="confirmation-card">
          <div class="confirmation-item">
            <span class="icon">👤</span>
            <div class="item-content">
              <div class="item-label">咨询专家</div>
              <div class="item-value">{{ selectedConsultant.name }}</div>
              <div class="item-detail">{{ selectedConsultant.title }} | {{ selectedConsultant.company }}</div>
            </div>
          </div>

          <div class="confirmation-item">
            <span class="icon">📅</span>
            <div class="item-content">
              <div class="item-label">预约时间</div>
              <div class="item-value">{{ formatDateFull(newBooking.date) }} {{ newBooking.time }}</div>
              <div class="item-detail">{{ getConsultationTypeName(newBooking.type) }}</div>
            </div>
          </div>

          <div class="confirmation-item">
            <span class="icon">💬</span>
            <div class="item-content">
              <div class="item-label">咨询主题</div>
              <div class="item-value">{{ newBooking.topic || '未填写' }}</div>
            </div>
          </div>

          <div class="confirmation-item">
            <span class="icon">💰</span>
            <div class="item-content">
              <div class="item-label">费用信息</div>
              <div class="item-value">{{ selectedConsultant.price }}</div>
              <div class="item-detail">支持支付宝、微信、银行卡</div>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="payment-methods">
          <h4>选择支付方式</h4>
          <div class="methods-grid">
            <button
              v-for="method in paymentMethods"
              :key="method.id"
              class="method-btn"
              :class="{ active: selectedPaymentMethod === method.id }"
              @click="selectedPaymentMethod = method.id"
            >
              <span class="method-icon">{{ method.icon }}</span>
              <span class="method-name">{{ method.name }}</span>
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-cancel" @click="resetBooking">取消预约</button>
          <button class="btn-confirm" @click="confirmBooking">确认并支付</button>
        </div>
      </div>
    </section>

    <!-- Tab 4: My Bookings -->
    <section v-show="activeTab === 'bookings'" class="tab-section">
      <div class="section-header">
        <h3>我的预约</h3>
        <div class="booking-filter">
          <button
            v-for="status in ['全部', '待进行', '已完成', '已取消']"
            :key="status"
            class="filter-btn"
            :class="{ active: bookingStatus === status }"
            @click="bookingStatus = status"
          >
            {{ status }}
          </button>
        </div>
      </div>

      <div v-if="filteredBookings.length === 0" class="empty-state">
        <p>暂无预约记录</p>
      </div>

      <div v-else class="bookings-list">
        <div
          v-for="booking in filteredBookings"
          :key="booking.id"
          class="booking-item"
          :class="`status-${booking.status}`"
        >
          <!-- Booking Header -->
          <div class="booking-header">
            <div class="header-left">
              <h4 class="booking-consultant">{{ booking.consultant }}</h4>
              <p class="booking-title">{{ booking.title }}</p>
            </div>
            <span class="booking-status" :class="`status-${booking.status}`">
              {{ booking.status }}
            </span>
          </div>

          <!-- Booking Details -->
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">📅 预约时间</span>
              <span class="detail-value">{{ booking.dateTime }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⏱️ 时长</span>
              <span class="detail-value">{{ booking.duration }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">💰 费用</span>
              <span class="detail-value">{{ booking.price }}</span>
            </div>
            <div v-if="booking.notes" class="detail-row">
              <span class="detail-label">📝 备注</span>
              <span class="detail-value">{{ booking.notes }}</span>
            </div>
          </div>

          <!-- Booking Actions -->
          <div class="booking-actions">
            <button
              v-if="booking.status === '待进行'"
              class="action-btn reschedule-btn"
            >
              📅 改期
            </button>
            <button
              v-if="booking.status === '待进行'"
              class="action-btn cancel-btn"
            >
              ❌ 取消
            </button>
            <button
              v-if="booking.status === '已完成'"
              class="action-btn review-btn"
              @click="showReviewForm(booking.id)"
            >
              ⭐ 评价
            </button>
            <button v-else class="action-btn view-btn">
              👁️ 查看
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Review Form Modal -->
    <div v-if="showReview" class="modal-overlay" @click="showReview = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>评价咨询</h3>
          <button class="close-btn" @click="showReview = false">✕</button>
        </div>

        <div class="modal-body">
          <!-- Rating -->
          <div class="form-section">
            <label class="form-label">咨询评分</label>
            <div class="rating-stars">
              <button
                v-for="star in 5"
                :key="star"
                class="star-btn"
                :class="{ active: reviewRating >= star }"
                @click="reviewRating = star"
              >
                ⭐
              </button>
            </div>
          </div>

          <!-- Review Text -->
          <div class="form-section">
            <label class="form-label">咨询评价</label>
            <textarea
              v-model="reviewText"
              placeholder="请分享您的咨询体验..."
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Would Recommend -->
          <div class="form-section">
            <label class="form-label">是否推荐该咨询师？</label>
            <div class="recommend-options">
              <button
                class="option-btn"
                :class="{ active: wouldRecommend === true }"
                @click="wouldRecommend = true"
              >
                👍 推荐
              </button>
              <button
                class="option-btn"
                :class="{ active: wouldRecommend === false }"
                @click="wouldRecommend = false"
              >
                👎 不推荐
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions">
            <button class="btn-cancel" @click="showReview = false">取消</button>
            <button class="btn-submit" @click="submitReview">提交评价</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Consultation Tips -->
    <div class="tips-section">
      <h3 class="tips-title">💡 咨询建议</h3>
      <div class="tips-grid">
        <div class="tip-card">
          <div class="tip-icon">📋</div>
          <h4>准备充分</h4>
          <p>在咨询前，准备具体的问题和职业目标，这样能充分利用咨询时间</p>
        </div>
        <div class="tip-card">
          <div class="tip-icon">🎯</div>
          <h4>明确目标</h4>
          <p>清楚地表达您想要解决的问题，帮助咨询师提供更有针对性的建议</p>
        </div>
        <div class="tip-card">
          <div class="tip-icon">📱</div>
          <h4>准时上线</h4>
          <p>提前5分钟进入咨询室，准备好摄像头和麦克风，确保网络连接良好</p>
        </div>
        <div class="tip-card">
          <div class="tip-icon">📝</div>
          <h4>做好记录</h4>
          <p>咨询过程中记录重点，咨询后整理建议并制定行动计划</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('consultants')
const filterExpertise = ref('')
const filterPrice = ref('')
const selectedConsultant = ref(null)
const bookingStatus = ref('全部')
const selectedPaymentMethod = ref('alipay')
const showReview = ref(false)
const reviewRating = ref(5)
const reviewText = ref('')
const wouldRecommend = ref(true)

const tabs = [
  { id: 'consultants', label: '选择专家', icon: '👤' },
  { id: 'schedule', label: '安排时间', icon: '📅' },
  { id: 'confirm', label: '确认支付', icon: '💳' },
  { id: 'bookings', label: '我的预约', icon: '📋' }
]

const consultationTypes = [
  { id: 'career', name: '职业规划', duration: '50分钟', icon: '🎯' },
  { id: 'resume', name: '简历优化', duration: '30分钟', icon: '📄' },
  { id: 'interview', name: '面试模拟', duration: '60分钟', icon: '🎤' },
  { id: 'startup', name: '创业指导', duration: '60分钟', icon: '🚀' }
]

const paymentMethods = [
  { id: 'alipay', name: '支付宝', icon: '🔵' },
  { id: 'wechat', name: '微信', icon: '🟢' },
  { id: 'card', name: '银行卡', icon: '💳' }
]

const consultants = ref([
  {
    id: 1,
    name: '李明',
    initials: '李',
    title: '资深职业规划师',
    company: '职业发展中心',
    expertise: ['职业规划', '简历优化', '面试辅导'],
    consultations: 450,
    rating: '4.9',
    price: '199元/小时'
  },
  {
    id: 2,
    name: '王芳',
    initials: '王',
    title: '企业HR专家',
    company: '人力资源研究院',
    expertise: ['职业规划', '简历优化', '薪资谈判'],
    consultations: 320,
    rating: '4.8',
    price: '179元/小时'
  },
  {
    id: 3,
    name: '张涛',
    initials: '张',
    title: '创业导师',
    company: '创业孵化基地',
    expertise: ['创业指导', '融资指导', '团队建设'],
    consultations: 280,
    rating: '4.9',
    price: '299元/小时'
  },
  {
    id: 4,
    name: '陈静',
    initials: '陈',
    title: '技能发展顾问',
    company: '在线学习平台',
    expertise: ['技能培养', '学习规划', '职业发展'],
    consultations: 380,
    rating: '4.7',
    price: '99元/小时'
  },
  {
    id: 5,
    name: '刘强',
    initials: '刘',
    title: '企业高管',
    company: '互联网公司',
    expertise: ['职业规划', '面试辅导', '职业发展'],
    consultations: 420,
    rating: '4.8',
    price: '免费咨询'
  },
  {
    id: 6,
    name: '周璟',
    initials: '周',
    title: '心理职业辅导师',
    company: '职业心理研究所',
    expertise: ['职业规划', '压力管理', '职业发展'],
    consultations: 350,
    rating: '4.9',
    price: '169元/小时'
  }
])

const myBookings = ref([
  {
    id: 1,
    consultant: '李明',
    title: '职业规划',
    dateTime: '2024-12-20 14:00',
    duration: '50分钟',
    price: '199元',
    status: '待进行',
    notes: '讨论互联网行业职业发展方向'
  },
  {
    id: 2,
    consultant: '王芳',
    title: '简历优化',
    dateTime: '2024-12-18 10:00',
    duration: '30分钟',
    price: '179元',
    status: '已完成',
    notes: '优化技术背景和项目经验描述'
  },
  {
    id: 3,
    consultant: '张涛',
    title: '创业指导',
    dateTime: '2024-12-15 15:00',
    duration: '60分钟',
    price: '299元',
    status: '已完成',
    notes: '讨论创业想法和市场前景'
  },
  {
    id: 4,
    consultant: '陈静',
    title: '技能发展',
    dateTime: '2024-12-25 11:00',
    duration: '60分钟',
    price: '99元',
    status: '待进行',
    notes: '学习路径规划和技能提升建议'
  }
])

const newBooking = ref({
  type: '',
  date: '',
  time: '',
  topic: ''
})

// Available dates (next 7 days)
const availableDates = computed(() => {
  const dates = []
  const today = new Date()
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
})

// Available times
const availableTimes = [
  '09:00',
  '10:00',
  '11:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00'
]

const filteredConsultants = computed(() => {
  let filtered = consultants.value

  if (filterExpertise.value) {
    filtered = filtered.filter(c => c.expertise.includes(filterExpertise.value))
  }

  if (filterPrice.value) {
    filtered = filtered.filter(c => {
      if (filterPrice.value === '免费') {
        return c.price.includes('免费')
      }
      return c.price.includes(filterPrice.value)
    })
  }

  return filtered
})

const filteredBookings = computed(() => {
  if (bookingStatus.value === '全部') {
    return myBookings.value
  }
  return myBookings.value.filter(b => b.status === bookingStatus.value)
})

function selectConsultant(consultant) {
  selectedConsultant.value = consultant
  activeTab.value = 'schedule'
}

function getConsultationTypeName(typeId) {
  return consultationTypes.find(t => t.id === typeId)?.name || ''
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatWeekday(dateStr) {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

function formatDateFull(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function confirmBooking() {
  if (!newBooking.value.type || !newBooking.value.date || !newBooking.value.time) {
    alert('请完整填写预约信息')
    return
  }

  // Add new booking to list
  const newBook = {
    id: Math.max(...myBookings.value.map(b => b.id), 0) + 1,
    consultant: selectedConsultant.value.name,
    title: getConsultationTypeName(newBooking.value.type),
    dateTime: `${formatDateFull(newBooking.value.date)} ${newBooking.value.time}`,
    duration: consultationTypes.find(t => t.id === newBooking.value.type)?.duration || '',
    price: selectedConsultant.value.price,
    status: '待进行',
    notes: newBooking.value.topic
  }

  myBookings.value.push(newBook)
  alert('预约成功！请稍候进行支付。')
  resetBooking()
}

function resetBooking() {
  selectedConsultant.value = null
  newBooking.value = { type: '', date: '', time: '', topic: '' }
  activeTab.value = 'consultants'
}

function showReviewForm(bookingId) {
  showReview.value = true
}

function submitReview() {
  alert('感谢您的评价！')
  showReview.value = false
  reviewRating.value = 5
  reviewText.value = ''
  wouldRecommend.value = true
}
</script>

<style scoped>
.consultation-booking {
  padding: 2rem 0;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 2rem;
  animation: slideDown 0.5s ease-out;
}

.title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.desc {
  color: #7f8c8d;
  margin: 0;
  font-size: 1rem;
}

/* Booking Tabs */
.booking-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.tab-btn {
  padding: 0.8rem 1.5rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  color: #7f8c8d;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.tab-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.tab-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-color: #2980b9;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

/* Tab Sections */
.tab-section {
  animation: slideUp 0.5s ease-out;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.6rem 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  background: white;
  color: #2c3e50;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:hover,
.filter-select:focus {
  border-color: #3498db;
  outline: none;
}

/* Consultants Grid */
.consultants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.consultant-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  animation: slideUp 0.5s ease-out;
}

.consultant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.consultant-card.selected {
  border-color: #3498db;
  background: #f0f7ff;
}

.avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.consultant-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.3rem 0;
  font-weight: 700;
}

.consultant-title {
  color: #3498db;
  font-weight: 600;
  margin: 0.2rem 0;
  font-size: 0.9rem;
}

.consultant-company {
  color: #7f8c8d;
  margin: 0.2rem 0 0.8rem 0;
  font-size: 0.85rem;
}

.expertise-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.3rem 0.7rem;
  background: #f0f7ff;
  color: #3498db;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.consultant-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat {
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 0.75rem;
  color: #95a5a6;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.stat .value {
  display: block;
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 700;
}

.price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  background: #f9f3e9;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.price-label {
  color: #d68910;
  font-weight: 600;
  font-size: 0.85rem;
}

.price-value {
  color: #d68910;
  font-weight: 700;
  font-size: 1rem;
}

.select-btn {
  width: 100%;
  padding: 0.7rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.select-btn.selected {
  background: #27ae60;
}

/* Consultation Types */
.consultation-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.type-btn {
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.type-btn:hover {
  border-color: #3498db;
  background: #f0f7ff;
}

.type-btn.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
}

.type-icon {
  font-size: 1.5rem;
}

.type-name {
  font-weight: 600;
  color: #2c3e50;
}

.type-duration {
  font-size: 0.8rem;
  color: #95a5a6;
}

/* Date Picker */
.date-picker {
  margin-bottom: 2rem;
}

.date-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.8rem;
}

.date-btn {
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.date-btn:hover {
  border-color: #3498db;
}

.date-btn.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.date-day {
  font-weight: 700;
  font-size: 1.1rem;
}

.date-weekday {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Time Grid */
.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0.8rem;
  margin-bottom: 2rem;
}

.time-btn {
  padding: 0.8rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  background: white;
  color: #2c3e50;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.time-btn.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

/* Form Sections */
.form-section {
  margin-bottom: 2rem;
}

.form-label {
  display: block;
  margin-bottom: 0.8rem;
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Booking Summary */
.booking-summary {
  background: #f0f7ff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border-left: 4px solid #3498db;
}

.booking-summary h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-weight: 700;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(52, 152, 219, 0.1);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  color: #7f8c8d;
  font-weight: 600;
}

.summary-value {
  color: #2c3e50;
  font-weight: 700;
}

/* Confirmation Section */
.confirmation-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.confirmation-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
  align-items: flex-start;
}

.confirmation-item:last-child {
  border-bottom: none;
}

.confirmation-item .icon {
  font-size: 2rem;
}

.item-content {
  flex: 1;
}

.item-label {
  font-size: 0.85rem;
  color: #95a5a6;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.item-value {
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.item-detail {
  font-size: 0.85rem;
  color: #7f8c8d;
}

/* Payment Methods */
.payment-methods {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.payment-methods h4 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-weight: 700;
}

.methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.method-btn {
  padding: 1.5rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.method-btn:hover {
  border-color: #3498db;
}

.method-btn.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
}

.method-icon {
  font-size: 2rem;
}

.method-name {
  font-weight: 600;
  color: #2c3e50;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-cancel {
  background: #ecf0f1;
  color: #7f8c8d;
}

.btn-cancel:hover {
  background: #bdc3c7;
}

.btn-confirm {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

/* Bookings List */
.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.booking-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #3498db;
  animation: slideUp 0.5s ease-out;
}

.booking-item.status-待进行 {
  border-left-color: #f39c12;
}

.booking-item.status-已完成 {
  border-left-color: #27ae60;
}

.booking-item.status-已取消 {
  border-left-color: #95a5a6;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.header-left {
  flex: 1;
}

.booking-consultant {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.3rem 0;
  font-weight: 700;
}

.booking-title {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.9rem;
}

.booking-status {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #ecf0f1;
  color: #7f8c8d;
}

.booking-status.status-待进行 {
  background: #fff3cd;
  color: #f39c12;
}

.booking-status.status-已完成 {
  background: #d4edda;
  color: #27ae60;
}

.booking-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  color: #7f8c8d;
  font-weight: 600;
  font-size: 0.9rem;
}

.detail-value {
  color: #2c3e50;
  font-weight: 600;
}

.booking-actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.reschedule-btn,
.view-btn {
  background: #f0f7ff;
  color: #3498db;
}

.reschedule-btn:hover,
.view-btn:hover {
  background: #3498db;
  color: white;
}

.cancel-btn {
  background: #fff5f5;
  color: #e74c3c;
}

.cancel-btn:hover {
  background: #e74c3c;
  color: white;
}

.review-btn {
  background: #fff9e6;
  color: #f39c12;
}

.review-btn:hover {
  background: #f39c12;
  color: white;
}

/* Booking Filter */
.booking-filter {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.6rem 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  background: white;
  color: #7f8c8d;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.filter-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-color: #2980b9;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #95a5a6;
}

.modal-body {
  padding: 1.5rem;
}

.rating-stars {
  display: flex;
  gap: 0.5rem;
}

.star-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.star-btn.active {
  opacity: 1;
}

.recommend-options {
  display: flex;
  gap: 1rem;
}

.option-btn {
  flex: 1;
  padding: 0.8rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.option-btn:hover {
  border-color: #3498db;
}

.option-btn.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
  color: #3498db;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-submit {
  flex: 1;
  padding: 0.8rem;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

/* Tips Section */
.tips-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tips-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.tip-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  text-align: center;
  border: 1px solid #ecf0f1;
}

.tip-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.tip-card h4 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}

.tip-card p {
  color: #7f8c8d;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  color: #7f8c8d;
  font-size: 1.1rem;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .consultants-grid {
    grid-template-columns: 1fr;
  }

  .booking-details {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .booking-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-content {
    width: 95%;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }
}
</style>
