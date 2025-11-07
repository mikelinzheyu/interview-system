# "再答一次" Button - Complete Routing Flow Diagram

## Visual Flow Diagram

Component Stack:
ReviewActionBar (Button) 
  -> emits 'retry' event 
  -> WrongAnswerReviewRoom (Parent)
  -> @retry="retryAnswer()"
  -> router.push() to ChatRoom
  -> /chat/room/:roomId with query params
  -> ChatRoom component loads
  -> usePracticeMode detects mode='practice'
  -> Shows practice mode banner

## Key Functions

1. ReviewActionBar.vue (Line 12-19):
   - Button emits 'retry' event

2. WrongAnswerReviewRoom.vue (Line 198-222):
   - retryAnswer() gets roomId
   - Calls router.push({ name: 'ChatRoom', params: { roomId }, query: { mode: 'practice' } })

3. Router (router/index.js Line 186-192):
   - /chat/room/:roomId -> ChatRoom.vue

4. usePracticeMode.js (Line 26-44):
   - Detects route.query.mode === 'practice'
   - Sets isPracticeMode = true

5. ChatRoom.vue (Line 6-31):
   - Shows practice-mode-banner if isPracticeMode is true
   - Displays progress tracker

## The Complete Flow

User viewing /wrong-answers/:recordId
  |
  V
Clicks "再答一次" button
  |
  V
ReviewActionBar emits 'retry' event
  |
  V
WrongAnswerReviewRoom.retryAnswer() executes
  |
  +-- Gets targetRoomId from chatStore
  +-- Falls back to roomId = 1 if needed
  |
  V
router.push({
  name: 'ChatRoom',
  params: { roomId: targetRoomId },
  query: { mode: 'practice', recordId: wrongAnswerId }
})
  |
  V
Router resolves 'ChatRoom' to /chat/room/:roomId
  |
  V
Final URL: /chat/room/1?mode=practice&recordId=...
  |
  V
ChatRoom component mounts
  |
  V
usePracticeMode() checks route.query.mode === 'practice'
  |
  V
isPracticeMode = true
  |
  V
Chat Room renders practice-mode-banner
  |
  V
User sees "巩固练习 - 第 1 题" with progress bar
  |
  V
Ready to retry answering the question

## Why This Design

The redirect IS intentional:
- Switches from review interface to practice interface
- Uses query parameters to communicate context
- ChatRoom component handles practice mode logic
- Keeps separation of concerns between components

## Files Involved

File | Lines | Purpose
-----|-------|----------
ReviewActionBar.vue | 12-19 | Button definition
WrongAnswerReviewRoom.vue | 49-54, 198-222 | Button handling, routing
router/index.js | 186-192, 207-213 | Route definitions
usePracticeMode.js | 26-44 | Mode detection
ChatRoom.vue | 6-31 | Practice mode UI

