# P2B Quick Reference Guide
## Knowledge Graph Visualization - Fast Implementation

**Last Updated**: 2025-11-01
**Status**: ✅ Ready for Integration

---

## 🎯 What's New in P2B

**Interactive knowledge graph** showing:
- Domain relationships and prerequisites
- Learning paths between domains
- Time estimates for paths
- Prerequisite chains and complementary domains
- Visual timeline of learning sequence

---

## 📦 Key Files

| File | Location | Purpose | Size |
|------|----------|---------|------|
| knowledgeGraphService | `src/services/knowledgeGraphService.js` | Graph algorithms | 600+ lines |
| KnowledgeTreeVisualization | `src/components/KnowledgeTreeVisualization.vue` | Graph display | 450+ lines |
| LearningPathRecommendation | `src/components/LearningPathRecommendation.vue` | Path timeline | 500+ lines |

---

## ⚡ Quick Start

### 1. Add Components to Template
```vue
<template>
  <!-- Knowledge Graph Visualization -->
  <KnowledgeTreeVisualization />

  <!-- Learning Path Recommendation -->
  <LearningPathRecommendation />
</template>

<script setup>
import KnowledgeTreeVisualization from '@/components/KnowledgeTreeVisualization.vue'
import LearningPathRecommendation from '@/components/LearningPathRecommendation.vue'
</script>
```

### 2. Ensure Domain Data Has Prerequisites
```javascript
{
  id: 1,
  name: 'JavaScript',
  prerequisites: [2, 3],        // IDs of domains that must come first
  relatedDomains: [4, 5],       // Complementary domains
  difficulty: 'beginner',       // NEW
  timeRequired: 40,             // NEW
  // ... other fields
}
```

### 3. Install ECharts (if needed)
```bash
npm install echarts
```

---

## 🔧 Service API

### Build Knowledge Graph
```javascript
import knowledgeGraphService from '@/services/knowledgeGraphService'

const graph = knowledgeGraphService.buildKnowledgeGraph(domains)
// Returns: { nodes, edges, adjacencyList, ... }
```

### Find Learning Path
```javascript
const path = knowledgeGraphService.findLearningPath(
  startDomainId,    // e.g., 1
  targetDomainId,   // e.g., 5
  graph
)
// Returns: { domains, totalTime, difficulty, transitions, description }
```

### Get Prerequisite Chain
```javascript
const prereqs = knowledgeGraphService.getPrerequisiteChain(
  domainId,
  graph
)
// Returns: Array of prerequisite domains (recursive)
```

### Get Complementary Domains
```javascript
const complements = knowledgeGraphService.getComplementaryDomains(
  domainId,
  graph
)
// Returns: Array of { domain, strength, type } objects
```

### Calculate Mastery Time
```javascript
const time = knowledgeGraphService.calculateMasteryTime(path)
// Returns: { totalHours, optimistic, realistic, pessimistic, completionDate }
```

---

## 🎨 Component Usage

### KnowledgeTreeVisualization
```vue
<KnowledgeTreeVisualization />

<!-- Features:
  - Interactive tree and force-directed layouts
  - Click nodes to see details
  - Search and filter domains
  - View prerequisites and complementary domains
  - Select domain to start learning
-->
```

### LearningPathRecommendation
```vue
<LearningPathRecommendation />

<!-- Features:
  - Select start and target domains
  - Auto-generate optimal path
  - View timeline with steps
  - See time estimates (3 scenarios)
  - Download and share path
-->
```

---

## 📊 Data Structures

### Learning Path Object
```javascript
{
  domains: [
    { id: 1, name: 'JavaScript', ... },
    { id: 2, name: 'React', ... }
  ],
  totalTime: 100,           // Total hours
  difficulty: 'Intermediate',
  description: '3步学习路径 • 100小时 • Intermediate难度',
  stepCount: 3
}
```

### Mastery Time
```javascript
{
  totalHours: 100,
  optimistic: 7,            // weeks at high pace
  realistic: 14,            // weeks at recommended pace
  pessimistic: 20,          // weeks at low pace
  recommendedWeeklyHours: 7,
  completionDate: Date
}
```

---

## 🧮 Algorithm Summary

### Path Finding: BFS
- Finds **shortest** learning path
- Complexity: O(V + E)
- Handles disconnected graphs

### Prerequisites: Recursive DFS
- Finds **all** prerequisites (transitive)
- Returns ordered chain
- Prevents cycles

### Time Estimation
```
totalHours = sum(domain.timeRequired for each domain)

weeks = totalHours / (hours per week)
- Optimistic: 15h/week
- Realistic: Based on difficulty
- Pessimistic: 5h/week
```

---

## 🔍 Common Use Cases

### Case 1: View Domain Relationships
```javascript
// User clicks on domain in knowledge graph
// Component shows:
// - Prerequisites (must learn first)
// - Complementary (learn together)
// - Advanced (next topics)
```

### Case 2: Generate Learning Path
```javascript
// User selects start: "JavaScript"
// User selects target: "Full Stack Development"
// System generates optimal path with time estimate
```

### Case 3: Track Progress
```javascript
// User completes a domain
store.markDomainAsCompleted(domainId)
// Recommendation updates automatically
```

### Case 4: Download Path
```javascript
// User clicks "Download"
// Path exported as JSON with all details
// Can be imported later or shared
```

---

## 📱 Responsive Layout

| Screen | Layout |
|--------|--------|
| Desktop (>1400px) | 2-column (graph + path) |
| Tablet (768-1400px) | 1-column with tabs |
| Mobile (<768px) | Full-width stacked |

---

## ⚙️ Configuration

### Adjust Graph Layout
```javascript
knowledgeGraphService.generateVisualizationData(graph, {
  layout: 'tree',        // or 'force'
  colorScheme: 'default',
  maxLevels: 5
})
```

### Time Estimation Pace
Edit knowledgeGraphService.js `_calculateOptimalPaceHours()`:
```javascript
const difficulties = {
  beginner: 3,      // hours per week
  intermediate: 5,
  advanced: 8
}
```

---

## 🐛 Common Issues

### Issue: Graph not displaying
**Solution**: Verify ECharts is installed: `npm install echarts`

### Issue: No paths found between domains
**Solution**: Add prerequisites/relatedDomains to domain data

### Issue: Slow graph rendering
**Solution**: Reduce number of edges or use simplified view

### Issue: Components not updating
**Solution**: Ensure `store.markDomainAsCompleted()` is called

---

## 🧪 Quick Tests

### Test 1: Graph Building
```javascript
const graph = knowledgeGraphService.buildKnowledgeGraph(domains)
console.log(graph.nodes.length, graph.edges.length)
// ✅ Should show domain count and relationship count
```

### Test 2: Path Finding
```javascript
const path = knowledgeGraphService.findLearningPath(1, 5, graph)
console.log(path.domains.map(d => d.name))
// ✅ Should show step-by-step domains
```

### Test 3: Time Calculation
```javascript
const time = knowledgeGraphService.calculateMasteryTime(path)
console.log(time.realistic, 'weeks')
// ✅ Should show realistic completion time
```

---

## 📊 Integration Checklist

- [ ] knowledgeGraphService.js exists
- [ ] KnowledgeTreeVisualization.vue exists
- [ ] LearningPathRecommendation.vue exists
- [ ] ECharts installed
- [ ] Domain data includes prerequisites
- [ ] Components imported in parent page
- [ ] Graph renders without errors
- [ ] Path generation works
- [ ] Responsive design tested

---

## 📖 Reference

### Methods Overview

**Service Methods**:
- `buildKnowledgeGraph()` - Create graph from domains
- `findLearningPath()` - Get shortest path
- `getPrerequisiteChain()` - Get all prerequisites
- `getComplementaryDomains()` - Get related domains
- `getAdvancedTopics()` - Get next level domains
- `calculateMasteryTime()` - Get time estimates
- `generateVisualizationData()` - Format for ECharts
- `searchDomains()` - Find domains by query
- `getGraphStatistics()` - Get graph metrics

**Component Events**: None (uses store directly)

**Component Props**: None (uses store directly)

---

## 🚀 Performance Tips

1. **Lazy Load**: Load components only when needed
2. **Memoize**: Cache common path queries
3. **Limit Edges**: Show top 50 edges in graph visualization
4. **Debounce**: Search input on typing
5. **Precompute**: Build graph once on app start

---

## 🎓 Next: Phase 2C

**Collection & Favorites System**
- Create domain collections
- Save learning plans
- Share collections

**Timeline**: Next session
**Technology**: Pinia store + localStorage

---

**P2B Status**: ✅ **COMPLETE & READY**
**Recommended Next**: Integrate into application
