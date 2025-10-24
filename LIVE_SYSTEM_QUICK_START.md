# 🚀 Live System - Quick Start Guide

**Status**: ✅ **OPERATIONAL** - Ready for testing
**Last Updated**: 2025-10-24T08:40:00Z

---

## ⚡ Start the System (3 Steps)

### Step 1: Start Backend
```bash
cd D:\code7\interview-system\backend
node mock-server.js
```
✅ Wait for: `🚀 Mock API服务器已启动`

### Step 2: Start Frontend
```bash
cd D:\code7\interview-system\frontend
npm run dev
```
Or:
```bash
node node_modules/vite/bin/vite.js
```
✅ Wait for: `Local: http://localhost:5174`

### Step 3: Open Browser
Visit: **http://localhost:5174**

---

## 🧪 Quick API Tests

### Test Backend Health
```bash
curl http://localhost:3001/api/health
```
Expected: `"status": "UP"`

### Test Frontend Access
```bash
curl http://localhost:5174
```
Expected: HTML page loads

### Test Dify Integration
```bash
curl -X POST http://localhost:3001/api/ai/dify-workflow \
  -H "Content-Type: application/json" \
  -d '{"requestType":"generate_questions","jobTitle":"Java开发"}'
```

---

## 📊 System Architecture

```
User Browser (http://localhost:5174)
        ↓ HTTP/REST
Vue.js Frontend
        ↓ API Calls (/api/ai/dify-workflow)
Node.js Backend (http://localhost:3001)
        ↓ HTTPS
Dify Workflows API
        ↓ (via ngrok tunnel)
External Services
```

---

## 🔧 Current Configuration

| Component | URL | Status | Notes |
|-----------|-----|--------|-------|
| **Frontend** | http://localhost:5174 | ✅ Running | Vite dev server |
| **Backend** | http://localhost:3001 | ✅ Running | Mock API server |
| **Dify Workflow1** | ID: `560EB9DDSwOFc8As` | ⚠️ Issue | Returns 0 questions |
| **Dify Workflow2** | ID: `5X6RBtTFMCZr0r4R` | ⏳ Untested | - |
| **Dify Workflow3** | ID: `7C4guOpDk2GfmIFy` | ⏳ Untested | - |
| **Redis** | localhost:6379 | ❌ Optional | Not running |

---

## 🐛 Known Issue: Empty Questions

**Status**: 🔴 **BLOCKING**

**Symptom**: Dify returns 0 questions

**API Response**:
```json
{
  "code": 200,
  "message": "调用成功",
  "data": {
    "session_id": "",
    "generated_questions": [],
    "metadata": {
      "workflowId": "...",
      "processingTime": 0
    }
  }
}
```

**Root Cause**: Dify Workflow1 not configured correctly

**Solution**:
1. Go to Dify Console
2. Open Workflow1: `560EB9DDSwOFc8As`
3. Check workflow configuration
4. Verify output variables
5. Test directly in Dify UI
6. See `WORKFLOW1_DEBUG_GUIDE.md` for details

---

## ✅ What's Fixed This Session

- ✅ Backend API endpoint format (using `/workflows/run`)
- ✅ Output variable parsing (`questions` variable name)
- ✅ JSON string to array conversion
- ✅ Both servers operational
- ✅ API communication working

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `backend/mock-server.js` | Backend API server |
| `frontend/src/main.js` | Frontend entry point |
| `WORKFLOW1_DEBUG_GUIDE.md` | Debug Workflow1 issue |
| `SESSION_COMPLETION_REPORT_FINAL.md` | Full session report |
| `SYSTEM_STATUS_LIVE.md` | System configuration & APIs |

---

## 🎯 Next Steps

1. **Fix Dify Workflow1**
   - Debug in Dify console
   - Verify questions are generated
   - Test in Dify UI

2. **Test Workflow2 & Workflow3**
   - Similar fix pattern as Workflow1
   - Use test files for validation

3. **Test End-to-End in Browser**
   - Open http://localhost:5174
   - Enter job title
   - Verify flow works

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port
netstat -ano | grep :3001

# Kill process (Windows)
taskkill /PID <PID> /F
```

### Backend Won't Start
- Check if port 3001 is free
- Check Node.js is installed: `node --version`
- Check dependencies: `npm install` in backend folder

### Frontend Won't Load
- Check Vite is installed: `npm list vite`
- Try different port: `npm run dev -- --port 5175`
- Check no other process on port 5174

### API Returns 500 Error
- Check backend logs for error messages
- Check Dify API keys are correct
- Check internet connection (calls Dify API)

---

## 📞 Commands Reference

```bash
# Start backend
cd backend && node mock-server.js

# Start frontend
cd frontend && npm run dev

# Test API
curl http://localhost:3001/api/health

# View backend logs (already in console)
# Backend outputs to same terminal

# Kill Node process (if stuck)
powershell -Command "Get-Process node | Stop-Process -Force"
```

---

## 🎯 Final Status

| Aspect | Status | Details |
|--------|--------|---------|
| **Backend** | ✅ OK | Running, API responding |
| **Frontend** | ✅ OK | Server running, HTML loads |
| **Integration** | ✅ OK | API calls working |
| **Dify API** | ✅ OK | Responding to requests |
| **Question Gen** | ⚠️ Issue | Workflow returns 0 questions |

**Overall**: System is **OPERATIONAL** - API integration working. Need to fix Dify Workflow1 to complete.

---

**Report**: 2025-10-24
**Time**: ~50 minutes
**Status**: Ready for Dify debugging
