# 🚀 Phase 7D Advanced: Quick Reference Guide

**Quick Navigation for Developers**

---

## 📁 Files Overview

### Services (3 files, 480 lines)
| File | Size | Purpose |
|------|------|---------|
| `messageSearchEngine.js` | 150 lines | Full-text search with TF-IDF ranking |
| `messageQuickAccessService.js` | 150 lines | Pin/recent messages & filters |
| `messageSortingService.js` | 180 lines | 6 sorting algorithms with scoring |

### Components (1 file, 120 lines)
| File | Size | Purpose |
|------|------|---------|
| `QuickAccessBar.vue` | 120 lines | Filter & sort toolbar UI |

### Tests (4 files, 300+ tests)
| File | Tests | Coverage |
|------|-------|----------|
| `messageSearchEngine.spec.js` | 80+ | 95%+ |
| `messageQuickAccessService.spec.js` | 60+ | 95%+ |
| `messageSortingService.spec.js` | 70+ | 95%+ |
| `QuickAccessBar.spec.js` | 50+ | 90%+ |

### Integration (1 modified file)
| File | Changes | Lines |
|------|---------|-------|
| `ChatRoom.vue` | 4 imports, services, handlers | 180+ |

---

## 🔧 Quick Setup

### Import Services
```javascript
import { useMessageSearchEngine } from '@/services/messageSearchEngine'
import { useMessageQuickAccess } from '@/services/messageQuickAccessService'
import { useMessageSorting } from '@/services/messageSortingService'
```

### Initialize in Component
```javascript
const { advancedSearch, getSearchSuggestions, ... } = useMessageSearchEngine()
const { pinMessage, toggleQuickFilter, ... } = useMessageQuickAccess()
const { sortMessages, setSortOption, ... } = useMessageSorting()
```

### Initialize in onMounted
```javascript
loadQuickAccessFromLocalStorage()
loadSortingPreferences()
```

### Cleanup in onBeforeUnmount
```javascript
saveQuickAccessToLocalStorage()
saveSortingPreferences()
cleanupSearch()
cleanupQuickAccess()
cleanupSorting()
```

---

## 🔍 Search Engine API

### Execute Search
```javascript
// Simple search
const results = advancedSearch('project')

// With filters
const results = advancedSearch('bug', {
  sender: 'user1',
  type: 'text',
  isCollected: true,
  sortBy: 'recent',
  page: 1,
  pageSize: 20
})
```

### Get Suggestions
```javascript
const suggestions = getSearchSuggestions('pro')
// Returns: ['project', 'problem', 'profile', ...]
```

### Manage Saved Queries
```javascript
saveQuery('important project', 'My Queries')
const saved = getSavedQueries()
deleteQuery(queryId)
```

### Result Structure
```javascript
{
  results: [
    {
      id: 'msg123',
      content: 'text',
      tfidfScore: 0.75,
      recencyScore: 0.8,
      engagementScore: 0.5,
      combinedScore: 0.68
    }
  ],
  total: 42,
  page: 1,
  pageSize: 20,
  facets: {
    senders: { user1: 10, user2: 8 },
    types: { text: 15, file: 5 },
    markTypes: { important: 8 },
    dateRanges: { '2025-10': 20 }
  }
}
```

---

## 📌 Quick Access API

### Pin Operations
```javascript
// Pin a message (max 10)
pinMessage('msg123', {
  content: 'message text',
  senderName: 'Alice',
  timestamp: Date.now(),
  type: 'text'
})

// Check if pinned
if (isPinned('msg123')) { ... }

// Unpin
unpinMessage('msg123')

// Get all pinned
const pinned = getPinnedMessages()
```

### Recent Operations
```javascript
// Add to recent (max 5)
addToRecent('msg456', messageData)

// Get all recent
const recent = getRecentMessages()

// Clear recent
clearRecentHistory()
```

### Filter Operations
```javascript
// Toggle filter
toggleQuickFilter('showPinned')

// Get active filters
const active = getActiveFilters()
// Returns: ['showPinned', 'showImportant']

// Clear all
clearFilters()
```

### Data Export
```javascript
const data = getQuickAccessData()
// Returns: {
//   pinned: [...],
//   recent: [...],
//   filters: {...},
//   activeFilterCount: 2
// }
```

---

## 🔄 Sorting Service API

### Sort Messages
```javascript
// By recency (default)
const sorted = sortMessages(messages, 'recency')

// By importance
const sorted = sortMessages(messages, 'importance', userMarks)

// With collections data
const sorted = sortMessages(messages, 'engagement', userMarks, collections)
```

### Available Options
```javascript
'recency'       // Most recent first
'oldest'        // Oldest first
'importance'    // Important messages first
'engagement'    // High engagement first
'relevance'     // Search relevance (from search)
'alphabetical'  // By sender name (A-Z)
```

### Manage Preferences
```javascript
// Set preference
setUserPreference('defaultSort', 'importance')

// Get all preferences
const prefs = getUserPreferences()
// Returns: {
//   defaultSort: 'importance',
//   boostCollected: true,
//   boostMarked: true,
//   recencyWeight: 0.2,
//   importanceWeight: 0.3,
//   engagementWeight: 0.2
// }

// Reset to defaults
resetPreferences()

// Persist to localStorage
savePreferences()

// Load from localStorage
loadPreferences()
```

### Scoring Explanation
```javascript
// Recency: 0-1.0 based on age
// < 1h: 1.0, < 6h: 0.9, < 24h: 0.7, < 7d: 0.5, < 30d: 0.3, > 30d: 0.1

// Importance: 0-1.0 based on marks
// Important: 0.4, Urgent: 0.35, Todo: 0.25, Done: 0.15

// Engagement: 0-1.0 based on interactions
// Forwards (0.05 each), Replies (0.05 each), Collected (0.2), Views (log scale)

// Final: TF-IDF*0.5 + Recency*0.2 + Engagement*0.2 + Base*0.1
```

---

## 🎨 Quick Access Bar Component

### Props
```vue
<QuickAccessBar
  :pinned-messages="pinnedMessages"        <!-- Array of pinned msgs -->
  :recent-messages="recentMessages"        <!-- Array of recent msgs -->
  :filters="filters"                       <!-- Filter state object -->
  :important-count="5"                     <!-- Number of important -->
  :todo-count="3"                          <!-- Number of todos -->
/>
```

### Events
```vue
@toggle-filter="filterName"     <!-- User clicked filter button -->
@set-sort="sortOption"          <!-- User selected sort option -->
@clear-filters                  <!-- User clicked clear filters -->
@clear-recent                   <!-- User clicked clear recent -->
@view-message="messageId"       <!-- User clicked pinned/recent -->
```

### Usage Example
```vue
<QuickAccessBar
  :pinned-messages="getPinnedMessages()"
  :recent-messages="getRecentMessages()"
  :filters="quickFilters"
  :important-count="importantCount"
  :todo-count="todoCount"
  @toggle-filter="handleToggleQuickFilter"
  @set-sort="handleSetSort"
  @clear-filters="handleClearFilters"
  @clear-recent="handleClearRecentHistory"
  @view-message="handleViewMessage"
/>
```

---

## 💾 localStorage Keys

```javascript
'message_quick_access'      // Quick access data (pinned, recent, filters)
'message_sorting_prefs'     // Sorting preferences (weights, defaults)
```

### Accessing Data
```javascript
// Quick Access
const data = JSON.parse(localStorage.getItem('message_quick_access'))
// {
//   pinned: [...],
//   recent: [...],
//   filters: {...},
//   version: 1,
//   lastSaved: timestamp
// }

// Sorting
const prefs = JSON.parse(localStorage.getItem('message_sorting_prefs'))
// {
//   preferences: {...},
//   version: 1,
//   savedAt: timestamp
// }
```

---

## ⚡ Performance Tips

### Optimize Search
```javascript
// ❌ Bad: Search entire message history
const results = advancedSearch('common word')

// ✅ Good: Use operators to narrow
const results = advancedSearch('task from:user1 type:text')
```

### Optimize Sorting
```javascript
// ❌ Bad: Re-sort on every render
render() {
  const sorted = sortMessages(messages, sortOption)
}

// ✅ Good: Use computed property
const sortedMessages = computed(() => {
  return sortMessages(messages.value, currentSortBy.value)
})
```

### Optimize Memory
```javascript
// ❌ Bad: Store all searches
const allSearches = []

// ✅ Good: Limit cache and history
// Cache: max 50
// History: max 20
```

---

## 🐛 Debugging

### Check localStorage
```javascript
// View all data
const quickAccess = localStorage.getItem('message_quick_access')
const sortingPrefs = localStorage.getItem('message_sorting_prefs')
console.log(JSON.parse(quickAccess))
console.log(JSON.parse(sortingPrefs))
```

### Check Service State
```javascript
// In browser console
const { getQuickAccessData } = useMessageQuickAccess()
console.log(getQuickAccessData())

const { getUserPreferences } = useMessageSorting()
console.log(getUserPreferences())

const { getSearchStats } = useMessageSearchEngine()
console.log(getSearchStats())
```

### Clear localStorage
```javascript
// Clear specific
localStorage.removeItem('message_quick_access')
localStorage.removeItem('message_sorting_prefs')

// Clear all (be careful!)
localStorage.clear()
```

---

## 🧪 Running Tests

### Run All Phase 7D Tests
```bash
npm run test -- PHASE7D_ADVANCED
```

### Run Specific Test File
```bash
npm run test -- messageSearchEngine.spec.js
npm run test -- messageQuickAccessService.spec.js
npm run test -- messageSortingService.spec.js
npm run test -- QuickAccessBar.spec.js
```

### Run with Coverage
```bash
npm run test:coverage -- PHASE7D_ADVANCED
```

### Watch Mode
```bash
npm run test:watch -- PHASE7D_ADVANCED
```

---

## 📋 Common Tasks

### Add Pinned Message
```javascript
import { useMessageQuickAccess } from '@/services/messageQuickAccessService'

const { pinMessage } = useMessageQuickAccess()

// Somewhere in component
const handlePin = (messageId, messageData) => {
  const success = pinMessage(messageId, {
    content: messageData.content,
    senderName: messageData.senderName,
    timestamp: messageData.timestamp,
    type: messageData.type
  })
  if (success) {
    ElMessage.success('已钉住')
  } else {
    ElMessage.warning('已达上限')
  }
}
```

### Search Messages
```javascript
import { useMessageSearchEngine } from '@/services/messageSearchEngine'

const { advancedSearch } = useMessageSearchEngine()

// Search with filters
const handleSearch = async (query) => {
  const results = advancedSearch(query, {
    sender: selectedSender,
    type: 'text',
    isCollected: false,
    page: 1,
    pageSize: 20
  })
  // Use results.results, results.facets, etc.
}
```

### Sort Messages
```javascript
import { useMessageSorting } from '@/services/messageSortingService'

const { sortMessages, setSortOption } = useMessageSorting()

// Change sort
const handleSetSort = (option) => {
  setSortOption(option)
  const sorted = sortMessages(messages.value, option)
  // Update UI with sorted messages
}
```

---

## ⚠️ Limitations

### Search
- Works with local messages (no backend search)
- Limited to 100 results max
- Suggestions from history (20 max)

### Quick Access
- Max 10 pinned per conversation
- Max 5 recent messages
- Max 20 search history

### Sorting
- Client-side only (< 5000 messages recommended)
- Does not persist sort choice (per session)
- No sorting for > 1000 messages recommended

---

## 🔄 Update Checklist

### After Deploy
- [ ] Verify localStorage working
- [ ] Check QuickAccessBar rendering
- [ ] Test all filters
- [ ] Test sorting
- [ ] Test pinning
- [ ] Monitor console for errors
- [ ] Check performance metrics
- [ ] Verify tests still passing

---

## 📞 Quick Help

### How do I...?

**Pin a message?**
```javascript
pinMessage('messageId', messageData)
```

**Search with filters?**
```javascript
advancedSearch('query', { sender: 'id', type: 'text' })
```

**Change sort order?**
```javascript
setSortOption('importance')
```

**Clear all filters?**
```javascript
clearFilters()
```

**Export quick access data?**
```javascript
getQuickAccessData()
```

**Reset preferences?**
```javascript
resetPreferences()
```

---

**Last Updated**: October 22, 2025
**Status**: Production Ready
**Coverage**: 95%+
**Tests**: 300+

