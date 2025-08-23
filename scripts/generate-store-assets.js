#!/usr/bin/env node

/**
 * Store Assets Generator
 * Helps prepare assets for App Store and Google Play submission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 App Store Assets Generator\n');
console.log('='.repeat(60));

// Create store-assets directory structure
const createDirectoryStructure = () => {
  const directories = [
    'store-assets/screenshots/ios/iphone-6.7',
    'store-assets/screenshots/ios/iphone-6.5',
    'store-assets/screenshots/ios/iphone-5.5',
    'store-assets/screenshots/ios/ipad-12.9',
    'store-assets/screenshots/ios/ipad-11',
    'store-assets/screenshots/android/phone',
    'store-assets/screenshots/android/tablet-7',
    'store-assets/screenshots/android/tablet-10',
    'store-assets/icons/ios',
    'store-assets/icons/android',
    'store-assets/graphics',
    'store-assets/videos',
  ];

  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created: ${dir}`);
    }
  });
};

// Generate icon sizes
const generateIcons = () => {
  console.log('\n📱 Generating App Icons...\n');

  const iconSizes = {
    ios: [
      { size: 1024, name: 'Icon-1024.png', desc: 'App Store' },
      { size: 180, name: 'Icon-180.png', desc: 'iPhone @3x' },
      { size: 120, name: 'Icon-120.png', desc: 'iPhone @2x' },
      { size: 167, name: 'Icon-167.png', desc: 'iPad Pro' },
      { size: 152, name: 'Icon-152.png', desc: 'iPad @2x' },
      { size: 76, name: 'Icon-76.png', desc: 'iPad @1x' },
    ],
    android: [
      { size: 512, name: 'ic_launcher-512.png', desc: 'Play Store' },
      { size: 192, name: 'ic_launcher-xxxhdpi.png', desc: 'xxxhdpi' },
      { size: 144, name: 'ic_launcher-xxhdpi.png', desc: 'xxhdpi' },
      { size: 96, name: 'ic_launcher-xhdpi.png', desc: 'xhdpi' },
      { size: 72, name: 'ic_launcher-hdpi.png', desc: 'hdpi' },
      { size: 48, name: 'ic_launcher-mdpi.png', desc: 'mdpi' },
    ],
  };

  // Check if source icon exists
  const sourceIcon = 'assets/icon.png';
  if (!fs.existsSync(sourceIcon)) {
    console.log('⚠️  Source icon not found at assets/icon.png');
    console.log('   Please add a 1024x1024px icon as assets/icon.png');
    return;
  }

  // Note: In production, you would use a tool like sharp or imagemagick
  // to resize the icons. For now, we'll create placeholder files
  
  Object.entries(iconSizes).forEach(([platform, sizes]) => {
    sizes.forEach(({ size, name, desc }) => {
      const outputPath = `store-assets/icons/${platform}/${name}`;
      // In production: resize sourceIcon to size and save to outputPath
      console.log(`   📐 ${platform}/${name} - ${size}x${size}px (${desc})`);
    });
  });

  console.log('\n   ℹ️  Use an image editor or tool like ImageMagick to resize icons');
};

// Screenshot specifications
const getScreenshotSpecs = () => {
  return {
    ios: {
      'iPhone 6.7"': { width: 1290, height: 2796, required: true },
      'iPhone 6.5"': { width: 1242, height: 2688, required: true },
      'iPhone 5.5"': { width: 1242, height: 2208, required: false },
      'iPad 12.9"': { width: 2048, height: 2732, required: true },
      'iPad 11"': { width: 1668, height: 2388, required: false },
    },
    android: {
      'Phone': { width: 1080, height: 1920, required: true },
      '7" Tablet': { width: 1200, height: 1920, required: false },
      '10" Tablet': { width: 1600, height: 2560, required: false },
    },
  };
};

// Generate screenshot templates
const generateScreenshotTemplates = () => {
  console.log('\n📸 Screenshot Requirements:\n');

  const specs = getScreenshotSpecs();
  const screens = [
    '01-home-discovery',
    '02-box-opening',
    '03-product-details',
    '04-shopping-cart',
    '05-user-profile',
    '06-reviews',
  ];

  Object.entries(specs).forEach(([platform, devices]) => {
    console.log(`\n${platform.toUpperCase()}:`);
    Object.entries(devices).forEach(([device, spec]) => {
      const req = spec.required ? '✅ Required' : '⚪ Optional';
      console.log(`   ${device}: ${spec.width}x${spec.height}px ${req}`);
      
      // Create placeholder files for each screen
      screens.forEach(screen => {
        const dir = platform === 'ios' 
          ? `store-assets/screenshots/ios/${device.toLowerCase().replace(/[" ]/g, '-')}`
          : `store-assets/screenshots/android/${device.toLowerCase().replace(/[" ]/g, '-')}`;
        
        // Note: In production, you would capture actual screenshots
        // For now, we're just documenting what's needed
      });
    });
  });

  console.log('\n   ℹ️  Capture screenshots using simulator/emulator or device');
};

// Generate feature graphic template
const generateFeatureGraphic = () => {
  console.log('\n🎨 Feature Graphic (Android only):\n');
  console.log('   Size: 1024x500px');
  console.log('   Location: store-assets/graphics/feature-graphic.png');
  console.log('   ℹ️  Create an eye-catching banner showcasing the app');
};

// Generate metadata files
const generateMetadata = () => {
  console.log('\n📝 Generating Metadata Files...\n');

  // App Store metadata
  const appStoreMetadata = {
    name: 'Crowbar - Mystery Box',
    subtitle: 'Descubra caixas misteriosas incríveis',
    keywords: 'caixa misteriosa,mystery box,surpresa,marketplace,unboxing',
    primaryCategory: 'SHOPPING',
    secondaryCategory: 'ENTERTAINMENT',
    primaryLanguage: 'pt-BR',
  };

  // Google Play metadata
  const playStoreMetadata = {
    title: 'Crowbar - Caixas Misteriosas',
    shortDescription: 'Marketplace de caixas misteriosas com experiência gamificada',
    category: 'SHOPPING',
    contentRating: 'Teen',
    primaryLanguage: 'pt-BR',
    tags: ['mystery-box', 'marketplace', 'shopping', 'surpresa', 'brasil'],
  };

  // Save metadata
  fs.writeFileSync(
    'store-assets/app-store-metadata.json',
    JSON.stringify(appStoreMetadata, null, 2)
  );
  console.log('   ✅ Created: app-store-metadata.json');

  fs.writeFileSync(
    'store-assets/play-store-metadata.json',
    JSON.stringify(playStoreMetadata, null, 2)
  );
  console.log('   ✅ Created: play-store-metadata.json');
};

// Check current app configuration
const checkAppConfiguration = () => {
  console.log('\n🔍 Checking App Configuration...\n');

  // Check iOS configuration
  const iosInfoPlist = 'ios/CrowbarMobile/Info.plist';
  if (fs.existsSync(iosInfoPlist)) {
    console.log('   ✅ iOS Info.plist found');
    // In production, parse and validate the plist
  } else {
    console.log('   ⚠️  iOS Info.plist not found');
  }

  // Check Android configuration
  const androidManifest = 'android/app/src/main/AndroidManifest.xml';
  if (fs.existsSync(androidManifest)) {
    console.log('   ✅ Android Manifest found');
    // In production, parse and validate the manifest
  } else {
    console.log('   ⚠️  Android Manifest not found');
  }

  // Check version consistency
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`   📦 Package version: ${packageJson.version}`);
};

// Generate submission notes
const generateSubmissionNotes = () => {
  console.log('\n📋 Generating Submission Notes...\n');

  const notes = `
# App Review Notes

## Test Account
Username: teste@crowbar.com.br
Password: Teste123!

## App Description
Crowbar is a mystery box marketplace that aggregates sellers from major Brazilian e-commerce platforms (Magalu, Amazon, MercadoLivre, Shopee).

## Key Features to Test
1. Browse mystery boxes
2. View product details
3. Add to cart
4. Simulated purchase flow
5. User profile and achievements
6. Review system

## Important Notes
- This is a Brazilian marketplace (Portuguese language)
- Mystery boxes contain surprise items (gambling-like element properly rated)
- All transactions are handled by third-party sellers
- Firebase backend for authentication and data

## Known Limitations
- Payment processing in test mode
- Limited inventory in test environment
- Some features may be region-locked to Brazil

## Contact
Email: suporte@crowbar.com.br
Phone: +55 11 XXXX-XXXX
Available: Mon-Fri 9AM-6PM BRT
`;

  fs.writeFileSync('store-assets/app-review-notes.txt', notes);
  console.log('   ✅ Created: app-review-notes.txt');
};

// Main execution
const main = () => {
  console.log('\n🚀 Starting Store Assets Generation...\n');

  // Create directory structure
  createDirectoryStructure();

  // Generate icons
  generateIcons();

  // Generate screenshot templates
  generateScreenshotTemplates();

  // Generate feature graphic
  generateFeatureGraphic();

  // Generate metadata
  generateMetadata();

  // Check configuration
  checkAppConfiguration();

  // Generate submission notes
  generateSubmissionNotes();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ASSET GENERATION SUMMARY');
  console.log('='.repeat(60));

  console.log('\n✅ Directory structure created');
  console.log('📱 Icon specifications documented');
  console.log('📸 Screenshot requirements listed');
  console.log('📝 Metadata files generated');
  console.log('📋 Submission notes created');

  console.log('\n' + '='.repeat(60));
  console.log('🎯 NEXT STEPS');
  console.log('='.repeat(60));

  console.log('\n1. Add source icon (1024x1024px) to assets/icon.png');
  console.log('2. Generate icon sizes using image editor');
  console.log('3. Capture screenshots from app');
  console.log('4. Create feature graphic for Android');
  console.log('5. Review and update metadata files');
  console.log('6. Prepare promotional video (optional)');

  console.log('\n' + '='.repeat(60));
  console.log('📚 RESOURCES');
  console.log('='.repeat(60));

  console.log('\n• App Store Guidelines:');
  console.log('  https://developer.apple.com/app-store/review/guidelines/');
  console.log('\n• Google Play Guidelines:');
  console.log('  https://play.google.com/console/about/guides/');
  console.log('\n• Screenshot Generator Tools:');
  console.log('  - Fastlane Snapshot (iOS)');
  console.log('  - Fastlane Screengrab (Android)');
  console.log('  - App Store Screenshot Generator');

  console.log('\n✅ Store assets preparation complete!\n');
};

// Run the script
main();