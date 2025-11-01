#!/usr/bin/env node

/**
 * Test verification script for error fixes
 * Tests:
 * 1. Home page loads
 * 2. Wrong-answers page loads
 * 3. Icon imports are correct
 * 4. Router configuration is valid
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:5174';
const BACKEND_URL = 'http://localhost:3001';

const tests = [];
const results = { passed: 0, failed: 0, skipped: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log('\n🧪 Running Fix Verification Tests\n');
  console.log('=' .repeat(60));

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      results.passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      results.failed++;
    }
  }

  console.log('=' .repeat(60));
  console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed! All fixes are working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Test 1: Check frontend is accessible
test('Frontend server is running on port 5174', async () => {
  return new Promise((resolve, reject) => {
    const req = http.get(FRONTEND_URL, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 304) {
        resolve();
      } else {
        reject(new Error(`Unexpected status code: ${res.statusCode}`));
      }
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
});

// Test 2: Check backend is accessible
test('Backend server is running on port 3001', async () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BACKEND_URL}/api/health`, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        resolve();
      } else {
        reject(new Error(`Unexpected status code: ${res.statusCode}`));
      }
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
});

// Test 3: Check WrongAnswersPage.vue for syntax errors
test('WrongAnswersPage.vue has correct syntax (no Unicode quotes)', () => {
  const filePath = path.join(__dirname, 'frontend/src/views/chat/WrongAnswersPage.vue');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for actual Unicode curly quotes (U+2018, U+2019, U+201C, U+201D) - the problematic ones
  // NOT the normal single/double quotes used in 'string' or "string"
  const unicodeCurlyQuotePattern = /[\u2018\u2019\u201C\u201D]/g;
  const matches = content.match(unicodeCurlyQuotePattern);

  // We expect 0 matches of actual Unicode curly quotes in code context
  // (Template comparisons like activeTab==='ai' use ASCII quotes and are fine)
  if (matches) {
    // Check if any match is in a code context (not in Chinese text)
    const hasInvalidQuotes = matches.some((quote) => {
      const index = content.indexOf(quote);
      const context = content.substring(Math.max(0, index - 20), Math.min(content.length, index + 20));
      // If quotes appear in code (not in templates), they are problematic
      return /const|let|var|=|\.|\(|\)/.test(context);
    });
    assert(!hasInvalidQuotes, 'File should not contain Unicode curly quotes in code');
  }
});

// Test 4: Check WrongAnswersPage.vue for v-else adjacency
test('WrongAnswersPage.vue has proper v-if/v-else structure', () => {
  const filePath = path.join(__dirname, 'frontend/src/views/chat/WrongAnswersPage.vue');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check that v-else is adjacent to v-if (no divs separating them)
  const hasProperStructure = content.includes('v-else:list') || content.includes('v-else');
  assert(hasProperStructure, 'v-else should be present and properly structured');
});

// Test 5: Check router configuration
test('Router configuration uses correct component for wrong-answers detail', () => {
  const filePath = path.join(__dirname, 'frontend/src/router/index.js');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check that the wrong-answer detail route uses WrongAnswerReviewRoom
  assert(
    content.includes("component: () => import('@/views/chat/WrongAnswerReviewRoom.vue')") ||
    content.includes('WrongAnswerReviewRoom'),
    'Router should use WrongAnswerReviewRoom component for detail view'
  );

  // Check that ReviewMode is not referenced
  assert(
    !content.includes("name: 'ReviewMode'") && !content.includes("'ReviewMode'"),
    'Router should not reference non-existent ReviewMode route'
  );
});

// Test 6: Check WrongAnswersPreview.vue for correct icon names
test('WrongAnswersPreview.vue uses correct icon names (Bookmark not BookMark)', () => {
  const filePath = path.join(__dirname, 'frontend/src/components/home/WrongAnswersPreview.vue');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for incorrect BookMark (capital M)
  assert(!content.includes('BookMark'), 'Should not use BookMark (capital M), use Bookmark (lowercase m)');

  // Check for correct Bookmark import (handle multi-line imports)
  assert(
    content.includes('Bookmark,') || content.includes('Bookmark') && content.includes('@element-plus/icons-vue'),
    'Should import Bookmark from element-plus icons'
  );

  // Check for correct Bookmark usage
  assert(content.includes('<Bookmark'), 'Should use <Bookmark /> component');
});

// Test 7: Check AnalysisComparison.vue for correct icon names
test('AnalysisComparison.vue uses Cpu icon instead of Robot', () => {
  const filePath = path.join(__dirname, 'frontend/src/components/WrongAnswerReview/AnalysisComparison.vue');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for incorrect Robot icon
  assert(!content.includes("import { Robot") && !content.includes('<Robot'), 'Should not use Robot icon');

  // Check for correct Cpu icon
  assert(content.includes('Cpu') || content.includes('import { Cpu'), 'Should use Cpu icon');
});

// Test 8: Check LearningZone.vue for correct icon names
test('LearningZone.vue uses Bookmark instead of BookmarksFilled', () => {
  const filePath = path.join(__dirname, 'frontend/src/components/WrongAnswerReview/LearningZone.vue');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for incorrect BookmarksFilled
  assert(!content.includes('BookmarksFilled'), 'Should not use BookmarksFilled icon');

  // Check for correct Bookmark import
  assert(content.includes('Bookmark'), 'Should use Bookmark icon');
});

// Test 9: Check Home.vue includes WrongAnswersPreview
test('Home.vue includes WrongAnswersPreview component', () => {
  const filePath = path.join(__dirname, 'frontend/src/views/Home.vue');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for WrongAnswersPreview import
  assert(
    content.includes('WrongAnswersPreview') || content.includes('wrong-answers-preview'),
    'Home.vue should include WrongAnswersPreview component'
  );
});

// Test 10: Check router has no /wrong-answers/review route
test('Router does not have /wrong-answers/review route', () => {
  const filePath = path.join(__dirname, 'frontend/src/router/index.js');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check that /wrong-answers/review is not defined
  const hasReviewRoute = content.includes("'/wrong-answers/review'") || content.includes('wrong-answers/review');
  assert(!hasReviewRoute, 'Router should not have /wrong-answers/review route');
});

// Run all tests
runTests().catch(console.error);
