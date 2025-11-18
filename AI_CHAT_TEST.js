// AI 对话功能测试脚本
// 用于测试 EventSource 流式响应

const BASE_URL = 'http://localhost:3001';
const POST_ID = '20';

console.log('='.repeat(50));
console.log('AI 对话功能集成测试');
console.log('='.repeat(50));
console.log('');

// 测试 1: 检查 AI 聊天路由
console.log('测试 1: 检查 AI 聊天路由是否存在');
console.log('-'.repeat(50));

const testMessage = 'Linux 密码破解有哪些安全风险？';
const articleContent = `# Linux 系统密码破解指南

这是关于 Linux 密码破解的内容...`;

const params = new URLSearchParams({
    message: testMessage,
    articleContent: articleContent,
    postId: POST_ID,
    workflow: 'chat'
});

const streamUrl = `${BASE_URL}/api/ai/chat/stream?${params.toString()}`;

console.log('测试 URL:');
console.log(streamUrl.substring(0, 100) + '...');
console.log('');

// 测试 2: 尝试连接流
console.log('测试 2: 尝试建立 EventSource 连接');
console.log('-'.repeat(50));

try {
    const eventSource = new EventSource(streamUrl);
    let messageReceived = false;
    let receivedChunks = 0;
    let totalContent = '';

    console.log('正在连接 EventSource...');

    eventSource.onopen = () => {
        console.log('✓ EventSource 连接成功建立');
    };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            messageReceived = true;
            receivedChunks++;

            console.log(`✓ 收到消息块 #${receivedChunks}`);
            console.log(`  类型: ${data.type}`);

            if (data.type === 'chunk') {
                const content = data.content || data.answer || '';
                totalContent += content;
                console.log(`  内容长度: ${content.length} 字符`);
                console.log(`  累计长度: ${totalContent.length} 字符`);
            } else if (data.type === 'end') {
                console.log('✓ 流传输完成');
                console.log(`  总消息数: ${receivedChunks} 个`);
                console.log(`  总内容长度: ${totalContent.length} 字符`);
                if (data.conversationId) {
                    console.log(`  对话 ID: ${data.conversationId}`);
                }
            }
        } catch (e) {
            console.error(`✗ 消息解析失败: ${e.message}`);
        }
    };

    eventSource.onerror = (error) => {
        console.error(`✗ EventSource 错误:`, error);
        eventSource.close();
    };

    // 5 秒后关闭连接
    setTimeout(() => {
        eventSource.close();
        console.log('');
        console.log('连接已关闭');

        if (messageReceived) {
            console.log('');
            console.log('='.repeat(50));
            console.log('✓ AI 对话功能测试通过！');
            console.log('='.repeat(50));
        } else {
            console.log('');
            console.log('='.repeat(50));
            console.log('⚠ 未收到任何消息，可能需要配置 AI API');
            console.log('='.repeat(50));
        }
    }, 5000);

} catch (error) {
    console.error('✗ 测试失败:', error.message);
}
