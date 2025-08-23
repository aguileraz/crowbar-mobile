#!/usr/bin/env node

/**
 * Generate Test Dashboard
 * Aggregates test results from all Android API levels and creates dashboard data
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = 'test-results-docker';
const DASHBOARD_DIR = 'docker/dashboard';
const API_LEVELS = ['21', '26', '31'];

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Generating test dashboard...');
  
  try {
    // Create dashboard directory if it doesn't exist
    ensureDirectoryExists(DASHBOARD_DIR);
    
    // Aggregate test results
    const results = await aggregateResults();
    
    // Generate dashboard data
    const dashboardData = generateDashboardData(results);
    
    // Save dashboard data
    saveDashboardData(dashboardData);
    
    // Generate static files
    await generateStaticAssets(results);
    
    console.log('✅ Test dashboard generated successfully!');
    console.log(`📊 View dashboard: file://${path.resolve(DASHBOARD_DIR)}/index.html`);
    
  } catch (error) {
    console.error('❌ Error generating dashboard:', error);
    process.exit(1);
  }
}

/**
 * Aggregate test results from all API levels
 */
async function aggregateResults() {
  console.log('📊 Aggregating test results...');
  
  const results = {
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      timestamp: new Date().toISOString()
    },
    apiLevels: [],
    visualRegression: {
      screens: [],
      overallCompliance: 0
    },
    timeline: []
  };
  
  for (const apiLevel of API_LEVELS) {
    const apiResultsDir = path.join(RESULTS_DIR, `api-${apiLevel}`);
    
    if (!fs.existsSync(apiResultsDir)) {
      console.log(`⚠️  No results found for API ${apiLevel}`);
      continue;
    }
    
    const apiResults = await processApiResults(apiLevel, apiResultsDir);
    results.apiLevels.push(apiResults);
    
    // Update summary
    results.summary.totalTests += apiResults.tests.total;
    results.summary.passed += apiResults.tests.passed;
    results.summary.failed += apiResults.tests.failed;
    results.summary.skipped += apiResults.tests.skipped;
    results.summary.duration += apiResults.duration;
    
    // Add to timeline
    results.timeline.push({
      time: new Date(apiResults.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      title: `API ${apiLevel} Tests`,
      description: `${apiResults.tests.passed}/${apiResults.tests.total} tests passed`,
      status: apiResults.status
    });
  }
  
  // Process visual regression results
  results.visualRegression = await processVisualResults();
  
  return results;
}

/**
 * Process results for a specific API level
 */
async function processApiResults(apiLevel, resultsDir) {
  const result = {
    level: parseInt(apiLevel, 10),
    version: getAndroidVersion(apiLevel),
    device: getDeviceName(apiLevel),
    status: 'unknown',
    tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
    duration: 0,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Read JUnit results
    const junitFile = path.join(resultsDir, `junit-results-api-${apiLevel}.xml`);
    if (fs.existsSync(junitFile)) {
      const junitData = parseJUnitResults(junitFile);
      result.tests = junitData.tests;
      result.duration = junitData.duration;
      result.status = junitData.tests.failed === 0 ? 'success' : 'failure';
    }
    
    // Read visual regression report
    const visualFile = path.join(resultsDir, 'visual-comparison/validation-report.json');
    if (fs.existsSync(visualFile)) {
      const visualData = JSON.parse(fs.readFileSync(visualFile, 'utf8'));
      result.visualCompliance = visualData.overallCompliance;
    }
    
    // Check if results are recent (last 24 hours)
    const reportFile = path.join(resultsDir, 'visual-report.json');
    if (fs.existsSync(reportFile)) {
      const reportData = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      result.timestamp = reportData.timestamp;
      
      const resultAge = Date.now() - new Date(reportData.timestamp).getTime();
      if (resultAge > 24 * 60 * 60 * 1000) {
        result.status = 'stale';
      }
    }
    
  } catch (error) {
    console.error(`❌ Error processing API ${apiLevel} results:`, error);
    result.status = 'error';
  }
  
  return result;
}

/**
 * Parse JUnit XML results
 */
function parseJUnitResults(junitFile) {
  // Simple XML parsing - in production use proper XML parser
  const content = fs.readFileSync(junitFile, 'utf8');
  
  const testsMatch = content.match(/tests="(\d+)"/);
  const failuresMatch = content.match(/failures="(\d+)"/);
  const errorsMatch = content.match(/errors="(\d+)"/);
  const skippedMatch = content.match(/skipped="(\d+)"/);
  const timeMatch = content.match(/time="([\d.]+)"/);
  
  const total = testsMatch ? parseInt(testsMatch[1], 10) : 0;
  const failures = failuresMatch ? parseInt(failuresMatch[1], 10) : 0;
  const errors = errorsMatch ? parseInt(errorsMatch[1], 10) : 0;
  const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
  const failed = failures + errors;
  const passed = total - failed - skipped;
  
  return {
    tests: { total, passed, failed, skipped },
    duration: timeMatch ? parseFloat(timeMatch[1]) : 0
  };
}

/**
 * Process visual regression results
 */
async function processVisualResults() {
  const visualResults = {
    screens: [],
    overallCompliance: 0
  };
  
  let totalCompliance = 0;
  let screenCount = 0;
  
  for (const apiLevel of API_LEVELS) {
    const visualDir = path.join(RESULTS_DIR, `api-${apiLevel}`, 'visual-comparison');
    const reportFile = path.join(visualDir, 'validation-report.json');
    
    if (fs.existsSync(reportFile)) {
      const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      
      if (report.screens) {
        Object.entries(report.screens).forEach(([screenName, data]) => {
          const existingScreen = visualResults.screens.find(s => s.name === screenName);
          
          if (existingScreen) {
            existingScreen.results[`api${apiLevel}`] = data.match;
          } else {
            visualResults.screens.push({
              name: screenName,
              averageMatch: data.match,
              status: data.match >= 90 ? 'pass' : data.match >= 80 ? 'warning' : 'fail',
              results: { [`api${apiLevel}`]: data.match }
            });
          }
        });
      }
      
      totalCompliance += report.overallCompliance;
      screenCount++;
    }
  }
  
  // Calculate average compliance
  if (screenCount > 0) {
    visualResults.overallCompliance = totalCompliance / screenCount;
  }
  
  // Calculate average match for each screen
  visualResults.screens.forEach(screen => {
    const matches = Object.values(screen.results);
    screen.averageMatch = matches.reduce((sum, match) => sum + match, 0) / matches.length;
  });
  
  return visualResults;
}

/**
 * Generate dashboard data structure
 */
function generateDashboardData(results) {
  const passRate = results.summary.totalTests > 0 
    ? Math.round((results.summary.passed / results.summary.totalTests) * 100)
    : 0;
  
  const avgDuration = results.apiLevels.length > 0
    ? Math.round(results.summary.duration / results.apiLevels.length)
    : 0;
  
  const coverage = results.apiLevels.filter(api => 
    api.status === 'success' || api.status === 'running').length;
  
  return {
    metrics: {
      totalTests: results.summary.totalTests,
      passRate: passRate + '%',
      avgDuration: avgDuration + 's',
      apiCoverage: `${coverage}/${API_LEVELS.length}`,
      coveragePercentage: Math.round((coverage / API_LEVELS.length) * 100)
    },
    testMatrix: results.apiLevels.map(api => ({
      ...api,
      passRate: api.tests.total > 0 
        ? Math.round((api.tests.passed / api.tests.total) * 100)
        : 0
    })),
    visualRegression: results.visualRegression,
    timeline: results.timeline.reverse(), // Most recent first
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Save dashboard data
 */
function saveDashboardData(data) {
  const dataFile = path.join(DASHBOARD_DIR, 'data.json');
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log('💾 Dashboard data saved to:', dataFile);
}

/**
 * Generate static assets
 */
async function generateStaticAssets(results) {
  // Copy screenshots for visual comparison
  const screenshotsDir = path.join(DASHBOARD_DIR, 'screenshots');
  ensureDirectoryExists(screenshotsDir);
  
  for (const apiLevel of API_LEVELS) {
    const sourceDir = path.join(RESULTS_DIR, `api-${apiLevel}`, 'screenshots');
    if (fs.existsSync(sourceDir)) {
      copyScreenshots(sourceDir, screenshotsDir, apiLevel);
    }
  }
  
  // Generate performance history
  const historyFile = path.join(DASHBOARD_DIR, 'performance-history.json');
  updatePerformanceHistory(historyFile, results);
}

/**
 * Copy screenshots for dashboard
 */
function copyScreenshots(sourceDir, targetDir, apiLevel) {
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    if (file.endsWith('.png') && !file.includes('failed-')) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, `${apiLevel}-${file}`);
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

/**
 * Update performance history
 */
function updatePerformanceHistory(historyFile, results) {
  let history = [];
  
  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  }
  
  // Add current results
  const entry = {
    timestamp: new Date().toISOString(),
    duration: results.summary.duration,
    passRate: results.summary.totalTests > 0 
      ? Math.round((results.summary.passed / results.summary.totalTests) * 100)
      : 0,
    visualCompliance: results.visualRegression.overallCompliance
  };
  
  history.push(entry);
  
  // Keep only last 30 entries
  if (history.length > 30) {
    history = history.slice(-30);
  }
  
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

/**
 * Utility functions
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getAndroidVersion(apiLevel) {
  const versions = {
    '21': '5.0 (Lollipop)',
    '23': '6.0 (Marshmallow)',
    '26': '8.0 (Oreo)',
    '28': '9.0 (Pie)',
    '31': '12 (S)',
    '34': '14 (U)'
  };
  return versions[apiLevel] || `API ${apiLevel}`;
}

function getDeviceName(apiLevel) {
  const devices = {
    '21': 'Nexus 5',
    '23': 'Nexus 6',
    '26': 'Pixel 2',
    '28': 'Pixel 3',
    '31': 'Pixel 4',
    '34': 'Pixel 6'
  };
  return devices[apiLevel] || 'Generic Device';
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  aggregateResults,
  generateDashboardData
};