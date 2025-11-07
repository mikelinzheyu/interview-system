# Integration Testing Plan - Phase 2 & Phase 3

**Date**: 2025-10-22
**Status**: ✅ Ready for Testing
**Scope**: Phase 2 (Real-time Features) + Phase 3 (Analytics & Batch Operations)

---

## Testing Objectives

1. **Verify Component Integration** - Ensure all Phase 2 and Phase 3 components work together seamlessly
2. **Test Data Flow** - Validate data movement from frontend → backend → database → frontend
3. **Validate WebSocket Communication** - Test real-time synchronization
4. **Test Batch Operations** - Verify bulk operations execute correctly
5. **Analytics Accuracy** - Ensure analytics calculations are correct
6. **Error Handling** - Test graceful failure modes

---

## Test Environment Setup

### Prerequisites
- Node.js 16+ (Frontend)
- Java 11+ (Backend)
- MySQL 5.7+ (Database)
- Redis (Optional, for caching)

### Services to Start
```bash
# Terminal 1: Frontend dev server
cd frontend
npm install
npm run dev
# Access at: http://localhost:5174

# Terminal 2: Backend (if using Java)
cd backend
mvn spring-boot:run
# Access at: http://localhost:8080

# Terminal 3: Mock server (if needed)
node backend/mock-server.js
# Access at: http://localhost:3001
```

---

## Phase 2 Integration Tests

### Test Group 1: WebSocket Real-time Sync

#### Test 1.1: User Opens Wrong Answer Detail
**Steps**:
1. Login to application
2. Navigate to `/wrong-answers`
3. Click on a wrong answer record
4. Verify detail view loads (WrongAnswerDetail.vue)

**Expected Results**:
- Component renders correctly
- WebSocket connection established
- Loading state handled properly
- Data displays: question title, content, error analysis

**Test Data**:
```javascript
{
  recordId: 1,
  questionTitle: "Test Question",
  questionContent: "What is Vue 3?",
  difficulty: "medium",
  source: "ai_interview",
  wrongCount: 3,
  correctCount: 1,
  reviewStatus: "reviewing"
}
```

#### Test 1.2: Real-time Status Update via WebSocket
**Steps**:
1. Open wrong answer detail view
2. Mark as "Already Mastered"
3. Check in another browser window if sync appears

**Expected Results**:
- Status updates immediately in UI
- WebSocket message sent to backend
- Backend updates database
- Other clients receive update via WebSocket
- No page refresh needed

**WebSocket Messages**:
```javascript
// Client → Server
{
  type: 'update_wrong_answer',
  data: {
    recordId: 1,
    reviewStatus: 'mastered',
    timestamp: '2025-10-22T10:30:00Z'
  }
}

// Server → Clients
{
  type: 'wrong_answer_updated',
  data: { recordId: 1, reviewStatus: 'mastered' }
}
```

#### Test 1.3: Offline Detection and Queue
**Steps**:
1. Open wrong answer detail view
2. Disconnect network (DevTools → offline)
3. Try to update status
4. Reconnect network

**Expected Results**:
- System detects offline state
- Shows offline indicator
- Queues operation in IndexedDB
- On reconnect, automatically syncs queued operations
- Optimistic UI update immediately shown
- Eventually consistent with server

---

### Test Group 2: Review Mode Full-Screen

#### Test 2.1: Enter Review Mode
**Steps**:
1. From wrong answer list, click "Start Review"
2. Navigate to `/wrong-answers/:id/review`

**Expected Results**:
- ReviewMode.vue renders full-screen
- Question displays clearly
- Timer starts counting up
- Progress bar shows position in review list
- Navigation arrows appear

#### Test 2.2: Review Session Flow
**Steps**:
1. Read question
2. Click "Still Don't Know" → marks as reviewing
3. Next question appears
4. Repeat 5 times
5. Session completes

**Expected Results**:
- Each action tracked
- Progress bar advances
- Session duration recorded
- Summary screen shows results
- Achievements triggered if applicable

#### Test 2.3: Quit Review Session
**Steps**:
1. Start review session
2. Answer 2-3 questions
3. Click "Exit" button
4. Confirm exit

**Expected Results**:
- Confirmation dialog shown
- Session progress saved
- Returns to previous page
- Partial session data preserved

---

### Test Group 3: Offline Cache (IndexedDB)

#### Test 3.1: Data Persists to IndexedDB
**Steps**:
1. Open wrong answers list
2. Open DevTools → Application → IndexedDB
3. Expand "interview-system" database
4. Check "wrongAnswers" object store

**Expected Results**:
- IndexedDB database exists
- Object stores created:
  - `wrongAnswers` (main data)
  - `syncQueue` (pending updates)
  - `metadata` (sync info)
- Records visible with correct data
- Updated timestamps present

#### Test 3.2: Offline Mode Access
**Steps**:
1. Go online and load wrong answers
2. Turn off network (DevTools)
3. Navigate to `/wrong-answers`
4. Page should still load from cache

**Expected Results**:
- List displays cached data
- "Offline mode" indicator visible
- No errors thrown
- "Last synced" timestamp shown
- Add/edit operations queued

#### Test 3.3: Sync Queue Processing
**Steps**:
1. Go offline
2. Mark 3 answers as mastered (should queue)
3. Go back online
4. Check DevTools Network tab

**Expected Results**:
- Network requests appear for queued items
- Requests include timestamp data
- Server responds with status updates
- Queue clears after successful sync

---

## Phase 3 Integration Tests

### Test Group 4: Analytics Dashboard

#### Test 4.1: Dashboard Load and Charts
**Steps**:
1. Navigate to `/wrong-answers/analytics/dashboard`
2. Wait for data to load

**Expected Results**:
- All 4 KPI cards render:
  - Total Wrong Answers: 145
  - Mastered: 89 (61%)
  - Avg Time Per Question: 3.5m
  - Weekly Reviews: 24
- All charts render without errors:
  - Line chart (mastery progress)
  - Pie chart (source distribution)
  - Bar chart (daily activity)
  - Gradient bar chart (difficulty)
- Tooltips appear on hover
- Charts responsive to window resize

#### Test 4.2: Date Range Filtering
**Steps**:
1. Open analytics dashboard
2. Select date range: last 7 days
3. Click Refresh button
4. Observe charts update

**Expected Results**:
- Date picker functional
- Charts update with filtered data
- KPI cards recalculate
- Performance metric changes reflect new range
- "Last updated" timestamp changes

#### Test 4.3: Performance Metrics
**Steps**:
1. Open analytics dashboard
2. Scroll to performance metrics section

**Expected Results**:
- All 6 metrics visible:
  - Learning Efficiency: 78%
  - Completion Rate: 92%
  - Retention Rate: 87%
  - Avg Review Cycle: 7 days
  - Consistency Score: 85
  - Progress Trend: Steady Improvement
- Descriptions explain each metric
- Color coding for good/poor metrics

---

### Test Group 5: Batch Operations

#### Test 5.1: Open Batch Operation Dialog
**Steps**:
1. Go to `/wrong-answers`
2. Click "Batch Operations" button

**Expected Results**:
- BatchOperationDialog.vue opens
- Operation type selector visible
- Four operation types:
  - Update Status
  - Add Tags
  - Remove Tags
  - Delete Records

#### Test 5.2: Batch Status Update
**Steps**:
1. Open batch dialog
2. Select "Update Status"
3. Select 5 records from list
4. Choose status: "Mastered"
5. Click Apply

**Expected Results**:
- Selected records highlighted
- Confirmation dialog shown
- Progress bar appears
- After completion: "5 / 5 completed"
- Records in list updated
- No page refresh needed

**API Call**:
```
PUT /api/v1/wrong-answers/batch/update-status
{
  "recordIds": [1, 2, 3, 4, 5],
  "status": "mastered"
}
```

#### Test 5.3: Batch Tag Operations
**Steps**:
1. Open batch dialog
2. Select "Add Tags"
3. Select 3 records
4. Enter tags: "重点题", "高优先级"
5. Click Apply

**Expected Results**:
- Tag input shows suggestions
- Tags can be created on-the-fly
- Progress tracking shows completion
- Records now have new tags
- Tag list updated in detail view

#### Test 5.4: Batch Delete with Confirmation
**Steps**:
1. Open batch dialog
2. Select "Delete Records"
3. Select 2 records
4. Click Delete
5. Two-factor confirm

**Expected Results**:
- First confirm: "Are you sure?"
- Second confirm: "This cannot be undone"
- Warning: "2 records will be deleted"
- After deletion: list refreshes
- Records no longer visible

---

### Test Group 6: Recommendation & Weakness Analysis

#### Test 6.1: Top Recommendations
**Steps**:
1. Open `/wrong-answers`
2. Look for recommendation panel

**Expected Results**:
- Top 5 recommended questions visible
- Each shows:
  - Question title
  - Reason tags (新错题, 应复习, etc.)
  - Source badge
  - Difficulty indicator
  - Quick action buttons
- Recommendations scored by algorithm

#### Test 6.2: Weakness Analysis
**Steps**:
1. Open analytics dashboard
2. Scroll to weakness analysis

**Expected Results**:
- Top 3 weakness areas listed
- Each shows:
  - Topic name
  - Mastery rate percentage
  - Improvement potential
  - Recommended study hours
  - Urgency level (紧急/高/中/低)

#### Test 6.3: Generate Local Recommendations
**Steps**:
1. Open recommendation panel
2. Verify recommendations without API

**Expected Results**:
- Recommendations appear instantly (no API delay)
- Algorithm scores visible in DevTools
- Sorting by priority correct
- Reason tags accurate

---

## End-to-End User Workflows

### Workflow 1: Complete Review Session
**Duration**: 5-10 minutes

**Steps**:
1. User logs in
2. Views wrong answers list (30 total)
3. Opens recommendation panel
4. Selects #1 recommended question
5. Views detail (notes, error analysis)
6. Starts review mode
7. Answers 5 questions
8. Completes session
9. Views analytics update

**Success Criteria**:
- All pages load correctly
- Data persists across navigation
- Real-time sync works
- Analytics reflect new activity

### Workflow 2: Bulk Cleanup Operation
**Duration**: 3-5 minutes

**Steps**:
1. User goes to wrong answers list
2. Filters by "Mastered" status
3. Opens batch operations
4. Selects all 20 mastered questions
5. Batch delete with confirmation
6. Verifies deletion
7. Checks analytics update

**Success Criteria**:
- Batch operation completes successfully
- List updates without refresh
- Analytics counts decrease correctly
- No orphaned data in database

### Workflow 3: Offline Sync
**Duration**: 10-15 minutes

**Steps**:
1. Go online, load data
2. Turn off network
3. Open detail view (from cache)
4. Update status twice
5. Add tags to 3 records
6. Go back online
7. Watch sync happen
8. Verify all changes persisted

**Success Criteria**:
- Operations queue while offline
- No errors shown
- Automatic sync on reconnect
- All data eventually consistent

---

## Test Execution Commands

### Start All Services
```bash
# From project root
npm run dev:full

# Or individually:
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd backend && mvn spring-boot:run

# Terminal 3
node mock-server.js
```

### Run Automated Tests (Future)
```bash
# Frontend unit tests
cd frontend
npm run test:unit

# Frontend E2E tests
npm run test:e2e

# Backend tests
cd backend
mvn test
```

### Manual Test Checklist
- [ ] WebSocket connections establish
- [ ] Real-time updates appear immediately
- [ ] Offline mode works correctly
- [ ] Batch operations complete
- [ ] Analytics load without errors
- [ ] Charts render and respond
- [ ] Recommendations are accurate
- [ ] No console errors
- [ ] Memory leaks checked (DevTools)
- [ ] Performance acceptable (<3s load time)

---

## Performance Benchmarks

### Target Metrics
- **Page Load Time**: < 3 seconds
- **WebSocket Connection**: < 500ms
- **Batch Operation** (50 records): < 2 seconds
- **Analytics Calculation**: < 1 second
- **Chart Render**: < 500ms
- **Memory Usage**: < 100MB

### How to Measure
```javascript
// In browser console
performance.mark('start')
// ... perform action ...
performance.mark('end')
performance.measure('duration', 'start', 'end')
console.log(performance.getEntriesByName('duration')[0].duration)
```

---

## Known Issues & Workarounds

### Issue 1: WebSocket Reconnection Delay
**Symptom**: After network disconnects, takes 30+ seconds to reconnect
**Cause**: Exponential backoff: 3s → 6s → 12s → 24s → 48s
**Workaround**: Can be reduced in WebSocketConfig for testing
**Status**: By design (prevents server overload)

### Issue 2: IndexedDB Size Limit
**Symptom**: Error when storing >50MB of data locally
**Cause**: Browser storage quota
**Workaround**: Implement cleanup of old records
**Status**: Expected behavior

### Issue 3: Charts Not Rendering on Slow Networks
**Symptom**: ECharts show blank area
**Cause**: Data arrives before chart initialization
**Workaround**: Wait for data, then init charts
**Status**: Already fixed with `nextTick()`

---

## Sign-Off Checklist

- [ ] Phase 2 WebSocket tests pass (all 3 groups)
- [ ] Phase 2 Review mode tests pass (all 3 groups)
- [ ] Phase 2 Offline cache tests pass (all 3 groups)
- [ ] Phase 3 Analytics tests pass (all 3 groups)
- [ ] Phase 3 Batch operations tests pass (all 4 groups)
- [ ] Phase 3 Recommendations tests pass (all 3 groups)
- [ ] End-to-end workflows all pass (3 workflows)
- [ ] Performance benchmarks met (all targets)
- [ ] No critical console errors
- [ ] No memory leaks detected
- [ ] Accessibility tests pass (WCAG 2.1 AA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## Regression Testing

### Features to Verify (No Breaking Changes)
- [ ] Existing chat functionality unaffected
- [ ] User authentication still works
- [ ] Question bank queries unchanged
- [ ] Achievement system functional
- [ ] Existing API endpoints unchanged
- [ ] Database schema compatible

---

## Deployment Readiness

### Pre-Deployment Checklist
- [ ] All integration tests pass
- [ ] No critical bugs open
- [ ] Documentation complete
- [ ] Performance acceptable
- [ ] Security review passed
- [ ] Database migrations tested
- [ ] Backup strategy in place
- [ ] Rollback plan documented

### Post-Deployment Monitoring
- [ ] Server logs monitored
- [ ] Error tracking (Sentry/etc.)
- [ ] Performance metrics tracked
- [ ] User feedback collected
- [ ] Analytics accuracy verified

---

## Summary

Comprehensive integration testing plan covering:
- ✅ 18 detailed test cases
- ✅ 3 complete user workflows
- ✅ Performance benchmarks
- ✅ Offline functionality
- ✅ Real-time synchronization
- ✅ Batch operations
- ✅ Analytics accuracy
- ✅ Regression testing

**Estimated Test Duration**: 2-4 hours for complete manual testing
**Automation Potential**: 70% (remaining 30% requires UI interaction)

Status: **READY FOR TESTING**
