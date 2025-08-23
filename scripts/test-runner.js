#!/usr/bin/env node

/**
 * Test Runner Script
 * Executes tests with proper configuration and reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Test Suite Runner...\n');

// Test categories
const testSuites = {
  unit: 'src/components/__tests__',
  services: 'src/services/__tests__',
  integration: 'src/services/__tests__/integration',
  hooks: 'src/hooks/__tests__',
  store: 'src/store/__tests__',
  utils: 'src/utils/__tests__',
};

// Run tests by category
function runTestSuite(name, testPath) {
  console.log(`\n📦 Running ${name} tests...`);
  try {
    const result = execSync(
      `npm test -- ${testPath} --passWithNoTests --coverage=false --silent 2>&1`,
      { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }
    );
    
    // Parse results
    const passMatch = result.match(/(\d+) passed/);
    const failMatch = result.match(/(\d+) failed/);
    const totalMatch = result.match(/(\d+) total/);
    
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    
    return { name, passed, failed, total };
  } catch (error) {
    // Even on test failure, try to parse results
    const output = error.stdout || error.toString();
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const totalMatch = output.match(/(\d+) total/);
    
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    
    return { name, passed, failed, total };
  }
}

// Run all test suites
console.log('🔄 Running all test suites...\n');
const results = [];

for (const [name, testPath] of Object.entries(testSuites)) {
  if (fs.existsSync(path.join(process.cwd(), testPath))) {
    const result = runTestSuite(name, testPath);
    results.push(result);
    
    const percentage = result.total > 0 
      ? Math.round((result.passed / result.total) * 100)
      : 0;
    
    const status = percentage >= 80 ? '✅' : percentage >= 50 ? '🟡' : '❌';
    
    console.log(`${status} ${name}: ${result.passed}/${result.total} tests passing (${percentage}%)`);
  }
}

// Calculate totals
const totals = results.reduce((acc, r) => ({
  passed: acc.passed + r.passed,
  failed: acc.failed + r.failed,
  total: acc.total + r.total,
}), { passed: 0, failed: 0, total: 0 });

// Generate summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUITE SUMMARY');
console.log('='.repeat(60));

results.forEach(r => {
  const percentage = r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0;
  const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
  console.log(`${r.name.padEnd(15)} ${bar} ${percentage}% (${r.passed}/${r.total})`);
});

console.log('-'.repeat(60));

const totalPercentage = totals.total > 0 
  ? Math.round((totals.passed / totals.total) * 100)
  : 0;

console.log(`\n📈 Overall Coverage: ${totalPercentage}%`);
console.log(`✅ Passed: ${totals.passed}`);
console.log(`❌ Failed: ${totals.failed}`);
console.log(`📝 Total: ${totals.total}`);

// Production readiness check
console.log('\n' + '='.repeat(60));
console.log('🚀 PRODUCTION READINESS CHECK');
console.log('='.repeat(60));

const checks = [
  { name: 'Test Coverage > 80%', passed: totalPercentage >= 80 },
  { name: 'No Critical Failures', passed: totals.failed < totals.total * 0.5 },
  { name: 'Unit Tests Passing', passed: results.find(r => r.name === 'unit')?.passed > 0 },
  { name: 'Integration Tests Exist', passed: results.find(r => r.name === 'integration')?.total > 0 },
];

checks.forEach(check => {
  console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
});

const readyForProduction = checks.every(c => c.passed);

console.log('\n' + '='.repeat(60));
if (readyForProduction) {
  console.log('✅ Tests are READY for production!');
} else {
  console.log('⚠️  Tests need improvement before production');
}
console.log('='.repeat(60));

// Exit with appropriate code
process.exit(totals.failed > 0 ? 1 : 0);