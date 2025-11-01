/**
 * 快速验证：退出练习模式修复
 * 验证修复是否正确应用
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('验证：退出练习模式修复');
console.log('='.repeat(70) + '\n');

const filePath = 'D:\\code7\\interview-system\\frontend\\src\\composables\\usePracticeMode.js';

try {
  const content = fs.readFileSync(filePath, 'utf-8');

  console.log('📋 检查清单：\n');

  const checks = [
    {
      name: '导入 useRouter',
      pattern: /import.*useRouter.*from 'vue-router'/,
      required: true
    },
    {
      name: '定义 router 变量',
      pattern: /const router = useRouter\(\)/,
      required: true
    },
    {
      name: 'exitPracticeMode 函数存在',
      pattern: /const exitPracticeMode = \(\) => \{/,
      required: true
    },
    {
      name: 'URL 参数清理逻辑',
      pattern: /delete newQuery\.mode/,
      required: true
    },
    {
      name: 'recordId 清理',
      pattern: /delete newQuery\.recordId/,
      required: true
    },
    {
      name: '路由替换逻辑',
      pattern: /router\.replace\(/,
      required: true
    },
    {
      name: 'ChatRoom 路由检查',
      pattern: /route\.name === 'ChatRoom'/,
      required: true
    },
    {
      name: 'mode=practice 检查',
      pattern: /route\.query\.mode === 'practice'/,
      required: true
    },
    {
      name: '错误处理',
      pattern: /\.catch\(err => \{/,
      required: true
    }
  ];

  let passCount = 0;
  let failCount = 0;

  checks.forEach((check, index) => {
    const passed = check.pattern.test(content);

    if (passed) {
      console.log(`   ✅ [${index + 1}] ${check.name}`);
      passCount++;
    } else {
      console.log(`   ❌ [${index + 1}] ${check.name}${check.required ? ' (必需)' : ' (可选)'}`);
      failCount++;
    }
  });

  console.log(`\n✨ 修复验证结果: ${passCount}/${checks.length} 通过\n`);

  if (passCount === checks.length) {
    console.log('🎉 恭喜！修复已完全应用，所有检查都通过了！\n');
    console.log('📝 后续测试：');
    console.log('   1. 访问 http://localhost:5174');
    console.log('   2. 进入错题详情页面');
    console.log('   3. 点击"再答一次"进入练习模式');
    console.log('   4. 观察 URL 变成：...?mode=practice&recordId=xxx');
    console.log('   5. 点击"退出练习"按钮');
    console.log('   6. 验证：');
    console.log('      ✓ 横幅立即消失');
    console.log('      ✓ URL 变成：...（没有 mode=practice）');
    console.log('      ✓ 不需要二次点击！\n');
  } else {
    console.log('⚠️  警告：修复可能未完全应用，请检查以上标记为 ❌ 的项目\n');
  }

  console.log('='.repeat(70) + '\n');
} catch (error) {
  console.error('❌ 错误：', error.message);
  process.exit(1);
}
