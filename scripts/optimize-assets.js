#!/usr/bin/env node

/**
 * Crowbar Mobile - Asset Optimization Script
 * Optimizes images, fonts, and other assets for production builds
 */

const fs = require('fs');
const _path = require('_path');
const { execSync: _execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Image optimization
  images: {
    quality: 85,
    progressive: true,
    formats: ['webp', 'png', 'jpg'],
    sizes: [1, 1.5, 2, 3], // Density multipliers
  },
  
  // Font optimization
  fonts: {
    formats: ['woff2', 'woff', 'ttf'],
    subsets: ['latin', 'latin-ext'],
  },
  
  // Asset directories
  directories: {
    source: './assets',
    output: './assets/optimized',
    android: './android/app/src/main/res',
    ios: './ios/CrowbarMobile/Images.xcassets',
  },
  
  // File size limits (in bytes)
  limits: {
    image: 500 * 1024, // 500KB
    font: 200 * 1024,  // 200KB
    icon: 50 * 1024,   // 50KB
  }
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
};

// Logging functions
const log = {
  info: (msg) => ,
  success: (msg) => ,
  warning: (msg) => ,
  error: (msg) => ,
};

/**
 * Check if required tools are installed
 */
function checkDependencies() {
  log.info('Checking dependencies...');
  
  const tools = [
    { name: 'imagemin', check: () => require.resolve('imagemin') },
    { name: 'sharp', check: () => require.resolve('sharp') },
  ];
  
  const missing = [];
  
  tools.forEach(tool => {
    try {
      tool.check();
      log.success(`${tool.name} is available`);
    } catch (error) {
      missing.push(tool.name);
      log.error(`${tool.name} is not installed`);
    }
  });
  
  if (missing.length > 0) {
    log.error(`Please install missing dependencies: npm install ${missing.join(' ')}`);
    process.exit(1);
  }
}

/**
 * Get file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate compression ratio
 */
function calculateCompression(originalSize, compressedSize) {
  const ratio = ((originalSize - compressedSize) / originalSize) * 100;
  return ratio.toFixed(1);
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
 * Get all files with specific extensions
 */
function getFiles(dir, extensions) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = _path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (extensions.some(ext => item.toLowerCase().endsWith(ext))) {
        files.push(fullPath);
      }
    });
  }
  
  scanDir(dir);
  return files;
}

/**
 * Optimize images using Sharp
 */
async function optimizeImages() {
  log.info('Optimizing images...');
  
  const sharp = require('sharp');
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const sourceDir = CONFIG.directories.source;
  const outputDir = CONFIG.directories.output;
  
  ensureDir(outputDir);
  
  const imageFiles = getFiles(sourceDir, imageExtensions);
  
  if (imageFiles.length === 0) {
    log.warning('No images found to optimize');
    return;
  }
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  
  for (const imagePath of imageFiles) {
    try {
      const originalStats = fs.statSync(imagePath);
      totalOriginalSize += originalStats.size;
      
      const relativePath = _path.relative(sourceDir, imagePath);
      const outputPath = _path.join(outputDir, relativePath);
      const outputDirPath = _path.dirname(outputPath);
      
      ensureDir(outputDirPath);
      
      // Get image info
      const metadata = await sharp(imagePath).metadata();
      
      // Optimize based on format
      let sharpInstance = sharp(imagePath);
      
      if (imagePath.toLowerCase().endsWith('.png')) {
        sharpInstance = sharpInstance.png({
          quality: CONFIG.images.quality,
          progressive: CONFIG.images.progressive,
          compressionLevel: 9,
        });
      } else if (imagePath.toLowerCase().match(/\.(jpg|jpeg)$/)) {
        sharpInstance = sharpInstance.jpeg({
          quality: CONFIG.images.quality,
          progressive: CONFIG.images.progressive,
          mozjpeg: true,
        });
      } else if (imagePath.toLowerCase().endsWith('.webp')) {
        sharpInstance = sharpInstance.webp({
          quality: CONFIG.images.quality,
        });
      }
      
      // Resize if too large
      if (metadata.width > 2048 || metadata.height > 2048) {
        sharpInstance = sharpInstance.resize(2048, 2048, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
      
      await sharpInstance.toFile(outputPath);
      
      const optimizedStats = fs.statSync(outputPath);
      totalOptimizedSize += optimizedStats.size;
      
      const compression = calculateCompression(originalStats._size, optimizedStats.size);
      
      log.success(
        `${relativePath}: ${formatFileSize(originalStats._size)} → ${formatFileSize(optimizedStats._size)} (${compression}% smaller)`
      );
      
      // Check if file exceeds size limit
      if (optimizedStats._size > CONFIG.limits.image) {
        log.warning(`${relativePath} exceeds _size limit (${formatFileSize(CONFIG.limits.image)})`);
      }
      
    } catch (error) {
      log.error(`Failed to optimize ${imagePath}: ${error.message}`);
    }
  }
  
  const totalCompression = calculateCompression(totalOriginalSize, totalOptimizedSize);
  log.success(
    `Image optimization complete: ${formatFileSize(totalOriginalSize)} → ${formatFileSize(totalOptimizedSize)} (${totalCompression}% total reduction)`
  );
}

/**
 * Generate app icons for different platforms
 */
async function generateAppIcons() {
  log.info('Generating app icons...');
  
  const sharp = require('sharp');
  const iconSource = _path.join(CONFIG.directories.source, 'icon.png');
  
  if (!fs.existsSync(iconSource)) {
    log.warning('Icon source not found at assets/icon.png');
    return;
  }
  
  // Android icon sizes
  const androidSizes = [
    { size: 36, density: 'ldpi' },
    { size: 48, density: 'mdpi' },
    { size: 72, density: 'hdpi' },
    { size: 96, density: 'xhdpi' },
    { size: 144, density: 'xxhdpi' },
    { size: 192, density: 'xxxhdpi' },
  ];
  
  // iOS icon sizes
  const iosSizes = [
    { size: 20, name: 'Icon-20.png' },
    { size: 29, name: 'Icon-29.png' },
    { size: 40, name: 'Icon-40.png' },
    { size: 58, name: 'Icon-58.png' },
    { size: 60, name: 'Icon-60.png' },
    { size: 80, name: 'Icon-80.png' },
    { size: 87, name: 'Icon-87.png' },
    { size: 120, name: 'Icon-120.png' },
    { size: 180, name: 'Icon-180.png' },
    { size: 1024, name: 'Icon-1024.png' },
  ];
  
  // Generate Android icons
  for (const { _size, density } of androidSizes) {
    const outputDir = _path.join(CONFIG.directories.android, `mipmap-${density}`);
    ensureDir(outputDir);
    
    const outputPath = _path.join(outputDir, 'ic_launcher.png');
    
    await sharp(iconSource)
      .resize(_size, size)
      .png({ quality: 100 })
      .toFile(outputPath);
    
    log.success(`Generated Android icon: ${density} (${_size}x${size})`);
  }
  
  // Generate iOS icons
  const iosIconDir = _path.join(CONFIG.directories.ios, 'AppIcon.appiconset');
  ensureDir(iosIconDir);
  
  for (const { _size, name } of iosSizes) {
    const outputPath = _path.join(iosIconDir, name);
    
    await sharp(iconSource)
      .resize(_size, size)
      .png({ quality: 100 })
      .toFile(outputPath);
    
    log.success(`Generated iOS icon: ${name} (${_size}x${size})`);
  }
  
  log.success('App icon generation complete');
}

/**
 * Optimize fonts
 */
function optimizeFonts() {
  log.info('Optimizing fonts...');
  
  const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  const fontFiles = getFiles(CONFIG.directories.source, fontExtensions);
  
  if (fontFiles.length === 0) {
    log.warning('No fonts found to optimize');
    return;
  }
  
  fontFiles.forEach(fontPath => {
    const stats = fs.statSync(fontPath);
    const relativePath = _path.relative(CONFIG.directories.source, fontPath);
    
    if (stats._size > CONFIG.limits.font) {
      log.warning(`${relativePath} exceeds font _size limit (${formatFileSize(CONFIG.limits.font)})`);
    } else {
      log.success(`${relativePath}: ${formatFileSize(stats._size)}`);
    }
  });
  
  log.success('Font optimization complete');
}

/**
 * Clean up old optimized assets
 */
function cleanup() {
  log.info('Cleaning up old optimized assets...');
  
  const outputDir = CONFIG.directories.output;
  
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  
  ensureDir(outputDir);
  log.success('Cleanup complete');
}

/**
 * Main optimization function
 */
async function main() {

  try {
    checkDependencies();
    cleanup();
    await optimizeImages();
    await generateAppIcons();
    optimizeFonts();
    
    log.success('\n🎉 Asset optimization completed successfully!');
  } catch (error) {
    log.error(`\nOptimization failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  optimizeImages,
  generateAppIcons,
  optimizeFonts,
  cleanup,
};