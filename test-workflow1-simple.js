/**
 * 简化测试 - 仅测试工作流1的 LLM 生成功能
 * 不依赖存储服务，用于验证变量映射问题
 */

const https = require('https');

// 工作流1配置
const WORKFLOW1 = {
  apiKey: 'app-dTgOwbWnQQ6rZzTRoPUK7Lz0',
  apiUrl: 'https://api.dify.ai/v1/workflows/run'
};

// 调用工作流
function callWorkflow(inputs) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      inputs,
      response_mode: 'blocking',
      user: 'test-user'
    });

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WORKFLOW1.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(WORKFLOW1.apiUrl, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// 主测试
async function testWorkflow1() {
  console.log('🧪 工作流1 简化测试\n');
  console.log('=' .repeat(70));
  console.log('目标: 验证工作流1的变量映射问题');
  console.log('=' .repeat(70));

  const jobTitle = 'Python后端开发工程师';

  console.log(`\n📤 调用工作流1...`);
  console.log(`输入: { job_title: "${jobTitle}" }\n`);

  try {
    const response = await callWorkflow({ job_title: jobTitle });

    console.log(`✅ HTTP 状态: ${response.status}\n`);

    if (response.status !== 200) {
      console.error('❌ API 调用失败');
      console.error(JSON.stringify(response.data, null, 2));
      return;
    }

    const outputs = response.data.data?.outputs || response.data;

    console.log('📦 原始输出:\n');
    console.log(JSON.stringify(outputs, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('🔍 问题分析');
    console.log('='.repeat(70));

    // 分析 session_id
    console.log(`\n1️⃣ session_id: "${outputs.session_id}"`);
    if (!outputs.session_id || outputs.session_id === '') {
      console.log('   ❌ 问题: session_id 为空');
      console.log('   📝 原因: save_questions 代码节点执行失败（可能是存储服务不可达）');
    } else {
      console.log('   ✅ session_id 正常');
    }

    // 分析 questions
    console.log(`\n2️⃣ questions: ${outputs.questions?.substring(0, 50)}...`);
    if (outputs.questions === '[]') {
      console.log('   ❌ 问题: questions 为空数组字符串');
      console.log('   📝 原因: 变量映射错误');
      console.log('   🔧 应该: extract_skills / structured_output / questions');
      console.log('   ⚠️  当前可能: extract_skills / structured_output（整个对象）');
    } else {
      try {
        const questionList = JSON.parse(outputs.questions);
        console.log(`   ✅ questions 包含 ${questionList.length} 个问题`);
        if (questionList.length > 0) {
          console.log(`   📋 第一个问题: ${questionList[0].question?.substring(0, 80)}...`);
        }
      } catch (e) {
        console.log('   ⚠️  无法解析 questions JSON');
      }
    }

    // 分析 job_title
    console.log(`\n3️⃣ job_title: ${outputs.job_title?.substring(0, 100)}...`);
    if (outputs.job_title?.includes('search(') || outputs.job_title?.includes('```')) {
      console.log('   ❌ 问题: job_title 包含 LLM 的完整输出');
      console.log('   📝 原因: 变量映射错误');
      console.log('   🔧 应该: start / job_title');
      console.log('   ⚠️  当前可能: extract_skills / text');
    } else if (outputs.job_title === jobTitle) {
      console.log('   ✅ job_title 正确');
    } else {
      console.log('   ⚠️  job_title 内容异常');
    }

    // 分析 question_count
    console.log(`\n4️⃣ question_count: ${outputs.question_count}`);
    if (outputs.question_count === 0) {
      console.log('   ❌ 问题: question_count 为 0');
      console.log('   📝 原因: 与 questions 变量映射错误相关');
    } else {
      console.log(`   ✅ question_count 为 ${outputs.question_count}`);
    }

    // 总结
    console.log('\n' + '='.repeat(70));
    console.log('📊 测试总结');
    console.log('='.repeat(70));

    const hasSessionIdIssue = !outputs.session_id || outputs.session_id === '';
    const hasQuestionsIssue = outputs.questions === '[]';
    const hasJobTitleIssue = outputs.job_title?.includes('search(') || outputs.job_title?.includes('```');
    const hasCountIssue = outputs.question_count === 0;

    if (hasSessionIdIssue) {
      console.log('⚠️  session_id 问题 - 存储服务不可达或代码节点执行失败');
    }
    if (hasQuestionsIssue) {
      console.log('❌ questions 变量映射错误 - 需要在 Dify 界面修复');
    }
    if (hasJobTitleIssue) {
      console.log('❌ job_title 变量映射错误 - 需要在 Dify 界面修复');
    }
    if (hasCountIssue) {
      console.log('❌ question_count 错误');
    }

    if (!hasQuestionsIssue && !hasJobTitleIssue && !hasCountIssue) {
      console.log('✅ 变量映射正确！');
      if (hasSessionIdIssue) {
        console.log('⚠️  但需要修复存储服务连接问题');
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🔧 修复建议');
    console.log('='.repeat(70));

    if (hasQuestionsIssue || hasJobTitleIssue) {
      console.log('\n需要在 Dify 工作流界面中修复 "保存问题列表" 节点的变量映射：\n');

      if (hasQuestionsIssue) {
        console.log('1. questions 变量:');
        console.log('   当前: extract_skills → structured_output');
        console.log('   修改为: extract_skills → structured_output → questions\n');
      }

      if (hasJobTitleIssue) {
        console.log('2. job_title 变量:');
        console.log('   当前: extract_skills → text');
        console.log('   修改为: start → job_title\n');
      }

      console.log('修复步骤:');
      console.log('  1. 访问: https://udify.app/workflow/sNkeofwLHukS3sC2');
      console.log('  2. 点击 "保存问题列表" 节点');
      console.log('  3. 修改变量选择器');
      console.log('  4. 保存并发布');
    }

    if (hasSessionIdIssue && !hasQuestionsIssue && !hasJobTitleIssue) {
      console.log('\n变量映射正确，但存储服务有问题：\n');
      console.log('1. 确保存储服务正在运行: http://localhost:8080');
      console.log('2. 如需公网访问，启动 ngrok: ngrok http 8080');
      console.log('3. 更新工作流代码节点中的存储服务 URL');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
testWorkflow1();
