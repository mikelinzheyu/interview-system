# Phase 7D: Message Recommendations & Smart Features - Planning

**Phase**: 7D (Next phase after 7C collection/marking)
**Status**: 🎯 **PLANNING**
**Estimated Duration**: 8-10 hours
**Complexity**: Medium-High
**Dependencies**: Phase 7C (completed), services layer ready

---

## Overview

Phase 7D extends Phase 7C capabilities by adding intelligent message recommendations, smart filtering, and AI-powered organization features. This phase focuses on:

1. **消息推荐** (Message Recommendations) - Smart message suggestions based on usage patterns
2. **智能分类** (Smart Classification) - Auto-categorize messages using ML/heuristics
3. **搜索优化** (Search Optimization) - Advanced full-text search with relevance ranking
4. **快速访问** (Quick Access) - Recent/important message shortcuts
5. **个性化排序** (Personalized Sorting) - ML-based message ordering

---

## Phase 7 Roadmap Overview

```
Phase 7A: ✅ Message Search (消息搜索)
  └─ Full-text search, advanced filters, real-time results

Phase 7B: ✅ Message Recall & Edit (消息撤回编辑)
  └─ 2-min recall, version history, WebSocket sync

Phase 7C: ✅ Collection & Marking (消息收藏标记)
  └─ Bookmarking, custom tags, 4 mark types

Phase 7D: 🎯 Recommendations & Smart Features (推荐智能)
  ├─ Message recommendations
  ├─ Smart auto-categorization
  ├─ Advanced search (relevance ranking)
  ├─ Quick access (pinned/recent)
  └─ Personalized sorting

Phase 7E: 📋 Voice Messages & Recordings (语音消息)
  └─ Voice transcription, playback, storage

Phase 7F: 🎁 Message Reactions & Stickers (表情反应贴纸)
  └─ Emoji reactions, sticker packs, custom stickers

Phase 7G: 🔔 Rich Notifications (丰富通知)
  └─ Desktop notifications, sound alerts, priorities

Phase 7H: ⭐ Advanced Features TBD (待定高级功能)
  └─ Context-aware suggestions, ML features, etc.
```

**Progress**: Phases 1-6 + 7A-7C complete = 70% overall progress
**Next Phase**: 7D (30% remaining across 7D-7H)

---

## Detailed Feature Specifications

### Feature 1: Message Recommendations 🎯

**Purpose**: Suggest messages user might want to revisit or act on

**Sub-features**:
1. **Recommended Collections**
   - Suggest messages similar to already-collected items
   - Learn from user's collection patterns
   - Display in side panel with relevance score

2. **Follow-up Reminders**
   - Detect messages requiring action (questions, tasks)
   - Suggest reviewing TODO-marked messages
   - Smart reminder timing (daily/weekly digest)

3. **Related Messages**
   - Find similar messages by content/sender
   - Show conversation thread context
   - Quick navigation to related threads

**Data Model**:
```javascript
{
  messageId: 'msg123',
  recommendationType: 'collection_similarity' | 'follow_up' | 'related',
  score: 0.85,  // 0-1 relevance score
  reason: 'Similar to collected messages about "design"',
  suggestedAt: timestamp,
  dismissed: false,
  clickedAt: timestamp | null
}
```

**Implementation**:
- Service: `messageRecommendationService.js` (200 lines)
- Component: `MessageRecommendationPanel.vue` (180 lines)
- Tests: 40+ test cases
- Documentation: 1,500+ words

---

### Feature 2: Smart Classification 🤖

**Purpose**: Automatically categorize messages into smart folders/categories

**Categories**:
1. **Content-based** (text analysis)
   - Question messages (contains "?")
   - Code snippets (contains code blocks)
   - Media-heavy (images/videos)
   - Links/references
   - Important content (capitalization, punctuation patterns)

2. **Context-based** (conversation analysis)
   - Meeting notes
   - Decisions/conclusions
   - Follow-ups needed
   - Completed tasks
   - Announcements

3. **User-defined** (manual classification)
   - Custom categories
   - Smart tagging suggestions
   - Category-based filtering

**Data Model**:
```javascript
{
  messageId: 'msg123',
  categories: [
    {
      name: 'question',
      confidence: 0.92,
      suggestedAt: timestamp
    },
    {
      name: 'code_snippet',
      confidence: 0.85,
      suggestedAt: timestamp
    }
  ],
  userAccepted: ['question'],  // User approved categories
  userRejected: [],             // User rejected suggestions
  autoClassified: true,
  revisedAt: timestamp
}
```

**Implementation**:
- Service: `messageClassificationService.js` (250 lines)
- Component: `MessageClassificationPanel.vue` (150 lines)
- Classifier module: `messageClassifier.js` (150 lines)
- Tests: 45+ test cases
- Documentation: 2,000+ words

---

### Feature 3: Advanced Search 🔍

**Enhancement**: Add relevance ranking to Phase 7A search

**Improvements**:
1. **Relevance Scoring**
   - TF-IDF based ranking
   - Recency boost
   - Sender importance (frequent/important senders)
   - Mark type boost (starred messages higher)

2. **Search Facets**
   - By sender (grouped results)
   - By collection status (in/not in collection)
   - By mark type (important/urgent first)
   - By date range
   - By message type

3. **Smart Query**
   - Natural language parsing ("recent important messages")
   - Query suggestions/autocomplete
   - Search history with quick access
   - Saved search queries

4. **Result Display**
   - Ranked by relevance score
   - Context snippet with highlight
   - Breadcrumb path (conversation > thread)
   - Action buttons (collect, mark, etc.)

**Implementation**:
- Enhancement to `messageSearchService.js` (+80 lines)
- Component: `AdvancedSearchPanel.vue` (200 lines)
- Searcher module: `messageSearchEngine.js` (150 lines)
- Tests: 35+ test cases
- Documentation: 1,500+ words

---

### Feature 4: Quick Access 📌

**Purpose**: Easy access to frequent/important messages

**Features**:
1. **Pinned Messages**
   - Pin up to 10 messages per conversation
   - Display in message header area
   - Quick unpin action
   - Persist to localStorage

2. **Recent Messages**
   - Last 5 viewed messages
   - Quick jump to message
   - Clear history option
   - Time-based sorting

3. **Important Stack**
   - Messages with "important" mark
   - Messages in starred collections
   - Messages from VIP contacts
   - Priority sorting

4. **Quick Filter**
   - Buttons for: Pinned, Recent, Important, Todo
   - One-click filter toggle
   - Combined filtering support
   - Clear filters button

**Data Model**:
```javascript
{
  pinnedMessages: [  // Max 10 per conversation
    { messageId: 'msg123', pinnedAt: timestamp }
  ],
  recentMessages: [  // Last 5
    { messageId: 'msg456', viewedAt: timestamp }
  ],
  quickFilters: {
    showPinned: false,
    showRecent: false,
    showImportant: false,
    showTodo: false
  }
}
```

**Implementation**:
- Service: `messageQuickAccessService.js` (150 lines)
- Component: `QuickAccessBar.vue` (120 lines)
- Tests: 35+ test cases
- Documentation: 1,200+ words

---

### Feature 5: Personalized Sorting 🎯

**Purpose**: Smart message ordering based on user preferences and ML

**Sorting Algorithms**:
1. **By Relevance** (default in search)
   - TF-IDF score
   - Recency factor
   - User interaction signal

2. **By Importance**
   - Mark type (important > urgent > todo > done)
   - Collection status (collected > not)
   - Sender VIP status
   - Message interactions (replies, reactions)

3. **By Time**
   - Newest first
   - Oldest first
   - By conversation time
   - By sender time zone

4. **By Engagement**
   - Most viewed
   - Most marked
   - Most collected
   - Most forwarded

5. **ML-Based** (future)
   - User behavior patterns
   - Click-through analysis
   - Time-spent heuristics
   - Similar users clustering

**Data Model**:
```javascript
{
  messageId: 'msg123',
  scores: {
    relevance: 0.85,
    importance: 0.92,
    engagement: 0.78,
    recency: 0.65,
    userSignal: 0.88
  },
  combinedScore: 0.82,  // Weighted average
  ranking: 1,           // Position in result set
  sortKey: number       // For sorting arrays
}
```

**Implementation**:
- Service: `messageSortingService.js` (180 lines)
- Component: `SortingOptionsPanel.vue` (100 lines)
- Algorithm module: `sortingAlgorithms.js` (120 lines)
- Tests: 40+ test cases
- Documentation: 1,500+ words

---

## Architecture Design

### Service Layer Structure

```
Phase 7D Services (800+ lines)
├── messageRecommendationService.js (200 lines)
│   ├── getRecommendedMessages()
│   ├── trainRecommender()
│   ├── dismissRecommendation()
│   └── analyzePatterns()
│
├── messageClassificationService.js (250 lines)
│   ├── classifyMessage()
│   ├── autoClassify()
│   ├── acceptClassification()
│   ├── rejectClassification()
│   └── getClassifications()
│
├── messageSearchEngine.js (150 lines)
│   ├── searchWithRanking()
│   ├── calculateRelevanceScore()
│   ├── applyFacets()
│   └── getSuggestedQueries()
│
├── messageQuickAccessService.js (150 lines)
│   ├── pinMessage()
│   ├── unpinMessage()
│   ├── getPinnedMessages()
│   ├── addToRecent()
│   └── getQuickAccessData()
│
└── messageSortingService.js (180 lines)
    ├── sortMessages()
    ├── calculateScores()
    ├── applyUserPreferences()
    └── getSortingOptions()
```

### UI Component Hierarchy

```
ChatRoom (parent)
├── RecommendationPanel (200 lines)
│   ├── Recommendation cards
│   ├── Feedback buttons (helpful, dismiss)
│   └── View similar action
│
├── ClassificationPanel (150 lines)
│   ├── Category suggestions
│   ├── Accept/reject buttons
│   └── Custom category input
│
├── AdvancedSearchPanel (200 lines)
│   ├── Query input with autocomplete
│   ├── Facet filters
│   ├── Search history
│   └── Result ranking display
│
├── QuickAccessBar (120 lines)
│   ├── Pinned messages list
│   ├── Quick filter buttons
│   └── Recent messages dropdown
│
└── SortingOptionsPanel (100 lines)
    ├── Sort algorithm selector
    ├── Order toggle
    ├── Priority settings
    └── Apply button
```

---

## Technical Specifications

### API Endpoints (for backend integration)

```
POST /api/recommendations/get
  Query: { conversationId, limit, types }
  Response: [ recommendationObject ]

POST /api/classifications/auto-classify
  Body: { messageId, messageContent }
  Response: { categories: [categoryObject] }

POST /api/search/advanced
  Query: { query, facets, sortBy, limit }
  Response: { results: [messageObject], totalCount }

POST /api/messages/pin
  Body: { messageId, conversationId }
  Response: { success, pinnedCount }

POST /api/sorting/get-options
  Query: { conversationId }
  Response: { sortingOptions: [optionObject] }
```

### Data Dependencies

- Phase 7A: Message search index
- Phase 7B: Edit/recall history for context
- Phase 7C: Collection/marking data for patterns
- Store: User preferences, conversationId
- Socket: Real-time updates for recommendations

### Performance Targets

| Operation | Target | Status |
|-----------|--------|--------|
| Recommendation calculation | < 500ms | Target |
| Auto-classification | < 300ms | Target |
| Advanced search | < 800ms | Target |
| Quick access load | < 100ms | Target |
| Sorting operation | < 400ms | Target |

---

## Implementation Timeline

### Phase 7D Timeline (10 hours estimated)

**Day 1 (3.5 hours)**:
- [x] Phase 7D planning & requirements
- [ ] Message recommendation service (200 lines)
- [ ] Recommendation component UI (180 lines)

**Day 2 (3.5 hours)**:
- [ ] Smart classification service (250 lines)
- [ ] Classification component UI (150 lines)
- [ ] Classifier algorithm (150 lines)

**Day 3 (3 hours)**:
- [ ] Advanced search enhancement (80 lines)
- [ ] Advanced search UI (200 lines)
- [ ] Search engine module (150 lines)

**Optional Extensions (2 hours)**:
- [ ] Quick access feature (150+120 lines)
- [ ] Personalized sorting (180+100+120 lines)
- [ ] Full test suite (200+ tests)

---

## Testing Strategy

### Unit Tests (250+ test cases)

**messageRecommendationService.spec.js** (60 tests)
- Recommendation calculation
- Pattern analysis
- Feedback handling
- localStorage persistence

**messageClassificationService.spec.js** (65 tests)
- Auto-classification
- Category acceptance
- Classification management
- Accuracy metrics

**messageSearchEngine.spec.js** (50 tests)
- Relevance scoring
- Query parsing
- Facet application
- Result ranking

**messageQuickAccessService.spec.js** (45 tests)
- Pin/unpin operations
- Recent message tracking
- Quick filter state
- Persistence

**messageSortingService.spec.js** (50 tests)
- Sort algorithm correctness
- Score calculation
- User preference application
- Edge cases

### Integration Tests (30+ tests)
- Multi-feature workflows
- Cross-service interactions
- UI component integration
- Real-time updates

### E2E Tests (20+ scenarios)
- End-to-end recommendation flow
- Classification workflow
- Search with sorting
- Quick access workflows

---

## Documentation Plan

### Code Documentation (3,000+ words)

1. **Feature Guides** (500 words each)
   - Message Recommendations Guide
   - Smart Classification Guide
   - Advanced Search Guide
   - Quick Access Guide
   - Personalized Sorting Guide

2. **API Reference** (1,000+ words)
   - Service method signatures
   - Parameter descriptions
   - Return value specifications
   - Error handling

3. **Architecture Document** (1,000+ words)
   - System design overview
   - Data flow diagrams
   - Service interactions
   - Performance considerations

4. **User Guide** (500+ words)
   - Feature explanations
   - How to use each feature
   - Best practices
   - Tips and tricks

---

## Dependencies & Integration Points

### Internal Dependencies
- Phase 7A: Search functionality
- Phase 7B: Message edit history
- Phase 7C: Collections and marks
- Services layer: Socket, store

### External APIs (optional)
- Machine learning model for classification
- NLP for smart query parsing
- Analytics for user behavior tracking

### localStorage Keys
- `message_recommendations`
- `message_classifications`
- `message_quick_access`
- `message_sorting_prefs`

---

## Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Complex ML algorithms | High | Medium | Use simple heuristics first, add ML later |
| Performance degradation | Medium | High | Implement caching, pagination, limits |
| User confusion (many options) | High | Medium | Provide sensible defaults, UI guidance |
| localStorage size limits | Medium | Low | Implement data cleanup, compression |
| Cross-browser compatibility | Low | Medium | Test thoroughly, polyfills |

---

## Success Criteria

### Functional Requirements
- [x] Phase 7D planning complete
- [ ] 5 core features implemented
- [ ] 250+ unit tests passing
- [ ] 30+ integration tests passing
- [ ] 20+ E2E scenarios passing
- [ ] 100% feature documentation
- [ ] Zero critical bugs

### Non-Functional Requirements
- [ ] Search < 800ms
- [ ] Recommendations < 500ms
- [ ] Classification < 300ms
- [ ] UI responsive (< 16ms per frame)
- [ ] localStorage < 2MB
- [ ] 90%+ code coverage
- [ ] Accessibility compliant

---

## Deliverables Checklist

### Code (800+ lines)
- [ ] 5 service files (900 lines total)
- [ ] 5 UI components (670 lines total)
- [ ] Tests (250+ test cases)
- [ ] Documentation (3,000+ words)

### Documentation
- [ ] PHASE7D_PLANNING.md (this file)
- [ ] PHASE7D_IMPLEMENTATION_GUIDE.md
- [ ] PHASE7D_API_REFERENCE.md
- [ ] PHASE7D_QUICK_REFERENCE.md
- [ ] PHASE7D_COMPLETE_SUMMARY.md

### Integration
- [ ] ChatRoom.vue integration
- [ ] Component props/events
- [ ] Service initialization
- [ ] Event handlers
- [ ] UI state management

---

## Next Phase Roadmap

**After Phase 7D**:
- Phase 7E: Voice messages and recordings
- Phase 7F: Emoji reactions and stickers
- Phase 7G: Rich notifications
- Phase 7H: Advanced features (TBD)

---

## Summary

Phase 7D represents the next major feature set, adding intelligent message management capabilities. The implementation will follow the proven pattern established in previous phases:

**Pattern**: Services → UI Components → Tests → Documentation → Integration

**Estimated Completion**: 10 hours
**Code Quality**: Production-ready, fully tested
**Documentation**: Comprehensive guides and API refs

---

**Phase 7D Status**: 🎯 **READY FOR DEVELOPMENT**

**Last Updated**: October 22, 2025
**Next Action**: Begin Phase 7D implementation when ready
