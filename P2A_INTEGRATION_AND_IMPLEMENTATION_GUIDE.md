# P2 Implementation & Integration Guide
## Phase 2A: Recommendation Engine

**Status**: ✅ Phase 2A Complete
**Date**: 2025-11-01
**Scope**: Recommendation algorithm, store integration, UI components

---

## 📦 Phase 2A Deliverables

### 1. Core Service: `recommendationService.js`
**Location**: `frontend/src/services/recommendationService.js`
**Size**: 500+ lines
**Exports**:
- `recommendationService` (default export)

**Key Methods**:
- `buildUserProfile(userData)` - Build comprehensive user profile
- `generateRecommendations(userProfile, allDomains, count)` - Generate personalized recommendations
- `getSimilarDomains(domainId, allDomains, count)` - Find similar domains
- `getPopularDomains(allDomains, count)` - Get trending domains
- `getLearningPath(interest, allDomains)` - Get learning sequence
- `getPrerequisites(domainId, allDomains)` - Get prerequisite domains

### 2. Store Extension: `domain.js`
**Location**: `frontend/src/stores/domain.js`
**Changes**:
- ✅ Added `recommendationService` import
- ✅ Added P2 state variables (recommendations, userProfile, filterOptions, etc.)
- ✅ Added `reactive` import for filter management
- ✅ Added 15+ new recommendation methods
- ✅ Added `filteredAndSortedDomains` computed property

**New State Variables**:
```javascript
// P2新增：推荐引擎相关状态
const recommendations = ref([])
const recommendationsLoading = ref(false)
const recommendationsError = ref(null)
const userProfile = ref(null)
const userProfileLoading = ref(false)
const similarDomains = ref({})
const collectionItems = ref([])
const filterOptions = reactive({
  difficulty: [],
  timeInvestment: [],
  popularity: 'all',
  sortBy: 'recommendation'
})
```

**New Methods**:
```javascript
// 核心推荐方法
async buildUserProfileAndRecommend(profileData)
async generateRecommendations(count = 5)
function loadSimilarDomains(domainId, count = 5)
function loadPopularDomains(count = 5)
function getlearningPath(interest)
function getDomainPrerequisites(domainId)

// 用户档案管理
function updateUserProfile(updates)
function addLikedDomain(domainId)
function removeLikedDomain(domainId)
function markDomainAsCompleted(domainId)
function markDomainAsInProgress(domainId)

// 过滤和排序
function applyFilters(options)
function resetFilters()

// 计算属性
const filteredAndSortedDomains = computed(...)
```

### 3. UI Components

#### A. SmartFilterPanel Component
**Location**: `frontend/src/components/chat/SmartFilterPanel.vue`
**Size**: 350+ lines
**Features**:
- Difficulty level filtering (Beginner/Intermediate/Advanced)
- Time investment filtering (1-3h/5-10h/15+h per week)
- Popularity filtering (Trending/Top-rated)
- Dynamic sorting (Recommendation/Popularity/Difficulty/Time)
- Active filter tags with removal
- Result count display
- Reset functionality

**Usage**:
```vue
<template>
  <SmartFilterPanel />
</template>

<script setup>
import SmartFilterPanel from '@/components/chat/SmartFilterPanel.vue'
</script>
```

#### B. RecommendationPanelEnhanced Component
**Location**: `frontend/src/components/RecommendationPanelEnhanced.vue`
**Size**: 400+ lines
**Features**:
- Display personalized recommendations with scores
- Show recommendation reasons
- Display matched attributes
- Show score breakdown (content similarity, collaborative, trending)
- Prerequisite indicators
- Action buttons (Select, Like/Unlike)
- Loading/Error/Empty states
- Responsive design

**Props**:
```javascript
{
  count: Number (default: 6),      // Number of recommendations to display
  showBreakdown: Boolean (default: true)  // Show score breakdown
}
```

**Events**:
```javascript
emit('domain-selected', domain)     // Emitted when user selects a domain
emit('view-all')                    // Emitted when user clicks "View More"
```

**Usage**:
```vue
<template>
  <RecommendationPanelEnhanced
    :count="6"
    :show-breakdown="true"
    @domain-selected="handleDomainSelected"
    @view-all="handleViewAll"
  />
</template>

<script setup>
import RecommendationPanelEnhanced from '@/components/RecommendationPanelEnhanced.vue'

const handleDomainSelected = (domain) => {
  console.log('Selected domain:', domain.name)
}

const handleViewAll = () => {
  console.log('Viewing all recommendations')
}
</script>
```

---

## 🔧 Integration Steps

### Step 1: Verify Store Integration
Check that `frontend/src/stores/domain.js` has been properly updated with P2 methods:

```bash
# Verify the store file includes:
grep -n "buildUserProfileAndRecommend" frontend/src/stores/domain.js
grep -n "recommendationService" frontend/src/stores/domain.js
```

### Step 2: Update DomainSelector Component
**File**: `frontend/src/views/questions/DomainSelector.vue`

Add SmartFilterPanel and RecommendationPanelEnhanced:

```vue
<template>
  <div class="domain-selector">
    <!-- Layout: Sidebar + Main Content -->
    <div class="selector-container">
      <!-- Left Sidebar -->
      <aside class="sidebar">
        <DomainTreeSidebar />
        <!-- or DomainSidebar (P0) based on viewMode -->
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- P0: Hero Card -->
        <DomainHeroCard />

        <!-- P2A: Smart Filters -->
        <SmartFilterPanel />

        <!-- P2A: Enhanced Recommendations -->
        <RecommendationPanelEnhanced
          :count="6"
          @domain-selected="handleDomainSelected"
          @view-all="showAllRecommendations"
        />

        <!-- P1: Recommendation Panel (Optional - can keep or replace) -->
        <!-- <DomainRecommendationPanel /> -->
      </main>

      <!-- Right Sidebar (Optional) -->
      <aside class="right-sidebar" v-if="showLearningPath">
        <!-- Learning Path Preview -->
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDomainStore } from '@/stores/domain'
import DomainTreeSidebar from './components/DomainTreeSidebar.vue'
import DomainHeroCard from './components/DomainHeroCard.vue'
import SmartFilterPanel from '@/components/chat/SmartFilterPanel.vue'
import RecommendationPanelEnhanced from '@/components/RecommendationPanelEnhanced.vue'

const store = useDomainStore()

onMounted(async () => {
  // Initialize domains
  await store.loadDomains()

  // Load hierarchical data for tree view
  await store.loadHierarchicalDomains()

  // Build user profile and generate recommendations
  await store.buildUserProfileAndRecommend({
    userId: 'user_123', // Replace with actual user ID
    interests: [],
    goals: [],
    learningStyle: 'balanced',
    timePerWeek: '5-10h'
  })
})

const handleDomainSelected = (domain) => {
  store.setCurrentDomain(domain)
  // Navigate to practice mode or detail page
}

const showAllRecommendations = () => {
  // Show modal or navigate to full recommendations page
}
</script>

<style scoped>
.domain-selector {
  width: 100%;
  height: 100%;
}

.selector-container {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  gap: 20px;
  padding: 20px;
}

.sidebar {
  min-height: 500px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-sidebar {
  min-height: 500px;
}

@media (max-width: 1200px) {
  .selector-container {
    grid-template-columns: 1fr;
  }

  .right-sidebar {
    display: none;
  }
}
</style>
</script>
```

### Step 3: Initialize User Profile
In your authentication/onboarding flow, initialize the user profile:

```javascript
// After user login
const userProfile = {
  userId: user.id,
  interests: ['Web Development', 'JavaScript'],
  goals: ['Frontend Developer'],
  learningStyle: 'practical',
  timePerWeek: '5-10h',
  completedDomains: [],
  inProgressDomains: [],
  likedDomainIds: []
}

await store.buildUserProfileAndRecommend(userProfile)
```

### Step 4: Update Domain Data Model
Ensure your domains include the following attributes for better recommendations:

```javascript
{
  id: 1,
  name: 'JavaScript Fundamentals',
  tags: ['programming', 'javascript', 'web', 'frontend'],
  discipline: 'Computer Science',
  difficulty: 'beginner',          // NEW
  timeRequired: 40,               // NEW (hours to complete)
  popularity: 85,                 // NEW (0-100)
  rating: 4.8,                    // NEW (0-5)
  questionCount: 156,
  prerequisites: [],              // NEW
  relatedDomains: [2, 3, 5],     // NEW
  careerPaths: ['Frontend Developer', 'Full Stack Developer'] // NEW
}
```

### Step 5: API Integration (Optional)
If your backend has recommendation endpoints:

```javascript
// In recommendationService.js, you can add:
async function generateRecommendationsFromAPI(userId) {
  const response = await api.get(`/recommendations/${userId}`)
  return response.data
}

// Or in store:
async function loadRecommendationsFromAPI(count = 5) {
  try {
    const response = await api.get(`/user/recommendations?limit=${count}`)
    recommendations.value = response.data
  } catch (err) {
    // Fallback to client-side generation
    await generateRecommendations(count)
  }
}
```

---

## 📊 Algorithm Details

### Recommendation Scoring System

The algorithm combines 4 weighted scores:

1. **Content-Based Score (45%)** - Matches domain attributes with user profile
   - Tag matching with interests
   - Career path matching with goals
   - Difficulty level preference
   - Time investment matching

2. **Collaborative Filtering Score (25%)** - Finds domains similar to user's liked domains
   - Common tags analysis
   - Discipline similarity
   - Related domains detection

3. **Trending Score (15%)** - Combines popularity and quality metrics
   - Domain popularity (0-100)
   - Rating (0-5 → 0-100)
   - Question count relevance

4. **Prerequisite Bonus (15%)** - Boosts domains needed for user's goals
   - Prerequisite for in-progress domains
   - Career path relevance

**Final Score**:
```
Score = (ContentScore × 0.45) +
        (CollaborativeScore × 0.25) +
        (TrendingScore × 0.15) +
        (PrerequisiteBonus × 0.15)
```

---

## 🧪 Testing P2A Features

### Unit Test: User Profile Building
```javascript
import recommendationService from '@/services/recommendationService'

describe('recommendationService', () => {
  test('builds user profile correctly', () => {
    const profile = recommendationService.buildUserProfile({
      userId: 'user_123',
      interests: ['AI', 'Machine Learning'],
      goals: ['ML Engineer'],
      learningStyle: 'theoretical',
      timePerWeek: '15+h'
    })

    expect(profile.userId).toBe('user_123')
    expect(profile.interests).toEqual(['AI', 'Machine Learning'])
    expect(profile.likedDomainIds).toEqual([])
  })

  test('generates recommendations with scores', () => {
    const profile = recommendationService.buildUserProfile({
      userId: 'user_123',
      interests: ['JavaScript'],
      goals: ['Frontend Developer']
    })

    const domains = [
      { id: 1, name: 'JavaScript', tags: ['javascript', 'web'], careerPaths: ['Frontend Developer'], difficulty: 'beginner', questionCount: 100, rating: 4.8, popularity: 90 },
      { id: 2, name: 'Python', tags: ['python', 'data'], careerPaths: ['Data Scientist'], difficulty: 'beginner', questionCount: 80, rating: 4.5, popularity: 85 }
    ]

    const recs = recommendationService.generateRecommendations(profile, domains, 2)

    expect(recs.length).toBeLessThanOrEqual(2)
    expect(recs[0].score).toBeGreaterThan(0)
    expect(recs[0].reason).toBeDefined()
  })
})
```

### Integration Test: Store Integration
```javascript
import { createPinia, setActivePinia } from 'pinia'
import { useDomainStore } from '@/stores/domain'

describe('Domain Store - P2 Recommendations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('generates recommendations after profile build', async () => {
    const store = useDomainStore()

    // Mock domains
    store.domains = [
      { id: 1, name: 'JavaScript', tags: ['javascript'], difficulty: 'beginner' },
      { id: 2, name: 'React', tags: ['react', 'javascript'], difficulty: 'intermediate' }
    ]

    await store.buildUserProfileAndRecommend({
      userId: 'user_123',
      interests: ['JavaScript'],
      goals: ['Frontend Developer']
    })

    expect(store.recommendations.length).toBeGreaterThan(0)
    expect(store.userProfile.userId).toBe('user_123')
  })

  test('applies filters correctly', () => {
    const store = useDomainStore()

    store.domains = [
      { id: 1, name: 'JS Basics', difficulty: 'beginner', popularity: 90 },
      { id: 2, name: 'Advanced React', difficulty: 'advanced', popularity: 85 }
    ]

    store.applyFilters({
      difficulty: ['beginner'],
      popularity: 'all'
    })

    expect(store.filteredAndSortedDomains.length).toBe(1)
    expect(store.filteredAndSortedDomains[0].name).toBe('JS Basics')
  })
})
```

---

## 🎨 Customization Guide

### Adjust Recommendation Weights
Edit `recommendationService.js`:

```javascript
// Line 303-307: Change weights
const finalScore = Math.round(
  contentScore * 0.50 +        // Increase content weight
  collaborativeScore * 0.20 +  // Decrease collaborative
  trendingScore * 0.15 +
  prerequisiteBonus * 0.15
)
```

### Add Custom Scoring Rules
Add new methods to `recommendationService`:

```javascript
_customDomainScore(domain, userProfile) {
  let score = 0

  // Add your custom logic
  if (domain.tags.includes('trending')) {
    score += 20
  }

  return score
}
```

### Customize Filter UI
Modify `SmartFilterPanel.vue`:

```vue
<!-- Add new filter group -->
<div class="filter-group">
  <label class="filter-label">
    <i class="el-icon-custom"></i> Custom Filter
  </label>
  <el-select v-model="customFilter" @change="handleFilterChange">
    <el-option label="Option 1" value="opt1" />
    <el-option label="Option 2" value="opt2" />
  </el-select>
</div>
```

---

## 📚 File Summary

### New Files Created
1. ✅ `frontend/src/services/recommendationService.js` (500+ lines)
2. ✅ `frontend/src/components/chat/SmartFilterPanel.vue` (350+ lines)
3. ✅ `frontend/src/components/RecommendationPanelEnhanced.vue` (400+ lines)
4. ✅ `P2_ADVANCED_FEATURES_FRAMEWORK.md` (Documentation)
5. ✅ `P2_IMPLEMENTATION_AND_INTEGRATION_GUIDE.md` (This file)

### Modified Files
1. ✅ `frontend/src/stores/domain.js` (Added 30+ lines)
   - Import recommendationService
   - Added P2 state variables
   - Added 15+ new methods
   - Extended exports

### Total Code Added
- **New Components**: 750+ lines
- **New Service**: 500+ lines
- **Store Extensions**: 250+ lines
- **Total P2A**: ~1500 lines of code

---

## 🚀 Next Steps

### P2B: Knowledge Graph Visualization
**Estimated Timeline**: Next session
**Features**:
- Interactive tree/graph visualization of domain relationships
- Learning path recommendations
- Prerequisite visualization
- Difficulty level indicators

### P2C: Collection & Favorites System
**Features**:
- Save domains to custom collections
- Create learning plans
- Collection sharing

### P2D: Learning Analytics
**Features**:
- Progress tracking dashboard
- Time spent analytics
- Learning velocity metrics
- Goal prediction

---

## ❓ FAQ

**Q: What if the user doesn't have a profile?**
A: The system uses a default profile with balanced settings and generates generic recommendations. As the user interacts (likes domains, marks as completed), recommendations improve.

**Q: How often should recommendations refresh?**
A: Recommendations can refresh on:
- User profile updates
- Domain completion
- User clicking "Refresh" button
- On page load (with caching)

**Q: Can recommendations work offline?**
A: Yes! The entire algorithm runs client-side. Users can get recommendations without backend API calls.

**Q: How do I track recommendation accuracy?**
A: You can add metrics by tracking:
- Click-through rate on recommendations
- Domain selection after recommendation
- Time spent on recommended domains
- User feedback on recommendation quality

---

## 📞 Support

For issues with P2A implementation:
1. Verify store integration with grep commands
2. Check console for error messages
3. Verify domain data includes new attributes
4. Test with sample recommendations

---

**Phase 2A Status**: ✅ **COMPLETE**
**Last Updated**: 2025-11-01
**Next Phase**: P2B - Knowledge Graph Visualization
