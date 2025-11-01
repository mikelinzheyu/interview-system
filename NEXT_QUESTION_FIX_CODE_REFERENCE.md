# 下一题功能修复 - 代码参考指南

## 修改总览

文件: `frontend/src/views/interview/AIInterviewSession.vue`

**修改内容:**
1. 新增2个状态变量 (第468-469行)
2. 新增1个计算属性 (第595-597行)
3. 重写1个方法 (第696-819行)
4. 新增2个方法 (第822-863行)
5. 更新模板3处 (第179-180, 198, 282行)
6. 导出更新 (第1578-1597行)

---

## 详细代码变更

### 1️⃣ 新增状态变量 (第468-469行)

**位置**: `<script setup>` 中定义响应式数据的地方

```javascript
// 添加到现有的 ref 定义中

// 题目队列管理
const currentQuestionIndex = ref(0)      // 当前题目在队列中的索引 (0-4)
const questionQueue = ref([])             // 题目队列（从Dify工作流获取的5道题）
```

**作用**:
- `currentQuestionIndex`: 追踪用户当前在浏览第几道题 (0表示第1题)
- `questionQueue`: 存储从Dify工作流获取的全部5道题目

---

### 2️⃣ 新增计算属性 (第595-597行)

**位置**: 在其他计算属性定义之后

```javascript
// 是否还有更多题目
const hasMoreQuestions = computed(() => {
  return currentQuestionIndex.value < questionQueue.value.length - 1
})
```

**逻辑解析**:
- 如果当前索引 < (队列长度 - 1)，表示还有更多题目
- 例如：索引0-3有更多题 → true
- 例如：索引4(最后一题) → false

**使用场景**:
```javascript
if (hasMoreQuestions.value) {
  // 显示下一题
} else {
  // 生成新题
}
```

---

### 3️⃣ 重写方法: generateNewQuestion (第696-819行)

#### 完整代码:

```javascript
// 生成新问题（获取一批5道题目）
const generateNewQuestion = async () => {
  questionLoading.value = true
  hasError.value = false

  try {
    // 构建智能问题生成请求参数
    const requestParams = {
      position: getUserPosition(), // 获取用户职位偏好
      level: getUserLevel(),       // 获取用户技术水平
      skills: getUserSkills(),     // 获取用户技能列表
      previousQuestions: interviewSession.questions.map(q => q.id),
      includeMetadata: true,
      includeDifficulty: true
    }

    console.log('发起智能问题生成请求:', requestParams)

    // 优先使用智能问题生成API，失败则降级
    let result
    try {
      result = await aiAnalysisService.generateQuestionSmart(requestParams)
    } catch (smartError) {
      console.warn('智能问题生成失败，降级到传统方法:', smartError)
      result = await aiAnalysisService.generateQuestion(requestParams)
    }

    if (result.success && result.data) {
      const questionData = result.data

      // 验证必需字段
      if (!questionData.question) {
        throw new Error('后端返回的题目文本为空')
      }

      // 更新会话信息
      interviewSession.sessionId = questionData.sessionId || `session-${Date.now()}`
      interviewSession.jobTitle = questionData.jobTitle || selectedProfession.value

      // ⭐ 关键改进: 处理题目队列
      let questionsToUse = []

      if (questionData.allQuestions && Array.isArray(questionData.allQuestions) && questionData.allQuestions.length > 0) {
        // Dify工作流返回的5道题目
        questionsToUse = questionData.allQuestions
        interviewSession.allQuestions = questionData.allQuestions
        console.log(`✅ 从Dify工作流获取${questionData.allQuestions.length}道题目`)
      } else {
        // 只有当前题目
        questionsToUse = [questionData]
      }

      // 清空题目队列并重新填充
      questionQueue.value = questionsToUse.map((q, index) => {
        return {
          id: q.questionId || q.id || `q_${index}_${Date.now()}`,
          question: q.question,
          expectedAnswer: q.expectedAnswer || q.answer || '',
          keywords: q.keywords || q.tags || [],
          category: q.category || q.categoryId || selectedProfession.value,
          difficulty: q.difficulty || selectedDifficulty.value,
          generatedBy: q.generatedBy || 'dify_workflow',
          confidenceScore: q.confidenceScore || 0.9,
          smartGeneration: true,
          profession: selectedProfession.value,
          searchSource: q.searchSource || 'dify_rag',
          sourceUrls: q.sourceUrls || [],
          workflowId: result.metadata?.workflowRunId,
          sessionId: questionData.sessionId || interviewSession.sessionId,
          hasAnswer: q.hasAnswer !== undefined ? q.hasAnswer : true,
          explanation: q.explanation,
          estimatedTime: q.estimatedTime
        }
      })

      // 重置索引到第一题
      currentQuestionIndex.value = 0
      currentQuestion.value = questionQueue.value[0]

      // 添加到会话questions（用于回答记录）
      questionQueue.value.forEach(q => {
        const exists = interviewSession.questions.find(item => item.id === q.id)
        if (!exists) {
          interviewSession.questions.push(q)
        }
      })

      if (interviewSession.questions.length > 0 && interviewSession.status !== 'active') {
        startTimer()
        interviewSession.startTime = new Date()
        interviewSession.status = 'active'
      }

      const processingTime = result.metadata?.processingTime || 0
      ElMessage.success({
        message: `🎉 获取${questionQueue.value.length}道题目成功! (处理时间: ${processingTime}ms)`,
        duration: 3000
      })

      console.log('题目队列初始化:', {
        count: questionQueue.value.length,
        current: currentQuestion.value
      })

    } else {
      throw new Error(result.message || result.error || '生成问题失败')
    }
  } catch (err) {
    error.value = err.message || '生成问题失败'
    hasError.value = true

    // 如果所有方法都失败，使用默认问题
    if (questionQueue.value.length === 0) {
      const defaultQ = getDefaultQuestion()
      questionQueue.value = [defaultQ]
      currentQuestionIndex.value = 0
      currentQuestion.value = defaultQ
      ElMessage.warning('使用默认问题，请检查网络连接')
    } else {
      ElMessage.error(error.value)
    }
  } finally {
    questionLoading.value = false
  }
}
```

#### 关键改动说明:

**旧逻辑问题**:
```javascript
// ❌ 之前: 只使用单个问题
currentQuestion.value = questionData.question
```

**新逻辑**:
```javascript
// ✅ 现在: 检查是否有5道题，有的话全部使用
if (questionData.allQuestions && Array.isArray(...)) {
  questionsToUse = questionData.allQuestions  // 获取全部5道
} else {
  questionsToUse = [questionData]              // 降级到单个
}

// ✅ 将题目标准化并存入队列
questionQueue.value = questionsToUse.map(q => ({...}))

// ✅ 重置索引为0（从第1题开始）
currentQuestionIndex.value = 0

// ✅ 显示成功信息
ElMessage.success(`🎉 获取${questionQueue.value.length}道题目成功!`)
```

---

### 4️⃣ 新增方法: handleNextQuestion (第822-830行)

```javascript
// 下一题处理函数（新增）
const handleNextQuestion = async () => {
  if (hasMoreQuestions.value) {
    // 如果还有更多题目，直接显示下一道
    await showNextQuestion()
  } else {
    // 如果没有更多题目，生成新一批题目
    await generateNewQuestion()
  }
}
```

#### 逻辑流程:

```
用户点击"下一题"
  ↓
检查 hasMoreQuestions
  ├─ true  → 调用 showNextQuestion()  → 从队列显示下一道题
  └─ false → 调用 generateNewQuestion() → 生成新的5道题
```

#### 使用示例:

```javascript
// 在模板中
<el-button @click="handleNextQuestion">
  {{ hasMoreQuestions ? '下一题' : '生成新题' }}
</el-button>
```

---

### 5️⃣ 新增方法: showNextQuestion (第833-863行)

```javascript
// 显示下一题（从队列中取）
const showNextQuestion = async () => {
  // 先保存当前题目的答案
  if (finalTranscript.value && currentQuestion.value) {
    const alreadySaved = interviewSession.answers.find(
      a => a.questionId === currentQuestion.value.id
    )
    if (!alreadySaved) {
      // 如果还没有分析，提示先分析
      if (!analysisResult.value) {
        ElMessage.warning('请先分析当前题目的回答后再进入下一题')
        return
      }
    }
  }

  // 清空当前回答数据
  finalTranscript.value = ''
  interimTranscript.value = ''
  analysisResult.value = null

  // 显示下一题
  currentQuestionIndex.value++
  if (currentQuestionIndex.value < questionQueue.value.length) {
    currentQuestion.value = questionQueue.value[currentQuestionIndex.value]
    ElMessage.success({
      message: `📝 已切换到第 ${currentQuestionIndex.value + 1} 题`,
      duration: 2000
    })
    console.log(`切换到第 ${currentQuestionIndex.value + 1} 题:`, currentQuestion.value.question)
  }
}
```

#### 执行步骤:

1. **验证用户分析** - 检查是否有 `analysisResult`
2. **清空状态** - 清除 `finalTranscript`, `interimTranscript`, `analysisResult`
3. **增加索引** - `currentQuestionIndex++`
4. **更新显示** - 从队列获取下一道题
5. **提示用户** - 显示"已切换到第 X 题"

---

### 6️⃣ 模板更新

#### 更新1: 进度显示 (第179-180行)

**位置**: 题目卡片的标签区域

**代码**:
```vue
<el-tag v-if="questionQueue.length > 0" size="small" type="info">
  第 {{ currentQuestionIndex + 1 }} / {{ questionQueue.length }} 题
</el-tag>
```

**说明**:
- 只有当队列有题目时才显示
- 显示当前进度: "第 1 / 5 题"、"第 2 / 5 题" 等

#### 更新2: 按钮文本 (第198行)

**位置**: "下一题"按钮

**代码**:
```vue
{{ hasMoreQuestions ? '下一题' : '生成新题' }}
```

**逻辑**:
- 有更多题目 → 显示"下一题"
- 没有更多题目 → 显示"生成新题"

#### 更新3: 计数显示 (第282行)

**位置**: 题目面板的信息区域

**代码**:
```vue
<div v-if="questionQueue.length > 0" class="question-counter">
  已回答 {{ interviewSession.answers.length }} / {{ questionQueue.length }} 题
</div>
```

**说明**:
- 显示已回答题数和总题数
- 帮助用户了解进度

---

### 7️⃣ 导出更新 (第1578-1597行)

**位置**: `return { ... }` 对象

**添加的导出**:
```javascript
return {
  // ... 其他导出 ...

  // 题目队列相关
  currentQuestionIndex,      // 当前题目索引
  questionQueue,             // 题目队列
  hasMoreQuestions,          // 是否有更多题目

  // 方法
  handleNextQuestion,        // 智能下一题处理
  showNextQuestion,          // 队列导航方法

  // ... 其他导出 ...
}
```

---

## 核心变更总结表

| 组件 | 修改类型 | 行数 | 说明 |
|------|---------|------|------|
| 状态 | 新增 | 468-469 | currentQuestionIndex, questionQueue |
| 计算 | 新增 | 595-597 | hasMoreQuestions |
| 方法 | 重写 | 696-819 | generateNewQuestion |
| 方法 | 新增 | 822-830 | handleNextQuestion |
| 方法 | 新增 | 833-863 | showNextQuestion |
| 模板 | 修改 | 179-180 | 进度标签 |
| 模板 | 修改 | 198 | 按钮文本 |
| 模板 | 修改 | 282 | 计数显示 |
| 导出 | 修改 | 1578-1597 | 添加新变量和方法到return对象 |

---

## 执行流程图

### 生成新题流程

```
用户点击"智能生成题目"
    ↓
generateNewQuestion()
    ↓
发送API请求到 /api/ai/generate-questions
    ↓
Dify工作流返回5道题目
    ↓
提取 allQuestions 数组
    ↓
遍历映射到标准对象格式
    ↓
存入 questionQueue
    ↓
重置 currentQuestionIndex = 0
    ↓
显示第1题 + 成功提示
    ↓
按钮文本: "下一题" (因为还有4道题)
```

### 点击下一题流程

```
用户点击"下一题"
    ↓
handleNextQuestion()
    ↓
检查 hasMoreQuestions
    ├─ true
    │   ↓
    │   showNextQuestion()
    │   ↓
    │   验证已分析 → 清空状态 → 索引++ → 显示下一题
    │   ↓
    │   提示: "已切换到第 X 题"
    │
    └─ false
        ↓
        generateNewQuestion()
        ↓
        获取新的5道题 → 重置为第1题
        ↓
        提示: "获取5道题目成功!"
```

---

## 调试技巧

### 浏览器控制台输出

修复后应该在控制台看到以下日志:

```javascript
// 生成新题时
"✅ 从Dify工作流获取5道题目"
"题目队列初始化:" { count: 5, current: {...} }
"🎉 获取5道题目成功! (处理时间: 123ms)"

// 导航时
"切换到第 2 题: How do you optimize React performance?"
"📝 已切换到第 2 题"
```

### 检查状态值

```javascript
// 在浏览器控制台执行
console.log('currentQuestionIndex:', currentQuestionIndex.value)    // 应为 0-4
console.log('questionQueue.length:', questionQueue.value.length)    // 应为 5
console.log('hasMoreQuestions:', hasMoreQuestions.value)            // true/false
console.log('currentQuestion:', currentQuestion.value)              // 显示当前题目对象
```

---

## 常见问题解决

### Q: 点击下一题没反应
**检查清单**:
1. 是否有分析当前题目? (必须)
2. 队列是否为空? (不应该为空)
3. 索引是否超出范围? (应该 < 5)

```javascript
// 在控制台检查
if (!analysisResult.value) {
  console.log('❌ 需要先分析当前题目')
}
if (questionQueue.value.length === 0) {
  console.log('❌ 队列为空')
}
if (currentQuestionIndex.value >= questionQueue.value.length) {
  console.log('❌ 索引越界')
}
```

### Q: 题目队列为空
**解决方案**:
1. 检查API是否返回 `allQuestions`
2. 检查Dify工作流配置
3. 查看网络请求响应

```javascript
// 在API响应后检查
console.log('API Response:', result.data)
console.log('allQuestions:', result.data.allQuestions)
```

### Q: 进度显示不正确
**检查清单**:
1. `currentQuestionIndex` 是否正确增加?
2. `questionQueue` 是否有正确的题目数?

```javascript
// 添加日志确认
console.log(`当前: ${currentQuestionIndex.value + 1} / ${questionQueue.value.length}`)
```

---

## 性能对标

| 指标 | 修复前 | 修复后 | 改进 |
|------|--------|--------|------|
| API调用/次 | 1题1次 | 5题1次 | ⬇️ 80% |
| 网络流量 | 5倍 | 1倍 | ⬇️ 80% |
| 客户端状态变量 | 1个 | 3个 | ⬆️ 3倍 |
| 模板更新 | 3处 | 3处 | 无变 |
| 方法数 | 1个 | 3个 | ⬆️ 3倍 |

---

## 版本日志

**v1.0.0 (2024-10-27)**
- ✅ 实现题目队列管理系统
- ✅ 智能下一题导航逻辑
- ✅ 进度显示和按钮文本动态更新
- ✅ 用户体验优化

---

**这是完整的代码参考指南，所有修改已验证并可直接应用。**
