/**
 * 模拟存储服务 - 用于测试 Dify 工作流
 * 实现与 Spring Boot 存储服务相同的 API
 */

const express = require('express');
const app = express();
const PORT = 8080;

// 存储会话数据（内存存储）
const sessions = new Map();

// API Key 验证
const VALID_API_KEY = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

// 中间件
app.use(express.json({ limit: '10mb' }));

// API Key 认证中间件
app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  if (token !== VALID_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
});

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// API 端点
// ========================================

/**
 * POST /api/sessions
 * 保存会话数据
 */
app.post('/api/sessions', (req, res) => {
  try {
    const session = req.body;

    if (!session.sessionId) {
      return res.status(400).json({ error: 'Missing required field: sessionId' });
    }

    if (!session.questions && !session.qaData) {
      return res.status(400).json({
        error: 'Missing required fields: questions or qaData'
      });
    }

    // 添加时间戳
    session.createdAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    // 保存到内存
    sessions.set(session.sessionId, session);

    console.log(`✅ 保存会话: ${session.sessionId}`);
    console.log(`   - 职位: ${session.jobTitle || 'N/A'}`);
    console.log(`   - 问题数: ${session.questions?.length || session.qaData?.length || 0}`);

    const response = {
      success: true,
      sessionId: session.sessionId,
      message: 'Session saved successfully',
      expires_in_days: 7
    };

    if (session.questions) {
      response.question_count = session.questions.length;
      response.job_title = session.jobTitle;
      response.status = session.status;
    } else if (session.qaData) {
      response.qa_count = session.qaData.length;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('❌ 保存会话失败:', error);
    res.status(500).json({
      error: 'Failed to save session: ' + error.message
    });
  }
});

/**
 * GET /api/sessions/:sessionId
 * 获取会话数据或特定问题
 */
app.get('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { question } = req.query;

    const session = sessions.get(sessionId);

    if (!session) {
      console.log(`❌ 会话不存在: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    // 如果请求特定问题
    if (question) {
      // 在新格式中查找
      if (session.questions) {
        const q = session.questions.find(q => q.question === question);
        if (q) {
          console.log(`✅ 返回问题: ${question.substring(0, 50)}...`);
          return res.json({
            session_id: sessionId,
            question: q.question,
            answer: q.answer,
            has_answer: q.hasAnswer,
            question_id: q.id
          });
        }
      }

      // 在旧格式中查找
      if (session.qaData) {
        const qa = session.qaData.find(qa => qa.question === question);
        if (qa) {
          return res.json({
            session_id: sessionId,
            question: question,
            answer: qa.answer
          });
        }
      }

      return res.status(404).json({ error: 'Question not found in session' });
    }

    // 返回整个会话
    console.log(`✅ 返回完整会话: ${sessionId}`);
    res.json(session);
  } catch (error) {
    console.error('❌ 获取会话失败:', error);
    res.status(500).json({
      error: 'Failed to get session: ' + error.message
    });
  }
});

/**
 * GET /api/sessions/:sessionId/questions/:questionId
 * 根据 questionId 获取问题详情
 */
app.get('/api/sessions/:sessionId/questions/:questionId', (req, res) => {
  try {
    const { sessionId, questionId } = req.params;

    const session = sessions.get(sessionId);

    if (!session) {
      console.log(`❌ 会话不存在: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.questions) {
      return res.status(404).json({ error: 'No questions in this session' });
    }

    const question = session.questions.find(q => q.id === questionId);

    if (!question) {
      console.log(`❌ 问题不存在: ${questionId}`);
      return res.status(404).json({ error: 'Question not found' });
    }

    console.log(`✅ 返回问题: ${questionId}`);
    res.json({
      id: question.id,
      question: question.question,
      answer: question.answer,
      hasAnswer: question.hasAnswer
    });
  } catch (error) {
    console.error('❌ 获取问题失败:', error);
    res.status(500).json({
      error: 'Failed to get question: ' + error.message
    });
  }
});

/**
 * PUT /api/sessions/:sessionId/questions/:questionId
 * 更新问题的答案
 */
app.put('/api/sessions/:sessionId/questions/:questionId', (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const { answer, hasAnswer } = req.body;

    const session = sessions.get(sessionId);

    if (!session) {
      console.log(`❌ 会话不存在: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.questions) {
      return res.status(404).json({ error: 'No questions in this session' });
    }

    const question = session.questions.find(q => q.id === questionId);

    if (!question) {
      console.log(`❌ 问题不存在: ${questionId}`);
      return res.status(404).json({ error: 'Question not found' });
    }

    // 更新答案
    question.answer = answer;
    question.hasAnswer = hasAnswer !== undefined ? hasAnswer : true;
    session.updatedAt = new Date().toISOString();

    // 保存更新
    sessions.set(sessionId, session);

    console.log(`✅ 更新答案: ${questionId}`);
    console.log(`   - 答案长度: ${answer?.length || 0} 字符`);

    res.json({
      success: true,
      message: 'Answer updated successfully',
      questionId,
      hasAnswer: question.hasAnswer
    });
  } catch (error) {
    console.error('❌ 更新答案失败:', error);
    res.status(500).json({
      error: 'Failed to update answer: ' + error.message
    });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * 删除会话
 */
app.delete('/api/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    const deleted = sessions.delete(sessionId);

    if (deleted) {
      console.log(`✅ 删除会话: ${sessionId}`);
      res.json({ success: true, message: 'Session deleted' });
    } else {
      console.log(`❌ 会话不存在: ${sessionId}`);
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    console.error('❌ 删除会话失败:', error);
    res.status(500).json({
      error: 'Failed to delete session: ' + error.message
    });
  }
});

// 健康检查端点
app.get('/actuator/health', (req, res) => {
  res.json({
    status: 'UP',
    sessions: sessions.size
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  res.status(500).json({
    error: 'Internal server error: ' + err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('=' .repeat(60));
  console.log('🚀 模拟存储服务已启动');
  console.log('=' .repeat(60));
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${VALID_API_KEY}`);
  console.log(`📊 当前会话数: ${sessions.size}`);
  console.log('\n可用端点:');
  console.log('  POST   /api/sessions');
  console.log('  GET    /api/sessions/:sessionId');
  console.log('  GET    /api/sessions/:sessionId/questions/:questionId');
  console.log('  PUT    /api/sessions/:sessionId/questions/:questionId');
  console.log('  DELETE /api/sessions/:sessionId');
  console.log('  GET    /actuator/health');
  console.log('=' .repeat(60));
  console.log('\n等待请求...\n');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n👋 正在关闭服务...');
  console.log(`📊 总共处理了 ${sessions.size} 个会话`);
  process.exit(0);
});
