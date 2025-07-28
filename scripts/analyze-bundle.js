#!/usr/bin/env node

/**
 * Crowbar Mobile - Bundle Analysis Script
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('fs');
const _path = require('path');
const { execSync: _execSync } = require('child_process');

// Configuration
const CONFIG = {
  outputDir: './bundle-analysis',
  reportFile: 'bundle-report.json',
  htmlReportFile: 'bundle-report.html',
  thresholds: {
    totalSize: 5 * 1024 * 1024,    // 5MB
    jsSize: 3 * 1024 * 1024,       // 3MB
    assetSize: 2 * 1024 * 1024,    // 2MB
    moduleSize: 500 * 1024,        // 500KB
  },
  platforms: ['android', 'ios'],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}${colors.bold}📊 ${msg}${colors.reset}\n`),
};

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Analyze Android bundle
 */
function analyzeAndroidBundle() {
  log.info('Analyzing Android bundle...');
  
  const analysis = {
    platform: 'android',
    bundles: [],
    assets: [],
    totalSize: 0,
    recommendations: [],
  };

  try {
    // Check for APK files
    const apkDir = './android/app/build/outputs/apk';
    if (fs.existsSync(apkDir)) {
      const findApks = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        files.forEach(file => {
          const fullPath = _path.join(dir, file.name);
          if (file.isDirectory()) {
            findApks(fullPath);
          } else if (file.name.endsWith('.apk')) {
            const size = getFileSize(fullPath);
            analysis.bundles.push({
              name: file.name,
              path: fullPath,
              size,
              type: 'apk',
            });
            analysis.totalSize += size;
          }
        });
      };
      findApks(apkDir);
    }

    // Check for AAB files
    const aabDir = './android/app/build/outputs/bundle';
    if (fs.existsSync(aabDir)) {
      const findAabs = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        files.forEach(file => {
          const fullPath = _path.join(dir, file.name);
          if (file.isDirectory()) {
            findAabs(fullPath);
          } else if (file.name.endsWith('.aab')) {
            const size = getFileSize(fullPath);
            analysis.bundles.push({
              name: file.name,
              path: fullPath,
              size,
              type: 'aab',
            });
            analysis.totalSize += size;
          }
        });
      };
      findAabs(aabDir);
    }

    // Analyze assets
    const assetsDir = './android/app/src/main/assets';
    if (fs.existsSync(assetsDir)) {
      const analyzeAssets = (dir, basePath = '') => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        files.forEach(file => {
          const fullPath = _path.join(dir, file.name);
          const relativePath = _path.join(basePath, file.name);
          
          if (file.isDirectory()) {
            analyzeAssets(fullPath, relativePath);
          } else {
            const size = getFileSize(fullPath);
            analysis.assets.push({
              name: file.name,
              path: relativePath,
              size,
              type: _path.extname(file.name).slice(1) || 'unknown',
            });
          }
        });
      };
      analyzeAssets(assetsDir);
    }

    // Generate recommendations
    if (analysis.totalSize > CONFIG.thresholds.totalSize) {
      analysis.recommendations.push('Android bundle size exceeds recommended limit');
    }

    const largeAssets = analysis.assets.filter(asset => asset.size > 100 * 1024);
    if (largeAssets.length > 0) {
      analysis.recommendations.push(`Found ${largeAssets.length} large assets that could be optimized`);
    }

  } catch (error) {
    log.error(`Failed to analyze Android bundle: ${error.message}`);
  }

  return analysis;
}

/**
 * Analyze iOS bundle
 */
function analyzeIosBundle() {
  log.info('Analyzing iOS bundle...');
  
  const analysis = {
    platform: 'ios',
    bundles: [],
    assets: [],
    totalSize: 0,
    recommendations: [],
  };

  try {
    // Check for IPA files
    const buildDir = './ios/build';
    if (fs.existsSync(buildDir)) {
      const findIpas = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        files.forEach(file => {
          const fullPath = _path.join(dir, file.name);
          if (file.isDirectory()) {
            findIpas(fullPath);
          } else if (file.name.endsWith('.ipa')) {
            const size = getFileSize(fullPath);
            analysis.bundles.push({
              name: file.name,
              path: fullPath,
              size,
              type: 'ipa',
            });
            analysis.totalSize += size;
          }
        });
      };
      findIpas(buildDir);
    }

    // Check for app bundles
    const appDir = './ios/build/Build/Products';
    if (fs.existsSync(appDir)) {
      const findApps = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        files.forEach(file => {
          const fullPath = _path.join(dir, file.name);
          if (file.isDirectory() && file.name.endsWith('.app')) {
            const size = getFolderSize(fullPath);
            analysis.bundles.push({
              name: file.name,
              path: fullPath,
              size,
              type: 'app',
            });
            analysis.totalSize += size;
          } else if (file.isDirectory()) {
            findApps(fullPath);
          }
        });
      };
      findApps(appDir);
    }

    // Analyze assets
    const assetsDir = './ios/CrowbarMobile/Images.xcassets';
    if (fs.existsSync(assetsDir)) {
      const analyzeAssets = (dir, basePath = '') => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        files.forEach(file => {
          const fullPath = _path.join(dir, file.name);
          const relativePath = _path.join(basePath, file.name);
          
          if (file.isDirectory()) {
            analyzeAssets(fullPath, relativePath);
          } else if (!file.name.startsWith('.')) {
            const size = getFileSize(fullPath);
            analysis.assets.push({
              name: file.name,
              path: relativePath,
              size,
              type: _path.extname(file.name).slice(1) || 'unknown',
            });
          }
        });
      };
      analyzeAssets(assetsDir);
    }

    // Generate recommendations
    if (analysis.totalSize > CONFIG.thresholds.totalSize) {
      analysis.recommendations.push('iOS bundle size exceeds recommended limit');
    }

    const largeAssets = analysis.assets.filter(asset => asset.size > 100 * 1024);
    if (largeAssets.length > 0) {
      analysis.recommendations.push(`Found ${largeAssets.length} large assets that could be optimized`);
    }

  } catch (error) {
    log.error(`Failed to analyze iOS bundle: ${error.message}`);
  }

  return analysis;
}

/**
 * Get folder size recursively
 */
function getFolderSize(folderPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = _path.join(folderPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += getFolderSize(fullPath);
      } else {
        totalSize += getFileSize(fullPath);
      }
    });
  } catch (error) {
    // Ignore errors for inaccessible files
  }
  
  return totalSize;
}

/**
 * Analyze JavaScript bundle using Metro
 */
function analyzeJavaScriptBundle() {
  log.info('Analyzing JavaScript bundle...');
  
  const analysis = {
    modules: [],
    totalSize: 0,
    recommendations: [],
  };

  try {
    // This would integrate with Metro bundler to get actual module sizes
    // For now, we'll analyze the source code structure
    
    const srcDir = './src';
    if (fs.existsSync(srcDir)) {
      const analyzeSourceFiles = (dir, basePath = '') => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        files.forEach(file => {
          const fullPath = _path.join(dir, file.name);
          const relativePath = _path.join(basePath, file.name);
          
          if (file.isDirectory() && !file.name.startsWith('.')) {
            analyzeSourceFiles(fullPath, relativePath);
          } else if (file.name.match(/\.(js|jsx|ts|tsx)$/)) {
            const size = getFileSize(fullPath);
            analysis.modules.push({
              name: relativePath,
              size,
              type: 'source',
            });
            analysis.totalSize += size;
          }
        });
      };
      
      analyzeSourceFiles(srcDir);
    }

    // Analyze node_modules (top-level packages only)
    const nodeModulesDir = './node_modules';
    if (fs.existsSync(nodeModulesDir)) {
      const packages = fs.readdirSync(nodeModulesDir, { withFileTypes: true });
      
      packages.forEach(pkg => {
        if (pkg.isDirectory() && !pkg.name.startsWith('.')) {
          const pkgPath = _path.join(nodeModulesDir, pkg.name);
          const packageJsonPath = _path.join(pkgPath, 'package.json');
          
          if (fs.existsSync(packageJsonPath)) {
            try {
              const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
              const size = getFolderSize(pkgPath);
              
              analysis.modules.push({
                name: pkg.name,
                size,
                type: 'dependency',
                version: packageJson.version,
              });
            } catch (error) {
              // Ignore invalid package.json files
            }
          }
        }
      });
    }

    // Sort modules by size
    analysis.modules.sort((a, b) => b.size - a.size);

    // Generate recommendations
    const largeModules = analysis.modules.filter(m => m.size > CONFIG.thresholds.moduleSize);
    if (largeModules.length > 0) {
      analysis.recommendations.push(`Found ${largeModules.length} large modules that could be optimized`);
    }

    const largeDependencies = analysis.modules.filter(m => 
      m.type === 'dependency' && m.size > CONFIG.thresholds.moduleSize
    );
    if (largeDependencies.length > 0) {
      analysis.recommendations.push(`Consider alternatives for large dependencies: ${largeDependencies.slice(0, 3).map(d => d.name).join(', ')}`);
    }

  } catch (error) {
    log.error(`Failed to analyze JavaScript bundle: ${error.message}`);
  }

  return analysis;
}

/**
 * Generate HTML report
 */
function generateHtmlReport(analysis) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crowbar Mobile - Bundle Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f5f5f5; border-radius: 4px; }
        .metric-label { font-size: 12px; color: #666; }
        .metric-value { font-size: 18px; font-weight: bold; }
        .recommendation { padding: 10px; margin: 5px 0; background: #fff3cd; border-left: 4px solid #ffc107; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f5f5f5; }
        .warning { color: #ff9800; }
        .error { color: #f44336; }
        .success { color: #4caf50; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Bundle Analysis Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>📈 Summary</h2>
        <div class="metric">
            <div class="metric-label">Total Bundle Size</div>
            <div class="metric-value">${formatFileSize(analysis.totalSize)}</div>
        </div>
        <div class="metric">
            <div class="metric-label">Platforms Analyzed</div>
            <div class="metric-value">${analysis.platforms.length}</div>
        </div>
        <div class="metric">
            <div class="metric-label">Total Recommendations</div>
            <div class="metric-value">${analysis.totalRecommendations}</div>
        </div>
    </div>

    ${analysis.platforms.map(platform => `
    <div class="section">
        <h2>📱 ${platform.platform.toUpperCase()} Analysis</h2>
        <p><strong>Bundle Size:</strong> ${formatFileSize(platform.totalSize)}</p>
        
        ${platform.bundles.length > 0 ? `
        <h3>Bundles</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                ${platform.bundles.map(bundle => `
                <tr>
                    <td>${bundle.name}</td>
                    <td>${bundle.type.toUpperCase()}</td>
                    <td>${formatFileSize(bundle.size)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        ${platform.recommendations.length > 0 ? `
        <h3>Recommendations</h3>
        ${platform.recommendations.map(rec => `
        <div class="recommendation">${rec}</div>
        `).join('')}
        ` : ''}
    </div>
    `).join('')}

    ${analysis.javascript ? `
    <div class="section">
        <h2>📦 JavaScript Analysis</h2>
        <p><strong>Total Source Size:</strong> ${formatFileSize(analysis.javascript.totalSize)}</p>
        
        <h3>Largest Modules</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Module</th>
                    <th>Type</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                ${analysis.javascript.modules.slice(0, 10).map(module => `
                <tr>
                    <td>${module.name}</td>
                    <td>${module.type}</td>
                    <td>${formatFileSize(module.size)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        ${analysis.javascript.recommendations.length > 0 ? `
        <h3>Recommendations</h3>
        ${analysis.javascript.recommendations.map(rec => `
        <div class="recommendation">${rec}</div>
        `).join('')}
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2>📋 All Recommendations</h2>
        ${analysis.allRecommendations.map(rec => `
        <div class="recommendation">${rec}</div>
        `).join('')}
    </div>
</body>
</html>
  `;

  return html;
}

/**
 * Main analysis function
 */
async function main() {
  log.title('Crowbar Mobile - Bundle Analysis');

  try {
    // Ensure output directory exists
    ensureDir(CONFIG.outputDir);

    // Analyze platforms
    const platforms = [];
    let totalSize = 0;
    const allRecommendations = [];

    // Analyze Android
    const androidAnalysis = analyzeAndroidBundle();
    platforms.push(androidAnalysis);
    totalSize += androidAnalysis.totalSize;
    allRecommendations.push(...androidAnalysis.recommendations);

    // Analyze iOS
    const iosAnalysis = analyzeIosBundle();
    platforms.push(iosAnalysis);
    totalSize += iosAnalysis.totalSize;
    allRecommendations.push(...iosAnalysis.recommendations);

    // Analyze JavaScript
    const jsAnalysis = analyzeJavaScriptBundle();
    allRecommendations.push(...jsAnalysis.recommendations);

    // Create comprehensive analysis
    const analysis = {
      timestamp: new Date().toISOString(),
      totalSize,
      platforms,
      javascript: jsAnalysis,
      totalRecommendations: allRecommendations.length,
      allRecommendations,
    };

    // Save JSON report
    const reportPath = _path.join(CONFIG.outputDir, CONFIG.reportFile);
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    log.success(`JSON report saved to ${reportPath}`);

    // Generate and save HTML report
    const htmlReport = generateHtmlReport(analysis);
    const htmlReportPath = _path.join(CONFIG.outputDir, CONFIG.htmlReportFile);
    fs.writeFileSync(htmlReportPath, htmlReport);
    log.success(`HTML report saved to ${htmlReportPath}`);

    // Display summary
    console.log('\n' + '='.repeat(60));
    log.title('Bundle Analysis Summary');
    console.log(`📦 Total Bundle Size: ${formatFileSize(totalSize)}`);
    console.log(`📱 Platforms Analyzed: ${platforms.length}`);
    console.log(`💡 Total Recommendations: ${allRecommendations.length}`);
    
    if (allRecommendations.length > 0) {
      console.log('\n📋 Top Recommendations:');
      allRecommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Check thresholds
    if (totalSize > CONFIG.thresholds.totalSize) {
      log.warning(`Bundle size (${formatFileSize(totalSize)}) exceeds recommended limit (${formatFileSize(CONFIG.thresholds.totalSize)})`);
    } else {
      log.success(`Bundle size is within recommended limits`);
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    log.error(`Bundle analysis failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeAndroidBundle,
  analyzeIosBundle,
  analyzeJavaScriptBundle,
  formatFileSize,
};
