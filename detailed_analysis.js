const fs = require('fs');
const content = fs.readFileSync('frontend/src/views/chat/WrongAnswersPage.vue', 'utf8');

// Extract only template section (lines 1-332)
const lines = content.split('\n').slice(0, 332);
const templateContent = lines.join('\n');

// Problems found:
// 1. el-input: 3 opening, 1 closing - missing 2 closing tags
// 2. el-button: 11 opening, 9 closing - missing 2 closing tags (but some are self-closing)
// 3. el-table: 10 opening (including 9 el-table-column), only 1 </el-table> - missing closing tags
// 4. el-progress: 1 opening (self-closing), 0 closing - but it's self-closing with />

console.log('DETAILED ANALYSIS OF MISSING CLOSING TAGS');
console.log('='.repeat(70));

// Find el-input tags
console.log('\n1. EL-INPUT TAGS:');
console.log('-'.repeat(70));
const inputPattern = /<el-input[^>]*>/g;
const inputMatches = [];
let match;
let lineNum = 1;
let charCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<el-input')) {
    console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
    if (!lines[i].includes('/>')) {
      console.log(`    ^ This el-input is NOT self-closing - needs </el-input>`);
    }
  }
}
console.log('\nClosing tags found:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</el-input>')) {
    console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
  }
}

// Find el-button tags (exclude el-button-group)
console.log('\n\n2. EL-BUTTON TAGS:');
console.log('-'.repeat(70));
console.log('Opening el-button tags (excluding el-button-group):');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<el-button') && !lines[i].includes('el-button-group')) {
    console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
    if (lines[i].includes('/>')) {
      console.log(`    ^ Self-closing`);
    }
  }
}

// Find el-table
console.log('\n\n3. EL-TABLE TAGS:');
console.log('-'.repeat(70));
console.log('Opening el-table tags:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<el-table ') && !lines[i].includes('el-table-column')) {
    console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
  }
}
console.log('\nClosing el-table tags:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</el-table>')) {
    console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
  }
}

// Find el-progress
console.log('\n\n4. EL-PROGRESS TAGS:');
console.log('-'.repeat(70));
console.log('Opening el-progress tags:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<el-progress')) {
    console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
    if (lines[i].includes('/>')) {
      console.log(`    ^ Self-closing (correct format)`);
    }
  }
}

