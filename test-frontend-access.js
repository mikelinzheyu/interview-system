/**
 * 测试前端访问
 */
const http = require('http');

console.log('🔍 开始测试前端服务...\n');

// 测试前端服务器
http.get('http://localhost:5174/', (res) => {
  console.log(`✅ 前端服务器响应: ${res.statusCode} ${res.statusMessage}`);
  console.log(`📋 响应头:`, res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\n📄 HTML 内容长度: ${data.length} 字节`);
    console.log(`\n📝 HTML 内容预览:\n${data.substring(0, 500)}...\n`);

    // 检查关键元素
    const hasApp = data.includes('id="app"');
    const hasScript = data.includes('src="/src/main.js"');
    const hasTitle = data.includes('智能面试系统');

    console.log('🔎 内容检查:');
    console.log(`   - <div id="app">: ${hasApp ? '✅' : '❌'}`);
    console.log(`   - main.js 引入: ${hasScript ? '✅' : '❌'}`);
    console.log(`   - 页面标题: ${hasTitle ? '✅' : '❌'}`);

    if (hasApp && hasScript && hasTitle) {
      console.log('\n✅ 前端服务正常！');
      console.log('\n💡 建议:');
      console.log('   1. 清除浏览器缓存 (Ctrl+Shift+Delete)');
      console.log('   2. 使用无痕模式打开浏览器');
      console.log('   3. 尝试访问: http://127.0.0.1:5174/');
      console.log('   4. 检查防火墙/杀毒软件设置');
      console.log('   5. 尝试使用不同的浏览器 (Chrome/Firefox/Edge)');
    } else {
      console.log('\n❌ 前端服务存在问题，请检查配置');
    }
  });
}).on('error', (err) => {
  console.error('❌ 无法连接到前端服务器:', err.message);
  console.log('\n💡 请确认:');
  console.log('   - 前端服务器是否正在运行');
  console.log('   - 端口 5174 是否被占用');
});
