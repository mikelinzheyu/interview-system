# Phase 2 Quick Start Guide

## Overview
This guide explains how to use the new Phase 2 features in the chat interface.

---

## 1. Dark Mode & Theme Switching

### Accessing Theme Switcher
1. **Location**: TopToolbar (top-right corner, next to other action buttons)
2. **Icon**: Moon icon for dark mode indication
3. **Click**: Single click opens theme menu

### Theme Options
- **Light Mode**: Traditional light theme (white background)
- **Dark Mode**: Professional dark theme (dark background)
- **Auto Mode**: Follows system preference (Windows/macOS dark mode setting)

### Features
- ✅ Smooth theme transitions
- ✅ Theme persists across sessions (saved in localStorage)
- ✅ System preference auto-detection
- ✅ Print mode optimization (always prints in light mode)

### CSS Variables
All components use CSS variables for theming:
```css
--color-bg          /* Background */
--color-text        /* Text color */
--color-border      /* Borders */
--color-primary     /* Primary color */
--color-success     /* Success state */
--color-warning     /* Warning state */
--color-danger      /* Error/danger state */
```

---

## 2. User Presence & Status

### User Status Types
1. **Online** 🟢 - User is active
2. **Away** 🟡 - User is idle but available
3. **Busy** 🔴 - User is in a call or meeting
4. **Do Not Disturb** 🔴 - User prefers not to be interrupted
5. **Offline** ⚪ - User is not connected

### Viewing User Status
1. **In Member List**:
   - Open RightSidebar (info button in TopToolbar)
   - Click "成员" (Members) tab
   - See status indicator next to each member's name
   - Color-coded dots show current status

2. **Status Details**:
   - Click any member to open their profile card
   - View detailed status information
   - See last seen time
   - View user role (if any)

### Profile Card Actions
When you click a member in the sidebar:
- **Send Message**: Start direct conversation
- **Voice Call**: Initiate voice call
- **View Profile**: See full user details
- **Close**: Click X to close dialog

### Online Count
Group details tab shows:
- Total members count
- Current online member count
- Group information

---

## 3. Read Receipts

### Viewing Message Status
Each message shows a status indicator:
- **Sending...** (orange): Message still being sent
- **✓** (gray): Message delivered
- **✓✓** (green): Message read by all

### Opening Read Receipts
1. **Find your message** in the chat
2. **Hover over message** to see status icon
3. **Click the status icon** to open read receipts modal
4. **View**:
   - Who has read the message
   - When they read it
   - Who hasn't read it yet

### Read Receipt Modal Shows
- **Message preview**: The original message content
- **Read statistics**: X people have read, Y haven't
- **Read users list**: Names and timestamps
- **Unread users list**: Who hasn't seen it yet

---

## 4. Advanced Message Search

### Accessing Search
1. **Click search button** in TopToolbar (magnifying glass icon)
2. Search drawer opens on the right side
3. Displays advanced search panel

### Search Methods

#### Basic Search
- **Enter text** in search box
- Results show matching messages
- Click result to navigate to message

#### Advanced Filters
1. **Search Text**: What to search for
2. **Sender**: Filter by specific person
3. **Message Type**: Text, image, file, etc.
4. **Mark Type**: Important, Todo, etc.
5. **Date Range**: From/To dates

#### Advanced Options
- **Search in Code**: Search code block contents
- **Exact Match**: Whole words only
- **Case Sensitive**: Match exact case

### Search Results
Each result shows:
- **Preview**: Message content snippet
- **Sender**: Who sent the message
- **Time**: When it was sent
- **Actions**: Forward, collect, or view

### Result Actions
- **Forward**: Send to another conversation
- **Collect**: Save to your collection
- **View**: Jump to message in chat

---

## 5. Component Integration Map

### TopToolbar
```
┌─────────────────────────────────────┐
│ Group Name | Search Phone Video [Theme🌙] More│
└─────────────────────────────────────┘
                                        ↑
                            ThemeSwitcher here
```

### MessageListNew
```
Message 1  ────────────┬─ Text content
                       ├─ Reactions
                       ├─ Status indicator ← Click for read receipts
                       └─ Timestamp

Message 2  ────────────┬─ Image/File
                       ├─ Download button
                       └─ Status
```

### RightSidebar
```
Tabs: [Members] [Info]

Members Tab:
├─ Member 1 [Status🟢] ← Click for profile
├─ Member 2 [Status🔴] ← Profile card opens
└─ Member 3 [Status⚪]

Info Tab:
├─ Group Name
├─ Total Members: 10
├─ Online Members: 7
├─ Announcement
└─ Created Time
```

### ChatRoom
```
┌──────────────────────────────────┐
│ TopToolbar with ThemeSwitcher    │
├──────────────────────────────────┤
│ MessageListNew │ RightSidebar    │
│ (with status  │ (with status    │
│  indicators)  │  and profile)    │
├──────────────────────────────────┤
│ MessageInputNew                  │
└──────────────────────────────────┘

Search Drawer (hidden, opens on search click)
```

---

## 6. Best Practices

### Theme Usage
- ✅ Use Auto mode to respect user preferences
- ✅ Switch themes for better visibility in different lighting
- ✅ Check dark mode for reduced eye strain in low-light

### User Presence
- ✅ Check member status before messaging important items
- ✅ Use status to understand availability
- ✅ View profiles to get member details before first contact

### Read Receipts
- ✅ Use for important messages to confirm delivery
- ✅ Check who hasn't read yet for follow-ups
- ✅ Respect do-not-disturb status

### Advanced Search
- ✅ Use filters to narrow down large message volumes
- ✅ Search by date for historical information
- ✅ Use marks to organize important messages
- ✅ Collect important items for later reference

---

## 7. Keyboard Shortcuts (Future)

Currently available:
- **TopToolbar**: Click buttons directly
- **Search**: Click search button to open

Future enhancements:
- Ctrl/Cmd + K for search
- Ctrl/Cmd + Shift + T for theme toggle
- Tab navigation for accessibility

---

## 8. Accessibility

### Dark Mode
- Automatically adjusts colors for readability
- Respects system preference
- Reduces eye strain in dark environments

### User Status
- Color-coded but also labeled in text
- Status information in multiple locations
- Clear visual indicators

### Read Receipts
- Modal shows all information clearly
- Timestamp and user names visible
- Easy to close dialog

---

## 9. Troubleshooting

### Theme not persisting?
- Check browser localStorage is enabled
- Try clearing browser cache
- Reload page after changing theme

### Status not showing?
- Ensure user presence store is initialized
- Check network connection for real-time updates
- Refresh page to reload status

### Read receipts not visible?
- Click on message status indicator (not the message itself)
- Ensure message is yours (sent messages only)
- Check if recipients have read the message

### Search not working?
- Ensure at least 2 characters in search
- Check filters are not too restrictive
- Try clearing filters and searching again

---

## 10. Performance Tips

### For Optimal Performance
- ✅ Use Dark mode in low-light environments
- ✅ Close search drawer when not in use
- ✅ Limit visible members to 100+ (use scroll)
- ✅ Clear browser cache periodically

### Network Usage
- Real-time features require WebSocket (when implemented)
- Search is client-side (no network delay)
- Theme switching is instant (CSS variables)

---

## 11. Integration with Existing Features

### Works With
- ✅ Message reactions (emoji reactions)
- ✅ Message forwarding
- ✅ Message collection
- ✅ Message marking (important, todo)
- ✅ Message recall/delete
- ✅ File/image sharing
- ✅ Typing indicators
- ✅ Conversation threads

### Does Not Conflict With
- ✅ Existing chat functionality
- ✅ User authentication
- ✅ Message persistence
- ✅ Group management

---

## 12. API Endpoints (Future Integration)

### Read Receipts API
```
POST /api/messages/:messageId/read-receipts
GET /api/messages/:messageId/read-receipts
```

### User Presence API
```
POST /api/users/:userId/presence
GET /api/users/:userId/presence
GET /api/users/online-list
```

### Search API
```
POST /api/search/messages
GET /api/search/suggestions
```

---

## 13. Common Tasks

### Task 1: Switch to Dark Mode
1. Click theme icon (🌙) in TopToolbar
2. Click "Dark Mode" option
3. Interface updates immediately

### Task 2: Check if Someone Read Your Message
1. Find your message in chat
2. Hover to show status icon
3. Click green ✓ icon
4. Modal shows who read when

### Task 3: Search Messages from Specific Person
1. Click search button
2. Enter name in "Sender" filter
3. Enter search text (optional)
4. View results

### Task 4: View Member Profile
1. Click "Info" then "成员" (Members) in RightSidebar
2. Click any member
3. Profile card opens with details
4. Click "Close" or outside to close

---

## 14. Feature Roadmap

### Currently Implemented ✅
- Theme switching (light/dark/auto)
- User status indicators
- User profile cards
- Read receipt tracking
- Advanced message search
- Dark mode CSS system

### Coming Soon 🚀
- Real-time presence updates (WebSocket)
- Real-time read receipt sync
- Link preview metadata
- Search result pagination
- User profile quick preview on hover
- Presence status animations

---

## 15. Support & Feedback

For questions or issues:
1. Check the troubleshooting section
2. Review the integration report
3. Check browser console for errors
4. Ensure latest version is installed

---

**Last Updated**: November 12, 2025
**Phase**: Phase 2 - 体验优化
**Status**: Ready for Production
