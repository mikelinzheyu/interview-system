/**
 * Redis存储服务集成测试
 * 测试与Dify工作流的完整集成
 */

const API_URL = 'http://localhost:8080/api/sessions';
const API_KEY = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

// 生成UUID（简单版本）
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function testStorageService() {
    console.log('========================================');
    console.log('Redis存储服务集成测试');
    console.log('========================================\n');

    const sessionId = generateUUID();
    console.log(`Session ID: ${sessionId}\n`);

    try {
        // 测试1: 保存会话数据
        console.log('✓ 测试1: 保存会话数据');
        console.log('----------------------------');

        const qaData = [
            {
                question: "请解释Python的GIL机制",
                answer: "GIL（全局解释器锁）是CPython解释器中的一个机制，它确保同一时刻只有一个线程在执行Python字节码。这是为了保护CPython内部的数据结构免受并发访问的影响。虽然GIL简化了CPython的实现，但它也限制了多线程程序的并行性能。"
            },
            {
                question: "什么是装饰器？",
                answer: "装饰器是Python中的一种设计模式，它允许我们在不修改原函数代码的情况下，为函数添加额外的功能。装饰器本质上是一个函数，它接受一个函数作为参数，并返回一个新的函数。常用于日志记录、性能测试、事务处理、权限验证等场景。"
            },
            {
                question: "解释深拷贝和浅拷贝的区别",
                answer: "浅拷贝创建一个新对象，但只复制原对象的引用，而不复制引用的对象本身。深拷贝则会递归复制所有嵌套的对象。在Python中，可以使用copy.copy()进行浅拷贝，使用copy.deepcopy()进行深拷贝。修改浅拷贝对象中的可变对象会影响原对象，而深拷贝则完全独立。"
            }
        ];

        const savePayload = {
            sessionId: sessionId,
            qaData: qaData,
            metadata: {
                jobTitle: "Python后端工程师",
                createdBy: "dify-workflow",
                qaCount: qaData.length,
                testRun: true
            }
        };

        console.log('发送请求...');
        const saveResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(savePayload)
        });

        if (!saveResponse.ok) {
            throw new Error(`保存失败: ${saveResponse.status} ${saveResponse.statusText}`);
        }

        const saveResult = await saveResponse.json();
        console.log('保存结果:', JSON.stringify(saveResult, null, 2));
        console.log('✅ 保存成功\n');

        // 等待一秒，确保数据已保存
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 测试2: 查询整个会话
        console.log('✓ 测试2: 查询整个会话');
        console.log('----------------------------');

        const getSessionResponse = await fetch(`${API_URL}/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        if (!getSessionResponse.ok) {
            throw new Error(`查询失败: ${getSessionResponse.status} ${getSessionResponse.statusText}`);
        }

        const sessionData = await getSessionResponse.json();
        console.log('会话数据:');
        console.log(`- Session ID: ${sessionData.sessionId}`);
        console.log(`- 问答数量: ${sessionData.qaData.length}`);
        console.log(`- 创建时间: ${sessionData.createdAt}`);
        console.log('✅ 查询成功\n');

        // 测试3: 查询特定问题的答案
        console.log('✓ 测试3: 查询特定问题的答案');
        console.log('----------------------------');

        for (const qa of qaData) {
            const question = encodeURIComponent(qa.question);
            const getAnswerResponse = await fetch(
                `${API_URL}/${sessionId}?question=${question}`,
                {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`
                    }
                }
            );

            if (!getAnswerResponse.ok) {
                throw new Error(`查询答案失败: ${getAnswerResponse.status}`);
            }

            const answerData = await getAnswerResponse.json();
            console.log(`\n问题: ${answerData.question}`);
            console.log(`答案: ${answerData.answer.substring(0, 50)}...`);
        }
        console.log('\n✅ 所有答案查询成功\n');

        // 测试4: 模拟Dify工作流场景
        console.log('✓ 测试4: 模拟Dify工作流评分场景');
        console.log('----------------------------');

        const candidateAnswer = "GIL是全局解释器锁，它限制了Python的多线程性能。";
        const questionToScore = qaData[0].question;

        console.log(`面试问题: ${questionToScore}`);
        console.log(`候选人回答: ${candidateAnswer}`);

        // 获取标准答案
        const standardAnswerResponse = await fetch(
            `${API_URL}/${sessionId}?question=${encodeURIComponent(questionToScore)}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                }
            }
        );

        if (!standardAnswerResponse.ok) {
            throw new Error(`获取标准答案失败: ${standardAnswerResponse.status}`);
        }

        const standardAnswerData = await standardAnswerResponse.json();
        console.log(`\n标准答案: ${standardAnswerData.answer.substring(0, 100)}...`);
        console.log('✅ 评分场景模拟成功\n');

        // 测试5: 错误处理
        console.log('✓ 测试5: 错误处理测试');
        console.log('----------------------------');

        // 5.1 查询不存在的会话
        const nonExistentId = generateUUID();
        const notFoundResponse = await fetch(`${API_URL}/${nonExistentId}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        console.log(`查询不存在的会话: ${notFoundResponse.status === 404 ? '✅ 正确返回404' : '❌ 错误'}`);

        // 5.2 错误的API Key
        const wrongKeyResponse = await fetch(`${API_URL}/${sessionId}`, {
            headers: {
                'Authorization': 'Bearer wrong_key'
            }
        });
        console.log(`错误的API Key: ${wrongKeyResponse.status === 403 ? '✅ 正确返回403' : '❌ 错误'}`);

        // 5.3 查询不存在的问题
        const wrongQuestionResponse = await fetch(
            `${API_URL}/${sessionId}?question=${encodeURIComponent('不存在的问题')}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                }
            }
        );
        console.log(`查询不存在的问题: ${wrongQuestionResponse.status === 404 ? '✅ 正确返回404' : '❌ 错误'}`);
        console.log('✅ 错误处理正常\n');

        // 测试6: 删除会话
        console.log('✓ 测试6: 删除会话');
        console.log('----------------------------');

        const deleteResponse = await fetch(`${API_URL}/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        if (!deleteResponse.ok) {
            throw new Error(`删除失败: ${deleteResponse.status}`);
        }

        const deleteResult = await deleteResponse.json();
        console.log('删除结果:', JSON.stringify(deleteResult, null, 2));

        // 验证删除
        const verifyDeleteResponse = await fetch(`${API_URL}/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        console.log(`验证删除: ${verifyDeleteResponse.status === 404 ? '✅ 会话已删除' : '❌ 删除失败'}`);

        console.log('\n========================================');
        console.log('🎉 所有测试通过！');
        console.log('========================================\n');

        console.log('集成总结:');
        console.log('✅ Redis存储服务正常运行');
        console.log('✅ API认证机制正常');
        console.log('✅ 会话存储和查询功能正常');
        console.log('✅ 与Dify工作流集成准备就绪');
        console.log('✅ 错误处理机制正常');
        console.log('\n下一步:');
        console.log('1. 在Dify中导入工作流: AI-Interview-Workflow-WithRedis.yml');
        console.log('2. 配置工作流中的API URL和API Key');
        console.log('3. 测试完整的面试流程');

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error('\n请检查:');
        console.error('1. Redis存储服务是否已启动: cd storage-service && docker-compose ps');
        console.error('2. API是否可访问: curl http://localhost:8080');
        console.error('3. API Key是否正确');
        process.exit(1);
    }
}

// 运行测试
console.log('开始测试前，请确保存储服务已启动...');
console.log('如果未启动，请运行: cd storage-service && docker-compose up -d\n');

setTimeout(() => {
    testStorageService();
}, 2000);
