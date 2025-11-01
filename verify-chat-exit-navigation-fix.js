/**
 * 验证脚本：聊天室导航修复
 * 检查所有必要的修复是否都被正确应用
 */

const fs = require('fs');

console.log('\n' + '='.repeat(70));
console.log('验证：聊天室导航修复');
console.log('='.repeat(70) + '\n');

const checks = [
  {
    name: '修复 1：ChatRoom.vue 路由导航错误处理',
    file: 'D:\\code7\\interview-system\\frontend\\src\\views\\chat\\ChatRoom.vue',
    patterns: [
      {
        desc: '使用 await 等待路由导航',
        regex: /await router\.push\('\/chat'\)/
      },
      {
        desc: 'try-catch 错误处理',
        regex: /catch \(navError\)/
      },
      {
        desc: '错误消息提示',
        regex: /ElMessage\.error\('跳转失败/
      }
    ]
  },
  {
    name: '修复 2：ChatList.vue 返回社区导航',
    file: 'D:\\code7\\interview-system\\frontend\\src\\views\\chat\\ChatList.vue',
    patterns: [
      {
        desc: '导入 ArrowLeft 图标',
        regex: /import.*ArrowLeft.*from '@element-plus\/icons-vue'/
      },
      {
        desc: '添加面包屑导航 HTML',
        regex: /chat-list-breadcrumb/
      },
      {
        desc: '返回社区函数',
        regex: /function goToCommunity\(\)/
      },
      {
        desc: '社区路由导航',
        regex: /router\.push\(\s*\{\s*name:\s*'CommunityHub'/
      },
      {
        desc: '导航栏样式',
        regex: /\.chat-list-breadcrumb\s*\{/
      }
    ]
  }
];

let totalChecks = 0;
let passChecks = 0;

checks.forEach((check, index) => {
  console.log(`\n📋 ${check.name}`);
  console.log('-'.repeat(70));

  try {
    const content = fs.readFileSync(check.file, 'utf-8');

    check.patterns.forEach((pattern, patternIndex) => {
      totalChecks++;
      const passed = pattern.regex.test(content);

      if (passed) {
        console.log(`   ✅ [${patternIndex + 1}] ${pattern.desc}`);
        passChecks++;
      } else {
        console.log(`   ❌ [${patternIndex + 1}] ${pattern.desc}`);
      }
    });
  } catch (error) {
    console.log(`   ❌ 文件不存在或无法读取: ${check.file}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('验证结果');
console.log('='.repeat(70));

console.log(`\n整体完成度：${passChecks}/${totalChecks} (${Math.round(passChecks / totalChecks * 100)}%)\n`);

if (passChecks === totalChecks) {
  console.log('🎉 恭喜！所有修复都已正确应用！\n');
  console.log('✨ 现在可以测试以下流程：\n');
  console.log('   1. 访问 http://localhost:5174/chat/room/2');
  console.log('   2. 点击工具栏"更多" → "退出群组"');
  console.log('   3. 确认后应立即跳转到 /chat 页面');
  console.log('   4. 在 /chat 页面看到顶部"← 返回社区"按钮');
  console.log('   5. 点击该按钮应立即跳转到 /community 页面\n');
  console.log('💡 提示：刷新浏览器 (Ctrl+F5) 确保加载最新代码\n');
} else {
  console.log('⚠️  警告：有些修复未完全应用，请检查上面标记为 ❌ 的项目\n');
}

console.log('='.repeat(70) + '\n');
