#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * Analyzes React Native bundle size and provides optimization recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Bundle Size Analysis Tool\n');
console.log('='.repeat(60));

// Generate bundles for both platforms
function generateBundle(platform) {
  console.log(`\n🔨 Generating ${platform} bundle...`);
  
  const bundleFile = `${platform}-bundle.js`;
  const assetsDir = `${platform}-assets`;
  
  try {
    execSync(
      `npx react-native bundle --platform ${platform} --dev false --entry-file index.js --bundle-output ./${bundleFile} --assets-dest ./${assetsDir} 2>&1`,
      { encoding: 'utf8' }
    );
    
    const stats = fs.statSync(bundleFile);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    // Count assets
    let assetCount = 0;
    let assetSize = 0;
    
    if (fs.existsSync(assetsDir)) {
      const countAssets = (dir) => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            countAssets(fullPath);
          } else {
            assetCount++;
            assetSize += stat.size;
          }
        });
      };
      countAssets(assetsDir);
    }
    
    const assetSizeInMB = (assetSize / (1024 * 1024)).toFixed(2);
    
    return {
      platform,
      bundleSize: parseFloat(sizeInMB),
      assetCount,
      assetSize: parseFloat(assetSizeInMB),
      totalSize: parseFloat(sizeInMB) + parseFloat(assetSizeInMB)
    };
  } catch (error) {
    console.error(`❌ Failed to generate ${platform} bundle:`, error.message);
    return null;
  }
}

// Analyze bundle content
function analyzeBundle(bundleFile) {
  if (!fs.existsSync(bundleFile)) return null;
  
  const content = fs.readFileSync(bundleFile, 'utf8');
  
  // Check for common optimization issues
  const analysis = {
    hasSourceMaps: content.includes('//# sourceMappingURL='),
    hasConsoleStatements: (content.match(/console\.(log|warn|error|info)/g) || []).length,
    hasDebugCode: content.includes('__DEV__'),
    estimatedModules: (content.match(/define\(/g) || []).length,
    hasLargeComments: (content.match(/\/\*[\s\S]{500,}?\*\//g) || []).length,
  };
  
  return analysis;
}

// Main analysis
console.log('\n📊 Analyzing bundle sizes...\n');

const androidStats = generateBundle('android');
const iosStats = generateBundle('ios');

console.log('\n' + '='.repeat(60));
console.log('📈 BUNDLE SIZE REPORT');
console.log('='.repeat(60));

if (androidStats) {
  console.log('\n🤖 Android:');
  console.log(`   Bundle: ${androidStats.bundleSize} MB`);
  console.log(`   Assets: ${androidStats.assetSize} MB (${androidStats.assetCount} files)`);
  console.log(`   Total:  ${androidStats.totalSize} MB`);
}

if (iosStats) {
  console.log('\n🍎 iOS:');
  console.log(`   Bundle: ${iosStats.bundleSize} MB`);
  console.log(`   Assets: ${iosStats.assetSize} MB (${iosStats.assetCount} files)`);
  console.log(`   Total:  ${iosStats.totalSize} MB`);
}

// Analyze bundle content
console.log('\n' + '='.repeat(60));
console.log('🔍 BUNDLE CONTENT ANALYSIS');
console.log('='.repeat(60));

const androidAnalysis = analyzeBundle('android-bundle.js');
if (androidAnalysis) {
  console.log('\n🤖 Android Bundle Analysis:');
  console.log(`   Source Maps: ${androidAnalysis.hasSourceMaps ? '⚠️  Present (remove for prod)' : '✅ Removed'}`);
  console.log(`   Console Statements: ${androidAnalysis.hasConsoleStatements > 0 ? `⚠️  ${androidAnalysis.hasConsoleStatements} found` : '✅ None'}`);
  console.log(`   Debug Code: ${androidAnalysis.hasDebugCode ? '⚠️  Present' : '✅ Removed'}`);
  console.log(`   Modules: ~${androidAnalysis.estimatedModules}`);
  console.log(`   Large Comments: ${androidAnalysis.hasLargeComments > 0 ? `⚠️  ${androidAnalysis.hasLargeComments} found` : '✅ None'}`);
}

// Optimization recommendations
console.log('\n' + '='.repeat(60));
console.log('💡 OPTIMIZATION RECOMMENDATIONS');
console.log('='.repeat(60));

const recommendations = [];

if (androidStats && androidStats.bundleSize > 4) {
  recommendations.push('📦 Bundle size exceeds 4MB - consider code splitting');
}

if (androidStats && androidStats.totalSize > 50) {
  recommendations.push('⚠️  Total size exceeds 50MB - may affect app store acceptance');
}

if (androidAnalysis?.hasConsoleStatements > 50) {
  recommendations.push('🔍 Remove console statements for production');
}

if (androidAnalysis?.hasSourceMaps) {
  recommendations.push('🗺️  Remove source maps for production builds');
}

if (androidStats?.assetCount > 100) {
  recommendations.push('🖼️  Consider optimizing image assets');
}

// Add general recommendations
recommendations.push('✨ Enable Hermes for better performance');
recommendations.push('🔧 Use ProGuard/R8 for Android minification');
recommendations.push('📱 Enable App Thinning for iOS');
recommendations.push('🎯 Implement lazy loading for heavy screens');
recommendations.push('📊 Use bundle visualizer to identify large dependencies');

recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec}`);
});

// App Store Requirements
console.log('\n' + '='.repeat(60));
console.log('📱 APP STORE SIZE REQUIREMENTS');
console.log('='.repeat(60));

console.log('\n🤖 Google Play Store:');
console.log('   • APK: 150 MB maximum');
console.log('   • App Bundle: 150 MB base + 150 MB per dynamic feature');
console.log(`   • Status: ${androidStats && androidStats.totalSize < 150 ? '✅ Within limits' : '⚠️  Review needed'}`);

console.log('\n🍎 Apple App Store:');
console.log('   • Binary: 4 GB maximum (uncompressed)');
console.log('   • OTA Update: 200 MB over cellular');
console.log(`   • Status: ${iosStats && iosStats.totalSize < 200 ? '✅ Within OTA limits' : '⚠️  WiFi required for updates'}`);

// Production readiness
console.log('\n' + '='.repeat(60));
console.log('🚀 PRODUCTION READINESS');
console.log('='.repeat(60));

const checks = [
  { 
    name: 'Bundle size < 5MB', 
    passed: androidStats && androidStats.bundleSize < 5 
  },
  { 
    name: 'Total size < 50MB', 
    passed: androidStats && androidStats.totalSize < 50 
  },
  { 
    name: 'No console statements', 
    passed: androidAnalysis && androidAnalysis.hasConsoleStatements === 0 
  },
  { 
    name: 'No source maps', 
    passed: androidAnalysis && !androidAnalysis.hasSourceMaps 
  },
  { 
    name: 'Assets optimized', 
    passed: androidStats && androidStats.assetSize < 10 
  },
];

checks.forEach(check => {
  console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
});

const readyForProduction = checks.every(c => c.passed);

console.log('\n' + '='.repeat(60));
if (readyForProduction) {
  console.log('✅ Bundle is OPTIMIZED for production!');
} else {
  console.log('⚠️  Bundle needs optimization before production');
}
console.log('='.repeat(60));

// Cleanup
console.log('\n🧹 Cleaning up generated files...');
['android-bundle.js', 'ios-bundle.js', 'android-assets', 'ios-assets'].forEach(file => {
  if (fs.existsSync(file)) {
    if (fs.statSync(file).isDirectory()) {
      fs.rmSync(file, { recursive: true });
    } else {
      fs.unlinkSync(file);
    }
  }
});

console.log('✅ Analysis complete!\n');