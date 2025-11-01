const fs = require('fs');
const content = fs.readFileSync('frontend/src/views/chat/WrongAnswersPage.vue', 'utf8');

// Extract only template section (lines 1-332)
const lines = content.split('\n').slice(0, 332);
const templateContent = lines.join('\n');

const tags = [
  'div',
  'section',
  'template',
  'el-tabs',
  'el-tab-pane',
  'el-input',
  'el-checkbox-group',
  'el-button',
  'el-table',
  'el-table-column',
  'el-tag',
  'el-progress',
  'el-badge',
  'el-button-group'
];

console.log('Tag Analysis for WrongAnswersPage.vue (Template section, lines 1-332):\n');
console.log('Tag Name'.padEnd(25) + 'Opening'.padEnd(15) + 'Closing'.padEnd(15) + 'Diff');
console.log('-'.repeat(70));

let hasIssues = false;

tags.forEach(tag => {
  const opens = templateContent.split('<' + tag).length - 1;
  const closes = templateContent.split('</' + tag + '>').length - 1;
  const diff = opens - closes;
  
  const status = diff === 0 ? 'OK' : 'MISSING ' + (diff > 0 ? diff + ' closing tag(s)' : 'opening tag(s)');
  
  if (diff !== 0) {
    hasIssues = true;
  }
  
  console.log(tag.padEnd(25) + opens.toString().padEnd(15) + closes.toString().padEnd(15) + diff + '  ' + status);
});

console.log('\n');
if (!hasIssues) {
  console.log('All tags are properly closed!');
} else {
  console.log('ISSUES FOUND: Some tags are missing closing tags!');
}
