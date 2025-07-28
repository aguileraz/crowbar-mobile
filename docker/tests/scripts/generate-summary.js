#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse test results directory from command line
const resultsDir = process.argv[2] || '/app/test-results';

// Function to parse test results from a target
function parseTargetResults(targetDir) {
  const results = {
    target: path.basename(targetDir),
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    failures: []
  };

  try {
    // Look for test result files (Allure JSON format)
    const files = fs.readdirSync(targetDir)
      .filter(file => file.endsWith('-result.json'));

    files.forEach(file => {
      const content = JSON.parse(fs.readFileSync(path.join(targetDir, file), 'utf8'));
      
      results.total++;
      results.duration += content.stop - content.start;

      switch (content.status) {
        case 'passed':
          results.passed++;
          break;
        case 'failed':
        case 'broken':
          results.failed++;
          results.failures.push({
            name: content.name,
            fullName: content.fullName,
            message: content.statusDetails?.message || 'Unknown error',
            trace: content.statusDetails?.trace
          });
          break;
        case 'skipped':
          results.skipped++;
          break;
      }
    });

    results.duration = Math.round(results.duration / 1000); // Convert to seconds
  } catch (error) {
    console.error(`Error parsing results for ${targetDir}:`, error.message);
  }

  return results;
}

// Main execution
try {
  const summary = {
    timestamp: new Date().toISOString(),
    totalTargets: 0,
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalSkipped: 0,
    totalDuration: 0,
    targets: []
  };

  // Get all target directories
  const targets = fs.readdirSync(resultsDir)
    .filter(dir => fs.statSync(path.join(resultsDir, dir)).isDirectory());

  // Parse results for each target
  targets.forEach(target => {
    const targetResults = parseTargetResults(path.join(resultsDir, target));
    
    summary.targets.push(targetResults);
    summary.totalTargets++;
    summary.totalTests += targetResults.total;
    summary.totalPassed += targetResults.passed;
    summary.totalFailed += targetResults.failed;
    summary.totalSkipped += targetResults.skipped;
    summary.totalDuration += targetResults.duration;
  });

  // Calculate pass rate
  summary.passRate = summary.totalTests > 0 
    ? Math.round((summary.totalPassed / summary.totalTests) * 100) 
    : 0;

  // Add status
  summary.status = summary.totalFailed === 0 ? 'PASSED' : 'FAILED';

  // Output summary
  console.log(JSON.stringify(summary, null, 2));

} catch (error) {
  console.error('Error generating summary:', error);
  process.exit(1);
}