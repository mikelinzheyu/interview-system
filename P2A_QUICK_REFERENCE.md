# P2A Quick Reference Guide
## Recommendation Engine - Fast Implementation

**Last Updated**: 2025-11-01
**Status**: ✅ Ready for Integration

---

## 🎯 What's New in P2A

**Personalized recommendation algorithm** that generates domain suggestions based on:
- User interests and goals
- Learning style and time availability
- Content similarity and domain relationships
- Trending/popular domains
- Prerequisite requirements

---

## 📦 Key Files

| File | Location | Purpose | Size |
|------|----------|---------|------|
| recommendationService | `src/services/recommendationService.js` | Core algorithm | 500+ lines |
| SmartFilterPanel | `src/components/chat/SmartFilterPanel.vue` | Filter UI | 350+ lines |
| RecommendationPanelEnhanced | `src/components/RecommendationPanelEnhanced.vue` | Display recommendations | 400+ lines |
| domain.js (updated) | `src/stores/domain.js` | Store integration | +250 lines |

---

## ⚡ Quick Start

### 1. Load Domains
```javascript
const store = useDomainStore()
await store.loadDomains()
```

### 2. Build User Profile & Generate Recommendations
```javascript
await store.buildUserProfileAndRecommend({
  userId: 'user_123',
  interests: ['JavaScript', 'Web Development'],
  goals: ['Frontend Developer'],
  learningStyle: 'practical',  // 'theoretical' | 'practical' | 'balanced'
  timePerWeek: '5-10h'         // '1-3h' | '5-10h' | '15+h'
})
```

### 3. Display in Template
```vue
<template>
  <!-- Smart Filters -->
  <SmartFilterPanel />

  <!-- Personalized Recommendations -->
  <RecommendationPanelEnhanced
    :count="6"
    @domain-selected="handleSelect"
  />
</template>
```

---

## 🔧 Store API

### State
```javascript
store.recommendations         // Array of recommendation objects
store.userProfile            // User profile object
store.filterOptions          // Filter configuration
store.filteredAndSortedDomains // Computed filtered results
```

### Key Methods
```javascript
// Recommendations
await store.buildUserProfileAndRecommend(profileData)
await store.generateRecommendations(count)
store.loadSimilarDomains(domainId, count)
store.loadPopularDomains(count)

// User Profile
store.updateUserProfile(updates)
store.addLikedDomain(domainId)
store.removeLikedDomain(domainId)
store.markDomainAsCompleted(domainId)
store.markDomainAsInProgress(domainId)

// Filters
store.applyFilters(options)
store.resetFilters()
```

---

## 📊 Recommendation Object Structure

```javascript
{
  domainId: 1,
  domainName: "JavaScript Fundamentals",
  score: 87,                  // 0-100 overall score
  reason: "matches your interests in JavaScript • supports your goal of Frontend Developer",
  matchedAttributes: ["Interest Match", "Career Goal", "Highly Rated"],
  contentSimilarity: 85,      // Content-based score
  collaborativeSimilarity: 70, // Collaborative filtering score
  trendingScore: 90,          // Trending/popularity score
  isPrerequisite: false,      // Is prerequisite for user's goals
  isComplementary: true       // Related to user's interests
}
```

---

## 🎨 Component Usage

### SmartFilterPanel
```vue
<SmartFilterPanel />
<!-- Provides:
  - Difficulty level filtering
  - Time investment filtering
  - Popularity/hotness filtering
  - Sorting options
  - Active filter tags
  - Result count
-->
```

### RecommendationPanelEnhanced
```vue
<RecommendationPanelEnhanced
  :count="6"
  :show-breakdown="true"
  @domain-selected="handleSelect"
  @view-all="showAll"
/>

<!-- Features:
  - Recommendation cards with scores
  - Recommendation reasons
  - Matched attributes display
  - Score breakdown (3 metrics)
  - Action buttons (Select, Like)
  - Loading/Error/Empty states
  - Responsive design
-->
```

---

## 🧮 Algorithm

### Scoring Formula
```
Final Score = (Content×45%) + (Collaborative×25%) + (Trending×15%) + (Prerequisite×15%)

Score Range: 0-100
```

### Content-Based (45%)
- Tag matching with user interests
- Career path matching with goals
- Difficulty level preference
- Time investment fit

### Collaborative Filtering (25%)
- Domains similar to liked domains
- Shared tags and discipline
- Related domain detection

### Trending (15%)
- Domain popularity (0-100)
- User rating (0-5 → 0-100)
- Question count relevance

### Prerequisite Bonus (15%)
- Required for in-progress domains
- Career path relevance

---

## 🔍 Domain Data Requirements

For optimal recommendations, domains should include:

```javascript
{
  id: Number,                    // Required
  name: String,                  // Required
  tags: String[],                // ⭐ NEW: ['programming', 'javascript']
  discipline: String,            // ⭐ NEW: 'Computer Science'
  difficulty: String,            // ⭐ NEW: 'beginner'|'intermediate'|'advanced'
  timeRequired: Number,          // ⭐ NEW: hours to complete (40-120)
  popularity: Number,            // ⭐ NEW: 0-100 score
  rating: Number,                // ⭐ NEW: 0-5 rating
  questionCount: Number,         // Existing
  prerequisites: Number[],       // ⭐ NEW: [1, 2, 3] domain IDs
  relatedDomains: Number[],     // ⭐ NEW: [5, 6, 7] domain IDs
  careerPaths: String[]         // ⭐ NEW: ['Frontend Developer', 'Full Stack']
}
```

---

## 📈 Common Use Cases

### Case 1: New User - Generate Initial Recommendations
```javascript
const newUserProfile = {
  userId: 'new_user_456',
  interests: ['Web Development'],
  goals: ['Get First Dev Job'],
  learningStyle: 'practical',
  timePerWeek: '5-10h'
}

await store.buildUserProfileAndRecommend(newUserProfile)
// Recommendations now available in store.recommendations
```

### Case 2: User Refines Preferences
```javascript
// After user selects interests
store.updateUserProfile({
  interests: ['JavaScript', 'React', 'Node.js'],
  goals: ['Full Stack Developer'],
  learningStyle: 'balanced'
})

// Regenerate recommendations
await store.generateRecommendations(8)
```

### Case 3: User Completes a Domain
```javascript
store.markDomainAsCompleted(1)  // Removes from recommendations
store.markDomainAsInProgress(2) // Updates prerequisites

// Regenerate to show next recommended steps
await store.generateRecommendations(6)
```

### Case 4: Smart Filtering
```javascript
// User filters for beginner, trending domains
store.applyFilters({
  difficulty: ['beginner'],
  popularity: 'trending',
  sortBy: 'recommendation'
})

// store.filteredAndSortedDomains updates automatically
```

---

## 🧪 Quick Tests

### Test 1: Profile Building
```javascript
const profile = recommendationService.buildUserProfile({
  userId: 'test_user',
  interests: ['AI'],
  goals: ['ML Engineer']
})

console.log(profile)
// ✅ Should have userId, interests array, empty likedDomainIds
```

### Test 2: Recommendations
```javascript
const profile = {userId: 'test', interests: ['JavaScript']}
const recs = recommendationService.generateRecommendations(profile, domains, 5)

console.log(recs[0])
// ✅ Should have score, reason, matchedAttributes, etc.
```

### Test 3: Filtering
```javascript
store.applyFilters({difficulty: ['beginner']})

console.log(store.filteredAndSortedDomains.length)
// ✅ Should only include beginner domains
```

---

## ⚙️ Configuration

### Adjust Recommendation Count
```javascript
// Get 10 recommendations instead of 6
await store.generateRecommendations(10)
```

### Customize Algorithm Weights
Edit `recommendationService.js` line ~300:
```javascript
const finalScore = Math.round(
  contentScore * 0.50 +        // Increase for more interest-based
  collaborativeScore * 0.15 +  // Decrease for less "similar users"
  trendingScore * 0.20 +       // Increase for popular domains
  prerequisiteBonus * 0.15
)
```

### Filter Persistence
Filters auto-save in store. To reset:
```javascript
store.resetFilters()
```

---

## 🐛 Common Issues

### Issue: No recommendations generated
**Solution**: Ensure domains have required attributes (tags, difficulty, etc.)

### Issue: Filters not applying
**Solution**: Make sure you call `store.applyFilters()`, not just update the state

### Issue: User profile not updating
**Solution**: Use `store.updateUserProfile()` or `store.buildUserProfileAndRecommend()`

### Issue: Liked domains not persisting
**Solution**: Implement localStorage or API persistence manually:
```javascript
// Save liked domains
localStorage.setItem('likedDomains', JSON.stringify(store.userProfile.likedDomainIds))

// Load on app start
const liked = JSON.parse(localStorage.getItem('likedDomains') || '[]')
store.userProfile.likedDomainIds = liked
```

---

## 📊 Integration Checklist

- [ ] `recommendationService.js` exists and imports correctly
- [ ] Store includes recommendation methods
- [ ] SmartFilterPanel imported in parent component
- [ ] RecommendationPanelEnhanced imported in parent component
- [ ] Domains include required attributes
- [ ] User profile initialized on app start
- [ ] Recommendations generate without errors
- [ ] Filters apply correctly
- [ ] Recommendation cards display with scores

---

## 🚀 Performance Tips

1. **Cache recommendations**: They don't change until user profile updates
2. **Lazy load components**: Import SmartFilterPanel/RecommendationPanel on demand
3. **Batch domain updates**: Load all domains once, not per-domain
4. **Debounce filter changes**: Avoid regenerating on every keystroke

---

## 📱 Responsive Notes

- SmartFilterPanel stacks on mobile (grid → column)
- RecommendationPanel cards adapt to screen size
- Score breakdown collapses to single column on mobile
- Action buttons stack on screens < 480px

---

## 🎓 Next: Phase 2B

**Knowledge Graph Visualization**
- Interactive tree visualization of domain relationships
- Learning path recommendations
- Prerequisite chain visualization
- Difficulty progression view

**Timeline**: Next session
**Technology**: ECharts or D3.js

---

## 📞 Reference

- **Algorithm Paper**: Hybrid recommendation combining content + collaborative
- **Sample Domains**: Available in `mock-domains.json`
- **API Integration**: Optional, all features work client-side
- **Testing**: Jest + Vue Test Utils

---

**P2A Status**: ✅ **COMPLETE & READY**
**Recommended Next**: Continue with P2B or integrate into existing page
